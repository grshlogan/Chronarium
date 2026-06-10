# Plan Apache 2 License

## Objective

Record the user's license decision and add Apache-2.0 licensing metadata to
Chronarium.

## Scope

- Add the standard Apache License 2.0 text in `LICENSE`.
- Add the SPDX license identifier to the root `package.json`.
- Update README and handoff docs to state that Apache-2.0 is selected.
- Update the code map and change index.

## Out Of Scope

- No dependency installation.
- No source package implementation changes.
- No GitHub release.
- No change to adapter, archive, core, or schema runtime behavior.

## Current Facts

- The repository already has a first foundation commit on `main`.
- The user accepted the recommendation to use Apache-2.0.
- No license file existed before this step.

## Execution Plan

1. Add `LICENSE`.
2. Update root package metadata.
3. Update docs that still say the license is undecided.
4. Run safe checks.
5. Commit and push the license update.

## Verification

Expected checks:

```powershell
git diff --check
Get-Content package.json -Raw | ConvertFrom-Json
rg -n "LICENSE|license|License|许可证" .
```
