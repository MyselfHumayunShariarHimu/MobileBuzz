# MobileBuzz — System Architecture & Development Roadmap
**Diagnose • Learn • Repair | সমস্যা খুঁজুন • শিখুন • মেরামত করুন**

*Pre-Implementation Package — আপনার Master Prompt-এর §95-এ চাওয়া ১৬টি item। এখানে কোনো implementation code নেই, শুধু architecture, data shape, folder structure ও roadmap। Confirmation পাওয়ার পর Phase 1 (§91) শুরু হবে।*

Generated: 2026-08-21

---

## সূচিপত্র

1. Complete System Architecture
2. Complete Feature Map
3. User Journey
4. Translation Architecture (বাংলা + English)
5. AI Multi-Provider Architecture
6. Diagnostic Engine Architecture
7. Knowledge Base Architecture
8. Search Architecture
9. YouTube / Web Search Architecture
10. Security Architecture
11. Complete Folder Structure
12. Data / JSON Schema
13. UI/UX Architecture
14. PWA Architecture
15. GitHub + Vercel Architecture
16. Complete Development Roadmap

### মূলনীতি (Non-negotiable core principles — সব section-এ প্রযোজ্য)

- **Generic knowledge ≠ model-specific spec** — কোনো generic তথ্যকে exact device service-spec হিসেবে দেখানো যাবে না (§36, §72)।
- **Estimate ≠ measurement** — calculator/estimate-কে বাস্তব measurement হিসেবে দেখানো যাবে না (§56, §72)।
- **AI guess ≠ confirmed diagnosis** — প্রতিটি AI response-এ confidence (Low/Medium/High) থাকবে (§15, §72)।
- **Educational simulation ≠ real test** — Multimeter/DC Supply Lab স্পষ্টভাবে "simulation" লেবেল থাকবে (§30, §72)।
- **Security-bypass কখনো নয়** — FRP, Activation Lock, password bypass, IMEI cloning, credential theft — কোনো architecture layer-এ এর জন্য কোনো path থাকবে না (§46)।
- **Secret কখনো client-এ নয়** — কোনো API key HTML/CSS/JS/localStorage/GitHub-এ যাবে না (§9)।

---

## 1. Complete System Architecture

তিনটি স্তর:

```
┌──────────────────────────────────────────────────┐
│  CLIENT — Browser / PWA                            │
│  HTML5 + CSS3 + Vanilla JS (framework শুধু          │
│  সত্যিকার প্রয়োজনে)                                  │
│  ├─ UI Layer        (pages, components, router.js)│
│  ├─ i18n Engine      (i18n.js → t(), bn/en)        │
│  ├─ App Logic        (diagnostics.js, search.js,   │
│  │                    knowledge.js, tools.js)      │
│  ├─ Local State       (localStorage + IndexedDB)   │
│  └─ Service Worker    (offline shell + cache)      │
└───────────────────────┬────────────────────────────┘
                         │ fetch("/api/...")  [শুধু online চাইলে]
┌───────────────────────▼────────────────────────────┐
│  VERCEL SERVERLESS — API Layer (সব secret এখানে)     │
│  /api/ai.js       →  ai/ai-router.js →  provider    │
│  /api/youtube.js  →  YouTube Data API proxy         │
│  /api/search.js   →  Web Search API proxy           │
│  (input validation · rate limit · error sanitize)   │
└───────────────────────┬────────────────────────────┘
                         │
┌───────────────────────▼────────────────────────────┐
│  EXTERNAL SERVICES                                  │
│  OpenAI · Gemini · Claude · Grok · DeepSeek ·        │
│  OpenRouter · YouTube Data API · Google/Web Search   │
└──────────────────────────────────────────────────┘
```

