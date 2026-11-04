// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { connect } from "node:net";
import { once } from "node:events";
import { PHONE_MODE } from "@/lib/phoneActionModes";
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
  vi.restoreAllMocks();
  for (const stream of streams.splice(0)) stream.abort();
  await lan.close();
  if (!root.startsWith(resolve(tmpdir(), "wotct-lan-test-"))) throw new Error("Unexpected test directory");
  rmSync(root, { recursive: true, force: true });
});

describe("offline LAN server", () => {
  it("lets phones read server time but limits timer mutations to the GM", async () => {
    const gm = await device(true), phone = await device();
    const game = await room(gm);
    const clock = await phone.request("rpc", { name: "get_server_time" });
    expect(clock.status).toBe(200);
    expect(Math.abs(clock.data - Date.now())).toBeLessThan(5_000);
    const denied = await phone.request("rpc", { name: "transition_room_timer", args: {
      p_room_id: game.id, p_action: "set_phase", p_expected_revision: 0,
      p_mutation_id: "phase-1", p_phase: "day", p_phase_number: 1, p_beginner_mode: false,
    } });
    expect(denied.status).toBe(403);
    expect((await gm.query({ table: "rooms", filters: [["id", game.id]], cardinality: "single" })).data.timer_state).toBeNull();
  });

  it("writes phase and timer atomically, ignores duplicates, and rejects stale revisions", async () => {
    const gm = await device(true), phone = await device();
    const game = await room(gm);
    await player(phone, game.id, "Alice");
    const messages = await listen(phone, "f".repeat(32));
    const run = (args: object) => gm.request("rpc", { name: "transition_room_timer", args: { p_room_id: game.id, ...args } });
    const first = await run({ p_action: "set_phase", p_expected_revision: 0,
      p_mutation_id: "phase-day", p_phase: "day", p_phase_number: 1, p_beginner_mode: false });
    expect(first.data).toMatchObject({ changed: true, phaseState: { phase: "day", number: 1 },
      timerState: { version: 2, revision: 1, phase: "day", status: "paused", remainingMs: 300_000 } });
    await expect.poll(() => messages.length).toBe(1);
    expect(messages[0]).toMatchObject({ type: "postgres_changes", eventType: "UPDATE",
      new: { phase_state: { phase: "day", number: 1 }, timer_state: { phase: "day", revision: 1 } } });
    expect((await run({ p_action: "set_phase", p_expected_revision: 0,
      p_mutation_id: "phase-day", p_phase: "day", p_phase_number: 1, p_beginner_mode: false })).data.changed).toBe(false);
    expect((await run({ p_action: "set_phase", p_expected_revision: 0,
      p_mutation_id: "old-phase", p_phase: "tribunal", p_phase_number: 1, p_beginner_mode: false })).status).toBe(409);
    expect((await run({ p_action: "set_phase", p_expected_revision: 1,
      p_mutation_id: "same-phase", p_phase: "day", p_phase_number: 1, p_beginner_mode: false })).data.changed).toBe(false);
    expect(messages).toHaveLength(1);

    const mode = await run({ p_action: "set_phase", p_expected_revision: 1,
      p_mutation_id: "mode-on", p_phase: "day", p_phase_number: 1, p_beginner_mode: true });
    expect(mode.data).toMatchObject({ changed: true, phaseState: { beginnerMode: true },
      timerState: { phase: "day", revision: 2, status: "paused", remainingMs: 300_000 } });
    expect((await run({ p_action: "set_phase", p_expected_revision: 1,
      p_mutation_id: "mode-off-stale", p_phase: "day", p_phase_number: 1, p_beginner_mode: false })).status).toBe(409);
    const tribunal = await run({ p_action: "set_phase", p_expected_revision: 2,
      p_mutation_id: "tribunal", p_phase: "tribunal", p_phase_number: 1, p_beginner_mode: true });
    expect(tribunal.data).toMatchObject({ changed: true, phaseState: { phase: "tribunal" },
      timerState: { phase: "tribunal", revision: 3, status: "paused", remainingMs: 180_000 } });
    await expect.poll(() => messages.length).toBe(3);
    expect(messages[2]).toMatchObject({ new: { phase_state: { phase: "tribunal" }, timer_state: { phase: "tribunal" } } });
    expect((await gm.query({ table: "rooms", filters: [["id", game.id]], cardinality: "single" })).data.timer_state).toEqual(tribunal.data.timerState);
  });

  it("uses server deadlines for pause, resume and completion with no tick writes", async () => {
    const gm = await device(true), phone = await device();
    const game = await room(gm);
    await player(phone, game.id, "Alice");
    const messages = await listen(phone, "1".repeat(32));
    const run = (action: string, revision: number, id: string, extra: object = {}) => gm.request("rpc", {
      name: "transition_room_timer", args: { p_room_id: game.id, p_action: action,
        p_expected_revision: revision, p_mutation_id: id, p_phase: "day", p_phase_number: 1,
        p_beginner_mode: false, ...extra },
    });
    const clock = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    await run("set_phase", 0, "phase");
    const started = await run("start", 1, "start");
    expect(started.data).toMatchObject({ changed: true, serverNowMs: 1_000_000,
      timerState: { revision: 2, status: "running", remainingMs: 300_000,
        deadlineAt: new Date(1_300_000).toISOString() } });
    await expect.poll(() => messages.length).toBe(2);
    clock.mockReturnValue(1_006_500);
    expect((await run("complete", 2, "too-early")).data.changed).toBe(false);
    const paused = await run("pause", 2, "pause");
    expect(paused.data.timerState).toMatchObject({ revision: 3, status: "paused", remainingMs: 293_500, deadlineAt: null });
    clock.mockReturnValue(1_100_000);
    const resumed = await run("start", 3, "resume");
    expect(resumed.data.timerState).toMatchObject({ revision: 4, status: "running", remainingMs: 293_500,
      deadlineAt: new Date(1_393_500).toISOString() });
    clock.mockReturnValue(1_393_500);
    const completed = await run("complete", 4, "complete");
    expect(completed.data.timerState).toMatchObject({ revision: 5, status: "done", remainingMs: 0, deadlineAt: null });
    expect((await run("complete", 4, "complete")).data.changed).toBe(false);
    await expect.poll(() => messages.length).toBe(5);
    clock.mockReturnValue(1_500_000);
    expect((await gm.query({ table: "rooms", filters: [["id", game.id]], cardinality: "single" })).data.timer_state.status).toBe("done");
    expect(messages).toHaveLength(5);
    expect(JSON.parse(readFileSync(lan.databaseFile, "utf8")).rooms[0].timer_state.status).toBe("done");
  });

  it("updates duration and timer together, makes unchanged resets free, and serializes conflicting commands", async () => {
    const gm = await device(true);
    const game = await room(gm);
    const run = (action: string, revision: number, id: string, extra: object = {}) => gm.request("rpc", {
      name: "transition_room_timer", args: { p_room_id: game.id, p_action: action,
        p_expected_revision: revision, p_mutation_id: id, p_phase: "day", p_phase_number: 1,
        p_beginner_mode: false, ...extra },
    });
    await run("set_phase", 0, "phase");
    const defaultOnly = await run("set_duration", 1, "default-only", { p_duration_seconds: 300 });
    expect(defaultOnly.data).toMatchObject({ changed: true, timerDefaults: { day: 300 },
      timerState: { revision: 2, status: "paused", remainingMs: 300_000 } });
    expect((await run("start", 1, "stale-after-default")).status).toBe(409);
    const duration = await run("set_duration", 2, "duration", { p_duration_seconds: 90 });
    expect(duration.data).toMatchObject({ changed: true, timerDefaults: { day: 90 },
      timerState: { revision: 3, status: "paused", remainingMs: 90_000 } });
    expect((await run("reset", 3, "same-reset")).data.changed).toBe(false);
    expect((await run("set_duration", 3, "same-duration", { p_duration_seconds: 90 })).data.changed).toBe(false);
    const [first, second] = await Promise.all([run("start", 3, "start-a"), run("start", 3, "start-b")]);
    expect([first.status, second.status].sort()).toEqual([200, 409]);
    const saved = (await gm.query({ table: "rooms", filters: [["id", game.id]], cardinality: "single" })).data;
    expect(saved.timer_defaults.day).toBe(90);
    expect(saved.timer_state).toMatchObject({ revision: 4, status: "running" });
    expect((await run("pause", 4, "wrong-phase", { p_phase: "tribunal" })).error.message).toBe("TIMER_PHASE_MISMATCH");
    expect((await run("set_duration", 4, "bad-duration", { p_duration_seconds: 0 })).error.message).toBe("TIMER_INVALID_DURATION");
    const editedWhileRunning = await run("set_duration", 4, "shorter", { p_duration_seconds: 60 });
    expect(editedWhileRunning.data).toMatchObject({ timerDefaults: { day: 60 },
      timerState: { revision: 5, status: "paused", remainingMs: 60_000 } });
    await run("start", 5, "restart");
    expect((await run("reset", 6, "reset")).data.timerState).toMatchObject({
      revision: 7, status: "paused", remainingMs: 60_000,
    });
    const night = await run("set_phase", 7, "night", { p_phase: "night", p_phase_number: 2 });
    expect(night.data).toMatchObject({ phaseState: { phase: "night", number: 2 },
      timerState: { revision: 8, phase: "night", status: "inactive", remainingMs: 0 } });
    expect((await run("start", 8, "old-day")).error.message).toBe("TIMER_PHASE_MISMATCH");
  });

  it("keeps a running server deadline across a LAN server restart", async () => {
    const gm = await device(true);
    const game = await room(gm);
    const args = { p_room_id: game.id, p_phase: "day", p_phase_number: 1, p_beginner_mode: false };
    await gm.request("rpc", { name: "transition_room_timer", args: {
      ...args, p_action: "set_phase", p_expected_revision: 0, p_mutation_id: "phase",
    } });
    const running = await gm.request("rpc", { name: "transition_room_timer", args: {
      ...args, p_action: "start", p_expected_revision: 1, p_mutation_id: "start",
    } });
    await lan.close();
    await start();
    const restoredGM = await device(true);
    const restored = (await restoredGM.query({ table: "rooms", filters: [["id", game.id]], cardinality: "single" })).data;
    expect(restored.timer_state).toEqual(running.data.timerState);
    expect(Date.parse(restored.timer_state.deadlineAt)).toBeGreaterThan(Date.now());
  });
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
    const late = (await phone.query({
      table: "players",
      operation: "insert",
      values: { room_id: game.id, name: "Late", is_traveller: true, traveller_state: "requested" },
      cardinality: "single",
    })).data;
    expect(late).toMatchObject({ is_traveller: true, traveller_state: "requested", traveller_role: null });
    expect((await phone.query({ table: "players", operation: "update", filters: [["id", late.id]], values: { traveller_state: "ready" } })).status).toBe(403);
    await gm.query({
      table: "players",
      operation: "update",
      filters: [["id", late.id]],
      values: { traveller_state: "revealing", traveller_role: "t04", traveller_alignment: "evil", character: "t04" },
    });
    expect((await phone.query({ table: "players", operation: "update", filters: [["id", late.id]], values: { traveller_state: "ready" } })).error).toBeNull();
    for (const role of ["t04", "t05", "t99"]) {
      expect((await gm.query({ table: "players", operation: "update", filters: [["id", late.id]], values: { traveller_role: role } })).error).toBeNull();
    }
    expect((await other.query({ table: "players", operation: "update", filters: [["id", late.id]], values: { traveller_state: "ready" } })).status).toBe(403);
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
    const payload = { revision: 1, session: { mode: PHONE_MODE.MONKEY_TAMER_REVEAL, monkeyReveal: { roleId: "e01", evil: true } } };
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
    await gm.request("broadcast", { topic, event: "state", payload: { revision: 10, session: { mode: PHONE_MODE.WEREWOLF_HUNT } } });
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
