// Capture the real offline app using an isolated demonstration room and browser.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";
import { CDP } from "../src/test/e2e/helpers/browser.mjs";
import { createLanServer } from "../server/lan/server.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "docs/images");
const temporary = mkdtempSync(resolve(tmpdir(), "wotct-presentation-"));
const browserPath = process.env.LAN_BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
if (!existsSync(browserPath)) throw new Error("Set LAN_BROWSER to an installed Chromium browser.");
if (!existsSync(resolve(root, ".build/app/index.html"))) throw new Error("Run npm run lan:prepare first.");
const names = ["Alice", "Bruno", "Camille", "Diana", "Elio", "Félix", "Grace", "Hugo", "Isla"];
const roles = ["e02", "e04", "e01", "v08", "v04", "s01", "v02", "e03", "m02"];
const errors = [], externalRequests = [];
let lan, browser, cdp, base;

async function query(body) {
  const result = await fetch(`${base}/api/lan/query`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(response => response.json());
  assert.equal(result.error, null, JSON.stringify(result.error));
  return result.data;
}
async function viewport(session, width, height, mobile = false) {
  await cdp.call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile }, session);
}
async function capture(session, name) {
  await cdp.evaluate(session, "document.fonts.ready");
  await cdp.wait(session, "[...document.images].filter(image => image.getAttribute('src') && image.getBoundingClientRect().top < innerHeight && image.getBoundingClientRect().bottom > 0).every(image => image.complete && image.naturalWidth > 0)");
  await delay(800); // Let card transitions finish before photographing the interface.
  const screenshot = await cdp.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, session);
  await sharp(Buffer.from(screenshot.data, "base64")).webp({ quality: 88, effort: 6 }).toFile(resolve(output, `${name}.webp`));
  console.log(`Captured docs/images/${name}.webp`);
}

try {
  mkdirSync(output, { recursive: true });
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
  await viewport(gm, 1440, 1100);
  await cdp.evaluate(gm, "localStorage.setItem('preferred_language', 'en'); localStorage.setItem('preferred_skin_pack', 'default')");
  await cdp.call("Page.reload", {}, gm);
  await cdp.click(gm, "Start LAN game");
  await cdp.wait(gm, "location.pathname.startsWith('/gm/') && document.body.innerText.includes('players in the room')");
  const roomId = await cdp.evaluate(gm, "location.pathname.split('/').pop()");
  const room = await query({ table: "rooms", filters: [["id", roomId]], cardinality: "single" });
  const phones = [];
  for (const name of names) {
    const phone = await cdp.page(`${base}/join/${room.code}`);
    await viewport(phone, 414, 896, true);
    await cdp.wait(phone, "!!document.querySelector('input')");
    await cdp.evaluate(phone, `(() => {
      const input = document.querySelector('input');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(name)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await cdp.click(phone, "Enter");
    await cdp.wait(phone, "location.pathname.startsWith('/play/')");
    phones.push(phone);
  }
  const roster = await query({ table: "players", filters: [["room_id", roomId]], order: "created_at" });
  for (const [seat, player] of roster.entries()) await query({ table: "players", operation: "update", filters: [["id", player.id]], values: { seat_position: seat } });
  await cdp.click(gm, "Confirm & Assign Roles");
  await cdp.wait(gm, "document.body.innerText.includes('Send Roles to Players')");
  const assignments = Object.fromEntries(roster.map((player, index) => [player.id, roles[index]]));
  await cdp.evaluate(gm, `(() => {
    const key = 'wotct_gm_snapshot_${roomId}';
    const snapshot = JSON.parse(localStorage.getItem(key));
    snapshot.roleAssignments = ${JSON.stringify(assignments)};
    localStorage.setItem(key, JSON.stringify(snapshot));
  })()`);
  await cdp.call("Page.reload", {}, gm);
  await cdp.click(gm, "Send Roles to Players");
  await cdp.wait(phones[0], "document.body.innerText.includes('Evil Witch')");
  await cdp.wait(gm, "!document.body.innerText.includes('Roles sent to all players!')");
  await capture(phones[0], "player-card");
  await cdp.click(gm, "End Night 1");
  await cdp.wait(gm, "document.body.innerText.includes('Start Tribunal')");
  await cdp.click(gm, "Start Tribunal");
  await cdp.wait(gm, "document.body.innerText.includes('Next Night')");
  await cdp.click(gm, "Next Night");
  await cdp.wait(gm, "!!document.querySelector('button[data-phone-mode=\"poison\"]')");
  await cdp.wait(gm, "!document.body.innerText.includes('Night 1 ended. Dawn has arrived!')");
  await capture(gm, "gm-screen");
  await cdp.evaluate(gm, "document.querySelector('button[data-phone-mode=\"poison\"]').click()");
  await cdp.wait(phones[0], "!!document.querySelector('button[aria-label=Camille]')");
  await cdp.evaluate(phones[0], "document.querySelector('button[aria-label=Camille]').click()");
  await cdp.wait(phones[0], "[...document.querySelectorAll('button')].some(button => button.textContent.includes('Confirm') && !button.disabled) && document.body.innerText.includes('Poison Camille?')");
  await capture(phones[0], "player-action");
  assert.deepEqual(errors, [], "Browser exceptions");
  assert.deepEqual(externalRequests, [], "External requests");
} finally {
  if (cdp) { await cdp.call("Browser.close").catch(() => {}); cdp.socket.close(); }
  if (browser && browser.exitCode === null) { browser.kill(); await new Promise(done => browser.once("exit", done)); }
  if (lan) await lan.close();
  if (!temporary.startsWith(resolve(tmpdir(), "wotct-presentation-"))) throw new Error("Unexpected capture directory");
  for (let attempt = 0; attempt < 10; attempt++) {
    try { rmSync(temporary, { recursive: true, force: true }); break; }
    catch (error) { if (attempt === 9) throw error; await delay(200); }
  }
}
