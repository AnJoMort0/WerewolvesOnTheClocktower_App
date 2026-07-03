import { ROLES, type RoleId } from "@/lib/roles";

const DRUNKARD_CHARACTER_PREFIX = "a01:";

// String IDs are intentional: future roles can be listed before their RoleId is implemented.
export const DRUNKARD_REPLACEMENT_CANDIDATE_IDS: readonly string[] = [
  "e04",
  "v02",
  "v03",
  "v04",
  "v05",
  "v16",
  "v23",
];

export function getDrunkardReplacementCandidates(excludedRoles: Iterable<RoleId> = []): RoleId[] {
  const excluded = new Set(excludedRoles);
  const implemented = DRUNKARD_REPLACEMENT_CANDIDATE_IDS.filter((id): id is RoleId => id in ROLES);
  const notAlreadyInGame = implemented.filter((id) => !excluded.has(id));
  return notAlreadyInGame.length > 0 ? notAlreadyInGame : implemented;
}

export function pickDrunkardReplacement(
  excludedRoles: Iterable<RoleId> = [],
  random: () => number = Math.random,
): RoleId | null {
  const candidates = getDrunkardReplacementCandidates(excludedRoles);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)];
}

export function encodeDrunkardCharacter(replacementRole: RoleId): string {
  return `${DRUNKARD_CHARACTER_PREFIX}${replacementRole}`;
}

export function decodeDrunkardCharacter(character: string | null | undefined): RoleId | null {
  if (!character?.startsWith(DRUNKARD_CHARACTER_PREFIX)) return null;
  const replacementRole = character.slice(DRUNKARD_CHARACTER_PREFIX.length) as RoleId;
  return replacementRole !== "a01" && ROLES[replacementRole] ? replacementRole : null;
}

export function applyDrunkardReplacement(
  assignments: Record<string, RoleId>,
  replacementRole: RoleId | null,
): Record<string, RoleId> {
  if (!replacementRole) return assignments;
  const drunkardId = Object.entries(assignments).find(([, role]) => role === "a01")?.[0];
  return drunkardId ? { ...assignments, [drunkardId]: replacementRole } : assignments;
}

export function isDrunkardActingPoisoned(
  playerId: string | null | undefined,
  drunkardPlayerIds: string | Iterable<string> | null | undefined,
  poisonedPlayerId: string | null | undefined,
): boolean {
  if (!playerId) return false;
  const usesDrunkardMechanics = typeof drunkardPlayerIds === "string"
    ? playerId === drunkardPlayerIds
    : !!drunkardPlayerIds && new Set(drunkardPlayerIds).has(playerId);
  return usesDrunkardMechanics ? poisonedPlayerId !== playerId : poisonedPlayerId === playerId;
}
