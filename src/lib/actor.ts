import { ROLES, type RoleId } from "@/lib/roles";

const ACTOR_CHARACTER_PREFIX = "a04:";

export type ActorPowerState = {
  chamanCharges: number;
  foxDisabled: boolean;
  paranoicoCharges: number;
  anjoCharges: number;
  lobisomemMauCharges: number;
  cupidoCharges: number;
  lobisomemVidenteUsed: boolean;
  lobisomemVampiroUsed: boolean;
  juizCharges: number;
  acusadorCharges: number;
  spiderDayChangeUsed: boolean;
  salvadorLastTarget: string | null;
  chefeLastTarget: string | null;
};

export const EMPTY_ACTOR_POWER_STATE: ActorPowerState = {
  chamanCharges: 0,
  foxDisabled: false,
  paranoicoCharges: 0,
  anjoCharges: 0,
  lobisomemMauCharges: 0,
  cupidoCharges: 0,
  lobisomemVidenteUsed: false,
  lobisomemVampiroUsed: false,
  juizCharges: 0,
  acusadorCharges: 0,
  spiderDayChangeUsed: false,
  salvadorLastTarget: null,
  chefeLastTarget: null,
};

export function encodeActorCharacter(copiedRole: RoleId | null): string {
  return copiedRole ? `${ACTOR_CHARACTER_PREFIX}${copiedRole}` : "a04";
}

export function parsePlayerCharacter(character: string | null | undefined): {
  baseRole: RoleId | null;
  displayRole: RoleId | null;
  actorCopiedRole: RoleId | null;
} {
  if (!character) return { baseRole: null, displayRole: null, actorCopiedRole: null };
  if (character.startsWith(ACTOR_CHARACTER_PREFIX)) {
    const copiedRole = character.slice(ACTOR_CHARACTER_PREFIX.length) as RoleId;
    if (copiedRole !== "a04" && ROLES[copiedRole]) {
      return { baseRole: "a04", displayRole: copiedRole, actorCopiedRole: copiedRole };
    }
  }
  const role = character as RoleId;
  if (!ROLES[role]) return { baseRole: null, displayRole: null, actorCopiedRole: null };
  return { baseRole: role, displayRole: role, actorCopiedRole: null };
}

export function getEffectiveRoleAssignments(
  baseAssignments: Record<string, RoleId>,
  actorCopiedRole: RoleId | null,
): Record<string, RoleId> {
  if (!actorCopiedRole) return baseAssignments;
  const actorId = Object.entries(baseAssignments).find(([, role]) => role === "a04")?.[0];
  return actorId ? { ...baseAssignments, [actorId]: actorCopiedRole } : baseAssignments;
}
