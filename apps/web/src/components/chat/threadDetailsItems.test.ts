import { describe, expect, it } from "vite-plus/test";

import {
  resolveThreadDetailsVisibility,
  setThreadDetailsItem,
  THREAD_DETAILS_ITEMS,
} from "./threadDetailsItems";

const usage = THREAD_DETAILS_ITEMS.find((item) => item.id === "usage")!;
const servers = THREAD_DETAILS_ITEMS.find((item) => item.id === "servers")!;
const review = THREAD_DETAILS_ITEMS.find((item) => item.id === "review")!;

describe("thread details items", () => {
  it.each([
    { legacy: false, items: {}, usage: false },
    { legacy: true, items: {}, usage: true },
    { legacy: true, items: { usage: false }, usage: false },
    { legacy: false, items: { usage: true, retired: false }, usage: true },
  ])("resolves Usage from overrides and the retired Labs flag: %o", (row) => {
    const visibility = resolveThreadDetailsVisibility({
      threadDetailsItems: row.items,
      threadDetailsUsageEnabled: row.legacy,
    });
    expect(visibility.usage).toBe(row.usage);
    expect(visibility.servers).toBe(true);
  });

  it("stores only choices that differ from the default", () => {
    const legacyOn = { threadDetailsItems: {}, threadDetailsUsageEnabled: true };
    expect(setThreadDetailsItem(legacyOn, usage, false)).toEqual({ usage: false });
    expect(setThreadDetailsItem(legacyOn, usage, true)).toEqual({});

    const hidden = { threadDetailsItems: { servers: false }, threadDetailsUsageEnabled: false };
    expect(setThreadDetailsItem(hidden, servers, true)).toEqual({});
  });

  it("shows Review by default, directly above Extension status", () => {
    const defaults = { threadDetailsItems: {}, threadDetailsUsageEnabled: false };
    expect(resolveThreadDetailsVisibility(defaults).review).toBe(true);
    expect(setThreadDetailsItem(defaults, review, false)).toEqual({ review: false });
    expect(THREAD_DETAILS_ITEMS.indexOf(review)).toBe(
      THREAD_DETAILS_ITEMS.findIndex((item) => item.id === "extensions") - 1,
    );
  });
});
