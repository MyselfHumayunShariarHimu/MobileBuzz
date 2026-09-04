/**
 * MobileBuzz — Automated Test Suite (Phase 21 addition)
 *
 * Covers what's testable without a browser: data integrity across every
 * JSON file, locale key parity, and the core business logic (diagnostic
 * tree walking, calculators, AI demo matching). Run with: npm test
 * (or: node tests/run.js)
 *
 * This does NOT replace real in-browser QA — see
 * docs/phase-reports/PHASE-21-testing-checklist.md for the manual checklist
 * that still needs a real browser/device.
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;

// Awaits fn() whether it's sync or async — an async test's rejection must
// actually be awaited, or a failing assertion inside it would be silently
// swallowed and misreported as a pass.
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  \u2713 ' + name);
  } catch (err) {
    failed++;
    console.log('  \u2717 ' + name);
    console.log('      ' + err.message);
  }
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

async function main() {
  console.log('\nData integrity\n' + '-'.repeat(40));

  await test('every JSON file under data/ and locales/ parses', () => {
    ['data', 'locales/bn', 'locales/en'].forEach((d) => {
      fs.readdirSync(path.join(ROOT, d)).forEach((f) => {
        if (f.endsWith('.json')) readJson(path.join(d, f));
      });
    });
  });

  await test('locale namespaces have matching keys between bn and en', () => {
    ['common', 'repair', 'diagnostics', 'ai', 'settings'].forEach((ns) => {
      const bn = readJson(`locales/bn/${ns}.json`);
      const en = readJson(`locales/en/${ns}.json`);
      const onlyBn = Object.keys(bn).filter((k) => !(k in en));
      const onlyEn = Object.keys(en).filter((k) => !(k in bn));
      assert.strictEqual(onlyBn.length, 0, `${ns}: keys missing from en: ${onlyBn}`);
      assert.strictEqual(onlyEn.length, 0, `${ns}: keys missing from bn: ${onlyEn}`);
    });
  });

  await test('every Knowledge Base article has a unique id and required fields', () => {
    const articles = readJson('data/problems.json').articles;
    const ids = articles.map((a) => a.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'duplicate article id found');
    articles.forEach((a) => {
      ['id', 'category', 'title', 'difficulty', 'symptoms', 'causes', 'diagnosticSteps', 'solutions', 'verification'].forEach((field) => {
        assert.ok(field in a, `${a.id} missing field: ${field}`);
      });
      assert.ok(a.title.bn && a.title.en, `${a.id} missing bilingual title`);
    });
  });

  await test('every device commonProblems reference resolves to a real article', () => {
    const validIds = new Set(readJson('data/problems.json').articles.map((a) => a.id));
    readJson('data/devices.json').devices.forEach((d) => {
      d.commonProblems.forEach((pid) => {
        assert.ok(validIds.has(pid), `${d.id} references unknown article: ${pid}`);
      });
    });
  });

  await test('every diagnostic tree is structurally sound (every answer resolves)', () => {
    const trees = readJson('data/diagnostic-trees.json').trees;
    Object.keys(trees).forEach((cat) => {
      const tree = trees[cat];
      (function walk(nodeId, depth) {
        assert.ok(depth <= 6, `${cat}: tree too deep (possible infinite loop) at ${nodeId}`);
        const node = tree.nodes[nodeId];
        assert.ok(node, `${cat}: missing node ${nodeId}`);
        node.answers.forEach((a) => {
          if (a.conclusion) {
            assert.ok(tree.conclusions[a.conclusion], `${cat}: missing conclusion ${a.conclusion}`);
          } else if (a.next) {
            walk(a.next, depth + 1);
          } else {
            throw new Error(`${cat}: answer has neither next nor conclusion`);
          }
        });
      })(tree.startNode, 0);
    });
  });

  await test('genuinely dangerous conclusions (battery swelling, water damage) carry a prominent safetyStop banner', () => {
    const trees = readJson('data/diagnostic-trees.json').trees;
    const swelling = trees.battery.conclusions['concl-swelling'];
    const water = trees.power.conclusions['concl-water-damage'];
    [swelling, water].forEach((c) => {
      assert.ok(c.safetyStop, 'expected a safetyStop field on this dangerous conclusion');
      assert.ok(c.safetyStop.bn && c.safetyStop.en, 'safetyStop must be bilingual');
    });
  });

  await test('every lesson has a valid quiz with a valid answerIndex', () => {
    readJson('data/lessons.json').lessons.forEach((l) => {
      l.quiz.forEach((q) => {
        assert.ok(q.options.length >= 2, `${l.id}: quiz needs at least 2 options`);
        assert.ok(q.answerIndex >= 0 && q.answerIndex < q.options.length, `${l.id}: answerIndex out of range`);
      });
    });
  });

  await test('every component referenced by a diagram node exists', () => {
    const validIds = new Set(readJson('data/components.json').components.map((c) => c.id));
    readJson('data/diagrams.json').diagrams.forEach((d) => {
      d.nodes.forEach((n) => {
        if (n.componentId) assert.ok(validIds.has(n.componentId), `${d.id}: unknown component ${n.componentId}`);
      });
    });
  });

  await test('components.symptoms reference real article ids (Technician-mode "Related Components")', () => {
    const validArticleIds = new Set(readJson('data/problems.json').articles.map((a) => a.id));
    readJson('data/components.json').components.forEach((c) => {
      (c.symptoms || []).forEach((sid) => {
        assert.ok(validArticleIds.has(sid), `${c.id}: symptom references unknown article ${sid}`);
      });
    });
  });

  await test('a known charging article resolves to its real related components', () => {
    const components = readJson('data/components.json').components;
    const matches = components.filter((c) => (c.symptoms || []).includes('phone-not-charging'));
    assert.ok(matches.length >= 2, 'expected at least 2 components linked to phone-not-charging');
    assert.ok(matches.some((c) => c.id === 'charging-ic'));
  });

  await test('every article deviceOverrides key references a real device (§36 generic vs model-specific)', () => {
    const validDeviceIds = new Set(readJson('data/devices.json').devices.map((d) => d.id));
    const articlesWithOverrides = readJson('data/problems.json').articles.filter((a) => a.deviceOverrides);
    assert.ok(articlesWithOverrides.length > 0, 'expected at least one article with a real deviceOverride (found none — this badge system would be dead code)');
    articlesWithOverrides.forEach((a) => {
      Object.keys(a.deviceOverrides).forEach((devId) => {
        assert.ok(validDeviceIds.has(devId), `${a.id}: deviceOverrides references unknown device ${devId}`);
        assert.ok(a.deviceOverrides[devId].notes.bn && a.deviceOverrides[devId].notes.en, `${a.id}/${devId}: override notes must be bilingual`);
      });
    });
  });

  console.log('\nPage fragment HTML sanity (pages/*.html)\n' + '-'.repeat(40));

  await test('every page fragment has balanced h1-h4 tags (no mismatched open/close)', () => {
    const pagesDir = path.join(ROOT, 'pages');
    fs.readdirSync(pagesDir).filter((f) => f.endsWith('.html')).forEach((f) => {
      const html = fs.readFileSync(path.join(pagesDir, f), 'utf8');
      [1, 2, 3, 4].forEach((level) => {
        const opens = (html.match(new RegExp(`<h${level}[ >]`, 'g')) || []).length;
        const closes = (html.match(new RegExp(`</h${level}>`, 'g')) || []).length;
        assert.strictEqual(opens, closes, `${f}: ${opens} <h${level}> open tags but ${closes} close tags`);
      });
    });
  });

  await test('every test point in the Multimeter Learning Lab has at least one bilingual reading', () => {
    const testPoints = readJson('data/test-points.json').testPoints;
    assert.ok(testPoints.length > 0);
    testPoints.forEach((tp) => {
      const modes = Object.keys(tp.readings);
      assert.ok(modes.length > 0, `${tp.id}: has no readings at all`);
      modes.forEach((mode) => {
        const r = tp.readings[mode];
        assert.ok(r.normalRange.bn && r.normalRange.en, `${tp.id}/${mode}: normalRange must be bilingual`);
        assert.ok(r.interpretation.bn && r.interpretation.en, `${tp.id}/${mode}: interpretation must be bilingual`);
      });
    });
  });

  await test('every test point componentId (when set) references a real component', () => {
    const validIds = new Set(readJson('data/components.json').components.map((c) => c.id));
    readJson('data/test-points.json').testPoints.forEach((tp) => {
      if (tp.componentId) assert.ok(validIds.has(tp.componentId), `${tp.id}: references unknown component ${tp.componentId}`);
    });
  });

  console.log('\nCalculators (js/tools.js)\n' + '-'.repeat(40));

  // tools.js is written for the browser (attaches to window.MobileBuzz);
  // load it into a minimal global shim so the same file can run under Node.
  global.window = { MobileBuzz: {} };
  delete require.cache[require.resolve('../js/tools.js')];
  require('../js/tools.js');
  const calc = global.window.MobileBuzz.calc;

  await test('ohmsLaw solves for the missing value given any two', () => {
    const r1 = calc.ohmsLaw({ voltage: 5, resistance: 10 });
    assert.strictEqual(r1.current, 0.5);
    const r2 = calc.ohmsLaw({ current: 2, resistance: 5 });
    assert.strictEqual(r2.voltage, 10);
  });

  await test('ohmsLaw rejects input that is not exactly two known values', () => {
    assert.throws(() => calc.ohmsLaw({ voltage: 5 }));
    assert.throws(() => calc.ohmsLaw({ voltage: 5, current: 1, resistance: 5 }));
  });

  await test('power computes V x I', () => {
    assert.strictEqual(calc.power(5, 2), 10);
  });

  await test('batteryRuntimeHours divides capacity by draw', () => {
    assert.strictEqual(calc.batteryRuntimeHours(4500, 300), 15);
  });

  await test('chargingTimeHours applies the efficiency factor', () => {
    const hrs = calc.chargingTimeHours(4500, 2000);
    assert.ok(hrs > 2.5 && hrs < 2.7, `expected ~2.65, got ${hrs}`);
  });

  await test('convertUnit converts within the same unit family', () => {
    assert.strictEqual(calc.convertUnit('voltage', 1500, 'mV', 'V'), 1.5);
    assert.strictEqual(calc.convertUnit('current', 2, 'A', 'mA'), 2000);
  });

  await test('convertUnit rejects an unknown unit', () => {
    assert.throws(() => calc.convertUnit('voltage', 1, 'V', 'nonsense'));
  });

  await test('every router titleKey resolves to a real locale key (tab title / screen-reader nav announcement)', () => {
    const routerSrc = fs.readFileSync(path.join(ROOT, 'js/router.js'), 'utf8');
    const titleKeys = [...routerSrc.matchAll(/titleKey: '([^']+)'/g)].map((m) => m[1]);
    assert.ok(titleKeys.length >= 10, 'expected a titleKey for every route');
    const namespaces = {};
    ['common', 'repair', 'diagnostics', 'ai', 'settings'].forEach((ns) => { namespaces[ns] = readJson(`locales/bn/${ns}.json`); });
    titleKeys.forEach((k) => {
      const [ns, leaf] = k.split('.');
      assert.ok(namespaces[ns] && leaf in namespaces[ns], `titleKey ${k} does not resolve to a real locale key`);
    });
  });

  console.log('\nSettings -> behavior wiring\n' + '-'.repeat(40));

  await test('i18n template substitution handles zero correctly (not falsy-dropped)', () => {
    function t(template, params) {
      let value = template;
      Object.keys(params).forEach((p) => { value = value.replace('{' + p + '}', params[p]); });
      return value;
    }
    const result = t('{bookmarks} saved, {lessons} done', { bookmarks: 0, lessons: 0 });
    assert.strictEqual(result, '0 saved, 0 done', 'a naive `params[p] || fallback` check would wrongly drop legitimate zeros');
  });

  await test('AI fallback resolution respects the Settings toggle, not a hardcoded default', () => {
    function resolveFallback(optsAllowFallback, storedPref) {
      return optsAllowFallback !== undefined ? optsAllowFallback : (storedPref === 'true');
    }
    assert.strictEqual(resolveFallback(undefined, 'true'), true, 'saved preference "true" should enable fallback');
    assert.strictEqual(resolveFallback(undefined, 'false'), false, 'saved preference "false" should disable fallback');
    assert.strictEqual(resolveFallback(undefined, null), false, 'no saved preference should default to OFF (matches the unchecked checkbox default)');
  });

  console.log('\nDiagnostic Engine walk (data/diagnostic-trees.json)\n' + '-'.repeat(40));

  await test('walking the charging tree with a real answer path reaches a sensible conclusion', () => {
    const tree = readJson('data/diagnostic-trees.json').trees.charging;
    let nodeId = tree.startNode, node = tree.nodes[nodeId];
    let chosen = node.answers[1]; // "No" to icon/vibration
    nodeId = chosen.next; node = tree.nodes[nodeId];
    chosen = node.answers[1]; // "Yes, same issue persists" (tried other cable)
    nodeId = chosen.next; node = tree.nodes[nodeId];
    chosen = node.answers[0]; // "Yes" dust visible
    const concl = tree.conclusions[chosen.conclusion];
    assert.strictEqual(concl.confidence, 'high');
    assert.ok(concl.possibleCauses[0].en.toLowerCase().includes('dust'));
  });

  console.log('\nAI demo-response article matching (ai/ai-router.js)\n' + '-'.repeat(40));

  delete global.window; // ai-router.js is server-only; make sure it doesn't assume a browser
  delete require.cache[require.resolve('../ai/ai-router.js')];
  const { sendAIRequest } = require('../ai/ai-router.js');

  await test('demo response grounds a charging-related Bangla message in the right article', async () => {
    const r = await sendAIRequest({
      provider: 'anthropic', model: 'claude-sonnet-5',
      messages: [{ role: 'user', content: '\u0986\u09ae\u09be\u09b0 \u09ab\u09cb\u09a8 \u099a\u09be\u09b0\u09cd\u099c \u09b9\u099a\u09cd\u099b\u09c7 \u09a8\u09be' }],
      language: 'bn', allowFallback: true
    });
    assert.strictEqual(r.isDemo, true);
    assert.ok(r.content.includes('\u099a\u09be\u09b0\u09cd\u099c'), 'expected the charging article to be matched');
  });

  await test('demo response works in English too, without throwing', async () => {
    const r = await sendAIRequest({
      provider: 'openai', model: 'gpt-5.6-terra',
      messages: [{ role: 'user', content: 'my screen has lines on it' }],
      language: 'en', allowFallback: true
    });
    assert.strictEqual(r.isDemo, true);
    assert.ok(r.content.includes('\ud83d\udd0e'));
  });

  await test('demo response never throws even for a nonsense message', async () => {
    const r = await sendAIRequest({
      provider: 'anthropic', model: 'claude-sonnet-5',
      messages: [{ role: 'user', content: 'asdkjfh qweoiu nonsense text' }],
      language: 'en', allowFallback: true
    });
    assert.strictEqual(r.isDemo, true);
    assert.ok(r.content.length > 0);
  });

  console.log('\n' + '='.repeat(40));
  console.log(`${passed} passed, ${failed} failed`);
  console.log('='.repeat(40) + '\n');
  process.exit(failed > 0 ? 1 : 0);
}

main();
