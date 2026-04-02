# KOReader Sync

<p align="center">
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudflare-D1-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

A KOReader sync service with decoupled runtime/data adapters, currently supporting:
- **Cloudflare Worker + D1**
- **Local production (Node + SQLite)**

Includes:
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

### Docker (Production-like Local Runtime)

Docker now runs the **Node local-production runtime** (not `wrangler dev`):

1. Build image:

```bash
docker build -t koreader-sync:prod-local .
```

2. Run container:

```bash
docker run --rm -p 8787:8787 \
  -e RUNTIME_TARGET=node \
  -e DB_DRIVER=sqlite \
  -e SQLITE_PATH=/app/data/koreader-sync.db \
  -e PASSWORD_PEPPER=your-strong-secret \
  -e ADMIN_TOKEN=your-admin-token \
  -v $(pwd)/data:/app/data \
  koreader-sync:prod-local
```

3. Visit:

- Health check: `http://localhost:8787/healthcheck`
- User page: `http://localhost:8787/`
- Admin page: `http://localhost:8787/admin`

## Architecture

- Runtime targets:
  - `cloudflare` (implemented)
  - `node` (implemented for local production)
  - `vercel` (reserved interface, not implemented yet)
- Database drivers:
  - `d1` (Cloudflare runtime)
  - `sqlite` (Node runtime)
  - `postgres` (reserved interface, not implemented yet)
- Web UIs served directly by Worker:
  - `/`: user dashboard
  - `/admin`: admin console

## API Overview

### KOReader-Compatible Endpoints

- `POST /users/create` register user
- `GET /users/auth` authenticate (`x-auth-user` + `x-auth-key`)
- `PUT /syncs/progress` upload progress
- `GET /syncs/progress/:document` fetch progress by document
- `PUT /syncs/statistics` synchronize reading statistics snapshot

> KOReader sends `x-auth-key` as `md5(plain_password)`. This service stores/verifies KOReader credentials against that value for protocol compatibility. MD5 is weak by itself; here it is only a protocol input and is still wrapped by server-side PBKDF2 hashing before storage.

### User Web Dashboard Endpoints

- `POST /web/auth/login` login (sets HttpOnly cookie)
- `POST /web/auth/logout` logout
- `GET /web/me` current user
- `GET /web/records?page=1&pageSize=20` reading records
- `GET /web/stats` statistics summary
- `GET /web/statistics/books` synchronized books statistics list
- `GET /` user dashboard page

### Reading Statistics Sync Contract

`PUT /syncs/statistics` request body:

```json
{
  "schema_version": 20221111,
  "device": "KOReader Device Model",
  "device_id": "device-id-or-empty-string",
  "snapshot": {
    "books": [
      {
        "md5": "partial-md5",
        "title": "Book title",
        "authors": "Author",
        "notes": 0,
        "last_open": 1710000000,
        "highlights": 0,
        "pages": 320,
        "series": "Series #1",
        "language": "en",
        "total_read_time": 1234,
        "total_read_pages": 88,
        "page_stat_data": [
          {
            "page": 12,
            "start_time": 1710000100,
            "duration": 24,
            "total_pages": 320
          }
        ]
      }
    ]
  }
}
```

Notes:
- Auth is identical to other KOReader sync endpoints (`x-auth-user`, `x-auth-key`).
- Server uses `md5` as cross-device identity key for merge.
- Response format:

```json
{
  "ok": true,
  "snapshot": {
    "books": []
  }
}
```

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

## Local Production (Node + SQLite)

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
# set PASSWORD_PEPPER and ADMIN_TOKEN
# then set:
# RUNTIME_TARGET=node
# DB_DRIVER=sqlite
# SQLITE_PATH=./data/koreader-sync.db
```

3. Run:

```bash
npm run start:local-prod
```

4. Endpoints:

- Health check: `http://localhost:8787/healthcheck`
- User page: `http://localhost:8787/`
- Admin page: `http://localhost:8787/admin`

## Security Notes

- Password hashing uses PBKDF2-SHA256 with high iteration count
- Web session cookie: `HttpOnly + Secure + SameSite=Lax`
- Session token is stored hashed in database
- All SQL uses bound parameters

## Runtime Configuration

REQUIRED environment variables:
- `PASSWORD_PEPPER`: required strong secret for password/session hashing
- `ADMIN_TOKEN`: required for admin web login
- `SESSION_TTL_HOURS`: optional session lifetime in hours, default `168`
Runtime / database selector:
- `RUNTIME_TARGET`: `cloudflare` (default) or `node`; `vercel` is reserved but not implemented
- `DB_DRIVER`: `d1` (default) or `sqlite`; `postgres` is reserved but not implemented
- `SQLITE_PATH`: sqlite db path for `RUNTIME_TARGET=node` + `DB_DRIVER=sqlite`
OPTIONAL environment variables:
- `DEBUG`: optional (`"1"`/`"true"` enables debug error logs)
- `PBKDF2_ITERATIONS`: optional number of iterations for PBKDF2 hashing, default `20000` (adjust based on your performance/security needs)
- `ENABLE_USER_REGISTRATION`: optional (`"1"`/`"true"` to allow user self-registration, default is open registration)
