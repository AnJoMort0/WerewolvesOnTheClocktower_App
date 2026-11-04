// Player phase recovery against local Supabase only; no deployed project access.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { CDP } from "./helpers/browser.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const browserPath = process.env.LAN_BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
if (!existsSync(browserPath)) throw new Error("Set LAN_BROWSER to an installed Chromium browser.");
const status = JSON.parse(execFileSync(process.execPath,
  [resolve(root, "node_modules/supabase/dist/supabase.js"), "status", "-o", "json"],
  { cwd: root, encoding: "utf8" }));
const api = status.API_URL;
const key = status.ANON_KEY || status.PUBLISHABLE_KEY;
if (!/^http:\/\/127\.0\.0\.1:54321\/?$/.test(api) || !key) {
  throw new Error("Only the local Supabase API is allowed.");
}
const base = "http://127.0.0.1:4188";
const temporary = mkdtempSync(resolve(tmpdir(), "wotct-hosted-phase-"));
let vite, browser, cdp;
const roomIds = [];
const errors = [], externalRequests = [];

async function rest(path, init = {}) {
  const response = await fetch(`${api}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json", Prefer: "return=representation", ...init.headers },
  });
  if (!response.ok) throw new Error(`Local REST ${response.status}: ${await response.text()}`);
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}
async function makeRoom(phase, timer) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = "W" + Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  const room = (await rest("rooms", { method: "POST", body: JSON.stringify({ code, language: "en" }) }))[0];
  roomIds.push(room.id);
  await rest(`rooms?id=eq.${room.id}`, { method: "PATCH", body: JSON.stringify({
    status: "playing", phase_state: phase, timer_state: timer,
  }) });
  const player = (await rest("players", { method: "POST", body: JSON.stringify({
    room_id: room.id, name: "Phase Test Phone", character: "v01", seat_position: 0,
  }) }))[0];
  return { roomId: room.id, playerId: player.id };
}

try {
  vite = spawn(process.execPath, [resolve(root, "node_modules/vite/bin/vite.js"),
    "--config", "config/vite.config.ts", "--host", "127.0.0.1", "--port", "4188", "--strictPort"], {
    cwd: root, windowsHide: true, stdio: "ignore",
    env: { ...process.env, VITE_SUPABASE_URL: api, VITE_SUPABASE_PUBLISHABLE_KEY: key,
      VITE_PUBLIC_APP_URL: base },
  });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = (await fetch(base)).ok; if (ready) break; } catch { /* Vite is starting */ }
    await delay(100);
  }
  assert.ok(ready, "Local Vite server did not start");
  browser = spawn(browserPath, ["--headless=new", "--disable-gpu", "--no-first-run",
    "--disable-background-networking", "--disable-component-update", "--disable-extensions",
    "--remote-debugging-port=0", `--user-data-dir=${resolve(temporary, "profile")}`],
  { windowsHide: true, stdio: "ignore" });
  const activePort = resolve(temporary, "profile/DevToolsActivePort");
  for (let attempt = 0; attempt < 100 && !existsSync(activePort); attempt++) await delay(100);
  assert.ok(existsSync(activePort), "Browser did not start");
  const debugPort = readFileSync(activePort, "utf8").split("\n")[0];
  const version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then(response => response.json());
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.addEventListener("open", done, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  cdp = new CDP(socket, { base, allowedOrigins: [api], errors, externalRequests });

  // Newly created room: a valid phase with no timer still has a phase panel.
  const fresh = await makeRoom({ phase: "night", number: 1, beginnerMode: false }, null);
  const phone = await cdp.page(`${base}/play/${fresh.playerId}`);
  assert.equal(await cdp.evaluate(phone, "window.__WOTCT_LAN__ === undefined"), true);
  await cdp.wait(phone, "document.body.innerText.includes('Night 1')");
  console.log("New local hosted room displayed Night 1 with a null timer.");

  // The next room exists before its phone opens, as with a previously hosted room.
  const existing = await makeRoom({ phase: "day", number: 2, beginnerMode: false }, null);
  const existingPhone = await cdp.page(`${base}/play/${existing.playerId}`);
  await cdp.wait(existingPhone, "document.body.innerText.includes('Day 2')");
  for (const timer of [
    { version: 2, revision: 1, phase: "day", phaseNumber: 2, status: "running", deadlineAt: null },
    { phase: "day", timeLeft: 120, isRunning: true, timerDone: false },
    { version: 2, revision: 2, phase: "tribunal", phaseNumber: 2, status: "paused",
      remainingMs: 120000, deadlineAt: null, lastMutationId: "mismatch" },
  ]) {
    await rest(`rooms?id=eq.${existing.roomId}`, { method: "PATCH", body: JSON.stringify({ timer_state: timer }) });
    await cdp.call("Page.reload", {}, existingPhone);
    await cdp.wait(existingPhone, "document.body.innerText.includes('Day 2')");
    assert.equal(await cdp.evaluate(existingPhone, "document.body.innerText.includes('02:00')"), false);
  }
  await rest(`rooms?id=eq.${existing.roomId}`, { method: "PATCH", body: JSON.stringify({
    timer_state: { version: 2, revision: 3, phase: "day", phaseNumber: 2, status: "paused",
      remainingMs: 120000, deadlineAt: null, lastMutationId: "valid" },
  }) });
  await cdp.wait(existingPhone, "document.body.innerText.includes('Day 2') && document.body.innerText.includes('02:00')");
  await rest(`rooms?id=eq.${existing.roomId}`, { method: "PATCH", body: JSON.stringify({ phase_state: null }) });
  await cdp.call("Page.reload", {}, existingPhone);
  await cdp.wait(existingPhone, "document.body.innerText.includes('Phase Test Phone')");
  assert.equal(await cdp.evaluate(existingPhone, "document.body.innerText.includes('Day 2')"), false);
  assert.deepEqual(externalRequests, [], "A browser attempted an external request");
  assert.deepEqual(errors, [], `Browser exceptions: ${errors.join("\n")}`);
  console.log("PASS: existing hosted room kept its phase with null, invalid, legacy and mismatched timers; absent phase stayed absent.");
} finally {
  if (cdp) { await cdp.call("Browser.close").catch(() => {}); cdp.socket.close(); }
  if (browser && browser.exitCode === null) {
    browser.kill(); await new Promise(done => browser.once("exit", done));
  }
  if (vite && vite.exitCode === null) {
    vite.kill(); await new Promise(done => vite.once("exit", done));
  }
  const projectId = /project_id\s*=\s*"([a-z0-9_-]+)"/.exec(readFileSync(resolve(root, "supabase/config.toml"), "utf8"))?.[1];
  for (const id of roomIds) {
    if (projectId && /^[0-9a-f-]{36}$/.test(id)) {
      execFileSync("docker", ["exec", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres",
        "-q", "-c", `DELETE FROM public.rooms WHERE id = '${id}'::uuid`], { cwd: root, stdio: "ignore" });
    }
  }
  if (resolve(temporary).startsWith(resolve(tmpdir()) + sep)
    && basename(temporary).startsWith("wotct-hosted-phase-")) {
    rmSync(temporary, { recursive: true, force: true });
  }
}
