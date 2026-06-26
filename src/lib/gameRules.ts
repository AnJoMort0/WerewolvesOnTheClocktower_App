import type { RoleId } from "@/lib/roles";

export type MeninaAnswerKind =
  | "soldier"
  | "suicide"
  | "hunter"
  | "paranoid"
  | "pyromaniac"
  | "rustedKnight"
  | "mime"
  | "actor"
  | "werewolves"
  | "whiteWerewolf";

export const MENINA_POISONED_ANSWERS: Array<{ kind: MeninaAnswerKind; roleId: RoleId }> = [
  { kind: "soldier", roleId: "v09" },
  { kind: "suicide", roleId: "s01" },
  { kind: "hunter", roleId: "v08" },
  { kind: "paranoid", roleId: "v10" },
  { kind: "pyromaniac", roleId: "v15" },
  { kind: "rustedKnight", roleId: "v07" },
  { kind: "mime", roleId: "a03" },
  { kind: "actor", roleId: "a04" },
  { kind: "werewolves", roleId: "e01" },
  { kind: "whiteWerewolf", roleId: "s02" },
];

export function getMeninaAnswerKind(source: string | undefined): MeninaAnswerKind | null {
  if (source === "soldado") return "soldier";
  if (source === "s01-suicide") return "suicide";
  if (source === "v08") return "hunter";
  if (source === "v10") return "paranoid";
  if (source === "v15") return "pyromaniac";
  if (source === "v07" || source === "v07-poisoned") return "rustedKnight";
  if (source === "a03") return "mime";
  if (source === "a04") return "actor";
  if (source === "e01" || source === "m01" || source === "m02" || source === "m03") return "werewolves";
  if (source === "s02") return "whiteWerewolf";
  return null;
}

export function getGuaranteedWrongCount(actual: number): number {
  return actual === 0 ? 1 : actual - 1;
}
