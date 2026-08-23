/**
 * MobileBuzz — Client-side Router (Phase 3)
 * Hash-based (works on any static host, no server rewrite rules needed).
 * Fetches a static fragment from /pages into <main id="main">, then calls
 * that route's hydrate() function (if registered) to fill in dynamic data
 * and wire up event listeners. Also drives the Bottom Nav active state.
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.router = (function () {
  'use strict';

  var ROUTES = {
    home: { file: 'pages/home.html', navId: 'home' },
    search: { file: 'pages/search.html', navId: 'search' },
    diagnose: { file: 'pages/diagnose.html', navId: 'diagnose' },
    learn: { file: 'pages/learn.html', navId: 'learn' },
    ai: { file: 'pages/ai.html', navId: 'ai' },
    devices: { file: 'pages/devices.html', navId: null },
    tools: { file: 'pages/tools.html', navId: null },
    videos: { file: 'pages/videos.html', navId: null },
    settings: { file: 'pages/settings.html', navId: null }
  };

  var hydrators = {}; // routeName -> function(container)
  var fragmentCache = {};
  var mainEl = null;

  function registerHydrator(routeName, fn) { hydrators[routeName] = fn; }

  function currentRouteName() {
    var hash = (window.location.hash || '#/home').replace(/^#\/?/, '');
    return ROUTES[hash] ? hash : 'home';
  }

  function updateBottomNavActive(routeName) {
    var navId = ROUTES[routeName].navId;
    document.querySelectorAll('.bottom-nav__item').forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-nav') === navId);
    });
  }

  function fetchFragment(file) {
    if (fragmentCache[file]) return Promise.resolve(fragmentCache[file]);
    return fetch(file).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + file);
      return r.text();
    }).then(function (html) { fragmentCache[file] = html; return html; });
  }

  function render(routeName) {
    var route = ROUTES[routeName];
    mainEl.innerHTML = window.MobileBuzz.ui.loadingHtml();
    return fetchFragment(route.file)
      .then(function (html) {
        mainEl.innerHTML = html;
        window.MobileBuzz.i18n.applyToDom(mainEl);
        updateBottomNavActive(routeName);
        window.scrollTo(0, 0);
        if (hydrators[routeName]) return hydrators[routeName](mainEl);
      })
      .catch(function (err) {
        mainEl.innerHTML = window.MobileBuzz.ui.errorHtml();
        console.error('[router] render failed for', routeName, err);
      });
  }

  function navigate(routeName) {
    if (window.location.hash === '#/' + routeName) { render(routeName); return; }
    window.location.hash = '#/' + routeName;
  }

  function init(mainElement) {
    mainEl = mainElement;
    window.addEventListener('hashchange', function () { render(currentRouteName()); });
    document.querySelectorAll('.bottom-nav__item[data-nav]').forEach(function (item) {
      item.addEventListener('click', function () { navigate(item.getAttribute('data-nav')); });
    });
    render(currentRouteName());
  }

  return { init: init, navigate: navigate, registerHydrator: registerHydrator, ROUTES: ROUTES };
})();
