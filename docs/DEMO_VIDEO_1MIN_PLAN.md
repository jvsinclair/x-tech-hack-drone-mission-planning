# One-minute demo video plan (outline)

Flexible structure for a ~60-second recording aligned with judging criteria and hackathon MVP scope. Detailed beats, VO script, and shot list come later—this doc is the reference skeleton only.

---

## FLAG — roundtable gate for final VO

**Do not freeze word-level voiceover or shot list until the checklist below has team answers.** These items drive what you may truthfully say and show in ~60 seconds.

**Highest leverage (answer first):** problem lead and story (6–8), recording surface and live vs fixture (15–16), AOI label (17), demo beat priority (19–20), partner beat in VO (21), Palantir/data packaging truth (24–27), ISR-only guardrails (28), ambiguous-cue posture (29).

---

## Roundtable checklist — questions to answer before final VO

### Intro (~6–10 s)

1. **Team identity:** Name people/roles in VO, or only team + track/problem statement?
2. **Product name:** One official string for the hackathon (repo vs pitch name).
3. **Platform one-liner:** Approved phrase (e.g. planner prototype, rehearsal tool, planning aid).
4. **Operator framing:** Default “operator” in one word (squad, platoon, planner, GCS role).
5. **Synthetic disclaimer:** Exact wording and placement (VO, on-screen, or both).

### Problem / context (~12–18 s)

6. **Pain you own:** Single lead—branching + rehearsal, terrain-aware ISR, human-in-the-loop decisions, or operational picture; others subordinate.
7. **Friendly force story:** Route security / scout-ahead ISR vs any PRD wording that could sound kinetic—align for VO.
8. **Decision event:** Target-ID / unknown observation on route—in the 60s cut, judges-only, or dropped?
9. **Jargon budget:** Which terms get plain-English gloss on first use (Primary/Alternate, decision point, Decision Target Zone, PPS, rehearsal, audit log)?

### Solution (~14–22 s)

10. **Plan vs Run labels:** Exact phrases matching on-screen UI.
11. **Cue language:** One approved description (simulated intent cue, launch-package simulation, etc.); name IR/PEQ-15 in VO or not.
12. **PPS semantics for pitch:** One-breath mapping VO must match legend (hold / RTB / Primary / Alternate vs legacy Route A/B).
13. **“Validation” in VO:** One truthful example for the recorded build (battery/range, topology, ruleset, ready-to-run).
14. **Integrity line:** Owner-approved wording for “same app as live demo; saved mission + cuts.”

### Demo block (~22–38 s)

15. **Recording surface:** Which app/shell appears (e.g. Vite/Cesium vs rebuild-planner vs both).
16. **Fixture vs live authoring:** Preloaded only, or include a short live edit—what is actually recorded?
17. **AOI name:** Place/coordinates label for VO (“synthetic training area based on …”).
18. **Terrain story:** What the viewer should notice (ridge, road, no-go, towers)—agreed list for this mission.
19. **“Wow” beat order:** Queue, branch preview, PPS, audit, timeline—priority for 60s (only 2–3 can be loud).
20. **Primary branch moment:** UI click vs simulated PPS vs both—canonical for the video.
21. **Export / partner beat:** What VO may claim (Palantir/Foundry, bundle export, integration path)—visible or demoable only.

### Close (~4–8 s)

22. **Closing CTA:** One of—judge can edit live, repo/openness, follow-on prototype, contact.
23. **Future potential:** One approved impact sentence without doctrine/fielding overclaim.

### Palantir, data, packaging

24. **Palantir access truth:** What can be said during the event (Foundry read-only, offline bundle, Map, nothing live).
25. **Minimum judge “win”:** If CSV/GeoJSON alone is weak, what is the honest line—and does VO tease it?
26. **Ontology / custom objects:** Claim custom mission objects in Palantir, or stay on shared model / export path?
27. **Export priority:** First artifact if VO mentions one (GeoJSON, CSV, JSON state machine, briefing, Palantir bundle).

### Scope and safety

28. **ISR guardrails:** VO must never imply strike, weaponized FPV, live aircraft control, or real cue hardware—confirm.
29. **Unknown / ambiguous cue:** One-sentence product posture if asked; VO hedge if needed (e.g. invalid cue → no auto transition, logged).
30. **Mandatory objective types:** Any objective type required in the demo mission beyond the baseline vocabulary?

