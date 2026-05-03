# Operator Planning, Iconography, And Map Symbology

## Purpose And Audience

This is the **single consolidated reference** for:

- **Why** symbols and layers exist (operator cognition during route planning).
- **What** must be readable at a glance vs in panels.
- **How** behaviors express on the **3D map** (Cesium-oriented), in the **outline/queue**, and in **parameter surfaces**.

**Primary readers:** designers (Stitch), frontend/engineering implementing the local planner (`docs/goals/0002`, `0003`, `0005`), and anyone wiring **Plan vs Run** and **cue preview**.

**Canonical product guardrails** remain in `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md` and **graph semantics** in `docs/STATE_DECISION_GRAPH.md`. This document connects **operator intent** to **visual and UI expression**.

## Status

| Field | Value |
| --- | --- |
| **Review** | Consolidated planning + symbology — update when assets or schema freeze. |
| **Validation** | `provisional` |
| **Last updated** | `2026-05-03` |

---

## 1. Reasoning: What Route Planning Must Answer

Operators planning an ISR route are not “drawing a line”; they are staging **time**, **geometry**, **sensor behavior**, **decisions**, and **recovery**. In the hackathon MVP, everything is **synthetic / simulated** — but the **questions** match a real planner:

| Question | Where it should surface |
| --- | --- |
| **Where does the mission start and how does it thread terrain?** | Yellow route polylines; launch waypoint; AOI / no-go context layers |
| **Where does collection happen vs mere transit?** | Waypoint behavior glyph + **scan footprint** (not yellow route alone) |
| **Is the platform moving, the sensor moving, or both?** | Kinematics **1–5** shorthand and behavior-specific markers (orbit vs observe vs pan) |
| **Where can the plan branch?** | Decision waypoint + Route A/B preview geometry + cue zones |
| **What is preview vs committed?** | Lighter / dashed / labeled **preview** overlays until confirm (`R7`) |
| **What threatens feasibility?** | Warnings panel — **not** overloaded into icons |

**Design principle:** encode **class** and **state along the route** in **shape + line grammar + color family**; encode **primary numeric knobs** in **panel chips** or compact labels; keep **rationale and audit** in text.

---

## 2. At-A-Glance Channels (Iconography Discipline)

| Channel | Encodes | Examples |
| --- | --- | --- |
| **Silhouette** | Behavior **class** | Diamond = decision; ring = orbit/scout; brackets = land |
| **Hue family** | **Subsystem** or severity | Yellow = route progression; light blue = sensor; red/sparing = hard stop / no-go |
| **Line grammar** | **Progress** along route | Dotted yellow = untread; solid yellow = tread |
| **Fill / ribbon (non-yellow)** | **Collection geometry** | Scan AOI polygon, corridor — **not** the same as route centerline |
| **Badges / fractions / AUTO** | Dominant **parameter headline** | `50% overlap`, `10s dwell`, `CW` — one glance without opening a modal |

Avoid one glyph carrying **payload gadgetry** unless the demo script requires it; prefer **mission outcome** (geometry, dwell, branch, RTB).

---

## 3. POV Mark (Drone + Sensor)

- **POV represents the platform**, not only the map camera used to navigate the UI.
- **Arrow** (when shown on the vehicle): planned or simulated **velocity / heading along the route** — **not** live teleoperation for MVP.
- **Legs of the “V”**: **camera field of view** relative to the body.
- **Light blue** overlays (see §7) carry **sensor emphasis** so operators never confuse **where the aircraft goes** (yellow) with **where the sensor looks** (blue).

---

## 4. Maneuver Shorthand 1–5 (Authoring And Kinematics)

These numbers describe **how a step is authored** and **who moves** (platform vs sensor). They complement the **named behaviors** in §8.

| # | Meaning | Notes |
| --- | --- | --- |
| **1** | **Start / liftoff** | Entry to ordered track. A **small position indicator** on the route can denote **simulated progress** along segments. |
| **2** | **Orbit / pivot with fixation** | **Camera LOS fixed on a ground point**; **flight path changes** (e.g. orbit, return to waypoint). |
| **3** | **Stop and pan** | **Platform mostly fixed**; **camera pans/slews** to cover area. |
| **4** | **Waypoint customization** | Parameters and choices for **any** selected queue item — universal panel pattern. |
| **5** | **Specialty free-draw** | Custom path or scan geometry when **defaults are insufficient**; overrides or replaces templates. |

### 4.1 Core Distinction: **2** vs **3**

