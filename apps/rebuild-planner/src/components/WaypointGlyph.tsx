"use client";

/*
Module Context
Purpose:
- Render the PRD waypoint glyph vocabulary as reusable inline SVG.
Why This Exists:
- The tactical UI must use the design-defined glyph shapes rather than generic letter badges.
Primary Inputs/Outputs:
- Inputs: Waypoint behavior definitions from the ISR symbology contract.
- Outputs: Shape-specific SVG glyphs for map markers and palette controls.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
- src/symbology/isrMapSymbology.ts
Validated:
- provisional: Covered through planner-shell UI tests and visual screenshot checks.
Current Limits / TODO:
- SVGs are compact tactical glyphs; future work can swap in higher-fidelity assets behind the same component.
Agent Maintenance Rule:
- Keep glyph shape names aligned with src/lib/symbology/isr.ts.
*/

import type { WaypointBehaviorDefinition } from "@/lib/symbology/isr";

type WaypointGlyphProps = {
  behavior: WaypointBehaviorDefinition;
  compact?: boolean;
};

export function WaypointGlyph({ behavior, compact = false }: WaypointGlyphProps) {
  const size = compact ? 28 : 42;
  const stroke = behavior.color;
  return (
    <svg className="waypoint-glyph-svg" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={`${behavior.label} glyph`}>
      <title>{behavior.label}</title>
      <circle cx="24" cy="24" r="21" fill="rgba(6, 9, 8, 0.84)" stroke="rgba(238, 241, 235, 0.28)" strokeWidth="1.5" />
      {glyphShape(behavior.glyphShape, stroke)}
      <text x="24" y="42" textAnchor="middle" fill={stroke} fontSize="7" fontWeight="900">
        {behavior.shortLabel}
      </text>
    </svg>
  );
}

function glyphShape(shape: WaypointBehaviorDefinition["glyphShape"], stroke: string) {
  switch (shape) {
    case "pad":
      return (
        <>
          <ellipse cx="24" cy="30" rx="14" ry="5" fill={stroke} fillOpacity="0.18" stroke={stroke} strokeWidth="2.8" />
          <path d="M24 9v18M18 15l6-6 6 6" fill="none" stroke={stroke} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "diamond":
      return <path d="M24 8 39 23 24 38 9 23Z" fill="rgba(6,9,8,0.8)" stroke={stroke} strokeWidth="3.6" strokeLinejoin="round" />;
    case "orbit":
      return (
        <>
          <ellipse cx="24" cy="22" rx="16" ry="9" fill="none" stroke={stroke} strokeWidth="3.4" />
          <circle cx="31" cy="19" r="3.6" fill={stroke} />
          <circle cx="24" cy="22" r="2.6" fill="#7ee7ff" />
        </>
      );
    case "frame":
      return (
        <>
          <path d="M11 17v-7h9M28 10h9v7M37 29v7h-9M20 36h-9v-7" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="16" y="16" width="16" height="13" fill={stroke} fillOpacity="0.14" stroke={stroke} strokeWidth="2" />
        </>
      );
    case "post":
      return (
        <>
          <path d="M24 9v29" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M24 20h16" fill="none" stroke="#7ee7ff" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="24" cy="20" r="8" fill="rgba(6,9,8,0.8)" stroke={stroke} strokeWidth="3.5" />
        </>
      );
    case "anchor":
      return (
        <>
          <circle cx="24" cy="23" r="12" fill="none" stroke={stroke} strokeWidth="3.5" />
          <path d="M24 9v7M24 30v7M10 23h7M31 23h7" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "decision":
      return (
        <>
          <path d="M24 8 39 23 24 38 9 23Z" fill="rgba(6,9,8,0.8)" stroke={stroke} strokeWidth="3.6" strokeLinejoin="round" />
          <path d="M9 23H3M39 23h6" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
        </>
      );
    case "home_arrow":
      return <path d="M10 26 24 10l14 16h-7v11H17V26Z" fill="rgba(6,9,8,0.8)" stroke={stroke} strokeWidth="3.5" strokeLinejoin="round" />;
    case "touchdown":
      return (
        <>
          <path d="M12 11v20M36 11v20M14 36h20M16 27h7M25 27h7" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="15" y="14" width="18" height="13" fill={stroke} fillOpacity="0.14" stroke={stroke} strokeWidth="2" />
        </>
      );
    case "octagon":
      return (
        <>
          <path d="M18 8h12l9 9v12l-9 9H18l-9-9V17Z" fill="rgba(6,9,8,0.8)" stroke={stroke} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M17 23h14" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
        </>
      );
  }
}
