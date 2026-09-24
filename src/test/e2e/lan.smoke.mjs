// Optional real-browser smoke test. Node built-ins + an installed Chromium browser; no cloud access.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { request } from "node:http";
import { CDP } from "./helpers/browser.mjs";
import { createLanServer } from "../../../server/lan/server.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const browserPath = process.env.LAN_BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
if (!existsSync(browserPath)) throw new Error("Set LAN_BROWSER to an installed Edge/Chrome/Chromium executable.");
if (!existsSync(resolve(root, ".build/app/index.html"))) throw new Error("Run npm run lan:prepare first.");
const temporary = mkdtempSync(resolve(tmpdir(), "wotct-lan-browser-"));
let lan, browser, cdp, base;
const errors = [], externalRequests = [];


async function query(body) {
  // Seeding uses a fresh socket; Node fetch otherwise reuses a dead pooled socket across restart.
  const result = await new Promise((done, reject) => {
    const command = request(`${base}/api/lan/query`, { method: "POST", headers: { "Content-Type": "application/json" }, agent: false }, response => {
      let text = "";
      response.setEncoding("utf8");
      response.on("data", chunk => { text += chunk; });
      response.on("end", () => { try { done(JSON.parse(text)); } catch (error) { reject(error); } });
    });
    command.on("error", reject);
    command.end(JSON.stringify(body));
  });
  assert.equal(result.error, null, JSON.stringify(result.error));
  return result.data;
}

