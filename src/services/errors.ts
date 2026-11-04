import type { AppContext } from "../context";

/** Log an unexpected server-side failure with enough context to correlate it. */
export function logServerError(
  c: AppContext,
  label: string,
  error: unknown,
  userId?: number | null
): void {
  const requestId = c.get("requestId") || "unknown";
  const method = c.req.method;
  const route = c.req.path;
  const message = error instanceof Error ? error.message : String(error);
  const effectiveUserId = userId ?? c.get("userId") ?? null;
  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      method,
      route,
      userId: effectiveUserId,
      label,
      message,
    })
  );

  const isDebug = c.env.DEBUG === "1" || c.env.DEBUG === "true";
  if (isDebug && error instanceof Error) {
    if (error.stack) console.error(`[DEBUG] ${label} stack:`, error.stack);
    if (error.cause) console.error(`[DEBUG] ${label} cause:`, error.cause);
  }
}
