type TechListProps = {
  items: readonly string[];
};

export function TechList({ items }: TechListProps) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Technology stack">
      {items.map((item) => (
        <li
          key={item}
          className="border border-line bg-surface/70 px-2.5 py-1 font-mono text-[0.7rem] tracking-wide text-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
