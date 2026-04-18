import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  signSession,
  setSessionCookie,
  validateCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const creds = {
    username: (body.username ?? "").trim(),
    password: body.password ?? "",
  };

  const err = validateCredentials(creds);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { username: creds.username },
  });

  if (!user) {
    return NextResponse.json(
      { error: "用户名或密码错误" },
      { status: 401 }
    );
  }

  const ok = await verifyPassword(creds.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "用户名或密码错误" },
      { status: 401 }
    );
  }

  const token = await signSession({ uid: user.id, username: user.username });
  const res = NextResponse.json({
    user: { id: user.id, username: user.username },
  });
  setSessionCookie(res, token);
  return res;
}
