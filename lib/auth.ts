import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "os_sched_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 天

interface SessionPayload {
  uid: string;
  username: string;
  [key: string]: unknown;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("环境变量 AUTH_SECRET 未设置或过短（至少 16 字节）");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.uid !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return { uid: payload.uid, username: payload.username };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const store = cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySession(token);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return verifySession(token);
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE_NAME };

export interface Credentials {
  username: string;
  password: string;
  email?: string;
}

export function validateCredentials(
  creds: Credentials,
  { requireEmail = false }: { requireEmail?: boolean } = {}
): string | null {
  if (!creds.username || !/^[\w\u4e00-\u9fa5][\w\u4e00-\u9fa5.\-]{1,29}$/.test(creds.username)) {
    return "用户名需为 2-30 位字母、数字、汉字、下划线或连字符";
  }
  if (!creds.password || creds.password.length < 6 || creds.password.length > 128) {
    return "密码长度需在 6-128 位之间";
  }
  if (requireEmail && creds.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creds.email)) {
      return "邮箱格式不正确";
    }
  }
  return null;
}
