"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
};

export function NumberField({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  className,
}: Props) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <label className={cn("flex flex-col gap-1 text-xs text-ink-soft", className)}>
      {label && <span>{label}</span>}
      <div className="flex h-9 items-stretch overflow-hidden rounded-xl border border-line bg-surface dark:border-line-dark dark:bg-surface-dark">
        <button
          type="button"
          onClick={() => set(value - step)}
          className="flex w-8 cursor-pointer items-center justify-center text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
          aria-label="减少"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) set(v);
          }}
          className="h-full w-full min-w-0 border-x border-line bg-transparent px-2 text-center font-mono text-sm text-ink outline-none dark:border-line-dark dark:text-ink-inverse"
        />
        <button
          type="button"
          onClick={() => set(value + step)}
          className="flex w-8 cursor-pointer items-center justify-center text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
          aria-label="增加"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </label>
  );
}