**মূল সিদ্ধান্ত:**
- **Static-first**: পুরো frontend static asset হিসেবে deploy হয় — CDN cache-friendly, low-end Android-এ দ্রুত লোড হয় (§61)।
- **কোনো traditional database v1-এ নেই** — জ্ঞানভাণ্ডার (knowledge base) app-এর সাথে bundled static JSON হিসেবে থাকে। Repair Center Mode ও Accounts (§49-50) future-এ backend/DB (Postgres/Mongo) যোগ করলেও এই architecture ভাঙবে না — কারণ App Logic layer ইতিমধ্যে module-ভিত্তিক ও data-source-agnostic।
- **AI ছাড়াও পুরো app কাজ করে** — Rule-based Diagnostic Engine (§6) ও Demo Mode (§66) AI ছাড়া সম্পূর্ণ চলে; AI একটা enhancement layer, dependency নয়।
- **প্রতিটি module independently callable** — i18n, ai-router, search, diagnostics কেউ কারো উপর hard-নির্ভর নয়, তাই phase-by-phase build (§91, §94) সহজ হয়।
- **`/ai/` আর `/api/` আলাদা**: `/api/*.js` হলো actual Vercel serverless function (এক একটা HTTP endpoint/lambda); `/ai/*.js` হলো shared business-logic module যা `/api/ai.js` import করে ব্যবহার করে — নিজে endpoint না।

---

## 2. Complete Feature Map

**📚 Repair Academy**
- Beginner / Intermediate / Advanced ট্র্যাক (§33)
- প্রতিটি lesson: objective → theory → tools → steps → example → common mistakes → safety → quiz → related lessons → AI help (§34)
- Progress tracking (localStorage); badges future-ready

**🩺 Diagnostic Laboratory**
- Device (brand → model) → category → rule-based Q&A → result (causes, next test, tools, category, confidence)
- "Ask MobileBuzz AI" — collected answার auto-context হিসেবে AI-তে পাঠায়

**🔧 Knowledge Base**
- Category articles: Power, Charging, Battery, Display, Touch, Audio, Camera, Network, Wi-Fi/Bluetooth, Software (§18-27)
- Device database · Component database · Error-code database
- Repair guide template (§37)

**🤖 Multi-AI Assistant**
- Provider + Model selector (OpenAI/Gemini/Claude/Grok/DeepSeek/OpenRouter)
- Chat: history, copy, regenerate, save, share, translate response
- Structured diagnostic format (§15) + confidence badge + safety STOP gate (§45)

**🧰 Technician Toolkit**
- Multimeter Learning Lab, DC Power Supply Lab — clearly labeled educational simulation
- Tool database (Multimeter → ESD wrist strap)
- Calculators: Ohm's Law, Power, Battery runtime, Charging time, Unit converter
- Interactive SVG diagrams (charging path, power path, ইত্যাদি)
- Beginner / Technician / Advanced mode switch (§86-89)

**🎥 Video + 🔎 Web**
- YouTube search (thumbnail/title/channel/date/link — download নয়)
- Google/Web search (title/source/snippet/URL/date)
- Universal Search — ৯টি source-এ fan-out (§40) + Smart Bangla-normalized search (§41-42)

**🌐 Platform**
- i18n (bn/en, ভবিষ্যতে hi/ur/ar/… যোগ-উপযোগী)
- PWA + offline shell, Dark/Light theme
- Settings: language, theme, font size, AI provider/model, learning mode
- Demo Mode (API key ছাড়াই কাজ করে) · Repair Center Mode + Accounts (future-ready, §49-50)

---

## 3. User Journey

**A — সাধারণ ব্যবহারকারী** (ফোন চার্জ হচ্ছে না)
Home → Search বক্সে "চার্জ হচ্ছে না" টাইপ / Diagnose ট্যাপ → Device (optional/skip) → Category: Charging → ৩-৫টা rule-engine প্রশ্ন → Result (কারণ + tool + safety note) → "Ask MobileBuzz AI" (context auto-prefill) → প্রাসঙ্গিক YouTube video + guide → Bookmark (login ছাড়াই)

**B — টেকনিশিয়ান** (board-level ইস্যু)
Technician Mode ON → Device select → Advanced/Motherboard category → Component DB-তে PMIC পড়ে → Multimeter Lab-এ voltage-test simulate করে → AI-কে schematic-concept প্রশ্ন (provider বেছে নেয়) → Confidence Low/Medium হলে "professional referral" warning দেখে

**C — শিক্ষার্থী**
Learning Academy → Beginner track → Lesson শেষ করে Quiz দেয় → Progress bar আপডেট (localStorage) → Intermediate unlock

---

## 4. Translation Architecture (বাংলা + English)

