# Validation Status Vocabulary

Use these labels consistently in docs, registries, manifests, review packages, and code comments.

## `validated`
Use `validated` when a claim, stage, source, or artifact is backed by enough local evidence to rely on it for current project decisions.

Accepted evidence can include:
- passing tests
- local fixtures
- cited sources
- benchmark reproduction
- live runtime evidence
- reviewed artifact manifests
- explicit human approval

## `provisional`
Use `provisional` when something is implemented and useful, but should not yet be treated as final truth.

Common reasons:
- missing calibration
- missing source evidence
- limited test coverage
- narrow runtime coverage
- known edge cases
- warning-first behavior

## `todo`
Use `todo` for a known gap, placeholder, deferred slice, or intentionally incomplete work.

Rules:
- Do not hide `todo` status in prose.
- Put the follow-up location in the relevant doc or registry.
- Avoid truth-facing claims that depend on `todo` evidence.

## Promotion Rule
Promote `todo` to `provisional`, or `provisional` to `validated`, only when the supporting evidence is added in the same change or already exists in a referenced source-of-truth doc.
