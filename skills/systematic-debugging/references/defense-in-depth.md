# Defense-in-Depth Validation

## Principle

After fixing the source of invalid or unsafe data, add validation only at boundaries with an independent responsibility. The goal is structural safety, not repeating the same guard in every function.

Useful boundaries include:

- an external trust boundary that rejects malformed input
- the domain owner that enforces a business invariant
- a destructive operation that must fail closed
- an environment boundary with a distinct safety rule

If two checks have the same owner, failure behavior, and threat model, keep the earliest shared one.

## Example

An empty directory reaches a destructive filesystem operation:

```text
external input → project creation → workspace setup → filesystem command
```

A focused defense may contain:

1. **Input boundary:** reject an empty or nonexistent directory with a user-facing error.
2. **Domain invariant:** ensure project creation always owns a valid absolute directory.
3. **Destructive boundary:** refuse to run outside an explicitly allowed root.

The third check is justified because it prevents damage even if an alternate caller bypasses the first two. Repeating `if (!directory)` in every intermediate helper is not useful defense.

```typescript
function resolveProjectDirectory(input: string): string {
  if (!input.trim()) throw new Error('Project directory is required');
  return resolve(input);
}

function assertInsideRoot(directory: string, allowedRoot: string): void {
  const relative = path.relative(allowedRoot, directory);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing operation outside allowed root: ${directory}`);
  }
}
```

## Applying the pattern

1. Trace where the invalid state originated and fix that source.
2. Map trust, ownership, and destructive-operation boundaries.
3. For each proposed guard, name the distinct failure it prevents.
4. Add the minimum independent checks.
5. Test the source fix and any boundary that prevents material harm.
6. Avoid logging secrets or full sensitive payloads; use redacted metadata.

## Warning signs

Do not add another layer merely because:

- the call graph has another function
- a mock can bypass normal construction
- a hypothetical future caller might misuse an internal helper
- identical validation feels safer

Add a layer when it has a different owner, threat model, or safety consequence. Otherwise, one shared invariant is smaller and more reliable.
