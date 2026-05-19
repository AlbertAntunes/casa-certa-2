/* ════════════════════════════════════════
   CASA CERTA — admin.js
   Funções compartilhadas de todas as páginas admin.
   ════════════════════════════════════════ */

/* ── AUTH ── */
async function authGuard() {
  const token = localStorage.getItem('cc_token');

  if (!token) {
    window.location.href = '/admin/index.html';
    return null;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error();

    const { data } = await res.json();

    setTimeout(() => {
      document.querySelectorAll('.js-user-name').forEach(el => {
        el.textContent = data.nome || data.email;
      });
    }, 0);

    return data;

  } catch (e) {
    console.error(e);

    localStorage.removeItem('cc_token');
    window.location.href = '/admin/index.html';

    return null;
  }
}

// Alias
const requireAuth = authGuard;

/* ── LOGOUT ── */
function logout() {
  localStorage.removeItem('cc_token');
  window.location.href = '/admin/index.html';
}

/* ── API ── */
async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('cc_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api' + path, {
    ...opts,
    headers
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new Error(
      err.message ||
      `Erro ${res.status}`
    );
  }

  return res.json();
}

// Alias
const api = apiFetch;

/* ── UPLOAD ── */
async function apiUpload(file, bucket = 'imoveis') {
  const token = localStorage.getItem('cc_token');

  const fd = new FormData();

  fd.append('file', file);
  fd.append('bucket', bucket);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: fd
  });

  if (!res.ok) {
    throw new Error('Erro no upload');
  }

  return res.json();
}

/* ── TOAST ── */
(function initToastContainer() {

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createToastContainer);
  } else {
    createToastContainer();
  }

  function createToastContainer() {

    if (document.getElementById('ccToasts')) return;

    const el = document.createElement('div');

    el.id = 'ccToasts';

    el.style.cssText = `
      position:fixed;
      bottom:24px;
      right:24px;
      z-index:9999;
      display:flex;
      flex-direction:column;
      gap:10px;
      pointer-events:none;
    `;

    document.body.appendChild(el);
  }

})();

function toast(msg, type = 'success', duration = 3500) {

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warn: '⚠️'
  };

  const colors = {
    success: 'var(--g400)',
    error: '#ef4444',
    info: '#3b82f6',
    warn: '#f59e0b'
  };

  const el = document.createElement('div');

  el.style.cssText = `
    display:flex;
    align-items:center;
    gap:12px;
    background:var(--card);
    border:1px solid var(--border2);
    border-left:3px solid ${colors[type] || colors.success};
    border-radius:var(--r);
    padding:14px 18px;
    font-size:14px;
    box-shadow:0 8px 32px rgba(0,0,0,.55);
    min-width:280px;
    max-width:380px;
    pointer-events:auto;
    animation:ccToastIn .3s ease;
    font-family:"DM Sans",sans-serif;
    color:var(--text);
  `;

  el.innerHTML = `
    <span style="font-size:16px">
      ${icons[type] || '•'}
    </span>
    <span>${msg}</span>
  `;

  if (!document.getElementById('ccToastKeyframes')) {

    const s = document.createElement('style');

    s.id = 'ccToastKeyframes';

    s.textContent = `
      @keyframes ccToastIn{
        from{
          opacity:0;
          transform:translateX(20px)
        }
        to{
          opacity:1;
          transform:translateX(0)
        }
      }
    `;

    document.head.appendChild(s);
  }

  const container = document.getElementById('ccToasts');

  if (container) {
    container.appendChild(el);
  }

  setTimeout(() => {

    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all .3s';

    setTimeout(() => {
      el.remove();
    }, 300);

  }, duration);
}

/* ── CONFIRM ── */
function confirmDialog(msg) {

  return new Promise(resolve => {

    const ov = document.createElement('div');

    ov.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.7);
      backdrop-filter:blur(4px);
      z-index:10000;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    `;

    ov.innerHTML = `
      <div style="
        background:var(--card);
        border:1px solid var(--border2);
        border-radius:var(--r2);
        width:100%;
        max-width:400px;
        font-family:'DM Sans',sans-serif
      ">
        <div style="
          padding:22px 26px;
          border-bottom:1px solid var(--border)
        ">
          <span style="
            font-family:'Playfair Display',serif;
            font-size:18px;
            font-weight:700;
            color:var(--text)
          ">
            Confirmar ação
          </span>
        </div>

        <div style="padding:20px 26px">
          <p style="
            font-size:15px;
            color:var(--text2);
            margin:0
          ">
            ${msg}
          </p>
        </div>

        <div style="
          padding:14px 26px;
          border-top:1px solid var(--border);
          display:flex;
          gap:10px;
          justify-content:flex-end
        ">
          <button id="ccConfirmNo"
            style="
              padding:9px 18px;
              border-radius:var(--r);
              background:transparent;
              border:1px solid var(--border2);
              color:var(--text2);
              cursor:pointer;
              font-family:inherit;
              font-size:14px;
              font-weight:600
            ">
            Cancelar
          </button>

          <button id="ccConfirmYes"
            style="
              padding:9px 18px;
              border-radius:var(--r);
              background:rgba(239,68,68,.15);
              border:1px solid rgba(239,68,68,.3);
              color:#f87171;
              cursor:pointer;
              font-family:inherit;
              font-size:14px;
              font-weight:600
            ">
            Confirmar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(ov);

    ov.querySelector('#ccConfirmNo').onclick = () => {
      ov.remove();
      resolve(false);
    };

    ov.querySelector('#ccConfirmYes').onclick = () => {
      ov.remove();
      resolve(true);
    };

  });
}

// Alias
const adminConfirm = confirmDialog;

