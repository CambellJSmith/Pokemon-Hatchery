(function () {
  "use strict";

  const LEAGUES = Object.freeze([Object.freeze({ id: "local" })]);
  const DIFFICULTIES = Object.freeze([Object.freeze({ id: "standard" })]);
  const ARCHETYPES = Object.freeze([Object.freeze({ id: "endurance" })]);

  window.PocketHatcheryCompetitionEngine = Object.freeze({
    LEAGUES,
    DIFFICULTIES,
    ARCHETYPES,
    unlockedLeagues() {
      return LEAGUES;
    }
  });
})();
