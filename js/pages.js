/**
 * MobileBuzz — Page hydrators (Phase 3+)
 * Small addition beyond the original file list: router.js only fetches
 * static fragments from /pages; this module supplies the per-page data
 * binding + interactivity after each fragment is injected into #main.
 * Registered via window.MobileBuzz.router.registerHydrator(name, fn).
 */
window.MobileBuzz = window.MobileBuzz || {};

(function () {
  'use strict';
  var MB = window.MobileBuzz;
  var router = MB.router;

  function cardHtml(title, meta, href) {
    return '<a class="list-card" href="' + href + '"><div class="list-card__title">' + title + '</div>' +
      (meta ? '<div class="list-card__meta">' + meta + '</div>' : '') + '</a>';
  }

  // ---------- HOME ----------
  router.registerHydrator('home', function (root) {
    var lang = MB.i18n.getLang();

    root.querySelector('#homeSearchForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = root.querySelector('#homeSearchInput').value.trim();
      if (q) { sessionStorage.setItem('mb_pending_search', q); }
      router.navigate('search');
    });

    MB.knowledge.getAll().then(function (list) {
      var el = root.querySelector('#homePopularProblems');
      el.innerHTML = list.slice(0, 4).map(function (a) {
        return cardHtml(a.title[lang] || a.title.bn, MB.i18n.t('repair.category_' + a.category), '#/diagnose');
      }).join('') || MB.ui.emptyHtml();
    });

    fetch('data/lessons.json').then(function (r) { return r.json(); }).then(function (d) {
      var el = root.querySelector('#homeBeginnerLessons');
      var beginner = d.lessons.filter(function (l) { return l.level === 'beginner'; });
      el.innerHTML = beginner.map(function (l) {
        return cardHtml(l.title[lang] || l.title.bn, MB.i18n.t('common.difficulty_beginner'), '#/learn');
      }).join('') || MB.ui.emptyHtml();
    });

    MB.devices.load().then(function (list) {
      var el = root.querySelector('#homeDevicePreview');
      el.innerHTML = list.slice(0, 4).map(function (d) {
        return cardHtml(d.brand + ' ' + d.model, d.platform, '#/devices');
      }).join('') || MB.ui.emptyHtml();
    });
  });

  // ---------- SEARCH ----------
  router.registerHydrator('search', function (root) {
    var lang = MB.i18n.getLang();
    var activeTab = 'all';
    var lastResults = null;
    var input = root.querySelector('#searchInput');
    var resultsEl = root.querySelector('#searchResults');

    var pending = sessionStorage.getItem('mb_pending_search');
    if (pending) { input.value = pending; sessionStorage.removeItem('mb_pending_search'); }

    root.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        root.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        activeTab = tab.getAttribute('data-tab');
        renderResults();
      });
    });

    root.querySelector('#searchForm').addEventListener('submit', function (e) {
      e.preventDefault();
      runSearch(input.value.trim());
    });

    function runSearch(query) {
      if (!query) { resultsEl.innerHTML = ''; return; }
      resultsEl.innerHTML = MB.ui.loadingHtml();
      MB.storage.recentSearchAdd(query);
      var tasks = { local: MB.search.searchAll(query) };
      if (MB.videos && MB.videos.search) tasks.videos = MB.videos.search(query).catch(function () { return { items: [], isDemo: true }; });
      if (MB.webSearch && MB.webSearch.search) tasks.web = MB.webSearch.search(query).catch(function () { return { items: [], isDemo: true }; });

      Promise.all([tasks.local, tasks.videos || Promise.resolve(null), tasks.web || Promise.resolve(null)])
        .then(function (r) {
          lastResults = { local: r[0], videos: r[1], web: r[2] };
          renderResults();
        });
    }

    function section(titleKey, items, renderItem) {
      if (!items || !items.length) return '';
      return '<div class="search-section-title">' + MB.i18n.t(titleKey) + '</div><div class="card-grid">' +
        items.map(renderItem).join('') + '</div>';
    }

    function demoLinkSection(titleKey, result, linkLabel) {
      if (!result || !result.isDemo || !result.fallbackUrl) return '';
      return '<div class="search-section-title">' + MB.i18n.t(titleKey) + '</div>' +
        '<a class="list-card" href="' + result.fallbackUrl + '" target="_blank" rel="noopener">' +
        '<div class="list-card__title">' + linkLabel + '</div>' +
        '<div class="list-card__meta">DEMO \u2014 no API key configured</div></a>';
    }

    function renderResults() {
      if (!lastResults) { resultsEl.innerHTML = ''; return; }
      var L = lastResults.local || {};
      var html = '';
      if (activeTab === 'all' || activeTab === 'knowledgeBase') {
        html += section('repair.tab_repair', L.knowledgeBase, function (a) {
          return cardHtml(a.title[lang] || a.title.bn, MB.i18n.t('repair.category_' + a.category), '#/diagnose');
        });
      }
      if (activeTab === 'all' || activeTab === 'devices') {
        html += section('common.menu_devices', L.devices, function (d) { return cardHtml(d.brand + ' ' + d.model, d.platform, '#/devices'); });
      }
      if (activeTab === 'all' || activeTab === 'components') {
        html += section('common.menu_components', L.components, function (c) { return cardHtml(c.name[lang] || c.name.bn, c.symbol, '#/tools'); });
      }
      if (activeTab === 'all' || activeTab === 'tools') {
        html += section('common.menu_tools', L.tools, function (t) { return cardHtml(t.name[lang] || t.name.bn, '', '#/tools'); });
      }
      if (activeTab === 'all' || activeTab === 'lessons') {
        html += section('common.nav_learn', L.lessons, function (l) { return cardHtml(l.title[lang] || l.title.bn, MB.i18n.t('common.difficulty_' + l.level), '#/learn'); });
      }
      if (activeTab === 'all' || activeTab === 'videos') {
        html += lastResults.videos && lastResults.videos.items && lastResults.videos.items.length
          ? section('common.menu_videos', lastResults.videos.items, function (v) { return cardHtml(v.title, v.channel, v.url); })
          : demoLinkSection('common.menu_videos', lastResults.videos, lang === 'bn' ? 'YouTube-এ সরাসরি সার্চ করুন \u2192' : 'Search directly on YouTube \u2192');
      }
      if (activeTab === 'all' || activeTab === 'web') {
        html += lastResults.web && lastResults.web.items && lastResults.web.items.length
          ? section('common.menu_web_search', lastResults.web.items, function (w) { return cardHtml(w.title, w.source, w.url); })
          : demoLinkSection('common.menu_web_search', lastResults.web, lang === 'bn' ? 'Google-এ সরাসরি সার্চ করুন \u2192' : 'Search directly on Google \u2192');
      }
      resultsEl.innerHTML = html || MB.ui.emptyHtml();
    }

    if (input.value) runSearch(input.value);
  });

  // ---------- DIAGNOSE ----------
  var ALL_CATEGORIES = ['power', 'charging', 'battery', 'display', 'touch', 'audio', 'camera', 'network', 'wifi_bt', 'software'];
  var TREE_CATEGORIES = ALL_CATEGORIES; // all 10 categories now have a real decision tree

  router.registerHydrator('diagnose', function (root) {
    var lang = MB.i18n.getLang();
    var categoryStep = root.querySelector('#diagnoseCategoryStep');
    var flowStep = root.querySelector('#diagnoseFlowStep');
    var grid = root.querySelector('#diagnoseCategoryGrid');
    var trail = []; // [{question, answerLabel}] for the AI hand-off

    grid.innerHTML = ALL_CATEGORIES.map(function (cat) {
      var hasTree = TREE_CATEGORIES.indexOf(cat) !== -1;
      return '<button class="category-tile" data-cat="' + cat + '"' + (hasTree ? '' : ' disabled title="শীঘ্রই আসছে"') + '>' +
        MB.i18n.t('repair.category_' + cat) + (hasTree ? '' : ' \u2022 \u23f3') + '</button>';
    }).join('');

    grid.querySelectorAll('.category-tile').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.hasAttribute('disabled')) return;
        trail = [];
        startCategory(btn.getAttribute('data-cat'));
      });
    });

    function startCategory(category) {
      categoryStep.hidden = true;
      flowStep.hidden = false;
      MB.diagnostics.start(category).then(function (step) { renderQuestion(category, step); });
    }

    function renderQuestion(category, step) {
      flowStep.innerHTML =
        '<div class="qa-question">' + step.node.question[lang] + '</div>' +
        '<div class="qa-answers">' +
        step.node.answers.map(function (a, i) {
          return '<button class="btn btn-secondary qa-answer-btn" data-idx="' + i + '">' + a.label[lang] + '</button>';
        }).join('') +
        '</div>' +
        '<button class="btn btn-secondary" id="diagStartOver" type="button">' + MB.i18n.t('diagnostics.start_over') + '</button>';

      flowStep.querySelectorAll('.qa-answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-idx'), 10);
          trail.push({ question: step.node.question[lang], answerLabel: step.node.answers[idx].label[lang] });
          MB.diagnostics.answer(category, step.nodeId, idx).then(function (next) {
            if (next.done) renderConclusion(category, next.conclusion);
            else renderQuestion(category, next);
          });
        });
      });
      flowStep.querySelector('#diagStartOver').addEventListener('click', reset);
    }

    function renderConclusion(category, concl) {
      var confKey = 'diagnostics.confidence_' + concl.confidence;
      var badgeClass = 'badge-confidence-' + concl.confidence;
      flowStep.innerHTML =
        '<span class="badge badge-generic">' + MB.i18n.t('diagnostics.rule_based_label') + '</span> ' +
        '<span class="badge ' + badgeClass + '">' + MB.i18n.t('diagnostics.confidence_label') + ': ' + MB.i18n.t(confKey) + '</span>' +
        '<div class="conclusion-block" style="margin-top:var(--space-4);">' +
        '<div class="conclusion-block__label">' + MB.i18n.t('repair.field_causes') + '</div>' +
        concl.possibleCauses.map(function (c) { return '<p>' + c[lang] + '</p>'; }).join('') + '</div>' +
        '<div class="conclusion-block"><div class="conclusion-block__label">' + MB.i18n.t('repair.field_diagnostic_steps') + '</div>' +
        concl.nextTests.map(function (c) { return '<p>' + c[lang] + '</p>'; }).join('') + '</div>' +
        (concl.tools.length ? '<div class="conclusion-block"><div class="conclusion-block__label">' + MB.i18n.t('repair.field_tools') + '</div>' +
          '<div class="demo-row demo-row--tight">' + concl.tools.map(function (t) { return '<span class="badge badge-generic">' + t + '</span>'; }).join('') + '</div></div>' : '') +
        '<div class="demo-row" style="margin-top:var(--space-5);">' +
        '<button class="btn btn-primary" id="diagAskAi" type="button">' + MB.i18n.t('repair.ask_ai_button') + '</button>' +
        '<button class="btn btn-secondary" id="diagStartOver2" type="button">' + MB.i18n.t('diagnostics.start_over') + '</button>' +
        '</div>';

      flowStep.querySelector('#diagStartOver2').addEventListener('click', reset);
      flowStep.querySelector('#diagAskAi').addEventListener('click', function () {
        var ctx = MB.diagnostics.toAiContext(category, trail, { conclusion: concl });
        sessionStorage.setItem('mb_ai_context', JSON.stringify(ctx));
        router.navigate('ai');
      });
    }

    function reset() {
      trail = [];
      categoryStep.hidden = false;
      flowStep.hidden = true;
      flowStep.innerHTML = '';
    }
  });

  // ---------- LEARN ----------
  router.registerHydrator('learn', function (root) {
    var lang = MB.i18n.getLang();
    var activeLevel = 'beginner';
    var allLessons = [];

    function renderList() {
      MB.storage.progressGetAll().then(function (progress) {
        var completedIds = progress.filter(function (p) { return p.completed; }).map(function (p) { return p.id; });
        var levelLessons = allLessons.filter(function (l) { return l.level === activeLevel; });
        var pct = levelLessons.length ? Math.round(100 * levelLessons.filter(function (l) { return completedIds.indexOf(l.id) !== -1; }).length / levelLessons.length) : 0;
        root.querySelector('#learnProgressLine').textContent = 'Progress: ' + pct + '%';

        root.querySelector('#learnLessonList').innerHTML = levelLessons.map(function (l) {
          var done = completedIds.indexOf(l.id) !== -1;
          return '<button class="list-card" style="text-align:left;width:100%;border:1px solid var(--border);cursor:pointer;" data-lesson="' + l.id + '">' +
            '<div class="list-card__title">' + (done ? '\u2705 ' : '') + l.title[lang] + '</div>' +
            '<div class="list-card__meta">' + MB.i18n.t('common.difficulty_' + l.level) + '</div></button>';
        }).join('') || MB.ui.emptyHtml();

        root.querySelectorAll('[data-lesson]').forEach(function (btn) {
          btn.addEventListener('click', function () { openLesson(btn.getAttribute('data-lesson')); });
        });
      });
    }

    function openLesson(id) {
      var l = allLessons.find(function (x) { return x.id === id; });
      if (!l) return;
      var html =
        '<h2 style="margin-top:0;">' + l.title[lang] + '</h2>' +
        '<p><strong>' + (lang === 'bn' ? 'উদ্দেশ্য' : 'Objective') + ':</strong> ' + l.objective[lang] + '</p>' +
        '<p>' + l.theory[lang] + '</p>' +
        (l.steps.length ? '<ol>' + l.steps.map(function (s) { return '<li>' + s[lang] + '</li>'; }).join('') + '</ol>' : '') +
        '<p><em>' + l.example[lang] + '</em></p>' +
        '<p class="ai-message"><strong>' + (lang === 'bn' ? 'সতর্কতা' : 'Safety') + ':</strong> ' + l.safety[lang] + '</p>' +
        (l.quiz.length ? '<div id="lessonQuiz"></div>' : '') +
        '<button class="btn btn-primary" id="markCompleteBtn" type="button" style="margin-top:var(--space-4);">' +
        (lang === 'bn' ? 'সম্পন্ন করুন' : 'Mark Complete') + '</button>';

      var modal = MB.ui.openModal(html);
      if (l.quiz.length) {
        var q = l.quiz[0];
        modal.el.querySelector('#lessonQuiz').innerHTML =
          '<p><strong>' + q.question[lang] + '</strong></p>' +
          q.options.map(function (o, i) { return '<button class="btn btn-secondary qa-answer-btn" data-i="' + i + '" style="display:block;width:100%;margin-bottom:var(--space-2);">' + o[lang] + '</button>'; }).join('');
        modal.el.querySelectorAll('[data-i]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var correct = parseInt(btn.getAttribute('data-i'), 10) === q.answerIndex;
            MB.ui.toast(correct ? '\u2705 ' + (lang === 'bn' ? 'সঠিক!' : 'Correct!') : (lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'), { variant: correct ? '' : 'danger' });
          });
        });
      }
      modal.el.querySelector('#markCompleteBtn').addEventListener('click', function () {
        MB.storage.progressSet(l.id, { completed: true, level: l.level, ts: Date.now() }).then(function () {
          modal.close();
          renderList();
        });
      });
    }

    root.querySelectorAll('#learnLevelTabs .tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        root.querySelectorAll('#learnLevelTabs .tab').forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        activeLevel = tab.getAttribute('data-level');
        renderList();
      });
    });

    fetch('data/lessons.json').then(function (r) { return r.json(); }).then(function (d) {
      allLessons = d.lessons;
      renderList();
    });
  });

  // ---------- DEVICES ----------
  router.registerHydrator('devices', function (root) {
    var activeBrand = null;
    MB.devices.load().then(function (list) {
      MB.devices.getBrands().then(function (brands) {
        root.querySelector('#deviceBrandFilter').innerHTML =
          '<button class="badge badge-model" data-brand="">সব</button>' +
          brands.map(function (b) { return '<button class="badge badge-generic" data-brand="' + b + '">' + b + '</button>'; }).join('');
        root.querySelectorAll('[data-brand]').forEach(function (btn) {
          btn.addEventListener('click', function () { activeBrand = btn.getAttribute('data-brand') || null; render(); });
        });
      });
      function render() {
        var filtered = activeBrand ? list.filter(function (d) { return d.brand === activeBrand; }) : list;
        root.querySelector('#deviceList').innerHTML = filtered.map(function (d) {
          return '<div class="card"><div class="list-card__title">' + d.brand + ' ' + d.model + '</div>' +
            '<div class="list-card__meta">' + d.platform + ' \u00b7 ' + d.chipset + '</div>' +
            '<p style="margin-top:var(--space-2);margin-bottom:0;">' + (MB.i18n.getLang() === 'bn' ? d.diagnosticNotes.bn : d.diagnosticNotes.en) + '</p></div>';
        }).join('') || MB.ui.emptyHtml();
      }
      render();
    });
  });

  // ---------- TOOLS ----------
  router.registerHydrator('tools', function (root) {
    var lang = MB.i18n.getLang();
    MB.tools.load().then(function (list) {
      root.querySelector('#toolList').innerHTML = list.map(function (t) {
        return '<div class="card"><div class="list-card__title">' + t.name[lang] + '</div>' +
          '<p style="margin-top:var(--space-2);">' + t.what[lang] + '</p>' +
          '<p style="color:var(--danger);margin-bottom:0;"><strong>\u26a0\ufe0f</strong> ' + t.safety[lang] + '</p></div>';
      }).join('');
    });

    root.querySelector('#ohmCalcBtn').addEventListener('click', function () {
      var v = root.querySelector('#ohmVoltage').value, i = root.querySelector('#ohmCurrent').value, r = root.querySelector('#ohmResistance').value;
      try {
        var known = {};
        if (v !== '') known.voltage = parseFloat(v);
        if (i !== '') known.current = parseFloat(i);
        if (r !== '') known.resistance = parseFloat(r);
        var out = MB.calc.ohmsLaw(known);
        root.querySelector('#ohmResult').textContent = 'V=' + out.voltage.toFixed(3) + ' I=' + out.current.toFixed(3) + ' R=' + out.resistance.toFixed(3);
      } catch (e) { root.querySelector('#ohmResult').textContent = 'Provide exactly 2 of the 3 values.'; }
    });

    root.querySelector('#battCalcBtn').addEventListener('click', function () {
      var cap = parseFloat(root.querySelector('#battCapacity').value);
      var draw = parseFloat(root.querySelector('#battDraw').value);
      try {
        var hrs = MB.calc.batteryRuntimeHours(cap, draw);
        root.querySelector('#battResult').textContent = '\u2248 ' + hrs.toFixed(1) + ' hours (estimate only)';
      } catch (e) { root.querySelector('#battResult').textContent = 'Enter valid capacity and draw values.'; }
    });
  });

  // ---------- AI ----------
  router.registerHydrator('ai', function (root) {
    var lang = MB.i18n.getLang();
    var providerSelect = root.querySelector('#aiProviderSelect');
    var modelSelect = root.querySelector('#aiModelSelect');
    var log = root.querySelector('#aiChatLog');
    var pendingContext = null;

    var raw = sessionStorage.getItem('mb_ai_context');
    if (raw) { pendingContext = JSON.parse(raw); sessionStorage.removeItem('mb_ai_context'); }

    Object.keys(MB.modelRegistry).forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key; opt.textContent = MB.modelRegistry[key].label;
      if (key === MB.ai.getProvider()) opt.selected = true;
      providerSelect.appendChild(opt);
    });

    function renderModelOptions() {
      modelSelect.innerHTML = '';
      MB.ai.getModelOptions().forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m.id; opt.textContent = m.label;
        modelSelect.appendChild(opt);
      });
    }
    renderModelOptions();

    providerSelect.addEventListener('change', function () {
      MB.ai.setProvider(providerSelect.value);
      renderModelOptions();
    });
    modelSelect.addEventListener('change', function () { MB.ai.setModel(modelSelect.value); });

    function appendBubble(role, text, isDemo) {
      var div = document.createElement('div');
      div.className = 'chat-bubble chat-bubble--' + role + (isDemo ? ' chat-bubble--demo' : '');
      div.textContent = text;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }

    function sendMessage(text, context) {
      appendBubble('user', text);
      var loadingBubble = document.createElement('div');
      loadingBubble.className = 'chat-bubble chat-bubble--assistant';
      loadingBubble.innerHTML = MB.ui.loadingHtml();
      log.appendChild(loadingBubble);

      MB.ai.send(text, { task: context ? 'diagnostic' : 'chat', context: context })
        .then(function (data) {
          loadingBubble.remove();
          if (data.error) { appendBubble('assistant', data.error); return; }
          appendBubble('assistant', (data.isDemo ? MB.i18n.t('ai.demo_notice') + '\n\n' : '') + data.content, data.isDemo);
        })
        .catch(function () {
          loadingBubble.remove();
          // No /api/ai route reachable — expected when testing on a plain
          // static server before `vercel dev` / deployment (Phase 9+ needs it).
          appendBubble('assistant', lang === 'bn'
            ? 'AI সার্ভিসে পৌঁছানো যাচ্ছে না। এটি টেস্ট করতে "vercel dev" দিয়ে চালান অথবা Vercel-এ deploy করুন।'
            : 'Could not reach the AI service. Run with "vercel dev" or deploy to Vercel to test this.');
        });
    }

    root.querySelector('#aiChatForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = root.querySelector('#aiChatInput');
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendMessage(text);
    });

    root.querySelector('#aiNewChatBtn').addEventListener('click', function () {
      MB.ai.clearChat();
      log.innerHTML = '';
    });

    if (pendingContext) {
      var summary = (lang === 'bn' ? 'রুল-ভিত্তিক ডায়াগনস্টিক থেকে: ' : 'From the rule-based diagnostic: ') +
        pendingContext.answeredQuestions.map(function (q) { return q.question + ' \u2192 ' + q.answerLabel; }).join('; ');
      sendMessage(summary, pendingContext);
    }
  });

  // ---------- VIDEOS ----------
  router.registerHydrator('videos', function (root) {
    var resultsEl = root.querySelector('#videoResults');
    root.querySelector('#videoSearchForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = root.querySelector('#videoSearchInput').value.trim();
      if (!q) return;
      resultsEl.innerHTML = MB.ui.loadingHtml();
      MB.videos.search(q).then(function (data) {
        if (data.isDemo) {
          resultsEl.innerHTML = '<a class="list-card" href="' + data.fallbackUrl + '" target="_blank" rel="noopener">' +
            '<div class="list-card__title">' + (MB.i18n.getLang() === 'bn' ? 'YouTube-এ সরাসরি সার্চ করুন \u2192' : 'Search directly on YouTube \u2192') + '</div>' +
            '<div class="list-card__meta">DEMO \u2014 YOUTUBE_API_KEY not configured</div></a>';
          return;
        }
        resultsEl.innerHTML = data.items.map(function (v) {
          return '<a class="list-card" href="' + v.url + '" target="_blank" rel="noopener">' +
            '<div class="list-card__title">' + v.title + '</div>' +
            '<div class="list-card__meta">' + v.channel + '</div></a>';
        }).join('') || MB.ui.emptyHtml();
      }).catch(function () { resultsEl.innerHTML = MB.ui.errorHtml(); });
    });
  });

  // ---------- SETTINGS ----------
  router.registerHydrator('settings', function (root) {
    function markActive(selector, attr, value) {
      root.querySelectorAll(selector).forEach(function (el) {
        el.classList.toggle('is-active', el.getAttribute(attr) === value);
      });
    }

    markActive('[data-lang]', 'data-lang', MB.i18n.getLang());
    markActive('[data-theme-choice]', 'data-theme-choice', document.documentElement.getAttribute('data-theme'));
    markActive('[data-mode]', 'data-mode', localStorage.getItem('mb_mode') || 'beginner');

    root.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        MB.i18n.setLang(btn.getAttribute('data-lang')).then(function () { router.navigate('settings'); });
      });
    });
    root.querySelectorAll('[data-theme-choice]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var theme = btn.getAttribute('data-theme-choice');
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mb_theme', theme);
        markActive('[data-theme-choice]', 'data-theme-choice', theme);
      });
    });
    root.querySelectorAll('[data-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-mode');
        localStorage.setItem('mb_mode', mode);
        markActive('[data-mode]', 'data-mode', mode);
      });
    });

    var providerSelect = root.querySelector('#settingsProviderSelect');
    Object.keys(MB.modelRegistry).forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key; opt.textContent = MB.modelRegistry[key].label;
      if (key === MB.ai.getProvider()) opt.selected = true;
      providerSelect.appendChild(opt);
    });
    providerSelect.addEventListener('change', function () { MB.ai.setProvider(providerSelect.value); });

    var fallbackToggle = root.querySelector('#settingsFallbackToggle');
    fallbackToggle.checked = localStorage.getItem('mb_ai_fallback') === 'true';
    fallbackToggle.addEventListener('change', function () {
      localStorage.setItem('mb_ai_fallback', fallbackToggle.checked ? 'true' : 'false');
    });
  });
})();