/* ── FORMAT ── */
function fmtPreco(val) {

  if (!val && val !== 0) {
    return '—';
  }

  return 'R$ ' + Number(val).toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: 0
    }
  );
}

function fmtDate(str) {

  if (!str) return '—';

  return new Date(str).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  );
}

const formatPrice = fmtPreco;
const formatDate = fmtDate;

/* ── SIDEBAR ── */
function renderSidebar(activePage) {

  const page =
    activePage ||
    window.location.pathname.split('/').pop();

  const link = (href, icon, label) => {

    const active =
      href === page
        ? 'style="background:rgba(34,197,94,.12);color:var(--g400);font-weight:600"'
        : '';

    return `
      <a href="${href}" class="nav-link" ${active}>
        <span class="ni">${icon}</span>
        ${label}
      </a>
    `;
  };

  return `
  <div class="sidebar" id="sidebar">

    <div class="sidebar-logo">
      <div class="sidebar-logo-text">
        Casa<span style="color:var(--g400)">Certa</span>
      </div>

      <div class="sidebar-logo-sub">
        Painel Administrativo
      </div>
    </div>

    <nav class="sidebar-nav">

      <div class="nav-group">
        <div class="nav-group-label">Geral</div>

        ${link('dashboard.html','📊','Dashboard')}
        ${link('imoveis.html','🏠','Imóveis')}
        ${link('midia.html','🖼️','Mídia da Home')}
      </div>

      <div class="nav-group">
        <div class="nav-group-label">Conteúdo</div>

        ${link('equipe.html','👥','Equipe')}
        ${link('depoimentos.html','⭐','Depoimentos')}
        ${link('faq.html','❓','FAQ')}
        ${link('conteudo.html','✏️','Textos do Site')}
      </div>

      <div class="nav-group">
        <div class="nav-group-label">Sistema</div>

        ${link('contatos.html','📩','Leads')}
        ${link('seo.html','🔍','SEO')}
        ${link('configuracoes.html','⚙️','Configurações')}
      </div>

    </nav>

    <div class="sidebar-footer">

      <div class="sidebar-user">

        <div class="sidebar-avatar" id="sidebarAvatar">
          A
        </div>

        <div class="sidebar-user-info">
          <div class="sidebar-user-name js-user-name">
            Admin
          </div>

          <div class="sidebar-user-role">
            Administrador
          </div>
        </div>

        <button
          onclick="logout()"
          title="Sair"
          style="
            background:none;
            border:none;
            cursor:pointer;
            font-size:18px;
            color:var(--text3);
            padding:4px
          "
        >
          🚪
        </button>

      </div>

    </div>

  </div>`;
}

/* ── INIT SIDEBAR ── */
function initSidebar(activePage) {

  const current =
    activePage ||
    window.location.pathname.split('/').pop();

  document.querySelectorAll('.nav-link').forEach(link => {

    const href = link.getAttribute('href');

    if (
      href === current ||
      href === current + '.html'
    ) {
      link.style.background = 'rgba(34,197,94,.12)';
      link.style.color = 'var(--g400)';
      link.style.fontWeight = '600';
    }
  });
}

/* ── TOPBAR ── */
function renderTopbar(title, actionsHtml = '') {

  return `
  <div class="topbar">

    <button
      onclick="document.getElementById('sidebar').classList.toggle('open')"
      style="
        display:none;
        background:none;
        border:none;
        cursor:pointer;
        font-size:22px;
        color:var(--text);
        padding:4px
      "
      class="mobile-menu-btn"
      id="mobileMenuBtn"
    >
      ☰
    </button>

    <h1 class="topbar-title">
      ${title}
    </h1>

    <div class="topbar-actions">
      ${actionsHtml}
    </div>

  </div>`;
}

/* ── USER UI ── */
function populateUser(user) {

  document.querySelectorAll('.js-user-name').forEach(el => {

    el.textContent =
      user?.nome ||
      user?.email ||
      'Admin';
  });

  const avatar =
    document.getElementById('sidebarAvatar');

  if (avatar) {

    const letra =
      (user?.nome || user?.email || 'A')
      .charAt(0)
      .toUpperCase();

    avatar.textContent = letra;
  }
}

/* ── MODAIS ── */
function openModal(id) {

  const modal =
    document.getElementById(id);

  if (!modal) return;

  modal.classList.add('open');
  modal.style.display = 'flex';

  document.body.style.overflow = 'hidden';
}

function closeModal(id) {

  const modal =
    document.getElementById(id);

  if (!modal) return;

  modal.classList.remove('open');
  modal.style.display = 'none';

  document.body.style.overflow = '';
}

function initModalClose() {

  document.querySelectorAll('.modal-close').forEach(btn => {

    btn.addEventListener('click', () => {

      const modal =
        btn.closest('.modal-overlay');

      if (modal) {
        closeModal(modal.id);
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {

    overlay.addEventListener('click', e => {

      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
}

/* ── MOBILE SIDEBAR ── */
document.addEventListener('DOMContentLoaded', () => {

  const style = document.createElement('style');

  style.textContent = `
    @media(max-width:768px){

      .mobile-menu-btn{
        display:block !important
      }

      .sidebar{
        transform:translateX(-100%)
      }

      .sidebar.open{
        transform:none
      }
    }
  `;

  document.head.appendChild(style);

  document.addEventListener('click', e => {

    const sidebar =
      document.getElementById('sidebar');

    const btn =
      document.getElementById('mobileMenuBtn');

    if (
      sidebar &&
      btn &&
      !sidebar.contains(e.target) &&
      !btn.contains(e.target)
    ) {
      sidebar.classList.remove('open');
    }
  });
});