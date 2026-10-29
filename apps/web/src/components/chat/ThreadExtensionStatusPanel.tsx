import type { OrchestrationV2ProviderExtensionStatus } from "@t3tools/contracts";
import { ThreadDetailsSection } from "./ThreadDetailsSection";

/** Status lines the provider's extensions paint, such as Pi's `setStatus`, one per row. */
export function ThreadExtensionStatusPanel(props: {
  readonly statuses: ReadonlyArray<OrchestrationV2ProviderExtensionStatus> | undefined;
}) {
  if (props.statuses === undefined || props.statuses.length === 0) return null;
  return (
    <ThreadDetailsSection headingId="thread-details-extensions-heading" title="Extensions">
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {props.statuses.map((status) => (
          <li
            key={status.key}
            className="min-w-0 px-2.5 text-sm leading-5 break-words text-foreground/80"
          >
            {status.text}
          </li>
        ))}
      </ul>
    </ThreadDetailsSection>
  );
}
