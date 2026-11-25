import { ArrowUpRight } from "lucide-react";
import { LabShell } from "@/components/lab/lab-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { labIntro } from "@/content/lab";
import { labWorkflows } from "@/content/lab-workflows";

/**
 * Homepage AI & Automation Lab.
 * Server-rendered overviews keep stage purposes available without JavaScript.
 * The interactive shell adds scenario controls and input/output inspection.
 */
export function LabSection() {
  return (
    <section
      id="lab"
      aria-labelledby="lab-heading"
      className="scroll-mt-24 border-t border-line"
    >
      <div className="section-shell py-16 lg:py-24">
        <SectionHeading
          index="02"
          title="AI and Automation Lab"
          titleId="lab-heading"
          description={labIntro}
        />

        <div className="mt-12 space-y-10" data-reveal>
          <p className="font-mono text-[0.65rem] tracking-[0.18em] text-accent uppercase">
            Workflow overview
          </p>

          {labWorkflows.map((workflow) => (
            <article key={workflow.id} className="space-y-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-xl text-foreground sm:text-2xl">
                  {workflow.title}
                </h3>
                <TextLink href={`/projects/${workflow.projectSlug}`}>
                  Case study
                  <ArrowUpRight size={14} aria-hidden />
                </TextLink>
              </div>

              <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
                {workflow.summary}
              </p>

              <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {workflow.stages.map((stage, index) => (
                  <li
                    key={stage.id}
                    className="border border-line bg-surface/30 p-4"
                  >
                    <p className="font-mono text-[0.65rem] tracking-[0.16em] text-accent uppercase">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {stage.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {stage.purpose}
                    </p>
                  </li>
                ))}
              </ol>

              {workflow.teamScopeNote ? (
                <p className="max-w-3xl border border-dashed border-line px-4 py-3 text-sm leading-relaxed text-muted">
                  {workflow.teamScopeNote}
                </p>
              ) : null}
            </article>
          ))}

          <LabShell workflows={labWorkflows} />
        </div>
      </div>
    </section>
  );
}
