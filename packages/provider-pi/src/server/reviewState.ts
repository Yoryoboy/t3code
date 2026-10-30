import type { OrchestrationV2ProviderReview } from "@t3tools/contracts";
import type * as DateTime from "effect/DateTime";
import * as NodeUtil from "node:util";

/** Review lifecycle tools Gentle Shell registers; every other tool keeps its own title. */
const REVIEW_TOOL_OPERATIONS: Readonly<Record<string, string>> = {
  gentle_review_capture: "capture",
  gentle_review_capture_group: "capture group",
  gentle_review_scope: "scope",
};

const REVIEW_TITLE_PREFIX = "rdd";
const SEPARATOR = " · ";
const MAX_SUMMARY_LENGTH = 160;
const MAX_OPERATION_LENGTH = 40;

const boundSummary = (line: string): string =>
  line.length <= MAX_SUMMARY_LENGTH ? line : `${line.slice(0, MAX_SUMMARY_LENGTH - 1).trimEnd()}…`;

// Gentle Shell's card reads a review envelope through these groups, in this order
// (lib/gentle-ai-renderer.ts#SUMMARY_FIELD_GROUPS). Keeping the same groups here means
// both hosts describe one review the same way.
const SUMMARY_FIELD_GROUPS: ReadonlyArray<ReadonlyArray<string>> = [
  ["status", "state"],
  ["outcome"],
  ["risk", "risk_tier", "riskLevel"],
  ["action", "provider_action"],
  [
    "next_transition.reason_code",
    "nextTransition.reasonCode",
    "next_transition",
    "nextTransition",
    "reason_code",
    "reasonCode",
    "diagnostics.error_code",
  ],
  [
    "diagnostics.message",
    "diagnostics.stderr",
    "error.message",
    "error",
    "reasons.0.detail",
    "reason",
    "message",
  ],
];

// A digest is never a readable summary, so it never stands in for one.
const HASH_PATTERN = /^(?:sha256:)?[0-9a-f]{32,}$/i;
const OPERATION_PATTERN = /^[a-z0-9]+(?:[ -][a-z0-9]+)*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const fieldAt = (source: Record<string, unknown>, path: string): unknown => {
  let value: unknown = source;
  for (const key of path.split(".")) {
    if (Array.isArray(value)) value = value[Number(key)];
    else if (isRecord(value)) value = value[key];
    else return undefined;
  }
  return value;
};

const summaryValue = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const clause = NodeUtil.stripVTControlCharacters(value)
    .split("\n")[0]!
    .split("; ")[0]!
    .replace(/[\u0000-\u001f\u007f]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  if (clause.length === 0 || HASH_PATTERN.test(clause)) return undefined;
  return clause;
};

/**
 * The title a review tool call carries: `rdd <operation>`. The controller names its own
 * operation in the arguments; the capture and scope tools each have exactly one.
 */
export function piReviewToolTitle(toolName: string, args: unknown): string | undefined {
  const operation =
    toolName === "gentle_review"
      ? isRecord(args) && typeof args["operation"] === "string"
        ? args["operation"].trim()
        : undefined
      : REVIEW_TOOL_OPERATIONS[toolName];
  if (
    operation === undefined ||
    operation.length === 0 ||
    operation.length > MAX_OPERATION_LENGTH ||
    !OPERATION_PATTERN.test(operation)
  ) {
    return undefined;
  }
  return `${REVIEW_TITLE_PREFIX} ${operation}`;
}

/**
 * One line for a review result: the first present value of each summary group, taken from
 * the envelope and then from its `result`, exactly as Gentle Shell's own card does it.
 */
export function piReviewSummary(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  const scopes = isRecord(value["result"]) ? [value, value["result"]] : [value];
  const parts: Array<string> = [];
  for (const group of SUMMARY_FIELD_GROUPS) {
    const found = scopes
      .flatMap((scope) => group.map((path) => summaryValue(fieldAt(scope, path))))
      .find((part) => part !== undefined);
    if (found !== undefined && !parts.includes(found)) parts.push(found);
  }
  return parts.length === 0 ? undefined : boundSummary(parts.join(SEPARATOR));
}

export interface PiReviewObservation {
  readonly toolName: string;
  readonly args: unknown;
  /** The tool result's `details`; absent while the call is still running. */
  readonly details: unknown;
  readonly failed: boolean;
  readonly at: DateTime.Utc;
}

/**
 * Thread-level review state for the details panel. Returns undefined for a tool outside the
 * review lifecycle, and when the observation would not change what the panel shows.
 */
export function piReviewState(
  previous: OrchestrationV2ProviderReview | undefined,
  observation: PiReviewObservation,
): OrchestrationV2ProviderReview | undefined {
  const title = piReviewToolTitle(observation.toolName, observation.args);
  if (title === undefined) return undefined;
  const status = observation.failed
    ? ("failed" as const)
    : observation.details === undefined
      ? ("running" as const)
      : ("completed" as const);
  const summary =
    observation.details === undefined ? undefined : piReviewSummary(observation.details);
  if (
    previous !== undefined &&
    previous.title === title &&
    previous.status === status &&
    previous.summary === summary
  ) {
    return undefined;
  }
  return {
    title,
    status,
    ...(summary === undefined ? {} : { summary }),
    updatedAt: observation.at,
  };
}
