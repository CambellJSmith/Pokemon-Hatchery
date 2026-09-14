(function () {
  "use strict";

  const MAX_TOASTS_PER_LAUNCH = 3;
  let shownToastCount = 0;

  function installToastLimit() {
    const toastRoot = document.getElementById("toast-root");
    if (!toastRoot) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.classList.contains("toast")) continue;
          shownToastCount += 1;
          if (shownToastCount > MAX_TOASTS_PER_LAUNCH) node.remove();
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
