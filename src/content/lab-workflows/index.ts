import { citedocsWorkflow } from "@/content/lab-workflows/citedocs";
import { jobPostWorkflow } from "@/content/lab-workflows/job-post";
import { researchEvalWorkflow } from "@/content/lab-workflows/research-eval";
import type { LabWorkflow } from "@/content/lab-workflows/types";

/** Workflows registered for the interactive lab. */
export const labWorkflows: LabWorkflow[] = [
  jobPostWorkflow,
  citedocsWorkflow,
  researchEvalWorkflow,
];

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
