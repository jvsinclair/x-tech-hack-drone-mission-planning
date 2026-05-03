# Project Context

## Purpose
This is the human-readable homepage for `x-tech-hackathon`.
It is the best single entrypoint for understanding current goals, architecture, validation status, and where deeper context lives.

## Current Goal
Build a hackathon solution for Problem Statement 3: Mission Command and Control, focused on drone mission planning for a simple maneuver to secure an Army unit.
The initial PRD-like planning note is `docs/StatePlanningForFlightPath.md`. Prepare the repo for a human-in-the-loop drone mission planning prototype that can:
- ingest live, simulated, or fixture-backed feeds such as drone coverage, simulated PEQ-15-style optical cue events, sensor tracks, unit positions, vehicle locations, communications, intelligence reports, and geospatial sources
- normalize mission context into consistent schemas for drone assets, objectives, no-fly areas, waypoints, route constraints, observations, confidence, timestamp, and provenance
- link assets, objectives, reports, locations, threats, constraints, and route options into a unified operational picture or knowledge graph
- validate data quality, source provenance, optical cue interpretation, airspace or safety constraints, and workflow readiness before surfacing plans or runtime-backed actions
- support a dashboard and natural-language query layer that cites the underlying observations and constraints used in any answer or route recommendation
- produce reviewable artifacts that preserve assumptions, sources, warnings, and human decisions
- avoid automated weapon-release, target-selection, or engagement decisions; mission planning workflows must preserve human oversight and explainable rationale
- treat PEQ-15-related behavior as a non-operational demo abstraction: an optical intent cue can select among prevalidated route options, but the project should not implement real hardware control, covert signaling protocols, or autonomous engagement

## Current Architecture
- PRD intake and config layer:
  scenario definition, user intent preservation, mission objective capture, data-source selection, defaults, and demo constraints
- Source adapter layer:
  fixture loaders, simulated optical cue events, simulated feeds, partner platform exports, OSINT datasets, and future live integrations
- Domain model and enrichment layer:
  mission plan schema, drone asset model, optical cue event model, mission state machine, observation normalization, entity/event/location extraction, route constraint enrichment, correlation, deduplication, and confidence annotation
- Validator and provenance layer:
  staged checks, source evidence, optical cue confidence checks, route/safety constraints, hard blockers, warning surfaces, and accepted human overrides
- Runtime or workflow layer:
  external tools, long-running enrichment jobs, generated artifacts, dashboard state, and progress reporting
- Review and interface layer:
  map layers, entity graph, natural-language answers with citations, manifests, summaries, and approval gates
- Portability layer:
  keep deterministic normalization, validation, and correlation logic separate from UI and partner platform code

## Current Critical Modules
- `provisional`: `scripts/generate-palantir-bundle.mjs` generates the goal-0001 Sunol / Pleasanton Ridge offline Palantir upload bundle.
- `provisional`: `scripts/validate-palantir-bundle.mjs` validates the generated Palantir upload bundle for required files, parseability, provenance fields, conflict markers, and obvious local-path leakage.
- `provisional`: `resources/palantir_sunol_aoi_upload/` contains generated public-source and synthetic mission artifacts for manual Palantir import.
- `src/App.tsx`: Vite/React planner shell with Cesium map, layer controls, provider selector, status, and selected-object panel.
- `src/components/MissionModePanel.tsx`: Plan Mission / Run Mission rehearsal panel with state-machine outline, named time jumps, and run log shell.
- `src/components/CesiumMissionMap.tsx`: Cesium 3D map renderer for WGS84 mission layers centered on Sunol / Pleasanton Ridge.
- `src/data/loadMissionData.ts`: Foundry-first/static-fallback provider selector for mission data.
- `src/data/missionRun.ts`: Editable plan summary and immutable run snapshot model for app-side mission rehearsal.
- `src/data/staticBundleProvider.ts`: Local loader for Goal 0001 Palantir upload bundle artifacts under `/resources/palantir_sunol_aoi_upload/`.
- `src/data/foundryProvider.ts`: Read-only Foundry Functions REST provider plus no-server generated OSDK adapter seam.
- `src/data/ppsCuePreview.ts`: Pure simulated PPS cue interpreter for preview-only Route A/B, hold, and RTB commands.
- `src/data/missionGeojson.ts`: Provider-normalization helpers for static and Foundry GeoJSON/provenance fields.
- `src/data/missionTypes.ts`: Minimal mission layer, provider, and GeoJSON-facing contracts.
- `src/symbology/` and `assets/icons/`: Goal 0006/0007 symbology modules, generated SVG assets, and MIL-STD-2525D land-unit icon tooling.
- `todo`: full mission plan, drone asset, optical cue, waypoint, route constraint, and observation schemas
- `todo`: ruleset-backed mission state machine and decision tree module
- `todo`: feed and geospatial context normalization module
- `todo`: entity/event/location extraction, optical cue interpretation, and route constraint correlation module
- `todo`: validator pipeline for provenance, cue confidence, route safety, and workflow readiness
- `todo`: drone mission planning dashboard or operational-picture interface
- `todo`: review artifact and registry loader modules

