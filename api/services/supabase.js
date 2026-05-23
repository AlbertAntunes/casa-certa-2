require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const supabase = require('./supabase');

const app = express();

/* ───────────────────────────── */
/* MIDDLEWARE */
/* ───────────────────────────── */

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json({
    limit:'10mb'
}));

app.use(express.urlencoded({
    extended:true
}));

/* ───────────────────────────── */
/* HEALTH CHECK */
/* ───────────────────────────── */

app.get('/api/health', (_req, res) => {

    res.json({
        ok:true,
        ts:Date.now()
    });

});

/* ───────────────────────────── */
/* LISTAR IMÓVEIS */
/* ───────────────────────────── */

app.get('/api/imoveis', async (_req, res) => {

    try {

        const { data, error } = await supabase

            .from('imoveis')

            .select(`
                *,
                imovel_imagens(*)
            `);

        if(error){

            console.log(error);

            return res.status(500).json({
                erro:'Erro ao buscar imóveis'
            });

        }

        res.json(data);

    } catch (erro) {

        console.log(erro);

        res.status(500).json({
            erro:'Erro interno'
        });

    }

});

/* ───────────────────────────── */
/* IMÓVEL INDIVIDUAL */
/* ───────────────────────────── */

app.get('/api/imoveis/:id', async (req, res) => {

    const id = req.params.id;

    try {

        const { data, error } = await supabase

            .from('imoveis')

            .select(`
                *,
                imovel_imagens(*)
            `)

            .eq('id', id)

            .single();

        if(error){

            console.log(error);

            return res.status(500).json({
                erro:'Erro ao buscar imóvel'
            });

        }

        if(!data){

            return res.status(404).json({
                erro:'Imóvel não encontrado'
            });

        }

        res.json(data);

    } catch (erro) {

        console.log(erro);

        res.status(500).json({
            erro:'Erro interno'
        });

    }

});

/* ───────────────────────────── */
/* STATIC FRONTEND */
/* ───────────────────────────── */

app.use(express.static(
    path.join(__dirname, '../frontend')
));

app.get('*', (_req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../frontend/index.html'
        )
    );

});

/* ───────────────────────────── */
/* ERROR HANDLER */
/* ───────────────────────────── */

app.use((err, _req, res, _next) => {

    console.error(err);

    res.status(err.status || 500).json({
        message: err.message || 'Erro interno'
    });

});

/* ───────────────────────────── */
/* START SERVER */
/* ───────────────────────────── */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🏠 Casa Certa API rodando na porta ${PORT}`
    );

});

module.exports = app;