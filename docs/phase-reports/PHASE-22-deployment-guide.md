# GitHub + Vercel Deployment Guide (Phase 22)

## 1. GitHub repository
```bash
cd MobileBuzz
git init
git add .
git commit -m "MobileBuzz: initial build (Phases 1-18)"
```
Create a new empty repository on GitHub (no README/license — this project already has one), then:
```bash
git remote add origin https://github.com/<your-username>/mobilebuzz.git
git branch -M main
git push -u origin main
```
`.env` is already git-ignored — double-check with `git status` that it never appears staged.

## 2. Vercel project
1. Go to vercel.com → **Add New… → Project**.
2. Import the `mobilebuzz` GitHub repo.
3. Framework preset: choose **Other** (this is a static + serverless-functions project, not a framework Vercel needs to auto-detect).
4. Build command: leave empty. Output directory: leave as project root (`.`). Vercel auto-detects `/api/*.js` as serverless functions.

## 3. Environment variables
In the Vercel project → **Settings → Environment Variables**, add each of these for **Production**, **Preview**, and **Development**:

| Key | Needed for |
|---|---|
| `OPENAI_API_KEY` | Phase 10 |
| `GEMINI_API_KEY` | Phase 11 |
| `ANTHROPIC_API_KEY` | Phase 12 |
| `XAI_API_KEY` | Phase 13 |
| `DEEPSEEK_API_KEY` | Phase 14 |
| `OPENROUTER_API_KEY` | Phase 15 |
| `YOUTUBE_API_KEY` | Phase 16 |
| `GOOGLE_API_KEY` | Phase 17 |
| `GOOGLE_SEARCH_ENGINE_ID` | Phase 17 (Custom Search Engine ID — see note below) |

You do **not** need every key — the app runs in demo mode for any provider/feature whose key is missing. Add just the ones you have.

> **Note on `GOOGLE_API_KEY` / `GOOGLE_SEARCH_ENGINE_ID`:** as of this build, Google's Custom Search JSON API is closed to new customers. If you don't already have an existing Custom Search API setup, the Web Search tab will simply stay in demo mode — see `api/search.js`'s header comment for swap-in alternatives (Bing Web Search API, Brave Search API, SerpAPI, Vertex AI Search) that work with the same `{ items, isDemo }` response contract.

## 4. Deploy
Click **Deploy**. Vercel builds and gives you a `*.vercel.app` URL. Every subsequent push to `main` redeploys Production automatically; every push to another branch/PR gets its own Preview URL.

## 5. Smoke test in production
- Load the Production URL, confirm the app shell renders and the theme toggle works.
- Open the AI page and send a message — if you added at least one real API key, confirm you get a real (non-demo) response.
- Check the browser's Application tab → confirm the service worker registered and the manifest is picked up (Chrome will show an "Install" icon in the address bar).

## 6. Custom domain (optional)
Vercel project → **Settings → Domains** → add your domain and follow the DNS instructions shown there.

## 7. Updating
Any `git push` to `main` redeploys automatically — no manual steps. For an environment variable change, add/edit it in the Vercel dashboard and trigger a redeploy (Vercel does this automatically after an env var change on the next deploy, or you can force one from the dashboard).

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| AI page always shows DEMO RESPONSE | The relevant provider's env var isn't set in the **Production** environment scope specifically (Preview/Development having it isn't enough for the live site). |
| 404 on `/api/ai` | Confirm the file is at `api/ai.js` at the repo root, not nested under another folder. |
| Videos/Web tab errors instead of demo-mode | Check the Vercel function logs (Project → Deployments → \[latest\] → Functions) for the real error — the client never sees it by design (§63), but the server log will show it. |
