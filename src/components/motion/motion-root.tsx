"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement: content is visible by default.
 * Motion only runs when the user prefers motion and JS is available.
 */
export function MotionRoot() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (media.matches) {
      return;
    }

    document.documentElement.classList.add("motion");

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    const cleanups: Array<() => void> = [];

    async function setup() {
      const { default: gsap } = await import("gsap");
      if (cancelled) return;

      const revealNodes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-reveal]"),
      );

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              overwrite: "auto",
              onComplete: () => {
                el.classList.add("is-visible");
                gsap.set(el, { clearProps: "transform" });
              },
            });
            observer?.unobserve(el);
          }
        },
        {
          rootMargin: "0px 0px -8% 0px",
          threshold: 0.12,
        },
      );

      for (const node of revealNodes) {
        observer.observe(node);
      }

      cleanups.push(() => {
        observer?.disconnect();
        gsap.killTweensOf(revealNodes);
      });
    }

    void setup();

    function onPreferenceChange() {
      if (media.matches) {
        document.documentElement.classList.remove("motion");
        for (const cleanup of cleanups) cleanup();
        document
          .querySelectorAll<HTMLElement>("[data-reveal]")
          .forEach((node) => {
            node.classList.add("is-visible");
            node.style.opacity = "1";
            node.style.transform = "none";
          });
      }
    }

    media.addEventListener("change", onPreferenceChange);

    return () => {
      cancelled = true;
      document.documentElement.classList.remove("motion");
      media.removeEventListener("change", onPreferenceChange);
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
