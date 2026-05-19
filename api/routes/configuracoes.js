const router = require('express').Router();
const sb     = require('../services/supabase');
const auth   = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await sb.from('configuracoes_site').select('*');
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/carrossel', async (_req, res) => {
  try {
    const { data, error } = await sb.from('configuracoes_carrossel').select('*').single();
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:chave', async (req, res) => {
  try {
    const { data, error } = await sb.from('configuracoes_site')
      .select('*').eq('chave', req.params.chave).single();
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(404).json({ message: 'Config não encontrada' }); }
});

router.put('/carrossel', auth, async (req, res) => {
  try {
    const { data, error } = await sb.from('configuracoes_carrossel')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', (await sb.from('configuracoes_carrossel').select('id').single()).data?.id)
      .select().single();
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:chave', auth, async (req, res) => {
  try {
    const { valor } = req.body;
    const { data, error } = await sb.from('configuracoes_site')
      .upsert({ chave: req.params.chave, valor: typeof valor === 'object' ? JSON.stringify(valor) : valor, updated_at: new Date().toISOString() }, { onConflict: 'chave' })
      .select().single();
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
