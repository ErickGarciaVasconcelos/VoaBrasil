import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authSecret } from "@ppa/jobs";

const COOKIE_NAME = "ppa_admin";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

function sign(value: string): string {
  return createHmac("sha256", authSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function checkPassword(input: string): boolean {
  const expected =
    process.env.ADMIN_PASSWORD?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : "admin123");
  if (!expected) return false;
  const inputHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(inputHash, expectedHash);
}

export async function createSession(): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = `${expiresAt}.${sign(String(expiresAt))}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;
  const expires = Number(expiresAt);
  return Number.isFinite(expires) && expires > Math.floor(Date.now() / 1000);
}

export async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) {
    redirect("/admin/login");
  }
}

export async function assertAdmin(): Promise<void> {
  if (!(await getAdminSession())) {
    throw new Error("Não autorizado");
  }
}
