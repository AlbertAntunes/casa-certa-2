const router = require('express').Router();
const sb     = require('../services/supabase');
const auth   = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await sb.from('midias_home').select('*').order('ordem');
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { data, error } = await sb.from('midias_home').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await sb.from('midias_home').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await sb.from('midias_home').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Mídia removida' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
