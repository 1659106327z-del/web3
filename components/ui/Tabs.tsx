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
        "glass-subtle flex w-full gap-1 overflow-x-auto rounded-2xl p-1",
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
              "relative flex min-w-[84px] cursor-pointer flex-col items-center justify-center rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-brand text-white shadow-soft"
                : "text-ink-soft hover:bg-ink/5 dark:hover:bg-white/5"
            )}
          >
            <span className="leading-tight">{it.label}</span>
            {it.sub && (
              <span
                className={cn(
                  "mt-0.5 text-[10px] font-normal",
                  active ? "text-white/85" : "text-ink-faint"
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
