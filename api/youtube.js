/**
 * MobileBuzz — Vercel Serverless Function: POST /api/youtube (Phase 16)
 * Proxies YouTube Data API v3 search.list. Key never reaches the client.
 * Normalizes results to a common shape regardless of provider.
 * Short in-memory cache (best-effort, per-instance) to cut quota usage (§64).
 */
var cache = {}; // query -> { data, expires }
var CACHE_TTL_MS = 10 * 60 * 1000;
var MAX_RESULTS = 8;

function errorMessage(lang) {
  return lang === 'en'
    ? 'Could not fetch videos right now. Please try again later.'
    : 'এই মুহূর্তে ভিডিও আনা যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
}

module.exports = async function handler(req, res) {
  var lang = (req.query && req.query.lang) || 'bn';
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: errorMessage(lang) });
    return;
  }

  var query = (req.method === 'GET' ? req.query.q : (req.body && req.body.q)) || '';
  query = String(query).slice(0, 200).trim();
  if (!query) { res.status(400).json({ error: errorMessage(lang) }); return; }

  var cacheKey = query.toLowerCase();
  var now = Date.now();
  if (cache[cacheKey] && cache[cacheKey].expires > now) {
    res.status(200).json(cache[cacheKey].data);
    return;
  }

  var apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Demo mode: no key configured yet — return an empty, clearly-flagged result
    // plus a direct-search fallback link, rather than erroring.
    res.status(200).json({
      items: [],
      isDemo: true,
      fallbackUrl: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
    });
    return;
  }

  try {
    var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=' +
      MAX_RESULTS + '&q=' + encodeURIComponent(query) + '&key=' + apiKey;
    var apiRes = await fetch(url);
    if (!apiRes.ok) throw new Error('YouTube API error ' + apiRes.status);
    var data = await apiRes.json();

    var normalized = {
      items: (data.items || []).map(function (it) {
        return {
          title: it.snippet.title,
          channel: it.snippet.channelTitle,
          date: it.snippet.publishedAt,
          thumbnail: it.snippet.thumbnails && it.snippet.thumbnails.default ? it.snippet.thumbnails.default.url : null,
          url: 'https://www.youtube.com/watch?v=' + it.id.videoId
        };
      }),
      isDemo: false
    };
    cache[cacheKey] = { data: normalized, expires: now + CACHE_TTL_MS };
    res.status(200).json(normalized);
  } catch (err) {
    console.error('[api/youtube] error:', err.message);
    res.status(502).json({ error: errorMessage(lang) });
  }
};
