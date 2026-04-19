"use client";

import { useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSimulation } from "@/store/simulationStore";
import { caseLibrary, type CaseItem } from "@/lib/scheduler/cases";
import { algorithmMeta } from "@/lib/scheduler/registry";
import { cn } from "@/lib/utils";

export function CasePickerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} title="加载教材经典案例">
        <BookOpen className="h-3.5 w-3.5" />
        案例库
      </Button>
      {open && <CasePickerModal onClose={() => setOpen(false)} />}
    </>
  );
}

function CasePickerModal({ onClose }: { onClose: () => void }) {
  const setProcesses = useSimulation((s) => s.setProcesses);
  const setAlgorithm = useSimulation((s) => s.setAlgorithm);
  const setConfig = useSimulation((s) => s.setConfig);
  const currentAlgo = useSimulation((s) => s.algorithm);
  const { push } = useToast();

  // ESC 关闭、滚动锁定
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const apply = (c: CaseItem) => {
    setProcesses(c.processes.map((p) => ({ ...p })));
    if (c.config) setConfig(c.config);
    // 若案例推荐的算法包含当前算法则保持，否则切换到第一个推荐算法
    if (c.recommend.length && !c.recommend.includes(currentAlgo)) {
      setAlgorithm(c.recommend[0]);
    }
    push(`已加载案例：${c.title}`);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="案例库"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl glass-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ink/5 p-5 dark:border-white/5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-brand" />
              案例库
            </div>
            <div className="mt-1 text-xs text-ink-soft">
              加载教材经典例题或对比型用例，可直接套用到当前算法
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-ink-soft hover:bg-ink/5 dark:hover:bg-white/10"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {caseLibrary.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => apply(c)}
                className={cn(
                  "group cursor-pointer rounded-2xl border border-ink/10 bg-white/40 p-4 text-left transition-colors backdrop-blur-sm hover:border-brand/40 hover:bg-white/70",
                  "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                )}
              >
                <div className="mb-1 text-sm font-semibold text-ink dark:text-ink-inverse">
                  {c.title}
                </div>
                <div className="mb-2 text-[11px] text-ink-faint">{c.source}</div>
                <p className="mb-3 text-xs leading-relaxed text-ink-soft line-clamp-3">
                  {c.description}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-ink-faint">推荐算法：</span>
                  {c.recommend.map((k) => (
                    <span
                      key={k}
                      className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand"
                    >
                      {algorithmMeta[k].short}
                    </span>
                  ))}
                  <span className="ml-auto text-[11px] text-ink-faint">
                    {c.processes.length} 进程
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
