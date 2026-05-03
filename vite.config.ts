/*
Module Context
Purpose:
- Configure the local and Foundry-hostable React/Cesium mission planner build.
Why This Exists:
- Goal 0002 needs a lightweight Vite app that can run locally and consume the Goal 0001 bundle when it exists.
Primary Inputs/Outputs:
- Inputs: src/ application modules and optional resources/palantir_sunol_aoi_upload artifacts.
- Outputs: Vite dev server and static dist/ build with optional copied resources.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Build configuration is verified by npm run build in Goal 0002.
Current Limits / TODO:
- Foundry OSDK packages are not configured until a Developer Console application is available.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const repoRoot = __dirname;
const resourcesRoot = path.join(repoRoot, "resources");

export default defineConfig({
  plugins: [react(), serveAndCopyResourcesPlugin()],
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});

function serveAndCopyResourcesPlugin(): Plugin {
  return {
    name: "serve-palantir-upload-resources",
    configureServer(server) {
      server.middlewares.use("/resources", (request, response, next) => {
        if (!request.url) {
          next();
          return;
        }

        const url = new URL(request.url, "http://local.dev");
        const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
        const filePath = path.normalize(path.join(resourcesRoot, relativePath));

        if (!filePath.startsWith(resourcesRoot) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          next();
          return;
        }

        response.setHeader("content-type", contentTypeFor(filePath));
        fs.createReadStream(filePath).pipe(response);
      });
    },
    closeBundle() {
      if (!fs.existsSync(resourcesRoot)) return;
      const distResources = path.join(repoRoot, "dist", "resources");
      fs.cpSync(resourcesRoot, distResources, { recursive: true });
    },
  };
}

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".geojson") || filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
  return "application/octet-stream";
}
