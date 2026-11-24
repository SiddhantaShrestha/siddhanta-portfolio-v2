export const navItems = [
  { id: "home", label: "Home", href: "/#home" },
  { id: "projects", label: "Projects", href: "/#projects" },
  { id: "lab", label: "AI & Automation", href: "/#lab" },
  { id: "about", label: "About", href: "/#about" },
  { id: "contact", label: "Contact", href: "/#contact" },
] as const;

export type NavItemId = (typeof navItems)[number]["id"];

/** Section ids observed for active-nav highlighting (skills lives under About). */
export const observedSectionIds = [
  "home",
  "projects",
  "lab",
  "skills",
  "about",
  "contact",
] as const;
