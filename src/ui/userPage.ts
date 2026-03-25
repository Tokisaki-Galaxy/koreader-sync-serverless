import { getMessages, type Locale } from "../i18n";

function toScriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function renderUserPage(locale: Locale): string {
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
      --bg-start: #0f172a;
      --bg-end: #1e293b;
      --card: rgba(255,255,255,.9);
      --text: #0f172a;
      --subtle: #64748b;
      --primary: #2563eb;
      --primary-soft: #dbeafe;
      --danger: #dc2626;
      --ok: #059669;
      --border: #e2e8f0;
      --shadow: 0 20px 36px rgba(2, 6, 23, .16);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--text);
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(1000px 640px at 8% 10%, #475569 0%, transparent 60%),
                  radial-gradient(1000px 640px at 85% 92%, #1d4ed8 0%, transparent 60%),
                  linear-gradient(135deg, var(--bg-start), var(--bg-end));
      min-height: 100vh;
      padding: 30px 14px;
    }
    .container { max-width: 1140px; margin: 0 auto; }
    .title { margin: 0 0 8px; color: #f8fafc; font-size: 32px; }
    .subtitle { margin: 0 0 18px; color: #cbd5e1; }
    .card {
      background: var(--card);
      border: 1px solid rgba(255,255,255,.4);
      border-radius: 18px;
      padding: 16px;
      box-shadow: var(--shadow);
      margin-bottom: 14px;
      backdrop-filter: blur(10px);
    }
    .hidden { display: none; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .row-between { justify-content: space-between; }
    .muted { color: var(--subtle); margin: 0; font-size: 13px; }
    .ok { color: var(--ok); }
    .err { color: var(--danger); }
    input, button {
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 14px;
      border: 1px solid var(--border);
    }
    input { background: #fff; min-width: 180px; }
    button {
      cursor: pointer;
      border: none;
      color: #fff;
      background: var(--primary);
      font-weight: 600;
    }
    button.secondary { background: #475569; }
    .pill {
      font-size: 12px;
      font-weight: 600;
      background: var(--primary-soft);
      color: #1d4ed8;
      border-radius: 999px;
      padding: 4px 9px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(170px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .grid-4 { grid-template-columns: repeat(4, minmax(170px, 1fr)); }
    .stat {
      border: 1px solid var(--border);
      background: #fff;
      border-radius: 12px;
      padding: 10px 12px;
    }
    .stat .k { color: var(--subtle); font-size: 12px; }
    .stat .v { margin-top: 2px; font-size: 19px; font-weight: 700; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      color: #334155;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .table-wrap { overflow: auto; margin-top: 10px; max-height: 520px; }
    .empty { color: var(--subtle); padding: 14px 0; font-size: 13px; }
    @media (max-width: 980px) {
      .grid { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
      .grid-4 { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
    }
    @media (max-width: 640px) {
      .title { font-size: 26px; }
      input { min-width: 100%; }
      .grid, .grid-4 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">${m.heading}</h1>
    <p class="subtitle">${m.subtitle}</p>

    <section class="card" id="loginCard">
      <h3 style="margin: 0 0 10px;">${m.loginSection}</h3>
      <div class="row">
        <input id="username" placeholder="${m.usernamePlaceholder}" />
        <input id="password" type="password" placeholder="${m.passwordPlaceholder}" />
        <button id="loginBtn">${m.loginButton}</button>
      </div>
      <p id="loginMsg" class="muted" style="margin-top: 8px;"></p>
    </section>

    <section class="card hidden" id="dashboardCard">
      <div class="row row-between">
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
      <div class="grid" id="statsGrid"></div>
      <p class="muted" id="deviceSummary" style="margin-top: 10px;"></p>
    </section>

    <section class="card hidden" id="readingStatsCard">
      <div class="row row-between">
        <h3 style="margin:0;">${m.readingStatsTitle}</h3>
        <button id="refreshBooksBtn" class="secondary">${m.refreshButton}</button>
      </div>
      <div class="grid grid-4" id="readingStatsGrid"></div>
    </section>

    <section class="card hidden" id="booksCard">
      <h3 style="margin:0;">${m.statisticsBooksTitle}</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>${m.tableTitle}</th>
              <th>${m.tableAuthors}</th>
              <th>${m.tableMd5}</th>
              <th>${m.tablePages}</th>
              <th>${m.tableReadTime}</th>
              <th>${m.tableReadPages}</th>
              <th>${m.tableLastOpen}</th>
            </tr>
          </thead>
          <tbody id="booksBody"></tbody>
        </table>
      </div>
      <div id="booksEmpty" class="empty hidden">${m.emptyStatisticsBooks}</div>
    </section>

    <section class="card hidden" id="recordsCard">
      <div class="row row-between">
        <h3 style="margin:0;">${m.recordsTitle}</h3>
        <div class="row">
          <input id="page" type="number" value="1" min="1" style="width:88px; min-width:88px;" />
          <input id="pageSize" type="number" value="20" min="1" max="100" style="width:100px; min-width:100px;" />
          <button id="loadBtn">${m.loadButton}</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>${m.tableDocument}</th>
              <th>${m.tableProgress}</th>
              <th>${m.tableDevice}</th>
              <th>${m.tableDeviceId}</th>
              <th>${m.tableUpdatedAt}</th>
            </tr>
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
    const readingStatsCard = document.getElementById('readingStatsCard');
    const booksCard = document.getElementById('booksCard');
    const loginMsg = document.getElementById('loginMsg');

    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function formatPercent(value) {
      return (Number(value || 0) * 100).toFixed(2) + '%';
    }

    function formatDate(epochSec) {
      const sec = Number(epochSec || 0);
      if (!sec) return '-';
      return new Date(sec * MS_PER_SECOND).toLocaleString();
    }

    function formatDuration(totalSeconds) {
      const sec = Math.max(0, Number(totalSeconds || 0));
      const hour = Math.floor(sec / 3600);
      const minute = Math.floor((sec % 3600) / 60);
      if (hour > 0) return hour + 'h ' + minute + 'm';
      return minute + 'm';
    }

    async function jsonFetch(url, options = {}) {
      const res = await fetch(url, {
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || I18N.requestFailed);
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
        [I18N.statAverageProgress, formatPercent(summary.averagePercentage)],
        [I18N.statLastSync, formatDate(summary.lastSyncAt)],
      ];
      document.getElementById('statsGrid').innerHTML = items
        .map(([k, v]) => '<div class="stat"><div class="k">' + escapeHtml(k) + '</div><div class="v">' + escapeHtml(v) + '</div></div>')
        .join('');
    }

    function renderReadingStats(readingStatistics) {
      const items = [
        [I18N.statTotalBooks, Number(readingStatistics.totalBooks || 0)],
        [I18N.statTotalReadTime, formatDuration(readingStatistics.totalReadTime)],
        [I18N.statTotalReadPages, Number(readingStatistics.totalReadPages || 0)],
        [I18N.statLastOpen, formatDate(readingStatistics.lastOpenAt)],
      ];
      document.getElementById('readingStatsGrid').innerHTML = items
        .map(([k, v]) => '<div class="stat"><div class="k">' + escapeHtml(k) + '</div><div class="v">' + escapeHtml(v) + '</div></div>')
        .join('');
    }

    function renderBooks(items) {
      const body = document.getElementById('booksBody');
      const empty = document.getElementById('booksEmpty');
      body.innerHTML = '';
      if (!Array.isArray(items) || items.length === 0) {
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');
      for (const item of items) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(item.title) + '</td>' +
          '<td>' + escapeHtml(item.authors) + '</td>' +
          '<td>' + escapeHtml(item.md5) + '</td>' +
          '<td>' + escapeHtml(Number(item.pages || 0)) + '</td>' +
          '<td>' + escapeHtml(formatDuration(item.total_read_time)) + '</td>' +
          '<td>' + escapeHtml(Number(item.total_read_pages || 0)) + '</td>' +
          '<td>' + escapeHtml(formatDate(item.last_open)) + '</td>';
        body.appendChild(tr);
      }
    }

    async function loadMe() {
      try {
        const me = await jsonFetch('/web/me');
        document.getElementById('userInfo').textContent = I18N.userPrefix + me.username + ' (ID: ' + me.id + ')';
        loginCard.classList.add('hidden');
        dashboardCard.classList.remove('hidden');
        recordsCard.classList.remove('hidden');
        readingStatsCard.classList.remove('hidden');
        booksCard.classList.remove('hidden');
        await Promise.all([loadStats(), loadRecords(), loadBooks()]);
      } catch {
        loginCard.classList.remove('hidden');
        dashboardCard.classList.add('hidden');
        recordsCard.classList.add('hidden');
        readingStatsCard.classList.add('hidden');
        booksCard.classList.add('hidden');
      }
    }

    async function loadStats() {
      const data = await jsonFetch('/web/stats');
      renderStats(data.summary || {});
      renderReadingStats(data.readingStatistics || {});
      const devices = (data.devices || [])
        .map((d) => String(d.device) + ': ' + Number(d.count))
        .join(' / ') || '-';
      document.getElementById('deviceSummary').textContent = I18N.deviceDistributionPrefix + devices;
    }

    async function loadBooks() {
      const data = await jsonFetch('/web/statistics/books');
      renderBooks(data.items || []);
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
          '<td>' + formatPercent(item.percentage) + '</td>' +
          '<td>' + escapeHtml(item.device) + '</td>' +
          '<td>' + escapeHtml(item.device_id) + '</td>' +
          '<td>' + escapeHtml(formatDate(item.timestamp)) + '</td>';
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

    document.getElementById('refreshBooksBtn').addEventListener('click', async () => {
      try {
        await Promise.all([loadStats(), loadBooks()]);
      } catch {}
    });

    loadMe();
  </script>
</body>
</html>`;
}
