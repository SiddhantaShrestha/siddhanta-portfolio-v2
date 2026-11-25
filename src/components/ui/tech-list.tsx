type TechListProps = {
  items: readonly string[];
  /** "lg" is used on case study pages for easier reading. */
  size?: "md" | "lg";
};

export function TechList({ items, size = "md" }: TechListProps) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Technology stack">
      {items.map((item) => (
        <li
          key={item}
          className={
            size === "lg"
              ? "border border-line-strong bg-surface px-3 py-1.5 font-mono text-[0.8125rem] tracking-wide text-foreground/90"
              : "border border-line bg-surface/70 px-2.5 py-1 font-mono text-[0.7rem] tracking-wide text-muted"
          }
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
