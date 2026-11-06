import { describe, expect, it } from "vitest";
import { clothingNumbers, wrongClothingNumbers } from "@/lib/washerwoman";

describe("Washerwoman clothes", () => {
  it("reports numbered marks in card order, including no marks", () => {
    expect(clothingNumbers([])).toEqual([]);
    expect(clothingNumbers(["clothes_damaged", "clothes_bloodied", "clothes_charred"])).toEqual([1, 3, 4]);
  });

  it("poison produces a plausible but different combination", () => {
    for (const correct of [[], [1], [1, 2, 3, 4]]) {
      for (let index = 0; index < 15; index += 1) {
        const result = wrongClothingNumbers(correct, () => index / 15);
        expect(result).not.toEqual(correct);
        expect(result.every((number) => number >= 1 && number <= 4)).toBe(true);
      }
    }
  });
});
