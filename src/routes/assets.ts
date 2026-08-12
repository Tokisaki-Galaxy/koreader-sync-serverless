import { Hono } from "hono";
import type { AppEnv } from "../context";
// sql.js assets are embedded as base64 constants (src/vendor/*.b64.ts) so the
// client-side exporter works without any wrangler module rules - custom
// [[rules]] (Text/Data) proved unreliable across deploy pipelines, e.g. the
// PR preview build served the wasm as a WebAssembly.Module object instead of
// raw bytes. Base64 strings always bundle and decode identically everywhere.
import { SQL_WASM_JS_BASE64 } from "../vendor/sql-wasm.js.b64";
import { SQL_WASM_BASE64 } from "../vendor/sql-wasm.wasm.b64";

const router = new Hono<AppEnv>();

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

let jsBytesCache: string | null = null;
let wasmBytesCache: Uint8Array<ArrayBuffer> | null = null;

function getSqlWasmJs(): string {
  if (jsBytesCache === null) {
    jsBytesCache = new TextDecoder().decode(decodeBase64(SQL_WASM_JS_BASE64));
  }
  return jsBytesCache;
}

function getSqlWasmBytes(): Uint8Array<ArrayBuffer> {
  if (wasmBytesCache === null) {
    wasmBytesCache = decodeBase64(SQL_WASM_BASE64);
  }
  return wasmBytesCache;
}

router.get("/assets/sql-wasm.js", (c) => {
  return c.body(getSqlWasmJs(), 200, {
    "content-type": "application/javascript; charset=utf-8",
    "cache-control": "public, max-age=86400",
  });
});

router.get("/assets/sql-wasm.wasm", (c) => {
  return c.body(getSqlWasmBytes(), 200, {
    "content-type": "application/wasm",
    "cache-control": "public, max-age=86400",
  });
});

export default router;
