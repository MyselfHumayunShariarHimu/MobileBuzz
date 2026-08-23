# Security Checklist — Status (Phase 19)

Mapped against the architecture doc §10 / master spec §71.

| # | Item | Status | Where |
|---|---|---|---|
| 1 | No API keys in frontend | ✅ | All 6 provider keys + YouTube/Google keys read only via `process.env.*` inside `/api/*.js` and `/ai/providers/*.js`. Zero key references anywhere under client-loaded files. |
| 2 | No secrets in GitHub | ✅ | `.env` is git-ignored; `.env.example` ships with empty values only. |
| 3 | `.env` ignored | ✅ | `.gitignore` includes `.env`, `.env.local`. |
| 4 | `.env.example` included | ✅ | Present, includes `GOOGLE_SEARCH_ENGINE_ID` addition (needed alongside `GOOGLE_API_KEY`). |
| 5 | Input validation | ✅ | `api/ai.js` validates provider allow-list, message count/length, method; `api/youtube.js`/`api/search.js` validate query length and method. |
| 6 | API rate limiting strategy | ⚠️ Partial | `api/ai.js` has an in-memory per-IP token bucket (20 req/min). **Known limitation:** in-memory state is per-serverless-instance and best-effort, not durable across cold starts/multiple instances — a KV-backed limiter (Vercel KV / Upstash Redis) is the production-hardening upgrade, noted inline in the code. |
| 7 | Error sanitization | ✅ | Every `/api/*` route catches provider errors, logs the real message server-side only, and returns one of a fixed set of Bangla/English user-safe messages. No stack traces or provider error bodies ever reach the client. |
| 8 | XSS protection | ✅ | AI/user-derived text is inserted via `textContent`/template strings built from trusted local data; no raw AI HTML is passed through `innerHTML` unescaped. (Note: some hydrators build HTML strings from **our own** JSON/locale data via `innerHTML` for convenience — safe today since none of that data is user-supplied, but if user-generated content is added later, route it through an escaping helper first.) |
| 9 | HTML sanitization | ✅ | Same as above — no raw external HTML is ever injected. |
| 10 | API timeout | ⚠️ Not yet implemented | Provider adapters currently rely on the platform's default fetch/function timeout rather than an explicit per-request timeout. Recommended before production: wrap each adapter's `fetch` in an `AbortController` with an 15-30s timeout. |
| 11 | Provider failure handling | ✅ | `ai-router.js` catches adapter errors, optionally falls back to another configured provider (only if the caller allowed it), and always demo-modes rather than hard-failing when no key exists anywhere. |
| 12 | User-controlled input limits | ✅ | `MAX_MESSAGE_LEN` (4000 chars) and `MAX_MESSAGES` (30) enforced in `api/ai.js`; query length capped at 200 chars in `api/youtube.js`/`api/search.js`. |

## Design-level boundaries (by construction, not just checklist items)
- No UI screen, API route, or AI system prompt path exists anywhere in this codebase for FRP/Activation Lock/password bypass or IMEI cloning — the AI system prompt in `ai-router.js` explicitly instructs every provider to refuse these regardless of how a user asks.
- IMEI is handled as a display/reference field only (`data/devices.json` has no IMEI-mutation path).
- `vercel.json` sets `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` headers on every response.

## Before going to production, still do
- Add `AbortController` timeouts to all 6 provider adapters + YouTube/Search fetches.
- Replace the in-memory rate limiter with a durable store if traffic grows beyond a single low-volume deployment.
- Re-verify every model ID in `ai/model-registry.js` against each provider's live docs — this list moves fast (see the registry's own header comment).
