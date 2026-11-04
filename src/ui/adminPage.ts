import { getMessages, type Locale } from "../i18n";

function toScriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function renderAdminPage(locale: Locale, nonce?: string): string {
  const m = getMessages(locale).admin;
  const i18nJson = toScriptJson(m);
  const nonceAttr = nonce ? ` nonce="${nonce}"` : "";
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${m.title}</title>
  <style${nonceAttr}>
    :root {
      --bg: #0b0f19;
      --bg-radial: radial-gradient(circle at 50% 0%, #1e293b 0%, #0b0f19 80%);
      --surface: #131b2e;
      --surface-hover: #1e293b;
      --surface-elevated: #1a243b;
      --text: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --primary-soft: rgba(99, 102, 241, 0.15);
      --primary-border: rgba(99, 102, 241, 0.3);
      --accent: #10b981;
      --danger: #ef4444;
      --danger-hover: #dc2626;
      --border: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(99, 102, 241, 0.5);
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
      --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
      --shadow-lg: 0 12px 32px rgba(0,0,0,0.5);
      --radius: 12px;
      --radius-sm: 8px;
      --radius-full: 9999px;
      --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: var(--bg);
      background-image: var(--bg-radial);
      background-attachment: fixed;
      color: var(--text);
      min-height: 100vh;
      padding: 32px 16px;
      display: flex;
      flex-direction: column;
    }
    .wrap { max-width: 1080px; width: 100%; margin: 0 auto; }
    .header-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .brand-group { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      color: #fff; flex-shrink: 0;
    }
    .brand-icon svg { width: 22px; height: 22px; }
    .title { color: #f8fafc; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    .subtitle { color: var(--text-secondary); margin: 3px 0 0; font-size: 13px; }
    .subtitle a { color: #818cf8; text-decoration: none; transition: var(--transition); }
    .subtitle a:hover { color: #a5b4fc; text-decoration: underline; }

    /* Card styling */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 24px;
      margin-bottom: 18px;
      transition: var(--transition);
      backdrop-filter: blur(12px);
    }
    .hidden { display: none !important; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .row-between { justify-content: space-between; }
    .text-secondary { color: var(--text-secondary); font-size: 13px; margin: 0; }
    .ok { color: var(--accent); }
    .err { color: var(--danger); }

    /* Forms & Inputs */
    input, button, select {
      font-size: 14px;
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      border: 1px solid var(--border);
      background: var(--surface-elevated);
      color: var(--text);
      font-family: inherit;
      transition: var(--transition);
    }
    input::placeholder { color: var(--text-muted); }
    input:focus, select:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
      background: #1e293b;
    }
    button {
      cursor: pointer;
      background: var(--primary);
      color: #ffffff;
      font-weight: 600;
      border: 1px solid transparent;
      box-shadow: var(--shadow-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    button:hover { background: var(--primary-hover); transform: translateY(-1px); }
    button:active { transform: translateY(0); }
    button.secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #e2e8f0;
      border: 1px solid var(--border);
    }
    button.secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
    }
    button.danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    button.danger:hover {
      background: var(--danger);
      color: #ffffff;
      border-color: var(--danger);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      background: var(--primary-soft);
      color: #818cf8;
      border: 1px solid var(--primary-border);
      font-weight: 500;
    }
    .badge-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    /* Auth Card View */
    .login-box {
      max-width: 440px;
      margin: 60px auto;
      padding: 36px 32px;
      text-align: center;
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      background: var(--surface);
    }
    .login-icon {
      width: 56px; height: 56px; margin: 0 auto 20px;
      border-radius: 14px;
      background: linear-gradient(135deg, #6366f1, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
      color: #fff;
    }
    .login-box h3 { margin: 0 0 8px; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; color: #f8fafc; }
    .login-box p.desc { color: var(--text-secondary); font-size: 13px; margin: 0 0 24px; line-height: 1.5; }
    .login-form { display: flex; flex-direction: column; gap: 14px; }
    .login-form input { width: 100%; }
    .login-form button { width: 100%; padding: 12px; font-size: 15px; }

    /* Table styling */
    .table-container {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;
      margin-top: 16px;
      background: var(--surface-elevated);
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td {
      padding: 12px 16px;
      font-size: 13px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
      font-variant-numeric: tabular-nums;
    }
    th {
      background: rgba(0, 0, 0, 0.25);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tr:last-child td { border-bottom: none; }
    tbody tr { transition: background var(--transition); }
    tbody tr:hover { background: rgba(255, 255, 255, 0.03); }
    .action-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .action-row input { min-width: 170px; max-width: 220px; padding: 6px 10px; font-size: 13px; }
    .action-row button { padding: 6px 12px; font-size: 13px; }

    /* Toast Notification */
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 9999;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      min-width: 280px;
      max-width: 420px;
      padding: 12px 18px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: opacity 0.2s, transform 0.2s;
    }
    .toast.toast-ok {
      background: #064e3b;
      color: #6ee7b7;
      border: 1px solid #059669;
    }
    .toast.toast-err {
      background: #450a0a;
      color: #fca5a5;
      border: 1px solid #b91c1c;
    }
    .toast.toast-info {
      background: #1e1b4b;
      color: #c7d2fe;
      border: 1px solid #4f46e5;
    }
    @keyframes toastIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @media (max-width: 768px) {
      .header-nav { flex-direction: column; align-items: flex-start; gap: 14px; }
      .login-box { margin: 20px auto; padding: 24px 20px; }
      .action-row input { min-width: 100%; max-width: 100%; }
      .action-row { width: 100%; }
      .action-row button { flex: 1; }
    }
  </style>
</head>
<body>
  <div class="toast-container" id="toastContainer"></div>

  <div class="wrap">
    <!-- Unauthenticated View -->
    <section class="login-box" id="loginCard">
      <div class="login-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h3>${m.heading}</h3>
      <p class="desc">${m.subtitle} <a href="/">/</a></p>
      <form class="login-form" id="loginForm" action="javascript:;">
        <input id="token" type="password" placeholder="${m.tokenPlaceholder}" required autofocus />
        <button id="loginBtn" type="submit">${m.loginButton}</button>
      </form>
    </section>

    <!-- Authenticated Admin Console -->
    <section class="hidden" id="adminCard">
      <header class="header-nav">
        <div class="brand-group">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div>
            <h1 class="title">${m.heading}</h1>
            <p class="subtitle">${m.subtitle} <a href="/">/</a></p>
          </div>
        </div>
        <div class="row">
          <span class="badge"><span class="badge-dot"></span>${m.adminSession}</span>
          <select id="dateFmtSelect" style="padding:6px 10px;font-size:12px;">
            <option value="locale">Locale</option>
            <option value="short">DD.MM.YYYY, HH:mm</option>
            <option value="iso">ISO 8601</option>
          </select>
          <button id="refreshBtn" class="secondary" title="${m.refreshButton}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            ${m.refreshButton}
          </button>
          <button id="logoutBtn" class="secondary" title="${m.logoutButton}">${m.logoutButton}</button>
        </div>
      </header>

      <section class="card hidden" id="initCard">
        <div style="display:flex; align-items:flex-start; gap:16px;">
          <div style="color:#f59e0b; padding-top:2px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div style="flex:1;">
            <h4 style="margin:0 0 6px; font-size:16px; color:#fbbf24;">${m.initTitle}</h4>
            <p class="text-secondary" style="margin:0 0 14px;" id="initDesc">${m.initDescription}</p>
            <button id="initBtn">${m.initButton}</button>
          </div>
        </div>
      </section>

      <section class="card" id="usersTableWrap">
        <div class="row row-between" style="margin-bottom:14px;">
          <h3 style="margin:0; font-size:17px; font-weight:600;">${m.userManagement}</h3>
          <p id="adminInfo" class="text-secondary" style="margin:0; font-size:12px;"></p>
        </div>
        <div class="table-container" style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th style="width:70px;">${m.tableId}</th>
                <th>${m.tableUsername}</th>
                <th style="width:190px;">${m.tableCreatedAt}</th>
                <th style="width:380px;">${m.tableActions}</th>
              </tr>
            </thead>
            <tbody id="usersBody"></tbody>
          </table>
        </div>
      </section>
    </section>
  </div>

  <script${nonceAttr}>
    const I18N = ${i18nJson};
    const MS_PER_SECOND = 1000;
    const DATE_FORMATS = {
      locale: (d, locale) => d.toLocaleString(locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US'),
      short: (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
      },
      iso: (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
      },
    };
    let dateFmt = localStorage.getItem('koreader_date_format') || 'locale';
    const loginCard = document.getElementById('loginCard');
    const adminCard = document.getElementById('adminCard');
    const initCard = document.getElementById('initCard');
    const usersTableWrap = document.getElementById('usersTableWrap');

    function toast(text, type = 'info', duration = 3500) {
      const container = document.getElementById('toastContainer');
      const el = document.createElement('div');
      el.className = 'toast toast-' + (type === 'error' ? 'err' : type === 'success' ? 'ok' : 'info');
      el.textContent = text;
      container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        setTimeout(() => el.remove(), 200);
      }, duration);
    }

    function escapeHtml(value) {
      return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    function formatDate(epochSec) {
      const sec = Number(epochSec || 0);
      if (!sec) return '-';
      const locale = document.documentElement.lang || 'en';
      const fn = DATE_FORMATS[dateFmt] || DATE_FORMATS.locale;
      return fn(new Date(sec * MS_PER_SECOND), locale);
    }

    function isDbNotInitializedError(error) {
      return Boolean(error && typeof error === 'object' && error.code === 'DB_NOT_INITIALIZED');
    }

    async function jsonFetch(url, options = {}) {
      const res = await fetch(url, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || I18N.requestFailed);
        err.code = data.code;
        throw err;
      }
      return data;
    }

    async function loadInitStatus() {
      const status = await jsonFetch('/admin/init/status');
      if (status.initialized) {
        initCard.classList.add('hidden');
        usersTableWrap.classList.remove('hidden');
        await loadUsers();
        return;
      }
      initCard.classList.remove('hidden');
      usersTableWrap.classList.add('hidden');
      toast(I18N.initRequired, 'error');
    }

    async function loadAdmin() {
      try {
        await jsonFetch('/admin/me');
        loginCard.classList.add('hidden');
        adminCard.classList.remove('hidden');
        document.getElementById('adminInfo').textContent = I18N.statusLoggedIn;
        await loadInitStatus();
      } catch (e) {
        if (isDbNotInitializedError(e)) {
          loginCard.classList.add('hidden');
          adminCard.classList.remove('hidden');
          document.getElementById('adminInfo').textContent = I18N.statusLoggedIn;
          initCard.classList.remove('hidden');
          usersTableWrap.classList.add('hidden');
          toast(I18N.initRequired, 'error');
          return;
        }
        loginCard.classList.remove('hidden');
        adminCard.classList.add('hidden');
      }
    }

    async function loadUsers() {
      const data = await jsonFetch('/admin/users');
      const tbody = document.getElementById('usersBody');
      tbody.innerHTML = '';
      for (const item of data.items || []) {
        const tr = document.createElement('tr');
        const createdAt = formatDate(item.created_at);
        tr.innerHTML =
          '<td style="color:var(--text-muted); font-weight:600;">#' + Number(item.id) + '</td>' +
          '<td><strong style="color:#f8fafc;">' + escapeHtml(item.username) + '</strong></td>' +
          '<td style="color:var(--text-secondary); font-size:12px;">' + createdAt + '</td>' +
          '<td><div class="action-row">' +
            '<input data-kind="password" type="password" aria-label="' + I18N.passwordAriaLabel + ' ' + escapeHtml(item.username) + '（ID: ' + Number(item.id) + '）" placeholder="' + I18N.passwordPlaceholder + '" />' +
            '<button data-kind="reset" data-id="' + Number(item.id) + '">' + I18N.resetPasswordButton + '</button>' +
            '<button class="danger" data-kind="delete" data-id="' + Number(item.id) + '">' + I18N.deleteUserButton + '</button>' +
          '</div></td>';
        tbody.appendChild(tr);
      }
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = document.getElementById('token').value;
      try {
        await jsonFetch('/admin/auth/login', { method: 'POST', body: JSON.stringify({ token }) });
        toast(I18N.loginSuccess, 'success');
        await loadAdmin();
      } catch (e) {
        toast(e.message, 'error');
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await jsonFetch('/admin/auth/logout', { method: 'POST', body: '{}' });
      await loadAdmin();
    });

    document.getElementById('refreshBtn').addEventListener('click', async () => {
      try {
        await loadInitStatus();
        toast('已刷新', 'info', 1500);
      } catch {}
    });

    const dateFmtEl = document.getElementById('dateFmtSelect');
    if (dateFmtEl) {
      dateFmtEl.value = dateFmt;
      dateFmtEl.addEventListener('change', () => {
        localStorage.setItem('koreader_date_format', dateFmtEl.value);
        dateFmt = dateFmtEl.value;
        loadUsers();
      });
    }

    document.getElementById('initBtn').addEventListener('click', async () => {
      try {
        await jsonFetch('/admin/init', { method: 'POST', body: '{}' });
        toast(I18N.initSuccess, 'success');
        await loadInitStatus();
      } catch (e) {
        toast(e.message, 'error');
      }
    });

    document.getElementById('usersBody').addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const kind = target.getAttribute('data-kind');
      const id = Number(target.getAttribute('data-id'));
      if (!Number.isInteger(id) || id <= 0) return;

      try {
        if (kind === 'delete') {
          if (!confirm(I18N.confirmDeletePrefix + id + I18N.confirmDeleteSuffix)) return;
          await jsonFetch('/admin/users/' + id, { method: 'DELETE' });
          toast(I18N.deleteSuccessPrefix + id, 'success');
        } else if (kind === 'reset') {
          const row = target.closest('tr');
          const input = row ? row.querySelector('input[data-kind="password"]') : null;
          const password = input ? input.value : '';
          await jsonFetch('/admin/users/' + id + '/password', { method: 'PUT', body: JSON.stringify({ password }) });
          if (input) input.value = '';
          toast(I18N.resetSuccessPrefix + id, 'success');
        }
        await loadUsers();
      } catch (e) {
        toast(e.message, 'error');
      }
    });

    loadAdmin();
  </script>
</body>
</html>`;
}
