const ALG = { name: "HMAC", hash: "SHA-256" };
const EXPIRY_SECS = 30 * 24 * 60 * 60; // 30 days

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeJson(obj: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)));
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    ALG,
    false,
    ["sign", "verify"]
  );
}

export async function signJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const body = encodeJson({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + EXPIRY_SECS,
  });
  const sig = b64url(
    await crypto.subtle.sign(
      ALG,
      await getKey(secret),
      new TextEncoder().encode(`${header}.${body}`)
    )
  );
  return `${header}.${body}.${sig}`;
}

export async function verifyJwt(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const valid = await crypto.subtle.verify(
    ALG,
    await getKey(secret),
    Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0)
    ),
    new TextEncoder().encode(`${header}.${body}`)
  );
  if (!valid) return null;
  const payload = JSON.parse(
    atob(body.replace(/-/g, "+").replace(/_/g, "/"))
  ) as Record<string, unknown>;
  if ((payload.exp as number) < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
