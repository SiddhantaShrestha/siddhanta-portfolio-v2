import type { LabWorkflow } from "@/content/lab-workflows/types";
import { cn } from "@/lib/cn";

type WorkflowSelectorProps = {
  workflows: LabWorkflow[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function WorkflowSelector({
  workflows,
  activeId,
  onSelect,
}: WorkflowSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Lab workflows"
      className="flex flex-wrap gap-2"
    >
      {workflows.map((workflow) => {
        const selected = workflow.id === activeId;
        return (
          <button
            key={workflow.id}
            type="button"
            role="tab"
            id={`lab-workflow-${workflow.id}`}
            aria-selected={selected}
            aria-controls="lab-workflow-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(workflow.id)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                return;
              }
              event.preventDefault();
              const index = workflows.findIndex(
                (entry) => entry.id === workflow.id,
              );
              if (index < 0) return;
              const delta = event.key === "ArrowRight" ? 1 : -1;
              const nextIndex =
                (index + delta + workflows.length) % workflows.length;
              const nextWorkflow = workflows[nextIndex];
              if (!nextWorkflow) return;
              onSelect(nextWorkflow.id);
              const tabList = event.currentTarget.closest('[role="tablist"]');
              const nextTab = tabList?.querySelector<HTMLButtonElement>(
                `#lab-workflow-${nextWorkflow.id}`,
              );
              nextTab?.focus();
            }}
            className={cn(
              "min-h-11 border px-4 text-sm tracking-wide transition-colors",
              selected
                ? "border-accent/50 bg-accent/10 text-foreground"
                : "border-line bg-surface/50 text-muted hover:border-line-strong hover:text-foreground",
            )}
          >
            {workflow.title}
          </button>
        );
      })}
    </div>
  );
}
