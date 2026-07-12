import { ROLES, type RoleId } from "@/lib/roles";
import { applyDrunkardReplacement, decodeDrunkardCharacter } from "@/lib/drunkard";
import { stripPlayerCharacterMetadata } from "@/lib/playerCharacter";

const ACTOR_CHARACTER_PREFIX = "a04:";
const ACTOR_DRUNKARD_CHARACTER_PREFIX = `${ACTOR_CHARACTER_PREFIX}a01:`;

export type ActorPowerState = {
  shamanCharges: number;
  foxDisabled: boolean;
  paranoidCharges: number;
  angelCharges: number;
  bigBadWolfCharges: number;
  cupidCharges: number;
  werewolfSeerUsed: boolean;
  vampireWolfUsed: boolean;
  judgeCharges: number;
  accuserCharges: number;
  spiderDayChangeUsed: boolean;
  saviourLastTarget: string | null;
  villageElderLastTarget: string | null;
};

export const EMPTY_ACTOR_POWER_STATE: ActorPowerState = {
  shamanCharges: 0,
  foxDisabled: false,
  paranoidCharges: 0,
  angelCharges: 0,
  bigBadWolfCharges: 0,
  cupidCharges: 0,
  werewolfSeerUsed: false,
  vampireWolfUsed: false,
  judgeCharges: 0,
  accuserCharges: 0,
  spiderDayChangeUsed: false,
  saviourLastTarget: null,
  villageElderLastTarget: null,
};

export function getActorIdolUsesAfterSelection(
  currentIdolPlayerId: string | null,
  selectedPlayerId: string,
  currentUses: number,
): number {
  if (!currentIdolPlayerId || currentIdolPlayerId === selectedPlayerId) return currentUses;
  return Math.min(currentUses + 1, 2);
}

export function encodeActorCharacter(copiedRole: RoleId | null, drunkardReplacementRole: RoleId | null = null): string {
  if (copiedRole === "a01" && drunkardReplacementRole) {
    return `${ACTOR_DRUNKARD_CHARACTER_PREFIX}${drunkardReplacementRole}`;
  }
  return copiedRole ? `${ACTOR_CHARACTER_PREFIX}${copiedRole}` : "a04";
}

export function parsePlayerCharacter(character: string | null | undefined): {
  baseRole: RoleId | null;
  displayRole: RoleId | null;
  actorCopiedRole: RoleId | null;
  drunkardReplacementRole: RoleId | null;
} {
  character = stripPlayerCharacterMetadata(character);
  if (!character) return { baseRole: null, displayRole: null, actorCopiedRole: null, drunkardReplacementRole: null };
  if (character.startsWith(ACTOR_DRUNKARD_CHARACTER_PREFIX)) {
    const drunkardReplacementRole = decodeDrunkardCharacter(
      `a01:${character.slice(ACTOR_DRUNKARD_CHARACTER_PREFIX.length)}`,
    );
    if (drunkardReplacementRole) {
      return {
        baseRole: "a04",
        displayRole: drunkardReplacementRole,
        actorCopiedRole: "a01",
        drunkardReplacementRole,
      };
    }
  }
  if (character.startsWith(ACTOR_CHARACTER_PREFIX)) {
    const copiedRole = character.slice(ACTOR_CHARACTER_PREFIX.length) as RoleId;
    if (copiedRole !== "a04" && ROLES[copiedRole]) {
      return { baseRole: "a04", displayRole: copiedRole, actorCopiedRole: copiedRole, drunkardReplacementRole: null };
    }
  }
  const drunkardReplacementRole = decodeDrunkardCharacter(character);
  if (drunkardReplacementRole) {
    return { baseRole: "a01", displayRole: drunkardReplacementRole, actorCopiedRole: null, drunkardReplacementRole };
  }
  const role = character as RoleId;
  if (!ROLES[role]) return { baseRole: null, displayRole: null, actorCopiedRole: null, drunkardReplacementRole: null };
  return { baseRole: role, displayRole: role, actorCopiedRole: null, drunkardReplacementRole: null };
}

export function shouldShowActorBadge(character: string | null | undefined): boolean {
  const parsed = parsePlayerCharacter(character);
  return parsed.baseRole === "a04" && !!parsed.actorCopiedRole;
}

export function getEffectiveRoleAssignments(
  baseAssignments: Record<string, RoleId>,
  actorCopiedRole: RoleId | null,
  drunkardReplacementRole: RoleId | null = null,
): Record<string, RoleId> {
  let assignments = applyDrunkardReplacement(baseAssignments, drunkardReplacementRole);
  if (!actorCopiedRole) return assignments;
  const actorId = Object.entries(baseAssignments).find(([, role]) => role === "a04")?.[0];
  const actorMechanicalRole = actorCopiedRole === "a01" && drunkardReplacementRole
    ? drunkardReplacementRole
    : actorCopiedRole;
  assignments = actorId ? { ...assignments, [actorId]: actorMechanicalRole } : assignments;
  return assignments;
}
