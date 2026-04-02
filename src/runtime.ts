export type RuntimeTarget = "cloudflare" | "node" | "vercel";

export function resolveRuntimeTarget(value: string | undefined): RuntimeTarget {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "node" || normalized === "local" || normalized === "local-production") {
    return "node";
  }
  if (normalized === "vercel") {
    return "vercel";
  }
  return "cloudflare";
}
