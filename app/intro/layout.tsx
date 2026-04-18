import type { ReactNode } from "react";
import Link from "next/link";
import { algorithmList, algorithmMeta } from "@/lib/scheduler/registry";

export default function IntroLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-line bg-surface p-3 shadow-card dark:border-line-dark dark:bg-surface-dark xl:sticky xl:top-20">
        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          算法目录
        </div>
        <nav className="flex flex-col gap-0.5">
          {algorithmList.map((k) => (
            <IntroLink key={k} algo={k} />
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function IntroLink({ algo }: { algo: string }) {
  return (
    <Link
      href={`/intro/${algo}`}
      className="group rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
    >
      <span className="font-medium text-ink dark:text-ink-inverse">
        {algorithmMeta[algo as keyof typeof algorithmMeta].short}
      </span>
      <span className="ml-2 text-xs text-ink-soft">
        {algorithmMeta[algo as keyof typeof algorithmMeta].name}
      </span>
    </Link>
  );
}
