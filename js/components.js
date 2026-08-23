/**
 * MobileBuzz — Component database loader/query (Phase 4)
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.components = (function () {
  'use strict';
  var components = null;

  function load() {
    if (components) return Promise.resolve(components);
    return fetch('data/components.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { components = d.components; return components; });
  }

  function getById(id) {
    return load().then(function (list) { return list.find(function (c) { return c.id === id; }) || null; });
  }

  function getBySymptom(symptomId) {
    return load().then(function (list) {
      return list.filter(function (c) { return c.symptoms && c.symptoms.indexOf(symptomId) !== -1; });
    });
  }

  return { load: load, getById: getById, getBySymptom: getBySymptom };
})();
