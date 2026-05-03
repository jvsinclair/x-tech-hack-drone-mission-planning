# Roundtable Demo Requirements

## Purpose
Capture the current roundtable decisions for the hackathon MVP so teammates can review product direction before implementation.

**Product principle (authoritative):** Build the **planner workflow** end-to-end (Plan, validation, Run/rehearsal, logging, export hooks). A **recorded demo or judge walkthrough** is a **derivative** of that workflow—e.g. a preloaded mission, time jumps, and a short script. **Do not** add parallel “demo-only” code paths, special modes, or one-off behavior that the real product would not use. If the one-minute video needs a tight story, that story should be achievable by **using** the same UI and data model (fixtures, bookmarks, Run timeline), not by forking the app.

**Where comprehensive clarifications live:** High-level **documentation map**, **goal slice boundaries**, and the **single-story stakeholder summary** are in **`docs/PROJECT_CONTEXT.md`** (sections *Documentation Map* and *Clarified Product And Scope Contract*). Resolved **Plan/Run** decisions are in *Decisions: Plan Mode, Run Mission Mode, And Product Shape* below; still-unresolved items are under *Open Questions*. Implementation checklists: **`docs/goals/0003-plan-mode-run-mission-mode.md`** and related goals.

---

## Mission Authoring Vs Cue-Driven Branch Preview

These are **different layers** of the product; both appear in the MVP, but they answer different questions:

| Layer | Question it answers | Primary docs |
| --- | --- | --- |
| **Mission authoring (Plan Mode)** | Where does the drone go, what behaviors attach at each step, where can the plan **branch**, and what are Route A / Route B **as designed**? | This file (Waypoint Mapper, state machine), **`docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md`** §5 / §8, **`docs/STATE_DECISION_GRAPH.md`**, goal **`0003`** |
| **Simulated cueing (Run / rehearsal)** | When a **simulated** PPS (or UI equivalent) fires, which **preplanned** option do we **preview** (hold, A, B, RTB) and when does the operator **commit**? | **`docs/goals/0005-pps-cue-zones-and-route-preview.md`**, iconography §10, *Cue And Command Preview* below |

**Clarified rule:** PPS and simulated optical cues are **intent hints** for **command preview** — not mission design tools, not IFF, not an operational command protocol. They **select among** branch/hold/RTB options that the plan already defines. A **one-minute recording** may use a **preloaded** mission and fast-forward (same app); **full interactive** use (author, edit, recompute) remains the **primary** acceptance path—see *Decisions* and *Interactive Judge Path*.

---

## Codex Goal Slices (Reference)

Use this table when scoping work or explaining the repo to judges. Full queue order: **`docs/goals/README.md`**.

| ID | Title | Role |
| --- | --- | --- |
| **0001** | Palantir offline upload bundle | Partner export / import path (not the local Vite core) |
| **0002** | Local Vite Cesium planner scaffold | App shell, map, layers, toggles |
| **0003** | Plan Mode and Run Mission Mode | Modes, **from-scratch + fixture** authoring, queue, timeline shell, snapshot + logging hooks, **preview** data contract for later goals |
| **0004** | MGRS / LatLon display | Coordinate readout rules |
| **0005** | PPS cue zones and route preview | Cue **zones**, **simulated** PPS mapping, branch **preview** in run — **not** authoring branches from cues |
| **0006** | ISR map symbology, glyphs, legend | In-app implementation of iconography **R6–R8** and legend |
| **0007** | SIDC 2525D squad land-unit icons | Unit symbology catalog, SVG generation, and tactical unit helpers |
| **0008** | Terrain-aware drone route altitude | `120 m AGL` default, AGL/MSL route profiles, degraded-terrain warnings, and elevated Cesium 3D route review |

---

## MVP Guardrails
- V1 is X10D ISR/recon only.
- FPV, strike, engage, kinetic workflows, MAVLINK/GCS export, real drone control, and real hardware integration are future or out of scope for the hackathon MVP.
- The product must stay in ISR/recon route planning, waypoint configuration, overwatch, cue interpretation, route preview, hold, landing/recovery, and RTB.
- Simulated PPS/IR cues are tentative as a product concept. Until validated, treat them as simulated intent hints that feed command preview, not authentication, IFF, or an operational command protocol.
- All mission actors, unit movement, observations, and events in the demo should be synthetic.

