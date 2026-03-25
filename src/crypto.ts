const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 600000;

async function pbkdf2(password: string, salt: string): Promise<string> {
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
      // OWASP recommends high PBKDF2 iteration counts for SHA-256; use 600k for stronger offline resistance.
      iterations: PBKDF2_ITERATIONS,
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
  pepper: string
): Promise<string> {
  return pbkdf2(password, `${username}:${pepper}`);
}

export async function verifyPassword(
  password: string,
  username: string,
  pepper: string,
  storedHash: string
): Promise<boolean> {
  const digest = await hashPassword(password, username, pepper);
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
