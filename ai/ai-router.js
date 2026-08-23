/**
 * MobileBuzz — Central AI Dispatcher (Phase 9)
 * SERVER-SIDE ONLY — required from api/ai.js. Never shipped to the client
 * (that's what kept API keys out of the browser per §9). Dispatches to the
 * right provider adapter, applies opt-in fallback, and stamps which
 * provider actually answered.
 */
var fs = require('fs');
var path = require('path');
var MODEL_REGISTRY = require('./model-registry.js');

var PROVIDERS = {
  openai: require('./providers/openai.js'),
  gemini: require('./providers/gemini.js'),
  anthropic: require('./providers/anthropic.js'),
  xai: require('./providers/xai.js'),
  deepseek: require('./providers/deepseek.js'),
  openrouter: require('./providers/openrouter.js')
};

var ENV_KEY_NAME = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  xai: 'XAI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  openrouter: 'OPENROUTER_API_KEY'
};

// Fallback order tried only when the requested provider has no configured
// key AND the caller explicitly allowed fallback (never silently swaps a
// provider the user deliberately pinned — see §65).
var FALLBACK_ORDER = ['anthropic', 'openai', 'gemini', 'openrouter', 'deepseek', 'xai'];

function hasKey(provider) {
  return !!process.env[ENV_KEY_NAME[provider]];
}

function pickModel(provider, requestedModel) {
  var registryEntry = MODEL_REGISTRY[provider];
  if (!registryEntry) return requestedModel;
  var known = registryEntry.models.some(function (m) { return m.id === requestedModel; });
  return known ? requestedModel : registryEntry.defaultModel;
}

/**
 * sendAIRequest({provider, model, messages, temperature, maxTokens, language, task, allowFallback})
 * Returns the common normalized shape described in the architecture doc §5.
 */
async function sendAIRequest(opts) {
  var provider = opts.provider;
  var usedFallback = false;

  if (!PROVIDERS[provider]) {
    throw new KnownAIError('PROVIDER_UNAVAILABLE', 'Unknown provider: ' + provider);
  }

  if (!hasKey(provider)) {
    if (opts.allowFallback) {
      var alt = FALLBACK_ORDER.find(function (p) { return p !== provider && hasKey(p); });
      if (alt) { provider = alt; usedFallback = true; }
    }
    if (!hasKey(provider)) {
      // No key anywhere configured -> demo mode, never a hard failure (§66).
      return {
        provider: provider,
        model: opts.model,
        content: demoResponse(opts),
        language: opts.language || 'bn',
        confidence: 'medium',
        isDemo: true,
        fallbackUsed: false,
        usage: { inputTokens: null, outputTokens: null }
      };
    }
  }

  var model = pickModel(provider, opts.model);
  var adapter = PROVIDERS[provider];

  try {
    var result = await adapter.send({
      model: model,
      messages: buildMessages(opts),
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      apiKey: process.env[ENV_KEY_NAME[provider]]
    });

    return {
      provider: provider,
      model: model,
      content: result.content,
      language: opts.language || 'bn',
      confidence: 'medium', // rule-based/self-reported; real confidence heuristics can refine this later
      isDemo: false,
      fallbackUsed: usedFallback,
      usage: result.usage
    };
  } catch (err) {
    throw new KnownAIError('PROVIDER_ERROR', err.message);
  }
}

function buildMessages(opts) {
  var lang = opts.language === 'en' ? 'English' : 'Bangla (বাংলা)';
  var systemPrompt =
    'You are the MobileBuzz AI Repair Assistant. Respond in ' + lang + ', using the ' +
    'structured format: 🔎 সমস্যা, 🧠 সম্ভাব্য কারণ, 🛠️ কীভাবে পরীক্ষা করবেন, 🧰 প্রয়োজনীয় টুল, ' +
    '🔧 সম্ভাব্য সমাধান, ✅ Repair Verification, ⚠️ Safety Warning, 📊 Confidence (Low/Medium/High). ' +
    'Never give instructions for FRP/Activation Lock/password bypass, IMEI cloning, or other ' +
    'security-bypass procedures. For dangerous situations (swollen battery, burning smell, exposed ' +
    'wiring near power), tell the user to STOP and see a professional technician instead of a repair ' +
    'procedure. Always state whether a claim is confirmed fact, a likely cause, or a guess.';

  var messages = [{ role: 'system', content: systemPrompt }];
  if (opts.context) {
    messages.push({ role: 'system', content: 'Prior rule-based diagnostic context: ' + JSON.stringify(opts.context) });
  }
  return messages.concat(opts.messages || []);
}

var problemsCache = null;
function loadProblems() {
  if (problemsCache) return problemsCache;
  try {
    var raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'problems.json'), 'utf8');
    problemsCache = JSON.parse(raw).articles;
  } catch (e) {
    problemsCache = [];
  }
  return problemsCache;
}

