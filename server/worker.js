/**
 * TECHNOMANCERS — AI characters proxy (Cloudflare Worker).
 * Keeps your Anthropic API key secret; the game sends the NPC's role + chat,
 * this calls Claude and returns {text}.
 *
 * Deploy:
 *   npm i -g wrangler && wrangler login
 *   cd server && wrangler secret put ANTHROPIC_API_KEY
 *   wrangler deploy
 * Then paste the worker URL into js/config.js (aiEndpoint) or the in-game Settings.
 */
const MODEL = 'claude-haiku-5-5';   // fast + cheap; any current Claude model works
export default {
  async fetch(req, env) {
    const origin = req.headers.get('origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
    const ok = allowed.includes('*') || allowed.includes(origin);
    const cors = { 'access-control-allow-origin': ok ? (origin || '*') : 'null', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST' || !ok) return new Response('no', { status: 403, headers: cors });
    let body; try { body = await req.json(); } catch (e) { return new Response('bad json', { status: 400, headers: cors }); }
    const system = String(body.system || '').slice(0, 6000);
    const messages = (Array.isArray(body.messages) ? body.messages : []).slice(-10)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 500) }))
      .filter((m) => m.content);
    if (!messages.length || messages[0].role !== 'user') return new Response('bad chat', { status: 400, headers: cors });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.MODEL || MODEL, max_tokens: 220, system, messages }),
    });
    if (!r.ok) return new Response(JSON.stringify({ text: '' }), { status: 502, headers: { ...cors, 'content-type': 'application/json' } });
    const j = await r.json();
    const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    return new Response(JSON.stringify({ text }), { headers: { ...cors, 'content-type': 'application/json' } });
  },
};
