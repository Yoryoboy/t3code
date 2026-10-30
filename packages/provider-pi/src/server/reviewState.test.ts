import { assert, describe, it } from "@effect/vitest";
import * as DateTime from "effect/DateTime";

import { piReviewState, piReviewSummary, piReviewToolTitle } from "./reviewState.ts";

const at = DateTime.makeUnsafe("2026-10-29T22:00:00.000Z");
const later = DateTime.makeUnsafe("2026-10-29T22:01:00.000Z");

describe("piReviewToolTitle", () => {
  it("names the review controller operation the call asked for", () => {
    assert.equal(piReviewToolTitle("gentle_review", { operation: "assess" }), "rdd assess");
    assert.equal(piReviewToolTitle("gentle_review", { operation: "inspect" }), "rdd inspect");
    assert.equal(
      piReviewToolTitle("gentle_review", { operation: "acknowledge-approved" }),
      "rdd acknowledge-approved",
    );
  });

  it("names the capture and scope tools by their own operation", () => {
    assert.equal(piReviewToolTitle("gentle_review_capture", {}), "rdd capture");
    assert.equal(piReviewToolTitle("gentle_review_capture_group", {}), "rdd capture group");
    assert.equal(piReviewToolTitle("gentle_review_scope", {}), "rdd scope");
  });

  it("leaves other tools and an operation-less controller call alone", () => {
    assert.isUndefined(piReviewToolTitle("bash", { command: "ls" }));
    assert.isUndefined(piReviewToolTitle("gentle_review", {}));
    assert.isUndefined(piReviewToolTitle("gentle_review", { operation: "  " }));
  });
});

describe("piReviewSummary", () => {
  it("reads the same fields Gentle Shell's card shows, in the same order", () => {
    assert.equal(
      piReviewSummary({
        status: "ready",
        action: "start",
        next_transition: { reason_code: "fresh_target_ready" },
      }),
      "ready · start · fresh_target_ready",
    );
    assert.equal(
      piReviewSummary({
        status: "blocked",
        action: "collect",
        next_transition: { reason_code: "reviewer_results_required" },
      }),
      "blocked · collect · reviewer_results_required",
    );
  });

  it("falls back to the risk tier and reads a nested result envelope", () => {
    assert.equal(piReviewSummary({ risk: "medium" }), "medium");
    assert.equal(
      piReviewSummary({ result: { risk_tier: "high", outcome: "created" } }),
      "created · high",
    );
  });

  it("never shows a hash where a readable value belongs", () => {
    assert.equal(
      piReviewSummary({
        status: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      }),
      undefined,
    );
    assert.equal(
      piReviewSummary({
        status: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        outcome: "approved",
      }),
      "approved",
    );
  });

  it("keeps one bounded, single, printable line", () => {
    const summary = piReviewSummary({
      status: "failed",
      diagnostics: { message: `boom\u001b[31m ${"x".repeat(400)}\nsecond line` },
    });
    assert.isDefined(summary);
    assert.notInclude(summary!, "\n");
    assert.notInclude(summary!, "\u001b");
    assert.isAtMost(summary!.length, 160);
    assert.isTrue(summary!.startsWith("failed · boom"));
  });

  it("reports nothing for a value that carries no summary field", () => {
    assert.isUndefined(piReviewSummary(undefined));
    assert.isUndefined(piReviewSummary("ok"));
    assert.isUndefined(piReviewSummary({ lineageId: "review-abc", bindings: ["{}"] }));
  });
});

describe("piReviewState", () => {
  it("shows the running call as soon as it starts", () => {
    assert.deepEqual(
      piReviewState(undefined, {
        toolName: "gentle_review",
        args: { operation: "start" },
        details: undefined,
        failed: false,
        at,
      }),
      { title: "rdd start", status: "running", updatedAt: at },
    );
  });

  it("adds the summary and the outcome once the call ends", () => {
    assert.deepEqual(
      piReviewState(undefined, {
        toolName: "gentle_review",
        args: { operation: "status" },
        details: {
          status: "blocked",
          action: "collect",
          next_transition: { reason_code: "reviewer_results_required" },
        },
        failed: false,
        at,
      }),
      {
        title: "rdd status",
        status: "completed",
        summary: "blocked · collect · reviewer_results_required",
        updatedAt: at,
      },
    );
    assert.deepEqual(
      piReviewState(undefined, {
        toolName: "gentle_review_capture_group",
        args: {},
        details: { outcome: "capture-failed" },
        failed: true,
        at,
      }),
      { title: "rdd capture group", status: "failed", summary: "capture-failed", updatedAt: at },
    );
  });

  it("ignores tools that are not part of the review lifecycle", () => {
    assert.isUndefined(
      piReviewState(undefined, {
        toolName: "bash",
        args: { command: "ls" },
        details: {},
        failed: false,
        at,
      }),
    );
  });

  it("publishes nothing when the same call repeats", () => {
    const previous = { title: "rdd status", status: "completed" as const, updatedAt: at };
    assert.isUndefined(
      piReviewState(previous, {
        toolName: "gentle_review",
        args: { operation: "status" },
        details: {},
        failed: false,
        at: later,
      }),
    );
    assert.deepEqual(
      piReviewState(previous, {
        toolName: "gentle_review",
        args: { operation: "inspect" },
        details: {},
        failed: false,
        at: later,
      }),
      { title: "rdd inspect", status: "completed", updatedAt: later },
    );
  });
});
