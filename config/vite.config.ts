import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(root, "src") },
    },
  };
});
