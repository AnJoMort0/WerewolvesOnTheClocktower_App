import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupObsoleteGameStorage,
  getPlayerSession,
  savePlayerSession,
  touchPlayerSession,
} from "@/lib/playerSession";

const SESSION_KEY = "wotct_current_player_session";

describe("playerSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores only one current player session and removes legacy per-room keys", () => {
    window.localStorage.setItem("player_id_OLDROOM", "old-player");
    window.localStorage.setItem("player_token_old-player", "old-token");

    savePlayerSession({
      playerId: "player-1",
      playerToken: "token-1",
      roomId: "room-1",
      roomCode: "abcd",
    });

    expect(getPlayerSession()).toMatchObject({
      playerId: "player-1",
      playerToken: "token-1",
      roomId: "room-1",
      roomCode: "ABCD",
    });
    expect(window.localStorage.getItem("player_id_OLDROOM")).toBeNull();
    expect(window.localStorage.getItem("player_token_old-player")).toBeNull();
  });

  it("expires a session after 24 hours", () => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({
      playerId: "player-1",
      playerToken: "token-1",
      roomId: "room-1",
      roomCode: "ABCD",
      touchedAt: Date.now() - (24 * 60 * 60 * 1000) - 1,
    }));

    expect(getPlayerSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("refreshes the active session timestamp", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(100).mockReturnValue(200);
    savePlayerSession({
      playerId: "player-1",
      playerToken: "token-1",
      roomId: "room-1",
      roomCode: "ABCD",
    });
    touchPlayerSession("player-1");

    expect(JSON.parse(window.localStorage.getItem(SESSION_KEY) || "{}").touchedAt).toBe(200);
  });

  it("removes obsolete GM tokens during new-game cleanup", () => {
    window.localStorage.setItem("gm_token_old-room", "unused");
    window.localStorage.setItem("preferred_language", "fr");

    cleanupObsoleteGameStorage();

    expect(window.localStorage.getItem("gm_token_old-room")).toBeNull();
    expect(window.localStorage.getItem("preferred_language")).toBe("fr");
  });
});
