import { CsProse } from "@/components/case-study/cs-prose";

type CsContributionProps = {
  body: string;
  contributions?: string[];
};

/** Personal engineering contribution: ownership statement plus a list. */
export function CsContribution({ body, contributions }: CsContributionProps) {
  const hasList = contributions !== undefined && contributions.length > 0;

  return (
    <div>
      <CsProse>{body}</CsProse>
      {hasList ? (
        <ul className="mt-8 grid max-w-3xl sm:grid-cols-2 sm:gap-x-10">
          {contributions.map((item) => (
            <li
              key={item}
              className="flex gap-3 border-t border-line py-3 text-base leading-snug text-foreground"
            >
              <span
                aria-hidden
                className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-accent"
              />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
