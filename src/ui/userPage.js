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
      --bg: #f4f6fa;
      --surface: #ffffff;
      --surface-hover: #fafbfd;
      --header-bg: #0f1a2e;
      --text: #1a2332;
      --text-secondary: #6b7d99;
      --primary: #3b82f6;
      --primary-soft: #eff6ff;
      --primary-hover: #2563eb;
      --primary-border: #bfdbfe;
      --accent: #10b981;
      --accent-soft: #ecfdf5;
      --accent-border: #a7f3d0;
      --danger: #ef4444;
      --border: #e2e8f0;
      --shadow-sm: 0 1px 2px 0 rgba(0,0,0,.04);
      --shadow-md: 0 4px 12px rgba(0,0,0,.06);
      --shadow-lg: 0 8px 24px rgba(0,0,0,.08);
      --radius: 10px;
      --radius-sm: 6px;
      --radius-full: 999px;
      --transition: .15s ease;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f172a;
        --surface: #1e293b;
        --surface-hover: #253249;
        --header-bg: #020617;
        --text: #f1f5f9;
        --text-secondary: #94a3b8;
        --primary: #60a5fa;
        --primary-soft: #1e3a5f;
        --primary-hover: #3b82f6;
        --primary-border: #3b82f6;
        --accent: #34d399;
        --accent-soft: #064e3b;
        --accent-border: #059669;
        --danger: #f87171;
        --border: #334155;
        --shadow-sm: 0 1px 2px 0 rgba(0,0,0,.2);
        --shadow-md: 0 4px 12px rgba(0,0,0,.3);
        --shadow-lg: 0 8px 24px rgba(0,0,0,.4);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { opacity: .6; } 50% { opacity: .3; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--text);
      background: var(--bg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      min-height: 100vh;
    }
    .topbar {
      background: var(--header-bg);
      color: #fff;
      padding: 16px 20px;
      position: relative;
    }
    .topbar::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, var(--primary), transparent);
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
    .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .logo-lines { width: 18px; height: 22px; position: relative; flex: 0 0 auto; }
    .logo-lines::before, .logo-lines::after, .logo-lines span {
      content: "";
      position: absolute;
      width: 3px;
      border-radius: 3px;
      background: var(--primary);
      top: 0;
      bottom: 0;
    }
    .logo-lines::before { left: 0; opacity: .6; }
    .logo-lines span { left: 7px; }
    .logo-lines::after { right: 0; opacity: .8; }
    .title-wrap { min-width: 0; }
    .title { margin: 0; font-size: 20px; font-weight: 700; color: #f5f9ff; letter-spacing: -.01em; }
    .subtitle { margin: 3px 0 0; color: #94a3b8; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .container { max-width: 1160px; margin: 0 auto; padding: 20px 16px; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      margin-bottom: 14px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition), transform var(--transition);
    }
    .card:hover { box-shadow: var(--shadow-md); }
    .hidden { display: none !important; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .row-between { justify-content: space-between; }
    .text-secondary { color: var(--text-secondary); margin: 0; font-size: 13px; }
    .ok { color: var(--accent); }
    .err { color: var(--danger); }
    input, button, select {
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 13px;
      border: 1px solid var(--border);
      font-family: inherit;
      transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
    }
    input:focus, select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
    button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
    input, select { background: var(--surface); color: var(--text); min-width: 160px; }
    button {
      cursor: pointer;
      color: #fff;
      background: var(--primary);
      font-weight: 500;
      border: 1px solid var(--primary);
      transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
    }
    button:hover { background: var(--primary-hover); }
    button:active { transform: scale(.97); }
    button.secondary {
      background: transparent;
      color: var(--text-secondary);
      border-color: var(--border);
    }
    button.secondary:hover { background: var(--surface-hover); color: var(--text); border-color: var(--text-secondary); }
    button.small { padding: 5px 10px; font-size: 12px; }
    .num { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; }
    .pill {
      font-size: 11px;
      font-weight: 600;
      background: var(--primary-soft);
      color: var(--primary);
      border: 1px solid var(--primary-border);
      border-radius: var(--radius-full);
      padding: 3px 10px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
    .pill.accent { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-border); }
    .pill.device { background: var(--surface-hover); color: var(--text-secondary); border-color: var(--border); }
    .tabs {
      display: flex;
      align-items: center;
      gap: 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 14px;
      overflow: auto hidden;
    }
    .tab-btn {
      background: transparent;
      color: var(--text-secondary);
      border: none;
      border-radius: 0;
      padding: 10px 16px;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: color var(--transition), border-color var(--transition);
      margin-bottom: -1px;
    }
    .tab-btn:hover { color: var(--text); background: transparent; }
    .tab-btn:active { transform: none; }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
    .tab-panel { display: none; animation: fadeIn .2s ease; }
    .tab-panel.active { display: block; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .stat {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition), transform var(--transition);
      position: relative;
      overflow: hidden;
    }
    .stat:hover { box-shadow: var(--shadow-md); }
    .stat::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--accent));
      opacity: .3;
    }
    .stat .k { color: var(--text-secondary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; }
    .stat .v { margin-top: 4px; font-size: 24px; font-weight: 700; letter-spacing: -.02em; line-height: 1.2; }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition);
    }
    .panel:hover { box-shadow: var(--shadow-md); }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-hover);
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
    .panel-body { padding: 14px; display: grid; gap: 10px; }
    .kv { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13px; }
    .kv .key { color: var(--text-secondary); }
    .kv .value { font-weight: 600; }
    .source-bar { height: 6px; width: 100%; margin: 0; display: block; }
    .source-bar.accent { background: linear-gradient(90deg, var(--accent), #6ee7b7); }
    .source-bar.primary { background: linear-gradient(90deg, var(--primary), #93c5fd); }
    .device-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-top: 12px; }
    .device-item {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      transition: box-shadow var(--transition);
    }
    .device-item:hover { box-shadow: var(--shadow-sm); }
    table {
      width: 100%;
      min-width: 900px;
      border-collapse: separate;
      border-spacing: 0;
      background: var(--surface);
      border-radius: var(--radius);
      overflow: hidden;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--surface-hover);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .04em;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    tr:last-child td { border-bottom: none; }
    tbody tr { transition: background var(--transition); }
    tbody tr:hover { background: var(--primary-soft); }
    .table-wrap { overflow: auto; margin-top: 12px; border: 1px solid var(--border); border-radius: var(--radius); }
    .table-wrap td:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }
    .empty-state { color: var(--text-secondary); padding: 20px 0; font-size: 13px; text-align: center; }
    .chip-progress {
      display: inline-flex;
      border-radius: var(--radius-full);
      padding: 2px 10px;
      background: var(--primary-soft);
      color: var(--primary);
      border: 1px solid var(--primary-border);
      font-size: 12px;
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
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
      height: 6px;
      background: #eef2f6;
      border-radius: var(--radius-full);
      overflow: hidden;
    }
    .bar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), #6ee7b7); border-radius: var(--radius-full); transition: width .3s ease; }
    @media (prefers-color-scheme: dark) { .bar > span { background: linear-gradient(90deg, var(--accent), #059669); } }
    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .toolbar .field { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 12px; }
    .toolbar input[type="number"] { width: 88px; min-width: 88px; }
    .toolbar select { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 13px; background: var(--surface); color: var(--text); }
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
    .loading-pulse { animation: pulse 1.5s ease-in-out infinite; }
    .skeleton {
      background: linear-gradient(90deg, var(--surface-hover) 25%, var(--border) 50%, var(--surface-hover) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-sm);
    }
    .skeleton-stat { height: 72px; }
    .skeleton-panel { height: 120px; }
    .skeleton-table { height: 300px; }
    .fmt-select { margin-left: auto; }
    @media (max-width: 980px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
      .two-col { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .topbar { padding: 12px 14px; }
      .title { font-size: 18px; }
      input { min-width: 100%; }
      .grid { grid-template-columns: 1fr; }
      .toolbar .field { width: 100%; }
      .toolbar .field input, .toolbar .field select { flex: 1; min-width: 0; width: auto; }
      .tab-title-row { flex-wrap: wrap; }
      .tab-title-row h4 { flex: 1 1 100%; }
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
      <p id="loginMsg" class="text-secondary" style="margin-top: 8px;"></p>
    </section>

    <section class="card hidden" id="appCard">
      <div class="row row-between" style="margin-bottom: 8px;">
        <div style="min-width:0;">
          <h3 style="margin:0;">${m.statsTitle}</h3>
          <p id="userInfo" class="text-secondary" style="margin-top:2px;"></p>
        </div>
        <div class="row fmt-select">
          <label class="field" style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
            ${m.dateFormatLabel}
            <select id="dateFmtSelect" style="padding:4px 8px;font-size:12px;min-width:auto;">
              <option value="locale">${m.dateFormatLocale}</option>
              <option value="short">${m.dateFormatShort}</option>
              <option value="iso">${m.dateFormatIso}</option>
            </select>
          </label>
        </div>
      </div>

      <div class="tabs" id="tabs">
        <button class="tab-btn active" data-tab="overview">${m.tabOverview}</button>
        <button class="tab-btn" data-tab="reading">${m.tabReadingStats}</button>
        <button class="tab-btn" data-tab="sync">${m.tabSyncRecords}</button>
      </div>

      <section class="tab-panel active" id="tab-overview">
        <div class="grid" id="overviewTopGrid">
          <div class="stat skeleton skeleton-stat"></div>
          <div class="stat skeleton skeleton-stat"></div>
          <div class="stat skeleton skeleton-stat"></div>
          <div class="stat skeleton skeleton-stat"></div>
        </div>
        <div class="two-col">
          <article class="panel">
            <div class="panel-head">
              <h4>${m.readingStatsTitle}</h4>
              <span class="pill accent">${m.sourceStats}</span>
            </div>
            <div class="panel-body" id="overviewStatsSide"></div>
            <div class="source-bar accent"></div>
          </article>
          <article class="panel">
            <div class="panel-head">
              <h4>${m.recordsTitle}</h4>
              <span class="pill">${m.sourceSync}</span>
            </div>
            <div class="panel-body" id="overviewSyncSide"></div>
            <div class="source-bar primary"></div>
          </article>
        </div>
        <div style="margin-top: 10px;">
          <h4 style="margin: 0 0 8px;">${m.deviceDistributionPrefix}</h4>
          <div id="deviceList" class="device-list"></div>
        </div>
      </section>

      <section class="tab-panel" id="tab-reading">
        <div class="grid" id="readingTopGrid">
          <div class="stat skeleton skeleton-stat"></div>
          <div class="stat skeleton skeleton-stat"></div>
          <div class="stat skeleton skeleton-stat"></div>
          <div class="stat skeleton skeleton-stat"></div>
        </div>
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
        <div id="booksEmpty" class="empty-state hidden">${m.emptyStatisticsBooks}</div>
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

    function formatDate(epochSec, fmt) {
      const sec = Number(epochSec || 0);
      if (!sec) return '-';
      const fmtKey = fmt || dateFmt;
      const locale = document.documentElement.lang || 'en';
      const fn = DATE_FORMATS[fmtKey] || DATE_FORMATS.locale;
      return fn(new Date(sec * MS_PER_SECOND), locale);
    }

    function setDateFmt(fmt) {
      localStorage.setItem('koreader_date_format', fmt);
      dateFmt = fmt;
      document.getElementById('dateFmtSelect').value = fmt;
      if (currentTab === 'overview') loadOverview();
      else if (currentTab === 'reading') loadReadingTab();
      else if (currentTab === 'sync') loadSyncTab();
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

    function truncateMiddle(input, left, right) {
      left = left || 8; right = right || 6;
      const raw = String(input || '');
      if (raw.length <= left + right + 3) return raw;
      return raw.slice(0, left) + '...' + raw.slice(-right);
    }

    function setMessage(el, text, isError) {
      el.textContent = text || '';
      el.className = 'text-secondary ' + (text ? (isError ? 'err' : 'ok') : '');
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
        : '<div class="text-secondary">' + escapeHtml(I18N.noData) + '</div>';

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

    const dateFmtEl = document.getElementById('dateFmtSelect');
    if (dateFmtEl) {
      dateFmtEl.value = dateFmt;
      dateFmtEl.addEventListener('change', () => setDateFmt(dateFmtEl.value));
    }

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
