/**
 * Casa Certa ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Site Initializer
 * Injeta dados dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢micos da API no HTML existente sem alterar o visual.
 * Carregado apÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³s o DOM estar pronto.
 */

const CC = {

  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ INIT ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
  async init() {
    try {
      const [cfgRes, imoveisRes, equipeRes, midiaRes, marqRes, faqRes] = await Promise.allSettled([
        fetch('/api/configuracoes').then(r => r.json()),
        fetch('/api/imoveis?status=ativo').then(r => r.json()),
        fetch('/api/equipe').then(r => r.json()),
        fetch('/api/midias-home').then(r => r.json()),
        fetch('/api/configuracoes/marquee_itens').then(r => r.json()),
        fetch('/api/faq').then(r => r.json()),
      ]);

      const cfg     = cfgRes.status === 'fulfilled'     ? CC._cfgMap(cfgRes.value.data || []) : {};
      const imoveis = imoveisRes.status === 'fulfilled'  ? (imoveisRes.value.data || []) : [];
      const equipe  = equipeRes.status === 'fulfilled'   ? (equipeRes.value.data || []) : [];
      const faq     = faqRes.status === 'fulfilled'      ? (faqRes.value.data || []) : [];

      try { CC.applyConfig(cfg); } catch (e) { console.warn('[CasaCerta] applyConfig falhou:', e); }
      try { CC.applyImoveis(imoveis); } catch (e) { console.warn('[CasaCerta] applyImoveis falhou:', e); }
      try { CC.applyEquipe(equipe); } catch (e) { console.warn('[CasaCerta] applyEquipe falhou:', e); }
      try { CC.applyFaq(faq); } catch (e) { console.warn('[CasaCerta] applyFaq falhou:', e); }
      try { CC.applyMarquee(cfg.marquee_itens); } catch (e) { console.warn('[CasaCerta] applyMarquee falhou:', e); }
      try { CC.applySEO(); } catch (e) { console.warn('[CasaCerta] applySEO falhou:', e); }
    } catch (e) {
      console.warn('[CasaCerta] Falha ao carregar dados:', e);
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

  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ CONFIG / TEXTOS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
  applyConfig(cfg) {
    const set = (sel, val, attr = 'textContent') => {
      if (!val) return;
      document.querySelectorAll(sel).forEach(el => {
        if (attr === 'textContent') el.textContent = val;
        else if (attr === 'href') el.href = val;
        else el.setAttribute(attr, val);
      });
    };

    // Hero textos
    if (cfg.hero_badge)         set('[data-cc="hero_badge"]',         cfg.hero_badge);
    if (cfg.hero_titulo_linha1) set('[data-cc="hero_titulo_linha1"]', cfg.hero_titulo_linha1);
    if (cfg.hero_titulo_linha2) set('[data-cc="hero_titulo_linha2"]', cfg.hero_titulo_linha2);
    if (cfg.hero_localizacao)   set('[data-cc="hero_localizacao"]',   cfg.hero_localizacao);

    // Hero stats
    if (cfg.hero_stat_1_num)   set('[data-cc="hero_stat_1_num"]',   cfg.hero_stat_1_num);
    if (cfg.hero_stat_1_label) set('[data-cc="hero_stat_1_label"]', cfg.hero_stat_1_label);
    if (cfg.hero_stat_2_num)   set('[data-cc="hero_stat_2_num"]',   cfg.hero_stat_2_num);
    if (cfg.hero_stat_2_label) set('[data-cc="hero_stat_2_label"]', cfg.hero_stat_2_label);
    if (cfg.hero_stat_3_num)   set('[data-cc="hero_stat_3_num"]',   cfg.hero_stat_3_num);
    if (cfg.hero_stat_3_label) set('[data-cc="hero_stat_3_label"]', cfg.hero_stat_3_label);

    // Hero badges flutuantes
    if (cfg.hero_badge_imoveis) set('[data-cc="hero_badge_imoveis"]', cfg.hero_badge_imoveis);
    if (cfg.hero_badge_chaves)  set('[data-cc="hero_badge_chaves"]',  cfg.hero_badge_chaves);

    // WhatsApp links
    const wppDiogo   = cfg.whatsapp_diogo   || '5588981545786';
    const wppSalomao = cfg.whatsapp_salomao || '5588997137356';
    window.WPP_DIOGO   = wppDiogo;
    window.WPP_SALOMAO = wppSalomao;
    document.querySelectorAll('[data-wpp="diogo"]').forEach(el => {
      el.href = `https://wa.me/${wppDiogo}`;
    });
    document.querySelectorAll('[data-wpp="salomao"]').forEach(el => {
      el.href = `https://wa.me/${wppSalomao}`;
    });

    // Instagram
    if (cfg.instagram_url) {
      document.querySelectorAll('[data-cc="instagram_url"]').forEach(el => el.href = cfg.instagram_url);
    }

    // Frases tipadas (typed effect)
    if (Array.isArray(cfg.hero_frases_tipadas) && window._typedStrings) {
      window._typedStrings = cfg.hero_frases_tipadas;
    }

    // Footer
    if (cfg.footer_descricao)  set('[data-cc="footer_descricao"]',  cfg.footer_descricao);
    if (cfg.footer_copyright)  set('[data-cc="footer_copyright"]',  cfg.footer_copyright);

    // Diferenciais
    [1,2,3,4].forEach(n => {
      if (cfg[`diferencial_${n}_titulo`]) set(`[data-cc="diferencial_${n}_titulo"]`, cfg[`diferencial_${n}_titulo`]);
      if (cfg[`diferencial_${n}_desc`])   set(`[data-cc="diferencial_${n}_desc"]`,   cfg[`diferencial_${n}_desc`]);
    });

    // Passos
    [1,2,3].forEach(n => {
      if (cfg[`passo_${n}_titulo`]) set(`[data-cc="passo_${n}_titulo"]`, cfg[`passo_${n}_titulo`]);
      if (cfg[`passo_${n}_desc`])   set(`[data-cc="passo_${n}_desc"]`,   cfg[`passo_${n}_desc`]);
    });
  },

  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ IMÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œVEIS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
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
      const tipo = ['venda', 'aluguel', 'terreno'].includes(im?.tipo) ? im.tipo : 'venda';
      const gradient = im.cor_card || gradients[i % gradients.length];
      const badgeClass = tipo === 'venda' ? 'venda' : tipo === 'aluguel' ? 'aluguel' : 'terreno';
      const preco = im.preco
        ? `R$ ${Number(im.preco).toLocaleString('pt-BR')}${im.preco_periodo || ''}`
        : 'Consulte';

      const meta = [
        im.bairro    ? `<span class="prop-tag">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â ${im.bairro}</span>` : '',
        im.quartos   ? `<span class="prop-tag">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂºÃƒâ€šÃ‚Â ${im.quartos} qtos</span>` : '',
        im.metragem  ? `<span class="prop-tag">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â ${im.metragem}mÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²</span>` : '',
        im.vagas     ? `<span class="prop-tag">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ${im.vagas} vaga${im.vagas>1?'s':''}</span>` : '',
      ].join('');

      const capaUrl = typeof im.capa_url === 'string' ? im.capa_url : '';
      const imgHtml = capaUrl
        ? `<img src="${im.capa_url}" alt="${im.titulo}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`
        : `<div class="emoji">${im.emoji || 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Â '}</div>`;

      const wpp = `https://wa.me/${window.WPP_DIOGO||'5588981545786'}?text=OlÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡!%20Tenho%20interesse%20no%20imÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³vel:%20${encodeURIComponent(im.titulo)}`;

      return `
        <div class="prop-card reveal" data-type="${tipo}" data-id="${im.id}">
          <div class="prop-photo" style="background:${gradient}">
            ${imgHtml}
            <div class="p-overlay"></div>
            <span class="prop-badge ${badgeClass}">${tipo.charAt(0).toUpperCase()+tipo.slice(1)}</span>
            <button class="prop-fav" onclick="toggleFav(this)">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ãƒâ€šÃ‚Â¡</button>
          </div>
          <div class="prop-body">
            <div class="prop-title">${im.titulo}</div>
            <div class="prop-meta">${meta}</div>
            <div class="prop-price">${preco}</div>
            <div class="prop-actions">
              <button class="btn-sm btn-sm-green" onclick="window.open('${wpp}','_blank')">Ver Mais ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢</button>
              <button class="btn-sm btn-sm-wpp" onclick="window.open('${wpp}','_blank')">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â¬ Wpp</button>
            </div>
          </div>
        </div>`;
    }).join('');

    // Re-bind filter tabs
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

    // Re-trigger reveal animations
    if (window.initReveal) window.initReveal();
  },
  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ EQUIPE ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
  applyEquipe(list) {
    const container = document.querySelector('.team-grid, .equipe-grid, [data-cc-section="equipe"]');
    if (!container || !list.length) return;

    const ativos = list.filter(c => c.ativo !== false);
    if (!ativos.length) return;

    container.innerHTML = ativos.map((c, idx) => {
      const iniciais = c.avatar_iniciais || (c.nome || 'CC').slice(0, 2).toUpperCase();
      const avatarCor = c.avatar_cor || 'linear-gradient(135deg,#22C55E,#065f46)';
      const fotoHtml = c.foto_url
        ? `<img src="${c.foto_url}" alt="${c.nome} - Corretor Casa Certa">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:56px;background:var(--bg3)">${iniciais}</div>`;
      const whatsapp = (c.whatsapp || '').replace(/\D/g, '');
      const instagramAction = c.instagram ? `window.open('${c.instagram}','_blank')` : 'openInsta()';
      const fallbackWppFn = idx % 2 === 0 ? 'openWppDiogo()' : 'openWppSalomao()';
      const wppAction = whatsapp ? `window.open('https://wa.me/${whatsapp}','_blank')` : fallbackWppFn;

      return `
      <div class="broker-card reveal visible ${idx % 2 === 0 ? 'from-left' : 'from-right'}">
        <div class="broker-photo-wrap">
          ${fotoHtml}
          <div class="broker-photo-overlay"></div>
          <div class="broker-avatar" style="position:absolute;bottom:-36px;left:24px;background:${avatarCor}">${iniciais}</div>
        </div>
        <div class="broker-body">
          <div class="broker-name">${c.nome || 'Corretor'}</div>
          <div class="broker-role">${c.cargo || 'Corretor de Imoveis'}</div>
          <div class="broker-creci">CRECI ${c.creci || '-'}</div>
          <p class="broker-bio">${c.bio || 'Atendimento personalizado para compra e venda de imoveis em Quixada e regiao.'}</p>
          <div class="broker-stats">
            <div class="bk-stat"><div class="bk-stat-val">${c.anos_experiencia || 0}+</div><div class="bk-stat-label">Anos exp.</div></div>
            <div class="bk-stat"><div class="bk-stat-val">${c.clientes_atendidos || 0}+</div><div class="bk-stat-label">Clientes</div></div>
            <div class="bk-stat"><div class="bk-stat-val">${c.avaliacao || 4.9}*</div><div class="bk-stat-label">Avaliacao</div></div>
          </div>
          <div class="broker-btns">
            <button class="btn-wpp-broker" onclick="${wppAction}">WhatsApp</button>
            <button class="btn-insta-broker" onclick="${instagramAction}">Instagram</button>
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
      <div class="broker-option" onclick="selectBroker('${c.whatsapp||''}')">
        ${c.foto_url
          ? `<img src="${c.foto_url}" class="broker-avatar-img" alt="${c.nome}">`
          : `<div class="broker-avatar" style="background:${c.avatar_cor||'linear-gradient(135deg,#22C55E,#065f46)'}">${c.avatar_iniciais||c.nome.slice(0,2).toUpperCase()}</div>`}
        <div>
          <div class="broker-name">${c.nome}</div>
          <div class="broker-creci">CRECI ${c.creci||'-'}</div>
        </div>
      </div>`).join('');
  },

  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ MARQUEE ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
  applyMarquee(items) {
    const track = document.getElementById('marqueeTrack');
    if (!track || !items) return;
    let list = [];
    try { list = Array.isArray(items) ? items : JSON.parse(items); } catch { return; }
    if (!list.length) return;
    // Duplicate for infinite scroll
    const all = [...list, ...list];
    track.innerHTML = all.map(t => `<span class="marquee-item">${t}</span>`).join('');
  },

  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ FAQ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
  applyFaq(list) {
    const container = document.querySelector('.faq-list, [data-cc-section="faq"]');
    if (!container || !list.length) return;
    container.innerHTML = list.filter(f => f.ativo !== false).map((f, i) => `
      <div class="faq-item reveal">
        <button class="faq-q" onclick="this.closest('.faq-item').classList.toggle('open')">
          <span>${String(i+1).padStart(2,'0')}. ${f.pergunta}</span>
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-a"><p>${f.resposta}</p></div>
      </div>`).join('');
    if (window.initReveal) window.initReveal();
  },

  /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ SEO ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
  async applySEO() {
    try {
      const res = await fetch('/api/seo/home').then(r => r.json());
      const d = res.data || {};
      if (d.title)       document.title = d.title;
      if (d.description) document.querySelector('meta[name="description"]')?.setAttribute('content', d.description);
      if (d.canonical_url) {
        const link = document.querySelector('link[rel="canonical"]');
        if (link) link.href = d.canonical_url;
      }
      if (d.og_title) document.querySelector('meta[property="og:title"]')?.setAttribute('content', d.og_title);
      if (d.og_description) document.querySelector('meta[property="og:description"]')?.setAttribute('content', d.og_description);
    } catch {}
  }
};

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CC.init());
} else {
  CC.init();
}

window.CC = CC;
