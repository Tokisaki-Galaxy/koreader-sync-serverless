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
      --cal-0: #ebedf0;
      --cal-1: #9be9a8;
      --cal-2: #40c463;
      --cal-3: #30a14e;
      --cal-4: #216e39;
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
        --cal-0: #1b1f23;
        --cal-1: #0e4429;
        --cal-2: #006d32;
        --cal-3: #26a641;
        --cal-4: #39d353;
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
    .cal-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
    .cal-toolbar label { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
    .cal-toolbar select { padding: 4px 8px; font-size: 13px; min-width: auto; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface); color: var(--text); }
    .cal-wrap { overflow-x: auto; padding: 4px 0 10px; text-align: center; }
    .cal-chart { display: inline-block; text-align: left; }
    .cal-svg { display: block; }
    .cal-svg text { fill: var(--text-secondary); font-size: 10px; }
    .cal-cell { rx: 2; ry: 2; }
    .cal-lv0 { fill: var(--cal-0); background: var(--cal-0); }
    .cal-lv1 { fill: var(--cal-1); background: var(--cal-1); }
    .cal-lv2 { fill: var(--cal-2); background: var(--cal-2); }
    .cal-lv3 { fill: var(--cal-3); background: var(--cal-3); }
    .cal-lv4 { fill: var(--cal-4); background: var(--cal-4); }
    .cal-outside { opacity: .3; }
    .cal-cell:hover { stroke: var(--text); stroke-width: 1; }
    .cal-legend { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-secondary); margin-top: 8px; justify-content: flex-start; }
    .cal-legend .swatch { display: inline-block; width: 11px; height: 11px; border-radius: 2px; }
    .cal-tooltip {
      position: fixed; pointer-events: none; z-index: 100;
      background: #1e293b; color: #fff; padding: 4px 8px; border-radius: 4px;
      font-size: 12px; white-space: nowrap; opacity: 0; transition: opacity .12s ease;
    }
    .cal-tooltip.visible { opacity: 1; }
    .cal-empty { color: var(--text-secondary); text-align: center; padding: 40px 0; font-size: 13px; }
    .mc-wrap { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--border); }
    .mc-header { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px; }
    .mc-title { font-size: 16px; font-weight: 600; min-width: 140px; text-align: center; }
    .mc-btn {
      background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm);
      color: var(--text-secondary); cursor: pointer; padding: 4px 10px; font-size: 14px; line-height: 1;
      transition: color var(--transition), border-color var(--transition), background var(--transition);
    }
    .mc-btn:hover { color: var(--text); border-color: var(--text-secondary); background: var(--surface-hover); }
    .mc-btn:active { transform: scale(.95); }
    .mc-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;
      position: relative;
    }
    .mc-dow-row {
      display: contents;
    }
    .mc-dow-cell {
      background: var(--surface-hover);
      padding: 6px 4px;
      text-align: center;
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .mc-dow-cell.weekend { color: var(--danger); }
    .mc-cell {
      background: var(--surface);
      min-height: 110px;
      padding: 4px 5px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 10px;
      overflow: hidden;
    }
    .mc-cell.other-month { background: var(--surface-hover); opacity: .4; }
    .mc-cell.today { box-shadow: inset 0 0 0 1.5px var(--primary); }
    .mc-day-header {
      display: flex;
      align-items: baseline;
      gap: 4px;
      flex-shrink: 0;
    }
    .mc-day-num { font-weight: 700; font-size: 13px; color: var(--text); }
    .mc-day-num.weekend { color: var(--danger); }
    .mc-dow { color: var(--text-secondary); font-size: 9px; text-transform: uppercase; display: none; }
    .mc-books-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow: hidden;
      min-height: 0;
      position: relative;
    }
    .mc-book-bar {
      border-radius: 2px;
      padding: 1px 4px;
      font-size: 9px;
      line-height: 1.4;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: #fff;
      font-weight: 500;
      cursor: default;
      max-width: 100%;
      flex-shrink: 0;
    }
    .mc-book-bar:hover { filter: brightness(1.15); }
    .mc-book-bar.span {
      position: absolute;
      z-index: 1;
      max-width: none;
    }
    .mc-hour-area {
      height: 20px;
      display: flex;
      align-items: flex-end;
      gap: 1px;
      flex-shrink: 0;
      margin-top: auto;
    }
    .mc-hour-bar { width: 2px; border-radius: 1px 1px 0 0; flex-shrink: 0; background: var(--primary); }
    .mc-hour-bar.h0 { opacity: .15; }
    .mc-hour-bar.h1 { opacity: .3; }
    .mc-hour-bar.h2 { opacity: .45; }
    .mc-hour-bar.h3 { opacity: .6; }
    .mc-hour-bar.h4 { opacity: .8; }
    .mc-hour-bar.h5 { opacity: 1; }
    @media (prefers-color-scheme: dark) { .cal-tooltip { background: #f1f5f9; color: #0f172a; } }
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
      <form class="row" id="loginForm" action="javascript:;">
        <input id="username" placeholder="${m.usernamePlaceholder}" />
        <input id="password" type="password" placeholder="${m.passwordPlaceholder}" />
        <button id="loginBtn" type="submit">${m.loginButton}</button>
      </form>
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
        <button class="tab-btn" data-tab="calendar">${m.tabCalendar}</button>
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

      <section class="tab-panel" id="tab-calendar">
        <div class="cal-toolbar">
          <label>${m.dateFormatLabel}
            <select id="calYearSelect"></select>
          </label>
        </div>
        <div id="calContainer" class="cal-wrap"></div>
        <div id="calEmpty" class="cal-empty hidden">${m.noData}</div>
        <div class="mc-wrap" id="monthCal">
          <div class="mc-header">
            <button class="mc-btn" data-mc="year-prev">«</button>
            <button class="mc-btn" data-mc="month-prev">‹</button>
            <span class="mc-title" id="mcTitle"></span>
            <button class="mc-btn" data-mc="month-next">›</button>
            <button class="mc-btn" data-mc="year-next">»</button>
          </div>
          <div class="mc-grid" id="mcGrid"></div>
        </div>
      </section>

      <section class="card" id="backupCard" style="margin-top: 14px;">
        <h3 style="margin: 0 0 6px;">${m.exportTitle}</h3>
        <p class="text-secondary" style="margin: 0 0 12px;">${m.exportDescription}</p>
        <div class="row">
          <button id="exportStatisticsBtn">${m.exportStatisticsButton}</button>
          <button id="exportProgressBtn" class="secondary">${m.exportProgressButton}</button>
        </div>
        <h3 style="margin: 16px 0 6px;">${m.importTitle}</h3>
        <div class="row">
          <input id="importFile" type="file" accept=".sqlite3,.sqlite,.db" style="min-width: 220px; padding: 4px;" />
          <button id="importBtn">${m.importButton}</button>
        </div>
        <p id="backupMsg" class="text-secondary" style="margin-top: 8px;"></p>
      </section>
    </section>
  </div>

  <div id="calTooltip" class="cal-tooltip"></div>
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
    let dateFmt = localStorage.getItem('koreader_date_format') || 'locale';
    const loginCard = document.getElementById('loginCard');
    const appCard = document.getElementById('appCard');
    const loginMsg = document.getElementById('loginMsg');
    const tabsEl = document.getElementById('tabs');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    let currentTab = 'overview';
    const tabLoaded = { overview: false, reading: false, sync: false, calendar: false };

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

    function truncateMiddle(input, left = 8, right = 6) {
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

    function renderCalendar(days, years) {
      const container = document.getElementById('calContainer');
      const empty = document.getElementById('calEmpty');
      const yearSelect = document.getElementById('calYearSelect');

      if (!days || days.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        yearSelect.innerHTML = '';
        return;
      }
      empty.classList.add('hidden');

      const curYear = Number(yearSelect.value) || new Date().getFullYear();
      yearSelect.innerHTML = years.sort().map(function(y) {
        return '<option value="' + y + '"' + (y === curYear ? ' selected' : '') + '>' + y + '</option>';
      }).join('');
      const selectedYear = Number(yearSelect.value);

      const minMap = {};
      for (var i = 0; i < days.length; i++) {
        minMap[days[i].date] = days[i].minutes;
      }

      var maxMin = 0;
      for (var key in minMap) {
        if (minMap[key] > maxMin) maxMin = minMap[key];
      }

      var startDate = new Date(selectedYear, 0, 1);
      var endDate = new Date(selectedYear, 11, 31);
      while (startDate.getDay() !== 1) {
        startDate.setDate(startDate.getDate() - 1);
      }
      while (endDate.getDay() !== 0) {
        endDate.setDate(endDate.getDate() + 1);
      }

      var weeks = [];
      var cur = new Date(startDate);
      while (cur <= endDate) {
        var week = [];
        for (var d = 0; d < 7; d++) {
          var y = cur.getFullYear();
          var m = String(cur.getMonth() + 1).padStart(2, '0');
          var day = String(cur.getDate()).padStart(2, '0');
          var key = y + '-' + m + '-' + day;
          week.push({ key: key, min: minMap[key] || 0, inYear: cur.getFullYear() === selectedYear });
          cur.setDate(cur.getDate() + 1);
        }
        weeks.push(week);
      }

      var cellSize = 13;
      var gap = 3;
      var w = weeks.length * (cellSize + gap);
      var h = 7 * (cellSize + gap);
      var dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

      var html = '<svg class="cal-svg" width="' + (w + 35) + '" height="' + (h + 22) + '">';

      var monthLabels = [];
      for (var m = 0; m < 12; m++) {
        var firstDay = new Date(selectedYear, m, 1);
        var weekIndex = Math.floor((firstDay - startDate) / (7 * 24 * 60 * 60 * 1000));
        monthLabels.push({ index: weekIndex, label: firstDay.toLocaleDateString('en', { month: 'short' }) });
      }
      for (var mi = 0; mi < monthLabels.length; mi++) {
        var ml = monthLabels[mi];
        if (ml.index >= 0 && ml.index < weeks.length) {
          html += '<text x="' + (ml.index * (cellSize + gap) + 35) + '" y="12">' + escapeHtml(ml.label) + '</text>';
        }
      }

      for (var row = 0; row < 7; row++) {
        if (dayLabels[row]) {
          html += '<text x="0" y="' + (row * (cellSize + gap) + 22) + '">' + dayLabels[row] + '</text>';
        }
        for (var col = 0; col < weeks.length; col++) {
          var cell = weeks[col][row];
          if (!cell) continue;
          var x = col * (cellSize + gap) + 35;
          var y = row * (cellSize + gap) + 20;
          var lv = cell.min === 0 ? 0 : Math.min(4, Math.ceil((cell.min / maxMin) * 4));
          var cls = 'cal-cell cal-lv' + lv;
          if (!cell.inYear) cls += ' cal-outside';
          html += '<rect class="' + cls + '" width="' + cellSize + '" height="' + cellSize + '" x="' + x + '" y="' + y + '" data-date="' + cell.key + '" data-min="' + cell.min + '" />';
        }
      }

      html += '</svg>';

      var legendHtml = '<span>Less</span>';
      for (var li = 0; li <= 4; li++) {
        legendHtml += '<span class="swatch cal-lv' + li + '"></span>';
      }
      legendHtml += '<span>More</span>';

      container.innerHTML = '<div class="cal-chart">' + html + '</div><div class="cal-legend">' + legendHtml + '</div>';
    }

    function renderCalendarTooltip(e) {
      var el = document.getElementById('calTooltip');
      var target = e.target;
      if (target.tagName !== 'rect' || !target.classList.contains('cal-cell') || target.classList.contains('cal-outside')) {
        el.classList.remove('visible');
        return;
      }
      var date = target.getAttribute('data-date');
      var min = Number(target.getAttribute('data-min') || 0);
      el.textContent = date + ': ' + min + ' min';
      el.classList.add('visible');
      el.style.left = (e.clientX + 12) + 'px';
      el.style.top = (e.clientY - 28) + 'px';
    }

    async function loadCalendarTab() {
      const data = await jsonFetch('/web/stats/calendar');
      renderCalendar(data.days || [], data.years || []);
      loadMonthCalendar(new Date().getFullYear(), new Date().getMonth() + 1);
    }

    function getBookColor(md5) {
      var hash = 0;
      for (var i = 0; i < md5.length; i++) {
        hash = ((hash << 5) - hash) + md5.charCodeAt(i);
        hash = hash & hash;
      }
      var h = Math.abs(hash) % 360;
      var s = 55 + (Math.abs(hash * 7) % 15);
      var l = 45 + (Math.abs(hash * 13) % 15);
      return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
    }

    var MONTH_BAR_HEIGHT = 15;
    var MONTH_BAR_GAP = 1;

    function pad2(n) {
      return String(n).padStart(2, '0');
    }

    function parseDateKey(key) {
      var p = key.split('-');
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    function formatDateKey(d) {
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }

    function dayRowIndex(firstCol, day) {
      return Math.floor((firstCol + day - 1) / 7);
    }

    function buildBookIntervals(books, firstCol, daysInMonth) {
      var intervals = [];
      var md5s = Object.keys(books);
      for (var bi = 0; bi < md5s.length; bi++) {
        var md5 = md5s[bi];
        var bk = books[md5];
        var dateKeys = Object.keys(bk.days).sort();
        var i = 0;
        while (i < dateKeys.length) {
          var startKey = dateKeys[i];
          var endKey = startKey;
          var j = i + 1;
          while (j < dateKeys.length) {
            var cur = parseDateKey(endKey);
            var next = new Date(cur);
            next.setDate(next.getDate() + 1);
            if (formatDateKey(next) !== dateKeys[j]) break;
            if (next.getDay() === 1) break;
            endKey = dateKeys[j];
            j++;
          }
          var startDay = Number(startKey.split('-')[2]);
          var endDay = Number(endKey.split('-')[2]);
          if (startDay >= 1 && startDay <= daysInMonth && endDay >= 1 && endDay <= daysInMonth) {
            intervals.push({
              md5: md5,
              title: bk.title,
              startDay: startDay,
              endDay: endDay,
              row: dayRowIndex(firstCol, startDay),
              minutes: bk.totalMinutes || 0,
            });
          }
          i = j;
        }
      }
      return intervals;
    }

    function assignLanes(intervals) {
      var rows = {};
      for (var i = 0; i < intervals.length; i++) {
        var iv = intervals[i];
        (rows[iv.row] = rows[iv.row] || []).push(iv);
      }
      var rowKeys = Object.keys(rows);
      for (var ri = 0; ri < rowKeys.length; ri++) {
        var list = rows[rowKeys[ri]];
        list.sort(function(a, b) {
          if (a.startDay !== b.startDay) return a.startDay - b.startDay;
          var spanA = a.endDay - a.startDay;
          var spanB = b.endDay - b.startDay;
          if (spanA !== spanB) return spanB - spanA;
          return (b.minutes || 0) - (a.minutes || 0);
        });
        var laneMaxEnds = [];
        for (var k = 0; k < list.length; k++) {
          var iv2 = list[k];
          var placed = false;
          for (var li = 0; li < laneMaxEnds.length; li++) {
            if (iv2.startDay > laneMaxEnds[li]) {
              iv2.lane = li;
              laneMaxEnds[li] = Math.max(laneMaxEnds[li], iv2.endDay);
              placed = true;
              break;
            }
          }
          if (!placed) {
            iv2.lane = laneMaxEnds.length;
            laneMaxEnds.push(iv2.endDay);
          }
        }
      }
      return intervals;
    }

    function renderMonthBars(grid, intervals) {
      if (!intervals.length) return;
      var gridRect = grid.getBoundingClientRect();
      if (gridRect.width <= 0) return;
      for (var i = 0; i < intervals.length; i++) {
        var iv = intervals[i];
        var startArea = document.getElementById('mcBooks-' + iv.startDay);
        var endArea = document.getElementById('mcBooks-' + iv.endDay);
        if (!startArea || !endArea) continue;
        var startRect = startArea.getBoundingClientRect();
        var endRect = endArea.getBoundingClientRect();
        var barTop = startRect.top - gridRect.top + iv.lane * (MONTH_BAR_HEIGHT + MONTH_BAR_GAP);
        if (barTop + MONTH_BAR_HEIGHT > startRect.bottom - gridRect.top - 2) continue;
        var el = document.createElement('div');
        el.className = 'mc-book-bar span';
        el.style.left = (startRect.left - gridRect.left).toFixed(1) + 'px';
        el.style.top = barTop.toFixed(1) + 'px';
        el.style.width = (endRect.right - startRect.left).toFixed(1) + 'px';
        el.style.height = MONTH_BAR_HEIGHT + 'px';
        el.style.backgroundColor = getBookColor(iv.md5);
        el.textContent = iv.title;
        el.title = iv.title;
        grid.appendChild(el);
      }
    }

    function renderMonthCalendar(data, year, month) {
      var grid = document.getElementById('mcGrid');
      var title = document.getElementById('mcTitle');
      var monthName = new Date(year, month - 1).toLocaleDateString('en', { year: 'numeric', month: 'long' });
      title.textContent = monthName;

      if (!data || !data.books || Object.keys(data.books).length === 0) {
        grid.innerHTML = '<div class="text-secondary" style="padding:20px;text-align:center;">' + escapeHtml(I18N.noData) + '</div>';
        return;
      }

      var daysInMonth = new Date(year, month, 0).getDate();
      var firstDayOfWeek = new Date(year, month - 1, 1).getDay();
      var firstCol = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      var today = new Date();
      var todayKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      var totalCells = firstCol + daysInMonth;
      var totalRows = Math.ceil(totalCells / 7);

      var books = data.books;
      var md5s = Object.keys(books);

      var html = '<div class="mc-dow-row">';
      var dowNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (var di = 0; di < 7; di++) {
        var cls = 'mc-dow-cell' + (di >= 5 ? ' weekend' : '');
        html += '<div class="' + cls + '">' + dowNames[di] + '</div>';
      }
      html += '</div>';

      var dayGridPos = {};
      var cellRow;
      var cellCol;
      for (var d = 1; d <= daysInMonth; d++) {
        var pos = firstCol + d - 1;
        cellRow = Math.floor(pos / 7) + 2;
        cellCol = (pos % 7) + 1;
        dayGridPos[d] = { row: cellRow, col: cellCol };

        var dateObj = new Date(year, month - 1, d);
        var dow = dateObj.getDay();
        var dateKey = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var isToday = dateKey === todayKey;
        var isWeekend = dow === 0 || dow === 6;
        var cls = 'mc-cell';
        if (isToday) cls += ' today';
        var dayNumCls = 'mc-day-num' + (isWeekend ? ' weekend' : '');

        html += '<div class="' + cls + '" style="grid-row:' + cellRow + ';grid-column:' + cellCol + ';">';
        html += '<div class="mc-day-header"><span class="' + dayNumCls + '">' + d + '</span></div>';
        html += '<div class="mc-books-area" id="mcBooks-' + d + '"></div>';
        html += '<div class="mc-hour-area" id="mcHours-' + d + '"></div>';
        html += '</div>';
      }

      grid.innerHTML = html;

      var prevMonthDays = new Date(year, month - 1, 0).getDate();
      for (var d = 1; d <= daysInMonth; d++) {
        var pos = firstCol + d - 1;
        var dayRow = Math.floor(pos / 7) + 2;
        var dayCol = (pos % 7) + 1;

        var dateKey = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var hourTotals = [];
        var maxHour = 0;
        for (var h = 0; h < 24; h++) hourTotals[h] = 0;
        for (var bi = 0; bi < md5s.length; bi++) {
          var bk = books[md5s[bi]];
          if (bk.days[dateKey]) {
            var hours = bk.days[dateKey];
            for (var h in hours) hourTotals[Number(h)] += hours[h];
          }
        }
        for (var h = 0; h < 24; h++) { if (hourTotals[h] > maxHour) maxHour = hourTotals[h]; }

        var hourArea = document.getElementById('mcHours-' + d);
        if (hourArea) {
          if (maxHour === 0) { hourArea.innerHTML = ''; continue; }
          var hHtml = '';
          for (var h = 0; h < 24; h++) {
            var ht = hourTotals[h];
            var level = ht === 0 ? 0 : Math.min(5, Math.ceil((ht / maxHour) * 5));
            var barH = ht === 0 ? 0 : Math.max(2, (ht / maxHour) * 18);
            hHtml += '<div class="mc-hour-bar h' + level + '" style="height:' + barH.toFixed(1) + 'px"></div>';
          }
          hourArea.innerHTML = hHtml;
        }
      }

      renderMonthBars(grid, assignLanes(buildBookIntervals(books, firstCol, daysInMonth)));
    }

    var mcYear = new Date().getFullYear();
    var mcMonth = new Date().getMonth() + 1;
    var lastMonthData = null;
    var monthResizeTimer = null;

    function loadMonthCalendar(year, month) {
      mcYear = year;
      mcMonth = month;
      jsonFetch('/web/stats/calendar/detail?year=' + year + '&month=' + month).then(function(data) {
        lastMonthData = { data: data, year: year, month: month };
        renderMonthCalendar(data, year, month);
      }).catch(function() {});
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
      if (tabName === 'calendar') await loadCalendarTab();
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

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
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
        tabLoaded.calendar = false;
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

    const dateFmtEl = document.getElementById('dateFmtSelect');
    if (dateFmtEl) {
      dateFmtEl.value = dateFmt;
      dateFmtEl.addEventListener('change', () => setDateFmt(dateFmtEl.value));
    }

    document.getElementById('calContainer').addEventListener('mouseover', renderCalendarTooltip);
    document.getElementById('calContainer').addEventListener('mousemove', renderCalendarTooltip);
    document.getElementById('calContainer').addEventListener('mouseout', renderCalendarTooltip);
    document.getElementById('calYearSelect').addEventListener('change', async function() {
      try { await loadCalendarTab(); } catch {}
    });

    document.getElementById('monthCal').addEventListener('click', function(e) {
      var btn = e.target.closest('[data-mc]');
      if (!btn) return;
      var action = btn.getAttribute('data-mc');
      var y = mcYear, m = mcMonth;
      switch (action) {
        case 'year-prev': m -= 3; if (m <= 0) { m += 12; y--; } break;
        case 'year-next': m += 3; if (m > 12) { m -= 12; y++; } break;
        case 'month-prev': if (--m === 0) { m = 12; y--; } break;
        case 'month-next': if (++m === 13) { m = 1; y++; } break;
      }
      loadMonthCalendar(y, m);
    });

    window.addEventListener('resize', function() {
      if (currentTab !== 'calendar' || !lastMonthData) return;
      clearTimeout(monthResizeTimer);
      monthResizeTimer = setTimeout(function() {
        renderMonthCalendar(lastMonthData.data, lastMonthData.year, lastMonthData.month);
      }, 150);
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

    // ------------------------------------------------------------------
    // Data backup: client-side .db generation via sql.js (CDN), so that
    // the Worker stays within its free-tier CPU budget.
    // ------------------------------------------------------------------

    const SQLJS_BASE = '/assets/';
    let SQLPromise = null;

    function loadSqlJs() {
      if (!SQLPromise) {
        SQLPromise = new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = SQLJS_BASE + 'sql-wasm.js';
          script.onload = function() {
            if (typeof initSqlJs === 'function') {
              resolve(initSqlJs({ locateFile: function(file) { return SQLJS_BASE + file; } }));
            } else {
              reject(new Error('initSqlJs not found'));
            }
          };
          script.onerror = function() { reject(new Error('Failed to load sql.js')); };
          document.head.appendChild(script);
        });
      }
      return SQLPromise;
    }

    function setBackupMsg(text, isError) {
      setMessage(document.getElementById('backupMsg'), text, isError);
    }

    function downloadBlob(bytes, filename) {
      const blob = new Blob([bytes], { type: 'application/vnd.sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }

    function buildStatisticsDb(db, data, format) {
      db.run(format.statisticsSchemaSql);
      const rows = mapStatisticsToRows(data);
      const insertBook = db.prepare(
        'INSERT INTO book (title, authors, notes, last_open, highlights, pages, series, language, md5, total_read_time, total_read_pages) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
      );
      const insertStat = db.prepare(
        'INSERT INTO page_stat_data (id_book, page, start_time, duration, total_pages) VALUES (?,?,?,?,?)'
      );
      db.run('BEGIN TRANSACTION;');
      try {
        for (const book of rows.books) {
          insertBook.run([book.title, book.authors, book.notes, book.last_open, book.highlights, book.pages, book.series, book.language, book.md5, book.total_read_time, book.total_read_pages]);
        }
        for (const stat of rows.pageStatData) {
          insertStat.run([stat.id_book, stat.page, stat.start_time, stat.duration, stat.total_pages]);
        }
        db.run('COMMIT;');
      } catch (e) {
        db.run('ROLLBACK;');
        throw e;
      }
    }

    function mapStatisticsToRows(data) {
      const books = [];
      const pageStatData = [];
      const snapshotBooks = (data.statistics && data.statistics.snapshot && data.statistics.snapshot.books) || [];
      snapshotBooks.forEach(function(book, index) {
        const id = index + 1;
        books.push({
          title: book.title || '',
          authors: book.authors || '',
          notes: Number(book.notes) || 0,
          last_open: Number(book.last_open) || 0,
          highlights: Number(book.highlights) || 0,
          pages: Number(book.pages) || 0,
          series: book.series || '',
          language: book.language || '',
          md5: book.md5 || '',
          total_read_time: Number(book.total_read_time) || 0,
          total_read_pages: Number(book.total_read_pages) || 0,
        });
        (book.page_stat_data || []).forEach(function(stat) {
          pageStatData.push({
            id_book: id,
            page: stat.page == null ? null : Number(stat.page),
            start_time: Number(stat.start_time) || 0,
            duration: Number(stat.duration) || 0,
            total_pages: Number(stat.total_pages) || 0,
          });
        });
      });
      return { books: books, pageStatData: pageStatData };
    }

    function buildProgressDb(db, data, format) {
      db.run(format.progressSchemaSql);
      const insertUser = db.prepare('INSERT INTO users (id, username, created_at) VALUES (?,?,?)');
      insertUser.run([1, data.username || '', Number(data.created_at) || 0]);
      const insertProgress = db.prepare(
        'INSERT INTO progress (user_id, document, progress, percentage, device, device_id, timestamp, updated_at) VALUES (?,?,?,?,?,?,?,?)'
      );
      db.run('BEGIN TRANSACTION;');
      try {
        for (const row of data.progress || []) {
          insertProgress.run([1, row.document, row.progress || '', Number(row.percentage) || 0, row.device || '', row.device_id || '', Number(row.timestamp) || 0, Number(row.updated_at) || Number(row.timestamp) || 0]);
        }
        db.run('COMMIT;');
      } catch (e) {
        db.run('ROLLBACK;');
        throw e;
      }
    }

    async function exportData() {
      const [data, format] = await Promise.all([
        jsonFetch('/web/export/data'),
        jsonFetch('/web/export/db-format'),
      ]);
      const SQL = await loadSqlJs();
      return { data, format, SQL };
    }

    document.getElementById('exportStatisticsBtn').addEventListener('click', async () => {
      const btn = document.getElementById('exportStatisticsBtn');
      const oldText = btn.textContent;
      btn.textContent = I18N.exportBusy;
      btn.disabled = true;
      try {
        const { data, format, SQL } = await exportData();
        const db = new SQL.Database();
        buildStatisticsDb(db, data, format);
        const bytes = db.export();
        db.close();
        downloadBlob(bytes, 'statistics.sqlite3');
        setBackupMsg(I18N.statTotalBooks + ': ' + ((data.statistics && data.statistics.snapshot && data.statistics.snapshot.books || []).length), false);
      } catch (e) {
        setBackupMsg(e.message || I18N.requestFailed, true);
      } finally {
        btn.textContent = oldText;
        btn.disabled = false;
      }
    });

    document.getElementById('exportProgressBtn').addEventListener('click', async () => {
      const btn = document.getElementById('exportProgressBtn');
      const oldText = btn.textContent;
      btn.textContent = I18N.exportBusy;
      btn.disabled = true;
      try {
        const { data, format, SQL } = await exportData();
        const db = new SQL.Database();
        buildProgressDb(db, data, format);
        const bytes = db.export();
        db.close();
        downloadBlob(bytes, 'progress.db');
        setBackupMsg(I18N.statTotalRecords + ': ' + (data.progress || []).length, false);
      } catch (e) {
        setBackupMsg(e.message || I18N.requestFailed, true);
      } finally {
        btn.textContent = oldText;
        btn.disabled = false;
      }
    });

    async function parseImportedFile(file, SQL) {
      const buffer = await file.arrayBuffer();
      const db = new SQL.Database(new Uint8Array(buffer));
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0] || { values: [] };
      const tableNames = new Set((tables.values || []).map(function(row) { return String(row[0]); }));
      const result = { statistics: null, progress: null };

      if (tableNames.has('book') && tableNames.has('page_stat_data')) {
        const bookRows = db.exec('SELECT id, title, authors, notes, last_open, highlights, pages, series, language, md5, total_read_time, total_read_pages FROM book')[0] || { values: [] };
        const statRows = db.exec('SELECT id_book, page, start_time, duration, total_pages FROM page_stat_data')[0] || { values: [] };
        const books = (bookRows.values || []).map(function(row) {
          return {
            md5: row[9] || '',
            title: row[1] || '',
            authors: row[2] || '',
            notes: row[3] || 0,
            last_open: row[4] || 0,
            highlights: row[5] || 0,
            pages: row[6] || 0,
            series: row[7] || '',
            language: row[8] || '',
            total_read_time: row[10] || 0,
            total_read_pages: row[11] || 0,
            page_stat_data: [],
          };
        });
        (statRows.values || []).forEach(function(row) {
          const book = books[row[0] - 1];
          if (!book) return;
          book.page_stat_data.push({
            page: row[1] == null ? null : Number(row[1]),
            start_time: Number(row[2]) || 0,
            duration: Number(row[3]) || 0,
            total_pages: Number(row[4]) || 0,
          });
        });
        result.statistics = {
          schema_version: 20221111,
          device: 'imported',
          device_id: '',
          snapshot: { books: books },
        };
      }

      if (tableNames.has('progress')) {
        const progressRows = db.exec('SELECT document, progress, percentage, device, device_id, timestamp, updated_at FROM progress')[0] || { values: [] };
        result.progress = (progressRows.values || []).map(function(row) {
          return {
            document: row[0] || '',
            progress: row[1] || '',
            percentage: Number(row[2]) || 0,
            device: row[3] || '',
            device_id: row[4] || '',
            timestamp: Number(row[5]) || 0,
            updated_at: Number(row[6]) || Number(row[5]) || 0,
          };
        });
      }

      db.close();
      return result;
    }

    document.getElementById('importBtn').addEventListener('click', async () => {
      const fileInput = document.getElementById('importFile');
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const btn = document.getElementById('importBtn');
      const oldText = btn.textContent;
      btn.textContent = I18N.importBusy;
      btn.disabled = true;
      try {
        const SQL = await loadSqlJs();
        const parsed = await parseImportedFile(file, SQL);
        if (!parsed.statistics && !parsed.progress) {
          setBackupMsg(I18N.unsupportedFile, true);
          return;
        }
        const res = await fetch('/web/import', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            progress: parsed.progress || undefined,
            statistics: parsed.statistics || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.message || I18N.requestFailed);
        let msg = '';
        if (data.progress > 0) msg += I18N.importSuccessProgressPrefix + data.progress + I18N.importSuccessProgressSuffix;
        if (data.statisticsBooks > 0) msg += I18N.importSuccessStatisticsPrefix + data.statisticsBooks + I18N.importSuccessStatisticsSuffix;
        if (!msg) msg = I18N.importEmpty;
        setBackupMsg(msg, false);
        fileInput.value = '';
        tabLoaded.overview = false;
        tabLoaded.reading = false;
        tabLoaded.calendar = false;
        tabLoaded.sync = false;
        if (currentTab === 'overview') await loadOverview();
      } catch (e) {
        setBackupMsg(e.message || I18N.requestFailed, true);
      } finally {
        btn.textContent = oldText;
        btn.disabled = false;
      }
    });

    ensureAuthenticated();
  </script>
</body>
</html>`;
}
