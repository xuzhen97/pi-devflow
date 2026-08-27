---
name: executing-plans
description: Use when the user asks to execute a temporary implementation Plan; review it read-only, summarize current scope and risk, and obtain final explicit confirmation before modifying implementation files.
license: MIT; see LICENSE
metadata:
  source: https://github.com/obra/superpowers
  upstream-version: "6.3.0"
---

# Executing Plans

## Overview

Load a temporary Plan, review it against current code and applicable ADRs, obtain a fresh execution confirmation, then execute it task-by-task and verify the finished behavior. The Plan guides the work; current code, tests, user decisions, and accepted ADRs take precedence when reality has changed.

<EXECUTION-GATE>
Invocation is not execution authorization. Before the user confirms at the gate in Step 2, all repository access must remain read-only: do not update the Plan, tests, code, configuration, documentation, generated artifacts, or ADRs.

Prior approval of a design, Spec, ADR, Plan, or a writing-plans handoff does not count. Even if the user originally requested "plan and implement," present the current reviewed scope and ask again immediately before editing. Only an unambiguous response to that execution question authorizes changes.
</EXECUTION-GATE>

**Announce at start:** `I'm using the executing-plans skill to review this Plan. I will ask for final confirmation before modifying files.`

## Step 1 — Locate and review the plan

1. Use the plan path supplied by the user. Otherwise, inspect `.tmp/plans/` and use the only plan present.
2. If multiple plans are present and the intended one is not clear, ask the user which to execute.
3. Read the linked temporary spec and every applicable file in `docs/adr/`.
4. Inspect the current Git status and relevant code without editing. Preserve unrelated user changes.
5. Review the Plan critically for stale paths, missing prerequisites, unsafe operations, conflicts with code, tests, project instructions, or ADRs.
6. Do not fix even harmless Plan details yet; include them in the execution summary. If a material design change is needed, return to design review instead of asking to execute stale scope.

Use the repository's existing branch or worktree. Do not create a worktree or switch branches unless the user or project requires it. Never discard, reset, overwrite, or commit user work without explicit approval.

## Step 2 — Obtain final execution confirmation

After the read-only review, report:

- exact Plan path
- number of tasks and affected components/files
- TDD versus verification-only tasks
- detected stale details, unrelated working-tree changes, and notable risks
- any separately gated operations explicitly excluded from execution, such as commit, push, migration, deployment, or ADR edits

Then ask as the final line:

> `Begin executing the reviewed Plan at <path>? (execute / not now)`

STOP and wait. Do not call edit/write tools or run commands that mutate the repository in the same turn. If the response is unclear, ask again. If declined, do nothing.

Once confirmed, authorization covers only the summarized Plan scope. A material scope or design change invalidates it: stop, explain the change, update the design/Plan only with the relevant confirmation, then request execution confirmation again.

## Step 3 — Execute tasks

For each task in order:

1. Mark the task in progress in the temporary plan when practical.
2. Re-read the files the task touches; do not rely only on the plan's snapshot.
3. Check the task's declared test strategy. Use the test-driven-development skill for `TDD: Required` tasks. For `TDD: Not applicable`, run the stated non-test verification without inventing a ceremonial test. If the classification is clearly wrong, correct it in the temporary plan before implementing.
4. Implement the smallest change that satisfies the approved behavior and applicable ADRs.
5. Run the task's focused verification.
6. Fix failures caused by the task before moving on.
7. Mark the task complete and record any necessary deviation briefly in the plan.

Do not mechanically follow a stale instruction when it conflicts with current code. Do not expand scope, create speculative abstractions, or perform unrelated refactoring. Do not create per-task commits unless the user asks.

## Step 4 — Final verification

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
- proceeding would require data loss, destructive Git operations, schema migration, deployment, ADR creation/update, or other separately gated risk
- the required fix materially changes the approved design or confirmed execution scope

A routine implementation detail already implied by the confirmed behavior is not a reason to stop. Commit, push, merge, deployment, destructive cleanup, and ADR changes always require their own explicit approval.

## Definition of done

- [ ] Final execution confirmation was obtained after the read-only Plan review
- [ ] Every planned task is complete or explicitly deferred by the user
- [ ] Focused checks pass
- [ ] Relevant repository-wide checks pass
- [ ] Final diff contains no accidental or unrelated changes
- [ ] Code and tests implement the approved behavior
- [ ] Applicable ADRs remain accurate
- [ ] Completed changes received an appropriate code review
- [ ] No validated Critical or Important findings remain unless explicitly deferred by the user
- [ ] No commit, push, merge, or destructive cleanup occurred without approval
