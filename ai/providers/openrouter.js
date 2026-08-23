/**
 * MobileBuzz — OpenRouter provider adapter (Phase 15)
 * OpenAI-compatible Chat Completions shape: POST /api/v1/chat/completions
 * Model IDs are namespaced "provider/model" (e.g. "anthropic/claude-sonnet-5").
 * HTTP-Referer / X-Title headers are optional but let OpenRouter attribute
 * traffic to this app on their dashboard. Verified against openrouter.ai/docs, 2026-08-22.
 */
async function send({ model, messages, temperature, maxTokens, apiKey }) {
  var res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mobilebuzz.app',
      'X-Title': 'MobileBuzz'
    },
    body: JSON.stringify({
      model: model,
      messages: messages.map(function (m) { return { role: m.role, content: m.content }; }),
      max_tokens: maxTokens || 1024,
      temperature: temperature != null ? temperature : 0.7
    })
  });

  if (!res.ok) {
    var errBody = await res.text();
    throw new Error('OpenRouter API error ' + res.status + ': ' + errBody.slice(0, 300));
  }
  var data = await res.json();
  var choice = (data.choices || [])[0];

  return {
    content: choice ? choice.message.content : '',
    usage: {
      inputTokens: data.usage ? data.usage.prompt_tokens : null,
      outputTokens: data.usage ? data.usage.completion_tokens : null
    }
  };
}

module.exports = { send: send };
