import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareLanStorage, unlockLanHost } from "@/lib/lanMode";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  history.replaceState(null, "", "/");
  window.__WOTCT_LAN__ = { host: true, joinBaseUrl: "http://192.168.1.25:8080" };
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals();
  delete window.__WOTCT_LAN__;
});

describe("LAN host recovery", () => {
  it("restores only game backups missing from the browser, preserving newer browser state and player identity", async () => {
    localStorage.setItem("wotct_gm_snapshot_room", "newer browser value");
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({
      wotct_gm_snapshot_room: "older server value", wotct_phone_room: "phone state", wotct_current_player_session: "private player identity",
    }) });
    await prepareLanStorage();
    expect(localStorage.getItem("wotct_gm_snapshot_room")).toBe("newer browser value");
    expect(localStorage.getItem("wotct_phone_room")).toBe("phone state");
    expect(localStorage.getItem("wotct_current_player_session")).toBeNull();
  });

  it("backs up only the active GM room and does not overwrite host backups from a player screen", async () => {
    localStorage.setItem("wotct_gm_snapshot_room", "current");
    localStorage.setItem("wotct_gm_snapshot_other", "stale restored value");
    localStorage.setItem("wotct_runtime_room", "runtime");
    history.replaceState(null, "", "/play/player");
    await prepareLanStorage();
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    history.replaceState(null, "", "/gm/room");
    await vi.advanceTimersByTimeAsync(2000);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ wotct_gm_snapshot_room: "current", wotct_runtime_room: "runtime" });
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats an unavailable server during GM unlocking as a recoverable failure", async () => {
    window.__WOTCT_LAN__!.host = false;
    fetchMock.mockRejectedValueOnce(new Error("Connection lost"));
    expect(await unlockLanHost("123456")).toBe(false);
    expect(window.__WOTCT_LAN__!.host).toBe(false);
  });
});
