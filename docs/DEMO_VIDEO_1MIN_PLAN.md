# One-minute demo video plan (outline)

Flexible structure for a ~60-second recording aligned with judging criteria and hackathon MVP scope. Detailed beats, VO script, and shot list come later—this doc is the reference skeleton only.

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

## Full roundtable pack for VO (master script)

**Read rate:** Aim for roughly **125–145 spoken words** in **~55–60 s** (~2.1–2.6 words/sec). Rehearse with a timer; trim using *Alternate trims* below.

### Master VO (timed blocks)

| Block | Target | Narration |
| --- | --- | --- |
| **A — Intro + guardrail** | ~8 s | “**Synthetic training scenario.** We’re demoing scout-ahead **ISR route security**: plan the route before launch, not live aircraft.” |
| **B — Problem** | ~12 s | “**Primary** and **Alternate** branches usually live in briefings—we need them **designed into the mission** with validation and a **rehearsable trace**, not pasted-on slides.” |
| **C — Solution (Plan)** | ~12 s | “**Plan mode** builds an ordered **waypoint queue** and **segment** logic—the operator-facing **state outline**. Terrain and stubs like **distance and battery warnings** track edits; default route altitude in product is **one-twenty metres A-G-L**—a planning assumption, not certified clearance.” |
| **D — Solution (Run)** | ~10 s | “**Run** is **rehearsal on the same build**: exiting drops **sim state only**, not the authored plan. Topology is **locked in Run**—you **return to Plan** to change geometry.” |
| **E — Cue discipline** | ~8 s | “**Simulated** cue or UI click—**same gate**. Pulses pick among **hold, return-to-base, Primary, Alternate** already in the mission—**intent for rehearsal**, not IFF or battlefield command.” |
| **F — Demo** | ~28 s | “We load a **saved scout-ahead** mission—establish **terrain**—here’s our **queued waypoints**. Jump ahead: **decision zone** — we’re reviewing an **ambiguous contact along the route**. Fire **four P-P-S**: that selects our **Primary** branch. You see **zone**, **route preview**, **rationale**, **warnings**, and an **audit** or timeline tick—we’re illustrating **scout-ahead** continuity, not an ambush playbook.” |
| **G — Close** | ~5 s | “This is the **same app** judges can drive **interactively**—we only **jump cut** time. Next: harder **partner** handoff once access lands.” |

**Continuous read-through (paste-friendly):**

> Synthetic training scenario—we’re demoing scout-ahead ISR route security; plan before launch, not live aircraft.
>
> Primary and Alternate usually live in briefings—we need them designed into the mission with validation and a rehearsable trace.
>
> Plan mode is an ordered waypoint queue and segment logic—the operator state outline—with distance and battery warnings tracking edits. Default altitude is one-twenty metres AGL—planning only, not certified clearance.
>
> Run is rehearsal on the same build: sim state resets when you leave Run; authored mission persists. Topology is locked in Run—you return to Plan to edit geometry.
>
> Simulated cue or UI—same gate. Pulses choose among hold, return-to-base, Primary, Alternate already authored—intent for rehearsal, not IFF or battlefield C2.
>
> Load a saved scout mission, show terrain and the waypoint queue—jump to a decision zone—we’re sizing up an ambiguous contact—four PPS selects Primary—zone, preview, rationale, warnings, audit. Scout-ahead route security—all synthetic data.
>
> Same app judges can fly interactively; we only jumped time.

### Alternate trims (if long)

Drop in this order:

1. Full **D** sentence about edit lock → shorten to “**Run is rehearsal; Plan holds the editable mission.**”
2. **E** second sentence (“not IFF…”) → one word: “**simulation.**”
3. **F** phrase “scout-ahead continuity, not an ambush playbook” → cut
4. **C** battery/distance clause → leave only “warnings track edits”
5. **G** partner line → cut

---

## Beat sheet for picture lock (tie VO to visuals)

Aligned to roundtable *One-Minute Video Path*; same app and fixture; jump cuts allowed.

| # | Seconds (guide) | On screen | Narration hinge |
| --- | --- | --- | --- |
| 1 | 0–3 | Title card or synthetic AOI label | “Synthetic training…” |
| 2 | 3–8 | Brief map terrain (ridge / road / no-go optional) | “Scout-ahead ISR…” |
| 3 | 8–14 | Waypoint queue + launch | “Waypoint queue…” |
| 4 | 14–22 | One waypoint or segment config / validation strip | “Primary and Alternate…” / “warnings” |
| 5 | 22–30 | Mode to Run / timeline cue | “Rehearsal on the same build” |
| 6 | 30–38 | Aircraft or playhead approaching **Decision Target Zone** | “Decision zone” |
| 7 | 38–46 | Observation / TID language (minimal if tight) | “Ambiguous contact” |
| 8 | 46–52 | Simulate **four P-P-S**; command preview resolves to **Primary** | “Four PPS—Primary branch” |
| 9 | 52–56 | Highlight zone + preview trace + log line | “Preview… audit” |
| 10 | 56–60 | Optional continued transit or hold on outline | “Same app… jump cut” |

---

## Roundtable fidelity checklist (do not contradict on VO)

These are authoritative product postures captured in roundtable docs; VO should either land them explicitly or avoid implying the opposite.

| Topic | VO line / guardrail |
| --- | --- |
| **Derivative demo** | Same UI and workflow as shipped interactive path; preload + jumps only compress time—not a forked demo build. |
| **Plan vs Run** | Plan authors branches **as designed** (Primary / Alternate attached to waypoint or segment); Run selects among those after **Decision Target Zone** validation. |
| **PPS** | **Simulation input** selecting among preplanned options; **canonical mapping:** `1` hold—`2` RTB—`4` Primary—`8` Alternate **(video uses “four PPS”)**. |
| **Not claiming** | Not IFF; not operational C2 protocol; not designing branches *from* cues mid-video. |
| **Scenario** | **Route-security / scout-ahead** ISR; synthetic actors; **ambiguous contact / TID on route** as decision pivot—not L-shaped ambush execution framing. |
| **Platform** | X10D ISR / recon scope; **no** strike, kinetic, live GCS, real drone. |
| **Mission durability** | Exiting Run: discard rehearsal/sim clock/preview position only; **do not** say the plan snaps back—**authored mission stays**. |
| **Edit rule** | “Change waypoints **in Plan**”—hard lock during Run unless you consciously show return-to-plan (usually skip in 60s). |
| **Altitude** | Say **planning altitude** **120 m AGL** if altitude appears; caveat **planning assumption** if terrain clearance is visible. |
| **Unknown observation** | One line max in VO if time; fuller unknown** in live judge slot per open question. |
| **Palantir / partner** | Mention only **if demonstrated**—otherwise closing “partner handoff” as **future**. |
| **Validation** | If shown: incompleteness blocks Run starts in product—voice may skip unless you flash a validator. |

---

## Optional jargon card (producer)

- **Primary / Alternate** — preplanned route branches, operator-facing labels (not “Route A/B” in narration).
- **Decision Target Zone** — spatial gate where cues apply; invalid/out-of-zone rejects with logged reason (do not verbalize rejection path in VO unless showing it).
- **Launch Package Simulation** — label for rehearsal cue set; VO can say **“simulated pulses”** or **“four PPS”**.
- **SC2-style queue** — internal wow-label; VO can say **“ordered mission queue.”**

---

## Next steps

- Shot list per beat, captions, bumper, music.
- Dry run with timer; shave alts until **≤ 60 s** with slate.
- Separate expected judge Q&A document.
