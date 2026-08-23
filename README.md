# MobileBuzz

**Diagnose • Learn • Repair | সমস্যা খুঁজুন • শিখুন • মেরামত করুন**

বাংলা-ভিত্তিক মোবাইল রিপেয়ার ডায়াগনস্টিক, লার্নিং একাডেমি ও মাল্টি-AI সহায়ক প্ল্যাটফর্ম।

## স্ট্যাটাস

🟢 **Phases 1–19, 21, 22 বাস্তবায়িত** (full detail: `docs/phase-reports/MASTER-REPORT.md`)

- সম্পূর্ণ architecture ও রোডম্যাপ: [`docs/MobileBuzz-System-Architecture.md`](docs/MobileBuzz-System-Architecture.md)
- মাস্টার রিপোর্ট (সব phase-এর সারাংশ + known limitations): [`docs/phase-reports/MASTER-REPORT.md`](docs/phase-reports/MASTER-REPORT.md)
- Security checklist status: [`docs/phase-reports/PHASE-19-security-checklist.md`](docs/phase-reports/PHASE-19-security-checklist.md)
- Testing checklist: [`docs/phase-reports/PHASE-21-testing-checklist.md`](docs/phase-reports/PHASE-21-testing-checklist.md)
- Deployment guide: [`docs/phase-reports/PHASE-22-deployment-guide.md`](docs/phase-reports/PHASE-22-deployment-guide.md)

## যা কাজ করে (আজই টেস্টযোগ্য, কোনো API key ছাড়াই)

- বাংলা/English UI, পুরোপুরি অনুবাদযোগ্য (`locales/`)
- Dark/Light theme (persist হয়)
- Home, Search (multi-source), Diagnose (৩টা real decision tree: charging/power/display), Learn (৪টা lesson + quiz + progress), Devices, Tools (৪টা calculator + tool database)
- AI চ্যাট পেজ — key ছাড়া DEMO RESPONSE দেখায়; key দিলে (নিচে দেখুন) real answer দেয়
- PWA: installable, offline shell (service worker)

## AI Provider সাপোর্ট (Phase 9–15)

OpenAI · Google Gemini · Anthropic Claude · xAI Grok · DeepSeek · OpenRouter — সবগুলোর adapter বাস্তবায়িত ও verified API shape ব্যবহার করে (`ai/providers/`), কিন্তু **কোনো key configure করা নেই** (আপনার নিজের key লাগবে)। কোনো key ছাড়াই পুরো app demo mode-এ চলে।

## টেক স্ট্যাক

- Vanilla HTML5 / CSS3 / JavaScript — কোনো framework নেই
- Vercel Serverless Functions (`/api`) — AI, YouTube, Web Search proxy; সব secret শুধু এখানে
- GitHub + Vercel deployment
- PWA (manifest + service worker)

## লোকালি চালানো

**কোনো API key ছাড়া (static preview):**
```bash
npx serve .
# অথবা
python3 -m http.server 5173
```
এতে UI, i18n, Knowledge Base, Diagnose, Learn, Tools সব কাজ করবে। AI/Videos/Web Search demo mode দেখাবে কারণ `/api/*` route static server-এ available না।

**AI/Videos/Web Search সহ পূর্ণ টেস্টের জন্য:**
```bash
npm i -g vercel
vercel dev
```

## Environment Variables

`.env.example` দেখুন। বিস্তারিত: `docs/phase-reports/PHASE-22-deployment-guide.md`। `.env` কখনো commit হবে না।

## ফোল্ডার স্ট্রাকচার ও Data/JSON Schema

`docs/MobileBuzz-System-Architecture.md`-এর §11 ও §12; বাস্তব ফাইলগুলো `data/`, `locales/`, `ai/`, `api/`, `pages/`-এ।

## Known Limitations (বিস্তারিত: MASTER-REPORT.md)

- Knowledge Base/Devices/Components/Tools/Lessons-এ বাস্তব, কাজ-করা seed content আছে (১৪+৫+৬+৮+৪ আইটেম) — হাজার হাজার article-এর claim নয়, বরং একটা সৎ, সম্প্রসারণযোগ্য starting point
- Diagnostic Engine-এ ৩টা category-র real decision tree আছে (charging/power/display); বাকি ৭টা category বর্তমানে Knowledge Base article-এ redirect করে
- কোনো headless browser এই build environment-এ ছিল না, তাই সব JS/JSON syntax-validated ও logic-এ smoke-tested হয়েছে, কিন্তু full in-browser QA বাকি (checklist: PHASE-21)
- Google Custom Search JSON API নতুন গ্রাহকদের জন্য বন্ধ — `api/search.js`-এর কমেন্টে বিকল্প উল্লেখ আছে
