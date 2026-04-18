"use client";

import { useSimulation } from "@/store/simulationStore";
import { cn } from "@/lib/utils";

export function StatsTable({ compact }: { compact?: boolean }) {
  const stats = useSimulation((s) => s.stats);
  const processes = useSimulation((s) => s.processes);

  if (!stats || !processes.length) {
    return (
      <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-ink-soft dark:border-line-dark">
        暂无统计数据。请先添加进程。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-4")}>
        <Metric label="平均周转时间" value={stats.avgTurnaround} />
        <Metric label="平均带权周转" value={stats.avgWeightedTurnaround} />
        <Metric label="平均等待时间" value={stats.avgWaiting} />
        <Metric label="CPU 利用率" value={`${stats.cpuUtilization}%`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ink-soft">
              {["进程", "到达", "服务", "完成", "周转", "等待", "带权周转", "响应"].map((h) => (
                <th key={h} className="border-b border-line px-2 py-1.5 text-left font-medium dark:border-line-dark">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {stats.perProcess.map((p) => (
              <tr key={p.pid} className="border-b border-line/60 dark:border-line-dark/60">
                <td className="px-2 py-1.5">{p.name}</td>
                <td className="px-2 py-1.5">{p.arrival}</td>
                <td className="px-2 py-1.5">{p.burst}</td>
                <td className="px-2 py-1.5">{p.completion}</td>
                <td className="px-2 py-1.5">{p.turnaround}</td>
                <td className="px-2 py-1.5">{p.waiting}</td>
                <td className="px-2 py-1.5">{p.weightedTurnaround}</td>
                <td className="px-2 py-1.5">{p.response}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-muted px-3 py-2 dark:border-line-dark dark:bg-surface-dark-muted">
      <div className="text-[11px] text-ink-soft">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ink dark:text-ink-inverse">
        {value}
      </div>
    </div>
  );
}
