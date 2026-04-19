"use client";

import { useEffect } from "react";
import { ProcessInputPanel } from "./ProcessInputPanel";
import { MfqDesignerPanel } from "./MfqDesignerPanel";
import { MfqStage } from "./MfqStage";
import { MfqAdvancedStats } from "./MfqAdvancedStats";
import { PlaybackControls } from "./PlaybackControls";
import { GanttChart } from "./GanttChart";
import { PresetPanel } from "./PresetPanel";
import { Card } from "@/components/ui/Card";
import { useSimulation } from "@/store/simulationStore";

export function MfqDesignerWorkspace() {
  const algorithm = useSimulation((s) => s.algorithm);
  const setAlgorithm = useSimulation((s) => s.setAlgorithm);
  const config = useSimulation((s) => s.config);
  const setConfig = useSimulation((s) => s.setConfig);
  const processes = useSimulation((s) => s.processes);
  const segments = useSimulation((s) => s.segments);
  const makespan = useSimulation((s) => s.makespan);
  const currentTime = useSimulation((s) => s.currentTime);

  // 进入设计器自动切到 MFQ + 默认 quanta
  useEffect(() => {
    if (algorithm !== "mfq") setAlgorithm("mfq");
  }, [algorithm, setAlgorithm]);

  useEffect(() => {
    if (!config.mfqQuanta || !config.mfqQuanta.length) {
      setConfig({ mfqQuanta: [2, 4, 8] });
    }
  }, [config.mfqQuanta, setConfig]);

  const quanta = config.mfqQuanta && config.mfqQuanta.length ? config.mfqQuanta : [2, 4, 8];

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Card>
          <MfqDesignerPanel />
        </Card>
        <Card className="min-h-[280px]">
          <ProcessInputPanel />
        </Card>
        <Card>
          <PresetPanel />
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <div className="mb-2">
            <div className="text-sm font-semibold">多级队列调度舞台</div>
            <div className="text-xs text-ink-soft">
              {quanta.length} 级队列：{quanta.map((q, i) => `Q${i}=${q}`).join(" · ")}
            </div>
          </div>
          <MfqStage quanta={quanta} />
        </Card>

        <PlaybackControls />

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">甘特图</div>
              <div className="text-xs text-ink-soft">
                色块底色按进程区分，时间轴同步播放游标
              </div>
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
          <div className="mb-3">
            <div className="text-sm font-semibold">设计性能评估</div>
            <div className="text-xs text-ink-soft">
              与默认基线 [2, 4, 8] 同组数据对比，绿色↓表示更优
            </div>
          </div>
          <MfqAdvancedStats quanta={quanta} />
        </Card>
      </div>
    </div>
  );
}
