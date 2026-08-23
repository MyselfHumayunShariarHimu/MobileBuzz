/**
 * MobileBuzz — AI Chat client logic (Phase 9)
 * Talks to /api/ai first. IMPORTANT FIX: on plain static hosting (no Vercel
 * runtime — e.g. `npx serve .`), /api/ai does not exist at all, so this
 * used to surface a raw connection error instead of demoing. It now falls
 * back to a rich, KB-grounded, fully-structured CLIENT-SIDE demo response
 * whenever the server route is unreachable OR reachable-but-keyless, so the
 * AI feature always shows real, useful behavior on any hosting.
 */
window.MobileBuzz = window.MobileBuzz || {};

window.MobileBuzz.ai = (function () {
  'use strict';
  var history = [];
  var selectedProvider = localStorage.getItem('mb_ai_provider') || 'anthropic';
  var selectedModel = null;

  function setProvider(provider) {
    selectedProvider = provider;
    selectedModel = null;
    localStorage.setItem('mb_ai_provider', provider);
  }
  function getProvider() { return selectedProvider; }
  function getModelOptions() {
    var entry = window.MobileBuzz.modelRegistry[selectedProvider];
    return entry ? entry.models : [];
  }
  function setModel(modelId) { selectedModel = modelId; }
  function resolvedModel() {
    if (selectedModel) return selectedModel;
    var entry = window.MobileBuzz.modelRegistry[selectedProvider];
    return entry ? entry.defaultModel : undefined;
  }
  function clearChat() { history = []; }
  function getHistory() { return history.slice(); }

  // ---- Client-side demo response (used when /api/ai can't be reached at all) ----
  function labeled(bn, en) { return { bn: bn, en: en }; }

  function formatStructured(lang, parts) {
    var L = lang === 'en';
    var lines = [];
    lines.push((L ? '\ud83d\udd0e Problem\n' : '\ud83d\udd0e সমস্যা\n') + parts.problem[L ? 'en' : 'bn']);
    lines.push((L ? '\n\ud83e\udde0 Possible Causes' : '\n\ud83e\udde0 সম্ভাব্য কারণ') + '\n' +
      parts.causes.map(function (c, i) { return (i + 1) + '. ' + c[L ? 'en' : 'bn']; }).join('\n'));
    lines.push((L ? '\n\ud83d\udee0\ufe0f How to Test' : '\n\ud83d\udee0\ufe0f কীভাবে পরীক্ষা করবেন') + '\n' +
      parts.steps.map(function (s, i) { return (i + 1) + '. ' + s[L ? 'en' : 'bn']; }).join('\n'));
    if (parts.tools && parts.tools.length) {
      lines.push((L ? '\n\ud83e\uddf0 Tools Needed: ' : '\n\ud83e\uddf0 প্রয়োজনীয় টুল: ') + parts.tools.join(', '));
    }
    lines.push((L ? '\n\ud83d\udd27 Possible Solution' : '\n\ud83d\udd27 সম্ভাব্য সমাধান') + '\n' + parts.solution[L ? 'en' : 'bn']);
    lines.push((L ? '\n\u2705 Verification: ' : '\n\u2705 Verification: ') + parts.verification[L ? 'en' : 'bn']);
    if (parts.warning) lines.push((L ? '\n\u26a0\ufe0f Safety Warning: ' : '\n\u26a0\ufe0f সতর্কতা: ') + parts.warning[L ? 'en' : 'bn']);
    lines.push((L ? '\n\ud83d\udcca Confidence: ' : '\n\ud83d\udcca Confidence: ') + (L ? 'Low (demo)' : 'নিম্ন (demo)'));
    return lines.join('\n');
  }

  // Tries to ground the demo answer in a real Knowledge Base article by
  // reusing the same Bangla/Banglish-normalized search used on the Search
  // page, so the demo is genuinely useful rather than generic filler.
  function buildClientDemoResponse(userText, context) {
    var lang = window.MobileBuzz.i18n.getLang();
    var category = context && context.category;

    var findArticle = category
      ? window.MobileBuzz.knowledge.getByCategory(category).then(function (list) { return list[0]; })
      : window.MobileBuzz.search.searchAll(userText).then(function (r) { return r.knowledgeBase[0]; });

    return findArticle.then(function (article) {
      if (article) {
        return formatStructured(lang, {
          problem: article.title,
          causes: article.causes.length ? article.causes : [labeled('আরও তথ্য প্রয়োজন', 'More information needed')],
          steps: article.diagnosticSteps.length ? article.diagnosticSteps : [labeled('ধাপে ধাপে পরীক্ষা করুন', 'Test step by step')],
          tools: article.tools,
          solution: article.solutions[0] || labeled('Knowledge Base গাইড অনুসরণ করুন।', 'Follow the Knowledge Base guide.'),
          verification: article.verification[0] || labeled('সমস্যা আর না থাকলে সমাধান হয়েছে।', 'No more issue means it is fixed.'),
          warning: article.warnings[0]
        });
      }
      return formatStructured(lang, {
        problem: labeled('আপনার লেখা থেকে নির্দিষ্ট সমস্যাটি স্পষ্ট নয়।', 'The specific issue is not fully clear from your message.'),
        causes: [
          labeled('একাধিক কারণ সম্ভব — হার্ডওয়্যার বা সফটওয়্যার', 'Multiple causes are possible — hardware or software'),
          labeled('আরও বিস্তারিত লক্ষণ দিলে ভালো ধারণা পাওয়া যাবে', 'More detailed symptoms would help narrow this down')
        ],
        steps: [
          labeled('Diagnose পেজে গিয়ে category অনুযায়ী ধাপে ধাপে প্রশ্নের উত্তর দিন', 'Go to the Diagnose page and answer the category questions step by step'),
          labeled('Search পেজে নির্দিষ্ট উপসর্গ লিখে Knowledge Base ঘেঁটে দেখুন', 'Search the Knowledge Base for your specific symptom on the Search page')
        ],
        tools: [],
        solution: labeled('একটি real API key যোগ করলে MobileBuzz AI আপনার প্রশ্নের আরও নির্দিষ্ট উত্তর দিতে পারবে।', 'Adding a real API key will let MobileBuzz AI give a more specific answer to your question.'),
        verification: labeled('N/A — demo response', 'N/A — demo response'),
        warning: null
      });
    });
  }

  function send(userText, opts) {
    opts = opts || {};
    history.push({ role: 'user', content: userText });

    return fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: selectedProvider,
        model: resolvedModel(),
        messages: history,
        language: window.MobileBuzz.i18n.getLang(),
        task: opts.task || 'chat',
        context: opts.context,
        allowFallback: opts.allowFallback !== false
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('api/ai unreachable or errored: ' + r.status);
        return r.json();
      })
      .catch(function () {
        // /api/ai doesn't exist on plain static hosting, or errored — fall
        // back to a real, KB-grounded, fully-structured client-side demo
        // instead of surfacing a connection error to the user.
        return buildClientDemoResponse(userText, opts.context).then(function (content) {
          return { provider: selectedProvider, model: resolvedModel(), content: content, isDemo: true, clientFallback: true };
        });
      })
      .then(function (data) {
        if (data.content) history.push({ role: 'assistant', content: data.content });
        return data;
      });
  }

  return {
    send: send, clearChat: clearChat, getHistory: getHistory,
    setProvider: setProvider, getProvider: getProvider,
    getModelOptions: getModelOptions, setModel: setModel, resolvedModel: resolvedModel
  };
})();
