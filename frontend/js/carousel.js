/* ════════════════════════════════════════
   CASA CERTA — carousel.js (COMPLETO)
   ════════════════════════════════════════ */

if (!window.HeroCarousel) {
  window.HeroCarousel = class HeroCarousel {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;
      this.items   = [];
      this.current = 0;
      this.timer   = null;
      this.config  = { autoplay: true, intervalo_ms: 4000, velocidade_ms: 600 };
      this._init();
    }

    async _init() {
      try {
        const [mediasRes, configRes] = await Promise.all([
          fetch('/api/midias-home').then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/configuracoes/carrossel').then(r => r.json()).catch(() => null)
        ]);

        if (configRes && configRes.data) {
          Object.assign(this.config, configRes.data);
        }

        const ativos = (mediasRes.data || []).filter(m => m.ativo);

        if (ativos.length === 0) { 
          this._showFallback(); 
          return; 
        }

        this.items = ativos;
        this._build();
        this._show(0);

        if (this.config.autoplay && this.items.length > 1) {
          this._startAutoplay();
        }
      } catch (e) { 
        console.error("Erro ao inicializar HeroCarousel:", e);
        this._showFallback(); 
      }
    }

    /* ── MÉTODOS INTERNOS (PRESERVADOS) ── */

    _build() {
  if (!this.container) return;
  
  // Força o container principal a ter uma altura e posicionamento visíveis
  this.container.style.position = 'relative';
  this.container.style.width = '100%';
  this.container.style.minHeight = '400px'; 
  this.container.style.overflow = 'hidden';
  this.container.style.borderRadius = 'var(--r, 14px)';

  // Cria a estrutura interna de slides
  const trackHtml = this.items.map((item, idx) => `
    <div class="carousel-slide ${idx === 0 ? 'active' : ''}" 
         style="
           position: ${idx === 0 ? 'relative' : 'absolute'}; 
           top: 0; left: 0; width: 100%; height: 100%; 
           opacity: ${idx === 0 ? '1' : '0'}; 
           transition: opacity ${this.config.velocidade_ms}ms ease;
           display: ${idx === 0 ? 'block' : 'none'};
         ">
      <img src="${item.url}" alt="${item.titulo || 'Banner'}" 
           style="width: 100%; height: 450px; object-fit: cover; display: block;">
      
    </div>
  `).join('');

  // Monta o restante do esqueleto do carrossel
  this.container.innerHTML = `
    <div class="carousel-track" style="width: 100%; height: 100%;">${trackHtml}</div>
    ${this.items.length > 1 ? `
      <button class="carousel-control prev" onclick="document.getElementById('${this.container.id}').__carousel.prev()" style="position: absolute; top: 50%; left: 16px; transform: translateY(-50%); z-index: 10; background: rgba(0,0,0,0.5); color: #fff; border: none; padding: 12px; cursor: pointer; border-radius: 50%;">❮</button>
      <button class="carousel-control next" onclick="document.getElementById('${this.container.id}').__carousel.next()" style="position: absolute; top: 50%; right: 16px; transform: translateY(-50%); z-index: 10; background: rgba(0,0,0,0.5); color: #fff; border: none; padding: 12px; cursor: pointer; border-radius: 50%;">❯</button>
    ` : ''}
  `;
  
  this.container.__carousel = this;
}

    _show(index) {
  const slides = this.container.querySelectorAll('.carousel-slide');
  if (!slides.length) return;

  if (index >= this.items.length) this.current = 0;
  else if (index < 0) this.current = this.items.length - 1;
  else this.current = index;

  slides.forEach((slide, idx) => {
    if (idx === this.current) {
      slide.style.display = 'block';
      setTimeout(() => {
        slide.style.opacity = '1';
        slide.style.position = 'relative';
      }, 10);
    } else {
      slide.style.opacity = '0';
      slide.style.display = 'none';
      slide.style.position = 'absolute';
    }
  });
}
    next() {
      this._stopAutoplay();
      this._show(this.current + 1);
      if (this.config.autoplay) this._startAutoplay();
    }

    prev() {
      this._stopAutoplay();
      this._show(this.current - 1);
      if (this.config.autoplay) this._startAutoplay();
    }

    _startAutoplay() {
      this.timer = setInterval(() => {
        this._show(this.current + 1);
      }, this.config.intervalo_ms);
    }

    _stopAutoplay() {
      if (this.timer) clearInterval(this.timer);
    }

    _showFallback() {
      if (!this.container) return;
      this.container.innerHTML = `
        <div class="carousel-fallback" style="background: var(--bg2); height: 450px; display: flex; align-items: center; justify-content: center; color: var(--text3);">
          <h2>Casa Certa Imóveis</h2>
        </div>
      `;
    }
  };
}