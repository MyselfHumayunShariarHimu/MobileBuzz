# Phase 1 Report — Architecture + Folder Structure + Design System

## ১. কী তৈরি হয়েছে
- সম্পূর্ণ repo skeleton — architecture doc §11-এর folder structure অনুযায়ী সব ফোল্ডার তৈরি
- **Design System**: theme tokens (dark/light — repair-lab material palette: copper/solder, oscilloscope-cyan, PCB solder-mask-green, warning-red), typography (Anek Bangla/Latin display + Hind Siliguri body + JetBrains Mono data/code), spacing/radius/shadow scale, component base styles (Button, Badge, Card, AI Message bubble, Bottom Nav, Theme Toggle)
- **Functional শেল** (`index.html`): ব্র্যান্ড হিরো (animated diagnostic-trace signature element), কাজ-করা dark/light theme toggle (localStorage-এ persist হয়), bottom navigation (৫টা item, hand-drawn SVG icon — emoji না, Android জুড়ে বেশি consistent রেন্ডার করার জন্য), এবং একটা "Design System Preview" সেকশন যেখানে টোকেন/component গুলো লাইভ দেখা যায়
- Repo-level ফাইল: `README.md`, `.gitignore`, `.env.example` (GOOGLE_SEARCH_ENGINE_ID যোগসহ), `package.json`, `vercel.json`
- Architecture doc-এর কপি `docs/`-এ রাখা হয়েছে যাতে repo-র সাথেই থাকে
- বাকি সব module (i18n, router, search, diagnostics, knowledge/devices/components/tools loaders, AI router + ৬টা provider adapter, ৩টা API route, ৮টা page fragment) placeholder/stub হিসেবে তৈরি — প্রতিটাতে comment আছে কোন phase-এ আসল বাস্তবায়ন হবে

## ২. কোন Files তৈরি হয়েছে
`index.html` · `css/{themes,style,responsive,components}.css` · `js/app.js` (functional) + ১৩টা stub JS module (`i18n, router, search, diagnostics, knowledge, devices, components, tools, ai, videos, web-search, storage, ui, utils`) · `ai/model-registry.js`, `ai/ai-router.js`, `ai/providers/*.js` (৬টা stub) · `api/{ai,youtube,search}.js` (stub) · `pages/*.html` (৮টা stub) · `README.md` · `.gitignore` · `.env.example` · `package.json` · `vercel.json` · `docs/MobileBuzz-System-Architecture.md` · `docs/phase-reports/PHASE-1.md`

## ৩. কোথায় বসাতে হবে
সরাসরি ব্যবহারযোগ্য — zip unzip করলেই এটা আপনার repo root। এখান থেকে `git init` করে GitHub-এ push করা যাবে, তারপর Vercel-এ import।

## ৪. কীভাবে test করবেন
1. Zip unzip করুন
2. `npx serve .` অথবা `python3 -m http.server 5173` চালান
3. Browser-এ খুলুন → MobileBuzz hero দেখা যাবে
4. উপরে-ডানে থিম টগল বাটনে ট্যাপ করে dark/light সুইচ টেস্ট করুন — reload করলেও পছন্দ মনে থাকবে (localStorage)
5. নিচে Bottom Nav-এর আইটেমে ট্যাপ করে active-state (রং পরিবর্তন) দেখুন — এখনো actual page পরিবর্তন হবে না, ব্রাউজার console-এ কোনো error আসা উচিত না

## ৫. Expected Result
পুরোপুরি স্টাইল করা, ব্র্যান্ডেড শেল; dark mode ডিফল্ট (অথবা system preference অনুযায়ী); console error-মুক্ত; theme toggle ও bottom-nav visual state কাজ করে; design-token/component preview সেকশন সব রং-টাইপোগ্রাফি-কম্পোনেন্ট দেখায়।

## ৬. কোনো API Key প্রয়োজন কিনা
**না।** Phase 1 সম্পূর্ণ static/offline — কোনো external service কল হয় না।

## ৭. পরবর্তী Phase
**Phase 2 — বাংলা UI + Translation System**: `js/i18n.js`, `locales/bn/*.json`, `locales/en/*.json`, language switcher, `data-i18n` DOM binding।

## ৮. Known Limitations
- Bottom Nav ও theme toggle ছাড়া বাকি সব interaction এখনো নেই — routing Phase 3-এ, i18n Phase 2-এ আসবে
- এখন সব UI টেক্সট hardcoded বাংলা — Phase 2-এর পর `locales/` থেকে আসবে
- Stub module গুলোতে কোনো লজিক নেই, শুধু purpose + phase-tagged comment
- `manifest.json` / `service-worker.js` এখনো নেই (Phase 18) — তাই এখনো installable/offline PWA না
- Google Fonts CDN থেকে load হয় (Anek Bangla/Latin, Hind Siliguri, JetBrains Mono) — সম্পূর্ণ অফলাইন self-hosted font Phase 18 (PWA/offline shell)-এ বিবেচনা করা যেতে পারে

## ৯. এই Phase-এ করা ছোট architecture-সংযোজন
- `assets/icons/`-এর জন্য hand-drawn SVG ব্যবহার হয়েছে, emoji glyph না — বিভিন্ন Android OEM skin-এ emoji ভিন্নভাবে রেন্ডার হয়, SVG বেশি consistent ও theme-able
- `.env.example`-এ `GOOGLE_SEARCH_ENGINE_ID` যোগ হয়েছে — Google Custom Search JSON API-তে `GOOGLE_API_KEY`-এর পাশাপাশি এটাও লাগে (architecture doc §15-এ নোট করা আছে)