**UI strings** — `locales/{lang}/{namespace}.json` (§4 অনুযায়ী)। মূল ৫টা namespace (common, repair, diagnostics, ai, settings) ছাড়াও app বড় হলে `learn.json`, `devices.json`, `tools.json` যোগ করার প্রস্তাব রাখছি — namespace যত ছোট, translation manage তত সহজ।

```js
i18n.init({ defaultLang: 'bn', fallback: ['en', 'bn'] });
i18n.setLang('en');           // পুরো UI reload ছাড়া re-render
t('common.search');
t('repair.phone_not_charging');
```

DOM-এ `data-i18n="key"` attribute স্ক্যান করে ভাষা বদলালে টেক্সট বসিয়ে দেয় (placeholder/aria-label-এর জন্য `data-i18n-attr`)। Priority: saved (`localStorage.mb_lang`) → `navigator.language` → বাংলা default (§77)।

**Content translation** (Knowledge Base article, device, lesson) — এটা `locales/` এর অংশ না; প্রতিটি record-এর ভেতরেই `title.bn` / `title.en` sub-object থাকে (§67 এর মতো)। Fallback hierarchy: selected → requested → English → বাংলা (§75), configurable।

**AI response translation** — আলাদা runtime path (§76):
```js
translateContent({ text, sourceLanguage, targetLanguage });
```
AI input-এর ভাষা detect করে সেই ভাষাতেই উত্তর দেয় (§78); "Translate Response" বাটনে আলাদা call হয়, Original + Translated দুটোই দেখানো যায়।

**Technical glossary** — `data/glossary.json`-এ bn⇄en "do-not-mistranslate" শব্দ (Motherboard→মাদারবোর্ড, PMIC→PMIC, ইত্যাদি, §7)। এই ফাইল দুই জায়গায় ব্যবহার হয়: (১) UI-তে "বাংলা নাম (English term)" দেখাতে, (২) AI translation prompt-এ "protected terms" list হিসেবে পাঠাতে, যাতে AI জার্গন ভুল অনুবাদ না করে।

---

## 5. AI Multi-Provider Architecture

Common interface (আপনার §13-এর ফাংশন, `task` field যোগ করে):

```js
// ai/ai-router.js
async function sendAIRequest({ provider, model, messages, temperature, maxTokens, language, task, context }) {
  // task: 'chat' | 'diagnostic' | 'translate'
  const adapter = providers[provider];
  if (!adapter) throw new KnownAIError('PROVIDER_UNAVAILABLE');
  return adapter.send({ model, messages, temperature, maxTokens, language, task, context });
}
```

প্রতিটি `ai/providers/*.js` একটা `send()` export করে, নিজের normalizeResponse() দিয়ে একই common shape-এ ফেরত দেয়:

```json
{
  "provider": "anthropic",
  "model": "…",
  "content": "…structured বাংলা response…",
  "language": "bn",
  "confidence": "medium",
  "isDemo": false,
  "fallbackUsed": false,
  "usage": { "inputTokens": 0, "outputTokens": 0 }
}
```

**model-registry.js** — config-driven, hardcoded logic নয়:
```js
export const MODEL_REGISTRY = {
  openai:     { models: [ /* Phase 10-এ current docs থেকে */ ], default: null },
  gemini:     { models: [ /* Phase 11 */ ], default: null },
  anthropic:  { models: [ /* Phase 12 */ ], default: null },
  xai:        { models: [ /* Phase 13 */ ], default: null },
  deepseek:   { models: [ /* Phase 14 */ ], default: null },
  openrouter: { models: [ /* Phase 15 */ ], default: null }
};
```
> এখানে ইচ্ছাকৃতভাবে কোনো model ID বসানো হয়নি। আপনার §12 rule অনুযায়ী — fake/hardcoded model ID নয় — প্রতিটি provider বাস্তবায়নের সময় (Phase 10-15) সেই provider-এর current official documentation দেখে real model ID বসানো হবে। একইভাবে, প্রতিটি adapter-এর ভেতরের actual API call shape (endpoint, request body) ঐ provider-এর current docs অনুযায়ী তখনই লেখা হবে — এখানে শুধু বাইরের common contract design করা হয়েছে।

`/api/ai.js` (serverless): validate body → rate-limit(session) → provider-এর env key আছে কিনা check → না থাকলে `isDemo:true` সহ demo response (§66) → থাকলে ai-router কল → error sanitize (§63) → respond।

