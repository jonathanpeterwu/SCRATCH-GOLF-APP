const path = require('path');

// Test harness for the pure logic layer (services + data).
//
// The services import AsyncStorage, which does not exist outside React Native,
// so we install an in-memory stand-in into the module cache before anything
// under src/ is required. Everything else - rankings, fit, tee sheets, briefs -
// is plain JavaScript and runs directly under Node.

const ROOT = path.join(__dirname, '..', '..');

const store = new Map();

const asyncStorageMock = {
  getItem: async (key) => (store.has(key) ? store.get(key) : null),
  setItem: async (key, value) => { store.set(key, value); },
  removeItem: async (key) => { store.delete(key); },
  multiRemove: async (keys) => { keys.forEach((key) => store.delete(key)); },
  clear: async () => { store.clear(); },
};

const asyncStoragePath = require.resolve('@react-native-async-storage/async-storage', {
  paths: [ROOT],
});

require.cache[asyncStoragePath] = {
  id: asyncStoragePath,
  filename: asyncStoragePath,
  loaded: true,
  exports: { __esModule: true, default: asyncStorageMock, ...asyncStorageMock },
};

/** Require a module from src/ by its path relative to the repo root. */
const src = (relativePath) => require(path.join(ROOT, relativePath));

/** Drop a src module from the cache, to simulate a cold app start. */
const reload = (relativePath) => {
  delete require.cache[require.resolve(path.join(ROOT, relativePath))];
  return require(path.join(ROOT, relativePath));
};

module.exports = { ROOT, store, asyncStorageMock, src, reload };
