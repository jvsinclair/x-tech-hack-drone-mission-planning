# Iconography And Controls — Resolutions (Chat Compile)

## Purpose

Capture agreed semantics from team discussion so UI, copy, and validation stay aligned with the waypoint-queue ISR planner MVP. This complements `ROUNDTABLE_DEMO_REQUIREMENTS.md` and `STATE_DECISION_GRAPH.md` with **operator-facing iconography** and **MVP scope supplements**.

## Status

| Field | Value |
| --- | --- |
| **Review** | Planning aid — reconcile with implementation and `docs/goals/` as those land. |
| **Last updated** | `2026-05-02` |

---

## 1. POV Mark (Drone + Sensor)

- **POV represents the drone**, not only the map camera.
- **Arrow** = planned / simulated **movement direction** (heading or velocity along the route). For hackathon MVP this remains **plan preview and simulation**, not live vehicle teleoperation.
- **Legs of the “V”** = **camera field of view** relative to the platform.

---

## 2. Numbered Concepts (Authoritative Meanings)

| # | Meaning | Notes |
| --- | --- | --- |
| **1** | **Start waypoint / liftoff** | Entry of the ordered track. An **unmarked circle** on the track denotes the **drone position along the executed path** (simulation along segments). |
| **2** | **Orbit / pivot around a fixation point** | **Camera line-of-sight stays fixed on a ground point**; **flight path changes** (e.g. orbit and return to the waypoint). |
| **3** | **Stop and pan** | **Drone stays substantially fixed**; **camera POV changes** (slew/pan) to cover an area. |
| **4** | **Waypoint customization / edit** | Parameters and discrete choices (dropdown + panel). **Same affordance applies to every waypoint in the queue** — universal pattern keyed off **current selection**, not a special class of step. |
| **5** | **Specialty free-draw** | **Custom geometry** when defaults are insufficient: draw flight path, scan area, etc. **Generalized alternative to default templates**, not a separate “runtime cloud” concept. |

---

## 3. Core Distinction: Maneuvers 2 vs 3

Split is **kinematic**, not vague “scout vs observe”:

| | Platform | Sensor (camera POV) |
| --- | --- | --- |
| **2** | **Moves** (path curves around fixation) | **Fixed on a point** |
| **3** | **Mostly fixed** | **Moves** (pan to encapsulate area) |

---

## 4. How 4 And 5 Relate To Defaults

- **4** = **semantics and parameters** for the selected queue item (objectives, dwell, triggers, Route A/B, confirmation — as required by roundtable scope).
- **5** = **geometry authoring** when preset defaults are not enough. Product rule of thumb: **defaults first**; **5** overrides or replaces templated shapes (paths, scan footprints, zones).

---

## 5. MVP Supplements (From Same Discussion)

These are **recommended additions** so demo behavior matches docs without scope creep:

1. **Plan vs simulate** — Explicit phases so maneuvers 1–3 read as **planned / previewed** behavior, not implied live control.
2. **Selection model** — Clarify what is selected (waypoint, segment, fixation, freedraw overlay) so **4** always has an obvious target.
3. **Defaults vs 5** — Document **default geometry per objective** and when **5** applies.
4. **Undo / clear for freedraw (5)** — Minimal undo or clear so judge demos do not dead-end.
5. **Confirmation** — Risky previews (e.g. RTB) follow one **confirm** pattern with map clicks and cues.
6. **Regeneration feedback** — After edits, visibly reflect **outline / timeline / warnings** updates (“recompile” story).
7. **Icon legend** — Short table mapping **number → platform vs camera motion → panel (4) → freedraw (5)** for judges.
8. **Empty / error states** — No mission, no selection, cue rejected: short copy and **next step**.
9. **Canonical minimal event set** — Smallest event list for **video** vs **interactive judge** (`STATE_DECISION_GRAPH.md` checkpoint).
10. **Export / demo artifact** — At least one concrete bundle (e.g. GeoJSON + outline JSON) if Palantir path is thin.

**Explicit decisions still open elsewhere:** Palantir minimum win, unknown observation in video vs judge-only, ambiguous PPS behavior (candidate: reject + log + no silent transition).

---

## Related Documents

- `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md` — MVP guardrails, waypoint vocabulary, decision UX.
- `docs/STATE_DECISION_GRAPH.md` — Topology, events, guards, actions.
- `docs/goals/` — Implementation goals (e.g. plan mode vs run mission mode, PPS cue zones) aligned with §5 Plan vs simulate above.
