---
name: executing-plans
description: Use when an approved implementation plan, normally under .tmp/plans/, is ready to execute task-by-task with verification and blocker checkpoints.
license: MIT; see LICENSE
metadata:
  source: https://github.com/obra/superpowers
  upstream-version: "6.3.0"
---

# Executing Plans

## Overview

Load an approved temporary plan, review it against the current code and applicable ADRs, execute it task-by-task, and verify the finished behavior. The plan guides the work; current code, tests, user decisions, and accepted ADRs take precedence when reality has changed.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## Step 1 — Locate and review the plan

1. Use the plan path supplied by the user. Otherwise, inspect `.tmp/plans/` and use the only plan present.
2. If multiple plans are present and the intended one is not clear, ask the user which to execute.
3. Read the linked temporary spec and every applicable file in `docs/adr/`.
4. Inspect the current Git status and relevant code before editing. Preserve unrelated user changes.
5. Review the plan critically for stale paths, missing prerequisites, unsafe operations, conflicts with code, tests, project instructions, or ADRs.
6. If the plan needs a material design change, stop and ask the user. For a harmless stale detail, use the current repository reality and note the adjustment in the plan.

Use the repository's existing branch or worktree. Do not create a worktree or switch branches unless the user or project requires it. Never discard, reset, overwrite, or commit user work without explicit approval.

## Step 2 — Execute tasks

For each task in order:

1. Mark the task in progress in the temporary plan when practical.
2. Re-read the files the task touches; do not rely only on the plan's snapshot.
3. Check the task's declared test strategy. Use the test-driven-development skill for `TDD: Required` tasks. For `TDD: Not applicable`, run the stated non-test verification without inventing a ceremonial test. If the classification is clearly wrong, correct it in the temporary plan before implementing.
4. Implement the smallest change that satisfies the approved behavior and applicable ADRs.
5. Run the task's focused verification.
6. Fix failures caused by the task before moving on.
7. Mark the task complete and record any necessary deviation briefly in the plan.

Do not mechanically follow a stale instruction when it conflicts with current code. Do not expand scope, create speculative abstractions, or perform unrelated refactoring. Do not create per-task commits unless the user asks.

## Step 3 — Final verification

After all tasks are complete:

1. Run the repository's relevant full check in addition to focused checks.
2. Review the final diff and Git status for accidental, generated, secret, or unrelated files.
3. Confirm the implementation still satisfies the approved spec and applicable ADRs.
4. If implementation changed a durable decision, stop: update or supersede the ADR with user approval before declaring completion.
5. Use the code-reviewer skill when available for a read-only review of the completed change. Fix validated Critical and Important findings, then repeat affected checks and review the corrected diff.
6. Report what changed, review findings, verification results, and any remaining limitations.

Do not commit, push, merge, delete branches, or remove worktrees unless the user explicitly asks. The temporary plan may be deleted after successful implementation; code, tests, and ADRs remain the durable record.

## Stop conditions

Stop and ask rather than guessing when:

- the plan or intended target is ambiguous
- an accepted ADR conflicts with the plan
- a required dependency, credential, service, or environment is unavailable
- a verification repeatedly fails for reasons not understood
- proceeding would require data loss, destructive Git operations, schema migration, deployment, or other unapproved risk
- the required fix materially changes the approved design or scope

A routine implementation detail that is already implied by the approved behavior is not a reason to stop.

## Definition of done

- [ ] Every planned task is complete or explicitly deferred by the user
- [ ] Focused checks pass
- [ ] Relevant repository-wide checks pass
- [ ] Final diff contains no accidental or unrelated changes
- [ ] Code and tests implement the approved behavior
- [ ] Applicable ADRs remain accurate
- [ ] Completed changes received an appropriate code review
- [ ] No validated Critical or Important findings remain unless explicitly deferred by the user
- [ ] No commit, push, merge, or destructive cleanup occurred without approval
