export function renderAdminPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KOReader Sync · 管理后台</title>
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
    <h1 class="title">KOReader Sync 管理后台</h1>
    <p class="subtitle">管理员通过 token 登录后可管理用户（删除/强制改密）。用户入口：<a href="/" style="color:#93c5fd;">/</a></p>

    <section class="card" id="loginCard">
      <h3 style="margin-top:0;">管理员登录（Token）</h3>
      <div class="row">
        <input id="token" type="password" placeholder="请输入 ADMIN_TOKEN" />
        <button id="loginBtn">登录</button>
      </div>
      <p id="loginMsg" class="muted" style="margin-top:8px;"></p>
    </section>

    <section class="card hidden" id="adminCard">
      <div class="row" style="justify-content:space-between;">
        <div class="row">
          <h3 style="margin:0;">用户管理</h3>
          <span class="badge">Admin Token Session</span>
        </div>
        <div class="row">
          <button id="refreshBtn" class="secondary">刷新</button>
          <button id="logoutBtn" class="secondary">退出</button>
        </div>
      </div>
      <p id="adminInfo" class="muted" style="margin-top:8px;"></p>
      <div style="overflow:auto; margin-top:10px; max-height:580px;">
        <table>
          <thead>
            <tr><th>ID</th><th>用户名</th><th>创建时间</th><th>操作</th></tr>
          </thead>
          <tbody id="usersBody"></tbody>
        </table>
      </div>
      <p id="adminMsg" class="muted" style="margin-top:10px;"></p>
    </section>
  </div>

  <script>
    const MS_PER_SECOND = 1000;
    const loginCard = document.getElementById('loginCard');
    const adminCard = document.getElementById('adminCard');
    const loginMsg = document.getElementById('loginMsg');
    const adminMsg = document.getElementById('adminMsg');

    function escapeHtml(value) {
      return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    function setMessage(el, text, isError) {
      el.textContent = text || '';
      el.className = 'muted ' + (text ? (isError ? 'err' : 'ok') : '');
    }

    async function jsonFetch(url, options = {}) {
      const res = await fetch(url, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '请求失败');
      return data;
    }

    async function loadAdmin() {
      try {
        await jsonFetch('/admin/me');
        loginCard.classList.add('hidden');
        adminCard.classList.remove('hidden');
        document.getElementById('adminInfo').textContent = '当前状态：已登录';
        await loadUsers();
      } catch {
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
            '<input data-kind="password" type="password" aria-label="用户 ' + escapeHtml(item.username) + '（ID: ' + Number(item.id) + '）的新密码" placeholder="新密码（至少8位）" />' +
            '<button data-kind="reset" data-id="' + Number(item.id) + '">重置密码</button>' +
            '<button class="danger" data-kind="delete" data-id="' + Number(item.id) + '">删除用户</button>' +
          '</div></td>';
        tbody.appendChild(tr);
      }
    }

    document.getElementById('loginBtn').addEventListener('click', async () => {
      const token = document.getElementById('token').value;
      try {
        await jsonFetch('/admin/auth/login', { method: 'POST', body: JSON.stringify({ token }) });
        setMessage(loginMsg, '登录成功', false);
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
      try { await loadUsers(); } catch {}
    });

    document.getElementById('usersBody').addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const kind = target.getAttribute('data-kind');
      const id = Number(target.getAttribute('data-id'));
      if (!Number.isInteger(id) || id <= 0) return;

      try {
        if (kind === 'delete') {
          if (!confirm('确认删除用户 #' + id + '？此操作会删除其会话与阅读数据。')) return;
          await jsonFetch('/admin/users/' + id, { method: 'DELETE' });
          setMessage(adminMsg, '删除成功：#' + id, false);
        } else if (kind === 'reset') {
          const row = target.closest('tr');
          const input = row ? row.querySelector('input[data-kind="password"]') : null;
          const password = input ? input.value : '';
          await jsonFetch('/admin/users/' + id + '/password', { method: 'PUT', body: JSON.stringify({ password }) });
          if (input) input.value = '';
          setMessage(adminMsg, '密码重置成功：#' + id, false);
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
