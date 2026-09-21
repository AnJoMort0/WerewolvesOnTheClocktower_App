import { describe, expect, it } from "vitest";
import { isProphecyRetentionActive } from "@/lib/prophecy";

describe("prophecy power retention", () => {
  it("keeps power for the following day and night only", () => {
    expect(isProphecyRetentionActive(4, { phase: "day", number: 3 })).toBe(true);
    expect(isProphecyRetentionActive(4, { phase: "tribunal", number: 3 })).toBe(true);
    expect(isProphecyRetentionActive(4, { phase: "night", number: 4 })).toBe(true);
    expect(isProphecyRetentionActive(4, { phase: "night", number: 3 })).toBe(false);
    expect(isProphecyRetentionActive(4, { phase: "day", number: 4 })).toBe(false);
    expect(isProphecyRetentionActive(4, { phase: "night", number: 5 })).toBe(false);
  });

  it("rejects missing or malformed retention state", () => {
    expect(isProphecyRetentionActive(null, { phase: "day", number: 3 })).toBe(false);
    expect(isProphecyRetentionActive(0, { phase: "night", number: 0 })).toBe(false);
    expect(isProphecyRetentionActive(4, null)).toBe(false);
  });
});
