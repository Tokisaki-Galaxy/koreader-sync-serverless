import { getMessages } from "../i18n";
function toScriptJson(value) {
    return JSON.stringify(value).replaceAll("<", "\\u003c");
}
export function renderUserPage(locale) {
    const m = getMessages(locale).user;
    const i18nJson = toScriptJson(m);
    return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${m.title}</title>
  <style>
    :root {
      --bg1: #0f172a;
      --bg2: #1e293b;
      --card: rgba(255,255,255,.88);
      --text: #0f172a;
      --muted: #64748b;
      --primary: #2563eb;
      --ok: #059669;
      --danger: #dc2626;
      --border: #e2e8f0;
      --shadow: 0 12px 30px rgba(2, 6, 23, .15);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      color: var(--text);
      background: radial-gradient(1200px 700px at 10% 10%, #334155 0%, transparent 60%),
                  radial-gradient(1200px 700px at 90% 90%, #1d4ed8 0%, transparent 60%),
                  linear-gradient(135deg, var(--bg1), var(--bg2));
      min-height: 100vh;
      padding: 28px 16px;
    }
    .wrap { max-width: 1040px; margin: 0 auto; }
    .card {
      background: var(--card);
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 16px;
      box-shadow: var(--shadow);
      padding: 18px;
      margin-bottom: 14px;
      backdrop-filter: blur(8px);
    }
    .title { color: #e2e8f0; margin: 0 0 10px; font-size: 30px; }
    .subtitle { color: #cbd5e1; margin: 0 0 18px; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 10px; }
    .stat {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 12px;
    }
    .stat .k { color: var(--muted); font-size: 12px; }
    .stat .v { font-size: 20px; font-weight: 700; margin-top: 2px; }
    input, button {
      font-size: 14px;
      border-radius: 10px;
      border: 1px solid var(--border);
      padding: 10px 12px;
      outline: none;
    }
    input { background: #fff; min-width: 180px; }
    button {
      border: 0;
      background: var(--primary);
      color: #fff;
      cursor: pointer;
      font-weight: 600;
    }
    button.secondary { background: #475569; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; }
    th, td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      vertical-align: top;
    }
    th { background: #f8fafc; color: #334155; position: sticky; top: 0; }
    .muted { color: var(--muted); font-size: 13px; margin: 0; }
    .ok { color: var(--ok); }
    .err { color: var(--danger); }
    .hidden { display: none; }
    .pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 600;
    }
    @media (max-width: 900px) {
      .stats { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
    }
    @media (max-width: 640px) {
      .stats { grid-template-columns: 1fr; }
      .title { font-size: 24px; }
      input { min-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1 class="title">${m.heading}</h1>
    <p class="subtitle">${m.subtitle}</p>

    <section class="card" id="loginCard">
      <h3 style="margin-top:0;">${m.loginSection}</h3>
      <div class="row">
        <input id="username" placeholder="${m.usernamePlaceholder}" />
        <input id="password" type="password" placeholder="${m.passwordPlaceholder}" />
        <button id="loginBtn">${m.loginButton}</button>
      </div>
      <p id="loginMsg" class="muted" style="margin-top:8px;"></p>
    </section>

    <section class="card hidden" id="dashboardCard">
      <div class="row" style="justify-content:space-between;">
        <div>
          <h3 style="margin:0;">${m.statsTitle}</h3>
          <p id="userInfo" class="muted"></p>
        </div>
        <div class="row">
          <span class="pill">${m.realtimeStats}</span>
          <button id="refreshStatsBtn" class="secondary">${m.refreshButton}</button>
          <button id="logoutBtn" class="secondary">${m.logoutButton}</button>
        </div>
      </div>
      <div class="stats" id="statsGrid" style="margin-top:10px;"></div>
      <p class="muted" id="deviceSummary" style="margin-top:10px;"></p>
    </section>

    <section class="card hidden" id="recordsCard">
      <div class="row" style="justify-content:space-between;">
        <h3 style="margin:0;">${m.recordsTitle}</h3>
        <div class="row">
          <input id="page" type="number" value="1" min="1" style="width:88px; min-width:88px;" />
          <input id="pageSize" type="number" value="20" min="1" max="100" style="width:100px; min-width:100px;" />
          <button id="loadBtn">${m.loadButton}</button>
        </div>
      </div>
      <div style="overflow:auto; margin-top:10px; max-height:520px;">
        <table>
          <thead>
            <tr><th>${m.tableDocument}</th><th>${m.tableProgress}</th><th>${m.tableDevice}</th><th>${m.tableDeviceId}</th><th>${m.tableUpdatedAt}</th></tr>
          </thead>
          <tbody id="recordsBody"></tbody>
        </table>
      </div>
    </section>
  </div>

  <script>
    const I18N = ${i18nJson};
    const MS_PER_SECOND = 1000;
    const loginCard = document.getElementById('loginCard');
    const dashboardCard = document.getElementById('dashboardCard');
    const recordsCard = document.getElementById('recordsCard');
    const loginMsg = document.getElementById('loginMsg');

    function escapeHtml(value) {
      return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    async function jsonFetch(url, options = {}) {
      const res = await fetch(url, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || I18N.requestFailed);
      return data;
    }

    function setMessage(el, text, isError) {
      el.textContent = text || '';
      el.className = 'muted ' + (text ? (isError ? 'err' : 'ok') : '');
    }

    function renderStats(summary) {
      const items = [
          [I18N.statTotalRecords, Number(summary.totalRecords || 0)],
          [I18N.statTotalDocuments, Number(summary.totalDocuments || 0)],
          [I18N.statTotalDevices, Number(summary.totalDevices || 0)],
          [I18N.statActiveDays, Number(summary.activeDays || 0)],
          [I18N.statAverageProgress, (Number(summary.averagePercentage || 0) * 100).toFixed(2) + '%'],
          [I18N.statLastSync, summary.lastSyncAt ? new Date(summary.lastSyncAt * MS_PER_SECOND).toLocaleString() : '-'],
      ];
      const html = items.map(([k, v]) => '<div class="stat"><div class="k">' + escapeHtml(k) + '</div><div class="v">' + escapeHtml(v) + '</div></div>').join('');
      document.getElementById('statsGrid').innerHTML = html;
    }

    async function loadMe() {
      try {
        const me = await jsonFetch('/web/me');
        document.getElementById('userInfo').textContent = I18N.userPrefix + me.username + '（ID: ' + me.id + '）';
        loginCard.classList.add('hidden');
        dashboardCard.classList.remove('hidden');
        recordsCard.classList.remove('hidden');
        await Promise.all([loadStats(), loadRecords()]);
      } catch {
        loginCard.classList.remove('hidden');
        dashboardCard.classList.add('hidden');
        recordsCard.classList.add('hidden');
      }
    }

    async function loadStats() {
      const data = await jsonFetch('/web/stats');
      renderStats(data.summary || {});
      const devices = (data.devices || []).map(d => String(d.device) + ': ' + Number(d.count)).join(' / ') || '-';
      document.getElementById('deviceSummary').textContent = I18N.deviceDistributionPrefix + devices;
    }

    async function loadRecords() {
      const page = Number(document.getElementById('page').value || 1);
      const pageSize = Number(document.getElementById('pageSize').value || 20);
      const data = await jsonFetch('/web/records?page=' + page + '&pageSize=' + pageSize);
      const tbody = document.getElementById('recordsBody');
      tbody.innerHTML = '';

      for (const item of data.items || []) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(item.document) + '</td>' +
          '<td>' + (Number(item.percentage || 0) * 100).toFixed(2) + '%</td>' +
          '<td>' + escapeHtml(item.device) + '</td>' +
          '<td>' + escapeHtml(item.device_id) + '</td>' +
          '<td>' + new Date(Number(item.timestamp || 0) * MS_PER_SECOND).toLocaleString() + '</td>';
        tbody.appendChild(tr);
      }
    }

    document.getElementById('loginBtn').addEventListener('click', async () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      try {
        await jsonFetch('/web/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        setMessage(loginMsg, I18N.loginSuccess, false);
        await loadMe();
      } catch (e) {
        setMessage(loginMsg, e.message, true);
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await jsonFetch('/web/auth/logout', { method: 'POST', body: '{}' });
      await loadMe();
    });

    document.getElementById('loadBtn').addEventListener('click', async () => {
      try { await loadRecords(); } catch {}
    });

    document.getElementById('refreshStatsBtn').addEventListener('click', async () => {
      try { await loadStats(); } catch {}
    });

    loadMe();
  </script>
</body>
</html>`;
}
