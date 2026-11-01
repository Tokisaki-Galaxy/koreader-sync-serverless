import { describe, expect, it } from "vitest";
import app from "../src/index";
import { createMockEnv, readSessionExpiry } from "./helpers/mock-db";
import { sha256 } from "../src/crypto";

const MCP_HEADERS = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
};

const KOREADER_KEY = "5f4dcc3b5aa765d61d8327deb882cf99";

async function readJsonRpcResponse(res: Response): Promise<any> {
  const text = await res.text();
  const dataLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"));
  if (dataLines.length === 0) {
    throw new Error(`No SSE data frame in response: ${text}`);
  }
  return JSON.parse(dataLines[dataLines.length - 1].slice("data:".length).trim());
}

async function rpc(
  env: ReturnType<typeof createMockEnv>,
  headers: Record<string, string>,
  message: Record<string, unknown>
): Promise<Response> {
  return app.request(
    "/mcp",
    {
      method: "POST",
      headers: { ...MCP_HEADERS, ...headers },
      body: JSON.stringify({ jsonrpc: "2.0", ...message }),
    },
    env
  );
}

async function seedAccount(env: ReturnType<typeof createMockEnv>, username = "reader"): Promise<Record<string, string>> {
  const register = await app.request(
    "/users/create",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password: "password" }),
    },
    env
  );
  expect(register.status).toBe(201);

  const auth = { "x-auth-user": username, "x-auth-key": KOREADER_KEY };
  const now = Math.floor(Date.now() / 1000);

  const stats = await app.request(
    "/syncs/statistics",
    {
      method: "PUT",
      headers: {
        ...auth,
        "content-type": "application/json",
        "x-client-version": "y-anna-1.0",
        "user-agent": "Mozilla/DONTLIKE/ANYTHING",
      },
      body: JSON.stringify({
        schema_version: 20221111,
        device: "Kindle",
        device_id: "k-1",
        snapshot: {
          books: [
            {
              md5: "bbb",
              title: "Book B",
              authors: "Bee",
              notes: 0,
              last_open: now - 100,
              highlights: 1,
              pages: 200,
              series: "",
              language: "en",
              total_read_time: 3600,
              total_read_pages: 100,
              page_stat_data: [{ page: 1, start_time: now - 3600, duration: 1800, total_pages: 200 }],
            },
            {
              md5: "aaa",
              title: "Book A",
              authors: "Ay",
              notes: 2,
              last_open: now - 50,
              highlights: 3,
              pages: 100,
              series: "",
              language: "en",
              total_read_time: 600,
              total_read_pages: 100,
              page_stat_data: [{ page: 1, start_time: now - 7200, duration: 600, total_pages: 100 }],
            },
          ],
        },
      }),
    },
    env
  );
  expect(stats.status).toBe(200);

  const progress = await app.request(
    "/syncs/progress",
    {
      method: "PUT",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({
        document: "novels/book-a.epub",
        progress: "page:42",
        percentage: 42.5,
        device: "Kindle",
        device_id: "k-1",
      }),
    },
    env
  );
  expect(progress.status).toBe(200);

  return auth;
}

