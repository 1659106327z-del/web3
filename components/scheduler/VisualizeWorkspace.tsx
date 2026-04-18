"use client";

import { useEffect } from "react";
import { ProcessInputPanel } from "./ProcessInputPanel";
import { AlgorithmConfig } from "./AlgorithmConfig";
import { PlaybackControls } from "./PlaybackControls";
import { SchedulerStage } from "./SchedulerStage";
import { GanttChart } from "./GanttChart";
import { StatsTable } from "./StatsTable";
import { Card } from "@/components/ui/Card";
import { useSimulation } from "@/store/simulationStore";
import type { AlgorithmKey } from "@/lib/scheduler/types";
import type { AlgorithmMeta } from "@/lib/scheduler/registry";

export function VisualizeWorkspace({
  algorithm,
  meta,
}: {
  algorithm: AlgorithmKey;
  meta: AlgorithmMeta;
}) {
  const setAlgorithm = useSimulation((s) => s.setAlgorithm);
  const current = useSimulation((s) => s.algorithm);
  const processes = useSimulation((s) => s.processes);
  const segments = useSimulation((s) => s.segments);
  const makespan = useSimulation((s) => s.makespan);
  const currentTime = useSimulation((s) => s.currentTime);

  useEffect(() => {
    if (current !== algorithm) setAlgorithm(algorithm);
  }, [algorithm, current, setAlgorithm]);

  const needsPriority = algorithm === "psa";

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Card>
          <div className="mb-2">
            <div className="text-sm font-semibold">{meta.name}</div>
            <div className="text-xs text-ink-soft">{meta.summary}</div>
          </div>
          <AlgorithmConfig />
        </Card>
        <Card className="min-h-[280px]">
          <ProcessInputPanel showPriority={needsPriority} />
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">调度舞台</div>
              <div className="text-xs text-ink-soft">
                进程在就绪队列 → CPU → 阻塞队列 → 完成队列之间流转
              </div>
            </div>
          </div>
          <SchedulerStage />
        </Card>

        <PlaybackControls />

        <Card>
          <div className="mb-2">
            <div className="text-sm font-semibold">甘特图</div>
            <div className="text-xs text-ink-soft">
              横轴为时间，色块标识每段 CPU 占用，底部 CPU 行汇总实际执行顺序
            </div>
          </div>
          <GanttChart
            processes={processes}
            segments={segments}
            makespan={makespan}
            currentTime={currentTime}
          />
        </Card>

        <Card>
          <div className="mb-2">
            <div className="text-sm font-semibold">性能统计</div>
            <div className="text-xs text-ink-soft">
              自动计算每个进程的完成时间、周转时间、带权周转时间与系统平均值
            </div>
          </div>
          <StatsTable />
        </Card>
      </div>
    </div>
  );
}
