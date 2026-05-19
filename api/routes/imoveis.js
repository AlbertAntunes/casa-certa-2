const router = require('express').Router();
const sb     = require('../services/supabase');
const auth   = require('../middleware/auth');

const FIELDS = `id,titulo,descricao,preco,preco_periodo,cidade,bairro,tipo,status,
  quartos,banheiros,vagas,metragem,destaque,slug,emoji,cor_card,capa_url,created_at,updated_at,
  imagens_imoveis(id,url,ordem,is_capa)`;

/* GET /api/imoveis */
router.get('/', async (req, res) => {
  try {
    let q = sb.from('imoveis').select(FIELDS, { count: 'exact' });
    const { tipo, status, destaque, limit = 50, offset = 0, order = 'created_at.desc' } = req.query;
    if (tipo)     q = q.eq('tipo', tipo);
    if (status)   q = q.eq('status', status);
    if (destaque) q = q.eq('destaque', destaque === 'true');
    const [col, dir] = order.split('.');
    q = q.order(col || 'created_at', { ascending: dir === 'asc' });
    q = q.range(Number(offset), Number(offset) + Number(limit) - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    res.json({ data, total: count });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* GET /api/imoveis/:id */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await sb.from('imoveis').select(FIELDS).eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ data });
  } catch (e) { res.status(404).json({ message: 'Imóvel não encontrado' }); }
});

/* POST /api/imoveis */
router.post('/', auth, async (req, res) => {
  try {
    const { fotos, ...payload } = req.body;
    const fotosUrls = Array.isArray(fotos)
      ? fotos.map(f => (typeof f === 'string' ? f : f?.url)).filter(Boolean)
      : [];
    if (!payload.slug) payload.slug = slugify(payload.titulo);
    const { data: im, error } = await sb.from('imoveis').insert(payload).select().single();
    if (error) throw error;
    if (fotosUrls.length) {
      const imgs = fotosUrls.map((url, i) => ({ imovel_id: im.id, url, ordem: i, is_capa: i === 0 }));
      await sb.from('imagens_imoveis').insert(imgs);
      await sb.from('imoveis').update({ capa_url: fotosUrls[0] }).eq('id', im.id);
    }
    res.status(201).json({ data: im });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* PUT /api/imoveis/:id */
router.put('/:id', auth, async (req, res) => {
  try {
    const { fotos, ...payload } = req.body;
    const fotosUrls = Array.isArray(fotos)
      ? fotos.map(f => (typeof f === 'string' ? f : f?.url)).filter(Boolean)
      : [];
    payload.updated_at = new Date().toISOString();
    const { data, error } = await sb.from('imoveis').update(payload).eq('id', req.params.id).select().single();
    if (error) throw error;
    if (fotosUrls.length) {
      await sb.from('imagens_imoveis').delete().eq('imovel_id', req.params.id);
      const imgs = fotosUrls.map((url, i) => ({ imovel_id: req.params.id, url, ordem: i, is_capa: i === 0 }));
      await sb.from('imagens_imoveis').insert(imgs);
      await sb.from('imoveis').update({ capa_url: fotosUrls[0] }).eq('id', req.params.id);
    }
    res.json({ data });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* DELETE /api/imoveis/:id */
router.delete('/:id', auth, async (req, res) => {
  try {
    await sb.from('imagens_imoveis').delete().eq('imovel_id', req.params.id);
    const { error } = await sb.from('imoveis').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Imóvel excluído' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

function slugify(str = '') {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
}

module.exports = router;
