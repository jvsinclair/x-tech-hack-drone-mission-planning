# x-tech-hackathon Scaffold

This folder is a lightweight starter structure for a research-first, validator-guided hackathon project for Problem Statement 3: Mission Command and Control.
It currently contains documentation, resource mapping, rule templates, and registry shapes only. It does not include runnable product code, generated artifacts, secrets, caches, or private event details.

## What This Gives You
- A first-stop `AGENTS.md` for future agents and contributors.
- A project homepage in `docs/PROJECT_CONTEXT.md`.
- A Problem Statement 3 resource map in `docs/research/problem_statement_3_resource_map.md`.
- A tool and stage catalog template in `docs/TOOL_INTERFACE_CATALOG.md`.
- A governance policy for formulas, thresholds, scoring rules, and heuristics.
- Machine-readable registry templates under `docs/research/`.
- A project-specific source registry in `docs/research/source_registry.json`.
- Copyable context headers and checklists under `templates/`.

## Quick Start
1. Read `docs/PROJECT_CONTEXT.md`.
2. Read `docs/research/problem_statement_3_resource_map.md`.
3. Ingest the PRD when it arrives and update the project context before adding implementation details.
4. Add each public tool, validator stage, workflow step, or runtime-backed action to `docs/TOOL_INTERFACE_CATALOG.md`.
5. Put formulas, thresholds, scoring rules, and heuristics in the formula registry path before using them in implementation.
6. Add concrete datasets, APIs, partner exports, and evidence sources to `docs/research/source_registry.json`.
7. When code exists, copy the relevant module context header template into covered modules and keep it updated with any behavior change.

## Folder Map
```text
x-tech-hackathon/
├── README.md
├── AGENTS.md
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── TOOL_INTERFACE_CATALOG.md
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
