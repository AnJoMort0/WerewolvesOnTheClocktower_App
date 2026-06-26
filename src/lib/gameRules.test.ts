import { describe, expect, it } from "vitest";
import { getGuaranteedWrongCount, getMeninaAnswerKind, MENINA_POISONED_ANSWERS } from "./gameRules";

describe("poisoned information rules", () => {
  it("maps every supported Menina source to its answer category", () => {
    expect(getMeninaAnswerKind("soldado")).toBe("soldier");
    expect(getMeninaAnswerKind("s01-suicide")).toBe("suicide");
    expect(getMeninaAnswerKind("e01")).toBe("werewolves");
    expect(getMeninaAnswerKind("s02")).toBe("whiteWerewolf");
  });

  it("keeps the poisoned Menina answer pool limited to the ten approved answers", () => {
    expect(MENINA_POISONED_ANSWERS).toHaveLength(10);
    expect(new Set(MENINA_POISONED_ANSWERS.map(({ kind }) => kind)).size).toBe(10);
  });

  it("always returns a different evil-being count", () => {
    for (let actual = 0; actual <= 20; actual += 1) {
      expect(getGuaranteedWrongCount(actual)).not.toBe(actual);
    }
  });
});
