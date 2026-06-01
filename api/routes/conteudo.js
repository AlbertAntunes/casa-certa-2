const router = require('express').Router();
const sb     = require('../services/supabase');
const auth   = require('../middleware/auth');

/* ── DEPOIMENTOS ── */
router.get('/depoimentos', async (_req, res) => {
  const { data, error } = await sb.from('depoimentos').select('*').order('ordem');
  if (error) return res.status(500).json({ message: error.message });
  res.json({ data });
});
router.post('/depoimentos', auth, async (req, res) => {
  const { data, error } = await sb.from('depoimentos').insert(req.body).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ data });
});
router.put('/depoimentos/:id', auth, async (req, res) => {
  const { data, error } = await sb.from('depoimentos').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json({ data });
});
router.delete('/depoimentos/:id', auth, async (req, res) => {
  const { error } = await sb.from('depoimentos').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Removido' });
});

/* ── FAQ ── */
router.get('/faq', async (_req, res) => {
  const { data, error } = await sb.from('faq').select('*').order('ordem');
  if (error) return res.status(500).json({ message: error.message });
  res.json({ data });
});
router.post('/faq', auth, async (req, res) => {
  const { data, error } = await sb.from('faq').insert(req.body).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ data });
});
router.put('/faq/:id', auth, async (req, res) => {
  const { data, error } = await sb.from('faq').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json({ data });
});
router.delete('/faq/:id', auth, async (req, res) => {
  const { error } = await sb.from('faq').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Removido' });
});

/* ── BANNERS /  ── */
router.get('/banners', async (_req, res) => {
  const { data, error } = await sb.from('banners').select('*').order('ordem');
  if (error) return res.status(500).json({ message: error.message });
  res.json({ data });
});
router.post('/banners', auth, async (req, res) => {
  const { data, error } = await sb.from('banners').insert(req.body).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ data });
});
router.put('/banners/:id', auth, async (req, res) => {
  const { data, error } = await sb.from('banners').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json({ data });
});
router.delete('/banners/:id', auth, async (req, res) => {
  const { error } = await sb.from('banners').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Removido' });
});

/* ── SEO ── */
router.get('/seo/:pagina', async (req, res) => {
  const { data, error } = await sb.from('seo_paginas').select('*').eq('pagina', req.params.pagina).single();
  if (error) return res.status(404).json({ message: 'Página não encontrada' });
  res.json({ data });
});
router.put('/seo/:pagina', auth, async (req, res) => {
  const { data, error } = await sb.from('seo_paginas')
    .upsert({ pagina: req.params.pagina, ...req.body, updated_at: new Date().toISOString() }, { onConflict: 'pagina' })
    .select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json({ data });
});

/* ── CONTATOS / LEADS ── */
router.post('/contatos', async (req, res) => {
  const { data, error } = await sb.from('contatos').insert(req.body).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ data });
});
router.get('/contatos', auth, async (_req, res) => {
  const { data, error } = await sb.from('contatos').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json({ data });
});
router.delete('/contatos/:id', auth, async (req, res) => {
  const { error } = await sb.from('contatos').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Removido' });
});

module.exports = router;
