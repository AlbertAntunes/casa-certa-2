/* ── EQUIPE ── */
const router = require('express').Router();
const sb     = require('../services/supabase');
const auth   = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await sb.from('equipe').select('*').order('ordem');
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await sb.from('equipe').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(404).json({ message: 'Corretor não encontrado' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { data, error } = await sb.from('equipe').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await sb.from('equipe').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await sb.from('equipe').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Corretor removido' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
