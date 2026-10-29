import type { OrchestrationV2ProviderExtensionStatus, ThreadId } from "@t3tools/contracts";
import { PuzzleIcon } from "lucide-react";
import type { ThreadNowItem } from "./ThreadNow";

/** Statuses the provider's extensions paint, such as Pi's `setStatus`, as one line. */
export function extensionStatusNowItem(input: {
  readonly threadId: ThreadId;
  readonly statuses: ReadonlyArray<OrchestrationV2ProviderExtensionStatus> | undefined;
}): ThreadNowItem | null {
  if (input.statuses === undefined || input.statuses.length === 0) return null;
  return {
    id: `extension-status:${input.threadId}`,
    icon: <PuzzleIcon />,
    title: input.statuses.map((status) => status.text).join(" · "),
  };
}
