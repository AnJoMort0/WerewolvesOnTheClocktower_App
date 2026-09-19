import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

if (process.platform !== "win32" || process.arch !== "x64") {
  throw new Error("Create the Windows x64 release on Windows using x64 Node.js. GitHub's LAN release workflow can do this for you.");
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kit = resolve(root, ".build/lan-kit");
const output = resolve(root, ".build/release");
const name = "WerewolvesOnTheClocktower-LAN-Windows-x64.zip";
const archive = resolve(output, name);
const prepared = spawnSync(process.execPath, [resolve(root, "scripts/package-lan.mjs")], { cwd: root, stdio: "inherit" });
if (prepared.status !== 0) process.exit(prepared.status ?? 1);
mkdirSync(output, { recursive: true });
const zipped = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", resolve(root, "scripts/archive-lan.ps1"), "-KitPath", kit, "-Destination", archive], { cwd: root, stdio: "inherit" });
if (zipped.status !== 0) process.exit(zipped.status ?? 1);
const hash = createHash("sha256").update(readFileSync(archive)).digest("hex");
writeFileSync(`${archive}.sha256`, `${hash}  ${name}\n`);
console.log(`\nReady-to-play release: ${archive}\nUpload the ZIP and its .sha256 file to a GitHub release. No saved games are included.`);