## What Is Validated Enough To Trust
- `validated`: repo is primarily a research-first scaffold; **symbology** (`src/symbology/`, `assets/icons/`) exists for Goal **0007** ahead of the full Vite/Cesium app.
- `validated`: project domain is Problem Statement 3, Mission Command and Control, based on user-provided hackathon context on 2026-05-02.
- `validated`: working product direction is drone mission planning, based on user clarification on 2026-05-02.
- `validated`: working scenario direction is a simple maneuver to secure an Army unit with drone coverage, based on user clarification on 2026-05-02.
- `validated`: intended low/no-radio interaction concept is PEQ-15-style optical cueing to choose among drone flight paths, based on user clarification on 2026-05-02.
- `validated`: current documentation rules require tool catalog entries, formula registry entries, source registry entries, and module context headers as the implementation grows.
- `provisional`: teammate-provided `docs/RulesetAndStateMachine.md` note exists in the repo and frames squad-leader mission planning, doctrine/ruleset checks, drone capability checks, and state-machine conversion.
- `provisional`: teammate-provided `docs/StatePlanningForFlightPath.md` note expands the planning workflow, ATP ruleset concept, drone capability checks, and state-machine design.
- `provisional`: demo optical cue grammar is 2 PPS -> Route A, 4 PPS -> Route B, and 8 PPS -> return to base; registered as `demo_optical_cue_pps_route_mapping_v1`.
- `provisional`: broader v1 drone command grammar is 1 PPS -> hold/loiter, 2 PPS -> Route A, 4 PPS -> Route B, and 8 PPS -> return to base; registered as `demo_optical_cue_pps_command_mapping_v1`.
- `provisional`: moving-unit mission planning approach is mapped in `docs/research/moving_unit_drone_mission_planning.md`.
- `validated`: default drone route altitude for the demo is `120 m AGL`, with editable per-waypoint altitude deferred as a stretch item, based on user clarification on 2026-05-03.
- `provisional`: public OSM Overpass, CEC transmission, HIFLD transmission, and USGS EPQS sources are registered and can produce the goal-0001 Sunol upload bundle with manifest source-health evidence.
- `validated`: Team-provided Palantir Foundry backend context exists for Team 3: ontology RID `ri.ontology.main.ontology.41fccd0c-2180-4c1d-841d-8a488d1abb46`, Foundry Functions REST route on `nshackathon.palantirfoundry.com`, and published read functions for mission bundle, AOI, route, branches, cue zones, no-go zones, terrain attention points, infrastructure context, and source manifest.
- `provisional`: the local app can call those Foundry Functions when a bearer token is supplied at runtime; no credentials are committed, no server-side writeback is implemented, and neutral context object geometries still need OSDK/direct-query support or additional functions.

