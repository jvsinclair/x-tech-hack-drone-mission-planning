# Research Note: PPS Drone Command Mapping Plan

## Purpose
Define the demo grammar for mapping simulated PPS observations to launch-package simulation commands.

## Status
- Validation status: `provisional`
- Last reviewed: `2026-05-03`
- Owner or agent: `Codex`

## Sources
- `user_clarification_pps_drone_commands_2026_05_02`: User confirmed that PPS observations should map to drone commands.
- `docs/PALANTIR_REBUILD_MASTER_PRD.md`: Focused rebuild PRD establishes active Decision Target Zone validation and the current PPS branch mapping.
- `atpial_public_manual_ir_pulse_rates`: Public manual evidence for fixed IR illuminator pulse-rate options.
- `demo_launch_package_pps_branch_mapping_v2`: Current project rule in `docs/research/formula_registry.json`.
- `demo_optical_cue_pps_command_mapping_v1`: Deprecated historical mapping retained for earlier route-preview work.

## Command Grammar
| Observed cue | Demo command | State-machine behavior | Runtime policy |
| --- | --- | --- | --- |
| 1 PPS | Hold / loiter | Select the attached hold/loiter action from the active decision point. | Apply in Launch Package Simulation after Decision Target Zone guards pass; write audit log. |
| 2 PPS | Return to base | Select the attached RTB / recover branch from the active decision point. | Apply after guards pass; write audit log. |
| 4 PPS | Primary route | Select the attached primary branch from the active decision point. | Apply after guards pass; write audit log. |
| 8 PPS | Alternate route | Select the attached alternate branch from the active decision point. | Apply after guards pass; write audit log. |
| Continuous / no pulse / unknown | No command | Reject or clear preview. | Log as ignored or rejected with reason. |

## Validation Gates
- Simulation must be paused at an active decision point.
- A Decision Target Zone attached to that decision point must be selected or aimed at.
- The simulated aim point must be inside the selected/active target zone.
- The mapped command must be allowed from the current state-machine node and allowed by the target zone.
- The selected route or state transition must pass no-go, safety, and route-validity checks.
- Cue confidence, source, timestamp, and rejection reason must be recorded.
- The system should display the cue as a simulated input, not as proof of friendly identity.

## Demo UX
- Show the detected PPS value and mapped command in the simulation panel and audit log.
- Highlight the affected route, hold pattern, or RTB path on the map.
- Explain why the command is allowed or blocked.
- In Launch Package Simulation, valid PPS events apply immediately after guards pass; invalid events never change route state.

## Limits
- This is simulation and fixture-backed demo logic only.
- This is not authenticated IFF, real PEQ-15 hardware integration, covert signaling protocol design, or operational drone command.
- The mapping should stay inside ISR/recon, route planning, overwatch, hold/loiter, and RTB workflows.

## Follow-Up
1. Decide whether continuous illumination should remain ignored or act as a clear/cancel command.
2. Keep the interpreter pure and covered by tests before wiring it into UI/state-machine changes.
