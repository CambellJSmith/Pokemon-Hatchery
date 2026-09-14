(function () {
  "use strict";

  const LEAGUES = Object.freeze([
    Object.freeze({ id: "local" }),
    Object.freeze({ id: "bronze" }),
    Object.freeze({ id: "silver" }),
    Object.freeze({ id: "gold" }),
    Object.freeze({ id: "master" })
  ]);
  const DIFFICULTIES = Object.freeze([
    Object.freeze({ id: "cautious" }),
    Object.freeze({ id: "standard" }),
    Object.freeze({ id: "elite" })
  ]);
  const ARCHETYPES = Object.freeze([
    Object.freeze({ id: "endurance" }),
    Object.freeze({ id: "powerhouse" }),
    Object.freeze({ id: "fortress" }),
    Object.freeze({ id: "mystic" }),
    Object.freeze({ id: "guardian" }),
    Object.freeze({ id: "sprinter" })
  ]);

  window.PocketHatcheryCompetitionEngine = Object.freeze({
    LEAGUES,
    DIFFICULTIES,
    ARCHETYPES,
    unlockedLeagues() {
      return LEAGUES;
    }
  });
})();
