import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  titleId?: string;
  className?: string;
};

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  titleId,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", className)} data-reveal>
      {index ? (
        <p className="font-mono text-[0.7rem] tracking-[0.22em] text-violet uppercase">
          {index}
        </p>
      ) : null}
      {eyebrow ? (
        <p
          className={cn(
            "font-mono text-[0.7rem] tracking-[0.18em] text-accent uppercase",
            index ? "mt-3" : null,
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={titleId}
        className={cn(
          "text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]",
          index || eyebrow ? "mt-4" : null,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
