// Polyfill for the `window.storage` key-value API that Claude.ai artifacts
// provide natively. Outside that environment there is no such browser API,
// so this file recreates the same get/set/delete/list shape on top of
// localStorage, keeping the rest of the app's code unchanged.
//
// Import this file once, before the app renders (see src/main.jsx).

const STORE_KEY = "__daybook_kv_store__";
const RESET_VERSION_KEY = "__daybook_reset_version__";
const RESET_VERSION = "2026-09-14-start-from-scratch";

function resetStoreForFreshStart() {
  try {
    if (localStorage.getItem(RESET_VERSION_KEY) === RESET_VERSION) {
      return false;
    }
    localStorage.removeItem(STORE_KEY);
    localStorage.setItem(RESET_VERSION_KEY, RESET_VERSION);
    return true;
  } catch {
    return false;
  }
}

window.daybookStorageResetPerformed = resetStoreForFreshStart();

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeStore(obj) {
  localStorage.setItem(STORE_KEY, JSON.stringify(obj));
}

function namespacedKey(key, shared) {
  return `${shared ? "shared" : "private"}:${key}`;
}

window.storage = {
  async get(key, shared = false) {
    const store = readStore();
    const k = namespacedKey(key, shared);
    if (!(k in store)) {
      throw new Error(`storage key not found: ${key}`);
    }
    return { key, value: store[k], shared: !!shared };
  },

  async set(key, value, shared = false) {
    const store = readStore();
    store[namespacedKey(key, shared)] = value;
    writeStore(store);
    return { key, value, shared: !!shared };
  },

  async delete(key, shared = false) {
    const store = readStore();
    const k = namespacedKey(key, shared);
    const existed = k in store;
    delete store[k];
    writeStore(store);
    return { key, deleted: existed, shared: !!shared };
  },

  async list(prefix = "", shared = false) {
    const store = readStore();
    const nsPrefix = namespacedKey(prefix, shared);
    const keys = Object.keys(store)
      .filter((k) => k.startsWith(nsPrefix))
      .map((k) => k.slice(namespacedKey("", shared).length));
    return { keys, prefix, shared: !!shared };
  },
};
