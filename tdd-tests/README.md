# Chronarium TDD Test Tree

This directory holds root-level TDD slices requested by the user or useful for
cross-package and app-level behavior.

Keep this directory shaped like the source ownership tree. Do not place a flat
pile of tests directly under `tdd-tests/`.

Use owner paths such as:

```text
tdd-tests/
  apps/
    desktop/
      recording-dashboard/
  packages/
    archive/
      streaming-timeline/
    core/
      offline-capture/
```

Package-local behavior tests may still live under `packages/*/tests` when the
behavior belongs cleanly to one package.