## What Is Still Provisional
- `provisional`: exact drone mission planning product scope, maneuver details, data sources, constraints, and demo path still need final acceptance criteria.
- `provisional`: ATP 3-21.8, Skydio X10D, and Neros Archer references from `docs/RulesetAndStateMachine.md` are not yet verified or converted into registry-backed rules.
- `provisional`: PPS route-selection mapping is a simulation rule, not authenticated friendly identification or an operational command protocol.
- `provisional`: `docs/StatePlanningForFlightPath.md` includes FPV/kinetic examples; implementation should narrow to ISR, route planning, cue interpretation, overwatch, RTB, and human-reviewed decisions unless the PRD explicitly defines safer non-kinetic scope.
- `provisional`: candidate partner resources and OSINT sources are mapped in `docs/research/problem_statement_3_resource_map.md`, but account access and dataset/API availability are not yet verified.
- `todo`: no runnable app, fixtures, tests, generated artifacts, or public workflow actions exist yet.

## Current Active Blockers
- Foundry Developer Console / OSDK application setup is still optional for direct object queries; the current app uses published read-only Functions REST when a bearer token is supplied.
- Real hardware integration and operational low-probability-of-intercept signaling are out of scope for this repo unless the PRD explicitly reframes them as safe simulation-only requirements.
- Local Palantir authentication is not committed; create/use a runtime bearer token with Ontology read and Execute functions permissions.
- No project-specific schemas, runtime app tests, or workflow actions have been implemented beyond the provisional goal-0001 bundle scripts.

## Current Debug Track
- Main active investigation:
  Drone mission planning resource mapping, optical cue demo framing, and PRD readiness.
- Key reference note:
  `docs/research/problem_statement_3_resource_map.md`
- Latest relevant handoff:
  `todo`: create a handoff after the PRD is ingested or implementation begins.

## Documentation Map (Where Clarifications Live)

| Topic | Primary doc | Notes |
| --- | --- | --- |
| **Demo guardrails, waypoint mapper, judge path, Palantir posture** | `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md` | MVP promise; **resolved Plan/Run decisions** (*Decisions* table); remaining **open questions**; **workflow-first** principle (demo derivative). |
| **Visual contract: route vs scan vs camera, R1–R7, behaviors, PPS table** | `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md` | Single UX/engineering handoff for map symbology and preview-vs-commit (**R7**). |
| **Topology vs events vs runtime (“recompile” on edit)** | `docs/STATE_DECISION_GRAPH.md` | Planning draft; align with roundtable before freezing. |
| **Codex implementation queue (ordered goals)** | `docs/goals/README.md` | Queue rules; goals `0001`–`0007` are the durable task list. |
| **Plan Mode + Run Mission Mode + from-scratch authoring + mode-roundtable prompts** | `docs/goals/0003-plan-mode-run-mission-mode.md` | Authoritative **implementation** spec for modes; **Roundtable Questions** subsection is copied/summarized in roundtable doc for one-stop review. |
| **PPS cue zones, branch preview UI, demo PPS mapping** | `docs/goals/0005-pps-cue-zones-and-route-preview.md` | **Runtime** cueing over **preplanned** Route A/B — not mission authoring from scratch. |
| **Waypoint glyphs, legend, ISR map symbology in app** | `docs/goals/0006-isr-map-symbology-waypoint-glyphs-and-legend.md` | Implements iconography §6–§8 in code (often after `0002`/`0003`). |
| **NATO 2525D land-unit SIDC, SVG icons, tactical units** | `assets/icons/squad-land-catalog.json`, `src/symbology/sidcSymbols.ts` | Goal `docs/goals/0007-sidc-2525d-squad-land-units-svg-picker.md`; icons via **milsymbol** (`npm run generate:icons`). |
| **App scaffold, layers, toggles** | `docs/goals/0002-local-vite-cesium-planner-scaffold.md` | Local Vite + Cesium baseline. |

If a teammate asks **“where did we write that down?”** — start here, then open the linked file.

---

## Clarified Product And Scope Contract

These points consolidate **recent clarification** (chat and doc passes, 2026-05) so the repo does not split “demo path” vs “real planner” across incompatible assumptions.

