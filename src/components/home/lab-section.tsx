import { ArrowUpRight } from "lucide-react";
import { LabShell } from "@/components/lab/lab-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { labIntro, labPipelines } from "@/content/lab";
import { getLabWorkflow, labWorkflows } from "@/content/lab-workflows";

/**
 * Homepage AI & Automation Lab.
 * Server-rendered overview keeps stage purposes available without JavaScript.
 * The interactive shell adds scenario controls and input/output inspection.
 */
export function LabSection() {
  const jobPost = getLabWorkflow("job-post");
  const upcoming = labPipelines.filter(
    (pipeline) => !labWorkflows.some((workflow) => workflow.id === pipeline.id),
  );

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

        {jobPost ? (
          <div className="mt-12 space-y-6" data-reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="font-mono text-[0.65rem] tracking-[0.18em] text-accent uppercase">
                  Workflow overview
                </p>
                <h3 className="mt-2 text-xl text-foreground sm:text-2xl">
                  {jobPost.title}
                </h3>
              </div>
              <TextLink href={`/projects/${jobPost.projectSlug}`}>
                Case study
                <ArrowUpRight size={14} aria-hidden />
              </TextLink>
            </div>

            <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
              {jobPost.summary}
            </p>

            <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {jobPost.stages.map((stage, index) => (
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

            {jobPost.teamScopeNote ? (
              <p className="max-w-3xl border border-dashed border-line px-4 py-3 text-sm leading-relaxed text-muted">
                {jobPost.teamScopeNote}
              </p>
            ) : null}

            <LabShell workflows={labWorkflows} />
          </div>
        ) : null}

        {upcoming.length > 0 ? (
          <div className="mt-12 space-y-6" data-reveal>
            <p className="font-mono text-[0.65rem] tracking-[0.18em] text-violet uppercase">
              More workflows
            </p>
            <div className="grid gap-6 lg:grid-cols-2">
              {upcoming.map((pipeline) => (
                <article
                  key={pipeline.id}
                  className="border border-line bg-surface/40 p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-xl text-foreground">
                      {pipeline.title}
                    </h3>
                    <TextLink href={`/projects/${pipeline.projectSlug}`}>
                      Case study
                      <ArrowUpRight size={14} aria-hidden />
                    </TextLink>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    Interactive demonstration arrives in a later lab update. The
                    verified stages are listed below.
                  </p>
                  <ol className="mt-6 space-y-3">
                    {pipeline.steps.map((step, index) => (
                      <li
                        key={step}
                        className="grid grid-cols-[auto_1fr] items-start gap-3 text-sm leading-relaxed text-muted"
                      >
                        <span className="font-mono text-[0.65rem] tracking-wide text-accent">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
