"use client";

import { useMemo } from "react";
import { GanttChart } from "./GanttChart";
import { ProcessInputPanel } from "./ProcessInputPanel";
import { Card } from "@/components/ui/Card";
import { useSimulation } from "@/store/simulationStore";
import {
  algorithmList,
  algorithmMeta,
  runAlgorithm,
} from "@/lib/scheduler/registry";
import type { AlgorithmKey, RunStats } from "@/lib/scheduler/types";
import { RadarChart } from "./RadarChart";
import { cn } from "@/lib/utils";

interface AlgoResult {
  key: AlgorithmKey;
  stats: RunStats;
  makespan: number;
  segments: ReturnType<typeof runAlgorithm>["segments"];
  switches: number;
}

export function MatrixWorkspace() {
  const processes = useSimulation((s) => s.processes);
  const config = useSimulation((s) => s.config);

  const results: AlgoResult[] = useMemo(() => {
    if (!processes.length) return [];
    return algorithmList.map((key) => {
      const r = runAlgorithm(key, processes, config);
      const switches = r.events.filter((e) => e.type === "dispatch").length;
      return {
        key,
        stats: r.stats,
        makespan: r.makespan,
        segments: r.segments,
        switches,
      };
    });
  }, [processes, config]);

  const maxMakespan = Math.max(0, ...results.map((r) => r.makespan));
  const showPriority = true;

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="min-h-[280px]">
        <ProcessInputPanel showPriority={showPriority} />
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        {!processes.length ? (
          <Card>
            <div className="rounded-xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink-soft dark:border-white/15">
              请先在左侧添加进程或加载案例
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">五维性能雷达</div>
                  <div className="text-xs text-ink-soft">
                    各指标已归一化（外圈最优）：周转 / 等待 / 响应越短越好；CPU 利用率越高越好；切换次数越少越好
                  </div>
                </div>
              </div>
              <RadarChart results={results} />
            </Card>

            <Card>
              <div className="mb-3 text-sm font-semibold">指标矩阵</div>
              <MatrixTable results={results} />
            </Card>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {results.map((r) => (
                <Card key={r.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">
                        {algorithmMeta[r.key].name}
                      </div>
                      <div className="text-[11px] text-ink-soft">
                        平均周转 {r.stats.avgTurnaround} · 切换 {r.switches} 次
                      </div>
                    </div>
                    <span className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                      {algorithmMeta[r.key].short}
                    </span>
                  </div>
                  <GanttChart
                    processes={processes}
                    segments={r.segments}
                    makespan={maxMakespan}
                    compact
                  />
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MatrixTable({ results }: { results: AlgoResult[] }) {
  const cols: { label: string; get: (r: AlgoResult) => number; lower: boolean }[] = [
    { label: "平均周转", get: (r) => r.stats.avgTurnaround, lower: true },
    { label: "平均等待", get: (r) => r.stats.avgWaiting, lower: true },
    { label: "平均带权周转", get: (r) => r.stats.avgWeightedTurnaround, lower: true },
    { label: "平均响应", get: (r) => r.stats.avgResponse, lower: true },
    { label: "CPU 利用率(%)", get: (r) => r.stats.cpuUtilization, lower: false },
    { label: "Makespan", get: (r) => r.makespan, lower: true },
    { label: "切换次数", get: (r) => r.switches, lower: true },
  ];

  // 找出每列最优值
  const bests = cols.map((c) => {
    const vals = results.map(c.get);
    return c.lower ? Math.min(...vals) : Math.max(...vals);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-ink-soft">
          <tr>
            <th className="border-b border-ink/10 px-2 py-2 text-left font-medium dark:border-white/10">
              算法
            </th>
            {cols.map((c) => (
              <th
                key={c.label}
                className="border-b border-ink/10 px-2 py-2 text-right font-medium dark:border-white/10"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {results.map((r) => (
            <tr key={r.key} className="border-b border-ink/5 dark:border-white/5">
              <td className="px-2 py-1.5 font-sans font-semibold">
                {algorithmMeta[r.key].short}
                <span className="ml-1.5 text-[10px] font-normal text-ink-faint">
                  {algorithmMeta[r.key].name}
                </span>
              </td>
              {cols.map((c, i) => {
                const v = c.get(r);
                const isBest = Math.abs(v - bests[i]) < 1e-6;
                return (
                  <td
                    key={c.label}
                    className={cn(
                      "px-2 py-1.5 text-right tabular-nums",
                      isBest && "rounded-md bg-brand/10 font-semibold text-brand"
                    )}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
