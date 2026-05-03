# x-tech-hackathon

This repo contains a hackathon prototype for Problem Statement 3: Mission Command and Control. The current product direction is a non-kinetic ISR drone mission planner for the synthetic Sunol Ridge Training Area, with Palantir/Foundry as the preferred scoped-data backend and a local Vite/Cesium fallback.

## What This Gives You
- A Vite + React + TypeScript + Cesium planner shell.
- A Foundry-hosted app adapter boundary for future OSDK-backed AOI-scoped data.
- A static bundle fallback that loads Goal 0001 resources when available.
- Plan Mission and Run Mission rehearsal modes with named judge-demo timeline jumps.
- A first-stop `AGENTS.md` for future agents and contributors.
- Project context, research registries, formula governance, and tool catalog docs under `docs/`.

## Quick Start
```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run test
npm run typecheck
npm run build
```

The app runs without Palantir access. If `resources/palantir_sunol_aoi_upload/` exists, Vite serves it at `/resources/palantir_sunol_aoi_upload/`. If it does not exist, the planner loads built-in synthetic Sunol geometry.

For the Foundry-hosted path, read `docs/FOUNDRY_HOSTED_APP_SETUP.md`.

## Folder Map
```text
x-tech-hackathon/
├── README.md
├── AGENTS.md
├── package.json
├── src/
│   ├── App.tsx
│   ├── components/
│   └── data/
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── TOOL_INTERFACE_CATALOG.md
│   ├── FOUNDRY_HOSTED_APP_SETUP.md
│   ├── FORMULA_REGISTRY_POLICY.md
│   ├── VALIDATION_STATUS_VOCABULARY.md
│   ├── HANDOFF_TEMPLATE.md
│   ├── RESEARCH_NOTE_TEMPLATE.md
│   ├── DECISION_RECORD_TEMPLATE.md
│   └── MODULE_CONTEXT_HEADER_RULE.md
├── docs/research/
│   ├── formula_registry.template.json
│   ├── formula_registry.json
│   ├── problem_statement_3_resource_map.md
│   ├── source_registry.json
│   ├── tool_interface_catalog.template.json
│   └── source_registry.template.json
└── templates/
    ├── MODULE_CONTEXT_HEADER.py.txt
    ├── MODULE_CONTEXT_HEADER.md.txt
    └── NEW_VALIDATOR_STAGE_CHECKLIST.md
```

## Working Rules
- Keep human-readable docs and machine-readable registries aligned.
- Save important discoveries in focused docs, not only in chat or commit messages.
- Do not add secrets, local machine paths, generated outputs, caches, or unrelated notes.
- Prefer small, reviewable changes.
- Treat evidence labels consistently: `validated`, `provisional`, and `todo`.
