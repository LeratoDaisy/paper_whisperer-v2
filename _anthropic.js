// Small helper that calls the Anthropic Messages API.
// Files that start with an underscore are not exposed as routes by Vercel.

const API_URL = 'https://api.anthropic.com/v1/messages';

// Very small in-memory limiter: 20 requests per IP per 10 minutes per server instance.
// For real traffic, swap this for Vercel KV / Upstash Redis.
const hits = new Map();
function rateLimited(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > 20;
}

async function callClaude({ content, maxTokens }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error('Missing ANTHROPIC_API_KEY');
    err.status = 500;
    throw err;
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: maxTokens || 1800,
      messages: [{ role: 'user', content }]
    })
  });
  if (!res.ok) {
    const err = new Error('Upstream error ' + res.status);
    err.status = res.status === 429 ? 429 : 502;
    throw err;
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

function send(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store');
  res.json(body);
}

module.exports = { callClaude, rateLimited, send };
