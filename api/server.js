require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

/* ── MIDDLEWARE ── */
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── ROUTES ── */
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/imoveis',      require('./routes/imoveis'));
app.use('/api/equipe',       require('./routes/equipe'));
app.use('/api/midias-home',  require('./routes/midias'));
app.use('/api/configuracoes',require('./routes/configuracoes'));
app.use('/api/upload',       require('./routes/upload'));

// Conteudo routes (depoimentos, faq, banners, seo, contatos)
const conteudo = require('./routes/conteudo');
app.use('/api', conteudo);

/* ── STATIC FRONTEND (dev only) ── */
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
  app.get('/admin*', (_req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/admin/index.html')));
  app.get('*', (_req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/index.html')));
}

/* ── HEALTH CHECK ── */
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

/* ── ERROR HANDLER ── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erro interno' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🏠 Casa Certa API rodando na porta ${PORT}`));

module.exports = app;
