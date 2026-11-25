import { jobPostWorkflow } from "@/content/lab-workflows/job-post";
import type { LabWorkflow } from "@/content/lab-workflows/types";

/** Workflows registered for the interactive lab. Phase 5A ships Job Post only. */
export const labWorkflows: LabWorkflow[] = [jobPostWorkflow];

export function getLabWorkflow(id: string): LabWorkflow | undefined {
  return labWorkflows.find((workflow) => workflow.id === id);
}

export function getDefaultLabWorkflow(): LabWorkflow {
  const workflow = labWorkflows[0];
  if (!workflow) {
    throw new Error("No lab workflows are registered.");
  }
  return workflow;
}