**Fallback (§65)**: শুধু তখনই চলে যখন user নির্দিষ্ট provider "pin" করেনি বা fallback settings-এ অনুমোদিত; response সবসময় জানায় কে আসলে উত্তর দিয়েছে — UI-তে "এই উত্তরটি Gemini থেকে প্রদান করা হয়েছে" ব্যানার।

**Cost control (§64) hooks**: maxTokens cap, per-session rate limit, short-TTL response cache (একই query বারবার এলে), retry limit + timeout।

---

## 6. Diagnostic Engine Architecture

Rule-based, AI-independent, সম্পূর্ণ অফলাইন কাজ করে। `data/problems.json`-এ decision-tree node:

```json
{
  "id": "power-dead-01",
  "category": "power",
  "question": { "bn": "চার্জ দিলে charging icon আসে?", "en": "Does the charging icon appear when plugged in?" },
  "answers": [
    { "label": { "bn": "হ্যাঁ", "en": "Yes" }, "next": "power-dead-02" },
    { "label": { "bn": "না",  "en": "No" },  "conclusion": "power-dead-c1" }
  ]
}
```
পাশাপাশি একটা `conclusions` map: `id → { possibleCauses[], nextTests[], tools[], repairCategory, confidence }`।

`js/diagnostics.js`-এ pure function `walk(tree, answersSoFar)` — পরের প্রশ্ন অথবা conclusion রিটার্ন করে। এই engine zero-cost, zero-AI-dependency।

UI-তে এই output স্পষ্টভাবে **"নিয়মভিত্তিক প্রাথমিক ধারণা"** লেবেলে দেখানো হয় — AI output-এর **"AI বিশ্লেষণ"** লেবেলের সাথে কখনো মিশে যাবে না (§72-এর distinction বজায় রাখতে)। "Ask MobileBuzz AI"-তে ট্যাপ করলে `{ device, category, answeredQuestions, conclusion }` — সব একসাথে AI chat-এর opening context হিসেবে সিরিয়ালাইজ হয়ে যায়, user আবার টাইপ করে না।

---

## 7. Knowledge Base Architecture

Article schema — §67-কে ভিত্তি করে `deviceOverrides` যোগ করা হয়েছে:

```json
{
  "id": "phone-not-charging",
  "category": "charging",
  "title": { "bn": "মোবাইল চার্জ হচ্ছে না", "en": "Phone Not Charging" },
  "difficulty": "beginner",
  "symptoms": [], "causes": [], "diagnosticSteps": [],
  "tools": [], "solutions": [], "warnings": [], "verification": [],
  "deviceOverrides": {
    "samsung:galaxy-a52": { "notes": { "bn": "…", "en": "…" } }
  }
}
```

যখনই কোনো `deviceOverrides` দেখানো হয়, UI-তে বাধ্যতামূলক badge থাকে: **"সাধারণ তথ্য (Generic)"** বনাম **"মডেল-নির্দিষ্ট নোট (Model-specific)"** — এটাই §36-এর rule বাস্তবায়ন করে (generic-কে exact model spec হিসেবে না দেখানো)।

Taxonomy: category → subcategory → article, §18-27-এর সাথে মিলিয়ে। v1-এ একটা `data/problems.json`-এ সব রাখা যথেষ্ট simple; article সংখ্যা বাড়লে category অনুযায়ী আলাদা ফাইলে ভাগ করার (`data/problems/charging.json` ইত্যাদি) প্রস্তাব রাখছি — এখন করার দরকার নেই।

---

## 8. Search Architecture

`js/search.js` একই সাথে fan-out করে: local index (Knowledge Base, Devices, Components, Tools, Lessons — সব app-init-এ একবার build হওয়া lightweight inverted index) + online হলে (YouTube, Web, ঐচ্ছিক AI summary)। একটা source fail করলে (যেমন Web Search API ডাউন) বাকিগুলো আটকায় না — প্রতিটা tab (§83) নিজের loading/error state independently দেখায়।

Bangla normalization (§42-43) — `data/synonyms.json`:
```json
{
  "charging_not_working": [
    "চার্জ হচ্ছে না", "charge hocche na", "charging hocche na", "charge হয় না", "not charging"
  ]
}
```
`search.js` query-কে এই map দিয়ে normalize করে match করে — কোনো heavy search library লাগে না (§61-এর perf goal রক্ষা হয়)।

