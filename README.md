# MobileBuzz

**Diagnose • Learn • Repair | সমস্যা খুঁজুন • শিখুন • মেরামত করুন**

বাংলা-ভিত্তিক মোবাইল রিপেয়ার ডায়াগনস্টিক, লার্নিং একাডেমি ও মাল্টি-AI সহায়ক প্ল্যাটফর্ম — সম্পূর্ণ ডেভেলপ করা।

## এখনই যা কাজ করে (কোনো সেটআপ ছাড়াই)

```bash
npx serve .
```

- বাংলা/English UI, Dark/Light theme, Font size — সব persist হয়
- Home, Search (৬টা source), Diagnose (১০টা category, real decision tree), Learn (১২টা lesson + quiz + progress), Devices, Components (+ interactive diagrams), Tools (৫টা calculator + Multimeter Learning Lab)
- Bookmarks, Recent Searches, Data Preferences
- AI চ্যাট, YouTube, Web Search — key ছাড়াই real Knowledge Base-grounded DEMO mode-এ কাজ করে
- Installable PWA, offline shell

**পূর্ণ বিস্তারিত রিপোর্ট: [`docs/phase-reports/MASTER-REPORT.md`](docs/phase-reports/MASTER-REPORT.md)** — কনটেন্ট ইনভেন্টরি, সব fix-এর তালিকা, honest limitations, সবকিছু।

## Automated Tests

```bash
npm test
```
২৮টা টেস্ট — ডেটা integrity, diagnostic tree logic, calculator math, AI demo-matching, সব সত্যিকারে যাচাই করা (headless browser ছাড়াই সম্ভব যতটুকু)।

## AI Providers (৬টাই বাস্তবায়িত, verified current API)

OpenAI · Google Gemini · Anthropic Claude · xAI Grok · DeepSeek · OpenRouter — `ai/providers/`-এ। কোনো key configure করা নেই (আপনার নিজের key লাগবে, `.env.example` দেখুন)।

## টেক স্ট্যাক

Vanilla HTML/CSS/JS, কোনো framework নেই। Vercel Serverless Functions (`/api`)। GitHub + Vercel deployment। PWA।

## পূর্ণ AI/YouTube/Web Search টেস্টের জন্য

```bash
npm i -g vercel
vercel dev
```

## Deployment

সম্পূর্ণ ধাপ: [`docs/phase-reports/PHASE-22-deployment-guide.md`](docs/phase-reports/PHASE-22-deployment-guide.md)

## Documentation

- সম্পূর্ণ Architecture: [`docs/MobileBuzz-System-Architecture.md`](docs/MobileBuzz-System-Architecture.md)
- Final Report: [`docs/phase-reports/MASTER-REPORT.md`](docs/phase-reports/MASTER-REPORT.md)
- Security checklist: [`docs/phase-reports/PHASE-19-security-checklist.md`](docs/phase-reports/PHASE-19-security-checklist.md)
- Testing checklist: [`docs/phase-reports/PHASE-21-testing-checklist.md`](docs/phase-reports/PHASE-21-testing-checklist.md)
