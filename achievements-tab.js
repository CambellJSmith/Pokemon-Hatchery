(function () {
  "use strict";

  const STORAGE_KEY = "pocket_hatchery_save_v1";
  const REOPEN_SESSION_KEY = "pocket_hatchery_reopen_achievements";
  const CLAIM_MESSAGE_SESSION_KEY = "pocket_hatchery_achievement_claim_message";
  const SAVE_REFRESH_INTERVAL = 4000;
  const PAGE_SIZE = 72;

  let tabOpen = false;
  let refreshTimer = null;
  let lastSaveText = "";
  let searchText = "";
  let categoryFilter = "all";
  let statusFilter = "all";
  let generationFilter = "all";
  let visibleLimit = PAGE_SIZE;
  let suppressNextPagehideSave = false;

  function engine() {
    return window.PocketHatcheryAchievements || null;
  }

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
      console.warn("The achievement ledger could not read the hatchery save.", error);
      return "";
    }
  }

  function readSave() {
    const text = readSaveText();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      console.warn("The achievement ledger found an unreadable hatchery save.", error);
      return null;
    }
  }

  function writeSave(save) {
    try {
      return storageLayer().write(STORAGE_KEY, JSON.stringify(save)) !== false;
    } catch (error) {
      console.warn("The achievement ledger could not update the hatchery save.", error);
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

  function formatNumber(value) {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return "0";
    if (Math.abs(number) >= 1000000) return `${(number / 1000000).toFixed(number >= 10000000 ? 0 : 1).replace(/\.0$/, "")}m`;
    if (Math.abs(number) >= 10000) return `${(number / 1000).toFixed(number >= 100000 ? 0 : 1).replace(/\.0$/, "")}k`;
    return Math.floor(number).toLocaleString();
  }

  function formatProgress(entry) {
    if (entry.claimed) return "reward claimed";
    if (entry.unlocked) return "achievement earned";
    if (entry.target === 1) return entry.rawCurrent > 0 ? "ready" : "not yet";
    return `${formatNumber(entry.rawCurrent)} / ${formatNumber(entry.target)}${entry.unit ? ` · ${entry.unit}` : ""}`;
  }

  function progressPercent(entry) {
    if (entry.claimed || entry.unlocked) return 100;
    return Math.max(0, Math.min(100, (Number(entry.rawCurrent || 0) / Math.max(1, Number(entry.target || 1))) * 100));
  }

  function achievementStateRank(entry) {
    if (entry.unlocked && !entry.claimed) return 0;
    if (!entry.unlocked) return 1;
    return 2;
  }

  function filteredCatalogue(save) {
    const registry = engine();
    if (!registry) return [];
    const query = searchText.trim().toLowerCase();
    return registry.buildCatalogue(save)
      .filter((entry) => categoryFilter === "all" || entry.category === categoryFilter)
      .filter((entry) => generationFilter === "all" || entry.generation === Number(generationFilter))
      .filter((entry) => {
        if (statusFilter === "claimable") return entry.unlocked && !entry.claimed;
        if (statusFilter === "earned") return entry.unlocked;
        if (statusFilter === "claimed") return entry.claimed;
        if (statusFilter === "locked") return !entry.unlocked;
        return true;
      })
      .filter((entry) => {
        if (!query) return true;
        const searchable = [
          entry.title,
          entry.description,
          entry.categoryLabel,
          entry.rarityLabel,
          entry.generation ? `generation ${entry.generation}` : ""
        ].join(" ").toLowerCase();
        return searchable.includes(query);
      })
      .sort((left, right) => {
        const stateOrder = achievementStateRank(left) - achievementStateRank(right);
        if (stateOrder !== 0) return stateOrder;
        if (!left.unlocked && !right.unlocked) {
          const leftProgress = Number(left.rawCurrent || 0) / Math.max(1, Number(left.target || 1));
          const rightProgress = Number(right.rawCurrent || 0) / Math.max(1, Number(right.target || 1));
          if (rightProgress !== leftProgress) return rightProgress - leftProgress;
        }
        const rarityOrder = (engine().RARITY_ORDER || []).indexOf(right.rarity) - (engine().RARITY_ORDER || []).indexOf(left.rarity);
        if (rarityOrder !== 0) return rarityOrder;
        return left.title.localeCompare(right.title);
      });
  }

  function renderAchievementCard(entry) {
    const isHidden = entry.secret && !entry.unlocked;
    const title = isHidden ? "Secret achievement" : entry.title;
    const description = isHidden ? "A hidden condition in the hatchery will reveal this achievement." : entry.description;
    const classes = [
      "achievement-card",
      "paper-panel",
      `rarity-${entry.rarity}`,
      entry.unlocked ? "is-earned" : "is-locked",
      entry.claimed ? "is-claimed" : "",
      isHidden ? "is-secret" : ""
    ].filter(Boolean).join(" ");
    const generation = entry.generation
      ? `<span class="achievement-generation">Gen ${entry.generation}</span>`
      : "";
    const action = entry.unlocked
      ? entry.claimed
        ? `<span class="achievement-claimed-mark" aria-label="Reward claimed">✓ claimed</span>`
        : `<button class="button button-primary achievement-claim-button" type="button" data-achievement-action="claim" data-achievement-id="${escapeHtml(entry.id)}">Claim ₽${entry.reward.toLocaleString()}</button>`
      : `<span class="achievement-locked-mark">in progress</span>`;

    return `
      <article class="${classes}" data-achievement-id="${escapeHtml(entry.id)}">
        <header>
          <span class="achievement-glyph" aria-hidden="true">${escapeHtml(entry.categoryGlyph)}</span>
          <div class="achievement-card-heading">
            <div class="achievement-tags"><span>${escapeHtml(entry.categoryLabel)}</span><span>${escapeHtml(entry.rarityLabel)}</span>${generation}</div>
            <h2>${escapeHtml(title)}</h2>
          </div>
          <span class="achievement-status-icon" aria-hidden="true">${entry.claimed ? "✓" : entry.unlocked ? "★" : isHidden ? "?" : "○"}</span>
        </header>
        <p>${escapeHtml(description)}</p>
        <div class="achievement-progress-copy"><span>${escapeHtml(formatProgress(entry))}</span><strong>${Math.round(progressPercent(entry))}%</strong></div>
        <div class="achievement-progress-track" role="progressbar" aria-label="${escapeHtml(title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progressPercent(entry))}"><span style="width:${progressPercent(entry).toFixed(2)}%"></span></div>
        <footer><span class="achievement-reward">Reward · ₽${entry.reward.toLocaleString()}</span>${action}</footer>
      </article>`;
  }

  function readClaimMessage() {
    try {
      const message = window.sessionStorage.getItem(CLAIM_MESSAGE_SESSION_KEY);
      if (message) window.sessionStorage.removeItem(CLAIM_MESSAGE_SESSION_KEY);
      return message || "";
    } catch {
      return "";
    }
  }

  function renderAchievementsTab() {
    const view = document.getElementById("view");
    const registry = engine();
    if (!view) return;
    if (!registry) {
      view.innerHTML = `<section class="archive-page achievements-page"><article class="paper-panel empty-state"><h2>The achievement ledger did not load</h2><p>Refresh the hatchery and try opening this room again.</p></article></section>`;
      return;
    }

    const save = readSave();
    if (!save?.player) {
      view.innerHTML = `<section class="archive-page achievements-page"><article class="paper-panel empty-state"><h2>The ledger is still sealed</h2><p>Register the hatchery first, then return to see its achievements.</p></article></section>`;
      return;
    }

    const summary = registry.summary(save);
    const catalogue = filteredCatalogue(save);
    const visible = catalogue.slice(0, visibleLimit);
    const categoryOptions = Object.entries(registry.CATEGORY_META)
      .map(([value, meta]) => `<option value="${escapeHtml(value)}" ${categoryFilter === value ? "selected" : ""}>${escapeHtml(meta.label)}</option>`)
      .join("");
    const generationOptions = summary.enabledGenerations
      .map((generation) => {
        const record = registry.GENERATIONS.find((entry) => entry.number === generation);
        return `<option value="${generation}" ${generationFilter === String(generation) ? "selected" : ""}>Gen ${record?.numeral || generation} · ${escapeHtml(record?.region || "")}</option>`;
      })
      .join("");
    const enabledRegions = summary.enabledGenerations
      .map((generation) => registry.GENERATIONS.find((entry) => entry.number === generation)?.region)
      .filter(Boolean)
      .join(", ");
    const claimMessage = readClaimMessage();

    view.innerHTML = `
      <section class="archive-page achievements-page" aria-labelledby="achievements-title">
        <header class="page-heading achievements-heading">
          <div>
            <p class="eyebrow">Hatchery honours</p>
            <h1 id="achievements-title">Achievements</h1>
            <p>A large, generation-aware ledger of collection goals, hatchery mishaps, training feats, expedition records, competition triumphs, and strange little moments.</p>
          </div>
          <div class="achievement-summary-stamps">
            <span><b>${summary.unlocked}</b> earned</span>
            <span><b>${summary.claimed}</b> claimed</span>
            <span><b>${summary.total}</b> available</span>
          </div>
        </header>

        ${claimMessage ? `<div class="paper-panel achievement-claim-notice" role="status">${escapeHtml(claimMessage)}</div>` : ""}

        <section class="paper-panel achievement-overview">
          <div>
            <p class="eyebrow">Current ruleset</p>
            <h2>${summary.enabledGenerations.length} enabled generation${summary.enabledGenerations.length === 1 ? "" : "s"}</h2>
            <p>${escapeHtml(enabledRegions)} · ${summary.enabledSpeciesTotal.toLocaleString()} species count toward enabled-generation completion achievements.</p>
          </div>
          <div class="achievement-overall-progress">
            <span>${summary.unlocked} of ${summary.total} earned</span>
            <div class="achievement-progress-track"><span style="width:${summary.total ? (summary.unlocked / summary.total * 100).toFixed(2) : 0}%"></span></div>
            <strong>${summary.claimable} reward${summary.claimable === 1 ? "" : "s"} ready · ₽${summary.claimableReward.toLocaleString()}</strong>
          </div>
          <button class="button button-primary" type="button" data-achievement-action="claim-all" ${summary.claimable ? "" : "disabled"}>Claim all earned</button>
        </section>

        <div class="paper-panel achievement-toolbar">
          <label><span>Search achievements</span><input id="achievement-search" type="search" value="${escapeHtml(searchText)}" placeholder="Name, description, category…" autocomplete="off" /></label>
          <label><span>Category</span><select id="achievement-category-filter"><option value="all">All categories</option>${categoryOptions}</select></label>
          <label><span>Status</span><select id="achievement-status-filter">
            <option value="all" ${statusFilter === "all" ? "selected" : ""}>All statuses</option>
            <option value="claimable" ${statusFilter === "claimable" ? "selected" : ""}>Ready to claim</option>
            <option value="earned" ${statusFilter === "earned" ? "selected" : ""}>Earned</option>
            <option value="claimed" ${statusFilter === "claimed" ? "selected" : ""}>Claimed</option>
            <option value="locked" ${statusFilter === "locked" ? "selected" : ""}>In progress</option>
          </select></label>
          <label><span>Generation</span><select id="achievement-generation-filter"><option value="all">All / adaptive</option>${generationOptions}</select></label>
          <div class="achievement-filter-result"><strong>${catalogue.length.toLocaleString()}</strong><span>matching achievement${catalogue.length === 1 ? "" : "s"}</span></div>
        </div>

        ${visible.length
          ? `<div class="achievement-grid">${visible.map(renderAchievementCard).join("")}</div>
             ${visible.length < catalogue.length ? `<div class="archive-more"><button class="button button-primary" type="button" data-achievement-action="show-more">Show ${Math.min(PAGE_SIZE, catalogue.length - visible.length)} more</button><span>${visible.length} of ${catalogue.length} shown</span></div>` : ""}`
          : `<article class="paper-panel empty-state"><span class="empty-glyph" aria-hidden="true">⌁</span><h2>No achievements match</h2><p>Try a different category, generation, status, or search phrase.</p><button class="button" type="button" data-achievement-action="clear-filters">Clear filters</button></article>`}
      </section>`;

    lastSaveText = readSaveText();
    view.focus({ preventScroll: true });
  }

  function requestApplicationSave() {
    try {
      window.dispatchEvent(new Event("pagehide"));
    } catch (error) {
      console.warn("The achievement ledger could not request a final hatchery save.", error);
    }
  }

  function claimAchievements(ids) {
    requestApplicationSave();
    const registry = engine();
    const save = readSave();
    if (!registry || !save) return;

    const requested = new Set((Array.isArray(ids) ? ids : [ids]).map(String).filter(Boolean));
    const claimed = new Set((Array.isArray(save.claimedAchievementIds) ? save.claimedAchievementIds : []).map(String));
    const eligible = registry.buildCatalogue(save)
      .filter((entry) => entry.unlocked && !claimed.has(entry.id) && (requested.has("*") || requested.has(entry.id)));

    if (!eligible.length) {
      renderAchievementsTab();
      return;
    }

    const reward = eligible.reduce((total, entry) => total + Number(entry.reward || 0), 0);
    eligible.forEach((entry) => claimed.add(entry.id));
    save.claimedAchievementIds = [...claimed];
    save.money = Math.max(0, Number(save.money || 0)) + reward;
    if (!save.statistics || typeof save.statistics !== "object") save.statistics = {};
    save.statistics.achievementRewardsClaimed = Math.max(0, Number(save.statistics.achievementRewardsClaimed || 0)) + eligible.length;

    if (!writeSave(save)) return;
    try {
      window.sessionStorage.setItem(REOPEN_SESSION_KEY, "1");
      window.sessionStorage.setItem(CLAIM_MESSAGE_SESSION_KEY, `${eligible.length} achievement reward${eligible.length === 1 ? "" : "s"} claimed · +₽${reward.toLocaleString()}.`);
    } catch {}
    suppressNextPagehideSave = true;
    window.location.reload();
  }

  function refreshFromSaveIfNeeded() {
    if (!tabOpen) return;
    const currentText = readSaveText();
    if (currentText && currentText !== lastSaveText) renderAchievementsTab();
  }

  function startRefreshTimer() {
    window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(refreshFromSaveIfNeeded, SAVE_REFRESH_INTERVAL);
  }

  function stopRefreshTimer() {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function openAchievementsTab() {
    tabOpen = true;
    renderAchievementsTab();
    startRefreshTimer();
  }

  function leaveAchievementsTab() {
    tabOpen = false;
    stopRefreshTimer();
  }

  function updateHelpCopy() {
    const modalRoot = document.getElementById("modal-root");
    const list = modalRoot?.querySelector(".summary-list");
    if (!list) return;
    const terms = Array.from(list.querySelectorAll("dt"));
    if (terms.some((term) => term.textContent.trim() === "Achievements")) return;
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = "Achievements";
    description.textContent = "The Achievements tab calculates hundreds of goals from this save. Generation completion only counts the generations enabled on the registration card.";
    const saveTerm = terms.find((entry) => entry.textContent.trim() === "Save backups");
    if (saveTerm) {
      list.insertBefore(term, saveTerm);
      list.insertBefore(description, saveTerm);
    } else {
      list.append(term, description);
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
      if (tabButton.dataset.tab === "achievements") window.setTimeout(openAchievementsTab, 0);
      else leaveAchievementsTab();
    }

    const actionButton = event.target.closest("[data-achievement-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.achievementAction;
    if (action === "claim") claimAchievements(actionButton.dataset.achievementId);
    else if (action === "claim-all") claimAchievements("*");
    else if (action === "show-more") {
      visibleLimit += PAGE_SIZE;
      renderAchievementsTab();
    } else if (action === "clear-filters") {
      searchText = "";
      categoryFilter = "all";
      statusFilter = "all";
      generationFilter = "all";
      visibleLimit = PAGE_SIZE;
      renderAchievementsTab();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "achievement-category-filter") categoryFilter = String(event.target.value || "all");
    else if (event.target.id === "achievement-status-filter") statusFilter = String(event.target.value || "all");
    else if (event.target.id === "achievement-generation-filter") generationFilter = String(event.target.value || "all");
    else return;
    visibleLimit = PAGE_SIZE;
    renderAchievementsTab();
  });

  document.addEventListener("input", (event) => {
    if (event.target.id !== "achievement-search") return;
    searchText = String(event.target.value || "");
    visibleLimit = PAGE_SIZE;
    renderAchievementsTab();
    const search = document.getElementById("achievement-search");
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
    const button = document.querySelector('[data-tab="achievements"]');
    if (button instanceof HTMLElement) button.click();
  }, 90);
})();