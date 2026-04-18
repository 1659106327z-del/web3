import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALGOS = new Set(["fcfs", "sjf", "srtf", "rr", "psa", "mfq"]);

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const list = await prisma.preset.findMany({
    where: { userId: session.uid },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      algorithm: true,
      processes: true,
      config: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({
    presets: list.map((p) => ({
      ...p,
      processes: JSON.parse(p.processes),
      config: JSON.parse(p.config),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  let body: {
    name?: string;
    algorithm?: string;
    processes?: unknown;
    config?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name || name.length > 40) {
    return NextResponse.json(
      { error: "用例名称需为 1-40 位字符" },
      { status: 400 }
    );
  }
  if (!body.algorithm || !ALGOS.has(body.algorithm)) {
    return NextResponse.json({ error: "算法类型无效" }, { status: 400 });
  }
  if (!Array.isArray(body.processes) || body.processes.length === 0) {
    return NextResponse.json({ error: "进程列表不能为空" }, { status: 400 });
  }

  const count = await prisma.preset.count({ where: { userId: session.uid } });
  if (count >= 50) {
    return NextResponse.json(
      { error: "单账户最多保存 50 个用例，请先删除旧用例" },
      { status: 400 }
    );
  }

  const created = await prisma.preset.create({
    data: {
      userId: session.uid,
      name,
      algorithm: body.algorithm,
      processes: JSON.stringify(body.processes),
      config: JSON.stringify(body.config ?? {}),
    },
    select: {
      id: true,
      name: true,
      algorithm: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ preset: created });
}
