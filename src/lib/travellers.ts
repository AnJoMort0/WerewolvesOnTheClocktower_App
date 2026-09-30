import { TRAVELLER_ROLES, type RoleId } from "@/lib/roles";

export type TravellerAlignment = "villager" | "evil";
export type TravellerState = "requested" | "assigning" | "revealing" | "ready" | "placed" | "denied" | "exiled";

export function isTravellerRole(roleId: RoleId | null | undefined): boolean {
  return !!roleId && TRAVELLER_ROLES.includes(roleId);
}

export function pickTravellerRole(usedRoles: Iterable<RoleId>, random = Math.random): RoleId {
  const used = new Set(usedRoles);
  const unused = TRAVELLER_ROLES.filter((roleId) => !used.has(roleId));
  const pool = unused.length > 0 ? unused : TRAVELLER_ROLES;
  return pool[Math.floor(random() * pool.length)] ?? TRAVELLER_ROLES[0];
}

export function pickTravellerAlignment(random = Math.random): TravellerAlignment {
  return random() < 0.5 ? "villager" : "evil";
}

export function getTravellerExileVotes(playerCount: number): number {
  return Math.ceil(Math.max(0, playerCount) / 2);
}