### Logistics

31. **Music / VO mix:** Narrator-only vs captions vs hybrid—drives word count.
32. **Legal / sponsor:** Required acknowledgments (Palantir, Army xTech, others) on end card or in VO?

**Shortcut:** Answering items **6–8, 15–17, 19–21, 24–25, 28** is enough to draft a credible first VO pass; fill the rest before record.

---

## Judging alignment

Projects are evaluated on four criteria ([National Security Hackathon rules — Devpost](https://natsechack.devpost.com/rules)). Map each spoken or visual beat to them so nothing important is orphaned when you trim.

| Criterion | What to land in ~60 seconds |
| --- | --- |
| **Future potential** | Repeatable artifact: carried plan, rehearsal, audit trail, partner path—not a one-off stunt. |
| **Technical implementation** | Real UI: Plan → validation → Run moment; visible recompute or timeline/log as proof. |
| **Creativity / uniqueness** | One crisp differentiator (e.g. operator queue as mission outline + branch rehearsal under simulated cues). |
| **Pitching quality** | Tight arc: who / pain / fix / proof; minimal jargon. |

---

## Outline (modular blocks, target total 55–62 s VO)

### A. Introduction (~6–10 s)

- Optional: team names/roles; primary anchor is domain (ISR route planning before launch).
- One-line thesis: scout-ahead route as a carried plan with explicit branches and a rehearsable execution trace.
- Guardrail: synthetic scenario; recon/ISR posture only (no live aircraft, no kinetic workflows in pitch).

### B. Context / problem (~12–18 s)

- Durable mission intent: waypoints, segment logic, Primary/Alternate as designed.
- Terrain and constraints matter for planning, not for demo theater.
- Gap the product addresses: branching intent in a replayable outline operators can rehearse against simulated intent signals without rewriting the mission from scratch.

### C. Solution (~14–22 s)

- Plan mode: launch + ordered waypoints/segments; queue as operator-facing state outline.
- Run / rehearsal: progression along route, decision zones, simulated PPS-style mapping (e.g. Primary branch) where product supports it—same validation path as UI-driven choices.
- Integrity: preloaded mission and jump cuts are acceptable; the recording uses the same app workflow the team ships, not a parallel demo build.

### D. Demo (~22–38 s)

Treat as a menu; pick 6–9 shots that fit the cut.

1. AOI / terrain context (one establishing glance).
2. Plan: waypoint queue + one rich node (scout, decision, or similar).
3. Validation or warnings once (credible limits).
4. Run: approach to decision zone or cue moment.
5. Trigger Primary branch (or equivalent) via simulated cue or UI—same path.
6. Evidence: preview on map, rationale, audit line or timeline tick.
7. Optional close: export or partner mention only if demonstrably true.

### E. Close (~4–8 s)

- Either: “Same planner a judge can edit live—this is time-compressed.”
- Or: honest next step (e.g. deeper partner integration on a shared mission model without changing core workflow).

---

## Timing cheat sheet

| Block | Rough share of 60 s | Trim first |
| --- | --- | --- |
| Intro | ~12–15% | Proper names |
| Problem | ~22–28% | Second problem sentence |
| Solution | ~25–33% | Partner one-liner |
| Demo | ~40–52% | Extra map glamour |

---

## Roundtable / judge readiness (internal)

Brief answers for live Q&A; do not cram into VO unless unavoidable.

| Risk topic | Stable answer posture |
| --- | --- |
| Authenticity of cues | Simulation for rehearsal and audit design; selects among preplanned branches after zone/decision validation—not IFF or operational C2 protocol. |
| Editing during run | Topology/geometry locked in Run; return to Plan to edit; authored mission survives leaving Run (sim/rehearsal state discarded). |
| Demo vs product | Fixture + jumps for time; acceptance path is interactive same-build workflow. |
| Scope | Synthetic actors; ISR/recon planning only. |
| Partner stack | State what is actually integrated vs planned; avoid implying live Palantir or ontology work that is not shown. |

---

## Next steps (out of scope for this file)

- Word-level script and exact timings.
- Shot list, captions, and music.
- Separate expected Q&A document.