## Demo Promise
- The first functional priority is the waypoint planner. Once that works, the team can decide which demo moment to emphasize most.
- The primary "wow" moment is an SC2-style waypoint queue:
  - rapidly drop ordered waypoints with a default behavior
  - view those waypoints as an editable outline of mission steps
  - select each waypoint or route segment and configure objective, action, decision triggers, and fallback behavior
- The app should feel real by allowing a judge to edit prior waypoints or route behavior and see distance, warnings, state-machine outline, timeline, and export artifacts update.

## Scenario
- Primary fixture: route-security / scout-ahead ISR mission, not L-shaped ambush execution.
- Friendly unit context: route security and recon work.
- The drone is planned before launch so it can execute key behaviors and decision logic without requiring a live feed.
- The one-minute video should use a target-identification or unknown-observation review on route as the primary decision event.
- Unknown observations may be saved for the interactive judge mode if they add too much scope to the scripted video path.
- Use real public terrain coordinates renamed as a synthetic training area.

## AOI And Terrain
- The AOI should include tactically relevant map context, especially:
  - hills and ridges
  - roads
  - buildings
  - power lines, poles, or towers
  - tree lines or vegetation
  - high-ground scout candidates
  - no-go zones
- Manually drawn obstacles and no-go zones are acceptable when clearly labeled as provisional planning aids.
- Drone route branches should default to `120 m AGL` and expose AGL/MSL/provenance once goal `0008` is implemented; this is a planning assumption, not certified obstacle clearance.
- Palantir is currently the preferred v1 source or fusion surface for terrain/context layers, but actual access and capabilities are still unknown.
- If Palantir cannot provide or expose a needed terrain object, the fallback should be imported fixtures from public data, Danti/geospatial context, OSM/Overpass, Overture/Microsoft building data, or manual annotations.

## Palantir Direction
- The team wants to include Palantir as much as possible because it fits the scope and may matter to judging.
- Current unknowns:
  - whether the team has Map, Workshop, Ontology Manager, Actions, AIP, and file import access
  - whether custom ontology objects can be created during the event
  - whether Palantir can host the primary workflow or should be the operational-picture layer beside the local planner
  - what minimum Palantir integration counts as a judge-facing win
- A simple GeoJSON/CSV import into Palantir Map is not considered enough by itself.
- Recommended working posture:
  - build a shared mission object model that can power both local UI and Palantir
  - attempt a Palantir-first workflow if access supports it
  - keep the local planner/simulator as the reliable fallback

## Waypoint Mapper
- Required flow:
  1. Place or confirm the launch point.
  2. Click ordered waypoints on the map.
  3. Drag waypoints to adjust the plan.
  4. Configure each waypoint from an editable side panel.
  5. Configure route segments between waypoints where segment behavior matters.
  6. Show live distance, time, battery, range, and validation warnings.
- Waypoints and routes between waypoints both matter:
  - a waypoint can define a state, objective, action, and on-arrival logic
  - a route segment can define transit behavior, branch options, enroute triggers, and before-proceeding checks
- Required objective/action vocabulary should include at least:
  - launch
  - land/recover
  - transit
  - scout
  - scan area
  - fly-by
  - observe
  - hold/loiter
  - decision point
  - RTB
  - abort/emergency
- Route A and Route B should be modeled as alternate preplanned route branches attached to a waypoint or route segment. They are not magic global commands.

## State Machine And Decision Model
- The waypoint queue is the operator-facing state-machine outline.
- Each waypoint can become a state node.
- Each route segment can also become a state node when it has custom behavior, branch logic, or enroute triggers.
- Required state categories should include:
  - idle/pre-flight
  - launch
  - transit
  - flight behavior
  - scan/search
  - scout
  - observe
  - hold/loiter
  - decision
  - landing/recovery
  - RTB
  - abort/emergency
- Decision triggers should be split into:
  - enroute / before-proceeding triggers
  - on-arrival triggers