---

## 9. YouTube / Web Search Architecture

`api/youtube.js`, `api/search.js` — পাতলা serverless proxy; key কখনো client-এ যায় না। প্রতিটার আউটপুট normalize করে একই common shape-এ আসে: `{ title, source/channel, snippet/duration, url, thumbnail?, date? }` — provider বদলালেও (যেমন ভবিষ্যতে অন্য search API) frontend অক্ষত থাকে।

Short-TTL cache (একই normalized query বারবার এলে) quota বাঁচাতে (§64)। Fail হলে raw provider error নয়, Bangla user-friendly message (§63)। YouTube video download/re-host করা হয় না — শুধু link/embed (§39)।

---

## 10. Security Architecture

| ঝুঁকি | Mechanism |
|---|---|
| Secret leak | শুধু Vercel Environment Variables, শুধু `/api/*.js`-এর ভেতরে `process.env.*`, client bundle-এ কখনো import নয় |
| Bad input | প্রতিটা `/api/*` handler-এ method/field/length/type validation, আগেই sanitized 4xx |
| XSS | AI/user output DOM-এ বসানোর আগে escape/sanitize (innerHTML সরাসরি না, বা textNode ব্যবহার) |
| Abuse | Per-IP/session rate limit, exceed হলে 429 + বাংলা message |
| Info leak on error | সব internal error → নির্দিষ্ট কিছু user-safe বাংলা message-এ ম্যাপ (§63); stack trace/key শুধু server log-এ |
| IMEI misuse | শুধু display + legitimate service record; কোনো endpoint/AI-path IMEI পরিবর্তন/clone করে না (§25, §49) |
| Security bypass | FRP/Activation Lock/password-bypass-এর জন্য কোনো UI screen, API route, বা AI system-prompt path architecture-এ নেই; এই ধরনের অনুরোধ safe/legal recovery guidance-এ redirect হয় (§46) |
| Headers | CSP + basic security headers `vercel.json`-এ |
| Dependency risk | প্রায়-zero-dependency vanilla JS, তাই third-party package attack-surface ন্যূনতম |

---

## 11. Complete Folder Structure

আপনার §68-এর structure-ই ভিত্তি (সামান্য annotation সহ):

```
MobileBuzz/
├── index.html
├── manifest.json
├── service-worker.js
├── vercel.json
├── README.md
├── .gitignore
├── .env.example
│
├── css/               (style, responsive, components, themes)
├── js/                (app, router, i18n, search, diagnostics,
│                       knowledge, devices, components, tools,
│                       ai, videos, web-search, storage, ui, utils)
│
├── locales/{bn,en}/   (common, repair, diagnostics, ai, settings.json)
├── data/              (devices, problems, components, tools,
│                       lessons, error-codes, synonyms.json)
│
├── ai/                (model-registry.js, ai-router.js,
│                       providers/{openai,gemini,anthropic,xai,
│                       deepseek,openrouter}.js)  ← shared logic, endpoint না
│
├── api/               (ai.js, youtube.js, search.js)  ← actual serverless functions
│
├── assets/            (icons, images, diagrams)
└── pages/             (home, diagnose, learn, ai, devices,
                        tools, videos, settings.html)
```

**প্রস্তাবিত ছোট সংযোজন:**
- `/public/` — favicon, `robots.txt`, `sitemap.xml` (SEO §60-এর জন্য)
- `/docs/` — এই architecture doc + প্রতিটা phase-report (§92) এখানে জমা রাখা যায়
- `assets/icons/` SVG-based রাখার প্রস্তাব — emoji glyph বিভিন্ন Android OEM skin-এ ভিন্নভাবে দেখায়; একটা reusable `<Icon>` component SVG wrap করলে theming/accessibility/consistency ভালো হয় (নেভিগেশনে emoji লেবেল হিসেবে থাকতেই পারে, কিন্তু actual icon render SVG দিয়ে)

---

## 12. Data / JSON Schema

