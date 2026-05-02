# Roundtable Demo Requirements

## Purpose
Capture the current roundtable decisions for the hackathon MVP so teammates can review the demo direction before implementation.

This document narrows the project toward a working, judge-facing route-security ISR planner. It should guide the first app slice, fixture design, Palantir integration decisions, and demo script.

## MVP Guardrails
- V1 is X10D ISR/recon only.
- FPV, strike, engage, kinetic workflows, MAVLINK/GCS export, real drone control, and real hardware integration are future or out of scope for the hackathon MVP.
- The product must stay in ISR/recon route planning, waypoint configuration, overwatch, cue interpretation, route preview, hold, landing/recovery, and RTB.
- Simulated PPS/IR cues are tentative as a product concept. Until validated, treat them as simulated intent hints that feed command preview, not authentication, IFF, or an operational command protocol.
- All mission actors, unit movement, observations, and events in the demo should be synthetic.

## Demo Promise
- The first functional priority is the waypoint planner. Once that works, the team can decide which demo moment to emphasize most.
- The primary "wow" moment is an SC2-style waypoint queue:
  - rapidly drop ordered waypoints with a default behavior
  - view those waypoints as an editable outline of mission steps
  - select each waypoint or route segment and configure objective, action, decision triggers, and fallback behavior
- The app should feel real by allowing a judge to edit prior waypoints or route behavior and see distance, warnings, state-machine outline, timeline, and export artifacts update.

## Scenario
- Primary fixture: route-security / scout-ahead ISR mission, not L-shaped ambush execution.
- Friendly unit context: route security and recon work.
- The drone is planned before launch so it can execute key behaviors and decision logic without requiring a live feed.
- The one-minute video should use a target-identification or unknown-observation review on route as the primary decision event.
- Unknown observations may be saved for the interactive judge mode if they add too much scope to the scripted video path.
- Use real public terrain coordinates renamed as a synthetic training area.

## AOI And Terrain
- The AOI should include tactically relevant map context, especially:
  - hills and ridges
  - roads
  - buildings
  - power lines, poles, or towers
  - tree lines or vegetation
  - high-ground scout candidates
  - no-go zones
- Manually drawn obstacles and no-go zones are acceptable when clearly labeled as provisional planning aids.
- Palantir is currently the preferred v1 source or fusion surface for terrain/context layers, but actual access and capabilities are still unknown.
- If Palantir cannot provide or expose a needed terrain object, the fallback should be imported fixtures from public data, Danti/geospatial context, OSM/Overpass, Overture/Microsoft building data, or manual annotations.

## Palantir Direction
- The team wants to include Palantir as much as possible because it fits the scope and may matter to judging.
- Current unknowns:
  - whether the team has Map, Workshop, Ontology Manager, Actions, AIP, and file import access
  - whether custom ontology objects can be created during the event
  - whether Palantir can host the primary workflow or should be the operational-picture layer beside the local planner
  - what minimum Palantir integration counts as a judge-facing win
- A simple GeoJSON/CSV import into Palantir Map is not considered enough by itself.
- Recommended working posture:
  - build a shared mission object model that can power both local UI and Palantir
  - attempt a Palantir-first workflow if access supports it
  - keep the local planner/simulator as the reliable fallback

## Waypoint Mapper
- Required flow:
  1. Place or confirm the launch point.
  2. Click ordered waypoints on the map.
  3. Drag waypoints to adjust the plan.
  4. Configure each waypoint from an editable side panel.
  5. Configure route segments between waypoints where segment behavior matters.
  6. Show live distance, time, battery, range, and validation warnings.
- Waypoints and routes between waypoints both matter:
  - a waypoint can define a state, objective, action, and on-arrival logic
  - a route segment can define transit behavior, branch options, enroute triggers, and before-proceeding checks
- Required objective/action vocabulary should include at least:
  - launch
  - land/recover
  - transit
  - scout
  - scan area
  - fly-by
  - observe
  - hold/loiter
  - decision point
  - RTB
  - abort/emergency
- Route A and Route B should be modeled as alternate preplanned route branches attached to a waypoint or route segment. They are not magic global commands.

## State Machine And Decision Model
- The waypoint queue is the operator-facing state-machine outline.
- Each waypoint can become a state node.
- Each route segment can also become a state node when it has custom behavior, branch logic, or enroute triggers.
- Required state categories should include:
  - idle/pre-flight
  - launch
  - transit
  - flight behavior
  - scan/search
  - scout
  - observe
  - hold/loiter
  - decision
  - landing/recovery
  - RTB
  - abort/emergency
