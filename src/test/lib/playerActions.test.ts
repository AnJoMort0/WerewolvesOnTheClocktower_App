import { describe, expect, it } from "vitest";
import {
  createPlayerActionRequest,
  getPlayerActionNoticeKey,
  normalizePlayerActionState,
  removePlayerActionRequest,
  upsertPowerUses,
} from "@/lib/playerActions";

describe("player action state", () => {
  it("uses copy-specific notices for Bone Collector requests", () => {
    expect(getPlayerActionNoticeKey("t05-copy", "request")).toBe("gmT05CopyRequest");
    expect(getPlayerActionNoticeKey("t05-copy", "complete")).toBe("gmT05CopyComplete");
    expect(getPlayerActionNoticeKey("t05-copy", "denied")).toBe("gmT05CopyDenied");
    expect(getPlayerActionNoticeKey("v10-assassinate", "request")).toBe("gmV10AssassinationRequest");
  });

  it("normalizes invalid room state into an empty state", () => {
    expect(normalizePlayerActionState(null)).toEqual({
      version: 1,
      requests: [],
      powerUses: {},
    });
  });

  it("keeps valid requests and power uses", () => {
    const state = normalizePlayerActionState({
      version: 1,
      requests: [
        { id: "request-1", kind: "v10-assassinate", actorPlayerId: "p1", targetPlayerId: "p2", requestedAt: 123 },
        { id: "request-2", kind: "v18-resurrect", actorPlayerId: "p3", targetPlayerId: "p4", requestedAt: 124 },
        { id: "request-3", kind: "v23-web", actorPlayerId: "p5", targetPlayerId: "p6", requestedAt: 125 },
        { id: "bad", kind: "unknown", actorPlayerId: "p1", targetPlayerId: "p2", requestedAt: 123 },
      ],
      powerUses: { v10: { p1: 1.8, p2: -1 }, v18: { p3: 2 }, v23: { p5: 1 }, e02: "bad" },
    });

    expect(state.requests).toEqual([
      { id: "request-1", kind: "v10-assassinate", actorPlayerId: "p1", targetPlayerId: "p2", requestedAt: 123 },
      { id: "request-2", kind: "v18-resurrect", actorPlayerId: "p3", targetPlayerId: "p4", requestedAt: 124 },
      { id: "request-3", kind: "v23-web", actorPlayerId: "p5", targetPlayerId: "p6", requestedAt: 125 },
    ]);
    expect(state.powerUses).toEqual({ v10: { p1: 1, p2: 0 }, v18: { p3: 2 }, v23: { p5: 1 } });
  });

  it("updates uses and removes acknowledged requests", () => {
    const request = createPlayerActionRequest("v10-assassinate", "p1", "p2", 456);
    const withUses = upsertPowerUses({ version: 1, requests: [request], powerUses: {} }, "v10", { p1: 2 });

    expect(withUses.powerUses.v10).toEqual({ p1: 2 });
    expect(removePlayerActionRequest(withUses, request.id).requests).toEqual([]);
  });
});
