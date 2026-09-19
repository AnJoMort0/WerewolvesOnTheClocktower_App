import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Explicit values override .env without distributing the owner's cloud addresses.
const env = { ...process.env, VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "", VITE_PUBLIC_APP_URL: "" };
const build = spawnSync(process.execPath, [resolve(root, "node_modules/vite/bin/vite.js"), "build", "--config", "config/vite.config.ts"], { cwd: root, stdio: "inherit", env });
process.exit(build.status ?? 1);
