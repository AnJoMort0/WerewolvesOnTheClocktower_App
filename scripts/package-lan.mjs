import { cpSync, mkdirSync, existsSync, copyFileSync, readFileSync, writeFileSync, rmSync, lstatSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kit = resolve(root, ".build/lan-kit");
if (existsSync(resolve(kit, ".lan"))) throw new Error("lan-kit contains local game data. Move that used kit to a backup location before preparing a fresh package; no saved games were overwritten.");
const build = spawnSync(process.execPath, [resolve(root, "scripts/build-lan.mjs")], { cwd: root, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);
mkdirSync(resolve(kit, "scripts"), { recursive: true });
mkdirSync(resolve(kit, "docs"), { recursive: true });
// Remove only this generated directory so old hashed bundles cannot enter a release.
const kitDist = resolve(kit, "dist");
if (kitDist !== resolve(root, ".build/lan-kit/dist")) throw new Error("Invalid package output directory.");
if (existsSync(kitDist)) {
  if (lstatSync(kitDist).isSymbolicLink()) throw new Error("The package dist directory must not be a symbolic link.");
  rmSync(kitDist, { recursive: true });
}
cpSync(resolve(root, ".build/app"), kitDist, { recursive: true });
cpSync(resolve(root, "server/lan"), resolve(kit, "server/lan"), { recursive: true });
for (const file of ["scripts/lan.mjs", "scripts/start-lan.ps1", "Start LAN Game.cmd", "docs/offline-lan.md", ".nvmrc"]) copyFileSync(resolve(root, file), resolve(kit, file));
const kitDocsImages = resolve(kit, "docs/images");
const obsoleteHeroImages = resolve(kit, "images");
if (kitDocsImages !== resolve(root, ".build/lan-kit/docs/images") || obsoleteHeroImages !== resolve(root, ".build/lan-kit/images")) throw new Error("Invalid package image directory.");
for (const generatedImages of [kitDocsImages, obsoleteHeroImages]) {
  if (existsSync(generatedImages)) {
    if (lstatSync(generatedImages).isSymbolicLink()) throw new Error("A package image directory must not be a symbolic link.");
    rmSync(generatedImages, { recursive: true });
  }
}
cpSync(resolve(root, "docs/images"), kitDocsImages, { recursive: true });
writeFileSync(resolve(kit, "README.md"), readFileSync(resolve(root, "docs/README.md"), "utf8")
  .replaceAll("(images/", "(docs/images/")
  .replaceAll('src="images/', 'src="docs/images/')
  .replaceAll("(offline-lan.md)", "(docs/offline-lan.md)"));
const licenses = resolve(kit, "licenses");
mkdirSync(licenses, { recursive: true });
for (const font of ["cinzel", "crimson-text"]) copyFileSync(resolve(root, `node_modules/@fontsource/${font}/LICENSE`), resolve(licenses, `${font}.txt`));
copyFileSync(resolve(root, "node_modules/qr-scanner/LICENSE"), resolve(licenses, "qr-scanner.txt"));
if (process.platform === "win32") {
  const license = resolve(dirname(process.execPath), "LICENSE");
  if (!existsSync(license)) throw new Error("The Node.js LICENSE file must be next to node.exe to create a portable Windows kit.");
  copyFileSync(process.execPath, resolve(kit, "node.exe"));
  copyFileSync(license, resolve(licenses, "node.txt"));
}
console.log(`\nOffline game prepared in ${kit}.\n${process.platform === "win32" ? "Copy the whole folder to a Windows computer and double-click Start LAN Game.cmd. Node.js is included." : "Copy the folder to a computer with Node.js 20/22 and run node scripts/lan.mjs."}\nRead docs/offline-lan.md before the first game. Existing LAN game data is never included in this package.`);
