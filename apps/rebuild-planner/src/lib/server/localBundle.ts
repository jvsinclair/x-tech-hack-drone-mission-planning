/*
Module Context
Purpose:
- Load the Sunol local bundle as an offline bootstrap source for the rebuild planner.
Why This Exists:
- The app must stay demoable when Palantir auth or network access is unavailable.
Primary Inputs/Outputs:
- Inputs: resources/palantir_sunol_aoi_upload files in the repository.
- Outputs: Mission context layers, source manifest, and one starter launch-package seed.
Research / Source Links:
- resources/palantir_sunol_aoi_upload/manifest.json
- docs/PALANTIR_REBUILD_MASTER_PRD.md
Validated:
- provisional: Used by /api/bootstrap fallback path.
Current Limits / TODO:
- Local route fixtures seed an editable package; they are not rendered as hidden static demo points.
Agent Maintenance Rule:
- Keep the bundle path discovery repo-relative and avoid machine-specific paths.
*/

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { BootstrapPayload, GeoJsonFeature, GeoJsonFeatureCollection, MissionLayers, MissionSource, StarterPackageSeed, WaypointBehavior } from "@/lib/types";

type ManifestShape = {
  title?: string;
  aoi?: { name?: string; west: number; south: number; east: number; north: number };
  safety_scope?: string[];
  layers?: Record<string, { path?: string; count?: number; source_name?: string; source_url?: string; retrieved_at?: string; status?: string }>;
  sources?: Array<{ source_name?: string; source_url?: string; retrieved_at?: string; status?: string; layer_id?: string; count?: number }>;
};

const emptyFeatureCollection: GeoJsonFeatureCollection = { type: "FeatureCollection", features: [] };

export function loadLocalBundle(): Omit<BootstrapPayload, "packages"> & { starterPackage: StarterPackageSeed } {
  const root = resolveBundleRoot();
  const manifest = readJson<ManifestShape>(root, "manifest.json");
  const aoi = readFeatureCollection(root, "aoi/sunol_training_area_aoi.geojson");
  const unitRoute = readFeatureCollection(root, "mission_fixture/synthetic_unit_route.geojson");
  const waypoints = readFeatureCollection(root, "mission_fixture/synthetic_drone_waypoints.geojson");
  const cueZones = readFeatureCollection(root, "mission_fixture/synthetic_cue_zones.geojson");

  const layers: MissionLayers = {
    aoi,
    unitRoute,
    terrain: readFeatureCollection(root, "terrain/terrain_attention_points.geojson"),
    noGo: readFeatureCollection(root, "mission_fixture/synthetic_no_go_zones.geojson"),
    infrastructure: combineFeatureCollections([
      readFeatureCollection(root, "osm/osm_power_lines.geojson"),
      readFeatureCollection(root, "osm/osm_power_towers_poles.geojson"),
      readFeatureCollection(root, "official_power/cec_transmission_lines.geojson"),
      readFeatureCollection(root, "official_power/hifld_transmission_lines.geojson"),
    ]),
    roads: readFeatureCollection(root, "osm/osm_roads_tracks_paths.geojson"),
    buildings: readFeatureCollection(root, "osm/osm_buildings.geojson"),
    natural: combineFeatureCollections([
      readFeatureCollection(root, "osm/osm_natural_features.geojson"),
      readFeatureCollection(root, "osm/osm_vegetation_landcover.geojson"),
      readFeatureCollection(root, "osm/osm_waterways_barriers.geojson"),
    ]),
  };

  return {
    mission: {
      id: "sunol-training-mission",
      name: manifest.aoi?.name ?? "Sunol Ridge Training Area",
      safetyScope: manifest.safety_scope ?? ["Synthetic ISR/recon route-planning demo only."],
      source: "local",
      providerMessage: "Loaded local Sunol mission bundle.",
      bounds: manifest.aoi
        ? { west: manifest.aoi.west, south: manifest.aoi.south, east: manifest.aoi.east, north: manifest.aoi.north }
        : boundsFromFeatureCollection(aoi),
    },
    layers,
    sources: normalizeSources(manifest),
    starterPackage: starterFromFixtures(waypoints, cueZones),
  };
}

function resolveBundleRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), "..", "..", "resources", "palantir_sunol_aoi_upload"),
    path.resolve(process.cwd(), "resources", "palantir_sunol_aoi_upload"),
  ];
  const found = candidates.find((candidate) => existsSync(path.join(candidate, "manifest.json")));
  if (!found) {
    throw new Error("Unable to locate resources/palantir_sunol_aoi_upload/manifest.json");
  }
  return found;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function readFeatureCollection(root: string, relativePath: string): GeoJsonFeatureCollection {
  if (!existsSync(path.join(root, relativePath))) return emptyFeatureCollection;
  const parsed = readJson<GeoJsonFeatureCollection>(root, relativePath);
  return parsed?.type === "FeatureCollection" && Array.isArray(parsed.features) ? parsed : emptyFeatureCollection;
}

