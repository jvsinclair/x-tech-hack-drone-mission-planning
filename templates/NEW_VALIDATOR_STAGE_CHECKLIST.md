# New Validator Stage Checklist

Use this checklist before adding `[VALIDATOR_STAGE]` to `[PROJECT_NAME]`.

## Definition
- [ ] Stage has a stable ID.
- [ ] Stage has a clear purpose and category.
- [ ] Inputs and outputs are typed or documented.
- [ ] Hard failures and soft warnings are separated.
- [ ] Evidence references are returned or recorded.
- [ ] Status values use the project vocabulary.

## Governance
- [ ] Any formula, threshold, scoring rule, heuristic, or constant is registered first.
- [ ] The tool interface catalog is updated.
- [ ] Source registry entries are added for new evidence.
- [ ] Human-readable docs and machine-readable registries agree.

## Implementation Readiness
- [ ] Stage can be skipped or degraded intentionally when dependencies are missing.
- [ ] Runtime side effects are isolated from pure validation logic.
- [ ] Generated artifacts have predictable names and locations.
- [ ] Secrets and local machine paths are not written to artifacts.

## Review
- [ ] Unit or fixture tests cover representative pass and fail cases.
- [ ] Project context is updated if this stage changes the critical path.
- [ ] Handoff or research note is updated if the stage changes design assumptions.
