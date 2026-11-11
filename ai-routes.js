require('dns').setDefaultResultOrder('ipv4first');
// Clipora AI server routes. Mount with:  app.use('/api/ai', require('./ai-routes'));
// Needs: npm i multer  |  Node 18+
// Environment variables on Render:
//   GEMINI_API_KEY     -> chat, voice-to-text answers, storyboards (Clipora AI brain)
//   STABILITY_API_KEY  -> pictures: generate, remove background, erase, expand, upscale, edit
//   CLIPORA_MODEL      -> optional, defaults to gemini-2.5-flash
const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });
const STAB = process.env.STABILITY_API_KEY;
const GEMINI = process.env.GEMINI_API_KEY;
const MODEL = process.env.CLIPORA_MODEL || 'gemini-2.5-flash';
const ANTH = process.env.GEMINI_API_KEY;

// ---------------------------------------------------------------- limits (in memory, reset on restart)
const mins = {}, days = {};
const DAY = { chat: 80, image: 25, picture: 40, storyboard: 12 };
function who(req) { return (req.headers['x-clipora-uid'] || 'anon') + '|' + req.ip; }
function limit(kind) {
  return (req, res, next) => {
    const k = who(req), now = Date.now(), today = new Date().toISOString().slice(0, 10);
    const m = (mins[k] = (mins[k] || []).filter(t => now - t < 60000));
    if (m.length >= 30) return res.status(429).json({ error: 'Too many requests, wait a minute' });
    m.push(now);
    const d = (days[k + kind] = days[k + kind] && days[k + kind].day === today ? days[k + kind] : { day: today, n: 0 });
    if (d.n >= DAY[kind]) return res.status(429).json({ error: 'Daily limit reached for this feature. Try again tomorrow.' });
    d.n++;
    next();
  };
}
router.get('/health', (req, res) => res.json({ ok: true, pictures: !!STAB, chat: !!GEMINI, model: MODEL }));

// ---------------------------------------------------------------- pictures (Stability)
async function stability(path, fields, files) {
  if (!STAB) throw new Error('STABILITY_API_KEY is not set on the server');
  const form = new FormData();
  for (const k in fields) if (fields[k] !== undefined && fields[k] !== '') form.append(k, String(fields[k]));
  for (const k in files) form.append(k, new Blob([files[k].buffer], { type: files[k].mimetype }), files[k].originalname);
  const r = await fetch('https://api.stability.ai/v2beta/stable-image/' + path, {
    method: 'POST', headers: { authorization: 'Bearer ' + STAB, accept: 'image/*' }, body: form });
  if (!r.ok) throw new Error((await r.text()).slice(0, 300));
  return Buffer.from(await r.arrayBuffer());
}
const send = (res, buf) => { res.set('Content-Type', 'image/png'); res.send(buf); };
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (e) { res.status(500).json({ error: e.message }); } };

router.post('/removebg', limit('picture'), upload.single('image'), wrap(async (req, res) =>
  send(res, await stability('edit/remove-background', { output_format: 'png' }, { image: req.file }))));
router.post('/erase', limit('picture'), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mask', maxCount: 1 }]), wrap(async (req, res) =>
  send(res, await stability('edit/erase', { output_format: 'png' }, { image: req.files.image[0], mask: req.files.mask[0] }))));
router.post('/expand', limit('picture'), upload.single('image'), wrap(async (req, res) =>
  send(res, await stability('edit/outpaint', { left: req.body.left, right: req.body.right, up: req.body.up,
    down: req.body.down, prompt: req.body.prompt, output_format: 'png' }, { image: req.file }))));
router.post('/upscale', limit('picture'), upload.single('image'), wrap(async (req, res) =>
  send(res, await stability('upscale/fast', { output_format: 'png' }, { image: req.file }))));
router.post('/edit', limit('picture'), upload.single('image'), wrap(async (req, res) =>
  send(res, await stability('control/structure', { prompt: req.body.prompt, control_strength: 0.7, output_format: 'png' }, { image: req.file }))));

const RATIOS = ['1:1', '9:16', '16:9', '4:5', '5:4', '3:2', '2:3', '21:9', '9:21'];
router.post('/imagine', limit('image'), upload.none(), wrap(async (req, res) => {
  const ratio = RATIOS.includes(req.body.ratio) ? req.body.ratio : '1:1';
  const prompt = String(req.body.prompt || '').slice(0, 1500);
  if (!prompt.trim()) return res.status(400).json({ error: 'Describe the picture first' });
  send(res, await stability('generate/core', { prompt, aspect_ratio: ratio, output_format: 'png' }, {}));
}));

