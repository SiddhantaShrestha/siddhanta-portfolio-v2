import Link from "next/link";
import { cn } from "@/lib/cn";

type TextLinkProps = {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
  size?: "md" | "lg";
};

export function TextLink({
  href,
  children,
  external = false,
  className,
  size = "md",
}: TextLinkProps) {
  const classes = cn(
    size === "lg" ? "text-base" : "text-sm",
    "inline-flex items-center gap-1.5 text-foreground underline decoration-line underline-offset-4 transition-colors hover:decoration-accent",
    className,
  );

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
      </a>
    );
  }

  if (href.startsWith("#") || href.startsWith("/#")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
