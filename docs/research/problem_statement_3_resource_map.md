# Research Note: Problem Statement 3 Resource Map

## Purpose
Map the hackathon brief and repo scaffold into a practical starting picture for a Mission Command and Control solution focused on drone mission planning. The PRD will define the exact product; this note keeps current resources and constraints visible until then.

## Status
- Validation status: `provisional`
- Last reviewed: `2026-05-02`
- Owner or agent: `Codex`

## Sources
- `hackathon_brief_problem_statement_3_2026_05_02`: User-provided hackathon resource brief in chat. Supports problem statement framing, judging criteria, partner resources, and OSINT links.
- `user_clarification_drone_mission_planning_2026_05_02`: User clarified that the tool direction is drone mission planning and that a teammate will push the PRD later.
- `user_clarification_secure_army_unit_2026_05_02`: User clarified that the demo scenario is a simple maneuver to secure an Army unit with drone coverage.
- `user_clarification_peq15_optical_cue_2026_05_02`: User clarified that the concept uses a PEQ-15-style optical cue to tell the drone which preplanned flight path to choose so radio communications are not required.
- `user_clarification_pps_route_mapping_2026_05_02`: User clarified the demo cue grammar: 2 PPS selects Route A, 4 PPS selects Route B, and 8 PPS requests return to base.
- `user_clarification_pps_drone_commands_2026_05_02`: User confirmed planning should map PPS observations to drone commands.
- `atpial_public_manual_ir_pulse_rates`: Public ATPIAL manual page describing IR illuminator pulse-rate options.
- `ruleset_and_state_machine_2026_05_02`: Teammate-provided local repo note describing squad-leader planning, route/ruleset checks, drone capability checks, and state-machine conversion.
- `state_planning_for_flight_path_2026_05_02`: Teammate-provided local repo note expanding the tail-end operator workflow, ATP ruleset concept, drone capability checks, and state-machine branches.
- `moving_unit_drone_mission_planning`: Local planning note for drone coverage around a moving unit and terrain attention-point generation.
- `usgs_3dep`: Candidate U.S. elevation source for terrain-derived planning aids.
- `opentopography_developers`: Candidate DEM API for clipped terrain data.
- `palantir_map_core_concepts`: Palantir Map supports base, object, link, overlay, annotation, and time-aware layers.
- `palantir_map_add_to_map`: Palantir Map can add geospatial Ontology objects and map overlays.
- `palantir_aip_features`: Palantir AIP can work with Ontology data, logic, and actions through developer tools.
- `maplibre_gl_js`: Candidate open-source basemap layer for the route-planning UI.
- `deck_gl`: Candidate geospatial visualization layer for routes, coverage, paths, and animated overlays.
- `xstate_state_machines`: Candidate state-machine library for mission state transitions.
- `project_scaffold_docs_2026_05_02`: Local repo docs under `docs/` and `templates/`. Supports governance, validation vocabulary, tool catalog, formula registry, and module header rules.
- `docs/research/source_registry.json`: Project-specific source registry created from the current resource map.

## Resource Map

