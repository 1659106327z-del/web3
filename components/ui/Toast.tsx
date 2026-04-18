"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; msg: string; tone?: "default" | "warn" | "error" };

const Ctx = createContext<{ push: (msg: string, tone?: Toast["tone"]) => void } | null>(null);

let idSeed = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((msg: string, tone: Toast["tone"] = "default") => {
    const id = ++idSeed;
    setList((l) => [...l, { id, msg, tone }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 2800);
  }, []);
  useEffect(() => () => setList([]), []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {list.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-4 py-2.5 text-sm shadow-soft animate-fade-in backdrop-blur",
              t.tone === "warn" &&
                "border-amber-200 bg-amber-50/95 text-amber-900 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-100",
              t.tone === "error" &&
                "border-red-200 bg-red-50/95 text-red-900 dark:border-red-800 dark:bg-red-950/80 dark:text-red-100",
              (!t.tone || t.tone === "default") &&
                "border-line bg-surface/95 text-ink dark:border-line-dark dark:bg-surface-dark/95 dark:text-ink-inverse"
            )}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) return { push: (msg: string) => console.warn(msg) };
  return v;
}
