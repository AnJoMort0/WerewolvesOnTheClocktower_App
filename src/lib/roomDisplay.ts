import type { PlayerStatus, StatusEffect } from "@/components/game/PlayerStatusPopover";
import type { GameLogEvent } from "@/lib/gameLog";
import type { Language, WinKind } from "@/lib/i18n";
import type { RoleId } from "@/lib/roles";

export const ROOM_DISPLAY_STORAGE_PREFIX = "wotct_room_display_";
export const ROOM_DISPLAY_SNAPSHOT_VERSION = 1;

export type RoomDisplayPlayer = {
  id: string;
  name: string;
  seat_position: number | null;
  character: string | null;
  is_alive: boolean;
};

export type RoomDisplaySnapshot = {
  version: typeof ROOM_DISPLAY_SNAPSHOT_VERSION;
  updatedAt: number;
  roomId: string;
  roomCode: string;
  language: Language;
  status: string;
  players: RoomDisplayPlayer[];
  phase: "night" | "day" | "tribunal";
  phaseNumber: number;
  timerState: {
    phase: "day" | "tribunal";
    timeLeft: number;
    isRunning: boolean;
    timerDone: boolean;
  } | null;
  roleAssignments: Record<string, RoleId>;
  playerStatuses: Record<string, PlayerStatus>;
  permanentlyDead: string[];
  playerEffects: Record<string, StatusEffect[]>;
  poisonedPlayerId: string | null;
  poisonedPlayerIds?: string[];
  illusionPlayerId: string | null;
  illusionPlayerIds?: string[];
  gameLogEvents: GameLogEvent[];
  gameOver: { id: string; kind: WinKind } | null;
};

export function getRoomDisplayStorageKey(roomId: string) {
  return `${ROOM_DISPLAY_STORAGE_PREFIX}${roomId}`;
}

export function readRoomDisplaySnapshot(roomId: string): RoomDisplaySnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getRoomDisplayStorageKey(roomId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<RoomDisplaySnapshot>;
    if (value.version !== ROOM_DISPLAY_SNAPSHOT_VERSION || value.roomId !== roomId) return null;
    return value as RoomDisplaySnapshot;
  } catch {
    return null;
  }
}
