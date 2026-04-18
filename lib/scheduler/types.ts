export type AlgorithmKey =
  | "fcfs"
  | "sjf"
  | "srtf"
  | "rr"
  | "psa"
  | "mfq";

export interface Process {
  id: string;
  name: string;
  arrival: number;
  burst: number;
  priority?: number;
  colorIndex?: number;
}

export type EventType =
  | "arrive"
  | "dispatch"
  | "preempt"
  | "complete"
  | "demote"
  | "tick";

export type PreemptReason =
  | "quantum"
  | "priority"
  | "shorter"
  | "demote"
  | "manual";

export interface TimelineEvent {
  t: number;
  type: EventType;
  pid: string;
  reason?: PreemptReason;
  toLevel?: number;
  fromLevel?: number;
}

export interface GanttSegment {
  pid: string;
  start: number;
  end: number;
  level?: number;
}

export interface ProcessStats {
  pid: string;
  name: string;
  arrival: number;
  burst: number;
  completion: number;
  turnaround: number;
  waiting: number;
  weightedTurnaround: number;
  response: number;
}

export interface RunStats {
  perProcess: ProcessStats[];
  avgTurnaround: number;
  avgWaiting: number;
  avgWeightedTurnaround: number;
  avgResponse: number;
  makespan: number;
  cpuUtilization: number;
}

export interface AlgoConfig {
  timeQuantum?: number;
  priorityMode?: "static" | "dynamic";
  preemptive?: boolean;
  mfqQuanta?: number[];
  mfqAgingThreshold?: number;
}

export interface SimulationResult {
  events: TimelineEvent[];
  segments: GanttSegment[];
  stats: RunStats;
  makespan: number;
}

export interface Scheduler {
  key: AlgorithmKey;
  run(processes: Process[], config: AlgoConfig): SimulationResult;
}
