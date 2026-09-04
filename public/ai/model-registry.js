/**
 * MobileBuzz — AI Model Registry (Phase 9)
 * Config-driven, not hardcoded logic (per project rule §12). Model IDs below
 * were verified against each provider's official docs / current release
 * notes as of the "lastVerified" date on each entry — NOT guessed. This
 * landscape moves in WEEKS, not years (OpenAI alone shipped 5.2->5.6 in
 * under a year) — re-verify against official docs before every deploy that
 * depends on a specific model ID, and treat this file as needing periodic
 * refresh, not a fixed constant.
 *
 * Isomorphic: used client-side (populate provider/model dropdowns) AND
 * server-side in api/ai.js (validate the incoming provider/model).
 */
var MODEL_REGISTRY = {
  openai: {
    label: 'OpenAI',
    lastVerified: '2026-08-22',
    source: 'https://developers.openai.com/api/docs/models',
    models: [
      { id: 'gpt-5.6', label: 'GPT-5.6 Sol (flagship)' },
      { id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra (balanced)' },
      { id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna (cost-sensitive)' }
    ],
    defaultModel: 'gpt-5.6-terra'
  },
  gemini: {
    label: 'Google Gemini',
    lastVerified: '2026-08-22',
    source: 'https://ai.google.dev/gemini-api/docs/pricing',
    models: [
      { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro (flagship reasoning)' },
      { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash (fast, newest)' },
      { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (cost-sensitive)' }
    ],
    defaultModel: 'gemini-3.7-flash'
  },
  anthropic: {
    label: 'Anthropic Claude',
    lastVerified: '2026-08-22',
    source: 'Anthropic model lineup (current generation)',
    models: [
      { id: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
      { id: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' }
    ],
    defaultModel: 'claude-sonnet-5'
  },
  xai: {
    label: 'xAI Grok',
    lastVerified: '2026-08-22',
    source: 'https://docs.x.ai',
    models: [
      { id: 'grok-4.6', label: 'Grok 4.6 (flagship)' }
    ],
    defaultModel: 'grok-4.6'
  },
  deepseek: {
    label: 'DeepSeek',
    lastVerified: '2026-08-22',
    source: 'https://api-docs.deepseek.com',
    models: [
      { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
      { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' }
    ],
    defaultModel: 'deepseek-v4-flash'
  },
  openrouter: {
    label: 'OpenRouter',
    lastVerified: '2026-08-22',
    source: 'https://openrouter.ai/docs',
    // OpenRouter model IDs are namespaced "provider/model" — these are
    // illustrative examples; OpenRouter's own /models endpoint is the
    // authoritative live list and could be fetched at runtime instead.
    models: [
      { id: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5 (via OpenRouter)' },
      { id: 'openai/gpt-5.6-terra', label: 'GPT-5.6 Terra (via OpenRouter)' },
      { id: 'google/gemini-3.7-flash', label: 'Gemini 3.7 Flash (via OpenRouter)' }
    ],
    defaultModel: 'anthropic/claude-sonnet-5'
  }
};

if (typeof window !== 'undefined') {
  window.MobileBuzz = window.MobileBuzz || {};
  window.MobileBuzz.modelRegistry = MODEL_REGISTRY;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODEL_REGISTRY;
}
