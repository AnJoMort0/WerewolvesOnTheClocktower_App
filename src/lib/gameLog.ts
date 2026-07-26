import type { PlayerStatus } from "@/components/game/PlayerStatusPopover";
import { normalizeStatusEffect, normalizeStatusEffectSet, type StatusEffect } from "@/lib/effects";
import type { RoleId } from "@/lib/roles";
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
