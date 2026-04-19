"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp, Award, Minus } from "lucide-react";
import { useSimulation } from "@/store/simulationStore";
import { runAlgorithm } from "@/lib/scheduler/registry";
import { computeMfqStats } from "@/lib/scheduler/mfq-stats";
import { cn } from "@/lib/utils";

const BASELINE_QUANTA = [2, 4, 8];

export function MfqAdvancedStats({ quanta }: { quanta: number[] }) {
  const processes = useSimulation((s) => s.processes);
  const events = useSimulation((s) => s.events);
  const segments = useSimulation((s) => s.segments);
  const stats = useSimulation((s) => s.stats);

  const ext = useMemo(() => {
    if (!stats || !processes.length) return null;
    return computeMfqStats(processes, events, segments, stats, quanta.length);
  }, [stats, processes, events, segments, quanta.length]);

  // 基线（默认 [2,4,8]）的同组数据结果
  const baseline = useMemo(() => {
    if (!processes.length) return null;
    const r = runAlgorithm("mfq", processes, { mfqQuanta: BASELINE_QUANTA });
    return computeMfqStats(processes, r.events, r.segments, r.stats, BASELINE_QUANTA.length);
  }, [processes]);

  if (!ext) {
    return (
      <div className="rounded-xl border border-dashed border-ink/15 p-6 text-center text-xs text-ink-soft dark:border-white/15">
        请先在左侧添加进程或加载案例
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 综合评分 */}
      <div className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/40 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <ScoreRing value={ext.compositeScore} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <Award className="h-3.5 w-3.5" /> 设计综合评分（0-100）
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-brand">
              {ext.compositeScore.toFixed(1)}
            </span>
            {baseline && (
              <BaselineDelta
                current={ext.compositeScore}
                baseline={baseline.compositeScore}
                lowerIsBetter={false}
                unit=""
              />
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-ink-soft">
            {ext.scoreBreakdown.map((b) => (
              <div key={b.label} className="flex items-center justify-between">
                <span>{b.label}</span>
                <span className="font-mono">
                  {(b.value * 100).toFixed(0)}
                  <span className="ml-0.5 text-ink-faint">×{(b.weight * 100).toFixed(0)}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 关键指标 + 与基线对比 */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metric label="平均周转" value={ext.base.avgTurnaround} baseline={baseline?.base.avgTurnaround} lower />
        <Metric label="短作业平均周转" value={ext.shortJobAvgTurnaround} baseline={baseline?.shortJobAvgTurnaround} lower />
        <Metric label="长作业平均周转" value={ext.longJobAvgTurnaround} baseline={baseline?.longJobAvgTurnaround} lower />
        <Metric label="CPU 利用率(%)" value={ext.base.cpuUtilization} baseline={baseline?.base.cpuUtilization} />
        <Metric label="降级次数" value={ext.demoteCount} baseline={baseline?.demoteCount} lower />
        <Metric label="切换次数" value={ext.switchCount} baseline={baseline?.switchCount} lower />
        <Metric label="平均等待" value={ext.base.avgWaiting} baseline={baseline?.base.avgWaiting} lower />
        <Metric label="平均带权周转" value={ext.base.avgWeightedTurnaround} baseline={baseline?.base.avgWeightedTurnaround} lower />
      </div>

      {/* 每级命中率 */}
      <div className="rounded-2xl border border-ink/10 bg-white/40 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">每级队列命中率</div>
          <div className="text-[11px] text-ink-soft">在该级完成的进程占比，反映队列设计是否合理</div>
        </div>
        <div className="space-y-1.5">
          {ext.perLevelHitRate.map((rate, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-12 font-mono text-xs font-semibold text-brand">Q{i}</span>
              <span className="w-16 font-mono text-[10px] text-ink-faint">q={quanta[i]}</span>
              <div className="relative flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-ink/5 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand transition-[width]"
                    style={{ width: `${Math.max(2, rate * 100)}%` }}
                  />
                </div>
              </div>
              <span className="w-12 text-right font-mono text-xs">
                {(rate * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
        {baseline && (
          <div className="mt-3 border-t border-ink/5 pt-3 text-[11px] text-ink-soft dark:border-white/5">
            <span className="mr-2 font-medium">基线 [2,4,8] 命中率：</span>
            {baseline.perLevelHitRate.map((r, i) => (
              <span key={i} className="mr-3 font-mono">
                Q{i} {(r * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  baseline,
  lower,
}: {
  label: string;
  value: number;
  baseline?: number;
  lower?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/40 px-3 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <div className="text-[11px] text-ink-soft">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="font-mono text-lg font-semibold tabular-nums text-ink dark:text-ink-inverse">
          {value}
        </span>
        {baseline !== undefined && (
          <BaselineDelta current={value} baseline={baseline} lowerIsBetter={!!lower} unit="" />
        )}
      </div>
    </div>
  );
}

function BaselineDelta({
  current,
  baseline,
  lowerIsBetter,
  unit,
}: {
  current: number;
  baseline: number;
  lowerIsBetter: boolean;
  unit: string;
}) {
  const diff = current - baseline;
  if (Math.abs(diff) < 0.01) {
    return (
      <span className="inline-flex items-center text-[10px] text-ink-faint">
        <Minus className="h-3 w-3" /> 持平
      </span>
    );
  }
  const better = lowerIsBetter ? diff < 0 : diff > 0;
  const Icon = diff < 0 ? ArrowDown : ArrowUp;
  const sign = diff > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-medium",
        better ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      )}
      title={`基线 ${baseline}${unit}`}
    >
      <Icon className="h-3 w-3" />
      {sign}
      {diff.toFixed(2)}
    </span>
  );
}

function ScoreRing({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);
  return (
    <svg viewBox="0 0 70 70" className="h-20 w-20 -rotate-90">
      <circle
        cx="35"
        cy="35"
        r={r}
        fill="none"
        className="stroke-ink/10 dark:stroke-white/10"
        strokeWidth={6}
      />
      <circle
        cx="35"
        cy="35"
        r={r}
        fill="none"
        className="stroke-brand"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 400ms ease" }}
      />
    </svg>
  );
}
