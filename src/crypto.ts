const encoder = new TextEncoder();
export const DEFAULT_PBKDF2_ITERATIONS = 20000;

async function pbkdf2(password: string, salt: string, iterations: number = DEFAULT_PBKDF2_ITERATIONS): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      // OWASP recommends higher PBKDF2 iteration counts for SHA-256; default to 20k for perf/compatibility unless overridden.
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return [...new Uint8Array(bits)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(
  password: string,
  username: string,
  pepper: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<string> {
  return pbkdf2(password, `${username}:${pepper}`, iterations);
}

export async function verifyPassword(
  password: string,
  username: string,
  pepper: string,
  storedHash: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<boolean> {
  const digest = await hashPassword(password, username, pepper, iterations);
  return digest === storedHash;
}

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
