import type { AlgorithmKey } from "./types";

export interface IntroArticle {
  key: AlgorithmKey;
  title: string;
  lead: string;
  history: string;
  principle: string;
  pseudocode: string;
  pros: string[];
  cons: string[];
  useCases: string[];
  complexity: string;
}

export const introArticles: Record<AlgorithmKey, IntroArticle> = {
  fcfs: {
    key: "fcfs",
    title: "先来先服务（FCFS）",
    lead: "按进入就绪队列的顺序依次占用 CPU 的最朴素调度策略，常作为教学与对比的基线算法。",
    history:
      "作业排队思想可以追溯到 1950 年代的批处理系统。IBM 7094、CTSS 等早期系统普遍采用作业到达先后顺序进行处理；在后来的多道批处理操作系统中 FCFS 也被用作长程作业调度的默认策略，至今仍是大多数操作系统课程的入门算法。",
    principle:
      "维护一个按到达时间排序的 FIFO 队列，处理机空闲时取队首进程执行直至完成。非抢占：一旦开始运行，除非主动让出或结束，否则不会被替换。",
    pseudocode: `按到达时间排序 ready 队列
while ready 非空:
  p ← ready.dequeue()
  从当前时钟运行 p，持续 p.burst
  记录 p 的完成时间
end`,
    pros: [
      "实现极其简单，无需比较与优先级",
      "无饥饿问题，公平性好",
      "上下文切换开销最低",
    ],
    cons: [
      "易发生护航效应（convoy effect），长作业阻塞短作业",
      "平均周转时间与等待时间通常较差",
      "不适合交互式和实时系统",
    ],
    useCases: ["批处理作业、后台任务、I/O 密集度均衡的简单场景"],
    complexity: "调度决策 O(1)，排序 O(n log n)",
  },
  sjf: {
    key: "sjf",
    title: "短作业优先（SJF，非抢占）",
    lead: "处理机空闲时从就绪队列中挑选估计服务时间最短的作业执行，是最小化平均等待时间的经典策略。",
    history:
      "1960 年代操作系统研究者证明，在所有非抢占式调度算法中，SJF 能给出最优的平均等待时间。这一结论使其成为调度理论的奠基之一，至今仍广泛用于离线作业调度与队列论分析。",
    principle:
      "仅在 CPU 空闲时做决策：在所有已到达且未完成的进程中选择服务时间最短者，运行至结束。非抢占。",
    pseudocode: `while 仍有未完成进程:
  等待直到至少有一个进程到达
  p ← argmin(已到达未完成.burst)
  运行 p 至结束`,
    pros: [
      "能达到理论上最优的平均等待时间（非抢占式场景）",
      "对短作业极为友好，响应迅速",
    ],
    cons: [
      "需要预估服务时间，实际系统难以准确获得",
      "长作业可能发生饥饿",
      "不适合交互式环境",
    ],
    useCases: ["离线批处理、执行时间可估计的计算任务、编译任务调度"],
    complexity: "每次调度 O(n)，可用最小堆优化至 O(log n)",
  },
  srtf: {
    key: "srtf",
    title: "最短剩余时间优先（SRTF）",
    lead: "SJF 的抢占式版本：当新进程到达且其剩余时间比当前运行进程更短时立即抢占 CPU。",
    history:
      "SRTF 是 SJF 在抢占场景下的自然推广，广泛出现在 UNIX 早期研究文献中。由于它可以进一步降低平均等待时间，理论层面常与 SJF 并列讨论；但其对先验信息的依赖使得工程实现多采用基于历史运行时间的指数平均来近似 burst。",
    principle:
      "每当有进程到达或当前进程完成时重新评估：选择剩余时间最短者运行。若剩余时间相同，保持正在运行的进程以减少切换。",
    pseudocode: `on every event (arrival / completion):
  candidates ← 已到达未完成的进程
  pick p = argmin(candidates.remaining)
  若 p ≠ running: 抢占切换到 p`,
    pros: [
      "在已知服务时间下取得最优的平均等待时间",
      "对短作业响应性最佳",
    ],
    cons: [
      "长作业饥饿风险更高",
      "上下文切换开销较大",
      "仍需估计剩余时间",
    ],
    useCases: ["研究性基准算法、配合历史估计用于交互式系统的决策层"],
    complexity: "每次事件 O(log n)（最小堆维护剩余时间）",
  },
  rr: {
    key: "rr",
    title: "时间片轮转（Round Robin）",
    lead: "为每个进程分配固定时间片，时钟中断到期后切换下一个，兼顾公平性与响应速度，是分时系统的基石。",
    history:
      "时间片轮转由 1961 年诞生的 MIT 兼容分时系统（CTSS）率先使用，后在 Multics、UNIX 等系统中广泛沿用。Linux 早期的 O(1) 调度器、后期的 CFS 仍保留了时间片思想的影子，只是时间片长度与优先级耦合变得更加精细。",
    principle:
      "就绪队列按 FIFO 组织，调度器取出队首执行一个时间片 q。时间片耗尽触发时钟中断：若未完成则回到就绪队列尾部，若完成则直接离开系统。期间新到达的进程加到队尾。",
    pseudocode: `while 存在未完成进程:
  p ← ready.dequeue()
  run p for min(q, p.remaining)
  将期间到达的新进程加入就绪队列
  if p 未完成: ready.enqueue(p)
  else: 记录完成时间`,
    pros: [
      "天然公平，每个进程都能在有界时间内获得 CPU",
      "响应时间有上界，适合交互场景",
      "实现简单、可预测",
    ],
    cons: [
      "时间片过小导致频繁上下文切换",
      "时间片过大则退化为 FCFS",
      "对计算型与交互型进程一视同仁，可能浪费资源",
    ],
    useCases: ["通用分时系统、交互式多任务操作系统的基础调度层"],
    complexity: "调度决策 O(1)",
  },
  psa: {
    key: "psa",
    title: "优先级调度（Priority Scheduling）",
    lead: "为每个进程分配优先级，优先级高者优先占用 CPU，可进一步区分静态 / 动态优先级与抢占 / 非抢占两种变体。",
    history:
      "优先级调度思想可追溯至最早的实时操作系统。1970 年代后，RT-11、VxWorks、VMS、Windows NT 等操作系统大量采用基于优先级的调度框架；现代 Linux 的实时调度类（SCHED_FIFO、SCHED_RR）即是优先级调度的直接体现。",
    principle:
      "静态优先级由创建时确定；动态优先级会根据等待时间（老化，aging）或 I/O 行为动态调整。抢占式下高优先级到达会立即抢占当前运行进程；非抢占式则需等待运行进程主动让出。",
    pseudocode: `on each scheduling point:
  对于每个就绪进程 p:
    若启用 aging: p.effective = p.base - ⌊wait(p) / τ⌋
  pick argmin(effective)
  抢占式: 若新选进程不同于当前进程则切换`,
    pros: [
      "能够反映业务重要性，适合实时性要求不同的混合负载",
      "动态老化可缓解低优先级进程的饥饿问题",
    ],
    cons: [
      "静态优先级易导致低优先级进程饥饿",
      "需要合理的优先级分配策略",
      "抢占模式下上下文切换开销增加",
    ],
    useCases: ["实时操作系统、服务器混合业务负载、嵌入式控制系统"],
    complexity: "调度 O(log n)（优先队列维护）",
  },
  mfq: {
    key: "mfq",
    title: "多级反馈队列（MFQ）",
    lead: "多条不同优先级的就绪队列，短作业在高优先级队列获得快速响应，长作业逐级降级，接近最优综合表现。",
    history:
      "MFQ 由 Corbato 等人在 CTSS 时代提出，后被 Multics、早期 UNIX、Solaris 以及 Windows NT 调度器沿用；Windows 的“分层反馈”机制、早期 Linux 的 O(1) 调度器均可视为 MFQ 思想的工程化。",
    principle:
      "维护若干级别的就绪队列（如 Q0 最高），各级拥有不同的时间片。新进程进入 Q0；用满时间片未完成则降一级并重入队尾；主动让出（如 I/O 阻塞）则保持当前级别。高优先级队列非空时立即抢占低优先级任务。",
    pseudocode: `queues[0..k-1], quantum[0..k-1]
while 存在未完成进程:
  i ← 最高非空队列下标
  p ← queues[i].dequeue()
  run p for min(quantum[i], p.remaining)
  若运行期间 queues[0..i-1] 非空: 抢占并回填 queues[i].front
  若 p 完成: 记录结束; continue
  若用满时间片: i' = min(i+1, k-1); queues[i'].enqueue(p)
  否则（阻塞/主动让出）: queues[i].enqueue(p)`,
    pros: [
      "无需预先知道作业长度即可近似实现 SJF 的效果",
      "对交互型和计算型进程都有较好适应性",
      "结合老化策略可避免饥饿",
    ],
    cons: [
      "参数（层数、时间片、降级规则）调优复杂",
      "实现复杂度显著高于单级算法",
      "不同工作负载下需要重新标定",
    ],
    useCases: ["通用多任务操作系统的主调度策略、服务器与桌面混合负载"],
    complexity: "调度 O(1)（每级 FIFO）",
  },
};
