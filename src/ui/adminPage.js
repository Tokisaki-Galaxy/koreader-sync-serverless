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
      --bg: #0b1220;
      --bg2: #111827;
      --card: rgba(255,255,255,.92);
      --muted: #64748b;
      --primary: #1d4ed8;
      --danger: #dc2626;
      --ok: #16a34a;
      --border: #e2e8f0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: linear-gradient(120deg, var(--bg), var(--bg2));
      color: #0f172a;
      min-height: 100vh;
      padding: 28px 16px;
    }
    .wrap { max-width: 1120px; margin: 0 auto; }
    .title { color: #e2e8f0; margin: 0 0 10px; font-size: 30px; }
    .subtitle { color: #cbd5e1; margin: 0 0 16px; font-size: 14px; }
    .card {
      background: var(--card);
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 16px;
      box-shadow: 0 10px 28px rgba(2, 6, 23, .25);
      padding: 16px;
      margin-bottom: 14px;
      backdrop-filter: blur(8px);
    }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    input, button {
      font-size: 14px;
      border-radius: 10px;
      padding: 10px 12px;
      border: 1px solid var(--border);
    }
    input { min-width: 280px; }
    button { border: 0; background: var(--primary); color: #fff; cursor: pointer; font-weight: 600; }
    button.secondary { background: #475569; }
    button.danger { background: var(--danger); }
    .hidden { display: none; }
    .muted { color: var(--muted); font-size: 13px; margin: 0; }
    .ok { color: var(--ok); }
    .err { color: var(--danger); }
    .badge {
      display: inline-block; font-size: 12px; padding: 2px 8px; border-radius: 999px;
      background: #dbeafe; color: #1d4ed8; font-weight: 600;
    }
    table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: middle; }
    th { background: #f8fafc; color: #334155; position: sticky; top: 0; }
    .action-row { display: flex; gap: 8px; flex-wrap: wrap; }
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
      <p id="loginMsg" class="muted" style="margin-top:8px;"></p>
    </section>

    <section class="card hidden" id="adminCard">
      <div class="row" style="justify-content:space-between;">
        <div class="row">
          <h3 style="margin:0;">${m.userManagement}</h3>
          <span class="badge">${m.adminSession}</span>
        </div>
        <div class="row">
          <button id="refreshBtn" class="secondary">${m.refreshButton}</button>
          <button id="logoutBtn" class="secondary">${m.logoutButton}</button>
        </div>
      </div>
      <p id="adminInfo" class="muted" style="margin-top:8px;"></p>
      <section class="card hidden" id="initCard" style="margin-top:10px;">
        <h4 style="margin:0 0 8px;">${m.initTitle}</h4>
        <p class="muted" style="margin:0 0 10px;" id="initDesc">${m.initDescription}</p>
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
      <p id="adminMsg" class="muted" style="margin-top:10px;"></p>
    </section>
  </div>

  <script>
    const I18N = ${i18nJson};
    const MS_PER_SECOND = 1000;
    const loginCard = document.getElementById('loginCard');
    const adminCard = document.getElementById('adminCard');
    const initCard = document.getElementById('initCard');
    const usersTableWrap = document.getElementById('usersTableWrap');
    const loginMsg = document.getElementById('loginMsg');
    const adminMsg = document.getElementById('adminMsg');

    function escapeHtml(value) {
      return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    function setMessage(el, text, isError) {
      el.textContent = text || '';
      el.className = 'muted ' + (text ? (isError ? 'err' : 'ok') : '');
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
        const createdAt = item.created_at ? new Date(item.created_at * MS_PER_SECOND).toLocaleString() : '-';
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
