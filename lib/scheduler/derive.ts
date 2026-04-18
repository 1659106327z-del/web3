import type {
  GanttSegment,
  Process,
  TimelineEvent,
} from "./types";

export type ZoneKey = "upcoming" | "ready" | "cpu" | "blocked" | "done";

export interface ProcessSnapshot {
  pid: string;
  zone: ZoneKey;
  indexInZone: number;
  level?: number;
  remaining: number;
}

/**
 * Derives, for a given currentTime, the location of every process among
 * the four queues + CPU. A process that was preempted off CPU goes to the
 * blocked queue (per the project spec), and returns to the ready queue
 * before being dispatched again via a subsequent 'arrive-like' admission.
 *
 * We approximate: after a 'preempt' event the process sits in "blocked"
 * briefly, then in "ready" once its next upcoming dispatch is within
 * DISPATCH_PREP_WINDOW time units.
 */
const DISPATCH_PREP_WINDOW = 0.6;

export function deriveSnapshots(
  processes: Process[],
  events: TimelineEvent[],
  segments: GanttSegment[],
  t: number
): ProcessSnapshot[] {
  const snaps: ProcessSnapshot[] = [];
  const sortedEvents = [...events].sort((a, b) => a.t - b.t);

  const lastEventBefore = (pid: string): TimelineEvent | undefined => {
    let found: TimelineEvent | undefined;
    for (const e of sortedEvents) {
      if (e.pid !== pid) continue;
      if (e.t <= t + 1e-9) found = e;
      else break;
    }
    return found;
  };

  const nextEventAfter = (pid: string): TimelineEvent | undefined => {
    for (const e of sortedEvents) {
      if (e.pid !== pid) continue;
      if (e.t > t + 1e-9) return e;
    }
    return undefined;
  };

  const executedBefore = (pid: string): number => {
    let done = 0;
    for (const s of segments) {
      if (s.pid !== pid) continue;
      if (s.end <= t + 1e-9) done += s.end - s.start;
      else if (s.start < t) done += t - s.start;
    }
    return done;
  };

  const runningSeg = segments.find((s) => s.start <= t + 1e-9 && t < s.end);
  const cpuPid = runningSeg?.pid;

  const ready: string[] = [];
  const blocked: string[] = [];
  const doneList: string[] = [];
  const upcoming: string[] = [];

  for (const p of processes) {
    if (p.arrival > t + 1e-9) {
      upcoming.push(p.id);
      continue;
    }
    const last = lastEventBefore(p.id);
    const next = nextEventAfter(p.id);
    if (last?.type === "complete") {
      doneList.push(p.id);
      continue;
    }
    if (p.id === cpuPid) continue;

    if (last?.type === "preempt") {
      const timeSince = t - last.t;
      const willDispatchSoon = next?.type === "dispatch" && next.t - t <= DISPATCH_PREP_WINDOW;
      if (willDispatchSoon || timeSince > DISPATCH_PREP_WINDOW) {
        ready.push(p.id);
      } else {
        blocked.push(p.id);
      }
    } else {
      ready.push(p.id);
    }
  }

  upcoming.forEach((pid, i) => {
    const p = processes.find((x) => x.id === pid)!;
    snaps.push({ pid, zone: "upcoming", indexInZone: i, remaining: p.burst });
  });
  ready.forEach((pid, i) => {
    const p = processes.find((x) => x.id === pid)!;
    snaps.push({ pid, zone: "ready", indexInZone: i, remaining: p.burst - executedBefore(pid) });
  });
  blocked.forEach((pid, i) => {
    const p = processes.find((x) => x.id === pid)!;
    snaps.push({ pid, zone: "blocked", indexInZone: i, remaining: p.burst - executedBefore(pid) });
  });
  doneList.forEach((pid, i) => {
    const p = processes.find((x) => x.id === pid)!;
    snaps.push({ pid, zone: "done", indexInZone: i, remaining: 0 });
    void p;
  });
  if (cpuPid) {
    const p = processes.find((x) => x.id === cpuPid)!;
    snaps.push({
      pid: cpuPid,
      zone: "cpu",
      indexInZone: 0,
      level: runningSeg?.level,
      remaining: p.burst - executedBefore(cpuPid),
    });
  }

  return snaps;
}