- Decision triggers should be split into:
  - enroute / before-proceeding triggers
  - on-arrival triggers
- Each decision can be configured to require human confirmation or proceed automatically.
- Timeout behavior is state-specific and should be configurable per decision. Examples include hold/re-prompt, continue surveillance, continue route, select alternate route, RTB, or abort.
- Decision events should show:
  - highlighted map zone
  - available choices
  - route preview
  - rationale
  - validation warnings
  - confirmation requirements
- The app should log:
  - cue event
  - route preview
  - operator choice
  - validation warning
  - state transition
  - state-machine regeneration after edits

## ISR Constants And Validation Posture
- X10D ISR is the v1 platform profile.
- Safe demo constants can include the source-backed company specs from `docs/ISR_DRONE_TECHNICAL_ SPECS`, including:
  - 40 minute max flight time
  - 35 minute max hover time
  - 16 m/s transit speed with obstacle avoidance
  - 5 km assumed range as an explicit tolerance/assumption, not a company-source claim
- Every parameter should have a limit or tolerance range where practical.
- V1 battery validation should account for:
  - fixed reserve percentage
  - fixed RTB threshold
  - simple distance/time estimate
- Altitude, dwell time, sensor range, and identification range can be shown as configurable or warning-level planning assumptions until each rule is source-registered and formula-registered.
- The UI should distinguish source-backed constants from provisional or user-configured tolerances.

## Cue And Command Preview
- UI clicks and simulated PPS/IR cues should feed the same command-preview function.
- Current provisional command mapping:
  - `1 PPS`: hold/loiter preview
  - `2 PPS`: Route A preview
  - `4 PPS`: Route B preview
  - `8 PPS`: RTB preview
- RTB should require confirmation or explicit acknowledgement in the demo.
- Unknown, no-pulse, or ambiguous cue behavior still needs final product language. Candidate behavior is to reject automatic transition, clear or leave the current preview unchanged, and log a warning for review.

## One-Minute Video Path
Target scripted path:
1. Load the mission.
2. Show launch point and SC2-style waypoint queue.
3. Show relevant terrain attention point or route-context layer.
4. Fast-forward to a route decision.
5. Show target-identification or unknown-observation review on the route.
6. Simulate `4 PPS`.
7. Preview Route B as a preplanned alternate route branch.
8. Show map zone, rationale, warnings, and confirmation.
9. Confirm.
10. Animate drone scout-ahead behavior.
11. Log state transition and show the updated outline or Palantir layer.

## Interactive Judge Path
- A judge should be able to change live:
  - move a waypoint
  - add an obstacle/no-go zone
  - trigger PPS
  - pick Route A or Route B
  - add or reveal an unknown observation
  - modify a previous waypoint's behavior
- After a live edit, the app should recompute:
  - route distance
  - time/battery/range warnings
  - state-machine outline
  - decision tree
  - timeline
  - Palantir export or partner-layer sync, if available
- The non-canned proof point is changing a waypoint or behavior and watching the plan, warnings, outline, and timeline update.

## Minimal Data Model Candidates
These should be treated as candidate implementation objects, not finalized schemas:
- `Mission`
- `Actor`
- `DroneProfile`
- `Waypoint`
- `Route`
- `RouteSegment`
- `NoGoZone`
- `TerrainAttentionPoint`
- `CueEvent`
- `CommandPreview`
- `Decision`
- `StateTransition`
- `AuditLogEvent`

The same model should ideally power the local app and Palantir integration, but exact Palantir object constraints are still unknown.

## Open Questions
- What Palantir access is available during the event?
- What Palantir integration counts as the minimum win if GeoJSON/CSV import alone is not enough?
- Can the team create custom Palantir ontology objects for mission entities?
- Should PPS/IR remain only a simulated intent hint, or should the product language describe it differently after validation?
- Should unknown observations appear in the one-minute video or only the interactive judge mode?
- What exact real-terrain AOI should be used?
- Which data exports matter most: GeoJSON layers, CSV tables, JSON state machine, briefing/checklist, or Palantir-specific import bundle?
- Which waypoint objective types are mandatory beyond launch, land/recover, transit, scout, scan area, fly-by, observe, hold, decision, RTB, and abort?

## Review Notes
- This file captures current roundtable intent and should be updated as Palantir access, AOI selection, and demo acceptance criteria become concrete.
- Do not treat this document as implementation proof or validated doctrine.
- Route, terrain, cue, and ISR rules that become app validators should be routed through the source registry and formula registry before being presented as authoritative.
