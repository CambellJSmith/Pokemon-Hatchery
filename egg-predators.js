(function () {
  "use strict";

  const BASE_ATTEMPT_DENOMINATOR = 25;
  const PARTNER_BLOCK_CHANCE = 0.5;

  // Snake-like Pokémon plus species whose established behaviour includes stealing or eating eggs.
  const EGG_PREDATORS = Object.freeze([
    { speciesId: 23, generation: 1, displayName: "Ekans" },
    { speciesId: 24, generation: 1, displayName: "Arbok" },
    { speciesId: 95, generation: 1, displayName: "Onix" },
    { speciesId: 147, generation: 1, displayName: "Dratini" },
    { speciesId: 148, generation: 1, displayName: "Dragonair" },
    { speciesId: 206, generation: 2, displayName: "Dunsparce" },
    { speciesId: 208, generation: 2, displayName: "Steelix" },
    { speciesId: 215, generation: 2, displayName: "Sneasel" },
    { speciesId: 336, generation: 3, displayName: "Seviper" },
    { speciesId: 350, generation: 3, displayName: "Milotic" },
    { speciesId: 367, generation: 3, displayName: "Huntail" },
    { speciesId: 368, generation: 3, displayName: "Gorebyss" },
    { speciesId: 384, generation: 3, displayName: "Rayquaza" },
    { speciesId: 461, generation: 4, displayName: "Weavile" },
    { speciesId: 487, generation: 4, displayName: "Giratina" },
    { speciesId: 495, generation: 5, displayName: "Snivy" },
    { speciesId: 496, generation: 5, displayName: "Servine" },
    { speciesId: 497, generation: 5, displayName: "Serperior" },
    { speciesId: 602, generation: 5, displayName: "Tynamo" },
    { speciesId: 603, generation: 5, displayName: "Eelektrik" },
    { speciesId: 604, generation: 5, displayName: "Eelektross" },
    { speciesId: 718, generation: 6, displayName: "Zygarde" },
    { speciesId: 843, generation: 8, displayName: "Silicobra" },
    { speciesId: 844, generation: 8, displayName: "Sandaconda" },
    { speciesId: 890, generation: 8, displayName: "Eternatus" },
    { speciesId: 903, generation: 8, displayName: "Sneasler" },
    { speciesId: 968, generation: 9, displayName: "Orthworm" },
    { speciesId: 982, generation: 9, displayName: "Dudunsparce" }
  ]);

  function cleanGenerations(generations) {
    const values = Array.isArray(generations) ? generations.map(Number).filter((value) => Number.isInteger(value) && value >= 1 && value <= 9) : [];
    return values.length ? new Set(values) : null;
  }

  function entries(generations = null) {
    const enabled = cleanGenerations(generations);
    const source = enabled ? EGG_PREDATORS.filter((entry) => enabled.has(entry.generation)) : EGG_PREDATORS;
    return source.map((entry) => ({ ...entry }));
  }

  function choose(generations = null, random = Math.random) {
    const pool = entries(generations);
    const source = pool.length ? pool : entries();
    const value = Math.min(0.999999999, Math.max(0, Number(random()) || 0));
    return source[Math.floor(value * source.length)] || { speciesId: 23, generation: 1, displayName: "Ekans" };
  }

  function resolveAttempt(options = {}) {
    const random = typeof options.random === "function" ? options.random : Math.random;
    const attemptRoll = Math.min(0.999999999, Math.max(0, Number(random()) || 0));
    if (attemptRoll >= 1 / BASE_ATTEMPT_DENOMINATOR) {
      return { attempted: false, outcome: "none", predator: null };
    }

    let outcome = "eaten";
    if (options.hasRepel === true) outcome = "repel";
    else if (options.hasPartner === true) {
      const partnerRoll = Math.min(0.999999999, Math.max(0, Number(random()) || 0));
      if (partnerRoll < PARTNER_BLOCK_CHANCE) outcome = "partner";
    }

    return {
      attempted: true,
      outcome,
      predator: choose(options.generations, random)
    };
  }

  window.PocketHatcheryEggPredators = Object.freeze({
    BASE_ATTEMPT_DENOMINATOR,
    PARTNER_BLOCK_CHANCE,
    entries,
    choose,
    resolveAttempt
  });
}());
