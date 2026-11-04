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
  await cdp.wait(gm, "!!document.querySelector('#beginner-toggle')");
  await cdp.evaluate(gm, "document.querySelector('#beginner-toggle').click()");
  const roomId = await cdp.evaluate(gm, "location.pathname.split('/').pop()");
  const game = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  await cdp.wait(gm, "document.querySelector('#beginner-toggle')?.getAttribute('aria-checked') === 'true'");
  await cdp.wait(gm, `JSON.parse(localStorage.getItem('wotct_gm_snapshot_${roomId}') || '{}').beginnerMode === true`);
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
  const beginnerRoles = await cdp.evaluate(gm, `Object.values(JSON.parse(localStorage.getItem('wotct_gm_snapshot_${roomId}')).roleAssignments)`);
  assert.ok(beginnerRoles.every(role => ["e01", "e02", "e03", "e04", "v01", "v02", "v03", "v06", "v07", "v08", "v10", "v11", "v13", "v14", "v17", "v18", "m01", "m02", "m04", "s01", "s02", "f01", "f02", "l01", "l02", "l04", "l05", "l06"].includes(role)));
  assert.equal((await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" })).phase_state.beginnerMode, true);
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
  await cdp.evaluate(phones[0], "document.querySelector('button[aria-label=Rulebook]').click()");
  await cdp.wait(phones[0], "!!document.querySelector('[role=dialog] article#e01')");
  assert.equal(await cdp.evaluate(phones[0], "document.querySelector('[role=dialog] article#v28') === null && document.querySelector('[role=dialog] article#t01') === null"), true);
  await cdp.evaluate(phones[0], "document.querySelector('[role=dialog] button[aria-label=Close]').click()");
  console.log("Joined from isolated phone browsers; assigned and delivered roles; readiness updates reached the server.");

  const travellerPhone = await cdp.page(`${base}/join/${game.code}`);
  await cdp.wait(travellerPhone, "!!document.querySelector('input') && document.body.innerText.includes('Join as a Traveller?')");
  await cdp.evaluate(travellerPhone, `(() => {
    const input = document.querySelector('input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Late Traveller');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await cdp.click(travellerPhone, "Ask to join as a Traveller");
  await cdp.wait(gm, "document.body.innerText.includes('Late Traveller wants to join as a Traveller.')");
  await cdp.click(gm, "Accept");
  const unassignedTraveller = (await query({ table: "players", filters: [["room_id", roomId]] }))
    .find(player => player.name === "Late Traveller");
  assert.ok(unassignedTraveller);
  await cdp.wait(gm, "[...document.querySelectorAll('h3')].some(heading => heading.textContent === 'Late Traveller' && heading.closest('section')?.querySelector('[role=combobox]'))");
  await cdp.evaluate(gm, `(() => {
    const heading = [...document.querySelectorAll('h3')].find(heading => heading.textContent === 'Late Traveller');
    const selector = heading?.closest('section')?.querySelector('[role=combobox]');
    if (!selector) throw new Error('Traveller role selector is missing');
    selector.click();
  })()`);
  await cdp.wait(gm, "[...document.querySelectorAll('[role=option]')].some(option => option.textContent.includes(\"t04. Devil's Advocate\"))");
  await cdp.evaluate(gm, `[...document.querySelectorAll('[role=option]')].find(option => option.textContent.includes("t04. Devil's Advocate")).click()`);
  await cdp.wait(gm, `document.body.innerText.includes("t04. Devil's Advocate")`);
  await cdp.click(gm, "Confirm");
  await cdp.wait(travellerPhone, "document.body.innerText.includes('You are a Villager') || document.body.innerText.includes('You are an Evil Being')");
  await cdp.click(travellerPhone, "I understand");
  await cdp.wait(gm, "document.body.innerText.includes('Drag this Traveller between two players to seat them.')");
  await cdp.evaluate(gm, `(() => {
    const source = [...document.querySelectorAll('[draggable=true]')]
      .find(element => element.title?.startsWith('Late Traveller'));
    const target = document.querySelector('[aria-label="Insert after seat 1"]');
    if (!source || !target) throw new Error('Traveller placement controls are missing');
    const dataTransfer = new DataTransfer();
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
  })()`);
  let traveller;
  await cdp.wait(gm, `
    !document.querySelector('[draggable=true][title^="Late Traveller"]')
      && !document.querySelector('[aria-label^="Insert after seat"]')
  `);
  const travellerDeadline = Date.now() + 5000;
  do {
    const currentRoster = await query({ table: "players", filters: [["room_id", roomId]] });
    traveller = currentRoster.find(player => player.name === "Late Traveller");
    if (traveller?.traveller_state === "placed") break;
    await delay(100);
  } while (Date.now() < travellerDeadline);
  assert.equal(traveller?.traveller_state, "placed");
  assert.equal(traveller?.seat_position, 1);
  assert.equal(traveller?.traveller_role, "t04");
  const travellerRoleNames = { t04: "Devil's Advocate" };
  await cdp.click(phones[1], "Hide Role");
  await cdp.wait(phones[1], `!!document.querySelector(${JSON.stringify(`button[aria-label="${travellerRoleNames[traveller.traveller_role]}"]`)})`);
  console.log("Late Traveller request, approval, secret alignment reveal, public role and circle placement worked through the real LAN transport.");

  await cdp.wait(gm, "!!document.querySelector('button[aria-label=\"Monkey Tamer\"]')");
  await cdp.evaluate(gm, "document.querySelector('button[aria-label=\"Monkey Tamer\"]').click()");
  await cdp.wait(phones[0], "!!document.querySelector('[data-testid=phone-action-map] button[aria-label=Wolf]')");
  await cdp.evaluate(phones[0], "document.querySelector('[data-testid=phone-action-map] button[aria-label=Wolf]').click()");
  await cdp.wait(phones[0], "[...document.querySelectorAll('button')].some(button => button.textContent.includes('See: Wolf') && !button.disabled)");
  await cdp.evaluate(phones[0], "[...document.querySelectorAll('button')].find(button => button.textContent.includes('See: Wolf')).click()");
  await cdp.wait(phones[0], "!!document.querySelector('[data-testid=monkey-revealed-card]')");
  await cdp.wait(gm, "!!document.querySelector('[data-testid=monkey-revealed-card]')");
  assert.ok(!(await cdp.evaluate(phones[1], "!!document.querySelector('[data-testid=monkey-revealed-card]')")), "Private reveal reached the wrong screen");
  await cdp.click(phones[0], "Close");
  await cdp.wait(gm, "!document.querySelector('[data-testid=monkey-revealed-card]')");
  await cdp.click(phones[0], "Reopen");
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
  await cdp.wait(gm, "!!document.querySelector('button .lucide-play') && !document.querySelector('button .lucide-play').closest('button').disabled");
  await cdp.evaluate(gm, "document.querySelector('button .lucide-play').closest('button').click()");
  await cdp.wait(phones[0], "document.body.innerText.includes('04:59') || document.body.innerText.includes('04:58')");
  let updated;
  const timerSavedDeadline = Date.now() + 5000;
  do {
    updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
    if (updated.timer_state?.status === "running") break;
    await delay(100);
  } while (Date.now() < timerSavedDeadline);
  assert.equal(updated.phase_state.phase, "day");
  assert.equal(updated.timer_state.version, 2);
  assert.equal(updated.timer_state.status, "running");
  assert.ok(Date.parse(updated.timer_state.deadlineAt) > Date.now());
  const runningRevision = updated.timer_state.revision;
  await delay(2200);
  updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  assert.equal(updated.timer_state.revision, runningRevision, "Local ticks must not write the room");
  console.log("Timer runs locally without room writes.");
  await lan.close();
  lan = createLanServer({ distDir: resolve(root, ".build/app"), dataDir: resolve(temporary, "data"), joinBaseUrl: base });
  await new Promise(done => lan.server.listen(port, "127.0.0.1", done));
  updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  assert.equal(updated.timer_state.revision, runningRevision, "LAN restart must preserve the deadline");
  await cdp.wait(phones[0], "document.body.innerText.includes('04:5')");
  console.log("LAN restart preserved the running timer.");
  await cdp.call("Page.reload", {}, phones[0]);
  await cdp.wait(phones[0], "document.body.innerText.includes('04:5')");
  console.log("Phone refresh recovered running deadline.");
  await cdp.call("Page.reload", {}, gm);
  await cdp.wait(gm, "document.body.innerText.includes('04:5')");
  console.log("GM refresh recovered running deadline.");
  updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  assert.equal(updated.timer_state.revision, runningRevision, "GM refresh must not reset the timer");
  await cdp.wait(gm, "!!document.querySelector('button .lucide-pause') && !document.querySelector('button .lucide-pause').closest('button').disabled");
  await cdp.evaluate(gm, "document.querySelector('button .lucide-pause').closest('button').click()");
  await cdp.wait(gm, "!!document.querySelector('button .lucide-play') && !document.querySelector('button .lucide-play').closest('button').disabled");
  updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  assert.equal(updated.timer_state.status, "paused");
  assert.ok(updated.timer_state.remainingMs > 0 && updated.timer_state.remainingMs < 300000);
  const pausedRevision = updated.timer_state.revision;
  await delay(1200);
  updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  assert.equal(updated.timer_state.revision, pausedRevision);
  console.log("Pause persisted without tick writes.");
  await cdp.call("Page.reload", {}, phones[0]);
  await cdp.wait(phones[0], "document.body.innerText.includes('04:5')");
  await cdp.evaluate(gm, "document.querySelector('button .lucide-play').closest('button').click()");
  await cdp.wait(gm, "!!document.querySelector('button .lucide-pause') && !document.querySelector('button .lucide-pause').closest('button').disabled");
  updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  assert.equal(updated.timer_state.status, "running");
  console.log("Resume persisted.");
  await cdp.click(gm, "Start Tribunal");
  await cdp.wait(phones[0], "document.body.innerText.includes('Tribunal')");
  updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  assert.equal(updated.phase_state.phase, "tribunal");
  assert.equal(updated.timer_state.phase, "tribunal");
  assert.equal(updated.timer_state.status, "paused");
  assert.equal(updated.timer_state.remainingMs, 180000);
  console.log("Tribunal phase and timer changed atomically.");
  console.log("Waiting for Tribunal GM timer control.");
  await cdp.wait(gm, "!!document.querySelector('button .lucide-play') && !document.querySelector('button .lucide-play').closest('button').disabled");
  console.log("Starting Tribunal timer.");
  await cdp.evaluate(gm, "document.querySelector('button .lucide-play').closest('button').click()");
  console.log("Waiting for Tribunal reset control.");
  await cdp.wait(gm, "!!document.querySelector('button[aria-label=\"Reset timer\"]:not(:disabled)')");
  console.log("Resetting Tribunal timer.");
  await cdp.evaluate(gm, "document.querySelector('button[aria-label=\"Reset timer\"]').click()");
  const resetDeadline = Date.now() + 5000;
  do {
    updated = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
    if (updated.timer_state.status === "paused" && updated.timer_state.remainingMs === 180000) break;
    await delay(100);
  } while (Date.now() < resetDeadline);
  assert.equal(updated.timer_state.status, "paused");
  assert.equal(updated.timer_state.remainingMs, 180000);
  await cdp.wait(gm, "[...document.querySelectorAll('p')].some(p => p.textContent.includes('Votes needed for execution:') && p.textContent.includes('5'))");
  await cdp.evaluate(gm, `(() => {
    const row = [...document.querySelectorAll('div.bg-card.border.rounded-lg.p-2')]
      .find(element => element.textContent?.includes('Monkey'));
    if (!row) throw new Error('Monkey GM row is missing');
    row.click();
  })()`);
  await cdp.click(gm, "Execute");
  await cdp.wait(gm, `JSON.parse(localStorage.getItem('wotct_gm_snapshot_${roomId}') || '{}').playerStatuses?.[${JSON.stringify(roster.find(player => player.name === "Monkey").id)}] === 'dead-this-night'`);
  await cdp.click(gm, "Next Night");
  await cdp.wait(phones[0], "document.body.innerText.includes('Night 2')");
  const monkeyId = roster.find(player => player.name === "Monkey").id;
  const deathDeadline = Date.now() + 5000;
  let deadMonkey;
  do {
    deadMonkey = (await query({ table: "players", filters: [["id", monkeyId]], cardinality: "single" }));
    if (deadMonkey?.is_alive === false) break;
    await delay(100);
  } while (Date.now() < deathDeadline);
  assert.equal(deadMonkey.is_alive, false);
  await cdp.call("Page.reload", {}, phones[0]);
  await cdp.call("Page.reload", {}, gm);
  await cdp.wait(phones[0], "document.body.innerText.includes('Night 2') && !!document.querySelector('button .lucide-x')");
  await cdp.wait(gm, "document.body.innerText.includes('Night 2')");
  console.log("Voting threshold, Tribunal execution, permanent death and refreshed Night 2 state worked offline.");
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
