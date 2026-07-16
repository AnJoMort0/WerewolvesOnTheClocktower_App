import { describe, expect, it } from "vitest";
import { parsePlayerCharacter } from "@/lib/actor";
import {
  applyDrunkardReplacement,
  encodeDrunkardCharacter,
  getDrunkardReplacementCandidates,
  isDrunkardActingPoisoned,
  pickDrunkardReplacement,
} from "@/lib/drunkard";

describe("Drunkard replacement", () => {
  it("keeps Drunkard as the public identity while exposing the replacement privately", () => {
    expect(parsePlayerCharacter(encodeDrunkardCharacter("v02"))).toEqual({
      baseRole: "a01",
      displayRole: "v02",
      actorCopiedRole: null,
      drunkardReplacementRole: "v02",
    });
  });

  it("prefers an implemented replacement that is not already in the game", () => {
    expect(getDrunkardReplacementCandidates()).toContain("e04");
    expect(getDrunkardReplacementCandidates(["e04", "v01", "v02", "v03", "v04", "v05"]))
      .toEqual(["v23"]);
    expect(pickDrunkardReplacement(["e04"], () => 0)).toBe("v02");
  });

  it("changes mechanics without replacing the base assignment", () => {
    const base = { drunkard: "a01", seer: "e04" } as const;
    expect(applyDrunkardReplacement(base, "v05")).toEqual({ drunkard: "v05", seer: "e04" });
    expect(base.drunkard).toBe("a01");
  });

  it("inverts poison only for the Drunkard", () => {
    expect(isDrunkardActingPoisoned("drunkard", "drunkard", null)).toBe(true);
    expect(isDrunkardActingPoisoned("drunkard", "drunkard", "drunkard")).toBe(false);
    expect(isDrunkardActingPoisoned("seer", "drunkard", "seer")).toBe(true);
    expect(isDrunkardActingPoisoned("actor", new Set(["drunkard", "actor"]), null)).toBe(true);
    expect(isDrunkardActingPoisoned("actor", new Set(["drunkard", "actor"]), "actor")).toBe(false);
  });
});
