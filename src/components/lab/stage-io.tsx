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
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "ok" | "blocked" | "ready" }) {
  const label =
    status === "ok" ? "OK" : status === "blocked" ? "Blocked" : "Ready";

  return (
    <span
      className={cn(
        "font-mono text-[0.65rem] tracking-[0.12em] uppercase",
        status === "ok" && "text-accent",
        status === "blocked" && "text-violet",
        status === "ready" && "text-muted",
      )}
    >
      {label}
    </span>
  );
}
