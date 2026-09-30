import { describe, expect, it } from "vitest";
import { TRAVELLER_ROLES } from "@/lib/roles";
import { getTravellerExileVotes, pickTravellerAlignment, pickTravellerRole } from "@/lib/travellers";

describe("Traveller setup rules", () => {
  it("uses every unique Traveller before allowing a duplicate", () => {
    expect(pickTravellerRole([], () => 0)).toBe("t01");
    expect(pickTravellerRole(["t01"], () => 0)).toBe("t02");
    expect(pickTravellerRole(["t01", "t02"], () => 0)).toBe("t03");
    expect(TRAVELLER_ROLES).toContain(pickTravellerRole(TRAVELLER_ROLES, () => 0.99));
  });

  it("assigns either alignment with equal halves of the random range", () => {
    expect(pickTravellerAlignment(() => 0.49)).toBe("villager");
    expect(pickTravellerAlignment(() => 0.5)).toBe("evil");
  });

  it("requires half of all players rounded up for exile", () => {
    expect(getTravellerExileVotes(8)).toBe(4);
    expect(getTravellerExileVotes(9)).toBe(5);
  });
});
