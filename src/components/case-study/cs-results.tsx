import type { ProjectEvidence } from "@/content/projects";

type CsResultsProps = {
  evidence: ProjectEvidence | null;
  results: string[];
};

/**
 * Evidence and results for projects without a full evaluation panel.
 * Used when a project has only short verified outcomes.
 */
export function CsResults({ evidence, results }: CsResultsProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      {evidence ? (
        <div className="border border-line bg-surface-raised p-6 sm:p-8">
          <p className="font-mono text-[0.65rem] tracking-[0.18em] text-violet uppercase">
            Evidence
          </p>
          <h3 className="mt-4 text-lg text-foreground">{evidence.title}</h3>
          <p className="mt-3 text-[0.9375rem] leading-7 text-muted">
            {evidence.body}
          </p>
        </div>
      ) : null}
      {results.length > 0 ? (
        <ul className="space-y-3 text-[0.9375rem] leading-7 text-muted">
          {results.map((result) => (
            <li key={result} className="border-l border-line pl-4">
              {result}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
