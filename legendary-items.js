(function () {
  "use strict";

  const MANAPHY_SPECIES_ID = 490;
  const DEFAULT_SPRITE_ID = "strange-souvenir";
  const DAY_MS = 86400000;

  const LEGENDARY_ITEM_ENTRIES = [
    { generation: 1, speciesId: 144, speciesName: "articuno", displayName: "Articuno", itemId: "frozen_feather", itemName: "Frozen Feather" },
    { generation: 1, speciesId: 145, speciesName: "zapdos", displayName: "Zapdos", itemId: "charged_feather", itemName: "Charged Feather" },
    { generation: 1, speciesId: 146, speciesName: "moltres", displayName: "Moltres", itemId: "burning_feather", itemName: "Burning Feather" },
    { generation: 1, speciesId: 150, speciesName: "mewtwo", displayName: "Mewtwo", itemId: "berserk_gene", itemName: "Berserk Gene" },

    { generation: 2, speciesId: 243, speciesName: "raikou", displayName: "Raikou", itemId: "lightning_fang", itemName: "Lightning Fang" },
    { generation: 2, speciesId: 244, speciesName: "entei", displayName: "Entei", itemId: "volcanic_ash", itemName: "Volcanic Ash" },
    { generation: 2, speciesId: 245, speciesName: "suicune", displayName: "Suicune", itemId: "clear_bell", itemName: "Clear Bell" },
    { generation: 2, speciesId: 249, speciesName: "lugia", displayName: "Lugia", itemId: "silver_wing", itemName: "Silver Wing" },
    { generation: 2, speciesId: 250, speciesName: "ho-oh", displayName: "Ho-Oh", itemId: "rainbow_wing", itemName: "Rainbow Wing" },

    { generation: 3, speciesId: 377, speciesName: "regirock", displayName: "Regirock", itemId: "ancient_stone", itemName: "Ancient Stone" },
    { generation: 3, speciesId: 378, speciesName: "regice", displayName: "Regice", itemId: "never_melt_ice", itemName: "Never-Melt Ice" },
    { generation: 3, speciesId: 379, speciesName: "registeel", displayName: "Registeel", itemId: "metal_coat", itemName: "Metal Coat" },
    { generation: 3, speciesId: 380, speciesName: "latias", displayName: "Latias", itemId: "red_soul_dew", itemName: "Red Soul Dew" },
    { generation: 3, speciesId: 381, speciesName: "latios", displayName: "Latios", itemId: "blue_soul_dew", itemName: "Blue Soul Dew" },
    { generation: 3, speciesId: 382, speciesName: "kyogre", displayName: "Kyogre", itemId: "blue_orb", itemName: "Blue Orb" },
    { generation: 3, speciesId: 383, speciesName: "groudon", displayName: "Groudon", itemId: "red_orb", itemName: "Red Orb" },
    { generation: 3, speciesId: 384, speciesName: "rayquaza", displayName: "Rayquaza", itemId: "jade_orb", itemName: "Jade Orb" },

    { generation: 4, speciesId: 480, speciesName: "uxie", displayName: "Uxie", itemId: "knowledge_tablet", itemName: "Tablet of Knowledge" },
    { generation: 4, speciesId: 481, speciesName: "mesprit", displayName: "Mesprit", itemId: "heart_charm", itemName: "Heart Charm" },
    { generation: 4, speciesId: 482, speciesName: "azelf", displayName: "Azelf", itemId: "willpower_charm", itemName: "Willpower Charm" },
    { generation: 4, speciesId: 483, speciesName: "dialga", displayName: "Dialga", itemId: "adamant_orb", itemName: "Adamant Orb" },
    { generation: 4, speciesId: 484, speciesName: "palkia", displayName: "Palkia", itemId: "lustrous_orb", itemName: "Lustrous Orb" },
    { generation: 4, speciesId: 485, speciesName: "heatran", displayName: "Heatran", itemId: "magma_stone", itemName: "Magma Stone" },
    { generation: 4, speciesId: 486, speciesName: "regigigas", displayName: "Regigigas", itemId: "ancient_rope", itemName: "Ancient Rope" },
    { generation: 4, speciesId: 487, speciesName: "giratina", displayName: "Giratina", itemId: "griseous_orb", itemName: "Griseous Orb" },
    { generation: 4, speciesId: 488, speciesName: "cresselia", displayName: "Cresselia", itemId: "lunar_feather", itemName: "Lunar Feather" },

    { generation: 5, speciesId: 638, speciesName: "cobalion", displayName: "Cobalion", itemId: "iron_crest", itemName: "Iron Crest" },
    { generation: 5, speciesId: 639, speciesName: "terrakion", displayName: "Terrakion", itemId: "stone_horn", itemName: "Stone Horn" },
    { generation: 5, speciesId: 640, speciesName: "virizion", displayName: "Virizion", itemId: "verdant_blade", itemName: "Verdant Blade" },
    { generation: 5, speciesId: 641, speciesName: "tornadus", displayName: "Tornadus", itemId: "storm_fan", itemName: "Storm Fan" },
    { generation: 5, speciesId: 642, speciesName: "thundurus", displayName: "Thundurus", itemId: "thunder_drum", itemName: "Thunder Drum" },
    { generation: 5, speciesId: 643, speciesName: "reshiram", displayName: "Reshiram", itemId: "light_stone", itemName: "Light Stone" },
    { generation: 5, speciesId: 644, speciesName: "zekrom", displayName: "Zekrom", itemId: "dark_stone", itemName: "Dark Stone" },
    { generation: 5, speciesId: 645, speciesName: "landorus", displayName: "Landorus", itemId: "fertile_soil", itemName: "Fertile Soil" },
    { generation: 5, speciesId: 646, speciesName: "kyurem", displayName: "Kyurem", itemId: "dna_splicers", itemName: "DNA Splicers" },

    { generation: 6, speciesId: 716, speciesName: "xerneas", displayName: "Xerneas", itemId: "life_seed", itemName: "Life Seed" },
    { generation: 6, speciesId: 717, speciesName: "yveltal", displayName: "Yveltal", itemId: "dark_feather", itemName: "Dark Feather" },
    { generation: 6, speciesId: 718, speciesName: "zygarde", displayName: "Zygarde", itemId: "zygarde_cube", itemName: "Zygarde Cube" },

    { generation: 7, speciesId: 772, speciesName: "type-null", displayName: "Type: Null", itemId: "restraint_mask", itemName: "Restraint Mask" },
    { generation: 7, speciesId: 773, speciesName: "silvally", displayName: "Silvally", itemId: "memory_drive", itemName: "Memory Drive" },
    { generation: 7, speciesId: 785, speciesName: "tapu-koko", displayName: "Tapu Koko", itemId: "electric_seed", itemName: "Electric Seed" },
    { generation: 7, speciesId: 786, speciesName: "tapu-lele", displayName: "Tapu Lele", itemId: "psychic_seed", itemName: "Psychic Seed" },
    { generation: 7, speciesId: 787, speciesName: "tapu-bulu", displayName: "Tapu Bulu", itemId: "grassy_seed", itemName: "Grassy Seed" },
    { generation: 7, speciesId: 788, speciesName: "tapu-fini", displayName: "Tapu Fini", itemId: "misty_seed", itemName: "Misty Seed" },
    { generation: 7, speciesId: 789, speciesName: "cosmog", displayName: "Cosmog", itemId: "star_fragment", itemName: "Star Fragment" },
    { generation: 7, speciesId: 790, speciesName: "cosmoem", displayName: "Cosmoem", itemId: "cosmic_core", itemName: "Cosmic Core" },
    { generation: 7, speciesId: 791, speciesName: "solgaleo", displayName: "Solgaleo", itemId: "solganium_z", itemName: "Solganium Z" },
    { generation: 7, speciesId: 792, speciesName: "lunala", displayName: "Lunala", itemId: "lunalium_z", itemName: "Lunalium Z" },
    { generation: 7, speciesId: 800, speciesName: "necrozma", displayName: "Necrozma", itemId: "ultranecrozium_z", itemName: "Ultranecrozium Z" },

    { generation: 8, speciesId: 888, speciesName: "zacian", displayName: "Zacian", itemId: "rusted_sword", itemName: "Rusted Sword" },
    { generation: 8, speciesId: 889, speciesName: "zamazenta", displayName: "Zamazenta", itemId: "rusted_shield", itemName: "Rusted Shield" },
    { generation: 8, speciesId: 890, speciesName: "eternatus", displayName: "Eternatus", itemId: "wishing_star", itemName: "Wishing Star" },
    { generation: 8, speciesId: 891, speciesName: "kubfu", displayName: "Kubfu", itemId: "training_scroll", itemName: "Training Scroll" },
    { generation: 8, speciesId: 892, speciesName: "urshifu", displayName: "Urshifu", itemId: "mastery_scroll", itemName: "Mastery Scroll" },
    { generation: 8, speciesId: 894, speciesName: "regieleki", displayName: "Regieleki", itemId: "transistor_core", itemName: "Transistor Core" },
    { generation: 8, speciesId: 895, speciesName: "regidrago", displayName: "Regidrago", itemId: "dragon_fang", itemName: "Dragon Fang" },
    { generation: 8, speciesId: 896, speciesName: "glastrier", displayName: "Glastrier", itemId: "iceroot_carrot", itemName: "Iceroot Carrot" },
    { generation: 8, speciesId: 897, speciesName: "spectrier", displayName: "Spectrier", itemId: "shaderoot_carrot", itemName: "Shaderoot Carrot" },
    { generation: 8, speciesId: 898, speciesName: "calyrex", displayName: "Calyrex", itemId: "reins_of_unity", itemName: "Reins of Unity" },
    { generation: 8, speciesId: 905, speciesName: "enamorus", displayName: "Enamorus", itemId: "spring_mirror", itemName: "Spring Mirror" },

    { generation: 9, speciesId: 1001, speciesName: "wo-chien", displayName: "Wo-Chien", itemId: "cursed_wooden_tablets", itemName: "Cursed Wooden Tablets" },
    { generation: 9, speciesId: 1002, speciesName: "chien-pao", displayName: "Chien-Pao", itemId: "shattered_sword", itemName: "Shattered Sword" },
    { generation: 9, speciesId: 1003, speciesName: "ting-lu", displayName: "Ting-Lu", itemId: "ritual_vessel", itemName: "Ritual Vessel" },
    { generation: 9, speciesId: 1004, speciesName: "chi-yu", displayName: "Chi-Yu", itemId: "jade_beads", itemName: "Jade Beads" },
    { generation: 9, speciesId: 1007, speciesName: "koraidon", displayName: "Koraidon", itemId: "scarlet_book", itemName: "Scarlet Book" },
    { generation: 9, speciesId: 1008, speciesName: "miraidon", displayName: "Miraidon", itemId: "violet_book", itemName: "Violet Book" },
    { generation: 9, speciesId: 1014, speciesName: "okidogi", displayName: "Okidogi", itemId: "toxic_chain_collar", itemName: "Toxic Chain Collar" },
    { generation: 9, speciesId: 1015, speciesName: "munkidori", displayName: "Munkidori", itemId: "toxic_chain_crown", itemName: "Toxic Chain Crown" },
    { generation: 9, speciesId: 1016, speciesName: "fezandipiti", displayName: "Fezandipiti", itemId: "toxic_chain_necklace", itemName: "Toxic Chain Necklace" },
    { generation: 9, speciesId: 1017, speciesName: "ogerpon", displayName: "Ogerpon", itemId: "teal_mask", itemName: "Teal Mask" },
    { generation: 9, speciesId: 1024, speciesName: "terapagos", displayName: "Terapagos", itemId: "tera_orb", itemName: "Tera Orb" }
  ].map((entry) => Object.freeze({ ...entry }));

  const UNLOCK_RULES = Object.freeze({
    frozen_feather: Object.freeze({ kind: "seen_type", pokemonType: "ice", count: 8 }),
    charged_feather: Object.freeze({ kind: "seen_type", pokemonType: "electric", count: 8 }),
    burning_feather: Object.freeze({ kind: "seen_type", pokemonType: "fire", count: 8 }),
    berserk_gene: Object.freeze({ kind: "caught_group", speciesIds: [144, 145, 146] }),
    lightning_fang: Object.freeze({ kind: "caught_type", pokemonType: "electric", count: 10 }),
    volcanic_ash: Object.freeze({ kind: "caught_type", pokemonType: "fire", count: 10 }),
    clear_bell: Object.freeze({ kind: "caught_type", pokemonType: "water", count: 10 }),
    silver_wing: Object.freeze({ kind: "caught_group", speciesIds: [144, 145, 146] }),
    rainbow_wing: Object.freeze({ kind: "caught_group", speciesIds: [243, 244, 245] }),
    ancient_stone: Object.freeze({ kind: "caught_type", pokemonType: "rock", count: 10 }),
    never_melt_ice: Object.freeze({ kind: "caught_type", pokemonType: "ice", count: 10 }),
    metal_coat: Object.freeze({ kind: "caught_type", pokemonType: "steel", count: 10 }),
    red_soul_dew: Object.freeze({ kind: "profile_days", count: 7 }),
    blue_soul_dew: Object.freeze({ kind: "profile_days", count: 14 }),
    blue_orb: Object.freeze({ kind: "caught_type", pokemonType: "water", count: 20 }),
    red_orb: Object.freeze({ kind: "caught_type", pokemonType: "ground", count: 20 }),
    jade_orb: Object.freeze({ kind: "caught_group", speciesIds: [382, 383] }),
    knowledge_tablet: Object.freeze({ kind: "seen_type", pokemonType: "psychic", count: 15 }),
    heart_charm: Object.freeze({ kind: "caught_type", pokemonType: "psychic", count: 12 }),
    willpower_charm: Object.freeze({ kind: "balls_bought", count: 100 }),
    adamant_orb: Object.freeze({ kind: "caught_group", speciesIds: [480, 481, 482] }),
    lustrous_orb: Object.freeze({ kind: "money", count: 25000 }),
    magma_stone: Object.freeze({ kind: "all", rules: [{ kind: "caught_type", pokemonType: "fire", count: 15 }, { kind: "caught_type", pokemonType: "steel", count: 15 }] }),
    ancient_rope: Object.freeze({ kind: "caught_group", speciesIds: [377, 378, 379] }),
    griseous_orb: Object.freeze({ kind: "caught_group", speciesIds: [483, 484] }),
    lunar_feather: Object.freeze({ kind: "profile_days", count: 21 }),
    iron_crest: Object.freeze({ kind: "caught_type", pokemonType: "steel", count: 15 }),
    stone_horn: Object.freeze({ kind: "caught_type", pokemonType: "rock", count: 15 }),
    verdant_blade: Object.freeze({ kind: "caught_type", pokemonType: "grass", count: 15 }),
    storm_fan: Object.freeze({ kind: "seen_type", pokemonType: "flying", count: 20 }),
    thunder_drum: Object.freeze({ kind: "seen_type", pokemonType: "electric", count: 20 }),
    light_stone: Object.freeze({ kind: "caught_type", pokemonType: "fire", count: 25 }),
    dark_stone: Object.freeze({ kind: "caught_type", pokemonType: "electric", count: 25 }),
    fertile_soil: Object.freeze({ kind: "caught_group", speciesIds: [641, 642] }),
    dna_splicers: Object.freeze({ kind: "caught_group", speciesIds: [643, 644] }),
    life_seed: Object.freeze({ kind: "caught_type", pokemonType: "fairy", count: 20 }),
    dark_feather: Object.freeze({ kind: "caught_type", pokemonType: "dark", count: 20 }),
    zygarde_cube: Object.freeze({ kind: "caught_group", speciesIds: [716, 717] }),
    restraint_mask: Object.freeze({ kind: "eggs_hatched", count: 100 }),
    memory_drive: Object.freeze({ kind: "caught_group", speciesIds: [772] }),
    electric_seed: Object.freeze({ kind: "caught_type", pokemonType: "electric", count: 30 }),
    psychic_seed: Object.freeze({ kind: "caught_type", pokemonType: "psychic", count: 30 }),
    grassy_seed: Object.freeze({ kind: "caught_type", pokemonType: "grass", count: 30 }),
    misty_seed: Object.freeze({ kind: "caught_type", pokemonType: "water", count: 30 }),
    star_fragment: Object.freeze({ kind: "profile_days", count: 30 }),
    cosmic_core: Object.freeze({ kind: "caught_group", speciesIds: [789] }),
    solganium_z: Object.freeze({ kind: "all", rules: [{ kind: "caught_group", speciesIds: [790] }, { kind: "caught_type", pokemonType: "steel", count: 30 }] }),
    lunalium_z: Object.freeze({ kind: "all", rules: [{ kind: "caught_group", speciesIds: [790] }, { kind: "caught_type", pokemonType: "ghost", count: 20 }] }),
    ultranecrozium_z: Object.freeze({ kind: "caught_group", speciesIds: [791, 792] }),
    rusted_sword: Object.freeze({ kind: "caught_type", pokemonType: "fairy", count: 35 }),
    rusted_shield: Object.freeze({ kind: "caught_type", pokemonType: "fighting", count: 35 }),
    wishing_star: Object.freeze({ kind: "caught_group", speciesIds: [888, 889] }),
    training_scroll: Object.freeze({ kind: "competitions_won", count: 10 }),
    mastery_scroll: Object.freeze({ kind: "all", rules: [{ kind: "caught_group", speciesIds: [891] }, { kind: "competitions_won", count: 20 }] }),
    transistor_core: Object.freeze({ kind: "all", rules: [{ kind: "caught_group", speciesIds: [486] }, { kind: "caught_type", pokemonType: "electric", count: 40 }] }),
    dragon_fang: Object.freeze({ kind: "all", rules: [{ kind: "caught_group", speciesIds: [486] }, { kind: "caught_type", pokemonType: "dragon", count: 25 }] }),
    iceroot_carrot: Object.freeze({ kind: "caught_type", pokemonType: "ice", count: 30 }),
    shaderoot_carrot: Object.freeze({ kind: "caught_type", pokemonType: "ghost", count: 30 }),
    reins_of_unity: Object.freeze({ kind: "caught_group", speciesIds: [896, 897] }),
    spring_mirror: Object.freeze({ kind: "caught_group", speciesIds: [641, 642, 645] }),
    cursed_wooden_tablets: Object.freeze({ kind: "all", rules: [{ kind: "caught_type", pokemonType: "grass", count: 35 }, { kind: "caught_type", pokemonType: "dark", count: 25 }] }),
    shattered_sword: Object.freeze({ kind: "all", rules: [{ kind: "caught_type", pokemonType: "ice", count: 35 }, { kind: "caught_type", pokemonType: "dark", count: 25 }] }),
    ritual_vessel: Object.freeze({ kind: "all", rules: [{ kind: "caught_type", pokemonType: "ground", count: 35 }, { kind: "caught_type", pokemonType: "dark", count: 25 }] }),
    jade_beads: Object.freeze({ kind: "all", rules: [{ kind: "caught_type", pokemonType: "fire", count: 35 }, { kind: "caught_type", pokemonType: "dark", count: 25 }] }),
    scarlet_book: Object.freeze({ kind: "balls_bought", count: 500 }),
    violet_book: Object.freeze({ kind: "money", count: 100000 }),
    toxic_chain_collar: Object.freeze({ kind: "caught_type", pokemonType: "poison", count: 35 }),
    toxic_chain_crown: Object.freeze({ kind: "caught_type", pokemonType: "psychic", count: 35 }),
    toxic_chain_necklace: Object.freeze({ kind: "caught_type", pokemonType: "fairy", count: 35 }),
    teal_mask: Object.freeze({ kind: "caught_group", speciesIds: [1014, 1015, 1016] }),
    tera_orb: Object.freeze({ kind: "caught_group", speciesIds: [1007, 1008, 1017] })
  });

  const ENTRY_BY_SPECIES_ID = new Map(LEGENDARY_ITEM_ENTRIES.map((entry) => [entry.speciesId, entry]));
  const ENTRY_BY_ITEM_ID = new Map(LEGENDARY_ITEM_ENTRIES.map((entry) => [entry.itemId, entry]));

  function normaliseSpeciesId(value) {
    const speciesId = Number(value || 0);
    return Number.isFinite(speciesId) && speciesId > 0 ? Math.floor(speciesId) : 0;
  }

  function normaliseCount(value) {
    const count = Math.floor(Number(value || 0));
    return Number.isFinite(count) && count > 0 ? count : 0;
  }

  function normaliseType(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function titleCase(value) {
    return String(value || "").split("-").map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : "").join(" ");
  }

  function listNames(names) {
    if (!names.length) return "the required Pokémon";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }

  function caughtPokemon(state) {
    return Array.isArray(state?.pc) ? state.pc.filter(Boolean) : [];
  }

  function caughtSpeciesSet(state) {
    return new Set(caughtPokemon(state).map((pokemon) => normaliseSpeciesId(pokemon.speciesId)).filter(Boolean));
  }

  function countCaughtType(state, pokemonType) {
    const type = normaliseType(pokemonType);
    return caughtPokemon(state).filter((pokemon) => Array.isArray(pokemon.types) && pokemon.types.map(normaliseType).includes(type)).length;
  }

  function knownTypesBySpecies(state) {
    const result = new Map();
    const records = [
      ...caughtPokemon(state),
      ...(Array.isArray(state?.incubators?.slots) ? state.incubators.slots.flatMap((slot) => [slot?.encounter, slot?.egg?.pendingEncounter]) : []),
      state?.encounter,
      state?.egg?.pendingEncounter
    ].filter(Boolean);
    for (const pokemon of records) {
      const speciesId = normaliseSpeciesId(pokemon.speciesId);
      const types = Array.isArray(pokemon.types) ? pokemon.types.map(normaliseType).filter(Boolean) : [];
      if (speciesId && types.length) result.set(speciesId, types);
    }
    return result;
  }

  function countSeenType(state, pokemonType) {
    const type = normaliseType(pokemonType);
    const fallbackTypes = knownTypesBySpecies(state);
    const pokedex = state?.pokedex && typeof state.pokedex === "object" ? state.pokedex : {};
    let count = 0;
    for (const entry of Object.values(pokedex)) {
      if (!entry || typeof entry !== "object") continue;
      const speciesId = normaliseSpeciesId(entry.speciesId);
      const types = Array.isArray(entry.types) && entry.types.length
        ? entry.types.map(normaliseType).filter(Boolean)
        : fallbackTypes.get(speciesId) || [];
      if (types.includes(type)) count += normaliseCount(entry.seen);
    }
    return count;
  }

  function profileAgeDays(state, now = Date.now()) {
    const createdAt = Date.parse(String(state?.player?.createdAt || ""));
    if (!Number.isFinite(createdAt)) return 0;
    return Math.max(0, Math.floor((Number(now) - createdAt) / DAY_MS));
  }

  function speciesNames(speciesIds) {
    return speciesIds.map((speciesId) => ENTRY_BY_SPECIES_ID.get(normaliseSpeciesId(speciesId))?.displayName || `Pokémon ${speciesId}`);
  }

  function evaluateRule(rule, state, now = Date.now()) {
    if (!rule || typeof rule !== "object") return { achieved: false, current: 0, target: 1, description: "Complete the missing research goal.", progressText: "0 / 1" };
    const target = Math.max(1, normaliseCount(rule.count));
    if (rule.kind === "seen_type") {
      const current = countSeenType(state, rule.pokemonType);
      return { achieved: current >= target, current, target, description: `Record ${target} ${titleCase(rule.pokemonType)}-type encounter${target === 1 ? "" : "s"}.`, progressText: `${current.toLocaleString()} / ${target.toLocaleString()} seen` };
    }
    if (rule.kind === "caught_type") {
      const current = countCaughtType(state, rule.pokemonType);
      return { achieved: current >= target, current, target, description: `Catch ${target} ${titleCase(rule.pokemonType)}-type Pokémon.`, progressText: `${current.toLocaleString()} / ${target.toLocaleString()} caught` };
    }
    if (rule.kind === "caught_group") {
      const speciesIds = Array.isArray(rule.speciesIds) ? [...new Set(rule.speciesIds.map(normaliseSpeciesId).filter(Boolean))] : [];
      const caught = caughtSpeciesSet(state);
      const current = speciesIds.filter((speciesId) => caught.has(speciesId)).length;
      const groupTarget = Math.max(1, speciesIds.length);
      return { achieved: speciesIds.length > 0 && current >= groupTarget, current, target: groupTarget, description: `Catch ${listNames(speciesNames(speciesIds))}.`, progressText: `${current} / ${groupTarget} required Legendary Pokémon caught` };
    }
    if (rule.kind === "money") {
      const current = normaliseCount(state?.money);
      return { achieved: current >= target, current, target, description: `Hold ₽${target.toLocaleString()} at one time.`, progressText: `₽${current.toLocaleString()} / ₽${target.toLocaleString()}` };
    }
    if (rule.kind === "balls_bought") {
      const current = normaliseCount(state?.statistics?.pokeBallsBought);
      return { achieved: current >= target, current, target, description: `Buy ${target.toLocaleString()} Poké Balls from the Pokémart.`, progressText: `${current.toLocaleString()} / ${target.toLocaleString()} bought` };
    }
    if (rule.kind === "profile_days") {
      const current = profileAgeDays(state, now);
      return { achieved: current >= target, current, target, description: `Keep this hatchery profile for ${target} day${target === 1 ? "" : "s"}.`, progressText: `${current.toLocaleString()} / ${target.toLocaleString()} days` };
    }
    if (rule.kind === "eggs_hatched") {
      const current = normaliseCount(state?.statistics?.eggsHatched);
      return { achieved: current >= target, current, target, description: `Hatch ${target.toLocaleString()} eggs.`, progressText: `${current.toLocaleString()} / ${target.toLocaleString()} hatched` };
    }
    if (rule.kind === "competitions_won") {
      const current = normaliseCount(state?.statistics?.competitionsWon);
      return { achieved: current >= target, current, target, description: `Win ${target.toLocaleString()} competitions.`, progressText: `${current.toLocaleString()} / ${target.toLocaleString()} won` };
    }
    if (rule.kind === "all") {
      const results = Array.isArray(rule.rules) ? rule.rules.map((child) => evaluateRule(child, state, now)) : [];
      const current = results.filter((result) => result.achieved).length;
      const allTarget = Math.max(1, results.length);
      return {
        achieved: results.length > 0 && current >= allTarget,
        current,
        target: allTarget,
        description: `Complete all of these goals: ${results.map((result) => result.description.replace(/\.$/, "")).join("; ")}.`,
        progressText: results.map((result) => result.progressText).join(" · "),
        parts: results
      };
    }
    return { achieved: false, current: 0, target: 1, description: "Complete the missing research goal.", progressText: "0 / 1" };
  }

  function getRuleForEntry(entry) {
    return entry ? UNLOCK_RULES[entry.itemId] || null : null;
  }

  function getUnlockStatus(state, speciesOrItemId, now = Date.now()) {
    const numericId = normaliseSpeciesId(speciesOrItemId);
    const entry = numericId ? ENTRY_BY_SPECIES_ID.get(numericId) : ENTRY_BY_ITEM_ID.get(String(speciesOrItemId || ""));
    if (!entry) return null;
    const result = evaluateRule(getRuleForEntry(entry), state, now);
    const unlocked = Number(state?.items?.[entry.itemId] || 0) > 0;
    return { ...entry, ...result, unlocked, eligible: result.achieved };
  }

  function getUnlockStatuses(state, now = Date.now()) {
    return LEGENDARY_ITEM_ENTRIES.map((entry) => getUnlockStatus(state, entry.itemId, now));
  }

  function unlockEligibleItems(state, now = Date.now()) {
    if (!state || typeof state !== "object") return [];
    if (!state.items || typeof state.items !== "object" || Array.isArray(state.items)) state.items = {};
    const unlocked = [];
    for (const entry of LEGENDARY_ITEM_ENTRIES) {
      if (Number(state.items[entry.itemId] || 0) > 0) continue;
      const status = getUnlockStatus(state, entry.itemId, now);
      if (!status?.eligible) continue;
      state.items[entry.itemId] = 1;
      unlocked.push(status);
    }
    return unlocked;
  }

  function getRequirement(speciesId) {
    const id = normaliseSpeciesId(speciesId);
    if (!id || id === MANAPHY_SPECIES_ID) return null;
    const entry = ENTRY_BY_SPECIES_ID.get(id);
    return entry ? { ...entry } : null;
  }

  function isRestrictedSpecies(speciesId) {
    return getRequirement(speciesId) !== null;
  }

  function hasRequiredItem(state, speciesId) {
    const requirement = getRequirement(speciesId);
    if (!requirement) return true;
    return Number(state?.items?.[requirement.itemId] || 0) > 0;
  }

  function canHatchSpecies(state, speciesId) {
    return hasRequiredItem(state, speciesId);
  }

  const MYSTERY_ITEMS = LEGENDARY_ITEM_ENTRIES.map((entry) => Object.freeze({
    id: entry.itemId,
    category: "mystery",
    pocket: "mystery-items",
    displayName: entry.itemName,
    speciesId: entry.speciesId,
    associatedPokemon: entry.displayName,
    spriteId: DEFAULT_SPRITE_ID,
    soldInShop: false,
    usable: false,
    consumable: false,
    stackable: true,
    unique: false,
    unlockGoal: evaluateRule(getRuleForEntry(entry), {}, 0).description,
    description: `A mystery relic associated with ${entry.displayName}. Its presence allows ${entry.displayName} eggs to form and hatch.`
  }));
  const ITEM_BY_ID = new Map(MYSTERY_ITEMS.map((item) => [item.id, item]));

  function getItem(itemId) {
    const item = ITEM_BY_ID.get(String(itemId || ""));
    return item ? { ...item } : null;
  }

  function getMysteryItems(state, includeEmpty = false) {
    return MYSTERY_ITEMS
      .map((item) => ({ ...item, count: Number(state?.items?.[item.id] || 0) }))
      .filter((item) => includeEmpty || item.count > 0);
  }

  window.PocketHatcheryLegendaryItems = Object.freeze({
    manaphySpeciesId: MANAPHY_SPECIES_ID,
    entries: () => LEGENDARY_ITEM_ENTRIES.map((entry) => ({ ...entry })),
    items: () => MYSTERY_ITEMS.map((item) => ({ ...item })),
    rules: () => Object.fromEntries(Object.entries(UNLOCK_RULES).map(([itemId, rule]) => [itemId, JSON.parse(JSON.stringify(rule))])),
    getRequirement,
    isRestrictedSpecies,
    hasRequiredItem,
    canHatchSpecies,
    getItem,
    getMysteryItems,
    getUnlockStatus,
    getUnlockStatuses,
    unlockEligibleItems,
    countCaughtType,
    countSeenType,
    profileAgeDays
  });
}());
