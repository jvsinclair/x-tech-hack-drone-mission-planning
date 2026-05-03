import { describe, expect, it } from "vitest";
import {
  formatCoordinatePair,
  formatLatLon,
  formatMgrs,
  isValidLatLon,
  latLonToMgrs,
  mgrsToLatLon,
} from "./coordinateFormat";
import { SUNOL_LAUNCH_POINT } from "./mapView";

describe("coordinate formatting", () => {
  it("formats the confirmed Sunol launch coordinate as Lat/Lon and MGRS", () => {
    const mgrs = latLonToMgrs(SUNOL_LAUNCH_POINT);

    expect(formatLatLon(SUNOL_LAUNCH_POINT)).toBe("37.504646, -121.832739");
    expect(mgrs).toMatch(/^10SFG\d{10}$/);
    expect(formatMgrs(mgrs)).toMatch(/^10S FG \d{5} \d{5}$/);
  });

  it("round-trips MGRS to WGS84 within display precision", () => {
    const mgrs = latLonToMgrs(SUNOL_LAUNCH_POINT);
    const roundTrip = mgrsToLatLon(mgrs);

    expect(roundTrip.lat).toBeCloseTo(SUNOL_LAUNCH_POINT.lat, 4);
    expect(roundTrip.lon).toBeCloseTo(SUNOL_LAUNCH_POINT.lon, 4);
  });

  it("formats optional elevation when present", () => {
    const formatted = formatCoordinatePair({ ...SUNOL_LAUNCH_POINT, elevationMeters: 318.4 });

    expect(formatted.elevation).toBe("318 m");
  });

  it("rejects invalid coordinates", () => {
    expect(isValidLatLon({ lat: 37, lon: -121 })).toBe(true);
    expect(isValidLatLon({ lat: 181, lon: -121 })).toBe(false);
    expect(() => latLonToMgrs({ lat: Number.NaN, lon: -121 })).toThrow(/Expected valid WGS84/);
  });
});
