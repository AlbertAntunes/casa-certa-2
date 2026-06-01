require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const { createClient } = require('@supabase/supabase-js');

/* ══════════════════════════════════════════
   VALIDAÇÃO DE AMBIENTE — falha rápido se
   variáveis críticas estiverem ausentes.
══════════════════════════════════════════ */
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
    console.error(`❌  Variáveis de ambiente ausentes: ${missing.join(', ')}`);
    process.exit(1);
}

const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const JWT_SECRET = process.env.JWT_SECRET;
const upload     = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/* ══════════════════════════════════════════
   APP
══════════════════════════════════════════ */
const app = express();

/* CORS: aceita lista de origens separada por vírgula ou wildcard */
const rawOrigins = process.env.CORS_ORIGIN || '';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);           // requests server-side / curl
        if (!allowedOrigins.length) return cb(null, true); // sem restrição se var vazia
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS bloqueado para origem: ${origin}`));
    },
    credentials: true
}));

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
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

/* ══════════════════════════════════════════
   STATUS
══════════════════════════════════════════ */
app.get('/api/status', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

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

/* Rota de logout — stateless, apenas confirmação */
app.post('/api/auth/logout', authMiddleware, (req, res) => {
    res.json({ success: true, message: 'Logout efetuado' });
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

        const { error } = await supabase.storage
            .from(bucket).upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename);
        res.json({ url: publicUrl, path: filename });
    } catch (e) { next(e); }
});

/* ══════════════════════════════════════════
   CONFIGURAÇÕES  (tabela: configuracoes_site)
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

/* CORREÇÃO: busca corretamente em configuracoes_site por chave */
app.get('/api/configuracoes/:chave', async (req, res, next) => {
    try {
        const { chave } = req.params;
        const { data, error } = await supabase
            .from('configuracoes_site')
            .select('*')
            .eq('chave', chave)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json({ data: data || null });
    } catch (e) { next(e); }
});

app.put('/api/configuracoes/:chave', authMiddleware, async (req, res, next) => {
    try {
        const { chave } = req.params;
        const { valor }  = req.body;
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
            .select('*, imagens_imoveis(id, url, ordem, is_capa)')
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);
        if (status)            query = query.eq('status', status);
        if (tipo)              query = query.eq('tipo', tipo);
        if (destaque === 'true') query = query.eq('destaque', true);
        const { data, error } = await query;
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.get('/api/imoveis/:id', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('imoveis')
            .select('*, imagens_imoveis(id, url, ordem, is_capa)')
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
   AGENDAMENTOS (rota criada — não existia antes)
══════════════════════════════════════════ */
app.post('/api/agendamentos', async (req, res, next) => {
    try {
        const { imovel_id, nome, whatsapp, email, data: dataVisita, periodo, observacao } = req.body;
        if (!nome || !whatsapp || !dataVisita) {
            return res.status(400).json({ error: 'Nome, WhatsApp e data são obrigatórios' });
        }
        const { data, error } = await supabase.from('agendamentos')
            .insert([{ imovel_id, nome, whatsapp, email: email || null, data: dataVisita, periodo: periodo || 'manha', observacao: observacao || null, status: 'pendente' }])
            .select().single();
        if (error) throw error;
        res.status(201).json({ data, message: 'Agendamento realizado com sucesso!' });
    } catch (e) { next(e); }
});

app.get('/api/agendamentos', authMiddleware, async (req, res, next) => {
    try {
        const { status, data_inicio, data_fim } = req.query;
        let query = supabase.from('agendamentos')
            .select('*, imoveis(titulo, bairro)')
            .order('data', { ascending: true });
        if (status)      query = query.eq('status', status);
        if (data_inicio) query = query.gte('data', data_inicio);
        if (data_fim)    query = query.lte('data', data_fim);
        const { data, error } = await query;
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.get('/api/agendamentos/disponibilidade', async (req, res, next) => {
    try {
        const { ano, mes } = req.query;
        if (!ano || !mes) return res.status(400).json({ error: 'ano e mes são obrigatórios' });
        const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;

        const [bloqueiosRes, agendamentosRes] = await Promise.all([
            supabase.from('disponibilidade')
                .select('data, bloqueado')
                .gte('data', `${mesStr}-01`)
                .lte('data', `${mesStr}-31`)
                .catch(() => ({ data: [] })),
            supabase.from('agendamentos')
                .select('data')
                .gte('data', `${mesStr}-01`)
                .lte('data', `${mesStr}-31`)
                .neq('status', 'cancelado')
        ]);

        res.json({
            data: {
                bloqueados: (bloqueiosRes.data || []).filter(d => d.bloqueado).map(d => d.data),
                agendamentos: agendamentosRes.data || []
            }
        });
    } catch (e) { next(e); }
});

app.put('/api/agendamentos/:id', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('agendamentos')
            .update(req.body).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json({ data });
    } catch (e) { next(e); }
});

app.delete('/api/agendamentos/:id', authMiddleware, async (req, res, next) => {
    try {
        const { error } = await supabase.from('agendamentos').delete().eq('id', req.params.id);
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
            .select('*').eq('ativo', true).order('ordem');
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
            .select('*').eq('ativo', true).order('ordem');
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
            .select('*').eq('ativo', true).order('ordem');
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
   POST /api/contato  (público — sem auth)
   GET  /api/contatos (admin)
   DELETE /api/contatos/:id (admin)
══════════════════════════════════════════ */
app.post('/api/contato', async (req, res, next) => {
    try {
        const { nome, email, telefone, mensagem, imovel_id, corretor_id } = req.body;
        if (!nome || !mensagem) return res.status(400).json({ error: 'Nome e mensagem obrigatórios' });
        const { data, error } = await supabase.from('contatos')
            .insert([{ nome, email: email || null, telefone: telefone || null, mensagem, imovel_id: imovel_id || null, corretor_id: corretor_id || null }])
            .select().single();
        if (error) throw error;
        res.status(201).json({ data, message: 'Mensagem enviada com sucesso!' });
    } catch (e) { next(e); }
});

app.get('/api/contatos', authMiddleware, async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('contatos')
            .select('*, imoveis(titulo)').order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ data });
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
   FALLBACK SPA
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
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} em uso.`);
    } else { console.error('❌ Erro:', err); }
    process.exit(1);
});

const shutdown = (sig) => {
    console.log(`\n⚠️  ${sig} — encerrando...`);
    server.close(() => { console.log('✅ Encerrado.'); process.exit(0); });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException', err => { console.error('❌', err); process.exit(1); });
