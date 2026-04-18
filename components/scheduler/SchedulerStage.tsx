"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useSimulation } from "@/store/simulationStore";
import { deriveSnapshots, type ZoneKey } from "@/lib/scheduler/derive";
import { cn } from "@/lib/utils";

const PROC_COLORS = [
  "#6366F1", "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#A855F7",
];

const CARD_W = 62;
const CARD_H = 40;

/**
 * Layout (viewBox 760 x 360):
 *   ┌──────────┐        ┌──────────┐        ┌──────────┐
 *   │ upcoming │        │   CPU    │        │ completed│
 *   │  120,30  │        │ (center) │        │ 640,30   │
 *   └──────────┘        └──────────┘        └──────────┘
 *
 *       ready queue (center-left)         blocked queue (center-right)
 *       at ~200,140 stacking right        at ~560,140 stacking left
 */
type Zone = { key: ZoneKey; label: string; x: number; y: number; w: number; h: number; dir: "row" | "col" };
const ZONES: Zone[] = [
  { key: "upcoming", label: "待到达", x: 30, y: 30, w: 150, h: 70, dir: "row" },
  { key: "ready", label: "就绪队列", x: 30, y: 130, w: 300, h: 90, dir: "row" },
  { key: "cpu", label: "CPU", x: 330, y: 30, w: 100, h: 190, dir: "row" },
  { key: "blocked", label: "阻塞队列", x: 430, y: 130, w: 300, h: 90, dir: "row" },
  { key: "done", label: "完成队列", x: 430, y: 30, w: 300, h: 70, dir: "row" },
];

function positionFor(zone: Zone, index: number) {
  if (zone.key === "cpu") {
    return {
      x: zone.x + (zone.w - CARD_W) / 2,
      y: zone.y + (zone.h - CARD_H) / 2,
    };
  }
  const gap = 6;
  const step = CARD_W + gap;
  if (zone.dir === "row") {
    return { x: zone.x + 10 + index * step, y: zone.y + (zone.h - CARD_H) / 2 };
  }
  return { x: zone.x + (zone.w - CARD_W) / 2, y: zone.y + 10 + index * (CARD_H + gap) };
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

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-line bg-surface-muted/50 p-3 dark:border-line-dark dark:bg-surface-dark-muted/40">
      <svg viewBox="0 0 760 250" className="block h-auto w-full">
        {ZONES.map((z) => (
          <g key={z.key}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx={14}
              ry={14}
              className={cn(
                "fill-surface stroke-line dark:fill-surface-dark dark:stroke-line-dark",
                z.key === "cpu" && "fill-brand/5 stroke-brand/40"
              )}
              strokeWidth={1.2}
            />
            <text
              x={z.x + 12}
              y={z.y + 14}
              className="fill-ink-soft"
              fontSize={11}
              fontFamily="var(--font-mono), monospace"
            >
              {z.label}
            </text>
            {z.key === "cpu" && (
              <text
                x={z.x + z.w - 10}
                y={z.y + 14}
                textAnchor="end"
                className="fill-brand"
                fontSize={10}
                fontFamily="var(--font-mono), monospace"
              >
                处理机
              </text>
            )}
          </g>
        ))}

        {/* connecting arrows (subtle) */}
        <g stroke="currentColor" className="text-line-strong dark:text-line-dark" strokeWidth={1} fill="none" opacity={0.5}>
          <path d="M 180 165 L 330 125" strokeDasharray="3 3" markerEnd="url(#arrow)" />
          <path d="M 430 125 L 430 165" strokeDasharray="3 3" markerEnd="url(#arrow)" />
          <path d="M 430 60 L 430 60" />
          <path d="M 380 30 L 500 30" strokeDasharray="3 3" markerEnd="url(#arrow)" transform="translate(0,-6)" />
        </g>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-line-strong dark:text-line-dark" />
          </marker>
        </defs>

        {processes.map((p) => {
          const snap = snapMap.get(p.id);
          const zone = ZONES.find((z) => z.key === (snap?.zone ?? "upcoming"))!;
          const { x, y } = positionFor(zone, snap?.indexInZone ?? 0);
          const color = PROC_COLORS[(p.colorIndex ?? 1) % PROC_COLORS.length];
          const isCpu = snap?.zone === "cpu";
          return (
            <motion.g
              key={p.id}
              initial={false}
              animate={{ x, y }}
              transition={{
                type: reduced ? "tween" : "spring",
                stiffness: 160,
                damping: 22,
                duration: reduced ? 0 : undefined,
              }}
            >
              <rect
                width={CARD_W}
                height={CARD_H}
                rx={10}
                ry={10}
                fill={color}
                opacity={snap?.zone === "done" ? 0.45 : 1}
              />
              {isCpu && (
                <rect
                  width={CARD_W}
                  height={CARD_H}
                  rx={10}
                  ry={10}
                  fill="none"
                  stroke="#F97316"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="0.8s" repeatCount="indefinite" />
                </rect>
              )}
              <text
                x={CARD_W / 2}
                y={CARD_H / 2 - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={12}
                fontFamily="var(--font-mono), monospace"
                fontWeight={700}
              >
                {p.name}
              </text>
              <text
                x={CARD_W / 2}
                y={CARD_H / 2 + 11}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                opacity={0.85}
                fontSize={9}
                fontFamily="var(--font-mono), monospace"
              >
                {snap ? `剩 ${Math.max(0, Math.round(snap.remaining * 10) / 10)}` : ""}
              </text>
            </motion.g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-brand" /> CPU
        </span>
        <span>抢占时流回阻塞队列，随后重新进入就绪队列</span>
        <span>运行完成 → 完成队列</span>
      </div>
    </div>
  );
}
