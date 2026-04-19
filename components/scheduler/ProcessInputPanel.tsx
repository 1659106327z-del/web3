"use client";

import { Plus, Shuffle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useSimulation, MAX_PROCESSES } from "@/store/simulationStore";
import { Button } from "@/components/ui/Button";
import { NumberField } from "@/components/ui/NumberField";
import { useToast } from "@/components/ui/Toast";
import { CasePickerButton } from "./CasePicker";
import { cn } from "@/lib/utils";

const procColor = ["", "bg-proc-1", "bg-proc-2", "bg-proc-3", "bg-proc-4", "bg-proc-5", "bg-proc-6"];

export function ProcessInputPanel({ showPriority }: { showPriority?: boolean }) {
  const processes = useSimulation((s) => s.processes);
  const addProcess = useSimulation((s) => s.addProcess);
  const removeProcess = useSimulation((s) => s.removeProcess);
  const randomize = useSimulation((s) => s.randomize);
  const clear = useSimulation((s) => s.clearProcesses);
  const { push } = useToast();

  const [arrival, setArrival] = useState(0);
  const [burst, setBurst] = useState(4);
  const [priority, setPriority] = useState(3);

  const atLimit = processes.length >= MAX_PROCESSES;

  const handleAdd = () => {
    const r = addProcess({ arrival, burst, priority });
    if (!r.ok) push(r.reason ?? "已达上限", "warn");
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">进程表</div>
          <div className="text-xs text-ink-soft">
            已添加 {processes.length} / {MAX_PROCESSES}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CasePickerButton />
          <Button
            size="sm"
            variant="subtle"
            onClick={() => randomize()}
            title="随机生成 3-6 个进程"
          >
            <Shuffle className="h-3.5 w-3.5" />
            随机
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clear()}
            disabled={!processes.length}
          >
            <Trash2 className="h-3.5 w-3.5" />
            清空
          </Button>
        </div>
      </div>

      <div className="glass-subtle rounded-xl p-3">
        <div className="mb-2 text-xs text-ink-soft">新增一条</div>
        <div
          className={cn(
            "grid gap-2",
            showPriority ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          <NumberField label="到达时间" value={arrival} min={0} max={30} onChange={setArrival} />
          <NumberField label="服务时间" value={burst} min={1} max={30} onChange={setBurst} />
          {showPriority && (
            <NumberField
              label="优先级（数字越小越高）"
              value={priority}
              min={1}
              max={9}
              onChange={setPriority}
            />
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          className="mt-3 w-full"
          onClick={handleAdd}
          disabled={atLimit}
          title={atLimit ? "已达上限 6" : "添加进程"}
        >
          <Plus className="h-3.5 w-3.5" />
          添加进程
        </Button>
        {atLimit && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            已达进程数量上限（{MAX_PROCESSES}）
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {processes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/15 p-6 text-center text-xs text-ink-soft dark:border-white/15">
            暂无进程。点击上方“随机生成”快速构造测试数据。
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-ink-soft">
              <tr className="text-left">
                <th className="px-2 py-1.5 font-medium">进程</th>
                <th className="px-2 py-1.5 font-medium">到达</th>
                <th className="px-2 py-1.5 font-medium">服务</th>
                {showPriority && <th className="px-2 py-1.5 font-medium">优先级</th>}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-ink/10 font-mono text-ink dark:border-white/10 dark:text-ink-inverse"
                >
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          procColor[p.colorIndex ?? 1]
                        )}
                      />
                      {p.name}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">{p.arrival}</td>
                  <td className="px-2 py-1.5">{p.burst}</td>
                  {showPriority && <td className="px-2 py-1.5">{p.priority ?? "-"}</td>}
                  <td className="px-1 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeProcess(p.id)}
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-ink-soft hover:bg-ink/5 hover:text-red-500 dark:hover:bg-white/10"
                      aria-label={`删除 ${p.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
