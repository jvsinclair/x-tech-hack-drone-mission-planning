/*
Module Context
Purpose:
- Configure the local and Foundry-hostable React/Cesium mission planner build.
Why This Exists:
- Goals 0002 and 0003 need a lightweight Vite app that can run locally, serve Cesium assets, and consume the Goal 0001 bundle when it exists.
Primary Inputs/Outputs:
- Inputs: src/ application modules, Cesium static assets, and optional resources/palantir_sunol_aoi_upload artifacts.
- Outputs: Vite dev server and static dist/ build with copied Cesium and optional resources assets.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Build configuration is verified by npm run build and dev server smoke checks.
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
const cesiumRoot = path.join(repoRoot, "node_modules", "cesium", "Build", "Cesium");

export default defineConfig({
  define: {
    CESIUM_BASE_URL: JSON.stringify("/cesium"),
  },
  plugins: [react(), serveStaticAssetsPlugin()],
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

function serveStaticAssetsPlugin(): Plugin {
  return {
    name: "serve-planner-static-assets",
    configureServer(server) {
      server.middlewares.use("/cesium", (request, response, next) => {
        serveFileFromRoot(cesiumRoot, request.url, response, next);
      });
      server.middlewares.use("/resources", (request, response, next) => {
        serveFileFromRoot(resourcesRoot, request.url, response, next);
      });
    },
    closeBundle() {
      const distCesium = path.join(repoRoot, "dist", "cesium");
      fs.cpSync(cesiumRoot, distCesium, { recursive: true });
      if (!fs.existsSync(resourcesRoot)) return;
      const distResources = path.join(repoRoot, "dist", "resources");
      fs.cpSync(resourcesRoot, distResources, { recursive: true });
    },
  };
}

function serveFileFromRoot(root: string, requestUrl: string | undefined, response: NodeJS.WritableStream & { setHeader: (name: string, value: string) => void }, next: () => void) {
  if (!requestUrl) {
    next();
    return;
  }

  const url = new URL(requestUrl, "http://local.dev");
  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const filePath = path.normalize(path.join(root, relativePath));

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    next();
    return;
  }

  response.setHeader("content-type", contentTypeFor(filePath));
  fs.createReadStream(filePath).pipe(response);
}

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".geojson") || filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".wasm")) return "application/wasm";
  return "application/octet-stream";
}
