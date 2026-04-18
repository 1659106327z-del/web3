import { notFound } from "next/navigation";
import { algorithmList, algorithmMeta } from "@/lib/scheduler/registry";
import type { AlgorithmKey } from "@/lib/scheduler/types";
import { VisualizeWorkspace } from "@/components/scheduler/VisualizeWorkspace";

export function generateStaticParams() {
  return algorithmList.map((algo) => ({ algo }));
}

export default function VisualizeAlgoPage({
  params,
}: {
  params: { algo: string };
}) {
  if (!algorithmList.includes(params.algo as AlgorithmKey)) notFound();
  const key = params.algo as AlgorithmKey;
  return <VisualizeWorkspace algorithm={key} meta={algorithmMeta[key]} />;
}
