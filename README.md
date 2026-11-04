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
- User Web UI for personal login, statistics, records, and device management

![User Web UI 1](https://github.com/user-attachments/assets/f38570a1-4421-42bc-a524-2e624cab1ca5)
![User Web UI 2](https://github.com/user-attachments/assets/cea579c4-ee79-4db4-a173-e190855b033a)


You can also check out [this site](https://ksync.api.tski.uk/) (Cloudflare Worker + D1) to see how it works.

## How to use

For example, I use public server at `https://ksync.api.tski.uk/`.

1. Download and install [this repo](https://github.com/Tokisaki-Galaxy/koreader-kosync2.kolpugin) to your KOReader device
2. Click the settings icon and configure the plugin, set the server URL to `https://ksync.api.tski.uk/`.
3. Click the register button to create a new account, or log in with your existing credentials.
4. If you want to use the web dashboard, visit `https://ksync.api.tski.uk/` in your browser and log in with your KOReader credentials.

## Device management

The user dashboard groups progress by device:

- Each device card shows records, last sync, share of records, and a short device ID.
- Expand a card to see document count, average progress, first and last sync, recent records, and actions.
- Rename stores a display alias. Hide moves the device into a collapsible hidden section.
- Merge moves progress and statistics attribution to another device. Name-only devices are merged without touching same-name devices that have a device ID.
- View all records filters the Data & Sync table by that device.
- When the plugin sends document metadata, record rows show the book title and authors instead of only the document hash.

Device identity is stored in `user_devices`, added by `0005_user_devices.sql` and refreshed by `0006_user_devices_backfill.sql`.

## Migrations

The Worker code and the D1 schema are deployed separately. Apply migrations before or immediately after deploying a Worker that depends on new columns or tables:

```bash
npx wrangler d1 migrations apply koreader-sync-db --remote
```

Current migrations:

- `0001_init.sql` users, progress, sessions
- `0002_statistics_sync.sql` statistics snapshot
- `0003_statistics_summary.sql` materialized statistics summary
- `0004_progress_metadata.sql` optional progress metadata
- `0005_user_devices.sql` device table and backfill
- `0006_user_devices_backfill.sql` timestamp backfill
- `0007_statistics_snapshot_chunks.sql` chunked statistics snapshot storage
- `0008_statistics_revision.sql` revision column for safe cached summary rebuilds

Large statistics snapshots and cached summaries are split across `statistics_snapshot_chunk` rows once they exceed 512 KB. This keeps every D1 row well below the 2 MB row limit. Data written by older versions stays in the inline columns and is still readable; the next statistics sync moves that user to chunked storage automatically.

A single merged statistics snapshot is capped at 8 MB. Larger payloads are rejected with HTTP 413 before the statistics write. This stays well clear of D1's 50 MB query result limit and the Worker memory limit.

The `/admin` Initialize Database button runs all bundled migrations, so it is also safe for existing deployments that skipped the CLI. Run `pnpm run check:migrations` to verify the generated SQL bundle is up to date.

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
- MCP server: `/mcp`, read-only tools over Streamable HTTP

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
- `GET /web/export/db-format` SQLite schema SQL for the client-side exporter
- `GET /web/export/data` full export payload for the current user (progress + statistics snapshot)
- `POST /web/import` restore progress/statistics parsed from an exported `.db` file
- `GET /` user dashboard page

### Data Export / Import (User Web UI)

The user dashboard includes an "Export / Import Data" section after login:

- **Export** downloads two real SQLite files, generated **client-side** (via `sql.js` served from this Worker at `/assets/sql-wasm.js` + `/assets/sql-wasm.wasm`, embedded as base64 constants so no external CDN or build-time module rules are needed, and the Worker stays within the free-tier CPU budget):
  - `statistics.sqlite3` — official KOReader reading-statistics schema (`book` + `page_stat_data` + `page_stat` view, `PRAGMA user_version=20221111`), readable directly by KOReader devices/tools.
  - `progress.db` — custom progress schema (`users` + `progress`). Note: official KOReader stores progress per-book in `.sdr/metadata.lua` (not a database), so there is no official progress DB format to match; this is our defined backup format.
- **Import** restores either file type (auto-detected by its tables) into the current user's account, merging with existing data (statistics are merged by book `md5`).


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
- `page_stat_data[].start_time` comes from the device clock. Entries more than 6 hours in the future are treated as a bad clock and left out of every reading statistic: daily totals, per-book days, streaks, hourly chart and trajectory. The raw snapshot is kept as-is so exports stay faithful.
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

### MCP Endpoints

- `POST /mcp` MCP endpoint over Streamable HTTP, protocol `2026-07-28` with a 2025-era fallback
- `POST /mcp/token` mint a bearer token from the account password
- `DELETE /mcp/token` revoke the bearer token used by the call

## MCP Server

The Worker also exposes a read-only Model Context Protocol server, so chat clients
can query reading progress and statistics with plain language.

- Endpoint: `POST /mcp` (Streamable HTTP, stateless, JSON-RPC over POST). Modern traffic answers with a JSON body and upgrades to SSE only when a tool emits mid-call messages.
- Protocol: `2026-07-28`. Requests carry their protocol version and client capabilities in `_meta`, and `server/discover` advertises the endpoint's capabilities without an `initialize` handshake.
- Backward compatibility: 2025-era clients (`initialize` through `2025-11-25`) are still served by the same endpoint through the SDK's stateless legacy path.
- `GET /mcp` returns `405` because the server has no standalone server-to-client stream, which the spec allows.
- `Origin` headers that do not match the request origin are rejected with `403` unless listed in `MCP_ALLOWED_ORIGINS`.

A modern call carries the envelope in `_meta` and the method in headers. This is
what MCP clients send automatically; it is only useful when debugging by hand:

```bash
curl -X POST https://your-host/mcp \
  -H "content-type: application/json" \
  -H "accept: application/json, text/event-stream" \
  -H "mcp-protocol-version: 2026-07-28" \
  -H "mcp-method: tools/call" \
  -H "mcp-name: list_books" \
  -H "authorization: Bearer <token>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_books",
      "arguments": { "limit": 5 },
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  }'
```

Without `_meta` the same endpoint treats the request as a 2025-era call and
expects the `initialize` handshake first.

### Authentication

Three forms are accepted:

1. `Authorization: Bearer <token>` with a token minted by `POST /mcp/token` (recommended)
2. `Authorization: Basic base64(username:password)` with the plain account password
3. `x-auth-user` + `x-auth-key` (KOReader native, key is `md5(password)`)

TLS encrypts headers in transit, so all three are safe against passive network
reading. A bearer token is still preferable: it can be revoked on its own and does
not put the account password into a client config file.

Mint a token:

```bash
curl -X POST https://your-host/mcp/token \
  -H "content-type: application/json" \
  -d '{"username":"reader","password":"your-password"}'
```

Revoke the token used by the call with `DELETE /mcp/token`.

Tokens slide forward: when a bearer token is used inside its renewal window it is
extended back to a full TTL, so a client that keeps calling never expires. Only
idle tokens lapse. Set `MCP_TOKEN_RENEW_WINDOW_HOURS=0` to disable renewal and
keep every token on a fixed expiry.

Token minting is rate limited to 10 attempts per minute per IP and username. The
counter is per Worker isolate, so it slows brute force without acting as a global
quota.

### Tools

| Tool | Purpose |
| --- | --- |
| `get_reading_overview` | Account-wide snapshot: documents, devices, total time, pages, streaks |
| `list_books` | Search, filter, sort and page through the statistics book list |
| `get_recent_reading` | What was read in the last N days, per book |
| `get_book_details` | One book's trajectory, daily history and recent sessions |
| `list_progress_records` | Sync records, newest first; exact lookup by `document` or `search` fragment |
| `get_reading_activity` | Daily minutes, streaks and 24-hour distribution |
| `get_activity_breakdown` | Per-book breakdown for one day, or one month with per-day buckets |

All tools are annotated `readOnlyHint: true`; nothing writes to the database.

### Response conventions

- Every tool returns compact JSON in a text block plus `structuredContent`. Six tools publish an `outputSchema`; `get_book_details` is the exception because it can return a book, an ambiguous candidate list, or an empty result.
- Progress percentages are always 0 to 100.
- An account with no synced statistics returns a successful empty payload with `hasData: false`; tool errors are reserved for invalid arguments and specific missing records, and carry `error.code` set to `invalid_argument` or `not_found`.
- Calendar dates follow the server's timezone at sync time, which is UTC on Cloudflare Workers. `timezone_offset_hours` only shifts hour buckets, it never moves a date.

The daily series is bounded to keep payloads small: `get_reading_activity`
returns the last 365 days unless `year` is given, while lifetime active days,
streaks and the hourly distribution still cover the full history.
`get_book_details` returns 365 days of daily history unless `history_days` is
raised.

### Client configuration

Bearer token, Streamable HTTP:

```json
{
  "mcpServers": {
    "koreader-sync": {
      "type": "http",
      "url": "https://your-host/mcp",
      "headers": { "Authorization": "Bearer <token-from-/mcp/token>" }
    }
  }
}
```

Claude Code:

```bash
claude mcp add --transport http koreader-sync https://your-host/mcp \
  --header "Authorization: Bearer <token>"
```

If the client only supports URL configuration, use Basic auth in the URL:
`https://user:password@your-host/mcp`.

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
- `SESSION_RENEW_WINDOW_HOURS`: optional sliding-session renewal window in hours, default is half of `SESSION_TTL_HOURS`. When an authenticated request arrives with at most this much lifetime left, the session is extended back to a full TTL. Set `0` to disable renewal, or the full TTL to renew on every request.
Runtime / database selector:
- `RUNTIME_TARGET`: `cloudflare` (default) or `node`; `vercel` is reserved but not implemented
- `DB_DRIVER`: `d1` (default) or `sqlite`; `postgres` is reserved but not implemented
- `SQLITE_PATH`: sqlite db path for `RUNTIME_TARGET=node` + `DB_DRIVER=sqlite`
OPTIONAL environment variables:
- `DEBUG`: optional (`"1"`/`"true"` enables debug error logs)
- `PBKDF2_ITERATIONS`: optional number of iterations for PBKDF2 hashing, default `20000` (adjust based on your performance/security needs)
- `ENABLE_USER_REGISTRATION`: optional (`"1"`/`"true"` to allow user self-registration, default is open registration)
- `MCP_TOKEN_TTL_HOURS`: optional lifetime for MCP bearer tokens in hours, default `2160` (90 days)
- `MCP_TOKEN_RENEW_WINDOW_HOURS`: optional renewal window for MCP bearer tokens in hours, default is half of `MCP_TOKEN_TTL_HOURS`. A token used inside this window is extended back to a full TTL, so only idle tokens expire. Set `0` to disable renewal.
- `MCP_ALLOWED_ORIGINS`: optional comma-separated origin allowlist for cross-origin MCP calls, for example `https://claude.ai`
