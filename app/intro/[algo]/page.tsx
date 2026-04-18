import { notFound } from "next/navigation";
import { BookOpen, CheckCircle2, Clock, Cpu, History, Lightbulb, XCircle } from "lucide-react";
import { algorithmList } from "@/lib/scheduler/registry";
import { introArticles } from "@/lib/scheduler/intro";
import type { AlgorithmKey } from "@/lib/scheduler/types";

export function generateStaticParams() {
  return algorithmList.map((algo) => ({ algo }));
}

export default function IntroAlgoPage({ params }: { params: { algo: string } }) {
  if (!algorithmList.includes(params.algo as AlgorithmKey)) notFound();
  const article = introArticles[params.algo as AlgorithmKey];

  return (
    <article className="flex flex-col gap-5">
      <header className="rounded-2xl border border-line bg-surface p-6 shadow-card dark:border-line-dark dark:bg-surface-dark">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
          <BookOpen className="h-3.5 w-3.5" />
          算法专题
        </div>
        <h1 className="text-2xl font-semibold leading-tight">{article.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{article.lead}</p>
      </header>

      <Section icon={History} title="发展脉络">
        <p className="text-sm leading-7 text-ink-soft">{article.history}</p>
      </Section>

      <Section icon={Lightbulb} title="实现原理">
        <p className="text-sm leading-7 text-ink-soft">{article.principle}</p>
      </Section>

      <Section icon={Cpu} title="伪代码">
        <pre className="overflow-x-auto rounded-xl bg-surface-muted p-4 font-mono text-xs leading-6 text-ink dark:bg-surface-dark-muted dark:text-ink-inverse">
{article.pseudocode}
        </pre>
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={CheckCircle2} title="优势" accent="emerald">
          <ul className="space-y-1.5 text-sm leading-7 text-ink-soft">
            {article.pros.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {p}
              </li>
            ))}
          </ul>
        </Section>
        <Section icon={XCircle} title="局限" accent="amber">
          <ul className="space-y-1.5 text-sm leading-7 text-ink-soft">
            {article.cons.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {p}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section icon={Clock} title="适用场景与复杂度">
        <div className="space-y-1 text-sm leading-7 text-ink-soft">
          <div>
            <span className="font-medium text-ink dark:text-ink-inverse">典型应用：</span>
            {article.useCases.join("、")}
          </div>
          <div>
            <span className="font-medium text-ink dark:text-ink-inverse">时间复杂度：</span>
            <span className="font-mono">{article.complexity}</span>
          </div>
        </div>
      </Section>
    </article>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent?: "emerald" | "amber";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card dark:border-line-dark dark:bg-surface-dark">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
