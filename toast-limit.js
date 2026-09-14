(function () {
  "use strict";

  const MAX_TOASTS_PER_LAUNCH = 3;
  const MAX_EVENT_HISTORY = 100;
  const suppressedEvents = [];
  let shownToastCount = 0;
  let nextEventId = 1;

  function notifyEventLogChanged() {
    window.dispatchEvent(new CustomEvent("pocket-hatchery-events-changed"));
  }

  function addSuppressedEvent(message) {
    const event = {
      id: nextEventId,
      message: String(message || "Hatchery notification"),
      at: Date.now()
    };
    nextEventId += 1;
    suppressedEvents.unshift(event);
    if (suppressedEvents.length > MAX_EVENT_HISTORY) suppressedEvents.length = MAX_EVENT_HISTORY;
    notifyEventLogChanged();
  }

  window.PocketHatcheryEvents = Object.freeze({
    getAll() {
      return suppressedEvents.map((event) => ({ ...event }));
    },
    clear() {
      if (!suppressedEvents.length) return;
      suppressedEvents.length = 0;
      notifyEventLogChanged();
    },
    maxToastsPerLaunch: MAX_TOASTS_PER_LAUNCH,
    maxEventHistory: MAX_EVENT_HISTORY
  });

  function installToastLimit() {
    const toastRoot = document.getElementById("toast-root");
    if (!toastRoot) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.classList.contains("toast")) continue;
          shownToastCount += 1;
          if (shownToastCount <= MAX_TOASTS_PER_LAUNCH) continue;
          const message = node.textContent.trim();
          node.remove();
          addSuppressedEvent(message);
        }
      }
    });

    observer.observe(toastRoot, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installToastLimit, { once: true });
  } else {
    installToastLimit();
  }
})();
