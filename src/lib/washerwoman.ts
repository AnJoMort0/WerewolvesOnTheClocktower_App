import type { StatusEffect } from "@/lib/effects";

/** The card's numbered list is the single source for tags and reveal order. */
export const WASHERWOMAN_CLOTHES = [
  "clothes_bloodied",
  "clothes_stained",
  "clothes_charred",
  "clothes_damaged",
] as const satisfies readonly StatusEffect[];

export type ClothingEffect = typeof WASHERWOMAN_CLOTHES[number];

export function clothingNumbers(effects: Iterable<StatusEffect>): number[] {
  const present = new Set(effects);
  return WASHERWOMAN_CLOTHES.flatMap((effect, index) => present.has(effect) ? [index + 1] : []);
}

/** Every one of the other 15 combinations is possible poisoned information. */
export function wrongClothingNumbers(correct: readonly number[], random = Math.random): number[] {
  const actualMask = correct.reduce((mask, number) => mask | (1 << (number - 1)), 0);
  const possible = Array.from({ length: 16 }, (_, mask) => mask).filter((mask) => mask !== actualMask);
  const mask = possible[Math.min(possible.length - 1, Math.floor(random() * possible.length))];
  return WASHERWOMAN_CLOTHES.flatMap((_, index) => mask & (1 << index) ? [index + 1] : []);
}
