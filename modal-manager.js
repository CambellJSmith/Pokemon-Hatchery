(function () {
  "use strict";

  const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  function create(modalRoot, options = {}) {
    if (!modalRoot) throw new Error("A modal root is required.");
    const backgroundSelectors = options.backgroundSelectors || [".topbar", ".mobile-nav", ".view", ".statusbar"];
    const requestClose = typeof options.requestClose === "function" ? options.requestClose : () => {};
    let previousFocus = null;
    let activeDialog = null;

    function backgroundElements() {
      return backgroundSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    }

    function setBackgroundInert(inert) {
      backgroundElements().forEach((element) => {
        element.inert = inert;
        if (inert) element.setAttribute("aria-hidden", "true");
        else element.removeAttribute("aria-hidden");
      });
    }

    function focusFirstControl() {
      if (!activeDialog) return;
      const preferred = activeDialog.querySelector("[autofocus], [data-modal-initial-focus]");
      const focusable = preferred || activeDialog.querySelector(FOCUSABLE_SELECTOR) || activeDialog;
      if (!activeDialog.hasAttribute("tabindex")) activeDialog.setAttribute("tabindex", "-1");
      window.requestAnimationFrame(() => focusable.focus({ preventScroll: true }));
    }

    function activate() {
      const dialog = modalRoot.querySelector('[role="dialog"]');
      if (!dialog) {
        if (activeDialog) {
          activeDialog = null;
          setBackgroundInert(false);
          const restoreTarget = previousFocus;
          previousFocus = null;
          if (restoreTarget instanceof HTMLElement && restoreTarget.isConnected) restoreTarget.focus({ preventScroll: true });
        }
        return;
      }
      const isNewDialog = dialog !== activeDialog;
      if (!activeDialog) previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      activeDialog = dialog;
      setBackgroundInert(true);
      if (isNewDialog) focusFirstControl();
    }

    function handleKeydown(event) {
      if (!activeDialog) return;
      if (event.key === "Escape") {
        if (activeDialog.querySelector("[data-close-modal]")) {
          event.preventDefault();
          requestClose();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(activeDialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => !element.hidden && element.getClientRects().length > 0);
      if (!focusable.length) {
        event.preventDefault();
        activeDialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleClick(event) {
      if (!activeDialog) return;
      const explicitClose = event.target.closest("[data-close-modal]");
      if (explicitClose) {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.target instanceof HTMLElement
        && event.target.classList.contains("modal-backdrop")
        && activeDialog.querySelector("[data-close-modal]")) requestClose();
    }

    const observer = new MutationObserver(activate);
    observer.observe(modalRoot, { childList: true, subtree: true });
    document.addEventListener("keydown", handleKeydown);
    modalRoot.addEventListener("click", handleClick);
    activate();

    return Object.freeze({ activate, focusFirstControl });
  }

  window.PocketHatcheryModal = Object.freeze({ create });
})();
