/**
 * Casa Certa — imoveis.js  (v3 — corrigido e unificado)
 *
 * Responsabilidade: renderizar cards de imóveis em páginas que
 * NÃO usam o site-init.js (ex.: páginas de listagem standalone).
 * Usa sempre Api.imoveis.getCapaUrl() para resolver imagens.
 */

(function () {
  'use strict';

  /* ── Aguarda Api estar disponível ── */
  function whenApiReady(fn) {
    if (window.Api) { fn(); return; }
    document.addEventListener('DOMContentLoaded', fn);
  }

  /* ── Formata preço ── */
  function fmtPreco(imovel) {
    if (!imovel.preco) return 'Consulte';
    const valor = Number(imovel.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return imovel.preco_periodo ? `${valor}${imovel.preco_periodo}` : valor;
  }

  /* ── Cria HTML de um card ── */
  function criarCard(imovel) {
    /* Resolve a URL da imagem usando o helper centralizado do Api */
    const capaUrl = window.Api
      ? Api.imoveis.getCapaUrl(imovel)
      : (imovel.capa_url || null);

    const imgHtml = capaUrl
      ? `<img src="${capaUrl}" alt="${imovel.titulo}" loading="lazy" style="width:100%;height:220px;object-fit:cover">`
      : `<div style="width:100%;height:220px;display:flex;align-items:center;justify-content:center;background:var(--bg3,#111);font-size:48px">${imovel.emoji || '🏠'}</div>`;

    const tipo  = imovel.tipo || 'venda';
    const preco = fmtPreco(imovel);

    return `
    <div class="imovel-card" data-type="${tipo}" data-id="${imovel.id}">
      <a href="/imovel.html?id=${imovel.id}" class="card-img-link" aria-label="Ver ${imovel.titulo}">
        ${imgHtml}
        <span class="tipo-badge tipo-${tipo}">${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
      </a>
      <div class="card-content">
        <h3 class="card-titulo">${imovel.titulo || ''}</h3>
        ${imovel.bairro ? `<p class="bairro">📍 ${imovel.bairro}${imovel.cidade ? ', ' + imovel.cidade : ''}</p>` : ''}
        <div class="info-row">
          ${imovel.quartos  ? `<span>🛏 ${imovel.quartos} qto${imovel.quartos > 1 ? 's' : ''}</span>` : ''}
          ${imovel.banheiros ? `<span>🚿 ${imovel.banheiros} ban.</span>` : ''}
          ${imovel.metragem  ? `<span>📐 ${imovel.metragem}m²</span>` : ''}
          ${imovel.vagas     ? `<span>🚗 ${imovel.vagas} vaga${imovel.vagas > 1 ? 's' : ''}</span>` : ''}
        </div>
        <strong class="preco">${preco}</strong>
        <div class="card-actions">
          <a class="btn-detalhes" href="/imovel.html?id=${imovel.id}">Ver detalhes →</a>
        </div>
      </div>
    </div>`;
  }

  /* ── Renderiza lista de imóveis em um container ── */
  function renderizarImoveis(payload) {
    const grid = document.getElementById('imoveis-grid')
      || document.getElementById('lista-imoveis-container')
      || document.getElementById('grid-imoveis');

    if (!grid) return;

    /* Normaliza payload: pode vir como array direto ou { data: [] } */
    let lista = [];
    if (Array.isArray(payload))            lista = payload;
    else if (Array.isArray(payload?.data)) lista = payload.data;

    if (!lista.length) {
      grid.innerHTML = '<p class="sem-imoveis" style="grid-column:1/-1;text-align:center;padding:2rem;opacity:.6">Nenhum imóvel encontrado.</p>';
      return;
    }

    grid.innerHTML = lista.map(criarCard).join('');

    /* Re-ativa filtros se existirem */
    const tabAtiva = document.querySelector('.filter-tab.active');
    if (tabAtiva) tabAtiva.dispatchEvent(new Event('click'));
  }

  /* ── Carrega e renderiza imóveis ── */
  async function carregarImoveis(params = {}) {
    const grid = document.getElementById('imoveis-grid')
      || document.getElementById('lista-imoveis-container')
      || document.getElementById('grid-imoveis');

    if (!grid) return;

    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:2rem;opacity:.5">Carregando imóveis…</p>';

    try {
      let payload;

      if (window.Api) {
        payload = await Api.imoveis.listar(params);
      } else {
        /* Fallback para fetch direto se api.js não foi carregado */
        const qs  = new URLSearchParams(params).toString();
        const res = await fetch(`/api/imoveis${qs ? '?' + qs : ''}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        payload = await res.json();
      }

      renderizarImoveis(payload);
    } catch (err) {
      console.error('[imoveis.js] Erro ao carregar imóveis:', err);
      if (grid) grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--danger,red)">Erro ao carregar imóveis. Tente novamente.</p>';
    }
  }

  /* ── Expõe globalmente ── */
  window.carregarImoveis   = carregarImoveis;
  window.renderizarImoveis = renderizarImoveis;
  window.criarCardImovel   = criarCard;

  /* ── Auto-carrega se houver grid na página ── */
  whenApiReady(() => {
    const grid = document.getElementById('imoveis-grid')
      || document.getElementById('lista-imoveis-container')
      || document.getElementById('grid-imoveis');

    if (grid && grid.dataset.autoload !== 'false') {
      const params = {};
      if (grid.dataset.status) params.status = grid.dataset.status;
      if (grid.dataset.tipo)   params.tipo   = grid.dataset.tipo;
      carregarImoveis(params);
    }
  });

}());
