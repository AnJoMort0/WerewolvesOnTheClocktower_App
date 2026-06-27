const PLAYER_SESSION_KEY = "wotct_current_player_session";
const PLAYER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type PlayerSession = {
  playerId: string;
  playerToken: string;
  roomId: string;
  roomCode: string;
  touchedAt: number;
};

function removeLegacyPlayerKeys() {
  if (typeof window === "undefined") return;
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    if (
      key === "player_id"
      || key === "player_token"
      || key === "player_room"
      || key.startsWith("player_id_")
      || key.startsWith("player_token_")
      || key.startsWith("wotct_hidden_")
    ) {
      window.localStorage.removeItem(key);
    }
  }
}

export function getPlayerSession(expected?: { roomId?: string; roomCode?: string }): PlayerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLAYER_SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as PlayerSession;
      const validShape = !!session.playerId && !!session.roomId && typeof session.touchedAt === "number";
      if (!validShape || Date.now() - session.touchedAt > PLAYER_SESSION_TTL_MS) {
        window.localStorage.removeItem(PLAYER_SESSION_KEY);
        return null;
      }
      if (expected?.roomId && session.roomId !== expected.roomId) return null;
      if (expected?.roomCode && session.roomCode && session.roomCode !== expected.roomCode.toUpperCase()) return null;
      if (expected?.roomCode && !session.roomCode) {
        const upgraded = { ...session, roomCode: expected.roomCode.toUpperCase() };
        savePlayerSession(upgraded);
        return upgraded;
      }
      return session;
    }

    // One-time migration from the previous accumulating key layout.
    const roomCode = expected?.roomCode?.toUpperCase() ?? "";
    const roomId = expected?.roomId ?? window.localStorage.getItem("player_room") ?? "";
    const playerId = (roomCode ? window.localStorage.getItem(`player_id_${roomCode}`) : null)
      ?? window.localStorage.getItem("player_id")
      ?? "";
    if (!playerId || !roomId) return null;
    const migrated: PlayerSession = {
      playerId,
      playerToken: window.localStorage.getItem(`player_token_${playerId}`) ?? "",
      roomId,
      roomCode,
      touchedAt: Date.now(),
    };
    savePlayerSession(migrated);
    return migrated;
  } catch {
    window.localStorage.removeItem(PLAYER_SESSION_KEY);
    return null;
  }
}

export function savePlayerSession(session: Omit<PlayerSession, "touchedAt"> | PlayerSession) {
  if (typeof window === "undefined") return;
  removeLegacyPlayerKeys();
  window.localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify({
    ...session,
    roomCode: session.roomCode.toUpperCase(),
    touchedAt: Date.now(),
  }));
}

export function touchPlayerSession(playerId: string) {
  const session = getPlayerSession();
  if (!session || session.playerId !== playerId) return;
  window.localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify({ ...session, touchedAt: Date.now() }));
}

export function clearPlayerSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLAYER_SESSION_KEY);
  removeLegacyPlayerKeys();
}

export function cleanupObsoleteGameStorage() {
  if (typeof window === "undefined") return;
  getPlayerSession();
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("gm_token_")) window.localStorage.removeItem(key);
  }
  removeLegacyPlayerKeys();
}
