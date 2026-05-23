require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const { createClient } = require('@supabase/supabase-js');

/* ══════════════════════════════════════════
   SUPABASE
══════════════════════════════════════════ */
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'casacerta-secret-2025';
const upload     = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/* ══════════════════════════════════════════
   APP
══════════════════════════════════════════ */
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

/* ══════════════════════════════════════════
   MIDDLEWARE DE AUTH
══════════════════════════════════════════ */
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autenticado' });
    try {
        req.user = jwt.verify(auth.slice(7), JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
}

/* ══════════════════════════════════════════
   STATUS
══════════════════════════════════════════ */
app.get('/api/status', (req, res) => res.json({ status: 'ok' }));

/* ══════════════════════════════════════════
   AUTH
══════════════════════════════════════════ */
app.post('/api/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email e senha obrigatórios' });

        const { data: admin, error } = await supabase
            .from('admins').select('*').eq('email', email.toLowerCase()).single();

        if (error || !admin) return res.status(401).json({ message: 'E-mail ou senha incorretos' });

        const ok = await bcrypt.compare(password, admin.password_hash);
        if (!ok) return res.status(401).json({ message: 'E-mail ou senha incorretos' });

        const token = jwt.sign(
            { id: admin.id, email: admin.email, nome: admin.nome, role: admin.role },
            JWT_SECRET, { expiresIn: '7d' }
        );
        res.json({ token, data: { id: admin.id, email: admin.email, nome: admin.nome, role: admin.role } });
    } catch (e) { next(e); }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ data: req.user });
});

