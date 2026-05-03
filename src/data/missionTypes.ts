/*
Module Context
Purpose:
- Define shared mission data and GeoJSON-facing types for the planner.
Why This Exists:
- The UI, static bundle loader, and future Foundry OSDK adapter need a stable boundary.
Primary Inputs/Outputs:
- Inputs: WGS84 GeoJSON-like features, manifest metadata, provider status.
- Outputs: Typed MissionData and MissionLayer objects consumed by React and Cesium.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Type contracts are exercised by loader and shell tests.
Current Limits / TODO:
- This is intentionally minimal; full mission state schemas land in later goals.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

export type MissionProviderId = "auto" | "foundry" | "static";
export type MissionProviderResult = "foundry" | "static-bundle" | "placeholder";
export type MissionLoadStatus = "ready" | "partial" | "missing" | "unavailable";

export type LayerId =
  | "aoi"
  | "power"
  | "roads"
  | "buildings"
  | "terrain"
  | "unitRoute"
  | "droneBranches"
  | "cueZones"
  | "noGoZones";

export type GeometryType = "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon";

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
  metadata?: Record<string, unknown>;
}

export interface GeoJsonFeature {
  type: "Feature";
  id?: string | number;
  geometry: {
    type: GeometryType;
    coordinates: unknown;
  } | null;
  properties?: Record<string, unknown>;
}

export interface LayerStyle {
  stroke: string;
  fill?: string;
  strokeWidth: number;
  strokeAlpha?: number;
  fillAlpha?: number;
  pointColor?: string;
  dashed?: boolean;
}

export interface LayerDefinition {
  id: LayerId;
  label: string;
  description: string;
  defaultEnabled: boolean;
  artifactLayerIds: string[];
  style: LayerStyle;
}

export interface MissionLayer {
  id: LayerId;
  label: string;
  description: string;
  defaultEnabled: boolean;
  style: LayerStyle;
  count: number;
  source: string;
  status: MissionLoadStatus;
  geojson: GeoJsonFeatureCollection;
}

export interface MissionData {
  provider: MissionProviderResult;
  status: MissionLoadStatus;
  missionName: string;
  loadedAt: string;
  layers: MissionLayer[];
  notices: string[];
}

export interface FoundryMissionProvider {
  loadMissionData: () => Promise<MissionData>;
}

export interface SelectedMissionObject {
  layerId: LayerId;
  layerLabel: string;
  objectId: string;
  name: string;
  coordinate?: {
    lat: number;
    lon: number;
    elevationMeters?: number;
  };
  properties: Record<string, unknown>;
}

export interface BundleManifestLayer {
  id?: string;
  path: string;
  count: number;
  source_name?: string;
  source_url?: string;
  retrieved_at?: string;
  status?: string;
  provisional?: boolean;
}

export interface BundleManifest {
  title?: string;
  generated_at?: string;
  layers?: Record<string, BundleManifestLayer>;
}
