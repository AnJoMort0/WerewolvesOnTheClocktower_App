import type { PlayerStatus } from "@/components/game/PlayerStatusPopover";
import { normalizeStatusEffect, normalizeStatusEffectSet, type StatusEffect } from "@/lib/effects";
import { ROLES, type RoleId } from "@/lib/roles";
import type { WinKind } from "@/lib/i18n";

export type GameLogPhase = "setup" | "night" | "day" | "tribunal" | "game-over";

export type GameLogAction =
  | "phase"
  | "kill"
  | "execute"
  | "resurrect"
  | "poison"
  | "illusion"
  | "effect_add"
  | "role_change"
  | "game_over";

export type GameLogPlayerSnapshot = {
  id: string;
  name: string;
  role: RoleId | null;
  status: PlayerStatus;
  permanentlyDead: boolean;
  poisoned: boolean;
  illusion: boolean;
  effects: StatusEffect[];
};

export type GameLogEvent = {
  id: string;
  createdAt: number;
  phase: GameLogPhase;
  phaseNumber: number;
  action: GameLogAction;
  actor?: GameLogPlayerSnapshot | null;
  actorRole?: RoleId | null;
  target?: GameLogPlayerSnapshot | null;
  secondaryTarget?: GameLogPlayerSnapshot | null;
  source?: string | null;
  effect?: StatusEffect | null;
  title?: string;
  detail?: string;
  participants?: string[];
  winKind?: WinKind;
};

export type GameLogSnapshotPlayer = {
  id: string;
  name: string;
  seat_position: number | null;
  character: string | null;
  is_alive: boolean;
};

export type GameLogSnapshot = {
  events: GameLogEvent[];
  players: GameLogSnapshotPlayer[];
  roleAssignments: Record<string, RoleId>;
  playerStatuses: Record<string, PlayerStatus>;
  permanentlyDead: string[];
  playerEffects: Record<string, StatusEffect[]>;
  poisonedPlayerId: string | null;
  poisonedPlayerIds: string[];
  illusionPlayerId: string | null;
  illusionPlayerIds: string[];
};

export const MAX_GAME_LOG_EVENTS = 500;

function normalizeLogPlayerSnapshot(snapshot: GameLogPlayerSnapshot | null | undefined) {
  if (!snapshot) return snapshot;
  return {
    ...snapshot,
    effects: Array.from(normalizeStatusEffectSet(snapshot.effects)),
  };
}

export function normalizeGameLogEvents(events: readonly GameLogEvent[] | null | undefined): GameLogEvent[] {
  if (!events) return [];
  return events.map((event) => {
    const effect = normalizeStatusEffect(event.effect);
    return {
      ...event,
      actor: normalizeLogPlayerSnapshot(event.actor),
      target: normalizeLogPlayerSnapshot(event.target),
      secondaryTarget: normalizeLogPlayerSnapshot(event.secondaryTarget),
      source: event.source === "soldado" ? "soldier" : event.source,
      ...(event.effect !== undefined ? { effect } : {}),
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizePlayerStatus(value: unknown): PlayerStatus | null {
  return value === "alive" || value === "poisoned" || value === "dead-this-night" || value === "dead"
    ? value
    : null;
}

/** Normalizes the durable, post-game-only snapshot shared with player devices. */
export function normalizeGameLogSnapshot(value: unknown): GameLogSnapshot | null {
  if (!isRecord(value) || !Array.isArray(value.events) || !Array.isArray(value.players)) return null;

  const players = value.players.flatMap<GameLogSnapshotPlayer>((entry) => {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.name !== "string") return [];
    return [{
      id: entry.id,
      name: entry.name,
      seat_position: typeof entry.seat_position === "number" ? entry.seat_position : null,
      character: typeof entry.character === "string" ? entry.character : null,
      is_alive: entry.is_alive !== false,
    }];
  });

  const rawAssignments = isRecord(value.roleAssignments) ? value.roleAssignments : {};
  const roleAssignments = Object.fromEntries(
    Object.entries(rawAssignments).filter((entry): entry is [string, RoleId] => (
      typeof entry[1] === "string" && entry[1] in ROLES
    )),
  );
  const rawStatuses = isRecord(value.playerStatuses) ? value.playerStatuses : {};
  const playerStatuses = Object.fromEntries(
    Object.entries(rawStatuses).flatMap(([playerId, status]) => {
      const normalized = normalizePlayerStatus(status);
      return normalized ? [[playerId, normalized]] : [];
    }),
  );
  const rawEffects = isRecord(value.playerEffects) ? value.playerEffects : {};
  const playerEffects = Object.fromEntries(
    Object.entries(rawEffects).map(([playerId, effects]) => [
      playerId,
      Array.from(normalizeStatusEffectSet(Array.isArray(effects) ? effects : [])),
    ]),
  );
  const stringArray = (entry: unknown) => Array.isArray(entry)
    ? entry.filter((item): item is string => typeof item === "string")
    : [];

  return {
    events: normalizeGameLogEvents(value.events.filter(isRecord) as GameLogEvent[]),
    players,
    roleAssignments,
    playerStatuses,
    permanentlyDead: stringArray(value.permanentlyDead),
    playerEffects,
    poisonedPlayerId: typeof value.poisonedPlayerId === "string" ? value.poisonedPlayerId : null,
    poisonedPlayerIds: stringArray(value.poisonedPlayerIds),
    illusionPlayerId: typeof value.illusionPlayerId === "string" ? value.illusionPlayerId : null,
    illusionPlayerIds: stringArray(value.illusionPlayerIds),
  };
}
