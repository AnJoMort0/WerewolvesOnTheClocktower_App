import { existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createLanServer } from "../server/lan/server.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const port = Number(option("--port") ?? process.env.LAN_PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Choose a port from 1 to 65535.");
const addresses = Object.values(networkInterfaces()).flat().filter(address => address?.family === "IPv4" && !address.internal).map(address => address.address);
// Prefer a private LAN address over VPN/link-local adapters; print all addresses for troubleshooting.
addresses.sort((a, b) => Number(/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(b)) - Number(/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a)));
const ip = option("--ip") ?? process.env.LAN_IP ?? addresses[0] ?? "127.0.0.1";
if (!addresses.includes(ip) && ip !== "127.0.0.1") throw new Error(`The host does not have IP ${ip}. Available addresses: ${addresses.join(", ")}`);
const distDir = resolve(root, existsSync(resolve(root, "package-lock.json")) ? ".build/app" : "dist");
if (!existsSync(resolve(distDir, "index.html"))) {
  console.error("The offline app has not been prepared. With internet available, run npm ci, then npm run lan:prepare. See docs/offline-lan.md.");
  process.exit(1);
}
const lan = createLanServer({ distDir, dataDir: resolve(option("--data") ?? process.env.LAN_DATA_DIR ?? resolve(root, ".lan")), joinBaseUrl: `http://${ip}:${port}` });
lan.server.on("error", error => {
  console.error(error.code === "EADDRINUSE" ? `Port ${port} is busy. Close the other server or run npm run lan -- --port 8081.` : error);
  process.exit(1);
});
lan.server.listen(port, "0.0.0.0", () => {
  console.log(`\nWerewolves on the Clocktower - OFFLINE LAN\n\nGM:      http://localhost:${port}\nPlayers: http://${ip}:${port}\nGM PIN:  ${lan.pin} (only needed to host from another device)\n\nOther network addresses: ${addresses.map(address => `http://${address}:${port}`).join(", ") || "none"}\nData: ${lan.databaseFile}\nKeep this window open. Press Ctrl+C to stop.\n`);
  if (ip === "127.0.0.1") console.warn("No network adapter found. Connect the host and phones to the same Wi-Fi before starting.");
  if (!args.includes("--no-open")) {
    const url = `http://localhost:${port}`;
    const browser = process.platform === "win32"
      ? spawn("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", `Start-Process '${url}'`], { windowsHide: true, stdio: "ignore" })
      : spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], { stdio: "ignore" });
    browser.on("error", () => console.log(`Open ${url} in your browser.`));
  }
});
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => {
  if (stopping) return;
  stopping = true;
  await lan.close();
  process.exit(0);
});
