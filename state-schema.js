(function () {
  "use strict";

  function create(config) {
    const DEFAULT_STATE = config.defaultState;
    const CONTEST_STATS = config.contestStats;
    const DEV_TOOL_DEFAULTS = config.devToolDefaults;
    const CATCH_BALL_IDS = new Set(config.catchBallIds);
    const DEFAULT_SPRITE_ROOT = config.defaultSpriteRoot;
    const COMPETITION_LEAGUE_IDS = new Set(config.competitionLeagueIds || ["local"]);
    const COMPETITION_DIFFICULTY_IDS = new Set(config.competitionDifficultyIds || ["standard"]);
    const COMPETITION_ARCHETYPE_IDS = new Set(config.competitionArchetypeIds || ["endurance"]);
    const API_ROOT = config.apiRoot;
    const FALLBACK_HATCH_DURATION = config.fallbackHatchDuration;
    const makeId = config.makeId;
    const cryUrlFromSpeciesId = config.cryUrlFromSpeciesId;
    const normaliseTheme = config.normaliseTheme;
    const clampIncubatorCapacity = config.clampIncubatorCapacity;
    const cloneDefault = () => JSON.parse(JSON.stringify(DEFAULT_STATE));

    function safeClone(value, fallback = null) {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return fallback;
      }
    }

    function mergePreserved(source, normalised) {
      if (!isPlainObject(source) || !isPlainObject(normalised)) return normalised;
      const merged = safeClone(source, {});
      for (const [key, value] of Object.entries(normalised)) {
        merged[key] = isPlainObject(value) && isPlainObject(source[key]) ? mergePreserved(source[key], value) : value;
      }
      return merged;
    }

    function uniqueNumberList(values, maximum = 100000) {
      return [...new Set((Array.isArray(values) ? values : []).slice(0, maximum).map(Number).filter((value) => Number.isInteger(value) && value > 0 && value <= 20000))];
    }

    function uniqueStringList(values, maximum = 100000) {
      return [...new Set((Array.isArray(values) ? values : []).slice(0, maximum).map((value) => String(value ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 120)).filter(Boolean))];
    }

    function isPlainObject(value) {
      return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }

    function boundedNumber(value, fallback = 0, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, integer = true) {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      const bounded = Math.min(maximum, Math.max(minimum, number));
      return integer ? Math.floor(bounded) : bounded;
    }

    function cleanText(value, fallback = "", maximumLength = 120) {
      const text = String(value ?? fallback)
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/[<>]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return (text || fallback).slice(0, maximumLength);
    }

    function cleanSlug(value, fallback = "", maximumLength = 80) {
      const slug = String(value ?? "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, maximumLength);
      return slug || fallback;
    }

    function cleanUid(value) {
      const uid = String(value ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
      return uid || makeId();
    }

    function cleanUrl(value, fallback = "") {
      try {
        const url = new URL(String(value || ""), window.location.href);
        return url.protocol === "https:" || url.protocol === "http:" ? url.href : fallback;
      } catch {
        return fallback;
      }
    }

    function cleanDate(value, fallback = "") {
      const date = new Date(value);
      return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
    }

    function cleanSpriteUrl(value, speciesId, shiny = false) {
      const fallback = `${DEFAULT_SPRITE_ROOT}/${shiny ? "shiny/" : ""}${speciesId}.png`;
      const cleaned = cleanUrl(value, fallback);
      if (speciesId > 649 && cleaned.includes("/versions/generation-v/black-white/")) return fallback;
      return cleaned;
    }

    function cleanLocalDate(value, fallback = "") {
      const text = String(value || "");
      return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(new Date(`${text}T12:00:00`).getTime()) ? text : fallback;
    }

    function normaliseStatMap(value, maximum, fallback = 0) {
      const source = isPlainObject(value) ? value : {};
      return Object.fromEntries(CONTEST_STATS.map((stat) => [stat, boundedNumber(source[stat], fallback, 0, maximum)]));
    }

    function normaliseEvolutionHistory(value) {
      if (!Array.isArray(value)) return [];
      return value.slice(0, 20).map((entry) => ({
        from: cleanText(entry?.from, "Pokémon", 80),
        to: cleanText(entry?.to, "Pokémon", 80),
        level: boundedNumber(entry?.level, 1, 1, 100)
      }));
    }

    function normalisePokemonRecord(value, options = {}) {
      if (!isPlainObject(value)) return null;
      const speciesId = boundedNumber(value.speciesId, 0, 1, 20000);
      if (!speciesId) return null;
      const normalSprite = cleanSpriteUrl(value.normalSprite || value.sprite, speciesId, false);
      const shinySprite = cleanSpriteUrl(value.shinySprite, speciesId, true);
      const shiny = value.shiny === true;
      const sprite = cleanSpriteUrl(value.sprite, speciesId, shiny);
      const types = Array.isArray(value.types) ? value.types.map((type) => cleanSlug(type)).filter(Boolean).slice(0, 3) : [];
      const baseStats = normaliseStatMap(value.baseStats, 255, 1);
      const baseStatTotal = boundedNumber(value.baseStatTotal, Object.values(baseStats).reduce((total, stat) => total + stat, 0), 1, 2000);
      const level = boundedNumber(value.level, 1, 1, 100);
      const experience = boundedNumber(value.experience, 0, 0, 1000000000);
      const nextLevelExperience = boundedNumber(value.nextLevelExperience, Math.max(1, experience + 1), 1, 1000000000);
      const encounteredAt = cleanDate(value.encounteredAt, new Date().toISOString());
      const record = {
        ...(options.preserveUnknown ? safeClone(value, {}) : {}),
        uid: cleanUid(value.uid),
        speciesId,
        name: cleanSlug(value.name, `pokemon-${speciesId}`),
        displayName: cleanText(value.displayName || value.name, `Pokémon ${speciesId}`, 80),
        nickname: cleanText(value.nickname, "", 16),
        shiny,
        sprite,
        normalSprite,
        shinySprite,
        cryUrl: cleanUrl(value.cryUrl, cryUrlFromSpeciesId(speciesId)),
        types: types.length ? types : ["normal"],
        baseStats,
        baseStatTotal,
        ivs: normaliseStatMap(value.ivs, 31, 0),
        evs: normaliseStatMap(value.evs, 252, 0),
        ability: cleanSlug(value.ability, "unknown"),
        abilitySlot: boundedNumber(value.abilitySlot, 1, 1, 3),
        hiddenAbility: value.hiddenAbility === true,
        captureRate: boundedNumber(value.captureRate, 45, 1, 255),
        level,
        experience,
        nextLevelExperience,
        growthRateUrl: cleanUrl(value.growthRateUrl, ""),
        evolutionChainUrl: cleanUrl(value.evolutionChainUrl, "") || null,
        speciesUrl: cleanUrl(value.speciesUrl, `${API_ROOT}/pokemon-species/${speciesId}/`),
        generation: boundedNumber(value.generation, 1, 1, 9),
        encounteredAt,
        lastPassiveXpAt: boundedNumber(value.lastPassiveXpAt, Date.now(), 0, Date.now() + 86400000),
        catchAttempts: boundedNumber(value.catchAttempts, 0, 0, 1000000),
        evolutionHistory: normaliseEvolutionHistory(value.evolutionHistory),
        favorite: value.favorite === true
      };
      const evTotal = Object.values(record.evs).reduce((total, stat) => total + stat, 0);
      if (evTotal > 510) {
        let excess = evTotal - 510;
        for (const stat of [...CONTEST_STATS].reverse()) {
          if (excess <= 0) break;
          const reduction = Math.min(record.evs[stat], excess);
          record.evs[stat] -= reduction;
          excess -= reduction;
        }
      }
      if (value.caughtAt) record.caughtAt = cleanDate(value.caughtAt, encounteredAt);
      if (value.ot) record.ot = cleanText(value.ot, "Unknown", 80);
      if (CATCH_BALL_IDS.has(value.caughtWith)) record.caughtWith = value.caughtWith;
      if (options.npc === true) delete record.uid;
      return record;
    }

    function normaliseEggRecord(value, options = {}) {
      if (!isPlainObject(value)) return null;
      const laidAt = boundedNumber(value.laidAt, Date.now(), 0, Date.now() + 86400000);
      const hatchDuration = boundedNumber(value.hatchDuration, FALLBACK_HATCH_DURATION, 1000, 365 * 86400000);
      const pendingEncounter = normalisePokemonRecord(value.pendingEncounter, options);
      const egg = {
        laidAt,
        eggNumber: boundedNumber(value.eggNumber, 1, 1, 1000000000),
        hatchAt: boundedNumber(value.hatchAt, laidAt + hatchDuration, laidAt, laidAt + (365 * 86400000)),
        hatchDuration,
        openingStarterEgg: value.openingStarterEgg === true,
        preparingEncounter: pendingEncounter ? false : true
      };
      const forcedSpeciesId = boundedNumber(value.forcedSpeciesId, 0, 0, 20000);
      const baseStatTotal = boundedNumber(value.baseStatTotal, 0, 0, 2000);
      if (forcedSpeciesId) egg.forcedSpeciesId = forcedSpeciesId;
      if (baseStatTotal) egg.baseStatTotal = baseStatTotal;
      if (pendingEncounter) egg.pendingEncounter = pendingEncounter;
      return egg;
    }

    function normalisePokedex(value, options = {}) {
      if (!isPlainObject(value)) return {};
      const result = {};
      let processed = 0;
      for (const key in value) {
        if (processed >= 20000) break;
        const entry = value[key];
        processed += 1;
        if (!isPlainObject(entry)) continue;
        const speciesId = boundedNumber(entry.speciesId, 0, 1, 20000);
        if (!speciesId) continue;
        result[String(speciesId)] = {
          ...(options.preserveUnknown ? safeClone(entry, {}) : {}),
          speciesId,
          name: cleanSlug(entry.name, `pokemon-${speciesId}`),
          displayName: cleanText(entry.displayName || entry.name, `Pokémon ${speciesId}`, 80),
          sprite: cleanSpriteUrl(entry.sprite, speciesId, false),
          shinySprite: cleanSpriteUrl(entry.shinySprite, speciesId, true),
          cryUrl: cleanUrl(entry.cryUrl, cryUrlFromSpeciesId(speciesId)),
          baseStatTotal: boundedNumber(entry.baseStatTotal, 0, 0, 2000),
          hatchDuration: boundedNumber(entry.hatchDuration, 0, 0, 365 * 86400000),
          types: Array.isArray(entry.types) ? entry.types.map((type) => cleanSlug(type)).filter(Boolean).slice(0, 3) : [],
          seen: boundedNumber(entry.seen, 0, 0, 1000000000),
          shinySeen: boundedNumber(entry.shinySeen, 0, 0, 1000000000),
          firstEncounteredAt: cleanDate(entry.firstEncounteredAt, new Date().toISOString())
        };
      }
      return result;
    }

    function normaliseCountMap(value, allowedKeys = null) {
      if (!isPlainObject(value)) return {};
      const result = {};
      for (const [rawKey, rawCount] of Object.entries(value)) {
        const key = cleanSlug(rawKey, "", 80);
        if (!key || (allowedKeys && !allowedKeys.has(key))) continue;
        result[key] = boundedNumber(rawCount, 0, 0, 1000000000);
      }
      return result;
    }

    function normaliseCompetitionLog(value) {
      if (!Array.isArray(value)) return [];
      return value.slice(0, 30).map((entry) => ({
        title: cleanText(entry?.title, "Showcase result", 100),
        summary: cleanText(entry?.summary, "", 240),
        stat: CONTEST_STATS.includes(entry?.stat) ? entry.stat : "hp",
        leagueId: COMPETITION_LEAGUE_IDS.has(entry?.leagueId) ? entry.leagueId : "local",
        difficultyId: COMPETITION_DIFFICULTY_IDS.has(entry?.difficultyId) ? entry.difficultyId : "standard",
        rivalName: cleanText(entry?.rivalName, "Visiting rival", 80),
        playerTotal: boundedNumber(entry?.playerTotal, 0, 0, 1000000000),
        npcTotal: boundedNumber(entry?.npcTotal, 0, 0, 1000000000),
        playerRoundWins: boundedNumber(entry?.playerRoundWins, 0, 0, 6),
        npcRoundWins: boundedNumber(entry?.npcRoundWins, 0, 0, 6),
        moneyAward: boundedNumber(entry?.moneyAward, 0, 0, 1000000000),
        ratingDelta: boundedNumber(entry?.ratingDelta, 0, -1000, 1000),
        won: entry?.won === true,
        at: cleanDate(entry?.at, new Date().toISOString())
      }));
    }

    function normaliseCompetitionMember(value) {
      if (!isPlainObject(value)) return null;
      const speciesId = boundedNumber(value.speciesId, 0, 1, 20000);
      if (!speciesId) return null;
      const baseStats = normaliseStatMap(value.baseStats, 255, 1);
      return {
        uid: cleanUid(value.uid),
        speciesId,
        displayName: cleanText(value.displayName || value.name, `Pokémon ${speciesId}`, 80),
        nickname: cleanText(value.nickname, "", 16),
        sprite: cleanSpriteUrl(value.sprite, speciesId, value.shiny === true),
        shiny: value.shiny === true,
        types: Array.isArray(value.types) ? value.types.map((type) => cleanSlug(type)).filter(Boolean).slice(0, 3) : ["normal"],
        baseStats,
        ivs: normaliseStatMap(value.ivs, 31, 0),
        level: boundedNumber(value.level, 1, 1, 100)
      };
    }

    function normaliseCompetitionRound(value, fallbackIndex = 0) {
      if (!isPlainObject(value)) return null;
      const winner = ["player", "rival", "tie"].includes(value.winner) ? value.winner : "tie";
      return {
        index: boundedNumber(value.index, fallbackIndex, 0, 5),
        playerScore: boundedNumber(value.playerScore, 0, 0, 1000000000),
        rivalScore: boundedNumber(value.rivalScore, 0, 0, 1000000000),
        winner,
        playerVariance: boundedNumber(value.playerVariance, 1, 0.9, 1.1, false),
        rivalVariance: boundedNumber(value.rivalVariance, 1, 0.9, 1.1, false)
      };
    }

    function normaliseCompetitionRival(value, leagueId) {
      if (!isPlainObject(value)) return null;
      const archetype = COMPETITION_ARCHETYPE_IDS.has(value.archetype) ? value.archetype : [...COMPETITION_ARCHETYPE_IDS][0];
      return {
        id: cleanSlug(value.id, `rival-${leagueId}`),
        name: cleanText(value.name, "Visiting rival", 80),
        archetype,
        meetings: boundedNumber(value.meetings, 0, 0, 1000000),
        playerWins: boundedNumber(value.playerWins, 0, 0, 1000000),
        rivalWins: boundedNumber(value.rivalWins, 0, 0, 1000000),
        lastResult: ["player", "rival", "tie", ""].includes(value.lastResult) ? value.lastResult : ""
      };
    }

    function normaliseCompetitionChallenge(value, leagueId) {
      if (!isPlainObject(value)) return null;
      const members = Array.isArray(value.members) ? value.members.slice(0, 6).map(normaliseCompetitionMember).filter(Boolean) : [];
      if (members.length !== 6) return null;
      return {
        id: cleanSlug(value.id, `challenge-${leagueId}`),
        rivalId: cleanSlug(value.rivalId, `rival-${leagueId}`),
        archetype: COMPETITION_ARCHETYPE_IDS.has(value.archetype) ? value.archetype : [...COMPETITION_ARCHETYPE_IDS][0],
        generatedAt: cleanDate(value.generatedAt, new Date().toISOString()),
        members
      };
    }

    function normaliseActiveCompetition(value) {
      if (!isPlainObject(value)) return null;
      const playerTeam = Array.isArray(value.playerTeam) ? value.playerTeam.slice(0, 6).map(normaliseCompetitionMember).filter(Boolean) : [];
      const rivalTeam = Array.isArray(value.rivalTeam) ? value.rivalTeam.slice(0, 6).map(normaliseCompetitionMember).filter(Boolean) : [];
      const firstHalf = Array.isArray(value.firstHalf) ? value.firstHalf.slice(0, 3).map((round, index) => normaliseCompetitionRound(round, index)).filter(Boolean) : [];
      const roundVariances = Array.isArray(value.roundVariances) ? value.roundVariances.slice(0, 6).map((entry) => ({
        player: boundedNumber(entry?.player, 1, 0.97, 1.03, false),
        rival: boundedNumber(entry?.rival, 1, 0.97, 1.03, false)
      })) : [];
      if (playerTeam.length !== 6 || rivalTeam.length !== 6 || firstHalf.length !== 3 || roundVariances.length !== 6) return null;
      return {
        id: cleanSlug(value.id, "active-showcase"),
        stat: CONTEST_STATS.includes(value.stat) ? value.stat : "hp",
        leagueId: COMPETITION_LEAGUE_IDS.has(value.leagueId) ? value.leagueId : "local",
        difficultyId: COMPETITION_DIFFICULTY_IDS.has(value.difficultyId) ? value.difficultyId : "standard",
        rivalId: cleanSlug(value.rivalId, "rival-local"),
        rivalName: cleanText(value.rivalName, "Visiting rival", 80),
        archetype: COMPETITION_ARCHETYPE_IDS.has(value.archetype) ? value.archetype : [...COMPETITION_ARCHETYPE_IDS][0],
        startedAt: cleanDate(value.startedAt, new Date().toISOString()),
        entryFee: boundedNumber(value.entryFee, 0, 0, 1000000000),
        playerBalance: boundedNumber(value.playerBalance, 0, 0, 0.06, false),
        rivalBalance: boundedNumber(value.rivalBalance, 0, 0, 0.06, false),
        playerTeam,
        rivalTeam,
        firstHalf,
        roundVariances
      };
    }

    function normaliseCompetition(value) {
      const source = isPlainObject(value) ? value : {};
      const rating = boundedNumber(source.rating, 1000, 100, 5000);
      const peakRating = Math.max(rating, boundedNumber(source.peakRating, rating, 100, 5000));
      const rivals = {};
      const challenges = {};
      const cooldowns = {};
      for (const leagueId of COMPETITION_LEAGUE_IDS) {
        const rival = normaliseCompetitionRival(source.rivals?.[leagueId], leagueId);
        const challenge = normaliseCompetitionChallenge(source.challenges?.[leagueId], leagueId);
        if (rival) rivals[leagueId] = rival;
        if (challenge) challenges[leagueId] = challenge;
        cooldowns[leagueId] = boundedNumber(source.cooldowns?.[leagueId], 0, 0, 10000000000000);
      }
      return {
        rating,
        peakRating,
        selectedLeague: COMPETITION_LEAGUE_IDS.has(source.selectedLeague) ? source.selectedLeague : "local",
        selectedDifficulty: COMPETITION_DIFFICULTY_IDS.has(source.selectedDifficulty) ? source.selectedDifficulty : "standard",
        cooldowns,
        rivals,
        challenges,
        activeMatch: normaliseActiveCompetition(source.activeMatch),
        winStreak: boundedNumber(source.winStreak, 0, 0, 1000000),
        totalEntries: boundedNumber(source.totalEntries, 0, 0, 1000000000)
      };
    }

    function normaliseSaveState(stored, options = {}) {
      if (!isPlainObject(stored)) return cloneDefault();
      if (options.requirePlayer && (!isPlainObject(stored.player) || typeof stored.player.name !== "string" || !stored.player.name.trim())) {
        throw new Error("This save is missing a valid registration card.");
      }
      const version = boundedNumber(stored.version, 0, 0, DEFAULT_STATE.version);
      if (!version || version > DEFAULT_STATE.version) return cloneDefault();
      const storedGenerations = Array.isArray(stored.settings?.generations)
        ? [...new Set(stored.settings.generations.map(Number).filter((generation) => Number.isInteger(generation) && generation >= 1 && generation <= 9))]
        : [];
      const usedLegacyDefault = version === 1 && storedGenerations.length === 5 && storedGenerations.every((generation, index) => generation === index + 1);
      const player = isPlainObject(stored.player) ? {
        name: cleanText(stored.player.name, "Researcher", 40),
        dob: cleanLocalDate(stored.player.dob, ""),
        gender: ["boy", "girl", "other"].includes(stored.player.gender) ? stored.player.gender : "other",
        createdAt: cleanDate(stored.player.createdAt, new Date().toISOString())
      } : null;
      if (options.requirePlayer && (!player || !player.name || !player.dob)) throw new Error("This save is missing a valid registration card.");

      const pc = Array.isArray(stored.pc) ? stored.pc.slice(0, 100000).map((pokemon) => normalisePokemonRecord(pokemon, options)).filter(Boolean) : [];
      const usedUids = new Set();
      for (const pokemon of pc) {
        while (usedUids.has(pokemon.uid)) pokemon.uid = makeId();
        usedUids.add(pokemon.uid);
      }
      const validUids = new Set(pc.map((pokemon) => pokemon.uid));
      const savedIncubators = isPlainObject(stored.incubators) ? stored.incubators : {};
      const capacity = clampIncubatorCapacity(savedIncubators.capacity || 1);
      const savedSlots = Array.isArray(savedIncubators.slots) ? savedIncubators.slots : [];
      const slots = Array.from({ length: capacity }, (_, index) => {
        const savedSlot = isPlainObject(savedSlots[index]) ? savedSlots[index] : {};
        return {
          id: cleanSlug(savedSlot.id, `incubator-${index + 1}`),
          egg: normaliseEggRecord(savedSlot.egg, options),
          encounter: normalisePokemonRecord(savedSlot.encounter, options)
        };
      });
      const legacyEgg = normaliseEggRecord(stored.egg, options);
      const legacyEncounter = normalisePokemonRecord(stored.encounter, options);
      if ((legacyEgg || legacyEncounter) && !slots.some((slot) => slot.egg || slot.encounter)) {
        slots[0].egg = legacyEgg;
        slots[0].encounter = legacyEncounter;
      }
      const activeIndex = boundedNumber(savedIncubators.activeIndex, 0, 0, capacity - 1);
      const activeSlot = slots[activeIndex];
      const inventory = { ...DEFAULT_STATE.inventory, ...normaliseCountMap(stored.inventory, CATCH_BALL_IDS) };
      const items = normaliseCountMap(stored.items);
      const devTools = Object.fromEntries(Object.keys(DEV_TOOL_DEFAULTS).map((key) => [key, stored.settings?.devTools?.[key] === true]));
      const fieldNotes = isPlainObject(stored.fieldNotes) ? stored.fieldNotes : {};
      const statisticsSource = isPlainObject(stored.statistics) ? stored.statistics : {};
      const statistics = Object.fromEntries(Object.keys(DEFAULT_STATE.statistics).map((key) => [
        key,
        key === "competitionWinsByStat"
          ? normaliseCountMap(statisticsSource[key], new Set(CONTEST_STATS))
          : boundedNumber(statisticsSource[key], 0, 0, 1000000000)
      ]));
      const team = Array.isArray(stored.team) ? [...new Set(stored.team.slice(0, 1000).map(String).filter((uid) => validUids.has(uid)))].slice(0, 6) : [];
      const partnerUid = validUids.has(String(stored.partnerUid || "")) ? String(stored.partnerUid) : "";
      const equippedPlate = cleanSlug(stored.equippedPlate, "");

      const normalised = {
        version: DEFAULT_STATE.version,
        schemaRevision: boundedNumber(DEFAULT_STATE.schemaRevision, 17, 1, 1000000),
        player,
        money: boundedNumber(stored.money, 0, 0, 1000000000000),
        streak: boundedNumber(stored.streak, 0, 0, 1000000),
        lastLoginDate: cleanLocalDate(stored.lastLoginDate, "") || null,
        lastDailyReward: boundedNumber(stored.lastDailyReward, 0, 0, 1000000000000),
        lastDailyBonus: cleanText(stored.lastDailyBonus, "", 120) || null,
        forcedNextEggSpeciesId: boundedNumber(stored.forcedNextEggSpeciesId, 0, 0, 20000),
        fieldNotes: {
          currentDate: cleanLocalDate(fieldNotes.currentDate, ""),
          currentId: cleanSlug(fieldNotes.currentId, ""),
          seen: fieldNotes.seen === true,
          usedIds: Array.isArray(fieldNotes.usedIds) ? [...new Set(fieldNotes.usedIds.slice(0, 10000).map((id) => cleanSlug(id)).filter(Boolean))] : []
        },
        incubators: { capacity, activeIndex, slots },
        egg: activeSlot?.egg || null,
        encounter: activeSlot?.encounter || null,
        pokedex: normalisePokedex(stored.pokedex, options),
        caughtSpeciesIds: uniqueNumberList([...(Array.isArray(stored.caughtSpeciesIds) ? stored.caughtSpeciesIds : []), ...pc.map((pokemon) => pokemon.speciesId)]),
        caughtBallIds: uniqueStringList([...(Array.isArray(stored.caughtBallIds) ? stored.caughtBallIds : []), ...pc.map((pokemon) => pokemon.caughtWith)]),
        caughtShinySpeciesIds: uniqueNumberList([...(Array.isArray(stored.caughtShinySpeciesIds) ? stored.caughtShinySpeciesIds : []), ...pc.filter((pokemon) => pokemon.shiny).map((pokemon) => pokemon.speciesId)]),
        claimedAchievementIds: uniqueStringList(stored.claimedAchievementIds || []),
        dailyQuests: isPlainObject(stored.dailyQuests) ? {
          ...(options.preserveUnknown ? safeClone(stored.dailyQuests, {}) : {}),
          currentDate: cleanLocalDate(stored.dailyQuests.currentDate, ""),
          quests: Array.isArray(stored.dailyQuests.quests) ? safeClone(stored.dailyQuests.quests.slice(0, 100), []) : []
        } : safeClone(DEFAULT_STATE.dailyQuests, { currentDate: "", quests: [] }),
        pc,
        expeditions: Array.isArray(stored.expeditions) ? safeClone(stored.expeditions.slice(0, 1000), []) : [],
        expeditionLog: Array.isArray(stored.expeditionLog) ? safeClone(stored.expeditionLog.slice(0, 100), []) : [],
        souvenirs: normaliseCountMap(stored.souvenirs),
        team,
        partnerUid,
        inventory,
        items,
        equippedPlate: items[equippedPlate] > 0 ? equippedPlate : "",
        activeItemEffects: { shinyCharmEggsRemaining: boundedNumber(stored.activeItemEffects?.shinyCharmEggsRemaining, 0, 0, 1000000) },
        settings: {
          generations: usedLegacyDefault || !storedGenerations.length ? [...DEFAULT_STATE.settings.generations] : storedGenerations,
          theme: normaliseTheme(stored.settings?.theme),
          interfacePerformance: ["automatic", "standard", "low"].includes(stored.settings?.interfacePerformance)
            ? stored.settings.interfacePerformance
            : DEFAULT_STATE.settings.interfacePerformance,
          devTools
        },
        statistics,
        competition: normaliseCompetition(stored.competition),
        competitionLog: normaliseCompetitionLog(stored.competitionLog)
      };
      return options.preserveUnknown ? mergePreserved(stored, normalised) : normalised;
    }


    return Object.freeze({ isPlainObject, cleanUrl, normaliseSaveState });
  }

  window.PocketHatcheryStateSchema = Object.freeze({ create });
})();
