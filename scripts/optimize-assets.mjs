import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
let originalBytes = 0;
let displayBytes = 0;
let count = 0;

async function convert(directory, edge = 512) {
  const sourceDirectory = path.join(root, "src/assets", directory);
  for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) { await convert(relative, edge); continue; }
    if (!entry.name.endsWith(".png")) continue;
    const source = path.join(root, "src/assets", relative);
    const destination = path.join(root, "src/assets/display", relative.replace(/\.png$/, ".webp"));
    await mkdir(path.dirname(destination), { recursive: true });
    // A 512px edge supports the largest 256px cards at 2x display density.
    // Preserve aspect ratio, alpha, and the original hand-drawn source artwork.
    await sharp(source).resize(edge, edge, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 100, effort: 6 }).toFile(destination);
    originalBytes += (await stat(source)).size;
    displayBytes += (await stat(destination)).size;
    count += 1;
  }
}

await convert("roles");
await convert("extras");
// Icons render at small sizes; 128px retains crisp edges on dense phone screens.
await convert("icons", 128);
console.log(`${count} display images: ${(originalBytes / 1048576).toFixed(2)} MiB → ${(displayBytes / 1048576).toFixed(2)} MiB (${(100 * (1 - displayBytes / originalBytes)).toFixed(1)}% smaller).`);
