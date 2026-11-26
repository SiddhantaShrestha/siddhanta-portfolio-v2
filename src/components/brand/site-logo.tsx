import { cn } from "@/lib/cn";

type SiteLogoProps = {
  className?: string;
  /** Decorative when nested inside a labeled link. */
  decorative?: boolean;
};

/**
 * Cyan “S” monogram with orbit rings. Matches the site accent and dark navy.
 */
export function SiteLogo({ className, decorative = true }: SiteLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-8 shrink-0", className)}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Siddhanta Shrestha"}
    >
      <rect width="64" height="64" rx="14" fill="#05070d" />
      <ellipse
        cx="32"
        cy="32"
        rx="22"
        ry="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="text-accent"
        opacity="0.9"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="26"
        ry="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(-28 32 32)"
        className="text-accent"
        opacity="0.95"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent"
        d="M41 22.5c-1.2-4.2-5.2-7-9.8-7-5.6 0-10 3.2-10 7.6 0 3.8 2.6 5.8 9.2 7.4 6.6 1.6 10.2 4.2 10.2 8.8 0 5.2-4.8 8.7-11.2 8.7-5.2 0-9.4-2.6-10.8-7"
      />
    </svg>
  );
}
