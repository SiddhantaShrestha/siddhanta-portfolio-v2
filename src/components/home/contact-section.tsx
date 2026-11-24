import { ArrowUpRight } from "lucide-react";
import { CopyEmailButton } from "@/components/ui/copy-email-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { profile } from "@/content/site";

export function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="scroll-mt-24 border-t border-line"
    >
      <div className="section-shell py-16 sm:py-24">
        <SectionHeading
          index="05"
          title="Get in touch"
          titleId="contact-heading"
          description="Open to full-stack development and applied AI opportunities."
        />

        <div className="mt-12 max-w-3xl" data-reveal>
          <a
            href={`mailto:${profile.email}`}
            className="block text-[clamp(1.5rem,4vw,2.75rem)] tracking-tight text-foreground underline decoration-line underline-offset-8 transition-colors hover:decoration-accent"
          >
            {profile.email}
          </a>

          <div className="mt-8 flex flex-wrap gap-3">
            <CopyEmailButton email={profile.email} />
            <a
              href={profile.phoneHref}
              className="inline-flex min-h-11 items-center border border-line bg-surface px-4 text-sm text-foreground hover:border-accent"
            >
              {profile.phoneDisplay}
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            <li>
              <a
                href={profile.social.linkedin}
                className="inline-flex items-center gap-1.5 text-sm text-foreground underline decoration-line underline-offset-4 hover:decoration-accent"
                target="_blank"
                rel="noreferrer noopener"
              >
                LinkedIn
                <ArrowUpRight size={14} aria-hidden />
              </a>
            </li>
            <li>
              <a
                href={profile.social.github}
                className="inline-flex items-center gap-1.5 text-sm text-foreground underline decoration-line underline-offset-4 hover:decoration-accent"
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub
                <ArrowUpRight size={14} aria-hidden />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
