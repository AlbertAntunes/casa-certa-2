/**
 * Casa Certa — Site Initializer  (v3 — corrigido e consolidado)
 *
 * Injeta dados dinâmicos da API no HTML do site público.
 * Depende de: api.js  (deve ser carregado antes deste arquivo)
 *
 * Correções v3:
 *  - Usa Api.* em vez de fetch() direto
 *  - Usa Api.imoveis.getCapaUrl() — resolve imagens_imoveis corretamente
 *  - Carrossel instanciado apenas uma vez, dentro de CC.init()
 *  - Sem código solto fora de funções
 */

/* ════ SVG ICONS ════ */
const CC_ICON_WPP = `<svg class="cc-social-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="display:inline-block;vertical-align:middle;flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

const CC_ICON_INSTA = `<svg class="cc-social-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="display:inline-block;vertical-align:middle;flex-shrink:0"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;

const CC = {

  /* ── INIT ── */
  async init() {
    try {
      /* Garante que Api está disponível */
      if (!window.Api) {
        console.warn('[CC] api.js não foi carregado. Verifique a ordem dos scripts.');
        return;
      }

      const [cfgRes, imoveisRes, equipeRes, midiaRes, faqRes] = await Promise.allSettled([
        Api.config.todas(),
        Api.imoveis.listar({ status: 'ativo' }),
        Api.equipe.listar(),
        Api.midias.listar(),
        Api.faq.listar(),
      ]);

      const cfg     = cfgRes.status     === 'fulfilled' ? CC._cfgMap(cfgRes.value.data || []) : {};
      const imoveis = imoveisRes.status === 'fulfilled' ? (imoveisRes.value.data || []) : [];
      const equipe  = equipeRes.status  === 'fulfilled' ? (equipeRes.value.data || []) : [];
      const faq     = faqRes.status     === 'fulfilled' ? (faqRes.value.data || []) : [];

      try { CC.applyConfig(cfg); }         catch (e) { console.warn('[CC] applyConfig:', e); }
      try { CC.applyImoveis(imoveis); }    catch (e) { console.warn('[CC] applyImoveis:', e); }
      try { CC.applyEquipe(equipe); }      catch (e) { console.warn('[CC] applyEquipe:', e); }
      try { CC.applyFaq(faq); }           catch (e) { console.warn('[CC] applyFaq:', e); }
      try { CC.applyMarquee(cfg.marquee_itens); } catch (e) { console.warn('[CC] applyMarquee:', e); }
      try { CC.applyIcons(); }             catch (e) { console.warn('[CC] applyIcons:', e); }
      try { CC.applyFooterCredit(); }      catch (e) { console.warn('[CC] applyFooterCredit:', e); }
      try { await CC.applySEO(); }         catch (e) { console.warn('[CC] applySEO:', e); }

      /* ── Carrossel: instanciado UMA ÚNICA VEZ aqui ── */
      if (document.getElementById('hero-carousel') && window.HeroCarousel) {
        if (!document.getElementById('hero-carousel').__carousel) {
          new window.HeroCarousel('hero-carousel');
        }
      }

    } catch (e) {
      console.warn('[CC] Falha geral:', e);
    }
  },

  _cfgMap(arr) {
    const map = {};
    arr.forEach(c => {
      try { map[c.chave] = JSON.parse(c.valor); }
      catch { map[c.chave] = c.valor; }
    });
    return map;
  },

  /* ── CONFIG / TEXTOS ── */
  applyConfig(cfg) {
    const set = (sel, val) => {
      if (!val) return;
      document.querySelectorAll(sel).forEach(el => { el.textContent = val; });
    };
    const setHref = (sel, val) => {
      if (!val) return;
      document.querySelectorAll(sel).forEach(el => { el.href = val; });
    };

    if (cfg.hero_badge)         set('[data-cc="hero_badge"]',         cfg.hero_badge);
    if (cfg.hero_titulo_linha1) set('[data-cc="hero_titulo_linha1"]', cfg.hero_titulo_linha1);
    if (cfg.hero_titulo_linha2) set('[data-cc="hero_titulo_linha2"]', cfg.hero_titulo_linha2);
    if (cfg.hero_localizacao)   set('[data-cc="hero_localizacao"]',   cfg.hero_localizacao);

    if (cfg.hero_stat_1_num)   set('[data-cc="hero_stat_1_num"]',   cfg.hero_stat_1_num);
    if (cfg.hero_stat_1_label) set('[data-cc="hero_stat_1_label"]', cfg.hero_stat_1_label);
    if (cfg.hero_stat_2_num)   set('[data-cc="hero_stat_2_num"]',   cfg.hero_stat_2_num);
    if (cfg.hero_stat_2_label) set('[data-cc="hero_stat_2_label"]', cfg.hero_stat_2_label);
    if (cfg.hero_stat_3_num)   set('[data-cc="hero_stat_3_num"]',   cfg.hero_stat_3_num);
    if (cfg.hero_stat_3_label) set('[data-cc="hero_stat_3_label"]', cfg.hero_stat_3_label);
    if (cfg.hero_badge_imoveis) set('[data-cc="hero_badge_imoveis"]', cfg.hero_badge_imoveis);
    if (cfg.hero_badge_chaves)  set('[data-cc="hero_badge_chaves"]',  cfg.hero_badge_chaves);

    /* WhatsApp — expõe globalmente para outros módulos */
    const wppDiogo   = cfg.whatsapp_diogo   || '5588981545786';
    const wppSalomao = cfg.whatsapp_salomao || '5588997137356';
    window.WPP_DIOGO   = wppDiogo;
    window.WPP_SALOMAO = wppSalomao;

    document.querySelectorAll('[data-wpp="diogo"]').forEach(el => { el.href = `https://wa.me/${wppDiogo}`; });
    document.querySelectorAll('[data-wpp="salomao"]').forEach(el => { el.href = `https://wa.me/${wppSalomao}`; });

    if (cfg.instagram_url) setHref('[data-cc="instagram_url"]', cfg.instagram_url);

    if (Array.isArray(cfg.hero_frases_tipadas) && window._typedStrings) {
      window._typedStrings = cfg.hero_frases_tipadas;
    }

    if (cfg.footer_descricao) set('[data-cc="footer_descricao"]', cfg.footer_descricao);
    if (cfg.footer_copyright) set('[data-cc="footer_copyright"]', cfg.footer_copyright);

    [1, 2, 3, 4].forEach(n => {
      if (cfg[`diferencial_${n}_titulo`]) set(`[data-cc="diferencial_${n}_titulo"]`, cfg[`diferencial_${n}_titulo`]);
      if (cfg[`diferencial_${n}_desc`])   set(`[data-cc="diferencial_${n}_desc"]`,   cfg[`diferencial_${n}_desc`]);
    });

    [1, 2, 3].forEach(n => {
      if (cfg[`passo_${n}_titulo`]) set(`[data-cc="passo_${n}_titulo"]`, cfg[`passo_${n}_titulo`]);
      if (cfg[`passo_${n}_desc`])   set(`[data-cc="passo_${n}_desc"]`,   cfg[`passo_${n}_desc`]);
    });
  },

  /* ── IMÓVEIS ── */
  applyImoveis(list) {
    const grid = document.getElementById('propsGrid');
    if (!grid || !list.length) return;

    const gradients = [
      'linear-gradient(135deg,#065f46,#022c18)',
      'linear-gradient(135deg,#134e4a,#0f3d38)',
      'linear-gradient(135deg,#713f12,#451a03)',
      'linear-gradient(135deg,#1e3a5f,#0f2040)',
      'linear-gradient(135deg,#3b0764,#1e0035)',
      'linear-gradient(135deg,#7f1d1d,#450a0a)',
    ];

    grid.innerHTML = list.map((im, i) => {
      const tipo       = ['venda', 'aluguel', 'terreno'].includes(im?.tipo) ? im.tipo : 'venda';
      const gradient   = im.cor_card || gradients[i % gradients.length];
      const badgeClass = tipo === 'venda' ? 'venda' : tipo === 'aluguel' ? 'aluguel' : 'terreno';
      const preco      = im.preco
        ? `R$ ${Number(im.preco).toLocaleString('pt-BR')}${im.preco_periodo || ''}`
        : 'Consulte';

      /* CORREÇÃO: usa helper centralizado para resolver URL da capa */
      const capaUrl = Api.imoveis.getCapaUrl(im);

      const imgHtml = capaUrl
        ? `<img src="${capaUrl}" alt="${im.titulo}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`
        : `<div class="emoji">${im.emoji || '🏠'}</div>`;

      const meta = [
        im.bairro   ? `<span class="prop-tag">📍 ${im.bairro}</span>`                               : '',
        im.quartos  ? `<span class="prop-tag">🛌 ${im.quartos} qtos</span>`                          : '',
        im.metragem ? `<span class="prop-tag">📐 ${im.metragem}m²</span>`                            : '',
        im.vagas    ? `<span class="prop-tag">🚗 ${im.vagas} vaga${im.vagas > 1 ? 's' : ''}</span>` : '',
      ].join('');

      const paginaImovel = `/imovel.html?id=${im.id}`;
      const wppNum = window.WPP_DIOGO || '5588981545786';
      const wpp = `https://wa.me/${wppNum}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel: ${im.titulo}`)}`;

      return `
        <div class="prop-card reveal" data-type="${tipo}" data-id="${im.id}">
          <div class="prop-photo" style="background:${gradient}">
            ${imgHtml}
            <div class="p-overlay"></div>
            <span class="prop-badge ${badgeClass}">${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
            <button class="prop-fav" onclick="toggleFav(this)" aria-label="Favoritar">♡</button>
          </div>
          <div class="prop-body">
            <div class="prop-title">${im.titulo}</div>
            <div class="prop-meta">${meta}</div>
            <div class="prop-price">${preco}</div>
            <div class="prop-actions">
              <a href="${paginaImovel}" class="btn-sm btn-sm-green">Ver Mais →</a>
              <button class="btn-sm btn-sm-wpp" onclick="window.open('${wpp}','_blank')">
                ${CC_ICON_WPP} Wpp
              </button>
            </div>
          </div>
        </div>`;
    }).join('');

    /* Re-bind filter tabs */
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const f = this.dataset.filter;
        document.querySelectorAll('.prop-card').forEach(card => {
          card.style.display = (f === 'all' || card.dataset.type === f) ? '' : 'none';
        });
      });
    });

    if (window.initReveal) window.initReveal();
  },

  /* ── EQUIPE ── */
  applyEquipe(list) {
    const container = document.querySelector('.team-grid, .equipe-grid, [data-cc-section="equipe"]');
    if (!container || !list.length) return;

    const ativos = list.filter(c => c.ativo !== false);
    if (!ativos.length) return;

    container.innerHTML = ativos.map((c, idx) => {
      const iniciais  = c.avatar_iniciais || (c.nome || 'CC').slice(0, 2).toUpperCase();
      const avatarCor = c.avatar_cor || 'linear-gradient(135deg,#22C55E,#065f46)';
      const fotoHtml  = c.foto_url
        ? `<img src="${c.foto_url}" alt="${c.nome} - Corretor Casa Certa">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:56px;background:var(--bg3)">${iniciais}</div>`;

      const whatsapp       = (c.whatsapp || '').replace(/\D/g, '');
      const instagramAction = c.instagram ? `window.open('${c.instagram}','_blank')` : "openInsta && openInsta()";
      const fallbackWppFn  = idx % 2 === 0 ? "openWppDiogo && openWppDiogo()" : "openWppSalomao && openWppSalomao()";
      const wppAction      = whatsapp ? `window.open('https://wa.me/${whatsapp}','_blank')` : fallbackWppFn;

      return `
      <div class="broker-card reveal visible ${idx % 2 === 0 ? 'from-left' : 'from-right'}">
        <div class="broker-photo-wrap">
          ${fotoHtml}
          <div class="broker-photo-overlay"></div>
          <div class="broker-avatar" style="position:absolute;bottom:-36px;left:24px;background:${avatarCor}">${iniciais}</div>
        </div>
        <div class="broker-body">
          <div class="broker-name">${c.nome || 'Corretor'}</div>
          <div class="broker-role">${c.cargo || 'Corretor de Imóveis'}</div>
          <div class="broker-creci">CRECI ${c.creci || '-'}</div>
          <p class="broker-bio">${c.bio || 'Atendimento personalizado para compra e venda de imóveis em Quixadá e região.'}</p>
          <div class="broker-stats">
            <div class="bk-stat"><div class="bk-stat-val">${c.anos_experiencia || 0}+</div><div class="bk-stat-label">Anos exp.</div></div>
            <div class="bk-stat"><div class="bk-stat-val">${c.clientes_atendidos || 0}+</div><div class="bk-stat-label">Clientes</div></div>
            <div class="bk-stat"><div class="bk-stat-val">${c.avaliacao || 4.9}★</div><div class="bk-stat-label">Avaliação</div></div>
          </div>
          <div class="broker-btns">
            <button class="btn-wpp-broker" onclick="${wppAction}">
              ${CC_ICON_WPP} WhatsApp
            </button>
            <button class="btn-insta-broker" onclick="${instagramAction}">
              ${CC_ICON_INSTA}
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    if (window.initReveal) window.initReveal();
  },

  applyEquipeModal(list) {
    const modal = document.querySelector('.modal-options, #brokerModal .modal-options');
    if (!modal) return;
    modal.innerHTML = list.filter(c => c.ativo !== false).map(c => `
      <div class="broker-option" onclick="selectBroker('${c.whatsapp || ''}')">
        ${c.foto_url
          ? `<img src="${c.foto_url}" class="broker-avatar-img" alt="${c.nome}">`
          : `<div class="broker-avatar" style="background:${c.avatar_cor || 'linear-gradient(135deg,#22C55E,#065f46)'}">${c.avatar_iniciais || c.nome.slice(0, 2).toUpperCase()}</div>`}
        <div>
          <div class="broker-name">${c.nome}</div>
          <div class="broker-creci">CRECI ${c.creci || '-'}</div>
        </div>
      </div>`).join('');
  },

  /* ── MARQUEE ── */
  applyMarquee(items) {
    const track = document.getElementById('marqueeTrack');
    if (!track || !items) return;
    let list = [];
    try { list = Array.isArray(items) ? items : JSON.parse(items); } catch { return; }
    if (!list.length) return;
    const all = [...list, ...list];
    track.innerHTML = all.map(t => `<span class="marquee-item">${t}</span>`).join('');
  },

  /* ── FAQ ── */
  applyFaq(list) {
    const container = document.querySelector('.faq-list, [data-cc-section="faq"]');
    if (!container || !list.length) return;
    container.innerHTML = list.filter(f => f.ativo !== false).map((f, i) => `
      <div class="faq-item reveal">
        <button class="faq-q" onclick="this.closest('.faq-item').classList.toggle('open')">
          <span>${String(i + 1).padStart(2, '0')}. ${f.pergunta}</span>
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-a"><p>${f.resposta}</p></div>
      </div>`).join('');
    if (window.initReveal) window.initReveal();
  },

  /* ── ÍCONES SOCIAIS ── */
  applyIcons() {
    if (!document.getElementById('cc-icon-styles')) {
      const style = document.createElement('style');
      style.id = 'cc-icon-styles';
      style.textContent = `.cc-icon-wrap{display:inline-flex!important;align-items:center!important;gap:7px!important}.cc-social-icon{flex-shrink:0;vertical-align:middle}`;
      document.head.appendChild(style);
    }

    document.querySelectorAll('[data-wpp]').forEach(el => {
      if (el.querySelector('.cc-social-icon')) return;
      el.classList.add('cc-icon-wrap');
      el.insertAdjacentHTML('afterbegin', `<span style="display:inline-flex;align-items:center;color:#25D366">${CC_ICON_WPP}</span>`);
    });

    document.querySelectorAll('[data-cc="instagram_url"]').forEach(el => {
      if (el.querySelector('.cc-social-icon')) return;
      el.classList.add('cc-icon-wrap');
      el.insertAdjacentHTML('afterbegin', `<span style="display:inline-flex;align-items:center;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${CC_ICON_INSTA}</span>`);
    });

    document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]').forEach(el => {
      if (el.querySelector('.cc-social-icon') || el.dataset.wpp) return;
      el.classList.add('cc-icon-wrap');
      el.insertAdjacentHTML('afterbegin', `<span style="display:inline-flex;align-items:center;color:#25D366">${CC_ICON_WPP}</span>`);
    });

    document.querySelectorAll('a[href*="instagram.com"]').forEach(el => {
      if (el.querySelector('.cc-social-icon') || el.dataset.cc === 'instagram_url') return;
      el.classList.add('cc-icon-wrap');
      el.insertAdjacentHTML('afterbegin', `<span style="display:inline-flex;align-items:center">${CC_ICON_INSTA}</span>`);
    });
  },

  /* ── CRÉDITO RODAPÉ ── */
  applyFooterCredit() {
    if (document.getElementById('cc-dev-credit')) return;
    const credit = document.createElement('p');
    credit.id = 'cc-dev-credit';
    credit.style.cssText = 'text-align:center;font-size:11px;color:#5a7a65;opacity:.7;margin-top:10px;padding:0 16px;font-family:"DM Sans",sans-serif;line-height:1.5';
    credit.innerHTML = `Desenvolvido por <a href="#" rel="noopener" style="color:#22c55e;text-decoration:none;font-weight:600;opacity:1">Albert Antunes</a>`;
    const target = document.querySelector('footer')
      || document.querySelector('.footer')
      || document.querySelector('[data-cc-section="footer"]')
      || document.querySelector('[data-cc="footer_copyright"]')?.closest('section, div')
      || null;
    if (target) target.appendChild(credit);
    else document.body.appendChild(credit);
  },

  /* ── SEO ── */
  async applySEO() {
    try {
      const res = await Api.seo.buscar('home');
      const d = res.data || {};
      if (d.title)         document.title = d.title;
      if (d.description)   document.querySelector('meta[name="description"]')?.setAttribute('content', d.description);
      if (d.canonical_url) {
        const link = document.querySelector('link[rel="canonical"]');
        if (link) link.href = d.canonical_url;
      }
      if (d.og_title)       document.querySelector('meta[property="og:title"]')?.setAttribute('content', d.og_title);
      if (d.og_description) document.querySelector('meta[property="og:description"]')?.setAttribute('content', d.og_description);
    } catch { /* SEO não é crítico */ }
  }
};

/* ── Expõe globalmente ── */
window.CC = CC;

/* ── Auto-init seguro (sem código solto) ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CC.init());
} else {
  CC.init();
}
