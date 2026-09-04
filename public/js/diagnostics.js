/**
 * MobileBuzz — Rule-based Diagnostic Engine (Phase 6)
 * Pure, AI-independent decision-tree walker over data/diagnostic-trees.json.
 * Output is always labeled "diagnostics.rule_based_label" in the UI — never
 * blended with AI output (see project rule: AI-guess != confirmed diagnosis).
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.diagnostics = (function () {
  'use strict';
  var trees = null;

  function load() {
    if (trees) return Promise.resolve(trees);
    return fetch('data/diagnostic-trees.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { trees = d.trees; return trees; });
  }

  function getCategories() {
    return load().then(function (t) { return Object.keys(t); });
  }

  // Starts a walk for a category; returns the first question node.
  function start(category) {
    return load().then(function (t) {
      var tree = t[category];
      if (!tree) throw new Error('Unknown diagnostic category: ' + category);
      return { nodeId: tree.startNode, node: tree.nodes[tree.startNode] };
    });
  }

  // answerIndex is the index into node.answers the user picked.
  // Returns either another { nodeId, node } question, or a { conclusion } result.
  function answer(category, nodeId, answerIndex) {
    return load().then(function (t) {
      var tree = t[category];
      var node = tree.nodes[nodeId];
      var chosen = node.answers[answerIndex];
      if (!chosen) throw new Error('Invalid answer index');
      if (chosen.conclusion) {
        var concl = tree.conclusions[chosen.conclusion];
        return { done: true, conclusionId: chosen.conclusion, conclusion: concl };
      }
      return { done: false, nodeId: chosen.next, node: tree.nodes[chosen.next] };
    });
  }

  // Serializes the collected Q&A trail into a compact context object the
  // AI chat can consume, so "Ask MobileBuzz AI" doesn't require retyping.
  function toAiContext(category, trail, result) {
    return {
      category: category,
      answeredQuestions: trail, // [{question, answerLabel}, ...]
      ruleBasedConclusion: result && result.conclusion ? result.conclusion : null
    };
  }

  return { load: load, getCategories: getCategories, start: start, answer: answer, toAiContext: toAiContext };
})();
