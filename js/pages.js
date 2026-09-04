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

  // Beginner/Technician/Advanced mode (set on the Settings page) — used to
  // decide how much technical depth (symbols, testing concepts, tool
  // jargon) to surface, per §86-89 of the spec. Previously saved but never
  // read anywhere.
  function getMode() { return localStorage.getItem('mb_mode') || 'beginner'; }

  function articleCardHtml(article, lang) {
    var title = article.title[lang] || article.title.bn;
    return '<div class="card" style="padding:var(--space-3);">' +
      '<button class="open-article-btn" data-article="' + article.id + '" type="button" style="all:unset;cursor:pointer;display:block;width:100%;">' +
      '<div class="list-card__title">' + title + '</div>' +
      '<div class="list-card__meta">' + MB.i18n.t('repair.category_' + article.category) + ' \u00b7 ' + MB.i18n.t('common.difficulty_' + article.difficulty) + '</div></button>' +
      '<button class="btn btn-secondary bookmark-article-btn" data-article="' + article.id + '" type="button" style="margin-top:var(--space-2);padding:4px var(--space-3);font-size:0.8rem;">' +
      '\ud83d\udd16 ' + (lang === 'bn' ? 'সংরক্ষণ' : 'Save') + '</button></div>';
  }

  // Full Repair Guide Template view (§37): symptoms, causes, tools, steps,
  // solutions, warnings, verification — previously only the title/category
  // ever reached the screen even though every article carries this data.
  function openArticleDetail(article, lang, deviceId) {
    function list(items, field) {
      if (!items || !items.length) return '';
      return '<div class="conclusion-block"><div class="conclusion-block__label">' + MB.i18n.t(field) + '</div>' +
        items.map(function (i) { return '<p>' + (i[lang] || i.bn) + '</p>'; }).join('') + '</div>';
    }
    var override = deviceId && article.deviceOverrides && article.deviceOverrides[deviceId];
    var toolChips = (article.tools || []).map(function (t) { return '<span class="badge badge-generic">' + t + '</span>'; }).join(' ');
    var html =
      '<h2 style="margin-top:0;">' + (article.title[lang] || article.title.bn) + '</h2>' +
      '<span class="badge badge-model">' + MB.i18n.t('common.difficulty_' + article.difficulty) + '</span> ' +
      '<span class="badge badge-generic">' + MB.i18n.t('repair.category_' + article.category) + '</span> ' +
      (override
        ? '<span class="badge badge-model">' + MB.i18n.t('common.model_specific_badge') + '</span>'
        : (deviceId ? '<span class="badge badge-generic">' + MB.i18n.t('common.generic_info_badge') + '</span>' : '')) +
      (override ? '<div class="ai-message" style="margin-top:var(--space-3);"><p style="margin:0;">' + override.notes[lang] + '</p></div>' : '') +
      list(article.symptoms, 'repair.field_symptoms') +
      list(article.causes, 'repair.field_causes') +
      (toolChips ? '<div class="conclusion-block"><div class="conclusion-block__label">' + MB.i18n.t('repair.field_tools') + '</div>' + toolChips + '</div>' : '') +
      list(article.diagnosticSteps, 'repair.field_diagnostic_steps') +
      list(article.solutions, 'repair.field_solutions') +
      (article.warnings && article.warnings.length
        ? '<div class="conclusion-block" style="color:var(--danger);"><div class="conclusion-block__label" style="color:var(--danger);">\u26a0\ufe0f ' + MB.i18n.t('repair.field_warnings') + '</div>' +
          article.warnings.map(function (w) { return '<p>' + (w[lang] || w.bn) + '</p>'; }).join('') + '</div>' : '') +
      list(article.verification, 'repair.field_verification') +
      '<div id="relatedGuidesSlot"></div>' +
      '<div class="demo-row" style="margin-top:var(--space-4);">' +
      '<button class="btn btn-primary" id="modalAskAi" type="button">' + MB.i18n.t('repair.ask_ai_button') + '</button>' +
      '<button class="btn btn-secondary" id="modalBookmark" type="button">\ud83d\udd16 ' + (lang === 'bn' ? 'সংরক্ষণ' : 'Save') + '</button>' +
      '</div>';

    var modal = MB.ui.openModal(html);

    MB.knowledge.getByCategory(article.category).then(function (siblings) {
      var related = siblings.filter(function (a) { return a.id !== article.id; }).slice(0, 3);
      if (!related.length) return;
      modal.el.querySelector('#relatedGuidesSlot').innerHTML =
        '<p style="margin-top:var(--space-4);"><strong>' + MB.i18n.t('repair.field_related') + ':</strong></p>' +
        '<div class="demo-row demo-row--tight">' + related.map(function (r) {
          return '<button class="badge badge-model related-article-btn" data-article="' + r.id + '" type="button" style="border:none;cursor:pointer;">' + (r.title[lang] || r.title.bn) + '</button>';
        }).join('') + '</div>';
      modal.el.querySelectorAll('.related-article-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          MB.knowledge.getById(btn.getAttribute('data-article')).then(function (a) {
            modal.close();
            if (a) openArticleDetail(a, lang);
          });
        });
      });
    });

    // Related Components — Technician/Advanced mode only (§86-89: component
    // references should be more prominent for technicians, simplified away
    // for beginners).
    if (getMode() !== 'beginner') {
      MB.components.getBySymptom(article.id).then(function (comps) {
        if (!comps.length) return;
        var slot = document.createElement('div');
        slot.innerHTML = '<p style="margin-top:var(--space-4);"><strong>\ud83d\udd27 ' +
          (lang === 'bn' ? 'সংশ্লিষ্ট কম্পোনেন্ট' : 'Related Components') + ':</strong></p>' +
          '<div class="demo-row demo-row--tight">' + comps.map(function (c) {
            return '<span class="badge badge-generic">' + c.name[lang] + ' (' + c.symbol + ')</span>';
          }).join('') + '</div>';
        modal.el.appendChild(slot);
      });
    }

    modal.el.querySelector('#modalAskAi').addEventListener('click', function () {
      sessionStorage.setItem('mb_ai_context', JSON.stringify({ category: article.category, answeredQuestions: [], ruleBasedConclusion: null, articleTitle: article.title[lang] }));
      modal.close();
      MB.router.navigate('ai');
    });
    modal.el.querySelector('#modalBookmark').addEventListener('click', function (e) {
      MB.storage.bookmarkAdd({ id: 'article:' + article.id, type: 'article', title: article.title[lang] || article.title.bn, ts: Date.now() })
        .then(function () {
          e.target.textContent = '\u2705 ' + (lang === 'bn' ? 'সংরক্ষিত' : 'Saved');
          MB.ui.toast(lang === 'bn' ? 'সংরক্ষণ করা হয়েছে' : 'Saved to your bookmarks');
        });
    });
  }

  function wireArticleCards(root, lang) {
    root.querySelectorAll('.bookmark-article-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var articleId = btn.getAttribute('data-article');
        MB.knowledge.getById(articleId).then(function (article) {
          if (!article) return;
          MB.storage.bookmarkAdd({ id: 'article:' + articleId, type: 'article', title: article.title[lang] || article.title.bn, ts: Date.now() })
            .then(function () {
              btn.textContent = '\u2705 ' + (lang === 'bn' ? 'সংরক্ষিত' : 'Saved');
              MB.ui.toast(lang === 'bn' ? 'সংরক্ষণ করা হয়েছে' : 'Saved to your bookmarks');
            });
        });
      });
    });
    root.querySelectorAll('.open-article-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        MB.knowledge.getById(btn.getAttribute('data-article')).then(function (article) {
          if (article) openArticleDetail(article, lang);
        });
      });
    });
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
      el.innerHTML = list.slice(0, 4).map(function (a) { return articleCardHtml(a, lang); }).join('') || MB.ui.emptyHtml();
      wireArticleCards(el, lang);
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

    MB.storage.bookmarksList().then(function (saved) {
      if (!saved.length) return;
      var section = root.querySelector('#homeSavedSection');
      section.hidden = false;
      var listEl = root.querySelector('#homeSavedList');
      function render(items) {
        listEl.innerHTML = items
          .sort(function (a, b) { return b.ts - a.ts; })
          .slice(0, 6)
          .map(function (item) {
            var isArticle = item.type === 'article';
            var openAttr = isArticle ? ' data-open-article="' + item.id.replace('article:', '') + '"' : '';
            var tag = isArticle ? 'button' : 'a';
            var extra = isArticle ? ' style="all:unset;cursor:pointer;display:block;flex:1;"' : ' href="#/diagnose" style="color:inherit;text-decoration:none;flex:1;"';
            return '<div class="list-card" style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-2);">' +
              '<' + tag + openAttr + extra + '><div class="list-card__title">' + item.title + '</div>' +
              '<div class="list-card__meta">' + (isArticle ? MB.i18n.t('repair.tab_repair') : MB.i18n.t('diagnostics.result_title')) + '</div></' + tag + '>' +
              '<button class="btn btn-secondary" data-remove="' + item.id + '" type="button" style="padding:4px var(--space-2);font-size:0.8rem;" aria-label="' + (MB.i18n.getLang() === 'bn' ? 'মুছুন' : 'Remove') + '">\u2715</button></div>';
          }).join('');
        listEl.querySelectorAll('[data-remove]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            MB.storage.bookmarkRemove(btn.getAttribute('data-remove')).then(function () {
              MB.storage.bookmarksList().then(function (fresh) {
                if (!fresh.length) { section.hidden = true; return; }
                render(fresh);
              });
            });
          });
        });
        listEl.querySelectorAll('[data-open-article]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            MB.knowledge.getById(btn.getAttribute('data-open-article')).then(function (article) {
              if (article) openArticleDetail(article, lang);
            });
          });
        });
      }
      render(saved);
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

    function renderRecentChips() {
      var chipsEl = root.querySelector('#recentSearchChips');
      if (input.value) { chipsEl.innerHTML = ''; return; }
      MB.storage.recentSearchesList().then(function (list) {
        if (!list.length) { chipsEl.innerHTML = ''; return; }
        chipsEl.innerHTML = list.map(function (r) {
          return '<button class="badge badge-generic" data-recent="' + encodeURIComponent(r.query) + '" style="cursor:pointer;border:none;">\u23f2 ' + r.query + '</button>';
        }).join('');
        chipsEl.querySelectorAll('[data-recent]').forEach(function (chip) {
          chip.addEventListener('click', function () {
            var q = decodeURIComponent(chip.getAttribute('data-recent'));
            input.value = q;
            chipsEl.innerHTML = '';
            runSearch(q);
          });
        });
      });
    }
    renderRecentChips();

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
      root.querySelector('#recentSearchChips').innerHTML = '';
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
        html += section('repair.tab_repair', L.knowledgeBase, function (a) { return articleCardHtml(a, lang); });
      }
      if (activeTab === 'all' || activeTab === 'devices') {
        html += section('common.menu_devices', L.devices, function (d) { return cardHtml(d.brand + ' ' + d.model, d.platform, '#/devices'); });
      }
      if (activeTab === 'all' || activeTab === 'components') {
        html += section('common.menu_components', L.components, function (c) {
          return '<button class="list-card open-component-btn" data-component="' + c.id + '" type="button" style="all:unset;cursor:pointer;display:block;width:100%;box-sizing:border-box;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4);">' +
            '<div class="list-card__title">' + (c.name[lang] || c.name.bn) + '</div><div class="list-card__meta">' + c.symbol + '</div></button>';
        });
      }
      if (activeTab === 'all' || activeTab === 'tools') {
        html += section('common.menu_tools', L.tools, function (t) { return cardHtml(t.name[lang] || t.name.bn, '', '#/tools'); });
      }
      if (activeTab === 'all' || activeTab === 'lessons') {
        html += section('common.nav_learn', L.lessons, function (l) { return cardHtml(l.title[lang] || l.title.bn, MB.i18n.t('common.difficulty_' + l.level), '#/learn'); });
      }
      if (activeTab === 'all' || activeTab === 'errorCodes') {
        html += section('repair.tab_error_codes', L.errorCodes, function (e) {
          return '<button class="list-card open-errorcode-btn" data-code="' + encodeURIComponent(e.code) + '" type="button" style="all:unset;cursor:pointer;display:block;width:100%;box-sizing:border-box;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4);">' +
            '<div class="list-card__title">' + e.manufacturer + ' \u2014 ' + e.code + '</div><div class="list-card__meta">' + e.device + '</div></button>';
        });
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
      wireArticleCards(resultsEl, lang);
      wireDetailButtons(resultsEl, lang, L.components || [], L.errorCodes || []);
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
      var bookmarkId = 'diag:' + category + ':' + JSON.stringify(concl.possibleCauses[0][lang]).slice(0, 40);
      flowStep.innerHTML =
        (concl.safetyStop ? '<div class="card" style="border-color:var(--danger);background:rgba(239,68,68,0.1);margin-bottom:var(--space-4);"><p style="color:var(--danger);font-weight:700;margin:0;">' + concl.safetyStop[lang] + '</p></div>' : '') +
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
        '<button class="btn btn-secondary" id="diagBookmark" type="button">\ud83d\udd16 ' + (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save') + '</button>' +
        '<button class="btn btn-secondary" id="diagStartOver2" type="button">' + MB.i18n.t('diagnostics.start_over') + '</button>' +
        '</div>';

      flowStep.querySelector('#diagStartOver2').addEventListener('click', reset);
      flowStep.querySelector('#diagBookmark').addEventListener('click', function (e) {
        MB.storage.bookmarkAdd({
          id: bookmarkId, type: 'diagnosis', category: category,
          title: concl.possibleCauses[0][lang], ts: Date.now()
        }).then(function () {
          e.target.textContent = '\u2705 ' + (lang === 'bn' ? 'সংরক্ষিত হয়েছে' : 'Saved');
          MB.ui.toast(lang === 'bn' ? 'সংরক্ষণ করা হয়েছে' : 'Saved to your bookmarks');
        });
      });
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
      var related = l.relatedLessons.map(function (rid) { return allLessons.find(function (x) { return x.id === rid; }); }).filter(Boolean);
      var html =
        '<h2 style="margin-top:0;">' + l.title[lang] + '</h2>' +
        '<p><strong>' + (lang === 'bn' ? 'উদ্দেশ্য' : 'Objective') + ':</strong> ' + l.objective[lang] + '</p>' +
        '<p>' + l.theory[lang] + '</p>' +
        (l.steps.length ? '<ol>' + l.steps.map(function (s) { return '<li>' + s[lang] + '</li>'; }).join('') + '</ol>' : '') +
        '<p><em>' + l.example[lang] + '</em></p>' +
        (l.commonMistakes.length
          ? '<p><strong>' + (lang === 'bn' ? 'সাধারণ ভুল' : 'Common Mistakes') + ':</strong></p><ul>' +
            l.commonMistakes.map(function (m) { return '<li>' + m[lang] + '</li>'; }).join('') + '</ul>' : '') +
        '<p class="ai-message"><strong>' + (lang === 'bn' ? 'সতর্কতা' : 'Safety') + ':</strong> ' + l.safety[lang] + '</p>' +
        (l.quiz.length ? '<div id="lessonQuiz"></div>' : '') +
        (related.length
          ? '<p style="margin-top:var(--space-4);"><strong>' + (lang === 'bn' ? 'সম্পর্কিত লেসন' : 'Related Lessons') + ':</strong></p>' +
            '<div class="demo-row demo-row--tight">' + related.map(function (r) {
              return '<button class="badge badge-model related-lesson-btn" data-lesson="' + r.id + '" type="button" style="border:none;cursor:pointer;">' + r.title[lang] + '</button>';
            }).join('') + '</div>' : '') +
        '<div class="demo-row" style="margin-top:var(--space-4);">' +
        '<button class="btn btn-primary" id="markCompleteBtn" type="button">' + (lang === 'bn' ? 'সম্পন্ন করুন' : 'Mark Complete') + '</button>' +
        '<button class="btn btn-secondary" id="lessonAskAi" type="button">' + MB.i18n.t('repair.ask_ai_button') + '</button>' +
        '</div>';

      var modal = MB.ui.openModal(html);
      modal.el.querySelectorAll('.related-lesson-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { modal.close(); openLesson(btn.getAttribute('data-lesson')); });
      });
      modal.el.querySelector('#lessonAskAi').addEventListener('click', function () {
        sessionStorage.setItem('mb_ai_context', JSON.stringify({ category: null, answeredQuestions: [], ruleBasedConclusion: null, lessonSeed: l.aiHelpPromptSeed }));
        modal.close();
        router.navigate('ai');
      });
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

  // ---------- COMPONENTS ----------
  router.registerHydrator('components', function (root) {
    var lang = MB.i18n.getLang();

    MB.diagrams.load().then(function (diagramList) {
      MB.components.load().then(function (componentList) {
        var byId = {};
        componentList.forEach(function (c) { byId[c.id] = c; });

        root.querySelector('#diagramList').innerHTML = diagramList.map(function (d) {
          return '<div class="card diagram-card">' +
            '<h3 class="card__title">' + d.title[lang] + '</h3>' +
            MB.diagrams.renderSvg(d, lang) + '</div>';
        }).join('');

        root.querySelectorAll('.diagram-node.is-tappable').forEach(function (node) {
          function openInfo() {
            var comp = byId[node.getAttribute('data-component')];
            if (!comp) return;
            var isBeginner = getMode() === 'beginner';
            MB.ui.openModal(
              '<h2 style="margin-top:0;">' + comp.name[lang] + (isBeginner ? '' : ' <span class="badge badge-generic">' + comp.symbol + '</span>') + '</h2>' +
              '<p>' + comp.function[lang] + '</p>' +
              '<p><strong>' + (lang === 'bn' ? 'সাধারণ ত্রুটি' : 'Common Failure') + ':</strong> ' + comp.commonFailure[lang] + '</p>' +
              (isBeginner ? '' : '<p><strong>' + (lang === 'bn' ? 'পরীক্ষার ধারণা' : 'Testing Concept') + ':</strong> ' + comp.testingConcept[lang] + '</p>') +
              '<p style="color:var(--danger);"><strong>\u26a0\ufe0f</strong> ' + comp.safety[lang] + '</p>' +
              (isBeginner ? '<p class="phase-status">' + (lang === 'bn' ? '\ud83d\udd27 Technician মোডে আরও টেকনিক্যাল তথ্য (সিম্বল, টেস্টিং কনসেপ্ট) দেখা যাবে — Settings-এ পরিবর্তন করুন।' : '\ud83d\udd27 Switch to Technician mode in Settings to see symbol + testing concept detail.') + '</p>' : '')
            );
          }
          node.addEventListener('click', openInfo);
          node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openInfo(); } });
        });
      });
    });

    MB.components.load().then(function (list) {
      var isBeginner = getMode() === 'beginner';
      root.querySelector('#componentList').innerHTML = list.map(function (c) {
        return '<div class="card">' +
          '<div class="list-card__title">' + c.name[lang] + (isBeginner ? '' : ' <span class="badge badge-generic">' + c.symbol + '</span>') + '</div>' +
          '<p style="margin-top:var(--space-2);">' + c.function[lang] + '</p>' +
          '<p><strong>' + (lang === 'bn' ? 'সাধারণ ত্রুটি' : 'Common Failure') + ':</strong> ' + c.commonFailure[lang] + '</p>' +
          (isBeginner ? '' : '<p><strong>' + (lang === 'bn' ? 'পরীক্ষার ধারণা' : 'Testing Concept') + ':</strong> ' + c.testingConcept[lang] + '</p>') +
          '<p style="color:var(--danger);margin-bottom:0;"><strong>\u26a0\ufe0f</strong> ' + c.safety[lang] + '</p>' +
          '</div>';
      }).join('') || MB.ui.emptyHtml();
    });
  });

  function openErrorCodeDetail(ec, lang) {
    var html =
      '<h2 style="margin-top:0;">' + ec.manufacturer + '</h2>' +
      '<p class="mono" style="color:var(--text-muted);">' + ec.device + '</p>' +
      '<p class="mono" style="font-size:1rem;color:var(--text);">' + ec.code + '</p>' +
      '<div class="conclusion-block"><div class="conclusion-block__label">' + (lang === 'bn' ? 'অর্থ' : 'Meaning') + '</div><p>' + ec.meaning[lang] + '</p></div>' +
      '<div class="conclusion-block"><div class="conclusion-block__label">' + MB.i18n.t('repair.field_causes') + '</div>' +
      ec.possibleCauses.map(function (c) { return '<p>' + c[lang] + '</p>'; }).join('') + '</div>' +
      '<div class="conclusion-block"><div class="conclusion-block__label">' + MB.i18n.t('diagnostics.result_title') + '</div>' +
      ec.diagnostic.map(function (d) { return '<p>' + d[lang] + '</p>'; }).join('') + '</div>' +
      '<div class="conclusion-block"><div class="conclusion-block__label">' + (lang === 'bn' ? 'প্রস্তাবিত পদক্ষেপ' : 'Recommended Action') + '</div><p>' + ec.recommendedAction[lang] + '</p></div>' +
      '<p class="phase-status">' + (lang === 'bn' ? 'সূত্র' : 'Reference') + ': ' + ec.officialReference + '</p>';
    MB.ui.openModal(html);
  }

  function wireDetailButtons(root, lang, componentList, errorCodeList) {
    root.querySelectorAll('.open-component-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var c = componentList.find(function (x) { return x.id === btn.getAttribute('data-component'); });
        if (c) {
          var isBeginner = getMode() === 'beginner';
          MB.ui.openModal(
            '<h2 style="margin-top:0;">' + c.name[lang] + (isBeginner ? '' : ' <span class="badge badge-generic">' + c.symbol + '</span>') + '</h2>' +
            '<p>' + c.function[lang] + '</p>' +
            '<p><strong>' + (lang === 'bn' ? 'সাধারণ ত্রুটি' : 'Common Failure') + ':</strong> ' + c.commonFailure[lang] + '</p>' +
            (isBeginner ? '' : '<p><strong>' + (lang === 'bn' ? 'পরীক্ষার ধারণা' : 'Testing Concept') + ':</strong> ' + c.testingConcept[lang] + '</p>') +
            '<p style="color:var(--danger);"><strong>\u26a0\ufe0f</strong> ' + c.safety[lang] + '</p>'
          );
        }
      });
    });
    root.querySelectorAll('.open-errorcode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = decodeURIComponent(btn.getAttribute('data-code'));
        var ec = errorCodeList.find(function (x) { return x.code === code; });
        if (ec) openErrorCodeDetail(ec, lang);
      });
    });
  }

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
        var lang = MB.i18n.getLang();
        root.querySelector('#deviceList').innerHTML = filtered.map(function (d) {
          return '<div class="card">' +
            '<div class="list-card__title">' + d.brand + ' ' + d.model + '</div>' +
            '<div class="list-card__meta">' + d.modelNumber + ' \u00b7 ' + d.platform + ' \u00b7 ' + d.chipset + '</div>' +
            '<p style="margin-top:var(--space-2);margin-bottom:4px;font-size:0.85rem;">' +
            d.display.type + ' ' + d.display.size + ' \u00b7 ' + d.battery.capacity_mAh + 'mAh \u00b7 ' +
            d.charging.wired_W + 'W' + (d.charging.wireless ? ' + Wireless' : '') + '</p>' +
            '<p style="margin-bottom:var(--space-2);">' + d.diagnosticNotes[lang] + '</p>' +
            (d.commonProblems.length
              ? '<div class="demo-row demo-row--tight">' + d.commonProblems.map(function (pid) {
                  return '<button class="badge badge-model device-problem-link" data-article="' + pid + '" data-device="' + d.id + '" type="button" style="border:none;cursor:pointer;">' + pid.replace(/-/g, ' ') + '</button>';
                }).join('') + '</div>' : '') +
            '</div>';
        }).join('') || MB.ui.emptyHtml();
        root.querySelectorAll('.device-problem-link').forEach(function (btn) {
          btn.addEventListener('click', function () {
            MB.knowledge.getById(btn.getAttribute('data-article')).then(function (article) {
              if (article) openArticleDetail(article, lang, btn.getAttribute('data-device'));
            });
          });
        });
      }
      render();
    });
  });

  // ---------- TOOLS ----------
  router.registerHydrator('tools', function (root) {
    var lang = MB.i18n.getLang();

    var testPoints = [];
    fetch('data/test-points.json').then(function (r) { return r.json(); }).then(function (d) {
      testPoints = d.testPoints;
      var select = root.querySelector('#labTestPoint');
      select.innerHTML = testPoints.map(function (tp) { return '<option value="' + tp.id + '">' + tp.label[lang] + '</option>'; }).join('');
      refreshModeOptions();
    });

    function refreshModeOptions() {
      var tp = testPoints.find(function (t) { return t.id === root.querySelector('#labTestPoint').value; });
      var modeSelect = root.querySelector('#labMode');
      if (!tp) return;
      var available = Object.keys(tp.readings);
      Array.from(modeSelect.options).forEach(function (opt) { opt.hidden = available.indexOf(opt.value) === -1; });
      if (available.indexOf(modeSelect.value) === -1) modeSelect.value = available[0];
    }
    root.querySelector('#labTestPoint').addEventListener('change', refreshModeOptions);

    root.querySelector('#labMeasureBtn').addEventListener('click', function () {
      var tp = testPoints.find(function (t) { return t.id === root.querySelector('#labTestPoint').value; });
      var mode = root.querySelector('#labMode').value;
      var reading = tp && tp.readings[mode];
      if (!reading) { root.querySelector('#labResult').innerHTML = MB.ui.emptyHtml(); return; }
      var simulatedText = typeof reading.simulatedValue === 'string' ? reading.simulatedValue : reading.simulatedValue[lang];
      root.querySelector('#labResult').innerHTML =
        '<div class="ai-message">' +
        '<p class="mono" style="font-size:1.1rem;margin:0 0 var(--space-2);"><span class="badge badge-demo">SIMULATED</span> ' + simulatedText + '</p>' +
        '<p style="margin:0 0 var(--space-2);"><strong>' + (lang === 'bn' ? 'স্বাভাবিক রেঞ্জ' : 'Normal Range') + ':</strong> ' + reading.normalRange[lang] + '</p>' +
        '<p style="margin:0;">' + reading.interpretation[lang] + '</p>' +
        '</div>';
    });

    MB.tools.load().then(function (list) {
      root.querySelector('#toolList').innerHTML = list.map(function (t) {
        return '<div class="card"><div class="list-card__title">' + t.name[lang] + '</div>' +
          '<p style="margin-top:var(--space-2);">' + t.what[lang] + '</p>' +
          '<p><strong>' + (lang === 'bn' ? 'কেন ব্যবহার হয়' : 'Why it\'s used') + ':</strong> ' + t.why[lang] + '</p>' +
          '<p><strong>' + (lang === 'bn' ? 'বেসিক ব্যবহার' : 'Basic use') + ':</strong> ' + t.basicUse[lang] + '</p>' +
          '<p><strong>' + (lang === 'bn' ? 'বিগিনার ভুল' : 'Beginner mistakes') + ':</strong> ' + t.beginnerMistakes[lang] + '</p>' +
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

    root.querySelector('#chgCalcBtn').addEventListener('click', function () {
      var cap = parseFloat(root.querySelector('#chgCapacity').value);
      var cur = parseFloat(root.querySelector('#chgCurrent').value);
      try {
        var hrs = MB.calc.chargingTimeHours(cap, cur);
        root.querySelector('#chgResult').textContent = '\u2248 ' + hrs.toFixed(1) + ' hours (estimate only, real curves taper near full)';
      } catch (e) { root.querySelector('#chgResult').textContent = 'Enter valid capacity and charger current.'; }
    });

    root.querySelector('#pwrCalcBtn').addEventListener('click', function () {
      var v = parseFloat(root.querySelector('#pwrVoltage').value);
      var i = parseFloat(root.querySelector('#pwrCurrent').value);
      var p = MB.calc.power(v, i);
      root.querySelector('#pwrResult').textContent = isNaN(p) ? 'Enter valid voltage and current.' : p.toFixed(3) + ' W';
    });

    var UNIT_OPTIONS = {
      voltage: ['V', 'mV', 'kV'],
      current: ['A', 'mA', 'uA'],
      resistance: ['ohm', 'kohm', 'Mohm']
    };
    function refreshUnitDropdowns() {
      var kind = root.querySelector('#convKind').value;
      var opts = UNIT_OPTIONS[kind].map(function (u) { return '<option value="' + u + '">' + u + '</option>'; }).join('');
      root.querySelector('#convFrom').innerHTML = opts;
      root.querySelector('#convTo').innerHTML = opts;
    }
    refreshUnitDropdowns();
    root.querySelector('#convKind').addEventListener('change', refreshUnitDropdowns);
    root.querySelector('#convCalcBtn').addEventListener('click', function () {
      var kind = root.querySelector('#convKind').value;
      var value = parseFloat(root.querySelector('#convValue').value);
      var from = root.querySelector('#convFrom').value;
      var to = root.querySelector('#convTo').value;
      try {
        var out = MB.calc.convertUnit(kind, value, from, to);
        root.querySelector('#convResult').textContent = value + ' ' + from + ' = ' + out + ' ' + to;
      } catch (e) { root.querySelector('#convResult').textContent = 'Enter a valid value.'; }
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
      var summary;
      if (pendingContext.lessonSeed) {
        summary = pendingContext.lessonSeed;
      } else if (pendingContext.articleTitle) {
        summary = (lang === 'bn' ? 'এই সমস্যা নিয়ে: ' : 'About this issue: ') + pendingContext.articleTitle;
      } else if (pendingContext.answeredQuestions && pendingContext.answeredQuestions.length) {
        summary = (lang === 'bn' ? 'রুল-ভিত্তিক ডায়াগনস্টিক থেকে: ' : 'From the rule-based diagnostic: ') +
          pendingContext.answeredQuestions.map(function (q) { return q.question + ' \u2192 ' + q.answerLabel; }).join('; ');
      } else {
        summary = (lang === 'bn' ? 'এই ক্যাটাগরি নিয়ে সাহায্য করুন: ' : 'Help me with this category: ') + (pendingContext.category || '');
      }
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
    markActive('[data-fontsize]', 'data-fontsize', localStorage.getItem('mb_fontsize') || 'medium');

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
    root.querySelectorAll('[data-fontsize]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var size = btn.getAttribute('data-fontsize');
        document.documentElement.setAttribute('data-fontsize', size);
        localStorage.setItem('mb_fontsize', size);
        markActive('[data-fontsize]', 'data-fontsize', size);
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

    Promise.all([MB.storage.bookmarksList(), MB.storage.progressGetAll()]).then(function (r) {
      var completedLessons = r[1].filter(function (p) { return p.completed; }).length;
      root.querySelector('#dataPreferencesSummary').textContent =
        MB.i18n.t('settings.data_summary', { bookmarks: r[0].length, lessons: completedLessons });
    });

    root.querySelector('#clearLocalDataBtn').addEventListener('click', function () {
      if (!window.confirm(MB.i18n.t('settings.confirm_clear_data'))) return;
      MB.storage.clearAll().then(function () {
        MB.ui.toast(MB.i18n.t('settings.data_cleared'));
        router.navigate('settings');
      });
    });
  });
})();
