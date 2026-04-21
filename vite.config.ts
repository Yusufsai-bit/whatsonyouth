import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { spawnSync } from "node:child_process";
import { componentTagger } from "lovable-tagger";

// Runs scripts/seo-check.mjs at the start of production builds.
// Fails the build if any key route is missing title / description / canonical.
function seoCheckPlugin(): PluginOption {
  return {
    name: "woy-seo-check",
    apply: "build",
    buildStart() {
      const result = spawnSync(process.execPath, ["scripts/seo-check.mjs"], {
        stdio: "inherit",
        cwd: __dirname,
      });
      if (result.status !== 0) {
        throw new Error("SEO check failed — see output above.");
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    seoCheckPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
