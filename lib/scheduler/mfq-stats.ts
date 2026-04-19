import { roundTo } from "@/lib/utils";
import type {
  GanttSegment,
  Process,
  RunStats,
  TimelineEvent,
} from "./types";

export interface MfqExtendedStats {
  base: RunStats;
  perLevelHitRate: number[]; // 每级队列上完成的进程占比 (0-1)
  shortJobAvgTurnaround: number;
  longJobAvgTurnaround: number;
  demoteCount: number;
  switchCount: number;
  // 综合评分 (0-100)，越高越好
  compositeScore: number;
  scoreBreakdown: { label: string; weight: number; value: number }[];
}

export function computeMfqStats(
  processes: Process[],
  events: TimelineEvent[],
  segments: GanttSegment[],
  base: RunStats,
  totalLevels: number
): MfqExtendedStats {
  // 每个进程在哪一级完成：取最后一个属于该进程的 segment 的 level
  const completionLevel = new Map<string, number>();
  for (const s of segments) {
    completionLevel.set(s.pid, s.level ?? 0);
  }
  const perLevelCount = Array.from({ length: totalLevels }, () => 0);
  let counted = 0;
  for (const lvl of completionLevel.values()) {
    if (lvl >= 0 && lvl < totalLevels) {
      perLevelCount[lvl] += 1;
      counted += 1;
    }
  }
  const perLevelHitRate = perLevelCount.map((c) =>
    counted > 0 ? roundTo(c / counted, 3) : 0
  );

  // 短/长作业按 burst 中位数划分
  const sortedBursts = [...processes.map((p) => p.burst)].sort((a, b) => a - b);
  const median =
    sortedBursts.length === 0
      ? 0
      : sortedBursts.length % 2 === 1
      ? sortedBursts[(sortedBursts.length - 1) / 2]
      : (sortedBursts[sortedBursts.length / 2 - 1] + sortedBursts[sortedBursts.length / 2]) / 2;

  const stats = base.perProcess;
  const shorts = stats.filter((s) => s.burst <= median);
  const longs = stats.filter((s) => s.burst > median);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const shortJobAvgTurnaround = roundTo(
    avg(shorts.map((s) => s.turnaround)),
    2
  );
  const longJobAvgTurnaround = roundTo(avg(longs.map((s) => s.turnaround)), 2);

  const demoteCount = events.filter((e) => e.type === "demote").length;
  const switchCount = events.filter((e) => e.type === "dispatch").length;

  // 评分公式（教学用，可改）
  // - 短作业周转：与平均周转的比率（越小越好）→ 短作业被善待
  // - 长作业周转 / makespan：越接近 1 说明长作业 starvation 严重
  // - CPU 利用率：越大越好
  // - 切换次数：与进程数的倍数（越小越好）
  // - 高优先级队列命中率（Q0 + Q1）：越高越好
  const m = base.makespan || 1;
  const n = processes.length || 1;

  const score_short = clamp(1 - shortJobAvgTurnaround / Math.max(longJobAvgTurnaround, 1), 0, 1);
  const score_long = clamp(longJobAvgTurnaround / m, 0, 1); // 长作业相对完成时间，越接近 1 越好（不被无限推迟）
  const score_cpu = clamp(base.cpuUtilization / 100, 0, 1);
  const score_switch = clamp(1 - switchCount / (n * 6), 0, 1); // 切换次数 / 6n 作为基准
  const highHit = perLevelHitRate.slice(0, Math.min(2, totalLevels)).reduce((a, b) => a + b, 0);
  const score_hit = clamp(highHit, 0, 1);

  const breakdown = [
    { label: "短作业友好度", weight: 0.25, value: score_short },
    { label: "长作业完成保障", weight: 0.2, value: score_long },
    { label: "CPU 利用率", weight: 0.2, value: score_cpu },
    { label: "切换开销控制", weight: 0.15, value: score_switch },
    { label: "高优先级命中率", weight: 0.2, value: score_hit },
  ];
  const composite =
    breakdown.reduce((a, b) => a + b.weight * b.value, 0) * 100;

  return {
    base,
    perLevelHitRate,
    shortJobAvgTurnaround,
    longJobAvgTurnaround,
    demoteCount,
    switchCount,
    compositeScore: roundTo(composite, 1),
    scoreBreakdown: breakdown.map((b) => ({ ...b, value: roundTo(b.value, 3) })),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
