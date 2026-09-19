// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { connect } from "node:net";
import { once } from "node:events";
import { createLanServer } from "../../../server/lan/server.mjs";

let root: string;
let lan: ReturnType<typeof createLanServer>;
let base: string;
const streams: AbortController[] = [];

async function start() {
  lan = createLanServer({ distDir: resolve(root, "dist"), dataDir: resolve(root, "data"), joinBaseUrl: () => base, pin: "123456", localHostAccess: false });
  await new Promise<void>(done => lan.server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${(lan.server.address() as { port: number }).port}`;
}

async function device(host = false) {
  const config = await fetch(`${base}/api/lan/config.js`);
  const cookie = config.headers.get("set-cookie")!.split(";")[0];
  const request = async (path: string, body: object) => {
    const response = await fetch(`${base}/api/lan/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie, Origin: base }, body: JSON.stringify(body) });
    return { status: response.status, ...await response.json() };
  };
  if (host) expect((await request("host", { pin: "123456" })).status).toBe(200);
  return { cookie, request, query: (body: object) => request("query", body) };
}
const room = async (gm: Awaited<ReturnType<typeof device>>, code = "ABCDE") => (await gm.query({ table: "rooms", operation: "insert", values: { code, language: "en" }, cardinality: "single" })).data;
const player = async (phone: Awaited<ReturnType<typeof device>>, roomId: string, name: string) => (await phone.query({ table: "players", operation: "insert", values: { room_id: roomId, name }, cardinality: "single" })).data;

async function listen(phone: Awaited<ReturnType<typeof device>>, clientId: string) {
  const controller = new AbortController();
  streams.push(controller);
  const response = await fetch(`${base}/api/lan/events?clientId=${clientId}`, { headers: { Cookie: phone.cookie }, signal: controller.signal });
  expect(response.status).toBe(200);
  const reader = response.body!.getReader();
  const messages: Record<string, unknown>[] = [];
  let buffer = "";
  void (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += new TextDecoder().decode(value);
        let end: number;
        while ((end = buffer.indexOf("\n\n")) !== -1) {
          const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
          if (line.startsWith("data: ")) messages.push(JSON.parse(line.slice(6)));
        }
      }
    } catch { /* Stream intentionally aborted during cleanup. */ }
  })();
  return messages;
}

beforeEach(async () => {
  root = mkdtempSync(resolve(tmpdir(), "wotct-lan-test-"));
  mkdirSync(resolve(root, "dist"));
  writeFileSync(resolve(root, "dist/index.html"), '<html><head></head><body><script type="module" src="/assets/app.js"></script></body></html>');
  await start();
});
afterEach(async () => {
  for (const stream of streams.splice(0)) stream.abort();
  await lan.close();
  if (!root.startsWith(resolve(tmpdir(), "wotct-lan-test-"))) throw new Error("Unexpected test directory");
  rmSync(root, { recursive: true, force: true });
});

