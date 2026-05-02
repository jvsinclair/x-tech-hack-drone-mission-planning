# Tool Interface Catalog

This is the review guide for the current `x-tech-hackathon` tool, validator, and workflow surface.
Every public stage should be documented here before agents depend on it.

Current state: no project-specific public tools, validator stages, workflow actions, or runtime-backed operations exist yet. Use the entry template below when the PRD defines the first implementation slice.

## Field Glossary
- `[field_name]`: `[description]` Units: `[units or enum or not_applicable]`.
- `support_level`: Current research maturity or confidence band for a stage result. Units: enum.
- `evidence_refs`: Source references attached to a stage result. Units: list.
- `output_root`: Directory where artifacts and reports should be written. Units: path.

## Entry Template

## `[tool_or_stage_id]`
- Display name: `[Human Readable Name]`
- Category: `[pre_validation | selection | validation | runtime | review | maintenance]`
- Stage order: `[integer or not_applicable]`
- Purpose: `[what this stage does]`
- When to call: `[conditions where this stage should run]`
- When not to call: `[conditions where this stage should be skipped]`
- Input type: `[type, schema, or file path]`
- Output type: `[type, schema, or artifact set]`
- Supported use cases: `[list]`
- Supported data or source families: `[list]`
- Status values: `[passed | failed | skipped | warning | blocked]`
- Hard-fail vs warning behavior: `[what blocks progress and what only warns]`
- Formula or rule groups: `[ids from formula registry, if any]`
- Support level: `[validated | provisional | todo]`
- Platform support: `[not_applicable or platform notes]`
- Required binaries or services: `[none or list]`
- Headless expectations: `[not_applicable or behavior]`
- Degraded modes: `[none or list]`
- Source module: `[module or package path]`
- Kernel id: `[deterministic boundary id, if applicable]`
- Kernel boundary: `[what is pure, deterministic, or portable]`
- Pure function expected: `[yes | no | mixed]`
- Required input fields:
  - `[field]` (`[type]`): `[description]` Units: `[units]`.
- Optional input fields:
  - `[field]` (`[type]`): `[description]` Units: `[units]`.
- Derived fields: `[list]`
- Minimal valid example input:
```json
{
  "example": "replace with project-specific input"
}
```
- Example output summary:
```json
{
  "status": "passed",
  "summary": "replace with project-specific output"
}
```
- Current gaps / TODO notes:
  - `[known limitation]`

## Catalog Maintenance Rules
- Keep this Markdown file aligned with `docs/research/tool_interface_catalog.template.json` or the project-specific JSON catalog that replaces it.
- Add new public stages here before relying on them in agent workflows.
- Update examples when schemas change.
- Mark immature behavior as `provisional` or `todo`; do not present it as validated.
