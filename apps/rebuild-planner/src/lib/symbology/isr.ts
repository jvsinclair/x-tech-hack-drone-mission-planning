/*
Module Context
Purpose:
- Provide the tactical waypoint palette and colors used by the rebuild planner.
Why This Exists:
- The PRD requires the rebuild to reuse the established ISR glyph vocabulary instead of inventing a new icon family.
Primary Inputs/Outputs:
- Inputs: Waypoint behavior keys.
- Outputs: Display labels, short labels, glyph shape names, and colors for UI and map markers.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
- src/symbology/isrMapSymbology.ts
Validated:
- provisional: Used by component tests for palette-driven waypoint placement.
Current Limits / TODO:
- Glyphs are CSS/SVG-styled markers in the rebuild; higher fidelity rendering can replace them without changing keys.
Agent Maintenance Rule:
- Keep behavior keys in sync with apps/rebuild-planner/src/lib/types.ts.
*/

import type { WaypointBehavior } from "@/lib/types";

export type WaypointGlyphShape =
  | "pad"
  | "diamond"
  | "orbit"
  | "frame"
  | "post"
  | "anchor"
  | "decision"
  | "home_arrow"
  | "touchdown"
  | "octagon";

export type WaypointBehaviorDefinition = {
  type: WaypointBehavior;
  label: string;
  shortLabel: string;
  glyphShape: WaypointGlyphShape;
  color: string;
};

export const tacticalColors = {
  surface: "#101312",
  surfaceInk: "#eef1eb",
  mutedInk: "#aeb8ad",
  amber: "#ffd166",
  routeYellow: "#fbbf24",
  teal: "#6de0d2",
  cameraBlue: "#7ee7ff",
  scanPurple: "#a78bfa",
  noGoRed: "#ff5c5c",
  powerOrange: "#ff8f3d",
  friendlyGreen: "#8ec07c",
  paleYellow: "#fff1a8",
} as const;

export const waypointBehaviors: WaypointBehaviorDefinition[] = [
  { type: "launch", label: "Launch", shortLabel: "L", glyphShape: "pad", color: tacticalColors.routeYellow },
  { type: "transit", label: "Transit", shortLabel: "T", glyphShape: "diamond", color: "#facc15" },
  { type: "scout", label: "Scout", shortLabel: "S", glyphShape: "orbit", color: "#34d399" },
  { type: "scan_area", label: "Scan Area", shortLabel: "SA", glyphShape: "frame", color: tacticalColors.scanPurple },
  { type: "observe", label: "Observe", shortLabel: "O", glyphShape: "post", color: tacticalColors.cameraBlue },
  { type: "hold_loiter", label: "Hold", shortLabel: "H", glyphShape: "anchor", color: "#fb923c" },
  { type: "decision", label: "Decision", shortLabel: "D", glyphShape: "decision", color: "#f97316" },
  { type: "rtb", label: "RTB", shortLabel: "R", glyphShape: "home_arrow", color: "#f59e0b" },
  { type: "land", label: "Recover", shortLabel: "LD", glyphShape: "touchdown", color: "#60a5fa" },
  { type: "abort", label: "Abort", shortLabel: "!", glyphShape: "octagon", color: "#f87171" },
];

export const behaviorByType = Object.fromEntries(waypointBehaviors.map((behavior) => [behavior.type, behavior])) as Record<
  WaypointBehavior,
  WaypointBehaviorDefinition
>;
