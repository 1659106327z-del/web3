import type {
  AlgoConfig,
  GanttSegment,
  Process,
  Scheduler,
  SimulationResult,
  TimelineEvent,
} from "./types";
import { computeStats, mergeAdjacentSegments } from "./stats";

/**
 * Multi-level Feedback Queue (MFQ).
 * - Default 3 levels with quanta [2, 4, 8].
 * - Level 0 is highest priority; a process using up its slice without finishing
 *   is demoted to the next level. The lowest level runs as FCFS-with-quantum.
 * - New arrivals enter level 0. Higher-level work preempts lower-level work.
 */
export const mfq: Scheduler = {
  key: "mfq",
  run(processes: Process[], config: AlgoConfig): SimulationResult {
    const quanta =
      config.mfqQuanta && config.mfqQuanta.length
        ? config.mfqQuanta.map((q) => Math.max(1, q))
        : [2, 4, 8];
    const levels = quanta.length;

    const events: TimelineEvent[] = [];
    const segs: GanttSegment[] = [];
    const remaining = new Map<string, number>(processes.map((p) => [p.id, p.burst]));
    const level = new Map<string, number>(processes.map((p) => [p.id, 0]));
    processes.forEach((p) => events.push({ t: p.arrival, type: "arrive", pid: p.id }));

    if (!processes.length) {
      return { events, segments: [], stats: computeStats(processes, []), makespan: 0 };
    }

    const sortedArr = [...processes].sort((a, b) => a.arrival - b.arrival);
    const queues: Process[][] = Array.from({ length: levels }, () => []);
    const enqueued = new Set<string>();
    const done = new Set<string>();

    let t = sortedArr[0].arrival;

    const admit = (time: number) => {
      for (const p of sortedArr) {
        if (!enqueued.has(p.id) && p.arrival <= time && !done.has(p.id)) {
          queues[0].push(p);
          enqueued.add(p.id);
        }
      }
    };

    const topLevel = () => {
      for (let i = 0; i < levels; i++) if (queues[i].length) return i;
      return -1;
    };

    admit(t);

    const safety = 100000;
    let guard = 0;
    while (done.size < processes.length && guard++ < safety) {
      const lvl = topLevel();
      if (lvl < 0) {
        const nextArr = sortedArr
          .filter((p) => !done.has(p.id) && !enqueued.has(p.id))
          .map((p) => p.arrival);
        if (!nextArr.length) break;
        t = Math.min(...nextArr);
        admit(t);
        continue;
      }
      const pick = queues[lvl].shift()!;
      events.push({ t, type: "dispatch", pid: pick.id });
      const rem = remaining.get(pick.id) ?? 0;
      const slice = Math.min(quanta[lvl], rem);

      // determine preemption by higher-level arrival during this slice
      const futureHigherArrivals = sortedArr
        .filter((p) => !enqueued.has(p.id) && p.arrival > t && p.arrival < t + slice)
        .map((p) => p.arrival);
      const preemptAt = futureHigherArrivals.length
        ? Math.min(...futureHigherArrivals)
        : Infinity;
      const actualSlice = Math.min(slice, preemptAt - t);

      segs.push({ pid: pick.id, start: t, end: t + actualSlice, level: lvl });
      remaining.set(pick.id, rem - actualSlice);
      t += actualSlice;

      admit(t);

      if ((remaining.get(pick.id) ?? 0) <= 1e-9) {
        events.push({ t, type: "complete", pid: pick.id });
        done.add(pick.id);
        continue;
      }

      if (actualSlice >= slice) {
        const nextLevel = Math.min(lvl + 1, levels - 1);
        if (nextLevel !== lvl) {
          events.push({ t, type: "demote", pid: pick.id, fromLevel: lvl, toLevel: nextLevel });
          level.set(pick.id, nextLevel);
        }
        events.push({ t, type: "preempt", pid: pick.id, reason: "quantum" });
        queues[nextLevel].push(pick);
      } else {
        events.push({ t, type: "preempt", pid: pick.id, reason: "priority" });
        queues[lvl].unshift(pick);
      }
    }

    const segments = mergeAdjacentSegments(segs);
    const stats = computeStats(processes, segments);
    events.sort((a, b) => a.t - b.t);
    return { events, segments, stats, makespan: stats.makespan };
  },
};
