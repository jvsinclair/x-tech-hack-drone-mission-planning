#!/usr/bin/env node
/*
Module Context
Purpose:
- Generate the offline Sunol / Pleasanton Ridge Palantir upload bundle for goal 0001.
Why This Exists:
- The team needs uploadable GeoJSON, CSV, Markdown, and manifest artifacts when the Palantir environment has limited or no internet access.
Primary Inputs/Outputs:
- Inputs: Live public OSM Overpass, CEC ArcGIS, HIFLD ArcGIS, and USGS EPQS endpoints plus fixed synthetic mission fixtures for the Sunol Ridge Training Area AOI.
- Outputs: resources/palantir_sunol_aoi_upload/ bundle files and manifest.json.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
- docs/goals/0001-palantir-offline-upload-bundle.md
- docs/research/problem_statement_3_resource_map.md
- docs/research/source_registry.json
Validated:
- provisional: Generates deterministic fixture layers and best-effort public source layers; validation is handled by scripts/validate-palantir-bundle.mjs.
Current Limits / TODO:
- Uses lightweight geometry normalization only; relation-heavy OSM geometries and authoritative terrain analysis remain out of scope for the hackathon bundle.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_ROOT = path.join(REPO_ROOT, "resources", "palantir_sunol_aoi_upload");
const AOI = {
  name: "Sunol Ridge Training Area",
  west: -121.9,
  south: 37.48,
  east: -121.74,
  north: 37.6,
};
const SAMPLE_SPACING_M = 500;
const RETRIEVED_AT = new Date().toISOString();
const FETCH_TIMEOUT_MS = 45_000;
const FETCH_RETRIES = 2;
const EPQS_CONCURRENCY = 4;
const USER_AGENT =
  "x-tech-hackathon-palantir-bundle/0.2 (+https://github.com/jvsinclair/x-tech-hack-drone-mission-planning; contact=hackathon-team)";

const SOURCE_URLS = {
  overpass: process.env.PALANTIR_BUNDLE_OVERPASS_URL || "https://overpass-api.de/api/interpreter",
  overpassMirror: process.env.PALANTIR_BUNDLE_OVERPASS_MIRROR_URL || "https://overpass.private.coffee/api/interpreter",
  cecTransmission:
    process.env.PALANTIR_BUNDLE_CEC_TRANSMISSION_URL ||
    "https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Transmission_Line/FeatureServer/2/query",
  hifldTransmission:
    process.env.PALANTIR_BUNDLE_HIFLD_TRANSMISSION_URL ||
    "https://services2.arcgis.com/LYMgRMwHfrWWEg3s/ArcGIS/rest/services/HIFLD_US_Electric_Power_Transmission_Lines/FeatureServer/0/query",
  usgsEpqs: process.env.PALANTIR_BUNDLE_USGS_EPQS_URL || "https://epqs.nationalmap.gov/v1/json",
};

const OVERPASS_ENDPOINTS = Array.from(new Set([
  SOURCE_URLS.overpass,
  SOURCE_URLS.overpassMirror,
].filter(Boolean)));

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

const OSM_LAYERS = [
  {
    id: "osm_power_lines",
    path: "osm/osm_power_lines.geojson",
    query: osmQuery('way["power"~"^(line|minor_line|cable)$"]'),
    geometryPolicy: "line",
    description: "OSM power line, minor line, and cable features intersecting the AOI.",
  },
  {
    id: "osm_power_towers_poles",
    path: "osm/osm_power_towers_poles.geojson",
    query: osmQuery('node["power"~"^(tower|pole)$"]'),
    geometryPolicy: "point",
    description: "OSM power tower and pole point features intersecting the AOI.",
  },
  {
    id: "osm_roads_tracks_paths",
    path: "osm/osm_roads_tracks_paths.geojson",
    query: osmQuery('way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|track|path|footway|bridleway|cycleway)$"]'),
    geometryPolicy: "line",
    description: "OSM roads, tracks, and paths for route-planning context.",
  },
  {
    id: "osm_buildings",
    path: "osm/osm_buildings.geojson",
    query: osmQuery('way["building"]'),
    geometryPolicy: "polygon",
    description: "OSM building footprints intersecting the AOI.",
  },
  {
    id: "osm_natural_features",
    path: "osm/osm_natural_features.geojson",
    query: osmQuery('way["natural"];way["landuse"~"^(forest|grass|meadow|scrub)$"]'),
    geometryPolicy: "mixed",
    description: "OSM natural and vegetation-related features intersecting the AOI.",
  },
  {
    id: "osm_waterways_barriers",
    path: "osm/osm_waterways_barriers.geojson",
    query: osmQuery('way["waterway"];way["barrier"]'),
    geometryPolicy: "mixed",
    description: "OSM waterways and barriers for route-context review.",
  },
];

async function main() {
  await ensureBundleDirs();

  const manifest = {
    bundle_id: "palantir_sunol_aoi_upload_v1",
    title: "Sunol Ridge Training Area Palantir Offline Upload Bundle",
    generated_at: RETRIEVED_AT,
    validation_status: "provisional",
    aoi: { ...AOI },
    safety_scope: [
      "Synthetic ISR/recon route-planning demo only.",
      "No strike, engage, kinetic, target-selection, weapon-release, real drone control, MAVLINK/GCS, or hardware-control workflows.",
      "Public-source geospatial layers are planning context, not operational terrain or utility-network authority.",
    ],
    required_files: REQUIRED_FILES,
    layers: {},
    sources: [],
  };

  await writeGeojson(
    "aoi/sunol_training_area_aoi.geojson",
    featureCollection([aoiFeature()]),
    manifest,
    layerMeta("sunol_training_area_aoi", "aoi/sunol_training_area_aoi.geojson", 1, "synthetic_aoi", "generated", "AOI bounding box from goal 0001.")
  );

  for (const layer of OSM_LAYERS) {
    await writeFetchedLayer(manifest, layer, () => fetchOverpassLayer(layer));
  }

  await writeFetchedLayer(manifest, {
    id: "cec_transmission_lines",
    path: "official_power/cec_transmission_lines.geojson",
    description: "California Energy Commission transmission line features intersecting the AOI.",
  }, fetchCecTransmission);

  await writeFetchedLayer(manifest, {
    id: "hifld_transmission_lines",
    path: "official_power/hifld_transmission_lines.geojson",
    description: "HIFLD transmission line features intersecting the AOI.",
  }, fetchHifldTransmission);

  const elevationRows = await fetchElevationSamples(manifest);
  await writeCsv("terrain/elevation_samples_500m.csv", elevationRowsToCsv(elevationRows));
  manifest.layers.elevation_samples_500m = {
    path: "terrain/elevation_samples_500m.csv",
    count: elevationRows.length,
    source_name: "USGS EPQS",
    source_url: SOURCE_URLS.usgsEpqs,
    retrieved_at: RETRIEVED_AT,
    status: elevationRows.length > 0 ? "generated" : "empty",
    provenance: "500m AOI sample grid queried point-by-point from USGS EPQS where available.",
    provisional: true,
  };

  const missionLayers = syntheticMissionLayers();
  for (const layer of missionLayers) {
    await writeGeojson(layer.path, layer.geojson, manifest, layer.manifest);
  }

  const terrainAttentionPoints = generateTerrainAttentionPoints(elevationRows);
  await writeGeojson(
    "terrain/terrain_attention_points.geojson",
    terrainAttentionPoints,
    manifest,
    layerMeta(
      "terrain_attention_points",
      "terrain/terrain_attention_points.geojson",
      terrainAttentionPoints.features.length,
      "USGS EPQS + synthetic mission route review",
      "generated",
      "Provisional high-ground and coverage-review planning aids generated from available elevation samples."
    )
  );

  await writeReadme(manifest);
  await writeUploadPrompt(manifest);
  await writeJson("manifest.json", manifest);

  console.log(`Generated ${OUTPUT_ROOT}`);
  for (const [id, layer] of Object.entries(manifest.layers)) {
    console.log(`${id}: ${layer.count}`);
  }
}

async function ensureBundleDirs() {
  const dirs = ["aoi", "osm", "official_power", "terrain", "mission_fixture"];
  await mkdir(OUTPUT_ROOT, { recursive: true });
  await Promise.all(dirs.map((dir) => mkdir(path.join(OUTPUT_ROOT, dir), { recursive: true })));
}

async function writeFetchedLayer(manifest, layer, fetcher) {
  let geojson;
  let status = "generated";
  let error = null;
  try {
    geojson = await fetcher();
  } catch (caught) {
    status = "source_error";
    error = caught instanceof Error ? caught.message : String(caught);
    geojson = featureCollection([]);
    geojson.metadata = { errors: [error] };
  }

  const resolvedSourceName = geojson.metadata?.source_name || layer.sourceName || sourceNameForLayer(layer.id);
  const resolvedSourceUrl = geojson.metadata?.source_url || layer.sourceUrl || sourceUrlForLayer(layer.id);
  geojson.features = geojson.features.map((feature) => enrichFeature(feature, layer.id, resolvedSourceName, resolvedSourceUrl));
  geojson.metadata = {
    ...(geojson.metadata || {}),
    layer_id: layer.id,
    description: layer.description,
    retrieved_at: RETRIEVED_AT,
    source_name: resolvedSourceName,
    source_url: resolvedSourceUrl,
    provisional: true,
    status,
  };
  if (error) {
    geojson.metadata.errors = [error];
  }

  const meta = layerMeta(
    layer.id,
    layer.path,
    geojson.features.length,
    geojson.metadata.source_name,
    status,
    error || layer.description,
    geojson.metadata.source_url
  );
  if (geojson.metadata.source_health) meta.source_health = geojson.metadata.source_health;
  if (error) meta.error = error;
  await writeGeojson(layer.path, geojson, manifest, meta);
}

async function fetchOverpassLayer(layer) {
  const attempts = [];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await fetchJson(endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({ data: layer.query }),
      });
      const features = [];
      for (const element of data.elements || []) {
        const feature = osmElementToFeature(element, layer.geometryPolicy);
        if (feature) {
          features.push(feature);
        }
      }
      const geojson = featureCollection(features);
      geojson.metadata = {
        source_name: "OpenStreetMap via Overpass API",
        source_url: endpoint,
        source_health: {
          selected_endpoint: endpoint,
          attempts: [...attempts, { endpoint, status: "ok", element_count: data.elements?.length || 0 }],
        },
      };
      return geojson;
    } catch (caught) {
      attempts.push({
        endpoint,
        status: "error",
        error: caught instanceof Error ? caught.message : String(caught),
      });
    }
  }
  throw new Error(`All Overpass endpoints failed: ${JSON.stringify(attempts)}`);
}

async function fetchCecTransmission() {
  return fetchArcgisGeojson(SOURCE_URLS.cecTransmission);
}

async function fetchHifldTransmission() {
  return fetchArcgisGeojson(SOURCE_URLS.hifldTransmission);
}

async function fetchArcgisGeojson(baseUrl) {
  const layerUrl = arcgisLayerUrl(baseUrl);
  const metadata = await fetchJson(withQuery(layerUrl, { f: "json" }));
  const supportedFormats = String(metadata.supportedQueryFormats || "");
  if (!supportedFormats.toLowerCase().includes("json")) {
    throw new Error(`ArcGIS layer does not advertise JSON query support: ${layerUrl}`);
  }

  const countData = await fetchJson(arcgisQueryUrl(baseUrl, {
    f: "json",
    returnCountOnly: "true",
    returnGeometry: "false",
  }));
  const aoiCount = Number(countData.count ?? 0);

  const sample = await fetchArcgisFeatures(baseUrl, { resultRecordCount: "3" });
  const data = await fetchArcgisFeatures(baseUrl);
  data.metadata = {
    source_health: {
      layer_url: layerUrl,
      layer_name: metadata.name || null,
      geometry_type: metadata.geometryType || null,
      supported_query_formats: supportedFormats,
      max_record_count: metadata.maxRecordCount || null,
      aoi_count: aoiCount,
      sample_count: sample.features.length,
      returned_count: data.features.length,
      query_format: data.metadata?.query_format || "geojson",
    },
  };
  return data;
}

async function fetchElevationSamples(manifest) {
  const points = sampleGrid(AOI, SAMPLE_SPACING_M);
  const rows = [];
  const failures = [];
  let index = 0;
  const workers = Array.from({ length: EPQS_CONCURRENCY }, async () => {
    while (index < points.length) {
      const point = points[index++];
      try {
        const elevation = await fetchElevation(point.lon, point.lat);
        rows.push({
          sample_id: point.sample_id,
          lon: point.lon,
          lat: point.lat,
          elevation_m: elevation,
          source_name: "USGS EPQS",
          source_url: SOURCE_URLS.usgsEpqs,
          retrieved_at: RETRIEVED_AT,
          provisional: true,
        });
      } catch (caught) {
        failures.push({
          sample_id: point.sample_id,
          message: caught instanceof Error ? caught.message : String(caught),
        });
      }
    }
  });
  await Promise.all(workers);
  rows.sort((a, b) => a.sample_id.localeCompare(b.sample_id));
  if (failures.length > 0) {
    manifest.sources.push({
      source_name: "USGS EPQS partial failures",
      source_url: SOURCE_URLS.usgsEpqs,
      retrieved_at: RETRIEVED_AT,
      status: "partial_failure",
      failed_samples: failures.slice(0, 25),
      failed_sample_count: failures.length,
    });
  }
  return rows;
}

async function fetchElevation(lon, lat) {
  const url = new URL(SOURCE_URLS.usgsEpqs);
  url.search = new URLSearchParams({
    x: String(lon),
    y: String(lat),
    units: "Meters",
    wkid: "4326",
    includeDate: "false",
  }).toString();
  const data = await fetchJson(url);
  const elevation = Number(
    data.value ??
      data.elevation ??
      data?.USGS_Elevation_Point_Query_Service?.Elevation_Query?.Elevation
  );
  if (!Number.isFinite(elevation) || elevation < -10000) {
    throw new Error(`EPQS did not return a usable elevation for ${lon},${lat}`);
  }
  return Number(elevation.toFixed(2));
}

async function fetchJson(url, options = {}) {
  const { timeoutMs = FETCH_TIMEOUT_MS, retries = FETCH_RETRIES, ...fetchOptions } = options;
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          "user-agent": USER_AGENT,
          accept: "application/json, */*;q=0.8",
          ...(fetchOptions.headers || {}),
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} from ${url}: ${text.slice(0, 300)}`);
      }
      return response.json();
    } catch (caught) {
      lastError = caught;
      if (attempt < retries) {
        await sleep(500 * 2 ** attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function fetchArcgisFeatures(baseUrl, extraParams = {}) {
  const geojsonUrl = arcgisQueryUrl(baseUrl, {
    f: "geojson",
    outFields: "*",
    returnGeometry: "true",
    ...extraParams,
  });
  try {
    const data = await fetchJson(geojsonUrl);
    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
      throw new Error(`ArcGIS endpoint did not return a GeoJSON FeatureCollection: ${baseUrl}`);
    }
    data.metadata = { ...(data.metadata || {}), query_format: "geojson" };
    return data;
  } catch (geojsonError) {
    const jsonUrl = arcgisQueryUrl(baseUrl, {
      f: "json",
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      ...extraParams,
    });
    const data = await fetchJson(jsonUrl);
    const geojson = arcgisJsonToGeojson(data);
    geojson.metadata = {
      query_format: "json_to_geojson",
      geojson_error: geojsonError instanceof Error ? geojsonError.message : String(geojsonError),
    };
    return geojson;
  }
}

function arcgisQueryUrl(baseUrl, extraParams = {}) {
  return withQuery(baseUrl, {
    where: "1=1",
    geometryType: "esriGeometryEnvelope",
    geometry: `${AOI.west},${AOI.south},${AOI.east},${AOI.north}`,
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    ...extraParams,
  });
}

function withQuery(baseUrl, params) {
  const url = new URL(baseUrl);
  url.search = new URLSearchParams(params).toString();
  return url;
}

function arcgisLayerUrl(baseUrl) {
  return String(baseUrl).replace(/\/query(?:\?.*)?$/i, "");
}

function arcgisJsonToGeojson(data) {
  if (data.error) {
    throw new Error(`ArcGIS JSON error: ${JSON.stringify(data.error)}`);
  }
  if (!Array.isArray(data.features)) {
    throw new Error("ArcGIS JSON response missing features array.");
  }
  return featureCollection(data.features.map((feature, index) => ({
    type: "Feature",
    id: feature.attributes?.OBJECTID ?? feature.attributes?.OBJECTID_1 ?? index,
    geometry: arcgisGeometryToGeojson(feature.geometry),
    properties: feature.attributes || {},
  })).filter((feature) => feature.geometry));
}

function arcgisGeometryToGeojson(geometry) {
  if (!geometry) return null;
  if (Array.isArray(geometry.paths)) {
    if (geometry.paths.length === 1) {
      return { type: "LineString", coordinates: geometry.paths[0].map(roundArcgisPoint) };
    }
    return { type: "MultiLineString", coordinates: geometry.paths.map((pathValue) => pathValue.map(roundArcgisPoint)) };
  }
  if (Array.isArray(geometry.rings)) {
    return { type: "Polygon", coordinates: geometry.rings.map((ring) => ring.map(roundArcgisPoint)) };
  }
  if (Number.isFinite(geometry.x) && Number.isFinite(geometry.y)) {
    return { type: "Point", coordinates: roundArcgisPoint([geometry.x, geometry.y]) };
  }
  return null;
}

function roundArcgisPoint(point) {
  return [roundCoord(point[0]), roundCoord(point[1])];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function osmQuery(selectorBlock) {
  const selectors = selectorBlock
    .split(";")
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map((selector) => `  ${selector}(${AOI.south},${AOI.west},${AOI.north},${AOI.east});`)
    .join("\n");
  return `[out:json][timeout:90];\n(\n${selectors}\n);\nout tags geom;`;
}

function osmElementToFeature(element, geometryPolicy) {
  if (element.type === "node") {
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [roundCoord(element.lon), roundCoord(element.lat)] },
      properties: osmProperties(element),
    };
  }
  const coords = (element.geometry || []).map((point) => [roundCoord(point.lon), roundCoord(point.lat)]);
  if (coords.length < 2) {
    return null;
  }
  const isClosed = coords.length > 3 && coords[0][0] === coords.at(-1)[0] && coords[0][1] === coords.at(-1)[1];
  const shouldPolygon = geometryPolicy === "polygon" || (geometryPolicy === "mixed" && isClosed);
  return {
    type: "Feature",
    geometry: shouldPolygon ? { type: "Polygon", coordinates: [coords] } : { type: "LineString", coordinates: coords },
    properties: osmProperties(element),
  };
}

function osmProperties(element) {
  return {
    osm_type: element.type,
    osm_id: element.id,
    ...prefixObject(element.tags || {}, "osm_"),
  };
}

function enrichFeature(feature, layerId, sourceName, sourceUrl) {
  return {
    ...feature,
    properties: {
      ...(feature.properties || {}),
      layer_id: layerId,
      source_name: sourceName || sourceNameForLayer(layerId),
      source_url: sourceUrl || sourceUrlForLayer(layerId),
      retrieved_at: RETRIEVED_AT,
      provisional: true,
    },
  };
}

function sourceNameForLayer(layerId) {
  if (layerId.startsWith("osm_")) return "OpenStreetMap via Overpass API";
  if (layerId.startsWith("cec_")) return "California Energy Commission ArcGIS FeatureServer";
  if (layerId.startsWith("hifld_")) return "HIFLD ArcGIS FeatureServer";
  return "Synthetic mission fixture";
}

function sourceUrlForLayer(layerId) {
  if (layerId.startsWith("osm_")) return SOURCE_URLS.overpass;
  if (layerId.startsWith("cec_")) return SOURCE_URLS.cecTransmission;
  if (layerId.startsWith("hifld_")) return SOURCE_URLS.hifldTransmission;
  return "docs/goals/0001-palantir-offline-upload-bundle.md";
}

function syntheticMissionLayers() {
  const unitRoute = lineFeature(
    "synthetic_unit_route_main",
    [
      [-121.887, 37.506],
      [-121.868, 37.518],
      [-121.849, 37.532],
      [-121.829, 37.546],
      [-121.806, 37.558],
    ],
    {
      object_type: "unit_route",
      mission_phase: "route_security_recon",
      name: "Synthetic unit route: launch to ridge objective",
    }
  );

  const droneWaypoints = [
    pointFeature("wp_launch", [-121.884, 37.508], { sequence: 1, action: "launch", name: "Launch / comms check" }),
    pointFeature("wp_overwatch_1", [-121.862, 37.523], { sequence: 2, action: "observe", name: "Overwatch checkpoint Alpha" }),
    pointFeature("wp_decision_alpha", [-121.842, 37.538], { sequence: 3, action: "decision point", name: "Decision Alpha: Route A or B" }),
    pointFeature("wp_scout_high_ground", [-121.819, 37.563], { sequence: 4, action: "scout", name: "Scout high-ground candidate" }),
    pointFeature("wp_recover", [-121.79, 37.552], { sequence: 5, action: "land/recover", name: "Recover / RTB lane" }),
  ];

  const branches = [
    lineFeature("route_a_close_overwatch", [
      [-121.842, 37.538],
      [-121.829, 37.546],
      [-121.81, 37.552],
    ], { branch_id: "route_a", command_preview: "preview_route_a", name: "Route A close overwatch" }),
    lineFeature("route_b_scout_ahead", [
      [-121.842, 37.538],
      [-121.835, 37.552],
      [-121.819, 37.563],
      [-121.803, 37.558],
    ], { branch_id: "route_b", command_preview: "preview_route_b", name: "Route B scout ahead" }),
    lineFeature("rtb_recover_branch", [
      [-121.842, 37.538],
      [-121.862, 37.523],
      [-121.884, 37.508],
    ], { branch_id: "rtb", command_preview: "preview_return_to_base", name: "Return-to-base branch" }),
  ];

  const cueZones = [
    polygonFeature("cue_zone_route_a", rectangle(-121.848, 37.534, -121.838, 37.543), {
      cue_pps: 2,
      command_preview: "preview_route_a",
      name: "Cue zone for Route A preview",
    }),
    polygonFeature("cue_zone_route_b", rectangle(-121.837, 37.544, -121.826, 37.556), {
      cue_pps: 4,
      command_preview: "preview_route_b",
      name: "Cue zone for Route B preview",
    }),
    polygonFeature("cue_zone_rtb", rectangle(-121.871, 37.516, -121.858, 37.529), {
      cue_pps: 8,
      command_preview: "preview_return_to_base",
      name: "Cue zone for RTB preview",
    }),
  ];

  const noGoZones = [
    polygonFeature("synthetic_no_go_power_corridor", rectangle(-121.858, 37.548, -121.834, 37.557), {
      no_go_type: "utility_corridor_buffer",
      name: "Synthetic no-go utility corridor buffer",
    }),
    polygonFeature("synthetic_no_go_steep_ridge", rectangle(-121.812, 37.569, -121.792, 37.585), {
      no_go_type: "steep_ridge_review",
      name: "Synthetic steep-ridge review zone",
    }),
  ];

  return [
    missionLayer("synthetic_unit_route", "mission_fixture/synthetic_unit_route.geojson", [unitRoute], "Synthetic friendly-unit movement route."),
    missionLayer("synthetic_drone_waypoints", "mission_fixture/synthetic_drone_waypoints.geojson", droneWaypoints, "Synthetic ordered drone waypoint queue."),
    missionLayer("synthetic_route_branches", "mission_fixture/synthetic_route_branches.geojson", branches, "Synthetic Route A, Route B, and RTB branches."),
    missionLayer("synthetic_cue_zones", "mission_fixture/synthetic_cue_zones.geojson", cueZones, "Synthetic PPS cue zones for demo command preview."),
    missionLayer("synthetic_no_go_zones", "mission_fixture/synthetic_no_go_zones.geojson", noGoZones, "Synthetic provisional no-go and review zones."),
  ];
}

function missionLayer(id, filePath, features, description) {
  const geojson = featureCollection(features.map((feature) => enrichFeature(feature, id, "Synthetic mission fixture", "docs/goals/0001-palantir-offline-upload-bundle.md")));
  geojson.metadata = {
    layer_id: id,
    description,
    retrieved_at: RETRIEVED_AT,
    source_name: "Synthetic mission fixture",
    source_url: "docs/goals/0001-palantir-offline-upload-bundle.md",
    provisional: true,
    status: "generated",
  };
  return {
    path: filePath,
    geojson,
    manifest: layerMeta(id, filePath, features.length, "Synthetic mission fixture", "generated", description),
  };
}

function generateTerrainAttentionPoints(elevationRows) {
  const features = [];
  const sorted = elevationRows
    .filter((row) => Number.isFinite(row.elevation_m))
    .sort((a, b) => b.elevation_m - a.elevation_m)
    .slice(0, 3);

  for (const [idx, row] of sorted.entries()) {
    features.push(pointFeature(`terrain_high_ground_${idx + 1}`, [row.lon, row.lat], {
      attention_type: "scout_high_ground",
      recommended_drone_task: idx === 0 ? "preview_route_b" : "observe",
      confidence: 0.62,
      elevation_m: row.elevation_m,
      rationale: "Top available USGS EPQS elevation sample inside the AOI; use as provisional high-ground scout candidate.",
      source_name: "USGS EPQS",
      source_url: SOURCE_URLS.usgsEpqs,
      retrieved_at: RETRIEVED_AT,
      provisional: true,
      evidence_refs: "demo_terrain_attention_points_v1",
    }));
  }

  features.push(pointFeature("terrain_route_decision_review", [-121.842, 37.538], {
    attention_type: "coverage_gap_review",
    recommended_drone_task: "hold_or_loiter",
    confidence: 0.55,
    rationale: "Synthetic decision-point review marker where Route A and Route B split.",
    source_name: "Synthetic mission fixture",
    source_url: "docs/goals/0001-palantir-offline-upload-bundle.md",
    retrieved_at: RETRIEVED_AT,
    provisional: true,
    evidence_refs: "demo_terrain_attention_points_v1",
  }));

  return featureCollection(features);
}

function aoiFeature() {
  return polygonFeature("sunol_training_area_aoi", rectangle(AOI.west, AOI.south, AOI.east, AOI.north), {
    object_type: "area_of_interest",
    name: AOI.name,
    west: AOI.west,
    south: AOI.south,
    east: AOI.east,
    north: AOI.north,
    source_name: "Synthetic AOI from goal 0001",
    source_url: "docs/goals/0001-palantir-offline-upload-bundle.md",
    retrieved_at: RETRIEVED_AT,
    provisional: true,
  });
}

function sampleGrid(aoi, spacingM) {
  const centerLat = (aoi.south + aoi.north) / 2;
  const latStep = spacingM / 110574;
  const lonStep = spacingM / (111320 * Math.cos((centerLat * Math.PI) / 180));
  const points = [];
  let sampleIndex = 1;
  for (let lat = aoi.south; lat <= aoi.north + 1e-9; lat += latStep) {
    for (let lon = aoi.west; lon <= aoi.east + 1e-9; lon += lonStep) {
      points.push({
        sample_id: `epqs_${String(sampleIndex).padStart(4, "0")}`,
        lon: roundCoord(lon),
        lat: roundCoord(lat),
      });
      sampleIndex += 1;
    }
  }
  return points;
}

function elevationRowsToCsv(rows) {
  const header = ["sample_id", "lon", "lat", "elevation_m", "source_name", "source_url", "retrieved_at", "provisional"];
  return [
    header.join(","),
    ...rows.map((row) => header.map((key) => csvCell(row[key])).join(",")),
  ].join("\n") + "\n";
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function layerMeta(id, filePath, count, sourceName, status, provenance, sourceUrl = null) {
  const resolvedSourceUrl = sourceUrl || sourceUrlForLayer(id);
  return {
    id,
    path: filePath,
    count,
    source_name: sourceName,
    source_url: resolvedSourceUrl,
    retrieved_at: RETRIEVED_AT,
    status,
    provenance,
    provisional: true,
  };
}

function featureCollection(features) {
  return {
    type: "FeatureCollection",
    features,
  };
}

function pointFeature(id, coordinates, properties = {}) {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: coordinates.map(roundCoord) },
    properties: { id, ...properties },
  };
}

function lineFeature(id, coordinates, properties = {}) {
  return {
    type: "Feature",
    id,
    geometry: { type: "LineString", coordinates: coordinates.map((point) => point.map(roundCoord)) },
    properties: { id, ...properties },
  };
}

function polygonFeature(id, coordinates, properties = {}) {
  return {
    type: "Feature",
    id,
    geometry: { type: "Polygon", coordinates },
    properties: { id, ...properties },
  };
}

function rectangle(west, south, east, north) {
  return [[
    [roundCoord(west), roundCoord(south)],
    [roundCoord(east), roundCoord(south)],
    [roundCoord(east), roundCoord(north)],
    [roundCoord(west), roundCoord(north)],
    [roundCoord(west), roundCoord(south)],
  ]];
}

function prefixObject(value, prefix) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [`${prefix}${key}`, item]));
}

function roundCoord(value) {
  return Number(Number(value).toFixed(6));
}

async function writeGeojson(relativePath, geojson, manifest, meta) {
  await writeJson(relativePath, geojson);
  manifest.layers[meta.id] = meta;
  manifest.sources.push({
    source_name: meta.source_name,
    source_url: meta.source_url,
    retrieved_at: meta.retrieved_at,
    status: meta.status,
    layer_id: meta.id,
    count: meta.count,
  });
}

async function writeJson(relativePath, data) {
  await writeFile(path.join(OUTPUT_ROOT, relativePath), JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function writeCsv(relativePath, csv) {
  await writeFile(path.join(OUTPUT_ROOT, relativePath), csv, "utf8");
}

async function writeReadme(manifest) {
  const lines = [
    "# Sunol Ridge Training Area Palantir Offline Upload Bundle",
    "",
    "This bundle packages public geospatial context and synthetic mission fixtures for a Palantir upload workflow.",
    "",
    "## Safety Scope",
    "",
    "- ISR/recon route-planning demo only.",
    "- No strike, engage, kinetic, target-selection, weapon-release, real drone control, MAVLINK/GCS, or hardware-control workflows.",
    "- All mission actors, route branches, cue zones, no-go zones, and mission events are synthetic.",
    "- Public-source terrain and infrastructure layers are provisional planning context, not operational truth.",
    "",
    "## AOI",
    "",
    `- Name: ${AOI.name}`,
    `- West/South/East/North: ${AOI.west}, ${AOI.south}, ${AOI.east}, ${AOI.north}`,
    "",
    "## Upload Order",
    "",
    "1. `aoi/sunol_training_area_aoi.geojson`",
    "2. Official and OSM power layers.",
    "3. Roads, buildings, natural features, waterways, and barriers.",
    "4. `terrain/elevation_samples_500m.csv` and `terrain/terrain_attention_points.geojson`.",
    "5. Synthetic mission fixtures under `mission_fixture/`.",
    "6. Use `PALANTIR_UPLOAD_PROMPT.md` as the instruction prompt for Palantir/AIP setup.",
    "",
    "## Layer Counts",
    "",
    "| Layer | Count | Status |",
    "| --- | ---: | --- |",
    ...Object.entries(manifest.layers).map(([id, layer]) => `| ${id} | ${layer.count} | ${layer.status} |`),
    "",
    "## Provenance",
    "",
    "See `manifest.json` for source URLs, retrieval time, counts, and provisional status per layer.",
    "",
  ];
  await writeFile(path.join(OUTPUT_ROOT, "README.md"), lines.join("\n"), "utf8");
}

async function writeUploadPrompt() {
  const prompt = `# Palantir Upload Prompt

