# Project Context

## Purpose
This is the human-readable homepage for `x-tech-hackathon`.
It is the best single entrypoint for understanding current goals, architecture, validation status, and where deeper context lives.

## Current Goal
Build a hackathon solution for Problem Statement 3: Mission Command and Control, focused on drone mission planning.
The PRD will arrive in a separate document from a teammate and is expected to be pushed to the repo. Until then, prepare the repo for a human-in-the-loop drone mission planning prototype that can:
- ingest live, simulated, or fixture-backed feeds such as sensor tracks, unit positions, vehicle locations, communications, intelligence reports, and geospatial sources
- normalize mission context into consistent schemas for drone assets, objectives, no-fly areas, waypoints, route constraints, observations, confidence, timestamp, and provenance
- link assets, objectives, reports, locations, threats, constraints, and route options into a unified operational picture or knowledge graph
- validate data quality, source provenance, airspace or safety constraints, and workflow readiness before surfacing plans or runtime-backed actions
- support a dashboard and natural-language query layer that cites the underlying observations and constraints used in any answer or route recommendation
- produce reviewable artifacts that preserve assumptions, sources, warnings, and human decisions
- avoid automated weapon-release, target-selection, or engagement decisions; mission planning workflows must preserve human oversight and explainable rationale

## Current Architecture
- PRD intake and config layer:
  scenario definition, user intent preservation, mission objective capture, data-source selection, defaults, and demo constraints
- Source adapter layer:
  fixture loaders, simulated feeds, partner platform exports, OSINT datasets, and future live integrations
- Domain model and enrichment layer:
  mission plan schema, drone asset model, observation normalization, entity/event/location extraction, route constraint enrichment, correlation, deduplication, and confidence annotation
- Validator and provenance layer:
  staged checks, source evidence, route/safety constraints, hard blockers, warning surfaces, and accepted human overrides
- Runtime or workflow layer:
  external tools, long-running enrichment jobs, generated artifacts, dashboard state, and progress reporting
- Review and interface layer:
  map layers, entity graph, natural-language answers with citations, manifests, summaries, and approval gates
- Portability layer:
  keep deterministic normalization, validation, and correlation logic separate from UI and partner platform code

## Current Critical Modules
- `todo`: PRD-specific app entrypoint
- `todo`: mission plan, drone asset, waypoint, route constraint, and observation schemas
- `todo`: feed and geospatial context normalization module
- `todo`: entity/event/location extraction and route constraint correlation module
- `todo`: validator pipeline for provenance, confidence, route safety, and workflow readiness
- `todo`: drone mission planning dashboard or operational-picture interface
- `todo`: review artifact and registry loader modules

## What Is Validated Enough To Trust
- `validated`: repo is currently a research-first scaffold with no application source code.
- `validated`: project domain is Problem Statement 3, Mission Command and Control, based on user-provided hackathon context on 2026-05-02.
- `validated`: working product direction is drone mission planning, based on user clarification on 2026-05-02.
- `validated`: current documentation rules require tool catalog entries, formula registry entries, source registry entries, and module context headers as the implementation grows.

## What Is Still Provisional
- `provisional`: exact drone mission planning product scope, scenario, data sources, constraints, and demo path are pending the separate PRD.
- `provisional`: candidate partner resources and OSINT sources are mapped in `docs/research/problem_statement_3_resource_map.md`, but account access and dataset/API availability are not yet verified.
- `todo`: no runnable app, fixtures, tests, generated artifacts, or public workflow actions exist yet.

## Current Active Blockers
- PRD is not yet in the repo; teammate is expected to push it later.
- No application stack, runtime, source modules, or tests have been chosen.
- No partner platform accounts, source datasets, or demo fixtures have been verified locally.
- No project-specific schemas, validation stages, formulas, thresholds, or workflow actions have been registered.

## Current Debug Track
- Main active investigation:
  Problem Statement 3 resource mapping and PRD readiness.
- Key reference note:
  `docs/research/problem_statement_3_resource_map.md`
- Latest relevant handoff:
  `todo`: create a handoff after the PRD is ingested or implementation begins.

## Key Source-Of-Truth Docs
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
