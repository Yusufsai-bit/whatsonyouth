import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { spawnSync } from "node:child_process";
import { componentTagger } from "lovable-tagger";

// Regenerates public/sitemap.xml + public/sitemap-index.xml from the route
// manifest at the start of every production build. Adding a new public page
// to scripts/sitemap-routes.mjs auto-publishes it to crawlers on next deploy.
function sitemapGeneratePlugin(): PluginOption {
  return {
    name: "woy-sitemap-generate",
    apply: "build",
    buildStart() {
      const result = spawnSync(process.execPath, ["scripts/generate-sitemap.mjs"], {
        stdio: "inherit",
        cwd: __dirname,
      });
      if (result.status !== 0) {
        throw new Error("Sitemap generation failed — see output above.");
      }
    },
  };
}

// Runs scripts/seo-check.mjs at the start of production builds.
// Fails the build if any key route is missing title / description / canonical
// or has incorrect noindex rules.
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
    sitemapGeneratePlugin(),
    seoCheckPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
