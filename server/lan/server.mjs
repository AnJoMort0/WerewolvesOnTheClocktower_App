// Offline backend: Node built-ins only. No database, npm runtime packages, or internet required.
import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff" };
const ROOM_FIELDS = new Set(["code", "language", "status", "phase_state", "timer_state", "timer_defaults", "game_over_state", "player_action_state"]);
const PLAYER_FIELDS = new Set(["name", "room_id", "seat_position", "character", "is_alive", "is_ready", "last_seen_at"]);
const SNAPSHOT_KEY = /^wotct_(gm_snapshot_|phone_|runtime_)/;
const ACTION_KINDS = new Set(["v10-assassinate", "v18-resurrect", "v23-web"]);
const TOPICS = ["phone-", "player-action-modes-", "player-sync-", "fortune-teller-reveal-", "little-girl-reveal-", "lamplighter-reveal-", "werewolf-seer-reveal-", "spider-reveal-", "spy-reveal-", "mime-reveal-", "room-phase-", "room-timer-", "game-over-", "player-actions-"];
const failure = (message, code = "LAN_ERROR", status = 400) => Object.assign(new Error(message), { code, status });
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const loopback = address => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address);

export function createLanServer({ distDir, dataDir, joinBaseUrl, pin = String(Math.floor(100000 + Math.random() * 900000)), localHostAccess = true }) {
  distDir = resolve(distDir);
  dataDir = resolve(dataDir);
  mkdirSync(dataDir, { recursive: true });
  const databaseFile = resolve(dataDir, "games.json");
  let state = { version: 1, rooms: [], players: [], snapshots: {}, broadcasts: {} };
  if (existsSync(databaseFile)) {
    state = JSON.parse(readFileSync(databaseFile, "utf8"));
    if (state.version !== 1 || !Array.isArray(state.rooms) || !Array.isArray(state.players) || !state.snapshots || !state.broadcasts) {
      throw new Error(`Unrecognised LAN data in ${databaseFile}. Restore a backup; existing data was not overwritten.`);
    }
  }
  const sessions = new Map();
  const streams = new Set();
  let broadcastSaveTimer;
  const save = () => {
    clearTimeout(broadcastSaveTimer);
    broadcastSaveTimer = undefined;
    writeFileSync(`${databaseFile}.tmp`, JSON.stringify(state), { mode: 0o600 });
    renameSync(`${databaseFile}.tmp`, databaseFile);
  };
  const scheduleSave = () => { broadcastSaveTimer ??= setTimeout(save, 250); };
  const send = (response, status, value, type = "application/json") => {
    response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(type === "application/json" ? JSON.stringify(value) : value);
  };

  function sessionFor(request, response) {
    const cookie = request.headers.cookie?.match(/(?:^|;\s*)wotct_lan=([a-f0-9]+)/)?.[1];
    let session = cookie && sessions.get(cookie);
    if (!session) {
      const token = randomBytes(24).toString("hex");
      session = { host: false, rooms: new Set(), players: new Set(), lastSeen: Date.now(), pinAttempts: 0 };
      sessions.set(token, session);
      response.setHeader("Set-Cookie", `wotct_lan=${token}; HttpOnly; SameSite=Strict; Path=/`);
    }
    if (localHostAccess && loopback(request.socket.remoteAddress)) session.host = true;
    session.lastSeen = Date.now();
    return session;
  }

  function claimPlayer(session, credentials) {
    if (!credentials?.playerId || !credentials.playerToken) return;
    const player = state.players.find(player => player.id === credentials.playerId && player.player_token === credentials.playerToken);
    if (player) { session.players.add(player.id); session.rooms.add(player.room_id); }
  }

  function canReceive(session, roomId, message) {
    if (session.host) return true;
    if (!session.rooms.has(roomId)) return false;
    // Avoid sending every private action view to every phone: each view contains a full player circle.
    return !message.topic?.startsWith(`phone-${roomId}-`) || [...session.players].some(id => message.topic === `phone-${roomId}-${id}`);
  }

  function emit(roomId, message, sourceClientId) {
    const wire = `data: ${JSON.stringify({ ...message, roomId })}\n\n`;
    for (const stream of streams) {
      if (stream.clientId === sourceClientId || !canReceive(stream.session, roomId, message)) continue;
      if (stream.response.writableLength > 2_000_000) { stream.response.destroy(); continue; }
      stream.response.write(wire);
    }
  }

  function change(table, eventType, row, previous = {}) {
    const roomId = table === "rooms" ? row.id : row.room_id;
    emit(roomId, { type: "postgres_changes", table, eventType, new: eventType === "DELETE" ? {} : row, old: previous });
  }

  async function bodyFor(request) {
    const origin = request.headers.origin;
    if (origin && origin !== `http://${request.headers.host}`) throw failure("Use this server's own address.", "ORIGIN", 403);
    if (!request.headers["content-type"]?.startsWith("application/json")) throw failure("JSON content required.");
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 4_000_000) throw failure("Request is too large.", "LIMIT", 413);
      chunks.push(chunk);
    }
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Not an object");
      return body;
    }
    catch { throw failure("Invalid JSON request."); }
  }

  function hostOnly(session) { if (!session.host) throw failure("GM access required. Enter the PIN displayed by the LAN launcher.", "HOST_REQUIRED", 403); }
  function roomFor(id) {
    const room = state.rooms.find(room => room.id === id);
    if (!room) throw failure("Room not found.", "NOT_FOUND", 404);
    return room;
  }
  function validateValues(table, values) {
    if (!values || typeof values !== "object" || Array.isArray(values)) throw failure("Invalid row values.");
    const fields = table === "rooms" ? ROOM_FIELDS : PLAYER_FIELDS;
    for (const key of Object.keys(values)) if (!fields.has(key)) throw failure(`Unsupported field: ${key}`);
    if ("status" in values && !["lobby", "assigning", "playing", "finished"].includes(values.status)) throw failure("Invalid room status.");
    if ("name" in values && (typeof values.name !== "string" || !values.name.trim() || values.name.length > 100)) throw failure("Use a name between 1 and 100 characters.");
    if ("code" in values && !/^[A-Z0-9]{4,8}$/.test(values.code)) throw failure("Invalid room code.");
    for (const key of ["is_ready", "is_alive"]) if (key in values && typeof values[key] !== "boolean") throw failure(`Invalid ${key}`);
  }

  // Merge a phone's additions into the latest state, so simultaneous day actions cannot overwrite each other.
  function mergePlayerRequests(session, room, submitted) {
    if (!submitted || !Array.isArray(submitted.requests)) throw failure("Invalid action state.");
    const current = room.player_action_state ?? { version: 1, requests: [], powerUses: {} };
    const requests = [...current.requests];
    for (const action of submitted.requests) {
      if (requests.some(existing => existing.id === action.id)) continue;
      if (!session.players.has(action.actorPlayerId) || !ACTION_KINDS.has(action.kind) || typeof action.id !== "string" || action.id.length > 300
        || !state.players.some(player => player.id === action.targetPlayerId && player.room_id === room.id)
        || !state.players.some(player => player.id === action.actorPlayerId && player.room_id === room.id)) throw failure("Invalid player action.", "FORBIDDEN", 403);
      if (requests.some(existing => existing.actorPlayerId === action.actorPlayerId && existing.kind === action.kind)) continue;
      if (requests.length >= 200) throw failure("Too many pending actions.");
      requests.push({ id: action.id, kind: action.kind, actorPlayerId: action.actorPlayerId, targetPlayerId: action.targetPlayerId, requestedAt: Date.now() });
    }
    return { ...current, requests };
  }

  function query(session, query) {
    const { table, operation = "select", filters = [], columns = "*", cardinality, order } = query;
    if (!["rooms", "players"].includes(table) || !["select", "insert", "update", "delete"].includes(operation)) throw failure("Unsupported query.");
    const fields = new Set(["id", "created_at", ...(table === "rooms" ? ["gm_token", "last_activity_at", "completed_at", ...ROOM_FIELDS] : ["player_token", ...PLAYER_FIELDS])]);
    if (!Array.isArray(filters) || filters.some(filter => !Array.isArray(filter) || filter.length !== 2 || !fields.has(filter[0]))) throw failure("Invalid filters.");
    if (order && !fields.has(order)) throw failure("Invalid ordering.");
    const projection = columns === "*" ? null : columns.split(",").map(column => column.trim());
    if (projection?.some(column => !fields.has(column))) throw failure("Invalid selected columns.");
    const matches = row => filters.every(([key, value]) => row[key] === value);
    let rows = state[table].filter(matches);

    if (operation === "select") {
      // This is a trusted-table game, like the hosted app: knowing a room code allows name-based rejoining.
      if (!session.host && !filters.some(([key]) => table === "rooms" ? ["id", "code"].includes(key) : ["id", "room_id"].includes(key))) throw failure("Select a specific room or player.", "FORBIDDEN", 403);
      for (const row of rows) session.rooms.add(table === "rooms" ? row.id : row.room_id);
    } else if (operation === "insert") {
      const entries = Array.isArray(query.values) ? query.values : [query.values];
      if (!entries.length || entries.length > 100) throw failure("Invalid insert size.");
      // Validate the entire batch before changing data.
      for (const values of entries) {
        validateValues(table, values);
        if (table === "rooms") {
          hostOnly(session);
          if (!values.code) throw failure("Room code required.");
          if (state.rooms.some(room => room.code === values.code) || entries.filter(entry => entry.code === values.code).length > 1) throw failure("Room code already exists.", "23505", 409);
        } else {
          const room = roomFor(values.room_id);
          if (!session.host && (room.status !== "lobby" || Object.keys(values).some(key => !["name", "room_id"].includes(key)))) throw failure("Joining is only available in the lobby.", "FORBIDDEN", 403);
          if (state.players.filter(player => player.room_id === room.id).length + entries.length > 100) throw failure("A LAN room supports up to 100 players.");
        }
      }
      rows = entries.map(values => {
        const now = new Date().toISOString();
        const row = table === "rooms"
          ? { id: randomUUID(), code: values.code, language: "pt", status: "lobby", gm_token: randomBytes(24).toString("hex"), created_at: now, last_activity_at: now, completed_at: null, phase_state: null, timer_state: null, game_over_state: null, player_action_state: null, timer_defaults: {}, ...values }
          : { id: randomUUID(), player_token: randomBytes(24).toString("hex"), created_at: now, name: values.name.trim(), room_id: values.room_id, seat_position: null, character: null, is_alive: true, is_ready: false, last_seen_at: now, ...values };
        state[table].push(row);
        session.rooms.add(table === "rooms" ? row.id : row.room_id);
        if (table === "players" && !session.host) session.players.add(row.id);
        return row;
      });
      save();
      for (const row of rows) change(table, "INSERT", row);
    } else {
      if (!filters.length) throw failure("Mutation needs a filter.");
      if (operation === "delete") hostOnly(session);
      if (operation === "update") {
        validateValues(table, query.values);
        if (table === "players" && "room_id" in query.values) throw failure("A player cannot change rooms.");
      }
      const changes = rows.map(row => {
        let values = query.values;
        if (!session.host && operation === "update") {
          if (table === "players") {
            if (!session.players.has(row.id) || Object.keys(values).some(key => !["is_ready", "last_seen_at"].includes(key))) throw failure("Only the GM can change another player's game state.", "FORBIDDEN", 403);
          } else {
            if (Object.keys(values).length !== 1 || !("player_action_state" in values) || !session.rooms.has(row.id)) throw failure("Only the GM can change room state.", "FORBIDDEN", 403);
            values = { player_action_state: mergePlayerRequests(session, row, values.player_action_state) };
          }
        }
        return { row, previous: structuredClone(row), values };
      });
      const changed = [];
      for (const { row, previous, values } of changes) {
        if (operation === "delete") {
          state[table] = state[table].filter(candidate => candidate.id !== row.id);
          if (table === "rooms") removeRoomData(row.id);
          changed.push({ row, previous });
        } else if (Object.entries(values).some(([key, value]) => !equal(row[key], value))) {
          Object.assign(row, values);
          if (table === "rooms") {
            row.last_activity_at = new Date().toISOString();
            row.completed_at = row.status === "finished" ? (row.completed_at ?? row.last_activity_at) : null;
            if ("phase_state" in values && !equal(previous.phase_state, values.phase_state)) {
              for (const key of Object.keys(state.broadcasts)) if (state.broadcasts[key].roomId === row.id && /reveal-/.test(key)) delete state.broadcasts[key];
            }
          }
          changed.push({ row, previous });
        }
      }
      if (changed.length) {
        save();
        for (const { row, previous } of changed) change(table, operation === "delete" ? "DELETE" : "UPDATE", row, previous);
      }
    }
    if (order) rows.sort((a, b) => String(a[order] ?? "").localeCompare(String(b[order] ?? "")));
    const data = rows.map(row => projection ? Object.fromEntries(projection.map(key => [key, row[key]])) : row);
    if (cardinality === "single" && data.length !== 1 || cardinality === "maybeSingle" && data.length > 1) throw failure("Expected one row.", "PGRST116", 406);
    return { data: cardinality ? data[0] ?? null : data, error: null };
  }

  function removeRoomData(roomId) {
    const players = state.players.filter(player => player.room_id === roomId);
    state.players = state.players.filter(player => player.room_id !== roomId);
    for (const player of players) change("players", "DELETE", player, player);
    for (const key of Object.keys(state.snapshots)) if (key.endsWith(roomId)) delete state.snapshots[key];
    for (const key of Object.keys(state.broadcasts)) if (state.broadcasts[key].roomId === roomId) delete state.broadcasts[key];
  }

  const server = createServer(async (request, response) => {
    try {
      // Reject foreign Host headers (including DNS rebinding). Allow only the printed address and literal local IPs.
      const url = new URL(request.url, `http://${request.headers.host}`);
      const publicHost = new URL(typeof joinBaseUrl === "function" ? joinBaseUrl() : joinBaseUrl).hostname;
      if (!["localhost", "127.0.0.1", "[::1]", publicHost].includes(url.hostname) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)) throw failure("Unrecognised server address.", "HOST", 403);
      if (url.pathname.startsWith("/api/lan/")) {
        const session = sessionFor(request, response);
        if (url.pathname === "/api/lan/config.js" && request.method === "GET") {
          const config = { joinBaseUrl: typeof joinBaseUrl === "function" ? joinBaseUrl() : joinBaseUrl, host: session.host };
          send(response, 200, `window.__WOTCT_LAN__=${JSON.stringify(config).replaceAll("<", "\\u003c")};`, "text/javascript"); return;
        }
        if (url.pathname === "/api/lan/events" && request.method === "GET") {
          const clientId = url.searchParams.get("clientId");
          if (!/^[a-f0-9]{32}$/.test(clientId ?? "")) throw failure("Invalid connection ID.");
          // Replace a reconnecting stream without interrupting other tabs/devices.
          for (const stream of streams) if (stream.session === session && stream.clientId === clientId) stream.response.destroy();
          response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", "Connection": "keep-alive", "X-Accel-Buffering": "no" });
          response.write(": connected\n\n");
          const stream = { session, clientId, response };
          streams.add(stream);
          for (const message of Object.values(state.broadcasts)) {
            if (canReceive(session, message.roomId, message)) response.write(`data: ${JSON.stringify(message)}\n\n`);
          }
          request.on("close", () => streams.delete(stream)); return;
        }
        if (url.pathname === "/api/lan/snapshots" && request.method === "GET") {
          hostOnly(session); send(response, 200, state.snapshots); return;
        }
        if (request.method !== "POST") throw failure("Endpoint not found.", "NOT_FOUND", 404);
        const body = await bodyFor(request);
        claimPlayer(session, body.player);
        let result = { data: null, error: null };
        switch (url.pathname) {
          case "/api/lan/host":
            if (session.pinAttempts >= 10) throw failure("Too many PIN attempts. Restart the server to try again.", "PIN_LIMIT", 429);
            if (body.pin !== pin) { session.pinAttempts++; throw failure("Incorrect GM PIN.", "PIN", 403); }
            session.host = true; break;
          case "/api/lan/query": result = query(session, body); break;
          case "/api/lan/replay": {
            const message = state.broadcasts[body.topic];
            if (message && canReceive(session, message.roomId, message)) result.data = message;
            break;
          }
          case "/api/lan/broadcast": {
            if (typeof body.topic !== "string" || body.topic.length > 200) throw failure("Invalid channel.");
            const room = state.rooms.find(room => TOPICS.some(prefix => body.topic === `${prefix}${room.id}` || (prefix === "phone-" && body.topic.startsWith(`${prefix}${room.id}-`))));
            if (!room || typeof body.event !== "string" || body.event.length > 100) throw failure("Unknown channel.");
            if (!session.host) {
              if (!session.rooms.has(room.id)) throw failure("Join this room first.", "FORBIDDEN", 403);
              const ownPhone = body.event === "request" && [...session.players].some(id => body.topic === `phone-${room.id}-${id}` && state.players.some(player => player.id === id && player.room_id === room.id));
              const ownMirror = body.topic === `player-action-modes-${room.id}` && body.event === "player-action-mode" && session.players.has(body.payload?.actorPlayerId)
                && state.players.some(player => player.id === body.payload.actorPlayerId && player.room_id === room.id);
              if (!ownPhone && !ownMirror) throw failure("This broadcast requires GM access.", "FORBIDDEN", 403);
            }
            const message = { type: "broadcast", topic: body.topic, event: body.event, payload: body.payload, roomId: room.id };
            if (session.host && !["sync", "player-action-resolved", "player-action-mode-closed"].includes(body.event)) {
              state.broadcasts[body.topic] = message;
              scheduleSave();
            }
            emit(room.id, message, body.clientId); break;
          }
          case "/api/lan/snapshots":
            hostOnly(session);
            for (const [key, value] of Object.entries(body)) {
              if (SNAPSHOT_KEY.test(key) && typeof value === "string" && state.rooms.some(room => key.endsWith(room.id))) state.snapshots[key] = value;
            }
            save(); break;
          case "/api/lan/rpc": {
            hostOnly(session);
            if (body.name !== "cleanup_old_rooms") throw failure("Unknown procedure.");
            const match = String(body.args?.retention ?? "24 hours").match(/^(\d+)\s+(hour|day)s?$/);
            if (!match) throw failure("Use a retention in hours or days.");
            const cutoff = Date.now() - Math.max(1, Number(match[1])) * (match[2] === "day" ? 86400000 : 3600000);
            const oldRooms = state.rooms.filter(room => ["lobby", "finished"].includes(room.status) && Date.parse(room.last_activity_at) < cutoff);
            for (const room of oldRooms) { removeRoomData(room.id); change("rooms", "DELETE", room, room); }
            state.rooms = state.rooms.filter(room => !oldRooms.includes(room));
            save(); result.data = oldRooms.length; break;
          }
          default: throw failure("Endpoint not found.", "NOT_FOUND", 404);
        }
        send(response, 200, result); return;
      }
      if (!["GET", "HEAD"].includes(request.method)) throw failure("Method not allowed.", "METHOD", 405);
      const pathname = decodeURIComponent(url.pathname);
      let file = resolve(distDir, `.${pathname}`);
      if (file !== distDir && !file.startsWith(distDir + sep)) throw failure("Invalid file path.", "FORBIDDEN", 403);
      if (!extname(pathname) || pathname === "/index.html") file = resolve(distDir, "index.html");
      const info = await stat(file);
      if (!info.isFile()) throw failure("File not found.", "NOT_FOUND", 404);
      let contents = await readFile(file);
      if (file === resolve(distDir, "index.html")) {
        const session = sessionFor(request, response);
        const config = { joinBaseUrl: typeof joinBaseUrl === "function" ? joinBaseUrl() : joinBaseUrl, host: session.host };
        // Embed mode before any module loads: a failed config request must never fall back to the cloud.
        const bootstrap = `<script>window.__WOTCT_LAN__=${JSON.stringify(config).replaceAll("<", "\\u003c")};</script>`;
        contents = Buffer.from(contents.toString().replace("<head>", `<head>${bootstrap}`));
      }
      response.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream", "Cache-Control": extname(file) === ".html" ? "no-store" : "public, max-age=3600", "X-Content-Type-Options": "nosniff" });
      response.end(request.method === "HEAD" ? undefined : contents);
    } catch (error) {
      if (response.headersSent) { response.destroy(); return; }
      const status = error.status ?? (error.code === "ENOENT" ? 404 : 500);
      if (status >= 500) console.error("LAN server error:", error);
      send(response, status, { data: null, error: { message: status >= 500 ? "Local server error. Check the host's server window." : error.message, code: error.code ?? "LAN_ERROR" } });
    }
  });
  const heartbeat = setInterval(() => {
    for (const { response } of streams) response.write(": keep-alive\n\n");
    for (const [key, session] of sessions) if (Date.now() - session.lastSeen > 86400000 && ![...streams].some(stream => stream.session === session)) sessions.delete(key);
  }, 15000);
  heartbeat.unref();
  return {
    server, pin, databaseFile,
    async close() {
      clearInterval(heartbeat);
      save();
      for (const { response } of streams) response.end();
      await new Promise((done, reject) => {
        server.close(error => error ? reject(error) : done());
        // Phones can leave an incomplete request open. Save first, stop accepting
        // connections, then disconnect all HTTP clients so shutdown cannot hang.
        server.closeAllConnections();
      });
    },
  };
}
