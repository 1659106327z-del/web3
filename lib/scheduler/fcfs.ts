import type { Process, Scheduler, SimulationResult } from "./types";
import { computeStats, mergeAdjacentSegments } from "./stats";

export const fcfs: Scheduler = {
  key: "fcfs",
  run(processes: Process[]): SimulationResult {
    const sorted = [...processes].sort(
      (a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id)
    );
    const events: SimulationResult["events"] = [];
    const segs: SimulationResult["segments"] = [];

    let t = 0;
    for (const p of sorted) {
      events.push({ t: p.arrival, type: "arrive", pid: p.id });
    }

    for (const p of sorted) {
      if (t < p.arrival) t = p.arrival;// 尚无就绪，快进到下一到达
      events.push({ t, type: "dispatch", pid: p.id });
      segs.push({ pid: p.id, start: t, end: t + p.burst });
      t += p.burst;
      events.push({ t, type: "complete", pid: p.id });
    }

    const segments = mergeAdjacentSegments(segs);
    const stats = computeStats(processes, segments);
    events.sort((a, b) => a.t - b.t);
    return { events, segments, stats, makespan: stats.makespan };
  },
};
