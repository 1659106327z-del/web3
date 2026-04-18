import type { Process, Scheduler, SimulationResult, TimelineEvent, GanttSegment } from "./types";
import { computeStats, mergeAdjacentSegments } from "./stats";

export const srtf: Scheduler = {
  key: "srtf",
  run(processes: Process[]): SimulationResult {
    const events: TimelineEvent[] = [];
    const segs: GanttSegment[] = [];
    const remaining = new Map<string, number>(processes.map((p) => [p.id, p.burst]));
    processes.forEach((p) => events.push({ t: p.arrival, type: "arrive", pid: p.id }));

    const n = processes.length;
    if (!n) {
      const stats = computeStats(processes, []);
      return { events, segments: [], stats, makespan: 0 };
    }

    let t = Math.min(...processes.map((p) => p.arrival));
    const done = new Set<string>();
    let running: string | null = null;

    const safety = 100000;
    let guard = 0;

    while (done.size < n && guard++ < safety) {
      const ready = processes.filter(
        (p) => p.arrival <= t && !done.has(p.id) && (remaining.get(p.id) ?? 0) > 0
      );
      if (!ready.length) {
        const nextArr = processes
          .filter((p) => !done.has(p.id) && p.arrival > t)
          .map((p) => p.arrival);
        if (!nextArr.length) break;
        t = Math.min(...nextArr);
        continue;
      }
      ready.sort(
        (a, b) =>
          (remaining.get(a.id)! - remaining.get(b.id)!) ||
          a.arrival - b.arrival ||
          a.id.localeCompare(b.id)
      );
      const pick = ready[0];

      if (running !== pick.id) {
        if (running) events.push({ t, type: "preempt", pid: running, reason: "shorter" });
        events.push({ t, type: "dispatch", pid: pick.id });
        running = pick.id;
      }

      const futureArrivals = processes
        .filter((p) => !done.has(p.id) && p.arrival > t)
        .map((p) => p.arrival);
      const nextEvent = futureArrivals.length ? Math.min(...futureArrivals) : Infinity;
      const runUntil = Math.min(t + (remaining.get(pick.id) ?? 0), nextEvent);
      const delta = runUntil - t;
      segs.push({ pid: pick.id, start: t, end: runUntil });
      remaining.set(pick.id, (remaining.get(pick.id) ?? 0) - delta);
      t = runUntil;
      if ((remaining.get(pick.id) ?? 0) <= 1e-9) {
        events.push({ t, type: "complete", pid: pick.id });
        done.add(pick.id);
        running = null;
      }
    }

    const segments = mergeAdjacentSegments(segs);
    const stats = computeStats(processes, segments);
    events.sort((a, b) => a.t - b.t);
    return { events, segments, stats, makespan: stats.makespan };
  },
};