- Each decision can be configured to require human confirmation or proceed automatically.
- Timeout behavior is state-specific and should be configurable per decision. Examples include hold/re-prompt, continue surveillance, continue route, select alternate route, RTB, or abort.
- Decision events should show:
  - highlighted map zone
  - available choices
  - route preview
  - rationale
  - validation warnings
  - confirmation requirements
- The app should log:
  - cue event
  - route preview
  - operator choice
  - validation warning
  - state transition
  - state-machine regeneration after edits

## ISR Constants And Validation Posture
- X10D ISR is the v1 platform profile.
- Safe demo constants can include the source-backed company specs from `docs/ISR_DRONE_TECHNICAL_SPECS.md`, including:
  - 40 minute max flight time
  - 35 minute max hover time
  - 16 m/s transit speed with obstacle avoidance
  - 5 km assumed range as an explicit tolerance/assumption, not a company-source claim
- Every parameter should have a limit or tolerance range where practical.
- V1 battery validation should account for:
  - fixed reserve percentage
  - fixed RTB threshold
  - simple distance/time estimate
- Altitude, dwell time, sensor range, and identification range can be shown as configurable or warning-level planning assumptions until each rule is source-registered and formula-registered. The current default route altitude is `120 m AGL` via `demo_drone_route_default_altitude_agl_v1`.
- The UI should distinguish source-backed constants from provisional or user-configured tolerances.

## Cue And Command Preview
- UI clicks and simulated PPS/IR cues should feed the same command-preview function.
- Current provisional command mapping:
  - `1 PPS`: hold/loiter preview
  - `2 PPS`: Route A preview
  - `4 PPS`: Route B preview
  - `8 PPS`: RTB preview
- RTB should require confirmation or explicit acknowledgement in the product (and in any recorded walkthrough).
- Unknown, no-pulse, or ambiguous cue behavior still needs final product language. Candidate behavior is to reject automatic transition, clear or leave the current preview unchanged, and log a warning for review.

## One-Minute Video Path (Example Script — Derivative)

**Normative product behavior** is defined by the Waypoint Mapper, state/decision model, Plan/Run split, and *Decisions* in this file. The list below is an **optional narrative** for a short recording: same app, same workflow, typically a **saved mission** and **time/scene jumps** so the video fits one minute. It is **not** a separate product specification.

1. Load the mission.
2. Show launch point and SC2-style waypoint queue.
3. Show relevant terrain attention point or route-context layer.
4. Fast-forward to a route decision.
5. Show target-identification or unknown-observation review on the route.
6. Simulate `4 PPS`.
7. Preview Route B as a preplanned alternate route branch.
8. Show map zone, rationale, warnings, and confirmation.
9. Confirm.
10. Animate drone scout-ahead behavior.
11. Log state transition and show the updated outline or partner layer (e.g. Palantir) if available.

## Interactive Judge Path
- A judge should be able to change live:
  - move a waypoint
  - add an obstacle/no-go zone
  - trigger PPS
  - pick Route A or Route B
  - add or reveal an unknown observation
  - modify a previous waypoint's behavior
- After a live edit, the app should recompute:
  - route distance
  - time/battery/range warnings
  - state-machine outline
  - decision tree
  - timeline
  - Palantir export or partner-layer sync, if available
- The non-canned proof point is changing a waypoint or behavior and watching the plan, warnings, outline, and timeline update.

## Minimal Data Model Candidates
These should be treated as candidate implementation objects, not finalized schemas:
- `Mission`
- `Actor`
- `DroneProfile`
- `Waypoint`
- `Route`
- `RouteSegment`
- `NoGoZone`
- `TerrainAttentionPoint`
- `CueEvent`
- `CommandPreview`
- `Decision`
- `StateTransition`
- `AuditLogEvent`

The same model should ideally power the local app and Palantir integration, but exact Palantir object constraints are still unknown.

## Decisions: Plan Mode, Run Mission Mode, And Product Shape

Resolved team decisions (**2026-05**). Align **`docs/goals/0003-plan-mode-run-mission-mode.md`**, **`docs/STATE_DECISION_GRAPH.md`**, and validators with these unless superseded by a later roundtable note.

