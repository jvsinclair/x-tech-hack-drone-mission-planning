# Design Assets

Static reference artwork for operator-facing symbology. These files complement written specs in `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md`; implementation targets remain defined there and in `docs/goals/0006-isr-map-symbology-waypoint-glyphs-and-legend.md`.

| File | Description |
| --- | --- |
| `waypoint-behavior-atlas-stitch-reference.png` | Stitch export — **Waypoint Behavior Atlas** grid (Launch through Abort). Use as visual alignment for stem/head grammar and card copy; reconcile any label drift with the markdown spec before treating as canonical behavior text. |
| `waypoint-behavior-atlas-reference.html` | Standalone **HTML + Tailwind (CDN)** reference matching the atlas layout: SVG behavior schematics, perspective grid, token palette in `<script id="tailwind-config">`. Open locally in a browser (`file://` or static server). **Requires network** for `cdn.tailwindcss.com` and Google Fonts/Material Symbols unless vendored later. |

**Note:** Decorative framing (e.g. fictional standard identifiers such as “MIL-STD-ISR-011”, dashboard chrome) on generated art is **presentation-only** unless explicitly adopted in docs.
