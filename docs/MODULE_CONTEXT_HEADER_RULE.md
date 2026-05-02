# Module Context Header Rule

Covered modules must begin with a structured context header.
The header keeps local intent, evidence, and maintenance rules close to the implementation while avoiding duplicated project history.

## Required Sections
- `Purpose:`
- `Why This Exists:`
- `Primary Inputs/Outputs:`
- `Research / Source Links:`
- `Validated:`
- `Current Limits / TODO:`
- `Agent Maintenance Rule:`

## Rule
- If a covered module changes in any way, update its context header in the same change.
- If a review finding materially affects a covered module, update the header when the finding is addressed.
- Keep the header local to the module. Link to `docs/PROJECT_CONTEXT.md` and focused research notes for broader history.
- Do not place secrets, local machine paths, or generated artifact paths in headers.

## Covered Module Registry
Create a project-specific registry when code exists. The registry should list:
- covered module path
- owner or subsystem
- reason it needs a header
- latest reviewed date
- validation status

Start with:
```text
[module_path] | [subsystem] | [reason] | [YYYY-MM-DD] | [validated/provisional/todo]
```