describe("MCP modern protocol 2026-07-28", () => {
  const MODERN_META = {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {},
  };

  async function modernRpc(
    env: ReturnType<typeof createMockEnv>,
    auth: Record<string, string>,
    id: number,
    method: string,
    params: Record<string, unknown> = {},
    name?: string
  ): Promise<Response> {
    const headers: Record<string, string> = {
      ...MCP_HEADERS,
      ...auth,
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": method,
    };
    if (name) headers["mcp-name"] = name;

    return app.request(
      "/mcp",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id,
          method,
          params: { ...params, _meta: MODERN_META },
        }),
      },
      env
    );
  }

  it("advertises supported versions through server/discover", async () => {
    const env = createMockEnv();
    const auth = await seedAccount(env);

    const res = await modernRpc(env, auth, 1, "server/discover");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.resultType).toBe("complete");
    expect(body.result.supportedVersions).toContain("2026-07-28");
    expect(body.result.serverInfo ?? body.result._meta["io.modelcontextprotocol/serverInfo"]).toMatchObject({
      name: "koreader-sync",
      version: "1.0.0",
    });
  });

  it("serves tools/list and tools/call without an initialize handshake", async () => {
    const env = createMockEnv();
    const auth = await seedAccount(env);

    const listRes = await modernRpc(env, auth, 2, "tools/list");
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list.result.resultType).toBe("complete");
    expect(list.result.tools).toHaveLength(7);
    expect(list.result.ttlMs).toBeTypeOf("number");
    expect(list.result.cacheScope).toMatch(/^(public|private)$/);

    const callRes = await modernRpc(env, auth, 3, "tools/call", { name: "list_books", arguments: {} }, "list_books");
    expect(callRes.status).toBe(200);
    const call = await callRes.json();
    expect(call.result.resultType).toBe("complete");
    const payload = JSON.parse(call.result.content[0].text);
    expect(payload.total).toBe(2);
  });

  it("rejects modern requests missing the Mcp-Method header", async () => {
    const env = createMockEnv();
    const auth = await seedAccount(env);

    const res = await app.request(
      "/mcp",
      {
        method: "POST",
        headers: { ...MCP_HEADERS, ...auth, "mcp-protocol-version": "2026-07-28" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 4,
          method: "tools/list",
          params: { _meta: MODERN_META },
        }),
      },
      env
    );
    expect(res.status).toBe(400);
  });
});

