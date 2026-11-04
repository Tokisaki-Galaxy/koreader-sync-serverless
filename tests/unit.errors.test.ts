import { describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { logServerError } from "../src/services/errors";
import type { AppContext } from "../src/context";
import { createMockEnv } from "./helpers/mock-db";

describe("error logging", () => {
  it("logs structured server error context", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fakeContext = {
      get: (key: string) => {
        if (key === "requestId") return "req-123";
        if (key === "userId") return 42;
        return undefined;
      },
      req: { method: "PUT", path: "/syncs/progress" },
      env: { DEBUG: "0" },
    } as unknown as AppContext;

    logServerError(fakeContext, "progress", new Error("boom"));

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(spy.mock.calls[0][0]));
    expect(payload).toMatchObject({
      requestId: "req-123",
      method: "PUT",
      route: "/syncs/progress",
      userId: 42,
      label: "progress",
      message: "boom",
    });
    spy.mockRestore();
  });

  it("adds a request id header", async () => {
    const env = createMockEnv();
    const explicit = await app.request(
      "/healthcheck",
      { headers: { "x-request-id": "req-test" } },
      env
    );
    expect(explicit.status).toBe(200);
    expect(explicit.headers.get("x-request-id")).toBe("req-test");

    const generated = await app.request("/healthcheck", undefined, env);
    expect(generated.status).toBe(200);
    expect(generated.headers.get("x-request-id")).toMatch(/[0-9a-f-]{36}/);
  });
});
