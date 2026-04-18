import type {
  AlgoConfig,
  GanttSegment,
  Process,
  Scheduler,
  SimulationResult,
  TimelineEvent,
} from "./types";
import { computeStats, mergeAdjacentSegments } from "./stats";

export const rr: Scheduler = {
  key: "rr",
  run(processes: Process[], config: AlgoConfig): SimulationResult {
    const q = Math.max(1, config.timeQuantum ?? 2);
    const events: TimelineEvent[] = [];
    const segs: GanttSegment[] = [];
    const remaining = new Map<string, number>(processes.map((p) => [p.id, p.burst]));
    processes.forEach((p) => events.push({ t: p.arrival, type: "arrive", pid: p.id }));

    if (!processes.length) {
      return { events, segments: [], stats: computeStats(processes, []), makespan: 0 };
    }

    const sortedArr = [...processes].sort((a, b) => a.arrival - b.arrival);
    let t = sortedArr[0].arrival;
    const queue: Process[] = [];
    const enqueued = new Set<string>();
    const done = new Set<string>();

    const admit = (time: number) => {
      for (const p of sortedArr) {
        if (!enqueued.has(p.id) && p.arrival <= time && !done.has(p.id)) {
          queue.push(p);
          enqueued.add(p.id);
        }
      }
    };

    admit(t);

    const safety = 100000;
    let guard = 0;
    while (done.size < processes.length && guard++ < safety) {
      if (!queue.length) {
        const nextArr = sortedArr
          .filter((p) => !done.has(p.id) && !enqueued.has(p.id))
          .map((p) => p.arrival);
        if (!nextArr.length) break;
        t = Math.min(...nextArr);
        admit(t);
        continue;
      }
      const pick = queue.shift()!;
      events.push({ t, type: "dispatch", pid: pick.id });
      const rem = remaining.get(pick.id) ?? 0;
      const slice = Math.min(q, rem);
      segs.push({ pid: pick.id, start: t, end: t + slice });
      t += slice;
      remaining.set(pick.id, rem - slice);

      admit(t);

      if ((remaining.get(pick.id) ?? 0) <= 1e-9) {
        events.push({ t, type: "complete", pid: pick.id });
        done.add(pick.id);
      } else {
        events.push({ t, type: "preempt", pid: pick.id, reason: "quantum" });
        queue.push(pick);
      }
    }

    const segments = mergeAdjacentSegments(segs);
    const stats = computeStats(processes, segments);
    events.sort((a, b) => a.t - b.t);
    return { events, segments, stats, makespan: stats.makespan };
  },
};
