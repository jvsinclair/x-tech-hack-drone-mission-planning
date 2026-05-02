# Research Note: Problem Statement 3 Resource Map

## Purpose
Map the hackathon brief and repo scaffold into a practical starting picture for a Mission Command and Control solution. The PRD will define the actual product; this note keeps current resources and constraints visible until then.

## Status
- Validation status: `provisional`
- Last reviewed: `2026-05-02`
- Owner or agent: `Codex`

## Sources
- `hackathon_brief_problem_statement_3_2026_05_02`: User-provided hackathon resource brief in chat. Supports problem statement framing, judging criteria, partner resources, and OSINT links.
- `project_scaffold_docs_2026_05_02`: Local repo docs under `docs/` and `templates/`. Supports governance, validation vocabulary, tool catalog, formula registry, and module header rules.
- `docs/research/source_registry.json`: Project-specific source registry created from the current resource map.

## Resource Map

| Resource family | What it gives us | Best use for Problem Statement 3 | Current status |
| --- | --- | --- | --- |
| Problem Statement 3 brief | Mission command and control framing: unified operational picture, live feeds, intelligence reports, unit positions, natural-language querying, entity linking, and human oversight. | Anchor the PRD and demo around faster comprehension, provenance, and human-reviewed decision support. | `validated` as user-provided project direction; exact scope still `todo`. |
| Judging criteria | Technical demo 35%, military impact 30%, creativity 25%, pitch 10%. | Optimize for a working end-to-end demo with clear operational impact and visible provenance, not a slide-heavy concept. | `provisional`; pasted event brief not independently verified. |
| Repo scaffold | Research-first docs, tool catalog, formula registry policy, source registry shape, validation vocabulary, module header rule, and templates. | Keep implementation explainable and auditable as features are added. | `validated` locally. |
| Palantir AIP / Foundry | Potential ontology, operational workflow, data integration, and natural-language application layer. | Useful if team receives access and chooses a platform-backed demo path. | `todo`; access and export patterns not verified. |
| OpenAI Codex / API | Code generation, agent workflows, natural-language query, summarization, extraction, and explanation support. | Useful for PRD-to-code work, report extraction, entity linking, and cited operational answers. | `todo`; exact API/product use pending PRD. |
| Danti | Geospatial intelligence search and context. | Possible geospatial enrichment source for places, imagery context, or OSINT-backed map layers. | `todo`; account access and available data not verified. |
| OSINT search tools | OSINT Framework, Exa, Shodan, DEFCON project scrape. | Source discovery, cyber/network context if the scenario includes infrastructure, and inspiration for demo data. | `provisional`; use only with cited sources. |
| Maritime AIS sources | AIS Hub, BarentsWatch historic AIS API, MarineCadastre vessel traffic, Kaggle AIS data. | Strong candidate for a public, demoable C2 scenario with moving tracks, locations, identity uncertainty, and entity correlation. | `provisional`; availability, licensing, and sample size need checking. |
| Flight tracking sources | FlightRadar24 and related public aviation feeds. | Candidate for air-track visualization, but licensing/API access may be harder for a hackathon demo. | `todo`; verify before committing. |
| Visualization tooling | Kepler.gl and deck.gl. | Map-first operational picture, track playback, spatial layers, and event timelines. | `provisional`; stack choice pending PRD. |
| Simulation tooling | Wokwi and local fixture generation. | Useful if the PRD needs simulated sensors, edge devices, or streaming telemetry without external dependencies. | `provisional`; likely secondary for Problem Statement 3. |

## Suggested Safe Demo Lane
The most demoable and governable direction is a unified operational picture with provenance:
- ingest a small fixture-backed stream of tracks, reports, and unit positions
- normalize observations into shared schemas
- resolve entities and link events, locations, and sources into a graph
- show a map/timeline/interface with confidence and source evidence
- allow natural-language questions whose answers cite the exact observations used
- keep humans in control of workflow decisions and avoid automated engagement or target-selection recommendations

## Candidate Product Artifacts For The PRD
- Observation schema for tracks, reports, entities, locations, timestamps, confidence, and provenance.
- Source adapter stubs for fixtures first, then partner/OSINT sources if access is available.
- Entity/event/location graph model.
- Validation pipeline for schema quality, stale data, contradictory reports, confidence, and missing provenance.
- Dashboard with map, timeline, feed panel, entity detail, and cited natural-language query.
- Review artifacts such as run manifests, source manifests, unresolved-conflict lists, and human-decision logs.

## Governance Implications
- Any public tool, validator stage, workflow action, or runtime-backed operation must be added to `docs/TOOL_INTERFACE_CATALOG.md`.
- Any confidence score, freshness threshold, correlation rule, prioritization logic, or heuristic must be registered before use under the formula registry path.
- Any external source, dataset, benchmark, or partner platform export must be added to `docs/research/source_registry.json` or its project-specific successor.
- Covered source modules must start with the required module context header once implementation begins.
- Event credentials, private links, local machine paths, generated outputs, and caches should not be written into repo docs or artifacts.

## Open Questions For The PRD
- What operational scenario should the demo use: maritime, air, base security, disaster response, convoy support, or another mission context?
- Which data sources are guaranteed available during the hackathon?
- Is the primary technical bet a map dashboard, a knowledge graph, natural-language querying, workflow automation, or a partner-platform integration?
- What should the one-minute demo video prove end to end?
- What actions are allowed in scope, and which must remain advisory or out of scope?
- What stack should be used for speed: local web app, Palantir-backed app, or hybrid?

## Limits
- The hackathon brief was pasted into chat and has not been independently verified.
- Embedded links in the event brief were omitted, and private/event-only access details are intentionally not copied here.
- Partner resource availability depends on accounts and event provisioning.
- No PRD, fixtures, app code, tests, or runtime evidence exist yet.

## Follow-Up
1. Ingest the PRD when available and update `docs/PROJECT_CONTEXT.md`.
2. Choose the demo scenario and primary data family.
3. Create initial schemas and register any public validation stages or tools before implementation depends on them.
4. Add source registry entries for any concrete datasets or APIs selected by the PRD.
