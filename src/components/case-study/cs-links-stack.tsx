import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { TechList } from "@/components/ui/tech-list";
import type { ProjectLink } from "@/content/projects";

type CsLinksStackProps = {
  stack: string[];
  links: ProjectLink[];
};

/** The first link is the main call to action. The rest are secondary. */
export function CsLinksStack({ stack, links }: CsLinksStackProps) {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-14">
      <div>
        <h3 className="font-mono text-[0.8125rem] tracking-[0.16em] text-foreground uppercase">
          Technology
        </h3>
        <div className="mt-5">
          <TechList items={stack} size="lg" />
        </div>
      </div>
      <div>
        <h3 className="font-mono text-[0.8125rem] tracking-[0.16em] text-foreground uppercase">
          Links
        </h3>
        <ul className="mt-5 flex flex-wrap gap-3">
          {links.map((link, index) => (
            <li key={link.href}>
              <ButtonLink
                href={link.href}
                external={link.external}
                variant={index === 0 ? "primary" : "secondary"}
                size="lg"
              >
                {link.label}
                <ArrowUpRight size={16} aria-hidden />
              </ButtonLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
