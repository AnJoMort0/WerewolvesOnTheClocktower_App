import { describe, expect, it } from "vitest";
import { EMPTY_ACTOR_POWER_STATE } from "@/lib/actor";
import { changedPowerUse, getNightActors, nightPowerUseKey } from "@/lib/scriptActionTracking";

describe("changedPowerUse", () => {
  it("counts newly checked uses and power exhaustion, but not corrections or unrelated state", () => {
    const numeric = ["shamanCharges", "paranoidCharges", "angelCharges", "bigBadWolfCharges", "cupidCharges", "judgeCharges", "accuserCharges"] as const;
    const flags = ["foxDisabled", "monkeyDisabled", "werewolfSeerUsed", "vampireWolfUsed", "spiderDayChangeUsed", "motherCurseChangeUsed"] as const;
    for (const key of numeric) {
      const used = { ...EMPTY_ACTOR_POWER_STATE, [key]: 1 };
      expect(changedPowerUse(EMPTY_ACTOR_POWER_STATE, used)).toEqual({ used: true, indexes: [0] });
      expect(changedPowerUse(used, EMPTY_ACTOR_POWER_STATE)).toEqual({ used: false, indexes: [0] });
    }
    for (const key of flags) {
      const used = { ...EMPTY_ACTOR_POWER_STATE, [key]: true };
      expect(changedPowerUse(EMPTY_ACTOR_POWER_STATE, used)).toEqual({ used: true, indexes: [0] });
      expect(changedPowerUse(used, EMPTY_ACTOR_POWER_STATE)).toEqual({ used: false, indexes: [0] });
    }
    expect(changedPowerUse(
      { ...EMPTY_ACTOR_POWER_STATE, shamanCharges: 2 }, EMPTY_ACTOR_POWER_STATE,
    )).toEqual({ used: false, indexes: [0, 1] });
    expect(changedPowerUse(EMPTY_ACTOR_POWER_STATE, { ...EMPTY_ACTOR_POWER_STATE, saviourLastTarget: "player" })).toBe(null);
  });
});

describe("night action sources", () => {
  it("removes an undone use while preserving a separate performed action", () => {
    const shamanUse = nightPowerUseKey(3, "e03", "shaman", 0);
    const usedPowers = new Set([shamanUse]);
    expect([...getNightActors({}, new Set(), usedPowers, 3)]).toEqual(["shaman"]);

    usedPowers.delete(shamanUse);
    expect(getNightActors({}, new Set(), usedPowers, 3).size).toBe(0);

    const lineKey = "3:normal:shaman";
    const actionLines = { [lineKey]: ["shaman"] };
    expect([...getNightActors(actionLines, new Set([lineKey]), usedPowers, 3)]).toEqual(["shaman"]);
    expect(getNightActors(actionLines, new Set([lineKey]), usedPowers, 4).size).toBe(0);
  });

  it("keeps a second use when the first is undone", () => {
    const usedPowers = new Set([nightPowerUseKey(3, "e03", "shaman", 0), nightPowerUseKey(3, "e03", "shaman", 1)]);
    usedPowers.delete(nightPowerUseKey(3, "e03", "shaman", 0));
    expect([...getNightActors({}, new Set(), usedPowers, 3)]).toEqual(["shaman"]);
  });
});
