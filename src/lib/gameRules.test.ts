import { describe, expect, it } from "vitest";
import {
  canWhiteWolfTarget,
  getCircularDistances,
  getGuaranteedWrongCount,
  getLittleGirlAnswerKind,
  hasOtherLivingWerewolf,
  LITTLE_GIRL_POISONED_ANSWERS,
  shouldTransformEvilPoisonedSister,
  type WhiteWolfPlayerState,
} from "./gameRules";

describe("poisoned information rules", () => {
  it("maps every supported LittleGirl source to its answer category", () => {
    expect(getLittleGirlAnswerKind("soldier")).toBe("soldier");
    expect(getLittleGirlAnswerKind("soldado")).toBe("soldier");
    expect(getLittleGirlAnswerKind("s01-suicide")).toBe("suicide");
    expect(getLittleGirlAnswerKind("e01")).toBe("werewolves");
    expect(getLittleGirlAnswerKind("m06")).toBeNull();
    expect(getLittleGirlAnswerKind("s02")).toBe("whiteWerewolf");
  });

  it("keeps the poisoned LittleGirl answer pool limited to the ten approved answers", () => {
    expect(LITTLE_GIRL_POISONED_ANSWERS).toHaveLength(10);
    expect(new Set(LITTLE_GIRL_POISONED_ANSWERS.map(({ kind }) => kind)).size).toBe(10);
  });

  it("always returns a different evil-being count", () => {
    for (let actual = 0; actual <= 20; actual += 1) {
      expect(getGuaranteedWrongCount(actual)).not.toBe(actual);
    }
  });
});

describe("White Werewolf targeting", () => {
  const player = (id: string, role: WhiteWolfPlayerState["role"], alive = true, werewolfTurned = false): WhiteWolfPlayerState => ({
    id,
    role,
    alive,
    werewolfTurned,
  });

  it("must target a werewolf while another living werewolf remains", () => {
    const players = [player("white", "s02"), player("wolf", "e01"), player("villager", "v02")];
    expect(hasOtherLivingWerewolf(players, "white")).toBe(true);
    expect(canWhiteWolfTarget(players, "white", "wolf")).toBe(true);
    expect(canWhiteWolfTarget(players, "white", "villager")).toBe(false);
  });

  it("may target any other living player once no werewolves remain", () => {
    const players = [player("white", "s02"), player("wolf", "e01", false), player("villager", "v02")];
    expect(hasOtherLivingWerewolf(players, "white")).toBe(false);
    expect(canWhiteWolfTarget(players, "white", "villager")).toBe(true);
    expect(canWhiteWolfTarget(players, "white", "white")).toBe(false);
  });

  it("counts a turned player as another living werewolf", () => {
    const players = [player("white", "s02"), player("turned", "v02", true, true), player("villager", "v03")];
    expect(hasOtherLivingWerewolf(players, "white")).toBe(true);
    expect(canWhiteWolfTarget(players, "white", "turned")).toBe(true);
  });
});

describe("multi-target and transformation rules", () => {
  it("returns every circular distance in stable nearest-first order", () => {
    expect(getCircularDistances("maid", ["maid", "a", "b", "c", "d", "e"], ["b", "e", "c"]))
      .toEqual([1, 2, 3]);
  });

  it("only transforms a poisoned Sister who is an Evil Being", () => {
    expect(shouldTransformEvilPoisonedSister("l03", ["evil_being"], true)).toBe(true);
    expect(shouldTransformEvilPoisonedSister("l03", ["evil_being"], false)).toBe(false);
    expect(shouldTransformEvilPoisonedSister("l03", [], true)).toBe(false);
    expect(shouldTransformEvilPoisonedSister("l04", ["evil_being"], true)).toBe(false);
  });
});
