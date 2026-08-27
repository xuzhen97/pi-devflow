---
name: systematic-debugging
description: Use for bugs, failing tests, build or integration failures, performance regressions, flaky behavior, and other unexpected technical behavior before proposing a fix.
license: MIT; see LICENSE
metadata:
  source: https://github.com/obra/superpowers
  upstream-version: "6.3.0"
---

# Systematic Debugging

## Principle

Find and verify the root cause before changing production behavior. A simple issue may take minutes; the evidence requirement scales with uncertainty, but it never disappears.

```text
reproduce → trace → hypothesize → test → fix once → verify
```

Do not stack speculative fixes. Fix the shared source of the fault rather than adding guards to every visible symptom.

## Phase 1 — Establish the failure

1. Read the complete error, stack trace, exit code, logs, and failing assertion.
2. Record exact reproduction steps, expected behavior, actual behavior, and environment.
3. Reproduce with the narrowest reliable command.
4. Inspect relevant project instructions, accepted ADRs, Git status, recent diffs, dependency/config changes, and sibling working paths.
5. Identify whether the issue is deterministic, intermittent, environment-specific, or currently unreproducible.

If it cannot be reproduced, gather evidence or improve observability. Do not guess a fix and call the absence of failure success.

Preserve unrelated working-tree changes. Never reset, clean, checkout, or overwrite user work during diagnosis.

## Phase 2 — Trace the root cause

Trace backward from the observed failure:

1. Which operation produced the bad result?
2. Which inputs and state reached it?
3. Which caller supplied them?
4. Where was the first incorrect value, transition, assumption, or side effect introduced?
5. Which callers share that source?

Use available code-intelligence tools, callers/callees, references, logs, debugger output, tests, and source inspection. Read every caller of the function you intend to change. See [references/root-cause-tracing.md](references/root-cause-tracing.md) for deep call chains.

For multi-component flows, inspect each boundary—request, process, queue, service, database, or external system—and compare input with output. Add the smallest temporary instrumentation needed to locate the failing boundary.

Diagnostic output must not expose credentials, tokens, private keys, personal data, or full sensitive payloads. Log presence, type, length, IDs, hashes, or redacted values instead. Remove temporary instrumentation after diagnosis unless it provides lasting operational value.

## Phase 3 — Form and test one hypothesis

State one falsifiable hypothesis:

> I think **X** is the root cause because **Y evidence**; if true, **Z observation** will occur.

Then test the hypothesis with one minimal probe. Change one variable at a time. Prefer read-only inspection or a test harness over changing production code.

- Confirmed: proceed to implementation.
- Disproved: record the evidence briefly and form a new hypothesis.
- Unclear: gather better evidence; do not layer another speculative change on top.

After three failed fix attempts, stop and reassess the architecture with the user. Repeated failures across different components usually mean the model of the system is wrong, not that a fourth patch is needed.

## Phase 4 — Implement the root-cause fix

1. Create the smallest automated regression test that fails for the reproduced cause, using the `test-driven-development` skill when available.
   - Use the existing test framework when present.
   - Otherwise leave one runnable self-check or reproduction script.
   - If automation is impossible, state why and define exact manual verification.
2. Implement one focused fix at the earliest shared point that owns the invariant.
3. Add boundary validation only where it blocks malformed or unsafe data at a meaningful trust boundary. Do not scatter redundant checks mechanically; see [references/defense-in-depth.md](references/defense-in-depth.md).
4. Avoid unrelated refactoring, speculative abstractions, and cleanup.
5. If the fix changes an accepted architectural decision, stop and obtain user approval before updating or superseding the ADR.

For timing and flaky tests, wait for observable conditions instead of arbitrary sleeps unless elapsed time is itself the behavior under test. See [references/condition-based-waiting.md](references/condition-based-waiting.md).

## Phase 5 — Verify

Run, in order:

1. the original reproduction
2. the new regression test
3. focused tests for the changed component
4. the relevant repository-wide check
5. a final diff and Git-status review

Confirm both:

- the original failure no longer occurs for the understood reason
- the fix did not merely hide the symptom or weaken the assertion

Use the `code-reviewer` skill when available for non-trivial fixes. Fix validated Critical and Important findings, then repeat affected checks.

Do not claim success from a single passing run for an intermittent issue. Run enough repetitions or stress to distinguish the fix from chance, and state the sample size.

## External or environmental causes

If evidence shows the cause is outside the repository:

1. identify the failing external assumption or boundary
2. add only appropriate handling—clear error, timeout, bounded retry, fallback, or monitoring
3. test that handling
4. report what remains outside the application's control

A retry is not a substitute for understanding a deterministic failure.

## Stop conditions

Stop and ask the user when:

- reproduction requires destructive production action or sensitive access
- evidence conflicts with an accepted ADR or approved behavior
- the fix materially changes scope, public interfaces, data, security, or deployment
- required credentials, environment, or service access is unavailable
- three fix attempts have failed
- proceeding would risk data loss or unrelated user changes

## Definition of done

- [ ] The failure is reproducible or the evidence limitation is explicit
- [ ] The root cause is supported by observed evidence
- [ ] A regression check fails before and passes after the fix, when feasible
- [ ] The fix is at the correct shared source, not only the symptom
- [ ] Focused and relevant repository-wide checks pass
- [ ] Temporary instrumentation and sensitive output are removed
- [ ] Applicable ADRs remain accurate
- [ ] Non-trivial fixes received code review
- [ ] No commit, push, destructive Git action, migration, or deployment occurred without approval
