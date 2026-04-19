"use client";

import { useState } from "react";
import type { RunStats, AlgorithmKey, GanttSegment } from "@/lib/scheduler/types";
import { algorithmMeta } from "@/lib/scheduler/registry";
import { cn } from "@/lib/utils";

type Result = {
  key: AlgorithmKey;
  stats: RunStats;
  makespan: number;
  segments: GanttSegment[];
  switches: number;
};

const ALGO_COLORS: Record<AlgorithmKey, string> = {
  fcfs: "#0F766E",
  sjf: "#B45309",
  srtf: "#65A30D",
  rr: "#0369A1",
  psa: "#BE185D",
  mfq: "#7C3AED",
};

interface Axis {
  label: string;
  // 取值越小越好（true）/ 越大越好（false）
  lower: boolean;
  get: (r: Result) => number;
}

const AXES: Axis[] = [
  { label: "平均周转", lower: true, get: (r) => r.stats.avgTurnaround },
  { label: "平均等待", lower: true, get: (r) => r.stats.avgWaiting },
  { label: "平均响应", lower: true, get: (r) => r.stats.avgResponse },
  { label: "CPU 利用率", lower: false, get: (r) => r.stats.cpuUtilization },
  { label: "切换次数", lower: true, get: (r) => r.switches },
];

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 110;
const RINGS = 4;

function angleFor(i: number, n: number) {
  return -Math.PI / 2 + (2 * Math.PI * i) / n;
}

export function RadarChart({ results }: { results: Result[] }) {
  const [hidden, setHidden] = useState<Set<AlgorithmKey>>(new Set());

  // 归一化每个轴：把每个算法的取值映射到 [0,1]，外圈=最优
  const axisRanges = AXES.map((axis) => {
    const vals = results.map(axis.get);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { min, max };
  });

  const norm = (axisIdx: number, raw: number) => {
    const { min, max } = axisRanges[axisIdx];
    if (Math.abs(max - min) < 1e-9) return 1;
    const t = (raw - min) / (max - min);
    return AXES[axisIdx].lower ? 1 - t : t;
  };

  return (
    <div className="grid items-center gap-6 md:grid-cols-[1fr_220px]">
      <div className="mx-auto w-full max-w-[420px]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-auto w-full">
          {/* 同心圈 */}
          {Array.from({ length: RINGS }).map((_, i) => {
            const r = (R * (i + 1)) / RINGS;
            return (
              <circle
                key={i}
                cx={CX}
                cy={CY}
                r={r}
                fill="none"
                className="stroke-ink/10 dark:stroke-white/10"
                strokeWidth={1}
              />
            );
          })}
          {/* 轴线 + 标签 */}
          {AXES.map((axis, i) => {
            const a = angleFor(i, AXES.length);
            const x = CX + Math.cos(a) * R;
            const y = CY + Math.sin(a) * R;
            const lx = CX + Math.cos(a) * (R + 22);
            const ly = CY + Math.sin(a) * (R + 22);
            const anchor =
              Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
            return (
              <g key={axis.label}>
                <line
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  className="stroke-ink/15 dark:stroke-white/15"
                  strokeWidth={1}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  className="fill-ink-soft"
                  fontSize={11}
                  fontFamily="var(--font-sans), sans-serif"
                >
                  {axis.label}
                </text>
              </g>
            );
          })}

          {/* 各算法多边形 */}
          {results.map((r) => {
            if (hidden.has(r.key)) return null;
            const points = AXES.map((axis, i) => {
              const v = norm(i, axis.get(r));
              const a = angleFor(i, AXES.length);
              const len = R * v;
              return [CX + Math.cos(a) * len, CY + Math.sin(a) * len];
            });
            const path = points.map(([x, y]) => `${x},${y}`).join(" ");
            const color = ALGO_COLORS[r.key];
            return (
              <g key={r.key}>
                <polygon
                  points={path}
                  fill={color}
                  fillOpacity={0.12}
                  stroke={color}
                  strokeWidth={1.5}
                />
                {points.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={2.5} fill={color} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="mb-1 text-xs font-medium text-ink-soft">显示算法</div>
        {results.map((r) => {
          const off = hidden.has(r.key);
          const color = ALGO_COLORS[r.key];
          return (
            <button
              key={r.key}
              type="button"
              onClick={() =>
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(r.key)) next.delete(r.key);
                  else next.add(r.key);
                  return next;
                })
              }
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors",
                off
                  ? "opacity-40 hover:opacity-70"
                  : "hover:bg-ink/5 dark:hover:bg-white/5"
              )}
            >
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="font-semibold text-ink dark:text-ink-inverse">
                {algorithmMeta[r.key].short}
              </span>
              <span className="truncate text-ink-soft">
                {algorithmMeta[r.key].name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
