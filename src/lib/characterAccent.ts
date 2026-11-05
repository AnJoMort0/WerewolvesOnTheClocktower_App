import { EVIL_ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import type { StatusEffect } from "@/lib/effects";

export type CharacterAffiliation = "villager" | "evil" | "independent" | "unknown";

export const CHARACTER_ACCENT: Record<CharacterAffiliation, { border: string; text: string }> = {
  villager: { border: "border-sky-400/75", text: "text-sky-200" },
  evil: { border: "border-rose-500/90", text: "text-rose-300" },
  independent: { border: "border-amber-400/75", text: "text-amber-200" },
  unknown: { border: "border-border/70", text: "text-foreground" },
};

/** GM-only visual alignment. Keep this out of public player circles and reveals. */
export function getCharacterAffiliation(
  baseRoleId: RoleId | null | undefined,
  objectiveRoleId: RoleId | null | undefined,
  effects: ReadonlySet<StatusEffect>,
  nightNumber: number,
): CharacterAffiliation {
  if (!baseRoleId) return "unknown";
  const objective = objectiveRoleId ?? baseRoleId;
  if (effects.has("evil_being") || effects.has("werewolf_turned")
    || EVIL_ROLES.includes(objective) || WEREWOLF_ROLES.includes(objective)) return "evil";
  if (baseRoleId === "s01" || baseRoleId === "as01b") return "independent";
  if (baseRoleId === "a02" && objective === "a02") return "independent";
  if ((baseRoleId === "f01" || baseRoleId === "f02") && objective === baseRoleId && nightNumber < 2) return "independent";
  return "villager";
}
