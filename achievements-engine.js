(function () {
  "use strict";

  const GENERATIONS = Object.freeze([
    { number: 1, numeral: "I", region: "Kanto", start: 1, end: 151, starters: [1, 4, 7] },
    { number: 2, numeral: "II", region: "Johto", start: 152, end: 251, starters: [152, 155, 158] },
    { number: 3, numeral: "III", region: "Hoenn", start: 252, end: 386, starters: [252, 255, 258] },
    { number: 4, numeral: "IV", region: "Sinnoh", start: 387, end: 493, starters: [387, 390, 393] },
    { number: 5, numeral: "V", region: "Unova", start: 494, end: 649, starters: [495, 498, 501] },
    { number: 6, numeral: "VI", region: "Kalos", start: 650, end: 721, starters: [650, 653, 656] },
    { number: 7, numeral: "VII", region: "Alola", start: 722, end: 809, starters: [722, 725, 728] },
    { number: 8, numeral: "VIII", region: "Galar", start: 810, end: 905, starters: [810, 813, 816] },
    { number: 9, numeral: "IX", region: "Paldea", start: 906, end: 1025, starters: [906, 909, 912] }
  ]);

  const TYPES = Object.freeze([
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
    "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ]);

  const STAT_KEYS = Object.freeze(["hp", "attack", "defense", "special-attack", "special-defense", "speed"]);

  const CATEGORY_META = Object.freeze({
    hatchery: { label: "Hatchery", glyph: "◌" },
    collection: { label: "Collection", glyph: "▤" },
    generations: { label: "Generations", glyph: "⌖" },
    shiny: { label: "Shiny hunting", glyph: "✦" },
    companions: { label: "PC & companions", glyph: "♟" },
    training: { label: "Training", glyph: "↑" },
    expeditions: { label: "Expeditions", glyph: "⌁" },
    competitions: { label: "Competitions", glyph: "◆" },
    economy: { label: "Economy & items", glyph: "◉" },
    oddities: { label: "Oddities", glyph: "?" }
  });

  const RARITY_ORDER = Object.freeze(["common", "uncommon", "rare", "epic", "legendary"]);
  const RARITY_LABELS = Object.freeze({
    common: "Field note",
    uncommon: "Notable",
    rare: "Rare",
    epic: "Exceptional",
    legendary: "Legendary"
  });

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function integer(value, fallback = 0) {
    return Math.max(0, Math.floor(number(value, fallback)));
  }

  function uniqueNumbers(values) {
    return [...new Set((Array.isArray(values) ? values : []).map(Number).filter((value) => Number.isInteger(value) && value > 0))];
  }

  function enabledGenerationNumbers(state) {
    const selected = uniqueNumbers(state?.settings?.generations).filter((value) => value >= 1 && value <= 9);
    return selected.length ? selected.sort((left, right) => left - right) : [1];
  }

  function generationRecord(numberValue) {
    return GENERATIONS.find((entry) => entry.number === Number(numberValue)) || GENERATIONS[0];
  }

  function generationForSpecies(speciesId) {
    const id = integer(speciesId);
    return GENERATIONS.find((entry) => id >= entry.start && id <= entry.end)?.number || 0;
  }

  function speciesIdsForGeneration(generation) {
    const record = generationRecord(generation);
    return Array.from({ length: record.end - record.start + 1 }, (_, index) => record.start + index);
  }

  function enabledSpeciesIds(state) {
    return enabledGenerationNumbers(state).flatMap(speciesIdsForGeneration);
  }

  function pokemonRecords(state) {
    const records = [];
    if (Array.isArray(state?.pc)) records.push(...state.pc.filter(Boolean));
    if (Array.isArray(state?.expeditions)) {
      records.push(...state.expeditions.map((entry) => entry?.pokemon).filter(Boolean));
    }
    if (state?.encounter) records.push(state.encounter);
    if (Array.isArray(state?.incubators?.slots)) {
      records.push(...state.incubators.slots.map((slot) => slot?.encounter).filter(Boolean));
    }
    const seenUids = new Set();
    return records.filter((pokemon) => {
      const uid = String(pokemon?.uid || "");
      if (!uid) return true;
      if (seenUids.has(uid)) return false;
      seenUids.add(uid);
      return true;
    });
  }

  function typeList(pokemon) {
    return (Array.isArray(pokemon?.types) ? pokemon.types : [])
      .map((type) => typeof type === "string" ? type : type?.type?.name || type?.name)
      .map((type) => String(type || "").toLowerCase())
      .filter((type) => TYPES.includes(type));
  }

  function sumObjectValues(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
    return Object.values(value).reduce((total, entry) => total + integer(entry), 0);
  }

  function isoAgeDays(value) {
    const timestamp = new Date(value || "").getTime();
    if (!Number.isFinite(timestamp)) return 0;
    return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
  }

  function dateMatchesDob(dateValue, dobValue) {
    const date = new Date(dateValue || "");
    const dob = String(dobValue || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!Number.isFinite(date.getTime()) || !dob) return false;
    return date.getMonth() + 1 === Number(dob[2]) && date.getDate() === Number(dob[3]);
  }

  function buildContext(state) {
    const safeState = state && typeof state === "object" ? state : {};
    const enabledGenerations = enabledGenerationNumbers(safeState);
    const enabledGenerationSet = new Set(enabledGenerations);
    const enabledIds = enabledSpeciesIds(safeState);
    const enabledIdSet = new Set(enabledIds);
    const pokedexEntries = Object.values(safeState.pokedex && typeof safeState.pokedex === "object" ? safeState.pokedex : {}).filter(Boolean);
    const pokedexById = new Map(pokedexEntries.map((entry) => [integer(entry.speciesId), entry]));
    const seenSpecies = new Set(pokedexEntries.map((entry) => integer(entry.speciesId)).filter(Boolean));
    const ownedPokemon = pokemonRecords(safeState);
    const caughtSpecies = new Set(uniqueNumbers(safeState.caughtSpeciesIds));
    const shinySpecies = new Set(uniqueNumbers(safeState.caughtShinySpeciesIds));

    for (const pokemon of ownedPokemon) {
      const speciesId = integer(pokemon?.speciesId);
      if (!speciesId) continue;
      if (pokemon?.caughtAt || pokemon?.caughtWith || Array.isArray(safeState.pc) && safeState.pc.includes(pokemon)) caughtSpecies.add(speciesId);
      if (pokemon?.shiny) shinySpecies.add(speciesId);
    }

    const enabledSeenSpecies = new Set([...seenSpecies].filter((speciesId) => enabledIdSet.has(speciesId)));
    const enabledCaughtSpecies = new Set([...caughtSpecies].filter((speciesId) => enabledIdSet.has(speciesId)));
    const enabledShinySpecies = new Set([...shinySpecies].filter((speciesId) => enabledIdSet.has(speciesId)));
    const pc = Array.isArray(safeState.pc) ? safeState.pc.filter(Boolean) : [];
    const pcByUid = new Map(pc.map((pokemon) => [String(pokemon?.uid || ""), pokemon]));
    const team = (Array.isArray(safeState.team) ? safeState.team : []).map((uid) => pcByUid.get(String(uid))).filter(Boolean).slice(0, 6);
    const partner = pcByUid.get(String(safeState.partnerUid || "")) || null;
    const statistics = safeState.statistics && typeof safeState.statistics === "object" ? safeState.statistics : {};
    const inventory = safeState.inventory && typeof safeState.inventory === "object" ? safeState.inventory : {};
    const items = safeState.items && typeof safeState.items === "object" ? safeState.items : {};
    const souvenirs = safeState.souvenirs && typeof safeState.souvenirs === "object" ? safeState.souvenirs : {};
    const competition = safeState.competition && typeof safeState.competition === "object" ? safeState.competition : {};
    const competitionLog = Array.isArray(safeState.competitionLog) ? safeState.competitionLog.filter(Boolean) : [];
    const expeditionLog = Array.isArray(safeState.expeditionLog) ? safeState.expeditionLog.filter(Boolean) : [];
    const expeditions = Array.isArray(safeState.expeditions) ? safeState.expeditions.filter(Boolean) : [];

    const caughtTypes = new Set();
    const shinyTypes = new Set();
    for (const speciesId of caughtSpecies) {
      const entry = pokedexById.get(speciesId);
      for (const type of typeList(entry)) caughtTypes.add(type);
      if (shinySpecies.has(speciesId)) for (const type of typeList(entry)) shinyTypes.add(type);
    }
    for (const pokemon of ownedPokemon) {
      for (const type of typeList(pokemon)) {
        if (caughtSpecies.has(integer(pokemon.speciesId))) caughtTypes.add(type);
        if (pokemon.shiny) shinyTypes.add(type);
      }
    }

    const caughtBallIds = new Set((Array.isArray(safeState.caughtBallIds) ? safeState.caughtBallIds : []).map(String).filter(Boolean));
    for (const pokemon of ownedPokemon) if (pokemon?.caughtWith) caughtBallIds.add(String(pokemon.caughtWith));

    const evolutionCount = ownedPokemon.reduce((total, pokemon) => total + (Array.isArray(pokemon?.evolutionHistory) ? pokemon.evolutionHistory.length : 0), 0);
    const fullyTrained = ownedPokemon.filter((pokemon) => sumObjectValues(pokemon?.evs) >= 510).length;
    const perfectIvPokemon = ownedPokemon.filter((pokemon) => STAT_KEYS.every((stat) => integer(pokemon?.ivs?.[stat]) >= 31)).length;
    const hiddenAbilityPokemon = ownedPokemon.filter((pokemon) => pokemon?.hiddenAbility === true).length;
    const maxLevel = ownedPokemon.reduce((maximum, pokemon) => Math.max(maximum, integer(pokemon?.level, 1)), 0);
    const totalLevels = ownedPokemon.reduce((total, pokemon) => total + Math.max(1, integer(pokemon?.level, 1)), 0);
    const maxEvTotal = ownedPokemon.reduce((maximum, pokemon) => Math.max(maximum, sumObjectValues(pokemon?.evs)), 0);
    const maxSingleEv = ownedPokemon.reduce((maximum, pokemon) => Math.max(maximum, ...STAT_KEYS.map((stat) => integer(pokemon?.evs?.[stat]))), 0);
    const favouriteCount = pc.filter((pokemon) => pokemon?.favorite === true).length;
    const nicknameCount = pc.filter((pokemon) => String(pokemon?.nickname || "").trim()).length;
    const shinyOwnedCount = ownedPokemon.filter((pokemon) => pokemon?.shiny === true).length;
    const uniqueOwnedSpecies = new Set(ownedPokemon.map((pokemon) => integer(pokemon?.speciesId)).filter(Boolean));
    const duplicateOwnedMaximum = Math.max(0, ...[...uniqueOwnedSpecies].map((speciesId) => ownedPokemon.filter((pokemon) => integer(pokemon?.speciesId) === speciesId).length));
    const maximumSeenCount = Math.max(0, ...pokedexEntries.map((entry) => integer(entry?.seen)));
    const maximumShinySeenCount = Math.max(0, ...pokedexEntries.map((entry) => integer(entry?.shinySeen)));
    const totalShinySeen = pokedexEntries.reduce((total, entry) => total + integer(entry?.shinySeen), 0);
    const duplicateCatches = Math.max(0, integer(statistics.pokemonCaught) - caughtSpecies.size);
    const ownedTypeSet = new Set(ownedPokemon.flatMap(typeList));
    const teamTypeSet = new Set(team.flatMap(typeList));
    const teamGenerations = new Set(team.map((pokemon) => generationForSpecies(pokemon?.speciesId)).filter(Boolean));
    const sameTypeTeam = team.length === 6 && TYPES.some((type) => team.every((pokemon) => typeList(pokemon).includes(type)));
    const allDifferentTeamSpecies = team.length === 6 && new Set(team.map((pokemon) => integer(pokemon?.speciesId))).size === 6;
    const allFavouriteTeam = team.length === 6 && team.every((pokemon) => pokemon?.favorite === true);
    const allShinyTeam = team.length === 6 && team.every((pokemon) => pokemon?.shiny === true);
    const allLevelHundredTeam = team.length === 6 && team.every((pokemon) => integer(pokemon?.level) >= 100);
    const livingEnabledDex = enabledIds.every((speciesId) => uniqueOwnedSpecies.has(speciesId));

    const expeditionBatchSizes = new Map();
    for (const entry of expeditions) {
      const key = String(entry?.batchId || `${entry?.returnAt || 0}-${entry?.locationId || ""}`);
      expeditionBatchSizes.set(key, (expeditionBatchSizes.get(key) || 0) + 1);
    }
    const largestActiveBatch = Math.max(0, ...expeditionBatchSizes.values());
    const enabledExpeditionLocationsTarget = enabledGenerations.length * 5;
    const enabledRegions = new Set(enabledGenerations.map((generation) => generationRecord(generation).region));
    const visitedLocations = new Set(expeditionLog
      .filter((entry) => enabledRegions.has(String(entry?.region || "")))
      .map((entry) => String(entry?.locationName || ""))
      .filter(Boolean));
    for (const entry of expeditions) if (enabledGenerationSet.has(integer(entry?.generation))) visitedLocations.add(String(entry?.locationName || ""));
    const rivalPlayerWins = Object.values(competition?.rivals && typeof competition.rivals === "object" ? competition.rivals : {})
      .map((rival) => integer(rival?.playerWins));
    const highestRivalWins = Math.max(0, ...rivalPlayerWins);
    const wonDifficulties = new Set(competitionLog.filter((entry) => entry?.won === true).map((entry) => String(entry?.difficultyId || "")));
    const wonLeagues = new Set(competitionLog.filter((entry) => entry?.won === true).map((entry) => String(entry?.leagueId || "")));
    const wonStats = new Set([
      ...Object.entries(statistics.competitionWinsByStat && typeof statistics.competitionWinsByStat === "object" ? statistics.competitionWinsByStat : {})
        .filter(([, count]) => integer(count) > 0)
        .map(([stat]) => stat),
      ...competitionLog.filter((entry) => entry?.won === true).map((entry) => String(entry?.stat || ""))
    ].filter((stat) => STAT_KEYS.includes(stat)));

    const ownedPlateCount = Object.entries(items).filter(([itemId, count]) => itemId.endsWith("-plate") && integer(count) > 0).length;
    const ownedItemKinds = Object.values(items).filter((count) => integer(count) > 0).length
      + Object.values(inventory).filter((count) => integer(count) > 0).length
      + Object.values(souvenirs).filter((count) => integer(count) > 0).length;
    const totalBagItems = sumObjectValues(items) + sumObjectValues(inventory) + sumObjectValues(souvenirs);
    const totalBalls = ["poke-ball", "premier-ball", "great-ball", "ultra-ball", "master-ball"].reduce((total, ball) => total + integer(inventory[ball]), 0);

    const birthdayCatches = ownedPokemon.filter((pokemon) => pokemon?.caughtAt && dateMatchesDob(pokemon.caughtAt, safeState.player?.dob));
    const midnightCatches = ownedPokemon.filter((pokemon) => {
      const caughtAt = new Date(pokemon?.caughtAt || "");
      return Number.isFinite(caughtAt.getTime()) && caughtAt.getHours() === 0;
    });
    const hatcheryAgeDays = isoAgeDays(safeState.player?.createdAt);
    const oldestPartnerDays = partner ? isoAgeDays(partner.caughtAt || partner.encounteredAt) : 0;

    return {
      state: safeState,
      enabledGenerations,
      enabledGenerationSet,
      enabledIds,
      enabledIdSet,
      enabledSeenSpecies,
      enabledCaughtSpecies,
      enabledShinySpecies,
      seenSpecies,
      caughtSpecies,
      shinySpecies,
      pokedexEntries,
      pokedexById,
      pc,
      ownedPokemon,
      uniqueOwnedSpecies,
      team,
      partner,
      statistics,
      inventory,
      items,
      souvenirs,
      competition,
      competitionLog,
      expeditions,
      expeditionLog,
      caughtTypes,
      shinyTypes,
      caughtBallIds,
      evolutionCount,
      fullyTrained,
      perfectIvPokemon,
      hiddenAbilityPokemon,
      maxLevel,
      totalLevels,
      maxEvTotal,
      maxSingleEv,
      favouriteCount,
      nicknameCount,
      shinyOwnedCount,
      duplicateOwnedMaximum,
      maximumSeenCount,
      maximumShinySeenCount,
      totalShinySeen,
      duplicateCatches,
      ownedTypeSet,
      teamTypeSet,
      teamGenerations,
      sameTypeTeam,
      allDifferentTeamSpecies,
      allFavouriteTeam,
      allShinyTeam,
      allLevelHundredTeam,
      livingEnabledDex,
      largestActiveBatch,
      enabledExpeditionLocationsTarget,
      visitedLocations,
      highestRivalWins,
      wonDifficulties,
      wonLeagues,
      wonStats,
      ownedPlateCount,
      ownedItemKinds,
      totalBagItems,
      totalBalls,
      birthdayCatches,
      midnightCatches,
      hatcheryAgeDays,
      oldestPartnerDays
    };
  }

  function rarityForIndex(index, total) {
    const ratio = total <= 1 ? 1 : index / (total - 1);
    if (ratio >= 0.92) return "legendary";
    if (ratio >= 0.72) return "epic";
    if (ratio >= 0.45) return "rare";
    if (ratio >= 0.2) return "uncommon";
    return "common";
  }

  function rewardForRarity(rarity) {
    return { common: 50, uncommon: 100, rare: 250, epic: 500, legendary: 1000 }[rarity] || 50;
  }

  function plural(value, singular, pluralValue = `${singular}s`) {
    return `${integer(value).toLocaleString()} ${integer(value) === 1 ? singular : pluralValue}`;
  }

  function achievement({
    id,
    category,
    title,
    description,
    current,
    target = 1,
    unit = "",
    rarity = "common",
    reward,
    generation = 0,
    secret = false
  }) {
    const safeTarget = Math.max(1, number(target, 1));
    const safeCurrent = Math.max(0, number(current, 0));
    return {
      id: String(id),
      category,
      title,
      description,
      current: Math.min(safeCurrent, safeTarget),
      rawCurrent: safeCurrent,
      target: safeTarget,
      unit,
      rarity: RARITY_ORDER.includes(rarity) ? rarity : "common",
      reward: Math.max(0, integer(reward ?? rewardForRarity(rarity))),
      generation: integer(generation),
      secret: secret === true,
      unlocked: safeCurrent >= safeTarget
    };
  }

  function addMilestoneFamily(list, context, configuration) {
    const milestones = configuration.milestones.filter((target) => !configuration.maximum || target <= configuration.maximum);
    milestones.forEach((target, index) => {
      const rarity = configuration.rarity ? configuration.rarity(target, index, milestones) : rarityForIndex(index, milestones.length);
      const title = configuration.titles?.[index] || `${configuration.titlePrefix} ${target.toLocaleString()}`;
      const description = typeof configuration.description === "function"
        ? configuration.description(target)
        : configuration.description;
      list.push(achievement({
        id: `${configuration.idPrefix}_${target}`,
        category: configuration.category,
        title,
        description,
        current: typeof configuration.current === "function" ? configuration.current(context) : configuration.current,
        target,
        unit: configuration.unit || "",
        rarity,
        reward: configuration.reward ? configuration.reward(target, index, rarity) : undefined
      }));
    });
  }

  function generationProgress(context, generation, sourceSet) {
    const record = generationRecord(generation);
    let count = 0;
    for (let speciesId = record.start; speciesId <= record.end; speciesId += 1) {
      if (sourceSet.has(speciesId)) count += 1;
    }
    return count;
  }

  function addFractionAchievement(list, options) {
    const target = Math.max(1, Math.ceil(options.total * options.fraction));
    const percent = Math.round(options.fraction * 100);
    list.push(achievement({
      id: options.id,
      category: options.category,
      title: options.title,
      description: options.description,
      current: options.current,
      target,
      unit: `${percent}%`,
      rarity: options.rarity,
      reward: options.reward,
      generation: options.generation
    }));
  }

  function buildCatalogue(state) {
    const context = buildContext(state);
    const list = [];
    const enabledTotal = context.enabledIds.length;

    addMilestoneFamily(list, context, {
      idPrefix: "eggs_hatched",
      category: "hatchery",
      milestones: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      current: (ctx) => integer(ctx.statistics.eggsHatched),
      titles: ["First Crack", "Tiny Clutch", "Ten Warm Shells", "Nest Keeper", "Half-Century Hatchery", "Shell Scholar", "Incubator Regular", "Professional Peeping", "A Thousand Hellos", "Eggs for Days", "The Great Hatchening", "Ten Thousand Tiny Footsteps"],
      description: (target) => `Hatch ${target.toLocaleString()} eggs.`
    });

    addMilestoneFamily(list, context, {
      idPrefix: "eggs_laid",
      category: "hatchery",
      milestones: [1, 10, 50, 100, 500, 1000, 5000],
      current: (ctx) => integer(ctx.statistics.eggsLaid),
      titles: ["A Place on the Cushion", "Clutch Planner", "Fifty Reservations", "Full Nest Ledger", "Industrial Cosiness", "Egg Logistics", "Impossible Omelette"],
      description: (target) => `Place ${target.toLocaleString()} eggs into the hatchery sequence.`
    });

    addMilestoneFamily(list, context, {
      idPrefix: "eggs_bought",
      category: "hatchery",
      milestones: [1, 10, 50, 250, 1000],
      current: (ctx) => integer(ctx.statistics.eggsBought),
      titles: ["Pocket Money Egg", "Repeat Customer", "Carton Collector", "Wholesale Warmth", "Eggconomist"],
      description: (target) => `Buy ${target.toLocaleString()} eggs.`
    });

    addMilestoneFamily(list, context, {
      idPrefix: "repel_saves",
      category: "hatchery",
      milestones: [1, 5, 25, 100],
      current: (ctx) => integer(ctx.statistics.eggsProtectedByRepel),
      titles: ["Not Today, Snake", "Repel Regular", "Security Blanket", "Impenetrable Nest"],
      description: (target) => `Protect ${target.toLocaleString()} eggs with Repels.`
    });

    addMilestoneFamily(list, context, {
      idPrefix: "partner_saves",
      category: "hatchery",
      milestones: [1, 5, 25, 100],
      current: (ctx) => integer(ctx.statistics.eggsProtectedByPartner),
      titles: ["Good Lookout", "Nest Guard", "Watchful Best Friend", "Guardian of the Clutch"],
      description: (target) => `Have your partner defend ${target.toLocaleString()} eggs.`
    });

    addMilestoneFamily(list, context, {
      idPrefix: "predator_attempts",
      category: "hatchery",
      milestones: [1, 10, 50, 250],
      current: (ctx) => integer(ctx.statistics.eggConsumptionAttempts),
      titles: ["Something in the Grass", "Persistent Visitors", "Nest Under Siege", "The Breakfast Wars"],
      description: (target) => `Survive ${target.toLocaleString()} egg-predator incidents, whatever the outcome.`
    });

    list.push(achievement({
      id: "first_egg_lost",
      category: "oddities",
      title: "Breakfast for Someone Else",
      description: "Lose an egg to a hungry visitor. Unfortunate, but memorable.",
      current: integer(context.statistics.eggsLostToSnakes),
      rarity: "rare",
      secret: true
    }));

    [2, 3, 5].forEach((capacity, index) => list.push(achievement({
      id: `incubator_capacity_${capacity}`,
      category: "hatchery",
      title: ["Room for Another", "Three-Nest Shuffle", "Full Incubator Wing"][index],
      description: `Expand the hatchery to ${capacity} incubator slots.`,
      current: integer(context.state.incubators?.capacity),
      target: capacity,
      rarity: ["uncommon", "rare", "epic"][index]
    })));

    const occupiedIncubators = (Array.isArray(context.state.incubators?.slots) ? context.state.incubators.slots : [])
      .filter((slot) => slot?.egg || slot?.encounter).length;
    list.push(achievement({
      id: "every_incubator_busy",
      category: "hatchery",
      title: "No Empty Cushions",
      description: "Have every unlocked incubator occupied at the same time.",
      current: occupiedIncubators,
      target: Math.max(1, integer(context.state.incubators?.capacity, 1)),
      rarity: "rare"
    }));

    const uniqueMilestones = [1, 10, 25, 50, 100, 150, 250, 500, 750, 1000].filter((target) => target <= enabledTotal);
    addMilestoneFamily(list, context, {
      idPrefix: "species_seen",
      category: "collection",
      milestones: uniqueMilestones,
      maximum: enabledTotal,
      current: () => context.enabledSeenSpecies.size,
      titles: ["Opening Page", "Ten Familiar Faces", "Field Journal Begins", "Fifty First Meetings", "Century of Species", "A Very Full Notebook", "Quarter-Thousand Encounters", "Five Hundred Field Notes", "Seven-Fifty Sightings", "Four-Digit Pokédex"],
      description: (target) => `Meet ${target.toLocaleString()} different species from enabled generations.`
    });
    addMilestoneFamily(list, context, {
      idPrefix: "species_caught",
      category: "collection",
      milestones: uniqueMilestones,
      maximum: enabledTotal,
      current: () => context.enabledCaughtSpecies.size,
      titles: ["First Resident", "Ten Safe Arrivals", "Pocket Community", "Fifty Friends", "Century Club", "PC Cartographer", "Quarter-Thousand Companions", "Five Hundred Poké Balls Later", "Seven-Fifty Residents", "A Thousand Successful Clicks"],
      description: (target) => `Catch ${target.toLocaleString()} different species from enabled generations.`
    });

    [
      { fraction: 0.25, label: "Quarter", rarity: "uncommon" },
      { fraction: 0.5, label: "Half", rarity: "rare" },
      { fraction: 0.75, label: "Three-Quarter", rarity: "epic" },
      { fraction: 1, label: "Complete", rarity: "legendary" }
    ].forEach((stage) => {
      addFractionAchievement(list, {
        id: `enabled_dex_seen_${Math.round(stage.fraction * 100)}`,
        category: "collection",
        title: `${stage.label} Field Guide`,
        description: `Meet ${Math.round(stage.fraction * 100)}% of all species in the currently enabled generations.`,
        current: context.enabledSeenSpecies.size,
        total: enabledTotal,
        fraction: stage.fraction,
        rarity: stage.rarity
      });
      addFractionAchievement(list, {
        id: `enabled_dex_caught_${Math.round(stage.fraction * 100)}`,
        category: "collection",
        title: `${stage.label} Living Record`,
        description: `Catch ${Math.round(stage.fraction * 100)}% of all species in the currently enabled generations.`,
        current: context.enabledCaughtSpecies.size,
        total: enabledTotal,
        fraction: stage.fraction,
        rarity: stage.rarity
      });
    });

    list.push(achievement({
      id: "all_enabled_seen",
      category: "collection",
      title: "Every Invited Species",
      description: "Meet every Pokémon belonging to the currently enabled generations. Disabled generations never count against this.",
      current: context.enabledSeenSpecies.size,
      target: enabledTotal,
      rarity: "legendary",
      reward: 5000
    }));
    list.push(achievement({
      id: "all_enabled_caught",
      category: "collection",
      title: "Complete Enabled Collection",
      description: "Catch every Pokémon belonging to the currently enabled generations. Disabled generations never count against this.",
      current: context.enabledCaughtSpecies.size,
      target: enabledTotal,
      rarity: "legendary",
      reward: 10000
    }));
    list.push(achievement({
      id: "living_enabled_dex",
      category: "collection",
      title: "Everyone Is Actually Here",
      description: "Keep one of every enabled-generation species in the PC or out on expedition at the same time.",
      current: context.livingEnabledDex ? enabledTotal : context.uniqueOwnedSpecies.size,
      target: enabledTotal,
      rarity: "legendary",
      reward: 15000
    }));

    [2, 5, 10, 25, 100].forEach((target, index) => list.push(achievement({
      id: `same_species_seen_${target}`,
      category: "oddities",
      title: ["Déjà Vu", "Familiar Face", "We Keep Meeting Like This", "Local Celebrity", "Please Stop Hatching Rattata"][index],
      description: `Meet the same species ${target} times.`,
      current: context.maximumSeenCount,
      target,
      rarity: rarityForIndex(index, 5)
    })));

    [1, 10, 50, 250, 1000].forEach((target, index) => list.push(achievement({
      id: `duplicate_catches_${target}`,
      category: "oddities",
      title: ["Two of a Kind", "Spare Poké Balls", "Duplicate Department", "The Box Has Sections", "One Thousand Encores"][index],
      description: `Record ${target.toLocaleString()} catches beyond your unique-species total.`,
      current: context.duplicateCatches,
      target,
      rarity: rarityForIndex(index, 5)
    })));

    TYPES.forEach((type, index) => {
      list.push(achievement({
        id: `caught_type_${type}`,
        category: "collection",
        title: `${type.charAt(0).toUpperCase()}${type.slice(1)} Introduction`,
        description: `Catch a ${type}-type Pokémon.`,
        current: context.caughtTypes.has(type) ? 1 : 0,
        rarity: index < 9 ? "common" : "uncommon"
      }));
    });

    [6, 12, 18].forEach((target, index) => list.push(achievement({
      id: `type_variety_${target}`,
      category: "collection",
      title: ["Type Sampler", "Elemental Eclectic", "Every Type of Friend"][index],
      description: `Catch Pokémon representing ${target} different types.`,
      current: context.caughtTypes.size,
      target,
      rarity: ["uncommon", "rare", "epic"][index]
    })));

    [2, 3, 4, 5].forEach((target, index) => list.push(achievement({
      id: `ball_variety_${target}`,
      category: "collection",
      title: ["Different Tools", "Ball Drawer", "Prepared for Anything", "Every Kind of Click"][index],
      description: `Successfully use ${target} different kinds of Poké Ball.`,
      current: context.caughtBallIds.size,
      target,
      rarity: ["common", "uncommon", "rare", "epic"][index]
    })));

    addMilestoneFamily(list, context, {
      idPrefix: "shiny_species",
      category: "shiny",
      milestones: [1, 2, 5, 10, 25, 50, 100],
      current: () => context.enabledShinySpecies.size,
      titles: ["A Different Sparkle", "Double Glint", "Shiny Handful", "Ten Tiny Miracles", "Prismatic PC", "Fifty Rare Colours", "Century of Sparkles"],
      description: (target) => `Catch ${target} different shiny species from enabled generations.`
    });

    addMilestoneFamily(list, context, {
      idPrefix: "shiny_sightings",
      category: "shiny",
      milestones: [1, 5, 25, 100, 500],
      current: () => context.totalShinySeen,
      titles: ["Did That Just Sparkle?", "Glitter in the Journal", "Shiny Season", "One Hundred Flashes", "Retina Insurance"],
      description: (target) => `Record ${target.toLocaleString()} shiny hatch sightings.`
    });

    [2, 5, 10].forEach((target, index) => list.push(achievement({
      id: `same_shiny_seen_${target}`,
      category: "shiny",
      title: ["Lightning Twice", "Favourite Alternate Palette", "The Same Impossibly Rare Friend"][index],
      description: `Meet the same shiny species ${target} times.`,
      current: context.maximumShinySeenCount,
      target,
      rarity: ["rare", "epic", "legendary"][index]
    })));

    TYPES.forEach((type) => list.push(achievement({
      id: `shiny_type_${type}`,
      category: "shiny",
      title: `Shining ${type.charAt(0).toUpperCase()}${type.slice(1)}`,
      description: `Catch a shiny Pokémon with the ${type} type.`,
      current: context.shinyTypes.has(type) ? 1 : 0,
      rarity: "rare"
    })));

    addMilestoneFamily(list, context, {
      idPrefix: "shiny_charm_uses",
      category: "shiny",
      milestones: [1, 3, 10, 25, 100],
      current: (ctx) => integer(ctx.statistics.shinyCharmUses),
      titles: ["Polished Charm", "Three Lucky Eggs", "Charm Routine", "Glitter Budget", "Shiny Industrial Complex"],
      description: (target) => `Use Shiny Charm coverage on ${target} eggs.`
    });

    list.push(achievement({
      id: "full_shiny_team",
      category: "shiny",
      title: "Six Different Kinds of Dazzling",
      description: "Register a full six-Pokémon team where every member is shiny.",
      current: context.allShinyTeam ? 6 : context.team.filter((pokemon) => pokemon?.shiny).length,
      target: 6,
      rarity: "legendary",
      reward: 3000
    }));

    addMilestoneFamily(list, context, {
      idPrefix: "pc_size",
      category: "companions",
      milestones: [1, 6, 12, 30, 60, 100, 250, 500],
      current: () => context.pc.length,
      titles: ["PC Online", "A Proper Team", "Two Teams and a Spare", "Busy Box", "Box Full of Footsteps", "One Hundred Residents", "Quarter-Thousand Roommates", "The PC Needs a Map"],
      description: (target) => `Keep ${target.toLocaleString()} Pokémon in the PC.`
    });

    [1, 6, 25, 100].forEach((target, index) => list.push(achievement({
      id: `favourites_${target}`,
      category: "companions",
      title: ["Little Star", "Favourite Team", "No, They Are All Special", "The Star Button Is Worn Out"][index],
      description: `Mark ${target} PC Pokémon as favourites.`,
      current: context.favouriteCount,
      target,
      rarity: rarityForIndex(index, 4)
    })));

    [1, 6, 25, 100].forEach((target, index) => list.push(achievement({
      id: `nicknames_${target}`,
      category: "companions",
      title: ["A Name of Their Own", "Roll Call", "Nickname Department", "Creative Writing Degree"][index],
      description: `Give ${target} PC Pokémon nicknames.`,
      current: context.nicknameCount,
      target,
      rarity: rarityForIndex(index, 4)
    })));

    list.push(achievement({
      id: "choose_partner",
      category: "companions",
      title: "Someone to Watch the Nest",
      description: "Choose a partner Pokémon.",
      current: context.partner ? 1 : 0,
      rarity: "common"
    }));
    list.push(achievement({
      id: "shiny_partner",
      category: "companions",
      title: "Sparkling Lookout",
      description: "Choose a shiny Pokémon as your partner.",
      current: context.partner?.shiny ? 1 : 0,
      rarity: "rare"
    }));
    list.push(achievement({
      id: "century_partner",
      category: "companions",
      title: "Veteran Lookout",
      description: "Choose a level 100 Pokémon as your partner.",
      current: integer(context.partner?.level),
      target: 100,
      rarity: "epic"
    }));
    list.push(achievement({
      id: "month_long_partner",
      category: "companions",
      title: "Old Friends at the Window",
      description: "Keep a partner you first met at least 30 days ago.",
      current: context.oldestPartnerDays,
      target: 30,
      rarity: "rare"
    }));

    list.push(achievement({
      id: "full_team",
      category: "companions",
      title: "Six Cards on the Table",
      description: "Register a full team of six.",
      current: context.team.length,
      target: 6,
      rarity: "uncommon"
    }));
    list.push(achievement({
      id: "different_species_team",
      category: "companions",
      title: "No Repeats",
      description: "Register six different species on one team.",
      current: context.allDifferentTeamSpecies ? 6 : new Set(context.team.map((pokemon) => integer(pokemon?.speciesId))).size,
      target: 6,
      rarity: "rare"
    }));
    list.push(achievement({
      id: "same_type_team",
      category: "companions",
      title: "Monotype Club",
      description: "Register a full team where all six Pokémon share at least one type.",
      current: context.sameTypeTeam ? 6 : 0,
      target: 6,
      rarity: "epic"
    }));
    list.push(achievement({
      id: "all_favourite_team",
      category: "companions",
      title: "The Favourites Favourites",
      description: "Register a full team and favourite every member.",
      current: context.allFavouriteTeam ? 6 : context.team.filter((pokemon) => pokemon?.favorite).length,
      target: 6,
      rarity: "rare"
    }));
    list.push(achievement({
      id: "team_type_variety_12",
      category: "companions",
      title: "Coverage Chart",
      description: "Build a six-Pokémon team representing at least 12 different types.",
      current: context.teamTypeSet.size,
      target: 12,
      rarity: "epic"
    }));
    if (context.enabledGenerations.length >= 2) {
      list.push(achievement({
        id: "team_many_generations",
        category: "companions",
        title: "Across the Eras",
        description: `Register a team containing Pokémon from ${Math.min(6, context.enabledGenerations.length)} different enabled generations.`,
        current: context.teamGenerations.size,
        target: Math.min(6, context.enabledGenerations.length),
        rarity: "rare"
      }));
    }

    [10, 25, 50, 75, 100].forEach((target, index) => list.push(achievement({
      id: `max_level_${target}`,
      category: "training",
      title: ["Getting Stronger", "Quarter Century Level", "Halfway to the Cap", "Seasoned Battler", "Level One Hundred"][index],
      description: `Raise a Pokémon to level ${target}.`,
      current: context.maxLevel,
      target,
      rarity: rarityForIndex(index, 5)
    })));

    [50, 100, 300, 600, 1000, 5000].forEach((target, index) => list.push(achievement({
      id: `combined_levels_${target}`,
      category: "training",
      title: ["A Little Experience", "Three Digits of Training", "Experienced Household", "Six-Hundred Level Ledger", "A Thousand Levels", "Five Thousand Levels Under One Roof"][index],
      description: `Reach ${target.toLocaleString()} combined levels across owned Pokémon.`,
      current: context.totalLevels,
      target,
      rarity: rarityForIndex(index, 6)
    })));

    [1, 100, 252, 510].forEach((target, index) => list.push(achievement({
      id: `ev_total_${target}`,
      category: "training",
      title: ["First Berry Lesson", "Training Takes Shape", "Serious Specialist", "Fully Trained"][index],
      description: `Reach ${target} total training points on one Pokémon.`,
      current: context.maxEvTotal,
      target,
      rarity: ["common", "uncommon", "rare", "epic"][index]
    })));

    list.push(achievement({
      id: "max_single_ev",
      category: "training",
      title: "Specialist Subject",
      description: "Raise one training stat to 252.",
      current: context.maxSingleEv,
      target: 252,
      rarity: "rare"
    }));

    [1, 6, 25].forEach((target, index) => list.push(achievement({
      id: `fully_trained_${target}`,
      category: "training",
      title: ["Training Complete", "Fully Trained Team", "Fitness Department"][index],
      description: `Fully train ${target} Pokémon to the 510-point cap.`,
      current: context.fullyTrained,
      target,
      rarity: ["rare", "epic", "legendary"][index]
    })));

    [1, 6, 25].forEach((target, index) => list.push(achievement({
      id: `perfect_iv_${target}`,
      category: "training",
      title: ["Perfect Little Numbers", "Flawless Team", "Statistical Impossibility"][index],
      description: `Own ${target} Pokémon with perfect IVs in every stat.`,
      current: context.perfectIvPokemon,
      target,
      rarity: ["rare", "epic", "legendary"][index]
    })));

    [1, 6, 25].forEach((target, index) => list.push(achievement({
      id: `hidden_ability_${target}`,
      category: "training",
      title: ["Hidden Talent", "Secret Skill Team", "Ability Research Wing"][index],
      description: `Own ${target} Pokémon with hidden abilities.`,
      current: context.hiddenAbilityPokemon,
      target,
      rarity: ["uncommon", "rare", "epic"][index]
    })));

    [1, 10, 50, 250].forEach((target, index) => list.push(achievement({
      id: `evolutions_${target}`,
      category: "training",
      title: ["Something Is Happening", "Evolution Notes", "Transformation Specialist", "Evolutionary Biologist"][index],
      description: `Record ${target} evolutions across owned Pokémon.`,
      current: context.evolutionCount,
      target,
      rarity: rarityForIndex(index, 4)
    })));

    list.push(achievement({
      id: "double_evolution",
      category: "training",
      title: "Three Stages, One Friend",
      description: "Raise one Pokémon through two evolutions.",
      current: context.ownedPokemon.some((pokemon) => (pokemon?.evolutionHistory || []).length >= 2) ? 2 : context.ownedPokemon.reduce((maximum, pokemon) => Math.max(maximum, (pokemon?.evolutionHistory || []).length), 0),
      target: 2,
      rarity: "rare"
    }));
    list.push(achievement({
      id: "level_100_team",
      category: "training",
      title: "No More Levels Left",
      description: "Register a full team of six level 100 Pokémon.",
      current: context.allLevelHundredTeam ? 6 : context.team.filter((pokemon) => integer(pokemon?.level) >= 100).length,
      target: 6,
      rarity: "legendary",
      reward: 5000
    }));

    addMilestoneFamily(list, context, {
      idPrefix: "expeditions_started",
      category: "expeditions",
      milestones: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
      current: (ctx) => integer(ctx.statistics.expeditionsStarted),
      titles: ["Out the Gate", "Field Team", "Ten Departures", "Well-Used Map", "Packed Lunch Expert", "Hundred Routes", "Quarter-Thousand Clipboards", "Five Hundred Farewells", "Expedition Office"],
      description: (target) => `Send Pokémon on ${target.toLocaleString()} individual expeditions.`
    });
    addMilestoneFamily(list, context, {
      idPrefix: "expeditions_completed",
      category: "expeditions",
      milestones: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
      current: (ctx) => integer(ctx.statistics.expeditionsCompleted),
      titles: ["Welcome Back", "Mud on the Carpet", "Ten Safe Returns", "Field-Tested", "Souvenir Shelf", "Hundred Homecomings", "Seasoned Scouts", "Five Hundred Return Stamps", "Every Road Feels Familiar"],
      description: (target) => `Complete ${target.toLocaleString()} individual expeditions.`
    });

    [1, 6, 12, 25, 50].forEach((target, index) => list.push(achievement({
      id: `active_expeditions_${target}`,
      category: "expeditions",
      title: ["One in the Field", "Full Field Party", "Double Caravan", "Very Busy Clipboard", "Nobody Is Home"][index],
      description: `Have ${target} Pokémon away on expeditions at once.`,
      current: context.expeditions.length,
      target,
      rarity: rarityForIndex(index, 5)
    })));

    [2, 6, 12, 25].forEach((target, index) => list.push(achievement({
      id: `expedition_batch_${target}`,
      category: "expeditions",
      title: ["Travel Buddies", "Caravan of Six", "Field Trip", "Mass Departure"][index],
      description: `Send a synchronized expedition group containing ${target} Pokémon.`,
      current: context.largestActiveBatch,
      target,
      rarity: ["common", "uncommon", "rare", "epic"][index]
    })));

    [1, 5, 15, 30, 45].filter((target) => target <= context.enabledExpeditionLocationsTarget).forEach((target, index, values) => list.push(achievement({
      id: `expedition_locations_${target}`,
      category: "expeditions",
      title: ["First Pin in the Map", "Regional Rambler", "Route Collector", "Atlas Annotator", "Every Expedition Desk Stamp"][index],
      description: `Visit ${target} different expedition locations.`,
      current: context.visitedLocations.size,
      target,
      rarity: rarityForIndex(index, values.length)
    })));

    list.push(achievement({
      id: "all_enabled_expedition_locations",
      category: "expeditions",
      title: "Every Enabled Road",
      description: "Visit all five expedition locations for every currently enabled generation.",
      current: context.visitedLocations.size,
      target: context.enabledExpeditionLocationsTarget,
      rarity: "legendary",
      reward: 3000
    }));

    [1, 10, 50, 100, 250, 1000].forEach((target, index) => list.push(achievement({
      id: `berries_used_${target}`,
      category: "training",
      title: ["Berry Lesson", "Berry Basket", "Nutrition Plan", "Hundred Berry Workout", "Vitamin Orchard", "One Thousand Tiny Snacks"][index],
      description: `Use ${target.toLocaleString()} berries for training.`,
      current: integer(context.statistics.berriesUsed),
      target,
      rarity: rarityForIndex(index, 6)
    })));

    [1, 10, 50, 100, 250, 1000].forEach((target, index) => list.push(achievement({
      id: `keepsakes_found_${target}`,
      category: "expeditions",
      title: ["Pocket Treasure", "Souvenir Drawer", "Field Curio Cabinet", "Hundred Keepsakes", "Museum Gift Shop", "The Shelf Has Structural Problems"][index],
      description: `Find ${target.toLocaleString()} expedition keepsakes.`,
      current: integer(context.statistics.keepsakesFound),
      target,
      rarity: rarityForIndex(index, 6)
    })));
    [1, 10, 50, 100, 250].forEach((target, index) => list.push(achievement({
      id: `keepsakes_sold_${target}`,
      category: "economy",
      title: ["Small Sale", "Souvenir Stall", "Curio Merchant", "Hundred Little Transactions", "Antique Roadshow"][index],
      description: `Sell ${target.toLocaleString()} expedition keepsakes.`,
      current: integer(context.statistics.keepsakesSold),
      target,
      rarity: rarityForIndex(index, 5)
    })));

    addMilestoneFamily(list, context, {
      idPrefix: "competition_wins",
      category: "competitions",
      milestones: [1, 5, 10, 25, 50, 100, 250, 500],
      current: (ctx) => integer(ctx.statistics.competitionsWon),
      titles: ["First Ribbon", "Judges Remember You", "Ten Showcases", "Competitive Regular", "Fifty Victories", "Century of Applause", "Quarter-Thousand Ribbons", "The Trophy Room Is Full"],
      description: (target) => `Win ${target.toLocaleString()} competitions.`
    });

    [1, 5, 10, 25, 50, 100, 250].forEach((target, index) => list.push(achievement({
      id: `competition_entries_${target}`,
      category: "competitions",
      title: ["Step onto the Floor", "Known at Registration", "Ten Entry Fees", "Showcase Calendar", "Fifty Lineups", "Hundred Competitions Entered", "Permanent Judge Clipboard"][index],
      description: `Enter ${target.toLocaleString()} competitions.`,
      current: integer(context.competition.totalEntries),
      target,
      rarity: rarityForIndex(index, 7)
    })));

    [1100, 1250, 1500, 1800, 2200, 3000, 4000].forEach((target, index) => list.push(achievement({
      id: `peak_rating_${target}`,
      category: "competitions",
      title: ["Rating Rises", "Serious Contender", "Regional Reputation", "Gold Standard", "Master-Class Notes", "Three-Thousand Club", "Untouchable Scorecard"][index],
      description: `Reach a peak competition rating of ${target}.`,
      current: integer(context.competition.peakRating || context.competition.rating),
      target,
      rarity: rarityForIndex(index, 7)
    })));

    [2, 3, 5, 10, 20, 50].forEach((target, index) => list.push(achievement({
      id: `competition_streak_${target}`,
      category: "competitions",
      title: ["Back-to-Back", "Hat Trick", "Five in a Row", "Unbroken Ten", "Twenty-Ribbon Run", "Judges Have Given Up Pretending"][index],
      description: `Reach a ${target}-win competition streak.`,
      current: integer(context.competition.winStreak),
      target,
      rarity: rarityForIndex(index, 6)
    })));

    list.push(achievement({
      id: "all_contest_stats",
      category: "competitions",
      title: "Every Kind of Excellent",
      description: "Win at least one competition in all six judging stats.",
      current: context.wonStats.size,
      target: 6,
      rarity: "epic"
    }));
    list.push(achievement({
      id: "expert_win",
      category: "competitions",
      title: "No Training Wheels",
      description: "Win an Expert-difficulty competition.",
      current: context.wonDifficulties.has("expert") ? 1 : 0,
      rarity: "epic"
    }));
    list.push(achievement({
      id: "league_variety_4",
      category: "competitions",
      title: "Climbing the Noticeboard",
      description: "Win in four different competition leagues.",
      current: context.wonLeagues.size,
      target: 4,
      rarity: "epic"
    }));
    [1, 5, 10, 25].forEach((target, index) => list.push(achievement({
      id: `rival_wins_${target}`,
      category: "competitions",
      title: ["Rivalry Begins", "Same Rival, Same Result", "Personal Nemesis", "They Know Your Team by Heart"][index],
      description: `Defeat the same persistent rival ${target} times.`,
      current: context.highestRivalWins,
      target,
      rarity: rarityForIndex(index, 4)
    })));

    [500, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 1000000].forEach((target, index) => list.push(achievement({
      id: `money_${target}`,
      category: "economy",
      title: ["Pocket Change", "Four Figures", "Comfortable Cushion Fund", "Five-Digit Wallet", "Serious Savings", "Hatchery Reserve", "Six Figures", "Quarter-Million Pokédollars", "Pokémillionaire"][index],
      description: `Hold ₽${target.toLocaleString()} at one time.`,
      current: integer(context.state.money),
      target,
      rarity: rarityForIndex(index, 9)
    })));

    [10, 50, 100, 500, 1000, 5000].forEach((target, index) => list.push(achievement({
      id: `poke_balls_bought_${target}`,
      category: "economy",
      title: ["Restocked", "Ball Crate", "Bulk Order", "Warehouse Receipt", "One Thousand Red Tops", "Pokémart's Favourite Customer"][index],
      description: `Buy ${target.toLocaleString()} Poké Balls.`,
      current: integer(context.statistics.pokeBallsBought),
      target,
      rarity: rarityForIndex(index, 6)
    })));

    [1, 3, 10, 25].forEach((target, index) => list.push(achievement({
      id: `master_balls_found_${target}`,
      category: "economy",
      title: ["Impossible Parcel", "Purple Drawer", "Master Ball Collection", "The Daily Gift Is Showing Favouritism"][index],
      description: `Find ${target} Master Balls in daily parcels.`,
      current: integer(context.statistics.masterBallsFound),
      target,
      rarity: ["rare", "epic", "legendary", "legendary"][index]
    })));

    [10, 50, 100, 500, 1000].forEach((target, index) => list.push(achievement({
      id: `balls_in_bag_${target}`,
      category: "economy",
      title: ["Ready to Catch", "Ball Pocket Bulge", "Hundred Throws Ready", "Ball Pit", "One Thousand Chances"][index],
      description: `Hold ${target.toLocaleString()} Poké Balls across all ball types.`,
      current: context.totalBalls,
      target,
      rarity: rarityForIndex(index, 5)
    })));

    [5, 10, 25, 50, 100].forEach((target, index) => list.push(achievement({
      id: `item_kinds_${target}`,
      category: "economy",
      title: ["Useful Drawer", "Bag with Sections", "Collector's Inventory", "Field Supply Catalogue", "Everything Has a Pocket"][index],
      description: `Own ${target} different item, ball, or keepsake kinds.`,
      current: context.ownedItemKinds,
      target,
      rarity: rarityForIndex(index, 5)
    })));

    [25, 100, 500, 1000, 5000].forEach((target, index) => list.push(achievement({
      id: `bag_items_${target}`,
      category: "economy",
      title: ["Packed Bag", "Inventory Tetris", "Supply Closet", "One Thousand Things", "Bag of Holding"][index],
      description: `Hold ${target.toLocaleString()} total items across every pocket.`,
      current: context.totalBagItems,
      target,
      rarity: rarityForIndex(index, 5)
    })));

    [1, 5, 10, 17].forEach((target, index) => list.push(achievement({
      id: `plates_owned_${target}`,
      category: "economy",
      title: ["Ancient Plate", "Type Shelf", "Plate Collection", "Arceus's Dinner Service"][index],
      description: `Own ${target} different type plates.`,
      current: context.ownedPlateCount,
      target,
      rarity: ["uncommon", "rare", "epic", "legendary"][index]
    })));

    [1, 5, 10, 25, 50].forEach((target, index) => list.push(achievement({
      id: `mystery_items_${target}`,
      category: "economy",
      title: ["A Curious Relic", "Mystery Drawer", "Relic Researcher", "Legendary Filing Cabinet", "Mythology Department"][index],
      description: `Unlock ${target} Legendary Mystery Items.`,
      current: integer(context.statistics.mysteriousItemsUnlocked),
      target,
      rarity: ["uncommon", "rare", "epic", "legendary", "legendary"][index]
    })));

    [1, 5, 25, 100].forEach((target, index) => list.push(achievement({
      id: `repels_used_${target}`,
      category: "economy",
      title: ["Strong Smell", "Nest Perimeter", "Repel Budget", "The Grass Is Empty"][index],
      description: `Activate ${target} Repels.`,
      current: integer(context.statistics.repelsUsed),
      target,
      rarity: rarityForIndex(index, 4)
    })));

    [2, 3, 7, 14, 30, 60, 100, 180, 365].forEach((target, index) => list.push(achievement({
      id: `daily_streak_${target}`,
      category: "oddities",
      title: ["Came Back Tomorrow", "Three Morning Checks", "One Week Nest", "Fortnight Fieldwork", "Month of Warm Eggs", "Two-Month Routine", "One Hundred Mornings", "Half-Year Hatchery", "A Whole Year of Checking the Incubator"][index],
      description: `Reach a ${target}-day daily streak.`,
      current: integer(context.state.streak),
      target,
      rarity: rarityForIndex(index, 9)
    })));

    [1, 7, 30, 100, 365, 1000].forEach((target, index) => list.push(achievement({
      id: `hatchery_age_${target}`,
      category: "oddities",
      title: ["The First Day Is Over", "One Week Open", "Month-Old Nest", "Hundred-Day Hatchery", "First Anniversary", "Ancient Local Storage"][index],
      description: `Keep this hatchery save for ${target} days.`,
      current: context.hatcheryAgeDays,
      target,
      rarity: rarityForIndex(index, 6)
    })));

    addMilestoneFamily(list, context, {
      idPrefix: "pokemon_released",
      category: "oddities",
      milestones: [1, 5, 25, 100, 500, 1000],
      current: (ctx) => integer(ctx.statistics.pokemonReleased),
      titles: ["Gentle Goodbye", "Open Gate", "Wildlife Reintroduction", "Hundred Farewells", "Freedom Specialist", "The Wild Sends Postcards"],
      description: (target) => `Release ${target.toLocaleString()} Pokémon safely.`
    });

    [2, 6, 12].forEach((target, index) => list.push(achievement({
      id: `same_species_owned_${target}`,
      category: "oddities",
      title: ["Twins, Probably", "Entirely Intentional Team Theme", "A Very Specific Box"][index],
      description: `Own ${target} copies of the same species at once.`,
      current: context.duplicateOwnedMaximum,
      target,
      rarity: ["common", "rare", "epic"][index]
    })));

    list.push(achievement({
      id: "birthday_catch",
      category: "oddities",
      title: "Birthday Guest",
      description: "Catch a Pokémon on the month and day written on your registration card.",
      current: context.birthdayCatches.length,
      rarity: "rare",
      secret: true
    }));
    list.push(achievement({
      id: "shiny_birthday_catch",
      category: "oddities",
      title: "Birthday Sparkle",
      description: "Catch a shiny Pokémon on your birthday.",
      current: context.birthdayCatches.some((pokemon) => pokemon?.shiny) ? 1 : 0,
      rarity: "legendary",
      secret: true
    }));
    list.push(achievement({
      id: "midnight_catch",
      category: "oddities",
      title: "Midnight Click",
      description: "Catch a Pokémon between midnight and 12:59 a.m. local time.",
      current: context.midnightCatches.length,
      rarity: "rare",
      secret: true
    }));
    list.push(achievement({
      id: "all_pc_shiny",
      category: "oddities",
      title: "No Ordinary Colours Allowed",
      description: "Have at least six Pokémon in the PC and make every one of them shiny.",
      current: context.pc.length >= 6 && context.pc.every((pokemon) => pokemon?.shiny) ? context.pc.length : context.pc.filter((pokemon) => pokemon?.shiny).length,
      target: Math.max(6, context.pc.length),
      rarity: "legendary",
      secret: true
    }));

    for (const generation of context.enabledGenerations) {
      const record = generationRecord(generation);
      const generationTotal = record.end - record.start + 1;
      const seen = generationProgress(context, generation, context.seenSpecies);
      const caught = generationProgress(context, generation, context.caughtSpecies);
      const shiny = generationProgress(context, generation, context.shinySpecies);
      const caughtStarters = record.starters.filter((speciesId) => context.caughtSpecies.has(speciesId)).length;
      const regionPrefix = `${record.region} · Gen ${record.numeral}`;

      list.push(achievement({
        id: `gen_${generation}_first_seen`,
        category: "generations",
        title: `${record.region} Says Hello`,
        description: `Meet a Generation ${record.numeral} Pokémon from ${record.region}.`,
        current: seen,
        generation,
        rarity: "common"
      }));
      list.push(achievement({
        id: `gen_${generation}_first_caught`,
        category: "generations",
        title: `${record.region} Resident`,
        description: `Catch a Generation ${record.numeral} Pokémon from ${record.region}.`,
        current: caught,
        generation,
        rarity: "common"
      }));

      [
        { fraction: 0.25, label: "Quarter", rarity: "uncommon" },
        { fraction: 0.5, label: "Half", rarity: "rare" },
        { fraction: 0.75, label: "Three-Quarter", rarity: "epic" },
        { fraction: 1, label: "Complete", rarity: "legendary" }
      ].forEach((stage) => {
        addFractionAchievement(list, {
          id: `gen_${generation}_seen_${Math.round(stage.fraction * 100)}`,
          category: "generations",
          title: `${record.region} ${stage.label} Journal`,
          description: `Meet ${Math.round(stage.fraction * 100)}% of Generation ${record.numeral}.`,
          current: seen,
          total: generationTotal,
          fraction: stage.fraction,
          rarity: stage.rarity,
          generation
        });
        addFractionAchievement(list, {
          id: `gen_${generation}_caught_${Math.round(stage.fraction * 100)}`,
          category: "generations",
          title: `${record.region} ${stage.label} Collection`,
          description: `Catch ${Math.round(stage.fraction * 100)}% of Generation ${record.numeral}.`,
          current: caught,
          total: generationTotal,
          fraction: stage.fraction,
          rarity: stage.rarity,
          generation
        });
      });

      list.push(achievement({
        id: `gen_${generation}_starter_trio`,
        category: "generations",
        title: `${record.region} Starter Reunion`,
        description: `Catch all three ${record.region} starter Pokémon.`,
        current: caughtStarters,
        target: 3,
        generation,
        rarity: "epic"
      }));
      list.push(achievement({
        id: `gen_${generation}_shiny`,
        category: "generations",
        title: `${record.region} in Rare Colours`,
        description: `Catch a shiny Generation ${record.numeral} Pokémon.`,
        current: shiny,
        generation,
        rarity: "rare"
      }));
      list.push(achievement({
        id: `gen_${generation}_complete_seen`,
        category: "generations",
        title: `${regionPrefix} Field Master`,
        description: `Meet every species in Generation ${record.numeral}.`,
        current: seen,
        target: generationTotal,
        generation,
        rarity: "legendary",
        reward: 2500
      }));
      list.push(achievement({
        id: `gen_${generation}_complete_caught`,
        category: "generations",
        title: `${regionPrefix} Collection Master`,
        description: `Catch every species in Generation ${record.numeral}.`,
        current: caught,
        target: generationTotal,
        generation,
        rarity: "legendary",
        reward: 5000
      }));
    }

    const enabledGenerationSeenCount = context.enabledGenerations.filter((generation) => generationProgress(context, generation, context.seenSpecies) > 0).length;
    const enabledGenerationCaughtCount = context.enabledGenerations.filter((generation) => generationProgress(context, generation, context.caughtSpecies) > 0).length;
    const enabledGenerationShinyCount = context.enabledGenerations.filter((generation) => generationProgress(context, generation, context.shinySpecies) > 0).length;
    const enabledStarterCaught = context.enabledGenerations.reduce((total, generation) => total + generationRecord(generation).starters.filter((speciesId) => context.caughtSpecies.has(speciesId)).length, 0);
    const enabledStarterTarget = context.enabledGenerations.length * 3;
    const enabledStarterGenerationCount = context.enabledGenerations.filter((generation) => generationRecord(generation).starters.some((speciesId) => context.caughtSpecies.has(speciesId))).length;

    list.push(achievement({
      id: "one_seen_each_enabled_generation",
      category: "generations",
      title: "Postcards from Every Invited Region",
      description: "Meet at least one Pokémon from every currently enabled generation.",
      current: enabledGenerationSeenCount,
      target: context.enabledGenerations.length,
      rarity: "rare"
    }));
    list.push(achievement({
      id: "one_caught_each_enabled_generation",
      category: "generations",
      title: "One Friend from Every Era",
      description: "Catch at least one Pokémon from every currently enabled generation.",
      current: enabledGenerationCaughtCount,
      target: context.enabledGenerations.length,
      rarity: "rare"
    }));
    list.push(achievement({
      id: "one_shiny_each_enabled_generation",
      category: "generations",
      title: "Rainbow Across the Generations",
      description: "Catch at least one shiny Pokémon from every currently enabled generation.",
      current: enabledGenerationShinyCount,
      target: context.enabledGenerations.length,
      rarity: "legendary",
      reward: 3000
    }));
    list.push(achievement({
      id: "starter_each_enabled_generation",
      category: "generations",
      title: "Starter Ambassadors",
      description: "Catch at least one starter from every currently enabled generation.",
      current: enabledStarterGenerationCount,
      target: context.enabledGenerations.length,
      rarity: "epic"
    }));
    list.push(achievement({
      id: "all_enabled_starters",
      category: "generations",
      title: "Every Opening Choice",
      description: "Catch all three starters from every currently enabled generation.",
      current: enabledStarterCaught,
      target: enabledStarterTarget,
      rarity: "legendary",
      reward: 4000
    }));

    const claimed = new Set((Array.isArray(context.state.claimedAchievementIds) ? context.state.claimedAchievementIds : []).map(String));
    return list.map((entry) => ({
      ...entry,
      claimed: claimed.has(entry.id),
      unlocked: entry.unlocked || claimed.has(entry.id),
      categoryLabel: CATEGORY_META[entry.category]?.label || entry.category,
      categoryGlyph: CATEGORY_META[entry.category]?.glyph || "•",
      rarityLabel: RARITY_LABELS[entry.rarity] || entry.rarity
    }));
  }

  function summary(state) {
    const catalogue = buildCatalogue(state);
    const unlocked = catalogue.filter((entry) => entry.unlocked);
    const claimed = catalogue.filter((entry) => entry.claimed);
    const claimable = catalogue.filter((entry) => entry.unlocked && !entry.claimed);
    return {
      total: catalogue.length,
      unlocked: unlocked.length,
      claimed: claimed.length,
      claimable: claimable.length,
      claimableReward: claimable.reduce((total, entry) => total + entry.reward, 0),
      enabledGenerations: enabledGenerationNumbers(state),
      enabledSpeciesTotal: enabledSpeciesIds(state).length
    };
  }

  window.PocketHatcheryAchievements = Object.freeze({
    GENERATIONS,
    TYPES,
    CATEGORY_META,
    RARITY_ORDER,
    buildContext,
    buildCatalogue,
    summary,
    enabledGenerationNumbers,
    enabledSpeciesIds,
    generationForSpecies
  });
})();