| # | Topic | Decision |
| --- | --- | --- |
| 1 | **From-scratch minimum** | The product must support **authoring from empty**: **add launch + N waypoints** (and full Waypoint Mapper flow). Loading a fixture and editing is allowed but **not** a substitute for from-scratch acceptance. |
| 2 | **Exiting Run → Plan (snapshot / rollback)** | **Do not** roll back the **authored plan** when leaving Run. Discard **rehearsal / simulation** state (position along route, sim clock, pending preview) only. The **mission** is the durable artifact; operational intent is a plan that can be **carried and executed offline** (not a second, mutable “run buffer” that reverts the plan on exit). |
| 3 | **Edit lock in Run** | **Hard lock** on mission topology and geometry while Run is active. Return to Plan to edit (no silent in-Run editing). |
| 4 | **Timeline vs state graph; “seven beats”** | **No second product** for “demo” vs “interactive.” The **primary** specification is the full **interactive** planner: outline, decision graph, Run timeline/rehearsal driven by **mission +** `docs/STATE_DECISION_GRAPH.md` (expand the graph/timeline for real use). The **seven named beats** in goal **`0003`** are a **convenient label set** for a **short example script** (e.g. one-minute video) and optional bookmarks—not a hardcoded alternate state machine. A **preloaded mission + jumps** is a **recording convenience**, not a different workflow (see *Purpose → Product principle*). |
| 5 | **R1/R2 in 2D vs 3D** | **2D is authoritative** for tread vs untread semantics (**R1/R2**). **3D must match**—implement **guardrails** (shared derived state for “executed vs remaining” legs) so operators never see conflicting yellow-line grammar between views. |
| 6 | **Blocking Run start** | **Block** starting Run when: **invalid or incomplete parameters**, **unfinished waypoint** configuration, **no land/recover waypoint** where required by ruleset, or **debilitating damage / unusable unit state** (mission-invalid). (Refine exact rules in validator/registry passes.) |
| 7 | **Symbology sequencing** | **Goal `0006` is the visual completion gate**—do **not** ship “placeholder” symbology for long; **`0003`** + **`0006`** must align so stem/behavior glyphs (**R6**) and legend do not drift. |
| 8 | **Interactive vs recorded walkthrough** | **Primary:** build the **full interactive** workflow (Plan edits, recompute, timeline, export hooks in one session). A **pre-saved mission** is fine for **filming** a short video; the **recording is derivative** of the same workflow—no demo-specific fork. |
| 9 | **Undo** | **Delete + per-waypoint edit** is sufficient for MVP; full undo/redo stack not required. |
| 10 | **PPS on Run timeline** | **Not** a fake “placeholder beat.” **PPS interaction attaches to real decision points** in the plan (waypoint/segment with branch/hold/RTB semantics). Simulated pulses **trigger** preview at those nodes per **`0005`** mapping—same model for UI clicks and PPS. |

### Review notes (consistency)

- **Decision 4 + product principle:** The example one-minute script does **not** define a narrower engine. Expand **`STATE_DECISION_GRAPH.md`** and Run UX for **interactive** use; reuse labels/time-jumps only as **script aids** where helpful.
- **Decision 6:** “Debilitating damage” should be defined in mission/actor schema and validators when those exist—until then, treat as **explicit mission-invalid flag** or placeholder rule with clear UI copy.

---

## Open Questions

### Product, Palantir, and packaging
- What Palantir access is available during the event?
- What Palantir integration counts as the minimum win if GeoJSON/CSV import alone is not enough?
- Can the team create custom Palantir ontology objects for mission entities?
- Should PPS/IR remain only a simulated intent hint, or should the product language describe it differently after validation?
- Should unknown observations appear in the one-minute video or only the interactive session?
- What exact real-terrain AOI should be used?
- Which data exports matter most: GeoJSON layers, CSV tables, JSON state machine, briefing/checklist, or Palantir-specific import bundle?
- Which waypoint objective types are mandatory beyond launch, land/recover, transit, scout, scan area, fly-by, observe, hold, decision, RTB, and abort?

## Review Notes
- This file captures current roundtable intent and should be updated as Palantir access, AOI selection, and demo acceptance criteria become concrete.
- Do not treat this document as implementation proof or validated doctrine.
- Route, terrain, cue, and ISR rules that become app validators should be routed through the source registry and formula registry before being presented as authoritative.
