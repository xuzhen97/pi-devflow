# Keep specifications and implementation plans temporary

- Status: Accepted
- Date: 2026-08-26

## Context

Specifications and implementation plans are useful while clarifying and executing work, but they quickly become stale after the code changes. Keeping all of them in version control adds search and review noise and can conflict with the implemented behavior.

Some architectural decisions must remain discoverable after those temporary artifacts are removed.

## Decision

Store working specifications in `.tmp/specs/` and implementation plans in `.tmp/plans/`. Ignore `.tmp/` in Git and treat code and tests as the implementation authority.

After a specification is approved, preserve only durable architectural decisions in `docs/adr/`. ADRs record the decision context, outcome, consequences, and serious alternatives; they do not duplicate implementation steps or temporary documents.

## Consequences

- Repository browsing and search contain less stale planning material.
- Temporary specifications and plans are unavailable after cleanup unless retained outside Git.
- Decisions affecting architecture, interfaces, data, security, deployment, or cross-cutting conventions require an ADR.
- Code changes that alter an accepted decision must add a superseding ADR and mark the old ADR as superseded.

## Alternatives considered

- Commit every specification and plan: rejected because it creates persistent noise and stale sources of truth.
- Delete all design records after implementation: rejected because future maintainers would lose the reasoning behind durable decisions.
- Keep only specifications: rejected because specifications mix temporary implementation detail with lasting decisions.