try {
  lan = createLanServer({ distDir: resolve(root, ".build/app"), dataDir: resolve(temporary, "data"), joinBaseUrl: () => base });
  await new Promise(done => lan.server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${lan.server.address().port}`;
  browser = spawn(browserPath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-extensions", "--remote-debugging-port=0", `--user-data-dir=${resolve(temporary, "profile")}`], { windowsHide: true, stdio: "ignore" });
  const activePort = resolve(temporary, "profile/DevToolsActivePort");
  for (let attempt = 0; attempt < 100 && !existsSync(activePort); attempt++) await delay(100);
  assert.ok(existsSync(activePort), "Browser did not start");
  const debugPort = readFileSync(activePort, "utf8").split("\n")[0];
  const version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then(response => response.json());
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.addEventListener("open", done, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  cdp = new CDP(socket, { base, errors, externalRequests });

  const gm = await cdp.page(base);
  await cdp.evaluate(gm, "localStorage.setItem('preferred_language', 'en')");
  await cdp.call("Page.reload", {}, gm);
  await cdp.click(gm, "Start LAN game");
  await cdp.wait(gm, "location.pathname.startsWith('/gm/') && document.body.innerText.includes('players in the room')");
  const roomId = await cdp.evaluate(gm, "location.pathname.split('/').pop()");
  const game = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  console.log("Created LAN room through the home screen.");

  const phones = [];
  for (const name of ["Monkey", "Wolf"]) {
    const session = await cdp.page(`${base}/join/${game.code}`);
    await cdp.wait(session, "!!document.querySelector('input')");
    await cdp.evaluate(session, `(() => {
      const input = document.querySelector('input');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(name)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await cdp.click(session, "Enter");
    await cdp.wait(session, "location.pathname.startsWith('/play/')");
    phones.push(session);
  }
  await query({ table: "players", operation: "insert", values: Array.from({ length: 6 }, (_, index) => ({ name: `Extra ${index}`, room_id: roomId })) });
  let roster = await query({ table: "players", filters: [["room_id", roomId]], order: "created_at" });
  for (const [seat, player] of roster.entries()) await query({ table: "players", operation: "update", filters: [["id", player.id]], values: { seat_position: seat } });
  await cdp.click(gm, "Confirm & Assign Roles");
  await cdp.wait(gm, "document.body.innerText.includes('Send Roles to Players')");
  // Use a deterministic lot for the role-specific smoke test after exercising random assignment.
  const roles = ["v26", "m01", "m02", "v03", "v05", "v08", "v10", "e02"];
  const assignments = Object.fromEntries(roster.map((player, index) => [player.id, roles[index]]));
  await cdp.evaluate(gm, `(() => {
    const key = 'wotct_gm_snapshot_${roomId}';
    const snapshot = JSON.parse(localStorage.getItem(key));
    snapshot.roleAssignments = ${JSON.stringify(assignments)};
    localStorage.setItem(key, JSON.stringify(snapshot));
  })()`);
  await cdp.call("Page.reload", {}, gm);
  await cdp.click(gm, "Send Roles to Players");
  await cdp.wait(phones[0], "document.body.innerText.includes('Monkey Tamer')");
  await cdp.wait(phones[1], "document.body.innerText.includes('Werewolf')");
  roster = await query({ table: "players", filters: [["room_id", roomId]] });
  assert.ok(roster.filter(player => ["Monkey", "Wolf"].includes(player.name)).every(player => player.is_ready));
  console.log("Joined from isolated phone browsers; assigned and delivered roles; readiness updates reached the server.");

  await cdp.wait(gm, "!!document.querySelector('button[aria-label=\"Monkey Tamer\"]')");
  await cdp.evaluate(gm, "document.querySelector('button[aria-label=\"Monkey Tamer\"]').click()");
  await cdp.wait(phones[0], "!!document.querySelector('[data-testid=phone-action-map] button[aria-label=Wolf]')");
  await cdp.evaluate(phones[0], "document.querySelector('[data-testid=phone-action-map] button[aria-label=Wolf]').click()");
  await cdp.wait(phones[0], "[...document.querySelectorAll('button')].some(button => button.textContent.includes('Reveal card: Wolf') && !button.disabled)");
  await cdp.evaluate(phones[0], "[...document.querySelectorAll('button')].find(button => button.textContent.includes('Reveal card: Wolf')).click()");
  await cdp.wait(phones[0], "!!document.querySelector('[data-testid=monkey-revealed-card]')");
  await cdp.wait(gm, "!!document.querySelector('[data-testid=monkey-revealed-card]')");
  assert.ok(!(await cdp.evaluate(phones[1], "!!document.querySelector('[data-testid=monkey-revealed-card]')")), "Private reveal reached the wrong screen");
  await cdp.click(phones[0], "Close");
  await cdp.wait(gm, "!document.querySelector('[data-testid=monkey-revealed-card]')");
  await cdp.click(phones[0], "Reopen card");
  await cdp.wait(gm, "!!document.querySelector('[data-testid=monkey-revealed-card]')");
  console.log("Monkey choice, confirmation, private reveal and shared close/reopen worked through the real LAN transport.");

  await delay(2500);
  const snapshots = await fetch(`${base}/api/lan/snapshots`).then(response => response.json());
  assert.ok(snapshots[`wotct_gm_snapshot_${roomId}`]);
  assert.ok(snapshots[`wotct_phone_${roomId}`]);
  await cdp.call("Page.reload", {}, phones[0]);
  await cdp.wait(phones[0], "!!document.querySelector('[data-testid=monkey-revealed-card]')");
  console.log("Host backups saved; phone refresh recovered its revealed card.");

  const port = lan.server.address().port;
  await lan.close();
  lan = createLanServer({ distDir: resolve(root, ".build/app"), dataDir: resolve(temporary, "data"), joinBaseUrl: base });
  await new Promise(done => lan.server.listen(port, "127.0.0.1", done));
  await query({ table: "players", operation: "insert", values: { room_id: roomId, name: "Recovered connection", character: "v25", seat_position: 8 } });
  await cdp.wait(gm, "document.body.innerText.includes('Recovered connection')");
  await cdp.wait(phones[0], "[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Close' && !button.disabled)");
  console.log("Server restart recovered room data and the GM's missed roster update.");

  await cdp.click(phones[0], "Close");
  await cdp.click(gm, "End Night 1");
  await cdp.wait(phones[0], "document.body.innerText.includes('Day')");
  await cdp.wait(gm, "!!document.querySelector('button .lucide-play')");
  await cdp.evaluate(gm, "document.querySelector('button .lucide-play').closest('button').click()");
  await cdp.wait(phones[0], "document.body.innerText.includes('04:59') || document.body.innerText.includes('04:58')");
  const updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  assert.equal(updated.phase_state.phase, "day");
  assert.equal(updated.timer_state.isRunning, true);
  assert.ok(updated.timer_state.timeLeft < 300);
  await cdp.evaluate(gm, "document.querySelector('button[aria-label=\"End Game Manually\"]').click()");
  await cdp.click(gm, "Village Victory");
  await cdp.click(gm, "Yes, end it");
  await cdp.wait(phones[0], "document.body.innerText.includes('Victory!')");
  await cdp.wait(phones[1], "document.body.innerText.includes('Defeat')");
  // The outcome broadcast and room write use separate requests; wait for both.
  let finishedRoom;
  const savedDeadline = Date.now() + 5000;
  do {
    finishedRoom = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
    if (finishedRoom.status === "finished") break;
    await delay(100);
  } while (Date.now() < savedDeadline);
  assert.equal(finishedRoom.status, "finished");
  console.log("Phase changes, running timers, saved game over and player-specific outcomes worked offline.");
  assert.deepEqual(errors, [], `Browser exceptions: ${errors.join("\n")}`);
  assert.deepEqual(externalRequests, [], `External requests attempted: ${externalRequests.join("\n")}`);
  console.log("PASS: no browser exceptions or external HTTP requests while cloud/internet requests were blocked.");
} finally {
  if (cdp) { await cdp.call("Browser.close").catch(() => {}); cdp.socket.close(); }
  if (browser && browser.exitCode === null) {
    browser.kill();
    await new Promise(done => browser.once("exit", done));
  }
  if (lan) await lan.close();
  // Only remove this test's verified temporary directory after its browser/server have stopped.
  if (!temporary.startsWith(resolve(tmpdir(), "wotct-lan-browser-"))) throw new Error("Unexpected test directory");
  for (let attempt = 0; attempt < 10; attempt++) {
    try { rmSync(temporary, { recursive: true, force: true }); break; }
    catch (error) { if (attempt === 9) throw error; await delay(200); }
  }
}
