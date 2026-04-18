"use client";

import { useMemo, useState } from "react";
import { GanttChart } from "./GanttChart";
import { ProcessInputPanel } from "./ProcessInputPanel";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/store/simulationStore";
import { algorithmList, algorithmMeta, runAlgorithm } from "@/lib/scheduler/registry";
import type { AlgoConfig, AlgorithmKey } from "@/lib/scheduler/types";
import { NumberField } from "@/components/ui/NumberField";

function algoNeedsPriority(keys: AlgorithmKey[]) {
  return keys.includes("psa");
}

export function ComparisonWorkspace() {
  const processes = useSimulation((s) => s.processes);
  const [left, setLeft] = useState<AlgorithmKey>("fcfs");
  const [right, setRight] = useState<AlgorithmKey>("rr");
  const [leftCfg, setLeftCfg] = useState<AlgoConfig>({});
  const [rightCfg, setRightCfg] = useState<AlgoConfig>({ timeQuantum: 2 });

  const leftRun = useMemo(() => {
    if (!processes.length) return null;
    return runAlgorithm(left, processes, leftCfg);
  }, [left, leftCfg, processes]);
  const rightRun = useMemo(() => {
    if (!processes.length) return null;
    return runAlgorithm(right, processes, rightCfg);
  }, [right, rightCfg, processes]);

  const maxMakespan = Math.max(leftRun?.makespan ?? 0, rightRun?.makespan ?? 0);

  const showPriority = algoNeedsPriority([left, right]);

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="min-h-[280px]">
        <ProcessInputPanel showPriority={showPriority} />
      </Card>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="方案 A"
            algo={left}
            setAlgo={setLeft}
            cfg={leftCfg}
            setCfg={setLeftCfg}
          />
          <Panel
            title="方案 B"
            algo={right}
            setAlgo={setRight}
            cfg={rightCfg}
            setCfg={setRightCfg}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="mb-2 text-sm font-semibold">
              {algorithmMeta[left].name} · 甘特图
            </div>
            {leftRun ? (
              <GanttChart
                processes={processes}
                segments={leftRun.segments}
                makespan={maxMakespan}
                compact
              />
            ) : (
              <Empty />
            )}
          </Card>
          <Card>
            <div className="mb-2 text-sm font-semibold">
              {algorithmMeta[right].name} · 甘特图
            </div>
            {rightRun ? (
              <GanttChart
                processes={processes}
                segments={rightRun.segments}
                makespan={maxMakespan}
                compact
              />
            ) : (
              <Empty />
            )}
          </Card>
        </div>

        <Card>
          <div className="mb-3 text-sm font-semibold">关键指标对比</div>
          <ComparisonBars
            a={{
              key: left,
              label: algorithmMeta[left].short,
              turnaround: leftRun?.stats.avgTurnaround ?? 0,
              waiting: leftRun?.stats.avgWaiting ?? 0,
              weighted: leftRun?.stats.avgWeightedTurnaround ?? 0,
              makespan: leftRun?.makespan ?? 0,
            }}
            b={{
              key: right,
              label: algorithmMeta[right].short,
              turnaround: rightRun?.stats.avgTurnaround ?? 0,
              waiting: rightRun?.stats.avgWaiting ?? 0,
              weighted: rightRun?.stats.avgWeightedTurnaround ?? 0,
              makespan: rightRun?.makespan ?? 0,
            }}
          />
        </Card>
      </div>
    </div>
  );
}

function Panel({
  title,
  algo,
  setAlgo,
  cfg,
  setCfg,
}: {
  title: string;
  algo: AlgorithmKey;
  setAlgo: (k: AlgorithmKey) => void;
  cfg: AlgoConfig;
  setCfg: (c: AlgoConfig) => void;
}) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <span className="rounded-lg bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
          {algorithmMeta[algo].short}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark">
        {algorithmList.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setAlgo(k)}
            className={cn(
              "cursor-pointer rounded-lg px-2 py-1 text-xs font-medium transition-colors",
              algo === k
                ? "bg-brand text-white"
                : "text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
            )}
          >
            {algorithmMeta[k].short}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {algorithmMeta[algo].config.timeQuantum && (
          <NumberField
            label="时间片"
            value={cfg.timeQuantum ?? 2}
            min={1}
            max={10}
            onChange={(v) => setCfg({ ...cfg, timeQuantum: v })}
          />
        )}
        {algorithmMeta[algo].config.priorityMode && (
          <div className="text-xs text-ink-soft">
            <span>优先级模式</span>
            <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark">
              {(["static", "dynamic"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCfg({ ...cfg, priorityMode: mode })}
                  className={cn(
                    "cursor-pointer rounded-lg px-2 py-1 text-xs font-medium",
                    (cfg.priorityMode ?? "static") === mode
                      ? "bg-brand text-white"
                      : "text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
                  )}
                >
                  {mode === "static" ? "静态" : "动态"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-ink-soft dark:border-line-dark">
      添加进程后将自动计算该算法的调度结果
    </div>
  );
}

type M = {
  key: AlgorithmKey;
  label: string;
  turnaround: number;
  waiting: number;
  weighted: number;
  makespan: number;
};

function ComparisonBars({ a, b }: { a: M; b: M }) {
  const rows: { label: string; k: keyof M }[] = [
    { label: "平均周转时间", k: "turnaround" },
    { label: "平均等待时间", k: "waiting" },
    { label: "平均带权周转", k: "weighted" },
    { label: "总完成时间 (Makespan)", k: "makespan" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const va = a[row.k] as number;
        const vb = b[row.k] as number;
        const max = Math.max(va, vb, 0.001);
        return (
          <div key={row.k} className="rounded-xl border border-line p-3 dark:border-line-dark">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-ink">{row.label}</span>
              <span className="text-ink-soft">越小越优</span>
            </div>
            <Bar label={`${a.label} · ${va}`} ratio={va / max} tone="a" />
            <Bar label={`${b.label} · ${vb}`} ratio={vb / max} tone="b" />
          </div>
        );
      })}
    </div>
  );
}

function Bar({ label, ratio, tone }: { label: string; ratio: number; tone: "a" | "b" }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className="mb-1 last:mb-0">
      <div className="mb-0.5 flex items-center justify-between text-[11px] text-ink-soft">
        <span className="font-mono">{label}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted dark:bg-surface-dark-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            tone === "a" ? "bg-brand" : "bg-accent"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
