import { SectionHeading } from "@/components/ui/section-heading";
import { aboutCopy, experience } from "@/content/about";

export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-24 border-t border-line"
    >
      <div className="section-shell grid gap-12 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-24">
        <div>
          <SectionHeading
            index="04"
            title={aboutCopy.heading}
            titleId="about-heading"
          />
          <p
            className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
            data-reveal
          >
            {aboutCopy.body}
          </p>
        </div>

        <ol className="space-y-8" data-reveal>
          {experience.map((role) => (
            <li
              key={`${role.title}-${role.period}`}
              className="border-t border-line pt-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg text-foreground">{role.title}</h3>
                <p className="font-mono text-xs tracking-wide text-muted">
                  {role.period}
                </p>
              </div>
              <p className="mt-1 text-sm text-accent">
                {role.organization} · {role.location}
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
                {role.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
