import type {
  GanttSegment,
  Process,
  ProcessStats,
  RunStats,
} from "./types";
import { roundTo } from "@/lib/utils";

export function computeStats(
  processes: Process[],
  segments: GanttSegment[]
): RunStats {
  const byPid = new Map<string, Process>(processes.map((p) => [p.id, p]));
  const firstRun = new Map<string, number>();
  const completion = new Map<string, number>();

  for (const seg of segments) {
    if (!firstRun.has(seg.pid)) firstRun.set(seg.pid, seg.start);
    const prev = completion.get(seg.pid);
    if (prev === undefined || seg.end > prev) {
      completion.set(seg.pid, seg.end);
    }
  }

  const perProcess: ProcessStats[] = processes.map((p) => {
    const ct = completion.get(p.id) ?? p.arrival;
    const fr = firstRun.get(p.id) ?? p.arrival;
    const turnaround = ct - p.arrival;
    const waiting = Math.max(0, turnaround - p.burst);
    const response = Math.max(0, fr - p.arrival);
    const weightedTurnaround = p.burst === 0 ? 0 : turnaround / p.burst;
    return {
      pid: p.id,
      name: p.name,
      arrival: p.arrival,
      burst: p.burst,
      completion: roundTo(ct, 2),
      turnaround: roundTo(turnaround, 2),
      waiting: roundTo(waiting, 2),
      weightedTurnaround: roundTo(weightedTurnaround, 2),
      response: roundTo(response, 2),
    };
  });

  const n = perProcess.length || 1;
  const sum = (k: keyof ProcessStats) =>
    perProcess.reduce((a, b) => a + (b[k] as number), 0);

  const makespan = segments.length
    ? Math.max(...segments.map((s) => s.end))
    : 0;
  const busy = segments.reduce((a, s) => a + (s.end - s.start), 0);
  const firstArrive = Math.min(...processes.map((p) => p.arrival));
  const span = Math.max(1, makespan - firstArrive);

  void byPid;

  return {
    perProcess,
    avgTurnaround: roundTo(sum("turnaround") / n, 2),
    avgWaiting: roundTo(sum("waiting") / n, 2),
    avgWeightedTurnaround: roundTo(sum("weightedTurnaround") / n, 2),
    avgResponse: roundTo(sum("response") / n, 2),
    makespan: roundTo(makespan, 2),
    cpuUtilization: roundTo((busy / span) * 100, 1),
  };
}

export function mergeAdjacentSegments(segs: GanttSegment[]): GanttSegment[] {
  const out: GanttSegment[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (
      last &&
      last.pid === s.pid &&
      last.level === s.level &&
      Math.abs(last.end - s.start) < 1e-9
    ) {
      last.end = s.end;
    } else {
      out.push({ ...s });
    }
  }
  return out;
}
