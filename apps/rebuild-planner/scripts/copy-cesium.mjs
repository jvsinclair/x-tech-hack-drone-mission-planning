import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(appRoot, "..");
const source = path.join(root, "node_modules", "cesium", "Build", "Cesium");
const target = path.join(root, "public", "cesium");

if (!existsSync(source)) {
  console.warn("Cesium assets were not copied because node_modules/cesium is not installed yet.");
  process.exit(0);
}

mkdirSync(path.dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`Copied Cesium assets to ${path.relative(root, target)}`);
