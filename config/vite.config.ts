import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { optimizeAsset, optimizeAssets, displayPath } from "../scripts/optimize-assets.mjs";
import type { Plugin } from "vite";

function displayAssets(): Plugin {
  return {
    name: "generate-display-assets",
    async buildStart() {
      await optimizeAssets();
    },
    configureServer(server) {
      const source = path.resolve(__dirname, "../src/assets");
      server.watcher.add(source);
      const pending = new Map<string, ReturnType<typeof setTimeout>>();
      const update = (file: string) => {
        if (!displayPath(file)) return;
        clearTimeout(pending.get(file));
        pending.set(file, setTimeout(async () => {
          pending.delete(file);
          try {
            if (await optimizeAsset(file)) server.config.logger.info(`Updated display asset: ${path.relative(source, file)}`);
          } catch (error) {
            server.config.logger.error(`Could not optimize ${file}: ${String(error)}`);
          }
        }, 250));
      };
      server.watcher.on("add", update).on("change", update);
      server.httpServer?.once("close", () => {
        for (const timer of pending.values()) clearTimeout(timer);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const root = path.resolve(__dirname, "..");
  const rulebook = mode === "rulebook";
  return {
    root: rulebook ? path.resolve(root, "src/rulebook") : root,
    base: rulebook ? (process.env.RULEBOOK_BASE_PATH ?? "/WerewolvesOnTheClocktower_App/") : "/",
    publicDir: rulebook ? false : path.resolve(root, "public"),
    build: {
      outDir: path.resolve(root, rulebook ? ".build/rulebook" : ".build/app"),
      emptyOutDir: true,
    },
    css: { postcss: __dirname },
    server: {
      host: "::",
      port: 8080,
      hmr: { overlay: false },
    },
    plugins: [displayAssets(), react()],
    resolve: {
      alias: { "@": path.resolve(root, "src") },
    },
  };
});
