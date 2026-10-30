import { isOrchestrationV2WorkActive, type OrchestrationV2TurnItem } from "@t3tools/contracts";
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

// Finished subagents past this many fold away, so a long session keeps the card short.
const RECENT_FINISHED = 3;

const STATUS_ICON: Partial<Record<SubagentItem["status"], typeof CircleIcon>> = {
  running: CircleDotIcon,
  completed: CircleCheckIcon,
  failed: CircleXIcon,
  cancelled: CircleSlashIcon,
  interrupted: CircleSlashIcon,
};

/** Native subagents the timeline leaves out: live ones, the latest finished, then the rest folded. */
export function ThreadSubagentsPanel(props: {
  readonly subagents: ReadonlyArray<SubagentItem> | undefined;
}) {
  const subagents = props.subagents ?? [];
  if (subagents.length === 0) return null;
  const live = subagents.filter((item) => isOrchestrationV2WorkActive(item.status));
  const finished = subagents.filter((item) => !isOrchestrationV2WorkActive(item.status));
  const recent = finished.slice(-RECENT_FINISHED);
  const earlier = finished.slice(0, -RECENT_FINISHED);
  return (
    <ThreadDetailsSection
      headingId="thread-details-subagents-heading"
      title="Subagents"
      actions={
        live.length === 0 ? null : (
          <span className="text-xs tabular-nums text-muted-foreground">{live.length} running</span>
        )
      }
    >
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {[...live, ...recent.toReversed()].map((item) => (
          <SubagentRow key={item.subagentId} item={item} />
        ))}
      </ul>
      {earlier.length === 0 ? null : (
        <details className="mt-1">
          <summary className="cursor-pointer list-none px-2.5 text-xs text-muted-foreground">
            {earlier.length} earlier
          </summary>
          <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
            {earlier.toReversed().map((item) => (
              <SubagentRow key={item.subagentId} item={item} />
            ))}
          </ul>
        </details>
      )}
    </ThreadDetailsSection>
  );
}

function SubagentRow({ item }: { readonly item: SubagentItem }) {
  const Icon = STATUS_ICON[item.status] ?? CircleIcon;
  const live = isOrchestrationV2WorkActive(item.status);
  const agent = item.agent?.replace(/^gentle-ai-/u, "");
  return (
    <li className="min-w-0 px-2.5 text-sm leading-5">
      <details className="min-w-0">
        <summary
          aria-label={`${agent ? `${agent}: ` : ""}${item.title ?? "Subagent"}: ${item.status}`}
          className="flex min-w-0 cursor-pointer list-none items-start gap-2.5"
        >
          <Icon
            aria-hidden
            className={cn(THREAD_DETAILS_PANEL_ICON_CLASS, "mt-0.5", live && "text-foreground")}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span
                className={cn(
                  "min-w-0 truncate",
                  live ? "font-medium text-foreground" : "text-foreground/80",
                )}
              >
                {item.title ?? "Subagent"}
              </span>
              {agent ? (
                <span className="shrink-0 rounded-sm bg-muted px-1 text-2xs text-muted-foreground">
                  {agent}
                </span>
              ) : null}
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
}
