import type { OrchestrationV2ProviderExtensionStatus } from "@t3tools/contracts";
import * as NodeUtil from "node:util";

// Statuses persist on every change, so a misbehaving extension must not grow the thread.
const MAX_STATUSES = 16;
const MAX_KEY_LENGTH = 64;
const MAX_TEXT_LENGTH = 200;

const clean = (value: string, maxLength: number) =>
  NodeUtil.stripVTControlCharacters(value).replace(/\s+/gu, " ").trim().slice(0, maxLength).trim();

/**
 * Applies a Pi `setStatus` request in arrival order. Missing or blank text clears the key.
 * Returns undefined when the visible statuses would not change.
 */
export function applyPiExtensionStatus(
  statuses: ReadonlyArray<OrchestrationV2ProviderExtensionStatus>,
  rawKey: string | undefined,
  rawText: string | undefined,
): ReadonlyArray<OrchestrationV2ProviderExtensionStatus> | undefined {
  const key = clean(rawKey ?? "", MAX_KEY_LENGTH);
  if (key.length === 0) return undefined;
  const text = clean(rawText ?? "", MAX_TEXT_LENGTH);
  const index = statuses.findIndex((status) => status.key === key);
  if (text.length === 0) return index === -1 ? undefined : statuses.toSpliced(index, 1);
  if (index !== -1) {
    return statuses[index]?.text === text ? undefined : statuses.with(index, { key, text });
  }
  return statuses.length >= MAX_STATUSES ? undefined : [...statuses, { key, text }];
}
