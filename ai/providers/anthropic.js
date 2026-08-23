/**
 * MobileBuzz — Anthropic Claude provider adapter (Phase 12)
 * Uses the Messages API: POST /v1/messages
 * system prompt is a top-level field, NOT part of the messages array.
 */
async function send({ model, messages, temperature, maxTokens, apiKey }) {
  var systemMsg = messages.find(function (m) { return m.role === 'system'; });
  var turns = messages.filter(function (m) { return m.role !== 'system'; });

  var res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: maxTokens || 1024,
      temperature: temperature != null ? temperature : 0.7,
      system: systemMsg ? systemMsg.content : undefined,
      messages: turns.map(function (m) { return { role: m.role, content: m.content }; })
    })
  });

  if (!res.ok) {
    var errBody = await res.text();
    throw new Error('Anthropic API error ' + res.status + ': ' + errBody.slice(0, 300));
  }
  var data = await res.json();

  var textOut = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');

  return {
    content: textOut,
    usage: {
      inputTokens: data.usage ? data.usage.input_tokens : null,
      outputTokens: data.usage ? data.usage.output_tokens : null
    }
  };
}

module.exports = { send: send };