**Device**
```json
{
  "id": "samsung-galaxy-a52",
  "brand": "Samsung", "model": "Galaxy A52", "modelNumber": "SM-A525F",
  "platform": "Android", "chipset": "Snapdragon 720G",
  "display": { "type": "Super AMOLED", "size": "6.5\"" },
  "battery": { "capacity_mAh": 4500, "removable": false },
  "charging": { "wired_W": 25, "wireless": false },
  "commonProblems": ["phone-not-charging"],
  "repairGuides": ["screen-replacement-a52"],
  "diagnosticNotes": { "bn": "…", "en": "…" }
}
```

**Component**
```json
{
  "id": "pmic",
  "name": { "bn": "পাওয়ার ম্যানেজমেন্ট আইসি", "en": "PMIC" },
  "symbol": "U_PMIC",
  "function": { "bn": "…", "en": "…" },
  "usedIn": ["charging-circuit", "power-rail"],
  "commonFailure": { "bn": "…", "en": "…" },
  "symptoms": ["phone-dead", "no-charging-icon"],
  "testingConcept": { "bn": "…", "en": "…" },
  "safety": { "bn": "…", "en": "…" },
  "relatedComponents": ["cpu", "battery-connector"]
}
```

**Tool**
```json
{
  "id": "multimeter",
  "name": { "bn": "মাল্টিমিটার", "en": "Multimeter" },
  "what": { "bn": "…", "en": "…" }, "why": { "bn": "…", "en": "…" },
  "basicUse": { "bn": "…", "en": "…" }, "safety": { "bn": "…", "en": "…" },
  "beginnerMistakes": { "bn": "…", "en": "…" }
}
```

**Lesson**
```json
{
  "id": "intro-multimeter", "level": "intermediate",
  "title": { "bn": "…", "en": "…" },
  "objective": { "bn": "…", "en": "…" }, "theory": { "bn": "…", "en": "…" },
  "tools": ["multimeter"], "steps": [], "example": { "bn": "…", "en": "…" },
  "commonMistakes": [], "safety": { "bn": "…", "en": "…" },
  "quiz": [{ "q": {}, "options": [], "answer": 0 }],
  "relatedLessons": [], "aiHelpPromptSeed": "…"
}
```

**Error Code**
```json
{
  "manufacturer": "Samsung", "device": "Galaxy A52", "code": "E:501",
  "meaning": { "bn": "…", "en": "…" }, "possibleCauses": [], "diagnostic": [],
  "recommendedAction": { "bn": "…", "en": "…" }, "officialReference": "url-or-note"
}
```

**Synonyms** — উদাহরণ §8-এ দেখানো হয়েছে।

---

## 13. UI/UX Architecture

**Design tokens** — `themes.css`-এ CSS custom properties (`--bg`, `--surface`, `--text`, `--accent`, `--danger`, `--radius`, `--space-*`)। Dark = charcoal + electric accent; Light = white/gray, শক্ত readable text (§54)।

**Component tiers**
- Primitive: Button, Icon (SVG-based), Input, Badge
- Composite: RepairCard, DeviceCard, ToolCard, LessonCard, VideoCard, SearchBox, Tabs, Accordion, Dropdown, Modal, Toast, AIMessage
- Layout: Navbar, BottomNav, Sidebar
- Page-level assembly (§55)

**Navigation** — BottomNav fixed ৫টা (Home/Search/Diagnose/Learn/AI) + overflow menu (Devices/Components/Tools/Videos/Web Search/Settings), §53 অনুযায়ী।

**Lightweight state** — framework ছাড়া reactivity দরকার, তাই একটা ছোট pub/sub (`state.js`) `{ lang, theme, mode }` রাখবে; component-রা subscribe করে re-render করবে।

**Standard states** — Loading / Error / Empty প্রতিটা async জায়গায় (AI, search, video) reusable component হিসেবে consistent থাকবে।

---

## 14. PWA Architecture

`manifest.json` — name (বাংলা), short_name, `start_url`, `display: standalone`, `theme_color`, icon set, `lang: "bn"`।

`service-worker.js` — cache strategy:
- **Cache-first + versioned cache name** → app shell + static knowledge JSON (deploy-এ cache-name বাম্প করলে পুরনো cache invalidate)
- **Network-only (কখনো cache নয়)** → `/api/ai`, `/api/youtube`, `/api/search` — কারণ এগুলোর জন্য live/fresh internet দরকার, stale AI answer কখনো silently serve করা যাবে না (§47)

