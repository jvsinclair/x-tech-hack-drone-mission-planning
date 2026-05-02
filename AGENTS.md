# AGENTS.md

## Purpose
This is the repo-level onboarding file for future AI agents and engineers working in `x-tech-hackathon`.
Use it as the first stop before editing code or changing project rules.

## Read This First
1. `docs/PROJECT_CONTEXT.md`
2. `docs/TOOL_INTERFACE_CATALOG.md`
3. `docs/FORMULA_REGISTRY_POLICY.md`
4. The most relevant handoff or research note in `docs/`; before the PRD lands, start with `docs/research/problem_statement_3_resource_map.md`
5. The top-of-file context header for any covered module you plan to change

## Architecture Snapshot
- `x-tech-hackathon` follows a validator-first project shape:
  request or input normalization -> domain selection or enrichment -> validation pipeline -> runtime-backed tools -> review artifacts.
- Source-of-truth research, decisions, and evidence live in `docs/` and `docs/research/`.
- Critical runtime or workflow paths should be listed in `docs/PROJECT_CONTEXT.md`.
- Public tools, validator stages, and workflow actions must be listed in `docs/TOOL_INTERFACE_CATALOG.md`.

## Validation Status Vocabulary
- `validated`: backed by local fixtures, tests, source evidence, live runtime evidence, or accepted review artifacts.
- `provisional`: implemented and useful, but still missing calibration, coverage, or cross-checking.
- `todo`: known gap, placeholder, or explicitly deferred slice.

## Module Context Header Rule
- Covered modules must begin with the structured context header defined in `docs/MODULE_CONTEXT_HEADER_RULE.md`.
- If a covered module changes in any way, or a finding materially affects that module, update the header in the same change.
- The header should stay local to the module: purpose, why, inputs/outputs, evidence links, validation state, limits, and maintenance rule.
- Do not duplicate full project history in code comments. Link to `docs/PROJECT_CONTEXT.md` and focused research notes instead.

## Handoff Hygiene
- Keep previous handoffs in `docs/`; do not delete them unless explicitly requested.
- Save important discoveries in the most relevant research, decision, or handoff doc, not only in chat.
- Prefer adding or updating a focused note when a module-level finding changes design assumptions.

## Research And Planning Expectations
- Prefer local research docs, registries, and fixtures over memory.
- If you add a new formula, threshold, scoring rule, or heuristic, route it through the formula governance path first.
- If you add a new public tool, validator stage, or workflow action, update the tool interface catalog.
- Before promoting a new reference design, benchmark, source claim, or comparison, record the source, evidence, and status in the relevant registry.

## Practical Working Rules
- Do not touch unrelated dirty files.
- Prefer small, reviewable commits.
- Keep machine-readable artifacts and human-readable docs aligned.
- Do not commit secrets, generated outputs, caches, local environment files, or local machine paths.
- When in doubt, optimize for preserving context for the next agent.
