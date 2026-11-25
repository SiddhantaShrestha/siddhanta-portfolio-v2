import type { CaseStudyDecision } from "@/content/projects";

type CsDecisionsProps = {
  decisions: CaseStudyDecision[];
};

/** Engineering decisions and the problems that led to them. */
export function CsDecisions({ decisions }: CsDecisionsProps) {
  return (
    <ol className="grid gap-x-14 md:grid-cols-2">
      {decisions.map((decision, index) => (
        <li key={decision.title} className="border-t border-line py-8">
          <p
            aria-hidden
            className="font-mono text-[0.75rem] tracking-[0.2em] text-violet uppercase"
          >
            Decision {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-3 text-xl leading-snug font-medium tracking-tight text-foreground">
            {decision.title}
          </h3>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted">
            {decision.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