**IndexedDB** — bookmark/progress/recent-search-এর জন্য (ছোট wrapper, heavy lib নয়); `localStorage` শুধু lang/theme-এর মতো ছোট flag-এর জন্য (§48, §51)।

---

## 15. GitHub + Vercel Architecture

Repo layout = উপরের folder structure। `main` = production; feature branch → PR → Vercel Preview Deployment (auto)।

`vercel.json` (starter উদাহরণ):
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]}
  ]
}
```

Environment variables — Vercel dashboard-এ (Production/Preview/Development scope), `.env.example`-এর সাথে মিলিয়ে। **একটা ছোট সংযোজন দরকার**: Google/Web Search-এর জন্য শুধু `GOOGLE_API_KEY` যথেষ্ট না — Google Custom Search JSON API-তে একটা Search Engine ID (`cx`)-ও লাগে, তাই `GOOGLE_SEARCH_ENGINE_ID` env var যোগ করার প্রস্তাব রাখছি।

Deployment flow: local commit → push → GitHub → Vercel auto-build → Preview URL (non-main) / Production URL (main) → smoke-test। ক্লিক-বাই-ক্লিক ধাপ README-তে Phase 22-এ যাবে (§69-70)।

---

## 16. Complete Development Roadmap

| Phase | নাম | মূল Deliverable | API Key |
|---|---|---|---|
| 1 | Architecture + Folder + Design System | Repo skeleton, `themes.css` tokens, base `index.html` shell | না |
| 2 | Bangla UI + Translation System | `i18n.js`, `locales/bn`, `locales/en`, language switcher | না |
| 3 | Home + Navigation + Routing | `router.js`, BottomNav, Home page | না |
| 4 | Knowledge Base | `data/problems.json` (charging+power প্রথমে), KB pages | না |
| 5 | Search | `search.js`, `synonyms.json`, Search page (local sources) | না |
| 6 | Diagnostic Engine | `diagnostics.js`, decision-tree data, Diagnose page | না |
| 7 | Learning Academy | `lessons.json`, Learn pages, progress tracking | না |
| 8 | Tools & Calculators | Ohm's Law ইত্যাদি calculator, Tool database | না |
| 9 | AI Abstraction Layer | `ai-router.js`, `model-registry.js`, Demo Mode | না (demo) |
| 10 | OpenAI Integration | `providers/openai.js` + `api/ai.js` wiring | OPENAI_API_KEY |
| 11 | Gemini Integration | `providers/gemini.js` | GEMINI_API_KEY |
| 12 | Claude Integration | `providers/anthropic.js` | ANTHROPIC_API_KEY |
| 13 | Grok Integration | `providers/xai.js` | XAI_API_KEY |
| 14 | DeepSeek Integration | `providers/deepseek.js` | DEEPSEEK_API_KEY |
| 15 | OpenRouter Integration | `providers/openrouter.js` | OPENROUTER_API_KEY |
| 16 | YouTube Search | `api/youtube.js`, VideoCard, Videos page | YOUTUBE_API_KEY |
| 17 | Google/Web Search | `api/search.js`, Web tab | GOOGLE_API_KEY + GOOGLE_SEARCH_ENGINE_ID |
| 18 | PWA | `manifest.json`, `service-worker.js`, offline shell | না |
| 19 | Security Hardening | rate limit, sanitize, headers, §71 checklist pass | না |
| 20 | Performance | lazy-load, caching, bundle trim, low-end test | না |
| 21 | Testing | phase-by-phase manual + smoke test | না |
| 22 | GitHub + Vercel Deployment | README steps, `vercel.json`, production deploy | Vercel-এ env var সেট |

প্রতিটা future phase শেষে §92-এর ফরম্যাট অনুসরণ করা হবে: কী তৈরি হলো → কোন files → কোথায় বসাতে হবে → কীভাবে test → API key লাগবে কিনা → পরবর্তী phase → known limitations।

---

## পরবর্তী ধাপ (Next Step)

এই architecture-এ কোনো পরিবর্তন লাগলে জানাবেন। ঠিক থাকলে **Phase 1 (folder scaffold + design system)** দিয়ে implementation শুরু হবে।
