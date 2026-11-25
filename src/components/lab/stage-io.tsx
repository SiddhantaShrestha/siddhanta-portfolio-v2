import type { LabStageOutput } from "@/content/lab-workflows/types";
import { cn } from "@/lib/cn";

type StageIoProps = {
  block: LabStageOutput;
};

export function StageIo({ block }: StageIoProps) {
  return (
    <div className="border border-line bg-background/60">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <p className="font-mono text-[0.65rem] tracking-[0.16em] text-muted uppercase">
          {block.label}
        </p>
        {block.kind === "status" ? <StatusPill status={block.status} /> : null}
        {block.kind === "scores" ? (
          <span className="font-mono text-[0.65rem] tracking-[0.12em] text-accent uppercase">
            Overall {block.overall}
          </span>
        ) : null}
      </div>
      <div className="px-3 py-3">
        {block.kind === "text" ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {block.body}
          </p>
        ) : null}
        {block.kind === "fields" ? (
          <dl className="space-y-2">
            {block.fields.map((field) => (
              <div
                key={field.key}
                className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 text-sm"
              >
                <dt className="font-mono text-[0.7rem] tracking-wide text-muted">
                  {field.key}
                  {field.required ? (
                    <span className="text-accent"> *</span>
                  ) : null}
                </dt>
                <dd
                  className={cn(
                    "min-w-0 break-words",
                    field.missing
                      ? "font-mono text-violet"
                      : "text-foreground/90",
                  )}
                >
                  {field.missing ? "missing" : field.value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {block.kind === "status" ? (
          <p className="text-sm leading-relaxed text-foreground/90">
            {block.detail}
          </p>
        ) : null}
        {block.kind === "chunks" ? (
          <ul className="space-y-3">
            {block.items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "border border-line px-3 py-2",
                  item.accessible
                    ? "bg-surface/40"
                    : "bg-background/40 opacity-70",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {item.document}
                  </p>
                  <span className="font-mono text-[0.6rem] tracking-[0.12em] text-muted uppercase">
                    {item.visibility}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[0.6rem] tracking-[0.12em] uppercase",
                      item.accessible ? "text-accent" : "text-violet",
                    )}
                  >
                    {item.accessible ? "Accessible" : "Inaccessible"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.excerpt}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        {block.kind === "ranking" ? (
          <div className="space-y-3">
            {block.caption ? (
              <p className="text-xs leading-relaxed text-muted">
                {block.caption}
              </p>
            ) : null}
            <ol className="space-y-3">
              {block.items.map((item) => (
                <li
                  key={`${item.rank}-${item.document}-${item.chunkLabel}`}
                  className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border border-line bg-surface/40 px-3 py-2"
                >
                  <span className="font-mono text-sm text-accent">
                    {String(item.rank).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm text-foreground">
                      {item.document}
                      <span className="text-muted"> · {item.chunkLabel}</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {item.excerpt}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {block.kind === "scores" ? (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-muted">
              {block.caption}
            </p>
            <ul className="space-y-3">
              {block.criteria.map((item) => (
                <li
                  key={item.criterion}
                  className="border border-line px-3 py-2"
                >
                  <p className="font-mono text-[0.7rem] tracking-[0.12em] text-accent uppercase">
                    {item.criterion}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {item.note}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {block.kind === "claims" ? (
          <ul className="space-y-3">
            {block.items.map((item) => (
              <li
                key={item.claim}
                className="border border-line bg-surface/40 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-[0.6rem] tracking-[0.12em] uppercase",
                      item.supported ? "text-accent" : "text-violet",
                    )}
                  >
                    {item.supported ? "Supported" : "Unsupported"}
                  </span>
                  {item.evidence ? (
                    <span className="font-mono text-[0.65rem] text-muted">
                      {item.evidence}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {item.claim}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: "ok" | "blocked" | "ready" | "skipped";
}) {
  const label =
    status === "ok"
      ? "OK"
      : status === "blocked"
        ? "Blocked"
        : status === "skipped"
          ? "Skipped"
          : "Ready";

  return (
    <span
      className={cn(
        "font-mono text-[0.65rem] tracking-[0.12em] uppercase",
        status === "ok" && "text-accent",
        status === "blocked" && "text-violet",
        status === "skipped" && "text-violet",
        status === "ready" && "text-muted",
      )}
    >
      {label}
    </span>
  );
}
