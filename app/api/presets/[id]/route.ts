import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const preset = await prisma.preset.findFirst({
    where: { id: params.id, userId: session.uid },
  });
  if (!preset) {
    return NextResponse.json({ error: "用例不存在" }, { status: 404 });
  }
  return NextResponse.json({
    preset: {
      ...preset,
      processes: JSON.parse(preset.processes),
      config: JSON.parse(preset.config),
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { count } = await prisma.preset.deleteMany({
    where: { id: params.id, userId: session.uid },
  });
  if (count === 0) {
    return NextResponse.json({ error: "用例不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
