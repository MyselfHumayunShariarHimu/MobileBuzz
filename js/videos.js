/**
 * MobileBuzz — YouTube search client logic (Phase 16)
 * Calls /api/youtube first. FIX: on plain static hosting /api/youtube
 * doesn't exist, so this now falls back to a "search on YouTube directly"
 * link instead of surfacing a connection error — the feature always does
 * something useful, with no key and no server required.
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.videos = (function () {
  'use strict';
  function search(query) {
    var lang = window.MobileBuzz.i18n.getLang();
    return fetch('/api/youtube?q=' + encodeURIComponent(query) + '&lang=' + lang)
      .then(function (r) {
        if (!r.ok) throw new Error('api/youtube unreachable or errored: ' + r.status);
        return r.json();
      })
      .catch(function () {
        return {
          items: [],
          isDemo: true,
          clientFallback: true,
          fallbackUrl: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
        };
      });
  }
  return { search: search };
})();
