type CsFeatureListProps = {
  features: string[];
};

export function CsFeatureList({ features }: CsFeatureListProps) {
  return (
    <ul className="grid md:grid-cols-2 md:gap-x-12">
      {features.map((feature, index) => (
        <li
          key={feature}
          className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-t border-line py-4 text-base leading-snug text-foreground"
        >
          <span
            aria-hidden
            className="pt-0.5 font-mono text-[0.75rem] tracking-[0.14em] text-muted"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          {feature}
        </li>
      ))}
    </ul>
  );
}
