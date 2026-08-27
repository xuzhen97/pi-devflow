---
name: writing-plans
description: Use after the user explicitly confirms generation of a temporary implementation Plan; write and review the Plan without modifying implementation files, then ask separately whether to execute it.
license: MIT; see LICENSE
metadata:
  source: https://github.com/obra/superpowers
  upstream-version: "6.3.0"
---

# Writing Plans

## Overview

Write concrete implementation plans for an engineer with little context: which files to touch, the required behavior, interfaces, test strategy, and verification commands. Keep tasks independently verifiable and include code only where it removes real ambiguity. DRY. YAGNI. Decide TDD per task instead of forcing it globally.

The Plan is temporary execution scaffolding, not permanent documentation. The implemented code and tests are authoritative; lasting architectural decisions belong in `docs/adr/`.

<PLAN-GATE>
Writing a Plan and executing it are separate actions.

- Before creating the Plan, verify that the user explicitly confirmed Plan generation in the current workflow. If not, ask `Generate a temporary implementation Plan for this approved design? (generate / not now)` and STOP.
- While planning, implementation files are read-only. You may inspect code and write only the confirmed Plan under `.tmp/plans/`.
- After saving and reviewing the Plan, summarize it, ask whether to execute that exact Plan, and STOP.
- Never invoke `executing-plans`, edit implementation files, or start Task 1 in the same turn as Plan creation or the execution question.
- Design, Spec, ADR, or Plan approval does not authorize execution. A broad earlier request to "plan and implement" does not bypass the execution gate.
</PLAN-GATE>

**Announce at start:** `I'm using the writing-plans skill to create the implementation Plan only; implementation requires separate confirmation.`

**Context:** Use the repository's normal branch or worktree workflow. Do not create an isolated worktree unless the user or project requires one.

**Save plans to:** `.tmp/plans/YYYY-MM-DD-<feature-name>.md`
- Create `.tmp/plans/` when needed.
- Treat the plan as disposable and do not commit it.
- User preferences for plan location override this default.

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## Durable Decisions

Before planning, read applicable files in `docs/adr/`. Accepted ADRs are constraints, not suggestions. If the approved spec conflicts with an ADR, stop and resolve the decision with the user; update or supersede the ADR before implementation. Do not copy temporary spec or plan details into ADRs.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with an
independently testable deliverable.

## Per-Task Test Strategy

Classify every task before writing its steps:

- **TDD: Required** — the task changes observable behavior with meaningful regression risk: business logic, branches, parsing, state, APIs, persistence, security, concurrency, money, or a bug fix.
- **TDD: Not applicable** — the task is human prose, declarative metadata without custom logic, generated/vendor output, formatting, a mechanical rename/move, or another change with no meaningful red/green behavior cycle.

Do not use "Not applicable" merely because testing is inconvenient. State one sentence explaining the classification. Configuration that controls custom runtime behavior is behavioral and normally requires a test.

For TDD tasks, use bite-sized Red/Green steps:

1. Write one failing behavior test.
2. Run it and confirm the expected failure.
3. Implement the minimum change.
4. Run the new and focused tests.
5. Refactor only if useful while green.

For non-TDD tasks, omit fake test steps and specify the smallest relevant verification: type/schema check, build, lint, reference search, authoritative generator check, or explicit inspection.

Do not add per-task commit steps unless the user explicitly asks for that workflow.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **Execution gate:** This Plan is not authorization to modify implementation files. After read-only review, `executing-plans` must obtain explicit user confirmation before Task 1.
>
> Steps use checkbox (`- [ ]`) syntax for temporary progress tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Spec:** [path under `.tmp/specs/` to the approved temporary spec — executors read it while the task is active]

**ADRs:** [applicable durable decisions under `docs/adr/`, or `None`]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

## Test Strategy

[Summarize which tasks require TDD and which use verification-only. The per-task classification remains authoritative.]

---
```

## Task Structure

Every task starts with the shared metadata below, followed by exactly one of the two step templates.

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py` (TDD tasks only)

**Interfaces:**
- Consumes: [exact signatures or `None`]
- Produces: [exact signatures or `None`]

**Test strategy:** TDD: Required | TDD: Not applicable
**Reason:** [One sentence naming the behavioral risk, or why no meaningful red/green cycle exists]
````

### TDD task steps

````markdown
- [ ] **Step 1: Write the failing behavior test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Verify RED**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL because [missing/incorrect behavior]

- [ ] **Step 3: Implement the minimum behavior**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Verify GREEN**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Run focused verification**

Run: `pytest tests/path/test.py -v`
Expected: PASS
````

### Verification-only task steps

````markdown
- [ ] **Step 1: Make the exact non-behavioral change**

[Concrete edit or command; no placeholder test.]

- [ ] **Step 2: Run the appropriate verification**

Run: `[exact type/schema/build/lint/reference/generator command]`
Expected: [specific successful result]

- [ ] **Step 3: Inspect the resulting diff or artifact**

Confirm: [specific properties that prove the task is complete]
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. Test-strategy calibration:** Does every behavioral task with realistic regression risk use TDD? Are non-TDD tasks genuinely non-behavioral, with a concrete alternative verification instead of a ceremonial test?

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Confirmation Handoff

After saving and self-reviewing the Plan:

1. Report its exact path.
2. Summarize task count, affected areas, test strategy, and notable risks in a few lines.
3. Ask this as the final line:

> `Execute the reviewed Plan at .tmp/plans/<filename>.md? (execute / not now)`

4. STOP and wait. Do not invoke `executing-plans` in that turn.

If confirmed, invoke `executing-plans`; that workflow performs its own read-only freshness review and asks for final execution confirmation before any implementation edit. This deliberate second confirmation ensures the user sees current scope and risk immediately before changes begin.

If declined or unclear, leave the Plan in place and do nothing. After separately confirmed implementation and verification, it may be deleted. Never promote the Plan into permanent documentation—update code, tests, and any separately approved ADR instead.
