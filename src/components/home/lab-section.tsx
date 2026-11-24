import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { labIntro, labPipelines } from "@/content/lab";

export function LabSection() {
  return (
    <section
      id="lab"
      aria-labelledby="lab-heading"
      className="scroll-mt-24 border-t border-line"
    >
      <div className="section-shell grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-24">
        <SectionHeading
          index="02"
          title="AI and Automation Lab"
          titleId="lab-heading"
          description={labIntro}
        />

        <div className="space-y-8" data-reveal>
          {labPipelines.map((pipeline) => (
            <article
              key={pipeline.id}
              className="border border-line bg-surface/40 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-xl text-foreground">{pipeline.title}</h3>
                <TextLink href={`/projects/${pipeline.projectSlug}`}>
                  Case study
                  <ArrowUpRight size={14} aria-hidden />
                </TextLink>
              </div>
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

          <div className="border border-dashed border-line-strong bg-navy/40 p-6">
            <p className="font-mono text-[0.65rem] tracking-[0.18em] text-violet uppercase">
              Reserved for Phase 5
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Interactive workflow demos and live experiments will land here.
              The layout already leaves room for them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