function combineFeatureCollections(collections: GeoJsonFeatureCollection[]): GeoJsonFeatureCollection {
  return { type: "FeatureCollection", features: collections.flatMap((collection) => collection.features) };
}

function normalizeSources(manifest: ManifestShape): MissionSource[] {
  return (manifest.sources ?? []).map((source) => ({
    layerId: source.layer_id ?? "unknown",
    sourceName: source.source_name ?? "Unknown source",
    sourceUrl: source.source_url ?? "",
    retrievedAt: source.retrieved_at ?? "",
    status: source.status ?? "unknown",
    count: source.count ?? 0,
  }));
}

function starterFromFixtures(waypoints: GeoJsonFeatureCollection, cueZones: GeoJsonFeatureCollection): StarterPackageSeed {
  const starterWaypoints = waypoints.features
    .filter((feature) => feature.geometry?.type === "Point" && Array.isArray(feature.geometry.coordinates))
    .map((feature) => {
      const coordinates = feature.geometry?.coordinates as [number, number];
      const props = feature.properties ?? {};
      return {
        sequence: Number(props.sequence ?? 1),
        behavior: normalizeBehavior(String(props.action ?? props.waypointType ?? "transit")),
        name: String(props.name ?? `Waypoint ${props.sequence ?? ""}`).replace("Route A or B", "Primary or alternate"),
        objective: "",
        lon: coordinates[0],
        lat: coordinates[1],
        altitudeM: 120,
        dwellSeconds: null,
      };
    })
    .sort((a, b) => a.sequence - b.sequence);

  return {
    name: "Sunol surveillance package",
    description: "Editable starter package seeded from mission context.",
    waypoints: starterWaypoints,
    decisionZone: decisionZoneFromCueFixture(cueZones, starterWaypoints.find((waypoint) => waypoint.behavior === "decision")?.sequence ?? 3),
  };
}

function decisionZoneFromCueFixture(cueZones: GeoJsonFeatureCollection, decisionWaypointSequence: number): StarterPackageSeed["decisionZone"] {
  const polygon = cueZones.features.find((feature) => feature.geometry?.type === "Polygon");
  if (!polygon?.geometry || !Array.isArray(polygon.geometry.coordinates)) {
    return undefined;
  }
  const coordinates = polygon.geometry.coordinates as number[][][];
  const ring = coordinates[0] ?? [];
  const center = centerOfRing(ring);
  return {
    decisionWaypointSequence,
    centerLon: center[0],
    centerLat: center[1],
    radiusM: 250,
  };
}

function centerOfRing(ring: number[][]): [number, number] {
  const usable = ring.filter((point): point is [number, number] => Array.isArray(point) && point.length >= 2);
  const totals = usable.reduce(
    (acc, point) => {
      acc.lon += point[0];
      acc.lat += point[1];
      return acc;
    },
    { lon: 0, lat: 0 },
  );
  return usable.length > 0 ? [totals.lon / usable.length, totals.lat / usable.length] : [-121.842, 37.538];
}

function normalizeBehavior(value: string): WaypointBehavior {
  const key = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (key.includes("launch")) return "launch";
  if (key.includes("decision")) return "decision";
  if (key.includes("scout")) return "scout";
  if (key.includes("observe")) return "observe";
  if (key.includes("hold") || key.includes("loiter")) return "hold_loiter";
  if (key.includes("rtb") || key.includes("return")) return "rtb";
  if (key.includes("land") || key.includes("recover")) return "land";
  if (key.includes("scan")) return "scan_area";
  return "transit";
}

function boundsFromFeatureCollection(featureCollection: GeoJsonFeatureCollection): { west: number; south: number; east: number; north: number } {
  const points = featureCollection.features.flatMap(extractPoints);
  if (points.length === 0) return { west: -121.9, south: 37.48, east: -121.74, north: 37.6 };
  return {
    west: Math.min(...points.map((point) => point[0])),
    south: Math.min(...points.map((point) => point[1])),
    east: Math.max(...points.map((point) => point[0])),
    north: Math.max(...points.map((point) => point[1])),
  };
}

function extractPoints(feature: GeoJsonFeature): [number, number][] {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates) return [];
  return flattenCoordinates(coordinates).filter((point): point is [number, number] => Array.isArray(point) && typeof point[0] === "number" && typeof point[1] === "number");
}

function flattenCoordinates(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  if (typeof value[0] === "number" && typeof value[1] === "number") return [value];
  return value.flatMap(flattenCoordinates);
}