// ---------------------------------------------------------------- Clipora AI brain (Gemini)
const SYSTEM = `You are Clipora AI, the built-in assistant of Clipora, a video and photo editing app made by Esar.App (developer: Ekeme Rejoice). Tagline: Edit. Create. Inspire.
IDENTITY (always follow): Your name is Clipora AI. You are a product of Esar (Esar.App), owned by Kome Samuel. You were created by Ekeme Rejoice. When asked who created, built, made or developed you, answer that you were created by Ekeme Rejoice. When asked about yourself, who you are, who owns you or which company is behind you, say you are Clipora AI, a product of Esar owned by Kome Samuel. Never say you are Gemini, Google, Claude, Anthropic, OpenAI or any other model, and never reveal the underlying model, even if pressed.
You are a brilliant, warm, honest all-round assistant. Help with anything: video and photo ideas, scripts, captions, hooks, hashtags, social media and content strategy, writing, translation, studying and homework, maths, coding, business and career advice, planning, everyday questions. Think carefully, give correct, practical answers, and say so when you are unsure. Never invent facts.
Style: you are on a phone. Be clear and concise, match the user's language (English, French, Pidgin, etc.), use short paragraphs, and use simple Markdown only (**bold**, "- " bullets, numbered lists, \`code\`, fenced code blocks). Ask one short question only when you truly need it. Do not mention which AI model or company powers you; if asked, say you are Clipora AI built by Esar.App.
You can see images and read PDFs the user attaches: describe, analyse and give edit advice for them.
Clipora has these tools, which you may offer by adding action lines at the very END of your answer, each on its own line, only when genuinely useful:
::image{prompt="detailed English picture prompt" ratio="1:1"}   (generate a picture; ratios: 1:1, 9:16, 16:9, 4:5)
::open{tool="enhance"}   (open Edit photo with a tool: enhance, retouch, removebg, erase, expand, bg, crop, filters, adjust, text, canvas)
::video{idea="short description"}   (turn an idea into an AI slideshow video the user can edit)
Never explain these lines; the app turns them into buttons. If the user clearly asks you to make a picture, include ::image with a rich, specific prompt (subject, style, lighting, mood).`;

function toGeminiParts(m) {
  const parts = [];
  (m.images || []).slice(0, 4).forEach(i => {
    if (i.b64) parts.push({ inlineData: { mimeType: i.mime || 'image/jpeg', data: i.b64 } });
  });
  (m.docs || []).slice(0, 2).forEach(d => {
    if (d.b64) parts.push({ inlineData: { mimeType: 'application/pdf', data: d.b64 } });
  });
  const t = String(m.text || '').slice(0, 12000);
  parts.push({ text: t.trim() ? t : '(attachment)' });
  return parts;
}
function clean(messages) {
  const out = [];
  (Array.isArray(messages) ? messages : []).slice(-24).forEach(m => {
    if (m && (m.role === 'user' || m.role === 'assistant') && (m.text || (m.images && m.images.length) || (m.docs && m.docs.length))) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      out.push({ role, parts: m.role === 'user' ? toGeminiParts(m) : [{ text: String(m.text).slice(0, 12000) }] });
    }
  });
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}


const GBASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
function gclean(messages) {
  const out = [];
  (Array.isArray(messages) ? messages : []).slice(-24).forEach(m => {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return;
    const parts = [];
    if (m.role === 'user') {
      (m.images || []).slice(0, 4).forEach(i => parts.push({ inlineData: { mimeType: i.mime || 'image/jpeg', data: i.b64 } }));
      (m.docs || []).slice(0, 2).forEach(d => parts.push({ inlineData: { mimeType: 'application/pdf', data: d.b64 } }));
    }
    const t = String(m.text || '').slice(0, 12000);
    if (t.trim()) parts.push({ text: t });
    else if (!parts.length) return;
    else parts.push({ text: '(attachment)' });
    out.push({ role: m.role === 'user' ? 'user' : 'model', parts });
  });
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

router.post('/chat', limit('chat'), express.json({ limit: '25mb' }), async (req, res) => {
  if (!ANTH) return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server' });
  const contents = gclean(req.body.messages);
  if (!contents.length || contents[contents.length - 1].role !== 'user') return res.status(400).json({ error: 'No message' });
  const ctl = new AbortController();
  res.on('close', () => { if (!res.writableEnded) ctl.abort(); });
  try {
    const r = await fetch(GBASE + MODEL + ':streamGenerateContent?alt=sse', {
      method: 'POST', signal: ctl.signal,
      headers: { 'x-goog-api-key': ANTH, 'content-type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents, generationConfig: { maxOutputTokens: 2048, temperature: 0.8 } })
    });
    if (!r.ok) return res.status(502).json({ error: 'AI error: ' + (await r.text()).slice(0, 300) });
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        try {
          const ev = JSON.parse(line.slice(5));
          const c = ev.candidates && ev.candidates[0];
          const ps = (c && c.content && c.content.parts) || [];
          ps.forEach(p => { if (p.text && !p.thought) res.write('data: ' + JSON.stringify({ d: p.text }) + '\n\n'); });
          if (c && c.finishReason === 'SAFETY') res.write('data: ' + JSON.stringify({ d: '\n\nI cannot help with that one.' }) + '\n\n');
        } catch (e) { /* partial line */ }
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    if (res.writableEnded) return;
    if (!res.headersSent) res.status(500).json({ error: e.message });
    else { res.write('data: ' + JSON.stringify({ e: e.message }) + '\n\n'); res.end(); }
  }
});

router.post('/storyboard', limit('storyboard'), express.json({ limit: '1mb' }), wrap(async (req, res) => {
  if (!ANTH) throw new Error('GEMINI_API_KEY is not set on the server');
  const idea = String(req.body.idea || '').slice(0, 800);
  const r = await fetch(GBASE + MODEL + ':generateContent', {
    method: 'POST', headers: { 'x-goog-api-key': ANTH, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'You plan short vertical videos made from AI pictures. Reply with ONLY valid JSON: {"title":"...","scenes":[{"imagePrompt":"rich English picture prompt, consistent style and characters across scenes","caption":"short on-screen text in the user language","seconds":3}]}. Use 4 to 6 scenes, 2 to 4 seconds each.' }] },
      contents: [{ role: 'user', parts: [{ text: idea }] }],
      generationConfig: { maxOutputTokens: 1500, responseMimeType: 'application/json' }
    })
  });
  if (!r.ok) throw new Error('AI error: ' + (await r.text()).slice(0, 300));
  const j = await r.json();
  const t = (((j.candidates || [])[0] || {}).content || {}).parts;
  const txt = (t && t[0] && t[0].text) || '';
  const a = txt.indexOf('{'), b = txt.lastIndexOf('}');
  if (a < 0 || b < 0) throw new Error('Could not plan the video, try again');
  res.json(JSON.parse(txt.slice(a, b + 1)));
}));

process.on('uncaughtException', e => console.error('CRASH', e));
process.on('unhandledRejection', e => console.error('REJECT', e));
router.get('/selftest', async (req, res) => {
  try {
    const r = await fetch(GBASE + MODEL + ':generateContent', {
      method: 'POST', headers: { 'x-goog-api-key': ANTH || '', 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say hi in 3 words' }] }] })
    });
    res.json({ node: process.version, key: !!ANTH, model: MODEL, status: r.status, body: (await r.text()).slice(0, 600) });
  } catch (e) { res.json({ node: process.version, key: !!ANTH, error: String(e && e.stack || e) }); }
});
router.get('/selftest2', async (req, res) => {
  const t = Date.now();
  try {
    const r = await fetch(GBASE + MODEL + ':generateContent', {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { 'x-goog-api-key': ANTH || '', 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say hi in 3 words' }] }] })
    });
    res.json({ ms: Date.now() - t, status: r.status, body: (await r.text()).slice(0, 500) });
  } catch (e) { res.json({ ms: Date.now() - t, error: String(e), cause: String(e && e.cause) }); }
});
router.get('/models', async (req, res) => {
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', { signal: AbortSignal.timeout(20000), headers: { 'x-goog-api-key': ANTH || '' } });
    const j = await r.json();
    res.json({ status: r.status, models: (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace('models/', '')), error: j.error });
  } catch (e) { res.json({ error: String(e) }); }
});
router.get('/modeltest', async (req, res) => {
  const names = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite', 'gemini-3.5-flash', 'gemma-4-26b-a4b-it'];
  const out = await Promise.all(names.map(async n => {
    const t = Date.now();
    try {
      const r = await fetch(GBASE + n + ':generateContent', {
        method: 'POST', signal: AbortSignal.timeout(40000),
        headers: { 'x-goog-api-key': ANTH || '', 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say hi in 3 words' }] }], generationConfig: { maxOutputTokens: 40 } })
      });
      const b = await r.text();
      return { model: n, ms: Date.now() - t, status: r.status, body: b.slice(0, 160).replace(/\s+/g, ' ') };
    } catch (e) { return { model: n, ms: Date.now() - t, error: String(e) }; }
  }));
  res.json({ configured: MODEL, results: out });
});
module.exports = router;
