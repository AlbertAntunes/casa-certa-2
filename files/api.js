/**
 * Casa Certa — API Client  (v3 — corrigido e consolidado)
 *
 * Centraliza TODAS as chamadas à API do backend.
 * Nenhuma página deve chamar fetch() diretamente para rotas /api/*.
 *
 * Uso:
 *   const { data } = await Api.imoveis.listar({ status: 'ativo' });
 *   const { data } = await Api.contatos.enviar({ nome, email, mensagem });
 */

const API_BASE = window.CC_API_BASE || '/api';

const Api = {

  /* ─────────────────────────────────────────────
     UTIL — requisição base com autenticação
  ───────────────────────────────────────────── */
  async _fetch(path, opts = {}) {
    const token = localStorage.getItem('cc_token');
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_BASE + path, { ...opts, headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      const error = new Error(err.message || err.error || `Erro ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  /* ─────────────────────────────────────────────
     AUTH
  ───────────────────────────────────────────── */
  auth: {
    async login(email, password) {
      return Api._fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    /** Logout é somente local — o JWT é stateless no backend */
    logout() {
      localStorage.removeItem('cc_token');
      window.location.href = '/admin/index.html';
    },
    async me() {
      return Api._fetch('/auth/me');
    }
  },

  /* ─────────────────────────────────────────────
     IMÓVEIS
     O backend retorna imagens na chave imagens_imoveis[].
     Helper getCapaUrl() resolve a URL da capa de forma unificada.
  ───────────────────────────────────────────── */
  imoveis: {
    async listar(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return Api._fetch(`/imoveis${qs ? '?' + qs : ''}`);
    },
    async buscar(id) {
      return Api._fetch(`/imoveis/${id}`);
    },
    async criar(data) {
      return Api._fetch('/imoveis', { method: 'POST', body: JSON.stringify(data) });
    },
    async atualizar(id, data) {
      return Api._fetch(`/imoveis/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async remover(id) {
      return Api._fetch(`/imoveis/${id}`, { method: 'DELETE' });
    },

    /* Imagens vinculadas */
    async listarImagens(imovelId) {
      return Api._fetch(`/imoveis/${imovelId}/imagens`);
    },
    async adicionarImagem(imovelId, data) {
      return Api._fetch(`/imoveis/${imovelId}/imagens`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async removerImagem(imovelId, imgId) {
      return Api._fetch(`/imoveis/${imovelId}/imagens/${imgId}`, { method: 'DELETE' });
    },

    /**
     * Resolve a URL da imagem de capa de um imóvel,
     * independente de como o backend retornou os dados.
     * Ordem de prioridade:
     *   1. capa_url direta no registro
     *   2. imagens_imoveis com is_capa=true
     *   3. primeira imagem em imagens_imoveis por ordem
     *   4. null
     */
    getCapaUrl(imovel) {
      if (!imovel) return null;
      if (imovel.capa_url) return imovel.capa_url;

      const imgs = imovel.imagens_imoveis;
      if (Array.isArray(imgs) && imgs.length > 0) {
        const capa = imgs.find(i => i.is_capa);
        return (capa || imgs[0]).url || null;
      }
      return null;
    }
  },

  /* ─────────────────────────────────────────────
     EQUIPE
  ───────────────────────────────────────────── */
  equipe: {
    async listar() {
      return Api._fetch('/equipe');
    },
    async buscar(id) {
      return Api._fetch(`/equipe/${id}`);
    },
    async criar(data) {
      return Api._fetch('/equipe', { method: 'POST', body: JSON.stringify(data) });
    },
    async atualizar(id, data) {
      return Api._fetch(`/equipe/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async remover(id) {
      return Api._fetch(`/equipe/${id}`, { method: 'DELETE' });
    }
  },

  /* ─────────────────────────────────────────────
     MÍDIAS HOME (carrossel)
  ───────────────────────────────────────────── */
  midias: {
    async listar() {
      return Api._fetch('/midias-home');
    },
    async criar(data) {
      return Api._fetch('/midias-home', { method: 'POST', body: JSON.stringify(data) });
    },
    async atualizar(id, data) {
      return Api._fetch(`/midias-home/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async remover(id) {
      return Api._fetch(`/midias-home/${id}`, { method: 'DELETE' });
    }
  },

  /* ─────────────────────────────────────────────
     CONFIGURAÇÕES DO SITE
  ───────────────────────────────────────────── */
  config: {
    async todas() {
      return Api._fetch('/configuracoes');
    },
    async buscar(chave) {
      return Api._fetch(`/configuracoes/${chave}`);
    },
    async salvar(chave, valor) {
      return Api._fetch(`/configuracoes/${chave}`, {
        method: 'PUT',
        body: JSON.stringify({ valor })
      });
    },
    async carrossel() {
      return Api._fetch('/configuracoes/carrossel');
    },
    async salvarCarrossel(data) {
      return Api._fetch('/configuracoes/carrossel', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  /* ─────────────────────────────────────────────
     DEPOIMENTOS
  ───────────────────────────────────────────── */
  depoimentos: {
    async listar() {
      return Api._fetch('/depoimentos');
    },
    async criar(data) {
      return Api._fetch('/depoimentos', { method: 'POST', body: JSON.stringify(data) });
    },
    async atualizar(id, data) {
      return Api._fetch(`/depoimentos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async remover(id) {
      return Api._fetch(`/depoimentos/${id}`, { method: 'DELETE' });
    }
  },

  /* ─────────────────────────────────────────────
     FAQ
  ───────────────────────────────────────────── */
  faq: {
    async listar() {
      return Api._fetch('/faq');
    },
    async criar(data) {
      return Api._fetch('/faq', { method: 'POST', body: JSON.stringify(data) });
    },
    async atualizar(id, data) {
      return Api._fetch(`/faq/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async remover(id) {
      return Api._fetch(`/faq/${id}`, { method: 'DELETE' });
    }
  },

  /* ─────────────────────────────────────────────
     SEO
  ───────────────────────────────────────────── */
  seo: {
    async buscar(pagina) {
      return Api._fetch(`/seo/${pagina}`);
    },
    async salvar(pagina, data) {
      return Api._fetch(`/seo/${pagina}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  /* ─────────────────────────────────────────────
     AGENDAMENTOS
     Rota backend: POST /api/agendamentos (criada no server.js)
  ───────────────────────────────────────────── */
  agendamentos: {
    async criar(data) {
      return Api._fetch('/agendamentos', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async listar(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return Api._fetch(`/agendamentos${qs ? '?' + qs : ''}`);
    },
    async disponibilidade(ano, mes) {
      return Api._fetch(`/agendamentos/disponibilidade?ano=${ano}&mes=${mes}`);
    },
    async atualizar(id, data) {
      return Api._fetch(`/agendamentos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async remover(id) {
      return Api._fetch(`/agendamentos/${id}`, { method: 'DELETE' });
    }
  },

  /* ─────────────────────────────────────────────
     CONTATOS / LEADS
     CORREÇÃO: o endpoint POST é /contato (singular) no backend
  ───────────────────────────────────────────── */
  contatos: {
    async enviar(data) {
      return Api._fetch('/contato', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async listar() {
      return Api._fetch('/contatos');
    },
    async remover(id) {
      return Api._fetch(`/contatos/${id}`, { method: 'DELETE' });
    }
  },

  /* ─────────────────────────────────────────────
     UPLOAD (multipart — não usa _fetch)
  ───────────────────────────────────────────── */
  upload: {
    async arquivo(file, bucket = 'imoveis') {
      const token = localStorage.getItem('cc_token');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', bucket);

      const res = await fetch(API_BASE + '/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro no upload');
      }
      return res.json();
    }
  }
};

window.Api = Api;
