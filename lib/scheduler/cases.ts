import type { AlgoConfig, AlgorithmKey, Process } from "./types";

export interface CaseItem {
  id: string;
  title: string;
  source: string;
  description: string;
  recommend: AlgorithmKey[];
  processes: Process[];
  config?: AlgoConfig;
}

const colors = (n: number) => Array.from({ length: n }, (_, i) => (i % 6) + 1);

function P(
  name: string,
  arrival: number,
  burst: number,
  priority: number | undefined,
  ci: number
): Process {
  return { id: name, name, arrival, burst, priority, colorIndex: ci };
}

export const caseLibrary: CaseItem[] = [
  {
    id: "tang-3-1",
    title: "汤子瀛 例 3-1：FCFS 与 SJF 对比",
    source: "汤子瀛《计算机操作系统》第 3 版 例 3-1",
    description:
      "5 个进程几乎同时到达，服务时间相差悬殊。FCFS 平均等待时间约 8.8，SJF 仅 3.6，对比效果明显。",
    recommend: ["fcfs", "sjf"],
    processes: [
      P("P1", 0, 10, 3, 1),
      P("P2", 1, 1, 1, 2),
      P("P3", 2, 2, 4, 3),
      P("P4", 3, 1, 5, 4),
      P("P5", 4, 5, 2, 5),
    ],
  },
  {
    id: "tang-3-2",
    title: "汤子瀛 例 3-2：SRTF 抢占演示",
    source: "汤子瀛《计算机操作系统》第 3 版 例 3-2",
    description:
      "进程错峰到达，服务时间长短交替。SRTF 在每次到达时重新评估剩余时间，可清晰看到抢占切换。",
    recommend: ["srtf", "sjf"],
    processes: [
      P("A", 0, 7, undefined, 1),
      P("B", 2, 4, undefined, 2),
      P("C", 4, 1, undefined, 3),
      P("D", 5, 4, undefined, 4),
    ],
  },
  {
    id: "rr-classic",
    title: "RR 经典：时间片大小的影响",
    source: "Silberschatz《操作系统概念》第 9 版 第 6 章",
    description:
      "尝试将时间片设置为 1、2、4 三种值运行同一组进程，对比上下文切换次数与平均周转时间。",
    recommend: ["rr"],
    processes: [
      P("P1", 0, 10, undefined, 1),
      P("P2", 0, 5, undefined, 2),
      P("P3", 0, 8, undefined, 3),
    ],
    config: { timeQuantum: 2 },
  },
  {
    id: "psa-priority-inversion",
    title: "优先级调度：低优先级饥饿演示",
    source: "Silberschatz《操作系统概念》第 6.3.4 节",
    description:
      "高优先级长作业不断到达，低优先级 P3 长时间无法获得 CPU；可切换为「动态优先级（老化）」观察现象缓解。",
    recommend: ["psa"],
    processes: [
      P("P1", 0, 6, 1, 1),
      P("P2", 2, 4, 1, 2),
      P("P3", 1, 3, 5, 3),
      P("P4", 4, 5, 2, 4),
    ],
    config: { priorityMode: "static", preemptive: true },
  },
  {
    id: "mfq-textbook",
    title: "MFQ 经典：长短作业混合",
    source: "Tanenbaum《现代操作系统》第 4 版 第 2 章",
    description:
      "多种长度作业混合到达，可清晰观察到短作业在 Q0 完成、长作业逐级降级的过程。",
    recommend: ["mfq"],
    processes: [
      P("S1", 0, 3, undefined, 1),
      P("L1", 0, 12, undefined, 2),
      P("S2", 2, 2, undefined, 3),
      P("L2", 4, 9, undefined, 4),
      P("S3", 6, 4, undefined, 5),
    ],
    config: { mfqQuanta: [2, 4, 8] },
  },
  {
    id: "fcfs-convoy",
    title: "FCFS：护航效应（Convoy Effect）",
    source: "经典操作系统教学例题",
    description:
      "一个长作业先到达，导致后续多个短作业全部排队等待，平均等待时间显著恶化，是讨论 FCFS 缺点的经典例子。",
    recommend: ["fcfs", "sjf"],
    processes: [
      P("Long", 0, 20, undefined, 4),
      P("Q1", 1, 1, undefined, 1),
      P("Q2", 2, 1, undefined, 2),
      P("Q3", 3, 1, undefined, 3),
    ],
  },
  {
    id: "rr-vs-sjf",
    title: "RR vs SJF：响应 vs 周转的取舍",
    source: "对比型教学用例",
    description:
      "对同组进程分别运行 RR (q=2) 与 SJF。RR 平均响应时间更优，SJF 平均周转时间更优。",
    recommend: ["rr", "sjf"],
    processes: [
      P("J1", 0, 4, undefined, 1),
      P("J2", 1, 3, undefined, 2),
      P("J3", 2, 7, undefined, 3),
      P("J4", 3, 1, undefined, 4),
      P("J5", 4, 2, undefined, 5),
    ],
    config: { timeQuantum: 2 },
  },
  {
    id: "all-equal-arrive",
    title: "同时到达：纯算法对比",
    source: "对比型教学用例",
    description:
      "全部进程在 t=0 到达，消除到达时间扰动，便于在「算法矩阵」页对比 6 种算法的纯调度差异。",
    recommend: ["fcfs", "sjf", "srtf", "rr", "psa", "mfq"],
    processes: colors(5).map((c, i) =>
      P(`P${i + 1}`, 0, [6, 8, 7, 3, 4][i], [3, 1, 4, 2, 5][i], c)
    ),
    config: { timeQuantum: 2, mfqQuanta: [2, 4, 8] },
  },
];