/* ══════════════════════════════════════════
   UPLOAD (Supabase Storage)
══════════════════════════════════════════ */
app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res, next) => {
    try {
        const file   = req.file;
        const bucket = req.body.bucket || 'imoveis';
        if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

        const ext      = file.originalname.split('.').pop();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = `${filename}`;

        const { error } = await supabase.storage
            .from(bucket).upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        res.json({ url: publicUrl, path: filePath });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   CONFIGURAÇÕES  (tabela: configuracoes_site)
   GET  /api/configuracoes
   GET  /api/configuracoes/:chave
   PUT  /api/configuracoes/:chave   ← salva do admin
   GET  /api/configuracoes/carrossel
   PUT  /api/configuracoes/carrossel
══════════════════════════════════════════ */
app.get('/api/configuracoes', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('configuracoes_site').select('*');
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.get('/api/configuracoes/carrossel', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('configuracoes_carrossel').select('*').single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json({ data: data || {} });
    } catch (e) { next(e); }
});

app.put('/api/configuracoes/carrossel', authMiddleware, async (req, res, next) => {
    try {
        const { autoplay, intervalo_ms, velocidade_ms } = req.body;
        // upsert: se não existe cria, se existe atualiza
        const { data: existing } = await supabase.from('configuracoes_carrossel').select('id').single();
        let result;
        if (existing) {
            result = await supabase.from('configuracoes_carrossel')
                .update({ autoplay, intervalo_ms, velocidade_ms, updated_at: new Date() })
                .eq('id', existing.id).select().single();
        } else {
            result = await supabase.from('configuracoes_carrossel')
                .insert([{ autoplay, intervalo_ms, velocidade_ms }]).select().single();
        }
        if (result.error) throw result.error;
        res.json({ data: result.data });
    } catch (e) { next(e); }
});

app.get('/api/configuracoes/:chave', async (req, res, next) => {
    try {
        // Versão mais segura:
const { data, error } = await supabase.from('configuracoes').select('*');
const config = data && data.length > 0 ? data[0] : null;
        if (error && error.code !== 'PGRST116') throw error;
        res.json({ data: data || null });
    } catch (e) { next(e); }
});

app.put('/api/configuracoes/:chave', authMiddleware, async (req, res, next) => {
    try {
        const { chave } = req.params;
        const { valor }  = req.body;

        // upsert por chave
        const { data, error } = await supabase
            .from('configuracoes_site')
            .upsert({ chave, valor, updated_at: new Date() }, { onConflict: 'chave' })
            .select().single();
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   IMÓVEIS
══════════════════════════════════════════ */
app.get('/api/imoveis', async (req, res, next) => {
    try {
        const { status, tipo, destaque, limit = 50, offset = 0 } = req.query;
        let query = supabase.from('imoveis')
            .select('*, imagens_imoveis(url, ordem, is_capa)')
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);
        if (status) query = query.eq('status', status);
        if (tipo)   query = query.eq('tipo', tipo);
        if (destaque === 'true') query = query.eq('destaque', true);
        const { data, error } = await query;
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.get('/api/imoveis/:id', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('imoveis')
            .select('*, imagens_imoveis(url, ordem, is_capa)')
            .eq('id', req.params.id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Imóvel não encontrado' });
        res.json({ data });
    } catch (e) { next(e); }
});

app.post('/api/imoveis', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('imoveis')
            .insert([req.body]).select().single();
        if (error) throw error;
        res.status(201).json({ data });
    } catch (e) { next(e); }
});

app.put('/api/imoveis/:id', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('imoveis')
            .update({ ...req.body, updated_at: new Date() })
            .eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.delete('/api/imoveis/:id', authMiddleware, async (req, res, next) => {
    try {
        const { error } = await supabase.from('imoveis').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
});

/* ── Imagens dos Imóveis ── */
app.get('/api/imoveis/:id/imagens', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('imagens_imoveis')
            .select('*').eq('imovel_id', req.params.id).order('ordem');
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.post('/api/imoveis/:id/imagens', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('imagens_imoveis')
            .insert([{ ...req.body, imovel_id: req.params.id }]).select().single();
        if (error) throw error;
        res.status(201).json({ data });
    } catch (e) { next(e); }
});

app.delete('/api/imoveis/:id/imagens/:imgId', authMiddleware, async (req, res, next) => {
    try {
        const { error } = await supabase.from('imagens_imoveis')
            .delete().eq('id', req.params.imgId).eq('imovel_id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   EQUIPE
══════════════════════════════════════════ */
app.get('/api/equipe', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('equipe')
            .select('*').order('ordem');
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.post('/api/equipe', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('equipe')
            .insert([req.body]).select().single();
        if (error) throw error;
        res.status(201).json({ data });
    } catch (e) { next(e); }
});

app.put('/api/equipe/:id', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('equipe')
            .update(req.body).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.delete('/api/equipe/:id', authMiddleware, async (req, res, next) => {
    try {
        const { error } = await supabase.from('equipe').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   MÍDIAS HOME
══════════════════════════════════════════ */
app.get('/api/midias-home', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('midias_home')
            .select('*').eq('ativo', true).order('ordem');
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.post('/api/midias-home', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('midias_home')
            .insert([req.body]).select().single();
        if (error) throw error;
        res.status(201).json({ data });
    } catch (e) { next(e); }
});

app.put('/api/midias-home/:id', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('midias_home')
            .update(req.body).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.delete('/api/midias-home/:id', authMiddleware, async (req, res, next) => {
    try {
        const { error } = await supabase.from('midias_home').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   FAQ
══════════════════════════════════════════ */
app.get('/api/faq', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('faq')
            .select('*').order('ordem');
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.post('/api/faq', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('faq')
            .insert([req.body]).select().single();
        if (error) throw error;
        res.status(201).json({ data });
    } catch (e) { next(e); }
});

app.put('/api/faq/:id', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('faq')
            .update(req.body).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.delete('/api/faq/:id', authMiddleware, async (req, res, next) => {
    try {
        const { error } = await supabase.from('faq').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   DEPOIMENTOS
══════════════════════════════════════════ */
app.get('/api/depoimentos', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('depoimentos')
            .select('*').order('ordem');
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.post('/api/depoimentos', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('depoimentos')
            .insert([req.body]).select().single();
        if (error) throw error;
        res.status(201).json({ data });
    } catch (e) { next(e); }
});

app.put('/api/depoimentos/:id', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('depoimentos')
            .update(req.body).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.delete('/api/depoimentos/:id', authMiddleware, async (req, res, next) => {
    try {
        const { error } = await supabase.from('depoimentos').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   SEO  (tabela: seo_paginas)
   GET /api/seo/:pagina
   PUT /api/seo/:pagina
══════════════════════════════════════════ */
app.get('/api/seo/:pagina', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('seo_paginas')
            .select('*').eq('pagina', req.params.pagina).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json({ data: data || {} });
    } catch (e) { next(e); }
});

app.put('/api/seo/:pagina', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('seo_paginas')
            .upsert({ ...req.body, pagina: req.params.pagina, updated_at: new Date() }, { onConflict: 'pagina' })
            .select().single();
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   CONTATOS / LEADS
══════════════════════════════════════════ */
app.get('/api/contatos', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('contatos')
            .select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.post('/api/contato', async (req, res, next) => {
    try {
        const { nome, email, telefone, mensagem, imovel_id } = req.body;
        if (!nome || !mensagem) return res.status(400).json({ error: 'Nome e mensagem obrigatórios' });
        const { data, error } = await supabase.from('contatos')
            .insert([{ nome, email, telefone, mensagem, imovel_id }]).select().single();
        if (error) throw error;
        res.status(201).json({ data, message: 'Mensagem enviada!' });
    } catch (e) { next(e); }
});

app.delete('/api/contatos/:id', authMiddleware, async (req, res, next) => {
    try {
        const { error } = await supabase.from('contatos').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   FALLBACK
══════════════════════════════════════════ */
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Rota não encontrada' });
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

/* ══════════════════════════════════════════
   ERRO GLOBAL
══════════════════════════════════════════ */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('❌ Erro interno:', err.stack || err.message || err);
    res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

/* ══════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════ */
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} já está em uso.`);
    } else { console.error('❌ Erro:', err); }
    process.exit(1);
});

const shutdown = (sig) => {
    console.log(`\n⚠️  ${sig} — encerrando...`);
    server.close(() => { console.log('✅ Encerrado.'); process.exit(0); });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  err    => { console.error('❌', err); process.exit(1); });
process.on('unhandledRejection', reason => { console.error('❌', reason); process.exit(1); });
