(function () {
  "use strict";

  const STORAGE_KEY = "pocket_hatchery_save_v1";
  const REOPEN_SESSION_KEY = "pocket_hatchery_reopen_expeditions";
  const EXPEDITION_MIN_DURATION = 2.5 * 60 * 60 * 1000;
  const EXPEDITION_MAX_DURATION = 12 * 60 * 60 * 1000;
  const SAVE_REFRESH_INTERVAL = 4000;

  let locationCache = [];

  let selectedPokemonUids = new Set();
  let selectedLocationId = "";
  let searchText = "";
  let tabOpen = false;
  let refreshTimer = null;
  let lastSaveText = "";
  let suppressNextPagehideSave = false;

  function storageLayer() {
    return window.PocketHatcheryStorage || {
      read: (key) => window.localStorage.getItem(key),
      write: (key, value) => {
        window.localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        return true;
      }
    };
  }

  function readSaveText() {
    try {
      return String(storageLayer().read(STORAGE_KEY) || "");
    } catch (error) {
      console.warn("The expedition desk could not read the hatchery save.", error);
      return "";
    }
  }

  function readSave() {
    const text = readSaveText();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      console.warn("The expedition desk found an unreadable hatchery save.", error);
      return null;
    }
  }

  function writeSave(save) {
    try {
      return storageLayer().write(STORAGE_KEY, JSON.stringify(save)) !== false;
    } catch (error) {
      console.warn("The expedition desk could not update the hatchery save.", error);
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function randomInt(minimum, maximum) {
    const range = maximum - minimum;
    if (range <= 0) return minimum;
    const maximumUint = 0xffffffff;
    const limit = maximumUint - (maximumUint % range);
    const sample = new Uint32Array(1);
    do window.crypto.getRandomValues(sample); while (sample[0] >= limit);
    return minimum + (sample[0] % range);
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `${Date.now()}-${randomInt(100000, 999999)}`;
  }

  function discoverLocations(save) {
    if (locationCache.length) return locationCache;
    const pokemon = Array.isArray(save?.pc) ? save.pc.find((entry) => entry?.uid) : null;
    if (!pokemon || save?.competition?.activeMatch) return [];

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.hidden = true;
    trigger.dataset.action = "open-expedition";
    trigger.dataset.uid = String(pokemon.uid);
    document.body.appendChild(trigger);
    trigger.click();
    trigger.remove();

    const modalRoot = document.getElementById("modal-root");
    const cards = Array.from(modalRoot?.querySelectorAll(".location-card") || []);
    locationCache = cards.map((card) => {
      const meta = String(card.querySelector("span")?.textContent || "");
      const [regionText, generationText] = meta.split("·").map((part) => part.trim());
      return {
        id: String(card.dataset.locationId || ""),
        displayName: String(card.querySelector("strong")?.textContent || "Unknown route"),
        region: regionText || "Unknown region",
        generation: Math.max(1, Math.min(9, Number(String(generationText || "").replace(/\D+/g, "")) || 1)),
        description: String(card.querySelector("small")?.textContent || "A field route with room for careful notes.")
      };
    }).filter((location) => location.id);
    if (modalRoot) modalRoot.innerHTML = "";
    return locationCache;
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(Number(milliseconds || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function pokemonDisplayName(pokemon) {
    return String(pokemon?.nickname || pokemon?.displayName || pokemon?.name || "Pokémon");
  }

  function filteredPokemon(save) {
    const query = searchText.trim().toLowerCase();
    return (Array.isArray(save?.pc) ? save.pc : [])
      .filter((pokemon) => {
        if (!query) return true;
        const searchable = [pokemonDisplayName(pokemon), pokemon?.displayName, pokemon?.name, pokemon?.speciesId, ...(pokemon?.types || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(query);
      })
      .sort((left, right) => {
        const favouriteOrder = Number(Boolean(right.favorite)) - Number(Boolean(left.favorite));
        if (favouriteOrder !== 0) return favouriteOrder;
        return pokemonDisplayName(left).localeCompare(pokemonDisplayName(right));
      });
  }

  function normaliseSelection(save) {
    const available = new Set((Array.isArray(save?.pc) ? save.pc : []).map((pokemon) => String(pokemon?.uid || "")).filter(Boolean));
    selectedPokemonUids = new Set([...selectedPokemonUids].filter((uid) => available.has(uid)));
  }

  function groupActiveExpeditions(save) {
    const groups = new Map();
    for (const entry of Array.isArray(save?.expeditions) ? save.expeditions : []) {
      if (!entry?.pokemon) continue;
      const returnAt = Math.max(0, Number(entry.returnAt || 0));
      const key = String(entry.batchId || `${returnAt}-${entry.locationId || "route"}`);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          returnAt,
          locationName: String(entry.locationName || "Unknown route"),
          region: String(entry.region || ""),
          members: []
        });
      }
      groups.get(key).members.push(entry.pokemon);
    }
    return [...groups.values()].sort((left, right) => left.returnAt - right.returnAt);
  }

  function renderActiveBatch(batch) {
    const ready = batch.returnAt <= Date.now();
    const memberCards = batch.members.map((pokemon) => `
      <article class="expedition-member-mini">
        <img src="${escapeHtml(pokemon.sprite || "")}" alt="" loading="lazy" />
        <strong>${escapeHtml(pokemonDisplayName(pokemon))}</strong>
        <span>Lv. ${Math.max(1, Number(pokemon.level || 1))}</span>
      </article>`).join("");
    return `
      <article class="paper-panel expedition-batch-card ${ready ? "is-ready" : ""}">
        <header>
          <div><p class="eyebrow">${ready ? "At the gate" : "Exploring together"}</p><h2>${escapeHtml(batch.locationName)}</h2><p>${escapeHtml(batch.region)} · ${batch.members.length} Pokémon share this return time.</p></div>
          <div class="expedition-batch-countdown"><span>${ready ? "returning now" : "back together in"}</span><strong data-expedition-countdown="${batch.returnAt}">${ready ? "00:00:00" : formatDuration(batch.returnAt - Date.now())}</strong></div>
        </header>
        <div class="expedition-member-strip">${memberCards}</div>
      </article>`;
  }

  function renderReturnLog(save) {
    const entries = (Array.isArray(save?.expeditionLog) ? save.expeditionLog : []).slice(0, 8);
    if (!entries.length) return "";
    const cards = entries.map((entry) => `
      <article class="expedition-return-card">
        <img src="${escapeHtml(entry.sprite || "")}" alt="" loading="lazy" />
        <div><strong>${escapeHtml(entry.pokemonName || "Pokémon")}</strong><span>${escapeHtml(entry.locationName || "Unknown route")} · +${Math.max(0, Number(entry.xp || 0)).toLocaleString()} XP</span></div>
      </article>`).join("");
    return `<aside class="paper-panel expedition-return-log"><div class="panel-label">Recent returns</div>${cards}</aside>`;
  }

  function renderPokemonCard(pokemon) {
    const uid = String(pokemon.uid || "");
    const selected = selectedPokemonUids.has(uid);
    const badges = [pokemon.favorite ? "★ favourite" : "", pokemon.shiny ? "✦ shiny" : ""].filter(Boolean).join(" · ");
    return `
      <button class="expedition-select-card ${selected ? "is-selected" : ""}" type="button" data-expedition-action="toggle-pokemon" data-uid="${escapeHtml(uid)}" aria-pressed="${selected}">
        <span class="expedition-check" aria-hidden="true">${selected ? "✓" : ""}</span>
        <img src="${escapeHtml(pokemon.sprite || "")}" alt="" loading="lazy" />
        <strong>${escapeHtml(pokemonDisplayName(pokemon))}</strong>
        <span>${pokemon.nickname ? `${escapeHtml(pokemon.displayName || pokemon.name || "Pokémon")} · ` : ""}Lv. ${Math.max(1, Number(pokemon.level || 1))}</span>
        ${badges ? `<small>${escapeHtml(badges)}</small>` : ""}
      </button>`;
  }

  function renderExpeditionsTab() {
    const view = document.getElementById("view");
    if (!view) return;
    const save = readSave();
    if (!save?.player) {
      view.innerHTML = `<section class="archive-page">${emptyState("The expedition desk is closed", "Open the hatchery first, then return when the registration card is ready.")}</section>`;
      return;
    }

    normaliseSelection(save);
    const locations = discoverLocations(save);
    if (!locations.some((location) => location.id === selectedLocationId)) selectedLocationId = locations[0]?.id || "";
    const selectedLocation = locations.find((location) => location.id === selectedLocationId) || null;
    const activeBatches = groupActiveExpeditions(save);
    const pokemon = filteredPokemon(save);
    const activeMatch = Boolean(save?.competition?.activeMatch);
    const selectedCount = selectedPokemonUids.size;
    const locationOptions = locations.map((location) => `<option value="${escapeHtml(location.id)}" ${location.id === selectedLocationId ? "selected" : ""}>${escapeHtml(location.region)} · ${escapeHtml(location.displayName)}</option>`).join("");
    const pokemonCards = pokemon.map(renderPokemonCard).join("");
    const batchCards = activeBatches.map(renderActiveBatch).join("");
    const selectedNames = (Array.isArray(save.pc) ? save.pc : [])
      .filter((entry) => selectedPokemonUids.has(String(entry.uid || "")))
      .slice(0, 4)
      .map(pokemonDisplayName);
    const remainingSelected = Math.max(0, selectedCount - selectedNames.length);
    const selectedSummary = selectedNames.length
      ? `${selectedNames.join(", ")}${remainingSelected ? ` and ${remainingSelected} more` : ""}`
      : "No Pokémon selected yet.";

    view.innerHTML = `
      <section class="archive-page expeditions-page" aria-labelledby="expeditions-title">
        <header class="page-heading">
          <div><p class="eyebrow">Field operations</p><h1 id="expeditions-title">Expeditions</h1><p>Select several Pokémon at once. Every Pokémon in a departure group leaves together, returns together, and earns a complete individual expedition reward.</p></div>
          <div class="expedition-summary-stamps"><span><b>${(save.pc || []).length}</b> available</span><span><b>${(save.expeditions || []).length}</b> away</span><span><b>${selectedCount}</b> selected</span></div>
        </header>

        ${activeBatches.length ? `<section class="expedition-active-section"><div class="expedition-section-heading"><div><p class="eyebrow">Currently away</p><h2>Shared return groups</h2></div><p>Each member rolls their own XP and loot when this group returns.</p></div><div class="expedition-batch-list">${batchCards}</div></section>` : ""}

        <section class="paper-panel expedition-planner">
          <div class="panel-label">Plan a departure</div>
          ${activeMatch ? `<div class="expedition-blocked-callout"><strong>Finish the active showcase first.</strong><span>The registered competition team cannot change during halftime.</span></div>` : ""}
          <div class="expedition-planner-controls">
            <label><span>Destination</span><select id="expedition-location-select" ${locations.length ? "" : "disabled"}>${locationOptions}</select></label>
            <label><span>Find Pokémon</span><input id="expedition-pokemon-search" type="search" value="${escapeHtml(searchText)}" placeholder="Name, type, or number…" /></label>
            <div class="expedition-selection-buttons"><button class="button" type="button" data-expedition-action="select-visible" ${pokemon.length ? "" : "disabled"}>Select shown</button><button class="button" type="button" data-expedition-action="clear-selection" ${selectedCount ? "" : "disabled"}>Clear</button></div>
          </div>
          ${selectedLocation ? `<p class="expedition-location-copy"><strong>${escapeHtml(selectedLocation.displayName)}</strong> — ${escapeHtml(selectedLocation.description)}</p>` : ""}
          <div class="expedition-select-grid">${pokemonCards || `<p class="no-results">${(save.pc || []).length ? "No Pokémon match this search." : "Every available Pokémon is already exploring."}</p>`}</div>
          <footer class="expedition-launch-bar">
            <div><strong>${selectedCount} selected</strong><span>${escapeHtml(selectedSummary)}</span></div>
            <button class="button button-primary" type="button" data-expedition-action="launch" ${selectedCount && selectedLocation && !activeMatch ? "" : "disabled"}>Send ${selectedCount || "selected"} together</button>
          </footer>
          <p id="expedition-error" class="form-error" role="alert"></p>
        </section>

        ${renderReturnLog(save)}
      </section>`;

    lastSaveText = readSaveText();
    updateCountdowns();
    view.focus({ preventScroll: true });
  }

  function emptyState(title, copy) {
    return `<article class="paper-panel empty-state"><span class="empty-glyph" aria-hidden="true">⌁</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></article>`;
  }

  function showError(message) {
    const error = document.getElementById("expedition-error");
    if (error) error.textContent = message;
  }

  function requestApplicationSave() {
    try {
      window.dispatchEvent(new Event("pagehide"));
    } catch (error) {
      console.warn("The expedition desk could not request a final hatchery save.", error);
    }
  }

  function launchSelectedPokemon() {
    requestApplicationSave();
    const save = readSave();
    if (!save) return showError("The hatchery save could not be opened.");
    if (save?.competition?.activeMatch) return showError("Finish the active showcase before changing its registered team.");

    normaliseSelection(save);
    const locations = discoverLocations(save);
    const location = locations.find((entry) => entry.id === selectedLocationId);
    if (!location) return showError("Choose an available destination.");
    if (!selectedPokemonUids.size) return showError("Select at least one Pokémon.");

    const selected = (Array.isArray(save.pc) ? save.pc : []).filter((pokemon) => selectedPokemonUids.has(String(pokemon?.uid || "")));
    if (!selected.length) return showError("Those Pokémon are no longer available.");

    const startedAt = Date.now();
    const durationMs = randomInt(EXPEDITION_MIN_DURATION, EXPEDITION_MAX_DURATION + 1);
    const returnAt = startedAt + durationMs;
    const batchId = `expedition-batch-${makeId()}`;
    const selectedIds = new Set(selected.map((pokemon) => String(pokemon.uid)));

    save.pc = (Array.isArray(save.pc) ? save.pc : []).filter((pokemon) => !selectedIds.has(String(pokemon?.uid || "")));
    save.team = (Array.isArray(save.team) ? save.team : []).filter((uid) => !selectedIds.has(String(uid)));
    if (selectedIds.has(String(save.partnerUid || ""))) save.partnerUid = "";
    if (!Array.isArray(save.expeditions)) save.expeditions = [];
    for (const pokemon of selected) {
      save.expeditions.push({
        id: makeId(),
        batchId,
        pokemon,
        locationId: location.id,
        locationName: location.displayName,
        region: location.region,
        generation: location.generation,
        startedAt,
        returnAt,
        durationMs
      });
    }
    if (!save.statistics || typeof save.statistics !== "object") save.statistics = {};
    save.statistics.expeditionsStarted = Math.max(0, Number(save.statistics.expeditionsStarted || 0)) + selected.length;

    if (!writeSave(save)) return showError("The departure could not be written into the save.");
    selectedPokemonUids.clear();
    try { window.sessionStorage.setItem(REOPEN_SESSION_KEY, "1"); } catch {}
    suppressNextPagehideSave = true;
    window.location.reload();
  }

  function updateCountdowns() {
    if (!tabOpen) return;
    document.querySelectorAll("[data-expedition-countdown]").forEach((element) => {
      const returnAt = Number(element.getAttribute("data-expedition-countdown") || 0);
      element.textContent = formatDuration(returnAt - Date.now());
    });
  }

  function refreshFromSaveIfNeeded() {
    if (!tabOpen) return;
    const currentText = readSaveText();
    if (currentText && currentText !== lastSaveText) renderExpeditionsTab();
  }

  function startRefreshTimer() {
    window.clearInterval(refreshTimer);
    let refreshElapsed = 0;
    refreshTimer = window.setInterval(() => {
      updateCountdowns();
      refreshElapsed += 1000;
      if (refreshElapsed >= SAVE_REFRESH_INTERVAL) {
        refreshElapsed = 0;
        refreshFromSaveIfNeeded();
      }
    }, 1000);
  }

  function stopRefreshTimer() {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function openExpeditionsTab() {
    tabOpen = true;
    renderExpeditionsTab();
    startRefreshTimer();
  }

  function leaveExpeditionsTab() {
    tabOpen = false;
    stopRefreshTimer();
  }

  function updateHelpCopy() {
    const modalRoot = document.getElementById("modal-root");
    if (!modalRoot) return;
    const terms = Array.from(modalRoot.querySelectorAll("dt"));
    const expeditionTerm = terms.find((term) => term.textContent.trim() === "Expeditions");
    if (expeditionTerm?.nextElementSibling) {
      expeditionTerm.nextElementSibling.textContent = "Open the Expeditions tab, select several PC Pokémon, and send them as one synchronized return group.";
    }
  }

  window.addEventListener("pagehide", (event) => {
    if (!suppressNextPagehideSave) return;
    suppressNextPagehideSave = false;
    event.stopImmediatePropagation();
  }, { capture: true });

  document.addEventListener("click", (event) => {
    const tabButton = event.target.closest("[data-tab]");
    if (tabButton) {
      if (tabButton.dataset.tab === "expeditions") window.setTimeout(openExpeditionsTab, 0);
      else leaveExpeditionsTab();
    }

    const actionButton = event.target.closest("[data-expedition-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.expeditionAction;
    if (action === "toggle-pokemon") {
      const uid = String(actionButton.dataset.uid || "");
      if (!uid) return;
      if (selectedPokemonUids.has(uid)) selectedPokemonUids.delete(uid);
      else selectedPokemonUids.add(uid);
      renderExpeditionsTab();
    } else if (action === "select-visible") {
      const save = readSave();
      for (const pokemon of filteredPokemon(save)) if (pokemon?.uid) selectedPokemonUids.add(String(pokemon.uid));
      renderExpeditionsTab();
    } else if (action === "clear-selection") {
      selectedPokemonUids.clear();
      renderExpeditionsTab();
    } else if (action === "launch") {
      launchSelectedPokemon();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.id !== "expedition-location-select") return;
    selectedLocationId = String(event.target.value || "");
    renderExpeditionsTab();
  });

  document.addEventListener("input", (event) => {
    if (event.target.id !== "expedition-pokemon-search") return;
    searchText = String(event.target.value || "");
    renderExpeditionsTab();
    const search = document.getElementById("expedition-pokemon-search");
    if (search) {
      search.focus({ preventScroll: true });
      search.setSelectionRange(searchText.length, searchText.length);
    }
  });

  const modalObserver = new MutationObserver(updateHelpCopy);
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot) modalObserver.observe(modalRoot, { childList: true, subtree: true });

  window.setTimeout(() => {
    let reopen = false;
    try {
      reopen = window.sessionStorage.getItem(REOPEN_SESSION_KEY) === "1";
      if (reopen) window.sessionStorage.removeItem(REOPEN_SESSION_KEY);
    } catch {}
    if (!reopen) return;
    const button = document.querySelector('[data-tab="expeditions"]');
    if (button instanceof HTMLElement) button.click();
  }, 80);
})();
