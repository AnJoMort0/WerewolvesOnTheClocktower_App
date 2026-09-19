import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLanClient } from "@/integrations/lan/client";
import { savePlayerSession } from "@/lib/playerSession";

class Stream {
  static instances: Stream[] = [];
  onopen?: () => void;
  onerror?: () => void;
  onmessage?: (message: { data: string }) => void;
  close = vi.fn();
  constructor(readonly url: string) { Stream.instances.push(this); }
  receive(message: unknown) { this.onmessage?.({ data: JSON.stringify(message) }); }
}
const fetchMock = vi.fn();
beforeEach(() => {
  localStorage.clear();
  Stream.instances = [];
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ data: null, error: null }) });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("EventSource", Stream);
});
afterEach(() => vi.unstubAllGlobals());

describe("LAN browser transport", () => {
  it("executes discarded mutations and awaited mutations exactly once after filters are added", async () => {
    const client = createLanClient();
    void client.from("players").update({ is_ready: true }).eq("id", "alice");
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ table: "players", operation: "update", filters: [["id", "alice"]] });
    await client.from("rooms").insert({ code: "ABCDE" }).select().single();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ operation: "insert", columns: "*", cardinality: "single" });
  });

  it("attaches the current player identity and returns connection failures without losing the identity", async () => {
    savePlayerSession({ playerId: "alice", playerToken: "secret", roomId: "room", roomCode: "ABCDE" });
    const client = createLanClient();
    fetchMock.mockRejectedValueOnce(new Error("Offline"));
    const result = await client.from("players").select().eq("id", "alice").maybeSingle();
    expect(result.error?.message).toBe("Offline");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).player.playerToken).toBe("secret");
    expect(localStorage.getItem("wotct_current_player_session")).not.toBeNull();
  });

  it("shares one stream, filters private broadcasts and deleted rows, and resubscribes on reconnect", async () => {
    const client = createLanClient();
    const first = vi.fn(), second = vi.fn(), deleted = vi.fn(), status = vi.fn();
    const alice = client.channel("phone-room-alice").on("broadcast", { event: "state" }, first).subscribe(status);
    const bob = client.channel("phone-room-bob").on("broadcast", { event: "state" }, second).subscribe();
    const rows = client.channel("own-player").on("postgres_changes", { event: "DELETE", schema: "public", table: "players", filter: "id=eq.alice" }, deleted).subscribe();
    expect(Stream.instances).toHaveLength(1);
    const stream = Stream.instances[0];
    stream.onopen?.();
    stream.receive({ type: "broadcast", topic: "phone-room-alice", event: "state", payload: { session: "monkey" } });
    expect(first).toHaveBeenCalledWith({ payload: { session: "monkey" } });
    expect(second).not.toHaveBeenCalled();
    stream.receive({ type: "postgres_changes", table: "players", eventType: "DELETE", new: {}, old: { id: "bob" } });
    expect(deleted).not.toHaveBeenCalled();
    stream.receive({ type: "postgres_changes", table: "players", eventType: "DELETE", new: {}, old: { id: "alice" } });
    expect(deleted).toHaveBeenCalledTimes(1);
    stream.onerror?.(); stream.onopen?.();
    expect(status.mock.calls.map(call => call[0])).toEqual(["SUBSCRIBED", "CHANNEL_ERROR", "SUBSCRIBED"]);
    await client.removeChannel(alice); await client.removeChannel(bob);
    expect(stream.close).not.toHaveBeenCalled();
    await client.removeChannel(rows);
    expect(stream.close).toHaveBeenCalledTimes(1);
  });

  it("replays a reveal for a newly mounted channel and sends actions without subscribing another stream", async () => {
    const client = createLanClient(), revealed = vi.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { type: "broadcast", topic: "mime-reveal-room", event: "mime-reveal", payload: { show: true } }, error: null }) });
    const channel = client.channel("mime-reveal-room").on("broadcast", { event: "mime-reveal" }, revealed).subscribe();
    await vi.waitFor(() => expect(revealed).toHaveBeenCalledWith({ payload: { show: true } }));
    await client.channel("phone-room-alice").send({ type: "broadcast", event: "request", payload: { type: "confirm" } });
    expect(Stream.instances).toHaveLength(1);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/lan/broadcast");
    await client.removeChannel(channel);
  });
});
