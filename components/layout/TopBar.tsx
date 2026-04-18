"use client";

import { LogIn, LogOut, Menu, Moon, Sun, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { useSession } from "./SessionProvider";
import { useToast } from "@/components/ui/Toast";
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
  const { user, logout } = useSession();
  const { push } = useToast();

  return (
    <header className="sticky top-4 z-20 mx-4 mt-4 lg:mx-0 lg:mr-10 lg:mt-6">
      <div className="glass-panel flex h-14 items-center justify-between rounded-2xl px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
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
                    : "text-ink-soft hover:bg-ink/5 dark:hover:bg-white/5"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          {user ? (
            <div className="flex items-center gap-1 rounded-xl border border-ink/5 bg-ink/[0.03] pl-2 pr-1 text-xs text-ink-soft dark:border-white/5 dark:bg-white/[0.04]">
              <User className="h-3.5 w-3.5" />
              <Link
                href="/account"
                className="max-w-[120px] truncate font-medium text-ink hover:text-brand dark:text-ink-inverse"
                title={user.username}
              >
                {user.username}
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  push("已退出登录");
                }}
                className="ml-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-ink-soft hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10"
                aria-label="退出登录"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/account"
              className="hidden h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-ink/10 bg-white/40 px-3 text-xs font-medium text-ink backdrop-blur-sm transition-colors hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-ink-inverse dark:hover:bg-white/10 sm:inline-flex"
            >
              <LogIn className="h-3.5 w-3.5" /> 登录
            </Link>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label="切换主题"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-ink/5 bg-ink/[0.03] text-ink-soft transition-colors hover:bg-ink/[0.07] hover:text-ink dark:border-white/5 dark:bg-white/[0.04] dark:text-ink-inverse dark:hover:bg-white/[0.08]"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
