import type { OrchestrationV2PlanStep } from "@t3tools/contracts";

const MAX_STEPS = 100;
const MAX_TEXT_LENGTH = 500;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stepStatus = (status: unknown): OrchestrationV2PlanStep["status"] | null => {
  switch (status) {
    case "done":
    case "completed":
      return "completed";
    case "in_progress":
      return "running";
    case "dropped":
    case "deleted":
    case "cancelled":
      return null;
    default:
      return "pending";
  }
};

/**
 * Reads the task list a Pi `todo` tool returns in `details`: Gentle Shell's `gentleTodo`
 * snapshot, or the rpiv-todo `tasks` shape. Dropped tasks are not outstanding work, so they
 * are left out. Returns undefined when the details carry no task list.
 */
export function piTodoSteps(details: unknown): ReadonlyArray<OrchestrationV2PlanStep> | undefined {
  if (!isRecord(details)) return undefined;
  const snapshot = isRecord(details["gentleTodo"]) ? details["gentleTodo"] : details;
  const tasks = snapshot["tasks"];
  if (!Array.isArray(tasks)) return undefined;
  const steps: Array<OrchestrationV2PlanStep> = [];
  for (const [index, task] of tasks.entries()) {
    if (!isRecord(task) || steps.length >= MAX_STEPS) continue;
    const status = stepStatus(task["status"]);
    const rawText = task["title"] ?? task["subject"];
    const text = typeof rawText === "string" ? rawText.trim().slice(0, MAX_TEXT_LENGTH) : "";
    if (status === null || text.length === 0) continue;
    const rawId = task["id"];
    const id = typeof rawId === "number" || typeof rawId === "string" ? String(rawId).trim() : "";
    steps.push({
      id: id.length > 0 ? id : String(index + 1),
      text,
      status,
    });
  }
  return steps;
}
