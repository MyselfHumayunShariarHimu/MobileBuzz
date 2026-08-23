/**
 * MobileBuzz — Vercel Serverless Function: POST /api/ai (Phase 9-15)
 * Validates the request, applies a simple per-IP rate limit, calls
 * ai/ai-router.js, and sanitizes any error before it reaches the client.
 * Never logs or returns raw provider errors/stack traces to the client (§63).
 */
var { sendAIRequest } = require('../ai/ai-router.js');

var MAX_MESSAGE_LEN = 4000;
var MAX_MESSAGES = 30;
var VALID_PROVIDERS = ['openai', 'gemini', 'anthropic', 'xai', 'deepseek', 'openrouter'];

// Best-effort in-memory rate limit. Serverless instances are ephemeral and
// may run as multiple concurrent copies, so this is a soft limit, not a
// durable one — a KV-backed limiter (e.g. Vercel KV) is the production
// upgrade path noted in the architecture doc (§5 cost-control).
var requestLog = {};
var RATE_LIMIT_WINDOW_MS = 60 * 1000;
var RATE_LIMIT_MAX = 20;

function isRateLimited(ip) {
  var now = Date.now();
  var entries = (requestLog[ip] || []).filter(function (t) { return now - t < RATE_LIMIT_WINDOW_MS; });
  entries.push(now);
  requestLog[ip] = entries;
  return entries.length > RATE_LIMIT_MAX;
}

function errorMessage(lang, key) {
  var MESSAGES = {
    method: { bn: 'শুধুমাত্র POST request গ্রহণযোগ্য।', en: 'Only POST requests are accepted.' },
    invalid: { bn: 'অনুরোধটি সঠিক ফরম্যাটে নেই।', en: 'The request is not in a valid format.' },
    rate_limited: { bn: 'একটু ধীরে — কিছুক্ষণ পর আবার চেষ্টা করুন।', en: 'Slow down — please try again shortly.' },
    unavailable: { bn: 'AI সার্ভিসটি বর্তমানে পাওয়া যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।', en: 'The AI service is currently unavailable. Please try again later.' }
  };
  return MESSAGES[key][lang === 'en' ? 'en' : 'bn'];
}

module.exports = async function handler(req, res) {
  var lang = (req.body && req.body.language) || 'bn';

  if (req.method !== 'POST') {
    res.status(405).json({ error: errorMessage(lang, 'method') });
    return;
  }

  var ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(ip)) {
    res.status(429).json({ error: errorMessage(lang, 'rate_limited') });
    return;
  }

  var body = req.body || {};
  var provider = body.provider;
  var messages = body.messages;

  if (
    VALID_PROVIDERS.indexOf(provider) === -1 ||
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some(function (m) { return typeof m.content !== 'string' || m.content.length > MAX_MESSAGE_LEN; })
  ) {
    res.status(400).json({ error: errorMessage(lang, 'invalid') });
    return;
  }

  try {
    var result = await sendAIRequest({
      provider: provider,
      model: body.model,
      messages: messages,
      temperature: typeof body.temperature === 'number' ? body.temperature : undefined,
      maxTokens: typeof body.maxTokens === 'number' ? Math.min(body.maxTokens, 2048) : undefined,
      language: lang,
      task: body.task || 'chat',
      context: body.context,
      allowFallback: !!body.allowFallback
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('[api/ai] provider error:', err.code || 'UNKNOWN', err.message); // server log only
    res.status(502).json({ error: errorMessage(lang, 'unavailable') });
  }
};
