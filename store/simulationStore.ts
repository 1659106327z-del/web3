"use client";

import { create } from "zustand";
import {
  algorithmMeta,
  algorithmList,
  runAlgorithm,
} from "@/lib/scheduler/registry";
import type {
  AlgoConfig,
  AlgorithmKey,
  GanttSegment,
  Process,
  RunStats,
  TimelineEvent,
} from "@/lib/scheduler/types";

export type ProcLocation =
  | { zone: "upcoming" }
  | { zone: "ready"; index: number }
  | { zone: "cpu" }
  | { zone: "blocked"; index: number }
  | { zone: "done"; index: number };

type SimState = {
  algorithm: AlgorithmKey;
  processes: Process[];
  config: AlgoConfig;
  events: TimelineEvent[];
  segments: GanttSegment[];
  stats: RunStats | null;
  makespan: number;

  currentTime: number;
  playing: boolean;
  speed: number;
  error: string | null;
};

type SimActions = {
  setAlgorithm: (k: AlgorithmKey) => void;
  setProcesses: (p: Process[]) => void;
  addProcess: (p: Omit<Process, "id" | "name" | "colorIndex"> & Partial<Process>) => { ok: boolean; reason?: string };
  removeProcess: (id: string) => void;
  clearProcesses: () => void;
  randomize: (n?: number) => void;
  setConfig: (c: Partial<AlgoConfig>) => void;
  compile: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (s: number) => void;
  setTime: (t: number) => void;
  tick: (delta: number) => void;
};

const MAX_PROCESSES = 6;

function uid(i: number) {
  return `P${i + 1}`;
}

function samplePreset(): Process[] {
  return [
    { id: "P1", name: "P1", arrival: 0, burst: 7, priority: 2, colorIndex: 1 },
    { id: "P2", name: "P2", arrival: 2, burst: 4, priority: 1, colorIndex: 2 },
    { id: "P3", name: "P3", arrival: 4, burst: 1, priority: 3, colorIndex: 3 },
    { id: "P4", name: "P4", arrival: 5, burst: 4, priority: 2, colorIndex: 4 },
  ];
}

export const useSimulation = create<SimState & SimActions>((set, get) => ({
  algorithm: "fcfs",
  processes: samplePreset(),
  config: { ...algorithmMeta.fcfs.defaults },
  events: [],
  segments: [],
  stats: null,
  makespan: 0,
  currentTime: 0,
  playing: false,
  speed: 1,
  error: null,

  setAlgorithm(k) {
    set({ algorithm: k, config: { ...algorithmMeta[k].defaults }, playing: false, currentTime: 0 });
    get().compile();
  },

  setProcesses(p) {
    set({ processes: p, playing: false, currentTime: 0 });
    get().compile();
  },

  addProcess(input) {
    const list = get().processes;
    if (list.length >= MAX_PROCESSES) {
      return { ok: false, reason: `最多仅支持 ${MAX_PROCESSES} 个进程` };
    }
    const idx = list.length;
    const id = input.id ?? uid(idx);
    const proc: Process = {
      id,
      name: input.name ?? id,
      arrival: Math.max(0, input.arrival ?? 0),
      burst: Math.max(1, input.burst ?? 1),
      priority: input.priority ?? 3,
      colorIndex: input.colorIndex ?? ((idx % 6) + 1),
    };
    set({ processes: [...list, proc], playing: false, currentTime: 0 });
    get().compile();
    return { ok: true };
  },

  removeProcess(id) {
    const rest = get().processes.filter((p) => p.id !== id);
    set({ processes: rest, playing: false, currentTime: 0 });
    get().compile();
  },

  clearProcesses() {
    set({ processes: [], events: [], segments: [], stats: null, makespan: 0, currentTime: 0, playing: false });
  },

  randomize(n) {
    const count = n ?? Math.floor(Math.random() * 4) + 3; // 3-6
    const list: Process[] = [];
    for (let i = 0; i < count; i++) {
      const id = uid(i);
      list.push({
        id,
        name: id,
        arrival: Math.floor(Math.random() * 8),
        burst: Math.floor(Math.random() * 8) + 2,
        priority: Math.floor(Math.random() * 5) + 1,
        colorIndex: (i % 6) + 1,
      });
    }
    set({ processes: list, playing: false, currentTime: 0 });
    get().compile();
  },

  setConfig(c) {
    set({ config: { ...get().config, ...c }, playing: false, currentTime: 0 });
    get().compile();
  },

  compile() {
    const { algorithm, processes, config } = get();
    try {
      if (!processes.length) {
        set({ events: [], segments: [], stats: null, makespan: 0, error: null });
        return;
      }
      const res = runAlgorithm(algorithm, processes, config);
      set({
        events: res.events,
        segments: res.segments,
        stats: res.stats,
        makespan: res.makespan,
        error: null,
      });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  play() {
    if (get().makespan <= 0) get().compile();
    if (get().currentTime >= get().makespan) set({ currentTime: 0 });
    set({ playing: true });
  },
  pause() {
    set({ playing: false });
  },
  toggle() {
    get().playing ? get().pause() : get().play();
  },
  reset() {
    set({ currentTime: 0, playing: false });
  },
  stepForward() {
    const { currentTime, events, makespan } = get();
    const next = events.find((e) => e.t > currentTime + 1e-9);
    const nt = Math.min(next ? next.t : makespan, makespan);
    set({ currentTime: nt, playing: false });
  },
  stepBackward() {
    const { currentTime, events } = get();
    const prev = [...events].reverse().find((e) => e.t < currentTime - 1e-9);
    set({ currentTime: Math.max(0, prev ? prev.t : 0), playing: false });
  },
  setSpeed(s) {
    set({ speed: s });
  },
  setTime(t) {
    set({ currentTime: Math.max(0, Math.min(t, get().makespan)) });
  },
  tick(delta) {
    const { currentTime, speed, makespan, playing } = get();
    if (!playing) return;
    const nt = Math.min(makespan, currentTime + delta * speed);
    set({ currentTime: nt });
    if (nt >= makespan) set({ playing: false });
  },
}));

// Initial compile
if (typeof window !== "undefined") {
  queueMicrotask(() => useSimulation.getState().compile());
}

export { MAX_PROCESSES, algorithmList };