var STOPWORDS = ['না', 'কি', 'কী', 'এ', 'ও', 'আর', 'কে', 'হয়', 'তো', 'যে', 'কোন',
  'the', 'is', 'a', 'an', 'to', 'in', 'on', 'of', 'not', 'no', 'my', 'it'];

function findBestArticle(userText, category) {
  var articles = loadProblems();
  if (category) {
    var byCategory = articles.filter(function (a) { return a.category === category; });
    if (byCategory.length) return byCategory[0];
  }
  var words = Array.from(new Set(
    String(userText || '').toLowerCase().replace(/[,।.!?]/g, ' ').split(/\s+/).filter(function (w) {
      return w.length > 2 && STOPWORDS.indexOf(w) === -1;
    })
  ));
  var best = null, bestScore = 0;
  articles.forEach(function (a) {
    var titleHay = (a.title.bn + ' ' + a.title.en).toLowerCase();
    var symptomHay = a.symptoms.map(function (s) { return s.bn + ' ' + s.en; }).join(' ').toLowerCase();
    var score = 0;
    words.forEach(function (w) {
      if (titleHay.indexOf(w) !== -1) score += 3;
      else if (symptomHay.indexOf(w) !== -1) score += 1;
    });
    if (score > bestScore) { bestScore = score; best = a; }
  });
  return best;
}

function formatStructuredDemo(lang, article, userText) {
  var L = lang === 'en';
  var lines = [];
  if (article) {
    lines.push((L ? '🔎 Problem\n' : '🔎 সমস্যা\n') + article.title[L ? 'en' : 'bn']);
    lines.push((L ? '\n🧠 Possible Causes' : '\n🧠 সম্ভাব্য কারণ') + '\n' +
      article.causes.map(function (c, i) { return (i + 1) + '. ' + c[L ? 'en' : 'bn']; }).join('\n'));
    lines.push((L ? '\n🛠️ How to Test' : '\n🛠️ কীভাবে পরীক্ষা করবেন') + '\n' +
      article.diagnosticSteps.map(function (s, i) { return (i + 1) + '. ' + s[L ? 'en' : 'bn']; }).join('\n'));
    if (article.tools.length) lines.push((L ? '\n🧰 Tools Needed: ' : '\n🧰 প্রয়োজনীয় টুল: ') + article.tools.join(', '));
    lines.push((L ? '\n🔧 Possible Solution' : '\n🔧 সম্ভাব্য সমাধান') + '\n' + (article.solutions[0] || {})[L ? 'en' : 'bn']);
    if (article.verification[0]) lines.push((L ? '\n✅ Verification: ' : '\n✅ Verification: ') + article.verification[0][L ? 'en' : 'bn']);
    if (article.warnings[0]) lines.push((L ? '\n⚠️ Safety Warning: ' : '\n⚠️ সতর্কতা: ') + article.warnings[0][L ? 'en' : 'bn']);
  } else {
    lines.push(L
      ? '🔎 Problem\nThe specific issue is not fully clear from your message yet.'
      : '🔎 সমস্যা\nআপনার লেখা থেকে নির্দিষ্ট সমস্যাটি এখনো স্পষ্ট নয়।');
    lines.push(L
      ? '\n🛠️ How to Test\n1. Try the Diagnose page for a step-by-step questionnaire.\n2. Or search the Knowledge Base with a specific symptom.'
      : '\n🛠️ কীভাবে পরীক্ষা করবেন\n১. Diagnose পেজে step-by-step প্রশ্নের উত্তর দিন।\n২. অথবা Search পেজে নির্দিষ্ট উপসর্গ লিখে দেখুন।');
  }
  lines.push('\n' + (L
    ? '[DEMO RESPONSE — no API key configured. Add one per .env.example for a real, personalized AI answer.]'
    : '[DEMO RESPONSE — কোনো API key configure করা নেই। .env.example অনুযায়ী একটি key যোগ করলে real, personalized AI উত্তর পাবেন।]'));
  lines.push((L ? '\n📊 Confidence: Low (demo)' : '\n📊 Confidence: নিম্ন (demo)'));
  return lines.join('\n');
}

function demoResponse(opts) {
  var lastUserMsg = (opts.messages || []).filter(function (m) { return m.role === 'user'; }).pop();
  var category = opts.context && opts.context.category;
  var article = findBestArticle(lastUserMsg ? lastUserMsg.content : '', category);
  return formatStructuredDemo(opts.language, article, lastUserMsg ? lastUserMsg.content : '');
}

function KnownAIError(code, message) {
  var e = new Error(message);
  e.code = code;
  return e;
}

module.exports = { sendAIRequest: sendAIRequest };
