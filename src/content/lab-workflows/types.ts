/**
 * Typed demo data for the Interactive AI & Automation Lab.
 * Every sample input and output is illustrative. Nothing here runs live.
 */

export type LabStageKind =
  "input" | "process" | "model" | "boundary" | "output";

export type LabFieldValue = {
  key: string;
  value: string;
  required?: boolean;
  /** True when a required field is absent in this scenario. */
  missing?: boolean;
};

export type LabStageOutput =
  | {
      kind: "text";
      label: string;
      body: string;
    }
  | {
      kind: "fields";
      label: string;
      fields: LabFieldValue[];
    }
  | {
      kind: "status";
      label: string;
      status: "ok" | "blocked" | "ready";
      detail: string;
    };

export type LabStageView = {
  input?: LabStageOutput;
  output?: LabStageOutput;
  note?: string;
};

export type LabStage = {
  id: string;
  title: string;
  /** Short purpose for the static overview and the detail panel. */
  purpose: string;
  tech: string[];
  kind: LabStageKind;
};

export type LabScenario = {
  id: string;
  label: string;
  description: string;
  /**
   * Highest stage index the visitor can reach in this scenario (0-based).
   * An invalid payload stops at validation and cannot continue.
   */
  maxReachableStageIndex: number;
  /** Sample views keyed by stage id. */
  stageViews: Record<string, LabStageView>;
};

export type LabWorkflow = {
  id: string;
  title: string;
  projectSlug: string;
  summary: string;
  /** Persistent label that samples are not live runs. */
  disclaimer: string;
  /**
   * Optional note for product scope that is confirmed but not demonstrated
   * as executable stages (for example Facebook and Instagram).
   */
  teamScopeNote?: string;
  stages: LabStage[];
  scenarios: LabScenario[];
  defaultScenarioId: string;
};
