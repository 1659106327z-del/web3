"use client";

import { useState } from "react";
import { GitCompareArrows, Grid3x3 } from "lucide-react";
import { ComparisonWorkspace } from "./ComparisonWorkspace";
import { MatrixWorkspace } from "./MatrixWorkspace";
import { cn } from "@/lib/utils";

type Mode = "pair" | "matrix";

export function ComparisonPage() {
  const [mode, setMode] = useState<Mode>("pair");

  return (
    <div className="flex flex-col gap-4">
      <nav className="glass-subtle flex w-fit gap-1 rounded-2xl p-1">
        <ModeTab
          active={mode === "pair"}
          onClick={() => setMode("pair")}
          icon={GitCompareArrows}
          label="双算法对比"
          sub="并排甘特 + 指标条"
        />
        <ModeTab
          active={mode === "matrix"}
          onClick={() => setMode("matrix")}
          icon={Grid3x3}
          label="全算法矩阵"
          sub="6 算法 × 5 维雷达"
        />
      </nav>

      {mode === "pair" ? <ComparisonWorkspace /> : <MatrixWorkspace />}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-brand text-white shadow-soft"
          : "text-ink-soft hover:bg-ink/5 dark:hover:bg-white/5"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <div className="text-left">
        <div className="leading-tight">{label}</div>
        <div
          className={cn(
            "text-[10px] font-normal",
            active ? "text-white/85" : "text-ink-faint"
          )}
        >
          {sub}
        </div>
      </div>
    </button>
  );
}
