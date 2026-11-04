import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = readFileSync(resolve(root, "supabase/config.toml"), "utf8");
const projectId = config.match(/^project_id\s*=\s*"([a-zA-Z0-9_-]+)"/m)?.[1];
if (!projectId) throw new Error("No valid local Supabase project_id in supabase/config.toml");

const sql = readFileSync(resolve(root, "supabase/tests/timer_rpc.sql"), "utf8");
const result = spawnSync("docker", [
  "exec", "-i", `supabase_db_${projectId}`,
  "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres",
], { input: sql, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] });

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
