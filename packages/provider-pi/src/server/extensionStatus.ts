import type { OrchestrationV2ProviderExtensionStatus } from "@t3tools/contracts";
import * as NodeUtil from "node:util";

// Statuses persist on every change, so a misbehaving extension must not grow the thread.
const MAX_STATUSES = 16;
const MAX_KEY_LENGTH = 64;
const MAX_TEXT_LENGTH = 200;

const normalize = (value: string) =>
  NodeUtil.stripVTControlCharacters(value).replace(/\s+/gu, " ").trim();

/**
 * Applies a Pi `setStatus` request in arrival order. Missing or blank text clears the key.
 * Returns undefined when the visible statuses would not change.
 */
export function applyPiExtensionStatus(
  statuses: ReadonlyArray<OrchestrationV2ProviderExtensionStatus>,
  rawKey: string | undefined,
  rawText: string | undefined,
): ReadonlyArray<OrchestrationV2ProviderExtensionStatus> | undefined {
  const key = normalize(rawKey ?? "");
  // Truncating keys would let two distinct statuses overwrite each other.
  if (key.length === 0 || key.length > MAX_KEY_LENGTH) return undefined;
  const text = normalize(rawText ?? "")
    .slice(0, MAX_TEXT_LENGTH)
    .trim();
  const index = statuses.findIndex((status) => status.key === key);
  if (text.length === 0) return index === -1 ? undefined : statuses.toSpliced(index, 1);
  if (index !== -1) {
    return statuses[index]?.text === text ? undefined : statuses.with(index, { key, text });
  }
  return statuses.length >= MAX_STATUSES ? undefined : [...statuses, { key, text }];
}
