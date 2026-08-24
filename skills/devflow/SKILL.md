---
name: devflow
description: Placeholder workflow skill for Pi DevFlow. Invoke manually while developing or validating this package; replace these instructions as the development workflow is implemented.
license: MIT
disable-model-invocation: true
---

# Pi DevFlow

This is the minimal Skill entry point for the Pi DevFlow package.

## Workflow

1. Confirm the user's development goal and constraints.
2. Inspect the current project before making changes.
3. Follow project-local instructions and conventions.
4. Implement the requested change and verify the result.

## Extension Points

Add supporting resources as the workflow evolves:

- Put executable helpers in `scripts/`.
- Put detailed documentation in `references/`.
- Put templates and static files in `assets/`.

Keep paths in this file relative to the `skills/devflow/` directory.
