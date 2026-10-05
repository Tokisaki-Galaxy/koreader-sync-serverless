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
      --bg: #f8fafc;
      --surface: #ffffff;
      --surface-hover: #f1f5f9;
      --header-bg: #0b1120;
      --text: #0f172a;
      --text-secondary: #64748b;
      --primary: #4f46e5;
      --primary-soft: #eef2ff;
      --primary-hover: #4338ca;
      --primary-border: #c7d2fe;
      --accent: #059669;
      --accent-soft: #ecfdf5;
      --accent-border: #a7f3d0;
      --danger: #dc2626;
      --border: #e2e8f0;
      --border-subtle: rgba(15, 23, 42, 0.06);
      --shadow-sm: 0 1px 3px rgba(15,23,42,.05);
      --shadow-md: 0 4px 16px -2px rgba(15,23,42,.08);
      --shadow-lg: 0 10px 30px -4px rgba(15,23,42,.12);
      --radius: 12px;
      --radius-sm: 7px;
      --radius-full: 999px;
      --transition: .18s cubic-bezier(0.4, 0, 0.2, 1);
      --cal-0: #f1f5f9;
      --cal-1: #c7d2fe;
      --cal-2: #818cf8;
      --cal-3: #6366f1;
      --cal-4: #4338ca;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b0f19;
        --surface: #111827;
        --surface-hover: #172136;
        --header-bg: #060911;
        --text: #f8fafc;
        --text-secondary: #94a3b8;
        --primary: #6366f1;
        --primary-soft: rgba(99, 102, 241, 0.16);
        --primary-hover: #818cf8;
        --primary-border: rgba(99, 102, 241, 0.35);
        --accent: #10b981;
        --accent-soft: rgba(16, 185, 129, 0.16);
        --accent-border: rgba(16, 185, 129, 0.3);
        --danger: #f87171;
        --border: #1e293b;
        --border-subtle: rgba(255, 255, 255, 0.08);
        --shadow-sm: 0 1px 3px rgba(0,0,0,.3);
        --shadow-md: 0 4px 16px -2px rgba(0,0,0,.45);
        --shadow-lg: 0 10px 30px -4px rgba(0,0,0,.6);
        --cal-0: #172136;
        --cal-1: #1e293b;
        --cal-2: #3730a3;
        --cal-3: #4f46e5;
        --cal-4: #6366f1;
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
    .num { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; font-variant-numeric: tabular-nums; }
    /* Toast styles */
    #toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      min-width: 220px;
      max-width: 380px;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      color: #fff;
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fadeIn .2s cubic-bezier(0.4, 0, 0.2, 1);
      transition: opacity .25s ease, transform .25s ease;
    }
    .toast.ok { background: #059669; }
    .toast.err { background: #dc2626; }
    .toast.info { background: #4f46e5; }
    .toast.fade-out { opacity: 0; transform: translateY(-8px); }
    /* Login wrapper centering */
    .login-wrapper {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px 24px;
      box-shadow: var(--shadow-md);
    }
    .login-brand-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: var(--primary-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px;
      color: var(--primary);
    }
    .login-title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 4px;
      color: var(--text);
    }
    .login-desc {
      text-align: center;
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0 0 20px;
    }
    .copy-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: 6px;
      transition: background var(--transition), color var(--transition);
    }
    .copy-btn:hover {
      background: var(--surface-hover);
      color: var(--text);
    }
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
      display: flex;
      flex-direction: column;
      height: 100%;
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
      flex: 0 0 auto;
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
    .panel-body { padding: 14px; display: grid; gap: 10px; flex: 1 1 auto; align-content: start; }
    .kv { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13px; }
    .kv .key { color: var(--text-secondary); }
    .kv .value { font-weight: 600; }
    .source-bar { height: 6px; width: 100%; margin: 0; margin-top: auto; display: block; flex: 0 0 auto; }
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
    .habits-section { margin-bottom: 24px; }
    .habits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .hourly-chart-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px 16px 16px;
    }
    .hourly-chart-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .hourly-chart-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }
    .hourly-bars {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 120px;
      padding-top: 10px;
      border-bottom: 1px solid var(--border);
    }
    .hourly-col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      position: relative;
    }
    .hourly-bar {
      width: 100%;
      max-width: 18px;
      min-height: 2px;
      background: var(--primary);
      border-radius: 2px 2px 0 0;
      opacity: .85;
      transition: opacity var(--transition), height var(--transition);
      cursor: pointer;
    }
    .hourly-bar:hover { opacity: 1; background: var(--accent); }
    .hourly-labels {
      display: flex;
      gap: 4px;
      margin-top: 6px;
    }
    .hourly-label {
      flex: 1;
      text-align: center;
      font-size: 10px;
      color: var(--text-secondary);
      user-select: none;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--transition);
    }
    .modal-backdrop.open,
    .modal-backdrop.active {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-dialog {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 720px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(12px) scale(0.98);
      transition: transform var(--transition);
    }
    .modal-backdrop.open .modal-dialog,
    .modal-backdrop.active .modal-dialog {
      transform: translateY(0) scale(1);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .modal-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      line-height: 1.3;
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      font-size: 20px;
      line-height: 1;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
    }
    .modal-close-btn:hover {
      color: var(--text);
      background: var(--surface-hover);
    }
    .modal-body {
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .modal-section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 8px;
    }
    .modal-grid-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .modal-metric-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .modal-metric-label {
      font-size: 11px;
      color: var(--text-secondary);
    }
    .modal-metric-val {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }
    .trajectory-timeline {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      background: var(--bg);
    }
    .trajectory-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      padding: 4px 0;
      border-bottom: 1px dashed var(--border);
    }
    .trajectory-item:last-child {
      border-bottom: none;
    }
    .trajectory-date {
      font-family: monospace;
      color: var(--text);
      font-weight: 500;
    }
    .trajectory-stats {
      color: var(--text-secondary);
      display: flex;
      gap: 12px;
    }
    .modal-table-wrap {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      max-height: 220px;
      overflow-y: auto;
    }
    .book-title-btn {
      background: none;
      border: none;
      padding: 0;
      color: var(--primary);
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .book-title-btn:hover {
      color: var(--primary-hover);
    }
    .action-detail-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--primary);
      font-size: 11px;
      padding: 3px 8px;
      cursor: pointer;
      white-space: nowrap;
      transition: background var(--transition), border-color var(--transition);
    }
    .action-detail-btn:hover {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
    @media (prefers-color-scheme: dark) { .cal-tooltip { background: #f1f5f9; color: #0f172a; } }
    @media (max-width: 980px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
      .habits-grid { grid-template-columns: repeat(3, 1fr); }
      .two-col { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .topbar { padding: 12px 14px; }
      .title { font-size: 18px; }
      input { min-width: 100%; }
      .grid { grid-template-columns: 1fr; }
      .habits-grid { grid-template-columns: 1fr; }
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

  <div id="toast-container"></div>
  <div class="container">
    <div class="login-wrapper" id="loginCard">
      <div class="login-card">
        <div class="login-brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        </div>
        <h3 class="login-title">${m.loginSection}</h3>
        <p class="login-desc">${m.subtitle}</p>
        <form id="loginForm" action="javascript:;" style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <label style="display:block; font-size:12px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">${m.usernamePlaceholder}</label>
            <input id="username" placeholder="${m.usernamePlaceholder}" style="width:100%;" required />
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">${m.passwordPlaceholder}</label>
            <input id="password" type="password" placeholder="${m.passwordPlaceholder}" style="width:100%;" required />
          </div>
          <button id="loginBtn" type="submit" style="width:100%; margin-top:6px; padding:10px;">${m.loginButton}</button>
        </form>
        <p id="loginMsg" class="text-secondary" style="margin-top: 10px; font-size:12px; text-align:center; min-height:16px;"></p>
      </div>
    </div>

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
        <button class="tab-btn" data-tab="sync">${m.tabDataSync}</button>
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
        <div style="margin-top: 14px;">
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
          <div class="stat skeleton skeleton-stat"></div>
          <div class="stat skeleton skeleton-stat"></div>
          <div class="stat skeleton skeleton-stat"></div>
          <div class="stat skeleton skeleton-stat"></div>
        </div>
        <div class="tab-title-row" style="margin-top: 10px;">
          <h4>${m.statisticsBooksTitle}</h4>
          <div class="toolbar">
            <input id="bookSearch" type="search" placeholder="${m.searchBooksPlaceholder}" />
            <select id="bookFilter">
              <option value="all">${m.filterAll}</option>
              <option value="reading">${m.filterReading}</option>
              <option value="completed">${m.filterCompleted}</option>
              <option value="unread">${m.filterUnread}</option>
            </select>
            <select id="bookSort">
              <option value="last_open">${m.sortLastOpen}</option>
              <option value="read_time">${m.sortReadTime}</option>
              <option value="progress">${m.sortProgress}</option>
              <option value="pages">${m.sortPages}</option>
            </select>
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
                <th>${m.tableActions}</th>
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

        <section class="card" id="backupCard" style="margin-top: 20px; border-color: var(--border-subtle); background: var(--surface-hover);">
          <h3 style="margin: 0 0 6px;">${m.exportTitle}</h3>
          <p class="text-secondary" style="margin: 0 0 12px;">${m.exportDescription}</p>
          <div class="row">
            <button id="exportStatisticsBtn">${m.exportStatisticsButton}</button>
            <button id="exportProgressBtn" class="secondary">${m.exportProgressButton}</button>
          </div>
          <h3 style="margin: 16px 0 6px;">${m.importTitle}</h3>
          <div class="row">
            <input id="importFile" type="file" accept=".sqlite3,.sqlite,.db" aria-label="${m.importFileLabel}" style="min-width: 220px; padding: 4px;" />
            <button id="importBtn">${m.importButton}</button>
          </div>
          <p id="backupMsg" class="text-secondary" style="margin-top: 8px;"></p>
        </section>
      </section>

      <section class="tab-panel" id="tab-calendar">
        <div class="habits-section" id="habitsSection">
          <div class="habits-grid">
            <div class="stat"><div class="k">${m.statCurrentStreak}</div><div class="v" id="habitCurrentStreak">0 <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">${m.daysUnit}</span></div></div>
            <div class="stat"><div class="k">${m.statLongestStreak}</div><div class="v" id="habitLongestStreak">0 <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">${m.daysUnit}</span></div></div>
            <div class="stat"><div class="k">${m.statActiveDays}</div><div class="v" id="habitActiveDays">0 <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">${m.daysUnit}</span></div></div>
          </div>
          <div class="hourly-chart-card">
            <div class="hourly-chart-head">
              <span class="hourly-chart-title">${m.readingHabitsTitle} · ${m.hourlyDistributionLabel}</span>
            </div>
            <div class="hourly-bars" id="hourlyBars"></div>
            <div class="hourly-labels" id="hourlyLabels"></div>
          </div>
        </div>
        <div class="cal-toolbar">
          <label>${m.selectYear}
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
    </section>
  </div>

  <div id="bookDetailModal" class="modal-backdrop" aria-hidden="true">
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modalBookTitle">
      <div class="modal-header">
        <h3 class="modal-title" id="modalBookTitle">${m.bookDetailModalTitle}</h3>
        <button type="button" class="modal-close-btn" id="closeBookDetailBtn" aria-label="${m.close}">×</button>
      </div>
      <div class="modal-body" id="modalBookBody">
        <!-- populated dynamically -->
      </div>
    </div>
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

    function showToast(msg, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.textContent = msg;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-8px)';
        setTimeout(() => toast.remove(), 250);
      }, 3000);
    }

    function copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(I18N.copySuccess || 'Copied', 'success');
        }).catch(() => {
          showToast(text, 'info');
        });
      } else {
        showToast(text, 'info');
      }
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
        kvRow(I18N.statTotalBooks, Number(reading.totalBooks || 0)),
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
      const readTime = Number(readingStatistics.totalReadTime || 0);
      const readPages = Number(readingStatistics.totalReadPages || 0);
      const speed = readTime > 0 ? (readPages / (readTime / 3600)).toFixed(1) + ' p/h' : '-';
      const items = [
        [I18N.statTotalBooks, Number(readingStatistics.totalBooks || 0)],
        [I18N.statCompletedBooks, Number(readingStatistics.completedBooks || 0)],
        [I18N.statTotalReadTime, formatDuration(readTime)],
        [I18N.statTotalReadPages, readPages],
        [I18N.statReadingSpeed, speed],
        [I18N.statHighlights, Number(readingStatistics.totalHighlights || 0)],
        [I18N.statNotes, Number(readingStatistics.totalNotes || 0)],
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
        const rawMd5 = String(item.md5 || '');
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td><button type="button" class="book-title-btn open-book-detail" data-md5="' + escapeHtml(rawMd5) + '">' + escapeHtml(item.title) + '</button></td>' +
          '<td>' + escapeHtml(item.authors || '-') + '</td>' +
          '<td><span class="truncate num copy-click" data-copy="' + escapeHtml(rawMd5) + '" title="' + escapeHtml(rawMd5) + ' (Click to copy)">' + escapeHtml(truncateMiddle(rawMd5, 8, 6)) + ' 📋</span></td>' +
          '<td class="num">' + escapeHtml(pages) + '</td>' +
          '<td>' + escapeHtml(formatDuration(item.total_read_time)) + '</td>' +
          '<td class="read-pages">' +
            '<span class="num" style="min-width:32px;">' + escapeHtml(readPages) + '</span>' +
            '<div class="bar"><span style="width:' + escapeHtml(progress.toFixed(2)) + '%"></span></div>' +
            '<span style="font-size:11px;color:var(--text-tertiary);min-width:38px;text-align:right;">' + escapeHtml(progress.toFixed(0)) + '%</span>' +
          '</td>' +
          '<td>' + escapeHtml(formatDate(item.last_open)) + '</td>' +
          '<td><button type="button" class="action-detail-btn open-book-detail" data-md5="' + escapeHtml(rawMd5) + '">' + escapeHtml(I18N.bookDetailViewDetails) + '</button></td>';
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
        const rawDoc = String(item.document || '');
        const rawDevId = String(item.device_id || '');
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td><span class="truncate num copy-click" data-copy="' + escapeHtml(rawDoc) + '" title="' + escapeHtml(rawDoc) + ' (Click to copy)">' + escapeHtml(truncateMiddle(rawDoc, 10, 8)) + ' 📋</span></td>' +
          '<td><span class="chip-progress">' + escapeHtml(progressText) + '</span></td>' +
          '<td><span class="pill device">' + escapeHtml(item.device || I18N.noData) + '</span></td>' +
          '<td><span class="truncate num copy-click" data-copy="' + escapeHtml(rawDevId) + '" title="' + escapeHtml(rawDevId) + '">' + escapeHtml(truncateMiddle(rawDevId, 8, 6)) + '</span></td>' +
          '<td>' + escapeHtml(formatDate(item.timestamp)) + '</td>';
        tbody.appendChild(tr);
      }
    }

    function closeBookDetailModal() {
      const modal = document.getElementById('bookDetailModal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    }

    function openBookDetailModal() {
      const modal = document.getElementById('bookDetailModal');
      if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
      }
    }

    async function showBookDetail(md5) {
      const body = document.getElementById('modalBookBody');
      const titleEl = document.getElementById('modalBookTitle');
      if (!body) return;
      openBookDetailModal();
      body.innerHTML = '<div class="modal-loading">' + escapeHtml(I18N.loading) + '</div>';
      try {
        const data = await jsonFetch('/web/statistics/book/' + encodeURIComponent(md5));
        const b = data.book;
        if (!b) {
          body.innerHTML = '<div class="text-secondary">' + escapeHtml(I18N.errorBookNotFound) + '</div>';
          return;
        }
        if (titleEl) {
          titleEl.textContent = b.title || I18N.bookDetailModalTitle;
        }
        const pages = Number(b.pages || 0);
        const readPages = Number(b.total_read_pages || 0);
        const progress = pages > 0 ? Math.min(100, Math.max(0, (readPages / pages) * 100)) : 0;
        const readTime = Number(b.total_read_time || 0);

        let speedText = '-';
        if (b.reading_speed && b.reading_speed.pages_per_hour > 0) {
          speedText = b.reading_speed.pages_per_hour.toFixed(1) + ' ' + I18N.statReadingSpeedPerHour;
          if (b.reading_speed.seconds_per_page > 0) {
            speedText += ' (' + b.reading_speed.seconds_per_page.toFixed(1) + ' ' + I18N.statReadingSpeedSecPerPage + ')';
          }
        }

        const metaRows = [
          [I18N.tableTitle, b.title || '-'],
          [I18N.tableAuthors, b.authors || '-'],
          [I18N.series || 'Series', b.series || '-'],
          [I18N.language || 'Language', b.language || '-'],
          [I18N.tableMd5, b.md5 || '-'],
          [I18N.statLastOpen, formatDate(b.last_open)],
        ];

        const metricBoxes = [
          [I18N.tableReadTime, formatDuration(readTime)],
          [I18N.tableReadPages, readPages + ' / ' + (pages || '-')],
          [I18N.statReadingSpeed, speedText],
          [I18N.statNotes, Number(b.notes || 0)],
          [I18N.statHighlights, Number(b.highlights || 0)],
        ];

        let html = '<div class="modal-meta-grid">';
        for (const [k, v] of metaRows) {
          html += '<div class="meta-item"><span class="meta-k">' + escapeHtml(k) + ':</span> <span class="meta-v">' + escapeHtml(v) + '</span></div>';
        }
        html += '</div>';

        html += '<div class="modal-section-title">' + escapeHtml(I18N.readingProgress || 'Progress') + '</div>';
        html += '<div class="detail-progress-wrap">';
        html += '<div class="bar" style="height:10px;"><span style="width:' + escapeHtml(progress.toFixed(2)) + '%;background:var(--primary);height:100%;border-radius:4px;display:block;"></span></div>';
        html += '<div class="progress-info" style="display:flex;justify-content:space-between;margin-top:6px;font-size:12px;color:var(--text-secondary);">';
        html += '<span>' + escapeHtml(readPages) + ' / ' + escapeHtml(pages) + ' ' + escapeHtml(I18N.tablePages) + '</span>';
        html += '<span class="num">' + escapeHtml(progress.toFixed(1)) + '%</span>';
        html += '</div></div>';

        html += '<div class="modal-metric-grid" style="margin-top:16px;">';
        for (const [k, v] of metricBoxes) {
          html += '<div class="stat"><div class="k">' + escapeHtml(k) + '</div><div class="v num" style="font-size:15px;">' + escapeHtml(v) + '</div></div>';
        }
        html += '</div>';

        const daily = b.daily_history || b.dailyHistory || [];
        html += '<div class="modal-section-title">' + escapeHtml(I18N.bookDetailDailyBreakdown) + ' (' + daily.length + ')</div>';
        if (daily.length > 0) {
          html += '<div class="detail-timeline"><table class="data-table"><thead><tr>';
          html += '<th>' + escapeHtml(I18N.bookDetailSessionTime) + '</th>';
          html += '<th>' + escapeHtml(I18N.tableReadTime) + '</th>';
          html += '<th>' + escapeHtml(I18N.tableReadPages) + '</th>';
          html += '</tr></thead><tbody>';
          for (const d of daily) {
            html += '<tr>';
            html += '<td>' + escapeHtml(d.date) + '</td>';
            html += '<td>' + escapeHtml(formatDuration(d.duration)) + '</td>';
            html += '<td class="num">' + escapeHtml(d.pages) + '</td>';
            html += '</tr>';
          }
          html += '</tbody></table></div>';
        } else {
          html += '<div class="text-secondary" style="font-size:13px;padding:8px 0;">' + escapeHtml(I18N.bookDetailNoDailyHistory) + '</div>';
        }

        const sessions = b.recent_sessions || b.recentSessions || [];
        html += '<div class="modal-section-title">' + escapeHtml(I18N.bookDetailRecentSessions) + ' (' + sessions.length + ')</div>';
        if (sessions.length > 0) {
          html += '<div class="detail-timeline"><table class="data-table"><thead><tr>';
          html += '<th>' + escapeHtml(I18N.bookDetailSessionTime) + '</th>';
          html += '<th>' + escapeHtml(I18N.bookDetailSessionPage) + '</th>';
          html += '<th>' + escapeHtml(I18N.bookDetailSessionDuration) + '</th>';
          html += '</tr></thead><tbody>';
          for (const s of sessions) {
            html += '<tr>';
            html += '<td>' + escapeHtml(formatDate(s.timestamp)) + '</td>';
            html += '<td class="num">' + escapeHtml(s.page) + '</td>';
            html += '<td>' + escapeHtml(formatDuration(s.duration)) + '</td>';
            html += '</tr>';
          }
          html += '</tbody></table></div>';
        } else {
          html += '<div class="text-secondary" style="font-size:13px;padding:8px 0;">' + escapeHtml(I18N.bookDetailNoSessions) + '</div>';
        }

        body.innerHTML = html;
      } catch (err) {
        body.innerHTML = '<div class="text-secondary">' + escapeHtml(err.message || I18N.errorBookNotFound) + '</div>';
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

    function renderHourlyDistribution(hourly) {
      var barsEl = document.getElementById('hourlyBars');
      var labelsEl = document.getElementById('hourlyLabels');
      if (!barsEl || !labelsEl) return;
      var arr = Array.isArray(hourly) && hourly.length === 24 ? hourly : new Array(24).fill(0);
      var max = 0;
      for (var i = 0; i < 24; i++) {
        if (arr[i] > max) max = arr[i];
      }
      var barsHtml = '';
      var labelsHtml = '';
      for (var h = 0; h < 24; h++) {
        var val = Number(arr[h] || 0);
        var pct = max > 0 ? Math.max(3, Math.round((val / max) * 100)) : 3;
        var hStr = (h < 10 ? '0' : '') + h + ':00';
        barsHtml += '<div class="hourly-col" title="' + hStr + ': ' + val + ' min">' +
          '<div class="hourly-bar" data-hour="' + hStr + '" data-min="' + val + '" style="height: ' + pct + '%;"></div>' +
          '</div>';
        var labelText = (h % 3 === 0) ? (h < 10 ? '0' : '') + h : '';
        labelsHtml += '<div class="hourly-label">' + labelText + '</div>';
      }
      barsEl.innerHTML = barsHtml;
      labelsEl.innerHTML = labelsHtml;
    }

    function renderHourlyTooltip(e) {
      var el = document.getElementById('calTooltip');
      var target = e.target;
      if (!target || !target.classList.contains('hourly-bar')) return;
      var hStr = target.getAttribute('data-hour');
      var val = target.getAttribute('data-min');
      el.textContent = hStr + ': ' + val + ' min';
      el.classList.add('visible');
      el.style.left = (e.clientX + 12) + 'px';
      el.style.top = (e.clientY - 28) + 'px';
    }

    async function loadCalendarTab() {
      var tzOffsetHours = Math.round(-new Date().getTimezoneOffset() / 60);
      const data = await jsonFetch('/web/stats/calendar?tzOffset=' + tzOffsetHours);
      var curStreak = Number(data.currentStreak || 0);
      var longStreak = Number(data.longestStreak || 0);
      var actDays = Number(data.activeDays !== undefined ? data.activeDays : (data.days || []).length);
      var csEl = document.getElementById('habitCurrentStreak');
      if (csEl) csEl.innerHTML = curStreak + ' <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">' + I18N.daysUnit + '</span>';
      var lsEl = document.getElementById('habitLongestStreak');
      if (lsEl) lsEl.innerHTML = longStreak + ' <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">' + I18N.daysUnit + '</span>';
      var adEl = document.getElementById('habitActiveDays');
      if (adEl) adEl.innerHTML = actDays + ' <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">' + I18N.daysUnit + '</span>';

      renderHourlyDistribution(data.hourlyDistribution);
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
            hHtml += '<div class="mc-hour-bar h' + level + '" style="height:' + barH.toFixed(1) + 'px" title="' + String(h).padStart(2, '0') + ':00 - ' + ht + ' min"></div>';
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
      const search = (document.getElementById('bookSearch')?.value || '').trim();
      const status = document.getElementById('bookFilter')?.value || 'all';
      const sort = document.getElementById('bookSort')?.value || 'last_open';

      let queryParams = '?page=' + page + '&pageSize=' + pageSize;
      if (search) queryParams += '&search=' + encodeURIComponent(search);
      if (status && status !== 'all') queryParams += '&status=' + encodeURIComponent(status);
      if (sort) queryParams += '&sort=' + encodeURIComponent(sort);

      const [stats, books] = await Promise.all([
        jsonFetch('/web/stats'),
        jsonFetch('/web/statistics/books' + queryParams),
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

    let bookSearchTimer = null;
    document.getElementById('bookSearch')?.addEventListener('input', () => {
      clearTimeout(bookSearchTimer);
      bookSearchTimer = setTimeout(async () => {
        if (currentTab !== 'reading') return;
        document.getElementById('booksPage').value = '1';
        try { await loadReadingTab(); } catch {}
      }, 250);
    });

    document.getElementById('bookFilter')?.addEventListener('change', async () => {
      if (currentTab !== 'reading') return;
      document.getElementById('booksPage').value = '1';
      try { await loadReadingTab(); } catch {}
    });

    document.getElementById('bookSort')?.addEventListener('change', async () => {
      if (currentTab !== 'reading') return;
      document.getElementById('booksPage').value = '1';
      try { await loadReadingTab(); } catch {}
    });

    document.getElementById('loadBooksBtn').addEventListener('click', async () => {
      try {
        await loadReadingTab();
        tabLoaded.reading = true;
      } catch {}
    });

    document.getElementById('booksBody')?.addEventListener('click', (e) => {
      const target = e.target.closest('.open-book-detail');
      if (target && target.dataset.md5) {
        showBookDetail(target.dataset.md5);
      }
    });

    document.getElementById('closeBookDetailBtn')?.addEventListener('click', closeBookDetailModal);
    document.getElementById('bookDetailModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'bookDetailModal') {
        closeBookDetailModal();
      }
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeBookDetailModal();
      }
    });

    const dateFmtEl = document.getElementById('dateFmtSelect');
    if (dateFmtEl) {
      dateFmtEl.value = dateFmt;
      dateFmtEl.addEventListener('change', () => setDateFmt(dateFmtEl.value));
    }

    document.getElementById('calContainer').addEventListener('mouseover', renderCalendarTooltip);
    document.getElementById('calContainer').addEventListener('mousemove', renderCalendarTooltip);
    document.getElementById('calContainer').addEventListener('mouseout', renderCalendarTooltip);

    var hourlyBarsEl = document.getElementById('hourlyBars');
    if (hourlyBarsEl) {
      hourlyBarsEl.addEventListener('mouseover', renderHourlyTooltip);
      hourlyBarsEl.addEventListener('mousemove', renderHourlyTooltip);
      hourlyBarsEl.addEventListener('mouseout', function() {
        var el = document.getElementById('calTooltip');
        if (el) el.classList.remove('visible');
      });
    }
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

    document.addEventListener('click', (e) => {
      const copyTarget = e.target.closest('.copy-click');
      if (copyTarget) {
        const text = copyTarget.dataset.copy || copyTarget.getAttribute('data-copy');
        if (text) copyToClipboard(text);
      }
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
            id: Number(row[0]) || 0,
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
        // Real KOReader DBs can have gaps in book ids (deleted rows), so map
        // by exact id instead of assuming ids are dense starting at 1.
        const bookById = {};
        for (const b of books) {
          if (b.id > 0) bookById[b.id] = b;
        }
        (statRows.values || []).forEach(function(row) {
          const book = bookById[Number(row[0])];
          if (!book) return;
          book.page_stat_data.push({
            page: row[1] == null ? null : Number(row[1]),
            start_time: Number(row[2]) || 0,
            duration: Number(row[3]) || 0,
            total_pages: Number(row[4]) || 0,
          });
        });
        // Strip internal ids before sending to the server.
        for (const b of books) {
          delete b.id;
        }
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
