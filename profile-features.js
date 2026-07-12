(function () {
  "use strict";

  const FEATURE_RULES = [
    {
      id: "founder_dev_tools",
      match(profile, helpers) {
        return helpers.normalizeName(profile?.name) === "Cambell James Smith" && helpers.normalizeDobKey(profile?.dob) === "10/02/2001";
      },
      features: {
        devTools: true
      }
    },
    {
      id: "sakinah_sprigatito_luck",
      match(profile, helpers) {
        return helpers.normalizeName(profile?.name) === "Sakinah";
      },
      features: {
        firstEggSpeciesId: 906,
        shinyOddsMultiplier: 2
      }
    }
  ];

  function normalizeNameFallback(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function normalizeDobKeyFallback(value) {
    const text = String(value || "").trim();
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const slashed = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashed) return text;
    return "";
  }

  function getFeatures(profile, helpers = {}) {
    const safeHelpers = {
      normalizeName: typeof helpers.normalizeName === "function" ? helpers.normalizeName : normalizeNameFallback,
      normalizeDobKey: typeof helpers.normalizeDobKey === "function" ? helpers.normalizeDobKey : normalizeDobKeyFallback
    };
    return FEATURE_RULES.reduce((features, rule) => {
      try {
        if (rule.match(profile, safeHelpers)) Object.assign(features, rule.features);
      } catch (error) {
        console.warn(`Profile feature rule failed: ${rule.id}`, error);
      }
      return features;
    }, {});
  }

  window.PocketHatcheryProfileFeatures = Object.freeze({
    getFeatures
  });
})();
