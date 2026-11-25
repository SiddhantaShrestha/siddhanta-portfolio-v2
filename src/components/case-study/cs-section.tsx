import { cn } from "@/lib/cn";

type CsSectionProps = {
  id: string;
  index: string;
  label: string;
  title: string;
  /** Full-width content with the label above the title. */
  wide?: boolean;
  children: React.ReactNode;
};

/**
 * Shared section frame: a mono label column and a content column.
 * Every case study section uses it so spacing and hierarchy stay consistent.
 */
export function CsSection({
  id,
  index,
  label,
  title,
  wide = false,
  children,
}: CsSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="scroll-mt-24 border-t border-line py-14 sm:py-20"
    >
      <div
        className={cn(
          "grid gap-8",
          wide ? null : "lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-14",
        )}
      >
        <div className={cn(wide ? "max-w-3xl" : null)}>
          <p className="font-mono text-[0.68rem] tracking-[0.2em] text-violet uppercase">
            <span aria-hidden>{index} </span>
            {label}
          </p>
          {wide ? (
            <h2
              id={titleId}
              className="mt-4 text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
            >
              {title}
            </h2>
          ) : null}
        </div>
        <div className="min-w-0">
          {wide ? null : (
            <h2
              id={titleId}
              className="max-w-2xl text-balance text-2xl font-medium tracking-tight text-foreground sm:text-3xl"
            >
              {title}
            </h2>
          )}
          <div className={cn(wide ? null : "mt-6")}>{children}</div>
        </div>
      </div>
    </section>
  );
}