describe("MCP server", () => {
  it("rejects unauthenticated requests with a Bearer challenge", async () => {
    const env = createMockEnv();
    const res = await rpc(env, {}, {
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } },
    });

    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Bearer");
    const body = await res.json();
    expect(body.error).toMatchObject({ code: -32001, message: "Unauthorized" });
  });

  it("mints a bearer token from the account password and revokes it", async () => {
    const env = createMockEnv();
    await seedAccount(env);

    const badLogin = await app.request(
      "/mcp/token",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "reader", password: "wrong-password" }),
      },
      env
    );
    expect(badLogin.status).toBe(401);

    const login = await app.request(
      "/mcp/token",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "reader", password: "password" }),
      },
      env
    );
    expect(login.status).toBe(201);
    const payload = await login.json();
    expect(payload.token_type).toBe("Bearer");
    expect(payload.expires_in).toBe(2160 * 3600);
    expect(typeof payload.access_token).toBe("string");

    const tokenHash = await sha256(`${payload.access_token}:${env.PASSWORD_PEPPER}`);
    const expiresAt = readSessionExpiry(env, tokenHash);
    expect(expiresAt).not.toBeNull();

    const authHeaders = { authorization: `Bearer ${payload.access_token}` };
    const ok = await rpc(env, authHeaders, {
      id: 2,
      method: "initialize",
      params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } },
    });
    expect(ok.status).toBe(200);

    const revoke = await app.request(
      "/mcp/token",
      { method: "DELETE", headers: { authorization: `Bearer ${payload.access_token}` } },
      env
    );
    expect(revoke.status).toBe(200);
    expect(readSessionExpiry(env, tokenHash)).toBeNull();

    const afterRevoke = await rpc(env, authHeaders, {
      id: 3,
      method: "tools/list",
      params: {},
    });
    expect(afterRevoke.status).toBe(401);
  });

  it("negotiates protocol version 2025-11-25 and lists read-only tools", async () => {
    const env = createMockEnv();
    const auth = await seedAccount(env);

    const initRes = await rpc(env, auth, {
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "vitest", version: "1.0.0" },
      },
    });
    expect(initRes.status).toBe(200);
    expect(initRes.headers.get("content-type")).toContain("text/event-stream");

    const init = await readJsonRpcResponse(initRes);
    expect(init.result.protocolVersion).toBe("2025-11-25");
    expect(init.result.serverInfo).toMatchObject({ name: "koreader-sync", version: "1.0.0" });
    expect(init.result.capabilities.tools).toBeDefined();

    const listRes = await rpc(env, auth, { id: 2, method: "tools/list", params: {} });
    const list = await readJsonRpcResponse(listRes);
    const names = list.result.tools.map((tool: { name: string }) => tool.name).sort();
    expect(names).toEqual([
      "get_book_details",
      "get_document_progress",
      "get_month_activity",
      "get_reading_activity",
      "get_reading_overview",
      "list_books",
      "list_progress_records",
    ]);
    for (const tool of list.result.tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("serves reading data to list_books and get_reading_overview", async () => {
    const env = createMockEnv();
    const auth = await seedAccount(env);

    const listRes = await rpc(env, auth, {
      id: 1,
      method: "tools/call",
      params: { name: "list_books", arguments: { sort_by: "read_time", limit: 10 } },
    });
    const list = await readJsonRpcResponse(listRes);
    expect(list.result.isError).toBeUndefined();
    const books = JSON.parse(list.result.content[0].text);
    expect(books.total).toBe(2);
    expect(books.books[0].md5).toBe("bbb");
    expect(books.books[0].totalReadMinutes).toBe(60);
    expect(books.books[0].progressPercent).toBe(50);

    const overviewRes = await rpc(env, auth, {
      id: 2,
      method: "tools/call",
      params: { name: "get_reading_overview", arguments: {} },
    });
    const overview = JSON.parse((await readJsonRpcResponse(overviewRes)).result.content[0].text);
    expect(overview.username).toBe("reader");
    expect(overview.hasStatistics).toBe(true);
    expect(overview.sync.documents).toBe(1);
    expect(overview.reading.books).toBe(2);
    expect(overview.reading.completedBooks).toBe(1);
    expect(overview.reading.totalReadMinutes).toBe(70);
    expect(overview.devices[0]).toEqual({ device: "Kindle", count: 1 });
  });

  it("looks up a book by title and by document progress", async () => {
    const env = createMockEnv();
    const auth = await seedAccount(env);

    const detailRes = await rpc(env, auth, {
      id: 1,
      method: "tools/call",
      params: { name: "get_book_details", arguments: { title: "book a", recent_sessions_limit: 5 } },
    });
    const detail = await readJsonRpcResponse(detailRes);
    expect(detail.result.isError).toBeUndefined();
    const book = JSON.parse(detail.result.content[0].text);
    expect(book.md5).toBe("aaa");
    expect(book.progressPercent).toBe(100);
    expect(book.dailyHistory).toHaveLength(1);
    expect(book.recentSessions).toHaveLength(1);

    const progressRes = await rpc(env, auth, {
      id: 2,
      method: "tools/call",
      params: { name: "get_document_progress", arguments: { document: "novels/book-a.epub" } },
    });
    const progress = JSON.parse((await readJsonRpcResponse(progressRes)).result.content[0].text);
    expect(progress).toMatchObject({
      document: "novels/book-a.epub",
      found: true,
      progress: "page:42",
      percentage: 42.5,
      device: "Kindle",
      deviceId: "k-1",
    });
  });

  it("accepts Basic auth and rejects unsupported protocol versions", async () => {
    const env = createMockEnv();
    await seedAccount(env);
    const basic = `Basic ${Buffer.from("reader:password", "utf8").toString("base64")}`;

    const initRes = await rpc(env, { authorization: basic }, {
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "test", version: "1" },
      },
    });
    expect(initRes.status).toBe(200);

    const badVersion = await rpc(
      env,
      { authorization: basic, "mcp-protocol-version": "1999-01-01" },
      { id: 2, method: "tools/list", params: {} }
    );
    expect(badVersion.status).toBe(400);
  });

  it("answers the CORS preflight and refuses foreign origins", async () => {
    const env = createMockEnv();
    const preflight = await app.request(
      "/mcp",
      {
        method: "OPTIONS",
        headers: {
          origin: "https://client.example.com",
          "access-control-request-method": "POST",
        },
      },
      env
    );
    expect(preflight.status).toBe(403);

    const allowedEnv = { ...env, MCP_ALLOWED_ORIGINS: "https://client.example.com" };
    const allowed = await app.request(
      "/mcp",
      {
        method: "OPTIONS",
        headers: {
          origin: "https://client.example.com",
          "access-control-request-method": "POST",
        },
      },
      allowedEnv
    );
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("access-control-allow-origin")).toBe("https://client.example.com");
  });
});
