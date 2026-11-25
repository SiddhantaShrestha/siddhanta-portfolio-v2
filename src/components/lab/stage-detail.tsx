import { IllustrativeBadge } from "@/components/lab/illustrative-badge";
import { StageIo } from "@/components/lab/stage-io";
import { TechList } from "@/components/ui/tech-list";
import type { LabStage, LabStageView } from "@/content/lab-workflows/types";

type StageDetailProps = {
  stage: LabStage;
  stageIndex: number;
  stageCount: number;
  view: LabStageView | undefined;
  locked: boolean;
};

export function StageDetail({
  stage,
  stageIndex,
  stageCount,
  view,
  locked,
}: StageDetailProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
      <div>
        <p className="font-mono text-[0.65rem] tracking-[0.18em] text-accent uppercase">
          Stage {String(stageIndex + 1).padStart(2, "0")} of{" "}
          {String(stageCount).padStart(2, "0")}
        </p>
        <h3 className="mt-2 text-xl font-medium text-foreground sm:text-2xl">
          {stage.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
          {stage.purpose}
        </p>
        <div className="mt-5">
          <TechList items={stage.tech} />
        </div>
        {locked ? (
          <p className="mt-5 border border-violet/35 bg-violet/10 px-3 py-3 text-sm leading-relaxed text-foreground/90">
            This stage is locked for the current scenario. Validation did not
            pass, so content generation and publishing do not run.
          </p>
        ) : null}
        {view?.note && !locked ? (
          <p className="mt-5 text-sm leading-relaxed text-muted">{view.note}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-muted uppercase">
            Input / output inspection
          </p>
          <IllustrativeBadge />
        </div>
        {locked ? (
          <div className="border border-line bg-background/60 px-3 py-4 text-sm text-muted">
            No sample output. The workflow stopped before this stage.
          </div>
        ) : (
          <>
            {view?.input ? <StageIo block={view.input} /> : null}
            {view?.output ? <StageIo block={view.output} /> : null}
            {!view?.input && !view?.output ? (
              <div className="border border-line bg-background/60 px-3 py-4 text-sm text-muted">
                No sample payload for this stage.
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
