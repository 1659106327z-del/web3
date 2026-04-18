"use client";

import { useSimulation } from "@/store/simulationStore";
import { algorithmMeta } from "@/lib/scheduler/registry";
import { NumberField } from "@/components/ui/NumberField";
import { cn } from "@/lib/utils";

export function AlgorithmConfig() {
  const algo = useSimulation((s) => s.algorithm);
  const config = useSimulation((s) => s.config);
  const setConfig = useSimulation((s) => s.setConfig);
  const meta = algorithmMeta[algo];

  const showAny =
    meta.config.timeQuantum ||
    meta.config.priorityMode ||
    meta.config.preemptive ||
    meta.config.mfq;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">算法参数</div>
          <div className="text-xs text-ink-soft">{meta.summary}</div>
        </div>
        <span className="rounded-lg bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
          {meta.short} · {meta.preemptive}
        </span>
      </div>

      {!showAny && (
        <div className="rounded-xl border border-dashed border-line p-3 text-xs text-ink-soft dark:border-line-dark">
          该算法无需额外参数。
        </div>
      )}

      {meta.config.timeQuantum && (
        <NumberField
          label="时间片大小"
          value={config.timeQuantum ?? 2}
          min={1}
          max={10}
          onChange={(v) => setConfig({ timeQuantum: v })}
        />
      )}

      {meta.config.priorityMode && (
        <div className="flex flex-col gap-1 text-xs text-ink-soft">
          <span>优先级类型</span>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark">
            {(["static", "dynamic"] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setConfig({ priorityMode: mode })}
                className={cn(
                  "cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  (config.priorityMode ?? "static") === mode
                    ? "bg-brand text-white"
                    : "text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
                )}
              >
                {mode === "static" ? "静态" : "动态（老化）"}
              </button>
            ))}
          </div>
        </div>
      )}

      {meta.config.preemptive && (
        <div className="flex flex-col gap-1 text-xs text-ink-soft">
          <span>抢占模式</span>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark">
            {[
              { k: true, label: "抢占式" },
              { k: false, label: "非抢占式" },
            ].map((m) => (
              <button
                type="button"
                key={String(m.k)}
                onClick={() => setConfig({ preemptive: m.k })}
                className={cn(
                  "cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  (config.preemptive ?? true) === m.k
                    ? "bg-brand text-white"
                    : "text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {meta.config.mfq && (
        <div className="flex flex-col gap-1 text-xs text-ink-soft">
          <span>各级时间片（Q0 / Q1 / Q2）</span>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <NumberField
                key={i}
                value={(config.mfqQuanta ?? [2, 4, 8])[i] ?? 0}
                min={1}
                max={16}
                onChange={(v) => {
                  const q = [...(config.mfqQuanta ?? [2, 4, 8])];
                  q[i] = v;
                  setConfig({ mfqQuanta: q });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
