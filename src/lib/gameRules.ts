import { isDetectableWerewolfRole, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";

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

export type LittleGirlAnswerKind =
  | "soldier"
  | "suicide"
  | "hunter"
  | "colossus"
  | "paranoid"
  | "pyromaniac"
  | "rustedKnight"
  | "mime"
  | "actor"
  | "werewolves"
  | "whiteWerewolf";

export const LITTLE_GIRL_POISONED_ANSWERS: Array<{ kind: LittleGirlAnswerKind; roleId: RoleId }> = [
  { kind: "soldier", roleId: "v09" },
  { kind: "suicide", roleId: "s01" },
  { kind: "hunter", roleId: "v08" },
  { kind: "colossus", roleId: "v27" },
  { kind: "paranoid", roleId: "v10" },
  { kind: "pyromaniac", roleId: "v15" },
  { kind: "rustedKnight", roleId: "v07" },
  { kind: "mime", roleId: "a03" },
  { kind: "actor", roleId: "a04" },
  { kind: "werewolves", roleId: "e01" },
  { kind: "whiteWerewolf", roleId: "s02" },
];

export function getLittleGirlAnswerKind(source: string | undefined): LittleGirlAnswerKind | null {
  if (source === "soldier" || source === "soldado") return "soldier";
  if (source === "s01-suicide" || source === "t02-suicide") return "suicide";
  if (source === "v08") return "hunter";
  if (source === "v27") return "colossus";
  if (source === "v10") return "paranoid";
  if (source === "v15") return "pyromaniac";
  if (source === "v07" || source === "v07-poisoned") return "rustedKnight";
  if (source === "a03") return "mime";
  if (source === "a04") return "actor";
  if (source === "s02") return "whiteWerewolf";
  if (source && isDetectableWerewolfRole(source as RoleId)) return "werewolves";
  return null;
}

export function getGuaranteedWrongCount(actual: number): number {
  return actual === 0 ? 1 : actual - 1;
}

/** Count each edge between neighboring living Evil Beings around the seating circle. */
export function countAdjacentEvilPairs(orderedLivingPlayerIds: readonly string[], evilPlayerIds: ReadonlySet<string>): number {
  const count = orderedLivingPlayerIds.length;
  if (count < 2) return 0;
  // With only two survivors the left and right neighbor are the same person.
  const edges = count === 2 ? 1 : count;
  let pairs = 0;
  for (let index = 0; index < edges; index += 1) {
    if (evilPlayerIds.has(orderedLivingPlayerIds[index])
      && evilPlayerIds.has(orderedLivingPlayerIds[(index + 1) % count])) pairs += 1;
  }
  return pairs;
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
