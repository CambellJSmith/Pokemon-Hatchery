(function () {
  "use strict";

  const DATABASE_NAME = "pocket_hatchery_storage";
  const DATABASE_VERSION = 1;
  const STORE_NAME = "save_backups";
  const STORAGE_PREFIX = "pocket_hatchery_";
  let lastSerializedValue = "";
  let warningHandler = null;
  let backupTimer = null;
  let pendingBackup = null;

  function report(error, message) {
    console.error(message, error);
    if (typeof warningHandler === "function") warningHandler(message, error);
    document.dispatchEvent(new CustomEvent("pocket-hatchery-storage-error", { detail: { message, error } }));
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB is unavailable."));
        return;
      }
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB could not be opened."));
    });
  }

  async function writeBackup(key, serializedValue) {
    const database = await openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({ serializedValue, savedAt: Date.now() }, key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("IndexedDB backup failed."));
      transaction.onabort = () => reject(transaction.error || new Error("IndexedDB backup was aborted."));
    });
    database.close();
  }

  async function readBackup(key) {
    try {
      const database = await openDatabase();
      const record = await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("IndexedDB backup read failed."));
      });
      database.close();
      return typeof record?.serializedValue === "string" ? record.serializedValue : null;
    } catch (error) {
      console.warn("The IndexedDB backup could not be read.", error);
      return null;
    }
  }

  function scheduleBackup(key, serializedValue) {
    pendingBackup = { key, serializedValue };
    if (backupTimer) window.clearTimeout(backupTimer);
    backupTimer = window.setTimeout(() => {
      const backup = pendingBackup;
      pendingBackup = null;
      backupTimer = null;
      if (backup) writeBackup(backup.key, backup.serializedValue).catch((error) => console.warn("The IndexedDB backup could not be refreshed.", error));
    }, 500);
  }

  async function removeBackup(key) {
    if (!("indexedDB" in window)) return;
    const database = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(key);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error("IndexedDB backup removal failed."));
        transaction.onabort = () => reject(transaction.error || new Error("IndexedDB backup removal was aborted."));
      });
    } finally {
      database.close();
    }
  }

  async function clearBackupStore() {
    if (!("indexedDB" in window)) return;
    const database = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).clear();
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error("IndexedDB backup clearing failed."));
        transaction.onabort = () => reject(transaction.error || new Error("IndexedDB backup clearing was aborted."));
      });
    } finally {
      database.close();
    }
  }

  function cancelPendingBackup() {
    if (backupTimer) window.clearTimeout(backupTimer);
    backupTimer = null;
    pendingBackup = null;
  }

  function clearOwnedStorage(storageArea) {
    if (!storageArea) return;
    const keys = [];
    for (let index = 0; index < storageArea.length; index += 1) {
      const key = storageArea.key(index);
      if (typeof key === "string" && key.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storageArea.removeItem(key));
  }

  function preserveMigrationBackup(key, serializedValue, fromVersion, toVersion) {
    const backupKey = `${key}_pre_v${toVersion}_backup`;
    try {
      if (!localStorage.getItem(backupKey)) localStorage.setItem(backupKey, serializedValue);
    } catch (error) {
      console.warn("The pre-upgrade local backup could not be written.", error);
    }
    if ("indexedDB" in window) writeBackup(backupKey, serializedValue).catch((error) => console.warn("The pre-upgrade IndexedDB backup could not be written.", error));
    return { backupKey, fromVersion, toVersion };
  }

  function configure(options = {}) {
    warningHandler = typeof options.onWarning === "function" ? options.onWarning : null;
  }

  function read(key) {
    try {
      const value = localStorage.getItem(key);
      lastSerializedValue = value || "";
      return value;
    } catch (error) {
      report(error, "Local save storage is unavailable. Progress may not persist after this session.");
      return null;
    }
  }

  function write(key, value) {
    const serializedValue = typeof value === "string" ? value : JSON.stringify(value);
    if (serializedValue === lastSerializedValue) return true;
    try {
      localStorage.setItem(key, serializedValue);
      lastSerializedValue = serializedValue;
      scheduleBackup(key, serializedValue);
      return true;
    } catch (error) {
      scheduleBackup(key, serializedValue);
      report(error, "The hatchery could not save locally. Export a backup before closing this page.");
      return false;
    }
  }

  async function remove(key) {
    cancelPendingBackup();
    let removedLocally = true;
    try {
      localStorage.removeItem(key);
      lastSerializedValue = "";
    } catch (error) {
      removedLocally = false;
      report(error, "The local hatchery save could not be removed.");
    }
    try {
      await removeBackup(key);
    } catch (error) {
      console.warn("The hatchery backup could not be removed.", error);
      return false;
    }
    return removedLocally;
  }

  async function clearAll() {
    cancelPendingBackup();
    lastSerializedValue = "";
    let clearedWebStorage = true;
    try {
      clearOwnedStorage(localStorage);
      clearOwnedStorage(window.sessionStorage);
    } catch (error) {
      clearedWebStorage = false;
      report(error, "The hatchery web storage could not be completely cleared.");
    }
    try {
      await clearBackupStore();
    } catch (error) {
      console.warn("The hatchery backup database could not be completely cleared.", error);
      return false;
    }
    return clearedWebStorage;
  }

  window.PocketHatcheryStorage = Object.freeze({ configure, read, write, remove, clearAll, readBackup, preserveMigrationBackup });
})();
