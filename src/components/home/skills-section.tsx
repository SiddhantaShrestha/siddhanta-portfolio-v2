import { SectionHeading } from "@/components/ui/section-heading";
import { skillGroups } from "@/content/skills";

export function SkillsSection() {
  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="scroll-mt-24 border-t border-line"
    >
      <div className="section-shell py-16 sm:py-20">
        <SectionHeading
          index="03"
          title="Technical expertise"
          titleId="skills-heading"
          description="Technologies verified on the current portfolio, grouped by how they are used. A DevOps group will be added when those tools are confirmed."
        />

        <div className="mt-12 grid gap-10 md:grid-cols-2" data-reveal>
          {skillGroups.map((group) => (
            <div key={group.id} className="border-t border-line pt-6">
              <h3 className="font-mono text-[0.7rem] tracking-[0.18em] text-accent uppercase">
                {group.title}
              </h3>
              <dl className="mt-5 space-y-4">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4"
                  >
                    <dt className="text-sm text-foreground">{item.name}</dt>
                    <dd className="text-sm text-muted">
                      Used in {item.usedIn.join(", ")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
