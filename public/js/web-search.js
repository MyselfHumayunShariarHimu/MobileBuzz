/**
 * MobileBuzz — Web Search client logic (Phase 17)
 * Calls /api/search first. FIX: same pattern as videos.js — falls back to
 * a direct "search on Google" link when /api/search is unreachable, so
 * this always does something useful without a key or server.
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.webSearch = (function () {
  'use strict';
  function search(query) {
    var lang = window.MobileBuzz.i18n.getLang();
    return fetch('/api/search?q=' + encodeURIComponent(query) + '&lang=' + lang)
      .then(function (r) {
        if (!r.ok) throw new Error('api/search unreachable or errored: ' + r.status);
        return r.json();
      })
      .catch(function () {
        return {
          items: [],
          isDemo: true,
          clientFallback: true,
          fallbackUrl: 'https://www.google.com/search?q=' + encodeURIComponent(query)
        };
      });
  }
  return { search: search };
})();
