import { describe, expect, it } from "vitest";
import {
  commandPreviewFromProperties,
  normalizeFeature,
  representativeFeatureCoordinate,
  sortedWaypointFeatures,
} from "./missionGeojson";
import type { GeoJsonFeature } from "./missionTypes";

describe("missionGeojson", () => {
  it("normalizes Foundry and static property aliases", () => {
    const feature = normalizeFeature({
      type: "Feature",
      geometry: { type: "Point", coordinates: [-121.84, 37.54] },
      properties: {
        command_preview: "preview_route_b",
        cue_pps: 4,
        source_name: "Synthetic mission fixture",
      },
    });

    expect(commandPreviewFromProperties(feature.properties)).toBe("preview_route_b");
    expect(feature.properties?.commandPreview).toBe("preview_route_b");
    expect(feature.properties?.ppsLabel).toBe("4 PPS");
    expect(feature.properties?.sourceName).toBe("Synthetic mission fixture");
    expect(feature.properties?.preview).toBe(true);
  });

  it("computes representative WGS84 coordinates for polygons", () => {
    const coordinate = representativeFeatureCoordinate({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[-122, 37], [-121, 37], [-121, 38], [-122, 38], [-122, 37]]],
      },
      properties: {},
    });

    expect(coordinate?.lat).toBeCloseTo(37.4);
    expect(coordinate?.lon).toBeCloseTo(-121.6);
  });

  it("sorts waypoint features by numeric sequence strings", () => {
    const features: GeoJsonFeature[] = [
      waypoint("b", "10"),
      waypoint("a", "2"),
      waypoint("c", "1"),
    ];

    expect(sortedWaypointFeatures(features).map((feature) => feature.id)).toEqual(["c", "a", "b"]);
  });
});

function waypoint(id: string, sequence: string): GeoJsonFeature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [-121.84, 37.54] },
    properties: { sequence },
  };
}
