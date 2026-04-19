"use client";

import { AlertTriangle, CheckCircle2, Layers } from "lucide-react";
import { useSimulation } from "@/store/simulationStore";
import { NumberField } from "@/components/ui/NumberField";
import { cn } from "@/lib/utils";

const MAX_LEVELS = 4;
const PRESETS: { key: string; label: string; sub: string; build: (n: number) => number[] }[] = [
  { key: "ari", label: "等差递增", sub: "公差 2，从 2 起", build: (n) => Array.from({ length: n }, (_, i) => 2 + i * 2) },
  { key: "geo", label: "等比递增", sub: "比值 2，从 1 起", build: (n) => Array.from({ length: n }, (_, i) => Math.pow(2, i)) },
  { key: "tang", label: "教材常用", sub: "[2,4,8,16]", build: (n) => Array.from({ length: n }, (_, i) => Math.pow(2, i + 1)) },
];

export function MfqDesignerPanel() {
  const config = useSimulation((s) => s.config);
  const setConfig = useSimulation((s) => s.setConfig);

  const quanta = config.mfqQuanta && config.mfqQuanta.length ? config.mfqQuanta : [2, 4, 8];
  const levels = quanta.length;

  const setLevels = (n: number) => {
    const clamped = Math.max(1, Math.min(MAX_LEVELS, n));
    if (clamped === levels) return;
    const next = [...quanta];
    if (clamped > levels) {
      // 扩容：补齐使其严格递增（在最后一项基础上 ×2）
      while (next.length < clamped) {
        next.push(Math.max(1, next[next.length - 1]) * 2);
      }
    } else {
      next.length = clamped;
    }
    setConfig({ mfqQuanta: next });
  };

  const setQ = (i: number, v: number) => {
    const next = [...quanta];
    next[i] = Math.max(1, Math.min(64, v));
    setConfig({ mfqQuanta: next });
  };

  const applyPreset = (build: (n: number) => number[]) => {
    setConfig({ mfqQuanta: build(levels) });
  };

  // 校验：相邻项是否非递减
  const violations: number[] = [];
  for (let i = 1; i < quanta.length; i++) {
    if (quanta[i] < quanta[i - 1]) violations.push(i);
  }
  const isStrictlyIncreasing = quanta.every((v, i) => i === 0 || v > quanta[i - 1]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-brand" />
        <div>
          <div className="text-sm font-semibold">队列设计</div>
          <div className="text-xs text-ink-soft">
            自定义层数与每级时间片，建议时间片随层级递增
          </div>
        </div>
      </div>

      {/* 层数控制 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-ink-soft">
          <span>队列层数</span>
          <span className="font-mono text-ink dark:text-ink-inverse">{levels} 级（上限 {MAX_LEVELS}）</span>
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-xl border border-ink/10 bg-white/40 p-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLevels(n)}
              className={cn(
                "cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                levels === n
                  ? "bg-brand text-white"
                  : "text-ink-soft hover:bg-ink/5 dark:hover:bg-white/10"
              )}
            >
              {n} 级
            </button>
          ))}
        </div>
      </div>

      {/* 预设按钮 */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-ink-soft">快速预设（按当前层数生成）</span>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.build)}
              className="cursor-pointer rounded-xl border border-ink/10 bg-white/40 p-2 text-left transition-colors backdrop-blur-sm hover:border-brand/40 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div className="text-xs font-semibold text-ink dark:text-ink-inverse">
                {p.label}
              </div>
              <div className="mt-0.5 truncate text-[10px] text-ink-faint">
                {p.sub}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 每级时间片 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-ink-soft">每级时间片大小</span>
        <div className="grid grid-cols-2 gap-2">
          {quanta.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-brand">Q{i}</span>
              <NumberField
                value={q}
                min={1}
                max={64}
                onChange={(v) => setQ(i, v)}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 校验提示 */}
      {violations.length > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-100/50 p-2.5 text-xs text-amber-900 backdrop-blur-sm dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            Q{violations.join(", Q")} 的时间片小于上一级，违背了 MFQ「高优先级队列时间片更短」的设计原则。
            可继续模拟以观察其影响。
          </div>
        </div>
      ) : isStrictlyIncreasing ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-300/50 bg-emerald-100/40 p-2.5 text-xs text-emerald-900 backdrop-blur-sm dark:border-emerald-700/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>时间片严格递增，符合典型 MFQ 设计。</div>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-ink/10 bg-white/40 p-2.5 text-xs text-ink-soft backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
          <div>时间片非递减（存在相邻相等），允许但不严格递增。</div>
        </div>
      )}
    </div>
  );
}
