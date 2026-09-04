/**
 * MobileBuzz — OpenAI provider adapter (Phase 10)
 * Uses the Responses API (POST /v1/responses) — OpenAI's current recommended
 * interface. Chat Completions (/v1/chat/completions) remains available and
 * could be swapped in here if a project prefers the legacy shape.
 * Verified against OpenAI API reference, 2026-08-22.
 */
async function send({ model, messages, temperature, maxTokens, apiKey }) {
  var systemMsg = messages.find(function (m) { return m.role === 'system'; });
  var turns = messages.filter(function (m) { return m.role !== 'system'; });

  var res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      input: turns.map(function (m) { return { role: m.role, content: m.content }; }),
      instructions: systemMsg ? systemMsg.content : undefined,
      max_output_tokens: maxTokens || 1024,
      temperature: temperature != null ? temperature : 0.7
    })
  });

  if (!res.ok) {
    var errBody = await res.text();
    throw new Error('OpenAI API error ' + res.status + ': ' + errBody.slice(0, 300));
  }
  var data = await res.json();

  var textOut = '';
  (data.output || []).forEach(function (item) {
    if (item.type === 'message') {
      (item.content || []).forEach(function (c) {
        if (c.type === 'output_text') textOut += c.text;
      });
    }
  });

  return {
    content: textOut,
    usage: {
      inputTokens: data.usage ? data.usage.input_tokens : null,
      outputTokens: data.usage ? data.usage.output_tokens : null
    }
  };
}

module.exports = { send: send };
