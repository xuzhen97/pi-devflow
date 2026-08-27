# Apply TDD according to task behavior and regression risk

- Status: Accepted
- Date: 2026-08-26

## Context

Test-driven development is valuable when a task changes observable behavior and a failing test can prove a realistic defect. Applying the same ceremony to prose, declarative metadata, generated artifacts, or exact mechanical edits creates low-value tests and maintenance noise.

Implementation plans need an explicit, consistent way to distinguish these cases before execution begins.

## Decision

Every implementation-plan task declares one test strategy:

- `TDD: Required` for behavior with meaningful regression risk, including business rules, branches, parsers, state, APIs, persistence, security, concurrency, money paths, and bug fixes.
- `TDD: Not applicable` when no meaningful red/green cycle exists, including human prose, declarative metadata without custom runtime behavior, generated or vendored artifacts, formatting, and exact mechanical edits.

Each task records a one-sentence reason. Non-TDD tasks still specify the smallest relevant verification, such as a type, schema, build, lint, reference, generator, or inspection check. Configuration that controls custom runtime behavior is treated as behavior and normally requires TDD.

Execution may correct a clearly wrong classification before implementation. Code review evaluates whether the chosen strategy matches the actual regression risk rather than demanding tests universally.

## Consequences

- Behavioral changes receive a verified red/green regression check.
- Plans avoid ceremonial or source-text tests that add maintenance cost without protecting behavior.
- Plan authors and executors must make the test-strategy decision explicit.
- Every task remains verifiable even when TDD does not apply.

## Alternatives considered

- Require TDD for every changed file: rejected because many changes have no meaningful failing behavior test.
- Leave test strategy implicit: rejected because applicability would be decided inconsistently during implementation.
- Skip tests whenever they are inconvenient: rejected because inconvenience does not remove behavioral regression risk.
