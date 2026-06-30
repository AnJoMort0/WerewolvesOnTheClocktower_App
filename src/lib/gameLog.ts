import type { PlayerStatus, StatusEffect } from "@/components/game/PlayerStatusPopover";
import type { RoleId } from "@/lib/roles";
import type { WinKind } from "@/lib/i18n";

export type GameLogPhase = "setup" | "night" | "day" | "tribunal" | "game-over";

export type GameLogAction =
  | "phase"
  | "kill"
  | "execute"
  | "permanent_death"
  | "resurrect"
  | "poison"
  | "cure_poison"
  | "illusion"
  | "clear_illusion"
  | "effect_add"
  | "effect_remove"
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
