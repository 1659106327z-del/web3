"use client";

import { useEffect, useRef } from "react";
import type { GanttSegment, Process } from "@/lib/scheduler/types";

const PROC_COLORS = [
  "#0F766E", "#0F766E", "#B45309", "#65A30D", "#BE185D", "#0369A1", "#7C3AED",
];

type Props = {
  processes: Process[];
  segments: GanttSegment[];
  makespan: number;
  currentTime?: number;
  height?: number;
  compact?: boolean;
};

export function GanttChart({
  processes,
  segments,
  makespan,
  currentTime,
  height,
  compact,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = container.clientWidth;
      const rowH = compact ? 22 : 28;
      const headerH = compact ? 22 : 28;
      const padL = 64;
      const padR = 16;
      const h = height ?? headerH + rowH * (processes.length + 1) + 24;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains("dark");
      const colText = isDark ? "#D6D3D1" : "#57534E";
      const colFaint = isDark ? "#78716C" : "#A8A29E";
      const colLine = isDark ? "#2B2B30" : "#E7E5E4";
      const colRow = isDark ? "rgba(255,255,255,0.03)" : "rgba(28,25,23,0.03)";

      const maxT = Math.max(1, makespan);
      const chartW = w - padL - padR;
      const scale = chartW / maxT;

      // time axis (ticks)
      ctx.font = "11px var(--font-mono), monospace";
      ctx.fillStyle = colText;
      ctx.strokeStyle = colLine;
      ctx.lineWidth = 1;

      const unit = maxT > 30 ? 5 : maxT > 15 ? 2 : 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      for (let t = 0; t <= maxT + 1e-6; t += unit) {
        const x = padL + t * scale;
        ctx.beginPath();
        ctx.moveTo(x, headerH);
        ctx.lineTo(x, h - 18);
        ctx.strokeStyle = colLine;
        ctx.stroke();
        ctx.fillStyle = colFaint;
        ctx.fillText(`${t}`, x, headerH - 4);
      }

      // rows
      for (let i = 0; i < processes.length; i++) {
        const p = processes[i];
        const y = headerH + i * rowH;
        ctx.fillStyle = colRow;
        ctx.fillRect(padL, y, chartW, rowH);
        ctx.fillStyle = colText;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.font = "500 12px var(--font-mono), monospace";
        ctx.fillText(p.name, padL - 8, y + rowH / 2);
      }

      // CPU summary row
      const cpuY = headerH + processes.length * rowH;
      ctx.fillStyle = colRow;
      ctx.fillRect(padL, cpuY, chartW, rowH);
      ctx.fillStyle = colText;
      ctx.textAlign = "right";
      ctx.fillText("CPU", padL - 8, cpuY + rowH / 2);

      // segments on per-process rows
      for (const seg of segments) {
        const pi = processes.findIndex((p) => p.id === seg.pid);
        if (pi < 0) continue;
        const p = processes[pi];
        const color = PROC_COLORS[(p.colorIndex ?? 1) % PROC_COLORS.length];
        const x = padL + seg.start * scale;
        const wSeg = Math.max(1, (seg.end - seg.start) * scale);
        const y = headerH + pi * rowH + 3;
        roundRect(ctx, x, y, wSeg, rowH - 6, 4);
        ctx.fillStyle = color;
        ctx.fill();
        // CPU row mirror
        const y2 = cpuY + 3;
        roundRect(ctx, x, y2, wSeg, rowH - 6, 4);
        ctx.fillStyle = color + "CC";
        ctx.fill();
        if (wSeg > 24) {
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "600 10px var(--font-mono), monospace";
          ctx.fillText(p.name, x + wSeg / 2, y + (rowH - 6) / 2);
        }
      }

      // time labels above segments (start/end tick markers)
      ctx.fillStyle = colFaint;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = "10px var(--font-mono), monospace";
      const drawn = new Set<number>();
      for (const seg of segments) {
        const points = [seg.start, seg.end];
        for (const t of points) {
          if (drawn.has(t)) continue;
          drawn.add(t);
          const x = padL + t * scale;
          ctx.fillText(`${t}`, x, cpuY + rowH + 2);
        }
      }

      // cursor line
      if (typeof currentTime === "number" && currentTime >= 0 && currentTime <= maxT) {
        const cx = padL + currentTime * scale;
        ctx.strokeStyle = "#B45309";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, headerH - 4);
        ctx.lineTo(cx, h - 16);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#B45309";
        ctx.beginPath();
        ctx.arc(cx, headerH - 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [processes, segments, makespan, currentTime, compact, height]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
