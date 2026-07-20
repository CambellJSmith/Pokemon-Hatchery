(function () {
  "use strict";

  function create(options = {}) {
    const root = String(options.root || "").replace(/\/$/, "");
    const timeoutMs = Math.max(1000, Number(options.timeoutMs || 12000));
    const cache = new Map();
    const onStatus = typeof options.onStatus === "function" ? options.onStatus : () => {};

    async function fetchJson(resource) {
      const resourceText = String(resource || "");
      const url = /^https?:\/\//i.test(resourceText) ? resourceText : `${root}/${resourceText.replace(/^\//, "")}`;
      if (cache.has(url)) return cache.get(url);

      const request = (async () => {
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timeout = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
        try {
          const requestOptions = { headers: { Accept: "application/json" } };
          if (controller) requestOptions.signal = controller.signal;
          const response = await fetch(url, requestOptions);
          if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`);
          const data = await response.json();
          onStatus(true);
          return data;
        } catch (error) {
          cache.delete(url);
          onStatus(false);
          if (typeof DOMException === "function" && error instanceof DOMException && error.name === "AbortError") throw new Error("The Pokémon records took too long to respond.");
          throw error;
        } finally {
          if (timeout) window.clearTimeout(timeout);
        }
      })();

      cache.set(url, request);
      return request;
    }

    return Object.freeze({ fetchJson, clear: () => cache.clear() });
  }

  window.PocketHatcheryApi = Object.freeze({ create });
})();