| | Platform | Sensor (camera POV) |
| --- | --- | --- |
| **2** | Moves (path curves around fixation) | Fixed on a point |
| **3** | Mostly fixed | Moves (pan / encapsulate area) |

### 4.2 **4** vs **5** And Defaults

- **4** = **semantics and parameters** (objectives, dwell, triggers, Route A/B, confirmation).
- **5** = **geometry authoring** — rule of thumb: **defaults first**; free-draw when templates fail.

---

## 5. Plan Mode Vs Run Mission Mode (Behavioral)

Aligns with `docs/goals/0003-plan-mode-run-mission-mode.md`.

| Mode | Operator expectation | Implementation expectation |
| --- | --- | --- |
| **Plan** | Edit waypoints, segments, overlays; branch previews as **what-if** | Editing enabled; live recompile of outline, distances, warnings |
| **Run (simulation)** | **Snapshot** of plan; advance timeline; confirm gated transitions | Reduce or block direct geometry edits; log transitions and confirmations |

Maneuvers **1–3** must read as **planned or rehearsed**, not implied real-time stick control.

---

## 6. Global Map Rules (Overlays)

| ID | Topic | Specification |
| --- | --- | --- |
| **R1** | **Untread route** | **Dotted** polyline, **yellow**, ~**50%** opacity — not yet executed in the active run. |
| **R2** | **Tread route** | **Solid** polyline, **yellow**, ~**50%** opacity — executed or committed active leg (define in Run mode). |
| **R3** | **Route vs scan** | **Yellow** = horizontal **route/timeline** only; **do not** use yellow fills for collection footprints. |
| **R4** | **Camera / sensor POV** | **Light blue** — FOV wedge, pan arc, short LOS ray, bore-sight hint. |
| **R5** | **Scan footprint / scan path** | **Non-yellow**, distinct fill/stroke — polygon, corridor, orbit ribbon, or sweep; legend labels **Scan area** / **Scan path** (pick one vocabulary). |
| **R6** | **Waypoint marker family** | Shared **stem**; behaviors differ by **head / halo / attachments** only (§8). |
| **R7** | **Preview vs commit** | Route branches, hold, RTB previews stay **provisional** until confirm — lighter stroke, dashed, and/or explicit **preview** label. |

---

## 7. Scan, Camera, And Route (Always Three-Way Distinct)

| Concept | Color / role | Operator intent |
| --- | --- | --- |
| **Route** | Yellow dotted/solid | **Where the aircraft goes over time** |
| **Scan footprint** | Non-yellow (R5) | **What ground area / pattern is collected** |
| **Camera** | Light blue (R4) | **Where the sensor looks** — pairs with **2** vs **3** kinematics |

Collection behaviors (**Scout**, **Scan area**, **Observe**) should show **scan and/or camera** alongside the waypoint, not only **R1/R2**.

---

## 8. Behavior Catalog — Operator Intent And System Expression

Use this table for **Stitch**, **Cesium layers**, and **panel design**. “Implementer notes” are suggestions, not a frozen schema.

| Behavior | Operator wants to… | Waypoint marker (3D language) | Route / map overlays | Panel / chips (headline params) | Implementer notes |
| --- | --- | --- | --- | --- | --- |
| **Launch** | Confirm **start of record** and initial heading | **Pad disc** + short liftoff stem | Route begins from pad; **solid yellow** after commit | Launch checklist, home reference | First node in queue; optional heading tick on map |
| **Transit** | Move **without** implying collection | **Through-node diamond**, minimal halo | **Dotted** ahead / **solid** behind in Run | Speed profile if modeled | Keep glyph subtle — “pass-through” |
| **Scout** | **Orbit or stare** while fixing **target area** | Stem + **orbit ring** + **fixation** dot | Orbit ribbon optional; **light blue** stare wedge | Orbit dir, radius, turns, dwell | Maps to kinematics **2**; tie fixation to terrain coordinate |
| **Scan area** | Cover **AOI** with a pattern | **Frame / bracket** head anchoring footprint | **Scan polygon/corridor** (R5), **not** yellow fill | Grid/overlap %, altitude band, exit condition | Maps to **5** when geometry is custom |
| **Fly-by** | Pass **without** stopping | **Tangent chevron** on path | Route emphasis only | Pass distance / speed | Often transit-class |
| **Observe** | **Hold** attention with **sensor** motion more than path | **Stable post** + short **blue** stare stub | Minimal yellow motion | Dwell, FOV, priority target | Maps to kinematics **3** vs Scout **2** |
| **Hold / loiter** | **Wait** for cue, time, or fuel | **Anchor ring** + dwell ticks on stem | Closed loop / racetrack optional | Duration, re-prompt, timeout branch | Pairs with **1 PPS** hold *preview* in demo |
| **Decision point** | Choose **preplanned** branch | **Diamond head** + **two stubs** for A/B | Branch **preview** polylines (R7); **cue zone** if used | Choices, confirmation, timeout | Core demo beat; `docs/goals/0005` |
| **RTB** | **Recover** safely | **Homeward arrow** + **home notch** | Path to recovery; **preview** until confirm | Fuel margin, confirm gate | **8 PPS** preview; confirm required per roundtable |
| **Land / recover** | End **flight** segment | **Touchdown brackets** + ground patch | Terminal **solid** yellow | Approach, strip/point id | Terminal state |
| **Abort / emergency** | **Stop** planning progression safely | **Octagon / stop plate** | Cease extension of route | Explicit acknowledgement | Use sparingly; non-kinetic copy |

