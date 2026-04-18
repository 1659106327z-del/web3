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

type Zone = {
  key: ZoneKey;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  tone?: "default" | "cpu" | "done" | "upcoming";
};

const VB = { w: 900, h: 360 };

const ZONES: Zone[] = [
  { key: "upcoming", label: "待到达", x: 24, y: 20, w: 200, h: 96, cols: 3, tone: "upcoming" },
  { key: "done", label: "完成队列", x: 240, y: 20, w: 636, h: 96, cols: 6 },
  { key: "ready", label: "就绪队列", x: 24, y: 140, w: 340, h: 200, cols: 3 },
  { key: "cpu", label: "CPU", x: 388, y: 140, w: 124, h: 200, cols: 1, tone: "cpu" },
  { key: "blocked", label: "阻塞队列", x: 536, y: 140, w: 340, h: 200, cols: 3 },
];

function cardSizeFor(count: number) {
  if (count <= 1) return { w: 72, h: 44 };
  if (count <= 3) return { w: 62, h: 40 };
  if (count <= 4) return { w: 56, h: 36 };
  if (count <= 5) return { w: 50, h: 34 };
  return { w: 46, h: 32 };
}

function positionInZone(
  zone: Zone,
  index: number,
  count: number,
  card: { w: number; h: number }
) {
  const pad = 12;
  const labelPad = zone.key === "cpu" ? 0 : 18;
  const innerW = zone.w - pad * 2;
  const innerH = zone.h - pad - labelPad - pad;

  if (zone.key === "cpu") {
    return {
      x: zone.x + (zone.w - card.w) / 2,
      y: zone.y + (zone.h - card.h) / 2 + 6,
    };
  }

  const cols = Math.max(1, Math.min(zone.cols, count || 1));
  const rows = Math.ceil((count || 1) / cols);

  const gapX = cols > 1 ? Math.max(4, (innerW - cols * card.w) / (cols - 1)) : 0;
  const gapY =
    rows > 1 ? Math.max(4, (innerH - rows * card.h) / (rows - 1)) : 0;

  const col = index % cols;
  const row = Math.floor(index / cols);

  const totalW = cols * card.w + (cols - 1) * gapX;
  const totalH = rows * card.h + (rows - 1) * gapY;
  const startX = zone.x + pad + (innerW - totalW) / 2;
  const startY = zone.y + pad + labelPad + Math.max(0, (innerH - totalH) / 2);

  return {
    x: startX + col * (card.w + gapX),
    y: startY + row * (card.h + gapY),
  };
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

  const card = cardSizeFor(processes.length);

  return (
    <div className="glass-subtle relative w-full overflow-hidden rounded-2xl p-4">
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="block h-auto w-full"
        role="img"
        aria-label="进程调度舞台"
      >
        <defs>
          <marker
            id="arrow-h"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {ZONES.map((z) => (
          <g key={z.key}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx={16}
              ry={16}
              className={cn(
                "fill-white/60 stroke-ink/10 dark:fill-white/5 dark:stroke-white/10",
                z.tone === "cpu" &&
                  "fill-brand/[0.08] stroke-brand/45 dark:fill-brand/10 dark:stroke-brand/45"
              )}
              strokeWidth={1.2}
            />
            <text
              x={z.x + 14}
              y={z.y + 16}
              className="fill-ink-soft"
              fontSize={11}
              fontFamily="var(--font-mono), monospace"
              fontWeight={600}
            >
              {z.label}
            </text>
            <text
              x={z.x + z.w - 14}
              y={z.y + 16}
              textAnchor="end"
              className={cn(
                "fill-ink-faint",
                z.tone === "cpu" && "fill-brand"
              )}
              fontSize={10}
              fontFamily="var(--font-mono), monospace"
            >
              {z.tone === "cpu" ? "处理机" : `${countsByZone.get(z.key) ?? 0}`}
            </text>
          </g>
        ))}

        {/* connecting arrows between zones */}
        <g
          className="text-ink-faint dark:text-white/30"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="3 4"
        >
          <path d="M 200 110 L 330 150" markerEnd="url(#arrow-h)" />
          <path d="M 370 240 L 385 240" markerEnd="url(#arrow-h)" />
          <path d="M 515 240 L 530 240" markerEnd="url(#arrow-h)" />
          <path d="M 450 138 L 450 118" markerEnd="url(#arrow-h)" />
        </g>

        {processes.map((p) => {
          const snap = snapMap.get(p.id);
          const zone = ZONES.find((z) => z.key === (snap?.zone ?? "upcoming"))!;
          const countInZone = countsByZone.get(zone.key) ?? 1;
          const { x, y } = positionInZone(zone, snap?.indexInZone ?? 0, countInZone, card);
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
                y={card.h / 2 - (card.h > 34 ? 3 : 0)}
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
