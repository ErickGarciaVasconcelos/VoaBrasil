import { createHmac, timingSafeEqual } from "node:crypto";

export type TokenPurpose = "confirm" | "unsubscribe";

export type TokenPayload = {
  sub: string;
  purpose: TokenPurpose;
  iat: number;
  exp: number;
};

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signToken(
  payload: { sub: string; purpose: TokenPurpose },
  secret: string,
  ttlSeconds: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const full: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };
  const body = toBase64Url(JSON.stringify(full));
  const signature = toBase64Url(
    createHmac("sha256", secret).update(body).digest(),
  );
  return `${body}.${signature}`;
}

export function verifyToken(
  token: string | null | undefined,
  secret: string,
): TokenPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as TokenPayload;
    if (
      !payload?.sub ||
      !payload?.purpose ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function hashToken(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
}
