import type { OrchestrationV2PlanStep } from "@t3tools/contracts";
import { CircleCheckIcon, CircleDotIcon, CircleIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { ThreadDetailsSection } from "./ThreadDetailsSection";
import { THREAD_DETAILS_PANEL_ICON_CLASS } from "./threadDetailsPanelStyles";

const STEP_ICON = {
  completed: CircleCheckIcon,
  running: CircleDotIcon,
  pending: CircleIcon,
} as const;

/** The thread's current task list, checked off as the agent works through it. */
export function ThreadTasksPanel(props: {
  readonly steps: ReadonlyArray<OrchestrationV2PlanStep> | undefined;
}) {
  const steps = props.steps ?? [];
  if (steps.length === 0) return null;
  const done = steps.filter((step) => step.status === "completed").length;
  return (
    <ThreadDetailsSection
      headingId="thread-details-tasks-heading"
      title="Tasks"
      actions={
        <span className="text-xs tabular-nums text-muted-foreground">
          {done}/{steps.length}
        </span>
      }
    >
      <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
        {steps.map((step) => {
          const Icon = STEP_ICON[step.status];
          return (
            <li
              key={step.id}
              aria-label={`${step.text}: ${step.status}`}
              className="flex min-w-0 items-start gap-2.5 px-2.5 text-sm leading-5"
            >
              <Icon
                aria-hidden
                className={cn(
                  THREAD_DETAILS_PANEL_ICON_CLASS,
                  "mt-0.5",
                  step.status === "running" && "text-foreground",
                )}
              />
              <span
                className={cn(
                  "min-w-0 break-words",
                  step.status === "completed"
                    ? "text-muted-foreground line-through"
                    : step.status === "running"
                      ? "font-medium text-foreground"
                      : "text-foreground/80",
                )}
              >
                {step.text}
              </span>
            </li>
          );
        })}
      </ol>
    </ThreadDetailsSection>
  );
}
