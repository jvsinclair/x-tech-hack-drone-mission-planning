/*
Module Context
Purpose:
- Load Goal 0001 Palantir upload bundle artifacts into the local planner.
Why This Exists:
- The Vite/Cesium fallback must work without Palantir access and consume the same scoped AOI data prepared for Foundry.
Primary Inputs/Outputs:
- Inputs: resources/palantir_sunol_aoi_upload manifest and GeoJSON artifacts served by Vite.
- Outputs: MissionData layers grouped for the planner layer toggles.
Research / Source Links:
- docs/goals/0001-palantir-offline-upload-bundle.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Missing-bundle and path mapping behavior are covered by tests.
Current Limits / TODO:
- CSV elevation samples are not rendered directly; terrain_attention_points.geojson is used for map display.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { layerCatalog } from "./layerCatalog";
import type {
  BundleManifest,
  BundleManifestLayer,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  LayerDefinition,
  MissionData,
  MissionLayer,
} from "./missionTypes";
import { createPlaceholderMissionData } from "./placeholderMission";

export interface StaticBundleProviderOptions {
  basePath?: string;
  fetcher?: typeof fetch;
}

const defaultBasePath = "/resources/palantir_sunol_aoi_upload";

export async function loadStaticBundle(options: StaticBundleProviderOptions = {}): Promise<MissionData> {
  const basePath = trimTrailingSlash(options.basePath || defaultBasePath);
  const fetcher = options.fetcher || fetch;
  const manifestResponse = await fetchJson<BundleManifest>(`${basePath}/manifest.json`, fetcher);

  if (!manifestResponse.ok) {
    return createPlaceholderMissionData("Goal 0001 bundle is not available at /resources. Static fallback is using built-in Sunol geometry.");
  }

  const manifest = manifestResponse.value;
  const loadedLayers = await Promise.all(
    layerCatalog.map((definition) => loadGroupedLayer(definition, manifest, basePath, fetcher)),
  );

  const missingCount = loadedLayers.filter((layer) => layer.status !== "ready").length;

  return {
    provider: "static-bundle",
    status: missingCount > 0 ? "partial" : "ready",
    missionName: manifest.title || "Sunol Ridge Training Area",
    loadedAt: manifest.generated_at || new Date().toISOString(),
    layers: loadedLayers,
    notices: missingCount > 0 ? [`${missingCount} layer groups are missing or empty in the static bundle.`] : [],
  };
}

export function resolveArtifactPaths(definition: LayerDefinition, manifest: BundleManifest): BundleManifestLayer[] {
  const manifestLayers = manifest.layers || {};
  return definition.artifactLayerIds
    .map((artifactId) => manifestLayers[artifactId])
    .filter((layer): layer is BundleManifestLayer => Boolean(layer?.path && layer.path.endsWith(".geojson")));
}

async function loadGroupedLayer(
  definition: LayerDefinition,
  manifest: BundleManifest,
  basePath: string,
  fetcher: typeof fetch,
): Promise<MissionLayer> {
  const artifacts = resolveArtifactPaths(definition, manifest);
  const featureCollections = await Promise.all(
    artifacts.map((artifact) => fetchJson<GeoJsonFeatureCollection>(`${basePath}/${artifact.path}`, fetcher)),
  );

  const features: GeoJsonFeature[] = [];
  const sources = new Set<string>();
  let failed = false;

  for (const [index, result] of featureCollections.entries()) {
    if (!result.ok) {
      failed = true;
      continue;
    }
    features.push(...(result.value.features || []));
    const artifact = artifacts[index];
    if (artifact.source_name) sources.add(artifact.source_name);
  }

  const count = features.length;
  const status = failed ? "partial" : count > 0 ? "ready" : "missing";

  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    defaultEnabled: definition.defaultEnabled,
    style: definition.style,
    count,
    source: sources.size > 0 ? Array.from(sources).join("; ") : "Static bundle",
    status,
    geojson: {
      type: "FeatureCollection",
      features,
      metadata: {
        artifact_layer_ids: definition.artifactLayerIds,
        source: "static_bundle",
      },
    },
  };
}

async function fetchJson<T>(url: string, fetcher: typeof fetch): Promise<{ ok: true; value: T } | { ok: false; reason: string }> {
  try {
    const response = await fetcher(url);
    if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` };
    return { ok: true, value: await response.json() as T };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
