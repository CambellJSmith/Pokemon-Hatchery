(function () {
  "use strict";

  const STORAGE_KEY = "pocket_hatchery_save_v1";
  const CLOSED_TAB_ID = "competitions-closed";
  const COMPETITION_QUEST_ID = "win-competition-one";
  const COMPETITION_TEAM_ACHIEVEMENTS = new Set([
    "full_shiny_team",
    "full_team",
    "different_species_team",
    "same_type_team",
    "all_favourite_team",
    "team_type_variety_12",
    "team_many_generations",
    "level_100_team"
  ]);
  const QUEST_FALLBACKS = Object.freeze([
    Object.freeze({ id: "hatch-one", metric: "eggsHatched" }),
    Object.freeze({ id: "catch-one", metric: "pokemonCaught" }),
    Object.freeze({ id: "buy-balls-five", metric: "pokeBallsBought" }),
    Object.freeze({ id: "buy-egg-one", metric: "eggsBought" })
  ]);

  function storageLayer() {
    return window.PocketHatcheryStorage || {
      read: (key) => window.localStorage.getItem(key),
      write: (key, value) => {
        window.localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        return true;
      }
    };
  }

  function readSave() {
    try {
      const text = storageLayer().read(STORAGE_KEY);
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn("The closed competition desk could not read the hatchery save.", error);
      return null;
    }
  }

  function writeSave(save) {
    try {
      return storageLayer().write(STORAGE_KEY, JSON.stringify(save)) !== false;
    } catch (error) {
      console.warn("The closed competition desk could not update the hatchery save.", error);
      return false;
    }
  }

  function neutraliseLegacyCompetitionState() {
    const save = readSave();
    if (!save || typeof save !== "object") return false;
    let changed = false;

    if (Array.isArray(save.team) && save.team.length) {
      save.team = [];
      changed = true;
    }

    if (save.competition && typeof save.competition === "object") {
      if (save.competition.activeMatch) {
        save.competition.activeMatch = null;
        changed = true;
      }
      if (save.competition.cooldowns && Object.keys(save.competition.cooldowns).length) {
        save.competition.cooldowns = {};
        changed = true;
      }
      if (save.competition.challenges && Object.keys(save.competition.challenges).length) {
        save.competition.challenges = {};
        changed = true;
      }
    }

    const quests = Array.isArray(save.dailyQuests?.quests) ? save.dailyQuests.quests : [];
    const competitionQuestIndex = quests.findIndex((quest) => quest?.definitionId === COMPETITION_QUEST_ID);
    if (competitionQuestIndex >= 0) {
      const usedIds = new Set(quests.map((quest) => String(quest?.definitionId || "")).filter(Boolean));
      const replacement = QUEST_FALLBACKS.find((quest) => !usedIds.has(quest.id)) || QUEST_FALLBACKS[0];
      const dateKey = String(save.dailyQuests?.currentDate || "daily");
      const currentMetric = Math.max(0, Math.floor(Number(save.statistics?.[replacement.metric] || 0)));
      quests[competitionQuestIndex] = {
        id: `${dateKey}-${replacement.id}-${competitionQuestIndex + 1}`,
        definitionId: replacement.id,
        baseline: currentMetric,
        claimed: false
      };
      changed = true;
    }

    if (changed) writeSave(save);
    return changed;
  }

  function removeCompetitionAchievements() {
    const source = window.PocketHatcheryAchievements;
    if (!source || typeof source.buildCatalogue !== "function") return;
    const categoryMeta = Object.freeze(Object.fromEntries(
      Object.entries(source.CATEGORY_META || {}).filter(([category]) => category !== "competitions")
    ));
    const buildCatalogue = (state) => source.buildCatalogue(state).filter((entry) =>
      entry.category !== "competitions" && !COMPETITION_TEAM_ACHIEVEMENTS.has(entry.id)
    );
    const summary = (state) => {
      const catalogue = buildCatalogue(state);
      const unlocked = catalogue.filter((entry) => entry.unlocked);
      const claimed = catalogue.filter((entry) => entry.claimed);
      const claimable = catalogue.filter((entry) => entry.unlocked && !entry.claimed);
      return {
        total: catalogue.length,
        unlocked: unlocked.length,
        claimed: claimed.length,
        claimable: claimable.length,
        claimableReward: claimable.reduce((total, entry) => total + Number(entry.reward || 0), 0),
        enabledGenerations: source.enabledGenerationNumbers(state),
        enabledSpeciesTotal: source.enabledSpeciesIds(state).length
      };
    };
    window.PocketHatcheryAchievements = Object.freeze({ ...source, CATEGORY_META: categoryMeta, buildCatalogue, summary });
  }

  function competitionsTabActive() {
    return Boolean(document.querySelector(`[data-tab="${CLOSED_TAB_ID}"].is-active`));
  }

  function renderClosedCompetitions() {
    const view = document.getElementById("view");
    if (!view || !competitionsTabActive()) return;
    if (view.querySelector("[data-competitions-closed]")) return;
    view.innerHTML = `
      <section class="placeholder-page" data-competitions-closed>
        <article class="paper-panel empty-state">
          <h1>Competitions function being updated. Closed for now</h1>
        </article>
      </section>`;
  }

  function scrubVisibleCompetitionReferences(root = document) {
    root.querySelectorAll('[data-action="toggle-team"], [data-action="dev-clear-contests"], [data-action="dev-team-level-100"]').forEach((element) => element.remove());
    root.querySelectorAll('input[name="dev_tool"][value="alwaysWinContests"]').forEach((input) => input.closest("label")?.remove());
    root.querySelectorAll('#pc-filter option[value="team"], #pc-filter option[value="not-team"]').forEach((option) => option.remove());
    root.querySelectorAll(".pc-header-stamps .team-counter").forEach((counter) => {
      if (counter.textContent.includes("on team")) counter.remove();
    });

    const pcHeadingCopy = root.querySelector(".archive-page .page-heading > div > p:last-child");
    if (pcHeadingCopy?.textContent.includes("showcase team")) {
      pcHeadingCopy.textContent = "Every Pokémon here has its own little story. Mark favourites, choose a partner, and keep your collection tidy.";
    }
  }

  function scrubHelpModal() {
    const modalRoot = document.getElementById("modal-root");
    if (!modalRoot) return;
    const terms = Array.from(modalRoot.querySelectorAll("dt"));
    const showcaseTerm = terms.find((term) => term.textContent.trim() === "Showcases");
    if (!showcaseTerm) return;
    showcaseTerm.nextElementSibling?.remove();
    showcaseTerm.remove();
  }

  neutraliseLegacyCompetitionState();
  removeCompetitionAchievements();

  const view = document.getElementById("view");
  const viewObserver = view ? new MutationObserver(() => {
    if (competitionsTabActive()) renderClosedCompetitions();
    else scrubVisibleCompetitionReferences(view);
  }) : null;
  viewObserver?.observe(view, { childList: true, subtree: true });

  const modalRoot = document.getElementById("modal-root");
  const modalObserver = modalRoot ? new MutationObserver(scrubHelpModal) : null;
  modalObserver?.observe(modalRoot, { childList: true, subtree: true });

  document.addEventListener("click", (event) => {
    const tabButton = event.target.closest(`[data-tab="${CLOSED_TAB_ID}"]`);
    if (tabButton) window.queueMicrotask(renderClosedCompetitions);
  });
})();
