import { Hono } from "hono";
import type { AppEnv } from "../context";
// These are resolved by wrangler module rules at build time:
//   - sql-wasm.js  -> Text module  (string source)
//   - sql-wasm.wasm -> Data module (ArrayBuffer)
// See the [[rules]] section in wrangler.toml. Tests mock these in vitest.config.ts.
import sqlWasmJs from "sql.js/dist/sql-wasm.js";
import sqlWasmBytes from "sql.js/dist/sql-wasm.wasm";

const router = new Hono<AppEnv>();

// sql.js is self-hosted so the client-side exporter needs no external CDN
// and the CSP stays locked down (no connect-src / wasm-unsafe-eval needed).
router.get("/assets/sql-wasm.js", (c) => {
  return c.body(sqlWasmJs, 200, {
    "content-type": "application/javascript; charset=utf-8",
    "cache-control": "public, max-age=86400",
  });
});

router.get("/assets/sql-wasm.wasm", (c) => {
  return c.body(sqlWasmBytes, 200, {
    "content-type": "application/wasm",
    "cache-control": "public, max-age=86400",
  });
});

export default router;
