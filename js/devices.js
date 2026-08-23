/**
 * MobileBuzz — Device database loader/query (Phase 4)
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.devices = (function () {
  'use strict';
  var devices = null;

  function load() {
    if (devices) return Promise.resolve(devices);
    return fetch('data/devices.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { devices = d.devices; return devices; });
  }

  function getById(id) {
    return load().then(function (list) { return list.find(function (d) { return d.id === id; }) || null; });
  }

  function getBrands() {
    return load().then(function (list) {
      return Array.from(new Set(list.map(function (d) { return d.brand; }))).sort();
    });
  }

  function getByBrand(brand) {
    return load().then(function (list) { return list.filter(function (d) { return d.brand === brand; }); });
  }

  return { load: load, getById: getById, getBrands: getBrands, getByBrand: getByBrand };
})();
