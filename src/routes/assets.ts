import { Hono } from "hono";
import type { AppEnv } from "../context";
// sql-wasm.js is vendored as src/vendor/sql-wasm.js.txt and imported as a
// Text module (wrangler's default rule for .txt) so its raw source is served
// to the browser as a classic script. sql-wasm.wasm is imported via the
// [[rules]] Data module (ArrayBuffer). Tests stub both in vitest.config.ts.
import sqlWasmJs from "../vendor/sql-wasm.js.txt";
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
