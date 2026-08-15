(function () {
  "use strict";

  const STORAGE_KEY = "pocket_hatchery_save_v1";
  const REOPEN_SESSION_KEYS = [
    "pocket_hatchery_reopen_expeditions",
    "pocket_hatchery_reopen_achievements"
  ];

  let pageIsHiding = false;

  function featureReloadPending() {
    try {
      return REOPEN_SESSION_KEYS.some((key) => window.sessionStorage.getItem(key) === "1");
    } catch {
      return false;
    }
  }

  function shouldProtectSave(storageArea, key) {
    return storageArea === window.localStorage
      && String(key) === STORAGE_KEY
      && pageIsHiding
      && featureReloadPending();
  }

  const nativeSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (shouldProtectSave(this, key)) return;
    return nativeSetItem.call(this, key, value);
  };

  window.addEventListener("pagehide", () => {
    pageIsHiding = true;
  }, { capture: true });
})();
