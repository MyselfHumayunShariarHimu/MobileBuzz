/**
 * MobileBuzz — localStorage / IndexedDB helper wrapper (Phase 7)
 * localStorage: small flags (lang, theme — already handled directly in
 * i18n.js/app.js). IndexedDB (via this tiny wrapper): bookmarks, learning
 * progress, recent searches. Never used for API keys (see §51).
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.storage = (function () {
  'use strict';
  var DB_NAME = 'mobilebuzz';
  var DB_VERSION = 1;
  var STORES = ['bookmarks', 'progress', 'recentSearches'];
  var dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) { resolve(null); return; } // graceful no-op if unavailable
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        STORES.forEach(function (name) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
        });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  function put(store, record) {
    return openDb().then(function (db) {
      if (!db) return fallbackPut(store, record);
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(record);
        tx.oncomplete = function () { resolve(record); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function getAll(store) {
    return openDb().then(function (db) {
      if (!db) return fallbackGetAll(store);
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, 'readonly');
        var req = tx.objectStore(store).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function remove(store, id) {
    return openDb().then(function (db) {
      if (!db) return fallbackRemove(store, id);
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).delete(id);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  // --- localStorage fallback (older browsers / privacy modes without IndexedDB) ---
  function fbKey(store) { return 'mb_fallback_' + store; }
  function fallbackGetAll(store) {
    try { return Promise.resolve(JSON.parse(localStorage.getItem(fbKey(store)) || '[]')); }
    catch (e) { return Promise.resolve([]); }
  }
  function fallbackPut(store, record) {
    return fallbackGetAll(store).then(function (list) {
      var idx = list.findIndex(function (r) { return r.id === record.id; });
      if (idx === -1) list.push(record); else list[idx] = record;
      localStorage.setItem(fbKey(store), JSON.stringify(list));
      return record;
    });
  }
  function fallbackRemove(store, id) {
    return fallbackGetAll(store).then(function (list) {
      localStorage.setItem(fbKey(store), JSON.stringify(list.filter(function (r) { return r.id !== id; })));
    });
  }

  // Convenience API
  return {
    bookmarkAdd: function (item) { return put('bookmarks', item); },
    bookmarkRemove: function (id) { return remove('bookmarks', id); },
    bookmarksList: function () { return getAll('bookmarks'); },

    progressSet: function (lessonId, data) {
      return put('progress', Object.assign({ id: lessonId }, data));
    },
    progressGetAll: function () { return getAll('progress'); },

    recentSearchAdd: function (query) {
      return put('recentSearches', { id: query, query: query, ts: Date.now() });
    },
    recentSearchesList: function () {
      return getAll('recentSearches').then(function (list) {
        return list.sort(function (a, b) { return b.ts - a.ts; }).slice(0, 10);
      });
    }
  };
})();
