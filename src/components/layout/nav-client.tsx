"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { navItems, observedSectionIds } from "@/content/navigation";
import { cn } from "@/lib/cn";

function focusSectionHeading(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;

  const section = document.getElementById(id);
  if (!section) return;

  const heading = section.querySelector<HTMLElement>("h1, h2");
  if (!heading) return;

  if (!heading.hasAttribute("tabindex")) {
    heading.tabIndex = -1;
  }
  heading.focus({ preventScroll: true });
}

export function NavClient() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.location.pathname !== "/") {
      return;
    }

    const sections = observedSectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          );

        const top = visible[0];
        if (!top?.target.id) return;

        const next = top.target.id === "skills" ? "about" : top.target.id;
        setActiveId(next);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.15, 0.35, 0.6],
      },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onHashClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      const hash = href.slice(hashIndex);
      if (hash.length < 2) return;

      const path = href.slice(0, hashIndex);
      const isSamePage =
        path === "" ||
        path === "/" ||
        path === window.location.pathname ||
        href.startsWith("/#");

      if (!isSamePage) return;

      window.setTimeout(() => focusSectionHeading(hash), 350);
    }

    document.addEventListener("click", onHashClick);
    return () => document.removeEventListener("click", onHashClick);
  }, []);

  return (
    <div
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter]",
        scrolled
          ? "border-line bg-background/85 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="section-shell flex items-center justify-between gap-4 py-3.5">
        <Link
          href="/#home"
          className="inline-flex items-center gap-2.5 text-sm font-medium tracking-wide text-foreground transition-colors hover:text-accent"
        >
          <SiteLogo className="size-8 rounded-[0.45rem] shadow-[0_0_0_1px_var(--color-line)]" />
          <span>Siddhanta Shrestha</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                activeId !== null &&
                (item.id === activeId ||
                  (item.id === "about" && activeId === "skills"));

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex min-h-11 items-center px-3 text-sm transition-colors",
                      isActive
                        ? "text-accent"
                        : "text-muted hover:text-foreground",
                    )}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <MobileMenu activeId={activeId} />
      </div>
    </div>
  );
}
