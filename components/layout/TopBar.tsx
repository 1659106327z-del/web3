"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const titleMap: { prefix: string; title: string; sub: string }[] = [
  { prefix: "/visualize", title: "算法可视化", sub: "单一算法的完整调度流程演示" },
  { prefix: "/comparison", title: "算法对比", sub: "同组数据下双算法并排甘特图对比" },
  { prefix: "/intro", title: "相关介绍", sub: "各调度算法的原理与发展脉络" },
  { prefix: "/account", title: "账户", sub: "登录 / 注册（多端同账号）" },
];

const mobileLinks = [
  { href: "/visualize/fcfs", label: "可视化" },
  { href: "/comparison", label: "对比" },
  { href: "/intro/fcfs", label: "介绍" },
  { href: "/account", label: "账户" },
];

export function TopBar() {
  const pathname = usePathname() ?? "/";
  const meta =
    titleMap.find((m) => pathname.startsWith(m.prefix)) ?? titleMap[0];
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/80 px-6 backdrop-blur-md dark:border-line-dark dark:bg-surface-dark/80 lg:px-10">
      <div className="flex items-center gap-3 min-w-0">
        <Menu className="h-5 w-5 shrink-0 text-ink-soft md:hidden" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight">
            {meta.title}
          </div>
          <div className="truncate text-xs text-ink-soft">{meta.sub}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <nav className="hidden items-center gap-1 sm:flex md:hidden">
          {mobileLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                pathname.startsWith(l.href.split("/").slice(0, 2).join("/"))
                  ? "bg-brand/10 text-brand"
                  : "text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={toggle}
          aria-label="切换主题"
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink dark:border-line-dark dark:bg-surface-dark dark:text-ink-inverse dark:hover:bg-surface-dark-muted"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
