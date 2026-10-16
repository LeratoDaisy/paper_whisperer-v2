// POST /api/explain
// Body: { language, today, text?, images?: [{ mediaType, data }] }   (a single `image` is still accepted)
// Returns: { result }  (a normalised explanation object)

const W = require('../shared/whisper.js');
const { callClaude, rateLimited, send } = require('./_anthropic.js');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_PAGES = 4;
const MAX_TOTAL_BASE64 = 4200000;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req)) return send(res, 429, { error: 'rate_limited' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const language = String(body.language || 'English').slice(0, 30);
  const today = String(body.today || '').slice(0, 60);
  const text = String(body.text || '').slice(0, 12000);
  // One or more pages of the same letter (up to 4).
  let images = Array.isArray(body.images) ? body.images : body.image ? [body.image] : [];
  images = images.filter((i) => i && typeof i === 'object').slice(0, MAX_PAGES);

  if (!images.length && text.trim().length < 20) return send(res, 400, { error: 'no_document' });
  let total = 0;
  for (const image of images) {
    if (!ALLOWED_IMAGE_TYPES.includes(image.mediaType)) return send(res, 400, { error: 'bad_image_type' });
    if (typeof image.data !== 'string') return send(res, 400, { error: 'bad_image_type' });
    total += image.data.length;
  }
  // Vercel rejects request bodies over 4.5 MB, and base64 is about 4/3 of the bytes.
  if (total > MAX_TOTAL_BASE64) return send(res, 413, { error: 'image_too_large' });

  const prompt = W.buildExplainPrompt({ language, today, hasImage: images.length > 0, pages: images.length, text });
  const content = images.length
    ? images
        .map((image) => ({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } }))
        .concat([{ type: 'text', text: prompt }])
    : prompt;

  try {
    const reply = await callClaude({ content, maxTokens: 2200 });
    const result = W.normalizeResult(W.extractJSON(reply));
    return send(res, 200, { result });
  } catch (err) {
    const status = err.status || (err.message === 'invalid_json' || err.message === 'invalid_result' ? 502 : 500);
    return send(res, status, { error: 'explain_failed' });
  }
};

function safeParse(s) {
  try { return JSON.parse(s); } catch (e) { return {}; }
}
