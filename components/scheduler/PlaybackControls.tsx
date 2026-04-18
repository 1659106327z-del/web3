"use client";

import { useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useSimulation } from "@/store/simulationStore";
import { Button } from "@/components/ui/Button";
import { cn, formatTime } from "@/lib/utils";

const SPEEDS = [0.5, 1, 2, 4];

export function PlaybackControls() {
  const playing = useSimulation((s) => s.playing);
  const currentTime = useSimulation((s) => s.currentTime);
  const makespan = useSimulation((s) => s.makespan);
  const speed = useSimulation((s) => s.speed);
  const toggle = useSimulation((s) => s.toggle);
  const reset = useSimulation((s) => s.reset);
  const stepForward = useSimulation((s) => s.stepForward);
  const stepBackward = useSimulation((s) => s.stepBackward);
  const setSpeed = useSimulation((s) => s.setSpeed);
  const setTime = useSimulation((s) => s.setTime);
  const tick = useSimulation((s) => s.tick);

  const last = useRef<number>(0);
  useEffect(() => {
    let raf = 0;
    const loop = (ts: number) => {
      if (!last.current) last.current = ts;
      const dt = (ts - last.current) / 1000;
      last.current = ts;
      if (useSimulation.getState().playing) tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  const pct = makespan > 0 ? (currentTime / makespan) * 100 : 0;

  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 rounded-2xl p-3">
      <Button
        variant="accent"
        size="md"
        onClick={toggle}
        className={cn(playing ? "" : "animate-pulse-ring")}
      >
        {playing ? (
          <>
            <Pause className="h-4 w-4" /> 暂停
          </>
        ) : (
          <>
            <Play className="h-4 w-4" /> 开始
          </>
        )}
      </Button>

      <Button variant="outline" size="md" onClick={stepBackward} aria-label="上一事件">
        <ChevronLeft className="h-4 w-4" />
        上一步
      </Button>
      <Button variant="outline" size="md" onClick={stepForward} aria-label="下一事件">
        下一步
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="md" onClick={reset} aria-label="重置">
        <RotateCcw className="h-4 w-4" />
        重置
      </Button>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white/40 px-2 py-1 text-xs text-ink-soft backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <Gauge className="h-3.5 w-3.5" />
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "cursor-pointer rounded-lg px-2 py-0.5 font-mono transition-colors",
                speed === s
                  ? "bg-brand text-white"
                  : "hover:bg-ink/5 dark:hover:bg-white/10"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
        <div className="font-mono text-xs text-ink-soft">
          {formatTime(currentTime)} / {formatTime(makespan)}
        </div>
      </div>

      <div className="relative h-2 w-full flex-1 cursor-pointer overflow-hidden rounded-full bg-ink/5 dark:bg-white/10"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          setTime(x * makespan);
        }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-brand transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}
