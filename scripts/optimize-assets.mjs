import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// On Windows, Sharp's file cache can keep a source image locked after conversion.
sharp.cache({ files: 0 });

const root = fileURLToPath(new URL("../", import.meta.url));
const assets = path.join(root, "src/assets");
const imageExtension = /\.(png|jpe?g)$/i;

export function displayPath(source) {
  const relative = path.relative(assets, path.resolve(source));
  const [folder] = relative.split(path.sep);
  if (folder === "display" || relative.startsWith("..") || path.isAbsolute(relative) || !imageExtension.test(relative)) return null;
  return path.join(assets, "display", relative.replace(imageExtension, ".webp"));
}

export async function optimizeAsset(source, { force = false } = {}) {
  const destination = displayPath(source);
  if (!destination) return false;
  const sourceInfo = await stat(source);
  if (!sourceInfo.isFile()) return false;
  if (!force) {
    const displayInfo = await stat(destination).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (displayInfo && displayInfo.mtimeMs >= sourceInfo.mtimeMs) return false;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  // A 512px edge supports 256px cards at 2x density. Icons need only 128px.
  const edge = path.relative(assets, source).split(path.sep)[0] === "icons" ? 128 : 512;
  await sharp(source).resize(edge, edge, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 100, effort: 6 }).toFile(destination);
  return true;
}

async function* sourceImages(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory() && !(directory === assets && entry.name === "display")) yield* sourceImages(source);
    else if (entry.isFile() && imageExtension.test(entry.name)) yield source;
  }
}

export async function optimizeAssets(options = {}) {
  let updated = 0;
  for await (const source of sourceImages(assets)) {
    if (await optimizeAsset(source, options)) updated++;
  }
  return updated;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const updated = await optimizeAssets({ force: process.argv.includes("--force") });
  console.log(`${updated} display image${updated === 1 ? "" : "s"} updated.`);
}
