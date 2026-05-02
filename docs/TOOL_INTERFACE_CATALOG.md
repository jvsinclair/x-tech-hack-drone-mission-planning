# Tool Interface Catalog

This is the review guide for the current `x-tech-hackathon` tool, validator, and workflow surface.
Every public stage should be documented here before agents depend on it.

Current state: no implemented public tools, validator stages, workflow actions, or runtime-backed operations exist yet. `optical_cue_interpreter_demo` is a planned provisional stage for the first implementation slice.

## Field Glossary
- `[field_name]`: `[description]` Units: `[units or enum or not_applicable]`.
- `support_level`: Current research maturity or confidence band for a stage result. Units: enum.
- `evidence_refs`: Source references attached to a stage result. Units: list.
- `output_root`: Directory where artifacts and reports should be written. Units: path.

## `optical_cue_interpreter_demo`
- Display name: Optical Cue Interpreter Demo
- Category: `pre_validation`
- Stage order: `1`
- Purpose: Map a simulated PEQ-15-style PPS cue observation to a previewed drone mission command.
- When to call: When a fixture, UI click, or demo camera event produces an observed pulse-rate cue.
- When not to call: Do not call for real hardware control, authenticated IFF, autonomous targeting, or operational drone command.
- Input type: Structured cue observation.
- Output type: Command preview with status, rationale, evidence refs, and required confirmation state.
- Supported use cases: ISR/recon mission planning demo; route branch preview; hold/loiter preview; RTB preview.
- Supported data or source families: Simulated cue events; fixture-backed cue observations; map-click replay events.
- Status values: `passed | failed | skipped | warning | blocked`
- Hard-fail vs warning behavior: Unknown, ambiguous, stale, out-of-window, out-of-sector, or state-invalid cues block automatic transition and route to human review.
- Formula or rule groups: `demo_optical_cue_pps_command_mapping_v1`
- Support level: `provisional`
- Platform support: `not_applicable`
- Required binaries or services: `none`
- Headless expectations: Pure interpreter should run headlessly against fixtures.
- Degraded modes: If cue confidence is unavailable, require human review.
- Source module: `todo`
- Kernel id: `optical_cue_interpreter_kernel`
- Kernel boundary: Deterministic mapping and validation of cue observation to command preview.
- Pure function expected: `yes`
- Required input fields:
  - `observed_pulse_rate_pps` (`number`): Detected pulse rate. Units: `pulses_per_second`.
  - `observed_at` (`string`): Observation timestamp. Units: `ISO-8601`.
  - `mission_state` (`string`): Current state-machine node. Units: `enum`.
  - `expected_sector` (`string`): Sector or map region where cue is expected. Units: `enum_or_region_id`.
  - `observed_sector` (`string`): Sector or map region where cue was observed. Units: `enum_or_region_id`.
- Optional input fields:
  - `confidence` (`number`): Cue detection confidence. Units: `0..1`.
  - `source_ref` (`string`): Fixture, UI event, or detector reference. Units: `id`.
- Derived fields: `matched_command`, `requires_confirmation`, `rejection_reason`, `evidence_refs`
- Minimal valid example input:
```json
{
  "observed_pulse_rate_pps": 2,
  "observed_at": "2026-05-02T19:00:00Z",
  "mission_state": "decision_point_alpha",
  "expected_sector": "north_approach",
  "observed_sector": "north_approach",
  "confidence": 0.92
}
```
- Example output summary:
```json
{
  "status": "passed",
  "matched_command": "preview_route_a",
  "requires_confirmation": true,
  "evidence_refs": [
    "demo_optical_cue_pps_command_mapping_v1"
  ]
}
```
- Current gaps / TODO notes:
  - PRD must confirm RTB confirmation behavior and continuous/no-pulse handling.
  - No source module or tests exist yet.

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
