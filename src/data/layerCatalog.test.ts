import { describe, expect, it } from "vitest";
import { defaultEnabledLayerIds, layerCatalog } from "./layerCatalog";

describe("layerCatalog", () => {
  it("defines the required Goal 2 layer toggles in stable order", () => {
    expect(layerCatalog.map((layer) => layer.id)).toEqual([
      "aoi",
      "power",
      "roads",
      "buildings",
      "terrain",
      "unitRoute",
      "droneBranches",
      "cueZones",
      "noGoZones",
    ]);
  });

  it("keeps route branches styled as provisional dashed yellow overlays", () => {
    const routeLayer = layerCatalog.find((layer) => layer.id === "droneBranches");
    expect(routeLayer?.style.stroke).toBe("#ffd166");
    expect(routeLayer?.style.dashed).toBe(true);
    expect(defaultEnabledLayerIds.has("droneBranches")).toBe(true);
  });
});
