/** Stored schema version for persisted SIDC strings (MIL-STD-2525D). */
export const SIDC_SCHEMA_VERSION = "2525D" as const;

/** Squad-scale land unit overlay (not a mission waypoint). See Goal 0007. */
export interface TacticalUnitEntity {
  id: string;
  label: string;
  /** 30-character MIL-STD-2525D numeric SIDC */
  sidc2525d: string;
  latitude: number;
  longitude: number;
  /** Optional ellipsoid height for Cesium (meters). */
  heightMeters?: number;
}
