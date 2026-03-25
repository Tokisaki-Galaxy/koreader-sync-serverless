# KOReader Sync

<p align="center">
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudflare-D1-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

A KOReader sync service built with **Cloudflare Worker + D1**, including:
- KOReader-compatible sync APIs (register, auth, progress upload/fetch)
- Admin Web UI for user management (delete user, force reset password)
- User Web UI for personal login and statistics/records

## Deployment

### WEB
Click the button below to deploy your own instance of KOReader Sync directly to Cloudflare Workers:

[![deploy](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/tokisaki-galaxy/koreader-sync-serverless)

- Configure Secrets: Once deployed successfully, go to your Cloudflare Worker dashboard -> Settings -> Variables.
Add Secrets: Add `PASSWORD_PEPPER` and `ADMIN_TOKEN` as encrypted secrets.

- Redeploy: Trigger a redeploy for the secrets to take effect.

- Initialize Database: Visit your Worker URL at /admin, log in with your ADMIN_TOKEN, and click the Initialize Database button to create the required tables.

### CLI

1. Set production secrets:

```bash
npx wrangler secret put PASSWORD_PEPPER
npx wrangler secret put ADMIN_TOKEN
```

2. Apply remote migrations:

```bash
npx wrangler d1 migrations apply koreader-sync-db --remote
```

> If migrations are skipped, admins can initialize required tables from `/admin` after login.

3. Deploy Worker:

```bash
npm run deploy
```

## Architecture

- Runtime: Cloudflare Workers
- Database: Cloudflare D1 (SQLite)
- Web UIs served directly by Worker:
  - `/`: user dashboard
  - `/admin`: admin console

## API Overview

### KOReader-Compatible Endpoints

- `POST /users/create` register user
- `GET /users/auth` authenticate (`x-auth-user` + `x-auth-key`)
- `PUT /syncs/progress` upload progress
- `GET /syncs/progress/:document` fetch progress by document

> KOReader sends `x-auth-key` as `md5(plain_password)`. This service stores/verifies KOReader credentials against that value for protocol compatibility. MD5 is weak by itself; here it is only a protocol input and is still wrapped by server-side PBKDF2 hashing before storage.

### User Web Dashboard Endpoints

- `POST /web/auth/login` login (sets HttpOnly cookie)
- `POST /web/auth/logout` logout
- `GET /web/me` current user
- `GET /web/records?page=1&pageSize=20` reading records
- `GET /web/stats` statistics summary
- `GET /` user dashboard page

### Admin Web Endpoints (Token Auth)

- `POST /admin/auth/login` admin login with `{ "token": "..." }`
- `POST /admin/auth/logout` admin logout
- `GET /admin/me` current admin session status
- `GET /admin/init/status` check whether required tables exist
- `POST /admin/init` initialize required database tables and indexes
- `GET /admin/users` list users
- `DELETE /admin/users/:id` delete user
- `PUT /admin/users/:id/password` force reset user password
- `GET /admin` admin dashboard page

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Configure local vars:

```bash
cp .dev.vars.example .dev.vars
# Update PASSWORD_PEPPER with a strong random value
# Set ADMIN_TOKEN for admin console login
```

3. Create D1 database and update `wrangler.toml`:

```bash
npx wrangler d1 create koreader-sync-db
# Put returned database_id into wrangler.toml
```

4. Apply migrations:

```bash
npx wrangler d1 migrations apply koreader-sync-db --local
```

> You can also login to `/admin` first and use the “Initialize database” button when required tables are missing.

5. Start dev server:

```bash
npm run dev
```

## Security Notes

- Password hashing uses PBKDF2-SHA256 with high iteration count
- Web session cookie: `HttpOnly + Secure + SameSite=Lax`
- Session token is stored hashed in database
- All SQL uses bound parameters

## Runtime Configuration

- `PASSWORD_PEPPER`: required strong secret for password/session hashing
- `SESSION_TTL_HOURS`: optional session lifetime in hours, default `168`
- `ADMIN_TOKEN`: required for admin web login
- `DEBUG`: optional (`"1"`/`"true"` enables debug error logs)
- `PBKDF2_ITERATIONS`: optional PBKDF2 iteration count override, default `20000`
