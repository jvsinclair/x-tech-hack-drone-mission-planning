# Formula Registry Policy

This policy covers formulas, thresholds, scoring rules, ranking logic, heuristics, constants, and other decision logic used by `x-tech-hackathon`.

1. Every formula, threshold, scoring rule, or heuristic used by the validation pipeline must have an entry in `docs/research/formula_registry.template.json` or the project-specific registry that replaces it.
2. New validator code must reference registry-backed rule IDs through module-level implemented-rule lists so tests can enforce coverage.
3. If a rule is discovered in older code and its source is known, add that source to the registry entry before reusing the rule in new validator code.
4. If a rule is discovered in older code and its source is not yet pinned, keep it in the registry anyway and add `TODO(validate+cite)` in both:
   1. the registry entry notes
   2. the legacy code comment near the runtime rule
5. Do not add new hard-coded decision logic directly into validator modules without first adding the registry entry.
6. Legacy scripts outside the validator path should be backfilled over time, but any legacy runtime rule touched during active work must be registered immediately.
7. The long-term project rule is broader than the first validator slice: decision logic should converge into registries rather than remaining scattered across runtime files.

## Minimum Registry Fields
- `id`: Stable machine-readable identifier.
- `kind`: `formula`, `threshold`, `scoring_rule`, `heuristic`, or `constant`.
- `expression`: Human-readable equation, rule, or condition.
- `variables`: Input variable names and meanings.
- `units`: Units or enum domains for inputs and outputs.
- `source_ref`: Citation, local research note, benchmark, or `TODO(validate+cite)`.
- `applicability`: Where the rule may be used.
- `confidence`: `high`, `medium`, `low`, or `unknown`.
- `chosen_for`: Why this rule is currently selected.
- `rejected_for`: Where this rule must not be used.
- `notes`: Review notes, limits, or follow-up needs.
- `status`: `active`, `deprecated`, `rejected`, or `todo`.
