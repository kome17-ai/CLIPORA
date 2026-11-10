// Clipora AI routes. In your Render Express app:
//   npm i multer
//   const ai = require('./ai-routes'); app.use('/api/ai', ai);
// Set env var STABILITY_API_KEY on Render. Needs Node 18+.
const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });
const KEY = process.env.STABILITY_API_KEY;
const hits = {};

router.use((req, res, next) => {
  const k = (req.headers['x-clipora-uid'] || req.ip) + '';
  const now = Date.now();
  hits[k] = (hits[k] || []).filter(t => now - t < 60000);
  if (hits[k].length >= 8) return res.status(429).json({ error: 'Too many AI requests, wait a minute' });
  hits[k].push(now);
  next();
});

router.get('/health', (req, res) => res.json({ ok: true, keySet: !!KEY }));

async function stability(path, fields, files) {
  if (!KEY) throw new Error('STABILITY_API_KEY is not set on the server');
  const form = new FormData();
  for (const k in fields) if (fields[k] !== undefined && fields[k] !== '') form.append(k, String(fields[k]));
  for (const k in files) form.append(k, new Blob([files[k].buffer], { type: files[k].mimetype }), files[k].originalname);
  const r = await fetch('https://api.stability.ai/v2beta/stable-image/' + path, {
    method: 'POST', headers: { authorization: 'Bearer ' + KEY, accept: 'image/*' }, body: form });
  if (!r.ok) throw new Error((await r.text()).slice(0, 300));
  return Buffer.from(await r.arrayBuffer());
}
const send = (res, buf) => { res.set('Content-Type', 'image/png'); res.send(buf); };
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (e) { res.status(500).json({ error: e.message }); } };

router.post('/removebg', upload.single('image'), wrap(async (req, res) =>
  send(res, await stability('edit/remove-background', { output_format: 'png' }, { image: req.file }))));

router.post('/erase', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mask', maxCount: 1 }]), wrap(async (req, res) =>
  send(res, await stability('edit/erase', { output_format: 'png' }, { image: req.files.image[0], mask: req.files.mask[0] }))));

router.post('/expand', upload.single('image'), wrap(async (req, res) =>
  send(res, await stability('edit/outpaint', { left: req.body.left, right: req.body.right, up: req.body.up,
    down: req.body.down, prompt: req.body.prompt, output_format: 'png' }, { image: req.file }))));

router.post('/upscale', upload.single('image'), wrap(async (req, res) =>
  send(res, await stability('upscale/fast', { output_format: 'png' }, { image: req.file }))));

router.post('/edit', upload.single('image'), wrap(async (req, res) =>
  send(res, await stability('control/structure', { prompt: req.body.prompt, control_strength: 0.7,
    output_format: 'png' }, { image: req.file }))));

module.exports = router;
