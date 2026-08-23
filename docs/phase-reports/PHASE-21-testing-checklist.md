# Testing Checklist (Phase 21)

## Automated during this build (all passed)
- [x] Every `.js` file: `node --check` syntax validation (28 files)
- [x] Every `.json` file: parsed successfully (21 files)
- [x] `data/diagnostic-trees.json`: full simulated walk-through of the charging tree, reaching a real conclusion
- [x] `js/tools.js` calculators: `ohmsLaw`, `power`, `batteryRuntimeHours`, `chargingTimeHours`, `convertUnit` — all smoke-tested with real numbers
- [x] `ai/ai-router.js`: demo-mode fallback verified end-to-end (no keys configured in the build sandbox → clean demo response, no throw)
- [x] Every `<script src>` / `<link href>` in `index.html` resolves to a real file on disk
- [x] Every `manifest.json` icon path resolves to a real file on disk
- [x] Generated PWA icons visually reviewed (192/512/512-maskable/apple-touch/favicon)

## Needs a real browser (no headless browser was available in this build environment — please run these yourself)
- [ ] Open `index.html` via `npx serve .` or `python3 -m http.server` and confirm no console errors
- [ ] Toggle dark/light theme, reload, confirm it persisted
- [ ] Switch language bn ⇄ en in Settings, confirm every visible string updates (including nav labels, page headers)
- [ ] Bottom nav + overflow menu navigate correctly on both hash-route change and page reload with a hash already in the URL
- [ ] Home → search box → Search page carries the query over and returns results across all tabs
- [ ] Diagnose → walk all 3 real trees (charging/power/display) to a conclusion, then tap "Ask MobileBuzz AI" and confirm the Q&A trail arrives pre-filled in the AI chat
- [ ] Learn → open a lesson, answer its quiz, mark complete, confirm the progress % updates and persists after reload
- [ ] Tools → Ohm's Law and Battery Runtime calculators with a few real values
- [ ] AI page with **no** API keys set → confirm a graceful DEMO RESPONSE (not a broken UI) — this only works once `vercel dev` or a real deployment is running, since the browser needs `/api/ai` to exist
- [ ] AI page with **one real key** set (e.g. `ANTHROPIC_API_KEY`) → confirm a real, structured, Bangla/English response depending on chosen language
- [ ] Videos / Web Search tabs with no `YOUTUBE_API_KEY` / `GOOGLE_API_KEY`+`GOOGLE_SEARCH_ENGINE_ID` set → confirm graceful demo state, not an error
- [ ] Install as PWA on an Android device (Chrome menu → "Install app") and confirm it opens standalone with the MobileBuzz icon
- [ ] Airplane mode after first load → confirm the app shell, KB, tools, and lessons still work (service worker cache-first), while AI/Videos/Web correctly show a connectivity error instead of stale fake data

## Explicitly out of scope for this pass
- Cross-browser testing (Safari/Firefox quirks)
- Load/performance testing under real traffic
- Penetration testing of the rate limiter and input validation