---

## 9. Planning Layers And Infrastructure

From `docs/goals/0002-local-vite-cesium-planner-scaffold.md`. Keep **context layers** visually quieter than **R1/R2**.

| Layer | Purpose | Treatment |
| --- | --- | --- |
| **AOI** | Mission boundary | Closed frame or draped polygon — distinct from scan footprint |
| **No-go** | Hard constraint | Hatch / slash; **not** route yellow |
| **Terrain attention point** | Planning cue | Pin / flag — not a drone waypoint unless promoted |
| **Unit route** | Friendly context | **Distinct** stroke color from drone yellow (pick one muted palette) |
| **Drone route branches** | Route A / B | Two **preview-capable** styles from decision geometry |
| **Cue zone** | Simulated optical cue | Ground circle/polygon, terrain-clamped in 3D; PPS labels — goal **0005** |
| **Power / roads / buildings** | Context | Thin neutral symbology |

---

## 10. Simulated PPS — Preview Mapping

Provisional demo mapping (`docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`, goal **0005**):

| Pulses | Preview command |
| --- | --- |
| `1 PPS` | Hold / loiter preview |
| `2 PPS` | Route A preview |
| `4 PPS` | Route B preview |
| `8 PPS` | RTB preview |

**Rules:** previews **do not commit** state until operator confirms; **ambiguous** cue → **no** automatic advance — reject or ignore with logged warning.

---

## 11. MVP UX Supplements (Cross-Team)

1. **Selection model** — Selected entity: waypoint, segment, fixation, or freedraw overlay; drives panel **4**.
2. **Undo / clear** for free-draw (**5**).
3. **Regeneration feedback** after edits — outline, timeline, warnings update visibly.
4. **Empty / error** states — no mission, no selection, cue rejected.
5. **Canonical minimal event set** for video vs judge (`STATE_DECISION_GRAPH.md`).
6. **Export artifact** when Palantir path is thin.

**Open elsewhere:** Palantir minimum win, unknown observation in video vs judge, final ambiguous-cue copy.

---

## 12. Implementation Notes For Developers

- **Geometry:** internal representation **WGS84** GeoJSON-style coordinates; MGRS for **display** per goal **0004**.
- **Layer separation:** implement **route** (yellow), **scan footprint** (R5 style), **sensor** (blue), **cue zones**, **branches**, **context** as separately toggleable primitives — matches scaffold toggles.
- **Preview flag:** branch/hold/RTB geometries should carry **`preview: true`** (or equivalent) until confirmation — drives **R7** styling.
- **Decision attachment:** Route A/B are **attached to a waypoint or segment**, not global commands (`ROUNDTABLE_DEMO_REQUIREMENTS.md`).
- **Logging:** cue event, preview, operator choice, validation warning, state transition — align with roundtable audit list.

---

## Related Documents

- `docs/goals/0006-isr-map-symbology-waypoint-glyphs-and-legend.md` — Codex CLI goal implementing §6–§8 symbology in the app (after scaffold **0002**).
- `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md` — MVP guardrails, objective vocabulary, decision UX.
- `docs/STATE_DECISION_GRAPH.md` — Topology, events, guards, actions.
- `docs/ISR_MAP_SYMBOLOGY_REFERENCE.md` — Redirect pointer to this file (legacy filename).
- `docs/goals/0002-local-vite-cesium-planner-scaffold.md` — app scaffold and layers.
- `docs/goals/0003-plan-mode-run-mission-mode.md` — Plan vs Run behavior.
- `docs/goals/0005-pps-cue-zones-and-route-preview.md` — cue zones and branch preview.
