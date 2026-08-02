(function () {
  "use strict";

  const mobileQuery = window.matchMedia("(max-width: 1100px)");
  const coarsePointerQuery = window.matchMedia("(hover: none), (pointer: coarse)");
  const root = document.documentElement;
  const body = document.body;
  const topbar = document.querySelector(".topbar");
  const menuButton = document.getElementById("menu-button");
  const mobileNav = document.getElementById("mobile-nav");
  const modalRoot = document.getElementById("modal-root");

  if (!topbar || !menuButton || !mobileNav || !modalRoot) return;

  function menuIsOpen() {
    return mobileQuery.matches && !mobileNav.hidden;
  }

  function modalIsOpen() {
    return Boolean(modalRoot.querySelector('.modal-backdrop [role="dialog"]'));
  }

  function setViewportVariables() {
    const overlayOpen = menuIsOpen() || modalIsOpen();
    const viewport = overlayOpen ? window.visualViewport : null;
    const headerHeight = Math.max(1, Math.round(topbar.getBoundingClientRect().height));

    root.style.setProperty("--mobile-header-height", `${headerHeight}px`);
    if (overlayOpen) {
      const height = Math.max(1, Math.round(viewport ? viewport.height : window.innerHeight));
      root.style.setProperty("--app-viewport-height", `${height}px`);
    } else {
      root.style.removeProperty("--app-viewport-height");
    }
  }

  function syncActiveMobileTab() {
    const activeTab = document.querySelector('.primary-nav [data-tab].is-active')?.dataset.tab
      || document.querySelector('[data-tab].is-active')?.dataset.tab
      || "";
    mobileNav.querySelectorAll("[data-tab]").forEach((button) => {
      const active = Boolean(activeTab && button.dataset.tab === activeTab);
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function syncUiState() {
    const menuOpen = menuIsOpen();
    const openModal = modalIsOpen();
    root.classList.toggle("mobile-menu-open", menuOpen);
    body.classList.toggle("mobile-menu-open", menuOpen);
    root.classList.toggle("modal-open", openModal);
    body.classList.toggle("modal-open", openModal);
    root.classList.toggle("has-coarse-pointer", coarsePointerQuery.matches);
    menuButton.setAttribute("aria-expanded", String(menuOpen));
    syncActiveMobileTab();
    setViewportVariables();
  }

  function closeMenu({ restoreFocus = false } = {}) {
    if (mobileNav.hidden) return;
    mobileNav.hidden = true;
    syncUiState();
    if (restoreFocus) menuButton.focus({ preventScroll: true });
  }

  const navObserver = new MutationObserver(syncUiState);
  navObserver.observe(mobileNav, { attributes: true, attributeFilter: ["hidden"] });

  const modalObserver = new MutationObserver(syncUiState);
  modalObserver.observe(modalRoot, { childList: true, subtree: true });

  document.addEventListener("click", (event) => {
    const clickedMenuButton = event.target.closest("#menu-button");
    if (clickedMenuButton) {
      window.requestAnimationFrame(() => {
        syncUiState();
        if (menuIsOpen()) {
          const activeButton = mobileNav.querySelector('[aria-current="page"]') || mobileNav.querySelector("button");
          activeButton?.focus({ preventScroll: true });
        }
      });
      return;
    }

    const clickedMobileTab = event.target.closest("#mobile-nav [data-tab]");
    if (clickedMobileTab) {
      window.requestAnimationFrame(() => closeMenu());
      return;
    }

    if (menuIsOpen() && !event.target.closest("#mobile-nav")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuIsOpen()) {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
    }
  });

  function handleBreakpointChange() {
    if (!mobileQuery.matches) mobileNav.hidden = true;
    syncUiState();
  }

  mobileQuery.addEventListener?.("change", handleBreakpointChange);
  coarsePointerQuery.addEventListener?.("change", syncUiState);
  window.addEventListener("resize", setViewportVariables, { passive: true });
  window.addEventListener("orientationchange", () => window.setTimeout(setViewportVariables, 50), { passive: true });
  window.visualViewport?.addEventListener("resize", setViewportVariables, { passive: true });

  syncUiState();
})();
