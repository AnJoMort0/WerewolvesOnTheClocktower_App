import { describe, expect, it } from "vitest";
import { normalizeGameLogSnapshot } from "@/lib/gameLog";

describe("normalizeGameLogSnapshot", () => {
  it("restores a durable post-game snapshot and normalizes legacy effects", () => {
    const snapshot = normalizeGameLogSnapshot({
      runtimeMs: 120_000,
      events: [{
        id: "event-1",
        createdAt: 123,
        phase: "night",
        phaseNumber: 2,
        action: "effect_add",
        effect: "namorado",
      }],
      players: [{
        id: "player-1",
        name: "Alex",
        seat_position: 0,
        character: "v01",
        is_alive: false,
      }],
      roleAssignments: { "player-1": "v01", invalid: "not-a-role" },
      playerStatuses: { "player-1": "dead", invalid: "missing" },
      permanentlyDead: ["player-1"],
      playerEffects: { "player-1": ["namorado", "immunity_full"] },
      poisonedPlayerId: null,
      poisonedPlayerIds: [],
      illusionPlayerId: "player-1",
      illusionPlayerIds: ["player-1"],
    });

    expect(snapshot).toMatchObject({
      runtimeMs: 120_000,
      roleAssignments: { "player-1": "v01" },
      playerStatuses: { "player-1": "dead" },
      playerEffects: { "player-1": ["lover", "immunity_full"] },
      permanentlyDead: ["player-1"],
      illusionPlayerIds: ["player-1"],
    });
    expect(snapshot?.events[0].effect).toBe("lover");
  });

  it("rejects incomplete values instead of exposing a broken log button", () => {
    expect(normalizeGameLogSnapshot(null)).toBeNull();
    expect(normalizeGameLogSnapshot({ events: [] })).toBeNull();
  });
});
