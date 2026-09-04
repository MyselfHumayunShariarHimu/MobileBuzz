/**
 * MobileBuzz — App Bootstrap
 * Phase 1: theme init/toggle.
 * Phase 2+: i18n init, router init (real navigation), overflow menu.
 */

(function () {
  'use strict';

  var THEME_KEY = 'mb_theme';
  var root = document.documentElement;

  function getPreferredTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var toggle = document.getElementById('themeToggle');
    if (toggle) toggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  }

  function initTheme() {
    applyTheme(getPreferredTheme());
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  function initFontSize() {
    var saved = localStorage.getItem('mb_fontsize');
    if (saved) root.setAttribute('data-fontsize', saved);
  }

  function initOverflowMenu() {
    var btn = document.getElementById('menuToggle');
    var menu = document.getElementById('overflowMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      var isHidden = menu.hasAttribute('hidden');
      if (isHidden) { menu.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); }
      else { menu.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); }
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) menu.setAttribute('hidden', '');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initFontSize();
    initOverflowMenu();
    window.MobileBuzz.i18n.init().then(function () {
      window.MobileBuzz.router.init(document.getElementById('main'));
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(function (err) {
        console.warn('[app] service worker registration failed (expected on a plain static host without HTTPS):', err.message);
      });
    }

    console.log('MobileBuzz booting — i18n + router active.');
  });
})();
