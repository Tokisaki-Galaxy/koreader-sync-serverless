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
      --bg: #f3f6fb;
      --header-bg: #0d1b2e;
      --card: #ffffff;
      --text: #122035;
      --subtle: #5f7089;
      --primary: #4A9EFF;
      --primary-soft: #e9f3ff;
      --stats: #1D9E75;
      --stats-soft: #e8f7f2;
      --danger: #dc2626;
      --ok: #15803d;
      --border: #dce5f0;
      --chip-border: #c2daf8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--text);
      background: var(--bg);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
    }
    .topbar {
      background: var(--header-bg);
      color: #fff;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(74, 158, 255, .24);
    }
    .topbar-inner {
      max-width: 1160px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .logo-lines { width: 16px; height: 20px; position: relative; flex: 0 0 auto; }
    .logo-lines::before, .logo-lines::after, .logo-lines span {
      content: "";
      position: absolute;
      width: 2px;
      border-radius: 2px;
      background: var(--primary);
      top: 0;
      bottom: 0;
    }
    .logo-lines::before { left: 0; opacity: .7; }
    .logo-lines span { left: 7px; }
    .logo-lines::after { right: 0; opacity: .85; }
    .title-wrap { min-width: 0; }
    .title { margin: 0; font-size: 20px; color: #f5f9ff; }
    .subtitle { margin: 2px 0 0; color: #9db5d4; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .container { max-width: 1160px; margin: 0 auto; padding: 16px; }
    .card {
      background: #fff;
      border: .5px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .hidden { display: none; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .row-between { justify-content: space-between; }
    .muted { color: var(--subtle); margin: 0; font-size: 13px; }
    .ok { color: var(--ok); }
    .err { color: var(--danger); }
    input, button {
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      border: 1px solid var(--border);
    }
    input, select { background: #fff; min-width: 160px; }
    button {
      cursor: pointer;
      color: #fff;
      background: var(--primary);
      font-weight: 500;
      border: 1px solid var(--primary);
      border-radius: 8px;
      padding: 8px 12px;
    }
    button.secondary {
      background: #fff;
      color: #244466;
      border-color: #bed0e6;
    }
    .num { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .pill {
      font-size: 11px;
      font-weight: 600;
      background: var(--primary-soft);
      color: #2e78c8;
      border: .5px solid var(--chip-border);
      border-radius: 999px;
      padding: 3px 8px;
      display: inline-flex;
    }
    .pill.device { background: #f2f6fc; color: #355173; border-color: #d2dfef; }
    .tabs {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: .5px solid var(--border);
      margin-bottom: 12px;
      overflow: auto;
    }
    .tab-btn {
      background: transparent;
      color: #607894;
      border: none;
      border-radius: 0;
      padding: 10px 2px;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
    }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(170px, 1fr)); gap: 10px; }
    .two-col { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 10px; margin-top: 10px; }
    .stat { border: .5px solid var(--border); background: #fff; border-radius: 8px; padding: 10px; }
    .stat .k { color: var(--subtle); font-size: 12px; }
    .stat .v { margin-top: 2px; font-size: 20px; font-weight: 700; }
    .panel { border: .5px solid var(--border); border-radius: 8px; background: #fff; overflow: hidden; }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 10px;
      border-bottom: .5px solid var(--border);
      flex-wrap: nowrap;
      min-width: 0;
    }
    .panel-head h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      flex: 1 1 auto;
    }
    .panel-head .pill { flex: 0 0 auto; white-space: nowrap; }
    .panel-body { padding: 10px; display: grid; gap: 8px; }
    .kv { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 13px; }
    .kv .key { color: var(--subtle); }
    .kv .value { font-weight: 600; }
    .source-bar { height: 4px; width: 100%; margin: 0; display: block; }
    .source-bar.stats { background: var(--stats); }
    .source-bar.sync { background: var(--primary); }
    .device-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; margin-top: 10px; }
    .device-item {
      border: .5px solid var(--border);
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: #fff;
    }
    table {
      width: 100%;
      min-width: 900px;
      border-collapse: collapse;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 9px 10px;
      border-bottom: .5px solid #e9eff7;
      font-size: 13px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f7faff;
      color: #365372;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .table-wrap { overflow: auto; margin-top: 10px; }
    .empty { color: var(--subtle); padding: 14px 0; font-size: 13px; }
    .chip-progress {
      display: inline-flex;
      border-radius: 999px;
      padding: 2px 8px;
      background: var(--primary-soft);
      color: #2a74c3;
      border: .5px solid var(--chip-border);
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .truncate {
      max-width: 170px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
      vertical-align: bottom;
    }
    .read-pages { min-width: 130px; }
    .bar {
      margin-top: 4px;
      width: 100%;
      height: 5px;
      background: #eef4fb;
      border-radius: 999px;
      overflow: hidden;
    }
    .bar > span { display: block; height: 100%; background: var(--stats); }
    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .toolbar .field { display: inline-flex; align-items: center; gap: 6px; color: var(--subtle); font-size: 12px; }
    .toolbar input[type="number"] { width: 88px; min-width: 88px; }
    .toolbar select { border: 1px solid var(--border); border-radius: 8px; padding: 8px; font-size: 13px; }
    .tab-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: nowrap;
      min-width: 0;
    }
    .tab-title-row h4 {
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      flex: 1 1 auto;
    }
    .tab-title-row .toolbar { flex: 0 0 auto; }
    @media (max-width: 980px) {
      .grid { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
      .two-col { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .title { font-size: 18px; }
      input { min-width: 100%; }
      .grid { grid-template-columns: 1fr; }
      .toolbar .field { width: 100%; }
      .toolbar .field input, .toolbar .field select { flex: 1; min-width: 0; width: auto; }
      .tab-title-row { flex-wrap: wrap; }
      .tab-title-row h4 { flex: 1 1 100%; white-space: nowrap; }
      .tab-title-row .toolbar { flex: 1 1 100%; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <div class="logo-lines"><span></span></div>
        <div class="title-wrap">
          <h1 class="title">${m.heading}</h1>
          <p class="subtitle">${m.subtitle}</p>
        </div>
      </div>
      <div class="row">
        <button id="refreshBtn" class="secondary hidden">${m.refreshButton}</button>
        <button id="logoutBtn" class="secondary hidden">${m.logoutButton}</button>
      </div>
    </div>
  </header>

  <div class="container">
    <section class="card" id="loginCard">
      <h3 style="margin: 0 0 10px;">${m.loginSection}</h3>
      <div class="row">
        <input id="username" placeholder="${m.usernamePlaceholder}" />
        <input id="password" type="password" placeholder="${m.passwordPlaceholder}" />
        <button id="loginBtn">${m.loginButton}</button>
      </div>
      <p id="loginMsg" class="muted" style="margin-top: 8px;"></p>
    </section>

    <section class="card hidden" id="appCard">
      <div class="row row-between" style="margin-bottom: 8px;">
        <div style="min-width:0;">
          <h3 style="margin:0;">${m.statsTitle}</h3>
          <p id="userInfo" class="muted"></p>
        </div>
      </div>

      <div class="tabs" id="tabs">
        <button class="tab-btn active" data-tab="overview">${m.tabOverview}</button>
        <button class="tab-btn" data-tab="reading">${m.tabReadingStats}</button>
        <button class="tab-btn" data-tab="sync">${m.tabSyncRecords}</button>
      </div>

      <section class="tab-panel active" id="tab-overview">
        <div class="grid" id="overviewTopGrid"></div>
        <div class="two-col">
          <article class="panel">
            <div class="panel-head">
              <h4>${m.readingStatsTitle}</h4>
              <span class="pill" style="background:var(--stats-soft); color:var(--stats); border-color:#c7eadf;">${m.sourceStats}</span>
            </div>
            <div class="panel-body" id="overviewStatsSide"></div>
            <div class="source-bar stats"></div>
          </article>
          <article class="panel">
            <div class="panel-head">
              <h4>${m.recordsTitle}</h4>
              <span class="pill">${m.sourceSync}</span>
            </div>
            <div class="panel-body" id="overviewSyncSide"></div>
            <div class="source-bar sync"></div>
          </article>
        </div>
        <div style="margin-top: 10px;">
          <h4 style="margin: 0 0 8px;">${m.deviceDistributionPrefix}</h4>
          <div id="deviceList" class="device-list"></div>
        </div>
      </section>

      <section class="tab-panel" id="tab-reading">
        <div class="grid" id="readingTopGrid"></div>
        <div class="tab-title-row" style="margin-top: 10px;">
          <h4>${m.statisticsBooksTitle}</h4>
          <div class="toolbar">
            <label class="field">${m.booksPagerPage}
              <input id="booksPage" type="number" min="1" value="1" />
            </label>
            <label class="field">${m.booksPagerPageSize}
              <select id="booksPageSize">
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
            <button id="loadBooksBtn">${m.loadButton}</button>
          </div>
        </div>
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

      <section class="tab-panel" id="tab-sync">
        <div class="toolbar">
          <label class="field">${m.recordsToolbarSearchMd5}
            <input id="recordSearch" />
          </label>
          <label class="field">${m.recordsToolbarPage}
            <input id="recordPage" type="number" min="1" value="1" />
          </label>
          <label class="field">${m.recordsToolbarPageSize}
            <input id="recordPageSize" type="number" min="1" max="100" value="20" />
          </label>
          <button id="loadRecordsBtn">${m.loadButton}</button>
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
    </section>
  </div>

  <script>
    const I18N = ${i18nJson};
    const MS_PER_SECOND = 1000;
    const loginCard = document.getElementById('loginCard');
    const appCard = document.getElementById('appCard');
    const loginMsg = document.getElementById('loginMsg');
    const tabsEl = document.getElementById('tabs');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    let currentTab = 'overview';
    const tabLoaded = { overview: false, reading: false, sync: false };

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

    function kvRow(key, value) {
      return '<div class="kv"><span class="key">' + escapeHtml(key) + '</span><span class="value num">' + escapeHtml(value) + '</span></div>';
    }

    function truncateMiddle(input, left = 8, right = 6) {
      const raw = String(input || '');
      if (raw.length <= left + right + 3) return raw;
      return raw.slice(0, left) + '...' + raw.slice(-right);
    }

    function setMessage(el, text, isError) {
      el.textContent = text || '';
      el.className = 'muted ' + (text ? (isError ? 'err' : 'ok') : '');
    }

    function renderOverview(me, stats) {
      const summary = stats.summary || {};
      const reading = stats.readingStatistics || {};
      const topItems = [
        [I18N.statTotalBooks, Number(reading.totalBooks || 0)],
        [I18N.statTotalReadTime, formatDuration(reading.totalReadTime)],
        [I18N.statTotalRecords, Number(summary.totalRecords || 0)],
        [I18N.statActiveDays, Number(summary.activeDays || 0)],
      ];
      document.getElementById('overviewTopGrid').innerHTML = topItems
        .map(([k, v]) => '<div class="stat"><div class="k">' + escapeHtml(k) + '</div><div class="v num">' + escapeHtml(v) + '</div></div>')
        .join('');

      document.getElementById('overviewStatsSide').innerHTML = [
        kvRow(I18N.statTotalReadPages, Number(reading.totalReadPages || 0)),
        kvRow(I18N.statLastOpen, formatDate(reading.lastOpenAt)),
      ].join('');

      document.getElementById('overviewSyncSide').innerHTML = [
        kvRow(I18N.statTotalDocuments, Number(summary.totalDocuments || 0)),
        kvRow(I18N.statAverageProgress, formatPercent(summary.averagePercentage)),
        kvRow(I18N.statLastSync, formatDate(summary.lastSyncAt)),
      ].join('');

      const devices = Array.isArray(stats.devices) ? stats.devices : [];
      document.getElementById('deviceList').innerHTML = devices.length
        ? devices.map((d) => (
            '<div class="device-item">' +
              '<span class="pill device">' + escapeHtml(d.device || I18N.noData) + '</span>' +
              '<span class="num">' + escapeHtml(Number(d.count || 0)) + '</span>' +
            '</div>'
          )).join('')
        : '<div class="muted">' + escapeHtml(I18N.noData) + '</div>';

      document.getElementById('userInfo').textContent = I18N.userPrefix + me.username + ' (ID: ' + me.id + ')';
    }

    function renderReadingStats(readingStatistics) {
      const items = [
        [I18N.statTotalBooks, Number(readingStatistics.totalBooks || 0)],
        [I18N.statTotalReadTime, formatDuration(readingStatistics.totalReadTime)],
        [I18N.statTotalReadPages, Number(readingStatistics.totalReadPages || 0)],
        [I18N.statLastOpen, formatDate(readingStatistics.lastOpenAt)],
      ];
      document.getElementById('readingTopGrid').innerHTML = items
        .map(([k, v]) => '<div class="stat"><div class="k">' + escapeHtml(k) + '</div><div class="v num">' + escapeHtml(v) + '</div></div>')
        .join('');
    }

    function renderBooks(items, page, pageSize, total) {
      const body = document.getElementById('booksBody');
      const empty = document.getElementById('booksEmpty');
      body.innerHTML = '';
      if (!Array.isArray(items) || items.length === 0) {
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');
      for (const item of items) {
        const pages = Number(item.pages || 0);
        const readPages = Number(item.total_read_pages || 0);
        const progress = pages > 0 ? Math.min(100, Math.max(0, (readPages / pages) * 100)) : 0;
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(item.title) + '</td>' +
          '<td>' + escapeHtml(item.authors) + '</td>' +
          '<td><span class="truncate num" title="' + escapeHtml(item.md5) + '">' + escapeHtml(truncateMiddle(item.md5, 10, 8)) + '</span></td>' +
          '<td class="num">' + escapeHtml(pages) + '</td>' +
          '<td>' + escapeHtml(formatDuration(item.total_read_time)) + '</td>' +
          '<td class="read-pages">' +
            '<span class="num">' + escapeHtml(readPages) + '</span>' +
            '<div class="bar"><span style="width:' + escapeHtml(progress.toFixed(2)) + '%"></span></div>' +
          '</td>' +
          '<td>' + escapeHtml(formatDate(item.last_open)) + '</td>';
        body.appendChild(tr);
      }
      document.getElementById('booksPage').value = String(page || 1);
      document.getElementById('booksPageSize').value = String(pageSize || 50);
      empty.textContent = I18N.emptyStatisticsBooks + ' (' + Number(total || 0) + ')';
    }

    function renderRecords(items) {
      const tbody = document.getElementById('recordsBody');
      tbody.innerHTML = '';
      for (const item of items || []) {
        const progressText = formatPercent(item.percentage);
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td><span class="truncate num" title="' + escapeHtml(item.document) + '">' + escapeHtml(item.document) + '</span></td>' +
          '<td><span class="chip-progress">' + escapeHtml(progressText) + '</span></td>' +
          '<td><span class="pill device">' + escapeHtml(item.device || I18N.noData) + '</span></td>' +
          '<td><span class="truncate num" title="' + escapeHtml(item.device_id) + '">' + escapeHtml(truncateMiddle(item.device_id, 10, 8)) + '</span></td>' +
          '<td>' + escapeHtml(formatDate(item.timestamp)) + '</td>';
        tbody.appendChild(tr);
      }
    }

    async function loadOverview() {
      const [me, stats] = await Promise.all([jsonFetch('/web/me'), jsonFetch('/web/stats')]);
      renderOverview(me, stats);
    }

    async function loadReadingTab() {
      const page = Math.max(1, Number(document.getElementById('booksPage').value || 1));
      const pageSize = document.getElementById('booksPageSize').value === '100' ? 100 : 50;
      const [stats, books] = await Promise.all([
        jsonFetch('/web/stats'),
        jsonFetch('/web/statistics/books?page=' + page + '&pageSize=' + pageSize),
      ]);
      renderReadingStats(stats.readingStatistics || {});
      renderBooks(books.items || [], books.page || page, books.pageSize || pageSize, books.total || 0);
    }

    async function loadSyncTab() {
      const page = Math.max(1, Number(document.getElementById('recordPage').value || 1));
      const pageSize = Math.min(100, Math.max(1, Number(document.getElementById('recordPageSize').value || 20)));
      const data = await jsonFetch('/web/records?page=' + page + '&pageSize=' + pageSize);
      const searchMd5 = String(document.getElementById('recordSearch').value || '').trim().toLowerCase();
      const filtered = searchMd5
        ? (data.items || []).filter((item) => String(item.document || '').toLowerCase().includes(searchMd5))
        : (data.items || []);
      renderRecords(filtered);
    }

    async function activateTab(tabName, forceReload) {
      currentTab = tabName;
      for (const btn of tabsEl.querySelectorAll('.tab-btn')) {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      }
      for (const panel of document.querySelectorAll('.tab-panel')) {
        panel.classList.toggle('active', panel.id === 'tab-' + tabName);
      }
      if (!forceReload && tabLoaded[tabName]) return;
      if (tabName === 'overview') await loadOverview();
      if (tabName === 'reading') await loadReadingTab();
      if (tabName === 'sync') await loadSyncTab();
      tabLoaded[tabName] = true;
    }

    async function ensureAuthenticated() {
      try {
        await jsonFetch('/web/me');
        loginCard.classList.add('hidden');
        appCard.classList.remove('hidden');
        refreshBtn.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        await activateTab('overview', true);
      } catch {
        loginCard.classList.remove('hidden');
        appCard.classList.add('hidden');
        refreshBtn.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        setMessage(loginMsg, '', false);
      }
    }

    document.getElementById('loginBtn').addEventListener('click', async () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      try {
        await jsonFetch('/web/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        setMessage(loginMsg, I18N.loginSuccess, false);
        await ensureAuthenticated();
      } catch (e) {
        setMessage(loginMsg, e.message, true);
      }
    });

    logoutBtn.addEventListener('click', async () => {
      try {
        await jsonFetch('/web/auth/logout', { method: 'POST', body: '{}' });
      } finally {
        tabLoaded.overview = false;
        tabLoaded.reading = false;
        tabLoaded.sync = false;
        await ensureAuthenticated();
      }
    });

    tabsEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      const tabName = btn.dataset.tab;
      if (!tabName) return;
      try { await activateTab(tabName, false); } catch {}
    });

    refreshBtn.addEventListener('click', async () => {
      try { await activateTab(currentTab, true); } catch {}
    });

    document.getElementById('loadBooksBtn').addEventListener('click', async () => {
      try {
        await loadReadingTab();
        tabLoaded.reading = true;
      } catch {}
    });

    document.getElementById('loadRecordsBtn').addEventListener('click', async () => {
      try {
        await loadSyncTab();
        tabLoaded.sync = true;
      } catch {}
    });

    document.getElementById('recordSearch').addEventListener('input', async () => {
      if (currentTab !== 'sync') return;
      try { await loadSyncTab(); } catch {}
    });

    ensureAuthenticated();
  </script>
</body>
</html>`;
}
