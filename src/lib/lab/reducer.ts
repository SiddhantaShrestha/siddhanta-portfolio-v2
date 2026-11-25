import type { LabScenario, LabWorkflow } from "@/content/lab-workflows/types";

export type LabState = {
  workflowId: string;
  scenarioId: string;
  stageIndex: number;
};

export type LabAction =
  | { type: "selectWorkflow"; workflowId: string }
  | { type: "selectScenario"; scenarioId: string }
  | { type: "goToStage"; index: number }
  | { type: "next" }
  | { type: "prev" }
  | { type: "reset" };

function requireWorkflow(
  workflows: LabWorkflow[],
  workflowId: string,
): LabWorkflow {
  const match = workflows.find((entry) => entry.id === workflowId);
  if (match) return match;
  const fallback = workflows[0];
  if (!fallback) {
    throw new Error("Lab workflows array is empty.");
  }
  return fallback;
}

export function getScenario(
  workflow: LabWorkflow,
  scenarioId: string,
): LabScenario {
  const match = workflow.scenarios.find(
    (scenario) => scenario.id === scenarioId,
  );
  if (match) return match;

  const defaultScenario = workflow.scenarios.find(
    (scenario) => scenario.id === workflow.defaultScenarioId,
  );
  if (defaultScenario) return defaultScenario;

  const first = workflow.scenarios[0];
  if (!first) {
    throw new Error(`Workflow ${workflow.id} has no scenarios.`);
  }
  return first;
}

export function clampStageIndex(
  index: number,
  maxReachableStageIndex: number,
): number {
  if (index < 0) return 0;
  if (index > maxReachableStageIndex) return maxReachableStageIndex;
  return index;
}

export function createInitialLabState(workflow: LabWorkflow): LabState {
  return {
    workflowId: workflow.id,
    scenarioId: workflow.defaultScenarioId,
    stageIndex: 0,
  };
}

export function labReducer(
  state: LabState,
  action: LabAction,
  workflows: LabWorkflow[],
): LabState {
  const workflow = requireWorkflow(workflows, state.workflowId);
  const scenario = getScenario(workflow, state.scenarioId);

  switch (action.type) {
    case "selectWorkflow": {
      const nextWorkflow = requireWorkflow(workflows, action.workflowId);
      return createInitialLabState(nextWorkflow);
    }
    case "selectScenario": {
      const nextScenario = getScenario(workflow, action.scenarioId);
      return {
        ...state,
        scenarioId: nextScenario.id,
        stageIndex: clampStageIndex(
          state.stageIndex,
          nextScenario.maxReachableStageIndex,
        ),
      };
    }
    case "goToStage": {
      // Locked stages stay selectable so visitors can inspect why they are blocked.
      // Advancement with Next still stops at maxReachableStageIndex.
      if (action.index < 0 || action.index >= workflow.stages.length) {
        return state;
      }
      return {
        ...state,
        stageIndex: action.index,
      };
    }
    case "next": {
      if (state.stageIndex >= scenario.maxReachableStageIndex) {
        return state;
      }
      return {
        ...state,
        stageIndex: state.stageIndex + 1,
      };
    }
    case "prev": {
      if (state.stageIndex <= 0) {
        return state;
      }
      // From a locked stage, jump back to the last reachable stage.
      if (state.stageIndex > scenario.maxReachableStageIndex) {
        return {
          ...state,
          stageIndex: scenario.maxReachableStageIndex,
        };
      }
      return {
        ...state,
        stageIndex: state.stageIndex - 1,
      };
    }
    case "reset": {
      return createInitialLabState(workflow);
    }
    default:
      return state;
  }
}

export function isStageLocked(
  stageIndex: number,
  maxReachableStageIndex: number,
): boolean {
  return stageIndex > maxReachableStageIndex;
}

export function isStageSkipped(
  stageId: string,
  skippedStageIds: string[] | undefined,
): boolean {
  return Boolean(skippedStageIds?.includes(stageId));
}

export function canGoNext(
  stageIndex: number,
  maxReachableStageIndex: number,
): boolean {
  return stageIndex < maxReachableStageIndex;
}

export function canGoPrev(stageIndex: number): boolean {
  return stageIndex > 0;
}