| Resource family | What it gives us | Best use for Problem Statement 3 | Current status |
| --- | --- | --- | --- |
| Problem Statement 3 brief | Mission command and control framing: unified operational picture, live feeds, intelligence reports, unit positions, natural-language querying, entity linking, and human oversight. | Anchor the PRD and demo around faster mission planning, provenance, and human-reviewed decision support. | `validated` as user-provided project direction; exact scope still `todo`. |
| Drone mission planning clarification | Focuses the project on plans, drone assets, waypoints, route constraints, terrain/geospatial context, and explainable human approval. | Convert generic C2 scaffolding into mission planning schemas, validators, and UI flows. | `validated` as user-provided direction; detailed PRD still `todo`. |
| Secure Army unit maneuver scenario | Gives the demo a concrete mission: plan and monitor a simple maneuver to secure an Army unit under drone coverage. | Focus the demo on route planning, drone overwatch, unit status, threat/constraint overlays, and human approval. | `validated` as user-provided scenario direction. |
| PEQ-15-style optical cue concept | Provides a low/no-radio command concept: a simulated optical cue selects which preplanned flight path a drone should follow. | Demo as route-option selection from a camera/video/fixture event, with confidence and human confirmation. | `provisional`; keep implementation simulation-only and avoid real hardware control or covert signaling details. |
| PPS route-selection grammar | Gives the demo a tiny, memorable command grammar: 2 PPS -> Route A, 4 PPS -> Route B, 8 PPS -> return to base. | Drive the mission state machine from a simulated pulse observation, while checking route validity and cue context. | `provisional`; registered as `demo_optical_cue_pps_route_mapping_v1` and not treated as authentication. |
| PPS drone command grammar | Extends the route grammar into v1 drone state commands: 1 PPS -> hold/loiter, 2 PPS -> Route A, 4 PPS -> Route B, 8 PPS -> RTB. | Drive command preview and state-machine transitions for the demo. | `provisional`; registered as `demo_optical_cue_pps_command_mapping_v1`; cue observations are intent hints, not authenticated commands. |
| Ruleset and state machine note | Adds squad-leader planning flow: designate hold patterns, no-go zones, signaling zones, objectives, drone type, doctrine, drone capability checks, and state-machine decision trees. | Use as the bridge between PRD and implementation modules: mission-plan editor -> validator -> state-machine route options -> operator choice. | `provisional`; references and rules need validation before hard-coding. |
| StatePlanningForFlightPath note | Expands the workflow into METT-TC planning, route/no-go/hold/signaling zones, ATP-inspired validation, drone capability checks, and state-machine branches. | Use for UI flow, validation backlog, and state-machine schema. | `provisional`; narrow implementation to ISR/recon, route safety, cue interpretation, overwatch, and RTB unless the PRD defines safer non-kinetic scope. |
| Moving unit mission planning note | Defines the MVP path for unit route corridor, terrain attention points, drone route options, validation, and PPS state-machine preview. | Use as the immediate implementation map. | `provisional`; fixture-first and demo-only. |
| Judging criteria | Technical demo 35%, military impact 30%, creativity 25%, pitch 10%. | Optimize for a working end-to-end demo with clear operational impact and visible provenance, not a slide-heavy concept. | `provisional`; pasted event brief not independently verified. |
| Repo scaffold | Research-first docs, tool catalog, formula registry policy, source registry shape, validation vocabulary, module header rule, and templates. | Keep implementation explainable and auditable as features are added. | `validated` locally. |
| Palantir AIP / Foundry | Ontology, geospatial objects, map overlays, workflow actions, and AIP-backed logic over mission data. | Useful as a data/ontology/workflow backbone for units, drones, routes, cue events, terrain attention points, and state transitions. | `provisional`; use if team access is ready, but keep fixture-backed local UI as fallback. |
| OpenAI Codex / API | Code generation, agent workflows, natural-language query, summarization, extraction, and explanation support. | Useful for PRD-to-code work, report extraction, entity linking, and cited operational answers. | `todo`; exact API/product use pending PRD. |
| Danti | Geospatial intelligence search and context. | Possible geospatial enrichment source for places, imagery context, or OSINT-backed map layers. | `todo`; account access and available data not verified. |
| OSINT search tools | OSINT Framework, Exa, Shodan, DEFCON project scrape. | Source discovery, cyber/network context if the scenario includes infrastructure, and inspiration for demo data. | `provisional`; use only with cited sources. |
| Maritime AIS sources | AIS Hub, BarentsWatch historic AIS API, MarineCadastre vessel traffic, Kaggle AIS data. | Strong candidate for a public, demoable C2 scenario with moving tracks, locations, identity uncertainty, and entity correlation. | `provisional`; availability, licensing, and sample size need checking. |
| Flight tracking sources | FlightRadar24 and related public aviation feeds. | Candidate for air-track visualization, but licensing/API access may be harder for a hackathon demo. | `todo`; verify before committing. |
| Visualization tooling | Kepler.gl and deck.gl. | Map-first operational picture, track playback, spatial layers, and event timelines. | `provisional`; stack choice pending PRD. |
| Terrain data | USGS 3DEP for U.S. elevation data; OpenTopography for DEM API access if needed. | Derive provisional terrain attention points such as obstacles, high ground, and coverage gaps. | `provisional`; use fixtures first for demo reliability. |
| Simulation tooling | Wokwi and local fixture generation. | Useful if the PRD needs simulated sensors, edge devices, or streaming telemetry without external dependencies. | `provisional`; likely secondary for Problem Statement 3. |

