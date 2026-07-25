import type { RoleId } from "@/lib/roles";

export const PLAYER_ACTION_STATE_VERSION = 1;

export type PlayerActionKind = "v10-assassinate";

export type PlayerActionRequest = {
  id: string;
  kind: PlayerActionKind;
  actorPlayerId: string;
  targetPlayerId: string;
  requestedAt: number;
};

export type PlayerActionState = {
  version: typeof PLAYER_ACTION_STATE_VERSION;
  requests: PlayerActionRequest[];
  powerUses: Partial<Record<RoleId, Record<string, number>>>;
};

const EMPTY_PLAYER_ACTION_STATE: PlayerActionState = {
  version: PLAYER_ACTION_STATE_VERSION,
  requests: [],
  powerUses: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeRequests(value: unknown): PlayerActionRequest[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((request): PlayerActionRequest[] => {
    if (!isRecord(request)) return [];
    if (request.kind !== "v10-assassinate") return [];
    if (typeof request.actorPlayerId !== "string" || typeof request.targetPlayerId !== "string") return [];
    const requestedAt = typeof request.requestedAt === "number" ? request.requestedAt : Date.now();
    const id = typeof request.id === "string" && request.id.trim()
      ? request.id
      : createPlayerActionRequestId(request.actorPlayerId, request.targetPlayerId, requestedAt);
    return [{
      id,
      kind: request.kind,
      actorPlayerId: request.actorPlayerId,
      targetPlayerId: request.targetPlayerId,
      requestedAt,
    }];
  });
}

function normalizePowerUses(value: unknown): PlayerActionState["powerUses"] {
  if (!isRecord(value)) return {};
  const normalized: PlayerActionState["powerUses"] = {};
  for (const [roleId, usesByPlayer] of Object.entries(value)) {
    if (!isRecord(usesByPlayer)) continue;
    const entries = Object.entries(usesByPlayer)
      .filter(([, uses]) => typeof uses === "number" && Number.isFinite(uses))
      .map(([playerId, uses]) => [playerId, Math.max(0, Math.floor(uses as number))] as const);
    if (entries.length > 0) {
      normalized[roleId as RoleId] = Object.fromEntries(entries);
    }
  }
  return normalized;
}

export function normalizePlayerActionState(value: unknown): PlayerActionState {
  if (!isRecord(value)) return { ...EMPTY_PLAYER_ACTION_STATE };
  return {
    version: PLAYER_ACTION_STATE_VERSION,
    requests: normalizeRequests(value.requests),
    powerUses: normalizePowerUses(value.powerUses),
  };
}

export function createPlayerActionRequestId(actorPlayerId: string, targetPlayerId: string, requestedAt = Date.now()) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${requestedAt}-${actorPlayerId}-${targetPlayerId}-${random}`;
}

export function createPlayerActionRequest(
  kind: PlayerActionKind,
  actorPlayerId: string,
  targetPlayerId: string,
  requestedAt = Date.now(),
): PlayerActionRequest {
  return {
    id: createPlayerActionRequestId(actorPlayerId, targetPlayerId, requestedAt),
    kind,
    actorPlayerId,
    targetPlayerId,
    requestedAt,
  };
}

export function upsertPowerUses(
  state: PlayerActionState,
  roleId: RoleId,
  usesByPlayerId: Record<string, number>,
): PlayerActionState {
  return {
    ...state,
    powerUses: {
      ...state.powerUses,
      [roleId]: Object.fromEntries(
        Object.entries(usesByPlayerId).map(([playerId, uses]) => [playerId, Math.max(0, Math.floor(uses))]),
      ),
    },
  };
}

export function removePlayerActionRequest(state: PlayerActionState, requestId: string): PlayerActionState {
  return {
    ...state,
    requests: state.requests.filter((request) => request.id !== requestId),
  };
}
