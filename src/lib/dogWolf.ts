import { EMPTY_ACTOR_POWER_STATE, type ActorPowerState } from "@/lib/actor";
import type { RoleId } from "@/lib/roles";

export type DogWolfState = {
  ownerPlayerId: string | null;
  ownerSelectedNight: number | null;
  powerState: ActorPowerState;
  independentRole: RoleId | null;
  objectiveRoleOverride: RoleId | null;
  actorIdolPlayerId: string | null;
  actorIdolUses: number;
  actorModeActive: boolean;
  actorCopiedRole: RoleId | null;
  adoptiveDadPlayerId: string | null;
  enemyPlayerIds: string[];
};

export type DogWolfStates = Record<string, DogWolfState>;

export function createDogWolfState(ownerPlayerId: string | null = null): DogWolfState {
  return {
    ownerPlayerId,
    ownerSelectedNight: null,
    powerState: { ...EMPTY_ACTOR_POWER_STATE },
    independentRole: null,
    objectiveRoleOverride: null,
    actorIdolPlayerId: null,
    actorIdolUses: 0,
    actorModeActive: false,
    actorCopiedRole: null,
    adoptiveDadPlayerId: null,
    enemyPlayerIds: [],
  };
}

export function createInheritedDogWolfState(sourceState?: DogWolfState): DogWolfState {
  return createDogWolfState(sourceState?.ownerPlayerId ?? null);
}

export function getDogActorCopiedRoleForDisplay(
  state: DogWolfState | null | undefined,
  actorPlayerId: string | null,
  actorCopiedRole: RoleId | null,
  drunkardReplacementRole: RoleId | null = null,
): RoleId | null {
  if (!state) return null;
  if (state.actorCopiedRole) {
    return state.actorCopiedRole === "a01"
      ? state.independentRole ?? drunkardReplacementRole ?? null
      : state.actorCopiedRole;
  }
  if (state.ownerPlayerId && state.ownerPlayerId === actorPlayerId && actorCopiedRole) {
    return actorCopiedRole === "a01" ? drunkardReplacementRole : actorCopiedRole;
  }
  return null;
}

export function getDogWolfPlayerIds(
  baseRoleAssignments: Record<string, RoleId>,
  actorPlayerId: string | null,
  actorCopiedRole: RoleId | null,
): string[] {
  const playerIds = Object.entries(baseRoleAssignments)
    .filter(([, role]) => role === "a02")
    .map(([playerId]) => playerId);
  if (actorPlayerId && actorCopiedRole === "a02" && !playerIds.includes(actorPlayerId)) {
    playerIds.push(actorPlayerId);
  }
  return playerIds;
}

export function getDogWolfAbilityRoleAssignments(
  effectiveRoleAssignments: Record<string, RoleId>,
  dogWolfStates: DogWolfStates,
  permanentlyDeadPlayerIds: Iterable<string> = [],
  activeDeadDogPlayerIds: Iterable<string> = [],
): Record<string, RoleId> {
  const permanentlyDead = new Set(permanentlyDeadPlayerIds);
  const activeDeadDogs = new Set(activeDeadDogPlayerIds);
  const assignments = { ...effectiveRoleAssignments };
  for (const [dogPlayerId, state] of Object.entries(dogWolfStates)) {
    if (assignments[dogPlayerId] !== "a02") continue;
    if (permanentlyDead.has(dogPlayerId) && !activeDeadDogs.has(dogPlayerId)) continue;
    if (state.independentRole) {
      assignments[dogPlayerId] = state.independentRole;
      continue;
    }
    if (state.actorModeActive) {
      assignments[dogPlayerId] = "a04";
      continue;
    }
    const ownerPlayerId = state.ownerPlayerId;
    if (!ownerPlayerId || permanentlyDead.has(ownerPlayerId)) continue;
    const ownerRole = effectiveRoleAssignments[ownerPlayerId];
    if (ownerRole && ownerRole !== "a02") assignments[dogPlayerId] = ownerRole;
  }
  return assignments;
}

export function getDogWolfObjectiveRole(
  dogPlayerId: string,
  effectiveRoleAssignments: Record<string, RoleId>,
  dogWolfStates: DogWolfStates,
): RoleId | null {
  const state = dogWolfStates[dogPlayerId];
  if (state?.objectiveRoleOverride) return state.objectiveRoleOverride;
  const ownerPlayerId = state?.ownerPlayerId;
  return ownerPlayerId ? effectiveRoleAssignments[ownerPlayerId] ?? null : null;
}

export function advanceDogWolfStateForNight(
  state: DogWolfState,
  roleAssignments: Record<string, RoleId>,
  permanentlyDeadPlayerIds: Iterable<string>,
  drunkardReplacementRole: RoleId | null,
): DogWolfState {
  const permanentlyDead = new Set(permanentlyDeadPlayerIds);
  if (
    state.ownerPlayerId
    && permanentlyDead.has(state.ownerPlayerId)
    && !state.actorModeActive
    && !state.independentRole
  ) return state;
  if (
    state.actorModeActive
    && state.actorIdolPlayerId
    && permanentlyDead.has(state.actorIdolPlayerId)
    && !state.independentRole
  ) {
    const copiedRole = roleAssignments[state.actorIdolPlayerId];
    if (copiedRole && copiedRole !== "a04") {
      return {
        ...state,
        actorCopiedRole: copiedRole,
        independentRole: copiedRole === "a01" ? drunkardReplacementRole ?? "a01" : copiedRole,
        objectiveRoleOverride: copiedRole,
        powerState: { ...EMPTY_ACTOR_POWER_STATE },
      };
    }
  }
  if (
    state.adoptiveDadPlayerId
    && permanentlyDead.has(state.adoptiveDadPlayerId)
    && state.independentRole !== "e01"
  ) {
    return {
      ...state,
      independentRole: "e01",
      objectiveRoleOverride: "e01",
      powerState: { ...EMPTY_ACTOR_POWER_STATE },
    };
  }
  return state;
}

export function getDogWolfObjectiveRoleAssignments(
  ownerObjectiveRoleAssignments: Record<string, RoleId>,
  dogWolfStates: DogWolfStates,
): Record<string, RoleId> {
  const assignments = { ...ownerObjectiveRoleAssignments };
  for (const [dogPlayerId, state] of Object.entries(dogWolfStates)) {
    if (assignments[dogPlayerId] !== "a02") continue;
    if (state.objectiveRoleOverride) {
      assignments[dogPlayerId] = state.objectiveRoleOverride;
      continue;
    }
    const ownerRole = state.ownerPlayerId ? assignments[state.ownerPlayerId] : null;
    if (ownerRole && ownerRole !== "a02") assignments[dogPlayerId] = ownerRole;
  }
  return assignments;
}

export function getDogsFollowingOwner(
  ownerPlayerId: string,
  dogWolfStates: DogWolfStates,
  activeDogPlayerIds: Iterable<string>,
): string[] {
  const activeDogs = new Set(activeDogPlayerIds);
  return Object.entries(dogWolfStates)
    .filter(([dogPlayerId, state]) => activeDogs.has(dogPlayerId) && state.ownerPlayerId === ownerPlayerId)
    .map(([dogPlayerId]) => dogPlayerId);
}