describe("offline LAN server", () => {
  it("stops with connected phones and an unfinished request, preserving the room for restart", async () => {
    const gm = await device(true), phone = await device();
    const game = await room(gm);
    await listen(phone, "e".repeat(32));
    const socket = connect((lan.server.address() as { port: number }).port, "127.0.0.1");
    socket.on("error", () => {});
    try {
      await once(socket, "connect");
      const received = once(lan.server, "request");
      socket.write("POST /api/lan/query HTTP/1.1\r\nHost: localhost\r\nContent-Length: 100\r\n\r\n{");
      await received;
      await lan.close();
    } finally { socket.destroy(); }
    await start();
    const restoredGM = await device(true);
    expect((await restoredGM.query({ table: "rooms", filters: [["id", game.id]], cardinality: "single" })).data.id).toBe(game.id);
  });

  it("serves direct routes with LAN configuration before the app, without a cloud account", async () => {
    const response = await fetch(`${base}/gm/room`);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html.indexOf("window.__WOTCT_LAN__")).toBeGreaterThan(-1);
    expect(html.indexOf("window.__WOTCT_LAN__")).toBeLessThan(html.indexOf('type="module"'));
    expect((await fetch(`${base}/api/lan/config.js`)).headers.get("cache-control")).toBe("no-store");
  });

  it("requires GM access and protects game state while allowing joining and readiness", async () => {
    const gm = await device(true), phone = await device(), other = await device();
    expect((await phone.query({ table: "rooms", operation: "insert", values: { code: "ABCDE" } })).status).toBe(403);
    const game = await room(gm);
    expect((await gm.query({ table: "rooms", operation: "insert", values: { code: "ABCDE" } })).error.code).toBe("23505");
    const alice = await player(phone, game.id, "Alice");
    const bob = await player(other, game.id, "Bob");
    expect((await phone.query({ table: "players", operation: "update", filters: [["id", alice.id]], values: { is_ready: true } })).error).toBeNull();
    expect((await phone.query({ table: "players", operation: "update", filters: [["id", bob.id]], values: { is_alive: false } })).status).toBe(403);
    expect((await phone.query({ table: "rooms", operation: "update", filters: [["id", game.id]], values: { status: "finished" } })).status).toBe(403);
    expect((await gm.query({ table: "players", operation: "update", filters: [["id", alice.id]], values: { character: "v26", seat_position: 1 } })).error).toBeNull();
    const own = await phone.query({ table: "players", operation: "select", filters: [["id", alice.id]], columns: "character,is_ready", cardinality: "single" });
    expect(own.data).toEqual({ character: "v26", is_ready: true });
    await gm.query({ table: "rooms", operation: "update", filters: [["id", game.id]], values: { status: "playing" } });
    expect((await phone.query({ table: "players", operation: "insert", values: { room_id: game.id, name: "Late" } })).status).toBe(403);
    expect((await phone.query({ table: "players", operation: "select", filters: [["id", "missing"]], cardinality: "maybeSingle" })).data).toBeNull();
  });

  it("relays phone actions and reveals through room-scoped streams, skips the sender and blocks forged GM messages", async () => {
    const gm = await device(true), phone = await device(), outsider = await device();
    const game = await room(gm), anotherGame = await room(gm, "FGHIJ");
    const alice = await player(phone, game.id, "Alice");
    await player(outsider, anotherGame.id, "Other table");
    const gmId = "a".repeat(32), phoneId = "b".repeat(32);
    const gmMessages = await listen(gm, gmId), phoneMessages = await listen(phone, phoneId), outsiderMessages = await listen(outsider, "c".repeat(32));
    const topic = `phone-${game.id}-${alice.id}`;
    expect((await phone.request("broadcast", { topic, event: "request", payload: { type: "confirm" }, clientId: phoneId })).error).toBeNull();
    await expect.poll(() => gmMessages.filter(message => message.type === "broadcast").length).toBe(1);
    expect(phoneMessages).toHaveLength(0);
    expect(outsiderMessages).toHaveLength(0);
    expect((await phone.request("broadcast", { topic, event: "state", payload: {} })).status).toBe(403);
    const payload = { revision: 1, session: { mode: "monkey", monkeyReveal: { roleId: "e01", evil: true } } };
    await gm.request("broadcast", { topic, event: "state", payload, clientId: gmId });
    await expect.poll(() => phoneMessages.length).toBe(1);
    expect(phoneMessages[0].payload).toEqual(payload);
    expect((await phone.request("replay", { topic })).data.payload).toEqual(payload);
    expect((await outsider.request("replay", { topic })).data).toBeNull();
  });

  it("merges simultaneous day requests without losing another player's request or changing charge counts", async () => {
    const gm = await device(true), phone = await device(), other = await device();
    const game = await room(gm), alice = await player(phone, game.id, "Alice"), bob = await player(other, game.id, "Bob");
    const send = (sender: Awaited<ReturnType<typeof device>>, actor: string, id: string) => sender.query({ table: "rooms", operation: "update", filters: [["id", game.id]], values: { player_action_state: { version: 1, powerUses: { v10: { [actor]: 999 } }, requests: [{ id, kind: "v10-assassinate", actorPlayerId: actor, targetPlayerId: bob.id }] } } });
    const results = await Promise.all([send(phone, alice.id, "one"), send(other, bob.id, "two")]);
    expect(results.every(result => !result.error)).toBe(true);
    const latest = await gm.query({ table: "rooms", filters: [["id", game.id]], cardinality: "single" });
    expect(latest.data.player_action_state.requests.map(request => request.id).sort()).toEqual(["one", "two"]);
    expect(latest.data.player_action_state.powerUses).toEqual({});
    await send(phone, alice.id, "one");
    expect((await gm.query({ table: "rooms", filters: [["id", game.id]], cardinality: "single" })).data.player_action_state.requests).toHaveLength(2);
  });

  it("persists rooms, phone state and GM backups across a server restart and restores player permissions from their token", async () => {
    const gm = await device(true), phone = await device();
    const game = await room(gm), alice = await player(phone, game.id, "Alice");
    const topic = `phone-${game.id}-${alice.id}`;
    await gm.request("broadcast", { topic, event: "state", payload: { revision: 10, session: { mode: "hunt" } } });
    await gm.request("snapshots", { [`wotct_gm_snapshot_${game.id}`]: JSON.stringify({ version: 1, nightNumber: 2 }), wotct_current_player_session: "never back this up" });
    await lan.close();
    await start();
    const restoredPhone = await device(), restoredGM = await device(true);
    const credentials = { playerId: alice.id, playerToken: alice.player_token };
    expect((await restoredPhone.query({ table: "players", operation: "update", filters: [["id", alice.id]], values: { is_ready: true }, player: credentials })).error).toBeNull();
    expect((await restoredPhone.request("replay", { topic, player: credentials })).data.payload.revision).toBe(10);
    const snapshots = await fetch(`${base}/api/lan/snapshots`, { headers: { Cookie: restoredGM.cookie } }).then(response => response.json());
    expect(Object.keys(snapshots)).toEqual([`wotct_gm_snapshot_${game.id}`]);
    expect(JSON.parse(readFileSync(lan.databaseFile, "utf8")).players).toHaveLength(1);
  });

  it("deletes players with complete old-row events and rejects foreign origins and path traversal", async () => {
    const gm = await device(true), phone = await device();
    const game = await room(gm), alice = await player(phone, game.id, "Alice");
    const messages = await listen(phone, "d".repeat(32));
    await gm.query({ table: "players", operation: "delete", filters: [["id", alice.id]] });
    await expect.poll(() => messages.length).toBe(1);
    expect(messages[0]).toMatchObject({ eventType: "DELETE", new: {}, old: { id: alice.id, room_id: game.id } });
    expect((await fetch(`${base}/api/lan/query`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://foreign.example" }, body: "{}" })).status).toBe(403);
    expect((await fetch(`${base}/..%2f..%2fpackage.json`)).status).toBe(403);
  });
});
