import type { CaseStudyFact } from "@/content/projects";

type CsOverviewProps = {
  overview: string;
  glance?: CaseStudyFact[];
};

/** Overview paragraph with an optional at-a-glance fact list. */
export function CsOverview({ overview, glance }: CsOverviewProps) {
  const hasGlance = glance !== undefined && glance.length > 0;

  return (
    <div
      className={
        hasGlance
          ? "grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14"
          : undefined
      }
    >
      <p className="max-w-2xl text-lg leading-relaxed text-foreground/90 sm:text-xl sm:leading-relaxed">
        {overview}
      </p>
      {hasGlance ? (
        <dl className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-1">
          {glance.map((fact) => (
            <div
              key={fact.label}
              className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 border-t border-line py-3 text-sm"
            >
              <dt className="font-mono text-[0.65rem] tracking-[0.16em] text-muted uppercase">
                {fact.label}
              </dt>
              <dd className="text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
