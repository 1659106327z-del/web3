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

const VB_W = 920;
const PAD = 16;
const INNER_PAD = 10;
const LABEL_PAD = 18;
const CARD_GAP = 6;
const ROW_GAP = 8;
const BADGE_W = 60;
const SIDE_W = 140;

function cardSizeFor(n: number) {
  if (n <= 1) return { w: 78, h: 46 };
  if (n <= 3) return { w: 68, h: 42 };
  if (n <= 4) return { w: 60, h: 36 };
  if (n <= 5) return { w: 54, h: 34 };
  return { w: 48, h: 32 };
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function colsFor(width: number, card: { w: number }) {
  return Math.max(1, Math.floor((width - INNER_PAD * 2) / (card.w + CARD_GAP)));
}

function rowsFor(count: number, cols: number) {
  return Math.max(1, Math.ceil(Math.max(count, 1) / Math.max(1, cols)));
}

function zoneHeight(rows: number, card: { h: number }, withLabel = true) {
  return (
    INNER_PAD * 2 +
    (withLabel ? LABEL_PAD : 0) +
    rows * card.h +
    (rows - 1) * CARD_GAP
  );
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

  const total = processes.length;
  const card = cardSizeFor(total);

  // 各区域处理进程数
  const upcomingCount = snaps.filter((s) => s.zone === "upcoming").length;
  const doneCount = snaps.filter((s) => s.zone === "done").length;
  const blockedCount = snaps.filter((s) => s.zone === "blocked").length;
  const readyCounts = quanta.map(
    (_, i) => snaps.filter((s) => s.zone === "ready" && s.level === i).length
  );

  // === 顶排：待到达 + 完成 ===
  const upcomingW = 240;
  const doneW = VB_W - PAD * 2 - upcomingW - 16;
  const upcomingCols = colsFor(upcomingW, card);
  const doneCols = colsFor(doneW, card);
  // 为容纳潜在最大数量预留：upcoming 最坏可放 total，done 最坏也可放 total
  const upcomingRows = Math.max(rowsFor(upcomingCount, upcomingCols), 1);
  const doneRows = Math.max(rowsFor(doneCount, doneCols), 1);
  const topH = Math.max(
    72,
    zoneHeight(upcomingRows, card),
    zoneHeight(doneRows, card)
  );

  const upcomingZone: Rect = {
    x: PAD,
    y: PAD,
    w: upcomingW,
    h: topH,
  };
  const doneZone: Rect = {
    x: upcomingZone.x + upcomingZone.w + 16,
    y: PAD,
    w: doneW,
    h: topH,
  };

  // === 中部：Q 队列群（左） + CPU/阻塞（右） ===
  const queueW = VB_W - PAD * 2 - SIDE_W - 16;
  const qInnerW = queueW - INNER_PAD * 2 - BADGE_W - 6;
  const qCols = Math.max(1, Math.floor(qInnerW / (card.w + CARD_GAP)));

  const qRowHeights = readyCounts.map((c) => {
    const rows = rowsFor(c, qCols);
    // 单 Q 行最小 h：保证标签徽章能放下
    return Math.max(56, INNER_PAD * 2 + rows * card.h + (rows - 1) * CARD_GAP);
  });
  const middleH =
    qRowHeights.reduce((a, b) => a + b, 0) + (totalLevels - 1) * ROW_GAP;

  const queueRows = quanta.map((q, i) => {
    const y =
      upcomingZone.y +
      upcomingZone.h +
      16 +
      qRowHeights.slice(0, i).reduce((a, b) => a + b, 0) +
      i * ROW_GAP;
    return {
      level: i,
      q,
      x: PAD,
      y,
      w: queueW,
      h: qRowHeights[i],
    };
  });

  // CPU 与阻塞队列
  const cpuMinH = Math.max(80, card.h + 36);
  const blockedCols = colsFor(SIDE_W, card);
  const blockedRows = rowsFor(blockedCount, blockedCols);
  const blockedH = Math.max(60, zoneHeight(blockedRows, card));
  // 优先填充 CPU 高度，余下分给 blocked；若 blocked 需要更多，整体扩大
  const cpuH = Math.max(cpuMinH, middleH - blockedH - ROW_GAP);
  const adjustedBlockedH = Math.max(blockedH, middleH - cpuH - ROW_GAP);
  const sideTotalH = cpuH + ROW_GAP + adjustedBlockedH;
  const finalMiddleH = Math.max(middleH, sideTotalH);

  // 若 side 总高超过 middleH，需要把空间补给最后一个 Q 行
  if (sideTotalH > middleH) {
    const extra = sideTotalH - middleH;
    queueRows[queueRows.length - 1].h += extra;
  }

  const cpuZone: Rect = {
    x: VB_W - PAD - SIDE_W,
    y: upcomingZone.y + upcomingZone.h + 16,
    w: SIDE_W,
    h: cpuH,
  };
  const blockedZone: Rect = {
    x: VB_W - PAD - SIDE_W,
    y: cpuZone.y + cpuZone.h + ROW_GAP,
    w: SIDE_W,
    h: adjustedBlockedH,
  };

  const stageH = upcomingZone.y + upcomingZone.h + 16 + finalMiddleH + PAD;

  // === 位置计算 ===
  const positionInQRow = (
    row: { x: number; y: number; w: number; h: number },
    idx: number
  ) => {
    const innerX = row.x + INNER_PAD + BADGE_W + 6;
    const innerY = row.y + INNER_PAD;
    const col = idx % qCols;
    const rowIdx = Math.floor(idx / qCols);
    return {
      x: innerX + col * (card.w + CARD_GAP),
      y: innerY + rowIdx * (card.h + CARD_GAP),
    };
  };

  const positionInZone = (
    rect: Rect,
    idx: number,
    cols: number,
    centered = false
  ) => {
    const innerW = rect.w - INNER_PAD * 2;
    const startX = rect.x + INNER_PAD;
    const startY = rect.y + INNER_PAD + LABEL_PAD;
    const c = Math.max(1, cols);
    const col = idx % c;
    const rowIdx = Math.floor(idx / c);
    const xOff = centered
      ? Math.max(0, (innerW - (c * card.w + (c - 1) * CARD_GAP)) / 2)
      : 0;
    return {
      x: startX + xOff + col * (card.w + CARD_GAP),
      y: startY + rowIdx * (card.h + CARD_GAP),
    };
  };

  const cpuPosition = (): { x: number; y: number } => ({
    x: cpuZone.x + (cpuZone.w - card.w) / 2,
    y: cpuZone.y + (cpuZone.h - card.h) / 2,
  });

  const positions = new Map<string, { x: number; y: number }>();
  for (const s of snaps) {
    if (s.zone === "upcoming") {
      positions.set(s.pid, positionInZone(upcomingZone, s.indexInZone, upcomingCols));
    } else if (s.zone === "done") {
      positions.set(s.pid, positionInZone(doneZone, s.indexInZone, doneCols));
    } else if (s.zone === "ready") {
      const row = queueRows[s.level];
      if (row) positions.set(s.pid, positionInQRow(row, s.indexInZone));
    } else if (s.zone === "blocked") {
      positions.set(s.pid, positionInZone(blockedZone, s.indexInZone, blockedCols, true));
    } else if (s.zone === "cpu") {
      positions.set(s.pid, cpuPosition());
    }
  }

  const cpuLevel = snaps.find((s) => s.zone === "cpu")?.level;

  return (
    <div className="glass-subtle relative w-full overflow-hidden rounded-2xl p-4">
      <svg
        viewBox={`0 0 ${VB_W} ${stageH}`}
        className="block h-auto w-full"
        role="img"
        aria-label="MFQ 多级反馈队列舞台"
      >
        <ZoneRect
          zone={upcomingZone}
          label="待到达"
          rightLabel={`${upcomingCount}`}
        />
        <ZoneRect zone={doneZone} label="完成队列" rightLabel={`${doneCount}`} />

        {queueRows.map((row, i) => (
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
            {/* 左侧 Q 标签徽章 */}
            <rect
              x={row.x + 8}
              y={row.y + (row.h - 38) / 2}
              width={BADGE_W - 6}
              height={38}
              rx={10}
              ry={10}
              className="fill-brand/10 stroke-brand/40"
              strokeWidth={1}
            />
            <text
              x={row.x + 8 + (BADGE_W - 6) / 2}
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
              x={row.x + 8 + (BADGE_W - 6) / 2}
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
              {readyCounts[i]} 项
            </text>
          </g>
        ))}

        <ZoneRect
          zone={cpuZone}
          label="CPU"
          tone="cpu"
          rightLabel={cpuLevel !== undefined ? `Q${cpuLevel}` : "空闲"}
        />
        <ZoneRect zone={blockedZone} label="阻塞" rightLabel={`${blockedCount}`} />

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
  zone: Rect;
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
