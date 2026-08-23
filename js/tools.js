/**
 * MobileBuzz — Tool database + Calculators (Phase 8)
 * All calculators are explicitly estimate-only (see MobileBuzz.calc.DISCLAIMER_KEY)
 * per the project's estimate != measurement rule.
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.tools = (function () {
  'use strict';
  var tools = null;

  function load() {
    if (tools) return Promise.resolve(tools);
    return fetch('data/tools.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { tools = d.tools; return tools; });
  }

  function getById(id) {
    return load().then(function (list) { return list.find(function (t) { return t.id === id; }) || null; });
  }

  return { load: load, getById: getById };
})();

window.MobileBuzz.calc = (function () {
  'use strict';

  // এটি একটি হিসাবভিত্তিক estimate; বাস্তব measurement নয় (see §56).
  var DISCLAIMER_KEY = 'tools.calculator_disclaimer';

  function ohmsLaw(known) {
    var v = known.voltage, i = known.current, r = known.resistance;
    var provided = [v, i, r].filter(function (x) { return x !== undefined && x !== null && x !== ''; }).length;
    if (provided !== 2) throw new Error('Provide exactly two of voltage, current, resistance');
    if (v === undefined || v === null || v === '') return { voltage: i * r, current: i, resistance: r };
    if (i === undefined || i === null || i === '') return { voltage: v, current: v / r, resistance: r };
    return { voltage: v, current: i, resistance: v / i };
  }

  function power(voltage, current) {
    return voltage * current; // P = V x I (watts)
  }

  // Very rough estimate: capacity(mAh) / average draw(mA) = hours. Real usage varies hugely by screen, radio, etc.
  function batteryRuntimeHours(capacityMah, avgDrawMa) {
    if (!avgDrawMa) throw new Error('avgDrawMa must be > 0');
    return capacityMah / avgDrawMa;
  }

  // Very rough estimate: capacity(mAh) / charger current(mA) with an efficiency factor. Real charging curves taper near full.
  function chargingTimeHours(capacityMah, chargerCurrentMa, efficiency) {
    efficiency = efficiency || 0.85;
    if (!chargerCurrentMa) throw new Error('chargerCurrentMa must be > 0');
    return capacityMah / (chargerCurrentMa * efficiency);
  }

  var UNIT_FACTORS = {
    voltage: { V: 1, mV: 0.001, kV: 1000 },
    current: { A: 1, mA: 0.001, uA: 0.000001 },
    resistance: { ohm: 1, kohm: 1000, Mohm: 1000000 }
  };

  function convertUnit(kind, value, fromUnit, toUnit) {
    var table = UNIT_FACTORS[kind];
    if (!table || !table[fromUnit] || !table[toUnit]) throw new Error('Unsupported unit conversion');
    return (value * table[fromUnit]) / table[toUnit];
  }

  return {
    DISCLAIMER_KEY: DISCLAIMER_KEY,
    ohmsLaw: ohmsLaw,
    power: power,
    batteryRuntimeHours: batteryRuntimeHours,
    chargingTimeHours: chargingTimeHours,
    convertUnit: convertUnit
  };
})();
