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
    home: { file: 'pages/home.html', navId: 'home', titleKey: 'common.app_name' },
    search: { file: 'pages/search.html', navId: 'search', titleKey: 'common.nav_search' },
    diagnose: { file: 'pages/diagnose.html', navId: 'diagnose', titleKey: 'repair.action_diagnose' },
    learn: { file: 'pages/learn.html', navId: 'learn', titleKey: 'common.nav_learn' },
    ai: { file: 'pages/ai.html', navId: 'ai', titleKey: 'ai.chat_title' },
    devices: { file: 'pages/devices.html', navId: null, titleKey: 'common.menu_devices' },
    components: { file: 'pages/components.html', navId: null, titleKey: 'common.menu_components' },
    tools: { file: 'pages/tools.html', navId: null, titleKey: 'common.menu_tools' },
    videos: { file: 'pages/videos.html', navId: null, titleKey: 'common.menu_videos' },
    settings: { file: 'pages/settings.html', navId: null, titleKey: 'settings.title' }
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
      var isActive = item.getAttribute('data-nav') === navId;
      item.classList.toggle('is-active', isActive);
      if (isActive) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
    });
  }

  function fetchFragment(file) {
    if (fragmentCache[file]) return Promise.resolve(fragmentCache[file]);
    return fetch(file).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + file);
      return r.text();
    }).then(function (html) { fragmentCache[file] = html; return html; });
  }

  function updateDocumentTitle(routeName) {
    var route = ROUTES[routeName];
    var appName = window.MobileBuzz.i18n.t('common.app_name');
    var pageTitle = window.MobileBuzz.i18n.t(route.titleKey);
    document.title = routeName === 'home' ? appName : (pageTitle + ' \u2013 ' + appName);
  }

  function render(routeName) {
    var route = ROUTES[routeName];
    mainEl.innerHTML = window.MobileBuzz.ui.loadingHtml();
    return fetchFragment(route.file)
      .then(function (html) {
        mainEl.innerHTML = html;
        window.MobileBuzz.i18n.applyToDom(mainEl);
        updateBottomNavActive(routeName);
        updateDocumentTitle(routeName);
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
    window.MobileBuzz.i18n.onChange(function () { updateDocumentTitle(currentRouteName()); });
    document.querySelectorAll('.bottom-nav__item[data-nav]').forEach(function (item) {
      item.addEventListener('click', function () { navigate(item.getAttribute('data-nav')); });
    });
    render(currentRouteName());
  }

  return { init: init, navigate: navigate, registerHydrator: registerHydrator, ROUTES: ROUTES };
})();
