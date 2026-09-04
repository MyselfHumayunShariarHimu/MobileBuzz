/**
 * MobileBuzz — Shared UI helpers (Phase 3+)
 * Toast, simple Modal, and standardized loading/error/empty state renderers
 * so every async area (AI, search, video) behaves consistently.
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.ui = (function () {
  'use strict';

  function toast(message, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'mb-toast' + (opts.variant ? ' mb-toast--' + opts.variant : '');
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-visible'); });
    setTimeout(function () {
      el.classList.remove('is-visible');
      setTimeout(function () { el.remove(); }, 250);
    }, opts.duration || 2600);
  }

  function loadingHtml(labelKey) {
    var label = window.MobileBuzz.i18n ? window.MobileBuzz.i18n.t(labelKey || 'common.loading') : 'Loading...';
    return '<div class="mb-state mb-state--loading" role="status"><div class="mb-spinner" aria-hidden="true"></div><span>' + label + '</span></div>';
  }

  function errorHtml(labelKey) {
    var label = window.MobileBuzz.i18n ? window.MobileBuzz.i18n.t(labelKey || 'common.error_generic') : 'Something went wrong.';
    return '<div class="mb-state mb-state--error" role="alert">' + label + '</div>';
  }

  function emptyHtml(labelKey) {
    var label = window.MobileBuzz.i18n ? window.MobileBuzz.i18n.t(labelKey || 'common.empty_generic') : 'Nothing here yet.';
    return '<div class="mb-state mb-state--empty">' + label + '</div>';
  }

  function openModal(contentHtml) {
    var triggerEl = document.activeElement; // remember what had focus, to restore it on close
    var overlay = document.createElement('div');
    overlay.className = 'mb-modal-overlay';
    overlay.innerHTML =
      '<div class="mb-modal" role="dialog" aria-modal="true" tabindex="-1">' +
      '<button class="mb-modal-close" type="button" aria-label="Close">\u2715</button>' +
      contentHtml + '</div>';
    document.body.appendChild(overlay);

    var modalEl = overlay.querySelector('.mb-modal');
    modalEl.focus();

    function close() {
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
      if (triggerEl && typeof triggerEl.focus === 'function') triggerEl.focus();
    }
    function onKeydown(e) { if (e.key === 'Escape') close(); }

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.mb-modal-close').addEventListener('click', close);
    document.addEventListener('keydown', onKeydown);

    return { close: close, el: overlay };
  }

  return { toast: toast, loadingHtml: loadingHtml, errorHtml: errorHtml, emptyHtml: emptyHtml, openModal: openModal };
})();
