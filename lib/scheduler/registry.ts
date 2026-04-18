import type { AlgoConfig, AlgorithmKey, Process, Scheduler, SimulationResult } from "./types";
import { fcfs } from "./fcfs";
import { sjf } from "./sjf";
import { srtf } from "./srtf";
import { rr } from "./rr";
import { psa } from "./psa";
import { mfq } from "./mfq";

export const schedulers: Record<AlgorithmKey, Scheduler> = {
  fcfs,
  sjf,
  srtf,
  rr,
  psa,
  mfq,
};

export interface AlgorithmMeta {
  key: AlgorithmKey;
  name: string;
  short: string;
  summary: string;
  preemptive: "是" | "否" | "可选" | "可配";
  config: {
    timeQuantum?: boolean;
    priorityMode?: boolean;
    preemptive?: boolean;
    mfq?: boolean;
  };
  defaults: AlgoConfig;
}

export const algorithmMeta: Record<AlgorithmKey, AlgorithmMeta> = {
  fcfs: {
    key: "fcfs",
    name: "先来先服务",
    short: "FCFS",
    summary: "按到达时间依次执行，最直观的非抢占式策略。",
    preemptive: "否",
    config: {},
    defaults: {},
  },
  sjf: {
    key: "sjf",
    name: "短作业优先（非抢占）",
    short: "SJF",
    summary: "CPU 空闲时选择剩余服务时间最短的进程，减少平均等待时间。",
    preemptive: "否",
    config: {},
    defaults: {},
  },
  srtf: {
    key: "srtf",
    name: "最短剩余时间优先",
    short: "SRTF",
    summary: "SJF 的抢占式版本，新进程到达时可打断当前长作业。",
    preemptive: "是",
    config: {},
    defaults: {},
  },
  rr: {
    key: "rr",
    name: "时间片轮转",
    short: "RR",
    summary: "按固定时间片在就绪队列中循环调度，适合交互式分时系统。",
    preemptive: "是",
    config: { timeQuantum: true },
    defaults: { timeQuantum: 2 },
  },
  psa: {
    key: "psa",
    name: "优先级调度",
    short: "PSA",
    summary: "按进程优先级数字大小调度，可选静态 / 动态、抢占 / 非抢占。",
    preemptive: "可配",
    config: { priorityMode: true, preemptive: true },
    defaults: { priorityMode: "static", preemptive: true, mfqAgingThreshold: 5 },
  },
  mfq: {
    key: "mfq",
    name: "多级反馈队列",
    short: "MFQ",
    summary: "多级队列分层调度，长作业自动降级至低优先级队列。",
    preemptive: "是",
    config: { mfq: true },
    defaults: { mfqQuanta: [2, 4, 8] },
  },
};

export function runAlgorithm(
  key: AlgorithmKey,
  processes: Process[],
  config: AlgoConfig
): SimulationResult {
  return schedulers[key].run(processes, { ...algorithmMeta[key].defaults, ...config });
}

export const algorithmList: AlgorithmKey[] = ["fcfs", "sjf", "srtf", "rr", "psa", "mfq"];
