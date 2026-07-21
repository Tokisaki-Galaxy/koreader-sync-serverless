import { getMessages } from "../i18n";
function toScriptJson(value) {
    return JSON.stringify(value).replaceAll("<", "\\u003c");
}
export function renderAdminPage(locale) {
    const m = getMessages(locale).admin;
    const i18nJson = toScriptJson(m);
    return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${m.title}</title>
  <style>
    :root {
      --bg: #0f172a;
      --surface: rgba(255,255,255,.92);
      --surface-hover: rgba(255,255,255,.97);
      --text: #1a2332;
      --text-secondary: #64748b;
      --primary: #3b82f6;
      --primary-soft: #dbeafe;
      --primary-hover: #2563eb;
      --accent: #10b981;
      --danger: #ef4444;
      --border: #e2e8f0;
      --shadow-sm: 0 1px 2px 0 rgba(0,0,0,.08);
      --shadow-md: 0 4px 12px rgba(0,0,0,.12);
      --shadow-lg: 0 8px 24px rgba(0,0,0,.18);
      --radius: 10px;
      --radius-sm: 6px;
      --radius-full: 999px;
      --transition: .15s ease;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: linear-gradient(135deg, #0b1220, #111827);
      color: var(--text);
      min-height: 100vh;
      padding: 28px 16px;
    }
    .wrap { max-width: 1120px; margin: 0 auto; }
    .title { color: #e2e8f0; margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -.02em; }
    .subtitle { color: #94a3b8; margin: 0 0 18px; font-size: 14px; }
    .card {
      background: var(--surface);
      border: 1px solid rgba(255,255,255,.25);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      padding: 16px;
      margin-bottom: 14px;
      transition: box-shadow var(--transition);
    }
    .card:hover { box-shadow: var(--shadow-lg); }
    .hidden { display: none !important; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .row-between { justify-content: space-between; }
    .text-secondary { color: var(--text-secondary); font-size: 13px; margin: 0; }
    .ok { color: var(--accent); }
    .err { color: var(--danger); }
    input, button, select {
      font-size: 14px;
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      border: 1px solid var(--border);
      font-family: inherit;
      transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
    }
    input:focus, select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,.2); }
    button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
    input, select { min-width: 280px; }
    button {
      cursor: pointer;
      background: var(--primary);
      color: #fff;
      font-weight: 600;
      border: 1px solid var(--primary);
    }
    button:hover { background: var(--primary-hover); }
    button:active { transform: scale(.97); }
    button.secondary { background: #475569; border-color: #475569; }
    button.secondary:hover { background: #5a6a82; }
    button.danger { background: var(--danger); border-color: var(--danger); }
    button.danger:hover { background: #dc2626; }
    .badge {
      display: inline-block; font-size: 12px; padding: 3px 10px; border-radius: var(--radius-full);
      background: var(--primary-soft); color: var(--primary); font-weight: 600;
    }
    table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: var(--radius); overflow: hidden; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: middle; }
    th { background: #f8fafc; color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; position: sticky; top: 0; }
    tr:last-child td { border-bottom: none; }
    tbody tr { transition: background var(--transition); }
    tbody tr:hover { background: #f1f5f9; }
    .action-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .action-row input { min-width: 170px; max-width: 220px; }
    @media (max-width: 760px) {
      .title { font-size: 24px; }
      input { min-width: 100%; }
      .action-row input { min-width: 100%; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1 class="title">${m.heading}</h1>
    <p class="subtitle">${m.subtitle}<a href="/" style="color:#93c5fd;">/</a></p>

    <section class="card" id="loginCard">
      <h3 style="margin-top:0;">${m.loginSection}</h3>
      <div class="row">
        <input id="token" type="password" placeholder="${m.tokenPlaceholder}" />
        <button id="loginBtn">${m.loginButton}</button>
      </div>
      <p id="loginMsg" class="text-secondary" style="margin-top:8px;"></p>
    </section>

    <section class="card hidden" id="adminCard">
      <div class="row" style="justify-content:space-between;">
        <div class="row">
          <h3 style="margin:0;">${m.userManagement}</h3>
          <span class="badge">${m.adminSession}</span>
        </div>
        <div class="row">
          <label style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
            <select id="dateFmtSelect" style="padding:4px 8px;font-size:12px;min-width:auto;border-radius:6px;border:1px solid var(--border);background:#fff;">
              <option value="locale">Locale</option>
              <option value="short">DD.MM.YYYY, HH:mm</option>
              <option value="iso">ISO 8601</option>
            </select>
          </label>
          <button id="refreshBtn" class="secondary">${m.refreshButton}</button>
          <button id="logoutBtn" class="secondary">${m.logoutButton}</button>
        </div>
      </div>
      <p id="adminInfo" class="text-secondary" style="margin-top:8px;"></p>
      <section class="card hidden" id="initCard" style="margin-top:10px;">
        <h4 style="margin:0 0 8px;">${m.initTitle}</h4>
        <p class="text-secondary" style="margin:0 0 10px;" id="initDesc">${m.initDescription}</p>
        <div class="row">
          <button id="initBtn">${m.initButton}</button>
        </div>
      </section>
      <div id="usersTableWrap" style="overflow:auto; margin-top:10px; max-height:580px;">
        <table>
          <thead>
            <tr><th>${m.tableId}</th><th>${m.tableUsername}</th><th>${m.tableCreatedAt}</th><th>${m.tableActions}</th></tr>
          </thead>
          <tbody id="usersBody"></tbody>
        </table>
      </div>
      <p id="adminMsg" class="text-secondary" style="margin-top:10px;"></p>
    </section>
  </div>

  <script>
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
    const dateFmt = localStorage.getItem('koreader_date_format') || 'locale';
    const loginCard = document.getElementById('loginCard');
    const adminCard = document.getElementById('adminCard');
    const initCard = document.getElementById('initCard');
    const usersTableWrap = document.getElementById('usersTableWrap');
    const loginMsg = document.getElementById('loginMsg');
    const adminMsg = document.getElementById('adminMsg');

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

    function setMessage(el, text, isError) {
      el.textContent = text || '';
      el.className = 'text-secondary ' + (text ? (isError ? 'err' : 'ok') : '');
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
      setMessage(adminMsg, I18N.initRequired, true);
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
          setMessage(adminMsg, I18N.initRequired, true);
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
          '<td>' + Number(item.id) + '</td>' +
          '<td>' + escapeHtml(item.username) + '</td>' +
          '<td>' + createdAt + '</td>' +
          '<td><div class="action-row">' +
            '<input data-kind="password" type="password" aria-label="' + I18N.passwordAriaLabel + ' ' + escapeHtml(item.username) + '（ID: ' + Number(item.id) + '）" placeholder="' + I18N.passwordPlaceholder + '" />' +
            '<button data-kind="reset" data-id="' + Number(item.id) + '">' + I18N.resetPasswordButton + '</button>' +
            '<button class="danger" data-kind="delete" data-id="' + Number(item.id) + '">' + I18N.deleteUserButton + '</button>' +
          '</div></td>';
        tbody.appendChild(tr);
      }
    }

    document.getElementById('loginBtn').addEventListener('click', async () => {
      const token = document.getElementById('token').value;
      try {
        await jsonFetch('/admin/auth/login', { method: 'POST', body: JSON.stringify({ token }) });
        setMessage(loginMsg, I18N.loginSuccess, false);
        await loadAdmin();
      } catch (e) {
        setMessage(loginMsg, e.message, true);
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await jsonFetch('/admin/auth/logout', { method: 'POST', body: '{}' });
      await loadAdmin();
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

    document.getElementById('refreshBtn').addEventListener('click', async () => {
      try { await loadInitStatus(); } catch {}
    });

    document.getElementById('initBtn').addEventListener('click', async () => {
      try {
        await jsonFetch('/admin/init', { method: 'POST', body: '{}' });
        setMessage(adminMsg, I18N.initSuccess, false);
        await loadInitStatus();
      } catch (e) {
        setMessage(adminMsg, e.message, true);
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
          setMessage(adminMsg, I18N.deleteSuccessPrefix + id, false);
        } else if (kind === 'reset') {
          const row = target.closest('tr');
          const input = row ? row.querySelector('input[data-kind="password"]') : null;
          const password = input ? input.value : '';
          await jsonFetch('/admin/users/' + id + '/password', { method: 'PUT', body: JSON.stringify({ password }) });
          if (input) input.value = '';
          setMessage(adminMsg, I18N.resetSuccessPrefix + id, false);
        }
        await loadUsers();
      } catch (e) {
        setMessage(adminMsg, e.message, true);
      }
    });

    loadAdmin();
  </script>
</body>
</html>`;
}
