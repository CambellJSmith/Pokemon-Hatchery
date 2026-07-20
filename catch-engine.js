(function () {
  "use strict";

  const DEFAULT_PROFILES = {
    "poke-ball": { speed: 1.06, window: 1.48, taps: 0.94, missAllowance: 1, label: "steady" },
    "premier-ball": { speed: 1.14, window: 1.64, taps: 0.84, missAllowance: 1, label: "smooth" },
    "great-ball": { speed: 1.28, window: 1.9, taps: 0.7, missAllowance: 1, label: "kind" },
    "ultra-ball": { speed: 1.46, window: 2.18, taps: 0.54, missAllowance: 1, label: "gentle" },
    "master-ball": { speed: Infinity, window: Infinity, taps: 0, missAllowance: Infinity, label: "certain" }
  };

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function create(options = {}) {
    const profiles = options.profiles || DEFAULT_PROFILES;
    const startScale = Number(options.startScale || 2.7);
    const endScale = Number(options.endScale || 0.45);
    const successInnerScale = Number(options.successInnerScale || 0.72);
    const successOuterScale = Number(options.successOuterScale || 1.08);

    function profile(ball) {
      return profiles[ball] || profiles["poke-ball"];
    }

    function difficulty(pokemon) {
      const captureRate = clamp(Number(pokemon?.captureRate || 45), 3, 255);
      const baseStatTotal = clamp(Number(pokemon?.baseStatTotal || 350), 180, 720);
      const rateDifficulty = 1 - ((captureRate - 3) / 252);
      const statDifficulty = (baseStatTotal - 180) / 540;
      return clamp((rateDifficulty * 0.72) + (statDifficulty * 0.28), 0, 1);
    }

    function targetCount(pokemon, ball) {
      const ballProfile = profile(ball);
      const baseCount = 2 + Math.floor(difficulty(pokemon) * 3);
      return clamp(Math.ceil(baseCount * ballProfile.taps), 2, 4);
    }

    function duration(pokemon, ball, index) {
      const ballProfile = profile(ball);
      const drift = 1 + (((index % 3) - 1) * 0.04);
      return Math.round(clamp((1725 - (difficulty(pokemon) * 360)) * ballProfile.speed * drift, 950, 3200));
    }

    function windowSize(pokemon, ball) {
      const ballProfile = profile(ball);
      return clamp((0.235 - (difficulty(pokemon) * 0.04)) * ballProfile.window, 0.19, 0.56);
    }

    function responseWindow(pokemon, ball) {
      const ballProfile = profile(ball);
      return Math.round(clamp((2250 - (difficulty(pokemon) * 460)) * ballProfile.window, 1350, 3900));
    }

    function successBounds(windowValue) {
      return {
        outer: clamp(successOuterScale + (windowValue * 0.38), 1.16, 1.38),
        inner: clamp(successInnerScale - (windowValue * 0.18), 0.58, 0.71)
      };
    }

    function quality(elapsed, targetDuration, windowValue) {
      const progress = clamp(elapsed / targetDuration, 0, 1);
      const scale = startScale + ((endScale - startScale) * progress);
      const bounds = successBounds(windowValue);
      if (scale <= bounds.outer && scale >= bounds.inner) {
        const middle = (bounds.outer + bounds.inner) / 2;
        const halfRange = (bounds.outer - bounds.inner) / 2;
        const distance = Math.abs(scale - middle);
        return { hit: true, label: distance <= halfRange * 0.32 ? "perfect" : "good" };
      }
      return { hit: false, label: scale > bounds.outer ? "early" : "late" };
    }

    function requiredHits(pokemon, ball) {
      const total = targetCount(pokemon, ball);
      const allowance = Math.max(0, Math.floor(Number(profile(ball).missAllowance || 0)));
      return Math.max(1, total - allowance);
    }

    return Object.freeze({ difficulty, targetCount, duration, windowSize, responseWindow, successBounds, quality, requiredHits });
  }

  window.PocketHatcheryCatchEngine = Object.freeze({ create });
})();
