# Branch Protection — Recommended Settings for `main`

These rules are not automated. Apply them manually in GitHub under
**Settings → Branches → Branch protection rules → Add rule** for the pattern `main`.

## Required status checks

Enable **Require status checks to pass before merging**, then add:

| Check | Workflow |
|---|---|
| `build-and-test` | `Frontend` workflow (`.github/workflows/frontend.yml`) |

The Tauri build matrix is long-running and cross-platform; it is not required to block
merge on every PR. Add it as a required check once the matrix is stable if desired.

## Recommended settings

| Setting | Value | Notes |
|---|---|---|
| Require a pull request before merging | Enabled | Prevents direct pushes to `main` |
| Require approvals | 1 | Optional for solo projects; useful when working with collaborators |
| Dismiss stale pull request approvals when new commits are pushed | Enabled | Ensures reviews stay current |
| Require branches to be up to date before merging | Enabled | Prevents merging stale branches |
| Require conversation resolution before merging | Enabled | Ensures review comments are addressed |
| Do not allow bypassing the above settings | Enabled | Prevents admins from force-merging |

## Preventing broken builds from blocking all work

If the Tauri matrix is added as a required check, use **branch-specific overrides** or
a separate `release` branch for platform builds rather than requiring them on every PR.