Use the files in this bundle to create an ISR/recon route-planning operational picture for the synthetic **Sunol Ridge Training Area**.

The files have been uploaded into this folder as flat/base filenames, so match each layer by filename only. Do not require the original local subfolder paths.

## Build These Object Or Map Layers
- AOI: \`sunol_training_area_aoi.geojson\`
- OSM power infrastructure: \`osm_power_lines.geojson\`, \`osm_power_towers_poles.geojson\`
- Official power infrastructure: \`cec_transmission_lines.geojson\`, \`hifld_transmission_lines.geojson\`
- Roads, tracks, and paths: \`osm_roads_tracks_paths.geojson\`
- Buildings: \`osm_buildings.geojson\`
- Natural features: \`osm_natural_features.geojson\`
- Waterways and barriers: \`osm_waterways_barriers.geojson\`
- Terrain samples and attention points: \`elevation_samples_500m.csv\`, \`terrain_attention_points.geojson\`
- Mission route: \`synthetic_unit_route.geojson\`
- Drone waypoint queue: \`synthetic_drone_waypoints.geojson\`
- Route branches: \`synthetic_route_branches.geojson\`
- Cue zones: \`synthetic_cue_zones.geojson\`
- No-go/review zones: \`synthetic_no_go_zones.geojson\`

## Desired Ontology Objects
- Mission
- AOI
- InfrastructureFeature
- RoadOrPath
- Building
- NaturalFeature
- TerrainAttentionPoint
- NoGoZone
- UnitRoute
- DroneWaypoint
- RouteBranch
- CueZone

## Map Setup
- Show AOI boundary first.
- Style power infrastructure and no-go zones as caution layers.
- Style roads/paths and buildings as neutral context layers.
- Style terrain attention points by \`attention_type\`.
- Style synthetic mission route, drone waypoints, and route branches as the primary demo overlays.
- Preserve \`source_name\`, \`source_url\`, \`retrieved_at\`, and \`provisional\` properties on imported objects.

## Workflow Language
Frame this as a human-reviewed ISR/recon planning workspace. Route branches and PPS cue zones are previews for preplanned options only.

Explicitly exclude and do not create any workflow for strike, engage, kinetic action, target selection, weapon release, real drone control, MAVLINK/GCS export, hardware control, or autonomous operational command. RTB, hold, route preview, observation, scan, scout, and land/recover are allowed planning terms.
`;
  await writeFile(path.join(OUTPUT_ROOT, "PALANTIR_UPLOAD_PROMPT.md"), prompt, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
