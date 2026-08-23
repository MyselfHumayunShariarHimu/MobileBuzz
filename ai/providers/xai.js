/**
 * MobileBuzz — xAI Grok provider adapter (Phase 13)
 * Uses xAI's Responses endpoint (POST /v1/responses) — their current
 * preferred interface, structurally similar to OpenAI's Responses API.
 * xAI also offers an OpenAI-compatible /v1/chat/completions if a project
 * prefers that shape instead. Verified against docs.x.ai, 2026-08-22.
 */
async function send({ model, messages, temperature, maxTokens, apiKey }) {
  var systemMsg = messages.find(function (m) { return m.role === 'system'; });
  var turns = messages.filter(function (m) { return m.role !== 'system'; });

  var res = await fetch('https://api.x.ai/v1/responses', {
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
    throw new Error('xAI API error ' + res.status + ': ' + errBody.slice(0, 300));
  }
  var data = await res.json();

  // xAI's Responses API mirrors OpenAI's shape closely, including an
  // output_text convenience field on some SDKs; fall back to walking
  // output[] the same way as the OpenAI adapter if output_text is absent.
  var textOut = data.output_text || '';
  if (!textOut && data.output) {
    (data.output || []).forEach(function (item) {
      if (item.type === 'message') {
        (item.content || []).forEach(function (c) { if (c.type === 'output_text') textOut += c.text; });
      }
    });
  }

  return {
    content: textOut,
    usage: {
      inputTokens: data.usage ? (data.usage.input_tokens || data.usage.prompt_tokens) : null,
      outputTokens: data.usage ? (data.usage.output_tokens || data.usage.completion_tokens) : null
    }
  };
}

module.exports = { send: send };
