import { AboutSection } from "@/components/home/about-section";
import { ContactSection } from "@/components/home/contact-section";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { HeroSection } from "@/components/home/hero-section";
import { LabSection } from "@/components/home/lab-section";
import { SkillsSection } from "@/components/home/skills-section";
import { MotionRoot } from "@/components/motion/motion-root";

export function HomePage() {
  return (
    <>
      <MotionRoot />
      <HeroSection />
      <FeaturedProjects />
      <LabSection />
      <SkillsSection />
      <AboutSection />
      <ContactSection />
    </>
  );
}
