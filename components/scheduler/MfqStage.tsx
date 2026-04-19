"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useSimulation } from "@/store/simulationStore";
import { deriveMfqSnapshots } from "@/lib/scheduler/mfq-derive";
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

const VB = { w: 900, h: 0 };
const ROW_H = 56;
const ROW_GAP = 8;
const TOP_BAR_H = 76;
const SIDE_W = 130;

function cardSizeForCount(n: number) {
  if (n <= 1) return { w: 70, h: 36 };
  if (n <= 3) return { w: 60, h: 34 };
  if (n <= 4) return { w: 54, h: 32 };
  if (n <= 5) return { w: 48, h: 30 };
  return { w: 44, h: 28 };
}

export function MfqStage({ quanta }: { quanta: number[] }) {
  const processes = useSimulation((s) => s.processes);
  const events = useSimulation((s) => s.events);
  const segments = useSimulation((s) => s.segments);
  const t = useSimulation((s) => s.currentTime);
  const reduced = useReducedMotion();

  const totalLevels = quanta.length;
  const snaps = useMemo(
    () => deriveMfqSnapshots(processes, events, segments, t, totalLevels),
    [processes, events, segments, t, totalLevels]
  );

  // 计算总高度
  const stageH = TOP_BAR_H + totalLevels * ROW_H + (totalLevels - 1) * ROW_GAP + 24;
  VB.h = stageH;
  const card = cardSizeForCount(processes.length);

  // 区域定义
  const upcomingZone = { x: 24, y: 16, w: 200, h: 50 };
  const doneZone = { x: 240, y: 16, w: VB.w - 240 - 24, h: 50 };
  const queueWidth = VB.w - 24 - SIDE_W - 24 - 16;
  const cpuZone = {
    x: VB.w - SIDE_W - 24,
    y: TOP_BAR_H,
    w: SIDE_W,
    h: ROW_H * Math.max(1, Math.floor((totalLevels + 1) / 2)) + ROW_GAP,
  };
  const blockedZone = {
    x: VB.w - SIDE_W - 24,
    y: cpuZone.y + cpuZone.h + ROW_GAP,
    w: SIDE_W,
    h: stageH - cpuZone.y - cpuZone.h - ROW_GAP - 16,
  };

  const queueRows = Array.from({ length: totalLevels }, (_, i) => ({
    level: i,
    x: 24,
    y: TOP_BAR_H + i * (ROW_H + ROW_GAP),
    w: queueWidth,
    h: ROW_H,
    q: quanta[i],
  }));

  // 给每个 snapshot 计算坐标
  const positionFor = (zone: { x: number; y: number; w: number; h: number }, idx: number) => {
    const pad = 8;
    const innerW = zone.w - pad * 2 - 64; // 留出左侧标签空间
    const startX = zone.x + pad + 64;
    const startY = zone.y + (zone.h - card.h) / 2;
    const step = card.w + 4;
    const cols = Math.max(1, Math.floor(innerW / step));
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return { x: startX + col * step, y: startY + row * (card.h + 4) };
  };

  const positionForSimple = (zone: { x: number; y: number; w: number; h: number }, idx: number, dir: "row" | "col" = "row") => {
    if (dir === "col") {
      const pad = 8;
      const innerH = zone.h - pad * 2;
      const step = card.h + 4;
      const cols = Math.max(1, Math.floor(innerH / step));
      const col = Math.floor(idx / cols);
      const row = idx % cols;
      return {
        x: zone.x + (zone.w - card.w) / 2 + col * (card.w + 4),
        y: zone.y + pad + row * step,
      };
    }
    const pad = 8;
    const innerW = zone.w - pad * 2;
    const startX = zone.x + pad;
    const startY = zone.y + (zone.h - card.h) / 2;
    const step = card.w + 4;
    const cols = Math.max(1, Math.floor(innerW / step));
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return { x: startX + col * step, y: startY + row * (card.h + 4) };
  };

  const cpuPosition = () => ({
    x: cpuZone.x + (cpuZone.w - card.w) / 2,
    y: cpuZone.y + (cpuZone.h - card.h) / 2,
  });

  const positions = new Map<string, { x: number; y: number }>();
  for (const s of snaps) {
    if (s.zone === "upcoming") positions.set(s.pid, positionForSimple(upcomingZone, s.indexInZone));
    else if (s.zone === "done") positions.set(s.pid, positionForSimple(doneZone, s.indexInZone));
    else if (s.zone === "ready") {
      const row = queueRows[s.level];
      if (row) positions.set(s.pid, positionFor(row, s.indexInZone));
    } else if (s.zone === "blocked") {
      positions.set(s.pid, positionForSimple(blockedZone, s.indexInZone, "col"));
    } else if (s.zone === "cpu") {
      positions.set(s.pid, cpuPosition());
    }
  }

  const cpuLevel = snaps.find((s) => s.zone === "cpu")?.level;

  return (
    <div className="glass-subtle relative w-full overflow-hidden rounded-2xl p-4">
      <svg
        viewBox={`0 0 ${VB.w} ${stageH}`}
        className="block h-auto w-full"
        role="img"
        aria-label="MFQ 多级反馈队列舞台"
      >
        {/* 上排：待到达 / 完成 */}
        <ZoneRect zone={upcomingZone} label="待到达" rightLabel={`${snaps.filter((s) => s.zone === "upcoming").length}`} />
        <ZoneRect zone={doneZone} label="完成队列" rightLabel={`${snaps.filter((s) => s.zone === "done").length}`} />

        {/* 各级就绪队列 */}
        {queueRows.map((row) => {
          const count = snaps.filter((s) => s.zone === "ready" && s.level === row.level).length;
          return (
            <g key={row.level}>
              <rect
                x={row.x}
                y={row.y}
                width={row.w}
                height={row.h}
                rx={14}
                ry={14}
                className="fill-white/55 stroke-ink/10 dark:fill-white/5 dark:stroke-white/10"
                strokeWidth={1.2}
              />
              {/* 左侧标签徽章 */}
              <rect
                x={row.x + 8}
                y={row.y + (row.h - 36) / 2}
                width={50}
                height={36}
                rx={10}
                ry={10}
                className="fill-brand/10 stroke-brand/40"
                strokeWidth={1}
              />
              <text
                x={row.x + 33}
                y={row.y + row.h / 2 - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-brand"
                fontSize={11}
                fontFamily="var(--font-mono), monospace"
                fontWeight={700}
              >
                Q{row.level}
              </text>
              <text
                x={row.x + 33}
                y={row.y + row.h / 2 + 9}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-brand"
                fontSize={9}
                fontFamily="var(--font-mono), monospace"
                opacity={0.85}
              >
                q={row.q}
              </text>
              <text
                x={row.x + row.w - 10}
                y={row.y + 14}
                textAnchor="end"
                className="fill-ink-faint"
                fontSize={10}
                fontFamily="var(--font-mono), monospace"
              >
                {count} 项
              </text>
            </g>
          );
        })}

        {/* CPU + 阻塞 */}
        <ZoneRect zone={cpuZone} label="CPU" tone="cpu" rightLabel={cpuLevel !== undefined ? `Q${cpuLevel}` : "空闲"} />
        <ZoneRect zone={blockedZone} label="阻塞队列" rightLabel={`${snaps.filter((s) => s.zone === "blocked").length}`} />

        {/* 进程 */}
        {processes.map((p) => {
          const snap = snaps.find((x) => x.pid === p.id);
          const pos = positions.get(p.id);
          if (!pos || !snap) return null;
          const color = PROC_COLORS[(p.colorIndex ?? 1) % PROC_COLORS.length];
          const isCpu = snap.zone === "cpu";
          const isDone = snap.zone === "done";
          return (
            <motion.g
              key={p.id}
              initial={false}
              animate={{ x: pos.x, y: pos.y }}
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
                rx={9}
                ry={9}
                fill={color}
                opacity={isDone ? 0.4 : 1}
              />
              {isCpu && (
                <rect
                  width={card.w}
                  height={card.h}
                  rx={9}
                  ry={9}
                  fill="none"
                  stroke="#B45309"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="0.8s" repeatCount="indefinite" />
                </rect>
              )}
              <text
                x={card.w / 2}
                y={card.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={Math.max(10, card.h * 0.36)}
                fontFamily="var(--font-mono), monospace"
                fontWeight={700}
              >
                {p.name}
              </text>
            </motion.g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" />
          Q0 优先级最高 → 高级队列非空时立即抢占低级
        </span>
        <span>用满时间片未完成 → 自动降级到下一队列</span>
      </div>
    </div>
  );
}

function ZoneRect({
  zone,
  label,
  tone,
  rightLabel,
}: {
  zone: { x: number; y: number; w: number; h: number };
  label: string;
  tone?: "cpu";
  rightLabel?: string;
}) {
  return (
    <g>
      <rect
        x={zone.x}
        y={zone.y}
        width={zone.w}
        height={zone.h}
        rx={14}
        ry={14}
        className={cn(
          "fill-white/55 stroke-ink/10 dark:fill-white/5 dark:stroke-white/10",
          tone === "cpu" && "fill-brand/[0.08] stroke-brand/45 dark:fill-brand/10"
        )}
        strokeWidth={1.2}
      />
      <text
        x={zone.x + 12}
        y={zone.y + 14}
        className="fill-ink-soft"
        fontSize={11}
        fontFamily="var(--font-mono), monospace"
        fontWeight={600}
      >
        {label}
      </text>
      {rightLabel && (
        <text
          x={zone.x + zone.w - 10}
          y={zone.y + 14}
          textAnchor="end"
          className={cn("fill-ink-faint", tone === "cpu" && "fill-brand")}
          fontSize={10}
          fontFamily="var(--font-mono), monospace"
        >
          {rightLabel}
        </text>
      )}
    </g>
  );
}