### Mission authoring vs preplanned branches

- **Building a mission from scratch** is a **Plan Mode** responsibility: ordered waypoints, segments, behaviors, branches **authored** before or during rehearsal — consistent with **`docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`** (Waypoint Mapper) and **`docs/goals/0003-plan-mode-run-mission-mode.md`**.
- **Route A / Route B** are **alternate preplanned branches** attached to a **waypoint or route segment**, not global magic commands (roundtable, **`STATE_DECISION_GRAPH.md`**, iconography §8 **Decision point**).
- **Simulated PPS / optical cues** do **not** author new geometry; they **select among prevalidated previews** (hold, Route A, Route B, RTB) with human confirmation — **`docs/goals/0005-pps-cue-zones-and-route-preview.md`**, iconography §10, **`PROJECT_CONTEXT`** Purpose bullet on PEQ-15-as-demo.

### Plan Mode vs Run Mission Mode (behavioral)

- **Plan:** editing enabled; live **recompile** of outline, distances, warnings, timeline placeholders when the plan changes ( **`ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md`** §5, **`STATE_DECISION_GRAPH.md`** §1).
- **Run:** **snapshot** of the plan for **app-side simulation/rehearsal** (not real drone control); reduce or block direct geometry edits; log transitions and confirmations; route display follows **R1/R2** (untread vs tread) where implemented.
- **Preview vs committed:** branch/hold/RTB visuals stay **provisional** until operator confirm — **R7**; data should carry a **`preview`** flag (or equivalent) so **`0005`**/**`0006`** styling attaches cleanly (**iconography** §12).

### Codex goal slices (what each goal is / is not)

| Goal | Delivers | Explicitly not |
| --- | --- | --- |
| **0002** | Local planner scaffold, map layers, toggles | Full mission UX |
| **0003** | Mode switch, plan vs run state, **from-scratch + fixture** authoring path, queue/outline shell, timeline shell, audit hooks, **preview flag contract** | Live drone, Palantir SDK, full PPS cue zones (**0005**), full glyph pack (**0006**) |
| **0004** | MGRS/LatLon display rules | Modes |
| **0005** | Cue zones, simulated PPS preview mapping, Route A/B **preview** in run context | Authorship of branches (branches come from the plan); real PEQ-15 hardware |
| **0006** | Waypoint glyphs, legend, symbology module in UI | Replacing mode logic in **0003** |

### Demo vs interactive expectations

- **Product principle:** Implement the **planner workflow** first; any **recorded demo** or **one-minute script** is **derivative** (saved mission, time jumps, narration)—**no** parallel demo-only code paths. See **`docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`** (*Purpose*, *Decisions* row 4 and 8, *One-Minute Video Path*).
- **Interactive** use (author, edit, recompute, Run rehearsal) is the **primary** acceptance path; a short video may use a **preloaded** mission for pacing only.

### Single-story summary for stakeholders

> Operators **author** topology and branch options in **Plan**; **Run** rehearses execution with **logging** and **preview-then-confirm** cue flow; **PPS** only **chooses** among those **preplanned** options; **iconography** defines how route, scan, and camera read at a glance (**R1–R7**). Demos **reuse** that pipeline—they do not define a second product.

---

## Key Source-Of-Truth Docs
- Operator planning, iconography, map symbology (consolidated UX + implementation handoff):
  `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md`
- Current roundtable demo requirements:
  `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
- Tool catalog:
  `docs/TOOL_INTERFACE_CATALOG.md`
- Formula and threshold governance:
  `docs/FORMULA_REGISTRY_POLICY.md`
- Validation vocabulary:
  `docs/VALIDATION_STATUS_VOCABULARY.md`
- Module context headers:
  `docs/MODULE_CONTEXT_HEADER_RULE.md`
- Research registries:
  `docs/research/`

## Handoffs And History
- `todo`: no project-specific handoff has been created yet.

## Working Rule
When changing a covered module, update that module's context header in the same change and link back here for broader context instead of duplicating repo-wide history.
