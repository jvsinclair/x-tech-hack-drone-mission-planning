import { describe, expect, it } from "vitest";
import {
  SUNOL_AOI_RECTANGLE_DEGREES,
  SUNOL_AOI_SIDE_KM,
  SUNOL_LAUNCH_POINT,
  approximateRectangleSizeKm,
  squareAoiRectangle,
  terrainSourceStatus,
} from "./mapView";

describe("map view constants", () => {
  it("uses the confirmed Sunol launch point", () => {
    expect(SUNOL_LAUNCH_POINT).toEqual({
      lat: 37.504646,
      lon: -121.832739,
    });
  });

  it("frames the demo AOI as an approximate 20 km square", () => {
    const size = approximateRectangleSizeKm(SUNOL_AOI_RECTANGLE_DEGREES);

    expect(size.widthKm).toBeGreaterThan(19.8);
    expect(size.widthKm).toBeLessThan(20.2);
    expect(size.heightKm).toBeGreaterThan(19.8);
    expect(size.heightKm).toBeLessThan(20.2);
  });

  it("can compute alternate square AOI frames", () => {
    const rectangle = squareAoiRectangle(SUNOL_LAUNCH_POINT, SUNOL_AOI_SIDE_KM);
    const size = approximateRectangleSizeKm(rectangle);

    expect(size.widthKm).toBeGreaterThan(19.8);
    expect(size.heightKm).toBeGreaterThan(19.8);
  });

  it("reports whether 3D terrain can use Cesium ion", () => {
    expect(terrainSourceStatus("")).toBe("ellipsoid_fallback");
    expect(terrainSourceStatus(undefined)).toBe("ellipsoid_fallback");
    expect(terrainSourceStatus("token")).toBe("cesium_world_terrain");
  });
});
