// Verify the actual Pages artifact, without SPA fallbacks or a game backend.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { CDP } from "./helpers/browser.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const dist = resolve(root, ".build/rulebook");
const prefix = process.env.RULEBOOK_BASE_PATH ?? "/WerewolvesOnTheClocktower_App/";
const browserPath = process.env.LAN_BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
if (!existsSync(browserPath)) throw new Error("Set LAN_BROWSER to an installed Chromium browser.");
if (!existsSync(resolve(dist, "index.html"))) throw new Error("Run npm run rulebook:build first.");
for (const excluded of ["sw.js", "manifest.webmanifest", "server", "docs", "_redirects"]) {
  assert.ok(!existsSync(resolve(dist, excluded)), `Non-rulebook output included: ${excluded}`);
}
const temporary = mkdtempSync(resolve(tmpdir(), "wotct-rulebook-browser-"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".woff": "font/woff", ".woff2": "font/woff2" };
const requests = [], missing = [], errors = [], externalRequests = [];
const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    requests.push(pathname);
    if (!pathname.startsWith(prefix)) throw new Error("Not in Pages path");
    const file = resolve(dist, pathname.slice(prefix.length) || "index.html");
    if (!file.startsWith(dist + sep)) throw new Error("Invalid static path");
    const body = readFileSync(file);
    response.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    missing.push(request.url);
    response.writeHead(404); response.end();
  }
});
let browser, cdp;
try {
  await new Promise(done => server.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = spawn(browserPath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-extensions", "--remote-debugging-port=0", `--user-data-dir=${resolve(temporary, "profile")}`], { windowsHide: true, stdio: "ignore" });
  const activePort = resolve(temporary, "profile/DevToolsActivePort");
  for (let attempt = 0; attempt < 100 && !existsSync(activePort); attempt++) await delay(100);
  assert.ok(existsSync(activePort), "Browser did not start");
  const debugPort = readFileSync(activePort, "utf8").split("\n")[0];
  const version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then(response => response.json());
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.addEventListener("open", done, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  cdp = new CDP(socket, { base, errors, externalRequests });
  const page = await cdp.page(`${base}${prefix}?lang=en#v27`);
  await cdp.wait(page, "!!document.querySelector('article[lang=en]') && document.getElementById('v27').getBoundingClientRect().top >= 0 && document.getElementById('v27').getBoundingClientRect().top < 32");
  assert.ok((await cdp.evaluate(page, "document.title")).includes("Rulebook"));
  assert.ok(!(await cdp.evaluate(page, "document.body.innerText.includes('Start LAN game')")));
  for (const [label, language] of [["Português", "pt"], ["Français", "fr"], ["English", "en"]]) {
    // Language controls are above the current character anchor.
    await cdp.click(page, label);
    await cdp.wait(page, `!!document.querySelector('article[lang=${language}]')`);
    assert.equal(await cdp.evaluate(page, "location.hash"), "#v27");
  }
  await cdp.call("Page.reload", {}, page);
  await cdp.wait(page, "!!document.getElementById('v27') && document.getElementById('v27').getBoundingClientRect().top >= 0 && document.getElementById('v27').getBoundingClientRect().top < 32");
  await cdp.evaluate(page, "[...document.querySelectorAll('a[href=\"#e02\"]')][0].click()");
  await cdp.wait(page, "location.hash === '#e02'");
  await cdp.evaluate(page, "document.querySelector('details[data-character-lore=e02]').open = true");
  await cdp.wait(page, "!!document.querySelector('details[data-character-lore=e02] button[data-lore-explanation]')");
  await cdp.evaluate(page, "document.querySelector('details[data-character-lore=e02] button[data-lore-explanation]').click()");
  await cdp.wait(page, "!!document.querySelector('[role=dialog]')");
  // Load offscreen lazy images too, to check all referenced artwork paths.
  await cdp.evaluate(page, "document.querySelectorAll('img').forEach(image => image.loading = 'eager')");
  await cdp.wait(page, "[...document.images].filter(image => image.getAttribute('src')).every(image => image.complete && image.naturalWidth > 0)");
  await cdp.evaluate(page, "document.fonts.ready");
  assert.deepEqual(errors, [], "Browser exceptions");
  assert.deepEqual(externalRequests, [], "External requests");
  assert.deepEqual(missing.filter(path => !path.endsWith('/favicon.ico')), [], "Broken static assets");
  assert.ok(!requests.some(path => /\/api\/|\/gm\/|\/join|\/play\//.test(path)), "Game backend requested");
  console.log("PASS: Pages subpath, character anchors and refresh, three languages, artwork, fonts and lore work without game/backend/external requests.");
} finally {
  if (cdp) { await cdp.call("Browser.close").catch(() => {}); cdp.socket.close(); }
  if (browser && browser.exitCode === null) { browser.kill(); await new Promise(done => browser.once("exit", done)); }
  await new Promise(done => { server.close(done); server.closeAllConnections(); });
  if (!temporary.startsWith(resolve(tmpdir(), "wotct-rulebook-browser-"))) throw new Error("Unexpected test directory");
  for (let attempt = 0; attempt < 10; attempt++) {
    try { rmSync(temporary, { recursive: true, force: true }); break; }
    catch (error) { if (attempt === 9) throw error; await delay(200); }
  }
}
