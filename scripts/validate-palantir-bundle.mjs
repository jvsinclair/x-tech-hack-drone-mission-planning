#!/usr/bin/env node
/*
Module Context
Purpose:
- Validate the offline Sunol / Pleasanton Ridge Palantir upload bundle generated for goal 0001.
Why This Exists:
- The upload bundle must be reviewable before teammates import it into Palantir.
Primary Inputs/Outputs:
- Inputs: resources/palantir_sunol_aoi_upload/ bundle files and manifest.json.
- Outputs: CLI pass/fail result with layer counts and validation errors.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/goals/0001-palantir-offline-upload-bundle.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Checks manifest coverage, parseability, CSV headers, provenance fields, and obvious local-path leakage.
Current Limits / TODO:
- Does not validate external source freshness, Palantir import permissions, geometry topology, or operational terrain correctness.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE_ROOT = path.join(REPO_ROOT, "resources", "palantir_sunol_aoi_upload");
const MANIFEST_PATH = path.join(BUNDLE_ROOT, "manifest.json");
const REQUIRED_FILES = [
  "README.md",
  "PALANTIR_UPLOAD_PROMPT.md",
  "manifest.json",
  "aoi/sunol_training_area_aoi.geojson",
  "osm/osm_power_lines.geojson",
  "osm/osm_power_towers_poles.geojson",
  "osm/osm_roads_tracks_paths.geojson",
  "osm/osm_buildings.geojson",
  "osm/osm_natural_features.geojson",
  "osm/osm_waterways_barriers.geojson",
  "official_power/cec_transmission_lines.geojson",
  "official_power/hifld_transmission_lines.geojson",
  "terrain/elevation_samples_500m.csv",
  "terrain/terrain_attention_points.geojson",
  "mission_fixture/synthetic_unit_route.geojson",
  "mission_fixture/synthetic_drone_waypoints.geojson",
  "mission_fixture/synthetic_route_branches.geojson",
  "mission_fixture/synthetic_cue_zones.geojson",
  "mission_fixture/synthetic_no_go_zones.geojson",
];

const errors = [];

async function main() {
  const manifest = await readJson(MANIFEST_PATH);
  requireValue(manifest.bundle_id, "manifest.bundle_id is required");
  requireValue(manifest.generated_at, "manifest.generated_at is required");
  requireValue(manifest.layers, "manifest.layers is required");

  for (const file of REQUIRED_FILES) {
    const filePath = path.join(BUNDLE_ROOT, file);
    const text = await readText(filePath, `required file missing: ${file}`);
    if (text === null) continue;
    checkNoConflictMarkers(file, text);
    checkNoLocalPaths(file, text);
    if (file.endsWith(".geojson")) {
      validateGeojson(file, JSON.parse(text));
    } else if (file.endsWith(".csv")) {
      validateCsv(file, text);
    }
  }

  for (const [layerId, layer] of Object.entries(manifest.layers || {})) {
    requireValue(layer.path, `manifest layer ${layerId} missing path`);
    requireValue(Number.isInteger(layer.count), `manifest layer ${layerId} missing integer count`);
    requireValue(layer.source_name, `manifest layer ${layerId} missing source_name`);
    requireValue(layer.source_url, `manifest layer ${layerId} missing source_url`);
    requireValue(layer.retrieved_at, `manifest layer ${layerId} missing retrieved_at`);
    requireValue(layer.status, `manifest layer ${layerId} missing status`);
  }

  const manifestFiles = new Set(Object.values(manifest.layers || {}).map((layer) => layer.path).filter(Boolean));
  for (const file of REQUIRED_FILES.filter((file) => !["README.md", "PALANTIR_UPLOAD_PROMPT.md", "manifest.json"].includes(file))) {
    if (!manifestFiles.has(file)) {
      errors.push(`manifest does not list required artifact: ${file}`);
    }
  }

  if (errors.length > 0) {
    console.error("Palantir bundle validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log("Palantir bundle validation passed.");
  for (const [layerId, layer] of Object.entries(manifest.layers)) {
    console.log(`${layerId}: ${layer.count}`);
  }
}

async function readJson(filePath) {
  const text = await readText(filePath, `JSON file missing: ${path.relative(BUNDLE_ROOT, filePath)}`);
  if (text === null) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`invalid JSON in ${path.relative(BUNDLE_ROOT, filePath)}: ${error.message}`);
    return {};
  }
}

async function readText(filePath, missingMessage) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    errors.push(missingMessage);
    return null;
  }
}

function validateGeojson(file, geojson) {
  if (geojson.type !== "FeatureCollection") {
    errors.push(`${file} must be a FeatureCollection`);
  }
  if (!Array.isArray(geojson.features)) {
    errors.push(`${file} missing features array`);
    return;
  }
  for (const [index, feature] of geojson.features.entries()) {
    if (feature.type !== "Feature") errors.push(`${file} feature ${index} must be a Feature`);
    if (!feature.geometry) errors.push(`${file} feature ${index} missing geometry`);
    const props = feature.properties || {};
    for (const field of ["source_name", "source_url", "retrieved_at", "provisional"]) {
      if (!(field in props)) {
        errors.push(`${file} feature ${index} missing provenance field ${field}`);
      }
    }
  }
}

function validateCsv(file, text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 1) {
    errors.push(`${file} is empty`);
    return;
  }
  const header = lines[0].split(",");
  for (const field of ["sample_id", "lon", "lat", "elevation_m", "source_name", "source_url", "retrieved_at", "provisional"]) {
    if (!header.includes(field)) errors.push(`${file} missing CSV header ${field}`);
  }
}

function checkNoLocalPaths(file, text) {
  const forbidden = [
    /C:\\Users\\/i,
    /C:\\tmp\\/i,
    /\/Users\//,
    /\/home\//,
    /nshackathon\.palantirfoundry\.com\/workspace\/compass\/view\//,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(text)) {
      errors.push(`${file} appears to contain a local machine path or instance-specific upload URL`);
    }
  }
}

function checkNoConflictMarkers(file, text) {
  if (/^(<<<<<<<|=======|>>>>>>>) /m.test(text) || /^(<<<<<<<|=======|>>>>>>>)$/m.test(text)) {
    errors.push(`${file} contains unresolved conflict markers`);
  }
}

function requireValue(value, message) {
  if (!value) errors.push(message);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
