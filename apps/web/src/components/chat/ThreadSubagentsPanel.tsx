import type { OrchestrationV2TurnItem } from "@t3tools/contracts";
import {
  CircleCheckIcon,
  CircleDotIcon,
  CircleIcon,
  CircleSlashIcon,
  CircleXIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { ThreadDetailsSection } from "./ThreadDetailsSection";
import { THREAD_DETAILS_PANEL_ICON_CLASS } from "./threadDetailsPanelStyles";

type SubagentItem = Extract<OrchestrationV2TurnItem, { readonly type: "subagent" }>;

const STATUS_ICON: Partial<Record<SubagentItem["status"], typeof CircleIcon>> = {
  running: CircleDotIcon,
  completed: CircleCheckIcon,
  failed: CircleXIcon,
  cancelled: CircleSlashIcon,
  interrupted: CircleSlashIcon,
};

/** Native subagents the timeline leaves out, each expandable to its prompt and result. */
export function ThreadSubagentsPanel(props: {
  readonly subagents: ReadonlyArray<SubagentItem> | undefined;
}) {
  const subagents = props.subagents ?? [];
  if (subagents.length === 0) return null;
  const running = subagents.filter((item) => item.status === "running").length;
  return (
    <ThreadDetailsSection
      headingId="thread-details-subagents-heading"
      title="Subagents"
      actions={
        running === 0 ? null : (
          <span className="text-xs tabular-nums text-muted-foreground">{running} running</span>
        )
      }
    >
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {subagents.map((item) => {
          const Icon = STATUS_ICON[item.status] ?? CircleIcon;
          const live = item.status === "running";
          return (
            <li key={item.subagentId} className="min-w-0 px-2.5 text-sm leading-5">
              <details className="group min-w-0">
                <summary
                  aria-label={`${item.title ?? "Subagent"}: ${item.status}`}
                  className="flex min-w-0 cursor-pointer list-none items-start gap-2.5"
                >
                  <Icon
                    aria-hidden
                    className={cn(
                      THREAD_DETAILS_PANEL_ICON_CLASS,
                      "mt-0.5",
                      live && "text-foreground",
                    )}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={cn(
                        "min-w-0 truncate",
                        live ? "font-medium text-foreground" : "text-foreground/80",
                      )}
                    >
                      {item.title ?? "Subagent"}
                    </span>
                    {live && item.progress ? (
                      <span className="min-w-0 truncate text-xs text-muted-foreground">
                        {item.progress}
                      </span>
                    ) : null}
                  </span>
                </summary>
                <div className="mt-1 ml-6.5 flex min-w-0 flex-col gap-1.5 text-xs text-muted-foreground">
                  {item.prompt ? (
                    <p className="m-0 break-words whitespace-pre-wrap">{item.prompt}</p>
                  ) : null}
                  {item.result ? (
                    <p className="m-0 max-h-60 overflow-y-auto break-words whitespace-pre-wrap text-foreground/80">
                      {item.result}
                    </p>
                  ) : null}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </ThreadDetailsSection>
  );
}
