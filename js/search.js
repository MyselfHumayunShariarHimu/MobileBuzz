/**
 * MobileBuzz — Universal + Smart Search (Phase 5)
 * Fans out across local sources (Knowledge Base, Devices, Components, Tools,
 * Lessons). One source failing never blocks the others — each result set is
 * returned independently so the UI can render per-tab loading/error states.
 * YouTube/Web results are wired in Phase 16-17 and layered on top of this.
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.search = (function () {
  'use strict';
  var synonymMap = null; // canonical token -> [variant spellings], inverted at load time

  function loadSynonyms() {
    if (synonymMap) return Promise.resolve(synonymMap);
    return fetch('data/synonyms.json')
      .then(function (r) { return r.json(); })
      .then(function (raw) {
        // Invert: every variant spelling maps back to its canonical token.
        var index = {};
        Object.keys(raw).forEach(function (canonical) {
          raw[canonical].forEach(function (variant) {
            index[normalizeToken(variant)] = canonical;
          });
        });
        synonymMap = index;
        return synonymMap;
      })
      .catch(function () { synonymMap = {}; return synonymMap; });
  }

  function normalizeToken(s) {
    return String(s).toLowerCase().trim().replace(/\s+/g, ' ');
  }

  // Normalizes a raw query into canonical token(s) + original words, so
  // "charge hocche na" and "চার্জ হচ্ছে না" both resolve toward the same
  // underlying concept (see §42-43).
  function expandQuery(query) {
    return loadSynonyms().then(function (index) {
      var norm = normalizeToken(query);
      var canonical = index[norm];
      var words = norm.split(' ').filter(Boolean);
      return { raw: norm, canonical: canonical, words: words };
    });
  }

  var STOPWORDS = ['না', 'কি', 'কী', 'এ', 'ও', 'আর', 'কে', 'হয়', 'তো', 'যে', 'কে', 'কোন',
    'the', 'is', 'a', 'an', 'to', 'in', 'on', 'of', 'not', 'no', 'my', 'it'];

  function textMatches(haystack, expanded) {
    if (!haystack) return false;
    var h = normalizeToken(haystack);
    if (expanded.canonical && h.indexOf(expanded.canonical.replace(/_/g, ' ')) !== -1) return true;
    return expanded.words.some(function (w) {
      return w.length > 2 && STOPWORDS.indexOf(w) === -1 && h.indexOf(w) !== -1;
    });
  }

  function searchKnowledgeBase(expanded) {
    return window.MobileBuzz.knowledge.getAll().then(function (list) {
      return list.filter(function (a) {
        return textMatches(a.title.bn, expanded) || textMatches(a.title.en, expanded) ||
          (a.symptoms || []).some(function (s) { return textMatches(s.bn, expanded) || textMatches(s.en, expanded); });
      });
    }).catch(function () { return []; });
  }

  function searchDevices(expanded) {
    return window.MobileBuzz.devices.load().then(function (list) {
      return list.filter(function (d) {
        return textMatches(d.brand, expanded) || textMatches(d.model, expanded);
      });
    }).catch(function () { return []; });
  }

  function searchComponents(expanded) {
    return window.MobileBuzz.components.load().then(function (list) {
      return list.filter(function (c) { return textMatches(c.name.bn, expanded) || textMatches(c.name.en, expanded); });
    }).catch(function () { return []; });
  }

  function searchTools(expanded) {
    return window.MobileBuzz.tools.load().then(function (list) {
      return list.filter(function (t) { return textMatches(t.name.bn, expanded) || textMatches(t.name.en, expanded); });
    }).catch(function () { return []; });
  }

  function searchLessons(expanded) {
    return fetch('data/lessons.json').then(function (r) { return r.json(); }).then(function (d) {
      return d.lessons.filter(function (l) { return textMatches(l.title.bn, expanded) || textMatches(l.title.en, expanded); });
    }).catch(function () { return []; });
  }

  // Returns { knowledgeBase, devices, components, tools, lessons } — each
  // resolved independently. Online sources (youtube, web) are merged in by
  // js/videos.js and js/web-search.js when this is called from the Search page.
  function searchAll(query) {
    return expandQuery(query).then(function (expanded) {
      return Promise.all([
        searchKnowledgeBase(expanded),
        searchDevices(expanded),
        searchComponents(expanded),
        searchTools(expanded),
        searchLessons(expanded)
      ]).then(function (results) {
        return {
          knowledgeBase: results[0],
          devices: results[1],
          components: results[2],
          tools: results[3],
          lessons: results[4]
        };
      });
    });
  }

  return { searchAll: searchAll, expandQuery: expandQuery };
})();
