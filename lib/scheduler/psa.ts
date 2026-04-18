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
 * Priority Scheduling (PSA)
 * - Lower number = higher priority (classic convention).
 * - Static mode: priority stays as given.
 * - Dynamic mode: an aging mechanism decreases (improves) the effective priority
 *   of waiting processes every `mfqAgingThreshold` time units (reused field),
 *   defaulting to 5, so long-waiting processes gradually rise.
 * - Preemptive mode re-evaluates at every integer tick + every arrival.
 * - Non-preemptive mode only picks when CPU is idle.
 */
export const psa: Scheduler = {
  key: "psa",
  run(processes: Process[], config: AlgoConfig): SimulationResult {
    const dynamic = config.priorityMode === "dynamic";
    const preempt = !!config.preemptive;
    const agingStep = Math.max(1, config.mfqAgingThreshold ?? 5);

    const events: TimelineEvent[] = [];
    const segs: GanttSegment[] = [];
    const remaining = new Map<string, number>(
      processes.map((p) => [p.id, p.burst])
    );
    const basePri = new Map<string, number>(
      processes.map((p) => [p.id, p.priority ?? 3])
    );
    const waitSince = new Map<string, number>();
    processes.forEach((p) => events.push({ t: p.arrival, type: "arrive", pid: p.id }));

    if (!processes.length) {
      return { events, segments: [], stats: computeStats(processes, []), makespan: 0 };
    }

    let t = Math.min(...processes.map((p) => p.arrival));
    const done = new Set<string>();
    let running: string | null = null;

    const effectivePriority = (pid: string) => {
      const base = basePri.get(pid)!;
      if (!dynamic) return base;
      const since = waitSince.get(pid);
      if (since === undefined) return base;
      const waited = Math.max(0, t - since);
      return base - Math.floor(waited / agingStep);
    };

    const pickReady = () => {
      const ready = processes.filter(
        (p) => p.arrival <= t && !done.has(p.id) && (remaining.get(p.id) ?? 0) > 0
      );
      if (!ready.length) return null;
      ready.sort(
        (a, b) =>
          effectivePriority(a.id) - effectivePriority(b.id) ||
          a.arrival - b.arrival ||
          a.id.localeCompare(b.id)
      );
      return ready[0];
    };

    const nextEventTime = () => {
      const arrivals = processes
        .filter((p) => !done.has(p.id) && p.arrival > t)
        .map((p) => p.arrival);
      const base = arrivals.length ? Math.min(...arrivals) : Infinity;
      if (!dynamic) return base;
      // Aging can change the ordering on agingStep boundaries
      const nextAging = Math.floor(t / 1) + 1; // integer tick
      return Math.min(base, nextAging);
    };

    for (const p of processes) waitSince.set(p.id, p.arrival);

    const safety = 100000;
    let guard = 0;
    while (done.size < processes.length && guard++ < safety) {
      const pick = pickReady();
      if (!pick) {
        const nextArr = processes
          .filter((p) => !done.has(p.id) && p.arrival > t)
          .map((p) => p.arrival);
        if (!nextArr.length) break;
        t = Math.min(...nextArr);
        continue;
      }

      if (running !== pick.id) {
        if (running && preempt) {
          events.push({ t, type: "preempt", pid: running, reason: "priority" });
          waitSince.set(running, t);
        }
        events.push({ t, type: "dispatch", pid: pick.id });
        waitSince.delete(pick.id);
        running = pick.id;
      }

      let runUntil: number;
      if (preempt) {
        const ne = nextEventTime();
        runUntil = Math.min(t + (remaining.get(pick.id) ?? 0), ne);
        if (runUntil <= t) runUntil = t + 1;
      } else {
        runUntil = t + (remaining.get(pick.id) ?? 0);
      }

      const delta = runUntil - t;
      segs.push({ pid: pick.id, start: t, end: runUntil });
      remaining.set(pick.id, (remaining.get(pick.id) ?? 0) - delta);
      t = runUntil;

      if ((remaining.get(pick.id) ?? 0) <= 1e-9) {
        events.push({ t, type: "complete", pid: pick.id });
        done.add(pick.id);
        running = null;
      } else if (!preempt) {
        events.push({ t, type: "complete", pid: pick.id });
      }
    }

    const segments = mergeAdjacentSegments(segs);
    const stats = computeStats(processes, segments);
    events.sort((a, b) => a.t - b.t);
    return { events, segments, stats, makespan: stats.makespan };
  },
};
