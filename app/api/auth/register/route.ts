import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  signSession,
  setSessionCookie,
  validateCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { username?: string; password?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const creds = {
    username: (body.username ?? "").trim(),
    password: body.password ?? "",
    email: body.email ? body.email.trim().toLowerCase() : undefined,
  };

  const err = validateCredentials(creds, { requireEmail: true });
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: creds.username },
        ...(creds.email ? [{ email: creds.email }] : []),
      ],
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "用户名或邮箱已被注册" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(creds.password);
  const user = await prisma.user.create({
    data: {
      username: creds.username,
      email: creds.email ?? null,
      passwordHash,
    },
    select: { id: true, username: true },
  });

  const token = await signSession({ uid: user.id, username: user.username });
  const res = NextResponse.json({ user });
  setSessionCookie(res, token);
  return res;
}
