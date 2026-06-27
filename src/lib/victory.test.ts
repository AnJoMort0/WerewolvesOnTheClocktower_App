import { describe, expect, it } from "vitest";
import { detectAutomaticVictory, playerWinsAnyVictoryGroup, playerWinsVictoryGroup, type VictoryPlayer } from "@/lib/victory";
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

  it("does not award lovers victory to only one surviving tagged lover", () => {
    expect(detectAutomaticVictory([
      player("lover", "v02", true, ["namorado"]),
      player("cupid", "s01"),
      player("other-lover", "v03", false, ["namorado"]),
    ])).toBeNull();
  });

  it("keeps the game running when the secret lover prevents the lovers condition", () => {
    expect(detectAutomaticVictory([
      player("secret", "as01b", true, ["namorado"]),
      player("lover", "v02", true, ["namorado"]),
      player("cupid", "s01"),
    ])).toBeNull();
  });

  it("blocks village victory while a tagged lover remains alive", () => {
    expect(detectAutomaticVictory([
      player("wolf", "e01", false),
      player("lover", "v02", true, ["namorado"]),
      player("villager", "v03"),
    ])).toBeNull();
  });

  it("allows village victory after all tagged lovers are dead", () => {
    expect(detectAutomaticVictory([
      player("wolf", "e01", false),
      player("lover", "v02", false, ["namorado"]),
      player("villager", "v03"),
    ])).toBe("village");
  });

  it("blocks werewolf victory while a tagged lover remains alive", () => {
    expect(detectAutomaticVictory([
      player("lover-wolf", "e01", true, ["namorado"]),
      player("witch", "e02"),
      player("villager", "v03", false),
    ])).toBeNull();
  });

  it("prioritizes a lone White Werewolf over the general werewolf condition", () => {
    expect(detectAutomaticVictory([
      player("white", "s02"),
      player("other", "v02", false),
    ])).toBe("whiteWolf");
  });

  it("blocks werewolf victory until the White Werewolf dies", () => {
    expect(detectAutomaticVictory([
      player("white", "s02"),
      player("wolf", "e01"),
      player("villager", "v02", false),
    ])).toBeNull();
  });

  it("allows werewolf victory after the White Werewolf dies", () => {
    expect(detectAutomaticVictory([
      player("white", "s02", false),
      player("wolf", "e01"),
      player("villager", "v02", false),
    ])).toBe("werewolves");
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

  it("awards Secret Lover victory to the Secret Lover and the surviving lover", () => {
    const secret = player("secret", "as01b");
    const survivingLover = player("lover", "v02", true, ["namorado"]);
    const deadFormerLover = player("former", "v03", false, ["namorado"]);

    const players = [secret, survivingLover, deadFormerLover];
    expect(playerWinsVictoryGroup(secret, "secretLover", players)).toBe(true);
    expect(playerWinsVictoryGroup(survivingLover, "secretLover", players)).toBe(true);
    expect(playerWinsVictoryGroup(deadFormerLover, "secretLover", players)).toBe(false);
  });

  it("supports no, some, or multiple winner groups for a tie", () => {
    const lover = player("lover", "v02", true, ["namorado"]);
    const wolf = player("wolf", "e01");

    expect(playerWinsAnyVictoryGroup(lover, [])).toBe(false);
    expect(playerWinsAnyVictoryGroup(lover, ["lovers"])).toBe(true);
    expect(playerWinsAnyVictoryGroup(lover, ["secretLover"], [lover])).toBe(false);
    expect(playerWinsAnyVictoryGroup(wolf, ["village", "werewolves"])).toBe(true);
  });
});
