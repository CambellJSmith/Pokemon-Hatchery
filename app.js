(function () {
  "use strict";

  const STORAGE_KEY = "pocket_hatchery_save_v1";
  const HATCH_DURATION = 6 * 60 * 60 * 1000;
  const PASSIVE_XP_INTERVAL = 60 * 1000;
  const API_ROOT = "https://pokeapi.co/api/v2";
  const GEN_FIVE_SPRITE_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white";
  const SHINY_ODDS = 8192;
  const BALL_BONUSES = { "poke-ball": 1, "great-ball": 1.5, "ultra-ball": 2, "master-ball": Infinity };
  const CONTEST_STATS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  const DEFAULT_STATE = {
    version: 2,
    player: null,
    money: 0,
    streak: 0,
    lastLoginDate: null,
    lastDailyReward: 0,
    egg: null,
    encounter: null,
    pokedex: {},
    pc: [],
    team: [],
    inventory: { "poke-ball": 5, "great-ball": 0, "ultra-ball": 0 },
    settings: { generations: [1, 2, 3, 4, 5, 6, 7, 8, 9], theme: "field" },
    statistics: { eggsHatched: 0, pokemonCaught: 0, pokemonReleased: 0, competitionsWon: 0 },
    competitionLog: []
  };

  const state = loadState();
  let activeTab = "home";
  let clockTimer = null;
  let isHatching = false;
  let nextHatchRetryAt = 0;
  let isCompetitionRunning = false;
  let enabledSpeciesTotal = 0;
  let shopItems = null;
  let pokedexFilter = "";
  const apiCache = new Map();
  const generationCache = new Map();
  const growthCache = new Map();

  const view = document.getElementById("view");
  const modalRoot = document.getElementById("modal-root");
  const toastRoot = document.getElementById("toast-root");
  const moneyDisplay = document.getElementById("money-display");
  const streakDisplay = document.getElementById("streak-display");
  const mobileNav = document.getElementById("mobile-nav");
  const menuButton = document.getElementById("menu-button");

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored || ![1, 2].includes(stored.version)) return cloneDefault();
      const storedGenerations = stored.settings?.generations || [];
      const usedLegacyDefault = stored.version === 1
        && storedGenerations.length === 5
        && storedGenerations.every((generation, index) => generation === index + 1);
      return {
        ...cloneDefault(),
        ...stored,
        version: 2,
        inventory: { ...DEFAULT_STATE.inventory, ...(stored.inventory || {}) },
        settings: {
          ...DEFAULT_STATE.settings,
          ...(stored.settings || {}),
          generations: usedLegacyDefault ? [...DEFAULT_STATE.settings.generations] : storedGenerations
        },
        statistics: { ...DEFAULT_STATE.statistics, ...(stored.statistics || {}) }
      };
    } catch {
      return cloneDefault();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateHeader();
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

  function applyDailyReward() {
    if (!state.player) return;
    const today = localDateKey();
    if (state.lastLoginDate === today) return;
    const gap = dayDifference(state.lastLoginDate, today);
    state.streak = gap === 1 ? state.streak + 1 : 1;
    const reward = Math.floor(100 * Math.pow(1.25, Math.max(0, state.streak - 1)));
    state.money += reward;
    state.lastDailyReward = reward;
    state.lastLoginDate = today;
    saveState();
    window.setTimeout(() => toast(`Daily field grant: +₽${reward}. Streak: ${state.streak} day${state.streak === 1 ? "" : "s"}.`), 350);
  }

  function ensureEgg() {
    if (!state.player || state.egg || state.encounter) return;
    const laidAt = Date.now();
    state.egg = { laidAt, hatchAt: laidAt + HATCH_DURATION };
    saveState();
  }

  function updateHeader() {
    moneyDisplay.textContent = `₽${Number(state.money || 0).toLocaleString()}`;
    streakDisplay.textContent = `${state.streak || 0} day${state.streak === 1 ? "" : "s"} streak`;
    document.getElementById("app").dataset.theme = state.settings.theme || "field";
  }

  function formatDuration(milliseconds) {
    const total = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
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

  function displayBallName(value) {
    return { "poke-ball": "Poké Ball", "great-ball": "Great Ball", "ultra-ball": "Ultra Ball", "master-ball": "Master Ball" }[value] || titleCase(value);
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
    if (label) label.textContent = online ? "archive online" : "api connection interrupted";
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

  function rollIvs() {
    return Object.fromEntries(CONTEST_STATS.map((stat) => [stat, randomInt(0, 32)]));
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

  async function createEncounter(reference, pokemon, species) {
    const sprites = getGenerationFiveSprites(pokemon);
    const shiny = randomInt(0, SHINY_ODDS) === 0;
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
      types: pokemon.types.map((entry) => entry.type.name),
      baseStats: mapBaseStats(pokemon),
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

  async function chooseWeightedEncounter() {
    const references = await getEnabledSpeciesReferences();
    if (!references.length) throw new Error("No generations are enabled.");
    let lastCandidate = null;
    for (let attempt = 0; attempt < 48; attempt += 1) {
      const reference = randomChoice(references);
      const id = resourceId(reference.url);
      const [pokemon, species] = await Promise.all([apiFetch(`pokemon/${id}`), apiFetch(reference.url)]);
      const baseStatTotal = pokemon.stats.reduce((total, entry) => total + entry.base_stat, 0);
      lastCandidate = { reference, pokemon, species };
      if (Math.random() <= Math.min(1, 180 / baseStatTotal)) return createEncounter(reference, pokemon, species);
    }
    if (lastCandidate) return createEncounter(lastCandidate.reference, lastCandidate.pokemon, lastCandidate.species);
    throw new Error("No eligible Pokémon could be found.");
  }

  async function hatchEgg() {
    if (isHatching || !state.egg || Date.now() < state.egg.hatchAt || Date.now() < nextHatchRetryAt) return;
    isHatching = true;
    if (activeTab === "home") render();
    try {
      const encounter = await chooseWeightedEncounter();
      state.encounter = encounter;
      state.egg = null;
      state.statistics.eggsHatched += 1;
      const key = String(encounter.speciesId);
      const record = state.pokedex[key] || {
        speciesId: encounter.speciesId,
        name: encounter.name,
        displayName: encounter.displayName,
        sprite: encounter.normalSprite,
        shinySprite: encounter.shinySprite,
        seen: 0,
        shinySeen: 0,
        firstEncounteredAt: encounter.encounteredAt
      };
      record.seen += 1;
      if (encounter.shiny) record.shinySeen += 1;
      state.pokedex[key] = record;
      saveState();
      toast(`${encounter.shiny ? "A rare shimmer—" : ""}${encounter.displayName} hatched from the egg!`);
    } catch {
      nextHatchRetryAt = Date.now() + 30000;
      toast("The archive could not reach PokéAPI. The egg is safe; another attempt will begin shortly.");
    } finally {
      isHatching = false;
      if (activeTab === "home") render();
    }
  }

  function statValue(pokemon, stat, level = pokemon.level) {
    const base = pokemon.baseStats[stat] || 1;
    const iv = pokemon.ivs[stat] || 0;
    if (stat === "hp") return Math.floor(((2 * base + iv) * level) / 100) + level + 10;
    return Math.floor(((2 * base + iv) * level) / 100) + 5;
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
    state.encounter.experience += elapsedIntervals;
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

  function renderHatchingHome() {
    view.innerHTML = `
      <section class="loading-ledger" aria-busy="true">
        <article class="paper-panel loading-card">
          <div class="panel-label">Hatching / <em>please wait</em></div>
          <div class="cracked-egg" aria-hidden="true"><span></span></div>
          <p class="eyebrow">Consulting the species archive</p>
          <h1>The shell is opening…</h1>
          <p>Base stats are being weighed and a new individual record is being prepared.</p>
          <span class="loading-line"></span>
        </article>
      </section>`;
  }

  function renderEncounterHome() {
    accrueEncounterExperience();
    const pokemon = state.encounter;
    const xpPercent = pokemon.level >= 100 ? 100 : Math.min(100, (pokemon.experience / Math.max(1, pokemon.nextLevelExperience)) * 100);
    const ivTotal = Object.values(pokemon.ivs).reduce((total, value) => total + value, 0);
    const statRows = CONTEST_STATS.map((stat) => `
      <div class="stat-row"><span>${statLabel(stat)}</span><strong>${statValue(pokemon, stat)}</strong><small>IV ${pokemon.ivs[stat]}</small></div>`).join("");
    view.innerHTML = `
      <section class="home-grid encounter-grid" aria-labelledby="encounter-title">
        <aside class="field-note">
          <p class="eyebrow">Hatch record ${String(state.statistics.eggsHatched).padStart(3, "0")}</p>
          <h1 id="encounter-title">${pokemon.shiny ? "A brilliant arrival" : "A new arrival"}</h1>
          <div class="leaf-rule" aria-hidden="true"><span>⌁</span></div>
          <p class="field-copy">The shell has opened. Observe this individual for as long as you like: it earns one experience point for every minute recorded here.</p>
          <dl class="field-meta">
            <dt>Species</dt><dd>${escapeHtml(pokemon.displayName)}</dd>
            <dt>Types</dt><dd>${pokemon.types.map(titleCase).join(" / ")}</dd>
            <dt>Ability</dt><dd>${titleCase(pokemon.ability)}${pokemon.hiddenAbility ? " · hidden" : ""}</dd>
            <dt>Hatched</dt><dd>${new Date(pokemon.encounteredAt).toLocaleString()}</dd>
          </dl>
        </aside>

        <article class="paper-panel incubator specimen-panel">
          <div class="panel-label">Specimen / <em>${pokemon.shiny ? "shiny" : "observed"}</em></div>
          ${pokemon.shiny ? '<span class="shiny-stamp">✦ 1 / 8192 ✦</span>' : ""}
          <div class="sprite-stage">
            <span class="dex-number">No. ${String(pokemon.speciesId).padStart(3, "0")}</span>
            <img class="pokemon-sprite" src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.shiny ? `Shiny ${pokemon.displayName}` : pokemon.displayName)}" />
            <h2>${escapeHtml(pokemon.displayName)}</h2>
            <p>Level ${pokemon.level} · ${pokemon.experience.toLocaleString()} total XP</p>
          </div>
          <div class="xp-meter" aria-label="Experience progress"><span style="width:${xpPercent}%"></span></div>
          <p class="passive-note">+1 XP / minute while awaiting your decision</p>
          <div class="encounter-actions">
            <button class="button button-accent" type="button" data-action="choose-ball">Catch Pokémon</button>
            <button class="button" type="button" data-action="release-encounter">Release for field grant</button>
          </div>
        </article>

        <aside class="side-stack encounter-stats">
          <article class="paper-panel stat-card">
            <div class="panel-label">Individual values</div>
            ${statRows}
            <p class="iv-total">IV total <strong>${ivTotal} / 186</strong></p>
          </article>
          <article class="paper-panel mini-card compact-card">
            <div class="panel-label">Decision pending</div>
            <h2>${pokemon.catchAttempts}</h2>
            <p>Poké Ball attempt${pokemon.catchAttempts === 1 ? "" : "s"} made</p>
          </article>
        </aside>
      </section>`;
    getGrowthLevels(pokemon.growthRateUrl).then(() => refreshLevelFromExperience(pokemon)).then(() => saveState()).catch(() => {});
  }

  function renderHome() {
    if (isHatching) {
      renderHatchingHome();
      return;
    }
    if (state.encounter) {
      renderEncounterHome();
      return;
    }
    ensureEgg();
    const now = new Date();
    const discovered = Object.keys(state.pokedex).length;
    const total = enabledSpeciesTotal;
    const totalLabel = total || "…";
    const laid = state.egg ? new Date(state.egg.laidAt) : now;
    const remaining = state.egg ? state.egg.hatchAt - Date.now() : 0;
    const progress = state.egg ? Math.min(100, Math.max(0, ((Date.now() - state.egg.laidAt) / HATCH_DURATION) * 100)) : 100;
    const nextGift = millisecondsUntilTomorrow();

    view.innerHTML = `
      <section class="home-grid" aria-labelledby="home-title">
        <aside class="field-note">
          <p class="eyebrow">Field note ${String(state.statistics.eggsHatched + 1).padStart(3, "0")}</p>
          <h1 id="home-title">A quiet beginning</h1>
          <div class="leaf-rule" aria-hidden="true"><span>⌁</span></div>
          <p class="field-copy">Welcome to your hatchery. This ${state.statistics.eggsHatched ? "new" : "first"} egg asks only for patience, observation, and a steady hand. Good things take time.</p>
          <dl class="field-meta">
            <dt>Date</dt><dd>${laid.toLocaleDateString(undefined, { year: "2-digit", month: "2-digit", day: "2-digit" })}</dd>
            <dt>Time</dt><dd>${laid.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</dd>
            <dt>Researcher</dt><dd>${escapeHtml(state.player?.name || "You")}</dd>
          </dl>
        </aside>

        <article class="paper-panel incubator">
          <div class="panel-label">Incubation / <em>active</em></div>
          <div class="egg-stage" aria-label="A speckled egg is incubating"><div class="egg"></div></div>
          <div class="countdown-wrap">
            <div id="hatch-countdown" class="countdown">${formatDuration(remaining)}</div>
            <p class="hatch-copy">Something is moving inside…</p>
            <div class="progress-ruler">
              <span>laid</span>
              <div class="progress-track"><span id="egg-progress" class="progress-fill" style="width:${progress.toFixed(2)}%"></span></div>
              <span>hatches in 6h</span>
            </div>
          </div>
        </article>

        <aside class="side-stack">
          <article class="paper-panel mini-card">
            <div class="panel-label">Next daily gift</div>
            <h2><span class="sun-glyph">✹</span>+₽${Math.floor(100 * Math.pow(1.25, state.streak))}</h2>
            <p>in <span id="gift-countdown">${formatDuration(nextGift)}</span></p>
          </article>
          <article class="paper-panel mini-card">
            <div class="panel-label">Collection progress</div>
            <h2 id="dex-total-home">${discovered} / ${totalLabel}</h2>
            <div class="segmented-progress" aria-label="${discovered} species recorded"><span id="dex-progress-home" style="width:${total ? (discovered / total) * 100 : 0}%"></span></div>
            <p>species recorded</p>
          </article>
        </aside>
      </section>`;
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

  function renderPokedex() {
    const allEntries = Object.values(state.pokedex).sort((left, right) => left.speciesId - right.speciesId);
    const entries = allEntries.filter((entry) => `${entry.displayName} ${entry.speciesId}`.toLowerCase().includes(pokedexFilter.toLowerCase()));
    const totalHatches = allEntries.reduce((total, entry) => total + entry.seen, 0);
    const shinyHatches = allEntries.reduce((total, entry) => total + entry.shinySeen, 0);
    const cards = entries.map((entry) => `
      <button class="dex-card paper-panel" type="button" data-action="pokedex-details" data-species-id="${entry.speciesId}">
        <span class="dex-card-number">No. ${String(entry.speciesId).padStart(3, "0")}</span>
        <img src="${escapeHtml(entry.sprite)}" alt="" loading="lazy" />
        <strong>${escapeHtml(entry.displayName)}</strong>
        <span class="dex-counts"><b>${entry.seen}</b> hatched ${entry.shinySeen ? `<em>✦ ${entry.shinySeen} shiny</em>` : ""}</span>
      </button>`).join("");
    view.innerHTML = `
      <section class="archive-page">
        ${pageHeader("National field archive", "Pokédex", "Every species is recorded the moment its egg hatches—even when you decide to release it.", `
          <div class="summary-stamps"><span><b>${allEntries.length}</b> species</span><span><b>${totalHatches}</b> hatches</span><span><b>${shinyHatches}</b> shiny</span></div>`)}
        <div class="toolbar paper-panel">
          <label class="search-field" for="pokedex-search">Search the archive</label>
          <input id="pokedex-search" type="search" value="${escapeHtml(pokedexFilter)}" placeholder="Name or number…" autocomplete="off" />
          <span id="pokedex-progress-copy">${allEntries.length} / ${enabledSpeciesTotal || "…"} enabled species recorded</span>
        </div>
        ${allEntries.length ? `<div class="dex-grid">${cards || '<p class="no-results">No field records match this search.</p>'}</div>` : emptyState("The ledger is still blank", "Your first hatched Pokémon will make the opening entry.", '<button class="button button-primary" type="button" data-tab="home">Return to the incubator</button>')}
      </section>`;
    if (!enabledSpeciesTotal) {
      getEnabledSpeciesReferences().then(() => {
        const copy = document.getElementById("pokedex-progress-copy");
        if (copy) copy.textContent = `${allEntries.length} / ${enabledSpeciesTotal} enabled species recorded`;
      }).catch(() => {});
    }
  }

  function renderPc() {
    state.team = state.team.filter((id) => state.pc.some((pokemon) => pokemon.uid === id)).slice(0, 6);
    const cards = state.pc.map((pokemon) => {
      const selected = state.team.includes(pokemon.uid);
      return `
        <article class="pc-card paper-panel ${selected ? "is-selected" : ""}">
          <button class="pc-summary-button" type="button" data-action="pc-summary" data-uid="${pokemon.uid}">
            <span class="dex-card-number">No. ${String(pokemon.speciesId).padStart(3, "0")}</span>
            ${pokemon.shiny ? '<span class="mini-shiny">✦ shiny</span>' : ""}
            <img src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.displayName)}" loading="lazy" />
            <strong>${escapeHtml(pokemon.nickname || pokemon.displayName)}</strong>
            <span>${pokemon.nickname ? escapeHtml(pokemon.displayName) + " · " : ""}Lv. ${pokemon.level}</span>
          </button>
          <button class="team-toggle" type="button" data-action="toggle-team" data-uid="${pokemon.uid}" aria-pressed="${selected}">${selected ? "✓ Competition team" : "+ Add to team"}</button>
        </article>`;
    }).join("");
    view.innerHTML = `
      <section class="archive-page">
        ${pageHeader("Caught individual archive", "PC", "Every Pokémon here is unique. Open a summary to inspect its identity, stats, IVs, and training record.", `<div class="team-counter"><b>${state.team.length}</b><span>/ 6 on team</span></div>`)}
        ${state.pc.length ? `<div class="pc-grid">${cards}</div>` : emptyState("No caught Pokémon yet", "Hatch an egg, inspect the individual, then choose a Poké Ball to attempt a catch.", '<button class="button button-primary" type="button" data-tab="home">Visit the incubator</button>')}
      </section>`;
  }

  async function loadShopItems() {
    const names = ["poke-ball", "great-ball", "ultra-ball"];
    const results = await Promise.all(names.map((name) => apiFetch(`item/${name}`)));
    shopItems = results.map((item) => ({
      name: item.name,
      displayName: englishName(item, item.name),
      cost: item.cost,
      sprite: item.sprites?.default,
      description: item.effect_entries?.find((entry) => entry.language.name === "en")?.short_effect || "A device for catching wild Pokémon."
    }));
  }

  function renderMart() {
    if (!shopItems) {
      view.innerHTML = `<section class="archive-page">${pageHeader("Supplies & equipment", "Pokémart", "Official item prices and descriptions are read directly from PokéAPI.")}<article class="paper-panel loading-shop"><span class="loading-line"></span><p>Opening the stock ledger…</p></article></section>`;
      loadShopItems().then(() => { if (activeTab === "mart") renderMart(); }).catch(() => {
        if (activeTab === "mart") view.innerHTML += emptyState("The stock ledger is unavailable", "PokéAPI could not be reached. Your money and inventory are unchanged.", '<button class="button" type="button" data-action="retry-mart">Try again</button>');
      });
      return;
    }
    const stock = shopItems.map((item) => `
      <article class="shop-card paper-panel">
        <div class="shop-sprite"><img src="${escapeHtml(item.sprite)}" alt="" /></div>
        <p class="eyebrow">Standard balls</p>
        <h2>${escapeHtml(item.displayName)}</h2>
        <p>${escapeHtml(item.description)}</p>
        <dl><dt>Price</dt><dd>₽${item.cost.toLocaleString()}</dd><dt>In bag</dt><dd>${state.inventory[item.name] || 0}</dd></dl>
        <button class="button button-primary" type="button" data-action="buy-ball" data-ball="${item.name}" ${state.money < item.cost ? "disabled" : ""}>Buy one · ₽${item.cost.toLocaleString()}</button>
      </article>`).join("");
    view.innerHTML = `
      <section class="archive-page">
        ${pageHeader("Supplies & equipment", "Pokémart", "Stock your field bag before the next egg hatches. Prices come directly from PokéAPI.", `<div class="wallet-stamp"><span>available funds</span><b>₽${state.money.toLocaleString()}</b></div>`)}
        <div class="shop-grid">${stock}</div>
        <p class="archive-footnote">Your registration kit includes five Poké Balls. Master Balls remain archive-controlled and are not sold.</p>
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
        <small>highest combined ${statLabel(stat)} wins</small>
      </button>`).join("");
    const latest = state.competitionLog[0];
    view.innerHTML = `
      <section class="archive-page">
        ${pageHeader("Six-on-six stat trials", "Competitions", "Choose one discipline. Your team’s calculated stats are combined and compared with a level-matched NPC team.", `<div class="record-stamp"><b>${state.statistics.competitionsWon}</b><span>victories</span></div>`)}
        <article class="paper-panel team-sheet">
          <div class="panel-label">Registered team / ${team.length} of 6</div>
          ${team.length ? `<div class="team-strip">${teamStrip}</div>` : '<p class="team-empty">Choose competitors from the PC archive.</p>'}
          ${team.length !== 6 ? '<button class="button button-primary" type="button" data-tab="pc">Select your six</button>' : '<p class="ready-mark">✓ team ready for judging</p>'}
        </article>
        <div class="contest-grid">${contests}</div>
        ${latest ? `<article class="paper-panel latest-result"><p class="eyebrow">Latest result</p><h2>${escapeHtml(latest.title)}</h2><p>${escapeHtml(latest.summary)}</p><time>${new Date(latest.at).toLocaleString()}</time></article>` : ""}
      </section>`;
  }

  function renderSettings() {
    const generationNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    const generationRegions = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar", "Paldea"];
    const generationChecks = generationNumerals.map((numeral, index) => {
      const generation = index + 1;
      return `<label class="check-card"><input type="checkbox" name="generation" value="${generation}" ${state.settings.generations.includes(generation) ? "checked" : ""} /><span><b>Generation ${numeral}</b><small>${generationRegions[index]}</small></span></label>`;
    }).join("");
    const themes = [
      ["field", "Field ledger", "Parchment, navy ink, and vermilion labels"],
      ["night", "Night archive", "Midnight paper, cyan notes, and amber stamps"],
      ["herbarium", "Herbarium", "Sage paper, forest ink, and pressed-flower warmth"],
      ["mono", "Monochrome", "High-contrast black, white, and graphite"]
    ].map(([value, label, description]) => `<label class="theme-card" data-theme-preview="${value}"><input type="radio" name="theme" value="${value}" ${state.settings.theme === value ? "checked" : ""} /><span class="theme-swatch"></span><b>${label}</b><small>${description}</small></label>`).join("");
    view.innerHTML = `
      <section class="archive-page settings-page">
        ${pageHeader("Archive preferences", "Settings", "Personalise the researcher record, eligible regions, and the visual treatment of the whole interface.")}
        <form id="settings-form" class="settings-form">
          <article class="paper-panel settings-section">
            <p class="eyebrow">Researcher record</p><h2>Identity</h2>
            <div class="field"><label for="settings-name">Researcher name</label><input id="settings-name" name="name" maxlength="24" value="${escapeHtml(state.player.name)}" required /></div>
            <dl class="static-details"><dt>Date of birth</dt><dd>${new Date(`${state.player.dob}T12:00:00`).toLocaleDateString()}</dd><dt>Archive opened</dt><dd>${new Date(state.player.createdAt).toLocaleDateString()}</dd></dl>
          </article>
          <article class="paper-panel settings-section settings-wide">
            <p class="eyebrow">Eligible eggs</p><h2>Generations</h2><p class="settings-copy">Choose any combination from Generations I–IX. Every Pokémon uses PokeAPI’s Black & White collection, including the custom Gen V-style sprites created for National Dex IDs above 650.</p>
            <div class="check-grid">${generationChecks}</div>
          </article>
          <article class="paper-panel settings-section settings-wide">
            <p class="eyebrow">Interface treatment</p><h2>Theme</h2><div class="theme-grid">${themes}</div>
          </article>
          <div class="settings-actions"><p id="settings-error" class="form-error"></p><button class="button button-primary" type="submit">Save archive settings</button></div>
        </form>
        <article class="danger-zone"><div><p class="eyebrow">Irreversible action</p><h2>Reset the archive</h2><p>Delete the player, Pokédex, PC, money, streak, and every saved record on this device.</p></div><button class="button button-accent" type="button" data-action="request-reset">Reset all progress</button></article>
      </section>`;
  }

  function renderPlaceholder(tab) {
    view.innerHTML = `<section class="placeholder-page">${emptyState("Archive section unavailable", `The ${escapeHtml(tab)} ledger could not be opened.`)}</section>`;
  }

  function render() {
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === activeTab);
    });
    if (activeTab === "home") renderHome();
    else if (activeTab === "pokedex") renderPokedex();
    else if (activeTab === "pc") renderPc();
    else if (activeTab === "competitions") renderCompetitions();
    else if (activeTab === "mart") renderMart();
    else if (activeTab === "settings") renderSettings();
    else renderPlaceholder(activeTab);
    updateHeader();
    view.focus({ preventScroll: true });
  }

  function switchTab(tab) {
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
      if (state.egg && Date.now() >= state.egg.hatchAt) {
        hatchEgg();
        return;
      }
      if (state.encounter && accrueEncounterExperience() && activeTab === "home") {
        renderEncounterHome();
        return;
      }
      if (activeTab !== "home") return;
      const hatchCountdown = document.getElementById("hatch-countdown");
      const giftCountdown = document.getElementById("gift-countdown");
      const eggProgress = document.getElementById("egg-progress");
      if (hatchCountdown && state.egg) hatchCountdown.textContent = formatDuration(state.egg.hatchAt - Date.now());
      if (giftCountdown) giftCountdown.textContent = formatDuration(millisecondsUntilTomorrow());
      if (eggProgress && state.egg) {
        eggProgress.style.width = `${Math.min(100, ((Date.now() - state.egg.laidAt) / HATCH_DURATION) * 100)}%`;
      }
    }, 1000);
  }

  function showOnboarding() {
    const today = localDateKey();
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <p class="eyebrow">Field registration</p>
          <h1 id="welcome-title">Begin your archive</h1>
          <p class="modal-intro">Every hatchery begins with a researcher and a blank ledger. These details stay in this browser.</p>
          <form id="onboarding-form" class="form-grid">
            <div class="field"><label for="player-name">Researcher name</label><input id="player-name" name="name" maxlength="24" autocomplete="name" required /></div>
            <div class="field"><label for="player-dob">Date of birth</label><input id="player-dob" name="dob" type="date" max="${today}" required /></div>
            <p id="onboarding-error" class="form-error" role="alert"></p>
            <div class="button-row"><button class="button button-primary" type="submit">Register & receive first egg</button></div>
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
    const error = document.getElementById("onboarding-error");
    if (name.length < 2) {
      error.textContent = "Please enter at least two characters for your name.";
      return;
    }
    if (!dob || dob > localDateKey()) {
      error.textContent = "Please enter a valid date of birth.";
      return;
    }
    state.player = { name, dob, createdAt: new Date().toISOString() };
    ensureEgg();
    applyDailyReward();
    saveState();
    modalRoot.innerHTML = "";
    render();
    toast(`Welcome, ${name}. Your first egg has been placed in incubation.`);
  }

  function ballMark(name) {
    const modifier = name.replace("-ball", "");
    return `<span class="ball-mark ball-${modifier}" aria-hidden="true"><i></i></span>`;
  }

  function showBallChooser() {
    if (!state.encounter) return;
    const balls = ["poke-ball", "great-ball", "ultra-ball"].map((name) => {
      const count = state.inventory[name] || 0;
      return `<button class="ball-choice" type="button" data-action="throw-ball" data-ball="${name}" ${count <= 0 ? "disabled" : ""}>${ballMark(name)}<span><strong>${displayBallName(name)}</strong><small>${count} in bag · ${BALL_BONUSES[name]}× catch modifier</small></span></button>`;
    }).join("");
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <section class="modal paper-panel ball-modal" role="dialog" aria-modal="true" aria-labelledby="ball-title">
          <p class="eyebrow">Field bag</p><h2 id="ball-title">Choose a Poké Ball</h2>
          <p class="modal-intro">${escapeHtml(state.encounter.displayName)} is at full HP with a species catch rate of ${state.encounter.captureRate}. Each throw uses the main-series catch and four-shake calculation.</p>
          <div class="ball-list">${balls}</div>
          <div class="button-row"><button class="button" type="button" data-close-modal>Keep observing</button><button class="button" type="button" data-tab="mart">Visit Pokémart</button></div>
        </section>
      </div>`;
  }

  function calculateCatch(pokemon, ball) {
    if (ball === "master-ball") return { caught: true, shakes: 4 };
    const maximumHp = statValue(pokemon, "hp");
    const currentHp = maximumHp;
    const modifier = BALL_BONUSES[ball] || 1;
    const modifiedRate = Math.floor((((3 * maximumHp) - (2 * currentHp)) * pokemon.captureRate * modifier) / (3 * maximumHp));
    if (modifiedRate >= 255) return { caught: true, shakes: 4 };
    const threshold = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, modifiedRate))));
    let shakes = 0;
    while (shakes < 4 && randomInt(0, 65536) < threshold) shakes += 1;
    return { caught: shakes === 4, shakes };
  }

  function catchEncounter(ball) {
    const pokemon = state.encounter;
    if (!pokemon || !BALL_BONUSES[ball] || (state.inventory[ball] || 0) <= 0) return;
    state.inventory[ball] -= 1;
    pokemon.catchAttempts += 1;
    const result = calculateCatch(pokemon, ball);
    if (result.caught) {
      pokemon.caughtAt = new Date().toISOString();
      pokemon.ot = state.player.name;
      pokemon.caughtWith = ball;
      state.pc.push(pokemon);
      state.encounter = null;
      state.statistics.pokemonCaught += 1;
      ensureEgg();
      saveState();
      modalRoot.innerHTML = `
        <div class="modal-backdrop"><section class="modal paper-panel catch-result" role="dialog" aria-modal="true" aria-labelledby="catch-title">
          <p class="eyebrow">Four shakes confirmed</p><h2 id="catch-title">Caught!</h2>
          <img class="result-sprite" src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.displayName)}" />
          <p class="modal-intro">${escapeHtml(pokemon.displayName)} has been transferred to your PC. A new egg is already waiting in the incubator.</p>
          <button class="button button-primary" type="button" data-close-modal data-tab="pc">Open PC summary</button>
        </section></div>`;
      render();
    } else {
      saveState();
      modalRoot.innerHTML = `
        <div class="modal-backdrop"><section class="modal paper-panel catch-result" role="dialog" aria-modal="true" aria-labelledby="escape-title">
          <p class="eyebrow">Catch attempt ${pokemon.catchAttempts}</p><h2 id="escape-title">It broke free</h2>
          <div class="shake-record" aria-label="${result.shakes} successful shakes">${[0, 1, 2, 3].map((index) => `<span class="${index < result.shakes ? "is-filled" : ""}"></span>`).join("")}</div>
          <p class="modal-intro">The ball held for ${result.shakes} shake${result.shakes === 1 ? "" : "s"}. ${escapeHtml(pokemon.displayName)} is still here and still gaining experience.</p>
          <div class="button-row"><button class="button button-primary" type="button" data-action="choose-ball">Try another ball</button><button class="button" type="button" data-close-modal>Keep observing</button></div>
        </section></div>`;
      render();
    }
  }

  function showReleaseConfirmation() {
    if (!state.encounter) return;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="release-title">
        <p class="eyebrow">Release decision</p><h2 id="release-title">Return ${escapeHtml(state.encounter.displayName)} to the wild?</h2>
        <p class="modal-intro">The Pokédex entry remains, but this individual and its IV record cannot be recovered. You will receive a small field grant.</p>
        <div class="button-row"><button class="button button-accent" type="button" data-action="confirm-release">Release Pokémon</button><button class="button" type="button" data-close-modal>Cancel</button></div>
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
    toast(`${name} was released safely. Field grant: +₽${reward}.`);
  }

  function showPokedexEntry(speciesId) {
    const entry = state.pokedex[String(speciesId)];
    if (!entry) return;
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel summary-modal" role="dialog" aria-modal="true" aria-labelledby="dex-entry-title">
        <p class="eyebrow">National No. ${String(entry.speciesId).padStart(3, "0")}</p><h2 id="dex-entry-title">${escapeHtml(entry.displayName)}</h2>
        <div class="dex-entry-sprites"><figure><img src="${escapeHtml(entry.sprite)}" alt="${escapeHtml(entry.displayName)}" /><figcaption>standard</figcaption></figure>${entry.shinySeen && entry.shinySprite ? `<figure><img src="${escapeHtml(entry.shinySprite)}" alt="Shiny ${escapeHtml(entry.displayName)}" /><figcaption>shiny · ${entry.shinySeen}</figcaption></figure>` : ""}</div>
        <dl class="summary-list"><dt>Total hatched</dt><dd>${entry.seen}</dd><dt>Shiny hatches</dt><dd>${entry.shinySeen}</dd><dt>First recorded</dt><dd>${new Date(entry.firstEncounteredAt).toLocaleString()}</dd></dl>
        <button class="button button-primary" type="button" data-close-modal>Close record</button>
      </section></div>`;
  }

  function showPcSummary(uid) {
    const pokemon = state.pc.find((entry) => entry.uid === uid);
    if (!pokemon) return;
    const stats = CONTEST_STATS.map((stat) => `<tr><th>${statLabel(stat)}</th><td>${pokemon.baseStats[stat]}</td><td>${pokemon.ivs[stat]}</td><td>${statValue(pokemon, stat)}</td></tr>`).join("");
    const evolutionNotes = (pokemon.evolutionHistory || []).map((entry) => `<li>${escapeHtml(entry.from)} → ${escapeHtml(entry.to)} at level ${entry.level}</li>`).join("");
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel summary-modal pc-summary" role="dialog" aria-modal="true" aria-labelledby="pc-summary-title">
        <div class="summary-hero"><img src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.displayName)}" /><div><p class="eyebrow">${pokemon.shiny ? "✦ Shiny individual" : `National No. ${String(pokemon.speciesId).padStart(3, "0")}`}</p><h2 id="pc-summary-title">${escapeHtml(pokemon.nickname || pokemon.displayName)}</h2><p>${pokemon.nickname ? escapeHtml(pokemon.displayName) + " · " : ""}Level ${pokemon.level}</p></div></div>
        <form id="nickname-form" class="nickname-form" data-uid="${pokemon.uid}"><div class="field"><label for="nickname">Nickname</label><input id="nickname" name="nickname" maxlength="16" value="${escapeHtml(pokemon.nickname || "")}" placeholder="Use species name" /></div><button class="button" type="submit">Save nickname</button></form>
        <dl class="summary-list two-column"><dt>Ability</dt><dd>${titleCase(pokemon.ability)}${pokemon.hiddenAbility ? " · hidden" : ""}</dd><dt>Types</dt><dd>${pokemon.types.map(titleCase).join(" / ")}</dd><dt>Experience</dt><dd>${pokemon.experience.toLocaleString()} XP</dd><dt>Caught with</dt><dd>${displayBallName(pokemon.caughtWith)}</dd><dt>Original trainer</dt><dd>${escapeHtml(pokemon.ot)}</dd><dt>Encounter date</dt><dd>${new Date(pokemon.encounteredAt).toLocaleString()}</dd><dt>Catch date</dt><dd>${new Date(pokemon.caughtAt).toLocaleString()}</dd></dl>
        <table class="stat-table"><thead><tr><th>Stat</th><th>Base</th><th>IV</th><th>Current</th></tr></thead><tbody>${stats}</tbody></table>
        ${evolutionNotes ? `<div class="evolution-notes"><p class="eyebrow">Evolution record</p><ul>${evolutionNotes}</ul></div>` : ""}
        <button class="button button-primary" type="button" data-close-modal>Close summary</button>
      </section></div>`;
  }

  function toggleTeam(uid) {
    if (state.team.includes(uid)) state.team = state.team.filter((id) => id !== uid);
    else if (state.team.length < 6) state.team.push(uid);
    else {
      toast("A competition team can contain only six Pokémon.");
      return;
    }
    saveState();
    render();
  }

  function buyBall(name) {
    const item = shopItems?.find((entry) => entry.name === name);
    if (!item || state.money < item.cost) {
      toast("There are not enough Pokédollars for that purchase.");
      return;
    }
    state.money -= item.cost;
    state.inventory[name] = (state.inventory[name] || 0) + 1;
    saveState();
    renderMart();
    toast(`${item.displayName} added to the field bag.`);
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
      ivs: rollIvs(),
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
        <p class="eyebrow">${statLabel(stat)} competition</p><h2 id="judging-title">Judges are calculating…</h2><p class="modal-intro">A random six-Pokémon challenger team is being assembled from your enabled generations.</p><span class="loading-line"></span>
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
      const playerWon = playerTotal === npcTotal ? randomInt(0, 2) === 0 : playerTotal > npcTotal;
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
      }
      const title = playerWon ? `${statLabel(stat)} victory` : `${statLabel(stat)} defeat`;
      const summary = `Your team recorded ${playerTotal}; the NPC team recorded ${npcTotal}.`;
      state.competitionLog.unshift({ title, summary, stat, playerTotal, npcTotal, won: playerWon, at: new Date().toISOString() });
      state.competitionLog = state.competitionLog.slice(0, 20);
      saveState();
      const teamVisuals = (members, values) => members.map((pokemon, index) => `<figure><img src="${escapeHtml(pokemon.sprite)}" alt="" /><figcaption>${escapeHtml(pokemon.nickname || pokemon.displayName)}<b>${values[index]}</b></figcaption></figure>`).join("");
      modalRoot.innerHTML = `
        <div class="modal-backdrop"><section class="modal paper-panel competition-result" role="dialog" aria-modal="true" aria-labelledby="result-title">
          <p class="eyebrow">${statLabel(stat)} competition · official result</p><h2 id="result-title">${playerWon ? "Victory recorded" : "The challenger wins"}</h2>
          <div class="scoreboard"><div><span>Your team</span><strong>${playerTotal}</strong></div><b>${playerWon ? "WIN" : "LOSS"}</b><div><span>NPC team</span><strong>${npcTotal}</strong></div></div>
          <div class="result-team"><section><h3>Your six</h3>${teamVisuals(team, playerValues)}</section><section><h3>Challenger six</h3>${teamVisuals(npcTeam, npcValues)}</section></div>
          ${playerWon ? `<div class="xp-awards"><p class="eyebrow">Inverse contribution XP · 600 point pool</p>${awards.map((award) => `<span><img src="${escapeHtml(award.pokemon.sprite)}" alt="" /><b>${escapeHtml(award.pokemon.nickname || award.pokemon.displayName)}</b> +${award.amount} XP${award.leveled ? ` · Lv. ${award.pokemon.level}` : ""}</span>`).join("")}${evolutionMessages.map((message) => `<strong class="evolution-callout">${escapeHtml(message)}!</strong>`).join("")}</div>` : '<p class="modal-intro">Only the winning team earns experience. Adjust your six and try again.</p>'}
          <button class="button button-primary" type="button" data-close-modal>Record result</button>
        </section></div>`;
    } catch {
      modalRoot.innerHTML = `
        <div class="modal-backdrop"><section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="contest-error"><p class="eyebrow">Connection interrupted</p><h2 id="contest-error">The competition was postponed</h2><p class="modal-intro">No result or experience was recorded. PokéAPI could not complete the NPC team data.</p><button class="button button-primary" type="button" data-close-modal>Return</button></section></div>`;
    } finally {
      isCompetitionRunning = false;
      if (activeTab === "competitions") renderCompetitions();
    }
  }

  function saveSettings(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const name = String(form.get("name") || "").trim();
    const generations = form.getAll("generation").map(Number).filter((generation) => generation >= 1 && generation <= 9);
    const error = document.getElementById("settings-error");
    if (name.length < 2) {
      error.textContent = "Researcher name must contain at least two characters.";
      return;
    }
    if (!generations.length) {
      error.textContent = "Keep at least one generation enabled for future eggs.";
      return;
    }
    state.player.name = name;
    state.settings.generations = generations;
    state.settings.theme = String(form.get("theme") || "field");
    enabledSpeciesTotal = 0;
    saveState();
    renderSettings();
    toast("Archive settings saved.");
  }

  function showResetConfirmation() {
    modalRoot.innerHTML = `
      <div class="modal-backdrop"><section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="reset-title"><p class="eyebrow">Final confirmation</p><h2 id="reset-title">Erase the entire archive?</h2><p class="modal-intro">This permanently deletes all local progress, including caught Pokémon and shiny records. It cannot be undone.</p><div class="button-row"><button class="button button-accent" type="button" data-action="confirm-reset">Erase everything</button><button class="button" type="button" data-close-modal>Keep archive</button></div></section></div>`;
  }

  function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function showHelp() {
    modalRoot.innerHTML = `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal paper-panel" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <p class="eyebrow">Field guide</p>
          <h2 id="help-title">How the hatchery works</h2>
          <p class="modal-intro">Eggs hatch after six real hours, even while the page is closed. Higher base-stat totals are rarer, shiny odds are 1 / 8192, and every Pokémon receives six random IVs from 0–31. Hatched species enter the Pokédex; caught individuals enter the PC.</p>
          <dl class="summary-list"><dt>Daily grants</dt><dd>₽100 × 1.25 for each consecutive day</dd><dt>Passive training</dt><dd>Observed hatchlings gain 1 XP per minute</dd><dt>Competitions</dt><dd>Winning teams split 600 XP inversely by contribution</dd><dt>Save location</dt><dd>This browser and device only</dd></dl>
          <div class="button-row"><button class="button button-primary" type="button" data-close-modal>Return to archive</button></div>
        </section>
      </div>`;
  }

  function toast(message) {
    const element = document.createElement("div");
    element.className = "toast";
    element.textContent = message;
    toastRoot.appendChild(element);
    window.setTimeout(() => element.remove(), 4800);
  }

  document.addEventListener("click", (event) => {
    const tabButton = event.target.closest("[data-tab]");
    if (tabButton) switchTab(tabButton.dataset.tab);
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      const action = actionButton.dataset.action;
      if (action === "choose-ball") showBallChooser();
      else if (action === "throw-ball") catchEncounter(actionButton.dataset.ball);
      else if (action === "release-encounter") showReleaseConfirmation();
      else if (action === "confirm-release") releaseEncounter();
      else if (action === "pokedex-details") showPokedexEntry(actionButton.dataset.speciesId);
      else if (action === "pc-summary") showPcSummary(actionButton.dataset.uid);
      else if (action === "toggle-team") toggleTeam(actionButton.dataset.uid);
      else if (action === "buy-ball") buyBall(actionButton.dataset.ball);
      else if (action === "retry-mart") { shopItems = null; renderMart(); }
      else if (action === "enter-contest") runCompetition(actionButton.dataset.stat);
      else if (action === "request-reset") showResetConfirmation();
      else if (action === "confirm-reset") resetProgress();
    }
    if (event.target.closest("#menu-button")) {
      mobileNav.hidden = !mobileNav.hidden;
      menuButton.setAttribute("aria-expanded", String(!mobileNav.hidden));
    }
    if (event.target.closest("#help-button")) showHelp();
    if (event.target.closest("[data-close-modal]")) modalRoot.innerHTML = "";
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
      toast("Nickname record updated.");
    }
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
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.name === "theme") document.getElementById("app").dataset.theme = event.target.value;
  });

  updateHeader();
  if (state.player) {
    applyDailyReward();
    ensureEgg();
    render();
    if (state.egg && Date.now() >= state.egg.hatchAt) hatchEgg();
  } else {
    renderHome();
    showOnboarding();
  }
  startClock();
})();
