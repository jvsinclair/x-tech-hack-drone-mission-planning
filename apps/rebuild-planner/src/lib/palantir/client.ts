/*
Module Context
Purpose:
- Read mission context from Palantir Foundry Functions through the local Next backend.
Why This Exists:
- Browser clients should not call Foundry directly or own the default token path in the rebuild.
Primary Inputs/Outputs:
- Inputs: Foundry hostname, ontology RID, bearer token, and published Functions REST responses.
- Outputs: Mission context shaped for the rebuild bootstrap route.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
- src/data/foundryProvider.ts
Validated:
- provisional: Falls back cleanly to local bundle when token or network is unavailable.
Current Limits / TODO:
- Palantir writeback/actions are deferred; only existing read functions are used.
Agent Maintenance Rule:
- Never log or serialize bearer tokens.
*/

import type { BootstrapPayload, GeoJsonFeatureCollection, MissionLayers, MissionSource, StarterPackageSeed, WaypointBehavior } from "@/lib/types";

type FoundryFunctionName =
  | "getMissionBundle"
  | "getAoi"
  | "getInfrastructureContext"
  | "getTerrainAttentionPoints"
  | "getMissionRoute"
  | "getRouteBranches"
  | "getCueZones"
  | "getNoGoZones"
  | "getSourceManifest";

type FoundryBundle = {
  mission?: {
    id?: string;
    name?: string;
    safetyScope?: string | string[];
    description?: string;
  };
  sources?: Array<Record<string, unknown>>;
};

type FoundrySourceManifest = {
  entries?: Array<Record<string, unknown>>;
};

const emptyFeatureCollection: GeoJsonFeatureCollection = { type: "FeatureCollection", features: [] };
const DEFAULT_ALTITUDE_M = 20;

