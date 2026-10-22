// Real touch gesture against the built app; run after npm run build.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { createLanServer } from "../../../server/lan/server.mjs";
import { CDP } from "./helpers/browser.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const browserPath = process.env.LAN_BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
if (!existsSync(browserPath)) throw new Error("Set LAN_BROWSER to an installed Edge/Chrome/Chromium executable.");
if (!existsSync(resolve(root, ".build/app/index.html"))) throw new Error("Run npm run build first.");

const temporary = mkdtempSync(resolve(tmpdir(), "wotct-touch-drag-"));
let lan, browser, cdp, base;
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
  cdp = new CDP(socket, { base });

  const { browserContextId } = await cdp.call("Target.createBrowserContext");
  const { targetId } = await cdp.call("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = await cdp.call("Target.attachToTarget", { targetId, flatten: true });
  await cdp.call("Runtime.enable", {}, sessionId);
  await cdp.call("Page.enable", {}, sessionId);
  await cdp.call("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 }, sessionId);
  await cdp.call("Emulation.setDeviceMetricsOverride", { width: 800, height: 600, deviceScaleFactor: 1, mobile: false }, sessionId);
  await cdp.call("Page.navigate", { url: base }, sessionId);
  await cdp.wait(sessionId, "!!document.querySelector('#root')?.children.length");
  await cdp.evaluate(sessionId, `(() => {
    window.touchDragEvents = [];
    document.addEventListener('touchstart', event => window.touchDragEvents.push('touch:' + event.target.tagName));
    const source = document.createElement('div');
    source.setAttribute('draggable', 'true');
    source.style.cssText = 'position:fixed;left:20px;top:100px;width:100px;height:100px;z-index:99999;background:red';
    source.innerHTML = '<img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E" style="width:100%;height:100%">';
    source.addEventListener('dragstart', event => { window.touchDragEvents.push('start'); event.dataTransfer.setData('text/plain', 'game-action'); });
    source.addEventListener('click', () => window.touchDragEvents.push('tap'));
    const target = document.createElement('div');
    target.style.cssText = 'position:fixed;left:220px;top:100px;width:100px;height:100px;z-index:99999;background:blue';
    target.addEventListener('dragenter', event => event.preventDefault());
    target.addEventListener('dragover', event => event.preventDefault());
    target.addEventListener('drop', event => { event.preventDefault(); window.touchDragEvents.push(event.dataTransfer.getData('text/plain')); });
    document.body.append(source, target);
  })()`);
  const touch = (type, x, y) => cdp.call("Input.dispatchTouchEvent", {
    type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1, radiusX: 2, radiusY: 2, force: 1 }],
  }, sessionId);
  await touch("touchStart", 70, 150);
  await delay(350);
  await touch("touchMove", 150, 150);
  await delay(200);
  await touch("touchMove", 270, 150);
  await delay(350);
  await touch("touchEnd", 270, 150);
  await delay(400);
  assert.deepEqual(await cdp.evaluate(sessionId, "window.touchDragEvents"), ["touch:IMG", "start", "game-action"]);
  assert.equal(await cdp.evaluate(sessionId, `(() => {
    const image = document.querySelector('[draggable="true"] img');
    return !image.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  })()`), true);
  await cdp.evaluate(sessionId, "window.touchDragEvents = []");
  await touch("touchStart", 70, 150);
  await delay(80);
  await touch("touchEnd", 70, 150);
  await delay(150);
  assert.deepEqual(await cdp.evaluate(sessionId, "window.touchDragEvents"), ["touch:IMG", "tap"]);
  console.log("Touch hold, image drag and drop worked; source context menu was suppressed.");
} finally {
  cdp?.socket.close();
  browser?.kill();
  await lan?.close();
  rmSync(temporary, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
