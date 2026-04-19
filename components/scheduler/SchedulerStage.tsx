"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useSimulation } from "@/store/simulationStore";
import { deriveSnapshots, type ZoneKey } from "@/lib/scheduler/derive";
import { cn } from "@/lib/utils";

const PROC_COLORS = [
  "#0F766E",
  "#0F766E",
  "#B45309",
  "#65A30D",
  "#BE185D",
  "#0369A1",
  "#7C3AED",
];

interface Zone {
  key: ZoneKey;
  label: string;
  cols: number;
  tone?: "default" | "cpu" | "done" | "upcoming";
}

const VB_W = 920;
const STAGE_PAD = 16;
const LABEL_PAD = 22;
const INNER_PAD = 12;
const CARD_GAP = 8;

function cardSizeFor(count: number) {
  if (count <= 1) return { w: 78, h: 48 };
  if (count <= 3) return { w: 68, h: 44 };
  if (count <= 4) return { w: 60, h: 38 };
  if (count <= 5) return { w: 54, h: 34 };
  return { w: 48, h: 32 };
}

export function SchedulerStage() {
  const processes = useSimulation((s) => s.processes);
  const events = useSimulation((s) => s.events);
  const segments = useSimulation((s) => s.segments);
  const t = useSimulation((s) => s.currentTime);
  const reduced = useReducedMotion();

  const snapshots = useMemo(
    () => deriveSnapshots(processes, events, segments, t),
    [processes, events, segments, t]
  );
  const snapMap = new Map(snapshots.map((s) => [s.pid, s]));
  const countsByZone = useMemo(() => {
    const m = new Map<ZoneKey, number>();
    for (const s of snapshots) m.set(s.zone, (m.get(s.zone) ?? 0) + 1);
    return m;
  }, [snapshots]);

  const total = processes.length;
  const card = cardSizeFor(total);
  const cpuW = Math.max(120, card.w + 40);

  // 计算每个区域所需的最小尺寸
  const upcomingCount = countsByZone.get("upcoming") ?? 0;
  const doneCount = countsByZone.get("done") ?? 0;
  const readyCount = countsByZone.get("ready") ?? 0;
  const blockedCount = countsByZone.get("blocked") ?? 0;

  // 上部：upcoming + done 横排，等高
  // upcoming 宽度按其最大可能容量（=processes.length）需要的列数算最小宽
  const topRowH = computeRowHeight(Math.max(upcomingCount, 0), 3, card);
  const topZoneH = Math.max(70, topRowH);

  const upcomingZone = {
    x: STAGE_PAD,
    y: STAGE_PAD,
    w: 220,
    h: topZoneH,
  };
  const doneZone = {
    x: upcomingZone.x + upcomingZone.w + 16,
    y: STAGE_PAD,
    w: VB_W - upcomingZone.x - upcomingZone.w - 16 - STAGE_PAD,
    h: topZoneH,
  };

  // 中部：ready (左) + cpu (中) + blocked (右)
  // ready/blocked 高度根据各自所需 + 容量（保证 6 进程不溢出）
  // 列数根据宽度推断
  const readyW = 360;
  const blockedW = 280;
  const readyCols = Math.max(1, Math.floor((readyW - INNER_PAD * 2) / (card.w + CARD_GAP)));
  const blockedCols = Math.max(1, Math.floor((blockedW - INNER_PAD * 2) / (card.w + CARD_GAP)));

  // 假设最坏情况：所有进程都堆在 ready / blocked
  const readyCapacity = Math.max(readyCount, Math.min(total, total));
  const blockedCapacity = Math.max(blockedCount, Math.min(total, total));
  const readyH = Math.max(170, computeRowHeight(readyCapacity, readyCols, card));
  const blockedH = Math.max(170, computeRowHeight(blockedCapacity, blockedCols, card));
  const middleH = Math.max(readyH, blockedH);

  const readyZone = {
    x: STAGE_PAD,
    y: upcomingZone.y + upcomingZone.h + 16,
    w: readyW,
    h: middleH,
  };
  const cpuZone = {
    x: readyZone.x + readyZone.w + 16,
    y: readyZone.y,
    w: cpuW,
    h: middleH,
  };
  const blockedZone = {
    x: cpuZone.x + cpuZone.w + 16,
    y: readyZone.y,
    w: VB_W - (cpuZone.x + cpuZone.w + 16) - STAGE_PAD,
    h: middleH,
  };

  const stageH = readyZone.y + middleH + STAGE_PAD;

  const zones: { zone: Zone; rect: typeof upcomingZone; cols: number }[] = [
    { zone: { key: "upcoming", label: "待到达", cols: 3, tone: "upcoming" }, rect: upcomingZone, cols: 3 },
    { zone: { key: "done", label: "完成队列", cols: Math.max(1, Math.floor((doneZone.w - INNER_PAD * 2) / (card.w + CARD_GAP))) }, rect: doneZone, cols: Math.max(1, Math.floor((doneZone.w - INNER_PAD * 2) / (card.w + CARD_GAP))) },
    { zone: { key: "ready", label: "就绪队列", cols: readyCols }, rect: readyZone, cols: readyCols },
    { zone: { key: "cpu", label: "CPU", cols: 1, tone: "cpu" }, rect: cpuZone, cols: 1 },
    { zone: { key: "blocked", label: "阻塞队列", cols: blockedCols }, rect: blockedZone, cols: blockedCols },
  ];

  const positionFor = (
    rect: { x: number; y: number; w: number; h: number },
    cols: number,
    index: number,
    isCpu = false
  ) => {
    if (isCpu) {
      return {
        x: rect.x + (rect.w - card.w) / 2,
        y: rect.y + (rect.h - card.h) / 2,
      };
    }
    const innerW = rect.w - INNER_PAD * 2;
    const innerH = rect.h - INNER_PAD - LABEL_PAD - INNER_PAD;
    const c = Math.max(1, cols);
    const col = index % c;
    const row = Math.floor(index / c);
    const stepX = card.w + CARD_GAP;
    const stepY = card.h + CARD_GAP;
    const startX = rect.x + INNER_PAD + Math.max(0, (innerW - (c * card.w + (c - 1) * CARD_GAP)) / 2);
    const startY = rect.y + INNER_PAD + LABEL_PAD;
    void innerH;
    return { x: startX + col * stepX, y: startY + row * stepY };
  };

  return (
    <div className="glass-subtle relative w-full overflow-hidden rounded-2xl p-4">
      <svg
        viewBox={`0 0 ${VB_W} ${stageH}`}
        className="block h-auto w-full"
        role="img"
        aria-label="进程调度舞台"
      >
        {zones.map(({ zone, rect }) => (
          <g key={zone.key}>
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
              rx={16}
              ry={16}
              className={cn(
                "fill-white/55 stroke-ink/10 dark:fill-white/5 dark:stroke-white/10",
                zone.tone === "cpu" &&
                  "fill-brand/[0.08] stroke-brand/45 dark:fill-brand/10"
              )}
              strokeWidth={1.2}
            />
            <text
              x={rect.x + 14}
              y={rect.y + 16}
              className="fill-ink-soft"
              fontSize={11}
              fontFamily="var(--font-mono), monospace"
              fontWeight={600}
            >
              {zone.label}
            </text>
            <text
              x={rect.x + rect.w - 14}
              y={rect.y + 16}
              textAnchor="end"
              className={cn("fill-ink-faint", zone.tone === "cpu" && "fill-brand")}
              fontSize={10}
              fontFamily="var(--font-mono), monospace"
            >
              {zone.tone === "cpu" ? "处理机" : `${countsByZone.get(zone.key) ?? 0}`}
            </text>
          </g>
        ))}

        {processes.map((p) => {
          const snap = snapMap.get(p.id);
          const z = zones.find((zz) => zz.zone.key === (snap?.zone ?? "upcoming"))!;
          const { x, y } = positionFor(
            z.rect,
            z.cols,
            snap?.indexInZone ?? 0,
            z.zone.key === "cpu"
          );
          const color = PROC_COLORS[(p.colorIndex ?? 1) % PROC_COLORS.length];
          const isCpu = snap?.zone === "cpu";
          const isDone = snap?.zone === "done";

          return (
            <motion.g
              key={p.id}
              initial={false}
              animate={{ x, y }}
              transition={{
                type: reduced ? "tween" : "spring",
                stiffness: 180,
                damping: 24,
                duration: reduced ? 0 : undefined,
              }}
            >
              <rect
                width={card.w}
                height={card.h}
                rx={10}
                ry={10}
                fill={color}
                opacity={isDone ? 0.4 : 1}
              />
              {isCpu && (
                <rect
                  width={card.w}
                  height={card.h}
                  rx={10}
                  ry={10}
                  fill="none"
                  stroke="#B45309"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-14"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </rect>
              )}
              <text
                x={card.w / 2}
                y={card.h / 2 - (card.h > 36 ? 4 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={Math.max(10, card.h * 0.32)}
                fontFamily="var(--font-mono), monospace"
                fontWeight={700}
              >
                {p.name}
              </text>
              {card.h >= 34 && (
                <text
                  x={card.w / 2}
                  y={card.h / 2 + card.h * 0.28}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  opacity={0.85}
                  fontSize={Math.max(8, card.h * 0.22)}
                  fontFamily="var(--font-mono), monospace"
                >
                  {snap ? `剩 ${Math.max(0, Math.round(snap.remaining * 10) / 10)}` : ""}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />
          CPU 运行
        </span>
        <span>抢占时流入阻塞队列，随后重新进入就绪队列</span>
        <span>运行结束 → 完成队列</span>
      </div>
    </div>
  );
}

function computeRowHeight(
  count: number,
  cols: number,
  card: { w: number; h: number }
) {
  const rows = Math.max(1, Math.ceil(Math.max(count, 1) / Math.max(1, cols)));
  return INNER_PAD + LABEL_PAD + rows * card.h + (rows - 1) * CARD_GAP + INNER_PAD;
}
