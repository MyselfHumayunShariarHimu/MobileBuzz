/**
 * MobileBuzz — Google Gemini provider adapter (Phase 11)
 * Uses generateContent: POST /v1beta/models/{model}:generateContent
 * Verified against ai.google.dev/gemini-api docs, 2026-08-22.
 */
async function send({ model, messages, temperature, maxTokens, apiKey }) {
  var systemMsg = messages.find(function (m) { return m.role === 'system'; });
  var turns = messages.filter(function (m) { return m.role !== 'system'; });

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
  var res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: turns.map(function (m) {
        return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
      }),
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      generationConfig: {
        maxOutputTokens: maxTokens || 1024,
        temperature: temperature != null ? temperature : 0.7
      }
    })
  });

  if (!res.ok) {
    var errBody = await res.text();
    throw new Error('Gemini API error ' + res.status + ': ' + errBody.slice(0, 300));
  }
  var data = await res.json();

  var candidate = (data.candidates || [])[0];
  var textOut = candidate ? (candidate.content.parts || []).map(function (p) { return p.text || ''; }).join('') : '';

  return {
    content: textOut,
    usage: {
      inputTokens: data.usageMetadata ? data.usageMetadata.promptTokenCount : null,
      outputTokens: data.usageMetadata ? data.usageMetadata.candidatesTokenCount : null
    }
  };
}

module.exports = { send: send };
