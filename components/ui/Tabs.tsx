"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; sub?: string };

export function LinkTabs({ items, className }: { items: Item[]; className?: string }) {
  const pathname = usePathname() ?? "";
  return (
    <nav
      className={cn(
        "flex w-full gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark",
        className
      )}
    >
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "relative flex min-w-[84px] cursor-pointer flex-col items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-brand text-white shadow-soft"
                : "text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
            )}
          >
            <span className="leading-tight">{it.label}</span>
            {it.sub && (
              <span
                className={cn(
                  "mt-0.5 text-[10px] font-normal",
                  active ? "text-white/80" : "text-ink-faint"
                )}
              >
                {it.sub}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
