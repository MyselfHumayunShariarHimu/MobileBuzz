/**
 * MobileBuzz — Knowledge Base loader/query (Phase 4)
 * Loads data/problems.json once, exposes lookup/filter helpers.
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.knowledge = (function () {
  'use strict';
  var articles = null;

  function load() {
    if (articles) return Promise.resolve(articles);
    return fetch('data/problems.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { articles = d.articles; return articles; });
  }

  function getById(id) {
    return load().then(function (list) {
      return list.find(function (a) { return a.id === id; }) || null;
    });
  }

  function getByCategory(category) {
    return load().then(function (list) {
      return list.filter(function (a) { return a.category === category; });
    });
  }

  function getAll() { return load(); }

  // Applies a device-specific override on top of the generic article, if one exists.
  // The UI must show the model-specific badge whenever an override is applied (see §36).
  function withDeviceOverride(article, deviceId) {
    if (!article || !article.deviceOverrides || !article.deviceOverrides[deviceId]) {
      return { article: article, isModelSpecific: false };
    }
    return { article: article, override: article.deviceOverrides[deviceId], isModelSpecific: true };
  }

  return { load: load, getById: getById, getByCategory: getByCategory, getAll: getAll, withDeviceOverride: withDeviceOverride };
})();
