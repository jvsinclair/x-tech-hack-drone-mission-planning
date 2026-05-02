# Research Note: PPS Drone Command Mapping Plan

## Purpose
Define the provisional demo grammar for mapping simulated PEQ-15-style pulse observations to drone mission-planning commands.

## Status
- Validation status: `provisional`
- Last reviewed: `2026-05-02`
- Owner or agent: `Codex`

## Sources
- `user_clarification_pps_drone_commands_2026_05_02`: User confirmed that PPS observations should map to drone commands.
- `user_clarification_pps_route_mapping_2026_05_02`: User proposed 2 PPS for Route A, 4 PPS for Route B, and 8 PPS for RTB.
- `atpial_public_manual_ir_pulse_rates`: Public manual evidence for fixed IR illuminator pulse-rate options.
- `demo_optical_cue_pps_command_mapping_v1`: Project rule in `docs/research/formula_registry.json`.

## Command Grammar
| Observed cue | Demo command | State-machine behavior | Confirmation policy |
| --- | --- | --- | --- |
| 1 PPS | Hold / loiter | Preview shift to current preplanned hold pattern or overwatch orbit. | Confirm before advancing. |
| 2 PPS | Route A | Preview Route A branch from the current decision point. | Confirm before advancing. |
| 4 PPS | Route B | Preview Route B branch from the current decision point. | Confirm before advancing. |
| 8 PPS | Return to base | Preview RTB / recover branch and visually prioritize it. | Confirm or require explicit operator acknowledgement, depending on PRD safety posture. |
| Continuous / no pulse / unknown | No command | Reject or clear preview. | Log as ignored or route to review if ambiguous. |

## Validation Gates
- Cue must be observed in the expected sector or map region.
- Cue must arrive inside the expected time window for the current mission state.
- The mapped command must be allowed from the current state-machine node.
- The selected route or state transition must pass no-go, safety, and route-validity checks.
- Cue confidence, source, timestamp, and rejection reason must be recorded.
- The system should display the cue as an intent hint, not as proof of friendly identity.

## Demo UX
- Show the detected PPS value and mapped command in the mission timeline.
- Highlight the affected route, hold pattern, or RTB path on the map.
- Explain why the command is allowed or blocked.
- Require a simple human confirmation before advancing the state machine for Route A, Route B, or Hold.
- For RTB, make the recommended action prominent and logged even if final confirmation is still required.

## Limits
- This is simulation and fixture-backed demo logic only.
- This is not authenticated IFF, real PEQ-15 hardware integration, covert signaling protocol design, or operational drone command.
- The mapping should stay inside ISR/recon, route planning, overwatch, hold/loiter, and RTB workflows.

## Follow-Up
1. Confirm whether RTB should require confirmation or immediately advance after preview.
2. Decide whether continuous illumination should remain ignored or act as a clear/cancel command.
3. Implement the interpreter as a pure function first, then wire it into the UI/state-machine layer.
