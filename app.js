(function () {
  "use strict";

  const STORAGE_KEY = "pocket_hatchery_save_v1";
  const SAVE_EXPORT_MAGIC = "pocket-hatchery-save";
  const SAVE_EXPORT_VERSION = 1;
  const HATCH_SECONDS_PER_BASE_STAT_POINT = 30;
  const HATCH_MILLISECONDS_PER_BASE_STAT_POINT = HATCH_SECONDS_PER_BASE_STAT_POINT * 1000;
  const FALLBACK_HATCH_DURATION = 3 * 60 * 60 * 1000;
  const EGG_COST = 25;
  const FIRST_EGG_HATCH_DURATION = 30 * 1000;
  const ONBOARDING_FAST_EGG_COUNT = 10;
  const ONBOARDING_FAST_EGG_START_MULTIPLIER = 0.2;
  const ONBOARDING_FAST_EGG_END_MULTIPLIER = 0.95;
  const PASSIVE_XP_INTERVAL = 60 * 1000;
  const API_ROOT = "https://pokeapi.co/api/v2";
  const GEN_FIVE_SPRITE_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white";
  const ITEM_SPRITE_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
  const EGG_SPRITE_URL = `${GEN_FIVE_SPRITE_ROOT}/egg.png`;
  const MANAPHY_SPECIES_ID = 490;
  const MANAPHY_EGG_SPRITE_URL = "https://archives.bulbagarden.net/media/upload/e/e3/ManaphyEgg.png";
  const CRY_ROOT = "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest";
  const CRY_MIN_DELAY = 60 * 1000;
  const CRY_MAX_DELAY = 3 * 60 * 1000;
  const SHINY_ODDS = 8192;
  const MASTER_BALL_STREAK_THRESHOLD = 10;
  const MASTER_BALL_DAILY_REWARD_CHANCE = 1 / 50;
  const MAX_INCUBATOR_SLOTS = 5;
  const SNAKE_EGG_EVENT_CHANCE = 0.06;
  const SNAKE_EGG_EVENT_MINIMUM_DURATION = 5 * 60 * 1000;
  const BALL_BONUSES = { "poke-ball": 1, "premier-ball": 1, "great-ball": 1.5, "ultra-ball": 2, "master-ball": Infinity };
  const BALL_CATCH_PROFILES = {
    "poke-ball": { speed: 0.92, window: 1.24, taps: 1.18, label: "steady" },
    "premier-ball": { speed: 1.02, window: 1.38, taps: 1.08, label: "smooth" },
    "great-ball": { speed: 1.16, window: 1.6, taps: 0.88, label: "kind" },
    "ultra-ball": { speed: 1.36, window: 1.88, taps: 0.68, label: "gentle" },
    "master-ball": { speed: Infinity, window: Infinity, taps: 0, label: "certain" }
  };
  const CATCH_RING_START_SCALE = 2.7;
  const CATCH_RING_END_SCALE = 0.45;
  const CATCH_RING_SUCCESS_INNER_SCALE = 0.72;
  const CATCH_RING_SUCCESS_OUTER_SCALE = 1.08;
  const STARTER_SPECIES_BY_GENERATION = {
    1: [1, 4, 7],
    2: [152, 155, 158],
    3: [252, 255, 258],
    4: [387, 390, 393],
    5: [495, 498, 501],
    6: [650, 653, 656],
    7: [722, 725, 728],
    8: [810, 813, 816],
    9: [906, 909, 912]
  };
  const SPECIES_GENERATION_RANGES = [
    [1, 1, 151],
    [2, 152, 251],
    [3, 252, 386],
    [4, 387, 493],
    [5, 494, 649],
    [6, 650, 721],
    [7, 722, 809],
    [8, 810, 905],
    [9, 906, 1025]
  ];
  const DEV_TYPE_SAMPLE_SPECIES_IDS = {
    fire: [4, 37, 58, 126, 155],
    water: [7, 54, 60, 129, 158],
    electric: [25, 81, 100, 179, 309],
    grass: [1, 43, 69, 102, 152],
    ice: [124, 220, 361, 459, 613],
    fighting: [56, 66, 106, 107, 236],
    poison: [23, 29, 32, 41, 88],
    ground: [27, 50, 104, 207, 231],
    flying: [16, 21, 41, 84, 163],
    psychic: [63, 96, 122, 196, 280],
    bug: [10, 13, 46, 123, 165],
    rock: [74, 95, 138, 185, 299],
    ghost: [92, 200, 353, 355, 425],
    dragon: [147, 371, 443, 610, 633],
    dark: [197, 198, 215, 228, 261],
    steel: [81, 95, 208, 303, 304],
    fairy: [35, 39, 173, 175, 280]
  };
  const CONTEST_STATS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  const POKEMON_TYPES = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
  const TRAINING_STAT_CAP = 252;
  const TRAINING_TOTAL_CAP = 510;
  const EXPEDITION_MIN_DURATION = 5 * 60 * 60 * 1000;
  const EXPEDITION_MAX_DURATION = 24 * 60 * 60 * 1000;
  const EXPEDITION_REWARD_BALLS = ["poke-ball", "great-ball", "ultra-ball", "premier-ball"];
  const EXPEDITION_LOCATIONS = [
    { id: "viridian-forest", generation: 1, displayName: "Viridian Forest", region: "Kanto", description: "A leafy Kanto trail where tiny rustles are never quite leaves." },
    { id: "mt-moon", generation: 1, displayName: "Mt. Moon", region: "Kanto", description: "A moonlit cave path with glittering stones underfoot." },
    { id: "digletts-cave", generation: 1, displayName: "Diglett’s Cave", region: "Kanto", description: "A cramped tunnel where the floor keeps politely moving." },
    { id: "safari-zone", generation: 1, displayName: "Safari Zone", region: "Kanto", description: "A broad preserve with tall grass, quiet ponds, and strict snack rules." },
    { id: "cerulean-cave", generation: 1, displayName: "Cerulean Cave", region: "Kanto", description: "A deep cave route best suited to brave, well-rested Pokémon." },
    { id: "ilex-forest", generation: 2, displayName: "Ilex Forest", region: "Johto", description: "A shaded Johto forest that feels older than its trees." },
    { id: "ruins-of-alph", generation: 2, displayName: "Ruins of Alph", region: "Johto", description: "Ancient stone chambers full of odd echoes and harmless dust." },
    { id: "lake-of-rage", generation: 2, displayName: "Lake of Rage", region: "Johto", description: "A stormy lakeside walk with angry waves and bright scales." },
    { id: "national-park", generation: 2, displayName: "National Park", region: "Johto", description: "A careful stroll through trimmed paths and busy bug grass." },
    { id: "mt-silver", generation: 2, displayName: "Mt. Silver", region: "Johto", description: "A high mountain route with thin air and serious training weather." },
    { id: "petalburg-woods", generation: 3, displayName: "Petalburg Woods", region: "Hoenn", description: "A thick Hoenn woodland with soft moss and nosy footprints." },
    { id: "granite-cave", generation: 3, displayName: "Granite Cave", region: "Hoenn", description: "A cool stone cave where every step makes a tiny echo." },
    { id: "meteor-falls", generation: 3, displayName: "Meteor Falls", region: "Hoenn", description: "A waterfall cavern where old stars seem to have landed." },
    { id: "mt-pyre", generation: 3, displayName: "Mt. Pyre", region: "Hoenn", description: "A solemn mountain path watched by quiet lantern light." },
    { id: "shoal-cave", generation: 3, displayName: "Shoal Cave", region: "Hoenn", description: "A tidal cave with salt air, shells, and careful footing." },
    { id: "eterna-forest", generation: 4, displayName: "Eterna Forest", region: "Sinnoh", description: "A dense Sinnoh forest with old shadows and soft green light." },
    { id: "great-marsh", generation: 4, displayName: "Great Marsh", region: "Sinnoh", description: "A muddy wetland where every prize is a little damp." },
    { id: "iron-island", generation: 4, displayName: "Iron Island", region: "Sinnoh", description: "A hard-edged island mine with steel dust in the air." },
    { id: "turnback-cave", generation: 4, displayName: "Turnback Cave", region: "Sinnoh", description: "A strange cave where the hallway may have opinions." },
    { id: "spear-pillar", generation: 4, displayName: "Spear Pillar", region: "Sinnoh", description: "A wind-scoured summit with very dramatic architecture." },
    { id: "pinwheel-forest", generation: 5, displayName: "Pinwheel Forest", region: "Unova", description: "A lively Unova forest with twisting paths and busy underbrush." },
    { id: "desert-resort", generation: 5, displayName: "Desert Resort", region: "Unova", description: "A hot sand route where every pocket comes back dusty." },
    { id: "chargestone-cave", generation: 5, displayName: "Chargestone Cave", region: "Unova", description: "A cave full of floating stones and static in the whiskers." },
    { id: "dragonspiral-tower", generation: 5, displayName: "Dragonspiral Tower", region: "Unova", description: "A ruined tower with old steps and older stories." },
    { id: "relic-castle", generation: 5, displayName: "Relic Castle", region: "Unova", description: "A buried castle where sand has the final word." },
    { id: "santalune-forest", generation: 6, displayName: "Santalune Forest", region: "Kalos", description: "A bright Kalos forest path with beginner-friendly mysteries." },
    { id: "glittering-cave", generation: 6, displayName: "Glittering Cave", region: "Kalos", description: "A gem-lit cave that returns every footstep twice." },
    { id: "reflection-cave", generation: 6, displayName: "Reflection Cave", region: "Kalos", description: "A mirrored cavern where nobody should chase their reflection." },
    { id: "frost-cavern", generation: 6, displayName: "Frost Cavern", region: "Kalos", description: "A cold cavern route with frosty walls and careful tracks." },
    { id: "terminus-cave", generation: 6, displayName: "Terminus Cave", region: "Kalos", description: "A deep cave route with serious corners and old rails." },
    { id: "melemele-meadow", generation: 7, displayName: "Melemele Meadow", region: "Alola", description: "A sunny meadow buzzing with pollen and tiny wings." },
    { id: "lush-jungle", generation: 7, displayName: "Lush Jungle", region: "Alola", description: "A green trial path with heavy leaves and snack-sized fruit." },
    { id: "wela-volcano-park", generation: 7, displayName: "Wela Volcano Park", region: "Alola", description: "A hot volcanic climb with cinders in every footprint." },
    { id: "vast-poni-canyon", generation: 7, displayName: "Vast Poni Canyon", region: "Alola", description: "A wide canyon route with stone bridges and long echoes." },
    { id: "aether-paradise", generation: 7, displayName: "Aether Paradise", region: "Alola", description: "A clean white conservation deck with very tidy supply rooms." },
    { id: "slumbering-weald", generation: 8, displayName: "Slumbering Weald", region: "Galar", description: "A misty Galar wood where the trees whisper back." },
    { id: "glimwood-tangle", generation: 8, displayName: "Glimwood Tangle", region: "Galar", description: "A glowing mushroom forest with extremely theatrical lighting." },
    { id: "lake-of-outrage", generation: 8, displayName: "Lake of Outrage", region: "Galar", description: "A wild lakeside route with rough weather and rougher grass." },
    { id: "crown-tundra", generation: 8, displayName: "Crown Tundra", region: "Galar", description: "A snowy expedition field with old legends under the ice." },
    { id: "isle-of-armor", generation: 8, displayName: "Isle of Armor", region: "Galar", description: "A training island with beaches, caves, and suspicious mushrooms." },
    { id: "south-province", generation: 9, displayName: "South Province", region: "Paldea", description: "A bright Paldea field route with gentle hills and wandering packs." },
    { id: "tagtree-thicket", generation: 9, displayName: "Tagtree Thicket", region: "Paldea", description: "A painted woodland where everything looks freshly marked." },
    { id: "asado-desert", generation: 9, displayName: "Asado Desert", region: "Paldea", description: "A broad desert route with wind, grit, and useful things half-buried." },
    { id: "area-zero", generation: 9, displayName: "Area Zero", region: "Paldea", description: "A strange crater expedition with strict clipboard supervision." },
    { id: "glaseado-mountain", generation: 9, displayName: "Glaseado Mountain", region: "Paldea", description: "A snowy mountain route where warm scarves are not optional." }
  ];
  const SNAKE_EGG_THIEVES = [
    { id: 23, generation: 1, displayName: "Ekans" },
    { id: 24, generation: 1, displayName: "Arbok" },
    { id: 206, generation: 2, displayName: "Dunsparce" },
    { id: 336, generation: 3, displayName: "Seviper" },
    { id: 495, generation: 5, displayName: "Snivy" },
    { id: 496, generation: 5, displayName: "Servine" },
    { id: 497, generation: 5, displayName: "Serperior" },
    { id: 843, generation: 8, displayName: "Silicobra" },
    { id: 844, generation: 8, displayName: "Sandaconda" },
    { id: 982, generation: 9, displayName: "Dudunsparce" }
  ];
  const DAILY_QUEST_TEMPLATES = [
    { id: "hatch-egg", title: "Warm a shell", description: "Hatch any egg.", metric: "eggsHatched", target: 1, reward: 350 },
    { id: "catch-pokemon", title: "Settle a visitor", description: "Catch any hatchling into the PC.", metric: "pokemonCaught", target: 1, reward: 300 },
    { id: "release-visitor", title: "Gentle goodbye", description: "Release any visiting hatchling.", metric: "pokemonReleased", target: 1, reward: 180 },
    { id: "buy-poke-balls", title: "Restock the bag", description: "Buy three Poké Balls from the Mart.", metric: "pokeBallsBought", target: 3, reward: 220 },
    { id: "win-showcase", title: "Judge’s nod", description: "Win one competition.", metric: "competitionsWon", target: 1, reward: 520, available: () => state.team.length >= 6 },
    { id: "start-expedition", title: "Open the map", description: "Send a PC Pokémon on an expedition.", metric: "expeditionsStarted", target: 1, reward: 280, available: () => state.pc.length > 0 },
    { id: "finish-expedition", title: "Welcome home", description: "Have one expedition return.", metric: "expeditionsCompleted", target: 1, reward: 460, available: () => state.expeditions.length > 0 },
    { id: "use-berry", title: "Berry training", description: "Use one berry on a PC Pokémon.", metric: "berriesUsed", target: 1, reward: 240, available: () => state.pc.length > 0 },
    { id: "mark-favourite", title: "Mark a favourite", description: "Add one favourite mark in the PC.", metric: "favoriteCount", target: 1, reward: 160, available: () => state.pc.length > 0 },
    { id: "build-team", title: "Showcase prep", description: "Add one Pokémon to the showcase team.", metric: "teamCount", target: 1, reward: 180, available: () => state.pc.length > 0 },
    { id: "choose-partner", title: "Keep watch", description: "Set a Pokémon as partner.", metric: "partnerSet", target: 1, reward: 180, available: () => state.pc.length > 0 && !state.partnerUid }
  ];
  const DEV_TOOL_DEFAULTS = {
    instantHatch: false,
    boostedPassiveXp: false,
    guaranteedShiny: false,
    perfectIvs: false,
    guaranteedCatch: false,
    freeShop: false,
    alwaysWinContests: false,
    debugHud: false
  };
  const DEV_TOOL_OPTIONS = [
    ["instantHatch", "Instant hatch", "New and current eggs hatch immediately."],
    ["boostedPassiveXp", "120× passive XP", "Observed hatchlings train at development speed."],
    ["guaranteedShiny", "Forced shiny", "Every new hatch and dev-spawned Pokémon is shiny."],
    ["perfectIvs", "Perfect stats", "New player-owned Pokémon arrive with the best possible current stats."],
    ["guaranteedCatch", "Guaranteed catches", "Any thrown ball settles instantly."],
    ["freeShop", "Free Pokémart", "Shop purchases no longer spend Pokédollars."],
    ["alwaysWinContests", "Forced contest wins", "Competition judging always records a victory."],
    ["debugHud", "Debug HUD", "Show the current save and encounter state on the hatchery screen."]
  ];
  const DEV_ACTION_GROUPS = [
    ["Egg control", [["dev-hatch-now", "Hatch current egg"], ["dev-egg-10s", "Egg due in 10s"], ["dev-new-egg", "Replace with fresh egg"], ["dev-force-manaphy-egg", "Force next egg: Manaphy"], ["dev-force-partner-egg", "Force next egg: partner"], ["dev-force-plate-type-egg", "Force egg from equipped plate"], ["dev-reveal-egg", "Reveal egg contents"], ["dev-clear-forced-egg", "Clear forced next egg"], ["dev-reroll-encounter", "Spawn random hatchling"]]],
    ["Current Pokémon", [["dev-catch-current", "Catch to PC"], ["dev-make-shiny", "Make shiny"], ["dev-max-current-ivs", "Max stats"], ["dev-current-xp-1k", "+1,000 XP"], ["dev-current-xp-10k", "+10,000 XP"], ["dev-current-level-100", "Set level 100"]]],
    ["Bag & shop", [["dev-money-10k", "+₽10,000"], ["dev-money-100k", "+₽100,000"], ["dev-money-1m", "+₽1,000,000"], ["dev-max-incubators", "Max incubators"], ["dev-ball-bundle", "Add 99 shop balls"], ["dev-premier-balls", "Add 30 Premier Balls"], ["dev-add-shop-items", "Add shop items"], ["dev-add-shiny-charms", "Add 5 Shiny Charms"], ["dev-activate-shiny-charm", "Activate Shiny Charm"], ["dev-add-magmarizer", "Add Magmarizer"], ["dev-add-all-plates", "Add all plates"], ["dev-equip-random-plate", "Equip random plate"], ["dev-clear-plate", "Clear equipped plate"]]],
    ["Unlock tests", [["dev-unlock-shiny-shop", "Unlock Shiny Charm shelf"], ["dev-unlock-magmarizer-shop", "Unlock Magmarizer shelf"], ["dev-unlock-all-plates-shop", "Unlock every plate shelf"], ["dev-streak-10-ready", "Set 10-day parcel ready"], ["dev-streak-30-ready", "Set 30-day parcel ready"], ["dev-run-daily-reward", "Run daily parcel check"]]],
    ["PC & collection", [["dev-random-pc", "Add random PC Pokémon"], ["dev-six-random-pc", "Add six random Pokémon"], ["dev-shiny-pc", "Add shiny Pokémon"], ["dev-type-sampler-pc", "Add type sampler"], ["dev-fill-pokedex", "Fill enabled Pokédex"], ["dev-favorite-all-pc", "Favourite all PC"], ["dev-clear-favorites", "Clear favourites"], ["dev-first-partner", "Set first PC partner"], ["dev-clear-partner", "Clear partner"], ["dev-team-level-100", "Level team to 100"], ["dev-clear-contests", "Clear contest log"]]],
    ["Field notes", [["dev-next-field-note", "Roll new note today"], ["dev-reset-field-notes", "Reset note history"], ["dev-complete-field-notes", "Mark notes used"], ["dev-open-bag", "Open Bag tab"], ["dev-open-pc", "Open PC tab"], ["dev-open-mart", "Open Pokémart tab"]]]
  ];
  const THEME_TEMPLATES = [
    ["field", "Field ledger", "Parchment notes, navy ink, and warm amber tabs"],
    ["night", "Night archive", "Midnight pages, cyan labels, and candlelit buttons"],
    ["herbarium", "Herbarium", "Sage pages, forest ink, and pressed-flower red"],
    ["mono", "Monochrome", "Sharp black, white, and graphite pages"],
    ["pokedex_red", "Pokédex red", "Cream paper, deep Pokédex red, and field-note green"],
    ["ocean_lab", "Ocean lab", "Pale cyan pages, deep teal ink, and sea-lab blue"],
    ["violet_void", "Violet void", "Dark violet panels, moonlit copy, and spectral highlights"],
    ["solar_terminal", "Solar terminal", "Black-gold console glow with warm signal lights"],
    ["rose_quartz", "Rose quartz", "Blush paper, plum ink, and soft berry accents"],
    ["blueprint", "Blueprint", "Deep drafting-blue pages and bright cyan rule lines"],
    ["ember_forge", "Ember forge", "Sooted pages, copper-orange buttons, and warm metal notes"],
    ["mint_circuit", "Mint circuit", "Clean mint pages with dark circuit-board lines"],
    ["goldenrod", "Goldenrod", "Warm cream pages, dark umber ink, and goldenrod stamps"],
    ["lavender_dusk", "Lavender dusk", "Cool purple dusk with pale lavender lettering"],
    ["rocket_terminal", "Rocket terminal", "Dark steel panels with red alert buttons"],
    ["safari_dusk", "Safari dusk", "Dusty grassland pages, deep olive ink, and burnt-clay accents"],
    ["ultra_beast", "Ultra beast", "Deep ultramarine with electric cyan and strange magenta"]
  ];
  const THEME_VALUES = new Set(THEME_TEMPLATES.map(([value]) => value));
  const DEFAULT_STATE = {
    version: 13,
    player: null,
    money: 0,
    streak: 0,
    lastLoginDate: null,
    lastDailyReward: 0,
    lastDailyBonus: null,
    forcedNextEggSpeciesId: 0,
    fieldNotes: { currentDate: "", currentId: "", seen: false, usedIds: [] },
    dailyQuests: { currentDate: "", quests: [] },
    incubators: { capacity: 1, activeIndex: 0, slots: [{ id: "incubator-1", egg: null, encounter: null }] },
    egg: null,
    encounter: null,
    pokedex: {},
    caughtSpeciesIds: [],
    caughtBallIds: [],
    caughtShinySpeciesIds: [],
    claimedAchievementIds: [],
    pc: [],
    expeditions: [],
    expeditionLog: [],
    souvenirs: {},
    team: [],
    partnerUid: "",
    inventory: { "poke-ball": 5, "premier-ball": 0, "great-ball": 0, "ultra-ball": 0, "master-ball": 0 },
    items: {},
    equippedPlate: "",
    activeItemEffects: { shinyCharmEggsRemaining: 0 },
    settings: { generations: [1, 2, 3, 4, 5, 6, 7, 8, 9], theme: "field", devTools: { ...DEV_TOOL_DEFAULTS } },
    statistics: { eggsHatched: 0, eggsLaid: 0, eggsBought: 0, eggsLostToSnakes: 0, pokemonCaught: 0, pokemonReleased: 0, competitionsWon: 0, competitionWinsByStat: {}, masterBallsFound: 0, pokeBallsBought: 0, shinyCharmUses: 0, achievementRewardsClaimed: 0, dailyQuestRewardsClaimed: 0, expeditionsStarted: 0, expeditionsCompleted: 0, berriesUsed: 0, keepsakesFound: 0, keepsakesSold: 0, mysteriousItemsUnlocked: 0, mysteriousSummons: 0 },
    competitionLog: []
  };

  const state = loadState();
  normaliseIncubators();
  normaliseEggSequenceTracking();
  normaliseTrainingState();
  normaliseDailyQuestState();
  normaliseExpeditionState();
  syncMysteriousItemUnlocks(false);
  state.settings.theme = normaliseTheme(state.settings.theme);
  let activeTab = "home";
  let clockTimer = null;
  let isHatching = false;
  let nextHatchRetryAt = 0;
  let isCompetitionRunning = false;
  let isSettlingExpeditions = false;
  let enabledSpeciesTotal = 0;
  let enabledSpeciesIds = [];
  let shopItems = null;
  let pokedexFilter = "";
  let pcSearch = "";
  let pcFilter = "all";
  let pcSort = "newest";
  let idleCryTimer = null;
  let idleCryUid = null;
  let currentCryAudio = null;
  let pendingImportSave = null;
  let pendingMysteriousUnlockToasts = [];
  let catchChallenge = null;
  let catchChallengeTimer = null;
  let isPreparingEgg = false;
  let renderMotionIndex = 0;
  let previousMoney = Number(state.money || 0);
  let previousStreak = Number(state.streak || 0);
  let previousTheme = state.settings?.theme || "field";
  let nextEggPreparationRetryAt = 0;
  const apiCache = new Map();
  const generationCache = new Map();
  const growthCache = new Map();

  const view = document.getElementById("view");
  const modalRoot = document.getElementById("modal-root");
  const toastRoot = document.getElementById("toast-root");
  const appShell = document.getElementById("app");
  const moneyDisplay = document.getElementById("money-display");
  const streakDisplay = document.getElementById("streak-display");
  const mobileNav = document.getElementById("mobile-nav");
  const menuButton = document.getElementById("menu-button");

  function uniqueNumberList(values) {
    return [...new Set((Array.isArray(values) ? values : []).map(Number).filter((value) => Number.isInteger(value) && value > 0))];
  }

  function uniqueStringList(values) {
    return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean))];
  }

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored || ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].includes(stored.version)) return cloneDefault();
      const storedGenerations = Array.isArray(stored.settings?.generations) ? stored.settings.generations.filter((generation) => Number.isInteger(generation) && generation >= 1 && generation <= 9) : [];
      const usedLegacyDefault = stored.version === 1
        && storedGenerations.length === 5
        && storedGenerations.every((generation, index) => generation === index + 1);
      return {
        ...cloneDefault(),
        ...stored,
        version: 13,
        player: stored.player ? { ...stored.player, gender: ["boy", "girl", "other"].includes(stored.player.gender) ? stored.player.gender : "other" } : null,
        inventory: { ...DEFAULT_STATE.inventory, ...(stored.inventory || {}) },
        items: { ...(stored.items || {}) },
        souvenirs: { ...(stored.souvenirs || {}) },
        expeditions: Array.isArray(stored.expeditions) ? stored.expeditions : [],
        expeditionLog: Array.isArray(stored.expeditionLog) ? stored.expeditionLog.slice(0, 30) : [],
        dailyQuests: { ...DEFAULT_STATE.dailyQuests, ...(stored.dailyQuests || {}), quests: Array.isArray(stored.dailyQuests?.quests) ? stored.dailyQuests.quests : [] },
        equippedPlate: typeof stored.equippedPlate === "string" ? stored.equippedPlate : "",
        activeItemEffects: { ...DEFAULT_STATE.activeItemEffects, ...(stored.activeItemEffects || {}) },
        settings: {
          ...DEFAULT_STATE.settings,
          ...(stored.settings || {}),
          generations: usedLegacyDefault || !storedGenerations.length ? [...DEFAULT_STATE.settings.generations] : storedGenerations,
          devTools: { ...DEV_TOOL_DEFAULTS, ...(stored.settings?.devTools || {}) }
        },
        statistics: { ...DEFAULT_STATE.statistics, ...(stored.statistics || {}), competitionWinsByStat: { ...DEFAULT_STATE.statistics.competitionWinsByStat, ...(stored.statistics?.competitionWinsByStat || {}) } },
        caughtSpeciesIds: uniqueNumberList([...(Array.isArray(stored.caughtSpeciesIds) ? stored.caughtSpeciesIds : []), ...((stored.pc || []).map((pokemon) => pokemon?.speciesId))]),
        caughtBallIds: uniqueStringList([...(Array.isArray(stored.caughtBallIds) ? stored.caughtBallIds : []), ...((stored.pc || []).map((pokemon) => pokemon?.caughtWith))]),
        caughtShinySpeciesIds: uniqueNumberList([...(Array.isArray(stored.caughtShinySpeciesIds) ? stored.caughtShinySpeciesIds : []), ...((stored.pc || []).filter((pokemon) => pokemon?.shiny).map((pokemon) => pokemon?.speciesId))]),
        claimedAchievementIds: uniqueStringList(stored.claimedAchievementIds || []),
        fieldNotes: { ...DEFAULT_STATE.fieldNotes, ...(stored.fieldNotes || {}), usedIds: Array.isArray(stored.fieldNotes?.usedIds) ? stored.fieldNotes.usedIds : [] }
      };
    } catch {
      return cloneDefault();
    }
  }


  function blankTrainingMap() {
    return Object.fromEntries(CONTEST_STATS.map((stat) => [stat, 0]));
  }

  function normalisePokemonTraining(pokemon) {
    if (!pokemon || typeof pokemon !== "object") return;
    const source = pokemon.evs && typeof pokemon.evs === "object" ? pokemon.evs : {};
    const clean = blankTrainingMap();
    let total = 0;
    for (const stat of CONTEST_STATS) {
      const value = Math.min(TRAINING_STAT_CAP, Math.max(0, Math.floor(Number(source[stat] || 0))));
      clean[stat] = value;
      total += value;
    }
    if (total > TRAINING_TOTAL_CAP) {
      let excess = total - TRAINING_TOTAL_CAP;
      for (const stat of [...CONTEST_STATS].reverse()) {
        if (excess <= 0) break;
        const reduction = Math.min(clean[stat], excess);
        clean[stat] -= reduction;
        excess -= reduction;
      }
    }
    pokemon.evs = clean;
  }

  function normaliseTrainingState() {
    const pc = Array.isArray(state.pc) ? state.pc : [];
    pc.forEach(normalisePokemonTraining);
    const expeditions = Array.isArray(state.expeditions) ? state.expeditions : [];
    expeditions.forEach((entry) => normalisePokemonTraining(entry?.pokemon));
    if (state.encounter) normalisePokemonTraining(state.encounter);
    incubatorSlots().forEach((slot) => {
      if (slot.encounter) normalisePokemonTraining(slot.encounter);
    });
  }

  function trainingTotal(pokemon) {
    normalisePokemonTraining(pokemon);
    return CONTEST_STATS.reduce((total, stat) => total + Number(pokemon?.evs?.[stat] || 0), 0);
  }

  function trainingRoomForStat(pokemon, stat) {
    normalisePokemonTraining(pokemon);
    return Math.max(0, Math.min(TRAINING_STAT_CAP - Number(pokemon?.evs?.[stat] || 0), TRAINING_TOTAL_CAP - trainingTotal(pokemon)));
  }

  function describeStatEffects(statEffects = {}) {
    return Object.entries(statEffects)
      .filter(([stat, amount]) => CONTEST_STATS.includes(stat) && Number(amount) > 0)
      .map(([stat, amount]) => `+${Number(amount)} ${statLabel(stat)}`)
      .join(" / ") || "training";
  }

  function normaliseDailyQuestState() {
    const saved = state.dailyQuests && typeof state.dailyQuests === "object" ? state.dailyQuests : {};
    state.dailyQuests = {
      currentDate: typeof saved.currentDate === "string" ? saved.currentDate : "",
      quests: Array.isArray(saved.quests) ? saved.quests.filter(Boolean) : []
    };
  }

  function statisticMetric(metric) {
    return Math.max(0, Math.floor(Number(state.statistics?.[metric] || 0)));
  }

  function dailyQuestMetricValue(metric) {
    if (metric === "favoriteCount") return state.pc.filter((pokemon) => pokemon.favorite).length;
    if (metric === "teamCount") return state.team.length;
    if (metric === "partnerSet") return state.partnerUid ? 1 : 0;
    return statisticMetric(metric);
  }

  function dailyQuestTemplate(templateId) {
    return DAILY_QUEST_TEMPLATES.find((template) => template.id === templateId) || null;
  }

  function dailyQuestProgress(quest) {
    const current = dailyQuestMetricValue(quest.metric);
    return Math.max(0, current - Math.max(0, Math.floor(Number(quest.start || 0))));
  }

  function isDailyQuestComplete(quest) {
    return dailyQuestProgress(quest) >= Number(quest.target || 1);
  }

  function questAvailable(template) {
    return typeof template.available === "function" ? template.available() : true;
  }

  function createDailyQuest(template) {
    return {
      id: `${localDateKey()}-${template.id}-${makeId()}`,
      templateId: template.id,
      title: template.title,
      description: template.description,
      metric: template.metric,
      start: dailyQuestMetricValue(template.metric),
      target: template.target,
      reward: template.reward,
      claimed: false,
      createdAt: new Date().toISOString()
    };
  }

  function rollDailyQuests() {
    const available = DAILY_QUEST_TEMPLATES.filter(questAvailable);
    const fallback = DAILY_QUEST_TEMPLATES.filter((template) => !available.includes(template));
    const pool = [...available, ...fallback];
    const selected = [];
    const used = new Set();
    while (selected.length < 3 && used.size < pool.length) {
      const template = randomChoice(pool.filter((entry) => !used.has(entry.id)));
      used.add(template.id);
      selected.push(createDailyQuest(template));
    }
    state.dailyQuests = { currentDate: localDateKey(), quests: selected };
  }

  function ensureDailyQuests() {
    normaliseDailyQuestState();
    if (!state.player) return;
    if (state.dailyQuests.currentDate !== localDateKey() || state.dailyQuests.quests.length !== 3) rollDailyQuests();
  }

  function claimDailyQuest(questId) {
    ensureDailyQuests();
    const quest = state.dailyQuests.quests.find((entry) => entry.id === questId);
    if (!quest || quest.claimed || !isDailyQuestComplete(quest)) return;
    const reward = Math.max(0, Math.floor(Number(quest.reward || 0)));
    quest.claimed = true;
    quest.claimedAt = new Date().toISOString();
    state.money += reward;
    state.statistics.dailyQuestRewardsClaimed = (state.statistics.dailyQuestRewardsClaimed || 0) + 1;
    saveState();
    if (activeTab === "home") render();
    toast(`Daily quest complete: +₽${reward.toLocaleString()}.`);
  }

  function normaliseExpeditionState() {
    const expeditions = Array.isArray(state.expeditions) ? state.expeditions : [];
    state.expeditions = expeditions
      .filter((entry) => entry && entry.pokemon && typeof entry.id === "string")
      .map((entry) => ({
        id: entry.id,
        pokemon: entry.pokemon,
        locationId: String(entry.locationId || ""),
        locationName: String(entry.locationName || "Unknown route"),
        region: String(entry.region || ""),
        generation: Math.max(1, Math.min(9, Math.floor(Number(entry.generation || 1)))),
        startedAt: Number(entry.startedAt || Date.now()),
        returnAt: Number(entry.returnAt || Date.now() + EXPEDITION_MIN_DURATION),
        durationMs: Number(entry.durationMs || EXPEDITION_MIN_DURATION)
      }));
    state.expeditions.forEach((entry) => normalisePokemonTraining(entry.pokemon));
    state.expeditionLog = Array.isArray(state.expeditionLog) ? state.expeditionLog.slice(0, 30) : [];
    state.souvenirs = state.souvenirs && typeof state.souvenirs === "object" ? state.souvenirs : {};
  }

  function enabledExpeditionLocations() {
    const generations = enabledGenerationNumbers();
    return EXPEDITION_LOCATIONS.filter((location) => generations.includes(location.generation));
  }

  function expeditionLocation(locationId) {
    return EXPEDITION_LOCATIONS.find((location) => location.id === locationId) || null;
  }

  function expeditionDuration() {
    return randomInt(EXPEDITION_MIN_DURATION, EXPEDITION_MAX_DURATION + 1);
  }

  function expeditionReady(entry) {
    return Number(entry?.returnAt || 0) <= Date.now();
  }

  function activeExpeditionForPokemon(uid) {
    return state.expeditions.find((entry) => entry.pokemon?.uid === uid) || null;
  }

  function addSouvenirToBag(itemId, amount = 1) {
    state.souvenirs[itemId] = Math.max(0, Math.floor(Number(state.souvenirs[itemId] || 0) + Number(amount || 0)));
    if (state.souvenirs[itemId] <= 0) delete state.souvenirs[itemId];
  }

  function expeditionRewardBundle(durationMs) {
    const registry = shopItemRegistry();
    const berries = registry && typeof registry.berries === "function" ? registry.berries() : [];
    const souvenirs = registry && typeof registry.souvenirs === "function" ? registry.souvenirs() : [];
    const hours = Math.max(5, durationMs / 3600000);
    const money = randomInt(Math.floor(120 + hours * 28), Math.floor(280 + hours * 62));
    const xp = randomInt(Math.floor(900 + hours * 210), Math.floor(1500 + hours * 340));
    const ballCount = randomInt(1, 4);
    const berryCount = berries.length ? randomInt(1, 4) : 0;
    const souvenirCount = souvenirs.length ? randomInt(1, 3) : 0;
    const balls = Array.from({ length: ballCount }, () => randomChoice(EXPEDITION_REWARD_BALLS));
    const foundBerries = Array.from({ length: berryCount }, () => randomChoice(berries).id);
    const foundSouvenirs = Array.from({ length: souvenirCount }, () => randomChoice(souvenirs).id);
    return { money, xp, balls, berries: foundBerries, souvenirs: foundSouvenirs };
  }

  function countRewards(values) {
    const counts = new Map();
    values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].map(([id, count]) => ({ id, count }));
  }

  function rewardListText(rewards) {
    const parts = [];
    if (rewards.money) parts.push(`₽${rewards.money.toLocaleString()}`);
    countRewards(rewards.balls || []).forEach((entry) => parts.push(`${entry.count} ${displayItemName(entry.id)}`));
    countRewards(rewards.berries || []).forEach((entry) => parts.push(`${entry.count} ${displayItemName(entry.id)}`));
    countRewards(rewards.souvenirs || []).forEach((entry) => parts.push(`${entry.count} ${displayItemName(entry.id)}`));
    return parts.join(", ") || "field notes";
  }

  async function settleExpedition(entry, notify = false) {
    if (!entry || !expeditionReady(entry)) return false;
    const index = state.expeditions.findIndex((candidate) => candidate.id === entry.id);
    if (index < 0) return false;
    const pokemon = state.expeditions[index].pokemon;
    const rewards = expeditionRewardBundle(Number(entry.durationMs || EXPEDITION_MIN_DURATION));
    state.expeditions.splice(index, 1);
    const result = await addExperience(pokemon, rewards.xp);
    state.pc.push(pokemon);
    state.money += rewards.money;
    rewards.balls.forEach((ball) => { state.inventory[ball] = (state.inventory[ball] || 0) + 1; });
    rewards.berries.forEach((berryId) => addItemToBag(berryId, 1));
    rewards.souvenirs.forEach((itemId) => addSouvenirToBag(itemId, 1));
    state.statistics.keepsakesFound = (state.statistics.keepsakesFound || 0) + rewards.souvenirs.length;
    state.statistics.expeditionsCompleted = (state.statistics.expeditionsCompleted || 0) + 1;
    state.expeditionLog.unshift({
      id: makeId(),
      pokemonName: pokemon.nickname || pokemon.displayName,
      sprite: pokemon.sprite,
      locationName: entry.locationName,
      region: entry.region,
      xp: rewards.xp,
      rewards,
      level: pokemon.level,
      leveled: result.newLevel > result.oldLevel,
      evolutions: result.evolutions,
      returnedAt: new Date().toISOString()
    });
    state.expeditionLog = state.expeditionLog.slice(0, 30);
    saveState();
    if (notify) {
      const evolutionText = result.evolutions.length ? ` ${result.evolutions.join(" ")}!` : "";
      toast(`${pokemon.nickname || pokemon.displayName} returned from ${entry.locationName}: +${rewards.xp.toLocaleString()} XP, ${rewardListText(rewards)}.${evolutionText}`);
    }
    return true;
  }

  async function settleReturnedExpeditions(notify = true) {
    if (isSettlingExpeditions) return;
    normaliseExpeditionState();
    const ready = state.expeditions.filter(expeditionReady);
    if (!ready.length) return;
    isSettlingExpeditions = true;
    try {
      for (const entry of ready) {
        try {
          await settleExpedition(entry, notify);
        } catch {
          if (notify) toast(`${entry.pokemon?.nickname || entry.pokemon?.displayName || "A Pokémon"} is back at the gate, but the growth record could not be opened yet.`);
        }
      }
      if (activeTab === "pc" || activeTab === "home" || activeTab === "bag") render();
    } finally {
      isSettlingExpeditions = false;
    }
  }


  function createIncubatorSlot(index) {
    return { id: `incubator-${index + 1}`, egg: null, encounter: null };
  }

  function clampIncubatorCapacity(value) {
    const capacity = Math.floor(Number(value || 1));
    return Math.min(MAX_INCUBATOR_SLOTS, Math.max(1, Number.isFinite(capacity) ? capacity : 1));
  }

  function normaliseIncubators() {
    const saved = state.incubators && typeof state.incubators === "object" ? state.incubators : {};
    const capacity = clampIncubatorCapacity(saved.capacity || 1);
    const savedSlots = Array.isArray(saved.slots) ? saved.slots : [];
    const slots = Array.from({ length: capacity }, (_, index) => {
      const savedSlot = savedSlots[index] && typeof savedSlots[index] === "object" ? savedSlots[index] : {};
      return {
        id: typeof savedSlot.id === "string" && savedSlot.id ? savedSlot.id : `incubator-${index + 1}`,
        egg: savedSlot.egg || null,
        encounter: savedSlot.encounter || null
      };
    });
    if ((state.egg || state.encounter) && !slots.some((slot) => slot.egg || slot.encounter)) {
      slots[0].egg = state.egg || null;
      slots[0].encounter = state.encounter || null;
    }
    state.incubators = {
      capacity,
      activeIndex: Math.min(capacity - 1, Math.max(0, Math.floor(Number(saved.activeIndex || 0)))),
      slots
    };
    syncLegacyFromActiveIncubator();
  }

  function activeIncubatorIndex() {
    return Math.min(incubatorCapacity() - 1, Math.max(0, Math.floor(Number(state.incubators?.activeIndex || 0))));
  }

  function incubatorCapacity() {
    return clampIncubatorCapacity(state.incubators?.capacity || 1);
  }

  function incubatorSlots() {
    normaliseIncubatorsIfNeeded();
    return state.incubators.slots;
  }

  function normaliseIncubatorsIfNeeded() {
    if (!state.incubators || !Array.isArray(state.incubators.slots) || !state.incubators.slots.length) normaliseIncubators();
  }

  function activeIncubatorSlot() {
    normaliseIncubatorsIfNeeded();
    return state.incubators.slots[activeIncubatorIndex()];
  }

  function syncActiveIncubatorFromLegacy() {
    normaliseIncubatorsIfNeeded();
    const slot = state.incubators.slots[activeIncubatorIndex()];
    slot.egg = state.egg || null;
    slot.encounter = state.encounter || null;
  }

  function syncLegacyFromActiveIncubator() {
    normaliseIncubatorsIfNeeded();
    const slot = state.incubators.slots[activeIncubatorIndex()] || createIncubatorSlot(0);
    state.egg = slot.egg || null;
    state.encounter = slot.encounter || null;
  }

  function selectIncubatorSlot(index) {
    normaliseIncubatorsIfNeeded();
    syncActiveIncubatorFromLegacy();
    state.incubators.activeIndex = Math.min(incubatorCapacity() - 1, Math.max(0, Math.floor(Number(index || 0))));
    syncLegacyFromActiveIncubator();
  }

  function upgradeIncubatorCapacity() {
    normaliseIncubatorsIfNeeded();
    syncActiveIncubatorFromLegacy();
    const current = incubatorCapacity();
    if (current >= MAX_INCUBATOR_SLOTS) return false;
    state.incubators.capacity = current + 1;
    while (state.incubators.slots.length < state.incubators.capacity) state.incubators.slots.push(createIncubatorSlot(state.incubators.slots.length));
    return true;
  }

  function maxIncubatorCapacity() {
    normaliseIncubatorsIfNeeded();
    syncActiveIncubatorFromLegacy();
    state.incubators.capacity = MAX_INCUBATOR_SLOTS;
    while (state.incubators.slots.length < MAX_INCUBATOR_SLOTS) state.incubators.slots.push(createIncubatorSlot(state.incubators.slots.length));
  }

  function normaliseTheme(theme) {
    return THEME_VALUES.has(theme) ? theme : DEFAULT_STATE.settings.theme;
  }

  function saveState() {
    syncActiveIncubatorFromLegacy();
    syncMysteriousItemUnlocks(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateHeader();
  }

  function safeFileNamePart(value) {
    return String(value || "hatchery").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "hatchery";
  }

  function exportSaveFile() {
    syncActiveIncubatorFromLegacy();
    const exportedState = JSON.parse(JSON.stringify(state));
    const payload = {
      magic: SAVE_EXPORT_MAGIC,
      exportVersion: SAVE_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      storageKey: STORAGE_KEY,
      saveVersion: exportedState.version,
      playerName: exportedState.player?.name || "",
      save: exportedState
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const namePart = safeFileNamePart(exportedState.player?.name);
    link.href = url;
    link.download = `pocket_hatchery_${namePart}_${localDateKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("Save backup packed into a little file.");
  }

  function extractImportedSave(payload) {
    if (!payload || typeof payload !== "object") throw new Error("This file does not look like a hatchery save.");
    const candidate = payload.magic === SAVE_EXPORT_MAGIC && payload.save && typeof payload.save === "object" ? payload.save : payload;
    if (!candidate || typeof candidate !== "object") throw new Error("This file does not contain a hatchery save.");
    if (!Number.isInteger(candidate.version)) throw new Error("This save is missing its version card.");
    if (candidate.version > DEFAULT_STATE.version) throw new Error("This save comes from a newer hatchery build.");
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(candidate.version)) throw new Error("This save version is not supported by this build.");
    if (!candidate.player || typeof candidate.player !== "object" || typeof candidate.player.name !== "string") throw new Error("This save is missing its registration card.");
    if (!candidate.settings || typeof candidate.settings !== "object") throw new Error("This save is missing its hatchery settings.");
    return candidate;
  }

  function requestSaveImport() {
    const input = document.getElementById("save-import-input");
    if (!input) return;
    input.value = "";
    input.click();
  }

  function showImportConfirmation(importedSave) {
    pendingImportSave = importedSave;
    const importedName = importedSave.player?.name || "unknown researcher";
    const currentName = state.player?.name || "this hatchery";
    const eggCount = Number(importedSave.statistics?.eggsHatched || 0);
    const caughtCount = Number(importedSave.statistics?.pokemonCaught || 0);
    const pcCount = Array.isArray(importedSave.pc) ? importedSave.pc.length : 0;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="import-title"><p class="eyebrow">Save import</p><h2 id="import-title">Open this backup?</h2><p class="modal-intro">This will replace ${escapeHtml(currentName)} on this browser with ${escapeHtml(importedName)}’s saved hatchery. The current local save will be overwritten.</p><dl class="summary-list"><dt>Backup name</dt><dd>${escapeHtml(importedName)}</dd><dt>Save version</dt><dd>${Number(importedSave.version || 0)}</dd><dt>Eggs hatched</dt><dd>${eggCount.toLocaleString()}</dd><dt>Pokémon caught</dt><dd>${caughtCount.toLocaleString()}</dd><dt>PC Pokémon</dt><dd>${pcCount.toLocaleString()}</dd></dl><div class="button-row"><button class="button button-accent" type="button" data-action="confirm-import-save">Import backup</button><button class="button" type="button" data-close-modal>Keep current save</button></div></section></div>`;
  }

  function importPendingSave() {
    if (!pendingImportSave) {
      toast("No backup is waiting to be opened.");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingImportSave));
    window.location.reload();
  }

  function readImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result || ""));
        const importedSave = extractImportedSave(payload);
        showImportConfirmation(importedSave);
      } catch (error) {
        pendingImportSave = null;
        toast(error instanceof Error ? error.message : "That backup could not be opened.");
      }
    };
    reader.onerror = () => {
      pendingImportSave = null;
      toast("That backup could not be read.");
    };
    reader.readAsText(file);
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dayDifference(fromKey, toKey) {
    if (!fromKey) return Infinity;
    const from = new Date(`${fromKey}T12:00:00`);
    const to = new Date(`${toKey}T12:00:00`);
    return Math.round((to - from) / 86400000);
  }


  function fieldNoteLibrary() {
    const source = Array.isArray(window.PocketHatcheryFieldNotes) ? window.PocketHatcheryFieldNotes : [];
    const seen = new Set();
    const notes = source
      .filter((note) => note && typeof note.id === "string" && typeof note.title === "string" && typeof note.text === "string")
      .filter((note) => {
        if (seen.has(note.id)) return false;
        seen.add(note.id);
        return true;
      });
    return notes.length ? notes : [{ id: "fallback_note", title: "Warm little mystery", text: "The hatchery is quiet today, which usually means something interesting is thinking about happening." }];
  }

  function normaliseFieldNoteState() {
    const notes = fieldNoteLibrary();
    const validIds = new Set(notes.map((note) => note.id));
    const saved = state.fieldNotes || {};
    state.fieldNotes = {
      currentDate: typeof saved.currentDate === "string" ? saved.currentDate : "",
      currentId: validIds.has(saved.currentId) ? saved.currentId : "",
      seen: Boolean(saved.seen),
      usedIds: Array.isArray(saved.usedIds) ? saved.usedIds.filter((id, index, ids) => validIds.has(id) && ids.indexOf(id) === index) : []
    };
  }

  function chooseDailyFieldNote(today, previousId = "") {
    const notes = fieldNoteLibrary();
    const used = new Set(state.fieldNotes.usedIds || []);
    let available = notes.filter((note) => !used.has(note.id));
    if (!available.length) {
      state.fieldNotes.usedIds = [];
      available = notes.length > 1 ? notes.filter((note) => note.id !== previousId) : [...notes];
    }
    const note = available[Math.floor(Math.random() * available.length)] || notes[0];
    state.fieldNotes.currentDate = today;
    state.fieldNotes.currentId = note.id;
    state.fieldNotes.seen = false;
    return note;
  }

  function getDailyFieldNote() {
    normaliseFieldNoteState();
    const today = localDateKey();
    const notes = fieldNoteLibrary();
    let note = notes.find((entry) => entry.id === state.fieldNotes.currentId);
    if (!note) {
      note = chooseDailyFieldNote(today);
      saveState();
      return note;
    }
    if (state.fieldNotes.currentDate !== today && state.fieldNotes.seen) {
      note = chooseDailyFieldNote(today, note.id);
      saveState();
      return note;
    }
    return note;
  }

  function markDailyFieldNoteSeen(noteId) {
    normaliseFieldNoteState();
    if (state.fieldNotes.currentId !== noteId) return;
    const today = localDateKey();
    let changed = false;
    if (state.fieldNotes.currentDate !== today) {
      state.fieldNotes.currentDate = today;
      changed = true;
    }
    if (!state.fieldNotes.seen) {
      state.fieldNotes.seen = true;
      if (!state.fieldNotes.usedIds.includes(noteId)) state.fieldNotes.usedIds.push(noteId);
      changed = true;
    }
    if (changed) saveState();
  }

  function renderFieldNoteAside({ headingId = "home-title", metaRows = "", extraHtml = "" } = {}) {
    const note = getDailyFieldNote();
    const notes = fieldNoteLibrary();
    const noteNumber = Math.max(1, notes.findIndex((entry) => entry.id === note.id) + 1);
    markDailyFieldNoteSeen(note.id);
    return `
        <aside class="field-note daily-field-note">
          <p class="eyebrow">Field note ${String(noteNumber).padStart(3, "0")}</p>
          <h1 id="${headingId}">${escapeHtml(note.title)}</h1>
          <div class="leaf-rule" aria-hidden="true"><span>⌁</span></div>
          <p class="field-copy">${escapeHtml(note.text)}</p>
          ${extraHtml}
          ${metaRows ? `<dl class="field-meta">${metaRows}</dl>` : ""}
        </aside>`;
  }

  function applyDailyReward() {
    if (!state.player) return;
    const today = localDateKey();
    if (state.lastLoginDate === today) return;
    const gap = dayDifference(state.lastLoginDate, today);
    state.streak = gap === 1 ? state.streak + 1 : 1;
    const reward = Math.floor(100 * Math.pow(1.25, Math.max(0, state.streak - 1)));
    const foundMasterBall = state.streak >= MASTER_BALL_STREAK_THRESHOLD && Math.random() < MASTER_BALL_DAILY_REWARD_CHANCE;
    state.money += reward;
    state.lastDailyReward = reward;
    state.lastDailyBonus = foundMasterBall ? "master-ball" : null;
    if (foundMasterBall) {
      state.inventory["master-ball"] = (state.inventory["master-ball"] || 0) + 1;
      state.statistics.masterBallsFound = (state.statistics.masterBallsFound || 0) + 1;
    }
    state.lastLoginDate = today;
    rollDailyQuests();
    saveState();
    window.setTimeout(() => {
      const streakText = `Streak: ${state.streak} day${state.streak === 1 ? "" : "s"}.`;
      if (foundMasterBall) {
        toast(`Daily hatchery gift: +₽${reward}. ${streakText} A Master Ball was tucked into today’s parcel.`);
        return;
      }
      toast(`Daily hatchery gift: +₽${reward}. ${streakText}`);
    }, 350);
  }

  function shouldUseOpeningStarterEgg() {
    return !!state.player
      && activeIncubatorIndex() === 0
      && !incubatorSlots().some((slot) => slot.encounter)
      && Number(state.statistics?.eggsHatched || 0) === 0
      && Object.keys(state.pokedex || {}).length === 0
      && !state.pc.length;
  }

  function baseStatTotalFromStats(baseStats) {
    return CONTEST_STATS.reduce((total, stat) => total + Number(baseStats?.[stat] || 0), 0);
  }

  function hatchDurationForBaseStatTotal(baseStatTotal = 0) {
    const total = Number(baseStatTotal || 0);
    return total > 0 ? total * HATCH_MILLISECONDS_PER_BASE_STAT_POINT : FALLBACK_HATCH_DURATION;
  }

  function onboardingEggSpeedMultiplier(eggNumber = 0) {
    const number = Math.floor(Number(eggNumber || 0));
    if (number <= 1 || number > ONBOARDING_FAST_EGG_COUNT) return 1;
    const span = Math.max(1, ONBOARDING_FAST_EGG_COUNT - 2);
    const progress = Math.min(1, Math.max(0, (number - 2) / span));
    return ONBOARDING_FAST_EGG_START_MULTIPLIER + ((ONBOARDING_FAST_EGG_END_MULTIPLIER - ONBOARDING_FAST_EGG_START_MULTIPLIER) * progress);
  }

  function hatchDurationForEgg(openingStarterEgg = false, baseStatTotal = 0, eggNumber = 0) {
    if (isDevToolEnabled("instantHatch")) return 0;
    if (openingStarterEgg) return Math.max(1, Math.floor(FIRST_EGG_HATCH_DURATION * hatchDurationMultiplier()));
    const onboardingMultiplier = onboardingEggSpeedMultiplier(eggNumber);
    return Math.max(1, Math.floor(hatchDurationForBaseStatTotal(baseStatTotal) * onboardingMultiplier * hatchDurationMultiplier()));
  }

  function currentEggCountInIncubators() {
    return incubatorSlots().reduce((total, slot) => total + (slot.egg || slot.encounter ? 1 : 0), 0);
  }

  function normaliseEggSequenceTracking() {
    let laidCount = Math.max(Math.floor(Number(state.statistics?.eggsLaid || 0)), Math.floor(Number(state.statistics?.eggsHatched || 0)));
    incubatorSlots().forEach((slot) => {
      const existingNumber = Math.floor(Number(slot.egg?.eggNumber || 0));
      if (existingNumber > 0) laidCount = Math.max(laidCount, existingNumber);
    });
    incubatorSlots().forEach((slot) => {
      if (!slot.egg || Number(slot.egg.eggNumber || 0) > 0) return;
      laidCount += 1;
      slot.egg.eggNumber = laidCount;
    });
    state.statistics.eggsLaid = laidCount;
  }

  function allocateEggNumber() {
    state.statistics.eggsLaid = Math.max(Math.floor(Number(state.statistics?.eggsLaid || 0)), Math.floor(Number(state.statistics?.eggsHatched || 0)));
    state.statistics.eggsLaid += 1;
    return state.statistics.eggsLaid;
  }

  function normalisedSpeciesId(value) {
    const speciesId = Number(value || 0);
    return Number.isFinite(speciesId) && speciesId > 0 ? Math.floor(speciesId) : 0;
  }

  function isManaphySpeciesId(speciesId) {
    return normalisedSpeciesId(speciesId) === MANAPHY_SPECIES_ID;
  }

  function eggContainsManaphy(egg = state.egg) {
    return isManaphySpeciesId(egg?.pendingEncounter?.speciesId || egg?.forcedSpeciesId);
  }

  function eggSpriteUrl(egg = state.egg) {
    return eggContainsManaphy(egg) ? MANAPHY_EGG_SPRITE_URL : EGG_SPRITE_URL;
  }

  function eggCostForSlot(slotIndex = activeIncubatorIndex()) {
    return slotIndex === 0 && shouldUseOpeningStarterEgg() ? 0 : EGG_COST;
  }

  function canAffordEgg(slotIndex = activeIncubatorIndex()) {
    const cost = eggCostForSlot(slotIndex);
    return isDevToolEnabled("freeShop") || cost <= 0 || state.money >= cost;
  }

  function eggPurchaseLabel(slotIndex = activeIncubatorIndex()) {
    const cost = eggCostForSlot(slotIndex);
    return cost <= 0 ? "Start free egg" : `Buy egg · ₽${cost}`;
  }

  function basicPokemonSpriteUrl(speciesId) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;
  }

  function enabledSnakeEggThieves() {
    const generations = new Set(enabledGenerationNumbers());
    const choices = SNAKE_EGG_THIEVES.filter((pokemon) => generations.has(pokemon.generation));
    return choices.length ? choices : SNAKE_EGG_THIEVES.filter((pokemon) => pokemon.generation === 1);
  }

  function assignSnakeEggEvent(egg) {
    if (!egg || egg.openingStarterEgg || egg.snakeEventAt || egg.snakeEventResolved) return;
    const laidAt = Number(egg.laidAt || Date.now());
    const hatchAt = Number(egg.hatchAt || 0);
    const duration = hatchAt - laidAt;
    if (!Number.isFinite(duration) || duration < SNAKE_EGG_EVENT_MINIMUM_DURATION || Math.random() >= SNAKE_EGG_EVENT_CHANCE) {
      egg.snakeEventResolved = true;
      return;
    }
    const earliest = Math.max(Date.now() + 60000, laidAt + Math.floor(duration * 0.2));
    const latest = hatchAt - 15000;
    if (latest <= earliest) {
      egg.snakeEventResolved = true;
      return;
    }
    const snake = randomChoice(enabledSnakeEggThieves());
    egg.snakeEventAt = randomInt(Math.floor(earliest), Math.floor(latest));
    egg.snakePokemon = { ...snake, sprite: basicPokemonSpriteUrl(snake.id) };
  }

  function ensureSnakeEventForEgg(egg) {
    if (!egg || egg.openingStarterEgg || egg.snakeEventAt || egg.snakeEventResolved || egg.preparingEncounter || !egg.pendingEncounter) return;
    assignSnakeEggEvent(egg);
  }

  function createEgg(laidAt = Date.now(), openingStarterEgg = shouldUseOpeningStarterEgg(), forcedSpeciesId = 0, eggNumber = allocateEggNumber()) {
    const starterEgg = Boolean(openingStarterEgg);
    const forcedId = normalisedSpeciesId(forcedSpeciesId);
    const sequenceNumber = Math.max(1, Math.floor(Number(eggNumber || 1)));
    const hatchDuration = hatchDurationForEgg(starterEgg, 0, sequenceNumber);
    const egg = {
      laidAt,
      eggNumber: sequenceNumber,
      hatchAt: laidAt + hatchDuration,
      hatchDuration,
      openingStarterEgg: starterEgg,
      preparingEncounter: true
    };
    if (forcedId) egg.forcedSpeciesId = forcedId;
    return egg;
  }

  function eggNeedsPreparedEncounter() {
    return !!state.egg && !state.egg.pendingEncounter;
  }

  function normaliseOpeningStarterEgg() {
    if (!state.player || !state.egg || state.encounter || Number(state.statistics?.eggsHatched || 0) !== 0) return;
    if (!shouldUseOpeningStarterEgg()) return;
    state.egg.openingStarterEgg = true;
    state.egg.preparingEncounter = true;
    delete state.egg.pendingEncounter;
    delete state.egg.baseStatTotal;
    const firstHatchAt = Number(state.egg.laidAt || Date.now()) + hatchDurationForEgg(true, 0, state.egg.eggNumber);
    state.egg.hatchDuration = hatchDurationForEgg(true, 0, state.egg.eggNumber);
    state.egg.hatchAt = Math.min(Number(state.egg.hatchAt || firstHatchAt), firstHatchAt);
    saveState();
  }


  function eggNeedsPreparedEncounterForSlot(slot) {
    return !!slot?.egg && !slot.egg.pendingEncounter;
  }

  async function prepareEggForSlot(slot, slotIndex) {
    if (!state.player || !eggNeedsPreparedEncounterForSlot(slot) || slot.encounter || slot.egg.preparingRequest || Date.now() < nextEggPreparationRetryAt) return;
    const egg = slot.egg;
    egg.preparingRequest = true;
    egg.preparingEncounter = true;
    saveState();
    if (activeTab === "home" && slotIndex === activeIncubatorIndex()) render();
    try {
      const openingStarterEgg = Boolean(egg.openingStarterEgg);
      let forcedSpeciesId = normalisedSpeciesId(egg.forcedSpeciesId);
      if (forcedSpeciesId && isMysteriousSpeciesLocked(forcedSpeciesId)) {
        forcedSpeciesId = 0;
        delete egg.forcedSpeciesId;
      }
      const encounter = forcedSpeciesId
        ? await chooseSpeciesEncounter(forcedSpeciesId, "forced-egg", { eggEncounter: true })
        : openingStarterEgg
          ? await chooseOpeningStarterEncounter({ eggEncounter: true })
          : await chooseWeightedEncounter({ eggEncounter: true });
      if (slot.egg !== egg || slot.encounter || openingStarterEgg !== Boolean(egg.openingStarterEgg)) return;
      const laidAt = Number(egg.laidAt || Date.now());
      const baseStatTotal = baseStatTotalFromStats(encounter.baseStats);
      const hatchDuration = hatchDurationForEgg(openingStarterEgg, baseStatTotal, egg.eggNumber);
      egg.pendingEncounter = encounter;
      egg.baseStatTotal = baseStatTotal;
      egg.hatchDuration = hatchDuration;
      egg.hatchAt = laidAt + hatchDuration;
      egg.preparingEncounter = false;
      assignSnakeEggEvent(egg);
      delete egg.preparingRequest;
      if (slotIndex === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
      saveState();
      if (activeTab === "home") render();
      if (Date.now() >= egg.hatchAt) hatchEggForSlot(slotIndex);
    } catch {
      nextEggPreparationRetryAt = Date.now() + 30000;
      if (activeTab === "home" && slotIndex === activeIncubatorIndex()) toast("The next egg is being shy. The incubator will try again shortly.");
    } finally {
      if (slot.egg === egg) delete egg.preparingRequest;
      if (slotIndex === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
    }
  }

  function startEggForSlot(slotIndex = activeIncubatorIndex(), options = {}) {
    normaliseIncubatorsIfNeeded();
    const index = Math.min(incubatorCapacity() - 1, Math.max(0, Math.floor(Number(slotIndex || 0))));
    const slot = incubatorSlots()[index];
    if (!state.player || !slot || slot.egg || slot.encounter) return false;
    const forcedSpeciesId = normalisedSpeciesId(state.forcedNextEggSpeciesId);
    const openingStarterEgg = index === 0 && shouldUseOpeningStarterEgg();
    const cost = openingStarterEgg ? 0 : EGG_COST;
    const freePurchase = isDevToolEnabled("freeShop");
    if (!freePurchase && cost > 0 && state.money < cost) {
      if (!options.silent) toast(`An egg costs ₽${cost}. Earn a few more Pokédollars first.`);
      return false;
    }
    if (!freePurchase && cost > 0) state.money -= cost;
    slot.egg = createEgg(Date.now(), openingStarterEgg, forcedSpeciesId);
    if (cost > 0) state.statistics.eggsBought = (state.statistics.eggsBought || 0) + 1;
    if (forcedSpeciesId) state.forcedNextEggSpeciesId = 0;
    if (index === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
    saveState();
    prepareEggForSlot(slot, index);
    if (!options.silent) {
      if (index !== activeIncubatorIndex()) selectIncubatorSlot(index);
      render();
      toast(openingStarterEgg ? "Your first egg is warm and waiting." : `A new egg is warming in incubator ${index + 1}.`);
    }
    return true;
  }

  function ensureEggForSlot(slot, slotIndex) {
    if (!state.player || slot.encounter) return;
    if (!slot.egg && slotIndex === 0 && shouldUseOpeningStarterEgg()) startEggForSlot(slotIndex, { silent: true });
    if (eggNeedsPreparedEncounterForSlot(slot)) prepareEggForSlot(slot, slotIndex);
    else ensureSnakeEventForEgg(slot.egg);
  }

  function ensureAllIncubators() {
    normaliseIncubatorsIfNeeded();
    syncActiveIncubatorFromLegacy();
    incubatorSlots().forEach((slot, index) => ensureEggForSlot(slot, index));
    syncLegacyFromActiveIncubator();
  }

  async function hatchEggForSlot(slotIndex = activeIncubatorIndex()) {
    normaliseIncubatorsIfNeeded();
    const slot = incubatorSlots()[slotIndex];
    const egg = slot?.egg;
    if (!slot || !egg || Date.now() < egg.hatchAt || Date.now() < nextHatchRetryAt || egg.hatching) return;
    if (eggNeedsPreparedEncounterForSlot(slot)) {
      await prepareEggForSlot(slot, slotIndex);
      return;
    }
    egg.hatching = true;
    const openingStarterEgg = Boolean(egg.openingStarterEgg);
    const preparedEncounter = egg.pendingEncounter || null;
    if (slotIndex === activeIncubatorIndex()) {
      syncLegacyFromActiveIncubator();
      if (activeTab === "home") render();
    }
    try {
      const encounter = preparedEncounter;
      if (!encounter) throw new Error("Egg has no prepared encounter.");
      encounter.encounteredAt = new Date().toISOString();
      encounter.lastPassiveXpAt = Date.now();
      slot.encounter = encounter;
      slot.egg = null;
      if (slotIndex === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
      state.statistics.eggsHatched += 1;
      recordPokedexEncounter(encounter);
      saveState();
      toast(openingStarterEgg
        ? `${encounter.displayName} tumbled out of your first egg. The hatchery is officially awake.`
        : `${encounter.shiny ? "A strange shimmer flashes—" : ""}${encounter.displayName} hatched from incubator ${slotIndex + 1}!`);
      playPokemonCry(encounter, false);
    } catch {
      nextHatchRetryAt = Date.now() + 30000;
      toast("The egg is safe, but the hatchery could not reach the Pokémon records. It will try again shortly.");
    } finally {
      if (slot.egg === egg) delete egg.hatching;
      if (slotIndex === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
      if (activeTab === "home") render();
    }
  }

  function snakeEggEventReady(slot) {
    const egg = slot?.egg;
    return Boolean(egg && egg.snakeEventAt && !egg.snakeEventResolved && Date.now() >= Number(egg.snakeEventAt));
  }

  function showSnakeEggEventModal(snake, slotIndex) {
    const cost = eggCostForSlot(slotIndex);
    const disabled = !canAffordEgg(slotIndex);
    const buyCopy = cost <= 0 ? "Start another egg" : `Buy another egg · ₽${cost}`;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel catch-result" role="dialog" aria-modal="true" aria-labelledby="snake-event-title">
        <p class="eyebrow">Wild hatchery event</p><h2 id="snake-event-title">${escapeHtml(snake.displayName)} raided the nest</h2>
        <img class="result-sprite" src="${escapeHtml(snake.sprite || basicPokemonSpriteUrl(snake.id))}" alt="${escapeHtml(snake.displayName)}" />
        <p class="modal-intro">A hungry ${escapeHtml(snake.displayName)} slipped up to incubator ${slotIndex + 1} and ate the egg. The cushion is empty again.</p>
        <div class="button-row"><button class="button button-primary" type="button" data-action="buy-egg" data-slot-index="${slotIndex}" ${disabled ? "disabled" : ""}>${escapeHtml(buyCopy)}</button><button class="button" type="button" data-close-modal>Close</button></div>
      </section></div>`;
  }

  function triggerSnakeEggEventForSlot(slotIndex = activeIncubatorIndex()) {
    normaliseIncubatorsIfNeeded();
    const slot = incubatorSlots()[slotIndex];
    if (!snakeEggEventReady(slot) || slot.encounter) return false;
    const egg = slot.egg;
    const snake = egg.snakePokemon || { ...randomChoice(enabledSnakeEggThieves()) };
    snake.sprite = snake.sprite || basicPokemonSpriteUrl(snake.id);
    slot.egg = null;
    if (slotIndex === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
    state.statistics.eggsLostToSnakes = (state.statistics.eggsLostToSnakes || 0) + 1;
    saveState();
    showSnakeEggEventModal(snake, slotIndex);
    if (activeTab === "home") render();
    toast(`${snake.displayName} ate the egg in incubator ${slotIndex + 1}.`);
    return true;
  }

  async function prepareNormalEgg() {
    await prepareEggForSlot(activeIncubatorSlot(), activeIncubatorIndex());
  }

  function ensureEgg() {
    ensureEggForSlot(activeIncubatorSlot(), activeIncubatorIndex());
  }

  function pulseUiElement(element, className = "is-updated", duration = 700) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function animateRenderedView() {
    const stage = view.firstElementChild;
    if (!stage) return;
    renderMotionIndex += 1;
    stage.classList.remove("view-enter");
    void stage.offsetWidth;
    stage.classList.add("view-enter");
    const motionSelectors = [
      ".paper-panel",
      ".field-note",
      ".toolbar",
      ".danger-zone",
      ".summary-stamps",
      ".pc-card",
      ".dex-card",
      ".mart-card",
      ".incubator-slot-card",
      ".bag-pocket",
      ".competition-card",
      ".placeholder-card"
    ].join(", ");
    stage.querySelectorAll(motionSelectors).forEach((element, index) => {
      element.style.setProperty("--enter-delay", `${Math.min(index * 38, 456)}ms`);
      element.classList.remove("panel-enter");
      void element.offsetWidth;
      element.classList.add("panel-enter");
    });
  }

  function updateHeader() {
    const money = Number(state.money || 0);
    const streak = Number(state.streak || 0);
    const theme = state.settings.theme || "field";
    moneyDisplay.textContent = `₽${money.toLocaleString()}`;
    streakDisplay.textContent = `${streak} day${streak === 1 ? "" : "s"} streak`;
    if (money !== previousMoney) pulseUiElement(moneyDisplay.closest(".metric-chip"));
    if (streak !== previousStreak) pulseUiElement(streakDisplay.closest(".metric-chip"));
    if (theme !== previousTheme) {
      appShell.dataset.theme = theme;
      pulseUiElement(appShell, "theme-shift", 900);
    } else appShell.dataset.theme = theme;
    previousMoney = money;
    previousStreak = streak;
    previousTheme = theme;
  }

  function formatDuration(milliseconds) {
    const total = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  function formatPokedexHatchTime(baseStatTotal) {
    const total = Number(baseStatTotal || 0);
    return total > 0 ? formatDuration(hatchDurationForBaseStatTotal(total)) : "Not yet learned";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function titleCase(value) {
    return String(value || "").split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  function itemSpriteUrl(name) {
    const clean = String(name || "").trim().toLowerCase();
    const aliases = { "incubator-upgrade": "up-grade" };
    return `${ITEM_SPRITE_ROOT}/${aliases[clean] || clean}.png`;
  }

  function shopItemRegistry() {
    return window.PocketHatcheryShopItems || null;
  }

  function shopItemDefinition(itemId) {
    const registry = shopItemRegistry();
    return registry && typeof registry.getItem === "function" ? registry.getItem(itemId) : null;
  }

  function displayItemName(itemId) {
    const item = shopItemDefinition(itemId);
    return item?.displayName || titleCase(itemId);
  }

  function displayBallName(value) {
    return displayItemName(value);
  }

  function itemCount(itemId) {
    return Number(state.items?.[itemId] || 0);
  }

  function setItemCount(itemId, count) {
    state.items[itemId] = Math.max(0, Math.floor(Number(count) || 0));
    if (state.items[itemId] === 0) delete state.items[itemId];
  }

  function addItemToBag(itemId, amount = 1) {
    setItemCount(itemId, itemCount(itemId) + amount);
  }

  function mysteriousItemDefinitions() {
    const registry = shopItemRegistry();
    return registry && typeof registry.mysteriousItems === "function" ? registry.mysteriousItems() : [];
  }

  function mysteriousItemForSpecies(speciesId) {
    const id = normalisedSpeciesId(speciesId);
    return mysteriousItemDefinitions().find((item) => Number(item.summonSpeciesId || 0) === id) || null;
  }

  function generationEnabled(generation) {
    return enabledGenerationNumbers().includes(Number(generation));
  }

  function ownedPokemonForUnlocks() {
    return [
      ...(Array.isArray(state.pc) ? state.pc : []),
      ...(Array.isArray(state.expeditions) ? state.expeditions.map((entry) => entry?.pokemon).filter(Boolean) : [])
    ].filter(Boolean);
  }

  function ownedSpeciesSetForUnlocks() {
    return new Set(uniqueNumberList(ownedPokemonForUnlocks().map((pokemon) => pokemon.speciesId)));
  }

  function ownsSpeciesForUnlock(speciesId) {
    return ownedSpeciesSetForUnlocks().has(normalisedSpeciesId(speciesId));
  }

  function ownedTypeCountForUnlock(type) {
    return ownedPokemonForUnlocks().filter((pokemon) => Array.isArray(pokemon.types) && pokemon.types.includes(type)).length;
  }

  function caughtSpeciesCountForUnlocks() {
    return uniqueNumberList([...(state.caughtSpeciesIds || []), ...(state.pc || []).map((pokemon) => pokemon?.speciesId)])
      .filter(speciesInEnabledGenerations).length;
  }

  function registeredSpeciesIdsForUnlocks() {
    return uniqueNumberList(Object.values(state.pokedex || {}).map((entry) => entry?.speciesId));
  }

  function generationSpeciesTarget(generation) {
    const range = SPECIES_GENERATION_RANGES.find(([entryGeneration]) => entryGeneration === Number(generation));
    return range ? Math.max(1, (range[2] - range[1]) + 1) : 1;
  }

  function registeredCountForGeneration(generation) {
    return registeredSpeciesIdsForUnlocks().filter((speciesId) => speciesGeneration(speciesId) === Number(generation)).length;
  }

  function pokedexPercentForGeneration(generation, ratio) {
    return registeredCountForGeneration(generation) >= Math.ceil(generationSpeciesTarget(generation) * Number(ratio || 0));
  }

  function enabledSpeciesTargetFromRanges() {
    return enabledGenerationNumbers().reduce((total, generation) => total + generationSpeciesTarget(generation), 0);
  }

  function registeredCountForEnabledGenerations() {
    const generations = new Set(enabledGenerationNumbers());
    return registeredSpeciesIdsForUnlocks().filter((speciesId) => generations.has(speciesGeneration(speciesId))).length;
  }

  function pokedexPercentAllEnabled(ratio) {
    return registeredCountForEnabledGenerations() >= Math.ceil(enabledSpeciesTargetFromRanges() * Number(ratio || 0));
  }

  function ownedPlateCountForUnlocks() {
    const registry = shopItemRegistry();
    const plates = registry && typeof registry.plates === "function" ? registry.plates() : [];
    return plates.filter((item) => itemCount(item.id) > 0).length;
  }

  function allPlatesOwnedForUnlocks() {
    const registry = shopItemRegistry();
    const plates = registry && typeof registry.plates === "function" ? registry.plates() : [];
    return plates.length > 0 && plates.every((item) => itemCount(item.id) > 0);
  }

  function allBerriesOwnedForUnlocks() {
    const registry = shopItemRegistry();
    const berries = registry && typeof registry.berries === "function" ? registry.berries() : [];
    return berries.length > 0 && berries.every((item) => itemCount(item.id) > 0);
  }

  function keepsakeCountForUnlocks() {
    return Object.values(state.souvenirs || {}).reduce((total, value) => total + Math.max(0, Math.floor(Number(value || 0))), 0);
  }

  function allEnabledTypesOwnedForUnlocks() {
    const ownedTypes = new Set(ownedPokemonForUnlocks().flatMap((pokemon) => Array.isArray(pokemon.types) ? pokemon.types : []));
    return POKEMON_TYPES.every((type) => ownedTypes.has(type));
  }

  function mysteriousUnlockConditionMet(item) {
    const id = String(item?.id || "");
    const stat = (metric) => statisticMetric(metric);
    switch (id) {
      case "frozen-slate": return generationEnabled(1) && stat("eggsHatched") >= 25 && ownedTypeCountForUnlock("ice") >= 10;
      case "storm-slate": return generationEnabled(1) && stat("eggsHatched") >= 25 && ownedTypeCountForUnlock("electric") >= 10;
      case "ember-slate": return generationEnabled(1) && stat("eggsHatched") >= 25 && ownedTypeCountForUnlock("fire") >= 10;
      case "genetic-fragment": return generationEnabled(1) && pokedexPercentForGeneration(1, 0.75);
      case "old-sea-map": return generationEnabled(1) && (claimedAchievementSet().has("pokedex-half") || pokedexPercentAllEnabled(0.5));
      case "thunder-bell": return generationEnabled(2) && stat("expeditionsCompleted") >= 10 && ownedTypeCountForUnlock("electric") >= 10;
      case "volcano-bell": return generationEnabled(2) && stat("expeditionsCompleted") >= 10 && ownedTypeCountForUnlock("fire") >= 10;
      case "clear-bell-suicune": return generationEnabled(2) && stat("expeditionsCompleted") >= 10 && ownedTypeCountForUnlock("water") >= 10;
      case "silver-wing": return generationEnabled(2) && ownsSpeciesForUnlock(144) && ownsSpeciesForUnlock(145) && ownsSpeciesForUnlock(146);
      case "rainbow-wing": return generationEnabled(2) && ownsSpeciesForUnlock(243) && ownsSpeciesForUnlock(244) && ownsSpeciesForUnlock(245);
      case "gs-ball": return generationEnabled(2) && Number(state.streak || 0) >= 10 && stat("expeditionsCompleted") >= 25;
      case "stone-tablet": return generationEnabled(3) && ownedTypeCountForUnlock("rock") >= 10 && stat("expeditionsCompleted") >= 15;
      case "ice-tablet": return generationEnabled(3) && ownedTypeCountForUnlock("ice") >= 10 && stat("expeditionsCompleted") >= 15;
      case "iron-tablet": return generationEnabled(3) && ownedTypeCountForUnlock("steel") >= 10 && stat("expeditionsCompleted") >= 15;
      case "eon-ticket-latias": return generationEnabled(3) && pokedexPercentForGeneration(3, 0.5);
      case "eon-ticket-latios": return generationEnabled(3) && caughtSpeciesCountForUnlocks() >= 50;
      case "blue-orb": return generationEnabled(3) && ownedTypeCountForUnlock("water") >= 25 && stat("eggsHatched") >= 100;
      case "red-orb": return generationEnabled(3) && ownedTypeCountForUnlock("ground") >= 25 && stat("eggsHatched") >= 100;
      case "jade-orb": return generationEnabled(3) && ownsSpeciesForUnlock(382) && ownsSpeciesForUnlock(383);
      case "wish-tag": return generationEnabled(3) && stat("dailyQuestRewardsClaimed") >= 25;
      case "aurora-ticket": return generationEnabled(3) && stat("expeditionsCompleted") >= 50;
      case "knowledge-charm": return generationEnabled(4) && pokedexPercentForGeneration(4, 0.5);
      case "emotion-charm": return generationEnabled(4) && Boolean(state.partnerUid);
      case "willpower-charm": return generationEnabled(4) && stat("competitionsWon") >= 10;
      case "adamant-orb": return generationEnabled(4) && ownedTypeCountForUnlock("steel") >= 15 && ownedTypeCountForUnlock("dragon") >= 15;
      case "lustrous-orb": return generationEnabled(4) && ownedTypeCountForUnlock("water") >= 15 && ownedTypeCountForUnlock("dragon") >= 15;
      case "magma-stone": return generationEnabled(4) && ownedTypeCountForUnlock("fire") >= 20 && ownedTypeCountForUnlock("steel") >= 20;
      case "ancient-giant-key": return generationEnabled(4) && ownsSpeciesForUnlock(377) && ownsSpeciesForUnlock(378) && ownsSpeciesForUnlock(379);
      case "griseous-orb": return generationEnabled(4) && ownsSpeciesForUnlock(483) && ownsSpeciesForUnlock(484);
      case "lunar-wing": return generationEnabled(4) && Number(state.streak || 0) >= 30;
      case "sea-crown": return generationEnabled(4) && ownsSpeciesForUnlock(490);
      case "manaphy-egg-charm": return generationEnabled(4) && stat("eggsHatched") >= 150 && ownedTypeCountForUnlock("water") >= 20;
      case "member-card": return generationEnabled(4) && ownsSpeciesForUnlock(488);
      case "oaks-letter": return generationEnabled(4) && ownedTypeCountForUnlock("grass") >= 25 && stat("berriesUsed") >= 25;
      case "azure-flute": return generationEnabled(4) && allPlatesOwnedForUnlocks() && pokedexPercentAllEnabled(0.75);
      case "liberty-pass": return generationEnabled(5) && stat("dailyQuestRewardsClaimed") >= 10 && stat("competitionsWon") >= 5;
      case "sacred-blade-crest": return generationEnabled(5) && ownedTypeCountForUnlock("steel") >= 15;
      case "sacred-stone-crest": return generationEnabled(5) && ownedTypeCountForUnlock("rock") >= 15;
      case "sacred-leaf-crest": return generationEnabled(5) && ownedTypeCountForUnlock("grass") >= 15;
      case "reveal-glass-tornadus": return generationEnabled(5) && ownedTypeCountForUnlock("flying") >= 20;
      case "reveal-glass-thundurus": return generationEnabled(5) && ownedTypeCountForUnlock("electric") >= 20;
      case "light-stone": return generationEnabled(5) && pokedexPercentForGeneration(5, 0.5) && stat("eggsHatched") >= 100;
      case "dark-stone": return generationEnabled(5) && pokedexPercentForGeneration(5, 0.5) && stat("competitionsWon") >= 10;
      case "reveal-glass": return generationEnabled(5) && ownsSpeciesForUnlock(641) && ownsSpeciesForUnlock(642);
      case "dna-splicers": return generationEnabled(5) && ownsSpeciesForUnlock(643) && ownsSpeciesForUnlock(644);
      case "secret-sword-scroll": return generationEnabled(5) && ownsSpeciesForUnlock(638) && ownsSpeciesForUnlock(639) && ownsSpeciesForUnlock(640);
      case "relic-song-sheet": return generationEnabled(5) && stat("keepsakesFound") >= 20;
      case "ancient-drive": return generationEnabled(5) && ownedTypeCountForUnlock("bug") >= 20 && stat("expeditionsCompleted") >= 50;
      case "life-antler": return generationEnabled(6) && ownedTypeCountForUnlock("fairy") >= 25;
      case "ruin-feather": return generationEnabled(6) && ownedTypeCountForUnlock("dark") >= 25;
      case "zygarde-cube": return generationEnabled(6) && stat("expeditionsCompleted") >= 100;
      case "diamond-shard": return generationEnabled(6) && stat("keepsakesSold") >= 25;
      case "prison-bottle": return generationEnabled(6) && stat("keepsakesFound") >= 30;
      case "steam-core": return generationEnabled(6) && ownedTypeCountForUnlock("fire") >= 20 && ownedTypeCountForUnlock("water") >= 20;
      case "rks-memory-core": return generationEnabled(7) && allEnabledTypesOwnedForUnlocks();
      case "rks-memory-drive": return generationEnabled(7) && ownsSpeciesForUnlock(772) && stat("berriesUsed") >= 25;
      case "guardian-spark": return generationEnabled(7) && ownedTypeCountForUnlock("electric") >= 20;
      case "guardian-bloom": return generationEnabled(7) && ownedTypeCountForUnlock("psychic") >= 20;
      case "guardian-horn": return generationEnabled(7) && ownedTypeCountForUnlock("grass") >= 20;
      case "guardian-shell": return generationEnabled(7) && ownedTypeCountForUnlock("water") >= 20;
      case "cosmog-star": return generationEnabled(7) && pokedexPercentForGeneration(7, 0.25) && stat("expeditionsCompleted") >= 25;
      case "cosmoem-shell": return generationEnabled(7) && ownsSpeciesForUnlock(789);
      case "sun-flute": return generationEnabled(7) && pokedexPercentForGeneration(7, 0.5);
      case "moon-flute": return generationEnabled(7) && caughtSpeciesCountForUnlocks() >= 50;
      case "light-prism": return generationEnabled(7) && (ownsSpeciesForUnlock(791) || ownsSpeciesForUnlock(792));
      case "soul-heart-gear": return generationEnabled(7) && registeredCountForEnabledGenerations() >= 100;
      case "shadow-charm": return generationEnabled(7) && ownedTypeCountForUnlock("ghost") >= 20 && stat("competitionsWon") >= 10;
      case "plasma-claw": return generationEnabled(7) && ownedTypeCountForUnlock("electric") >= 30;
      case "mystery-box": return generationEnabled(7) && ownedTypeCountForUnlock("steel") >= 25 && stat("expeditionsCompleted") >= 50;
      case "rusted-sword": return generationEnabled(8) && stat("competitionsWon") >= 25;
      case "rusted-shield": return generationEnabled(8) && stat("eggsHatched") >= 250;
      case "wishing-star-core": return generationEnabled(8) && ownedTypeCountForUnlock("poison") >= 20 && ownedTypeCountForUnlock("dragon") >= 20;
      case "armor-pass": return generationEnabled(8) && stat("competitionsWon") >= 10;
      case "jungle-vine": return generationEnabled(8) && ownedTypeCountForUnlock("grass") >= 30 && ownedTypeCountForUnlock("dark") >= 20;
      case "electric-temple-key": return generationEnabled(8) && ownsSpeciesForUnlock(377) && ownsSpeciesForUnlock(378) && ownsSpeciesForUnlock(379) && ownedTypeCountForUnlock("electric") >= 25;
      case "dragon-temple-key": return generationEnabled(8) && ownsSpeciesForUnlock(377) && ownsSpeciesForUnlock(378) && ownsSpeciesForUnlock(379) && ownedTypeCountForUnlock("dragon") >= 25;
      case "iceroot-carrot": return generationEnabled(8) && ownedTypeCountForUnlock("ice") >= 25;
      case "shaderoot-carrot": return generationEnabled(8) && ownedTypeCountForUnlock("ghost") >= 25;
      case "wooden-crown": return generationEnabled(8) && (ownsSpeciesForUnlock(896) || ownsSpeciesForUnlock(897));
      case "reveal-glass-enamorus": return generationEnabled(8) && ownsSpeciesForUnlock(641) && ownsSpeciesForUnlock(642) && ownsSpeciesForUnlock(645);
      case "ruinous-tablet": return generationEnabled(9) && ownedTypeCountForUnlock("dark") >= 20;
      case "ruinous-sword": return generationEnabled(9) && ownedTypeCountForUnlock("ice") >= 20;
      case "ruinous-vessel": return generationEnabled(9) && ownedTypeCountForUnlock("ground") >= 20;
      case "ruinous-beads": return generationEnabled(9) && ownedTypeCountForUnlock("fire") >= 20;
      case "scarlet-book": return generationEnabled(9) && ownedTypeCountForUnlock("fighting") >= 25;
      case "violet-book": return generationEnabled(9) && ownedTypeCountForUnlock("electric") >= 25;
      case "toxic-chain-okidogi": return generationEnabled(9) && ownedTypeCountForUnlock("poison") >= 20 && ownedTypeCountForUnlock("fighting") >= 20;
      case "toxic-chain-munkidori": return generationEnabled(9) && ownedTypeCountForUnlock("poison") >= 20 && ownedTypeCountForUnlock("psychic") >= 20;
      case "toxic-chain-fezandipiti": return generationEnabled(9) && ownedTypeCountForUnlock("poison") >= 20 && ownedTypeCountForUnlock("fairy") >= 20;
      case "teal-mask": return generationEnabled(9) && ownedTypeCountForUnlock("grass") >= 30;
      case "indigo-disk": return generationEnabled(9) && pokedexPercentAllEnabled(0.75) && stat("expeditionsCompleted") >= 100;
      case "mythical-pecha-berry": return generationEnabled(9) && allBerriesOwnedForUnlocks();
      default: return false;
    }
  }

  function syncMysteriousItemUnlocks(notify = false) {
    if (!state.player) return false;
    let changed = false;
    for (const item of mysteriousItemDefinitions()) {
      if (itemCount(item.id) > 0 || !mysteriousUnlockConditionMet(item)) continue;
      setItemCount(item.id, 1);
      state.statistics.mysteriousItemsUnlocked = (state.statistics.mysteriousItemsUnlocked || 0) + 1;
      changed = true;
      const message = `${item.displayName} unlocked in the Mysterious Items pocket.`;
      if (notify) window.setTimeout(() => toast(message), 50);
      else pendingMysteriousUnlockToasts.push(message);
    }
    return changed;
  }

  function isMysteriousSpeciesLocked(speciesId) {
    const item = mysteriousItemForSpecies(speciesId);
    return Boolean(item && itemCount(item.id) <= 0);
  }

  function flushMysteriousUnlockToasts() {
    if (!pendingMysteriousUnlockToasts.length) return;
    const messages = uniqueStringList(pendingMysteriousUnlockToasts);
    pendingMysteriousUnlockToasts = [];
    messages.slice(0, 5).forEach((message, index) => window.setTimeout(() => toast(message), 80 + (index * 180)));
    if (messages.length > 5) window.setTimeout(() => toast(`${messages.length - 5} more Mysterious Items unlocked.`), 1100);
  }



  function hasItem(itemId) {
    return itemCount(itemId) > 0;
  }

  function activeShinyCharmCharges() {
    return Math.max(0, Math.floor(Number(state.activeItemEffects?.shinyCharmEggsRemaining || 0)));
  }

  function consumeShinyCharmEggCharge() {
    const remaining = activeShinyCharmCharges();
    if (remaining <= 0) return false;
    state.activeItemEffects.shinyCharmEggsRemaining = remaining - 1;
    return true;
  }

  function hatchDurationMultiplier() {
    return hasItem("magmarizer") ? 0.5 : 1;
  }

  function equippedPlate() {
    const registry = shopItemRegistry();
    return registry && typeof registry.getEquippedPlate === "function" ? registry.getEquippedPlate(state) : null;
  }

  function equippedPlateType() {
    const plate = equippedPlate();
    return plate?.type || "";
  }

  function encounterTypeMultiplier(pokemon) {
    const plateType = equippedPlateType();
    if (!plateType || !pokemon?.types?.length) return 1;
    return pokemon.types.some((entry) => entry.type.name === plateType) ? 3 : 1;
  }

  function cryUrlFromSpeciesId(speciesId) {
    const id = Number(speciesId);
    return Number.isFinite(id) && id > 0 ? `${CRY_ROOT}/${id}.ogg` : "";
  }

  function pokemonCryUrl(pokemon) {
    return pokemon?.cries?.latest || pokemon?.cries?.legacy || cryUrlFromSpeciesId(pokemon?.id);
  }

  function playCryUrl(url, displayName = "Pokémon", notify = false) {
    if (!url) {
      if (notify) toast(`${displayName} is staying quiet for now.`);
      return false;
    }
    try {
      if (currentCryAudio) {
        currentCryAudio.pause();
        currentCryAudio.currentTime = 0;
      }
      const audio = new Audio(url);
      currentCryAudio = audio;
      audio.volume = 0.55;
      audio.preload = "auto";
      audio.addEventListener("ended", () => {
        if (currentCryAudio === audio) currentCryAudio = null;
      }, { once: true });
      audio.addEventListener("error", () => {
        if (currentCryAudio === audio) currentCryAudio = null;
        if (notify) toast(`${displayName}'s cry would not come through.`);
      }, { once: true });
      const playback = audio.play();
      if (playback?.catch) {
        playback.catch(() => {
          if (currentCryAudio === audio) currentCryAudio = null;
          if (notify) toast("The browser is guarding the volume. Press the cry button once more.");
        });
      }
      return true;
    } catch {
      if (notify) toast(`${displayName}'s cry fizzled before it reached the speakers.`);
      return false;
    }
  }

  function playPokemonCry(pokemon, notify = false) {
    return playCryUrl(pokemon?.cryUrl, pokemon?.displayName || pokemon?.name || "Pokémon", notify);
  }

  function playPokedexCry(speciesId) {
    const entry = state.pokedex[String(speciesId)];
    if (!entry) return;
    const url = entry.cryUrl || cryUrlFromSpeciesId(entry.speciesId);
    playCryUrl(url, entry.displayName, true);
  }

  function clearIdleCryTimer() {
    if (idleCryTimer) window.clearTimeout(idleCryTimer);
    idleCryTimer = null;
    idleCryUid = null;
  }

  function syncIdleCryTimer() {
    const pokemon = state.encounter;
    if (!pokemon?.cryUrl) {
      clearIdleCryTimer();
      return;
    }
    if (idleCryTimer && idleCryUid === pokemon.uid) return;
    clearIdleCryTimer();
    idleCryUid = pokemon.uid;
    idleCryTimer = window.setTimeout(() => {
      const currentUid = idleCryUid;
      idleCryTimer = null;
      if (state.encounter?.uid !== currentUid) {
        syncIdleCryTimer();
        return;
      }
      playPokemonCry(state.encounter, false);
      syncIdleCryTimer();
    }, randomInt(CRY_MIN_DELAY, CRY_MAX_DELAY + 1));
  }

  function normalizeName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function normalizeDobKey(value) {
    const text = String(value || "").trim();
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const slashed = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashed) return text;
    return "";
  }

  function profileFeatures(profile = state.player) {
    const registry = window.PocketHatcheryProfileFeatures;
    if (!registry || typeof registry.getFeatures !== "function") return {};
    try {
      return registry.getFeatures(profile, { normalizeName, normalizeDobKey }) || {};
    } catch (error) {
      console.warn("Profile feature check failed", error);
      return {};
    }
  }

  function profileFeatureEnabled(featureName, profile = state.player) {
    return profileFeatures(profile)[featureName] === true;
  }

  function profileFeatureValue(featureName, fallback = null, profile = state.player) {
    const features = profileFeatures(profile);
    return Object.prototype.hasOwnProperty.call(features, featureName) ? features[featureName] : fallback;
  }

  function devToolsAllowed() {
    return profileFeatureEnabled("devTools");
  }

  function devSettings() {
    return { ...DEV_TOOL_DEFAULTS, ...(state.settings?.devTools || {}) };
  }

  function isDevToolEnabled(key) {
    return devToolsAllowed() && devSettings()[key] === true;
  }

  function activeShinyOdds(options = {}) {
    const profileMultiplier = Math.max(1, Number(profileFeatureValue("shinyOddsMultiplier", 1)) || 1);
    const charmMultiplier = options.useEggCharm ? 3 : 1;
    return Math.max(1, Math.floor(SHINY_ODDS / (profileMultiplier * charmMultiplier)));
  }

  function activeHatchDuration() {
    return state.egg?.hatchDuration || hatchDurationForEgg(false, state.egg?.baseStatTotal || 0, state.egg?.eggNumber || 0);
  }

  function statLabel(value) {
    return value === "hp" ? "HP" : titleCase(value);
  }

  function randomInt(minimum, maximum) {
    const range = maximum - minimum;
    if (range <= 0) return minimum;
    const maximumUint = 0xffffffff;
    const limit = maximumUint - (maximumUint % range);
    const sample = new Uint32Array(1);
    do crypto.getRandomValues(sample); while (sample[0] >= limit);
    return minimum + (sample[0] % range);
  }

  function randomChoice(items) {
    return items[randomInt(0, items.length)];
  }

  function makeId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${randomInt(100000, 999999)}`;
  }

  function resourceId(url) {
    const match = String(url || "").match(/\/(\d+)\/?$/);
    return match ? Number(match[1]) : 0;
  }

  function setApiStatus(online) {
    const label = document.getElementById("api-status");
    const light = document.querySelector(".status-light");
    if (label) label.textContent = online ? "records awake" : "records napping";
    if (light) light.classList.toggle("is-offline", !online);
  }

  async function apiFetch(resource) {
    const url = resource.startsWith("http") ? resource : `${API_ROOT}/${resource.replace(/^\//, "")}`;
    if (apiCache.has(url)) return apiCache.get(url);
    const request = fetch(url, { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`);
        setApiStatus(true);
        return response.json();
      })
      .catch((error) => {
        apiCache.delete(url);
        setApiStatus(false);
        throw error;
      });
    apiCache.set(url, request);
    return request;
  }

  async function loadGeneration(generation) {
    if (!generationCache.has(generation)) {
      generationCache.set(generation, apiFetch(`generation/${generation}`).then((data) => data.pokemon_species));
    }
    return generationCache.get(generation);
  }

  async function getEnabledSpeciesReferences() {
    const generations = state.settings.generations.length ? state.settings.generations : [1];
    const groups = await Promise.all(generations.map(loadGeneration));
    const references = groups.flat().sort((left, right) => resourceId(left.url) - resourceId(right.url));
    enabledSpeciesIds = uniqueNumberList(references.map((reference) => resourceId(reference.url)));
    enabledSpeciesTotal = references.length;
    return references;
  }

  function englishName(resource, fallback) {
    return resource.names?.find((entry) => entry.language.name === "en")?.name || titleCase(fallback);
  }

  function getGenerationFiveSprites(pokemon) {
    return {
      normal: `${GEN_FIVE_SPRITE_ROOT}/${pokemon.id}.png`,
      shiny: `${GEN_FIVE_SPRITE_ROOT}/shiny/${pokemon.id}.png`
    };
  }

  function rollIvs(forcePerfect = isDevToolEnabled("perfectIvs")) {
    return Object.fromEntries(CONTEST_STATS.map((stat) => [stat, forcePerfect ? 31 : randomInt(0, 32)]));
  }

  function chooseAbility(pokemon) {
    const standard = pokemon.abilities.filter((entry) => !entry.is_hidden);
    const hidden = pokemon.abilities.filter((entry) => entry.is_hidden);
    const pool = hidden.length && randomInt(0, 20) === 0 ? hidden : standard.length ? standard : pokemon.abilities;
    const chosen = randomChoice(pool);
    return {
      name: chosen.ability.name,
      slot: chosen.slot,
      hidden: chosen.is_hidden
    };
  }

  function mapBaseStats(pokemon) {
    return Object.fromEntries(pokemon.stats.map((entry) => [entry.stat.name, entry.base_stat]));
  }

  async function createEncounter(reference, pokemon, species, options = {}) {
    const sprites = getGenerationFiveSprites(pokemon);
    const useEggCharm = options.eggEncounter === true && activeShinyCharmCharges() > 0;
    const shiny = isDevToolEnabled("guaranteedShiny") || randomInt(0, activeShinyOdds({ useEggCharm })) === 0;
    if (useEggCharm) consumeShinyCharmEggCharge();
    const growth = await apiFetch(species.growth_rate.url);
    growthCache.set(species.growth_rate.url, growth.levels);
    const ability = chooseAbility(pokemon);
    return {
      uid: makeId(),
      speciesId: species.id,
      name: species.name,
      displayName: englishName(species, species.name),
      nickname: "",
      shiny,
      sprite: shiny && sprites.shiny ? sprites.shiny : sprites.normal,
      normalSprite: sprites.normal,
      shinySprite: sprites.shiny,
      cryUrl: pokemonCryUrl(pokemon),
      types: pokemon.types.map((entry) => entry.type.name),
      baseStats: mapBaseStats(pokemon),
      baseStatTotal: pokemon.stats.reduce((total, entry) => total + entry.base_stat, 0),
      ivs: rollIvs(),
      evs: blankTrainingMap(),
      ability: ability.name,
      abilitySlot: ability.slot,
      hiddenAbility: ability.hidden,
      captureRate: species.capture_rate,
      level: 1,
      experience: 0,
      nextLevelExperience: growth.levels.find((entry) => entry.level === 2)?.experience || 8,
      growthRateUrl: species.growth_rate.url,
      evolutionChainUrl: species.evolution_chain?.url || null,
      speciesUrl: reference.url,
      generation: resourceId(species.generation.url),
      encounteredAt: new Date().toISOString(),
      lastPassiveXpAt: Date.now(),
      catchAttempts: 0,
      evolutionHistory: []
    };
  }

  async function chooseWeightedEncounter(options = {}) {
    const references = (await getEnabledSpeciesReferences()).filter((reference) => !isMysteriousSpeciesLocked(resourceId(reference.url)));
    if (!references.length) throw new Error("No unlocked Pokémon are available for eggs in the enabled generations.");
    let lastCandidate = null;
    for (let attempt = 0; attempt < 48; attempt += 1) {
      const reference = randomChoice(references);
      const id = resourceId(reference.url);
      const [pokemon, species] = await Promise.all([apiFetch(`pokemon/${id}`), apiFetch(reference.url)]);
      const baseStatTotal = pokemon.stats.reduce((total, entry) => total + entry.base_stat, 0);
      lastCandidate = { reference, pokemon, species };
      const plateMultiplier = options.eggEncounter ? encounterTypeMultiplier(pokemon) : 1;
      if (Math.random() <= Math.min(1, (180 * plateMultiplier) / baseStatTotal)) return createEncounter(reference, pokemon, species, options);
    }
    if (lastCandidate) return createEncounter(lastCandidate.reference, lastCandidate.pokemon, lastCandidate.species, options);
    throw new Error("No eligible Pokémon could be found.");
  }


  function getEnabledStarterSpeciesIds() {
    const generations = state.settings.generations.length ? state.settings.generations : [1];
    return generations.flatMap((generation) => STARTER_SPECIES_BY_GENERATION[generation] || []);
  }

  function forcedFirstEggSpeciesId() {
    const speciesId = Number(profileFeatureValue("firstEggSpeciesId", 0));
    return Number.isFinite(speciesId) && speciesId > 0 ? Math.floor(speciesId) : 0;
  }

  async function chooseSpeciesEncounter(speciesId, referenceName = "egg", options = {}) {
    const id = normalisedSpeciesId(speciesId);
    if (!id) throw new Error("No Pokémon species was chosen for this egg.");
    if (options.eggEncounter === true && isMysteriousSpeciesLocked(id) && options.allowLockedMysterious !== true) throw new Error("That Pokémon needs its Mysterious Item before it can appear in an egg.");
    const reference = { name: `${referenceName}-${id}`, url: `${API_ROOT}/pokemon-species/${id}/` };
    const [pokemon, species] = await Promise.all([apiFetch(`pokemon/${id}`), apiFetch(reference.url)]);
    return createEncounter(reference, pokemon, species, options);
  }

  async function chooseOpeningStarterEncounter(options = {}) {
    const forcedSpeciesId = forcedFirstEggSpeciesId();
    const starterIds = forcedSpeciesId ? [forcedSpeciesId] : getEnabledStarterSpeciesIds();
    if (!starterIds.length) throw new Error("No starter Pokémon are available for the enabled generations.");
    return chooseSpeciesEncounter(forcedSpeciesId || randomChoice(starterIds), "first-egg", options);
  }

  function recordPokedexEncounter(encounter) {
    const key = String(encounter.speciesId);
    const baseStatTotal = Number(encounter.baseStatTotal || baseStatTotalFromStats(encounter.baseStats));
    const record = state.pokedex[key] || {
      speciesId: encounter.speciesId,
      name: encounter.name,
      displayName: encounter.displayName,
      sprite: encounter.normalSprite,
      shinySprite: encounter.shinySprite,
      cryUrl: encounter.cryUrl,
      baseStatTotal: Number.isFinite(baseStatTotal) && baseStatTotal > 0 ? baseStatTotal : 0,
      hatchDuration: Number.isFinite(baseStatTotal) && baseStatTotal > 0 ? hatchDurationForBaseStatTotal(baseStatTotal) : 0,
      seen: 0,
      shinySeen: 0,
      firstEncounteredAt: encounter.encounteredAt
    };
    record.cryUrl = record.cryUrl || encounter.cryUrl;
    if (Number.isFinite(baseStatTotal) && baseStatTotal > 0) {
      record.baseStatTotal = baseStatTotal;
      record.hatchDuration = hatchDurationForBaseStatTotal(baseStatTotal);
    }
    record.seen += 1;
    if (encounter.shiny) record.shinySeen += 1;
    state.pokedex[key] = record;
  }

  function recordCaughtPokemon(pokemon, ball = pokemon?.caughtWith || "") {
    if (!pokemon) return;
    const speciesId = Number(pokemon.speciesId || 0);
    if (Number.isInteger(speciesId) && speciesId > 0) {
      state.caughtSpeciesIds = uniqueNumberList([...(state.caughtSpeciesIds || []), speciesId]);
      if (pokemon.shiny) state.caughtShinySpeciesIds = uniqueNumberList([...(state.caughtShinySpeciesIds || []), speciesId]);
    }
    const ballId = String(ball || pokemon.caughtWith || "").trim();
    if (ballId) state.caughtBallIds = uniqueStringList([...(state.caughtBallIds || []), ballId]);
  }

  function backfillPokedexHatchTimes() {
    let changed = false;
    const knownPokemon = [...incubatorSlots().map((slot) => slot.encounter), ...(state.pc || [])].filter(Boolean);
    for (const pokemon of knownPokemon) {
      const entry = state.pokedex?.[String(pokemon.speciesId)];
      if (!entry) continue;
      const baseStatTotal = Number(pokemon.baseStatTotal || baseStatTotalFromStats(pokemon.baseStats));
      if (!Number.isFinite(baseStatTotal) || baseStatTotal <= 0) continue;
      const hatchDuration = hatchDurationForBaseStatTotal(baseStatTotal);
      if (entry.baseStatTotal !== baseStatTotal || entry.hatchDuration !== hatchDuration) {
        entry.baseStatTotal = baseStatTotal;
        entry.hatchDuration = hatchDuration;
        changed = true;
      }
    }
    if (changed) saveState();
  }

  async function hatchEgg() {
    if (isHatching) return;
    isHatching = true;
    try {
      await hatchEggForSlot(activeIncubatorIndex());
    } finally {
      isHatching = false;
    }
  }

  function statValue(pokemon, stat, level = pokemon.level) {
    normalisePokemonTraining(pokemon);
    const base = pokemon.baseStats[stat] || 1;
    const iv = pokemon.ivs[stat] || 0;
    const ev = Math.floor(Number(pokemon.evs?.[stat] || 0) / 4);
    if (stat === "hp") return Math.floor(((2 * base + iv + ev) * level) / 100) + level + 10;
    return Math.floor(((2 * base + iv + ev) * level) / 100) + 5;
  }

  async function getGrowthLevels(url) {
    if (growthCache.has(url)) return growthCache.get(url);
    const growth = await apiFetch(url);
    growthCache.set(url, growth.levels);
    return growth.levels;
  }

  async function refreshLevelFromExperience(pokemon) {
    const levels = await getGrowthLevels(pokemon.growthRateUrl);
    let level = 1;
    for (const entry of levels) {
      if (entry.experience <= pokemon.experience) level = entry.level;
      else break;
    }
    pokemon.level = Math.min(100, level);
    pokemon.nextLevelExperience = levels.find((entry) => entry.level === Math.min(100, pokemon.level + 1))?.experience || pokemon.experience;
  }

  function accrueEncounterExperience() {
    if (!state.encounter) return false;
    const elapsedIntervals = Math.floor((Date.now() - state.encounter.lastPassiveXpAt) / PASSIVE_XP_INTERVAL);
    if (elapsedIntervals <= 0) return false;
    state.encounter.experience += elapsedIntervals * (isDevToolEnabled("boostedPassiveXp") ? 120 : 1);
    state.encounter.lastPassiveXpAt += elapsedIntervals * PASSIVE_XP_INTERVAL;
    const levels = growthCache.get(state.encounter.growthRateUrl);
    if (levels) {
      for (const entry of levels) {
        if (entry.experience <= state.encounter.experience) state.encounter.level = entry.level;
        else break;
      }
      state.encounter.nextLevelExperience = levels.find((entry) => entry.level === Math.min(100, state.encounter.level + 1))?.experience || state.encounter.experience;
    }
    saveState();
    return true;
  }

  function findEvolutionNode(node, speciesName) {
    if (node.species.name === speciesName) return node;
    for (const child of node.evolves_to || []) {
      const found = findEvolutionNode(child, speciesName);
      if (found) return found;
    }
    return null;
  }

  function isPureLevelEvolution(detail) {
    return detail?.trigger?.name === "level-up"
      && Number.isFinite(detail.min_level)
      && !detail.item
      && !detail.held_item
      && !detail.known_move
      && !detail.known_move_type
      && !detail.location
      && !detail.min_happiness
      && !detail.min_beauty
      && !detail.time_of_day
      && !detail.needs_overworld_rain
      && !detail.turn_upside_down
      && detail.relative_physical_stats === null
      && !detail.party_species
      && !detail.party_type
      && !detail.trade_species;
  }

  async function evolvePokemon(pokemon, evolutionNode) {
    const evolvedId = resourceId(evolutionNode.species.url);
    const [newPokemon, newSpecies] = await Promise.all([apiFetch(`pokemon/${evolvedId}`), apiFetch(evolutionNode.species.url)]);
    const sprites = getGenerationFiveSprites(newPokemon);
    const previousName = pokemon.displayName;
    const matchingAbility = newPokemon.abilities.find((entry) => entry.slot === pokemon.abilitySlot)
      || newPokemon.abilities.find((entry) => !entry.is_hidden)
      || newPokemon.abilities[0];
    pokemon.speciesId = newSpecies.id;
    pokemon.name = newSpecies.name;
    pokemon.displayName = englishName(newSpecies, newSpecies.name);
    pokemon.sprite = pokemon.shiny && sprites.shiny ? sprites.shiny : sprites.normal;
    pokemon.normalSprite = sprites.normal;
    pokemon.shinySprite = sprites.shiny;
    pokemon.cryUrl = pokemonCryUrl(newPokemon);
    pokemon.types = newPokemon.types.map((entry) => entry.type.name);
    pokemon.baseStats = mapBaseStats(newPokemon);
    pokemon.captureRate = newSpecies.capture_rate;
    pokemon.speciesUrl = evolutionNode.species.url;
    pokemon.growthRateUrl = newSpecies.growth_rate.url;
    pokemon.ability = matchingAbility.ability.name;
    pokemon.abilitySlot = matchingAbility.slot;
    pokemon.hiddenAbility = matchingAbility.is_hidden;
    pokemon.evolutionHistory = pokemon.evolutionHistory || [];
    pokemon.evolutionHistory.push({ from: previousName, to: pokemon.displayName, level: pokemon.level, at: new Date().toISOString() });
    return `${previousName} evolved into ${pokemon.displayName}`;
  }

  async function checkForEvolution(pokemon) {
    if (!pokemon.evolutionChainUrl) return [];
    const messages = [];
    let searching = true;
    while (searching) {
      searching = false;
      const chain = await apiFetch(pokemon.evolutionChainUrl);
      const current = findEvolutionNode(chain.chain, pokemon.name);
      if (!current) break;
      const eligible = (current.evolves_to || []).find((child) =>
        (child.evolution_details || []).some((detail) => isPureLevelEvolution(detail) && pokemon.level >= detail.min_level)
      );
      if (eligible) {
        const message = await evolvePokemon(pokemon, eligible);
        if (message) {
          messages.push(message);
          searching = true;
        }
      }
    }
    return messages;
  }

  async function addExperience(pokemon, amount) {
    const oldLevel = pokemon.level;
    pokemon.experience += Math.max(0, Math.floor(amount));
    await refreshLevelFromExperience(pokemon);
    const evolutions = pokemon.level > oldLevel ? await checkForEvolution(pokemon) : [];
    return { oldLevel, newLevel: pokemon.level, evolutions };
  }


  function incubatorSlotStatus(slot) {
    if (slot.encounter) return { label: "hatchling", copy: `${slot.encounter.displayName} is waiting`, image: slot.encounter.sprite, alt: slot.encounter.displayName };
    if (slot.egg) {
      const preparing = Boolean(slot.egg.preparingEncounter && !slot.egg.pendingEncounter);
      return { label: preparing ? "warming" : "incubating", copy: preparing ? "Tiny taps are sorting themselves out" : "Something is stirring inside", image: eggSpriteUrl(slot.egg), alt: "A speckled egg is incubating" };
    }
    return { label: "empty", copy: "A clean cushion is ready", image: EGG_SPRITE_URL, alt: "An empty incubator cushion" };
  }

  function renderIncubatorSlotTray() {
    const slots = incubatorSlots();
    if (slots.length <= 1) return "";
    const activeIndex = activeIncubatorIndex();
    const cards = slots.map((slot, index) => {
      const status = incubatorSlotStatus(slot);
      const progress = slot.egg && !eggNeedsPreparedEncounterForSlot(slot)
        ? Math.min(100, Math.max(0, ((Date.now() - slot.egg.laidAt) / Math.max(1, slot.egg.hatchDuration || slot.egg.hatchAt - slot.egg.laidAt)) * 100))
        : 0;
      return `
        <button class="incubator-slot-card ${index === activeIndex ? "is-active" : ""}" type="button" data-action="select-incubator-slot" data-slot-index="${index}" aria-pressed="${index === activeIndex}">
          <span class="incubator-slot-number">Incubator ${index + 1}</span>
          <img src="${escapeHtml(status.image)}" alt="${escapeHtml(status.alt)}" />
          <strong>${escapeHtml(status.label)}</strong>
          <small>${escapeHtml(status.copy)}</small>
          ${slot.egg ? `<span class="slot-progress"><span style="width:${progress.toFixed(2)}%"></span></span>` : ""}
        </button>`;
    }).join("");
    return `<article class="paper-panel incubator-slot-tray"><div class="panel-label">Incubator row</div>${cards}</article>`;
  }


  function renderDailyQuestBoard() {
    ensureDailyQuests();
    const quests = state.dailyQuests.quests || [];
    const completeCount = quests.filter(isDailyQuestComplete).length;
    const cards = quests.map((quest) => {
      const progress = dailyQuestProgress(quest);
      const target = Math.max(1, Number(quest.target || 1));
      const percent = Math.min(100, (progress / target) * 100);
      const complete = progress >= target;
      const claimed = Boolean(quest.claimed);
      const stateLabel = claimed ? "claimed" : complete ? "ready" : `${Math.min(progress, target)} / ${target}`;
      const button = claimed
        ? `<span class="quest-state is-claimed">Claimed</span>`
        : complete
          ? `<button class="button button-primary" type="button" data-action="claim-daily-quest" data-quest-id="${escapeHtml(quest.id)}">Claim ${formatMoney(quest.reward)}</button>`
          : `<span class="quest-state">${formatMoney(quest.reward)}</span>`;
      return `
        <article class="paper-panel quest-card ${complete ? "is-complete" : ""} ${claimed ? "is-claimed" : ""}">
          <span class="quest-mark">${claimed ? "✓" : complete ? "!" : "·"}</span>
          <div>
            <p class="eyebrow">${escapeHtml(stateLabel)}</p>
            <h2>${escapeHtml(quest.title)}</h2>
            <p>${escapeHtml(quest.description)}</p>
            <div class="quest-progress" aria-label="${Math.min(progress, target)} of ${target}"><span style="width:${percent.toFixed(2)}%"></span></div>
            <div class="quest-reward-row">${button}</div>
          </div>
        </article>`;
    }).join("");
    return `
      <section class="daily-quest-board archive-page" aria-labelledby="daily-quests-title">
        ${pageHeader("Today’s ledger", "Daily quests", "Three small jobs refresh each day. Claim completed cards before tomorrow rolls the board.", `<div class="record-stamp"><b>${completeCount}</b><span>/ 3 ready</span></div>`)}
        <div class="quest-grid">${cards}</div>
      </section>`;
  }

  function renderHatchingHome() {
    view.innerHTML = `
      <section class="loading-ledger" aria-busy="true">
        <article class="paper-panel loading-card">
          <div class="panel-label">Hatching / <em>easy now</em></div>
          <img class="cracked-egg egg-sprite" src="${eggSpriteUrl()}" alt="" />
          <p class="eyebrow">Listening at the shell</p>
          <h1>The shell is opening…</h1>
          <p>Something inside is stretching, blinking, and getting ready to meet you.</p>
          <span class="loading-line"></span>
        </article>
      </section>`;
  }

  function renderEncounterHome() {
    accrueEncounterExperience();
    const pokemon = state.encounter;
    const xpPercent = pokemon.level >= 100 ? 100 : Math.min(100, (pokemon.experience / Math.max(1, pokemon.nextLevelExperience)) * 100);
    const statRows = CONTEST_STATS.map((stat) => `
      <div class="stat-row"><span>${statLabel(stat)}</span><strong>${statValue(pokemon, stat)}</strong></div>`).join("");
    view.innerHTML = `
      <section class="home-grid encounter-grid" aria-labelledby="encounter-title">
${renderFieldNoteAside({
          headingId: "encounter-title",
          metaRows: `
            <dt>Species</dt><dd>${escapeHtml(pokemon.displayName)}</dd>
            <dt>Types</dt><dd>${pokemon.types.map(titleCase).join(" / ")}</dd>
            <dt>Ability</dt><dd>${titleCase(pokemon.ability)}${pokemon.hiddenAbility ? " · hidden" : ""}</dd>
            <dt>Hatched</dt><dd>${new Date(pokemon.encounteredAt).toLocaleString()}</dd>`
        })}

        <article class="paper-panel incubator specimen-panel">
          <div class="panel-label">New friend / <em>${pokemon.shiny ? "shiny" : "curious"}</em></div>
          ${pokemon.shiny ? '<span class="shiny-stamp">✦ shiny ✦</span>' : ""}
          <div class="sprite-stage">
            <span class="dex-number">No. ${String(pokemon.speciesId).padStart(3, "0")}</span>
            <img class="pokemon-sprite" src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.shiny ? `Shiny ${pokemon.displayName}` : pokemon.displayName)}" />
            <h2>${escapeHtml(pokemon.displayName)}</h2>
            <p>Level ${pokemon.level} · ${pokemon.experience.toLocaleString()} XP</p>
          </div>
          <div class="xp-meter" aria-label="Experience progress"><span style="width:${xpPercent}%"></span></div>
          <p class="passive-note">Growing quietly while it waits</p>
          <div class="encounter-actions">
            <button class="button button-accent" type="button" data-action="choose-ball">Try a Poké Ball</button>
            <button class="button" type="button" data-action="release-encounter">Release gently</button>
          </div>
        </article>

        <aside class="side-stack encounter-stats">
          <article class="paper-panel stat-card">
            <div class="panel-label">Current stats</div>
            ${statRows}
          </article>
          <article class="paper-panel mini-card compact-card">
            <div class="panel-label">Still visiting</div>
            <h2>${pokemon.catchAttempts}</h2>
            <p>Poké Ball toss${pokemon.catchAttempts === 1 ? "" : "es"} made</p>
          </article>
        </aside>
      </section>
      ${renderIncubatorSlotTray()}
      ${renderDailyQuestBoard()}
      ${renderDevHud()}`;
    getGrowthLevels(pokemon.growthRateUrl).then(() => refreshLevelFromExperience(pokemon)).then(() => saveState()).catch(() => {});
  }

  function renderHome() {
    syncLegacyFromActiveIncubator();
    if (isHatching) {
      renderHatchingHome();
      return;
    }
    if (state.encounter) {
      renderEncounterHome();
      return;
    }
    ensureAllIncubators();
    const now = new Date();
    const discovered = Object.keys(state.pokedex).length;
    const total = enabledSpeciesTotal;
    const totalLabel = total || "…";
    const laid = state.egg ? new Date(state.egg.laidAt) : now;
    const preparingEgg = Boolean(state.egg?.preparingEncounter && !state.egg?.pendingEncounter);
    const hatchDuration = state.egg ? Math.max(1, state.egg.hatchDuration || state.egg.hatchAt - state.egg.laidAt) : FALLBACK_HATCH_DURATION;
    const progress = state.egg && !preparingEgg ? Math.min(100, Math.max(0, ((Date.now() - state.egg.laidAt) / hatchDuration) * 100)) : 0;
    const nextGift = millisecondsUntilTomorrow();
    const openingStarterEgg = Boolean(state.egg?.openingStarterEgg);
    const firstEggWarning = openingStarterEgg
      ? `<p class="first-egg-warning">Your first egg is unusually warm. It should hatch much faster than most, so keep an eye on the incubator.</p>`
      : "";
    const activeSlotEmpty = !state.egg && !state.encounter;
    const eggButtonDisabled = activeSlotEmpty && !canAffordEgg(activeIncubatorIndex());
    const eggStage = activeSlotEmpty
      ? `<div class="egg-stage empty-incubator"><div class="empty-cushion" aria-hidden="true">○</div><button class="button button-primary" type="button" data-action="buy-egg" data-slot-index="${activeIncubatorIndex()}" ${eggButtonDisabled ? "disabled" : ""}>${escapeHtml(eggPurchaseLabel(activeIncubatorIndex()))}</button></div>`
      : `<div class="egg-stage"><img class="egg egg-sprite" src="${eggSpriteUrl()}" alt="A speckled egg is incubating" /></div>`;

    view.innerHTML = `
      <section class="home-grid" aria-labelledby="home-title">
${renderFieldNoteAside({
          headingId: "home-title",
          extraHtml: firstEggWarning,
          metaRows: `
            <dt>Date</dt><dd>${laid.toLocaleDateString(undefined, { year: "2-digit", month: "2-digit", day: "2-digit" })}</dd>
            <dt>Time</dt><dd>${laid.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</dd>
            <dt>Keeper</dt><dd>${escapeHtml(state.player?.name || "You")}</dd>`
        })}

        <article class="paper-panel incubator">
          <div class="panel-label">Incubation / <em>active</em></div>
          <div class="hatchery-stage ${getPartnerPokemon() ? "has-partner" : ""}">
            ${eggStage}
            ${renderPartnerCompanion()}
          </div>
          <div class="countdown-wrap">
            <div id="hatch-countdown" class="countdown">${activeSlotEmpty ? "empty" : preparingEgg ? "warming" : "nesting"}</div>
            <p class="hatch-copy">${activeSlotEmpty ? "Buy an egg to start the next hatch." : openingStarterEgg ? "Your first egg is wiggling." : preparingEgg ? "Tiny taps echo inside…" : "Something is stirring inside…"}</p>
            <div class="progress-ruler">
              <span>laid</span>
              <div class="progress-track"><span id="egg-progress" class="progress-fill" style="width:${progress.toFixed(2)}%"></span></div>
              <span>${preparingEgg ? "warming" : "soon"}</span>
            </div>
          </div>
        </article>

        <aside class="side-stack">
          <article class="paper-panel mini-card">
            <div class="panel-label">Next daily treat</div>
            <h2><span class="sun-glyph">✹</span>+₽${Math.floor(100 * Math.pow(1.25, state.streak))}</h2>
            <p>in <span id="gift-countdown">${formatDuration(nextGift)}</span></p>
          </article>
          <article class="paper-panel mini-card">
            <div class="panel-label">Pokédex progress</div>
            <h2 id="dex-total-home">${discovered} / ${totalLabel}</h2>
            <div class="segmented-progress" aria-label="${discovered} species met"><span id="dex-progress-home" style="width:${total ? (discovered / total) * 100 : 0}%"></span></div>
            <p>species met</p>
          </article>
        </aside>
      </section>
      ${renderIncubatorSlotTray()}
      ${renderDailyQuestBoard()}
      ${renderDevHud()}`;
    if (!enabledSpeciesTotal) {
      getEnabledSpeciesReferences().then(() => {
        const totalElement = document.getElementById("dex-total-home");
        const progressElement = document.getElementById("dex-progress-home");
        if (totalElement) totalElement.textContent = `${discovered} / ${enabledSpeciesTotal}`;
        if (progressElement) progressElement.style.width = `${(discovered / enabledSpeciesTotal) * 100}%`;
      }).catch(() => {});
    }
  }

  function pageHeader(kicker, title, copy, aside = "") {
    return `<header class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p>${copy}</p></div>${aside}</header>`;
  }

  function emptyState(title, copy, action = "") {
    return `<article class="paper-panel empty-state"><span class="empty-glyph" aria-hidden="true">⌁</span><h2>${title}</h2><p>${copy}</p>${action}</article>`;
  }

  function renderDevHud() {
    if (!isDevToolEnabled("debugHud")) return "";
    const eggPending = state.egg?.pendingEncounter ? `${state.egg.pendingEncounter.displayName} #${state.egg.pendingEncounter.speciesId}` : "unknown";
    const eggState = state.egg ? (eggNeedsPreparedEncounter() ? "egg identifying" : `egg incubating · ${eggPending}`) : "no egg";
    const slotState = incubatorSlots().map((slot, index) => slot.encounter ? `${index + 1}: ${slot.encounter.displayName}` : slot.egg?.pendingEncounter ? `${index + 1}: egg ${slot.egg.pendingEncounter.displayName}` : slot.egg ? `${index + 1}: egg warming` : `${index + 1}: empty`).join(" · ");
    const encounterState = state.encounter ? `${state.encounter.displayName} · Lv. ${state.encounter.level} · ${state.encounter.experience.toLocaleString()} XP` : "no visitor waiting";
    const enabledTools = Object.entries(devSettings()).filter(([, enabled]) => enabled).map(([key]) => key).join(", ") || "none";
    const plateName = equippedPlate()?.displayName || "none";
    const partner = getPartnerPokemon();
    const fieldNoteCount = fieldNoteLibrary().length;
    const noteProgress = `${state.fieldNotes?.usedIds?.length || 0} / ${fieldNoteCount}`;
    return `
      <aside class="paper-panel dev-hud" aria-label="Developer debug HUD">
        <p class="eyebrow">Dev HUD</p>
        <dl class="summary-list"><dt>Egg</dt><dd>${escapeHtml(eggState)}</dd><dt>Slots</dt><dd>${escapeHtml(slotState)}</dd><dt>Forced next</dt><dd>${state.forcedNextEggSpeciesId || "none"}</dd><dt>Encounter</dt><dd>${escapeHtml(encounterState)}</dd><dt>PC</dt><dd>${state.pc.length}</dd><dt>Pokédex</dt><dd>${Object.keys(state.pokedex).length}</dd><dt>Money</dt><dd>₽${state.money.toLocaleString()}</dd><dt>Shiny charm</dt><dd>${activeShinyCharmCharges()} eggs</dd><dt>Plate</dt><dd>${escapeHtml(plateName)}</dd><dt>Partner</dt><dd>${escapeHtml(partner?.displayName || "none")}</dd><dt>Field notes</dt><dd>${escapeHtml(noteProgress)}</dd><dt>Tools</dt><dd>${escapeHtml(enabledTools)}</dd></dl>
      </aside>`;
  }

  function renderDevSettingsPanel() {
    if (!devToolsAllowed()) return "";
    const tools = devSettings();
    const toolChecks = DEV_TOOL_OPTIONS.map(([key, label, description]) => `
      <label class="check-card dev-check"><input type="checkbox" name="dev_tool" value="${key}" ${tools[key] ? "checked" : ""} /><span><b>${label}</b><small>${description}</small></span></label>`).join("");
    const actionGroups = DEV_ACTION_GROUPS.map(([title, actions]) => `
      <div class="dev-action-group"><h3>${title}</h3><div>${actions.map(([action, label]) => `<button class="button" type="button" data-action="${action}">${label}</button>`).join("")}</div></div>`).join("");
    return `
      <article class="paper-panel settings-section settings-wide dev-tools-section">
        <p class="eyebrow">Secret hatchery drawer</p>
        <h2>Cheats & dev tools</h2>
        <p class="settings-copy">These controls are tucked away for one special profile. Change the profile and the drawer shuts again.</p>
        <div class="check-grid dev-tool-grid">${toolChecks}</div>
        <div class="dev-actions">${actionGroups}</div>
      </article>`;
  }

  function renderPokedex() {
    const allEntries = Object.values(state.pokedex).sort((left, right) => left.speciesId - right.speciesId);
    const entries = allEntries.filter((entry) => `${entry.displayName} ${entry.speciesId}`.toLowerCase().includes(pokedexFilter.toLowerCase()));
    const totalHatches = allEntries.reduce((total, entry) => total + entry.seen, 0);
    const shinyHatches = allEntries.reduce((total, entry) => total + entry.shinySeen, 0);
    const cards = entries.map((entry) => `
      <article class="dex-card paper-panel">
        <span class="dex-card-number">No. ${String(entry.speciesId).padStart(3, "0")}</span>
        <img src="${escapeHtml(entry.sprite)}" alt="" loading="lazy" />
        <strong>${escapeHtml(entry.displayName)}</strong>
        <span class="dex-counts"><b>${entry.seen}</b> met ${entry.shinySeen ? `<em>✦ ${entry.shinySeen} shiny</em>` : ""}<small>Hatch time: ${escapeHtml(formatPokedexHatchTime(entry.baseStatTotal))}</small></span>
        <div class="dex-actions">
          <button class="button dex-open-button" type="button" data-action="pokedex-details" data-species-id="${entry.speciesId}">Open page</button>
          <button class="button cry-button" type="button" data-action="play-pokedex-cry" data-species-id="${entry.speciesId}" aria-label="Play ${escapeHtml(entry.displayName)} cry">Cry</button>
        </div>
      </article>`).join("");
    view.innerHTML = `
      <section class="archive-page">
        ${pageHeader("Field journal", "Pokédex", "Every species earns a page the moment it hatches, even if you wave it back into the wild.", `
          <div class="summary-stamps"><span><b>${allEntries.length}</b> species</span><span><b>${totalHatches}</b> hatches</span><span><b>${shinyHatches}</b> shiny</span></div>`)}
        <div class="toolbar paper-panel">
          <label class="search-field" for="pokedex-search">Search the journal</label>
          <input id="pokedex-search" type="search" value="${escapeHtml(pokedexFilter)}" placeholder="Name or number…" autocomplete="off" />
          <span id="pokedex-progress-copy">${allEntries.length} / ${enabledSpeciesTotal || "…"} possible species met</span>
        </div>
        ${allEntries.length ? `<div class="dex-grid">${cards || '<p class="no-results">No journal pages match this search.</p>'}</div>` : emptyState("The journal is still blank", "Your first hatch will make the opening page.", '<button class="button button-primary" type="button" data-tab="home">Back to the incubator</button>')}
      </section>`;
    if (!enabledSpeciesTotal) {
      getEnabledSpeciesReferences().then(() => {
        const copy = document.getElementById("pokedex-progress-copy");
        if (copy) copy.textContent = `${allEntries.length} / ${enabledSpeciesTotal} possible species met`;
      }).catch(() => {});
    }
  }

  function normalisePcLinks() {
    const pcIds = new Set(state.pc.map((pokemon) => pokemon.uid));
    state.team = state.team.filter((id, index, ids) => pcIds.has(id) && ids.indexOf(id) === index).slice(0, 6);
    if (state.partnerUid && !pcIds.has(state.partnerUid)) state.partnerUid = "";
  }

  function getPartnerPokemon() {
    normalisePcLinks();
    return state.partnerUid ? state.pc.find((pokemon) => pokemon.uid === state.partnerUid) || null : null;
  }

  function pcSearchText(pokemon) {
    return [
      pokemon.nickname,
      pokemon.displayName,
      pokemon.name,
      String(pokemon.speciesId),
      ...(pokemon.types || []),
      pokemon.shiny ? "shiny" : "",
      pokemon.favorite ? "favorite favourite" : "",
      state.team.includes(pokemon.uid) ? "team" : "",
      state.partnerUid === pokemon.uid ? "partner" : ""
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function filteredPcPokemon() {
    normalisePcLinks();
    const search = pcSearch.trim().toLowerCase();
    const filtered = state.pc.filter((pokemon) => {
      const matchesSearch = !search || pcSearchText(pokemon).includes(search);
      const matchesFilter = pcFilter === "all"
        || (pcFilter === "favorites" && pokemon.favorite)
        || (pcFilter === "shiny" && pokemon.shiny)
        || (pcFilter === "team" && state.team.includes(pokemon.uid))
        || (pcFilter === "partner" && state.partnerUid === pokemon.uid)
        || (pcFilter === "not-team" && !state.team.includes(pokemon.uid));
      return matchesSearch && matchesFilter;
    });
    const caughtTime = (pokemon) => new Date(pokemon.caughtAt || pokemon.encounteredAt || 0).getTime();
    filtered.sort((a, b) => {
      if (pcSort === "name") return (a.nickname || a.displayName).localeCompare(b.nickname || b.displayName);
      if (pcSort === "level") return b.level - a.level || caughtTime(b) - caughtTime(a);
      if (pcSort === "species") return a.speciesId - b.speciesId || caughtTime(b) - caughtTime(a);
      if (pcSort === "favorites") return Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || caughtTime(b) - caughtTime(a);
      if (pcSort === "shiny") return Number(Boolean(b.shiny)) - Number(Boolean(a.shiny)) || caughtTime(b) - caughtTime(a);
      return caughtTime(b) - caughtTime(a);
    });
    return filtered;
  }

  function renderPartnerCompanion() {
    const partner = getPartnerPokemon();
    if (!partner) return "";
    return `
      <figure class="partner-companion">
        <img src="${escapeHtml(partner.sprite)}" alt="${escapeHtml(partner.displayName)}" />
        <figcaption><span>Partner</span><b>${escapeHtml(partner.nickname || partner.displayName)}</b><small>keeping watch</small></figcaption>
      </figure>`;
  }



  function renderExpeditionPanel() {
    normaliseExpeditionState();
    const activeCards = state.expeditions.length ? state.expeditions.map((entry) => {
      const ready = expeditionReady(entry);
      return `
        <article class="expedition-card paper-panel ${ready ? "is-ready" : ""}">
          <img src="${escapeHtml(entry.pokemon.sprite)}" alt="" />
          <div>
            <p class="eyebrow">${ready ? "Returned" : "Exploring"}</p>
            <h2>${escapeHtml(entry.pokemon.nickname || entry.pokemon.displayName)}</h2>
            <p>${escapeHtml(entry.locationName)} · ${escapeHtml(entry.region)}. The route has the clipboard now.</p>
            ${ready ? `<button class="button button-primary" type="button" data-action="welcome-expedition" data-expedition-id="${escapeHtml(entry.id)}">Welcome back</button>` : `<span class="quest-state">Away exploring</span>`}
          </div>
        </article>`;
    }).join("") : `<article class="paper-panel expedition-empty"><p class="eyebrow">Map shelf</p><h2>No one is out exploring</h2><p>Open a PC card and send that Pokémon to a canon location from the generations enabled for this save.</p></article>`;
    const logCards = (state.expeditionLog || []).slice(0, 3).map((entry) => `
      <article class="expedition-log-card">
        <img src="${escapeHtml(entry.sprite)}" alt="" />
        <div><strong>${escapeHtml(entry.pokemonName)}</strong><span>${escapeHtml(entry.locationName)} · +${Number(entry.xp || 0).toLocaleString()} XP</span><small>${escapeHtml(rewardListText(entry.rewards || {}))}</small></div>
      </article>`).join("");
    return `
      <section class="expedition-panel">
        <div class="expedition-column">
          <h2>Expeditions</h2>
          <p>Sent Pokémon are hidden from the PC until they come home with XP and small findings. No unique shop purchases can appear as expedition loot.</p>
          <div class="expedition-grid">${activeCards}</div>
        </div>
        ${logCards ? `<aside class="paper-panel expedition-log"><div class="panel-label">Recent returns</div>${logCards}</aside>` : ""}
      </section>`;
  }

  function renderPc() {
    const partner = getPartnerPokemon();
    const favouriteCount = state.pc.filter((pokemon) => pokemon.favorite).length;
    const visiblePokemon = filteredPcPokemon();
    const cards = visiblePokemon.map((pokemon) => {
      const selected = state.team.includes(pokemon.uid);
      const isPartner = state.partnerUid === pokemon.uid;
      const isFavourite = Boolean(pokemon.favorite);
      const badges = [
        pokemon.shiny ? '<span class="mini-shiny">✦ shiny</span>' : "",
        isFavourite ? '<span class="mini-favorite">★ favourite</span>' : "",
        isPartner ? '<span class="mini-partner">◇ partner</span>' : ""
      ].filter(Boolean).join("");
      return `
        <article class="pc-card paper-panel ${selected ? "is-selected" : ""} ${isFavourite ? "is-favorite" : ""} ${isPartner ? "is-partner" : ""}">
          ${badges}
          <button class="pc-summary-button" type="button" data-action="pc-summary" data-uid="${pokemon.uid}">
            <span class="dex-card-number">No. ${String(pokemon.speciesId).padStart(3, "0")}</span>
            <img src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.displayName)}" loading="lazy" />
            <strong>${escapeHtml(pokemon.nickname || pokemon.displayName)}</strong>
            <span>${pokemon.nickname ? escapeHtml(pokemon.displayName) + " · " : ""}Lv. ${pokemon.level}</span>
          </button>
          <div class="pc-card-actions">
            <button class="pc-card-action" type="button" data-action="toggle-favorite" data-uid="${pokemon.uid}" aria-pressed="${isFavourite}">${isFavourite ? "★ Favourite" : "☆ Favourite"}</button>
            <button class="pc-card-action" type="button" data-action="toggle-partner" data-uid="${pokemon.uid}" aria-pressed="${isPartner}">${isPartner ? "◇ Partner" : "+ Partner"}</button>
            <button class="pc-card-action" type="button" data-action="toggle-team" data-uid="${pokemon.uid}" aria-pressed="${selected}">${selected ? "✓ Team" : "+ Team"}</button>
          </div>
        </article>`;
    }).join("");
    const pcControls = state.pc.length ? `
      <div class="paper-panel toolbar pc-toolbar">
        <label for="pc-search">Find</label>
        <input id="pc-search" type="search" value="${escapeHtml(pcSearch)}" placeholder="Name, type, number…" />
        <label for="pc-filter">Show</label>
        <select id="pc-filter">
          <option value="all" ${pcFilter === "all" ? "selected" : ""}>Everyone</option>
          <option value="favorites" ${pcFilter === "favorites" ? "selected" : ""}>Favourites</option>
          <option value="shiny" ${pcFilter === "shiny" ? "selected" : ""}>Shiny</option>
          <option value="partner" ${pcFilter === "partner" ? "selected" : ""}>Partner</option>
          <option value="team" ${pcFilter === "team" ? "selected" : ""}>Showcase team</option>
          <option value="not-team" ${pcFilter === "not-team" ? "selected" : ""}>Not on team</option>
        </select>
        <label for="pc-sort">Sort</label>
        <select id="pc-sort">
          <option value="newest" ${pcSort === "newest" ? "selected" : ""}>Newest first</option>
          <option value="favorites" ${pcSort === "favorites" ? "selected" : ""}>Favourites first</option>
          <option value="level" ${pcSort === "level" ? "selected" : ""}>Highest level</option>
          <option value="name" ${pcSort === "name" ? "selected" : ""}>Name</option>
          <option value="species" ${pcSort === "species" ? "selected" : ""}>Pokédex number</option>
          <option value="shiny" ${pcSort === "shiny" ? "selected" : ""}>Shiny first</option>
        </select>
        <span>${visiblePokemon.length} / ${state.pc.length} shown</span>
      </div>` : "";
    const headerAside = `
      <div class="pc-header-stamps">
        <div class="team-counter"><b>${state.team.length}</b><span>/ 6 on team</span></div>
        <div class="team-counter"><b>${favouriteCount}</b><span>favourite${favouriteCount === 1 ? "" : "s"}</span></div>
        <div class="team-counter"><b>${partner ? "1" : "0"}</b><span>partner</span></div>
        <div class="team-counter"><b>${state.expeditions.length}</b><span>exploring</span></div>
      </div>`;
    view.innerHTML = `
      <section class="archive-page">
        ${pageHeader("Pokémon room", "PC", "Every Pokémon here has its own little story. Mark favourites, choose a partner, and keep your showcase team tidy.", headerAside)}
        ${pcControls}
        ${renderExpeditionPanel()}
        ${state.pc.length ? `<div class="pc-grid">${cards || '<p class="no-results">No Pokémon match those filters.</p>'}</div>` : emptyState("No Pokémon in the room yet", "Hatch an egg, spend a moment with the visitor, then try a Poké Ball when you are ready.", '<button class="button button-primary" type="button" data-tab="home">Visit the incubator</button>')}
      </section>`;
  }

  function shopStock() {
    const registry = shopItemRegistry();
    if (!registry || typeof registry.getShopStock !== "function") return [];
    return registry.getShopStock(state).map((item) => ({ ...item, sprite: itemSpriteUrl(item.spriteId || item.id) }));
  }

  function loadShopItems() {
    shopItems = shopStock();
  }

  function renderBagPocket(title, description, items, emptyText, renderer) {
    const cards = items.length ? items.map(renderer).join("") : `<p class="no-results">${escapeHtml(emptyText)}</p>`;
    return `
      <article class="paper-panel bag-pocket">
        <div class="panel-label">${escapeHtml(title)}</div>
        <p>${escapeHtml(description)}</p>
        <div class="bag-grid">${cards}</div>
      </article>`;
  }

  function renderBag() {
    const registry = shopItemRegistry();
    const pockets = registry && typeof registry.getBagPockets === "function" ? registry.getBagPockets(state) : { balls: [], items: [], berries: [], plates: [], souvenirs: [], mysterious: [] };
    const charmCharges = activeShinyCharmCharges();
    const ballPocket = renderBagPocket("Poké Ball pocket", "The round things with a habit of rolling under furniture.", pockets.balls, "No Poké Balls are currently in the bag.", (item) => `
      <article class="bag-card">
        <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
        <strong>${escapeHtml(item.displayName)}</strong>
        <span>${Number(item.count || 0).toLocaleString()} in bag</span>
      </article>`);
    const itemPocket = renderBagPocket("Useful things", "Charms, warm gadgets, and other hatchery oddments.", pockets.items, "No special items have settled into this pocket yet.", (item) => {
      const owned = Number(item.count || 0) > 0;
      const isCharm = item.id === "shiny-charm";
      const isMagmarizer = item.id === "magmarizer";
      const isRareCandy = item.id === "rare-candy";
      const detail = isCharm && charmCharges > 0 ? `${charmCharges} egg${charmCharges === 1 ? "" : "s"} still sparkling` : isMagmarizer && owned ? "warming new eggs" : `${Number(item.count || 0).toLocaleString()} in bag`;
      const action = isCharm && owned ? `<button class="button button-primary" type="button" data-action="use-item" data-item-id="${item.id}">Use charm</button>` : isRareCandy && owned ? `<button class="button button-primary" type="button" data-action="use-item" data-item-id="${item.id}">Use candy</button>` : "";
      return `
        <article class="bag-card">
          <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
          <strong>${escapeHtml(item.displayName)}</strong>
          <span>${escapeHtml(detail)}</span>
          ${action}
        </article>`;
    });
    const berryPocket = renderBagPocket("Berry pouch", "Purchased berries add capped training points to one or more stats. No Pokémon can exceed the usual per-stat or total training limits.", pockets.berries || [], "No berries are tucked into the pouch yet.", (item) => `
      <article class="bag-card">
        <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
        <strong>${escapeHtml(item.displayName)}</strong>
        <span>${Number(item.count || 0).toLocaleString()} in bag · ${escapeHtml(describeStatEffects(item.statEffects))}</span>
        <button class="button button-primary" type="button" data-action="use-item" data-item-id="${item.id}">Use berry</button>
      </article>`);
    const platePocket = renderBagPocket("Plate pocket", "Only one plate can sit beside the incubator at a time.", pockets.plates.filter((item) => Number(item.count || 0) > 0), "No plates are tucked away yet.", (item) => `
      <article class="bag-card ${item.equipped ? "is-equipped" : ""}">
        <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
        <strong>${escapeHtml(item.displayName)}</strong>
        <span>${item.equipped ? "beside the incubator" : `${titleCase(item.type)} plate`}</span>
        <button class="button ${item.equipped ? "" : "button-primary"}" type="button" data-action="toggle-plate" data-item-id="${item.id}">${item.equipped ? "Put away" : "Equip"}</button>
      </article>`);
    const souvenirPocket = renderBagPocket("Expedition keepsakes", "Small harmless things brought back from canon routes. They can be sold for pocket money, but they do not stand in for single-purchase shop items.", pockets.souvenirs || [], "No expedition keepsakes have come home yet.", (item) => {
      const count = Number(item.count || 0);
      const sellValue = Number(item.sellValue || 0);
      return `
      <article class="bag-card">
        <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
        <strong>${escapeHtml(item.displayName)}</strong>
        <span>${count.toLocaleString()} found · sells for ₽${sellValue.toLocaleString()}</span>
        <button class="button button-primary" type="button" data-action="sell-souvenir" data-item-id="${escapeHtml(item.id)}">Sell one</button>
        ${count > 1 ? `<button class="button" type="button" data-action="sell-all-souvenir" data-item-id="${escapeHtml(item.id)}">Sell all</button>` : ""}
      </article>`;
    });
    const activeSlot = activeIncubatorSlot();
    const canSummonMysteryEgg = Boolean(activeSlot && !activeSlot.egg && !activeSlot.encounter);
    const mysteriousPocket = renderBagPocket("Mysterious Items", "Unique relics unlocked by hatchery milestones. Each one opens its matching Pokémon to eggs and can call a dedicated egg into an empty active incubator.", pockets.mysterious || [], "No mysterious items have unlocked yet.", (item) => `
      <article class="bag-card">
        <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
        <strong>${escapeHtml(item.displayName)}</strong>
        <span>Calls ${escapeHtml(item.summonSpeciesName || "a rare Pokémon")}</span>
        <button class="button button-primary" type="button" data-action="summon-mysterious" data-item-id="${escapeHtml(item.id)}" ${canSummonMysteryEgg ? "" : "disabled"}>Summon egg</button>
      </article>`);
    view.innerHTML = `
      <section class="archive-page bag-page">
        ${pageHeader("Field bag", "Bag", "Everything you have tucked away for eggs, visitors, training, and odd little shop surprises.")}
        <div class="bag-pockets">${ballPocket}${itemPocket}${berryPocket}${platePocket}${mysteriousPocket}${souvenirPocket}</div>
      </section>`;
  }

  function renderMart() {
    if (!shopItems) loadShopItems();
    const stock = shopItems.map((item) => {
      const count = item.id === "incubator-upgrade" ? incubatorCapacity() : item.category === "ball" ? state.inventory[item.id] || 0 : itemCount(item.id);
      const ownedUnique = item.unique && count > 0;
      const disabled = ownedUnique || (!isDevToolEnabled("freeShop") && state.money < item.cost);
      const price = isDevToolEnabled("freeShop") && !ownedUnique ? "FREE" : `₽${item.cost.toLocaleString()}`;
      const pocketLabel = item.category === "plate" ? "Plate shelf" : item.category === "berry" ? "Berry pouch" : item.category === "ball" ? "Field bag favourite" : "Counter curiosity";
      return `
      <article class="shop-card paper-panel">
        <div class="shop-sprite"><img src="${escapeHtml(item.sprite)}" alt="" /></div>
        <p class="eyebrow">${pocketLabel}</p>
        <h2>${escapeHtml(item.displayName)}</h2>
        <p>${escapeHtml(item.description)}</p>
        <dl><dt>Price</dt><dd>${ownedUnique ? "owned" : price}</dd><dt>${item.id === "incubator-upgrade" ? "Slots" : "In bag"}</dt><dd>${item.id === "incubator-upgrade" ? `${count} / ${MAX_INCUBATOR_SLOTS}` : count || 0}</dd></dl>
        <button class="button button-primary" type="button" data-action="buy-shop-item" data-item-id="${item.id}" ${disabled ? "disabled" : ""}>${ownedUnique ? "Already in bag" : `Buy one · ${price}`}</button>
      </article>`;
    }).join("");
    view.innerHTML = `
      <section class="archive-page">
        ${pageHeader("Field supplies", "Pokémart", "Stock your field bag before the next shell starts to wobble.", `<div class="wallet-stamp"><span>pocket money</span><b>₽${state.money.toLocaleString()}</b></div>`)}
        <div class="shop-grid">${stock || emptyState("The shelves are being dusted", "Check back after your collection has grown a little.")}</div>
        <p class="archive-footnote">Your first kit includes five Poké Balls. Restock before the next shell starts to wobble.</p>
      </section>`;
  }

  function renderCompetitions() {
    const team = state.team.map((id) => state.pc.find((pokemon) => pokemon.uid === id)).filter(Boolean);
    const teamStrip = team.length ? team.map((pokemon) => `
      <button class="team-member" type="button" data-action="pc-summary" data-uid="${pokemon.uid}"><img src="${escapeHtml(pokemon.sprite)}" alt="" /><span>${escapeHtml(pokemon.nickname || pokemon.displayName)}</span><small>Lv. ${pokemon.level}</small></button>`).join("") : "";
    const contests = CONTEST_STATS.map((stat) => `
      <button class="contest-card paper-panel" type="button" data-action="enter-contest" data-stat="${stat}" ${team.length !== 6 || isCompetitionRunning ? "disabled" : ""}>
        <span class="contest-glyph" aria-hidden="true">${{ hp: "♥", attack: "⚔", defense: "◆", "special-attack": "✦", "special-defense": "✥", speed: "»" }[stat]}</span>
        <strong>${statLabel(stat)}</strong>
        <small>bring your best ${statLabel(stat)}</small>
      </button>`).join("");
    const latest = state.competitionLog[0];
    view.innerHTML = `
      <section class="archive-page">
        ${pageHeader("Six-on-six showcases", "Competitions", "Pick a showcase and send in your six. A visiting team will step up to meet them.", `<div class="record-stamp"><b>${state.statistics.competitionsWon}</b><span>victories</span></div>`)}
        <article class="paper-panel team-sheet">
          <div class="panel-label">Chosen six / ${team.length} of 6</div>
          ${team.length ? `<div class="team-strip">${teamStrip}</div>` : '<p class="team-empty">Choose your six from the PC room.</p>'}
          ${team.length !== 6 ? '<button class="button button-primary" type="button" data-tab="pc">Select your six</button>' : '<p class="ready-mark">✓ team ready to step out</p>'}
        </article>
        <div class="contest-grid">${contests}</div>
        ${latest ? `<article class="paper-panel latest-result"><p class="eyebrow">Last showcase</p><h2>${escapeHtml(latest.title)}</h2><p>${escapeHtml(latest.summary)}</p><time>${new Date(latest.at).toLocaleString()}</time></article>` : ""}
      </section>`;
  }

  function generationSummary() {
    const generationNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    const generationRegions = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar", "Paldea"];
    const generations = Array.isArray(state.settings.generations) && state.settings.generations.length ? state.settings.generations : [1];
    return generations
      .filter((generation) => generation >= 1 && generation <= 9)
      .map((generation) => `Generation ${generationNumerals[generation - 1]} · ${generationRegions[generation - 1]}`)
      .join(", ");
  }

  function genderLabel(gender) {
    return { boy: "Boy", girl: "Girl", other: "Other" }[gender] || "Other";
  }

  function generationSignupCards() {
    const generationNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    const generationRegions = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar", "Paldea"];
    return generationNumerals.map((numeral, index) => {
      const generation = index + 1;
      return `<label class="check-card"><input type="checkbox" name="generation" value="${generation}" checked /><span><b>Generation ${numeral}</b><small>${generationRegions[index]}</small></span></label>`;
    }).join("");
  }

  function enabledGenerationNumbers() {
    return (Array.isArray(state.settings.generations) && state.settings.generations.length ? state.settings.generations : [1])
      .filter((generation, index, generations) => generation >= 1 && generation <= 9 && generations.indexOf(generation) === index)
      .sort((left, right) => left - right);
  }

  function speciesGeneration(speciesId) {
    const id = Number(speciesId || 0);
    const range = SPECIES_GENERATION_RANGES.find(([, start, end]) => id >= start && id <= end);
    return range ? range[0] : 0;
  }

  function speciesInEnabledGenerations(speciesId) {
    return enabledGenerationNumbers().includes(speciesGeneration(speciesId));
  }

  function enabledStarterSpeciesIds() {
    return enabledGenerationNumbers().flatMap((generation) => STARTER_SPECIES_BY_GENERATION[generation] || []);
  }

  function activeSpeciesTarget() {
    return enabledSpeciesTotal || enabledSpeciesIds.length || 0;
  }

  function activeSpeciesSet() {
    return new Set(enabledSpeciesIds.length ? enabledSpeciesIds : []);
  }

  function countActiveSpecies(values) {
    const set = activeSpeciesSet();
    const ids = uniqueNumberList(values);
    if (!set.size) return ids.filter(speciesInEnabledGenerations).length;
    return ids.filter((speciesId) => set.has(speciesId)).length;
  }

  function formatMoney(amount) {
    return `₽${Math.max(0, Math.floor(Number(amount || 0))).toLocaleString()}`;
  }

  function achievementReward(id, category, target) {
    const oneOffRewards = {
      registered: 50,
      "first-egg-hatched": 100,
      "first-catch": 150,
      "first-release": 75,
      "first-partner": 125,
      "first-favourite": 100,
      "showcase-six": 750,
      "backup-safe": 75,
      "early-clutch": 900,
      "hatch-each-generation": Math.max(600, target * 450),
      "pokedex-quarter": Math.max(8000, target * 150),
      "pokedex-half": Math.max(25000, target * 260),
      "pokedex-three-quarter": Math.max(75000, target * 420),
      "pokedex-complete-active": Math.max(150000, target * 850),
      "catch-each-generation": Math.max(1000, target * 650),
      "caught-species-25": 5000,
      "caught-species-100": 28000,
      "caught-quarter": Math.max(12000, target * 220),
      "caught-half": Math.max(50000, target * 360),
      "caught-all-active": Math.max(250000, target * 1250),
      "starter-hatch-one": 300,
      "starter-catch-one": 450,
      "starter-hatch-active": Math.max(15000, target * 3500),
      "starter-catch-active": Math.max(30000, target * 5200),
      "shiny-seen-one": 25000,
      "shiny-caught-one": 50000,
      "shiny-seen-three": 90000,
      "shiny-caught-five": 200000,
      "shiny-pc-six": 225000,
      "shiny-species-ten": 350000,
      "ball-poke": 100,
      "ball-premier": 350,
      "ball-great": 500,
      "ball-ultra": 900,
      "ball-master": 50000,
      "buy-pokeballs-10": 300,
      "buy-pokeballs-50": 1800,
      "premier-owned": 250,
      "master-found": 75000,
      "incubator-two": 5000,
      "incubator-three": 18000,
      "incubator-five": 125000,
      "magmarizer-owned": 20000,
      "shiny-charm-owned": 18000,
      "shiny-charm-used": 5000,
      "plate-one": 2500,
      "plate-five": 18000,
      "plate-all": 175000,
      "pc-six": 600,
      "pc-thirty": 4500,
      "pc-hundred": 25000,
      "favorites-ten": 2500,
      "level-fifty": 12000,
      "level-hundred": 70000,
      "contest-one": 1000,
      "contest-five": 6000,
      "contest-ten": 18000,
      "contest-twenty-five": 70000,
      "contest-all-stats": 35000,
      "streak-three": 600,
      "streak-seven": 2500,
      "streak-ten": 6000,
      "streak-thirty": 60000
    };
    if (Object.prototype.hasOwnProperty.call(oneOffRewards, id)) return Math.floor(oneOffRewards[id]);
    if (id.startsWith("hatch-")) {
      const rewards = { 5: 250, 10: 700, 25: 2000, 50: 5000, 100: 14000, 250: 50000, 500: 140000 };
      return rewards[target] || Math.max(150, target * 80);
    }
    if (id.startsWith("catch-")) {
      const rewards = { 5: 350, 10: 900, 25: 3500, 50: 8500, 100: 24000, 250: 85000, 500: 240000 };
      return rewards[target] || Math.max(250, target * 120);
    }
    const categoryBase = {
      "First steps": 100,
      Hatching: 500,
      Pokédex: 1500,
      Catching: 800,
      Starters: 1000,
      "Shiny surprises": 25000,
      "Poké Balls": 250,
      "Shop and bag": 1000,
      "PC room": 750,
      Competitions: 1000,
      "Daily rhythm": 600
    };
    return categoryBase[category] || 100;
  }

  function claimedAchievementSet() {
    state.claimedAchievementIds = uniqueStringList(state.claimedAchievementIds || []);
    return new Set(state.claimedAchievementIds);
  }

  function achievementProgress(current, target) {
    const safeTarget = Math.max(1, Math.floor(Number(target || 1)));
    const safeCurrent = Math.max(0, Math.floor(Number(current || 0)));
    return { current: Math.min(safeCurrent, safeTarget), target: safeTarget, unlocked: safeCurrent >= safeTarget };
  }

  function achievement(id, category, title, description, current, target = 1) {
    const progress = achievementProgress(current, target);
    const claimed = claimedAchievementSet().has(id);
    const reward = achievementReward(id, category, progress.target);
    return { id, category, title, description, reward, claimed, claimable: progress.unlocked && !claimed, ...progress };
  }

  function achievementsForThresholds(prefix, category, noun, descriptionPrefix, current, thresholds) {
    return thresholds.map((target) => achievement(`${prefix}-${target}`, category, `${noun} ${target.toLocaleString()}`, `${descriptionPrefix} ${target.toLocaleString()}.`, current, target));
  }

  function allAchievements() {
    const enabledGenerations = enabledGenerationNumbers();
    const activeTotal = activeSpeciesTarget();
    const pokedexSpeciesIds = Object.values(state.pokedex || {}).map((entry) => Number(entry.speciesId || 0));
    const activePokedexCount = countActiveSpecies(pokedexSpeciesIds);
    const caughtSpeciesIds = uniqueNumberList([...(state.caughtSpeciesIds || []), ...(state.pc || []).map((pokemon) => pokemon?.speciesId)]);
    const activeCaughtCount = countActiveSpecies(caughtSpeciesIds);
    const starterIds = enabledStarterSpeciesIds();
    const starterSet = new Set(starterIds);
    const hatchedStarterCount = uniqueNumberList(pokedexSpeciesIds).filter((speciesId) => starterSet.has(speciesId)).length;
    const caughtStarterCount = caughtSpeciesIds.filter((speciesId) => starterSet.has(speciesId)).length;
    const hatchedGenerationCount = new Set(uniqueNumberList(pokedexSpeciesIds).map(speciesGeneration).filter((generation) => enabledGenerations.includes(generation))).size;
    const caughtGenerationCount = new Set(caughtSpeciesIds.map(speciesGeneration).filter((generation) => enabledGenerations.includes(generation))).size;
    const shinySeen = Object.values(state.pokedex || {}).reduce((total, entry) => total + Number(entry.shinySeen || 0), 0);
    const shinySpeciesSeen = Object.values(state.pokedex || {}).filter((entry) => Number(entry.shinySeen || 0) > 0).length;
    const shinyCaughtSpecies = uniqueNumberList([...(state.caughtShinySpeciesIds || []), ...(state.pc || []).filter((pokemon) => pokemon?.shiny).map((pokemon) => pokemon.speciesId)]).length;
    const shinyPcCount = (state.pc || []).filter((pokemon) => pokemon.shiny).length;
    const caughtBallIds = new Set(uniqueStringList([...(state.caughtBallIds || []), ...(state.pc || []).map((pokemon) => pokemon?.caughtWith)]));
    const registry = shopItemRegistry();
    const plateDefinitions = registry && typeof registry.plates === "function" ? registry.plates() : [];
    const ownedPlateCount = plateDefinitions.filter((item) => itemCount(item.id) > 0).length;
    const plateTarget = plateDefinitions.length || 17;
    const winsByStat = state.statistics?.competitionWinsByStat || {};
    const wonStatCount = CONTEST_STATS.filter((stat) => Number(winsByStat[stat] || 0) > 0).length;
    const pcCount = (state.pc || []).length;
    const favouriteCount = (state.pc || []).filter((pokemon) => pokemon.favorite).length;
    const highestLevel = (state.pc || []).reduce((level, pokemon) => Math.max(level, Number(pokemon.level || 0)), state.encounter?.level || 0);
    const pendingActiveTarget = 999999;
    const activeQuarter = activeTotal ? Math.max(1, Math.ceil(activeTotal * 0.25)) : pendingActiveTarget;
    const activeHalf = activeTotal ? Math.max(1, Math.ceil(activeTotal * 0.5)) : pendingActiveTarget;
    const activeThreeQuarter = activeTotal ? Math.max(1, Math.ceil(activeTotal * 0.75)) : pendingActiveTarget;
    const activeAll = activeTotal || pendingActiveTarget;
    return [
      achievement("registered", "First steps", "Registration card", "Open a hatchery save.", state.player ? 1 : 0),
      achievement("first-egg-hatched", "First steps", "Shell hello", "Hatch your first egg.", state.statistics.eggsHatched, 1),
      achievement("first-catch", "First steps", "First settled friend", "Catch your first Pokémon.", state.statistics.pokemonCaught, 1),
      achievement("first-release", "First steps", "Gentle goodbye", "Release a visiting hatchling safely.", state.statistics.pokemonReleased, 1),
      achievement("first-partner", "First steps", "Watchful partner", "Set a Pokémon as your partner.", state.partnerUid ? 1 : 0),
      achievement("first-favourite", "First steps", "Little gold star", "Mark any PC Pokémon as a favourite.", favouriteCount, 1),
      achievement("showcase-six", "First steps", "Six ready", "Choose a full six-Pokémon showcase team.", state.team.length, 6),
      achievement("backup-safe", "First steps", "Backup-minded", "Have a save that can use export and import tools.", state.player ? 1 : 0),
      ...achievementsForThresholds("hatch", "Hatching", "Hatch", "Hatch eggs until the counter reaches", state.statistics.eggsHatched, [5, 10, 25, 50, 100, 250, 500]),
      achievement("early-clutch", "Hatching", "First clutch complete", "Hatch through the accelerated first clutch.", state.statistics.eggsHatched, 10),
      achievement("hatch-each-generation", "Hatching", "Every invited region says hello", "Hatch at least one Pokémon from each generation chosen for this save.", hatchedGenerationCount, enabledGenerations.length),
      achievement("pokedex-quarter", "Pokédex", "Quarter journal", "Meet 25% of the Pokémon available in this save's chosen generations.", activePokedexCount, activeQuarter),
      achievement("pokedex-half", "Pokédex", "Half-filled journal", "Meet 50% of the Pokémon available in this save's chosen generations.", activePokedexCount, activeHalf),
      achievement("pokedex-three-quarter", "Pokédex", "Thick field journal", "Meet 75% of the Pokémon available in this save's chosen generations.", activePokedexCount, activeThreeQuarter),
      achievement("pokedex-complete-active", "Pokédex", "Regional journal complete", "Meet every Pokémon available in this save's chosen generations. Disabled generations do not count.", activePokedexCount, activeAll),
      ...achievementsForThresholds("catch", "Catching", "Catch", "Catch Pokémon until the counter reaches", state.statistics.pokemonCaught, [5, 10, 25, 50, 100, 250, 500]),
      achievement("catch-each-generation", "Catching", "Every invited region joins", "Catch at least one Pokémon from each generation chosen for this save.", caughtGenerationCount, enabledGenerations.length),
      achievement("caught-species-25", "Catching", "Twenty-five settled species", "Catch 25 different species available in this save.", activeCaughtCount, Math.min(25, activeAll)),
      achievement("caught-species-100", "Catching", "Hundred-species PC", "Catch 100 different species available in this save.", activeCaughtCount, Math.min(100, activeAll)),
      achievement("caught-quarter", "Catching", "Quarter caught", "Catch 25% of the Pokémon available in this save's chosen generations.", activeCaughtCount, activeQuarter),
      achievement("caught-half", "Catching", "Half caught", "Catch 50% of the Pokémon available in this save's chosen generations.", activeCaughtCount, activeHalf),
      achievement("caught-all-active", "Catching", "Catch them all — your way", "Catch every Pokémon available in this save's chosen generations. Disabled generations do not count.", activeCaughtCount, activeAll),
      achievement("starter-hatch-one", "Starters", "Starter spark", "Hatch any starter Pokémon.", hatchedStarterCount, 1),
      achievement("starter-catch-one", "Starters", "Starter settled", "Catch any starter Pokémon.", caughtStarterCount, 1),
      achievement("starter-hatch-active", "Starters", "Starter clutch complete", "Hatch every starter from the generations chosen for this save.", hatchedStarterCount, starterIds.length),
      achievement("starter-catch-active", "Starters", "Starter shelf complete", "Catch every starter from the generations chosen for this save.", caughtStarterCount, starterIds.length),
      achievement("shiny-seen-one", "Shiny surprises", "First sparkle", "Meet a shiny Pokémon.", shinySeen, 1),
      achievement("shiny-caught-one", "Shiny surprises", "Sparkle settled", "Catch a shiny Pokémon.", shinyCaughtSpecies, 1),
      achievement("shiny-seen-three", "Shiny surprises", "Three glimmers", "Meet three shiny Pokémon.", shinySeen, 3),
      achievement("shiny-caught-five", "Shiny surprises", "Five bright friends", "Catch five different shiny species.", shinyCaughtSpecies, 5),
      achievement("shiny-pc-six", "Shiny surprises", "Glittering six", "Keep six shiny Pokémon in the PC.", shinyPcCount, 6),
      achievement("shiny-species-ten", "Shiny surprises", "Shiny field notes", "Record ten shiny species in the Pokédex.", shinySpeciesSeen, 10),
      achievement("ball-poke", "Poké Balls", "Classic click", "Catch something with a Poké Ball.", caughtBallIds.has("poke-ball") ? 1 : 0),
      achievement("ball-premier", "Poké Balls", "Premier click", "Catch something with a Premier Ball.", caughtBallIds.has("premier-ball") ? 1 : 0),
      achievement("ball-great", "Poké Balls", "Great click", "Catch something with a Great Ball.", caughtBallIds.has("great-ball") ? 1 : 0),
      achievement("ball-ultra", "Poké Balls", "Ultra click", "Catch something with an Ultra Ball.", caughtBallIds.has("ultra-ball") ? 1 : 0),
      achievement("ball-master", "Poké Balls", "Perfect purple click", "Catch something with a Master Ball.", caughtBallIds.has("master-ball") ? 1 : 0),
      achievement("buy-pokeballs-10", "Poké Balls", "Ten-ball habit", "Buy ten ordinary Poké Balls.", state.statistics.pokeBallsBought, 10),
      achievement("buy-pokeballs-50", "Poké Balls", "Stocked shelf", "Buy fifty ordinary Poké Balls.", state.statistics.pokeBallsBought, 50),
      achievement("premier-owned", "Poké Balls", "White surprise", "Own a Premier Ball.", state.inventory["premier-ball"] || caughtBallIds.has("premier-ball") ? 1 : 0),
      achievement("master-found", "Poké Balls", "Parcel miracle", "Find a Master Ball in a daily parcel.", state.statistics.masterBallsFound, 1),
      achievement("incubator-two", "Shop and bag", "Second cushion", "Unlock two incubators.", incubatorCapacity(), 2),
      achievement("incubator-three", "Shop and bag", "Busy nursery", "Unlock three incubators.", incubatorCapacity(), 3),
      achievement("incubator-five", "Shop and bag", "Five warm lights", "Unlock the maximum five incubators.", incubatorCapacity(), 5),
      achievement("magmarizer-owned", "Shop and bag", "Warm machine", "Own the Magmarizer.", hasItem("magmarizer") ? 1 : 0),
      achievement("shiny-charm-owned", "Shop and bag", "Bright trinket", "Own a Shiny Charm.", hasItem("shiny-charm") || activeShinyCharmCharges() > 0 ? 1 : 0),
      achievement("shiny-charm-used", "Shop and bag", "Charm bell", "Use a Shiny Charm.", state.statistics.shinyCharmUses || 0, 1),
      achievement("plate-one", "Shop and bag", "First plate", "Own any Arceus plate.", ownedPlateCount, 1),
      achievement("plate-five", "Shop and bag", "Plate drawer", "Own five Arceus plates.", ownedPlateCount, 5),
      achievement("plate-all", "Shop and bag", "Plate cabinet complete", "Own every Arceus plate.", ownedPlateCount, plateTarget),
      achievement("pc-six", "PC room", "A full little room", "Keep six Pokémon in the PC.", pcCount, 6),
      achievement("pc-thirty", "PC room", "Thirty friends", "Keep thirty Pokémon in the PC.", pcCount, 30),
      achievement("pc-hundred", "PC room", "Hundred-card PC", "Keep one hundred Pokémon in the PC.", pcCount, 100),
      achievement("favorites-ten", "PC room", "Favourite shelf", "Mark ten Pokémon as favourites.", favouriteCount, 10),
      achievement("level-fifty", "PC room", "Strong friend", "Raise any Pokémon to level 50.", highestLevel, 50),
      achievement("level-hundred", "PC room", "Level 100 legend", "Raise any Pokémon to level 100.", highestLevel, 100),
      achievement("contest-one", "Competitions", "First ribbon day", "Win one showcase.", state.statistics.competitionsWon, 1),
      achievement("contest-five", "Competitions", "Showcase regular", "Win five showcases.", state.statistics.competitionsWon, 5),
      achievement("contest-ten", "Competitions", "Judge favourite", "Win ten showcases.", state.statistics.competitionsWon, 10),
      achievement("contest-twenty-five", "Competitions", "Showcase champion", "Win twenty-five showcases.", state.statistics.competitionsWon, 25),
      achievement("contest-all-stats", "Competitions", "All-round team", "Win at least one showcase in every stat category.", wonStatCount, CONTEST_STATS.length),
      achievement("streak-three", "Daily rhythm", "Three-day nest", "Reach a three-day login streak.", state.streak, 3),
      achievement("streak-seven", "Daily rhythm", "One-week keeper", "Reach a seven-day login streak.", state.streak, 7),
      achievement("streak-ten", "Daily rhythm", "Parcel watcher", "Reach a ten-day login streak.", state.streak, 10),
      achievement("streak-thirty", "Daily rhythm", "Month-long keeper", "Reach a thirty-day login streak.", state.streak, 30)
    ];
  }

  function renderAchievementCard(entry) {
    const percent = Math.min(100, (entry.current / Math.max(1, entry.target)) * 100);
    const cardClasses = [
      "achievement-card",
      "paper-panel",
      entry.unlocked ? "is-unlocked" : "is-locked",
      entry.claimable ? "is-claimable" : "",
      entry.claimed ? "is-claimed" : ""
    ].filter(Boolean).join(" ");
    const mark = entry.claimed ? "✓" : entry.claimable ? "₽" : entry.unlocked ? "!" : "◇";
    const rewardAction = entry.claimable
      ? `<button class="button achievement-claim-button" type="button" data-action="claim-achievement" data-achievement-id="${escapeHtml(entry.id)}">Claim ${formatMoney(entry.reward)}</button>`
      : `<span class="achievement-reward-state ${entry.claimed ? "is-claimed" : ""}">${entry.claimed ? "Reward claimed" : entry.unlocked ? "Ready" : "Locked"}</span>`;
    return `<article class="${cardClasses}"><span class="achievement-mark">${mark}</span><div><p class="eyebrow">${escapeHtml(entry.category)}</p><h2>${escapeHtml(entry.title)}</h2><p>${escapeHtml(entry.description)}</p><div class="achievement-progress"><span style="width:${percent.toFixed(2)}%"></span></div><small>${entry.current.toLocaleString()} / ${entry.target.toLocaleString()}</small><div class="achievement-reward-row"><span class="achievement-reward">Reward ${formatMoney(entry.reward)}</span>${rewardAction}</div></div></article>`;
  }

  function claimAchievementReward(achievementId) {
    const entry = allAchievements().find((achievementEntry) => achievementEntry.id === achievementId);
    if (!entry) {
      toast("That achievement is not on this wall.");
      return;
    }
    if (!entry.unlocked) {
      toast("That reward is still locked.");
      return;
    }
    if (entry.claimed) {
      toast("That achievement reward has already been claimed.");
      return;
    }
    state.claimedAchievementIds = uniqueStringList([...(state.claimedAchievementIds || []), entry.id]);
    state.money += entry.reward;
    state.statistics.achievementRewardsClaimed = (state.statistics.achievementRewardsClaimed || 0) + entry.reward;
    saveState();
    if (activeTab === "achievements") renderAchievements();
    toast(`${entry.title} reward claimed: +${formatMoney(entry.reward)}.`);
  }

  function claimAllAchievementRewards() {
    const entries = allAchievements().filter((entry) => entry.claimable);
    if (!entries.length) {
      toast("No achievement rewards are waiting right now.");
      return;
    }
    const total = entries.reduce((sum, entry) => sum + entry.reward, 0);
    state.claimedAchievementIds = uniqueStringList([...(state.claimedAchievementIds || []), ...entries.map((entry) => entry.id)]);
    state.money += total;
    state.statistics.achievementRewardsClaimed = (state.statistics.achievementRewardsClaimed || 0) + total;
    saveState();
    if (activeTab === "achievements") renderAchievements();
    toast(`${entries.length} achievement reward${entries.length === 1 ? "" : "s"} claimed: +${formatMoney(total)}.`);
  }

  function renderAchievements() {
    const activeTotalKnown = activeSpeciesTarget() > 0;
    const entries = allAchievements();
    const unlocked = entries.filter((entry) => entry.unlocked).length;
    const claimed = entries.filter((entry) => entry.claimed).length;
    const claimable = entries.filter((entry) => entry.claimable);
    const pendingReward = claimable.reduce((sum, entry) => sum + entry.reward, 0);
    const grouped = entries.reduce((groups, entry) => {
      if (!groups[entry.category]) groups[entry.category] = [];
      groups[entry.category].push(entry);
      return groups;
    }, {});
    const rewardPanel = `<article class="paper-panel achievement-reward-panel"><div><p class="eyebrow">Reward chest</p><h2>${formatMoney(pendingReward)} waiting</h2><p>${claimable.length ? `${claimable.length} unlocked achievement reward${claimable.length === 1 ? "" : "s"} can be claimed.` : "No achievement rewards are waiting right now."}</p></div><button class="button button-primary" type="button" data-action="claim-all-achievements" ${claimable.length ? "" : "disabled"}>Claim all rewards</button></article>`;
    const groupsHtml = Object.entries(grouped).map(([category, categoryEntries]) => `<section class="achievement-group"><h2>${escapeHtml(category)}</h2><div class="achievement-grid">${categoryEntries.map(renderAchievementCard).join("")}</div></section>`).join("");
    view.innerHTML = `<section class="archive-page achievement-page">${pageHeader("Long-term records", "Achievements", "A wall of milestones for hatching, catching, collecting, contests, daily visits, and shop progress. Each one pays a Pokédollar reward once claimed, and completion goals use only the generations chosen for this save.", `<div class="summary-stamps"><span><b>${unlocked}</b> unlocked</span><span><b>${claimed}</b> claimed</span><span><b>${activeTotalKnown ? activeSpeciesTarget().toLocaleString() : "…"}</b> active species</span></div>`)}${rewardPanel}${!activeTotalKnown ? `<article class="paper-panel achievement-note"><p class="eyebrow">Counting chosen regions</p><p>The achievement wall is checking the species list for your enabled generations. Region-wide goals will settle in shortly.</p></article>` : ""}${groupsHtml}</section>`;
    if (!activeTotalKnown) {
      getEnabledSpeciesReferences().then(() => {
        if (activeTab === "achievements") renderAchievements();
      }).catch(() => {});
    }
  }

  function renderSettings() {
    const themes = THEME_TEMPLATES.map(([value, label, description]) => `<label class="theme-card" data-theme-preview="${value}"><input type="radio" name="theme" value="${value}" ${state.settings.theme === value ? "checked" : ""} /><span class="theme-swatch"></span><span class="theme-card-copy"><b>${label}</b><small>${description}</small><em>easy to read</em></span></label>`).join("");
    const devToolsPanel = renderDevSettingsPanel();
    view.innerHTML = `
      <section class="archive-page settings-page">
        ${pageHeader("Hatchery preferences", "Settings", "Adjust the hatchery’s look and check the details written on your first registration card.")}
        <form id="settings-form" class="settings-form">
          <article class="paper-panel settings-section">
            <p class="eyebrow">Registration card</p><h2>Identity</h2>
            <dl class="static-details"><dt>Name</dt><dd>${escapeHtml(state.player.name)}</dd><dt>Gender</dt><dd>${escapeHtml(genderLabel(state.player.gender))}</dd><dt>Date of birth</dt><dd>${new Date(`${state.player.dob}T12:00:00`).toLocaleDateString()}</dd><dt>Hatchery opened</dt><dd>${new Date(state.player.createdAt).toLocaleDateString()}</dd></dl>
            <p class="settings-copy">Your registration card is part of this save and stays as it was written when the hatchery opened.</p>
          </article>
          <article class="paper-panel settings-section settings-wide">
            <p class="eyebrow">Invited regions</p><h2>Egg regions</h2><p class="settings-copy">These regions were chosen when the hatchery opened and are now part of this save.</p>
            <dl class="static-details"><dt>Regions</dt><dd>${escapeHtml(generationSummary())}</dd></dl>
          </article>
          <article class="paper-panel settings-section settings-wide">
            <p class="eyebrow">Hatchery look</p><h2>Theme</h2><p class="settings-copy">Choose a colour template. Each one is kept readable across the hatchery before it reaches this list.</p><div class="theme-grid">${themes}</div>
          </article>
          ${devToolsPanel}
          <div class="settings-actions"><p id="settings-error" class="form-error"></p><button class="button button-primary" type="submit">Save settings</button></div>
        </form>
        <article class="paper-panel settings-section settings-wide save-tools-panel">
          <p class="eyebrow">Save backup</p><h2>Carry the nest elsewhere</h2><p class="settings-copy">Export a backup file before changing browsers, clearing storage, or moving to another device. Importing a backup replaces the current local hatchery on this browser.</p>
          <div class="button-row"><button class="button button-primary" type="button" data-action="export-save">Export save</button><button class="button" type="button" data-action="request-import-save">Import save</button></div>
          <input id="save-import-input" class="sr-only" type="file" accept="application/json,.json" />
        </article>
        <article class="danger-zone"><div><p class="eyebrow">Big red button</p><h2>Reset the hatchery</h2><p>Clear this browser’s hatchery and start again from an empty nest.</p></div><button class="button button-accent" type="button" data-action="request-reset">Reset everything</button></article>
      </section>`;
  }

  function renderPlaceholder(tab) {
    view.innerHTML = `<section class="placeholder-page">${emptyState("That door is stuck", `The ${escapeHtml(tab)} room could not be opened.`)}</section>`;
  }

  function render() {
    if (syncMysteriousItemUnlocks(true)) saveState();
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === activeTab);
    });
    if (activeTab === "home") renderHome();
    else if (activeTab === "pokedex") renderPokedex();
    else if (activeTab === "pc") renderPc();
    else if (activeTab === "bag") renderBag();
    else if (activeTab === "competitions") renderCompetitions();
    else if (activeTab === "achievements") renderAchievements();
    else if (activeTab === "mart") renderMart();
    else if (activeTab === "settings") renderSettings();
    else renderPlaceholder(activeTab);
    updateHeader();
    flushMysteriousUnlockToasts();
    animateRenderedView();
    syncIdleCryTimer();
    view.focus({ preventScroll: true });
  }

  function switchTab(tab) {
    closeModal();
    activeTab = tab;
    mobileNav.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    render();
  }

  function millisecondsUntilTomorrow() {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    return tomorrow - new Date();
  }

  function startClock() {
    window.clearInterval(clockTimer);
    clockTimer = window.setInterval(() => {
      if (state.player && state.lastLoginDate !== localDateKey()) applyDailyReward();
      ensureAllIncubators();
      settleReturnedExpeditions(true);
      incubatorSlots().forEach((slot, index) => {
        if (eggNeedsPreparedEncounterForSlot(slot)) prepareEggForSlot(slot, index);
        else if (triggerSnakeEggEventForSlot(index)) return;
        if (slot.egg && !eggNeedsPreparedEncounterForSlot(slot) && Date.now() >= slot.egg.hatchAt) hatchEggForSlot(index);
      });
      const activeChanged = accrueEncounterExperience();
      if (activeChanged && activeTab === "home") {
        render();
        return;
      }
      if (activeTab !== "home") return;
      const hatchCountdown = document.getElementById("hatch-countdown");
      const giftCountdown = document.getElementById("gift-countdown");
      const eggProgress = document.getElementById("egg-progress");
      if (hatchCountdown) hatchCountdown.textContent = state.egg ? (eggNeedsPreparedEncounter() ? "syncing" : "incubating") : "empty";
      if (giftCountdown) giftCountdown.textContent = formatDuration(millisecondsUntilTomorrow());
      if (eggProgress && state.egg) {
        const hatchDuration = Math.max(1, state.egg.hatchDuration || state.egg.hatchAt - state.egg.laidAt);
        eggProgress.style.width = eggNeedsPreparedEncounter() ? "0%" : `${Math.min(100, ((Date.now() - state.egg.laidAt) / hatchDuration) * 100)}%`;
      }
    }, 1000);
  }

  function showOnboarding() {
    const today = localDateKey();
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <p class="eyebrow">Hatchery registration</p>
          <h1 id="welcome-title">Begin your hatchery</h1>
          <p class="modal-intro">Every hatchery begins with a name, a field card, a few invited regions, and one very promising egg. These details stay in this browser.</p>
          <form id="onboarding-form" class="form-grid">
            <div class="field"><label for="player-name">Your name</label><input id="player-name" name="name" maxlength="24" autocomplete="name" required /></div>
            <div class="field"><label for="player-dob">Date of birth</label><input id="player-dob" name="dob" type="date" max="${today}" required /></div>
            <fieldset class="field option-field"><legend>Player gender</legend><div class="check-grid gender-grid"><label class="check-card"><input type="radio" name="gender" value="boy" required /><span><b>Boy</b><small>he/him field card</small></span></label><label class="check-card"><input type="radio" name="gender" value="girl" required /><span><b>Girl</b><small>she/her field card</small></span></label><label class="check-card"><input type="radio" name="gender" value="other" required /><span><b>Other</b><small>they/them field card</small></span></label></div></fieldset>
            <fieldset class="field option-field"><legend>Egg regions</legend><p class="settings-copy">Choose which generations can send eggs to your hatchery. This becomes part of the save.</p><div class="check-grid">${generationSignupCards()}</div></fieldset>
            <p id="onboarding-error" class="form-error" role="alert"></p>
            <div class="button-row"><button class="button button-primary" type="submit">Receive your first egg</button></div>
          </form>
        </section>
      </div>`;
    document.getElementById("player-name").focus();
  }

  function completeOnboarding(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const name = String(form.get("name") || "").trim();
    const dob = String(form.get("dob") || "");
    const gender = String(form.get("gender") || "");
    const generations = form.getAll("generation").map(Number).filter((generation) => generation >= 1 && generation <= 9);
    const error = document.getElementById("onboarding-error");
    if (name.length < 2) {
      error.textContent = "Your name needs at least two characters.";
      return;
    }
    if (!dob || dob > localDateKey()) {
      error.textContent = "Please choose a valid date of birth.";
      return;
    }
    if (!["boy", "girl", "other"].includes(gender)) {
      error.textContent = "Please choose Boy, Girl, or Other.";
      return;
    }
    if (!generations.length) {
      error.textContent = "Choose at least one egg region.";
      return;
    }
    state.player = { name, dob, gender, createdAt: new Date().toISOString() };
    state.settings.generations = generations;
    ensureAllIncubators();
    applyDailyReward();
    saveState();
    modalRoot.innerHTML = "";
    render();
    toast(`Welcome, ${name}. Your first egg is warm and waiting.`);
  }

  function closeModal() {
    clearCatchChallengeTimer();
    catchChallenge = null;
    modalRoot.innerHTML = "";
  }

  function ballMark(name) {
    return `<img class="ball-mark" src="${itemSpriteUrl(name)}" alt="" />`;
  }

  function showBallChooser() {
    if (!state.encounter) return;
    const ballOrder = ["poke-ball", "premier-ball", "great-ball", "ultra-ball", "master-ball"];
    const availableBalls = ballOrder.filter((name) => Number(state.inventory[name] || 0) > 0);
    const balls = availableBalls.length ? availableBalls.map((name) => {
      const count = state.inventory[name] || 0;
      return `<button class="ball-choice" type="button" data-action="throw-ball" data-ball="${name}">${ballMark(name)}<span><strong>${displayBallName(name)}</strong><small>${count} in bag</small></span></button>`;
    }).join("") : `<p class="no-results">No Poké Balls are tucked away right now.</p>`;
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <section class="modal paper-panel ball-modal" role="dialog" aria-modal="true" aria-labelledby="ball-title">
          <p class="eyebrow">Field bag</p><h2 id="ball-title">Choose a Poké Ball</h2>
          <p class="modal-intro">${escapeHtml(state.encounter.displayName)} is watching the Poké Balls very carefully. Pick the one that feels right.</p>
          <div class="ball-list">${balls}</div>
          <div class="button-row"><button class="button" type="button" data-close-modal>Keep watching</button><button class="button" type="button" data-tab="mart">Visit Pokémart</button></div>
        </section>
      </div>`;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function catchDifficulty(pokemon) {
    const captureRate = clamp(Number(pokemon?.captureRate || 45), 3, 255);
    const baseStatTotal = clamp(Number(pokemon?.baseStatTotal || 350), 180, 720);
    const rateDifficulty = 1 - ((captureRate - 3) / 252);
    const statDifficulty = (baseStatTotal - 180) / 540;
    return clamp((rateDifficulty * 0.72) + (statDifficulty * 0.28), 0, 1);
  }

  function rhythmProfile(ball) {
    return BALL_CATCH_PROFILES[ball] || BALL_CATCH_PROFILES["poke-ball"];
  }

  function rhythmTargetCount(pokemon, ball) {
    const profile = rhythmProfile(ball);
    const difficulty = catchDifficulty(pokemon);
    const baseCount = 2 + Math.ceil(difficulty * 3);
    return clamp(Math.ceil(baseCount * profile.taps), 2, 5);
  }

  function rhythmDuration(pokemon, ball, index) {
    const profile = rhythmProfile(ball);
    const difficulty = catchDifficulty(pokemon);
    const drift = 1 + (((index % 3) - 1) * 0.04);
    return Math.round(clamp((1450 - (difficulty * 520)) * profile.speed * drift, 650, 2600));
  }

  function rhythmWindow(pokemon, ball) {
    const profile = rhythmProfile(ball);
    const difficulty = catchDifficulty(pokemon);
    return clamp((0.19 - (difficulty * 0.055)) * profile.window, 0.12, 0.38);
  }

  function rhythmSuccessBounds(windowSize) {
    const outer = clamp(CATCH_RING_SUCCESS_OUTER_SCALE + (windowSize * 0.16), 1.1, 1.22);
    const inner = clamp(CATCH_RING_SUCCESS_INNER_SCALE - (windowSize * 0.06), 0.68, 0.74);
    return { inner, outer };
  }

  function rhythmQuality(elapsed, duration, windowSize) {
    const progress = clamp(elapsed / duration, 0, 1);
    const scale = CATCH_RING_START_SCALE + ((CATCH_RING_END_SCALE - CATCH_RING_START_SCALE) * progress);
    const bounds = rhythmSuccessBounds(windowSize);
    if (scale <= bounds.outer && scale >= bounds.inner) {
      const middle = (bounds.outer + bounds.inner) / 2;
      const halfRange = (bounds.outer - bounds.inner) / 2;
      const distance = Math.abs(scale - middle);
      return { hit: true, label: distance <= halfRange * 0.32 ? "perfect" : "good" };
    }
    return { hit: false, label: scale > bounds.outer ? "early" : "late" };
  }

  function buildCatchChallenge(pokemon, ball) {
    const targetCount = rhythmTargetCount(pokemon, ball);
    const windowSize = rhythmWindow(pokemon, ball);
    const targets = Array.from({ length: targetCount }, (_, index) => ({
      id: makeId(),
      index,
      x: 22 + randomInt(0, 57),
      y: 24 + randomInt(0, 51),
      duration: rhythmDuration(pokemon, ball, index),
      window: windowSize,
      state: "waiting",
      quality: "",
      startedAt: 0
    }));
    return {
      ball,
      pokemonUid: pokemon.uid,
      targets,
      activeIndex: 0,
      hits: 0,
      misses: 0,
      finished: false
    };
  }

  function clearCatchChallengeTimer() {
    if (catchChallengeTimer) window.clearTimeout(catchChallengeTimer);
    catchChallengeTimer = null;
  }

  function renderCatchChallenge() {
    if (!catchChallenge || !state.encounter || state.encounter.uid !== catchChallenge.pokemonUid) return;
    const pokemon = state.encounter;
    const ballName = displayBallName(catchChallenge.ball);
    const activeTarget = catchChallenge.targets[catchChallenge.activeIndex];
    const targetMarkup = activeTarget ? (() => {
      const isActive = activeTarget.state === "active";
      const className = ["rhythm-target", `is-${activeTarget.state}`, activeTarget.quality ? `quality-${activeTarget.quality}` : ""].filter(Boolean).join(" ");
      const statusLabel = activeTarget.state === "hit" ? "hit" : activeTarget.state === "miss" ? "missed" : isActive ? "tap now" : "waiting";
      const bounds = rhythmSuccessBounds(activeTarget.window);
      const style = [
        `--target-x:${activeTarget.x}%`,
        `--target-y:${activeTarget.y}%`,
        `--ring-duration:${activeTarget.duration}ms`,
        `--success-outer-scale:${bounds.outer}`,
        `--success-inner-scale:${bounds.inner}`
      ].join(";");
      return `<button class="${className}" type="button" data-action="catch-target" data-target-id="${activeTarget.id}" style="${style}" ${isActive ? "" : "disabled"} aria-label="Catch rhythm target ${activeTarget.index + 1}, ${statusLabel}">
        <span class="rhythm-success-zone" aria-hidden="true"></span>
        <span class="rhythm-inner-limit" aria-hidden="true"></span>
        <span class="rhythm-ring" aria-hidden="true"></span>
        <span class="rhythm-dot" aria-hidden="true"></span>
        <span class="rhythm-status" aria-hidden="true">${activeTarget.state === "hit" ? "✓" : activeTarget.state === "miss" ? "×" : activeTarget.index + 1}</span>
      </button>`;
    })() : "";
    modalRoot.innerHTML = `
      <div class="modal-backdrop rhythm-backdrop">
        <section class="modal paper-panel rhythm-modal" role="dialog" aria-modal="true" aria-labelledby="rhythm-title">
          <p class="eyebrow">${escapeHtml(ballName)} throw</p><h2 id="rhythm-title">Match the rings</h2>
          <p class="modal-intro">One dot appears at a time. Tap while the moving ring is inside the marked safe zone. Miss even one wobble and the ball pops open.</p>
          <div class="rhythm-stage" aria-live="polite">${targetMarkup}</div>
          <div class="rhythm-progress" aria-label="Catch rhythm progress">
            ${catchChallenge.targets.map((target, index) => `<span class="${target.state === "hit" ? "is-hit" : target.state === "miss" ? "is-miss" : index === catchChallenge.activeIndex ? "is-active" : ""}"></span>`).join("")}
          </div>
          <p class="passive-note">${activeTarget ? `Target ${activeTarget.index + 1} of ${catchChallenge.targets.length}` : "One last shake…"}</p>
        </section>
      </div>`;
  }

  function activateCatchTarget() {
    clearCatchChallengeTimer();
    if (!catchChallenge || catchChallenge.finished) return;
    const target = catchChallenge.targets[catchChallenge.activeIndex];
    if (!target) {
      resolveCatchChallenge();
      return;
    }
    target.state = "active";
    target.startedAt = performance.now();
    renderCatchChallenge();
    catchChallengeTimer = window.setTimeout(() => missCatchTarget(target.id), target.duration + 60);
  }

  function advanceCatchTarget() {
    if (!catchChallenge || catchChallenge.finished) return;
    catchChallenge.activeIndex += 1;
    if (catchChallenge.activeIndex >= catchChallenge.targets.length) {
      resolveCatchChallenge();
      return;
    }
    window.setTimeout(activateCatchTarget, 260);
  }

  function missCatchTarget(targetId) {
    if (!catchChallenge || catchChallenge.finished) return;
    const target = catchChallenge.targets[catchChallenge.activeIndex];
    if (!target || target.id !== targetId || target.state !== "active") return;
    target.state = "miss";
    target.quality = "miss";
    catchChallenge.misses += 1;
    renderCatchChallenge();
    advanceCatchTarget();
  }

  function handleCatchTargetTap(targetId) {
    if (!catchChallenge || catchChallenge.finished) return;
    const target = catchChallenge.targets[catchChallenge.activeIndex];
    if (!target || target.id !== targetId || target.state !== "active") return;
    clearCatchChallengeTimer();
    const quality = rhythmQuality(performance.now() - target.startedAt, target.duration, target.window);
    target.state = quality.hit ? "hit" : "miss";
    target.quality = quality.label;
    if (quality.hit) catchChallenge.hits += 1;
    else catchChallenge.misses += 1;
    renderCatchChallenge();
    advanceCatchTarget();
  }

  function finishCaughtPokemon(pokemon, ball, heading = "Caught!", eyebrow = "Click… click… click… click!") {
    pokemon.caughtAt = new Date().toISOString();
    pokemon.ot = state.player.name;
    pokemon.caughtWith = ball;
    state.pc.push(pokemon);
    recordCaughtPokemon(pokemon, ball);
    state.encounter = null;
    state.statistics.pokemonCaught += 1;
    shopItems = null;
    ensureEgg();
    saveState();
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel catch-result" role="dialog" aria-modal="true" aria-labelledby="catch-title">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p><h2 id="catch-title">${escapeHtml(heading)}</h2>
        <img class="result-sprite" src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.displayName)}" />
        <p class="modal-intro">${escapeHtml(pokemon.displayName)} is safe in the PC room. The incubator cushion is ready for the next egg.</p>
        <button class="button button-primary" type="button" data-close-modal data-tab="pc">Open PC card</button>
      </section></div>`;
    render();
  }

  function resolveCatchChallenge() {
    if (!catchChallenge || catchChallenge.finished) return;
    clearCatchChallengeTimer();
    catchChallenge.finished = true;
    const pokemon = state.encounter;
    if (!pokemon || pokemon.uid !== catchChallenge.pokemonUid) {
      catchChallenge = null;
      return;
    }
    const caught = catchChallenge.hits === catchChallenge.targets.length && catchChallenge.misses === 0;
    const ball = catchChallenge.ball;
    const hits = catchChallenge.hits;
    const total = catchChallenge.targets.length;
    catchChallenge = null;
    if (caught) {
      finishCaughtPokemon(pokemon, ball, "Caught!", "Perfect toss!");
      return;
    }
    saveState();
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel catch-result" role="dialog" aria-modal="true" aria-labelledby="escape-title">
        <p class="eyebrow">Catch attempt ${pokemon.catchAttempts}</p><h2 id="escape-title">It wriggled loose</h2>
        <div class="shake-record" aria-label="${hits} matched rings out of ${total}">${catchChallengeResultMarks(hits, total)}</div>
        <p class="modal-intro">The ball danced for a moment, then popped open. Every ring needs a clean tap, and ${escapeHtml(pokemon.displayName)} is still watching your hand.</p>
        <div class="button-row"><button class="button button-primary" type="button" data-action="choose-ball">Try another ball</button><button class="button" type="button" data-close-modal>Keep watching</button></div>
      </section></div>`;
    render();
  }

  function catchChallengeResultMarks(hits, total) {
    return Array.from({ length: Math.max(1, total) }, (_, index) => `<span class="${index < hits ? "is-filled" : ""}"></span>`).join("");
  }

  function catchEncounter(ball) {
    const pokemon = state.encounter;
    if (!pokemon || !BALL_BONUSES[ball] || (state.inventory[ball] || 0) <= 0) return;
    state.inventory[ball] -= 1;
    pokemon.catchAttempts += 1;
    if (ball === "master-ball" || isDevToolEnabled("guaranteedCatch")) {
      finishCaughtPokemon(pokemon, ball, "Caught!", "No wobble. No fuss.");
      return;
    }
    catchChallenge = buildCatchChallenge(pokemon, ball);
    saveState();
    activateCatchTarget();
    render();
  }

  function showReleaseConfirmation() {
    if (!state.encounter) return;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="release-title">
        <p class="eyebrow">Gentle goodbye</p><h2 id="release-title">Let ${escapeHtml(state.encounter.displayName)} wander off?</h2>
        <p class="modal-intro">The Pokédex page will stay, but this little visitor will leave your hatchery. You will receive a small thank-you gift.</p>
        <div class="button-row"><button class="button button-accent" type="button" data-action="confirm-release">Let them go</button><button class="button" type="button" data-close-modal>Keep them here</button></div>
      </section></div>`;
  }

  function releaseEncounter() {
    if (!state.encounter) return;
    const name = state.encounter.displayName;
    const reward = randomInt(5, 16);
    state.money += reward;
    state.statistics.pokemonReleased += 1;
    state.encounter = null;
    ensureEgg();
    saveState();
    modalRoot.innerHTML = "";
    render();
    toast(`${name} wandered off safely. Thank-you gift: +₽${reward}.`);
  }

  function showPokedexEntry(speciesId) {
    const entry = state.pokedex[String(speciesId)];
    if (!entry) return;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel summary-modal" role="dialog" aria-modal="true" aria-labelledby="dex-entry-title">
        <p class="eyebrow">National No. ${String(entry.speciesId).padStart(3, "0")}</p><h2 id="dex-entry-title">${escapeHtml(entry.displayName)}</h2>
        <div class="dex-entry-sprites"><figure><img src="${escapeHtml(entry.sprite)}" alt="${escapeHtml(entry.displayName)}" /><figcaption>regular</figcaption></figure>${entry.shinySeen && entry.shinySprite ? `<figure><img src="${escapeHtml(entry.shinySprite)}" alt="Shiny ${escapeHtml(entry.displayName)}" /><figcaption>shiny · ${entry.shinySeen}</figcaption></figure>` : ""}</div>
        <dl class="summary-list"><dt>Times met</dt><dd>${entry.seen}</dd><dt>Shiny meetings</dt><dd>${entry.shinySeen}</dd><dt>Hatch time</dt><dd>${escapeHtml(formatPokedexHatchTime(entry.baseStatTotal))}</dd><dt>First met</dt><dd>${new Date(entry.firstEncounteredAt).toLocaleString()}</dd></dl>
        <div class="button-row"><button class="button button-primary" type="button" data-action="play-pokedex-cry" data-species-id="${entry.speciesId}">Hear cry</button><button class="button" type="button" data-close-modal>Close page</button></div>
      </section></div>`;
  }

  function showPcSummary(uid) {
    const pokemon = state.pc.find((entry) => entry.uid === uid);
    if (!pokemon) return;
    normalisePokemonTraining(pokemon);
    const stats = CONTEST_STATS.map((stat) => `<tr><th>${statLabel(stat)}</th><td>${statValue(pokemon, stat)}</td><td>${Number(pokemon.evs?.[stat] || 0)} / ${TRAINING_STAT_CAP}</td></tr>`).join("");
    const trainingCopy = `${trainingTotal(pokemon)} / ${TRAINING_TOTAL_CAP} points`;
    const evolutionNotes = (pokemon.evolutionHistory || []).map((entry) => `<li>${escapeHtml(entry.from)} → ${escapeHtml(entry.to)} at level ${entry.level}</li>`).join("");
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel summary-modal pc-summary" role="dialog" aria-modal="true" aria-labelledby="pc-summary-title">
        <div class="summary-hero"><img src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.displayName)}" /><div><p class="eyebrow">${pokemon.shiny ? "✦ Shiny friend" : `National No. ${String(pokemon.speciesId).padStart(3, "0")}`}</p><h2 id="pc-summary-title">${escapeHtml(pokemon.nickname || pokemon.displayName)}</h2><p>${pokemon.nickname ? escapeHtml(pokemon.displayName) + " · " : ""}Level ${pokemon.level}</p></div></div>
        <form id="nickname-form" class="nickname-form" data-uid="${pokemon.uid}"><div class="field"><label for="nickname">Nickname</label><input id="nickname" name="nickname" maxlength="16" value="${escapeHtml(pokemon.nickname || "")}" placeholder="Use their species name" /></div><button class="button" type="submit">Save nickname</button></form>
        <dl class="summary-list two-column"><dt>Ability</dt><dd>${titleCase(pokemon.ability)}${pokemon.hiddenAbility ? " · hidden" : ""}</dd><dt>Types</dt><dd>${pokemon.types.map(titleCase).join(" / ")}</dd><dt>Growth</dt><dd>${pokemon.experience.toLocaleString()} XP</dd><dt>Training</dt><dd>${trainingCopy}</dd><dt>Caught with</dt><dd>${displayBallName(pokemon.caughtWith)}</dd><dt>Favourite</dt><dd>${pokemon.favorite ? "yes" : "not yet"}</dd><dt>Partner</dt><dd>${state.partnerUid === pokemon.uid ? "keeping watch" : "not currently"}</dd><dt>First friend</dt><dd>${escapeHtml(pokemon.ot)}</dd><dt>Hatched on</dt><dd>${new Date(pokemon.encounteredAt).toLocaleString()}</dd><dt>Joined PC</dt><dd>${new Date(pokemon.caughtAt).toLocaleString()}</dd></dl>
        <table class="stat-table"><thead><tr><th>Stat</th><th>Current</th><th>Berry points</th></tr></thead><tbody>${stats}</tbody></table>
        ${evolutionNotes ? `<div class="evolution-notes"><p class="eyebrow">Evolution memories</p><ul>${evolutionNotes}</ul></div>` : ""}
        <div class="button-row">
          <button class="button" type="button" data-action="toggle-favorite" data-uid="${pokemon.uid}">${pokemon.favorite ? "Remove favourite" : "Mark favourite"}</button>
          <button class="button" type="button" data-action="toggle-partner" data-uid="${pokemon.uid}">${state.partnerUid === pokemon.uid ? "Rest partner" : "Set as partner"}</button>
          <button class="button" type="button" data-action="open-expedition" data-uid="${pokemon.uid}">Send exploring</button>
          <button class="button button-primary" type="button" data-close-modal>Close card</button>
        </div>
      </section></div>`;
  }

  function toggleTeam(uid) {
    if (state.team.includes(uid)) state.team = state.team.filter((id) => id !== uid);
    else if (state.team.length < 6) state.team.push(uid);
    else {
      toast("Only six Pokémon can squeeze onto the showcase team.");
      return;
    }
    saveState();
    render();
  }

  function toggleFavorite(uid) {
    const pokemon = state.pc.find((entry) => entry.uid === uid);
    if (!pokemon) return;
    pokemon.favorite = !pokemon.favorite;
    saveState();
    if (modalRoot.querySelector(".pc-summary")) showPcSummary(uid);
    if (activeTab === "pc") renderPc();
    toast(pokemon.favorite ? `${pokemon.nickname || pokemon.displayName} is now a favourite.` : `${pokemon.nickname || pokemon.displayName} is no longer marked as a favourite.`);
  }

  function togglePartner(uid) {
    const pokemon = state.pc.find((entry) => entry.uid === uid);
    if (!pokemon) return;
    const wasPartner = state.partnerUid === uid;
    state.partnerUid = wasPartner ? "" : uid;
    saveState();
    if (modalRoot.querySelector(".pc-summary")) showPcSummary(uid);
    if (activeTab === "pc" || activeTab === "home") render();
    toast(wasPartner ? `${pokemon.nickname || pokemon.displayName} is resting in the PC room.` : `${pokemon.nickname || pokemon.displayName} is keeping watch by the incubator.`);
  }



  function showBerryTargetChooser(itemId) {
    const item = shopItemDefinition(itemId);
    if (!item || item.category !== "berry" || itemCount(itemId) <= 0) return;
    const pokemonCards = state.pc.length ? state.pc.map((pokemon) => {
      normalisePokemonTraining(pokemon);
      const room = TRAINING_TOTAL_CAP - trainingTotal(pokemon);
      const canUse = room > 0 && Object.keys(item.statEffects || {}).some((stat) => trainingRoomForStat(pokemon, stat) > 0);
      return `
        <button class="berry-target-card" type="button" data-action="apply-berry" data-item-id="${escapeHtml(item.id)}" data-uid="${escapeHtml(pokemon.uid)}" ${canUse ? "" : "disabled"}>
          <img src="${escapeHtml(pokemon.sprite)}" alt="" />
          <span><strong>${escapeHtml(pokemon.nickname || pokemon.displayName)}</strong><small>Lv. ${pokemon.level} · ${trainingTotal(pokemon)} / ${TRAINING_TOTAL_CAP} points</small></span>
        </button>`;
    }).join("") : `<p class="no-results">There are no PC Pokémon to train right now.</p>`;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel summary-modal" role="dialog" aria-modal="true" aria-labelledby="berry-title">
        <p class="eyebrow">Berry training</p><h2 id="berry-title">Use ${escapeHtml(item.displayName)}</h2>
        <p class="modal-intro">${escapeHtml(describeStatEffects(item.statEffects))}. Training is capped at ${TRAINING_STAT_CAP} per stat and ${TRAINING_TOTAL_CAP} total points.</p>
        <div class="berry-target-grid">${pokemonCards}</div>
        <div class="button-row"><button class="button" type="button" data-close-modal>Keep berry</button></div>
      </section></div>`;
  }

  function applyBerryToPokemon(itemId, uid) {
    const item = shopItemDefinition(itemId);
    const pokemon = state.pc.find((entry) => entry.uid === uid);
    if (!item || item.category !== "berry" || !pokemon || itemCount(itemId) <= 0) return;
    normalisePokemonTraining(pokemon);
    const applied = [];
    for (const [stat, rawAmount] of Object.entries(item.statEffects || {})) {
      if (!CONTEST_STATS.includes(stat)) continue;
      const amount = Math.max(0, Math.floor(Number(rawAmount || 0)));
      const allowed = Math.min(amount, trainingRoomForStat(pokemon, stat));
      if (allowed <= 0) continue;
      pokemon.evs[stat] += allowed;
      applied.push(`+${allowed} ${statLabel(stat)}`);
    }
    if (!applied.length) {
      toast(`${pokemon.nickname || pokemon.displayName} cannot use that berry without breaking training limits.`);
      showBerryTargetChooser(itemId);
      return;
    }
    setItemCount(itemId, itemCount(itemId) - 1);
    state.statistics.berriesUsed = (state.statistics.berriesUsed || 0) + 1;
    saveState();
    modalRoot.innerHTML = "";
    if (activeTab === "bag") renderBag();
    if (activeTab === "pc") renderPc();
    toast(`${pokemon.nickname || pokemon.displayName} enjoyed ${item.displayName}: ${applied.join(", ")}.`);
  }

  function showRareCandyTargetChooser(itemId) {
    const item = shopItemDefinition(itemId);
    if (!item || item.id !== "rare-candy" || itemCount(itemId) <= 0) return;
    const pokemonCards = state.pc.length ? state.pc.map((pokemon) => {
      const canUse = Number(pokemon.level || 1) < 100;
      return `
        <button class="berry-target-card" type="button" data-action="apply-rare-candy" data-item-id="${escapeHtml(item.id)}" data-uid="${escapeHtml(pokemon.uid)}" ${canUse ? "" : "disabled"}>
          <img src="${escapeHtml(pokemon.sprite)}" alt="" />
          <span><strong>${escapeHtml(pokemon.nickname || pokemon.displayName)}</strong><small>Lv. ${pokemon.level}${canUse ? "" : " · level cap"}</small></span>
        </button>`;
    }).join("") : `<p class="no-results">There are no PC Pokémon ready for candy right now.</p>`;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel summary-modal" role="dialog" aria-modal="true" aria-labelledby="rare-candy-title">
        <p class="eyebrow">Rare Candy</p><h2 id="rare-candy-title">Choose a Pokémon</h2>
        <p class="modal-intro">Rare Candy raises one PC Pokémon by one level and cannot push anyone past level 100.</p>
        <div class="berry-target-grid">${pokemonCards}</div>
        <div class="button-row"><button class="button" type="button" data-close-modal>Keep candy</button></div>
      </section></div>`;
  }

  async function applyRareCandyToPokemon(itemId, uid) {
    const item = shopItemDefinition(itemId);
    const pokemon = state.pc.find((entry) => entry.uid === uid);
    if (!item || item.id !== "rare-candy" || !pokemon || itemCount(itemId) <= 0) return;
    if (Number(pokemon.level || 1) >= 100) {
      toast(`${pokemon.nickname || pokemon.displayName} is already at level 100.`);
      showRareCandyTargetChooser(itemId);
      return;
    }
    const oldLevel = pokemon.level;
    setItemCount(itemId, itemCount(itemId) - 1);
    const evolutions = await setPokemonLevel(pokemon, Math.min(100, oldLevel + 1));
    saveState();
    modalRoot.innerHTML = "";
    if (activeTab === "bag") renderBag();
    if (activeTab === "pc") renderPc();
    const evolutionText = evolutions.length ? ` ${evolutions.join(" ")}.` : "";
    toast(`${pokemon.nickname || pokemon.displayName} grew from level ${oldLevel} to level ${pokemon.level}.${evolutionText}`);
  }

  function sellSouvenir(itemId, sellAll = false) {
    const item = shopItemDefinition(itemId);
    if (!item || item.category !== "souvenir") return;
    const count = Number(state.souvenirs?.[itemId] || 0);
    if (count <= 0) return;
    const amount = sellAll ? count : 1;
    const payout = amount * Number(item.sellValue || 0);
    addSouvenirToBag(itemId, -amount);
    state.statistics.keepsakesSold = (state.statistics.keepsakesSold || 0) + amount;
    state.money += payout;
    saveState();
    renderBag();
    updateHeader();
    toast(`Sold ${amount} ${item.displayName}${amount === 1 ? "" : "s"} for ₽${payout.toLocaleString()}.`);
  }



  function summonMysteriousEgg(itemId) {
    const item = shopItemDefinition(itemId);
    if (!item || item.category !== "mysterious" || itemCount(item.id) <= 0) return;
    normaliseIncubatorsIfNeeded();
    const slotIndex = activeIncubatorIndex();
    const slot = incubatorSlots()[slotIndex];
    if (!slot || slot.egg || slot.encounter) {
      toast("The active incubator needs an empty cushion before that relic can call an egg.");
      return;
    }
    slot.egg = createEgg(Date.now(), false, Number(item.summonSpeciesId || 0));
    slot.egg.mysteriousItemId = item.id;
    slot.egg.mysteriousSummon = true;
    syncLegacyFromActiveIncubator();
    state.statistics.mysteriousSummons = (state.statistics.mysteriousSummons || 0) + 1;
    saveState();
    if (activeTab === "bag" || activeTab === "home") render();
    toast(`${item.displayName} hummed. An egg for ${item.summonSpeciesName || "a rare Pokémon"} settled into incubator ${slotIndex + 1}.`);
  }

  function showExpeditionChooser(uid) {
    const pokemon = state.pc.find((entry) => entry.uid === uid);
    if (!pokemon) return;
    const locations = enabledExpeditionLocations();
    const locationCards = locations.length ? locations.map((location) => `
      <button class="location-card" type="button" data-action="confirm-expedition" data-uid="${escapeHtml(uid)}" data-location-id="${escapeHtml(location.id)}">
        <strong>${escapeHtml(location.displayName)}</strong>
        <span>${escapeHtml(location.region)} · Generation ${location.generation}</span>
        <small>${escapeHtml(location.description)}</small>
      </button>`).join("") : `<p class="no-results">No expedition locations are available for this save’s enabled generations.</p>`;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel summary-modal" role="dialog" aria-modal="true" aria-labelledby="expedition-title">
        <p class="eyebrow">PC expedition</p><h2 id="expedition-title">Send ${escapeHtml(pokemon.nickname || pokemon.displayName)} exploring?</h2>
        <p class="modal-intro">They will leave the PC, then return with XP, berries, Poké Balls, money, and harmless keepsakes.</p>
        <div class="location-grid">${locationCards}</div>
        <div class="button-row"><button class="button" type="button" data-close-modal>Keep them home</button></div>
      </section></div>`;
  }

  function startExpedition(uid, locationId) {
    const index = state.pc.findIndex((entry) => entry.uid === uid);
    const location = expeditionLocation(locationId);
    if (index < 0 || !location) return;
    const [pokemon] = state.pc.splice(index, 1);
    const durationMs = expeditionDuration();
    state.team = state.team.filter((id) => id !== uid);
    if (state.partnerUid === uid) state.partnerUid = "";
    state.expeditions.push({
      id: makeId(),
      pokemon,
      locationId: location.id,
      locationName: location.displayName,
      region: location.region,
      generation: location.generation,
      startedAt: Date.now(),
      returnAt: Date.now() + durationMs,
      durationMs
    });
    state.statistics.expeditionsStarted = (state.statistics.expeditionsStarted || 0) + 1;
    saveState();
    closeModal();
    if (activeTab === "pc" || activeTab === "home") render();
    toast(`${pokemon.nickname || pokemon.displayName} slipped out toward ${location.displayName}. They will check back in when the route is done.`);
  }

  function welcomeExpedition(expeditionId) {
    const entry = state.expeditions.find((candidate) => candidate.id === expeditionId);
    if (!entry) return;
    if (!expeditionReady(entry)) {
      toast(`${entry.pokemon.nickname || entry.pokemon.displayName} is still somewhere along the route.`);
      return;
    }
    settleExpedition(entry, true).then(() => {
      if (activeTab === "pc" || activeTab === "home" || activeTab === "bag") render();
    }).catch(() => toast("That expedition return could not be recorded yet."));
  }

  function buyShopItem(itemId) {
    const item = shopItems?.find((entry) => entry.id === itemId) || shopItemDefinition(itemId);
    const freePurchase = isDevToolEnabled("freeShop");
    if (!item || (item.unique && (item.category === "ball" ? state.inventory[item.id] > 0 : itemCount(item.id) > 0))) {
      toast("That one is already tucked safely away.");
      return;
    }
    if (!freePurchase && state.money < item.cost) {
      toast("You are a few Pokédollars short for that.");
      return;
    }
    if (!freePurchase) state.money -= item.cost;
    let bonusMessage = "";
    if (item.id === "incubator-upgrade") {
      if (!upgradeIncubatorCapacity()) {
        toast("Every incubator cushion is already humming.");
        return;
      }
      ensureAllIncubators();
      saveState();
      shopItems = null;
      renderMart();
      toast(`A new incubator cushion is humming. You now have ${incubatorCapacity()} egg slots.`);
      return;
    }
    if (item.category === "ball") {
      state.inventory[item.id] = (state.inventory[item.id] || 0) + 1;
      if (item.id === "poke-ball") {
        state.statistics.pokeBallsBought = (state.statistics.pokeBallsBought || 0) + 1;
        if (state.statistics.pokeBallsBought % 10 === 0) {
          state.inventory["premier-ball"] = (state.inventory["premier-ball"] || 0) + 1;
          bonusMessage = " There was a surprise Premier Ball tucked in too.";
        }
      }
    } else {
      addItemToBag(item.id, 1);
    }
    saveState();
    shopItems = null;
    renderMart();
    toast(`${item.displayName} tucked into the field bag.${bonusMessage}`);
  }

  function useBagItem(itemId) {
    const item = shopItemDefinition(itemId);
    if (!item || itemCount(itemId) <= 0) return;
    if (item.category === "berry") {
      showBerryTargetChooser(itemId);
      return;
    }
    if (itemId === "rare-candy") {
      showRareCandyTargetChooser(itemId);
      return;
    }
    if (itemId === "shiny-charm") {
      setItemCount(itemId, itemCount(itemId) - 1);
      state.activeItemEffects.shinyCharmEggsRemaining = activeShinyCharmCharges() + 10;
      state.statistics.shinyCharmUses = (state.statistics.shinyCharmUses || 0) + 1;
      saveState();
      renderBag();
      toast("The Shiny Charm gives a bright little jingle.");
    }
  }

  function togglePlate(itemId) {
    const item = shopItemDefinition(itemId);
    if (!item || item.category !== "plate" || itemCount(itemId) <= 0) return;
    state.equippedPlate = state.equippedPlate === itemId ? "" : itemId;
    saveState();
    renderBag();
    toast(state.equippedPlate === itemId ? `${item.displayName} set beside the incubator.` : `${item.displayName} tucked back into the plate pocket.`);
  }

  async function createNpcPokemon(reference, level) {
    const id = resourceId(reference.url);
    const [pokemon, species] = await Promise.all([apiFetch(`pokemon/${id}`), apiFetch(reference.url)]);
    const sprites = getGenerationFiveSprites(pokemon);
    return {
      speciesId: species.id,
      displayName: englishName(species, species.name),
      sprite: sprites.normal,
      baseStats: mapBaseStats(pokemon),
      ivs: rollIvs(false),
      level
    };
  }

  async function createNpcTeam(level) {
    const references = await getEnabledSpeciesReferences();
    const chosen = [];
    const used = new Set();
    while (chosen.length < 6) {
      const reference = randomChoice(references);
      const id = resourceId(reference.url);
      if (!used.has(id)) {
        used.add(id);
        chosen.push(reference);
      }
    }
    const team = (await Promise.all(chosen.map((reference) => createNpcPokemon(reference, level)))).filter(Boolean);
    if (team.length !== 6) return createNpcTeam(level);
    return team;
  }

  function showCompetitionLoading(stat) {
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel catch-result" role="dialog" aria-modal="true" aria-labelledby="judging-title">
        <p class="eyebrow">${statLabel(stat)} competition</p><h2 id="judging-title">The judges are whispering…</h2><p class="modal-intro">A visiting six-Pokémon team is making its way to the stage.</p><span class="loading-line"></span>
      </section></div>`;
  }

  async function runCompetition(stat) {
    if (!CONTEST_STATS.includes(stat) || isCompetitionRunning) return;
    const team = state.team.map((id) => state.pc.find((pokemon) => pokemon.uid === id)).filter(Boolean);
    if (team.length !== 6) return;
    isCompetitionRunning = true;
    renderCompetitions();
    showCompetitionLoading(stat);
    try {
      const averageLevel = Math.max(1, Math.round(team.reduce((total, pokemon) => total + pokemon.level, 0) / team.length));
      const npcTeam = await createNpcTeam(averageLevel);
      const playerValues = team.map((pokemon) => statValue(pokemon, stat));
      const npcValues = npcTeam.map((pokemon) => statValue(pokemon, stat, averageLevel));
      const playerTotal = playerValues.reduce((total, value) => total + value, 0);
      const npcTotal = npcValues.reduce((total, value) => total + value, 0);
      const playerWon = isDevToolEnabled("alwaysWinContests") ? true : playerTotal === npcTotal ? randomInt(0, 2) === 0 : playerTotal > npcTotal;
      const awards = [];
      const evolutionMessages = [];
      if (playerWon) {
        const inverseWeights = playerValues.map((value) => 1 / Math.max(1, value));
        const weightTotal = inverseWeights.reduce((total, value) => total + value, 0);
        const amounts = inverseWeights.map((weight) => Math.max(1, Math.floor(600 * (weight / weightTotal))));
        for (let index = 0; index < team.length; index += 1) {
          const result = await addExperience(team[index], amounts[index]);
          awards.push({ pokemon: team[index], amount: amounts[index], leveled: result.newLevel > result.oldLevel });
          evolutionMessages.push(...result.evolutions);
        }
        state.statistics.competitionsWon += 1;
        state.statistics.competitionWinsByStat = state.statistics.competitionWinsByStat || {};
        state.statistics.competitionWinsByStat[stat] = (state.statistics.competitionWinsByStat[stat] || 0) + 1;
      }
      const title = playerWon ? `${statLabel(stat)} showcase won` : `${statLabel(stat)} showcase lost`;
      const summary = `Your team scored ${playerTotal}; the visitors scored ${npcTotal}.`;
      state.competitionLog.unshift({ title, summary, stat, playerTotal, npcTotal, won: playerWon, at: new Date().toISOString() });
      state.competitionLog = state.competitionLog.slice(0, 20);
      saveState();
      const teamVisuals = (members, values) => members.map((pokemon, index) => `<figure><img src="${escapeHtml(pokemon.sprite)}" alt="" /><figcaption>${escapeHtml(pokemon.nickname || pokemon.displayName)}<b>${values[index]}</b></figcaption></figure>`).join("");
      modalRoot.innerHTML = `
        <div class="modal-backdrop"><section class="modal paper-panel competition-result" role="dialog" aria-modal="true" aria-labelledby="result-title">
          <p class="eyebrow">${statLabel(stat)} showcase · final notes</p><h2 id="result-title">${playerWon ? "Your team shines" : "The visitors take it"}</h2>
          <div class="scoreboard"><div><span>Your team</span><strong>${playerTotal}</strong></div><b>${playerWon ? "WIN" : "LOSS"}</b><div><span>visitor team</span><strong>${npcTotal}</strong></div></div>
          <div class="result-team"><section><h3>Your six</h3>${teamVisuals(team, playerValues)}</section><section><h3>Visitor six</h3>${teamVisuals(npcTeam, npcValues)}</section></div>
          ${playerWon ? `<div class="xp-awards"><p class="eyebrow">Team treat bowl</p>${awards.map((award) => `<span><img src="${escapeHtml(award.pokemon.sprite)}" alt="" /><b>${escapeHtml(award.pokemon.nickname || award.pokemon.displayName)}</b> +${award.amount} XP${award.leveled ? ` · Lv. ${award.pokemon.level}` : ""}</span>`).join("")}${evolutionMessages.map((message) => `<strong class="evolution-callout">${escapeHtml(message)}!</strong>`).join("")}</div>` : '<p class="modal-intro">No treats this time. Swap your six around and try again.</p>'}
          <button class="button button-primary" type="button" data-close-modal>Close showcase</button>
        </section></div>`;
    } catch {
      modalRoot.innerHTML = `
        <div class="modal-backdrop"><section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="contest-error"><p class="eyebrow">Signal flutter</p><h2 id="contest-error">The showcase was postponed</h2><p class="modal-intro">The visiting team got lost on the way, so nothing was recorded.</p><button class="button button-primary" type="button" data-close-modal>Back</button></section></div>`;
    } finally {
      isCompetitionRunning = false;
      if (activeTab === "competitions") renderCompetitions();
    }
  }

  async function addDevPokemonToPc(count) {
    for (let index = 0; index < count; index += 1) {
      const pokemon = await chooseWeightedEncounter();
      pokemon.caughtAt = new Date().toISOString();
      pokemon.ot = state.player.name;
      pokemon.caughtWith = "master-ball";
      state.pc.push(pokemon);
      recordCaughtPokemon(pokemon, pokemon.caughtWith);
      recordPokedexEncounter(pokemon);
      shopItems = null;
    }
  }

  function devDateKeyOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return localDateKey(date);
  }

  async function addDevSpeciesToPc(speciesIds, options = {}) {
    const ids = Array.isArray(speciesIds) ? speciesIds : [speciesIds];
    const added = [];
    for (const speciesId of ids) {
      const pokemon = await chooseSpeciesEncounter(speciesId, "dev-pc");
      pokemon.caughtAt = new Date().toISOString();
      pokemon.ot = state.player.name;
      pokemon.caughtWith = options.ball || "master-ball";
      if (options.shiny) makePokemonShiny(pokemon);
      if (options.favorite) pokemon.favorite = true;
      state.pc.push(pokemon);
      recordCaughtPokemon(pokemon, pokemon.caughtWith);
      recordPokedexEncounter(pokemon);
      added.push(pokemon);
    }
    if (options.partner && added[0]) state.partnerUid = added[0].uid;
    state.statistics.pokemonCaught += added.length;
    shopItems = null;
    return added;
  }

  async function addDevPokemonForTypes(types) {
    const speciesIds = [];
    for (const type of types) {
      const choices = DEV_TYPE_SAMPLE_SPECIES_IDS[type] || [];
      if (choices.length) speciesIds.push(randomChoice(choices));
    }
    return addDevSpeciesToPc(speciesIds);
  }

  function forceInventoryBall(ballId, amount) {
    if (ballId === "master-ball") return;
    state.inventory[ballId] = (state.inventory[ballId] || 0) + amount;
  }

  function addDevShopItems() {
    const registry = shopItemRegistry();
    const items = registry && typeof registry.allItems === "function" ? registry.allItems() : [];
    for (const item of items) {
      if (item.id === "master-ball") continue;
      if (item.category === "ball") {
        state.inventory[item.id] = Math.max(state.inventory[item.id] || 0, 99);
      } else if (item.unique) {
        setItemCount(item.id, 1);
      } else {
        addItemToBag(item.id, 5);
      }
    }
    shopItems = null;
  }

  function addDevAllPlates() {
    const registry = shopItemRegistry();
    const plates = registry && typeof registry.plates === "function" ? registry.plates() : [];
    for (const plate of plates) setItemCount(plate.id, 1);
    shopItems = null;
    return plates;
  }

  async function forceDevEggSpecies(speciesId, label) {
    const id = normalisedSpeciesId(speciesId);
    if (!id) {
      toast("No species is available for that forced egg.");
      return;
    }
    if (state.encounter) {
      state.forcedNextEggSpeciesId = id;
      saveState();
      toast(`The next egg has been marked for ${label}.`);
      return;
    }
    state.egg = createEgg(Date.now(), false, id);
    saveState();
    await prepareNormalEgg();
    render();
    toast(`${label} was tucked into the incubator.`);
  }

  function revealDevEgg() {
    if (!state.egg) {
      toast("There is no egg in the incubator.");
      return;
    }
    const pending = state.egg.pendingEncounter;
    if (pending) {
      toast(`Hidden egg: ${pending.displayName} #${pending.speciesId}.`);
      return;
    }
    if (state.egg.forcedSpeciesId || state.forcedNextEggSpeciesId) {
      toast(`The egg is marked for species #${state.egg.forcedSpeciesId || state.forcedNextEggSpeciesId}.`);
      return;
    }
    toast("The egg has not chosen clearly yet.");
  }

  function rollNewDevFieldNote() {
    normaliseFieldNoteState();
    const previousId = state.fieldNotes.currentId;
    chooseDailyFieldNote(localDateKey(), previousId);
    saveState();
  }

  async function setPokemonLevel(pokemon, level) {
    const levels = await getGrowthLevels(pokemon.growthRateUrl);
    const target = levels.find((entry) => entry.level === level) || levels[levels.length - 1];
    pokemon.experience = Math.max(pokemon.experience, target?.experience || pokemon.experience);
    await refreshLevelFromExperience(pokemon);
    const evolutions = await checkForEvolution(pokemon);
    return evolutions;
  }

  function maxPokemonIvs(pokemon) {
    pokemon.ivs = Object.fromEntries(CONTEST_STATS.map((stat) => [stat, 31]));
  }

  function makePokemonShiny(pokemon) {
    pokemon.shiny = true;
    pokemon.sprite = pokemon.shinySprite || pokemon.sprite;
  }

  async function spawnDevEncounter() {
    renderHatchingHome();
    const encounter = await chooseWeightedEncounter();
    state.encounter = encounter;
    state.egg = null;
    state.statistics.eggsHatched += 1;
    recordPokedexEncounter(encounter);
    saveState();
    render();
    toast(`${encounter.displayName} stepped out of the secret drawer.`);
  }

  async function fillEnabledPokedex() {
    const references = await getEnabledSpeciesReferences();
    const now = new Date().toISOString();
    for (const reference of references) {
      const speciesId = resourceId(reference.url);
      if (!speciesId) continue;
      const key = String(speciesId);
      if (!state.pokedex[key]) {
        state.pokedex[key] = {
          speciesId,
          name: reference.name,
          displayName: titleCase(reference.name),
          sprite: `${GEN_FIVE_SPRITE_ROOT}/${speciesId}.png`,
          shinySprite: `${GEN_FIVE_SPRITE_ROOT}/shiny/${speciesId}.png`,
          cryUrl: cryUrlFromSpeciesId(speciesId),
          baseStatTotal: 0,
          hatchDuration: 0,
          seen: 1,
          shinySeen: 0,
          firstEncounteredAt: now
        };
      }
    }
  }

  async function runDevAction(action) {
    if (!devToolsAllowed()) return;
    try {
      if (action === "dev-hatch-now") {
        if (state.encounter) {
          toast("Settle the current visitor before cracking open another egg.");
          return;
        }
        ensureEgg();
        if (eggNeedsPreparedEncounter()) await prepareNormalEgg();
        if (!state.egg) return;
        state.egg.hatchAt = Date.now();
        saveState();
        await hatchEgg();
      } else if (action === "dev-egg-10s") {
        if (state.encounter) {
          toast("Settle the current visitor before adjusting the incubator.");
          return;
        }
        ensureEgg();
        if (eggNeedsPreparedEncounter()) await prepareNormalEgg();
        if (!state.egg) return;
        state.egg.hatchAt = Date.now() + 10000;
        state.egg.hatchDuration = Math.min(Number(state.egg.hatchDuration || 10000), 10000);
        saveState();
        render();
        toast("The egg should be ready very soon.");
      } else if (action === "dev-new-egg") {
        const laidAt = Date.now();
        state.encounter = null;
        state.egg = createEgg(laidAt, false);
        saveState();
        await prepareNormalEgg();
        render();
        toast("A fresh secret-drawer egg was placed in the incubator.");
      } else if (action === "dev-force-manaphy-egg") {
        await forceDevEggSpecies(MANAPHY_SPECIES_ID, "Manaphy");
      } else if (action === "dev-force-partner-egg") {
        const partner = getPartnerPokemon();
        if (!partner) {
          toast("Choose a partner first, then this can copy their species into the next egg.");
          return;
        }
        await forceDevEggSpecies(partner.speciesId, partner.displayName);
      } else if (action === "dev-force-plate-type-egg") {
        const type = equippedPlateType();
        const choices = DEV_TYPE_SAMPLE_SPECIES_IDS[type] || [];
        if (!type || !choices.length) {
          toast("Equip a plate first, then this can force a matching test egg.");
          return;
        }
        await forceDevEggSpecies(randomChoice(choices), `${titleCase(type)} test egg`);
      } else if (action === "dev-reveal-egg") {
        revealDevEgg();
      } else if (action === "dev-clear-forced-egg") {
        state.forcedNextEggSpeciesId = 0;
        if (state.egg) delete state.egg.forcedSpeciesId;
        saveState();
        render();
        toast("Forced egg markers cleared.");
      } else if (action === "dev-reroll-encounter") {
        await spawnDevEncounter();
      } else if (action === "dev-catch-current") {
        if (!state.encounter) {
          toast("There is no hatchling waiting to catch.");
          return;
        }
        const pokemon = state.encounter;
        pokemon.caughtAt = new Date().toISOString();
        pokemon.ot = state.player.name;
        pokemon.caughtWith = "master-ball";
        state.pc.push(pokemon);
        recordCaughtPokemon(pokemon, pokemon.caughtWith);
        state.encounter = null;
        state.statistics.pokemonCaught += 1;
        shopItems = null;
        ensureEgg();
        saveState();
        render();
        toast(`${pokemon.displayName} moved into the PC room.`);
      } else if (["dev-make-shiny", "dev-max-current-ivs", "dev-current-xp-1k", "dev-current-xp-10k", "dev-current-level-100"].includes(action)) {
        const pokemon = state.encounter;
        if (!pokemon) {
          toast("There is no hatchling waiting for secret-drawer tweaks.");
          return;
        }
        if (action === "dev-make-shiny") makePokemonShiny(pokemon);
        if (action === "dev-max-current-ivs") maxPokemonIvs(pokemon);
        if (action === "dev-current-xp-1k") await addExperience(pokemon, 1000);
        if (action === "dev-current-xp-10k") await addExperience(pokemon, 10000);
        if (action === "dev-current-level-100") await setPokemonLevel(pokemon, 100);
        saveState();
        render();
        toast("Current hatchling refreshed.");
      } else if (action === "dev-money-10k" || action === "dev-money-100k" || action === "dev-money-1m") {
        const amount = { "dev-money-10k": 10000, "dev-money-100k": 100000, "dev-money-1m": 1000000 }[action];
        state.money += amount;
        saveState();
        render();
        toast(`Added ₽${amount.toLocaleString()}.`);
      } else if (action === "dev-max-incubators") {
        maxIncubatorCapacity();
        ensureAllIncubators();
        shopItems = null;
        saveState();
        render();
        toast("All five incubator cushions are available.");
      } else if (action === "dev-ball-bundle") {
        ["poke-ball", "great-ball", "ultra-ball"].forEach((ball) => forceInventoryBall(ball, 99));
        saveState();
        render();
        toast("A tower of shop balls appeared in the bag.");
      } else if (action === "dev-premier-balls") {
        forceInventoryBall("premier-ball", 30);
        saveState();
        render();
        toast("A neat stack of Premier Balls appeared in the bag.");
      } else if (action === "dev-add-shop-items") {
        addDevShopItems();
        saveState();
        render();
        toast("Every testable shop item was tucked into the bag.");
      } else if (action === "dev-add-shiny-charms") {
        addItemToBag("shiny-charm", 5);
        shopItems = null;
        saveState();
        render();
        toast("Five Shiny Charms appeared in the bag.");
      } else if (action === "dev-activate-shiny-charm") {
        state.activeItemEffects.shinyCharmEggsRemaining = activeShinyCharmCharges() + 10;
        saveState();
        render();
        toast("The shiny charm effect is active for ten more eggs.");
      } else if (action === "dev-add-magmarizer") {
        setItemCount("magmarizer", 1);
        shopItems = null;
        saveState();
        render();
        toast("A Magmarizer was added to the bag.");
      } else if (action === "dev-add-all-plates") {
        const plates = addDevAllPlates();
        saveState();
        render();
        toast(`${plates.length} plates were added to the plate pocket.`);
      } else if (action === "dev-equip-random-plate") {
        const plates = addDevAllPlates();
        if (!plates.length) return;
        const plate = randomChoice(plates);
        state.equippedPlate = plate.id;
        saveState();
        render();
        toast(`${plate.displayName} was set beside the incubator.`);
      } else if (action === "dev-clear-plate") {
        state.equippedPlate = "";
        saveState();
        render();
        toast("The incubator plate shelf is clear.");
      } else if (action === "dev-unlock-shiny-shop") {
        await addDevSpeciesToPc(1, { shiny: true, favorite: true });
        saveState();
        render();
        toast("A shiny Bulbasaur joined the PC, unlocking Shiny Charm shop tests.");
      } else if (action === "dev-unlock-magmarizer-shop") {
        await addDevPokemonForTypes(["fire", "fire", "fire", "fire", "fire"]);
        saveState();
        render();
        toast("Five Fire-type Pokémon joined the PC, unlocking Magmarizer shop tests.");
      } else if (action === "dev-unlock-all-plates-shop") {
        await addDevPokemonForTypes(Object.keys(DEV_TYPE_SAMPLE_SPECIES_IDS));
        saveState();
        render();
        toast("A full type sampler joined the PC, unlocking every plate shelf.");
      } else if (action === "dev-streak-10-ready" || action === "dev-streak-30-ready") {
        state.streak = action === "dev-streak-10-ready" ? 9 : 29;
        state.lastLoginDate = devDateKeyOffset(-1);
        saveState();
        render();
        toast(action === "dev-streak-10-ready" ? "The next daily parcel will count as day 10." : "The next daily parcel will count as day 30.");
      } else if (action === "dev-run-daily-reward") {
        state.lastLoginDate = devDateKeyOffset(-1);
        applyDailyReward();
        render();
      } else if (action === "dev-random-pc") {
        await addDevPokemonToPc(1);
        saveState();
        render();
        toast("A surprise Pokémon wandered into the PC room.");
      } else if (action === "dev-six-random-pc") {
        await addDevPokemonToPc(6);
        saveState();
        render();
        toast("Six surprise Pokémon wandered into the PC room.");
      } else if (action === "dev-shiny-pc") {
        await addDevSpeciesToPc(randomChoice([25, 133, 906, 490, 147]), { shiny: true, favorite: true });
        saveState();
        render();
        toast("A shiny test Pokémon joined the PC room.");
      } else if (action === "dev-type-sampler-pc") {
        await addDevPokemonForTypes(Object.keys(DEV_TYPE_SAMPLE_SPECIES_IDS));
        saveState();
        render();
        toast("A type sampler joined the PC room.");
      } else if (action === "dev-fill-pokedex") {
        await fillEnabledPokedex();
        saveState();
        render();
        toast("The invited Pokédex pages were filled.");
      } else if (action === "dev-favorite-all-pc") {
        state.pc.forEach((pokemon) => { pokemon.favorite = true; });
        saveState();
        render();
        toast("Every PC Pokémon is now a favourite.");
      } else if (action === "dev-clear-favorites") {
        state.pc.forEach((pokemon) => { pokemon.favorite = false; });
        saveState();
        render();
        toast("Favourite marks cleared from the PC.");
      } else if (action === "dev-first-partner") {
        if (!state.pc.length) {
          await addDevPokemonToPc(1);
        }
        state.partnerUid = state.pc[0]?.uid || "";
        saveState();
        render();
        toast(state.partnerUid ? `${state.pc[0].displayName} is keeping watch as partner.` : "No PC Pokémon could be set as partner.");
      } else if (action === "dev-clear-partner") {
        state.partnerUid = "";
        saveState();
        render();
        toast("Partner slot cleared.");
      } else if (action === "dev-team-level-100") {
        const team = state.team.map((id) => state.pc.find((pokemon) => pokemon.uid === id)).filter(Boolean);
        if (!team.length) {
          toast("Choose a showcase team first.");
          return;
        }
        const evolutionMessages = [];
        for (const pokemon of team) evolutionMessages.push(...await setPokemonLevel(pokemon, 100));
        saveState();
        render();
        toast(evolutionMessages.length ? `The team had a growth spurt. ${evolutionMessages.join(" ")}` : "The team had a huge growth spurt.");
      } else if (action === "dev-clear-contests") {
        state.competitionLog = [];
        state.statistics.competitionsWon = 0;
        saveState();
        render();
        toast("Showcase notes cleared.");
      } else if (action === "dev-next-field-note") {
        rollNewDevFieldNote();
        render();
        toast("A new field note was clipped to today’s page.");
      } else if (action === "dev-reset-field-notes") {
        state.fieldNotes = { currentDate: "", currentId: "", seen: false, usedIds: [] };
        saveState();
        render();
        toast("Field note history reset.");
      } else if (action === "dev-complete-field-notes") {
        const ids = fieldNoteLibrary().map((note) => note.id);
        state.fieldNotes.usedIds = ids;
        state.fieldNotes.seen = true;
        saveState();
        render();
        toast("Field note cycle marked as used for reset testing.");
      } else if (action === "dev-open-bag" || action === "dev-open-pc" || action === "dev-open-mart") {
        const target = { "dev-open-bag": "bag", "dev-open-pc": "pc", "dev-open-mart": "mart" }[action];
        switchTab(target);
      }
    } catch {
      toast("The secret drawer jammed because the Pokémon records were unavailable.");
      if (activeTab === "home") render();
    }
  }

  function saveSettings(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    state.settings.theme = normaliseTheme(String(form.get("theme") || "field"));
    if (devToolsAllowed()) {
      const selectedDevTools = new Set(form.getAll("dev_tool"));
      state.settings.devTools = Object.fromEntries(Object.keys(DEV_TOOL_DEFAULTS).map((key) => [key, selectedDevTools.has(key)]));
      if (state.settings.devTools.instantHatch) incubatorSlots().forEach((slot) => { if (slot.egg) slot.egg.hatchAt = Date.now(); });
    } else {
      state.settings.devTools = { ...DEV_TOOL_DEFAULTS };
    }
    saveState();
    renderSettings();
    incubatorSlots().forEach((slot, index) => {
      if (eggNeedsPreparedEncounterForSlot(slot)) prepareEggForSlot(slot, index);
      if (slot.egg && !eggNeedsPreparedEncounterForSlot(slot) && Date.now() >= slot.egg.hatchAt) hatchEggForSlot(index);
    });
    toast("Hatchery settings saved.");
  }

  function showResetConfirmation() {
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="reset-title"><p class="eyebrow">Last chance</p><h2 id="reset-title">Reset the whole hatchery?</h2><p class="modal-intro">This clears every local egg, Pokémon, coin, streak, and journal page on this device. It cannot be undone.</p><div class="button-row"><button class="button button-accent" type="button" data-action="confirm-reset">Reset everything</button><button class="button" type="button" data-close-modal>Keep hatchery</button></div></section></div>`;
  }

  function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function showHelp() {
    modalRoot.innerHTML = `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <p class="eyebrow">Hatchery guide</p>
          <h2 id="help-title">How the hatchery works</h2>
          <p class="modal-intro">Your first clutch is eager to meet you. The early eggs warm more quickly, then the nest settles into its usual rhythm; the Pokédex remembers a species’ usual hatch time once you have met it. Some Pokémon are much rarer than others, shinies are a special surprise, and caught Pokémon settle into the PC room. Hatchlings chirp when they arrive and may call out now and then while they wait with you.</p>
          <dl class="summary-list"><dt>Daily treats</dt><dd>A small Pokédollar gift that grows with your streak</dd><dt>Quiet training</dt><dd>Hatchlings grow little by little while they wait</dd><dt>Bag</dt><dd>Poké Balls, charms, and plates live in their own pockets</dd><dt>Showcases</dt><dd>Choose six Pokémon and meet visiting teams</dd><dt>Achievements</dt><dd>Track long-term milestones from your enabled generations</dd><dt>Save backups</dt><dd>Export and import your local hatchery from Settings</dd></dl>
          <div class="button-row"><button class="button button-primary" type="button" data-close-modal>Back to the hatchery</button></div>
        </section>
      </div>`;
  }

  function toast(message) {
    const element = document.createElement("div");
    element.className = "toast";
    element.textContent = message;
    toastRoot.appendChild(element);
    window.setTimeout(() => element.classList.add("is-leaving"), 4400);
    window.setTimeout(() => element.remove(), 4700);
  }

  document.addEventListener("click", (event) => {
    const tabButton = event.target.closest("[data-tab]");
    if (tabButton) switchTab(tabButton.dataset.tab);
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      const action = actionButton.dataset.action;
      if (action === "choose-ball") showBallChooser();
      else if (action === "throw-ball") catchEncounter(actionButton.dataset.ball);
      else if (action === "catch-target") handleCatchTargetTap(actionButton.dataset.targetId);
      else if (action === "release-encounter") showReleaseConfirmation();
      else if (action === "confirm-release") releaseEncounter();
      else if (action === "pokedex-details") showPokedexEntry(actionButton.dataset.speciesId);
      else if (action === "play-pokedex-cry") playPokedexCry(actionButton.dataset.speciesId);
      else if (action === "pc-summary") showPcSummary(actionButton.dataset.uid);
      else if (action === "toggle-favorite") toggleFavorite(actionButton.dataset.uid);
      else if (action === "toggle-partner") togglePartner(actionButton.dataset.uid);
      else if (action === "toggle-team") toggleTeam(actionButton.dataset.uid);
      else if (action === "claim-daily-quest") claimDailyQuest(actionButton.dataset.questId);
      else if (action === "apply-berry") applyBerryToPokemon(actionButton.dataset.itemId, actionButton.dataset.uid);
      else if (action === "apply-rare-candy") applyRareCandyToPokemon(actionButton.dataset.itemId, actionButton.dataset.uid);
      else if (action === "sell-souvenir") sellSouvenir(actionButton.dataset.itemId, false);
      else if (action === "sell-all-souvenir") sellSouvenir(actionButton.dataset.itemId, true);
      else if (action === "summon-mysterious") summonMysteriousEgg(actionButton.dataset.itemId);
      else if (action === "open-expedition") showExpeditionChooser(actionButton.dataset.uid);
      else if (action === "confirm-expedition") startExpedition(actionButton.dataset.uid, actionButton.dataset.locationId);
      else if (action === "welcome-expedition") welcomeExpedition(actionButton.dataset.expeditionId);
      else if (action === "buy-egg") startEggForSlot(actionButton.dataset.slotIndex);
      else if (action === "buy-shop-item") buyShopItem(actionButton.dataset.itemId);
      else if (action === "use-item") useBagItem(actionButton.dataset.itemId);
      else if (action === "toggle-plate") togglePlate(actionButton.dataset.itemId);
      else if (action === "select-incubator-slot") { selectIncubatorSlot(actionButton.dataset.slotIndex); saveState(); render(); }
      else if (action === "retry-mart") { shopItems = null; renderMart(); }
      else if (action === "enter-contest") runCompetition(actionButton.dataset.stat);
      else if (action === "request-reset") showResetConfirmation();
      else if (action === "confirm-reset") resetProgress();
      else if (action === "export-save") exportSaveFile();
      else if (action === "request-import-save") requestSaveImport();
      else if (action === "confirm-import-save") importPendingSave();
      else if (action === "claim-achievement") claimAchievementReward(actionButton.dataset.achievementId);
      else if (action === "claim-all-achievements") claimAllAchievementRewards();
      else if (action.startsWith("dev-")) runDevAction(action);
    }
    if (event.target.closest("#menu-button")) {
      mobileNav.hidden = !mobileNav.hidden;
      menuButton.setAttribute("aria-expanded", String(!mobileNav.hidden));
    }
    if (event.target.closest("#help-button")) showHelp();
    if (event.target.closest("[data-close-modal]")) closeModal();
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "onboarding-form") completeOnboarding(event);
    else if (event.target.id === "settings-form") saveSettings(event);
    else if (event.target.id === "nickname-form") {
      event.preventDefault();
      const pokemon = state.pc.find((entry) => entry.uid === event.target.dataset.uid);
      if (!pokemon) return;
      const form = new FormData(event.target);
      pokemon.nickname = String(form.get("nickname") || "").trim().slice(0, 16);
      saveState();
      showPcSummary(pokemon.uid);
      if (activeTab === "pc") renderPc();
      toast("Nickname tucked into the card.");
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "save-import-input") readImportFile(event.target.files?.[0]);
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "pokedex-search") {
      pokedexFilter = event.target.value;
      renderPokedex();
      const search = document.getElementById("pokedex-search");
      if (search) {
        search.focus();
        search.setSelectionRange(pokedexFilter.length, pokedexFilter.length);
      }
    } else if (event.target.id === "pc-search") {
      pcSearch = event.target.value;
      renderPc();
      const search = document.getElementById("pc-search");
      if (search) {
        search.focus();
        search.setSelectionRange(pcSearch.length, pcSearch.length);
      }
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.name === "theme") document.getElementById("app").dataset.theme = normaliseTheme(event.target.value);
    else if (event.target.id === "pc-filter") {
      pcFilter = event.target.value;
      renderPc();
    } else if (event.target.id === "pc-sort") {
      pcSort = event.target.value;
      renderPc();
    }
  });

  updateHeader();
  if (state.player) {
    applyDailyReward();
    normaliseOpeningStarterEgg();
    backfillPokedexHatchTimes();
    ensureAllIncubators();
    render();
    settleReturnedExpeditions(true);
    incubatorSlots().forEach((slot, index) => {
      if (eggNeedsPreparedEncounterForSlot(slot)) prepareEggForSlot(slot, index);
      if (slot.egg && !eggNeedsPreparedEncounterForSlot(slot) && Date.now() >= slot.egg.hatchAt) hatchEggForSlot(index);
    });
  } else {
    renderHome();
    showOnboarding();
  }
  startClock();
})();
