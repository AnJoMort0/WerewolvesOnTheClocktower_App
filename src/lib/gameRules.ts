import { WEREWOLF_ROLES, type RoleId } from "@/lib/roles";

export type WhiteWolfPlayerState = {
  id: string;
  role?: RoleId;
  alive: boolean;
  werewolfTurned: boolean;
};

const isLivingWerewolf = (player: WhiteWolfPlayerState) =>
  player.alive && (
    (!!player.role && WEREWOLF_ROLES.includes(player.role)) || player.werewolfTurned
  );

export function hasOtherLivingWerewolf(players: WhiteWolfPlayerState[], whiteWolfId: string): boolean {
  return players.some((player) => player.id !== whiteWolfId && isLivingWerewolf(player));
}

export function canWhiteWolfTarget(
  players: WhiteWolfPlayerState[],
  whiteWolfId: string,
  targetPlayerId: string,
): boolean {
  const target = players.find((player) => player.id === targetPlayerId);
  if (!target || target.id === whiteWolfId || !target.alive) return false;
  return !hasOtherLivingWerewolf(players, whiteWolfId) || isLivingWerewolf(target);
}

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
  if (source === "e01" || source === "m01" || source === "m02" || source === "m03" || source === "m06") return "werewolves";
  if (source === "s02") return "whiteWerewolf";
  return null;
}

export function getGuaranteedWrongCount(actual: number): number {
  return actual === 0 ? 1 : actual - 1;
}

export function getCircularDistances(
  observerPlayerId: string,
  orderedPlayerIds: string[],
  targetPlayerIds: Iterable<string>,
): number[] {
  const observerIndex = orderedPlayerIds.indexOf(observerPlayerId);
  if (observerIndex === -1 || orderedPlayerIds.length === 0) return [];

  return Array.from(targetPlayerIds)
    .flatMap((targetPlayerId) => {
      const targetIndex = orderedPlayerIds.indexOf(targetPlayerId);
      if (targetIndex === -1) return [];
      const difference = Math.abs(observerIndex - targetIndex);
      return [Math.min(difference, orderedPlayerIds.length - difference)];
    })
    .sort((left, right) => left - right);
}

export function shouldTransformEvilPoisonedSister(
  role: RoleId | undefined,
  effects: Iterable<string>,
  poisoned: boolean,
): boolean {
  return role === "l03" && poisoned && new Set(effects).has("evil_being");
}
