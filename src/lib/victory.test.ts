import { describe, expect, it } from "vitest";
import { detectAutomaticVictory, type VictoryPlayer } from "@/lib/victory";
import type { RoleId } from "@/lib/roles";

const player = (
  id: string,
  role: RoleId,
  alive = true,
  effects: string[] = [],
): VictoryPlayer => ({ id, role, alive, effects });

describe("detectAutomaticVictory", () => {
  it("detects village victory when no living werewolf remains", () => {
    expect(detectAutomaticVictory([
      player("wolf", "e01", false),
      player("villager", "v02"),
      player("witch", "e02"),
    ])).toBe("village");
  });

  it("detects werewolf victory when only evil beings remain", () => {
    expect(detectAutomaticVictory([
      player("wolf", "e01"),
      player("witch", "e02"),
      player("villager", "v02", false),
    ])).toBe("werewolves");
  });

  it("detects lovers and Cupid victory", () => {
    expect(detectAutomaticVictory([
      player("lover-a", "v02", true, ["namorado"]),
      player("lover-b", "e01", true, ["namorado"]),
      player("cupid", "s01"),
      player("other", "v03", false),
    ])).toBe("lovers");
  });

  it("does not award lovers victory when the secret lover is one of them", () => {
    expect(detectAutomaticVictory([
      player("secret", "as01b", true, ["namorado"]),
      player("lover", "v02", true, ["namorado"]),
      player("cupid", "s01"),
    ])).toBe("village");
  });

  it("prioritizes a lone White Werewolf over the general werewolf condition", () => {
    expect(detectAutomaticVictory([
      player("white", "s02"),
      player("other", "v02", false),
    ])).toBe("whiteWolf");
  });

  it("detects Secret Lover victory with one surviving lover", () => {
    expect(detectAutomaticVictory([
      player("secret", "as01b"),
      player("lover", "v02", true, ["namorado"]),
      player("other", "e01", false),
    ])).toBe("secretLover");
  });

  it("does not trigger while villagers and werewolves both remain", () => {
    expect(detectAutomaticVictory([
      player("wolf", "e01"),
      player("villager", "v02"),
    ])).toBeNull();
  });
});
