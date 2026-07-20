(function () {
  "use strict";

  const LEAGUES = Object.freeze([
    Object.freeze({ id: "local", name: "Local Class", minimumPeakRating: 0, entryFee: 25, cooldownMs: 60 * 1000, prizeMin: 55, prizeMax: 85, xpPool: 420, levelOffset: -1, strength: 0.96, opponentRating: 980 }),
    Object.freeze({ id: "bronze", name: "Bronze Class", minimumPeakRating: 1075, entryFee: 60, cooldownMs: 3 * 60 * 1000, prizeMin: 130, prizeMax: 190, xpPool: 620, levelOffset: 0, strength: 1, opponentRating: 1125 }),
    Object.freeze({ id: "silver", name: "Silver Class", minimumPeakRating: 1225, entryFee: 125, cooldownMs: 5 * 60 * 1000, prizeMin: 280, prizeMax: 410, xpPool: 850, levelOffset: 2, strength: 1.035, opponentRating: 1300 }),
    Object.freeze({ id: "gold", name: "Gold Class", minimumPeakRating: 1425, entryFee: 250, cooldownMs: 8 * 60 * 1000, prizeMin: 600, prizeMax: 850, xpPool: 1150, levelOffset: 4, strength: 1.07, opponentRating: 1510 }),
    Object.freeze({ id: "master", name: "Master Class", minimumPeakRating: 1675, entryFee: 500, cooldownMs: 12 * 60 * 1000, prizeMin: 1200, prizeMax: 1650, xpPool: 1500, levelOffset: 7, strength: 1.11, opponentRating: 1780 })
  ]);

  const DIFFICULTIES = Object.freeze([
    Object.freeze({ id: "cautious", name: "Cautious", description: "A gentler visiting team with smaller prizes and rating movement.", feeMultiplier: 0.75, prizeMultiplier: 0.72, ratingMultiplier: 0.65, levelOffset: -2, strength: 0.97, ivMin: 3, ivMax: 17 }),
    Object.freeze({ id: "standard", name: "Standard", description: "The normal judging rules and expected rival strength.", feeMultiplier: 1, prizeMultiplier: 1, ratingMultiplier: 1, levelOffset: 0, strength: 1, ivMin: 9, ivMax: 25 }),
    Object.freeze({ id: "elite", name: "Elite", description: "A stronger team with sharper stats, larger prizes, and larger rating changes.", feeMultiplier: 1.35, prizeMultiplier: 1.55, ratingMultiplier: 1.35, levelOffset: 3, strength: 1.045, ivMin: 18, ivMax: 32 })
  ]);

  const ARCHETYPES = Object.freeze([
    Object.freeze({ id: "endurance", name: "Endurance keeper", specialty: "hp", description: "Favors deep reserves and Pokémon that stay composed under long judging." }),
    Object.freeze({ id: "powerhouse", name: "Powerhouse trainer", specialty: "attack", description: "Builds teams around direct physical force and dramatic finishes." }),
    Object.freeze({ id: "fortress", name: "Fortress trainer", specialty: "defense", description: "Prefers difficult-to-move Pokémon and dependable defensive shapes." }),
    Object.freeze({ id: "mystic", name: "Mystic trainer", specialty: "special-attack", description: "Looks for unusual techniques and overwhelming special displays." }),
    Object.freeze({ id: "guardian", name: "Guardian trainer", specialty: "special-defense", description: "Values calm resistance, patience, and controlled performances." }),
    Object.freeze({ id: "sprinter", name: "Sprint trainer", specialty: "speed", description: "Selects fast performers and tries to seize every early point." })
  ]);

  const TACTICS = Object.freeze([
    Object.freeze({ id: "steady", name: "Steady finish", description: "Give each of the final three performers a reliable 7% lift." }),
    Object.freeze({ id: "rally", name: "Rally the team", description: "Gain 13% while trailing at halftime, or 4% while already ahead." }),
    Object.freeze({ id: "all_in", name: "All-in finale", description: "Lose 6% in rounds four and five, then gain 22% in the final round." })
  ]);

  const RIVAL_NAMES = Object.freeze([
    "Rowan Vale", "Mira Flint", "Hollis Reed", "Tamsin Brook", "Arden Pike", "Noa Hart",
    "Sable Quinn", "Remy Ash", "Juniper Lane", "Ivo Stone", "Cleo Marsh", "Perrin Frost"
  ]);

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
  const leagueById = (id) => LEAGUES.find((league) => league.id === id) || LEAGUES[0];
  const difficultyById = (id) => DIFFICULTIES.find((difficulty) => difficulty.id === id) || DIFFICULTIES[1];
  const archetypeById = (id) => ARCHETYPES.find((archetype) => archetype.id === id) || ARCHETYPES[0];
  const tacticById = (id) => TACTICS.find((tactic) => tactic.id === id) || TACTICS[0];

  function unlockedLeagues(peakRating) {
    const peak = Math.max(1000, Number(peakRating) || 1000);
    return LEAGUES.filter((league) => peak >= league.minimumPeakRating);
  }

  function highestUnlockedLeague(peakRating) {
    const unlocked = unlockedLeagues(peakRating);
    return unlocked[unlocked.length - 1] || LEAGUES[0];
  }

  function entryFee(leagueId, difficultyId) {
    const league = leagueById(leagueId);
    const difficulty = difficultyById(difficultyId);
    return Math.max(0, Math.round(league.entryFee * difficulty.feeMultiplier));
  }

  function prizeRange(leagueId, difficultyId, winStreak = 0) {
    const league = leagueById(leagueId);
    const difficulty = difficultyById(difficultyId);
    const streakMultiplier = 1 + Math.min(0.25, Math.max(0, Number(winStreak) || 0) * 0.03);
    return {
      minimum: Math.max(1, Math.round(league.prizeMin * difficulty.prizeMultiplier * streakMultiplier)),
      maximum: Math.max(1, Math.round(league.prizeMax * difficulty.prizeMultiplier * streakMultiplier))
    };
  }

  function cooldownDuration(leagueId) {
    return leagueById(leagueId).cooldownMs;
  }

  function highestRole(pokemon) {
    const stats = pokemon?.baseStats || {};
    const candidates = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
    return candidates.reduce((best, stat) => Number(stats[stat] || 0) > Number(stats[best] || 0) ? stat : best, candidates[0]);
  }

  function teamBalance(team) {
    const members = Array.isArray(team) ? team.filter(Boolean) : [];
    if (!members.length) return Object.freeze({ bonus: 0, typeCount: 0, roleCount: 0, duplicateSpecies: 0 });
    const types = new Set(members.flatMap((pokemon) => Array.isArray(pokemon.types) ? pokemon.types : []).filter(Boolean));
    const roles = new Set(members.map(highestRole));
    const species = new Set(members.map((pokemon) => Number(pokemon.speciesId) || 0).filter(Boolean));
    const duplicateSpecies = Math.max(0, members.length - species.size);
    const typeBonus = Math.min(0.03, Math.max(0, types.size - 2) * 0.005);
    const roleBonus = Math.min(0.03, Math.max(0, roles.size - 2) * 0.0075);
    const duplicatePenalty = duplicateSpecies * 0.005;
    return Object.freeze({
      bonus: clamp(typeBonus + roleBonus - duplicatePenalty, 0, 0.06),
      typeCount: types.size,
      roleCount: roles.size,
      duplicateSpecies
    });
  }

  function tacticMultipliers(tacticId, playerTrailing) {
    const tactic = tacticById(tacticId);
    if (tactic.id === "rally") {
      const multiplier = playerTrailing ? 1.13 : 1.04;
      return [multiplier, multiplier, multiplier];
    }
    if (tactic.id === "all_in") return [0.94, 0.94, 1.22];
    return [1.07, 1.07, 1.07];
  }

  function scoreRound(options) {
    const playerRaw = Math.max(1, Number(options.playerValue) || 1);
    const rivalRaw = Math.max(1, Number(options.rivalValue) || 1);
    const playerScore = Math.max(1, Math.round(playerRaw
      * (1 + clamp(options.playerBalance, 0, 0.06))
      * clamp(options.playerTacticMultiplier || 1, 0.5, 2)
      * clamp(options.playerVariance || 1, 0.9, 1.1)));
    const rivalScore = Math.max(1, Math.round(rivalRaw
      * (1 + clamp(options.rivalBalance, 0, 0.06))
      * clamp(options.rivalStrength || 1, 0.8, 1.4)
      * clamp(options.rivalSpecialtyMultiplier || 1, 0.8, 1.2)
      * clamp(options.rivalVariance || 1, 0.9, 1.1)));
    return Object.freeze({ playerScore, rivalScore, winner: playerScore === rivalScore ? "tie" : playerScore > rivalScore ? "player" : "rival" });
  }

  function summariseRounds(rounds) {
    const list = Array.isArray(rounds) ? rounds : [];
    return list.reduce((summary, round) => {
      summary.playerTotal += Number(round.playerScore || 0);
      summary.rivalTotal += Number(round.rivalScore || 0);
      if (round.winner === "player") summary.playerWins += 1;
      else if (round.winner === "rival") summary.rivalWins += 1;
      else summary.ties += 1;
      return summary;
    }, { playerWins: 0, rivalWins: 0, ties: 0, playerTotal: 0, rivalTotal: 0 });
  }

  function decideWinner(rounds, forcePlayerWin = false) {
    const summary = summariseRounds(rounds);
    if (forcePlayerWin) return Object.freeze({ ...summary, playerWon: true });
    const playerWon = summary.playerWins === summary.rivalWins
      ? summary.playerTotal >= summary.rivalTotal
      : summary.playerWins > summary.rivalWins;
    return Object.freeze({ ...summary, playerWon });
  }

  function ratingChange(options) {
    const playerRating = Math.max(100, Number(options.playerRating) || 1000);
    const league = leagueById(options.leagueId);
    const difficulty = difficultyById(options.difficultyId);
    const rivalRating = league.opponentRating + (difficulty.id === "elite" ? 110 : difficulty.id === "cautious" ? -90 : 0);
    const expected = 1 / (1 + Math.pow(10, (rivalRating - playerRating) / 400));
    const score = options.playerWon ? 1 : 0;
    const delta = Math.round(32 * difficulty.ratingMultiplier * (score - expected));
    return options.playerWon ? Math.max(4, delta) : Math.min(-3, delta);
  }

  function opponentLevel(playerAverageLevel, leagueId, difficultyId, rivalMeetings = 0) {
    const league = leagueById(leagueId);
    const difficulty = difficultyById(difficultyId);
    const rivalryGrowth = Math.min(4, Math.floor(Math.max(0, Number(rivalMeetings) || 0) / 3));
    return Math.round(clamp(Number(playerAverageLevel || 1) + league.levelOffset + difficulty.levelOffset + rivalryGrowth, 1, 100));
  }

  function rivalStrength(leagueId, difficultyId) {
    const league = leagueById(leagueId);
    const difficulty = difficultyById(difficultyId);
    return league.strength * difficulty.strength;
  }

  function candidateScore(member, archetypeId) {
    const archetype = archetypeById(archetypeId);
    const stats = member?.baseStats || {};
    const specialty = Number(stats[archetype.specialty] || 0);
    const total = Object.values(stats).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const roleMatch = highestRole(member) === archetype.specialty ? 20 : 0;
    return specialty * 1.25 + total * 0.08 + roleMatch;
  }

  const api = Object.freeze({
    LEAGUES,
    DIFFICULTIES,
    ARCHETYPES,
    TACTICS,
    RIVAL_NAMES,
    leagueById,
    difficultyById,
    archetypeById,
    tacticById,
    unlockedLeagues,
    highestUnlockedLeague,
    entryFee,
    prizeRange,
    cooldownDuration,
    teamBalance,
    tacticMultipliers,
    scoreRound,
    summariseRounds,
    decideWinner,
    ratingChange,
    opponentLevel,
    rivalStrength,
    candidateScore
  });

  if (typeof window !== "undefined") window.PocketHatcheryCompetitionEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