export async function loadFoundryContext(token: string): Promise<Omit<BootstrapPayload, "packages"> & { starterPackage: StarterPackageSeed }> {
  const [bundle, aoi, route, branches, cueZones, noGo, terrain, infrastructure, sourceManifest] = await Promise.all([
    executeFoundryFunction<FoundryBundle>("getMissionBundle", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getAoi", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getMissionRoute", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getRouteBranches", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getCueZones", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getNoGoZones", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getTerrainAttentionPoints", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getInfrastructureContext", token),
    executeFoundryFunction<FoundrySourceManifest>("getSourceManifest", token),
  ]);

  const layers: MissionLayers = {
    aoi: ensureFeatureCollection(aoi),
    unitRoute: ensureFeatureCollection(route),
    terrain: ensureFeatureCollection(terrain),
    noGo: ensureFeatureCollection(noGo),
    infrastructure: ensureFeatureCollection(infrastructure),
    roads: emptyFeatureCollection,
    buildings: emptyFeatureCollection,
    natural: emptyFeatureCollection,
  };

  return {
    mission: {
      id: String(bundle.mission?.id ?? "palantir-sunol-mission"),
      name: String(bundle.mission?.name ?? "Sunol Ridge Training Area"),
      safetyScope: normalizeSafetyScope(bundle.mission?.safetyScope),
      source: "palantir",
      providerMessage: "Loaded from Palantir Foundry Functions.",
      bounds: boundsFromFeatureCollection(layers.aoi),
    },
    layers,
    sources: normalizeFoundrySources(sourceManifest.entries ?? bundle.sources ?? []),
    starterPackage: starterFromFoundryRoute(route, cueZones, branches),
  };
}

export function getServerFoundryToken(requestToken: string | null): string | null {
  const envToken = process.env.FOUNDRY_BEARER_TOKEN?.trim();
  if (envToken) return envToken;
  return requestToken?.trim() || null;
}

async function executeFoundryFunction<T>(functionName: FoundryFunctionName, token: string): Promise<T> {
  const hostname = process.env.FOUNDRY_HOSTNAME || "nshackathon.palantirfoundry.com";
  const ontologyRid = process.env.FOUNDRY_ONTOLOGY_RID || "ri.ontology.main.ontology.41fccd0c-2180-4c1d-841d-8a488d1abb46";
  const response = await fetch(`https://${hostname}/api/v2/ontologies/${ontologyRid}/queries/${functionName}/execute`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ parameters: {} }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Foundry ${functionName} failed with ${response.status}`);
  }

  const payload = (await response.json()) as { value?: string };
  if (typeof payload.value !== "string") {
    throw new Error(`Foundry ${functionName} response did not include a JSON string value.`);
  }
  return JSON.parse(payload.value) as T;
}

function starterFromFoundryRoute(route: GeoJsonFeatureCollection, cueZones: GeoJsonFeatureCollection, branches: GeoJsonFeatureCollection): StarterPackageSeed {
  const waypointFeatures = route.features.filter((feature) => feature.geometry?.type === "Point");
  const waypoints = waypointFeatures.map((feature, index) => {
    const coordinates = feature.geometry?.coordinates as [number, number];
    const props = feature.properties ?? {};
    return {
      sequence: Number(props.sequence ?? index + 1),
      behavior: normalizeBehavior(String(props.action ?? props.waypointType ?? props.name ?? "transit")),
      name: String(props.name ?? `Waypoint ${index + 1}`).replace("Route A or B", "Primary or alternate"),
      objective: "",
      lon: coordinates[0],
      lat: coordinates[1],
      altitudeM: DEFAULT_ALTITUDE_M,
      dwellSeconds: null,
    };
  });

  const decision = waypoints.find((waypoint) => waypoint.behavior === "decision") ?? waypoints[2];
  const center = centerFromFirstPolygon(cueZones) ?? (decision ? [decision.lon, decision.lat] : [-121.842, 37.538]);

  return {
    name: "Palantir surveillance package",
    description: `Editable starter package imported from Foundry route context with ${branches.features.length} branch options.`,
    waypoints,
    decisionZone: decision
      ? {
          decisionWaypointSequence: decision.sequence,
          centerLon: center[0],
          centerLat: center[1],
          radiusM: 250,
        }
      : undefined,
  };
}

function normalizeSafetyScope(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) return [value];
  return ["Synthetic ISR/recon route-planning demo only."];
}

function normalizeFoundrySources(entries: Array<Record<string, unknown>>): MissionSource[] {
  return entries.map((entry) => ({
    layerId: String(entry.layerId ?? entry.layer_id ?? entry.id ?? "unknown"),
    sourceName: String(entry.sourceName ?? entry.source_name ?? entry.name ?? "Unknown source"),
    sourceUrl: String(entry.sourceUrl ?? entry.source_url ?? ""),
    retrievedAt: String(entry.retrievedAt ?? entry.retrieved_at ?? ""),
    status: String(entry.status ?? "available"),
    count: Number(entry.featureCount ?? entry.count ?? 0),
  }));
}

function ensureFeatureCollection(value: GeoJsonFeatureCollection | undefined): GeoJsonFeatureCollection {
  return value?.type === "FeatureCollection" && Array.isArray(value.features) ? value : emptyFeatureCollection;
}

function boundsFromFeatureCollection(featureCollection: GeoJsonFeatureCollection): { west: number; south: number; east: number; north: number } {
  const points = featureCollection.features.flatMap((feature) => flattenCoordinates(feature.geometry?.coordinates));
  const lonLat = points.filter((point): point is [number, number] => Array.isArray(point) && typeof point[0] === "number" && typeof point[1] === "number");
  if (lonLat.length === 0) return { west: -121.9, south: 37.48, east: -121.74, north: 37.6 };
  return {
    west: Math.min(...lonLat.map((point) => point[0])),
    south: Math.min(...lonLat.map((point) => point[1])),
    east: Math.max(...lonLat.map((point) => point[0])),
    north: Math.max(...lonLat.map((point) => point[1])),
  };
}

function centerFromFirstPolygon(featureCollection: GeoJsonFeatureCollection): [number, number] | null {
  const polygon = featureCollection.features.find((feature) => feature.geometry?.type === "Polygon");
  const ring = polygon?.geometry?.coordinates;
  if (!Array.isArray(ring) || !Array.isArray(ring[0])) return null;
  const points = ring[0].filter((point): point is [number, number] => Array.isArray(point) && typeof point[0] === "number" && typeof point[1] === "number");
  if (points.length === 0) return null;
  return [points.reduce((sum, point) => sum + point[0], 0) / points.length, points.reduce((sum, point) => sum + point[1], 0) / points.length];
}

function flattenCoordinates(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  if (typeof value[0] === "number" && typeof value[1] === "number") return [value];
  return value.flatMap(flattenCoordinates);
}

function normalizeBehavior(value: string): WaypointBehavior {
  const key = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (key.includes("launch")) return "launch";
  if (key.includes("decision")) return "decision";
  if (key.includes("scout")) return "scout";
  if (key.includes("observe")) return "observe";
  if (key.includes("scan")) return "scan_area";
  if (key.includes("hold")) return "hold_loiter";
  if (key.includes("land") || key.includes("recover")) return "land";
  if (key.includes("rtb") || key.includes("return")) return "land";
  return "transit";
}
