(function () {
  "use strict";

  const STORAGE_KEY = "pocket_hatchery_save_v1";
  const REOPEN_SESSION_KEY = "pocket_hatchery_reopen_daily_quests";
  const CLAIM_MESSAGE_SESSION_KEY = "pocket_hatchery_daily_quest_claim_message";
  const SAVE_REFRESH_INTERVAL = 3000;
  const QUEST_COUNT = 3;

  const QUEST_DEFINITIONS = Object.freeze([
    Object.freeze({ id: "hatch-one", title: "Warm welcome", description: "Hatch 1 egg today.", metric: "eggsHatched", target: 1, reward: 150 }),
    Object.freeze({ id: "catch-one", title: "Make a new friend", description: "Catch 1 Pokémon today.", metric: "pokemonCaught", target: 1, reward: 175 }),
    Object.freeze({ id: "buy-balls-five", title: "Restock the satchel", description: "Buy 5 Poké Balls from the Pokémart today.", metric: "pokeBallsBought", target: 5, reward: 100 }),
    Object.freeze({ id: "buy-egg-one", title: "Keep the incubator busy", description: "Buy 1 egg today.", metric: "eggsBought", target: 1, reward: 100 }),
    Object.freeze({ id: "start-expedition-one", title: "Send a postcard", description: "Start 1 expedition today.", metric: "expeditionsStarted", target: 1, reward: 200, eligible: (save) => Array.isArray(save?.pc) && save.pc.length > 0 }),
    Object.freeze({ id: "use-berry-one", title: "A little training", description: "Use 1 berry on a Pokémon today.", metric: "berriesUsed", target: 1, reward: 125, eligible: (save) => Array.isArray(save?.pc) && save.pc.length > 0 }),
    Object.freeze({ id: "win-competition-one", title: "Showcase form", description: "Win 1 competition today.", metric: "competitionsWon", target: 1, reward: 300, eligible: (save) => Array.isArray(save?.team) && save.team.length === 6 }),
    Object.freeze({ id: "sell-keepsake-one", title: "Clear a shelf", description: "Sell 1 expedition keepsake today.", metric: "keepsakesSold", target: 1, reward: 125, eligible: (save) => Object.values(save?.souvenirs || {}).some((count) => Number(count || 0) > 0) })
  ]);

  const QUEST_BY_ID = new Map(QUEST_DEFINITIONS.map((definition) => [definition.id, definition]));

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
      console.warn("Daily quests could not read the hatchery save.", error);
      return "";
    }
  }

  function readSave() {
    const text = readSaveText();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      console.warn("Daily quests found an unreadable hatchery save.", error);
      return null;
    }
  }

  function writeSave(save) {
    try {
      return storageLayer().write(STORAGE_KEY, JSON.stringify(save)) !== false;
    } catch (error) {
      console.warn("Daily quests could not update the hatchery save.", error);
      return false;
    }
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function metricValue(save, metric) {
    return Math.max(0, Math.floor(Number(save?.statistics?.[metric] || 0)));
  }

  function hashText(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return function next() {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffledDefinitions(definitions, seedText) {
    const values = [...definitions];
    const random = seededRandom(hashText(seedText));
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }
    return values;
  }

  function eligibleDefinitions(save) {
    return QUEST_DEFINITIONS.filter((definition) => !definition.eligible || definition.eligible(save));
  }

  function buildDailyState(save, dateKey) {
    const playerKey = `${save?.player?.name || "keeper"}|${save?.player?.dob || ""}`;
    const eligible = eligibleDefinitions(save);
    const selected = shuffledDefinitions(eligible, `${dateKey}|${playerKey}`).slice(0, QUEST_COUNT);
    const fallbacks = QUEST_DEFINITIONS.filter((definition) => !selected.includes(definition));
    while (selected.length < QUEST_COUNT && fallbacks.length) selected.push(fallbacks.shift());

    return {
      currentDate: dateKey,
      quests: selected.map((definition, index) => ({
        id: `${dateKey}-${definition.id}-${index + 1}`,
        definitionId: definition.id,
        baseline: metricValue(save, definition.metric),
        claimed: false
      }))
    };
  }

  function normaliseCurrentState(save, dateKey) {
    const stored = save?.dailyQuests;
    if (!stored || stored.currentDate !== dateKey || !Array.isArray(stored.quests) || stored.quests.length !== QUEST_COUNT) return null;
    const normalised = [];
    const seen = new Set();
    for (const rawQuest of stored.quests) {
      const definition = QUEST_BY_ID.get(String(rawQuest?.definitionId || ""));
      if (!definition || seen.has(definition.id)) return null;
      seen.add(definition.id);
      normalised.push({
        id: String(rawQuest?.id || `${dateKey}-${definition.id}-${normalised.length + 1}`).slice(0, 120),
        definitionId: definition.id,
        baseline: Math.max(0, Math.floor(Number(rawQuest?.baseline || 0))),
        claimed: rawQuest?.claimed === true
      });
    }
    return { currentDate: dateKey, quests: normalised };
  }

  function ensureDailyState(save) {
    if (!save?.player) return { changed: false, state: null };
    const dateKey = localDateKey();
    const current = normaliseCurrentState(save, dateKey);
    if (current) {
      save.dailyQuests = current;
      return { changed: false, state: current };
    }
    const next = buildDailyState(save, dateKey);
    save.dailyQuests = next;
    return { changed: true, state: next };
  }

  function questView(save, rawQuest) {
    const definition = QUEST_BY_ID.get(rawQuest.definitionId);
    if (!definition) return null;
    const current = metricValue(save, definition.metric);
    const progress = Math.max(0, Math.min(definition.target, current - rawQuest.baseline));
    return {
      ...definition,
      ...rawQuest,
      progress,
      complete: progress >= definition.target,
      claimed: rawQuest.claimed === true
    };
  }

  function questViews(save) {
    const ensured = ensureDailyState(save);
    return (ensured.state?.quests || []).map((quest) => questView(save, quest)).filter(Boolean);
  }

  function initialiseBeforeApplication() {
    const save = readSave();
    if (!save?.player) return;
    const ensured = ensureDailyState(save);
    if (ensured.changed) writeSave(save);
  }

  function requestApplicationSave() {
    try {
      window.dispatchEvent(new Event("pagehide"));
    } catch (error) {
      console.warn("Daily quests could not request a final hatchery save.", error);
    }
  }

  function prepareReload(message = "") {
    try {
      window.sessionStorage.setItem(REOPEN_SESSION_KEY, "1");
      if (message) window.sessionStorage.setItem(CLAIM_MESSAGE_SESSION_KEY, message);
    } catch {}
    suppressNextPagehideSave = true;
    window.location.reload();
  }

  function ensureCurrentSaveForOpenTab() {
    const save = readSave();
    if (!save?.player) return { save, reloading: false };
    const ensured = ensureDailyState(save);
    if (!ensured.changed) return { save, reloading: false };
    if (!writeSave(save)) return { save, reloading: false };
    prepareReload();
    return { save, reloading: true };
  }

  function claimQuests(ids) {
    requestApplicationSave();
    const save = readSave();
    if (!save?.player) return;
    ensureDailyState(save);
    const requested = new Set((Array.isArray(ids) ? ids : [ids]).map(String));
    const views = questViews(save);
    const eligible = views.filter((quest) => quest.complete && !quest.claimed && (requested.has("*") || requested.has(quest.id)));
    if (!eligible.length) {
      renderDailyQuestsTab();
      return;
    }

    const claimedIds = new Set(eligible.map((quest) => quest.id));
    let reward = 0;
    for (const quest of save.dailyQuests.quests) {
      if (!claimedIds.has(quest.id)) continue;
      quest.claimed = true;
      reward += Number(QUEST_BY_ID.get(quest.definitionId)?.reward || 0);
    }
    save.money = Math.max(0, Number(save.money || 0)) + reward;
    if (!save.statistics || typeof save.statistics !== "object") save.statistics = {};
    save.statistics.dailyQuestRewardsClaimed = Math.max(0, Number(save.statistics.dailyQuestRewardsClaimed || 0)) + eligible.length;

    if (!writeSave(save)) return;
    prepareReload(`${eligible.length} daily quest reward${eligible.length === 1 ? "" : "s"} claimed · +₽${reward.toLocaleString()}.`);
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

  function progressPercent(quest) {
    return Math.max(0, Math.min(100, quest.progress / Math.max(1, quest.target) * 100));
  }

  function renderQuestCard(quest) {
    const status = quest.claimed ? "claimed" : quest.complete ? "ready" : "in progress";
    const action = quest.claimed
      ? '<span class="daily-quest-claimed">✓ reward claimed</span>'
      : quest.complete
        ? `<button class="button button-primary" type="button" data-daily-quest-action="claim" data-daily-quest-id="${escapeHtml(quest.id)}">Claim ₽${quest.reward.toLocaleString()}</button>`
        : `<span class="daily-quest-status">${quest.progress} / ${quest.target}</span>`;
    return `
      <article class="paper-panel daily-quest-card ${quest.complete ? "is-complete" : ""} ${quest.claimed ? "is-claimed" : ""}">
        <header><div><p class="eyebrow">${escapeHtml(status)}</p><h2>${escapeHtml(quest.title)}</h2></div><strong class="daily-quest-reward">₽${quest.reward.toLocaleString()}</strong></header>
        <p>${escapeHtml(quest.description)}</p>
        <div class="daily-quest-progress-copy"><span>${quest.progress} / ${quest.target}</span><strong>${Math.round(progressPercent(quest))}%</strong></div>
        <div class="daily-quest-progress-track" role="progressbar" aria-label="${escapeHtml(quest.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progressPercent(quest))}"><span style="width:${progressPercent(quest).toFixed(2)}%"></span></div>
        <footer>${action}</footer>
      </article>`;
  }

  function renderDailyQuestsTab() {
    const view = document.getElementById("view");
    if (!view) return;
    const ensured = ensureCurrentSaveForOpenTab();
    if (ensured.reloading) return;
    const save = ensured.save;
    if (!save?.player) {
      view.innerHTML = `<section class="archive-page daily-quests-page"><article class="paper-panel empty-state"><h2>The noticeboard is still blank</h2><p>Register the hatchery first, then return for today's jobs.</p></article></section>`;
      return;
    }

    const quests = questViews(save);
    const ready = quests.filter((quest) => quest.complete && !quest.claimed);
    const claimed = quests.filter((quest) => quest.claimed).length;
    const totalReward = ready.reduce((total, quest) => total + quest.reward, 0);
    const message = readClaimMessage();
    const dateLabel = new Date(`${save.dailyQuests.currentDate}T12:00:00`).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

    view.innerHTML = `
      <section class="archive-page daily-quests-page" aria-labelledby="daily-quests-title">
        <header class="page-heading daily-quests-heading">
          <div>
            <p class="eyebrow">Daily noticeboard</p>
            <h1 id="daily-quests-title">Daily Quests</h1>
            <p>Three small jobs drawn for ${escapeHtml(dateLabel)}. Progress starts when today's board is created and resets on the next local day.</p>
          </div>
          <div class="daily-quest-stamps"><span><b>${ready.length}</b> ready</span><span><b>${claimed}</b> claimed</span></div>
        </header>
        ${message ? `<div class="paper-panel daily-quest-claim-notice" role="status">${escapeHtml(message)}</div>` : ""}
        <section class="paper-panel daily-quest-summary">
          <div><p class="eyebrow">Today's board</p><h2>${claimed} of ${quests.length} rewards collected</h2><p>Unclaimed rewards expire when the next day's quests are drawn.</p></div>
          <button class="button button-primary" type="button" data-daily-quest-action="claim-all" ${ready.length ? "" : "disabled"}>${ready.length ? `Claim ready · ₽${totalReward.toLocaleString()}` : "Nothing ready"}</button>
        </section>
        <div class="daily-quest-grid">${quests.map(renderQuestCard).join("")}</div>
      </section>`;

    lastSaveText = readSaveText();
    view.focus({ preventScroll: true });
  }

  function refreshFromSaveIfNeeded() {
    if (!tabOpen) return;
    const save = readSave();
    if (save?.player && save?.dailyQuests?.currentDate !== localDateKey()) {
      const ensured = ensureDailyState(save);
      if (ensured.changed && writeSave(save)) prepareReload();
      return;
    }
    const currentText = readSaveText();
    if (currentText && currentText !== lastSaveText) renderDailyQuestsTab();
  }

  function startRefreshTimer() {
    window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(refreshFromSaveIfNeeded, SAVE_REFRESH_INTERVAL);
  }

  function stopRefreshTimer() {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function openDailyQuestsTab() {
    tabOpen = true;
    renderDailyQuestsTab();
    startRefreshTimer();
  }

  function leaveDailyQuestsTab() {
    tabOpen = false;
    stopRefreshTimer();
  }

  function updateHelpCopy() {
    const modalRoot = document.getElementById("modal-root");
    const list = modalRoot?.querySelector(".summary-list");
    if (!list) return;
    const terms = Array.from(list.querySelectorAll("dt"));
    if (terms.some((term) => term.textContent.trim() === "Daily Quests")) return;
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = "Daily Quests";
    description.textContent = "The Daily Quests tab draws three jobs each local day. Progress is measured from the counters recorded when that day's board is created, and completed jobs award Pokédollars when claimed.";
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
      if (tabButton.dataset.tab === "quests") window.setTimeout(openDailyQuestsTab, 0);
      else leaveDailyQuestsTab();
    }

    const actionButton = event.target.closest("[data-daily-quest-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.dailyQuestAction;
    if (action === "claim") claimQuests(actionButton.dataset.dailyQuestId);
    else if (action === "claim-all") claimQuests("*");
  });

  const modalObserver = new MutationObserver(updateHelpCopy);
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot) modalObserver.observe(modalRoot, { childList: true, subtree: true });

  initialiseBeforeApplication();

  window.setTimeout(() => {
    let reopen = false;
    try {
      reopen = window.sessionStorage.getItem(REOPEN_SESSION_KEY) === "1";
      if (reopen) window.sessionStorage.removeItem(REOPEN_SESSION_KEY);
    } catch {}
    if (!reopen) return;
    const button = document.querySelector('[data-tab="quests"]');
    if (button instanceof HTMLElement) button.click();
  }, 100);
})();
