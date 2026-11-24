import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  external?: boolean;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  external = false,
}: ButtonLinkProps) {
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm tracking-wide transition-colors",
    variant === "primary" &&
      "border border-accent/40 bg-accent/10 text-foreground hover:border-accent hover:bg-accent/15",
    variant === "secondary" &&
      "border border-line bg-surface text-foreground hover:border-line-strong",
    variant === "ghost" &&
      "text-foreground underline decoration-line underline-offset-4 hover:decoration-accent",
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
