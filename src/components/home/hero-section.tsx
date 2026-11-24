import { MapPin } from "lucide-react";
import { WorkstationStage } from "@/components/home/workstation-stage";
import { ButtonLink } from "@/components/ui/button-link";
import { profile } from "@/content/site";

export function HeroSection() {
  return (
    <section
      id="home"
      aria-labelledby="home-heading"
      className="relative overflow-hidden border-b border-line"
    >
      <div className="section-shell grid gap-6 pt-6 pb-10 sm:gap-8 sm:pt-10 sm:pb-14 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-end lg:gap-8 lg:pt-14 lg:pb-20">
        <div className="order-1 max-w-xl lg:pb-4" data-reveal>
          <p className="font-mono text-[0.65rem] tracking-[0.18em] text-accent uppercase sm:text-[0.7rem] sm:tracking-[0.2em]">
            {profile.roleLine}
          </p>
          <h1
            id="home-heading"
            className="mt-3 text-[clamp(2.35rem,9vw,5.5rem)] leading-[0.95] tracking-tight text-foreground sm:mt-5"
          >
            <span className="block font-medium">{profile.firstName}</span>
            <span className="font-display font-normal text-foreground/95 italic">
              {profile.lastName}
            </span>
          </h1>
          <div className="mt-5 hidden lg:block">
            <HeroCopy />
          </div>
        </div>

        <div className="order-2" data-reveal>
          <WorkstationStage />
        </div>

        <div className="order-3 max-w-xl lg:hidden" data-reveal>
          <HeroCopy />
        </div>
      </div>
    </section>
  );
}

function HeroCopy() {
  return (
    <>
      <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">
        {profile.intro}
      </p>
      <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted">
        <MapPin size={15} aria-hidden />
        {profile.location}
      </p>
      <div className="mt-7 flex flex-wrap gap-3 sm:mt-8">
        <ButtonLink href="/#projects">View Projects</ButtonLink>
        <ButtonLink href="/#lab" variant="secondary">
          Explore My Work
        </ButtonLink>
      </div>
    </>
  );
}
