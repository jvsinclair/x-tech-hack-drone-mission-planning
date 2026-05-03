/*
Module Context
Purpose:
- Provide Foundry-hosted and local REST adapter seams for mission data.
Why This Exists:
- The Palantir backend now exposes live read-only Functions while generated OSDK packages remain instance-specific and optional.
Primary Inputs/Outputs:
- Inputs: Optional window.__FOUNDRY_MISSION_PROVIDER__ adapter, optional browser/runtime bearer token, Foundry Functions REST responses.
- Outputs: MissionData from Foundry or null so the static fallback can load.
Research / Source Links:
- docs/FOUNDRY_HOSTED_APP_SETUP.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/goals/0005-pps-cue-zones-and-route-preview.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Unavailable behavior and REST response normalization are exercised by provider tests.
Current Limits / TODO:
- No secrets are committed; local REST calls require a bearer token supplied outside source control.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { layerCatalog } from "./layerCatalog";
import {
  featureCollectionHasProvisional,
  normalizeFeatureCollection,
  sortedWaypointFeatures,
} from "./missionGeojson";
import type {
  FoundryMissionProvider,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  LayerDefinition,
  LayerId,
  MissionData,
  MissionLayer,
  MissionLoadStatus,
  MissionSourceEntry,
} from "./missionTypes";

declare global {
  interface Window {
    __FOUNDRY_MISSION_PROVIDER__?: FoundryMissionProvider;
    __FOUNDRY_BEARER_TOKEN__?: string;
  }
}

const foundryHostname = "nshackathon.palantirfoundry.com";
const ontologyRid = "ri.ontology.main.ontology.41fccd0c-2180-4c1d-841d-8a488d1abb46";
const functionsBaseUrl = `https://${foundryHostname}/api/v2/ontologies/${ontologyRid}/queries`;

type FoundryFunctionName =
  | "getMissionBundle"
  | "getAoi"
  | "getMapContextLayers"
  | "getInfrastructureContext"
  | "getTerrainAttentionPoints"
  | "getMissionRoute"
  | "getRouteBranches"
  | "getCueZones"
  | "getNoGoZones"
  | "getSourceManifest";

interface FoundryMissionBundle {
  mission?: {
    name?: string;
    description?: string;
    generatedAt?: string;
    safetyScope?: string | string[];
  };
  layerCounts?: Record<string, number>;
  sources?: unknown[];
}

interface FoundrySourceManifest {
  entries?: Array<Record<string, unknown>>;
}

export async function loadFoundryMissionData(): Promise<MissionData | null> {
  const adapter = globalThis.window?.__FOUNDRY_MISSION_PROVIDER__;
  if (adapter) return adapter.loadMissionData();

  const token = readFoundryBearerToken();
  if (!token) return null;

  try {
    return await loadFoundryFunctionsMissionData(token);
  } catch {
    return null;
  }
}

export function isLikelyFoundryHosted(hostname = globalThis.location?.hostname || ""): boolean {
  return hostname.includes("palantirfoundry.com") || hostname.includes("foundry");
}

export async function executeFoundryFunction<T>(
  functionName: FoundryFunctionName,
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<T> {
  const response = await fetcher(`${functionsBaseUrl}/${functionName}/execute`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ parameters: {} }),
  });

  if (!response.ok) {
    throw new Error(`Foundry function ${functionName} failed with HTTP ${response.status}`);
  }

  const body = await response.json() as { value?: unknown };
  if (typeof body.value === "string") return JSON.parse(body.value) as T;
  return body.value as T;
}

async function loadFoundryFunctionsMissionData(token: string): Promise<MissionData> {
  const [
    bundle,
    aoi,
    infrastructure,
    terrain,
    missionRoute,
    routeBranches,
    cueZones,
    noGoZones,
    sourceManifest,
  ] = await Promise.all([
    executeFoundryFunction<FoundryMissionBundle>("getMissionBundle", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getAoi", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getInfrastructureContext", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getTerrainAttentionPoints", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getMissionRoute", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getRouteBranches", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getCueZones", token),
    executeFoundryFunction<GeoJsonFeatureCollection>("getNoGoZones", token),
    executeFoundryFunction<FoundrySourceManifest>("getSourceManifest", token),
  ]);

  const normalizedRoute = normalizeFeatureCollection(missionRoute);
  const unitRouteFeatures = normalizedRoute.features.filter((feature) => feature.geometry?.type === "LineString");
  const waypointFeatures = sortedWaypointFeatures(normalizedRoute.features.filter((feature) => feature.geometry?.type === "Point"));
  const branchFeatures = normalizeFeatureCollection(routeBranches).features;

  const layerGeojson = new Map<LayerId, GeoJsonFeatureCollection>([
    ["aoi", normalizeFeatureCollection(aoi)],
    ["power", normalizeFeatureCollection(infrastructure)],
    ["roads", emptyFeatureCollection("Foundry REST functions do not currently expose RoadOrPath geometries.")],
    ["buildings", emptyFeatureCollection("Foundry REST functions do not currently expose Building geometries.")],
    ["terrain", normalizeFeatureCollection(terrain)],
    ["unitRoute", fc(unitRouteFeatures, "Foundry UnitRoute from getMissionRoute.")],
    ["droneBranches", fc([...waypointFeatures, ...branchFeatures], "Foundry DroneWaypoint and RouteBranch features.")],
    ["cueZones", normalizeFeatureCollection(cueZones)],
    ["noGoZones", normalizeFeatureCollection(noGoZones)],
  ]);

  const layers = layerCatalog.map((definition) => foundryLayer(definition, layerGeojson.get(definition.id) || fc([])));

  return {
    provider: "foundry",
    status: layers.some((layer) => layer.status !== "ready") ? "partial" : "ready",
    missionName: bundle.mission?.name || "NatSec Hackathon Mission",
    loadedAt: bundle.mission?.generatedAt || new Date().toISOString(),
    safetyScope: normalizeSafetyScope(bundle.mission?.safetyScope),
    sources: sourcesFromFoundryManifest(sourceManifest),
    layers,
    notices: [
      "Loaded Palantir Foundry Functions REST data in read-only mode. Route previews and logs remain local until a writeback function is explicitly published.",
    ],
  };
}

function foundryLayer(definition: LayerDefinition, geojson: GeoJsonFeatureCollection): MissionLayer {
  const count = geojson.features.length;
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    defaultEnabled: definition.defaultEnabled,
    style: definition.style,
    count,
    source: sourceSummary(geojson) || "Palantir Foundry Functions",
    status: count > 0 ? "ready" : emptyLayerStatus(definition.id),
    provisional: featureCollectionHasProvisional(geojson),
    geojson,
  };
}

function emptyLayerStatus(layerId: LayerId): MissionLoadStatus {
  return layerId === "roads" || layerId === "buildings" ? "missing" : "partial";
}

function readFoundryBearerToken(): string | null {
  const windowToken = globalThis.window?.__FOUNDRY_BEARER_TOKEN__;
  const storedToken = safeLocalStorageGet("foundryBearerToken");
  const envToken = import.meta.env.VITE_FOUNDRY_BEARER_TOKEN;
  return firstNonEmpty(windowToken, storedToken, envToken);
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) || null;
  } catch {
    return null;
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function normalizeSafetyScope(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) return [value];
  return [
    "Synthetic / training ISR and reconnaissance planning scenario.",
    "Route branches, cue zones, and operator actions are previews only.",
    "No real drone control, MAVLINK/GCS, hardware-control, strike, engage, target-selection, or weapon-release workflows.",
  ];
}

function sourcesFromFoundryManifest(manifest: FoundrySourceManifest): MissionSourceEntry[] {
  return (manifest.entries || []).map((entry) => ({
    layerId: stringValue(entry.layerId ?? entry.layer_id),
    sourceName: stringValue(entry.sourceName ?? entry.source_name) || "Foundry source",
    sourceUrl: stringValue(entry.sourceUrl ?? entry.source_url),
    retrievedAt: stringValue(entry.retrievedAt ?? entry.retrieved_at),
    status: stringValue(entry.status),
    count: numberValue(entry.featureCount ?? entry.count),
    provisional: booleanValue(entry.provisional),
  }));
}

function sourceSummary(collection: GeoJsonFeatureCollection): string {
  const sources = new Set<string>();
  for (const feature of collection.features) {
    const sourceName = feature.properties?.sourceName ?? feature.properties?.source_name;
    if (typeof sourceName === "string" && sourceName.length > 0) sources.add(sourceName);
  }
  return Array.from(sources).join("; ");
}

function fc(features: GeoJsonFeature[], description?: string): GeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features,
    metadata: description ? { description } : undefined,
  };
}

function emptyFeatureCollection(description: string): GeoJsonFeatureCollection {
  return fc([], description);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}
