/**
 * Map overlay ordering for Cesium (Goal 0007 + ICONOGRAPHY).
 * Lower numeric depth = drawn nearer to the viewer / visually “on top” for billboards
 * when combined with disableDepthTestDistance / eyeOffset — tune per integration.
 */
export const MAP_LAYER_DEPTH = {
  /** SIDC tactical units / drones */
  tacticalUnits: 0,
  /** Waypoint routing, mission route polylines (Goal 0006) */
  waypointRouting: 20,
  /** Basemap / terrain / context layers */
  mappingTerrain: 40,
} as const;
