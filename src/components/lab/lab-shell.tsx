"use client";

import { useMemo, useReducer } from "react";
import { LabControls } from "@/components/lab/lab-controls";
import { PipelineRail } from "@/components/lab/pipeline-rail";
import { StageDetail } from "@/components/lab/stage-detail";
import { WorkflowSelector } from "@/components/lab/workflow-selector";
import type { LabWorkflow } from "@/content/lab-workflows/types";
import {
  canGoNext,
  canGoPrev,
  createInitialLabState,
  getScenario,
  isStageLocked,
  isStageSkipped,
  labReducer,
  type LabAction,
  type LabState,
} from "@/lib/lab/reducer";
import { cn } from "@/lib/cn";

type LabShellProps = {
  workflows: LabWorkflow[];
};

/**
 * Interactive workflow control panel.
 * Scenario choice changes reachable stages and which sample outputs appear.
 */
export function LabShell({ workflows }: LabShellProps) {
  const initialWorkflow = workflows[0];
  if (!initialWorkflow) {
    throw new Error("LabShell requires at least one workflow.");
  }

  const [state, dispatch] = useReducer(
    (current: LabState, action: LabAction) =>
      labReducer(current, action, workflows),
    initialWorkflow,
    createInitialLabState,
  );

  const workflow =
    workflows.find((entry) => entry.id === state.workflowId) ?? initialWorkflow;
  const scenario = getScenario(workflow, state.scenarioId);
  const stage = workflow.stages[state.stageIndex] ?? workflow.stages[0];
  if (!stage) {
    throw new Error(`Workflow ${workflow.id} has no stages.`);
  }

  const view = scenario.stageViews[stage.id];
  const locked = isStageLocked(
    state.stageIndex,
    scenario.maxReachableStageIndex,
  );
  const skipped = isStageSkipped(stage.id, scenario.skippedStageIds);
  const nextEnabled = canGoNext(
    state.stageIndex,
    scenario.maxReachableStageIndex,
  );
  const prevEnabled = canGoPrev(state.stageIndex);
  const blockedAtValidation =
    scenario.maxReachableStageIndex < workflow.stages.length - 1 &&
    state.stageIndex >= scenario.maxReachableStageIndex;

  const statusText = useMemo(() => {
    if (
      scenario.maxReachableStageIndex < workflow.stages.length - 1 &&
      state.stageIndex === scenario.maxReachableStageIndex
    ) {
      return `Stage ${state.stageIndex + 1} of ${workflow.stages.length}: ${stage.title}. Later stages are locked for this scenario.`;
    }
    if (locked) {
      return `Stage ${state.stageIndex + 1} of ${workflow.stages.length}: ${stage.title}. Locked for this scenario.`;
    }
    if (skipped) {
      return `Stage ${state.stageIndex + 1} of ${workflow.stages.length}: ${stage.title}. Skipped for this scenario.`;
    }
    return `Stage ${state.stageIndex + 1} of ${workflow.stages.length}: ${stage.title}.`;
  }, [
    locked,
    scenario.maxReachableStageIndex,
    skipped,
    stage.title,
    state.stageIndex,
    workflow.stages.length,
  ]);

  return (
    <div
      id="lab-workflow-panel"
      role="tabpanel"
      aria-labelledby={`lab-workflow-${workflow.id}`}
      className="lab-panel border border-line-strong bg-surface/50"
    >
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.65rem] tracking-[0.18em] text-violet uppercase">
              Interactive demo
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {workflow.disclaimer}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <WorkflowSelector
            workflows={workflows}
            activeId={workflow.id}
            onSelect={(workflowId) =>
              dispatch({ type: "selectWorkflow", workflowId })
            }
          />
        </div>
      </div>

      <div className="border-b border-line px-4 py-4 sm:px-5">
        <p className="font-mono text-[0.65rem] tracking-[0.16em] text-muted uppercase">
          Scenario
        </p>
        <div
          role="radiogroup"
          aria-label="Demonstration scenario"
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        >
          {workflow.scenarios.map((entry) => {
            const selected = entry.id === scenario.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  dispatch({ type: "selectScenario", scenarioId: entry.id })
                }
                className={cn(
                  "min-h-11 border px-4 py-2 text-left transition-colors sm:max-w-sm",
                  selected
                    ? "border-violet/50 bg-violet/10 text-foreground"
                    : "border-line bg-background/40 text-muted hover:border-line-strong hover:text-foreground",
                )}
              >
                <span className="block text-sm text-foreground">
                  {entry.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {entry.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-line px-3 py-4 sm:px-5">
        <PipelineRail
          stages={workflow.stages}
          activeIndex={state.stageIndex}
          maxReachableStageIndex={scenario.maxReachableStageIndex}
          skippedStageIds={scenario.skippedStageIds}
          onSelect={(index) => dispatch({ type: "goToStage", index })}
        />
      </div>

      <div className="px-4 py-5 sm:px-5 sm:py-6">
        <StageDetail
          stage={stage}
          stageIndex={state.stageIndex}
          stageCount={workflow.stages.length}
          view={view}
          locked={locked}
          skipped={skipped}
        />
      </div>

      <div className="border-t border-line px-4 py-4 sm:px-5">
        <LabControls
          canPrev={prevEnabled}
          canNext={nextEnabled}
          blockedAtValidation={blockedAtValidation}
          onPrev={() => dispatch({ type: "prev" })}
          onNext={() => dispatch({ type: "next" })}
          onReset={() => dispatch({ type: "reset" })}
        />
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {statusText}
        </p>
        <p className="mt-3 font-mono text-[0.7rem] tracking-wide text-muted">
          {statusText}
        </p>
      </div>
    </div>
  );
}
