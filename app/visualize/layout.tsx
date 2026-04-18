import type { ReactNode } from "react";
import { LinkTabs } from "@/components/ui/Tabs";
import { algorithmList, algorithmMeta } from "@/lib/scheduler/registry";

export default function VisualizeLayout({ children }: { children: ReactNode }) {
  const items = algorithmList.map((k) => ({
    href: `/visualize/${k}`,
    label: algorithmMeta[k].short,
    sub: algorithmMeta[k].name,
  }));

  return (
    <div className="flex flex-col gap-4">
      <LinkTabs items={items} />
      {children}
    </div>
  );
}
