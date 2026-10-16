// POST /api/draft
// Body: { language, goal, result, text? }
// Returns: { draft }  (plain text, first line is "Subject: ...")

const W = require('../shared/whisper.js');
const { callClaude, rateLimited, send } = require('./_anthropic.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req)) return send(res, 429, { error: 'rate_limited' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};

  let result;
  try {
    result = W.normalizeResult(body.result);
  } catch (e) {
    return send(res, 400, { error: 'bad_result' });
  }
  // Never help someone write back to a likely scammer.
  if (result.scamRisk !== 'low') return send(res, 400, { error: 'not_for_scams' });

  const goal = W.DRAFT_GOALS.some((g) => g.id === body.goal) ? body.goal : 'info';
  const prompt = W.buildDraftPrompt({
    language: String(body.language || 'English').slice(0, 30),
    goal,
    result,
    text: String(body.text || '').slice(0, 8000)
  });

  try {
    const draft = await callClaude({ content: prompt, maxTokens: 600 });
    return send(res, 200, { draft: draft.trim() });
  } catch (err) {
    return send(res, err.status || 500, { error: 'draft_failed' });
  }
};

function safeParse(s) {
  try { return JSON.parse(s); } catch (e) { return {}; }
}
