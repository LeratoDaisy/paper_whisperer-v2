// POST /api/ask
// Body: { language, result, question, text?, history? }
// Returns: { answer }

const W = require('../shared/whisper.js');
const { callClaude, rateLimited, send } = require('./_anthropic.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req)) return send(res, 429, { error: 'rate_limited' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const question = String(body.question || '').trim().slice(0, 600);
  if (!question) return send(res, 400, { error: 'no_question' });

  let result;
  try {
    result = W.normalizeResult(body.result);
  } catch (e) {
    return send(res, 400, { error: 'bad_result' });
  }

  const history = Array.isArray(body.history)
    ? body.history.slice(-6).map((t) => ({ q: String(t.q || '').slice(0, 600), a: String(t.a || '').slice(0, 1200) }))
    : [];

  const prompt = W.buildAskPrompt({
    language: String(body.language || 'English').slice(0, 30),
    result,
    question,
    text: String(body.text || '').slice(0, 8000),
    history
  });

  try {
    const answer = await callClaude({ content: prompt, maxTokens: 500 });
    return send(res, 200, { answer: answer.trim() });
  } catch (err) {
    return send(res, err.status || 500, { error: 'ask_failed' });
  }
};

function safeParse(s) {
  try { return JSON.parse(s); } catch (e) { return {}; }
}
