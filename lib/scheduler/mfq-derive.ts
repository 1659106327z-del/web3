import type { GanttSegment, Process, TimelineEvent } from "./types";

export type MfqZone = "upcoming" | "ready" | "cpu" | "blocked" | "done";

export interface MfqSnapshot {
  pid: string;
  zone: MfqZone;
  level: number;
  indexInZone: number;
  remaining: number;
}

const PREP_WINDOW = 0.6;

/**
 * Per-process snapshot at time t for MFQ visualization.
 * `level` is the queue level the process currently belongs to.
 */
export function deriveMfqSnapshots(
  processes: Process[],
  events: TimelineEvent[],
  segments: GanttSegment[],
  t: number,
  totalLevels: number
): MfqSnapshot[] {
  const sorted = [...events].sort((a, b) => a.t - b.t);

  const lastBefore = (pid: string) => {
    let found: TimelineEvent | undefined;
    for (const e of sorted) {
      if (e.pid !== pid) continue;
      if (e.t <= t + 1e-9) found = e;
      else break;
    }
    return found;
  };

  const nextAfter = (pid: string) => {
    for (const e of sorted) {
      if (e.pid !== pid) continue;
      if (e.t > t + 1e-9) return e;
    }
    return undefined;
  };

  const executedBefore = (pid: string) => {
    let done = 0;
    for (const s of segments) {
      if (s.pid !== pid) continue;
      if (s.end <= t + 1e-9) done += s.end - s.start;
      else if (s.start < t) done += t - s.start;
    }
    return done;
  };

  // 当前所在队列层级：取 t 之前最后一条 dispatch / demote 事件的 level
  const levelOf = (pid: string) => {
    let lvl = 0;
    for (const e of sorted) {
      if (e.pid !== pid) continue;
      if (e.t > t + 1e-9) break;
      if (e.type === "demote" && typeof e.toLevel === "number") lvl = e.toLevel;
    }
    return Math.max(0, Math.min(lvl, totalLevels - 1));
  };

  const runningSeg = segments.find((s) => s.start <= t + 1e-9 && t < s.end);
  const cpuPid = runningSeg?.pid;

  const upcoming: string[] = [];
  const doneList: string[] = [];
  // 按 level 分桶的就绪
  const readyByLevel: string[][] = Array.from({ length: totalLevels }, () => []);
  const blocked: string[] = [];

  for (const p of processes) {
    if (p.arrival > t + 1e-9) {
      upcoming.push(p.id);
      continue;
    }
    const last = lastBefore(p.id);
    const next = nextAfter(p.id);
    if (last?.type === "complete") {
      doneList.push(p.id);
      continue;
    }
    if (p.id === cpuPid) continue;

    if (last?.type === "preempt") {
      const elapsed = t - last.t;
      const willDispatchSoon = next?.type === "dispatch" && next.t - t <= PREP_WINDOW;
      if (willDispatchSoon || elapsed > PREP_WINDOW) {
        readyByLevel[levelOf(p.id)].push(p.id);
      } else {
        blocked.push(p.id);
      }
    } else {
      readyByLevel[levelOf(p.id)].push(p.id);
    }
  }

  const snaps: MfqSnapshot[] = [];

  upcoming.forEach((pid, i) => {
    const p = processes.find((x) => x.id === pid)!;
    snaps.push({ pid, zone: "upcoming", level: 0, indexInZone: i, remaining: p.burst });
  });

  readyByLevel.forEach((bucket, lvl) => {
    bucket.forEach((pid, i) => {
      const p = processes.find((x) => x.id === pid)!;
      snaps.push({
        pid,
        zone: "ready",
        level: lvl,
        indexInZone: i,
        remaining: p.burst - executedBefore(pid),
      });
    });
  });

  blocked.forEach((pid, i) => {
    const p = processes.find((x) => x.id === pid)!;
    snaps.push({
      pid,
      zone: "blocked",
      level: levelOf(pid),
      indexInZone: i,
      remaining: p.burst - executedBefore(pid),
    });
  });

  doneList.forEach((pid, i) => {
    snaps.push({ pid, zone: "done", level: levelOf(pid), indexInZone: i, remaining: 0 });
  });

  if (cpuPid) {
    const p = processes.find((x) => x.id === cpuPid)!;
    snaps.push({
      pid: cpuPid,
      zone: "cpu",
      level: runningSeg?.level ?? levelOf(cpuPid),
      indexInZone: 0,
      remaining: p.burst - executedBefore(cpuPid),
    });
  }

  return snaps;
}
