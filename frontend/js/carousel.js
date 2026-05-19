/**
 * Casa Certa — Hero Media Carousel
 * Carrega mídias do backend e exibe no hero com transições suaves.
 * Suporta imagens e vídeos.
 */

class HeroCarousel {
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
      if (configRes && configRes.data) Object.assign(this.config, configRes.data);
      const ativos = (mediasRes.data || []).filter(m => m.ativo);
      if (ativos.length === 0) { this._showFallback(); return; }
      this.items = ativos;
      this._build();
      this._show(0);
      if (this.config.autoplay && this.items.length > 1) this._startAutoplay();
    } catch (e) { this._showFallback(); }
  }

  _build() {
    this.container.innerHTML = `
      <div class="hc-track"></div>
      <div class="hc-dots"></div>
      <button class="hc-prev" aria-label="Anterior">&#8249;</button>
      <button class="hc-next" aria-label="Próximo">&#8250;</button>`;
    this.track   = this.container.querySelector('.hc-track');
    this.dotsEl  = this.container.querySelector('.hc-dots');
    this.prevBtn = this.container.querySelector('.hc-prev');
    this.nextBtn = this.container.querySelector('.hc-next');

    this.items.forEach((item, i) => {
      const slide = document.createElement('div');
      slide.className = 'hc-slide';
      if (item.tipo === 'video') {
        slide.innerHTML = `<video src="${item.url}" class="hc-media" autoplay muted loop playsinline></video>`;
      } else {
        slide.innerHTML = `<img src="${item.url}" class="hc-media" alt="${item.titulo || 'Imóvel'}" loading="${i===0?'eager':'lazy'}">`;
      }
      this.track.appendChild(slide);
      if (this.items.length > 1) {
        const dot = document.createElement('button');
        dot.className = 'hc-dot';
        dot.setAttribute('aria-label', `Mídia ${i+1}`);
        dot.addEventListener('click', () => this._goTo(i));
        this.dotsEl.appendChild(dot);
      }
    });

    this.prevBtn.addEventListener('click', () => this._prev());
    this.nextBtn.addEventListener('click', () => this._next());
    if (this.items.length <= 1) { this.prevBtn.style.display='none'; this.nextBtn.style.display='none'; }
    this._injectStyles();
  }

  _show(idx) {
    this.track.querySelectorAll('.hc-slide').forEach((s, i) => {
      s.classList.toggle('hc-active', i === idx);
      const vid = s.querySelector('video');
      if (vid) { i === idx ? vid.play().catch(()=>{}) : vid.pause(); }
    });
    this.dotsEl.querySelectorAll('.hc-dot').forEach((d, i) => d.classList.toggle('hc-dot-active', i === idx));
    this.current = idx;
  }

  _goTo(idx) { this._stopAutoplay(); this._show(idx); if (this.config.autoplay) this._startAutoplay(); }
  _next() { this._goTo((this.current + 1) % this.items.length); }
  _prev() { this._goTo((this.current - 1 + this.items.length) % this.items.length); }
  _startAutoplay() { this._stopAutoplay(); this.timer = setInterval(() => this._next(), this.config.intervalo_ms); }
  _stopAutoplay() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }

  _showFallback() {
    const fb = document.getElementById('heroVisualFallback');
    if (fb) fb.style.display = '';
    if (this.container) this.container.style.display = 'none';
  }

  _injectStyles() {
    if (document.getElementById('hc-styles')) return;
    const s = document.createElement('style');
    s.id = 'hc-styles';
    s.textContent = `
      #heroCarousel{position:relative;width:100%;height:100%;border-radius:var(--r2,22px);overflow:hidden;background:var(--card,#111a14)}
      .hc-track{position:relative;width:100%;height:100%}
      .hc-slide{position:absolute;inset:0;opacity:0;transition:opacity .6s ease;pointer-events:none}
      .hc-slide.hc-active{opacity:1;pointer-events:auto}
      .hc-media{width:100%;height:100%;object-fit:cover;display:block}
      .hc-prev,.hc-next{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.45);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:22px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s}
      #heroCarousel:hover .hc-prev,#heroCarousel:hover .hc-next{opacity:1}
      .hc-prev{left:10px}.hc-next{right:10px}
      .hc-dots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:10}
      .hc-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.4);border:none;cursor:pointer;transition:background .3s,transform .3s}
      .hc-dot.hc-dot-active{background:#22C55E;transform:scale(1.3)}
    `;
    document.head.appendChild(s);
  }
}

document.addEventListener('DOMContentLoaded', () => { window._heroCarousel = new HeroCarousel('heroCarousel'); });
