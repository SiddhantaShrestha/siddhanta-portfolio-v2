import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { TechList } from "@/components/ui/tech-list";
import type { ProjectLink } from "@/content/projects";

type CsLinksStackProps = {
  stack: string[];
  links: ProjectLink[];
};

export function CsLinksStack({ stack, links }: CsLinksStackProps) {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-14">
      <div>
        <h3 className="font-mono text-[0.68rem] tracking-[0.2em] text-muted uppercase">
          Technology
        </h3>
        <div className="mt-4">
          <TechList items={stack} />
        </div>
      </div>
      <div>
        <h3 className="font-mono text-[0.68rem] tracking-[0.2em] text-muted uppercase">
          Links
        </h3>
        <ul className="mt-4 flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <ButtonLink
                href={link.href}
                external={link.external}
                variant="secondary"
              >
                {link.label}
                <ArrowUpRight size={14} aria-hidden />
              </ButtonLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
