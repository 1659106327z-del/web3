import type { Process, Scheduler, SimulationResult, TimelineEvent, GanttSegment } from "./types";
import { computeStats, mergeAdjacentSegments } from "./stats";

export const sjf: Scheduler = {
  key: "sjf",
  run(processes: Process[]): SimulationResult {
    const events: TimelineEvent[] = [];
    const segs: GanttSegment[] = [];
    const pending = [...processes].sort((a, b) => a.arrival - b.arrival);
    for (const p of pending) events.push({ t: p.arrival, type: "arrive", pid: p.id });

    const ready: Process[] = [];
    let t = pending[0]?.arrival ?? 0;
    const done = new Set<string>();

    while (done.size < processes.length) {
      while (pending.length && pending[0].arrival <= t) {
        ready.push(pending.shift()!);
      }
      if (!ready.length) {
        t = pending[0]!.arrival;
        continue;
      }
      ready.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || a.id.localeCompare(b.id));
      const pick = ready.shift()!;
      events.push({ t, type: "dispatch", pid: pick.id });
      segs.push({ pid: pick.id, start: t, end: t + pick.burst });
      t += pick.burst;
      events.push({ t, type: "complete", pid: pick.id });
      done.add(pick.id);
    }

    const segments = mergeAdjacentSegments(segs);
    const stats = computeStats(processes, segments);
    events.sort((a, b) => a.t - b.t);
    return { events, segments, stats, makespan: stats.makespan };
  },
};
