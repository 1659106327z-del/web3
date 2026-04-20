"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  Cpu,
  GitCompareArrows,
  Layers,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { useSession } from "./SessionProvider";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const titleMap: { prefix: string; title: string; sub: string }[] = [
  { prefix: "/visualize", title: "算法可视化", sub: "单一算法的完整调度流程演示" },
  { prefix: "/designer/mfq", title: "MFQ 设计器", sub: "自定义多级反馈队列层数与时间片，量化评估系统性能" },
  { prefix: "/comparison", title: "算法对比", sub: "双算法并排或六算法矩阵 + 雷达图对比" },
  { prefix: "/intro", title: "相关介绍", sub: "各调度算法的原理与发展脉络" },
  { prefix: "/account", title: "账户", sub: "登录 / 注册（多端同账号）" },
];

const navItems = [
  { href: "/visualize/fcfs", match: "/visualize", label: "算法可视化", desc: "单算法演示", Icon: Activity },
  { href: "/designer/mfq", match: "/designer", label: "MFQ 设计器", desc: "自定义多级队列", Icon: Layers },
  { href: "/comparison", match: "/comparison", label: "算法对比", desc: "双算法 / 全矩阵", Icon: GitCompareArrows },
  { href: "/intro/fcfs", match: "/intro", label: "相关介绍", desc: "原理与历史", Icon: BookOpen },
  { href: "/account", match: "/account", label: "账户", desc: "登录 / 注册", Icon: User },
];

export function TopBar() {
  const pathname = usePathname() ?? "/";
  const meta =
    titleMap.find((m) => pathname.startsWith(m.prefix)) ?? titleMap[0];
  const { theme, toggle } = useTheme();
  const { user, logout } = useSession();
  const { push } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 路由切换后自动关闭抽屉
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // 抽屉打开时锁滚动 + ESC 关闭
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <>
      <header className="sticky top-4 z-20 mx-4 mt-4 lg:mx-0 lg:mr-10 lg:mt-6">
        <div className="glass-panel flex h-14 items-center justify-between rounded-2xl px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="打开导航菜单"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">
                {meta.title}
              </div>
              <div className="truncate text-xs text-ink-soft">{meta.sub}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-1 rounded-xl border border-ink/5 bg-ink/[0.03] pl-2 pr-1 text-xs text-ink-soft dark:border-white/5 dark:bg-white/[0.04]">
                <User className="h-3.5 w-3.5" />
                <Link
                  href="/account"
                  prefetch={false}
                  className="max-w-[100px] truncate font-medium text-ink hover:text-brand dark:text-ink-inverse"
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
                prefetch={false}
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

      {/* 移动端抽屉导航 */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="导航菜单"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" />
          <div
            className="glass-panel absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col rounded-r-2xl px-4 py-5 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <Link
                href="/visualize/fcfs"
                prefetch={false}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-ink/5 dark:hover:bg-white/5"
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
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-ink-soft hover:bg-ink/5 dark:hover:bg-white/10"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map(({ href, match, label, desc, Icon }) => {
                const active = pathname.startsWith(match);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
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
                      <div className="truncate text-xs text-ink-faint">
                        {desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="mt-auto rounded-xl border border-ink/10 bg-white/40 p-3 text-xs leading-relaxed text-ink-soft backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                已登录：
                <span className="font-mono font-semibold text-ink dark:text-ink-inverse">
                  {" "}
                  {user.username}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
