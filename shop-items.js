(function () {
  "use strict";

  const INCUBATOR_UPGRADE_COSTS = [50000, 125000, 275000, 500000];
  const MAX_INCUBATOR_SLOTS = 5;

  const BALL_ITEMS = [
    {
      id: "poke-ball",
      category: "ball",
      pocket: "balls",
      displayName: "Poké Ball",
      cost: 200,
      soldInShop: true,
      consumable: true,
      stackable: true,
      description: "The classic red-and-white companion for careful first throws."
    },
    {
      id: "premier-ball",
      category: "ball",
      pocket: "balls",
      displayName: "Premier Ball",
      cost: 0,
      soldInShop: false,
      consumable: true,
      stackable: true,
      description: "A bright keepsake ball that turns up only when the shopkeeper is feeling generous."
    },
    {
      id: "great-ball",
      category: "ball",
      pocket: "balls",
      displayName: "Great Ball",
      cost: 600,
      soldInShop: true,
      consumable: true,
      stackable: true,
      description: "A sturdy blue favourite for Pokémon that need a little more convincing."
    },
    {
      id: "ultra-ball",
      category: "ball",
      pocket: "balls",
      displayName: "Ultra Ball",
      cost: 1200,
      soldInShop: true,
      consumable: true,
      stackable: true,
      description: "A black-and-gold premium ball for the ones that really do not want to stay put."
    },
    {
      id: "master-ball",
      category: "ball",
      pocket: "balls",
      displayName: "Master Ball",
      cost: 0,
      soldInShop: false,
      consumable: true,
      stackable: true,
      description: "A rare purple marvel kept well away from the shop counter."
    }
  ];

  const UTILITY_ITEMS = [
    {
      id: "shiny-charm",
      category: "item",
      pocket: "items",
      displayName: "Shiny Charm",
      cost: 18000,
      description: "A glittering charm that makes the next ten eggs feel especially lucky.",
      availability: "first-shiny-caught",
      useAction: "activate-shiny-charm",
      usable: true,
      consumable: true,
      stackable: true
    },
    {
      id: "egg-voucher",
      category: "item",
      pocket: "items",
      displayName: "Prepaid Egg",
      cost: 50,
      description: "A paid hatchery claim slip. It moves from the bag into an empty incubator automatically as soon as one is available.",
      consumable: true,
      stackable: true,
      spriteId: "lucky-egg"
    },
    {
      id: "repel",
      category: "item",
      pocket: "items",
      displayName: "Repel",
      cost: 350,
      description: "An automatic five-egg safeguard. It protects the next five eggs that reach hatch time, spending one protection on every hatch whether a predator appears or not.",
      soldInShop: true,
      consumable: true,
      stackable: true,
      spriteId: "repel"
    },
    {
      id: "magmarizer",
      category: "item",
      pocket: "items",
      displayName: "Magmarizer",
      cost: 24000,
      description: "A warm little engine for the incubator shelf. Eggs settle into their rhythm much faster.",
      availability: "five-fire-caught",
      unique: true,
      stackable: false
    },
    {
      id: "incubator-upgrade",
      category: "upgrade",
      pocket: "upgrades",
      displayName: "Incubator cradle",
      cost: INCUBATOR_UPGRADE_COSTS[0],
      description: "A polished extra cradle with its own warmer, cushion, and tiny clipboard. It lets another egg or hatchling keep its own little schedule.",
      availability: "incubator-upgrade",
      stackable: false,
      repeatable: true,
      spriteId: "up-grade"
    }
  ];

  const PLATE_ITEMS = [
    ["flame-plate", "fire", "Flame Plate", "A warm red plate that hums like a tiny hearth. Fire-type Pokémon seem to be attracted to this plate."],
    ["splash-plate", "water", "Splash Plate", "A blue plate that always feels faintly misted. Water-type Pokémon seem to be attracted to this plate."],
    ["zap-plate", "electric", "Zap Plate", "A yellow plate that makes the air prickle. Electric-type Pokémon seem to be attracted to this plate."],
    ["meadow-plate", "grass", "Meadow Plate", "A green plate with the hush of tall grass inside it. Grass-type Pokémon seem to be attracted to this plate."],
    ["icicle-plate", "ice", "Icicle Plate", "A pale plate that keeps its own little winter. Ice-type Pokémon seem to be attracted to this plate."],
    ["fist-plate", "fighting", "Fist Plate", "A bold plate that seems eager for a training montage. Fighting-type Pokémon seem to be attracted to this plate."],
    ["toxic-plate", "poison", "Toxic Plate", "A violet plate that should not be licked under any circumstances. Poison-type Pokémon seem to be attracted to this plate."],
    ["earth-plate", "ground", "Earth Plate", "A clay-brown plate with stubborn dirt in its corners. Ground-type Pokémon seem to be attracted to this plate."],
    ["sky-plate", "flying", "Sky Plate", "A feather-light plate that never quite stays flat. Flying-type Pokémon seem to be attracted to this plate."],
    ["mind-plate", "psychic", "Mind Plate", "A rose plate that gives the shelf a thoughtful look. Psychic-type Pokémon seem to be attracted to this plate."],
    ["insect-plate", "bug", "Insect Plate", "A chitin-green plate that clicks softly at night. Bug-type Pokémon seem to be attracted to this plate."],
    ["stone-plate", "rock", "Stone Plate", "A slate plate with the patience of an old hill. Rock-type Pokémon seem to be attracted to this plate."],
    ["spooky-plate", "ghost", "Spooky Plate", "A dusky plate that is never where you left it. Ghost-type Pokémon seem to be attracted to this plate."],
    ["draco-plate", "dragon", "Draco Plate", "A deep plate that feels much older than the shop. Dragon-type Pokémon seem to be attracted to this plate."],
    ["dread-plate", "dark", "Dread Plate", "A black plate with a dramatic sense of timing. Dark-type Pokémon seem to be attracted to this plate."],
    ["iron-plate", "steel", "Iron Plate", "A steel-grey plate that makes a satisfying clink. Steel-type Pokémon seem to be attracted to this plate."],
    ["pixie-plate", "fairy", "Pixie Plate", "A pink plate sprinkled with impossible little sparkles. Fairy-type Pokémon seem to be attracted to this plate."]
  ].map(([id, type, displayName, description]) => ({
    id,
    type,
    category: "plate",
    pocket: "plates",
    displayName,
    cost: 9000,
    description,
    availability: "type-caught",
    unique: true,
    stackable: false
  }));



  function berry(id, displayName, cost, statEffects, description) {
    return {
      id,
      category: "berry",
      pocket: "berries",
      displayName,
      cost,
      statEffects,
      soldInShop: true,
      usable: true,
      consumable: true,
      stackable: true,
      description
    };
  }

  const BERRY_ITEMS = [
    berry("cheri-berry", "Cheri Berry", 80, { speed: 8 }, "A spicy little berry for speed training."),
    berry("chesto-berry", "Chesto Berry", 80, { defense: 8 }, "A firm berry for defensive training."),
    berry("pecha-berry", "Pecha Berry", 80, { "special-defense": 8 }, "A sweet berry for special-defense training."),
    berry("rawst-berry", "Rawst Berry", 80, { "special-attack": 8 }, "A dry berry for special-attack training."),
    berry("aspear-berry", "Aspear Berry", 80, { attack: 8 }, "A sour berry for attack training."),
    berry("leppa-berry", "Leppa Berry", 120, { hp: 6, attack: 4 }, "A bright berry that helps HP and attack training."),
    berry("oran-berry", "Oran Berry", 120, { hp: 10 }, "A dependable blue berry for HP training."),
    berry("persim-berry", "Persim Berry", 120, { speed: 6, "special-defense": 4 }, "A crisp berry for speed and special-defense training."),
    berry("lum-berry", "Lum Berry", 220, { hp: 4, attack: 4, defense: 4, "special-attack": 4, "special-defense": 4, speed: 4 }, "A balanced rare berry that nudges every training stat."),
    berry("sitrus-berry", "Sitrus Berry", 180, { hp: 14 }, "A plump yellow berry for stronger HP training."),
    berry("figy-berry", "Figy Berry", 140, { attack: 10 }, "A bold berry for attack training."),
    berry("wiki-berry", "Wiki Berry", 140, { "special-attack": 10 }, "A dry berry for special-attack training."),
    berry("mago-berry", "Mago Berry", 140, { speed: 10 }, "A sweet berry for speed training."),
    berry("aguav-berry", "Aguav Berry", 140, { "special-defense": 10 }, "A balanced berry for special-defense training."),
    berry("iapapa-berry", "Iapapa Berry", 140, { defense: 10 }, "A firm berry for defense training."),
    berry("razz-berry", "Razz Berry", 110, { attack: 6, speed: 4 }, "A tiny red berry for quick physical drills."),
    berry("bluk-berry", "Bluk Berry", 110, { "special-attack": 6, hp: 4 }, "A soft berry for patient special drills."),
    berry("nanab-berry", "Nanab Berry", 110, { defense: 6, "special-defense": 4 }, "A mellow berry for steady defensive drills."),
    berry("wepear-berry", "Wepear Berry", 110, { speed: 6, defense: 4 }, "A green berry for agile footwork drills."),
    berry("pinap-berry", "Pinap Berry", 110, { attack: 4, "special-attack": 4, speed: 4 }, "A spiky berry for mixed offensive drills."),
    berry("pomeg-berry", "Pomeg Berry", 180, { hp: 12 }, "A serious berry for HP effort training."),
    berry("kelpsy-berry", "Kelpsy Berry", 180, { attack: 12 }, "A serious berry for attack effort training."),
    berry("qualot-berry", "Qualot Berry", 180, { defense: 12 }, "A serious berry for defense effort training."),
    berry("hondew-berry", "Hondew Berry", 180, { "special-attack": 12 }, "A serious berry for special-attack effort training."),
    berry("grepa-berry", "Grepa Berry", 180, { "special-defense": 12 }, "A serious berry for special-defense effort training."),
    berry("tamato-berry", "Tamato Berry", 180, { speed: 12 }, "A serious berry for speed effort training."),
    berry("cornn-berry", "Cornn Berry", 130, { attack: 5, defense: 5 }, "A tough berry for physical balance drills."),
    berry("magost-berry", "Magost Berry", 130, { "special-attack": 5, "special-defense": 5 }, "A fragrant berry for special balance drills."),
    berry("rabuta-berry", "Rabuta Berry", 130, { hp: 5, defense: 5 }, "A hair-tipped berry for durable training."),
    berry("nomel-berry", "Nomel Berry", 130, { attack: 5, speed: 5 }, "A sharp berry for swift strikes."),
    berry("spelon-berry", "Spelon Berry", 160, { attack: 7, "special-attack": 5 }, "A hot berry for mixed attacking drills."),
    berry("pamtre-berry", "Pamtre Berry", 160, { hp: 6, "special-defense": 6 }, "A refined berry for resilient training."),
    berry("watmel-berry", "Watmel Berry", 160, { hp: 6, "special-attack": 6 }, "A huge berry for healthy special drills."),
    berry("durin-berry", "Durin Berry", 160, { defense: 6, attack: 6 }, "A stubborn berry for sturdy attack drills."),
    berry("belue-berry", "Belue Berry", 160, { speed: 6, "special-defense": 6 }, "A glossy berry for quick special resilience."),
    berry("occa-berry", "Occa Berry", 220, { defense: 10, "special-defense": 6 }, "A heat-tempered berry for defensive training."),
    berry("passho-berry", "Passho Berry", 220, { "special-defense": 10, hp: 6 }, "A water-cooled berry for special resilience."),
    berry("wacan-berry", "Wacan Berry", 220, { speed: 10, defense: 6 }, "A crackling berry for fast defensive drills."),
    berry("rindo-berry", "Rindo Berry", 220, { hp: 8, "special-defense": 8 }, "A leafy berry for calm endurance."),
    berry("yache-berry", "Yache Berry", 220, { defense: 8, speed: 8 }, "A chilled berry for evasive toughness."),
    berry("chople-berry", "Chople Berry", 220, { hp: 8, defense: 8 }, "A hardy berry for close-contact training."),
    berry("kebia-berry", "Kebia Berry", 220, { "special-defense": 8, speed: 8 }, "A pointed berry for careful reactions."),
    berry("shuca-berry", "Shuca Berry", 220, { defense: 8, hp: 8 }, "A root-heavy berry for grounded stamina."),
    berry("coba-berry", "Coba Berry", 220, { speed: 12, hp: 4 }, "A feather-light berry for speed training."),
    berry("payapa-berry", "Payapa Berry", 220, { "special-defense": 12, hp: 4 }, "A thoughtful berry for special-defense focus."),
    berry("tanga-berry", "Tanga Berry", 220, { defense: 12, hp: 4 }, "A crunchy berry for defense focus."),
    berry("charti-berry", "Charti Berry", 220, { defense: 10, attack: 6 }, "A mineral-rich berry for tough strikes."),
    berry("kasib-berry", "Kasib Berry", 220, { "special-defense": 10, "special-attack": 6 }, "A quiet berry for careful special training."),
    berry("haban-berry", "Haban Berry", 220, { hp: 6, attack: 5, "special-attack": 5 }, "A powerful berry for mixed dragonlike drills."),
    berry("colbur-berry", "Colbur Berry", 220, { defense: 6, "special-defense": 6, speed: 4 }, "A shadow-dark berry for guarded movement."),
    berry("babiri-berry", "Babiri Berry", 220, { defense: 12, "special-defense": 4 }, "A metallic berry for strong defensive training."),
    berry("chilan-berry", "Chilan Berry", 220, { hp: 10, defense: 6 }, "A plain but reliable berry for staying power."),
    berry("liechi-berry", "Liechi Berry", 340, { attack: 18 }, "A rare berry for powerful attack training."),
    berry("ganlon-berry", "Ganlon Berry", 340, { defense: 18 }, "A rare berry for powerful defense training."),
    berry("salac-berry", "Salac Berry", 340, { speed: 18 }, "A rare berry for powerful speed training."),
    berry("petaya-berry", "Petaya Berry", 340, { "special-attack": 18 }, "A rare berry for powerful special-attack training."),
    berry("apicot-berry", "Apicot Berry", 340, { "special-defense": 18 }, "A rare berry for powerful special-defense training."),
    berry("lansat-berry", "Lansat Berry", 420, { attack: 10, speed: 10 }, "A battle-prize berry for sharp and quick training."),
    berry("starf-berry", "Starf Berry", 420, { hp: 5, attack: 5, defense: 5, "special-attack": 5, "special-defense": 5, speed: 5 }, "A starry berry that trains everything a little."),
    berry("enigma-berry", "Enigma Berry", 420, { hp: 12, "special-defense": 8 }, "A mysterious berry for sturdy recovery drills."),
    berry("micle-berry", "Micle Berry", 380, { attack: 8, "special-attack": 8, speed: 4 }, "A precise berry for accurate mixed training."),
    berry("custap-berry", "Custap Berry", 380, { speed: 16, attack: 4 }, "A last-second berry for burst-speed training."),
    berry("jaboca-berry", "Jaboca Berry", 380, { defense: 16, attack: 4 }, "A bristly berry for contact defense drills."),
    berry("rowap-berry", "Rowap Berry", 380, { "special-defense": 16, "special-attack": 4 }, "A bristly berry for special contact drills."),
    berry("roseli-berry", "Roseli Berry", 240, { "special-defense": 10, defense: 6 }, "A pink berry for charming defensive drills."),
    berry("kee-berry", "Kee Berry", 420, { defense: 20 }, "A tough berry for maximum defense-focused training."),
    berry("maranga-berry", "Maranga Berry", 420, { "special-defense": 20 }, "A tough berry for maximum special-defense-focused training.")
  ];

  const SOUVENIR_ITEMS = [
    ["tiny-mushroom", "Tiny Mushroom", 250, "A small mushroom from an expedition path. It has no hatchery use beyond looking nice."],
    ["pretty-feather", "Pretty Feather", 100, "A light feather found far from the PC room. It is only a keepsake."],
    ["heart-scale", "Heart Scale", 500, "A lovely scale with no current hatchery use."],
    ["pearl", "Pearl", 700, "A smooth expedition pearl kept as a small memento."],
    ["stardust", "Stardust", 1000, "Fine sparkling dust from a long walk. It is not a shop upgrade."],
    ["red-shard", "Red Shard", 300, "A red shard from a field route. It is only decorative here."],
    ["blue-shard", "Blue Shard", 300, "A blue shard from a field route. It is only decorative here."],
    ["green-shard", "Green Shard", 300, "A green shard from a field route. It is only decorative here."],
    ["yellow-shard", "Yellow Shard", 300, "A yellow shard from a field route. It is only decorative here."]
  ].map(([id, displayName, sellValue, description]) => ({
    id,
    category: "souvenir",
    pocket: "souvenirs",
    displayName,
    cost: 0,
    sellValue,
    soldInShop: false,
    stackable: true,
    description
  }));

  const LEGENDARY_REGISTRY = window.PocketHatcheryLegendaryItems || null;
  const MYSTERY_ITEMS = LEGENDARY_REGISTRY && typeof LEGENDARY_REGISTRY.items === "function" ? LEGENDARY_REGISTRY.items() : [];
  const ALL_ITEMS = [...BALL_ITEMS, ...UTILITY_ITEMS, ...PLATE_ITEMS, ...BERRY_ITEMS, ...SOUVENIR_ITEMS, ...MYSTERY_ITEMS];
  const ITEM_BY_ID = Object.fromEntries(ALL_ITEMS.map((item) => [item.id, item]));

  function normaliseItems(items) {
    return items && typeof items === "object" ? items : {};
  }

  function caughtPokemon(state) {
    return Array.isArray(state?.pc) ? state.pc.filter(Boolean) : [];
  }

  function hasCaughtShiny(state) {
    return caughtPokemon(state).some((pokemon) => pokemon.shiny === true);
  }

  function countCaughtType(state, type) {
    return caughtPokemon(state).filter((pokemon) => Array.isArray(pokemon.types) && pokemon.types.includes(type)).length;
  }

  function hasCaughtType(state, type) {
    return countCaughtType(state, type) > 0;
  }

  function incubatorCapacity(state) {
    const value = Math.floor(Number(state?.incubators?.capacity || 1));
    return Math.min(MAX_INCUBATOR_SLOTS, Math.max(1, Number.isFinite(value) ? value : 1));
  }

  function incubatorUpgradeCost(state) {
    const nextIndex = Math.min(INCUBATOR_UPGRADE_COSTS.length - 1, Math.max(0, incubatorCapacity(state) - 1));
    return INCUBATOR_UPGRADE_COSTS[nextIndex];
  }

  function isItemAvailable(item, state) {
    if (item.category === "ball") return item.soldInShop === true;
    if (item.availability === "first-shiny-caught") return hasCaughtShiny(state);
    if (item.availability === "five-fire-caught") return countCaughtType(state, "fire") >= 5;
    if (item.availability === "type-caught") return hasCaughtType(state, item.type);
    if (item.availability === "incubator-upgrade") return incubatorCapacity(state) < MAX_INCUBATOR_SLOTS;
    return true;
  }

  function isOwned(item, state) {
    if (item.id === "incubator-upgrade") return incubatorCapacity(state) >= MAX_INCUBATOR_SLOTS;
    if (item.category === "ball") return Number(state?.inventory?.[item.id] || 0) > 0;
    return Number(normaliseItems(state?.items)[item.id] || 0) > 0;
  }

  function getShopStock(state) {
    return ALL_ITEMS
      .filter((item) => item.category !== "mystery")
      .filter((item) => item.soldInShop === true || (item.soldInShop !== false && item.category !== "ball"))
      .filter((item) => isItemAvailable(item, state))
      .filter((item) => !(item.unique === true && isOwned(item, state)))
      .map((item) => {
        if (item.id === "incubator-upgrade") {
          const current = incubatorCapacity(state);
          return {
            ...item,
            cost: incubatorUpgradeCost(state),
            displayName: `${current + 1}${current === 1 ? "nd" : current === 2 ? "rd" : "th"} incubator cradle`,
            owned: false
          };
        }
        return { ...item, owned: isOwned(item, state) };
      });
  }

  function getBagPockets(state) {
    const inventory = state?.inventory || {};
    const items = normaliseItems(state?.items);
    const balls = BALL_ITEMS
      .map((item) => ({ ...item, count: Number(inventory[item.id] || 0) }))
      .filter((item) => item.count > 0);
    const utilityItems = UTILITY_ITEMS
      .map((item) => ({ ...item, count: Number(items[item.id] || 0) }))
      .filter((item) => item.count > 0
        || (item.id === "shiny-charm" && Number(state?.activeItemEffects?.shinyCharmEggsRemaining || 0) > 0)
        || (item.id === "repel" && Number(state?.activeItemEffects?.repelEggsRemaining || 0) > 0));
    const berries = BERRY_ITEMS
      .map((item) => ({ ...item, count: Number(items[item.id] || 0) }))
      .filter((item) => item.count > 0);
    const plates = PLATE_ITEMS
      .map((item) => ({ ...item, count: Number(items[item.id] || 0), equipped: state?.equippedPlate === item.id }))
      .filter((item) => item.count > 0);
    const souvenirs = SOUVENIR_ITEMS
      .map((item) => ({ ...item, count: Number(state?.souvenirs?.[item.id] || 0) }))
      .filter((item) => item.count > 0);
    const mysteryItems = MYSTERY_ITEMS
      .map((item) => ({ ...item, count: Number(items[item.id] || 0) }))
      .filter((item) => item.count > 0);
    return { balls, items: utilityItems, berries, plates, souvenirs, mysteryItems };
  }

  function getItem(id) {
    return ITEM_BY_ID[id] ? { ...ITEM_BY_ID[id] } : null;
  }

  function getPlateByType(type) {
    const plate = PLATE_ITEMS.find((item) => item.type === type);
    return plate ? { ...plate } : null;
  }

  function getEquippedPlate(state) {
    const plate = getItem(state?.equippedPlate || "");
    return plate && plate.category === "plate" ? plate : null;
  }

  window.PocketHatcheryShopItems = {
    getItem,
    getPlateByType,
    getEquippedPlate,
    incubatorCapacity,
    getShopStock,
    getBagPockets,
    countCaughtType,
    hasCaughtShiny,
    allItems: () => ALL_ITEMS.map((item) => ({ ...item })),
    plates: () => PLATE_ITEMS.map((item) => ({ ...item })),
    berries: () => BERRY_ITEMS.map((item) => ({ ...item })),
    souvenirs: () => SOUVENIR_ITEMS.map((item) => ({ ...item })),
    mysteryItems: () => MYSTERY_ITEMS.map((item) => ({ ...item }))
  };
}());