## Recommended UI Layer
Use a custom web app rather than a generic dashboard builder:
- React + TypeScript + Vite for the app shell and fast hackathon iteration.
- MapLibre GL JS for the basemap, map camera, markers, popups, and local/open map style support.
- deck.gl for mission-specific overlays: drone paths, route alternatives, no-go zones, coverage cones/areas, unit movement, cue locations, and animated track playback.
- XState or a small typed reducer for the mission state machine. Use XState if the state graph becomes visible in the demo; otherwise keep the interpreter pure and small.
- Zustand or local React state for UI-only panel state, selected route, selected drone, and drawer visibility.

Avoid making Palantir, Danti, or Kepler.gl the primary UI shell unless the PRD or available accounts make that obviously faster. Palantir and Danti are better as data/enrichment sources for this demo; Kepler.gl is useful for quick geospatial exploration but gives less control over route-planning interactions than a custom MapLibre/deck.gl UI.

## Recommended Tool Leverage
Use partner resources in this order unless the PRD strongly says otherwise:
- OpenAI Codex for implementation velocity, repo maintenance, test generation, and PRD-to-code iteration.
- OpenAI API for a mission planning copilot that extracts structured intent from commander text, summarizes intelligence reports, explains route tradeoffs, and answers questions with citations to mission data.
- Danti for geospatial intelligence, terrain/place context, and map-enrichment material that makes the mission plan feel grounded in the real world.
- Palantir AIP / Foundry if team access is active and a teammate can move quickly there; use it as a data/ontology/workflow backbone, or as an integration source, rather than letting platform setup consume the whole demo window.
- Deck.gl or Kepler.gl for map-first visualization of routes, no-fly areas, drone positions, sensor footprints, and timeline playback.
- A local computer-vision or fixture event layer for the PEQ-15-style optical cue: in the demo, detect or replay a benign "cue observed at sector/route marker" event and map it to prevalidated route options.
- Local fixtures and simulators as the default reliability layer so the demo works even if partner APIs, accounts, or networks are slow.

## Suggested Safe Demo Lane
The most demoable and governable direction is a drone mission planning workspace with provenance:
- ingest a small fixture-backed scenario with an Army unit to secure, drone assets providing coverage, maneuver objectives, route constraints, map context, reports, and unit positions
- normalize mission objects into shared schemas
- generate or compare route options with visible constraints, assumptions, and confidence
- simulate a PEQ-15-style optical cue that selects between prevalidated route options without relying on radio messaging in the demo narrative
- use the provisional demo grammar from `docs/research/formula_registry.json`: 1 PPS previews hold/loiter, 2 PPS previews Route A, 4 PPS previews Route B, and 8 PPS previews or requests return to base
- identify terrain attention points along the moving unit corridor: obstacle candidates, high-ground scout candidates, and coverage gaps
- convert the selected plan into a simple state machine with decision points for obstacles, no-go zones, hold patterns, and operator multiple-choice inputs
- show a map/timeline/interface with drone routes, coverage areas, unit movement, no-fly areas, risks, and source evidence
- allow natural-language questions whose answers cite the exact observations and constraints used
- keep humans in control of workflow decisions and avoid automated engagement or target-selection recommendations

