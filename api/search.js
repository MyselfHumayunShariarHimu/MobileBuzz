/**
 * MobileBuzz — Vercel Serverless Function: POST /api/search (Phase 17)
 * Proxies Google Custom Search JSON API. Keys never reach the client.
 *
 * IMPORTANT — verified 2026-08-22: Google's Custom Search JSON API is
 * closed to NEW customers (existing customers keep access until a Google-
 * announced transition deadline). If GOOGLE_API_KEY/GOOGLE_SEARCH_ENGINE_ID
 * cannot be provisioned because this project is new, this route demo-modes
 * gracefully instead of erroring — but the real fix is to swap this adapter
 * for an available alternative (e.g. Bing Web Search API, Brave Search API,
 * SerpAPI, or Vertex AI Search) without changing the response shape below,
 * since the rest of the app only depends on the normalized { items, isDemo }
 * contract, not on Google specifically.
 */
var cache = {};
var CACHE_TTL_MS = 10 * 60 * 1000;
var MAX_RESULTS = 8;

function errorMessage(lang) {
  return lang === 'en'
    ? 'Could not fetch web results right now. Please try again later.'
    : 'এই মুহূর্তে ওয়েব ফলাফল আনা যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
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

  var apiKey = process.env.GOOGLE_API_KEY;
  var cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !cx) {
    // Demo mode — also the expected state for any new project that hasn't
    // been able to provision Custom Search JSON API access (see note above).
    res.status(200).json({
      items: [],
      isDemo: true,
      fallbackUrl: 'https://www.google.com/search?q=' + encodeURIComponent(query)
    });
    return;
  }

  try {
    var url = 'https://www.googleapis.com/customsearch/v1?key=' + apiKey + '&cx=' + cx +
      '&num=' + MAX_RESULTS + '&q=' + encodeURIComponent(query);
    var apiRes = await fetch(url);
    if (!apiRes.ok) throw new Error('Google Custom Search error ' + apiRes.status);
    var data = await apiRes.json();

    var normalized = {
      items: (data.items || []).map(function (it) {
        return { title: it.title, source: it.displayLink, snippet: it.snippet, url: it.link };
      }),
      isDemo: false
    };
    cache[cacheKey] = { data: normalized, expires: now + CACHE_TTL_MS };
    res.status(200).json(normalized);
  } catch (err) {
    console.error('[api/search] error:', err.message);
    res.status(502).json({ error: errorMessage(lang) });
  }
};
