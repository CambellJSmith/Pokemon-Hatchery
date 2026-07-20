(function () {
  "use strict";

  const STORAGE_KEY = "pocket_hatchery_save_v1";
  const SAVE_EXPORT_MAGIC = "pocket-hatchery-save";
  const SAVE_EXPORT_VERSION = 1;
  const HATCH_SECONDS_PER_BASE_STAT_POINT = 30;
  const HATCH_MILLISECONDS_PER_BASE_STAT_POINT = HATCH_SECONDS_PER_BASE_STAT_POINT * 1000;
  const FALLBACK_HATCH_DURATION = 3 * 60 * 60 * 1000;
  const FIRST_EGG_HATCH_DURATION = 30 * 1000;
  const EARLY_EGG_COUNT = 50;
  const EARLY_EGG_SPEED_SCHEMA_REVISION = 17;
  const PASSIVE_XP_INTERVAL = 60 * 1000;
  const API_ROOT = "https://pokeapi.co/api/v2";
  const GEN_FIVE_SPRITE_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white";
  const DEFAULT_SPRITE_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
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
  const EGG_PRICE = 50;
  const PREPAID_EGG_ITEM_ID = "egg-voucher";
  const REPEL_ITEM_ID = "repel";
  const REPEL_EGG_COVERAGE = 5;
  const EGG_PREDATOR_SCHEMA_REVISION = 19;
  const MAX_BULK_PURCHASE = 999;
  const CATCH_BALL_IDS = new Set(["poke-ball", "premier-ball", "great-ball", "ultra-ball", "master-ball"]);

  const TRAINING_STAT_CAP = 252;
  const TRAINING_TOTAL_CAP = 510;
  const EXPEDITION_MIN_DURATION = 2.5 * 60 * 60 * 1000;
  const EXPEDITION_MAX_DURATION = 12 * 60 * 60 * 1000;
  const EXPEDITION_DURATION_SCHEMA_REVISION = 15;
  const EXPEDITION_REWARD_TIME_MULTIPLIER = 2;
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
  const COMPETITION_ENGINE = window.PocketHatcheryCompetitionEngine;
  if (!COMPETITION_ENGINE) throw new Error("Competition engine failed to load.");
  const EGG_PREDATOR_REGISTRY = window.PocketHatcheryEggPredators;
  if (!EGG_PREDATOR_REGISTRY) throw new Error("Egg predator registry failed to load.");
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
    ["PC & collection", [["dev-random-pc", "Add random PC Pokémon"], ["dev-six-random-pc", "Add six random Pokémon"], ["dev-shiny-pc", "Add shiny Pokémon"], ["dev-type-sampler-pc", "Add type sampler"], ["dev-fill-pokedex", "Fill enabled Pokédex"], ["dev-favorite-all-pc", "Favourite all PC"], ["dev-clear-favorites", "Clear favourites"], ["dev-first-partner", "Set first PC partner"], ["dev-clear-partner", "Clear partner"], ["dev-team-level-100", "Level team to 100"], ["dev-clear-contests", "Reset competition ladder"]]],
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
  const INTERFACE_PERFORMANCE_OPTIONS = [
    { value: "automatic", label: "Automatic", description: "Let the hatchery choose between standard and low-power rendering for this browser." },
    { value: "standard", label: "Standard", description: "Use larger page batches and full visual effects. Reduced-motion accessibility requests remain respected." },
    { value: "low", label: "Low power", description: "Reduce visual effects, render smaller batches, and use the lightweight catch prompt." }
  ];
  const INTERFACE_PERFORMANCE_VALUES = new Set(INTERFACE_PERFORMANCE_OPTIONS.map((option) => option.value));
  const DEFAULT_STATE = {
    version: 13,
    schemaRevision: EGG_PREDATOR_SCHEMA_REVISION,
    player: null,
    money: 0,
    streak: 0,
    lastLoginDate: null,
    lastDailyReward: 0,
    lastDailyBonus: null,
    forcedNextEggSpeciesId: 0,
    fieldNotes: { currentDate: "", currentId: "", seen: false, usedIds: [] },
    dailyQuests: { currentDate: "", quests: [] },
    eggEventNotices: [],
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
    activeItemEffects: { shinyCharmEggsRemaining: 0, repelEggsRemaining: 0 },
    settings: { generations: [1, 2, 3, 4, 5, 6, 7, 8, 9], theme: "field", interfacePerformance: "automatic", devTools: { ...DEV_TOOL_DEFAULTS } },
    statistics: {
      eggsHatched: 0,
      eggsLaid: 0,
      eggsBought: 0,
      eggsLostToSnakes: 0,
      eggConsumptionAttempts: 0,
      eggsProtectedByRepel: 0,
      eggsProtectedByPartner: 0,
      repelsUsed: 0,
      pokemonCaught: 0,
      pokemonReleased: 0,
      competitionsWon: 0,
      competitionWinsByStat: {},
      masterBallsFound: 0,
      pokeBallsBought: 0,
      shinyCharmUses: 0,
      achievementRewardsClaimed: 0,
      dailyQuestRewardsClaimed: 0,
      expeditionsStarted: 0,
      expeditionsCompleted: 0,
      berriesUsed: 0,
      keepsakesFound: 0,
      keepsakesSold: 0,
      mysteriousItemsUnlocked: 0,
      mysteriousSummons: 0
    },
    competition: { rating: 1000, peakRating: 1000, selectedLeague: "local", selectedDifficulty: "standard", cooldowns: {}, rivals: {}, challenges: {}, activeMatch: null, winStreak: 0, totalEntries: 0 },
    competitionLog: []
  };

  let saveRecoveryNeeded = false;
  let resetInProgress = false;
  let stateSchemaInstance = null;
  const state = loadState();
  normaliseIncubators();
  normaliseEggSequenceTracking();
  normaliseTrainingState();
  normaliseExpeditionState();
  state.settings.theme = normaliseTheme(state.settings.theme);
  state.settings.interfacePerformance = normaliseInterfacePerformance(state.settings.interfacePerformance);
  let activeTab = "home";
  let clockTimer = null;
  let isHatching = false;
  let nextHatchRetryAt = 0;
  let isCompetitionRunning = false;
  let isCompetitionScouting = false;
  let isSettlingExpeditions = false;
  let enabledSpeciesTotal = 0;
  let shopItems = null;
  let pokedexFilter = "";
  let pcSearch = "";
  let pcFilter = "all";
  let pcSort = "newest";
  let idleCryTimer = null;
  let idleCryUid = null;
  let currentCryAudio = null;
  let pendingImportSave = null;
  let catchChallenge = null;
  let catchChallengeTimer = null;
  let searchRenderTimer = null;
  let lastMaintenanceAt = 0;
  let pokedexVisibleLimit = 0;
  let pcVisibleLimit = 0;
  let shopVisibleLimit = 0;
  let mysteryGoalVisibleLimit = 0;
  let focusViewAfterRender = true;
  let previousMoney = Number(state.money || 0);
  let previousStreak = Number(state.streak || 0);
  let previousTheme = state.settings?.theme || "field";
  let nextEggPreparationRetryAt = 0;
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
  const navButtons = Array.from(document.querySelectorAll("[data-tab]"));

  function normaliseInterfacePerformance(value) {
    return INTERFACE_PERFORMANCE_VALUES.has(value) ? value : "automatic";
  }

  function detectLowPowerInterface() {
    const browserNavigator = typeof navigator === "object" && navigator ? navigator : (window.navigator || {});
    const memory = Number(browserNavigator.deviceMemory || 0);
    const cores = Number(browserNavigator.hardwareConcurrency || 0);
    const saveData = browserNavigator.connection && browserNavigator.connection.saveData === true;
    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supportsContainment = window.CSS && typeof window.CSS.supports === "function" && window.CSS.supports("content-visibility", "auto");
    return saveData || reducedMotion || !supportsContainment || (memory > 0 && memory <= 4) || (cores > 0 && cores <= 4);
  }

  const AUTOMATIC_LOW_POWER_INTERFACE = detectLowPowerInterface();
  let LOW_POWER_INTERFACE = false;
  let ARCHIVE_PAGE_SIZE = 96;
  let MAINTENANCE_INTERVAL = 10000;

  function applyInterfacePerformance(resetArchiveLimits = false) {
    const preference = normaliseInterfacePerformance(state.settings.interfacePerformance);
    state.settings.interfacePerformance = preference;
    LOW_POWER_INTERFACE = preference === "low" || (preference === "automatic" && AUTOMATIC_LOW_POWER_INTERFACE);
    ARCHIVE_PAGE_SIZE = LOW_POWER_INTERFACE ? 48 : 96;
    MAINTENANCE_INTERVAL = LOW_POWER_INTERFACE ? 30000 : 10000;
    appShell.dataset.performance = LOW_POWER_INTERFACE ? "low" : "standard";
    if (document.documentElement?.dataset) document.documentElement.dataset.performance = appShell.dataset.performance;
    if (resetArchiveLimits) {
      pokedexVisibleLimit = ARCHIVE_PAGE_SIZE;
      pcVisibleLimit = ARCHIVE_PAGE_SIZE;
      shopVisibleLimit = ARCHIVE_PAGE_SIZE;
      mysteryGoalVisibleLimit = ARCHIVE_PAGE_SIZE;
    }
  }

  applyInterfacePerformance(true);
  let storageWarningShown = false;
  storageLayer().configure({
    onWarning(message) {
      if (storageWarningShown) return;
      storageWarningShown = true;
      window.setTimeout(() => toast(message), 0);
    }
  });
  const apiClient = window.PocketHatcheryApi
    ? window.PocketHatcheryApi.create({ root: API_ROOT, timeoutMs: 12000, onStatus: setApiStatus })
    : null;
  const modalManager = window.PocketHatcheryModal
    ? window.PocketHatcheryModal.create(modalRoot, { requestClose: closeModal })
    : null;
  const catchEngine = window.PocketHatcheryCatchEngine
    ? window.PocketHatcheryCatchEngine.create()
    : null;

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function storageLayer() {
    return window.PocketHatcheryStorage || {
      read: (key) => localStorage.getItem(key),
      write: (key, value) => { localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); return true; },
      remove: async (key) => { localStorage.removeItem(key); return true; },
      clearAll: async () => {
        const keys = [];
        for (let index = 0; index < localStorage.length; index += 1) {
          const key = localStorage.key(index);
          if (typeof key === "string" && key.startsWith("pocket_hatchery_")) keys.push(key);
        }
        keys.forEach((key) => localStorage.removeItem(key));
        if (window.sessionStorage) {
          const sessionKeys = [];
          for (let index = 0; index < window.sessionStorage.length; index += 1) {
            const key = window.sessionStorage.key(index);
            if (typeof key === "string" && key.startsWith("pocket_hatchery_")) sessionKeys.push(key);
          }
          sessionKeys.forEach((key) => window.sessionStorage.removeItem(key));
        }
        return true;
      },
      configure: () => {}
    };
  }

  function stateSchema() {
    if (!stateSchemaInstance) {
      if (!window.PocketHatcheryStateSchema) throw new Error("The hatchery save schema did not load.");
      stateSchemaInstance = window.PocketHatcheryStateSchema.create({
        defaultState: DEFAULT_STATE,
        contestStats: CONTEST_STATS,
        devToolDefaults: DEV_TOOL_DEFAULTS,
        catchBallIds: [...CATCH_BALL_IDS],
        defaultSpriteRoot: DEFAULT_SPRITE_ROOT,
        apiRoot: API_ROOT,
        fallbackHatchDuration: FALLBACK_HATCH_DURATION,
        makeId,
        cryUrlFromSpeciesId,
        normaliseTheme,
        clampIncubatorCapacity,
        competitionLeagueIds: COMPETITION_ENGINE.LEAGUES.map((league) => league.id),
        competitionDifficultyIds: COMPETITION_ENGINE.DIFFICULTIES.map((difficulty) => difficulty.id),
        competitionArchetypeIds: COMPETITION_ENGINE.ARCHETYPES.map((archetype) => archetype.id)
      });
    }
    return stateSchemaInstance;
  }

  function isPlainObject(value) {
    return stateSchema().isPlainObject(value);
  }

  function cleanUrl(value, fallback = "") {
    return stateSchema().cleanUrl(value, fallback);
  }

  function normaliseSaveState(stored, options = {}) {
    return stateSchema().normaliseSaveState(stored, options);
  }

  function migrateExpeditionDurations(stored, storedRevision) {
    if (storedRevision >= EXPEDITION_DURATION_SCHEMA_REVISION || !Array.isArray(stored.expeditions)) return stored;
    stored.expeditions = stored.expeditions.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const startedAt = Math.max(0, Number(entry.startedAt || Date.now()));
      const recordedDuration = Number(entry.durationMs || (Number(entry.returnAt || 0) - startedAt));
      const sourceDuration = Number.isFinite(recordedDuration) && recordedDuration > 0 ? recordedDuration : EXPEDITION_MIN_DURATION * 2;
      const durationMs = Math.max(EXPEDITION_MIN_DURATION, Math.min(EXPEDITION_MAX_DURATION, Math.round(sourceDuration / 2)));
      return { ...entry, startedAt, durationMs, returnAt: startedAt + durationMs };
    });
    return stored;
  }

  function migrateEarlyEggDurations(stored, storedRevision) {
    if (storedRevision >= EARLY_EGG_SPEED_SCHEMA_REVISION) return stored;
    const globalMultiplier = Number(stored?.items?.magmarizer || 0) > 0 ? 0.5 : 1;
    const updateEgg = (egg) => {
      if (!egg || typeof egg !== "object") return egg;
      const eggNumber = Math.floor(Number(egg.eggNumber || 0));
      if (eggNumber < 1 || eggNumber > EARLY_EGG_COUNT) return egg;
      const baseStatTotal = Number(egg.baseStatTotal || egg.pendingEncounter?.baseStatTotal || 0);
      if (!Number.isFinite(baseStatTotal) || baseStatTotal <= 0) return egg;
      const laidAt = Math.max(0, Number(egg.laidAt || Date.now()));
      const hatchDuration = earlyEggHatchDuration(hatchDurationForBaseStatTotal(baseStatTotal), eggNumber, globalMultiplier);
      return { ...egg, laidAt, hatchDuration, hatchAt: laidAt + hatchDuration };
    };
    if (Array.isArray(stored?.incubators?.slots)) {
      stored.incubators.slots = stored.incubators.slots.map((slot) => slot && typeof slot === "object" ? { ...slot, egg: updateEgg(slot.egg) } : slot);
    }
    stored.egg = updateEgg(stored.egg);
    return stored;
  }

  function loadState() {
    try {
      const storedText = storageLayer().read(STORAGE_KEY);
      if (!storedText) return cloneDefault();
      const stored = JSON.parse(storedText);
      if (!Number.isInteger(stored?.version) || stored.version < 1 || stored.version > DEFAULT_STATE.version) {
        saveRecoveryNeeded = true;
        return cloneDefault();
      }
      const storedRevision = Math.max(0, Math.floor(Number(stored.schemaRevision || 0)));
      if ((stored.version < DEFAULT_STATE.version || storedRevision < DEFAULT_STATE.schemaRevision) && typeof storageLayer().preserveMigrationBackup === "function") {
        storageLayer().preserveMigrationBackup(STORAGE_KEY, storedText, stored.version, DEFAULT_STATE.schemaRevision);
      }
      migrateExpeditionDurations(stored, storedRevision);
      migrateEarlyEggDurations(stored, storedRevision);
      return normaliseSaveState(stored, { preserveUnknown: true });
    } catch (error) {
      saveRecoveryNeeded = true;
      console.warn("The local hatchery save could not be loaded.", error);
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
    (Array.isArray(state.pc) ? state.pc : []).forEach(normalisePokemonTraining);
    (Array.isArray(state.expeditions) ? state.expeditions : []).forEach((entry) => normalisePokemonTraining(entry?.pokemon));
    if (state.encounter) normalisePokemonTraining(state.encounter);
    if (state.incubators?.slots) state.incubators.slots.forEach((slot) => { if (slot?.encounter) normalisePokemonTraining(slot.encounter); });
  }

  function trainingTotal(pokemon) {
    normalisePokemonTraining(pokemon);
    return CONTEST_STATS.reduce((total, stat) => total + Number(pokemon?.evs?.[stat] || 0), 0);
  }

  function trainingRoomForStat(pokemon, stat) {
    normalisePokemonTraining(pokemon);
    return Math.max(0, Math.min(TRAINING_STAT_CAP - Number(pokemon?.evs?.[stat] || 0), TRAINING_TOTAL_CAP - trainingTotal(pokemon)));
  }

  function describeStatEffects(statEffects) {
    return Object.entries(statEffects || {}).filter(([stat]) => CONTEST_STATS.includes(stat)).map(([stat, amount]) => `+${Number(amount || 0)} ${statLabel(stat)}`).join(", ");
  }

  function normaliseExpeditionState() {
    const now = Date.now();
    const seenPokemon = new Set();
    state.expeditions = (Array.isArray(state.expeditions) ? state.expeditions : [])
      .filter((entry) => entry && entry.pokemon && typeof entry.id === "string")
      .map((entry) => ({
        ...entry,
        id: String(entry.id),
        pokemon: entry.pokemon,
        locationId: String(entry.locationId || ""),
        locationName: String(entry.locationName || "Unknown route"),
        region: String(entry.region || ""),
        generation: Math.max(1, Math.min(9, Math.floor(Number(entry.generation || 1)))),
        startedAt: Math.max(0, Number(entry.startedAt || now)),
        returnAt: Math.max(0, Number(entry.returnAt || now + EXPEDITION_MIN_DURATION)),
        durationMs: Math.max(EXPEDITION_MIN_DURATION, Math.min(EXPEDITION_MAX_DURATION, Number(entry.durationMs || EXPEDITION_MIN_DURATION)))
      }))
      .filter((entry) => {
        const uid = String(entry.pokemon?.uid || "");
        if (!uid || seenPokemon.has(uid)) return false;
        seenPokemon.add(uid);
        normalisePokemonTraining(entry.pokemon);
        return true;
      });
    state.expeditionLog = Array.isArray(state.expeditionLog) ? state.expeditionLog.filter(Boolean).slice(0, 30) : [];
    state.souvenirs = state.souvenirs && typeof state.souvenirs === "object" && !Array.isArray(state.souvenirs) ? state.souvenirs : {};
    for (const [itemId, count] of Object.entries(state.souvenirs)) {
      const clean = Math.max(0, Math.floor(Number(count || 0)));
      if (clean > 0) state.souvenirs[itemId] = clean;
      else delete state.souvenirs[itemId];
    }
  }

  function enabledGenerationNumbers() {
    const generations = Array.isArray(state.settings?.generations) ? state.settings.generations.map(Number).filter((value) => Number.isInteger(value) && value >= 1 && value <= 9) : [];
    return generations.length ? [...new Set(generations)] : [1];
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
    const hours = Math.max(5, (durationMs * EXPEDITION_REWARD_TIME_MULTIPLIER) / 3600000);
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
    (values || []).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].map(([id, count]) => ({ id, count }));
  }

  function rewardListText(rewards) {
    const parts = [];
    if (rewards.money) parts.push(`₽${Number(rewards.money).toLocaleString()}`);
    countRewards(rewards.balls).forEach((entry) => parts.push(`${entry.count} ${displayItemName(entry.id)}`));
    countRewards(rewards.berries).forEach((entry) => parts.push(`${entry.count} ${displayItemName(entry.id)}`));
    countRewards(rewards.souvenirs).forEach((entry) => parts.push(`${entry.count} ${displayItemName(entry.id)}`));
    return parts.join(", ") || "field notes";
  }

  async function settleExpedition(entry, notify = false) {
    if (!entry || !expeditionReady(entry)) return false;
    const index = state.expeditions.findIndex((candidate) => candidate.id === entry.id);
    if (index < 0) return false;
    const pokemon = state.expeditions[index].pokemon;
    const rewards = expeditionRewardBundle(Number(entry.durationMs || EXPEDITION_MIN_DURATION));
    state.expeditions.splice(index, 1);
    let result;
    try {
      result = await addExperience(pokemon, rewards.xp);
    } catch (error) {
      console.warn("The expedition XP record could not be refreshed; the Pokémon will still return.", error);
      pokemon.experience = Math.max(0, Number(pokemon.experience || 0) + rewards.xp);
      result = { oldLevel: pokemon.level, newLevel: pokemon.level, evolutions: [] };
    }
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
    normalisePcLinks();
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
        } catch (error) {
          console.warn("An expedition return could not be settled.", error);
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
    if (resetInProgress) return true;
    const newlyUnlocked = syncLegendaryUnlocks();
    syncActiveIncubatorFromLegacy();
    const saved = storageLayer().write(STORAGE_KEY, JSON.stringify(state));
    updateHeader();
    if (saved && newlyUnlocked.length) announceLegendaryUnlocks(newlyUnlocked);
    return saved;
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
    if (!isPlainObject(payload)) throw new Error("This file does not look like a hatchery save.");
    const candidate = payload.magic === SAVE_EXPORT_MAGIC && isPlainObject(payload.save) ? payload.save : payload;
    if (!isPlainObject(candidate)) throw new Error("This file does not contain a hatchery save.");
    if (!Number.isInteger(candidate.version)) throw new Error("This save is missing its version card.");
    if (candidate.version > DEFAULT_STATE.version) throw new Error("This save comes from a newer hatchery build.");
    if (candidate.version < 1) throw new Error("This save version is not supported by this build.");
    if (!isPlainObject(candidate.settings)) throw new Error("This save is missing its hatchery settings.");
    return normaliseSaveState(candidate, { requirePlayer: true, preserveUnknown: true });
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
    if (!storageLayer().write(STORAGE_KEY, JSON.stringify(pendingImportSave))) {
      toast("The backup was valid, but local storage could not save it.");
      return;
    }
    window.location.reload();
  }

  function readImportFile(file) {
    if (!file) return;
    if (Number(file.size || 0) > 10 * 1024 * 1024) {
      pendingImportSave = null;
      toast("That backup is too large to open safely.");
      return;
    }
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

  function earlyEggProgress(eggNumber = 0) {
    const number = Math.floor(Number(eggNumber || 0));
    if (number <= 1) return 0;
    if (number >= EARLY_EGG_COUNT) return 1;
    return (number - 1) / (EARLY_EGG_COUNT - 1);
  }

  function earlyEggSpeedMultiplier(baseDuration, eggNumber = 0) {
    const duration = Math.max(1, Number(baseDuration || FALLBACK_HATCH_DURATION));
    const number = Math.floor(Number(eggNumber || 0));
    if (number < 1 || number > EARLY_EGG_COUNT) return 1;
    const startingMultiplier = Math.min(1, FIRST_EGG_HATCH_DURATION / duration);
    const progress = earlyEggProgress(number);
    return startingMultiplier + ((1 - startingMultiplier) * progress);
  }

  function earlyEggHatchDuration(baseDuration, eggNumber = 0, globalMultiplier = 1) {
    const duration = Math.max(1, Number(baseDuration || FALLBACK_HATCH_DURATION));
    return Math.max(1, Math.floor(duration * earlyEggSpeedMultiplier(duration, eggNumber) * Math.max(0, Number(globalMultiplier || 0))));
  }

  function hatchDurationForEgg(_openingStarterEgg = false, baseStatTotal = 0, eggNumber = 0) {
    if (isDevToolEnabled("instantHatch")) return 0;
    const baseDuration = hatchDurationForBaseStatTotal(baseStatTotal);
    return earlyEggHatchDuration(baseDuration, eggNumber, hatchDurationMultiplier());
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
      const forcedSpeciesId = normalisedSpeciesId(egg.forcedSpeciesId);
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
      delete egg.preparingRequest;
      if (slotIndex === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
      saveState();
      if (activeTab === "home") render();
      if (Date.now() >= egg.hatchAt) hatchEggForSlot(slotIndex);
    } catch (error) {
      nextEggPreparationRetryAt = Date.now() + 30000;
      if (activeTab === "home" && slotIndex === activeIncubatorIndex()) {
        if (error?.code === "MISSING_LEGENDARY_ITEM" && error.requirement) {
          toast(`${error.requirement.displayName} cannot form in this egg without ${error.requirement.itemName} in the Mystery Items pocket.`);
        } else {
          toast("The next egg is being shy. The incubator will try again shortly.");
        }
      }
    } finally {
      if (slot.egg === egg) delete egg.preparingRequest;
      if (slotIndex === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
      saveState();
    }
  }

  function placeEggInSlot(slot, slotIndex, openingStarterEgg = false, options = {}) {
    if (!state.player || !slot || slot.egg || slot.encounter) return false;
    const forcedSpeciesId = normalisedSpeciesId(state.forcedNextEggSpeciesId);
    slot.egg = createEgg(Date.now(), openingStarterEgg, forcedSpeciesId);
    if (forcedSpeciesId) state.forcedNextEggSpeciesId = 0;
    if (slotIndex === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
    if (options.save !== false) saveState();
    if (options.prepare !== false) prepareEggForSlot(slot, slotIndex);
    return true;
  }

  function autoPlacePrepaidEggs() {
    if (!state.player) return 0;
    normaliseIncubatorsIfNeeded();
    let available = itemCount(PREPAID_EGG_ITEM_ID);
    if (available <= 0) return 0;
    const preparedSlots = [];
    const activeIndex = activeIncubatorIndex();
    const slotIndexes = [activeIndex, ...state.incubators.slots.map((_slot, index) => index).filter((index) => index !== activeIndex)];
    for (const index of slotIndexes) {
      if (available <= 0) break;
      const slot = state.incubators.slots[index];
      if (!slot || slot.egg || slot.encounter) continue;
      setItemCount(PREPAID_EGG_ITEM_ID, available - 1);
      if (placeEggInSlot(slot, index, false, { save: false, prepare: false })) {
        available -= 1;
        preparedSlots.push(index);
      } else {
        setItemCount(PREPAID_EGG_ITEM_ID, available);
      }
    }
    if (!preparedSlots.length) return 0;
    syncLegacyFromActiveIncubator();
    saveState();
    preparedSlots.forEach((index) => prepareEggForSlot(state.incubators.slots[index], index));
    return preparedSlots.length;
  }

  function ensureEggForSlot(slot, slotIndex) {
    if (!state.player || !slot?.egg || slot.encounter) return;
    if (eggNeedsPreparedEncounterForSlot(slot)) prepareEggForSlot(slot, slotIndex);
  }

  function ensureAllIncubators() {
    normaliseIncubatorsIfNeeded();
    syncActiveIncubatorFromLegacy();
    autoPlacePrepaidEggs();
    incubatorSlots().forEach((slot, index) => ensureEggForSlot(slot, index));
    syncLegacyFromActiveIncubator();
  }

  function grantOpeningEggIfNeeded() {
    normaliseIncubatorsIfNeeded();
    if (!state.player || Number(state.statistics?.eggsLaid || 0) > 0) return false;
    if (incubatorSlots().some((slot) => slot.egg || slot.encounter)) return false;
    state.incubators.activeIndex = 0;
    syncLegacyFromActiveIncubator();
    return placeEggInSlot(incubatorSlots()[0], 0, true);
  }

  function eggPredatorSpriteUrl(speciesId) {
    const id = Math.max(1, Math.floor(Number(speciesId || 23)));
    return `${DEFAULT_SPRITE_ROOT}/${id}.png`;
  }

  function activeRepelEggCharges() {
    return Math.max(0, Math.min(REPEL_EGG_COVERAGE, Math.floor(Number(state.activeItemEffects?.repelEggsRemaining || 0))));
  }

  function beginRepelCoverageForEgg() {
    if (!state.activeItemEffects || typeof state.activeItemEffects !== "object") state.activeItemEffects = {};
    let remaining = activeRepelEggCharges();
    let activated = false;
    if (remaining <= 0 && itemCount(REPEL_ITEM_ID) > 0) {
      setItemCount(REPEL_ITEM_ID, itemCount(REPEL_ITEM_ID) - 1);
      remaining = REPEL_EGG_COVERAGE;
      state.activeItemEffects.repelEggsRemaining = remaining;
      state.statistics.repelsUsed = (state.statistics.repelsUsed || 0) + 1;
      activated = true;
    }
    if (remaining <= 0) return { active: false, activated: false, remainingAfter: 0 };
    const remainingAfter = remaining - 1;
    state.activeItemEffects.repelEggsRemaining = remainingAfter;
    return { active: true, activated, remainingAfter };
  }

  function eggPredatorCheck(egg) {
    if (egg?.predatorCheck?.resolved === true) return egg.predatorCheck;
    const partner = getPartnerPokemon();
    const repelCoverage = beginRepelCoverageForEgg();
    const result = EGG_PREDATOR_REGISTRY.resolveAttempt({
      hasRepel: repelCoverage.active,
      hasPartner: Boolean(partner) && !repelCoverage.active,
      generations: enabledGenerationNumbers(),
      random: Math.random
    });
    const check = {
      resolved: true,
      attempted: result.attempted === true,
      outcome: repelCoverage.active ? "repel" : (result.outcome || "none"),
      predatorSpeciesId: Number(result.predator?.speciesId || 0),
      predatorName: String(result.predator?.displayName || ""),
      partnerUid: partner?.uid || "",
      partnerName: partner ? String(partner.nickname || partner.displayName) : "",
      repelActivated: repelCoverage.activated,
      repelEggsRemaining: repelCoverage.remainingAfter,
      resolvedAt: new Date().toISOString()
    };
    egg.predatorCheck = check;
    if (check.attempted) state.statistics.eggConsumptionAttempts = (state.statistics.eggConsumptionAttempts || 0) + 1;
    if (check.outcome === "repel") {
      state.statistics.eggsProtectedByRepel = (state.statistics.eggsProtectedByRepel || 0) + 1;
    } else if (check.outcome === "partner") {
      state.statistics.eggsProtectedByPartner = (state.statistics.eggsProtectedByPartner || 0) + 1;
    } else if (check.outcome === "eaten") {
      state.statistics.eggsLostToSnakes = (state.statistics.eggsLostToSnakes || 0) + 1;
    }
    return check;
  }

  function enqueueEggEventNotice(notice) {
    if (!Array.isArray(state.eggEventNotices)) state.eggEventNotices = [];
    state.eggEventNotices.push({
      id: makeId(),
      kind: notice.kind,
      protection: notice.protection || "",
      attempted: notice.attempted === true,
      predatorSpeciesId: Math.max(0, Math.floor(Number(notice.predatorSpeciesId || 0))),
      predatorName: String(notice.predatorName || ""),
      predatorSprite: Number(notice.predatorSpeciesId || 0) > 0 ? eggPredatorSpriteUrl(notice.predatorSpeciesId) : "",
      partnerName: String(notice.partnerName || ""),
      pokemonName: String(notice.pokemonName || ""),
      incubatorNumber: Math.max(1, Math.floor(Number(notice.incubatorNumber || 1))),
      repelEggsRemaining: Math.max(0, Math.min(REPEL_EGG_COVERAGE, Math.floor(Number(notice.repelEggsRemaining || 0)))),
      createdAt: new Date().toISOString()
    });
    state.eggEventNotices = state.eggEventNotices.slice(-20);
  }

  function showNextEggEventNotice() {
    if (resetInProgress || !state.player || !Array.isArray(state.eggEventNotices) || !state.eggEventNotices.length) return;
    if (String(modalRoot.innerHTML || "").trim()) return;
    const notice = state.eggEventNotices[0];
    const predatorName = escapeHtml(notice.predatorName || "A hungry Pokémon");
    let visualName = predatorName;
    let visualSprite = escapeHtml(notice.predatorSprite || eggPredatorSpriteUrl(notice.predatorSpeciesId));
    let eyebrow = "Incubator incident";
    let title = `${predatorName} ate the egg`;
    let body = `A ${predatorName} slipped into incubator ${Number(notice.incubatorNumber || 1)} and ate the egg before it could hatch.`;
    if (notice.kind === "protected" && notice.protection === "repel") {
      const remaining = Math.max(0, Math.floor(Number(notice.repelEggsRemaining || 0)));
      const remainingText = remaining > 0
        ? `The active Repel will protect ${remaining} more egg${remaining === 1 ? "" : "s"}.`
        : "The Repel has now worn off.";
      eyebrow = "Automatic protection";
      title = "A Repel protected the egg";
      if (notice.attempted) {
        body = `${predatorName} tried to reach the egg, but the active Repel drove it away. ${escapeHtml(notice.pokemonName || "The Pokémon")} hatched safely. ${remainingText}`;
      } else {
        visualName = "Repel";
        visualSprite = escapeHtml(itemSpriteUrl(REPEL_ITEM_ID));
        body = `An active Repel covered incubator ${Number(notice.incubatorNumber || 1)} while ${escapeHtml(notice.pokemonName || "the Pokémon")} hatched safely. This hatch used one of its five protections. ${remainingText}`;
      }
    } else if (notice.kind === "protected" && notice.protection === "partner") {
      eyebrow = "Partner on watch";
      title = `${escapeHtml(notice.partnerName || "Your partner")} protected the egg`;
      body = `${predatorName} tried to reach the egg, but ${escapeHtml(notice.partnerName || "your partner")} chased it away. ${escapeHtml(notice.pokemonName || "The Pokémon")} hatched safely.`;
    }
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <section class="modal paper-panel egg-event-modal" role="dialog" aria-modal="true" aria-labelledby="egg-event-title">
          <p class="eyebrow">${eyebrow}</p>
          <h2 id="egg-event-title">${title}</h2>
          <img class="egg-event-predator" src="${visualSprite}" alt="${visualName}" />
          <p class="modal-intro">${body}</p>
          <div class="button-row"><button class="button button-primary" type="button" data-action="acknowledge-egg-event" data-notice-id="${escapeHtml(notice.id)}">Continue</button></div>
        </section>
      </div>`;
  }

  function acknowledgeEggEventNotice(noticeId) {
    if (!Array.isArray(state.eggEventNotices)) state.eggEventNotices = [];
    const index = state.eggEventNotices.findIndex((notice) => notice.id === noticeId);
    if (index >= 0) state.eggEventNotices.splice(index, 1);
    else state.eggEventNotices.shift();
    modalRoot.innerHTML = "";
    saveState();
    showNextEggEventNotice();
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
    const preparedEncounter = egg.pendingEncounter || null;
    const missingRequirement = missingLegendaryRequirement(preparedEncounter?.speciesId);
    if (missingRequirement) {
      const now = Date.now();
      const lastNoticeAt = Number(egg.legendaryLockNoticeAt || 0);
      if (now - lastNoticeAt >= 30000) {
        egg.legendaryLockNoticeAt = now;
        toast(`${missingRequirement.displayName} is waiting for ${missingRequirement.itemName} in the Mystery Items pocket.`);
      }
      return;
    }
    const predatorCheck = eggPredatorCheck(egg);
    saveState();
    if (predatorCheck.outcome === "eaten") {
      slot.egg = null;
      if (slotIndex === activeIncubatorIndex()) syncLegacyFromActiveIncubator();
      enqueueEggEventNotice({
        kind: "eaten",
        attempted: true,
        predatorSpeciesId: predatorCheck.predatorSpeciesId,
        predatorName: predatorCheck.predatorName,
        incubatorNumber: slotIndex + 1
      });
      saveState();
      if (activeTab === "home") render();
      else showNextEggEventNotice();
      return;
    }
    egg.hatching = true;
    const openingStarterEgg = Boolean(egg.openingStarterEgg);
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
      if (predatorCheck.outcome === "repel" || predatorCheck.outcome === "partner") {
        enqueueEggEventNotice({
          kind: "protected",
          protection: predatorCheck.outcome,
          attempted: predatorCheck.attempted,
          predatorSpeciesId: predatorCheck.predatorSpeciesId,
          predatorName: predatorCheck.predatorName,
          partnerName: predatorCheck.partnerName,
          pokemonName: encounter.nickname || encounter.displayName,
          incubatorNumber: slotIndex + 1,
          repelEggsRemaining: predatorCheck.repelEggsRemaining
        });
      }
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

  async function prepareNormalEgg() {
    await prepareEggForSlot(activeIncubatorSlot(), activeIncubatorIndex());
  }

  function ensureEgg() {
    const slot = activeIncubatorSlot();
    if (!slot.egg && !slot.encounter) placeEggInSlot(slot, activeIncubatorIndex(), shouldUseOpeningStarterEgg());
    else ensureEggForSlot(slot, activeIncubatorIndex());
  }

  function clearActiveEncounter() {
    const slot = activeIncubatorSlot();
    if (slot) slot.encounter = null;
    state.encounter = null;
    syncLegacyFromActiveIncubator();
    return autoPlacePrepaidEggs();
  }

  function buyEggForActiveIncubator() {
    const slot = activeIncubatorSlot();
    if (!slot || slot.egg || slot.encounter) {
      toast("This incubator already has something resting in it.");
      return;
    }
    const freePurchase = isDevToolEnabled("freeShop");
    if (!freePurchase && state.money < EGG_PRICE) {
      toast("You need ₽50 to buy a new egg.");
      return;
    }
    if (!freePurchase) state.money -= EGG_PRICE;
    if (!placeEggInSlot(slot, activeIncubatorIndex(), false)) {
      if (!freePurchase) state.money += EGG_PRICE;
      toast("The egg could not be placed in that incubator.");
      return;
    }
    shopItems = null;
    saveState();
    activeTab = "home";
    render();
    toast(freePurchase ? "A new egg is incubating." : "A new egg is incubating. −₽50.");
  }

  function pulseUiElement(element, className = "is-updated", duration = 700) {
    if (!element || LOW_POWER_INTERFACE || prefersReducedMotion()) return;
    element.classList.remove(className);
    window.requestAnimationFrame(() => {
      element.classList.add(className);
      window.setTimeout(() => element.classList.remove(className), duration);
    });
  }

  function optimiseRenderedImages() {
    const images = view.querySelectorAll("img");
    images.forEach((image, index) => {
      image.decoding = "async";
      if (index > 2 && !image.hasAttribute("loading")) image.loading = "lazy";
      image.draggable = false;
    });
  }

  function animateRenderedView() {
    optimiseRenderedImages();
    if (LOW_POWER_INTERFACE || prefersReducedMotion()) return;
    const stage = view.firstElementChild;
    if (!stage) return;
    stage.classList.add("view-enter");
    const motionSelectors = [
      ".paper-panel", ".field-note", ".toolbar", ".danger-zone", ".summary-stamps",
      ".pc-card", ".dex-card", ".mart-card", ".incubator-slot-card", ".bag-pocket",
      ".competition-card", ".placeholder-card"
    ].join(", ");
    Array.from(stage.querySelectorAll(motionSelectors)).slice(0, 24).forEach((element, index) => {
      element.style.setProperty("--enter-delay", `${Math.min(index * 28, 280)}ms`);
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

  function legendaryItemRegistry() {
    return window.PocketHatcheryLegendaryItems || null;
  }

  function syncLegendaryUnlocks() {
    const registry = legendaryItemRegistry();
    if (!registry || typeof registry.unlockEligibleItems !== "function") return [];
    const unlocked = registry.unlockEligibleItems(state);
    if (unlocked.length) shopItems = null;
    return unlocked;
  }

  function announceLegendaryUnlocks(unlocked) {
    const records = Array.isArray(unlocked) ? unlocked.filter(Boolean) : [];
    if (!records.length) return;
    if (records.length === 1) {
      const record = records[0];
      window.setTimeout(() => toast(`${record.itemName} unlocked. ${record.displayName} eggs can now form.`), 0);
      return;
    }
    const names = records.slice(0, 3).map((record) => record.itemName).join(", ");
    const remainder = records.length > 3 ? ` and ${records.length - 3} more` : "";
    window.setTimeout(() => toast(`${records.length} Mystery Items unlocked: ${names}${remainder}.`), 0);
  }

  function legendaryRequirement(speciesId) {
    if (isManaphySpeciesId(speciesId)) return null;
    const registry = legendaryItemRegistry();
    return registry && typeof registry.getRequirement === "function" ? registry.getRequirement(speciesId) : null;
  }

  function missingLegendaryRequirement(speciesId) {
    const requirement = legendaryRequirement(speciesId);
    if (!requirement) return null;
    return itemCount(requirement.itemId) > 0 ? null : requirement;
  }

  function createMissingLegendaryItemError(requirement) {
    const error = new Error(`${requirement.displayName} requires ${requirement.itemName} in the Mystery Items pocket.`);
    error.code = "MISSING_LEGENDARY_ITEM";
    error.requirement = requirement;
    return error;
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
    if (typeof crypto === "object" && crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
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
    if (apiClient) return apiClient.fetchJson(resource);
    const url = String(resource).startsWith("http") ? String(resource) : `${API_ROOT}/${String(resource).replace(/^\//, "")}`;
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = controller ? window.setTimeout(() => controller.abort(), 12000) : null;
    try {
      const requestOptions = { headers: { Accept: "application/json" } };
      if (controller) requestOptions.signal = controller.signal;
      const response = await fetch(url, requestOptions);
      if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`);
      setApiStatus(true);
      return response.json();
    } catch (error) {
      setApiStatus(false);
      if (typeof DOMException === "function" && error instanceof DOMException && error.name === "AbortError") throw new Error("The Pokémon records took too long to respond.");
      throw error;
    } finally {
      if (timeout) window.clearTimeout(timeout);
    }
  }

  async function loadGeneration(generation) {
    if (!generationCache.has(generation)) {
      const request = apiFetch(`generation/${generation}`)
        .then((data) => data.pokemon_species)
        .catch((error) => {
          generationCache.delete(generation);
          throw error;
        });
      generationCache.set(generation, request);
    }
    return generationCache.get(generation);
  }

  async function getEnabledSpeciesReferences() {
    const generations = state.settings.generations.length ? state.settings.generations : [1];
    const groups = await Promise.all(generations.map(loadGeneration));
    const references = groups.flat().sort((left, right) => resourceId(left.url) - resourceId(right.url));
    enabledSpeciesTotal = references.length;
    return references;
  }

  function englishName(resource, fallback) {
    return resource.names?.find((entry) => entry.language.name === "en")?.name || titleCase(fallback);
  }

  function getPokemonSprites(pokemon) {
    const fallbackNormal = `${DEFAULT_SPRITE_ROOT}/${pokemon.id}.png`;
    const normal = cleanUrl(pokemon?.sprites?.front_default, fallbackNormal);
    const shiny = cleanUrl(pokemon?.sprites?.front_shiny, normal);
    return { normal, shiny };
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
    const sprites = getPokemonSprites(pokemon);
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
    const enabledReferences = await getEnabledSpeciesReferences();
    if (!enabledReferences.length) throw new Error("No generations are enabled.");
    const references = options.eggEncounter === true
      ? enabledReferences.filter((reference) => !missingLegendaryRequirement(resourceId(reference.url)))
      : enabledReferences;
    if (!references.length) throw new Error("No Pokémon are eligible to hatch with the current Mystery Items.");
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
    if (options.eggEncounter === true) {
      const missingRequirement = missingLegendaryRequirement(id);
      if (missingRequirement) throw createMissingLegendaryItemError(missingRequirement);
    }
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
      types: Array.isArray(encounter.types) ? encounter.types.map((type) => String(type || "").toLowerCase()).filter(Boolean) : [],
      seen: 0,
      shinySeen: 0,
      firstEncounteredAt: encounter.encounteredAt
    };
    record.cryUrl = record.cryUrl || encounter.cryUrl;
    if (Array.isArray(encounter.types) && encounter.types.length) record.types = encounter.types.map((type) => String(type || "").toLowerCase()).filter(Boolean);
    if (Number.isFinite(baseStatTotal) && baseStatTotal > 0) {
      record.baseStatTotal = baseStatTotal;
      record.hatchDuration = hatchDurationForBaseStatTotal(baseStatTotal);
    }
    record.seen += 1;
    if (encounter.shiny) record.shinySeen += 1;
    state.pokedex[key] = record;
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
    const effort = Math.floor(Number(pokemon.evs?.[stat] || 0) / 4);
    if (stat === "hp") return Math.floor(((2 * base + iv + effort) * level) / 100) + level + 10;
    return Math.floor(((2 * base + iv + effort) * level) / 100) + 5;
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
    const sprites = getPokemonSprites(newPokemon);
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
      return { label: "incubating", copy: preparing ? "Tiny taps are sorting themselves out" : "Something is stirring inside", image: eggSpriteUrl(slot.egg), alt: "A speckled egg is incubating" };
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
            <dt>Types</dt><dd>${pokemon.types.map((type) => escapeHtml(titleCase(type))).join(" / ")}</dd>
            <dt>Ability</dt><dd>${escapeHtml(titleCase(pokemon.ability))}${pokemon.hiddenAbility ? " · hidden" : ""}</dd>
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
    const remaining = state.egg ? state.egg.hatchAt - Date.now() : 0;
    const preparingEgg = Boolean(state.egg?.preparingEncounter && !state.egg?.pendingEncounter);
    const hatchDuration = state.egg ? Math.max(1, state.egg.hatchDuration || state.egg.hatchAt - state.egg.laidAt) : FALLBACK_HATCH_DURATION;
    const progress = state.egg && !preparingEgg ? Math.min(100, Math.max(0, ((Date.now() - state.egg.laidAt) / hatchDuration) * 100)) : 0;
    const nextGift = millisecondsUntilTomorrow();
    const openingStarterEgg = Boolean(state.egg?.openingStarterEgg);
    const freeEggPurchase = isDevToolEnabled("freeShop");
    const canBuyEgg = freeEggPurchase || state.money >= EGG_PRICE;
    const eggPriceLabel = freeEggPurchase ? "FREE" : `₽${EGG_PRICE}`;
    const firstEggWarning = openingStarterEgg
      ? `<p class="first-egg-warning">Your first egg is unusually warm. It should hatch much faster than most, so keep an eye on the incubator.</p>`
      : "";
    const incubatorPanel = state.egg ? `
        <article class="paper-panel incubator">
          <div class="panel-label">Incubation / <em>active</em></div>
          <div class="hatchery-stage ${getPartnerPokemon() ? "has-partner" : ""}">
            <div class="egg-stage"><img class="egg egg-sprite" src="${eggSpriteUrl()}" alt="A speckled egg is incubating" /></div>
            ${renderPartnerCompanion()}
          </div>
          <div class="countdown-wrap">
            <div id="hatch-countdown" class="countdown">incubating</div>
            <p class="hatch-copy">${openingStarterEgg ? "Your first egg is wiggling." : preparingEgg ? "Tiny taps echo inside…" : "Something is stirring inside…"}</p>
            <div class="progress-ruler">
              <span>laid</span>
              <div class="progress-track"><span id="egg-progress" class="progress-fill" style="width:${progress.toFixed(2)}%"></span></div>
              <span>soon</span>
            </div>
          </div>
        </article>` : `
        <article class="paper-panel incubator empty-incubator">
          <div class="panel-label">Incubation / <em>empty</em></div>
          <div class="empty-incubator-stage">
            <img class="empty-incubator-egg egg-sprite" src="${EGG_SPRITE_URL}" alt="" />
            <h2>This cushion is ready</h2>
            <p>Buy a fresh egg for ₽${EGG_PRICE}. Any prepaid egg in the field bag is loaded automatically before this screen appears.</p>
            <div class="button-row empty-incubator-actions">
              <button class="button button-accent" type="button" data-action="buy-new-egg" ${canBuyEgg ? "" : "disabled"}>Buy new egg · ${eggPriceLabel}</button>
              <button class="button" type="button" data-tab="mart">Prepurchase eggs</button>
            </div>
          </div>
        </article>`;

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

        ${incubatorPanel}

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
    const slotState = incubatorSlots().map((slot, index) => slot.encounter ? `${index + 1}: ${slot.encounter.displayName}` : slot.egg?.pendingEncounter ? `${index + 1}: egg ${slot.egg.pendingEncounter.displayName}` : slot.egg ? `${index + 1}: egg incubating` : `${index + 1}: empty`).join(" · ");
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
      <article class="paper-panel settings-section settings-card-full dev-tools-section">
        <p class="eyebrow">Secret hatchery drawer</p>
        <h2>Cheats & dev tools</h2>
        <p class="settings-copy">These controls are tucked away for one special profile. Change the profile and the drawer shuts again.</p>
        <div class="check-grid dev-tool-grid">${toolChecks}</div>
        <div class="dev-actions">${actionGroups}</div>
      </article>`;
  }

  function renderPokedex() {
    const allEntries = Object.values(state.pokedex).sort((left, right) => left.speciesId - right.speciesId);
    const matchingEntries = allEntries.filter((entry) => `${entry.displayName} ${entry.speciesId}`.toLowerCase().includes(pokedexFilter.toLowerCase()));
    const entries = matchingEntries.slice(0, pokedexVisibleLimit);
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
        ${allEntries.length ? `<div class="dex-grid">${cards || '<p class="no-results">No journal pages match this search.</p>'}</div>${matchingEntries.length > entries.length ? `<div class="archive-more"><button class="button button-primary" type="button" data-action="show-more-pokedex">Show ${Math.min(ARCHIVE_PAGE_SIZE, matchingEntries.length - entries.length)} more</button><span>${entries.length} of ${matchingEntries.length} shown</span></div>` : ""}` : emptyState("The journal is still blank", "Your first hatch will make the opening page.", '<button class="button button-primary" type="button" data-tab="home">Back to the incubator</button>')}
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
          <p>Sent Pokémon are hidden from the PC until they come home with XP and small findings. Expeditions last between 2.5 and 12 hours, and no unique shop purchase can appear as loot.</p>
          <div class="expedition-grid">${activeCards}</div>
        </div>
        ${logCards ? `<aside class="paper-panel expedition-log"><div class="panel-label">Recent returns</div>${logCards}</aside>` : ""}
      </section>`;
  }

  function renderPc() {
    const partner = getPartnerPokemon();
    const favouriteCount = state.pc.filter((pokemon) => pokemon.favorite).length;
    const matchingPokemon = filteredPcPokemon();
    const visiblePokemon = matchingPokemon.slice(0, pcVisibleLimit);
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
          <button class="pc-summary-button" type="button" data-action="pc-summary" data-uid="${escapeHtml(pokemon.uid)}">
            <span class="dex-card-number">No. ${String(pokemon.speciesId).padStart(3, "0")}</span>
            <img src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.displayName)}" loading="lazy" />
            <strong>${escapeHtml(pokemon.nickname || pokemon.displayName)}</strong>
            <span>${pokemon.nickname ? escapeHtml(pokemon.displayName) + " · " : ""}Lv. ${pokemon.level}</span>
          </button>
          <div class="pc-card-actions">
            <button class="pc-card-action" type="button" data-action="toggle-favorite" data-uid="${escapeHtml(pokemon.uid)}" aria-pressed="${isFavourite}">${isFavourite ? "★ Favourite" : "☆ Favourite"}</button>
            <button class="pc-card-action" type="button" data-action="toggle-partner" data-uid="${escapeHtml(pokemon.uid)}" aria-pressed="${isPartner}">${isPartner ? "◇ Partner" : "+ Partner"}</button>
            <button class="pc-card-action" type="button" data-action="toggle-team" data-uid="${escapeHtml(pokemon.uid)}" aria-pressed="${selected}">${selected ? "✓ Team" : "+ Team"}</button>
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
        <span>${matchingPokemon.length} / ${state.pc.length} match</span>
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
        ${state.pc.length ? `<div class="pc-grid">${cards || '<p class="no-results">No Pokémon match those filters.</p>'}</div>${matchingPokemon.length > visiblePokemon.length ? `<div class="archive-more"><button class="button button-primary" type="button" data-action="show-more-pc">Show ${Math.min(ARCHIVE_PAGE_SIZE, matchingPokemon.length - visiblePokemon.length)} more</button><span>${visiblePokemon.length} of ${matchingPokemon.length} shown</span></div>` : ""}` : emptyState("No Pokémon in the room yet", "Hatch an egg, spend a moment with the visitor, then try a Poké Ball when you are ready.", '<button class="button button-primary" type="button" data-tab="home">Visit the incubator</button>')}
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
    const pockets = registry && typeof registry.getBagPockets === "function" ? registry.getBagPockets(state) : { balls: [], items: [], berries: [], plates: [], souvenirs: [], mysteryItems: [] };
    const charmCharges = activeShinyCharmCharges();
    const repelCharges = activeRepelEggCharges();
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
      const isPrepaidEgg = item.id === PREPAID_EGG_ITEM_ID;
      const isRepel = item.id === REPEL_ITEM_ID;
      const incubatorAvailable = !activeIncubatorSlot()?.egg && !activeIncubatorSlot()?.encounter;
      const detail = isCharm && charmCharges > 0
        ? `${charmCharges} egg${charmCharges === 1 ? "" : "s"} still sparkling`
        : isMagmarizer && owned
          ? "warming new eggs"
          : isPrepaidEgg
            ? `${Number(item.count || 0).toLocaleString()} prepaid egg${Number(item.count || 0) === 1 ? "" : "s"} ready`
            : isRepel
              ? repelCharges > 0
                ? `${Number(item.count || 0).toLocaleString()} in bag · ${repelCharges} of 5 active egg protections remain`
                : `${Number(item.count || 0).toLocaleString()} in bag · the next Repel activates automatically for five hatches`
              : `${Number(item.count || 0).toLocaleString()} in bag`;
      const action = isCharm && owned
        ? `<button class="button button-primary" type="button" data-action="use-item" data-item-id="${item.id}">Use charm</button>`
        : isPrepaidEgg && owned
          ? `<p class="passive-note">${incubatorAvailable ? "An available incubator will load this automatically." : "It will load automatically when an incubator becomes available."}</p>`
          : isRepel && (owned || repelCharges > 0)
            ? `<p class="passive-note">No button is needed. A Repel activates automatically and covers five eggs that reach hatch time. Every hatch spends one protection, even when no predator appears.</p>`
            : "";
      return `
        <article class="bag-card">
          <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
          <strong>${escapeHtml(item.displayName)}</strong>
          <span>${escapeHtml(detail)}</span>
          ${action}
        </article>`;
    });
    const legendaryRegistry = legendaryItemRegistry();
    const legendaryStatuses = legendaryRegistry && typeof legendaryRegistry.getUnlockStatuses === "function" ? legendaryRegistry.getUnlockStatuses(state) : [];
    const lockedLegendaryStatuses = legendaryStatuses.filter((status) => status && !status.unlocked);
    const visibleLegendaryStatuses = lockedLegendaryStatuses.slice(0, mysteryGoalVisibleLimit);
    const unlockedLegendaryCount = legendaryStatuses.length - lockedLegendaryStatuses.length;
    const mysteryPocket = renderBagPocket("Mystery Items", "Rare relics earned through hatchery research. Each relic allows its associated Legendary Pokémon to form inside an egg; relics are checked again at hatching and are never consumed.", pockets.mysteryItems || [], "No Legendary relics are tucked away yet. Open the research ledger below to see the first goals.", (item) => `
      <article class="bag-card mystery-item-card">
        <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
        <strong>${escapeHtml(item.displayName)}</strong>
        <span>${Number(item.count || 0).toLocaleString()} in bag · permits ${escapeHtml(item.associatedPokemon)} eggs</span>
      </article>`);
    const mysteryResearch = legendaryStatuses.length ? `
      <details class="paper-panel mystery-research">
        <summary><span>Mystery research ledger</span><b>${unlockedLegendaryCount} / ${legendaryStatuses.length} relics unlocked</b></summary>
        <p>Goals are checked automatically whenever the hatchery saves. Once earned, a relic stays in the Mystery Items pocket.</p>
        ${lockedLegendaryStatuses.length ? `<div class="mystery-goal-grid">${visibleLegendaryStatuses.map((status) => `
          <article class="mystery-goal-card">
            <span class="mystery-goal-pokemon">${escapeHtml(status.displayName)}</span>
            <strong>${escapeHtml(status.itemName)}</strong>
            <p>${escapeHtml(status.description)}</p>
            <small>${escapeHtml(status.progressText)}</small>
          </article>`).join("")}</div>${lockedLegendaryStatuses.length > visibleLegendaryStatuses.length ? `<div class="archive-more"><button class="button" type="button" data-action="show-more-mystery-goals">Show ${Math.min(ARCHIVE_PAGE_SIZE, lockedLegendaryStatuses.length - visibleLegendaryStatuses.length)} more goals</button><span>${visibleLegendaryStatuses.length} of ${lockedLegendaryStatuses.length} locked goals shown</span></div>` : ""}` : '<p class="mystery-complete">Every known Legendary relic has been unlocked.</p>'}
      </details>` : "";
    const berryPocket = renderBagPocket("Berry pouch", "Purchased berries add capped training points to one or more stats. No Pokémon can exceed 252 points in one stat or 510 total.", pockets.berries || [], "No berries are tucked into the pouch yet.", (item) => `
      <article class="bag-card">
        <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
        <strong>${escapeHtml(item.displayName)}</strong>
        <span>${Number(item.count || 0).toLocaleString()} in bag · ${escapeHtml(describeStatEffects(item.statEffects))}</span>
        <button class="button button-primary" type="button" data-action="use-item" data-item-id="${escapeHtml(item.id)}">Use berry</button>
      </article>`);
    const souvenirPocket = renderBagPocket("Expedition keepsakes", "Small harmless things brought back from canon routes. They can be sold for pocket money, but never replace unique shop items.", pockets.souvenirs || [], "No expedition keepsakes have come home yet.", (item) => {
      const count = Number(item.count || 0);
      const sellValue = Number(item.sellValue || 0);
      return `
        <article class="bag-card">
          <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
          <strong>${escapeHtml(item.displayName)}</strong>
          <span>${count.toLocaleString()} found · sells for ₽${sellValue.toLocaleString()}</span>
          <button class="button" type="button" data-action="sell-souvenir" data-item-id="${escapeHtml(item.id)}">Sell one</button>
          ${count > 1 ? `<button class="button button-primary" type="button" data-action="sell-all-souvenir" data-item-id="${escapeHtml(item.id)}">Sell all</button>` : ""}
        </article>`;
    });
    const platePocket = renderBagPocket("Plate pocket", "Only one plate can sit beside the incubator at a time.", pockets.plates.filter((item) => Number(item.count || 0) > 0), "No plates are tucked away yet.", (item) => `
      <article class="bag-card ${item.equipped ? "is-equipped" : ""}">
        <img src="${escapeHtml(itemSpriteUrl(item.spriteId || item.id))}" alt="" />
        <strong>${escapeHtml(item.displayName)}</strong>
        <span>${item.equipped ? "beside the incubator" : `${titleCase(item.type)} plate`}</span>
        <button class="button ${item.equipped ? "" : "button-primary"}" type="button" data-action="toggle-plate" data-item-id="${item.id}">${item.equipped ? "Put away" : "Equip"}</button>
      </article>`);
    view.innerHTML = `
      <section class="archive-page bag-page">
        ${pageHeader("Field bag", "Bag", "Everything you have tucked away for eggs, visitors, and odd little shop surprises.")}
        <div class="bag-pockets">${ballPocket}${itemPocket}${berryPocket}${mysteryPocket}${mysteryResearch}${platePocket}${souvenirPocket}</div>
      </section>`;
  }

  function renderMart() {
    if (!shopItems) loadShopItems();
    const visibleStock = shopItems.slice(0, shopVisibleLimit);
    const stock = visibleStock.map((item) => {
      const count = item.id === "incubator-upgrade" ? incubatorCapacity() : item.category === "ball" ? state.inventory[item.id] || 0 : itemCount(item.id);
      const ownedUnique = item.unique && count > 0;
      const disabled = ownedUnique || (!isDevToolEnabled("freeShop") && state.money < item.cost);
      const price = isDevToolEnabled("freeShop") && !ownedUnique ? "FREE" : `₽${item.cost.toLocaleString()}`;
      const pocketLabel = item.category === "plate" ? "Plate shelf" : item.category === "ball" ? "Field bag favourite" : "Counter curiosity";
      const bulkPurchase = item.consumable === true && item.stackable === true;
      return `
      <article class="shop-card paper-panel">
        <div class="shop-sprite"><img src="${escapeHtml(item.sprite)}" alt="" /></div>
        <p class="eyebrow">${pocketLabel}</p>
        <h2>${escapeHtml(item.displayName)}</h2>
        <p>${escapeHtml(item.description)}</p>
        <dl><dt>Price</dt><dd>${ownedUnique ? "owned" : price}</dd><dt>${item.id === "incubator-upgrade" ? "Slots" : "In bag"}</dt><dd>${item.id === "incubator-upgrade" ? `${count} / ${MAX_INCUBATOR_SLOTS}` : count || 0}</dd></dl>
        <button class="button button-primary" type="button" data-action="buy-shop-item" data-item-id="${item.id}" ${disabled ? "disabled" : ""}>${ownedUnique ? "Already in bag" : bulkPurchase ? `Choose quantity · ${price} each` : `Buy one · ${price}`}</button>
      </article>`;
    }).join("");
    view.innerHTML = `
      <section class="archive-page">
        ${pageHeader("Field supplies", "Pokémart", "Stock your field bag before the next shell starts to wobble.", `<div class="wallet-stamp"><span>pocket money</span><b>₽${state.money.toLocaleString()}</b></div>`)}
        <div class="shop-grid">${stock || emptyState("The shelves are being dusted", "Check back after your collection has grown a little.")}</div>
        ${shopItems.length > visibleStock.length ? `<div class="archive-more"><button class="button button-primary" type="button" data-action="show-more-shop">Show ${Math.min(ARCHIVE_PAGE_SIZE, shopItems.length - visibleStock.length)} more items</button><span>${visibleStock.length} of ${shopItems.length} shown</span></div>` : ""}
        <p class="archive-footnote">Your first egg is free. Later eggs cost ₽${EGG_PRICE}; prepaid eggs wait in the field bag and load automatically into available incubators.</p>
      </section>`;
  }

  function competitionProgress() {
    if (!state.competition || typeof state.competition !== "object") state.competition = JSON.parse(JSON.stringify(DEFAULT_STATE.competition));
    const unlocked = COMPETITION_ENGINE.unlockedLeagues(state.competition.peakRating);
    if (!unlocked.some((league) => league.id === state.competition.selectedLeague)) state.competition.selectedLeague = unlocked[unlocked.length - 1]?.id || "local";
    if (!COMPETITION_ENGINE.DIFFICULTIES.some((difficulty) => difficulty.id === state.competition.selectedDifficulty)) state.competition.selectedDifficulty = "standard";
    state.competition.cooldowns ||= {};
    state.competition.rivals ||= {};
    state.competition.challenges ||= {};
    return state.competition;
  }

  function competitionTeam() {
    normalisePcLinks();
    return state.team.map((id) => state.pc.find((pokemon) => pokemon.uid === id)).filter(Boolean);
  }

  function competitionCooldownRemaining(leagueId) {
    return Math.max(0, Number(competitionProgress().cooldowns[leagueId] || 0) - Date.now());
  }

  function updateCompetitionCooldownDisplay() {
    if (activeTab !== "competitions") return;
    const element = document.querySelector("[data-competition-cooldown]");
    if (!element) return;
    const leagueId = competitionProgress().selectedLeague;
    const remaining = competitionCooldownRemaining(leagueId);
    if (remaining > 0) {
      element.textContent = `Reopens in ${formatShortDuration(remaining)}`;
      return;
    }
    if (element.dataset.cooldownActive === "true") renderCompetitions();
  }

  function formatShortDuration(milliseconds) {
    const seconds = Math.max(0, Math.ceil(Number(milliseconds || 0) / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return minutes ? `${minutes}m ${String(remainder).padStart(2, "0")}s` : `${remainder}s`;
  }

  function getOrCreateCompetitionRival(leagueId) {
    const progress = competitionProgress();
    if (progress.rivals[leagueId]) return progress.rivals[leagueId];
    const leagueIndex = Math.max(0, COMPETITION_ENGINE.LEAGUES.findIndex((league) => league.id === leagueId));
    const usedNames = new Set(Object.values(progress.rivals).map((rival) => rival?.name).filter(Boolean));
    const availableNames = COMPETITION_ENGINE.RIVAL_NAMES.filter((name) => !usedNames.has(name));
    const name = randomChoice(availableNames.length ? availableNames : COMPETITION_ENGINE.RIVAL_NAMES);
    const archetype = COMPETITION_ENGINE.ARCHETYPES[(leagueIndex + randomInt(0, COMPETITION_ENGINE.ARCHETYPES.length)) % COMPETITION_ENGINE.ARCHETYPES.length];
    const rival = { id: `rival-${leagueId}-${makeId()}`, name, archetype: archetype.id, meetings: 0, playerWins: 0, rivalWins: 0, lastResult: "" };
    progress.rivals[leagueId] = rival;
    saveState();
    return rival;
  }

  function competitionMemberPreview(member, index, rival = false) {
    return `<article class="competition-lineup-member ${rival ? "is-rival" : ""}">
      <span class="lineup-position">${index + 1}</span>
      <button class="competition-pokemon-button" type="button" ${member.uid ? `data-action="pc-summary" data-uid="${escapeHtml(member.uid)}"` : "disabled"}>
        <img src="${escapeHtml(member.sprite)}" alt="" />
        <span><strong>${escapeHtml(member.nickname || member.displayName)}</strong><small>${rival ? (member.types || []).map(titleCase).join(" / ") : `Lv. ${member.level}`}</small></span>
      </button>
      ${rival ? "" : `<span class="lineup-order-controls"><button type="button" data-action="move-competition-team" data-index="${index}" data-direction="-1" ${index === 0 || state.competition?.activeMatch ? "disabled" : ""} aria-label="Move ${escapeHtml(member.nickname || member.displayName)} earlier">↑</button><button type="button" data-action="move-competition-team" data-index="${index}" data-direction="1" ${index === 5 || state.competition?.activeMatch ? "disabled" : ""} aria-label="Move ${escapeHtml(member.nickname || member.displayName)} later">↓</button></span>`}
    </article>`;
  }

  function renderCompetitions() {
    const progress = competitionProgress();
    const team = competitionTeam();
    const unlocked = COMPETITION_ENGINE.unlockedLeagues(progress.peakRating);
    const unlockedIds = new Set(unlocked.map((league) => league.id));
    const selectedLeague = COMPETITION_ENGINE.leagueById(progress.selectedLeague);
    const selectedDifficulty = COMPETITION_ENGINE.difficultyById(progress.selectedDifficulty);
    const rival = getOrCreateCompetitionRival(selectedLeague.id);
    const archetype = COMPETITION_ENGINE.archetypeById(rival.archetype);
    const challenge = progress.challenges[selectedLeague.id] || null;
    const cooldown = competitionCooldownRemaining(selectedLeague.id);
    const fee = COMPETITION_ENGINE.entryFee(selectedLeague.id, selectedDifficulty.id);
    const prize = COMPETITION_ENGINE.prizeRange(selectedLeague.id, selectedDifficulty.id, progress.winStreak);
    const balance = COMPETITION_ENGINE.teamBalance(team);
    const activeMatch = progress.activeMatch;
    const teamStrip = team.length ? team.map((pokemon, index) => competitionMemberPreview(pokemon, index)).join("") : "";
    const leagues = COMPETITION_ENGINE.LEAGUES.map((league) => {
      const unlockedLeague = unlockedIds.has(league.id);
      const selected = selectedLeague.id === league.id;
      return `<button class="competition-option ${selected ? "is-selected" : ""}" type="button" data-action="select-competition-league" data-league-id="${league.id}" ${!unlockedLeague || activeMatch ? "disabled" : ""} aria-pressed="${selected}"><strong>${escapeHtml(league.name)}</strong><small>${unlockedLeague ? `Entry from ₽${league.entryFee}` : `Unlock at ${league.minimumPeakRating} peak rating`}</small></button>`;
    }).join("");
    const difficulties = COMPETITION_ENGINE.DIFFICULTIES.map((difficulty) => {
      const selected = selectedDifficulty.id === difficulty.id;
      return `<button class="competition-option ${selected ? "is-selected" : ""}" type="button" data-action="select-competition-difficulty" data-difficulty-id="${difficulty.id}" ${activeMatch ? "disabled" : ""} aria-pressed="${selected}"><strong>${escapeHtml(difficulty.name)}</strong><small>${escapeHtml(difficulty.description)}</small></button>`;
    }).join("");
    const rivalLineup = challenge ? challenge.members.map((member, index) => competitionMemberPreview(member, index, true)).join("") : "";
    const canEnter = team.length === 6 && challenge && !activeMatch && !isCompetitionRunning && cooldown <= 0 && state.money >= fee;
    const unavailableReason = team.length !== 6 ? "Choose six Pokémon first."
      : !challenge ? "Scout the rival team before entering."
      : activeMatch ? "Finish the current showcase first."
      : cooldown > 0 ? `This class reopens in ${formatShortDuration(cooldown)}.`
      : state.money < fee ? `You need ₽${fee.toLocaleString()} for this entry.`
      : "";
    const contests = CONTEST_STATS.map((stat) => `
      <button class="contest-card paper-panel" type="button" data-action="enter-contest" data-stat="${stat}" ${canEnter ? "" : "disabled"}>
        <span class="contest-glyph" aria-hidden="true">${{ hp: "♥", attack: "⚔", defense: "◆", "special-attack": "✦", "special-defense": "✥", speed: "»" }[stat]}</span>
        <strong>${statLabel(stat)}</strong>
        <small>six ordered head-to-head rounds</small>
      </button>`).join("");
    const latest = state.competitionLog[0];
    view.innerHTML = `
      <section class="archive-page competition-page">
        ${pageHeader("Ranked six-on-six showcases", "Competitions", "Scout a persistent rival, arrange your six, and make a halftime tactical call.", `<div class="competition-rating-stamp"><span>rating</span><b>${progress.rating}</b><small>peak ${progress.peakRating}</small></div>`)}
        ${activeMatch ? `<article class="paper-panel active-showcase-callout"><div><p class="eyebrow">Showcase in progress</p><h2>${escapeHtml(activeMatch.rivalName)} is waiting at halftime</h2><p>Your entry is already recorded. Resume it instead of beginning another contest.</p></div><button class="button button-primary" type="button" data-action="resume-competition">Resume showcase</button></article>` : ""}
        <div class="competition-control-grid">
          <article class="paper-panel competition-control-panel"><p class="eyebrow">League ladder</p><h2>Choose a class</h2><div class="competition-options">${leagues}</div></article>
          <article class="paper-panel competition-control-panel"><p class="eyebrow">Judging pressure</p><h2>Choose difficulty</h2><div class="competition-options">${difficulties}</div></article>
        </div>
        <article class="paper-panel rival-sheet">
          <div class="rival-heading"><div><p class="eyebrow">Persistent rival · ${escapeHtml(selectedLeague.name)}</p><h2>${escapeHtml(rival.name)}</h2><p>${escapeHtml(archetype.name)} — ${escapeHtml(archetype.description)}</p></div><dl><dt>Meetings</dt><dd>${rival.meetings}</dd><dt>Your wins</dt><dd>${rival.playerWins}</dd><dt>Rival wins</dt><dd>${rival.rivalWins}</dd></dl></div>
          ${challenge ? `<div class="competition-lineup rival-lineup">${rivalLineup}</div><p class="ready-mark">✓ scouted lineup is locked until this showcase is completed</p>` : `<div class="rival-unscouted"><p>This rival’s next six have not been scouted. Once revealed, reloading or changing difficulty will not replace them.</p><button class="button button-primary" type="button" data-action="scout-competition-rival" ${isCompetitionScouting || activeMatch ? "disabled" : ""}>${isCompetitionScouting ? "Scouting…" : "Scout rival team"}</button></div>`}
        </article>
        <article class="paper-panel team-sheet competition-team-sheet">
          <div class="panel-label">Your ordered six / ${team.length} of 6</div>
          ${team.length ? `<div class="competition-lineup">${teamStrip}</div>` : '<p class="team-empty">Choose your six from the PC room.</p>'}
          ${team.length !== 6 ? '<button class="button button-primary" type="button" data-tab="pc">Select your six</button>' : `<div class="balance-readout"><strong>${Math.round(balance.bonus * 100)}% balance bonus</strong><span>${balance.typeCount} types · ${balance.roleCount} stat roles${balance.duplicateSpecies ? ` · ${balance.duplicateSpecies} duplicate-species penalty` : ""}</span></div>`}
        </article>
        <article class="paper-panel competition-entry-summary"><div><p class="eyebrow">Current entry</p><h2>${escapeHtml(selectedLeague.name)} · ${escapeHtml(selectedDifficulty.name)}</h2><p>Entry ₽${fee.toLocaleString()} · Prize ₽${prize.minimum.toLocaleString()}–₽${prize.maximum.toLocaleString()} · ${Math.round(selectedLeague.xpPool * selectedDifficulty.prizeMultiplier).toLocaleString()} XP pool</p></div><div class="competition-status" data-competition-cooldown data-cooldown-active="${cooldown > 0}">${cooldown > 0 ? `Reopens in ${formatShortDuration(cooldown)}` : unavailableReason || "Ready for judging"}</div></article>
        <div class="contest-grid">${contests}</div>
        ${unavailableReason ? `<p class="competition-unavailable">${escapeHtml(unavailableReason)}</p>` : ""}
        ${latest ? `<article class="paper-panel latest-result"><p class="eyebrow">Last showcase · ${escapeHtml(COMPETITION_ENGINE.leagueById(latest.leagueId).name)}</p><h2>${escapeHtml(latest.title)}</h2><p>${escapeHtml(latest.summary)}</p><time>${new Date(latest.at).toLocaleString()}</time></article>` : ""}
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

  function renderSettings() {
    const themes = THEME_TEMPLATES.map(([value, label, description]) => `<label class="theme-card ${state.settings.theme === value ? "is-selected" : ""}" data-theme-preview="${value}"><input type="radio" name="theme" value="${value}" ${state.settings.theme === value ? "checked" : ""} /><span class="theme-swatch"></span><span class="theme-card-copy"><b>${label}</b><small>${description}</small><em>easy to read</em></span></label>`).join("");
    const selectedPerformance = normaliseInterfacePerformance(state.settings.interfacePerformance);
    const automaticResult = AUTOMATIC_LOW_POWER_INTERFACE ? "currently chooses low power" : "currently chooses standard";
    const performanceOptions = INTERFACE_PERFORMANCE_OPTIONS.map((option) => {
      const selected = selectedPerformance === option.value;
      const detail = option.value === "automatic" ? `${option.description} This browser ${automaticResult}.` : option.description;
      return `<label class="check-card performance-option ${selected ? "is-selected" : ""}"><input type="radio" name="interface_performance" value="${option.value}" ${selected ? "checked" : ""} /><span><b>${option.label}</b><small>${detail}</small></span></label>`;
    }).join("");
    const devToolsPanel = renderDevSettingsPanel();
    view.innerHTML = `
      <section class="archive-page settings-page">
        ${pageHeader("Hatchery preferences", "Settings", "Adjust the hatchery’s look and check the details written on your first registration card.")}
        <form id="settings-form" class="settings-form">
          <article class="paper-panel settings-section settings-card-compact">
            <p class="eyebrow">Registration card</p><h2>Identity</h2>
            <dl class="static-details"><dt>Name</dt><dd>${escapeHtml(state.player.name)}</dd><dt>Gender</dt><dd>${escapeHtml(genderLabel(state.player.gender))}</dd><dt>Date of birth</dt><dd>${new Date(`${state.player.dob}T12:00:00`).toLocaleDateString()}</dd><dt>Hatchery opened</dt><dd>${new Date(state.player.createdAt).toLocaleDateString()}</dd></dl>
            <p class="settings-copy">Your registration card is part of this save and stays as it was written when the hatchery opened.</p>
          </article>
          <article class="paper-panel settings-section settings-card-compact">
            <p class="eyebrow">Invited regions</p><h2>Egg regions</h2><p class="settings-copy">These regions were chosen when the hatchery opened and are now part of this save.</p>
            <dl class="static-details"><dt>Regions</dt><dd>${escapeHtml(generationSummary())}</dd></dl>
          </article>
          <article class="paper-panel settings-section settings-card-full">
            <p class="eyebrow">Hatchery look</p><h2>Theme</h2><p class="settings-copy">Choose a colour template. Each one is kept readable across the hatchery before it reaches this list.</p><div class="theme-grid">${themes}</div>
          </article>
          <article class="paper-panel settings-section settings-card-medium">
            <p class="eyebrow">Browser workload</p><h2>Interface performance</h2><p class="settings-copy">Choose how much visual and background work this browser should do. The preference is stored in this save.</p><div class="check-grid performance-grid">${performanceOptions}</div>
          </article>
          ${devToolsPanel}
          <div class="settings-actions"><p id="settings-error" class="form-error"></p><button class="button button-primary" type="submit">Save settings</button></div>
        </form>
        <article class="paper-panel settings-section settings-card-medium save-tools-panel">
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
    navButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === activeTab);
    });
    if (activeTab === "home") renderHome();
    else if (activeTab === "pokedex") renderPokedex();
    else if (activeTab === "pc") renderPc();
    else if (activeTab === "bag") renderBag();
    else if (activeTab === "competitions") renderCompetitions();
    else if (activeTab === "mart") renderMart();
    else if (activeTab === "settings") renderSettings();
    else renderPlaceholder(activeTab);
    updateHeader();
    animateRenderedView();
    syncIdleCryTimer();
    showNextEggEventNotice();
    if (focusViewAfterRender) {
      view.focus({ preventScroll: true });
      focusViewAfterRender = false;
    }
  }

  function switchTab(tab) {
    closeModal();
    activeTab = tab;
    focusViewAfterRender = true;
    mobileNav.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    render();
  }

  function millisecondsUntilTomorrow() {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    return tomorrow - new Date();
  }

  function runClockTick(forceMaintenance = false) {
    if (document.hidden && !forceMaintenance) return;
    const now = Date.now();
    if (state.player && state.lastLoginDate !== localDateKey()) applyDailyReward();
    if (forceMaintenance || now - lastMaintenanceAt >= MAINTENANCE_INTERVAL) {
      lastMaintenanceAt = now;
      ensureAllIncubators();
      settleReturnedExpeditions(true);
    }
    incubatorSlots().forEach((slot, index) => {
      if (eggNeedsPreparedEncounterForSlot(slot)) prepareEggForSlot(slot, index);
      if (slot.egg && !eggNeedsPreparedEncounterForSlot(slot) && now >= slot.egg.hatchAt) hatchEggForSlot(index);
    });
    const activeChanged = accrueEncounterExperience();
    if (activeChanged && activeTab === "home") {
      render();
      return;
    }
    if (activeTab === "competitions") { updateCompetitionCooldownDisplay(); return; }
    if (activeTab !== "home") return;
    const hatchCountdown = document.getElementById("hatch-countdown");
    const giftCountdown = document.getElementById("gift-countdown");
    const eggProgress = document.getElementById("egg-progress");
    if (hatchCountdown && state.egg) hatchCountdown.textContent = "incubating";
    if (giftCountdown) giftCountdown.textContent = formatDuration(millisecondsUntilTomorrow());
    if (eggProgress && state.egg) {
      const hatchDuration = Math.max(1, state.egg.hatchDuration || state.egg.hatchAt - state.egg.laidAt);
      eggProgress.style.width = eggNeedsPreparedEncounter() ? "0%" : `${Math.min(100, ((now - state.egg.laidAt) / hatchDuration) * 100)}%`;
    }
  }

  function startClock() {
    window.clearInterval(clockTimer);
    runClockTick(true);
    clockTimer = window.setInterval(runClockTick, 1000);
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
            <div class="button-row"><button class="button button-primary" type="submit">Receive your free first egg</button></div>
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
    grantOpeningEggIfNeeded();
    applyDailyReward();
    saveState();
    modalRoot.innerHTML = "";
    render();
    toast(`Welcome, ${name}. Your first egg is free, warm, and waiting.`);
  }

  function closeModal() {
    clearCatchChallengeTimer();
    catchChallenge = null;
    pendingImportSave = null;
    modalRoot.innerHTML = "";
    window.setTimeout(showNextEggEventNotice, 0);
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
      return `<button class="ball-choice" type="button" data-action="throw-ball" data-ball="${escapeHtml(name)}">${ballMark(name)}<span><strong>${displayBallName(name)}</strong><small>${count} in bag</small></span></button>`;
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

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }

  function buildCatchChallenge(pokemon, ball) {
    const targetCount = catchEngine.targetCount(pokemon, ball);
    const windowSize = catchEngine.windowSize(pokemon, ball);
    const targets = Array.from({ length: targetCount }, (_, index) => ({
      id: makeId(),
      index,
      x: 22 + randomInt(0, 57),
      y: 24 + randomInt(0, 51),
      duration: catchEngine.duration(pokemon, ball, index),
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
      finished: false,
      reducedMotion: prefersReducedMotion() || LOW_POWER_INTERFACE,
      responseWindow: catchEngine.responseWindow(pokemon, ball)
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
      const className = ["rhythm-target", `is-${activeTarget.state}`, catchChallenge.reducedMotion ? "is-reduced-motion" : "", activeTarget.quality ? `quality-${activeTarget.quality}` : ""].filter(Boolean).join(" ");
      const statusLabel = activeTarget.state === "hit" ? "hit" : activeTarget.state === "miss" ? "missed" : isActive ? "tap now" : "waiting";
      const bounds = catchEngine.successBounds(activeTarget.window);
      const style = [
        `--target-x:${activeTarget.x}%`,
        `--target-y:${activeTarget.y}%`,
        `--ring-duration:${activeTarget.duration}ms`,
        `--success-outer-scale:${bounds.outer}`,
        `--success-inner-scale:${bounds.inner}`
      ].join(";");
      return `<button class="${className}" type="button" data-action="catch-target" data-target-id="${escapeHtml(activeTarget.id)}" style="${style}" ${isActive ? "" : "disabled"} aria-label="Catch rhythm target ${activeTarget.index + 1}, ${statusLabel}">
        <span class="rhythm-success-zone" aria-hidden="true"></span>
        <span class="rhythm-inner-limit" aria-hidden="true"></span>
        <span class="rhythm-ring" aria-hidden="true"></span>
        <span class="rhythm-dot" aria-hidden="true"></span>
        <span class="rhythm-status" aria-hidden="true">${activeTarget.state === "hit" ? "✓" : activeTarget.state === "miss" ? "×" : catchChallenge.reducedMotion && isActive ? "tap now" : activeTarget.index + 1}</span>
      </button>`;
    })() : "";
    modalRoot.innerHTML = `
      <div class="modal-backdrop rhythm-backdrop">
        <section class="modal paper-panel rhythm-modal" role="dialog" aria-modal="true" aria-labelledby="rhythm-title">
          <p class="eyebrow">${escapeHtml(ballName)} throw</p><h2 id="rhythm-title">Match the rings</h2>
          <p class="modal-intro">${catchChallenge.reducedMotion ? "One target appears at a time. Wait for the clear ‘tap now’ prompt, then press the target before it closes." : "One dot appears at a time. Tap while the moving ring is inside the marked safe zone. One imperfect wobble is allowed."}</p>
          <div class="rhythm-stage" aria-live="polite">${targetMarkup}</div>
          <div class="rhythm-progress" aria-label="Catch rhythm progress">
            ${catchChallenge.targets.map((target, index) => `<span class="${target.state === "hit" ? "is-hit" : target.state === "miss" ? "is-miss" : index === catchChallenge.activeIndex ? "is-active" : ""}"></span>`).join("")}
          </div>
          <p class="passive-note">${activeTarget ? `Target ${activeTarget.index + 1} of ${catchChallenge.targets.length}` : "One last shake…"}</p>
        </section>
      </div>`;
  }

  function focusActiveCatchTarget() {
    window.requestAnimationFrame(() => {
      const targetButton = modalRoot.querySelector('[data-action="catch-target"]:not([disabled])');
      if (targetButton instanceof HTMLElement) targetButton.focus({ preventScroll: true });
    });
  }

  function activateCatchTarget() {
    clearCatchChallengeTimer();
    if (!catchChallenge || catchChallenge.finished) return;
    const target = catchChallenge.targets[catchChallenge.activeIndex];
    if (!target) {
      resolveCatchChallenge();
      return;
    }
    if (catchChallenge.reducedMotion) {
      target.state = "waiting";
      renderCatchChallenge();
      const targetId = target.id;
      catchChallengeTimer = window.setTimeout(() => {
        if (!catchChallenge || catchChallenge.finished) return;
        const current = catchChallenge.targets[catchChallenge.activeIndex];
        if (!current || current.id !== targetId) return;
        current.state = "active";
        current.startedAt = performance.now();
        renderCatchChallenge();
        focusActiveCatchTarget();
        catchChallengeTimer = window.setTimeout(() => missCatchTarget(targetId), catchChallenge.responseWindow);
      }, randomInt(650, 1250));
      return;
    }
    target.state = "active";
    target.startedAt = performance.now();
    renderCatchChallenge();
    focusActiveCatchTarget();
    catchChallengeTimer = window.setTimeout(() => missCatchTarget(target.id), target.duration + 60);
  }

  function advanceCatchTarget() {
    if (!catchChallenge || catchChallenge.finished) return;
    catchChallenge.activeIndex += 1;
    if (catchChallenge.activeIndex >= catchChallenge.targets.length) {
      resolveCatchChallenge();
      return;
    }
    window.setTimeout(activateCatchTarget, catchChallenge.reducedMotion ? 480 : 260);
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
    const quality = catchChallenge.reducedMotion
      ? { hit: true, label: "perfect" }
      : catchEngine.quality(performance.now() - target.startedAt, target.duration, target.window);
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
    const autoPlacedEggs = clearActiveEncounter();
    state.statistics.pokemonCaught += 1;
    shopItems = null;
    saveState();
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel catch-result" role="dialog" aria-modal="true" aria-labelledby="catch-title">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p><h2 id="catch-title">${escapeHtml(heading)}</h2>
        <img class="result-sprite" src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.displayName)}" />
        <p class="modal-intro">${escapeHtml(pokemon.displayName)} is safe in the PC room. ${autoPlacedEggs > 0 ? "A prepaid egg moved straight into the incubator and is already incubating." : "The incubator cushion is ready whenever you want to buy the next egg."}</p>
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
    const ball = catchChallenge.ball;
    const hits = catchChallenge.hits;
    const total = catchChallenge.targets.length;
    const requiredHits = catchEngine.requiredHits(pokemon, ball);
    const caught = hits >= requiredHits;
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
        <p class="modal-intro">The ball danced for a moment, then popped open. Match at least ${requiredHits} of ${total} rings, and ${escapeHtml(pokemon.displayName)} may stay.</p>
        <div class="button-row"><button class="button button-primary" type="button" data-action="choose-ball">Try another ball</button><button class="button" type="button" data-close-modal>Keep watching</button></div>
      </section></div>`;
    render();
  }

  function catchChallengeResultMarks(hits, total) {
    return Array.from({ length: Math.max(1, total) }, (_, index) => `<span class="${index < hits ? "is-filled" : ""}"></span>`).join("");
  }

  function catchEncounter(ball) {
    const pokemon = state.encounter;
    if (!pokemon || !CATCH_BALL_IDS.has(ball) || (state.inventory[ball] || 0) <= 0) return;
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
    const autoPlacedEggs = clearActiveEncounter();
    saveState();
    modalRoot.innerHTML = "";
    render();
    toast(`${name} wandered off safely. Thank-you gift: +₽${reward}.${autoPlacedEggs > 0 ? " A prepaid egg was loaded automatically." : ""}`);
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
        <form id="nickname-form" class="nickname-form" data-uid="${escapeHtml(pokemon.uid)}"><div class="field"><label for="nickname">Nickname</label><input id="nickname" name="nickname" maxlength="16" value="${escapeHtml(pokemon.nickname || "")}" placeholder="Use their species name" /></div><button class="button" type="submit">Save nickname</button></form>
        <dl class="summary-list two-column"><dt>Ability</dt><dd>${escapeHtml(titleCase(pokemon.ability))}${pokemon.hiddenAbility ? " · hidden" : ""}</dd><dt>Types</dt><dd>${pokemon.types.map((type) => escapeHtml(titleCase(type))).join(" / ")}</dd><dt>Growth</dt><dd>${pokemon.experience.toLocaleString()} XP</dd><dt>Training</dt><dd>${trainingCopy}</dd><dt>Caught with</dt><dd>${displayBallName(pokemon.caughtWith)}</dd><dt>Favourite</dt><dd>${pokemon.favorite ? "yes" : "not yet"}</dd><dt>Partner</dt><dd>${state.partnerUid === pokemon.uid ? "keeping watch" : "not currently"}</dd><dt>First friend</dt><dd>${escapeHtml(pokemon.ot)}</dd><dt>Hatched on</dt><dd>${new Date(pokemon.encounteredAt).toLocaleString()}</dd><dt>Joined PC</dt><dd>${new Date(pokemon.caughtAt).toLocaleString()}</dd></dl>
        <table class="stat-table"><thead><tr><th>Stat</th><th>Current</th><th>Berry points</th></tr></thead><tbody>${stats}</tbody></table>
        ${evolutionNotes ? `<div class="evolution-notes"><p class="eyebrow">Evolution memories</p><ul>${evolutionNotes}</ul></div>` : ""}
        <div class="button-row">
          <button class="button" type="button" data-action="toggle-favorite" data-uid="${escapeHtml(pokemon.uid)}">${pokemon.favorite ? "Remove favourite" : "Mark favourite"}</button>
          <button class="button" type="button" data-action="toggle-partner" data-uid="${escapeHtml(pokemon.uid)}">${state.partnerUid === pokemon.uid ? "Rest partner" : "Set as partner"}</button>
          <button class="button" type="button" data-action="open-expedition" data-uid="${escapeHtml(pokemon.uid)}">Send exploring</button>
          <button class="button button-primary" type="button" data-close-modal>Close card</button>
        </div>
      </section></div>`;
  }

  function toggleTeam(uid) {
    if (competitionProgress().activeMatch) { toast("Finish the active showcase before changing its registered six."); return; }
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
    closeModal();
    if (activeTab === "bag") renderBag();
    if (activeTab === "pc") renderPc();
    toast(`${pokemon.nickname || pokemon.displayName} enjoyed ${item.displayName}: ${applied.join(", ")}.`);
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
    toast(`Sold ${amount} ${item.displayName}${amount === 1 ? "" : "s"} for ₽${payout.toLocaleString()}.`);
  }

  function showExpeditionChooser(uid) {
    if (competitionProgress().activeMatch) {
      toast("Finish the active showcase before sending one of its registered Pokémon away.");
      return;
    }
    const pokemon = state.pc.find((entry) => entry.uid === uid);
    if (!pokemon || activeExpeditionForPokemon(uid)) return;
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
        <p class="modal-intro">They will leave the PC for 2.5–12 hours, then return with XP, berries, Poké Balls, money, and harmless keepsakes. The exact return time stays hidden.</p>
        <div class="location-grid">${locationCards}</div>
        <div class="button-row"><button class="button" type="button" data-close-modal>Keep them home</button></div>
      </section></div>`;
  }

  function startExpedition(uid, locationId) {
    if (competitionProgress().activeMatch) {
      toast("Finish the active showcase before changing the registered team.");
      return;
    }
    const index = state.pc.findIndex((entry) => entry.uid === uid);
    const location = expeditionLocation(locationId);
    if (index < 0 || !location || !enabledGenerationNumbers().includes(location.generation)) return;
    const [pokemon] = state.pc.splice(index, 1);
    const durationMs = expeditionDuration();
    state.team = state.team.filter((id) => id !== uid);
    if (state.partnerUid === uid) state.partnerUid = "";
    state.expeditions.push({
      id: makeId(), pokemon, locationId: location.id, locationName: location.displayName,
      region: location.region, generation: location.generation, startedAt: Date.now(),
      returnAt: Date.now() + durationMs, durationMs
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

  function isBulkPurchaseItem(item) {
    return item?.consumable === true && item?.stackable === true && item?.unique !== true;
  }

  function affordableShopQuantity(item) {
    if (!item) return 0;
    if (isDevToolEnabled("freeShop")) return MAX_BULK_PURCHASE;
    if (item.cost <= 0) return MAX_BULK_PURCHASE;
    return Math.min(MAX_BULK_PURCHASE, Math.max(0, Math.floor(state.money / item.cost)));
  }

  function showShopQuantityDialog(itemId) {
    const item = shopItems?.find((entry) => entry.id === itemId) || shopItemDefinition(itemId);
    if (!item || !isBulkPurchaseItem(item)) {
      buyShopItem(itemId, 1);
      return;
    }
    const maximum = affordableShopQuantity(item);
    if (maximum < 1) {
      toast("You are a few Pokédollars short for that.");
      return;
    }
    const freePurchase = isDevToolEnabled("freeShop");
    const unitPrice = freePurchase ? "FREE" : `₽${item.cost.toLocaleString()}`;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
        <p class="eyebrow">Pokémart order</p><h2 id="purchase-title">How many ${escapeHtml(item.displayName)}?</h2>
        <p class="modal-intro">Choose a quantity from 1 to ${maximum.toLocaleString()}. Each one costs ${unitPrice}.</p>
        <form id="shop-purchase-form" data-item-id="${escapeHtml(item.id)}" class="form-grid">
          <div class="field"><label for="purchase-quantity">Quantity</label><input id="purchase-quantity" name="quantity" type="number" min="1" max="${maximum}" step="1" value="1" inputmode="numeric" required /></div>
          <dl class="summary-list"><dt>In bag</dt><dd>${(item.category === "ball" ? Number(state.inventory[item.id] || 0) : itemCount(item.id)).toLocaleString()}</dd><dt>Unit price</dt><dd>${unitPrice}</dd><dt>Total</dt><dd id="purchase-total">${freePurchase ? "FREE" : `₽${item.cost.toLocaleString()}`}</dd><dt>Wallet</dt><dd>₽${state.money.toLocaleString()}</dd></dl>
          <div class="button-row"><button class="button button-primary" type="submit">Buy selected quantity</button><button class="button" type="button" data-close-modal>Cancel</button></div>
        </form>
      </section></div>`;
  }

  function buyShopItem(itemId, requestedQuantity = 1) {
    const item = shopItems?.find((entry) => entry.id === itemId) || shopItemDefinition(itemId);
    const freePurchase = isDevToolEnabled("freeShop");
    if (!item || (item.unique && (item.category === "ball" ? state.inventory[item.id] > 0 : itemCount(item.id) > 0))) {
      toast("That one is already tucked safely away.");
      return;
    }
    const quantity = isBulkPurchaseItem(item)
      ? Math.min(MAX_BULK_PURCHASE, Math.max(1, Math.floor(Number(requestedQuantity) || 1)))
      : 1;
    const totalCost = item.cost * quantity;
    if (!freePurchase && state.money < totalCost) {
      toast("You are a few Pokédollars short for that.");
      return;
    }
    if (!freePurchase) state.money -= totalCost;
    let bonusMessage = "";
    let autoPlacedEggs = 0;
    if (item.id === "incubator-upgrade") {
      if (!upgradeIncubatorCapacity()) {
        if (!freePurchase) state.money += totalCost;
        toast("Every incubator cushion is already humming.");
        return;
      }
      ensureAllIncubators();
      saveState();
      shopItems = null;
      modalRoot.innerHTML = "";
      render();
      toast(`A new incubator cushion is humming. You now have ${incubatorCapacity()} egg slots.`);
      return;
    }
    if (item.category === "ball") {
      state.inventory[item.id] = (state.inventory[item.id] || 0) + quantity;
      if (item.id === "poke-ball") {
        const previousTotal = Number(state.statistics.pokeBallsBought || 0);
        const nextTotal = previousTotal + quantity;
        const premierBonus = Math.floor(nextTotal / 10) - Math.floor(previousTotal / 10);
        state.statistics.pokeBallsBought = nextTotal;
        if (premierBonus > 0) {
          state.inventory["premier-ball"] = (state.inventory["premier-ball"] || 0) + premierBonus;
          bonusMessage = ` ${premierBonus.toLocaleString()} surprise Premier Ball${premierBonus === 1 ? " was" : "s were"} tucked in too.`;
        }
      }
    } else {
      addItemToBag(item.id, quantity);
      if (item.id === PREPAID_EGG_ITEM_ID) autoPlacedEggs = autoPlacePrepaidEggs();
    }
    saveState();
    shopItems = null;
    modalRoot.innerHTML = "";
    render();
    if (item.id === PREPAID_EGG_ITEM_ID && autoPlacedEggs > 0) {
      const remaining = itemCount(PREPAID_EGG_ITEM_ID);
      toast(`${quantity.toLocaleString()} ${item.displayName}${quantity === 1 ? "" : "s"} purchased. ${autoPlacedEggs.toLocaleString()} loaded automatically; ${remaining.toLocaleString()} remain in the field bag.`);
    } else {
      toast(`${quantity.toLocaleString()} ${item.displayName}${quantity === 1 ? "" : "s"} tucked into the field bag.${bonusMessage}`);
    }
  }

  function useBagItem(itemId) {
    const item = shopItemDefinition(itemId);
    if (!item || itemCount(itemId) <= 0) return;
    if (item.category === "berry") {
      showBerryTargetChooser(itemId);
      return;
    }
    if (itemId === "shiny-charm") {
      setItemCount(itemId, itemCount(itemId) - 1);
      state.activeItemEffects.shinyCharmEggsRemaining = activeShinyCharmCharges() + 10;
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

  async function createCompetitionCandidate(reference) {
    const id = resourceId(reference.url);
    if (!id) throw new Error("The rival selected an unknown species.");
    const [pokemon, species] = await Promise.all([apiFetch(`pokemon/${id}`), apiFetch(reference.url)]);
    const sprites = getPokemonSprites(pokemon);
    return {
      uid: `rival-preview-${id}-${makeId()}`,
      speciesId: species.id,
      displayName: englishName(species, species.name),
      sprite: sprites.normal,
      shiny: false,
      types: pokemon.types.map((entry) => entry.type.name),
      baseStats: mapBaseStats(pokemon),
      ivs: Object.fromEntries(CONTEST_STATS.map((stat) => [stat, 0])),
      level: 1
    };
  }

  function showCompetitionLoading(title, copy) {
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel catch-result" role="dialog" aria-modal="true" aria-labelledby="judging-title">
        <p class="eyebrow">Competition office</p><h2 id="judging-title">${escapeHtml(title)}</h2><p class="modal-intro">${escapeHtml(copy)}</p><span class="loading-line"></span>
      </section></div>`;
  }

  async function scoutCompetitionRival() {
    const progress = competitionProgress();
    const league = COMPETITION_ENGINE.leagueById(progress.selectedLeague);
    if (progress.activeMatch || progress.challenges[league.id] || isCompetitionScouting) return;
    isCompetitionScouting = true;
    renderCompetitions();
    showCompetitionLoading("Scouting the visiting team…", "The field notes are checking a bounded set of candidates. This lineup will remain fixed once revealed.");
    try {
      const rival = getOrCreateCompetitionRival(league.id);
      const references = await getEnabledSpeciesReferences();
      if (references.length < 6) throw new Error("At least six enabled species are required for a rival team.");
      const used = new Set();
      const candidates = [];
      const targetCandidates = Math.min(24, references.length);
      for (let attempt = 0; attempt < 3 && candidates.length < Math.min(12, targetCandidates); attempt += 1) {
        const batch = [];
        while (batch.length < 8 && used.size < references.length && used.size < targetCandidates) {
          const reference = randomChoice(references);
          const id = resourceId(reference.url);
          if (!id || used.has(id)) continue;
          used.add(id);
          batch.push(reference);
        }
        const results = await Promise.allSettled(batch.map(createCompetitionCandidate));
        for (const result of results) if (result.status === "fulfilled") candidates.push(result.value);
      }
      if (candidates.length < 6) throw new Error("The rival could not assemble six available Pokémon after three scouting attempts.");
      const members = candidates
        .sort((left, right) => COMPETITION_ENGINE.candidateScore(right, rival.archetype) - COMPETITION_ENGINE.candidateScore(left, rival.archetype))
        .slice(0, 6);
      progress.challenges[league.id] = { id: `challenge-${league.id}-${makeId()}`, rivalId: rival.id, archetype: rival.archetype, generatedAt: new Date().toISOString(), members };
      saveState();
      closeModal();
      toast(`${rival.name}’s six are now fixed for this showcase.`);
    } catch (error) {
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="scout-error"><p class="eyebrow">Scouting failed</p><h2 id="scout-error">The rival team could not be recorded</h2><p class="modal-intro">${escapeHtml(error?.message || "The visiting records were unavailable.")}</p><button class="button button-primary" type="button" data-close-modal>Back</button></section></div>`;
    } finally {
      isCompetitionScouting = false;
      if (activeTab === "competitions") renderCompetitions();
    }
  }

  function selectCompetitionLeague(leagueId) {
    const progress = competitionProgress();
    if (progress.activeMatch) return;
    const unlocked = COMPETITION_ENGINE.unlockedLeagues(progress.peakRating);
    if (!unlocked.some((league) => league.id === leagueId)) return;
    progress.selectedLeague = leagueId;
    getOrCreateCompetitionRival(leagueId);
    saveState();
    renderCompetitions();
  }

  function selectCompetitionDifficulty(difficultyId) {
    const progress = competitionProgress();
    if (progress.activeMatch || !COMPETITION_ENGINE.DIFFICULTIES.some((difficulty) => difficulty.id === difficultyId)) return;
    progress.selectedDifficulty = difficultyId;
    saveState();
    renderCompetitions();
  }

  function moveCompetitionTeam(indexValue, directionValue) {
    const progress = competitionProgress();
    if (progress.activeMatch) return;
    const index = Number(indexValue);
    const direction = Number(directionValue);
    const target = index + direction;
    if (!Number.isInteger(index) || ![-1, 1].includes(direction) || target < 0 || target >= state.team.length) return;
    [state.team[index], state.team[target]] = [state.team[target], state.team[index]];
    saveState();
    renderCompetitions();
  }

  function showCompetitionEntryConfirmation(stat) {
    if (!CONTEST_STATS.includes(stat) || isCompetitionRunning) return;
    const progress = competitionProgress();
    const team = competitionTeam();
    const league = COMPETITION_ENGINE.leagueById(progress.selectedLeague);
    const difficulty = COMPETITION_ENGINE.difficultyById(progress.selectedDifficulty);
    const rival = getOrCreateCompetitionRival(league.id);
    const challenge = progress.challenges[league.id];
    const fee = COMPETITION_ENGINE.entryFee(league.id, difficulty.id);
    const prize = COMPETITION_ENGINE.prizeRange(league.id, difficulty.id, progress.winStreak);
    const cooldown = competitionCooldownRemaining(league.id);
    if (team.length !== 6) return toast("Choose six Pokémon before entering a showcase.");
    if (!challenge) return toast("Scout the rival team before entering.");
    if (progress.activeMatch) return showCompetitionHalftime();
    if (cooldown > 0) return toast(`${league.name} reopens in ${formatShortDuration(cooldown)}.`);
    if (state.money < fee) return toast(`You need ₽${fee.toLocaleString()} for this entry.`);
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="entry-title">
        <p class="eyebrow">${escapeHtml(league.name)} · ${escapeHtml(difficulty.name)}</p><h2 id="entry-title">Enter the ${escapeHtml(statLabel(stat))} showcase?</h2>
        <p class="modal-intro">Your ordered six will face ${escapeHtml(rival.name)} in six head-to-head rounds. After round three, you will choose the team’s finishing tactic.</p>
        <dl class="summary-list two-column"><dt>Entry fee</dt><dd>₽${fee.toLocaleString()}</dd><dt>Prize range</dt><dd>₽${prize.minimum.toLocaleString()}–₽${prize.maximum.toLocaleString()}</dd><dt>Cooldown</dt><dd>${formatShortDuration(COMPETITION_ENGINE.cooldownDuration(league.id))}</dd><dt>Current rating</dt><dd>${progress.rating}</dd></dl>
        <div class="button-row"><button class="button button-primary" type="button" data-action="confirm-enter-contest" data-stat="${stat}">Pay and begin</button><button class="button" type="button" data-close-modal>Review lineup</button></div>
      </section></div>`;
  }

  function competitionSnapshot(pokemon) {
    return {
      uid: pokemon.uid || makeId(),
      speciesId: pokemon.speciesId,
      displayName: pokemon.displayName,
      nickname: pokemon.nickname || "",
      sprite: pokemon.sprite,
      shiny: pokemon.shiny === true,
      types: [...(pokemon.types || [])],
      baseStats: { ...(pokemon.baseStats || {}) },
      ivs: { ...(pokemon.ivs || {}) },
      level: pokemon.level
    };
  }

  function npcCompetitionSnapshot(member, level, difficulty) {
    return {
      ...competitionSnapshot(member),
      uid: `rival-${member.speciesId}-${makeId()}`,
      ivs: Object.fromEntries(CONTEST_STATS.map((stat) => [stat, randomInt(difficulty.ivMin, difficulty.ivMax)])),
      level
    };
  }

  function buildCompetitionRound(match, index, tacticMultiplier = 1) {
    const archetype = COMPETITION_ENGINE.archetypeById(match.archetype);
    const variance = match.roundVariances[index];
    const result = COMPETITION_ENGINE.scoreRound({
      playerValue: statValue(match.playerTeam[index], match.stat),
      rivalValue: statValue(match.rivalTeam[index], match.stat),
      playerBalance: match.playerBalance,
      rivalBalance: match.rivalBalance,
      playerTacticMultiplier: tacticMultiplier,
      playerVariance: variance.player,
      rivalVariance: variance.rival,
      rivalStrength: COMPETITION_ENGINE.rivalStrength(match.leagueId, match.difficultyId),
      rivalSpecialtyMultiplier: archetype.specialty === match.stat ? 1.04 : 1
    });
    return { index, ...result, playerVariance: variance.player, rivalVariance: variance.rival };
  }

  function competitionRoundMarkup(match, rounds) {
    return rounds.map((round) => {
      const player = match.playerTeam[round.index];
      const rival = match.rivalTeam[round.index];
      return `<article class="competition-round ${round.winner === "player" ? "is-player-win" : round.winner === "rival" ? "is-rival-win" : "is-tie"}"><span>Round ${round.index + 1}</span><div><img src="${escapeHtml(player.sprite)}" alt="" /><strong>${escapeHtml(player.nickname || player.displayName)}</strong><b>${round.playerScore}</b></div><em>${round.winner === "tie" ? "TIE" : round.winner === "player" ? "WIN" : "LOSS"}</em><div><img src="${escapeHtml(rival.sprite)}" alt="" /><strong>${escapeHtml(rival.displayName)}</strong><b>${round.rivalScore}</b></div></article>`;
    }).join("");
  }

  function showCompetitionHalftime() {
    const match = competitionProgress().activeMatch;
    if (!match) return;
    const summary = COMPETITION_ENGINE.summariseRounds(match.firstHalf);
    const status = summary.playerWins === summary.rivalWins ? "The showcase is level" : summary.playerWins > summary.rivalWins ? "Your team leads" : `${match.rivalName} leads`;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel competition-result" role="dialog" aria-modal="true" aria-labelledby="halftime-title">
        <p class="eyebrow">${escapeHtml(statLabel(match.stat))} showcase · halftime</p><h2 id="halftime-title">${escapeHtml(status)}</h2>
        <div class="scoreboard"><div><span>Your rounds</span><strong>${summary.playerWins}</strong></div><b>HALF</b><div><span>Rival rounds</span><strong>${summary.rivalWins}</strong></div></div>
        <div class="competition-rounds">${competitionRoundMarkup(match, match.firstHalf)}</div>
        <section class="tactic-picker"><p class="eyebrow">Captain’s decision</p><h3>How should the final three perform?</h3><div>${COMPETITION_ENGINE.TACTICS.map((tactic) => `<button class="tactic-button" type="button" data-action="competition-tactic" data-tactic-id="${tactic.id}"><strong>${escapeHtml(tactic.name)}</strong><small>${escapeHtml(tactic.description)}</small></button>`).join("")}</div></section>
      </section></div>`;
  }

  function startCompetition(stat) {
    if (!CONTEST_STATS.includes(stat) || isCompetitionRunning) return;
    const progress = competitionProgress();
    const team = competitionTeam();
    const league = COMPETITION_ENGINE.leagueById(progress.selectedLeague);
    const difficulty = COMPETITION_ENGINE.difficultyById(progress.selectedDifficulty);
    const rival = getOrCreateCompetitionRival(league.id);
    const challenge = progress.challenges[league.id];
    const fee = COMPETITION_ENGINE.entryFee(league.id, difficulty.id);
    if (progress.activeMatch) return showCompetitionHalftime();
    if (team.length !== 6 || !challenge || competitionCooldownRemaining(league.id) > 0 || state.money < fee) {
      closeModal();
      renderCompetitions();
      return;
    }
    const averageLevel = Math.max(1, Math.round(team.reduce((total, pokemon) => total + pokemon.level, 0) / team.length));
    const rivalLevel = COMPETITION_ENGINE.opponentLevel(averageLevel, league.id, difficulty.id, rival.meetings);
    const playerTeam = team.map(competitionSnapshot);
    const rivalTeam = challenge.members.map((member) => npcCompetitionSnapshot(member, rivalLevel, difficulty));
    const playerBalance = COMPETITION_ENGINE.teamBalance(playerTeam).bonus;
    const rivalBalance = COMPETITION_ENGINE.teamBalance(rivalTeam).bonus;
    const roundVariances = Array.from({ length: 6 }, () => ({ player: 0.97 + randomInt(0, 61) / 1000, rival: 0.97 + randomInt(0, 61) / 1000 }));
    const match = {
      id: `match-${makeId()}`,
      stat,
      leagueId: league.id,
      difficultyId: difficulty.id,
      rivalId: rival.id,
      rivalName: rival.name,
      archetype: rival.archetype,
      startedAt: new Date().toISOString(),
      entryFee: fee,
      playerBalance,
      rivalBalance,
      playerTeam,
      rivalTeam,
      firstHalf: [],
      roundVariances
    };
    match.firstHalf = [0, 1, 2].map((index) => buildCompetitionRound(match, index, 1));
    state.money -= fee;
    progress.cooldowns[league.id] = Date.now() + COMPETITION_ENGINE.cooldownDuration(league.id);
    progress.totalEntries += 1;
    progress.activeMatch = match;
    saveState();
    renderStatus();
    showCompetitionHalftime();
  }

  async function finishCompetition(tacticId) {
    const progress = competitionProgress();
    const match = progress.activeMatch;
    if (!match || isCompetitionRunning || !COMPETITION_ENGINE.TACTICS.some((tactic) => tactic.id === tacticId)) return;
    isCompetitionRunning = true;
    const halftime = COMPETITION_ENGINE.summariseRounds(match.firstHalf);
    const tacticMultipliers = COMPETITION_ENGINE.tacticMultipliers(tacticId, halftime.playerWins < halftime.rivalWins);
    const finalRounds = [3, 4, 5].map((index, tacticIndex) => buildCompetitionRound(match, index, tacticMultipliers[tacticIndex]));
    const rounds = [...match.firstHalf, ...finalRounds];
    const result = COMPETITION_ENGINE.decideWinner(rounds, isDevToolEnabled("alwaysWinContests"));
    const league = COMPETITION_ENGINE.leagueById(match.leagueId);
    const difficulty = COMPETITION_ENGINE.difficultyById(match.difficultyId);
    const tactic = COMPETITION_ENGINE.tacticById(tacticId);
    const rival = progress.rivals[match.leagueId] || getOrCreateCompetitionRival(match.leagueId);
    const previousHighestLeague = COMPETITION_ENGINE.highestUnlockedLeague(progress.peakRating).id;
    const prizeRange = COMPETITION_ENGINE.prizeRange(match.leagueId, match.difficultyId, progress.winStreak);
    const moneyAward = result.playerWon ? randomInt(prizeRange.minimum, prizeRange.maximum + 1) : 0;
    const ratingDelta = COMPETITION_ENGINE.ratingChange({ playerRating: progress.rating, leagueId: match.leagueId, difficultyId: match.difficultyId, playerWon: result.playerWon });
    progress.rating = Math.max(100, Math.min(5000, progress.rating + ratingDelta));
    progress.peakRating = Math.max(progress.peakRating, progress.rating);
    progress.winStreak = result.playerWon ? progress.winStreak + 1 : 0;
    state.money += moneyAward;
    rival.meetings += 1;
    rival.lastResult = result.playerWon ? "player" : "rival";
    if (result.playerWon) {
      rival.playerWins += 1;
      state.statistics.competitionsWon += 1;
    } else rival.rivalWins += 1;
    delete progress.challenges[match.leagueId];
    progress.activeMatch = null;
    const title = result.playerWon ? `${statLabel(match.stat)} showcase won` : `${statLabel(match.stat)} showcase lost`;
    const summaryText = `Rounds ${result.playerWins}–${result.rivalWins}; judging totals ${result.playerTotal}–${result.rivalTotal} against ${match.rivalName}.`;
    state.competitionLog.unshift({ title, summary: summaryText, stat: match.stat, leagueId: match.leagueId, difficultyId: match.difficultyId, rivalName: match.rivalName, playerTotal: result.playerTotal, npcTotal: result.rivalTotal, playerRoundWins: result.playerWins, npcRoundWins: result.rivalWins, moneyAward, ratingDelta, won: result.playerWon, at: new Date().toISOString() });
    state.competitionLog = state.competitionLog.slice(0, 30);
    saveState();

    showCompetitionLoading("The judges are filing the final notes…", "Experience, prize money, rivalry records, and rating changes are being written safely into the save.");
    const awards = [];
    const evolutionMessages = [];
    const xpPool = Math.max(60, Math.round(league.xpPool * difficulty.prizeMultiplier * (result.playerWon ? 1 : 0.25)));
    const playerValues = match.playerTeam.map((pokemon) => statValue(pokemon, match.stat));
    const inverseWeights = playerValues.map((value) => 1 / Math.max(1, value));
    const weightTotal = inverseWeights.reduce((total, value) => total + value, 0);
    const amounts = inverseWeights.map((weight) => Math.max(1, Math.floor(xpPool * (weight / weightTotal))));
    for (let index = 0; index < match.playerTeam.length; index += 1) {
      const currentPokemon = state.pc.find((pokemon) => pokemon.uid === match.playerTeam[index].uid);
      if (!currentPokemon) continue;
      const oldLevel = currentPokemon.level;
      try {
        const experienceResult = await addExperience(currentPokemon, amounts[index]);
        awards.push({ pokemon: currentPokemon, amount: amounts[index], leveled: experienceResult.newLevel > experienceResult.oldLevel });
        evolutionMessages.push(...experienceResult.evolutions);
      } catch {
        awards.push({ pokemon: currentPokemon, amount: amounts[index], leveled: currentPokemon.level > oldLevel });
      }
    }
    saveState();
    renderStatus();
    const newlyUnlockedLeague = COMPETITION_ENGINE.highestUnlockedLeague(progress.peakRating);
    const unlockedCallout = newlyUnlockedLeague.id !== previousHighestLeague ? `<strong class="evolution-callout">${escapeHtml(newlyUnlockedLeague.name)} unlocked!</strong>` : "";
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel competition-result" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <p class="eyebrow">${escapeHtml(league.name)} · ${escapeHtml(difficulty.name)} · ${escapeHtml(tactic.name)}</p><h2 id="result-title">${result.playerWon ? "Your team takes the showcase" : `${escapeHtml(match.rivalName)} takes the showcase`}</h2>
        <div class="scoreboard"><div><span>Your rounds</span><strong>${result.playerWins}</strong></div><b>${result.playerWon ? "WIN" : "LOSS"}</b><div><span>Rival rounds</span><strong>${result.rivalWins}</strong></div></div>
        <div class="competition-rounds">${competitionRoundMarkup(match, rounds)}</div>
        <dl class="summary-list two-column"><dt>Judge totals</dt><dd>${result.playerTotal}–${result.rivalTotal}</dd><dt>Rating</dt><dd>${progress.rating} (${ratingDelta >= 0 ? "+" : ""}${ratingDelta})</dd><dt>Prize</dt><dd>${moneyAward ? `₽${moneyAward.toLocaleString()}` : "No Pokédollars"}</dd><dt>Win streak</dt><dd>${progress.winStreak}</dd></dl>
        <div class="xp-awards"><p class="eyebrow">Team experience</p>${awards.map((award) => `<span><img src="${escapeHtml(award.pokemon.sprite)}" alt="" /><b>${escapeHtml(award.pokemon.nickname || award.pokemon.displayName)}</b> +${award.amount} XP${award.leveled ? ` · Lv. ${award.pokemon.level}` : ""}</span>`).join("")}${evolutionMessages.map((message) => `<strong class="evolution-callout">${escapeHtml(message)}!</strong>`).join("")}${unlockedCallout}</div>
        <p class="modal-intro">${escapeHtml(match.rivalName)} remains your ${escapeHtml(league.name)} rival, but their next lineup must be scouted again.</p>
        <button class="button button-primary" type="button" data-close-modal>Close showcase</button>
      </section></div>`;
    isCompetitionRunning = false;
    if (activeTab === "competitions") renderCompetitions();
  }
  async function addDevPokemonToPc(count) {
    for (let index = 0; index < count; index += 1) {
      const pokemon = await chooseWeightedEncounter();
      pokemon.caughtAt = new Date().toISOString();
      pokemon.ot = state.player.name;
      pokemon.caughtWith = "master-ball";
      state.pc.push(pokemon);
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
      if (item.id === "master-ball" || item.category === "mystery") continue;
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
    const slot = activeIncubatorSlot();
    slot.egg = createEgg(Date.now(), false, id);
    slot.encounter = null;
    syncLegacyFromActiveIncubator();
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
    const slot = activeIncubatorSlot();
    slot.encounter = encounter;
    slot.egg = null;
    syncLegacyFromActiveIncubator();
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
          sprite: `${DEFAULT_SPRITE_ROOT}/${speciesId}.png`,
          shinySprite: `${DEFAULT_SPRITE_ROOT}/shiny/${speciesId}.png`,
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
        const slot = activeIncubatorSlot();
        slot.encounter = null;
        slot.egg = createEgg(laidAt, false);
        syncLegacyFromActiveIncubator();
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
        clearActiveEncounter();
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
        state.competition = JSON.parse(JSON.stringify(DEFAULT_STATE.competition));
        saveState();
        render();
        toast("Competition ladder, rivals, cooldowns, and showcase notes reset.");
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
    state.settings.interfacePerformance = normaliseInterfacePerformance(String(form.get("interface_performance") || "automatic"));
    applyInterfacePerformance(true);
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

  async function resetProgress() {
    if (resetInProgress) return;
    resetInProgress = true;
    clearCatchChallengeTimer();
    clearIdleCryTimer();
    window.clearInterval(clockTimer);
    closeModal();
    try {
      const storage = storageLayer();
      if (typeof storage.clearAll === "function") await storage.clearAll();
      else await storage.remove(STORAGE_KEY);
    } catch (error) {
      console.error("The hatchery could not be completely reset.", error);
      try { localStorage.removeItem(STORAGE_KEY); } catch (storageError) { console.error("The local save could not be removed during reset recovery.", storageError); }
    }
    window.location.reload();
  }

  function showHelp() {
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <p class="eyebrow">Hatchery guide</p>
          <h2 id="help-title">How the hatchery works</h2>
          <p class="modal-intro">Your first egg is free and eager to meet you. After that, each new egg costs ₽${EGG_PRICE}. You can pay at an empty incubator or prepurchase several eggs from the Pokémart. Prepaid eggs load automatically as soon as an incubator becomes available. The early eggs warm more quickly, then the nest settles into its usual rhythm; the Pokédex remembers a species’ usual hatch time once you have met it.</p>
          <dl class="summary-list"><dt>New eggs</dt><dd>Pay ₽${EGG_PRICE} at an empty incubator; prepaid eggs load automatically</dd><dt>Early clutch</dt><dd>The first 50 eggs ramp smoothly from 30 seconds to each species’ normal hatch rate</dd><dt>Catching</dt><dd>Catch rings are slower and wider, and one missed wobble is allowed</dd><dt>Daily treats</dt><dd>A small Pokédollar gift that grows with your streak</dd><dt>Quiet training</dt><dd>Hatchlings grow little by little while they wait</dd><dt>Bag</dt><dd>Poké Balls, prepaid eggs, Repels, charms, plates, and earned Legendary relics live in their own pockets</dd><dt>Egg safety</dt><dd>Each egg faces a 1-in-25 predator attempt; a partner blocks half of attempts and each automatic Repel protects five eggs that reach hatch time</dd><dt>Mystery research</dt><dd>Legendary relic goals are listed in the Bag and unlock automatically when completed</dd><dt>Expeditions</dt><dd>Send PC Pokémon to enabled-generation locations for 2.5–12 hours to earn XP and field rewards</dd><dt>Showcases</dt><dd>Scout persistent rivals, arrange six ordered rounds, climb league classes, and choose a halftime tactic</dd><dt>Save backups</dt><dd>Export and import your local hatchery from Settings</dd></dl>
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


  function scheduleArchiveRender(kind, value) {
    window.clearTimeout(searchRenderTimer);
    if (kind === "pokedex") {
      pokedexFilter = value;
      pokedexVisibleLimit = ARCHIVE_PAGE_SIZE;
    } else {
      pcSearch = value;
      pcVisibleLimit = ARCHIVE_PAGE_SIZE;
    }
    searchRenderTimer = window.setTimeout(() => {
      if (kind === "pokedex" && activeTab === "pokedex") renderPokedex();
      if (kind === "pc" && activeTab === "pc") renderPc();
      const search = document.getElementById(kind === "pokedex" ? "pokedex-search" : "pc-search");
      const text = kind === "pokedex" ? pokedexFilter : pcSearch;
      if (search) {
        search.focus({ preventScroll: true });
        search.setSelectionRange(text.length, text.length);
      }
    }, LOW_POWER_INTERFACE ? 180 : 90);
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
      else if (action === "apply-berry") applyBerryToPokemon(actionButton.dataset.itemId, actionButton.dataset.uid);
      else if (action === "sell-souvenir") sellSouvenir(actionButton.dataset.itemId, false);
      else if (action === "sell-all-souvenir") sellSouvenir(actionButton.dataset.itemId, true);
      else if (action === "open-expedition") showExpeditionChooser(actionButton.dataset.uid);
      else if (action === "confirm-expedition") startExpedition(actionButton.dataset.uid, actionButton.dataset.locationId);
      else if (action === "welcome-expedition") welcomeExpedition(actionButton.dataset.expeditionId);
      else if (action === "buy-shop-item") {
        const item = shopItems?.find((entry) => entry.id === actionButton.dataset.itemId) || shopItemDefinition(actionButton.dataset.itemId);
        if (isBulkPurchaseItem(item)) showShopQuantityDialog(actionButton.dataset.itemId);
        else buyShopItem(actionButton.dataset.itemId, 1);
      }
      else if (action === "buy-new-egg") buyEggForActiveIncubator();
      else if (action === "use-item") useBagItem(actionButton.dataset.itemId);
      else if (action === "toggle-plate") togglePlate(actionButton.dataset.itemId);
      else if (action === "select-incubator-slot") { selectIncubatorSlot(actionButton.dataset.slotIndex); saveState(); render(); }
      else if (action === "show-more-pokedex") { pokedexVisibleLimit += ARCHIVE_PAGE_SIZE; renderPokedex(); }
      else if (action === "show-more-pc") { pcVisibleLimit += ARCHIVE_PAGE_SIZE; renderPc(); }
      else if (action === "show-more-shop") { shopVisibleLimit += ARCHIVE_PAGE_SIZE; renderMart(); }
      else if (action === "show-more-mystery-goals") { mysteryGoalVisibleLimit += ARCHIVE_PAGE_SIZE; renderBag(); }
      else if (action === "retry-mart") { shopItems = null; shopVisibleLimit = ARCHIVE_PAGE_SIZE; renderMart(); }
      else if (action === "enter-contest") showCompetitionEntryConfirmation(actionButton.dataset.stat);
      else if (action === "confirm-enter-contest") startCompetition(actionButton.dataset.stat);
      else if (action === "competition-tactic") finishCompetition(actionButton.dataset.tacticId);
      else if (action === "resume-competition") showCompetitionHalftime();
      else if (action === "scout-competition-rival") scoutCompetitionRival();
      else if (action === "select-competition-league") selectCompetitionLeague(actionButton.dataset.leagueId);
      else if (action === "select-competition-difficulty") selectCompetitionDifficulty(actionButton.dataset.difficultyId);
      else if (action === "move-competition-team") moveCompetitionTeam(actionButton.dataset.index, actionButton.dataset.direction);
      else if (action === "request-reset") showResetConfirmation();
      else if (action === "acknowledge-egg-event") acknowledgeEggEventNotice(actionButton.dataset.noticeId);
      else if (action === "confirm-reset") resetProgress();
      else if (action === "export-save") exportSaveFile();
      else if (action === "request-import-save") requestSaveImport();
      else if (action === "confirm-import-save") importPendingSave();
      else if (action.startsWith("dev-")) runDevAction(action);
    }
    if (event.target.closest("#menu-button")) {
      mobileNav.hidden = !mobileNav.hidden;
      menuButton.setAttribute("aria-expanded", String(!mobileNav.hidden));
    }
    if (event.target.closest("#help-button")) showHelp();
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "onboarding-form") completeOnboarding(event);
    else if (event.target.id === "settings-form") saveSettings(event);
    else if (event.target.id === "shop-purchase-form") {
      event.preventDefault();
      const form = new FormData(event.target);
      buyShopItem(event.target.dataset.itemId, form.get("quantity"));
    }
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
    if (event.target.id === "purchase-quantity") {
      const form = event.target.closest("#shop-purchase-form");
      const item = form ? shopItemDefinition(form.dataset.itemId) : null;
      const total = document.getElementById("purchase-total");
      if (item && total) {
        const quantity = Math.min(MAX_BULK_PURCHASE, Math.max(1, Math.floor(Number(event.target.value) || 1)));
        total.textContent = isDevToolEnabled("freeShop") ? "FREE" : `₽${(item.cost * quantity).toLocaleString()}`;
      }
    } else if (event.target.id === "pokedex-search") {
      scheduleArchiveRender("pokedex", event.target.value);
    } else if (event.target.id === "pc-search") {
      scheduleArchiveRender("pc", event.target.value);
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.name === "theme") {
      document.getElementById("app").dataset.theme = normaliseTheme(event.target.value);
      document.querySelectorAll(".theme-card").forEach((card) => card.classList.toggle("is-selected", card.contains(event.target)));
    } else if (event.target.name === "interface_performance") {
      document.querySelectorAll(".performance-option").forEach((card) => card.classList.toggle("is-selected", card.contains(event.target)));
    }
    else if (event.target.id === "pc-filter") {
      pcFilter = event.target.value;
      pcVisibleLimit = ARCHIVE_PAGE_SIZE;
      renderPc();
    } else if (event.target.id === "pc-sort") {
      pcSort = event.target.value;
      pcVisibleLimit = ARCHIVE_PAGE_SIZE;
      renderPc();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) runClockTick(true);
  });

  window.addEventListener("pagehide", () => {
    if (!resetInProgress && state.player) saveState();
  });

  async function recoverBackupIfNeeded() {
    if (!saveRecoveryNeeded || typeof storageLayer().readBackup !== "function") return false;
    const backupText = await storageLayer().readBackup(STORAGE_KEY);
    if (!backupText) return false;
    try {
      const recovered = normaliseSaveState(JSON.parse(backupText), { requirePlayer: true, preserveUnknown: true });
      if (!storageLayer().write(STORAGE_KEY, JSON.stringify(recovered))) return false;
      return true;
    } catch (error) {
      console.warn("The IndexedDB backup was present but could not be restored.", error);
      return false;
    }
  }

  function initialiseApplication() {
    updateHeader();
    if (state.player) {
      saveState();
      applyDailyReward();
      grantOpeningEggIfNeeded();
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
  }

  recoverBackupIfNeeded().then((recovered) => {
    if (recovered) window.location.reload();
    else initialiseApplication();
  });
})();
