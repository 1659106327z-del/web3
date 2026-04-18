"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, Cloud, Loader2, LogIn, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/components/layout/SessionProvider";
import { useSimulation } from "@/store/simulationStore";
import { algorithmMeta } from "@/lib/scheduler/registry";
import type { AlgoConfig, AlgorithmKey, Process } from "@/lib/scheduler/types";
import { cn } from "@/lib/utils";

interface PresetItem {
  id: string;
  name: string;
  algorithm: AlgorithmKey;
  processes: Process[];
  config: AlgoConfig;
  createdAt: string;
  updatedAt: string;
}

export function PresetPanel() {
  const { user, loading: sessionLoading } = useSession();
  const algorithm = useSimulation((s) => s.algorithm);
  const processes = useSimulation((s) => s.processes);
  const config = useSimulation((s) => s.config);
  const setAlgorithm = useSimulation((s) => s.setAlgorithm);
  const setProcesses = useSimulation((s) => s.setProcesses);
  const setConfig = useSimulation((s) => s.setConfig);
  const { push } = useToast();

  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/presets", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { presets: PresetItem[] };
        setPresets(data.presets);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      push("请先填写用例名称", "warn");
      return;
    }
    if (!processes.length) {
      push("进程列表为空", "warn");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          algorithm,
          processes,
          config,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        push(data.error ?? "保存失败", "error");
        return;
      }
      push("已保存用例");
      setName("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (p: PresetItem) => {
    setAlgorithm(p.algorithm);
    setProcesses(p.processes);
    setConfig(p.config);
    push(`已加载：${p.name}`);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/presets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPresets((l) => l.filter((p) => p.id !== id));
      push("已删除用例");
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> 正在检查登录状态…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Cloud className="h-4 w-4 text-brand" />
          我的用例
        </div>
        <div className="rounded-xl border border-dashed border-ink/15 p-3 text-xs leading-relaxed text-ink-soft dark:border-white/15">
          登录后可将当前进程列表与算法参数保存到账户，并在其他设备加载。
        </div>
        <Link
          href="/account"
          className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-brand-hover"
        >
          <LogIn className="h-4 w-4" /> 前往登录
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Cloud className="h-4 w-4 text-brand" />
          我的用例
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-ink-soft hover:bg-ink/5 dark:hover:bg-white/10"
          aria-label="刷新"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={name}
          maxLength={40}
          placeholder="用例名称（1-40 字）"
          onChange={(e) => setName(e.target.value)}
          className="h-9 rounded-xl border border-ink/10 bg-white/50 px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-ink-inverse"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
          保存当前用例
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        {presets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/15 p-3 text-center text-xs text-ink-soft dark:border-white/15">
            暂无保存的用例
          </div>
        ) : (
          presets.map((p) => (
            <div
              key={p.id}
              className={cn(
                "group flex items-center justify-between gap-2 rounded-xl border border-ink/10 bg-white/40 px-3 py-2 backdrop-blur-sm transition-colors hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              )}
            >
              <button
                type="button"
                onClick={() => applyPreset(p)}
                className="flex-1 cursor-pointer text-left"
              >
                <div className="truncate text-xs font-medium text-ink dark:text-ink-inverse">
                  {p.name}
                </div>
                <div className="truncate text-[11px] text-ink-soft">
                  {algorithmMeta[p.algorithm].short} · {p.processes.length} 进程 ·{" "}
                  {new Date(p.updatedAt).toLocaleString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-ink-soft opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                aria-label="删除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
