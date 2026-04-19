"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  GitCompareArrows,
  User,
  Cpu,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/visualize/fcfs",
    match: "/visualize",
    label: "算法可视化",
    desc: "单算法演示",
    Icon: Activity,
  },
  {
    href: "/designer/mfq",
    match: "/designer",
    label: "MFQ 设计器",
    desc: "自定义多级队列",
    Icon: Layers,
  },
  {
    href: "/comparison",
    match: "/comparison",
    label: "算法对比",
    desc: "双算法 / 全矩阵",
    Icon: GitCompareArrows,
  },
  {
    href: "/intro/fcfs",
    match: "/intro",
    label: "相关介绍",
    desc: "原理与历史",
    Icon: BookOpen,
  },
  {
    href: "/account",
    match: "/account",
    label: "账户",
    desc: "登录 / 注册",
    Icon: User,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 z-20 ml-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 md:flex">
      <div className="glass-panel flex w-full flex-col rounded-2xl px-3 py-5">
        <Link
          href="/visualize/fcfs"
          className="mb-5 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ink/5 dark:hover:bg-white/5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/90 text-white shadow-soft">
            <Cpu className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">
              调度可视化
            </div>
            <div className="truncate text-xs text-ink-soft">
              OS Scheduler Lab
            </div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {items.map(({ href, match, label, desc, Icon }) => {
            const active = pathname?.startsWith(match);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-ink hover:bg-ink/5 dark:text-ink-inverse dark:hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-brand" : "text-ink-soft"
                  )}
                />
                <div className="min-w-0">
                  <div className="truncate font-medium leading-tight">
                    {label}
                  </div>
                  <div className="truncate text-xs text-ink-faint">{desc}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-ink/5 bg-ink/[0.03] p-3 text-xs leading-relaxed text-ink-soft dark:border-white/5 dark:bg-white/[0.03]">
          事件驱动仿真引擎 · Canvas 甘特图 · SVG 调度舞台
        </div>
      </div>
    </aside>
  );
}
