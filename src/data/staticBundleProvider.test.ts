import { describe, expect, it, vi } from "vitest";
import { loadStaticBundle, resolveArtifactPaths } from "./staticBundleProvider";
import { getLayerDefinition } from "./layerCatalog";
import type { BundleManifest, GeoJsonFeatureCollection } from "./missionTypes";

describe("staticBundleProvider", () => {
  it("returns placeholder mission data when the bundle manifest is missing", async () => {
    const fetcher = vi.fn(async () => new Response("not found", { status: 404 }));
    const data = await loadStaticBundle({ fetcher });

    expect(data.provider).toBe("placeholder");
    expect(data.status).toBe("missing");
    expect(data.layers.length).toBeGreaterThan(0);
    expect(data.notices[0]).toContain("Goal 0001 bundle");
  });

  it("maps grouped layer artifact ids to manifest paths", () => {
    const manifest: BundleManifest = {
      layers: {
        osm_power_lines: { path: "osm/osm_power_lines.geojson", count: 2 },
        osm_power_towers_poles: { path: "osm/osm_power_towers_poles.geojson", count: 1 },
        elevation_samples_500m: { path: "terrain/elevation_samples_500m.csv", count: 10 },
      },
    };

    const paths = resolveArtifactPaths(getLayerDefinition("power"), manifest);

    expect(paths.map((layer) => layer.path)).toEqual([
      "osm/osm_power_lines.geojson",
      "osm/osm_power_towers_poles.geojson",
    ]);
  });

  it("loads GeoJSON layers from a valid manifest", async () => {
    const manifest: BundleManifest = {
      title: "Sunol bundle",
      generated_at: "2026-05-03T00:00:00Z",
      layers: {
        sunol_training_area_aoi: {
          path: "aoi/sunol_training_area_aoi.geojson",
          count: 1,
          source_name: "test source",
        },
      },
    };
    const geojson: GeoJsonFeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-121.82, 37.54] },
          properties: { name: "AOI point" },
        },
      ],
    };

    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("manifest.json")) return Response.json(manifest);
      if (url.endsWith("aoi/sunol_training_area_aoi.geojson")) return Response.json(geojson);
      return new Response("not found", { status: 404 });
    });

    const data = await loadStaticBundle({ fetcher });

    expect(data.provider).toBe("static-bundle");
    expect(data.missionName).toBe("Sunol bundle");
    expect(data.layers.find((layer) => layer.id === "aoi")?.count).toBe(1);
  });
});
