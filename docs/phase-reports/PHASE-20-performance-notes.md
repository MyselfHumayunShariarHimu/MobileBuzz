# Performance Notes (Phase 20)

## Already in place
- **Zero framework, zero build step** — no bundler overhead; every file is small and independently cacheable.
- **Service worker cache-first** (Phase 18) for the entire app shell + static JSON — repeat visits load from cache instantly, no network round-trip.
- **Short-TTL server-side caching** in `api/youtube.js` / `api/search.js` (10 min) — cuts duplicate external-API latency and quota spend for repeated queries.
- **Font loading**: `preconnect` hints for Google Fonts, and only 4 weight/family combinations loaded (not a heavy full family).
- **CSS**: no heavy framework (no Bootstrap/Tailwind build), just hand-written custom properties + a few hundred lines total across 4 files.
- **Images**: PWA icons are small PNGs (a few KB each); no other raster images in the app yet.
- **Local-first data**: Knowledge Base/Devices/Components/Tools/Lessons are all static JSON bundled with the app — no database round-trip for the core experience.

## Honest gap — needs a live environment to actually validate
This build environment has no headless browser and no real Android device, so the following genuinely could not be measured here and should be checked once deployed:
- A real Lighthouse/PageSpeed run (mobile, throttled network + CPU)
- First Contentful Paint / Time to Interactive on an actual low-end Android device
- Real service-worker cache-hit behavior across a slow/flaky connection

## Recommended next steps once live
1. Run Lighthouse on the deployed Vercel URL (mobile profile) and address whatever it flags.
2. If the number of `<script>` tags becomes a measured bottleneck (many small HTTP/2 requests are usually fine, but worth checking), consider a lightweight concatenation step (e.g. `esbuild` with no other framework) purely for production `index.html` — this would be an *opt-in* build step, not a required one, to preserve the "no build step needed for local dev" property.
3. Add `loading="lazy"` to any future images (thumbnails, diagrams) once those are added in later content phases.
4. Consider self-hosting the Google Fonts files (instead of the Google Fonts CDN) if the PWA's fully-offline story needs the exact same fonts available with zero network dependency.