## Candidate Product Artifacts For The PRD
- Mission plan schema for drone assets, objectives, optical cue events, waypoints, route options, constraints, reports, entities, locations, timestamps, confidence, and provenance.
- Ruleset/state-machine schema for planned states, transitions, decision points, operator prompts, injected events, and route alternatives.
- Cue interpreter output schema for observed pulse rate, matched command, confidence, expected sector/window, rejection reason, and required human review state.
- Terrain attention-point schema for type, location, source, confidence, related route segment, and recommended drone task.
- Source adapter stubs for fixtures first, then partner/OSINT sources if access is available.
- Entity/event/location graph model.
- Validation pipeline for schema quality, stale data, contradictory reports, optical cue confidence, route/safety constraints, confidence, and missing provenance.
- Dashboard with map, timeline, route plan panel, feed panel, entity detail, and cited natural-language query.
- Review artifacts such as run manifests, source manifests, unresolved-conflict lists, and human-decision logs.

## Governance Implications
- Any public tool, validator stage, workflow action, or runtime-backed operation must be added to `docs/TOOL_INTERFACE_CATALOG.md`.
- Any confidence score, freshness threshold, correlation rule, prioritization logic, or heuristic must be registered before use under the formula registry path.
- Any external source, dataset, benchmark, or partner platform export must be added to `docs/research/source_registry.json` or its project-specific successor.
- Covered source modules must start with the required module context header once implementation begins.
- Event credentials, private links, local machine paths, generated outputs, and caches should not be written into repo docs or artifacts.

## Open Questions For The PRD
- What operational scenario should the demo use: maritime, air, base security, disaster response, convoy support, or another mission context?
- What drone mission planning action should the demo center on: route generation, route comparison, replanning, ISR tasking, or preflight validation?
- Should the PEQ-15-style cue be represented as a video/camera detection, a map click replay, a scripted fixture event, or a UI control for the hackathon demo?
- Should continuous illumination or no pulse mean "no command," or should either be used for an explicit cancel/clear preview action?
- Should Route A/B/RTB transitions auto-preview only, or can any of them advance the state machine without a confirmation click?
- Which data sources are guaranteed available during the hackathon?
- Is the primary technical bet a map dashboard, a knowledge graph, natural-language querying, workflow automation, or a partner-platform integration?
- What should the one-minute demo video prove end to end?
- What actions are allowed in scope, and which must remain advisory or out of scope?
- What stack should be used for speed: local web app, Palantir-backed app, or hybrid?
- Which references from `docs/RulesetAndStateMachine.md` are authoritative enough to implement: ATP 3-21.8 rules, Skydio X10D capabilities, Neros Archer capabilities, or local demo assumptions?

## Limits
- The hackathon brief was pasted into chat and has not been independently verified.
- Embedded links in the event brief were omitted, and private/event-only access details are intentionally not copied here.
- PEQ-15-style cueing must remain a demo abstraction unless reviewed and approved as safe simulation-only behavior; this note does not specify real hardware integration, signaling protocols, or operational drone control.
- The PPS grammar is not friendly authentication and should be treated as spoofable, ambiguous, and context-dependent.
- The teammate-provided `docs/RulesetAndStateMachine.md` note is useful product input, but its doctrine and drone capability references are not yet verified.
- The teammate-provided `docs/StatePlanningForFlightPath.md` note is useful product input, but kinetic/strike examples should not become implementation requirements for this project without separate review and safe reframing.
- Partner resource availability depends on accounts and event provisioning.
- No fixtures, app code, tests, or runtime evidence exist yet.

## Follow-Up
1. Ingest the PRD when available and update `docs/PROJECT_CONTEXT.md`.
2. Choose the demo scenario and primary data family.
3. Create initial schemas and register any public validation stages or tools before implementation depends on them.
4. Add source registry entries for any concrete datasets or APIs selected by the PRD.
