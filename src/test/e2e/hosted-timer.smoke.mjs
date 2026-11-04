// Real browser against the local Supabase API. Never accepts a remote API URL.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
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
  throw new Error("Local Supabase API or publishable key is unavailable; refusing remote access.");
}
const base = "http://127.0.0.1:4187";
const temporary = mkdtempSync(resolve(tmpdir(), "wotct-hosted-timer-"));
let vite, browser, cdp, roomId;
const errors = [], externalRequests = [], apiRequests = [], roomFrames = [], rpcResponses = [];
const rpcRequestIds = new Map();
let dropNextTransitionResponse = false;
let droppedTransitionResponse = false;
let failNextPhaseRequest = false;
let failedPhaseRequest = false;

async function rest(path, init = {}) {
  const response = await fetch(`${api}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json", Prefer: "return=representation", ...init.headers },
  });
  if (!response.ok) throw new Error(`Local REST ${response.status}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
const room = async () => (await rest(`rooms?id=eq.${roomId}&select=*`))[0];
const waitRoom = async (predicate) => {
  const end = Date.now() + 10000;
  let latest;
  while (Date.now() < end) {
    latest = await room();
    if (predicate(latest)) return latest;
    await delay(100);
  }
  throw new Error(`Local room did not reach expected timer state: ${latest?.timer_state?.status}, revision ${latest?.timer_state?.revision}; RPC ${JSON.stringify(rpcResponses.slice(-4))}`);
};
const countdown = async (session) => cdp.evaluate(session,
  "document.body.innerText.match(/\\b(0[0-5]:[0-5][0-9])\\b/)?.[1] ?? null");
const seconds = (value) => value ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;

try {
  vite = spawn(process.execPath, [resolve(root, "node_modules/vite/bin/vite.js"),
    "--config", "config/vite.config.ts", "--host", "127.0.0.1", "--port", "4187", "--strictPort"], {
    cwd: root, windowsHide: true, stdio: "ignore",
    env: { ...process.env, VITE_SUPABASE_URL: api, VITE_SUPABASE_PUBLISHABLE_KEY: key,
      VITE_PUBLIC_APP_URL: base },
  });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = (await fetch(base)).ok; if (ready) break; } catch { /* wait for Vite */ }
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
  cdp = new CDP(socket, { base, allowedOrigins: [api], errors, externalRequests,
    interceptRequest: (message, client) => {
      if (failNextPhaseRequest && !message.params.responseStatusCode
        && message.params.request.url.includes("/rpc/transition_room_timer")
        && JSON.parse(message.params.request.postData || "{}").p_action === "set_phase") {
        failNextPhaseRequest = false;
        failedPhaseRequest = true;
        void client.call("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "Aborted" }, message.sessionId);
        return true;
      }
      if (dropNextTransitionResponse && message.params.responseStatusCode
        && message.params.request.url.includes("/rpc/transition_room_timer")) {
        dropNextTransitionResponse = false;
        droppedTransitionResponse = true;
        void client.call("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "Aborted" }, message.sessionId);
        return true;
      }
      return false;
    },
  });
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === "Network.requestWillBeSent" && message.params.request.url.startsWith(api)) {
      apiRequests.push({ sessionId: message.sessionId, url: message.params.request.url, method: message.params.request.method,
        body: message.params.request.url.includes("transition_room_timer") ? message.params.request.postData : undefined, at: Date.now() });
      if (message.params.request.url.includes("transition_room_timer")) {
        rpcRequestIds.set(message.params.requestId, { sessionId: message.sessionId,
          action: JSON.parse(message.params.request.postData || "{}").p_action });
      }
    }
    if (message.method === "Network.responseReceived" && message.params.response.url.includes("transition_room_timer")) {
      rpcResponses.push({ sessionId: message.sessionId, action: rpcRequestIds.get(message.params.requestId)?.action,
        status: message.params.response.status });
    }
    if (message.method === "Network.loadingFinished" && rpcRequestIds.has(message.params.requestId)) {
      const request = rpcRequestIds.get(message.params.requestId);
      void cdp.call("Network.getResponseBody", { requestId: message.params.requestId }, request.sessionId)
        .then(value => rpcResponses.push({ action: request.action, body: value.body.slice(0, 300) }))
        .catch(() => {});
      rpcRequestIds.delete(message.params.requestId);
    }
    if (message.method === "Network.loadingFailed") {
      rpcResponses.push({ sessionId: message.sessionId, failure: message.params.errorText });
    }
    if (message.method === "Network.webSocketFrameReceived" || message.method === "Network.webSocketFrameSent") {
      const payload = message.params.response?.payloadData ?? "";
      if (payload.includes("room-") || payload.includes("timer_state") || payload.includes("transition_room_timer")) {
        roomFrames.push({ sessionId: message.sessionId, direction: message.method.endsWith("Sent") ? "sent" : "received", payload, at: Date.now() });
      }
    }
  });
  const gm = await cdp.page(base);
  await cdp.call("Network.enable", {}, gm);
  await cdp.evaluate(gm, "localStorage.setItem('preferred_language', 'en')");
  await cdp.call("Page.reload", {}, gm);
  assert.equal(await cdp.evaluate(gm, "window.__WOTCT_LAN__ === undefined"), true, "LAN adapter is active");
  await cdp.click(gm, "Create Room");
  await cdp.wait(gm, "location.pathname.startsWith('/gm/')");
  roomId = await cdp.evaluate(gm, "location.pathname.split('/').pop()");
  const created = await room();
  assert.ok(created?.code);
  console.log("Created a temporary room using the hosted client and local Supabase.");

  const phones = [];
  for (const name of ["Timer Phone A", "Timer Phone B"]) {
    const phone = await cdp.page(`${base}/join/${created.code}`);
    await cdp.call("Network.enable", {}, phone);
    await cdp.wait(phone, "!!document.querySelector('input')");
    await cdp.evaluate(phone, `(() => {
      const input = document.querySelector('input');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(name)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await cdp.click(phone, "Enter");
    await cdp.wait(phone, "location.pathname.startsWith('/play/')");
    phones.push(phone);
    try {
      await cdp.wait(gm, `document.body.innerText.includes(${JSON.stringify(`${phones.length} players in the room`)})`);
    } catch (error) {
      console.error("Roster diagnostic:", {
        databasePlayers: (await rest(`players?room_id=eq.${roomId}&select=id`)).length,
        gmPlayerReads: apiRequests.filter(item => item.sessionId === gm && item.url.includes("/rest/v1/players")).length,
        gmRoomFrames: roomFrames.filter(item => item.sessionId === gm).slice(-5).map(item => item.payload.slice(0, 200)),
      });
      throw error;
    }
  }
  await rest("players", { method: "POST", body: JSON.stringify(Array.from({ length: 6 }, (_, index) =>
    ({ name: `Timer Extra ${index}`, room_id: roomId }))) });
  const roster = await rest(`players?room_id=eq.${roomId}&select=id,name&order=created_at`);
  for (const [seat, player] of roster.entries()) {
    await rest(`players?id=eq.${player.id}`, { method: "PATCH", body: JSON.stringify({ seat_position: seat }) });
  }
  await cdp.wait(gm, "document.body.innerText.includes('8 players in the room')");
  console.log("Players joined and appeared on the GM roster without a refresh.");
  await cdp.click(gm, "Confirm & Assign Roles");
  await cdp.click(gm, "Send Roles to Players");
  await cdp.wait(phones[0], "document.body.innerText.includes('YOUR ROLE')");
  await cdp.click(gm, "End Night 1");
  await cdp.wait(phones[0], "document.body.innerText.includes('Day 1')");
  await cdp.wait(phones[1], "document.body.innerText.includes('Day 1')");
  let saved = await waitRoom(value => value.phase_state?.phase === "day" && value.timer_state?.status === "paused");
  assert.equal(saved.timer_state.phase, "day");
  console.log("Both phones received the Day phase and its paused timer.");

  const clickTimer = async (label) => {
    const selector = `button[aria-label="${label}"]:not(:disabled)`;
    await cdp.wait(gm, `!!document.querySelector(${JSON.stringify(selector)})`);
    await cdp.evaluate(gm, `document.querySelector(${JSON.stringify(selector)}).click()`);
  };
  await clickTimer("Start timer");
  saved = await waitRoom(value => value.timer_state?.status === "running");
  const runningRevision = saved.timer_state.revision;
  await cdp.wait(phones[0], "document.body.innerText.includes('04:59') || document.body.innerText.includes('04:58')");
  await cdp.wait(phones[1], "document.body.innerText.includes('04:59') || document.body.innerText.includes('04:58')");
  const windowStart = Date.now();
  const baseline = { revision: saved.timer_state.revision, lastActivity: saved.last_activity_at };
  const requestsBefore = apiRequests.length;
  const framesBefore = roomFrames.length;
  await delay(3200);
  saved = await room();
  assert.equal(saved.timer_state.revision, baseline.revision, "Countdown ticks changed timer revision");
  assert.equal(saved.last_activity_at, baseline.lastActivity, "Countdown ticks wrote the room");
  const tickRequests = apiRequests.slice(requestsBefore).filter(item => item.at >= windowStart);
  const tickFrames = roomFrames.slice(framesBefore).filter(item => item.at >= windowStart
    && (item.payload.includes("timer_state") || item.payload.includes("room-timer-")) && item.direction === "sent");
  assert.deepEqual(tickRequests, [], "Countdown ticks made Supabase requests");
  assert.deepEqual(tickFrames, [], "Countdown ticks broadcast timer state");
  for (const phone of phones) {
    assert.ok(roomFrames.some(item => item.sessionId === phone && item.direction === "received"
      && item.payload.includes("timer_state") && item.payload.includes(String(runningRevision))),
    "A phone did not receive the Realtime timer room update");
  }
  console.log(`Realtime delivered the timer transition; 3.2 seconds of ticks made ${tickRequests.length} Supabase requests and no room writes or timer broadcasts.`);

  await cdp.call("Page.reload", {}, phones[0]);
  await cdp.call("Page.reload", {}, gm);
  await cdp.wait(phones[0], "!!document.body.innerText.match(/04:[0-5][0-9]/)");
  await cdp.wait(gm, "!!document.body.innerText.match(/04:[0-5][0-9]/)");
  const gmRemaining = seconds(await countdown(gm));
  const phoneRemaining = seconds(await countdown(phones[0]));
  assert.ok(Math.abs(gmRemaining - phoneRemaining) <= 2, `GM ${gmRemaining}s; phone ${phoneRemaining}s`);
  assert.equal((await room()).timer_state.revision, runningRevision, "Refresh reset the deadline");
  console.log("GM and phone refresh recovered the same running deadline.");

  const reconnectPath = await cdp.evaluate(phones[1], "location.pathname");
  await cdp.call("Page.navigate", { url: "about:blank" }, phones[1]);
  await clickTimer("Pause timer");
  saved = await waitRoom(value => value.timer_state?.status === "paused");
  const pausedRemaining = saved.timer_state.remainingMs;
  await cdp.call("Page.navigate", { url: `${base}${reconnectPath}` }, phones[1]);
  await cdp.wait(phones[1], `document.body.innerText.includes(${JSON.stringify(`${String(Math.floor(pausedRemaining / 60000)).padStart(2, "0")}:`)})`);
  assert.ok(Math.abs(seconds(await countdown(phones[1])) - Math.ceil(pausedRemaining / 1000)) <= 2);
  console.log("Phone that missed the pause event recovered the paused state after reconnect.");

  await clickTimer("Start timer");
  saved = await waitRoom(value => value.timer_state?.status === "running");
  await clickTimer("Reset timer");
  saved = await waitRoom(value => value.timer_state?.status === "paused" && value.timer_state.remainingMs === 300000);
  assert.equal(saved.timer_state.phase, "day");
  await cdp.wait(phones[0], "document.body.innerText.includes('05:00')");
  await cdp.click(gm, "Start Tribunal");
  saved = await waitRoom(value => value.phase_state?.phase === "tribunal" && value.timer_state?.phase === "tribunal");
  assert.equal(saved.timer_state.status, "paused");
  assert.equal(saved.timer_state.remainingMs, 180000);
  await cdp.wait(phones[0], "document.body.innerText.includes('Tribunal 1') && document.body.innerText.includes('03:00')");
  await cdp.wait(phones[1], "document.body.innerText.includes('Tribunal 1') && document.body.innerText.includes('03:00')");
  console.log("Reset and atomic Day-to-Tribunal transition reached both phones.");

  // Set a short duration through the GM's timer settings, then observe local expiry.
  await cdp.evaluate(gm, `(() => {
    const timer = [...document.querySelectorAll('div')].find(el => el.textContent?.trim() === '03:00'
      && el.classList.contains('font-display'));
    const settings = timer?.parentElement?.querySelector('button .lucide-settings')?.closest('button');
    if (!settings) throw new Error('Tribunal timer settings not found');
    settings.click();
  })()`);
  await cdp.wait(gm, "[...document.querySelectorAll('input[type=number]')].length >= 2");
  await cdp.evaluate(gm, `(() => {
    const inputs = [...document.querySelectorAll('input[type=number]')].slice(-2);
    for (const [input, value] of [[inputs[0], '0'], [inputs[1], '3']]) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await cdp.click(gm, "OK");
  saved = await waitRoom(value => value.timer_defaults?.tribunal === 3 && value.timer_state?.remainingMs === 3000);
  await cdp.call("Fetch.enable", { patterns: [
    { urlPattern: "*", requestStage: "Request" },
    { urlPattern: "*transition_room_timer*", requestStage: "Response" },
  ] }, gm);
  dropNextTransitionResponse = true;
  const requestsBeforeLostTransition = apiRequests.length;
  const requestsBeforeLostResponse = apiRequests.filter(item => item.url.includes("transition_room_timer")).length;
  await clickTimer("Start timer");
  saved = await waitRoom(value => value.timer_state?.status === "running");
  assert.equal(droppedTransitionResponse, true, "The simulated lost response was not intercepted");
  await cdp.wait(gm, "document.body.innerText.includes('00:0')");
  await delay(300);
  assert.ok(apiRequests.slice(requestsBeforeLostTransition).some(item => item.method === "GET"
    && item.url.includes("/rest/v1/rooms") && item.url.includes("timer_state")),
  "The GM did not fetch authoritative room state after the lost response");
  assert.equal(apiRequests.filter(item => item.url.includes("transition_room_timer")).length - requestsBeforeLostResponse, 1,
    "An uncertain transition was resent");
  console.log("Lost successful RPC response triggered one room recovery read and no duplicate timer transition.");
  const expiryRevision = saved.timer_state.revision;
  await cdp.wait(phones[0], "document.body.innerText.includes('00:00')");
  await cdp.wait(phones[1], "document.body.innerText.includes('00:00')");
  assert.equal((await room()).timer_state.revision, expiryRevision, "Expiry caused a database write");
  console.log("Both phones displayed expiry without an expiry write.");
  const phaseCallsBefore = apiRequests.filter(item => item.url.includes("transition_room_timer")).length;
  failNextPhaseRequest = true;
  await cdp.click(gm, "Next Night");
  for (let attempt = 0; attempt < 50 && !failedPhaseRequest; attempt++) await delay(100);
  assert.equal(failedPhaseRequest, true, "Failed phase RPC was not intercepted");
  saved = await waitRoom(value => value.phase_state?.phase === "night" && value.phase_state.number === 2);
  assert.equal(apiRequests.filter(item => item.url.includes("transition_room_timer")).slice(phaseCallsBefore)
    .filter(item => JSON.parse(item.body || "{}").p_action === "set_phase").length, 2,
  "Failed phase transition used more than one bounded retry");
  await cdp.wait(phones[0], "document.body.innerText.includes('Night 2')");
  await cdp.wait(gm, "document.body.innerText.includes('Night 2')");
  console.log("A failed phase RPC did not block Night 2 progression.");
  assert.deepEqual(externalRequests, [], "The hosted browser attempted an external request");
  assert.deepEqual(errors, [], `Browser exceptions: ${errors.join("\n")}`);
  console.log("PASS: local hosted Supabase browser timer flow; no production requests.");
} finally {
  if (cdp) { await cdp.call("Browser.close").catch(() => {}); cdp.socket.close(); }
  if (browser && browser.exitCode === null) {
    browser.kill(); await new Promise(done => browser.once("exit", done));
  }
  if (vite && vite.exitCode === null) {
    vite.kill(); await new Promise(done => vite.once("exit", done));
  }
  if (roomId) {
    // Local container only. A UUID supplied by this test is safe to interpolate.
    const projectId = /project_id\s*=\s*"([a-z0-9_-]+)"/.exec(readFileSync(resolve(root, "supabase/config.toml"), "utf8"))?.[1];
    if (projectId && /^[0-9a-f-]{36}$/.test(roomId)) {
      execFileSync("docker", ["exec", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres",
        "-q", "-c", `DELETE FROM public.rooms WHERE id = '${roomId}'::uuid`], { cwd: root, stdio: "ignore" });
    }
  }
  if (resolve(temporary).startsWith(resolve(tmpdir()) + sep)
    && basename(temporary).startsWith("wotct-hosted-timer-")) {
    rmSync(temporary, { recursive: true, force: true });
  }
}
