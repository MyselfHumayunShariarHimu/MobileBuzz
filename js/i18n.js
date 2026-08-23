/**
 * MobileBuzz — Translation Engine (Phase 2)
 * Loads locales/{lang}/{namespace}.json, exposes t('namespace.key'),
 * binds data-i18n attributes in the DOM, and persists the chosen language.
 *
 * Namespaces shipped in Phase 2: common, repair, diagnostics, ai, settings.
 * Fallback chain: selected language -> English -> Bangla (never a blank UI).
 */

window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.i18n = (function () {
  'use strict';

  var LANG_KEY = 'mb_lang';
  var NAMESPACES = ['common', 'repair', 'diagnostics', 'ai', 'settings'];
  var SUPPORTED = ['bn', 'en'];
  var cache = {}; // cache[lang][namespace] = {...}
  var currentLang = 'bn';
  var listeners = [];

  function detectLang() {
    var saved = localStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    var browserLang = (navigator.language || 'bn').slice(0, 2);
    if (SUPPORTED.indexOf(browserLang) !== -1) return browserLang;
    return 'bn'; // default per project spec
  }

  function fetchNamespace(lang, ns) {
    return fetch('locales/' + lang + '/' + ns + '.json')
      .then(function (res) {
        if (!res.ok) throw new Error('locale fetch failed: ' + lang + '/' + ns);
        return res.json();
      });
  }

  function loadLang(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    cache[lang] = {};
    return Promise.all(
      NAMESPACES.map(function (ns) {
        return fetchNamespace(lang, ns)
          .then(function (data) { cache[lang][ns] = data; })
          .catch(function () { cache[lang][ns] = {}; }); // one missing namespace shouldn't break the whole language
      })
    ).then(function () { return cache[lang]; });
  }

  // t('repair.category_power') -> looks up currentLang, falls back to en, then bn.
  function t(key, params) {
    var parts = key.split('.');
    var ns = parts[0], leaf = parts.slice(1).join('.');
    var value = lookup(currentLang, ns, leaf);
    if (value === undefined) value = lookup('en', ns, leaf);
    if (value === undefined) value = lookup('bn', ns, leaf);
    if (value === undefined) return key; // last resort: show the key, never blank

    if (params) {
      Object.keys(params).forEach(function (p) {
        value = value.replace('{' + p + '}', params[p]);
      });
    }
    return value;
  }

  function lookup(lang, ns, leaf) {
    if (!cache[lang] || !cache[lang][ns]) return undefined;
    return cache[lang][ns][leaf];
  }

  function applyToDom(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      // format: data-i18n-attr="placeholder:common.search_placeholder"
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var bits = pair.split(':');
        el.setAttribute(bits[0].trim(), t(bits[1].trim()));
      });
    });
    document.documentElement.lang = currentLang;
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return Promise.reject(new Error('unsupported lang'));
    return loadLang(lang).then(function () {
      currentLang = lang;
      localStorage.setItem(LANG_KEY, lang);
      applyToDom();
      listeners.forEach(function (fn) { fn(lang); });
    });
  }

  function onChange(fn) { listeners.push(fn); }

  function init() {
    var lang = detectLang();
    return loadLang(lang).then(function () {
      currentLang = lang;
      applyToDom();
    });
  }

  return { init: init, t: t, setLang: setLang, getLang: function () { return currentLang; }, applyToDom: applyToDom, onChange: onChange };
})();
