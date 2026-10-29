import type { OrchestrationV2Subagent } from "@t3tools/contracts";

/** Gentle Agents pushes a background task's completion as a custom message of this type. */
export const GENTLE_AGENTS_RESULT_TYPE = "gentle-agents.result";
export const GENTLE_AGENTS_TOOLS = new Set(["subagent_run", "subagent_status", "subagent_result"]);

export interface GentleAgentsTask {
  readonly taskId: string;
  readonly agent: string;
  readonly label: string | undefined;
  readonly status: OrchestrationV2Subagent["status"];
  readonly finished: boolean;
  readonly lastStep: string | undefined;
  readonly error: string | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const STATUS: Record<string, OrchestrationV2Subagent["status"]> = {
  queued: "pending",
  running: "running",
  waiting: "waiting",
  completed: "completed",
  failed: "failed",
  timed_out: "failed",
  cancelled: "cancelled",
};

/** Reads the `gentleAgents` task snapshot Gentle Agents puts in tool and message details. */
export function gentleAgentsTask(details: unknown): GentleAgentsTask | undefined {
  const task = isRecord(details) ? details["gentleAgents"] : undefined;
  if (!isRecord(task)) return undefined;
  const taskId = text(task["taskId"]);
  const agent = text(task["agent"]);
  const status = STATUS[String(task["status"])];
  if (taskId === undefined || agent === undefined || status === undefined) return undefined;
  return {
    taskId,
    agent,
    label: text(task["label"]),
    status,
    finished: status === "completed" || status === "failed" || status === "cancelled",
    lastStep: text(task["lastStep"]),
    error: text(task["error"]),
  };
}
