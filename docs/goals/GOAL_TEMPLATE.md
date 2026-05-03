---
goal_id: "0000"
title: "Replace With Goal Title"
status: "template"
created_at: "YYYY-MM-DDTHH:MM:SSZ"
started_at: null
completed_at: null
owner: "codex-cli"
commit_sha: null
---

# Goal
Describe the single concrete deliverable.

## Read First
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
4. Add task-specific docs here.

## Scope
Do:
- List required changes.

Do not:
- List explicit exclusions.

## Implementation Requirements
- Make the requirements decision-complete.
- Include paths, data shapes, command names, and expected behavior where needed.

## Verification
Run:
- `git diff --check`
- Add task-specific commands.

Expected:
- Describe what passing looks like.

## Completion Instructions
- Commit with message: `Replace with commit message`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked, set `status: "blocked"` and add blocker notes below.

## Final Report Requirements
Return:
- changed files
- verification results
- commit SHA
- blockers or follow-up questions

## Blocker Notes
- None yet.
