/**
 * Casa Certa — API Client
 * Centraliza todas as chamadas à API do backend.
 */

const API_BASE = window.CC_API_BASE || '/api';

const Api = {
  /* ────── UTIL ────── */
  async _fetch(path, opts = {}) {
    const token = localStorage.getItem('cc_token');
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_BASE + path, { ...opts, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Erro na requisição');
    }
    return res.json();
  },

  /* ────── AUTH ────── */
  auth: {
    async login(email, password) {
      return Api._fetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    },
    async logout() {
      return Api._fetch('/auth/logout', { method: 'POST' });
    },
    async me() {
      return Api._fetch('/auth/me');
    }
  },

  /* ────── IMÓVEIS ────── */
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
    }
  },

  /* ────── EQUIPE ────── */
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
    }
  },

  /* ────── MÍDIAS HOME ────── */
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

  /* ────── CONFIGURAÇÕES ────── */
  config: {
    async todas() {
      return Api._fetch('/configuracoes');
    },
    async buscar(chave) {
      return Api._fetch(`/configuracoes/${chave}`);
    },
    async salvar(chave, valor) {
      return Api._fetch(`/configuracoes/${chave}`, { method: 'PUT', body: JSON.stringify({ valor }) });
    }
  },

  /* ────── DEPOIMENTOS ────── */
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

  /* ────── FAQ ────── */
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

  /* ────── SEO ────── */
  seo: {
    async buscar(pagina) {
      return Api._fetch(`/seo/${pagina}`);
    },
    async salvar(pagina, data) {
      return Api._fetch(`/seo/${pagina}`, { method: 'PUT', body: JSON.stringify(data) });
    }
  },

  /* ────── UPLOAD ────── */
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
      if (!res.ok) throw new Error('Erro no upload');
      return res.json();
    }
  },

  /* ────── CONTATOS / LEADS ────── */
  contatos: {
    async enviar(data) {
      return Api._fetch('/contatos', { method: 'POST', body: JSON.stringify(data) });
    },
    async listar() {
      return Api._fetch('/contatos');
    }
  }
};

window.Api = Api;
