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

/**
 * MobileBuzz — Interactive SVG Diagrams (Phase 4 addition)
 * Tap a node -> Component -> Function -> Common fault -> Diagnostic concept.
 * Generic diagrams only — never presented as an exact model schematic (§58).
 */
window.MobileBuzz.diagrams = (function () {
  'use strict';
  var diagrams = null;

  function load() {
    if (diagrams) return Promise.resolve(diagrams);
    return fetch('data/diagrams.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { diagrams = d.diagrams; return diagrams; });
  }

  function renderSvg(diagram, lang) {
    var nodesById = {};
    diagram.nodes.forEach(function (n) { nodesById[n.id] = n; });

    var lines = diagram.edges.map(function (e) {
      var a = nodesById[e[0]], b = nodesById[e[1]];
      return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="var(--border)" stroke-width="2"/>';
    }).join('');

    var nodes = diagram.nodes.map(function (n) {
      var hasInfo = !!n.componentId;
      return '<g class="diagram-node' + (hasInfo ? ' is-tappable' : '') + '" data-component="' + (n.componentId || '') + '" tabindex="' + (hasInfo ? '0' : '-1') + '"' +
        (hasInfo ? ' role="button" aria-label="' + n.label[lang] + '"' : ' aria-hidden="true"') + '>' +
        '<circle cx="' + n.x + '" cy="' + n.y + '" r="16" fill="' + (hasInfo ? 'var(--accent)' : 'var(--surface-2)') + '" stroke="var(--border)" stroke-width="1.5"/>' +
        '<text x="' + n.x + '" y="' + (n.y + 30) + '" text-anchor="middle" font-size="9" fill="var(--text-muted)">' + n.label[lang] + '</text>' +
        '</g>';
    }).join('');

    return '<svg viewBox="' + diagram.viewBox + '" class="diagram-svg" role="img" aria-label="' + diagram.title[lang] + '">' + lines + nodes + '</svg>';
  }

  return { load: load, renderSvg: renderSvg };
})();
