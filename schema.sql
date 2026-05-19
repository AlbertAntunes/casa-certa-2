-- ══════════════════════════════════════════
-- CASA CERTA — SCHEMA SUPABASE
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ADMINS ──────────────────────────────────
CREATE TABLE admins (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  nome         text,
  role         text DEFAULT 'admin',
  created_at   timestamptz DEFAULT now()
);

-- ── IMÓVEIS ─────────────────────────────────
CREATE TABLE imoveis (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo        text NOT NULL,
  descricao     text,
  preco         numeric,
  preco_periodo text,
  cidade        text DEFAULT 'Quixadá',
  bairro        text,
  tipo          text CHECK (tipo IN ('venda','aluguel','terreno')),
  status        text DEFAULT 'ativo' CHECK (status IN ('ativo','vendido','alugado','inativo')),
  quartos       integer,
  banheiros     integer,
  vagas         integer,
  metragem      numeric,
  destaque      boolean DEFAULT false,
  slug          text UNIQUE,
  emoji         text DEFAULT '🏠',
  cor_card      text,
  capa_url      text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ── IMAGENS DOS IMÓVEIS ──────────────────────
CREATE TABLE imagens_imoveis (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  imovel_id    uuid REFERENCES imoveis(id) ON DELETE CASCADE,
  url          text NOT NULL,
  storage_path text,
  ordem        integer DEFAULT 0,
  is_capa      boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- ── EQUIPE ──────────────────────────────────
CREATE TABLE equipe (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                text NOT NULL,
  cargo               text DEFAULT 'Corretor de Imóveis',
  creci               text,
  bio                 text,
  foto_url            text,
  foto_storage_path   text,
  whatsapp            text,
  instagram           text,
  anos_experiencia    integer DEFAULT 0,
  clientes_atendidos  integer DEFAULT 0,
  avaliacao           numeric DEFAULT 4.9,
  avatar_iniciais     text,
  avatar_cor          text,
  ordem               integer DEFAULT 0,
  ativo               boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);

-- ── MÍDIAS DA HOME ──────────────────────────
CREATE TABLE midias_home (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo         text NOT NULL CHECK (tipo IN ('imagem','video')),
  url          text NOT NULL,
  storage_path text,
  titulo       text,
  ordem        integer DEFAULT 0,
  ativo        boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

-- ── CONFIG CARROSSEL ────────────────────────
CREATE TABLE configuracoes_carrossel (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  autoplay      boolean DEFAULT true,
  intervalo_ms  integer DEFAULT 4000,
  velocidade_ms integer DEFAULT 600,
  updated_at    timestamptz DEFAULT now()
);
INSERT INTO configuracoes_carrossel (autoplay, intervalo_ms, velocidade_ms) VALUES (true, 4000, 600);

-- ── DEPOIMENTOS ─────────────────────────────
CREATE TABLE depoimentos (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       text NOT NULL,
  cargo      text,
  texto      text NOT NULL,
  estrelas   integer DEFAULT 5,
  foto_url   text,
  ativo      boolean DEFAULT true,
  ordem      integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── FAQ ─────────────────────────────────────
CREATE TABLE faq (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pergunta   text NOT NULL,
  resposta   text NOT NULL,
  ordem      integer DEFAULT 0,
  ativo      boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── BANNERS / MARQUEE ───────────────────────
CREATE TABLE banners (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo       text,
  conteudo   text NOT NULL,
  url        text,
  ordem      integer DEFAULT 0,
  ativo      boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── CONFIGURAÇÕES DO SITE ───────────────────
CREATE TABLE configuracoes_site (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave      text UNIQUE NOT NULL,
  valor      text,
  tipo       text DEFAULT 'texto',
  grupo      text,
  descricao  text,
  updated_at timestamptz DEFAULT now()
);

-- ── SEO POR PÁGINA ──────────────────────────
CREATE TABLE seo_paginas (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pagina          text UNIQUE NOT NULL,
  title           text,
  description     text,
  og_title        text,
  og_description  text,
  og_image_url    text,
  canonical_url   text,
  schema_json     jsonb,
  updated_at      timestamptz DEFAULT now()
);

-- ── CONTATOS / LEADS ────────────────────────
CREATE TABLE contatos (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome         text,
  telefone     text,
  email        text,
  mensagem     text,
  imovel_id    uuid REFERENCES imoveis(id),
  corretor_id  uuid REFERENCES equipe(id),
  origem       text DEFAULT 'site',
  created_at   timestamptz DEFAULT now()
);

-- ═══════════════════════════════
-- DADOS INICIAIS
-- ═══════════════════════════════

INSERT INTO configuracoes_site (chave, valor, tipo, grupo, descricao) VALUES
('hero_badge',           '2 Corretores · CRECI 28948 & 15784',        'texto',  'hero',    'Badge acima do título'),
('hero_titulo_linha1',   'CASA',                                        'texto',  'hero',    'Primeira linha do título'),
('hero_titulo_linha2',   'CERTA',                                       'texto',  'hero',    'Segunda linha do título'),
('hero_localizacao',     'QUIXADÁ – CE · Imóveis',                      'texto',  'hero',    'Localização no hero'),
('hero_frases_tipadas',  '["casas com entrada facilitada","terrenos escriturados","apartamentos no centro","imóveis com documentação completa"]', 'json', 'hero', 'Frases animadas'),
('hero_stat_1_num',      '10+',                                         'texto',  'hero',    'Stat 1 número'),
('hero_stat_1_label',    'Anos de exp.',                                 'texto',  'hero',    'Stat 1 label'),
('hero_stat_2_num',      '500+',                                        'texto',  'hero',    'Stat 2 número'),
('hero_stat_2_label',    'Clientes',                                    'texto',  'hero',    'Stat 2 label'),
('hero_stat_3_num',      '4.9★',                                        'texto',  'hero',    'Stat 3 número'),
('hero_stat_3_label',    'Avaliação',                                   'texto',  'hero',    'Stat 3 label'),
('hero_badge_imoveis',   '120+',                                        'texto',  'hero',    'Badge imóveis'),
('hero_badge_chaves',    '500+',                                        'texto',  'hero',    'Badge chaves'),
('whatsapp_diogo',       '5588981545786',                               'texto',  'contato', 'WhatsApp Diogo'),
('whatsapp_salomao',     '5588997137356',                               'texto',  'contato', 'WhatsApp Salomão'),
('instagram_url',        'https://instagram.com/casacertaimoveis',      'texto',  'contato', 'Link Instagram'),
('footer_copyright',     '© 2025 Casa Certa Imóveis. Todos os direitos reservados.', 'texto', 'footer', 'Texto copyright'),
('footer_descricao',     'Especialistas em imóveis em Quixadá CE. Realizando sonhos há mais de 10 anos.', 'texto', 'footer', 'Descrição no rodapé'),
('marquee_itens',        '["🏠 Imóveis em Quixadá","✅ CRECI 28948 & 15784","⭐ 4.9 de avaliação","🔑 500+ chaves entregues","📍 Quixadá – CE","💬 Atendimento personalizado"]', 'json', 'geral', 'Itens do marquee'),
('diferencial_1_titulo', 'Experiência Local',                           'texto',  'conteudo','Diferencial 1 título'),
('diferencial_1_desc',   'Mais de 10 anos atuando em Quixadá e região, conhecemos cada bairro e oportunidade.',  'texto', 'conteudo', 'Diferencial 1 descrição'),
('diferencial_2_titulo', 'Documentação Segura',                        'texto',  'conteudo','Diferencial 2 título'),
('diferencial_2_desc',   'Toda transação com suporte jurídico completo. Você compra ou aluga com total segurança.', 'texto', 'conteudo', 'Diferencial 2 descrição'),
('diferencial_3_titulo', 'Atendimento Personalizado',                  'texto',  'conteudo','Diferencial 3 título'),
('diferencial_3_desc',   'Cada cliente recebe atenção exclusiva. Entendemos seu sonho e trabalhamos por ele.',   'texto', 'conteudo', 'Diferencial 3 descrição'),
('diferencial_4_titulo', 'Melhores Condições',                         'texto',  'conteudo','Diferencial 4 título'),
('diferencial_4_desc',   'Negociamos as melhores condições de pagamento para caber no seu orçamento.',           'texto', 'conteudo', 'Diferencial 4 descrição'),
('passo_1_titulo',       'Escolha seu Imóvel',                         'texto',  'conteudo','Passo 1 título'),
('passo_1_desc',         'Navegue pelo nosso catálogo e encontre o imóvel ideal para você.',                     'texto', 'conteudo', 'Passo 1 descrição'),
('passo_2_titulo',       'Fale com a Equipe',                          'texto',  'conteudo','Passo 2 título'),
('passo_2_desc',         'Entre em contato e agende uma visita com um de nossos corretores.',                    'texto', 'conteudo', 'Passo 2 descrição'),
('passo_3_titulo',       'Realize seu Sonho',                          'texto',  'conteudo','Passo 3 título'),
('passo_3_desc',         'Finalize a negociação com toda segurança e receba as chaves do seu novo lar.',         'texto', 'conteudo', 'Passo 3 descrição');

-- SEO inicial da home
INSERT INTO seo_paginas (pagina, title, description, og_title, og_description, canonical_url) VALUES
('home',
 'Casa Certa Imóveis · Quixadá CE',
 'Encontre casas, apartamentos e terrenos em Quixadá CE. Atendimento personalizado com CRECI 28948 & 15784.',
 'Casa Certa Imóveis · Quixadá CE',
 'Especialistas em imóveis em Quixadá. Venda, aluguel e terrenos com documentação completa.',
 'https://casacertaimoveis.com.br/');
