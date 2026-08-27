---
name: code-reviewer
description: Use after a meaningful implementation task or before merge to review committed or working-tree changes against requirements, tests, project instructions, and applicable ADRs.
license: MIT; see LICENSE
metadata:
  source: https://github.com/obra/superpowers
  upstream-version: "6.3.0"
---

# Code Reviewer

Review completed work before defects cascade. Prefer an independent reviewer/subagent when available; otherwise perform the same read-only review inline using [code-reviewer.md](code-reviewer.md).

**Core principle:** Review the actual change against the intended behavior and repository constraints, not against assumptions from the implementation conversation.

## When to review

Review is expected:

- after completing a meaningful task in an implementation plan
- after a major feature or complex bug fix
- before merge or release
- when an implementation deviates from its approved spec, plan, or ADR

For a trivial one-line change, a focused diff check and verification is enough. Do not create review ceremony with no plausible failure mode.

## Step 1 — Establish requirements

Gather the smallest authoritative context:

1. user requirements or the relevant task text
2. the approved temporary spec under `.tmp/specs/`, if still present
3. the temporary plan under `.tmp/plans/`, if still present
4. applicable project instructions and files under `docs/adr/`
5. verification commands and their latest results

Code and tests describe current behavior; accepted ADRs constrain durable decisions. Temporary documents are context, not permanent truth.

## Step 2 — Select the review range

Use the range the user specifies. Otherwise choose the first applicable option:

1. **Explicit commit range:** `<base>..<head>` when both revisions are known.
2. **Branch range:** merge base with the target branch through `HEAD` when reviewing a branch.
3. **Working tree:** staged, unstaged, and relevant untracked files when work has not been committed.
4. **Named files:** only when the task explicitly limits the review to them.

Always inspect `git status --short`. A plain `git diff` omits staged and untracked files, so a working-tree review must inspect all three categories. Do not include pre-existing unrelated user changes; if they cannot be separated safely, state the limitation.

## Step 3 — Run the review

When an independent reviewer is available, give it only:

- a concise description of the implementation
- requirements/spec/plan paths or relevant excerpts
- applicable ADR paths
- exact review range and commands
- verification results
- [code-reviewer.md](code-reviewer.md)

The review is read-only. The reviewer must not modify files, the index, HEAD, branches, or worktrees.

When no independent reviewer is available, apply the template inline. Read every changed production file and relevant test; do not review only the diff summary.

## Step 4 — Validate findings

Do not apply feedback blindly. For each finding:

1. verify the cited file and line
2. confirm it is introduced or exposed by the reviewed change
3. check whether code, tests, requirements, or ADRs already address it
4. keep the reported severity only if the actual impact supports it

Handle validated findings as follows:

- **Critical:** fix before proceeding; security, data loss, broken core behavior, or unsafe migration/deployment risk
- **Important:** fix before merge unless the user explicitly defers it; missing requirement, correctness issue, material test gap, or maintainability problem likely to cause defects
- **Minor:** fix only when cheap and in scope; otherwise report without creating a permanent debt file unless the project already has one

Push back on incorrect feedback with technical evidence. Do not argue with valid findings.

## Step 5 — Re-verify

After fixes:

1. run focused checks for each corrected issue
2. run the relevant repository-wide check
3. re-review the corrected diff where behavior changed
4. confirm applicable ADRs remain accurate
5. report remaining Critical, Important, and Minor findings separately

Do not commit, push, merge, or alter branch state unless the user explicitly asks.

## Output

Return findings first, ordered by severity. Each finding must include:

- severity
- `file:line`
- the concrete problem
- impact
- the smallest appropriate fix

Then include:

- assumptions or review-range limitations
- verification status
- verdict: `Ready`, `Ready with minor notes`, or `Not ready`

If no issues are found, say so explicitly and name the reviewed range and checks; do not invent findings to justify the review.
