import { ArrowUpRight } from "lucide-react";
import { TextLink } from "@/components/ui/text-link";
import type {
  CaseStudyEvaluation,
  CaseStudyEvaluationSeries,
} from "@/content/projects";
import { cn } from "@/lib/cn";

type CsEvaluationProps = {
  evaluation: CaseStudyEvaluation;
};

function percent(hits: number, total: number): string {
  return `${((hits / total) * 100).toFixed(1)}%`;
}

type BarProps = {
  hits: number;
  total: number;
  tone: "accent" | "violet" | "muted";
};

/** Decorative bar. The numbers are always printed as text next to it. */
function Bar({ hits, total, tone }: BarProps) {
  return (
    <div aria-hidden className="h-2.5 w-full bg-line-strong">
      <div
        className={cn(
          "h-full",
          tone === "accent" && "bg-accent",
          tone === "violet" && "bg-violet",
          tone === "muted" && "bg-foreground/50",
        )}
        style={{ width: `${(hits / total) * 100}%` }}
      />
    </div>
  );
}

/** One square per question: filled squares are hits. Decorative only. */
function QuestionStrip({ hits, total }: { hits: number; total: number }) {
  return (
    <div aria-hidden className="mt-6 flex max-w-md flex-wrap gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-3 border",
            i < hits
              ? "border-accent bg-accent"
              : "border-line-strong bg-transparent",
          )}
        />
      ))}
    </div>
  );
}

function PassageSeries({
  series,
  total,
  tone,
}: {
  series: CaseStudyEvaluationSeries;
  total: number;
  tone: BarProps["tone"];
}) {
  return (
    <div>
      <h3 className="font-mono text-[0.8125rem] tracking-[0.14em] text-foreground uppercase">
        {series.label}
      </h3>
      <ul className="mt-4 space-y-4">
        {series.points.map((point) => (
          <li key={point.passageChars}>
            <div className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
              <span className="text-muted">
                {point.passageChars}-character passages
              </span>
              <span className="text-base font-medium text-foreground tabular-nums">
                {point.hit5}/{total}
                <span className="font-normal text-muted">
                  {" "}
                  · {percent(point.hit5, total)}
                </span>
              </span>
            </div>
            <div className="mt-2">
              <Bar hits={point.hit5} total={total} tone={tone} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Retrieval evaluation panel. Every figure is printed as text, so the bars
 * are a visual aid only. The definition and sample size always come first, so
 * the result cannot be read as a general accuracy score.
 */
export function CsEvaluation({ evaluation }: CsEvaluationProps) {
  const total = evaluation.sampleSize;
  const { headline } = evaluation;

  return (
    <div className="space-y-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <p className="font-mono text-[0.75rem] tracking-[0.2em] text-violet uppercase">
            {evaluation.title}
          </p>
          <p className="mt-5 text-foreground">
            <span
              aria-hidden
              className="font-display text-7xl leading-none tracking-tight sm:text-8xl"
            >
              {headline.hits}
              <span className="text-muted">/{total}</span>
            </span>
            <span className="sr-only">
              {evaluation.metricLabel}: {headline.hits} of {total} questions
            </span>
          </p>
          <p className="mt-4 font-mono text-[0.8125rem] tracking-[0.14em] text-accent uppercase">
            {evaluation.metricLabel} · {percent(headline.hits, total)} ·{" "}
            {headline.label}
          </p>
          {total <= 60 ? (
            <QuestionStrip hits={headline.hits} total={total} />
          ) : null}
          <p className="mt-6 max-w-md text-[1.0625rem] leading-8 text-foreground/90">
            {headline.context}
          </p>
        </div>

        <div className="self-end">
          <h3 className="text-lg font-medium text-foreground">
            What {evaluation.metricLabel} measures
          </h3>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted">
            {evaluation.definition}
          </p>
          <dl className="mt-6 grid grid-cols-2">
            {evaluation.config.map((item) => (
              <div
                key={item.label}
                className="border-t border-line py-3 pr-4 even:pl-4"
              >
                <dt className="font-mono text-[0.75rem] tracking-[0.16em] text-muted uppercase">
                  {item.label}
                </dt>
                <dd className="mt-1 text-[0.9375rem] text-foreground">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-6 text-muted">
            {evaluation.sampleNote}
          </p>
        </div>
      </div>

      <figure>
        <figcaption className="max-w-2xl text-lg font-medium text-foreground">
          {evaluation.methodsCaption}
        </figcaption>
        <ul className="mt-6">
          {evaluation.methods.map((method) => (
            <li
              key={method.label}
              className={cn(
                "grid gap-4 border-t border-line py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)] lg:items-center lg:gap-10",
                method.shipped
                  ? "lg:-mx-4 lg:border-t-accent/40 lg:bg-accent/[0.05] lg:px-4"
                  : null,
              )}
            >
              <div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[1.0625rem] font-medium text-foreground">
                  {method.label}
                  {method.shipped ? (
                    <span className="border border-accent/50 px-1.5 py-px font-mono text-[0.75rem] tracking-[0.14em] text-accent uppercase">
                      In the app
                    </span>
                  ) : null}
                </p>
                {method.detail ? (
                  <p className="mt-1 text-[0.9375rem] leading-6 text-muted">
                    {method.detail}
                  </p>
                ) : null}
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
                  <span className="font-mono text-[0.75rem] tracking-[0.16em] text-muted uppercase">
                    {evaluation.metricLabel}
                  </span>
                  <span className="text-lg font-medium text-foreground tabular-nums">
                    {method.hit5}/{total}
                    <span className="text-[0.9375rem] font-normal text-muted">
                      {" "}
                      · {percent(method.hit5, total)}
                    </span>
                  </span>
                </div>
                <div className="mt-2">
                  <Bar
                    hits={method.hit5}
                    total={total}
                    tone={method.shipped ? "accent" : "muted"}
                  />
                </div>
              </div>
              <p className="text-[0.9375rem] leading-6 text-muted tabular-nums">
                Hit@1 {method.hit1}/{total} · {percent(method.hit1, total)}
                <br />
                MRR {method.mrr.toFixed(3)}
              </p>
            </li>
          ))}
        </ul>
      </figure>

      {evaluation.passageLength ? (
        <figure>
          <figcaption className="max-w-2xl text-lg font-medium text-foreground">
            {evaluation.passageLength.caption}
          </figcaption>
          <div className="mt-6 grid gap-10 border-t border-line pt-8 md:grid-cols-2 md:gap-14">
            {evaluation.passageLength.series.map((series, index) => (
              <PassageSeries
                key={series.label}
                series={series}
                total={total}
                tone={index === 0 ? "accent" : "violet"}
              />
            ))}
          </div>
        </figure>
      ) : null}

      <div className="grid gap-8 border-t border-line pt-8 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-14">
        <h3 className="font-mono text-[0.75rem] tracking-[0.2em] text-violet uppercase">
          How to read this
        </h3>
        <div>
          <ul className="space-y-3 text-base leading-7 text-muted">
            {evaluation.caveats.map((caveat) => (
              <li key={caveat} className="max-w-2xl border-l border-line pl-4">
                {caveat}
              </li>
            ))}
            {evaluation.checks?.map((check) => (
              <li key={check} className="max-w-2xl border-l border-line pl-4">
                {check}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <TextLink
              href={evaluation.source.href}
              external={evaluation.source.external}
              size="lg"
            >
              {evaluation.source.label}
              <ArrowUpRight size={14} aria-hidden />
            </TextLink>
          </div>
        </div>
      </div>
    </div>
  );
}
