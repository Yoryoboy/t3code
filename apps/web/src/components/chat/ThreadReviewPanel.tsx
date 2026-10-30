import type { OrchestrationV2ProviderReview } from "@t3tools/contracts";
import { cn } from "~/lib/utils";
import { ThreadDetailsSection } from "./ThreadDetailsSection";

/** The provider's last review operation, such as Pi's `rdd status`, with its status and summary. */
export function ThreadReviewPanel(props: {
  readonly review: OrchestrationV2ProviderReview | undefined;
}) {
  const review = props.review;
  if (review === undefined) return null;
  return (
    <ThreadDetailsSection headingId="thread-details-review-heading" title="Review">
      <div className="flex min-w-0 flex-col gap-0.5 px-2.5 text-sm leading-5">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="min-w-0 break-words font-medium text-foreground">{review.title}</span>
          <span
            className={cn(
              "shrink-0 text-xs",
              review.status === "failed" ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {review.status}
          </span>
        </div>
        {review.summary ? (
          <span className="min-w-0 break-words text-xs text-muted-foreground">
            {review.summary}
          </span>
        ) : null}
      </div>
    </ThreadDetailsSection>
  );
}
