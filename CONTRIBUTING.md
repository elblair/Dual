# Contributing to Dual

Short version of our Git workflow (a simplified Git Flow). Claude Code sessions should follow this too; the same rules are in `CLAUDE.md`.

## Branches
| Branch | Purpose | Created from | Merges into |
|---|---|---|---|
| `main` | demo-ready; Render deploys from it | | |
| `develop` | integration branch | `main` | `main` (release PR) |
| `feature/<short-name>` | one per phase or feature, e.g. `feature/phase-1-theme`, `feature/today-screen`, `feature/api-auth` | `develop` | `develop` |
| `fix/<short-name>` | bug fixes | `develop` | `develop` |
| `hotfix/<short-name>` | urgent fix to what is deployed | `main` | `main` AND `develop` |

- Never commit directly to `main` or `develop`. Open a pull request.
- No staging branch (one free Render service): `main` is what we deploy.
- Delete the branch after it is merged.

## Commits and PR titles (Conventional Commits)
`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`. Example: `feat: add Today screen with 7-dot progress`.
- Small, focused commits.
- Never commit secrets or `.env` files (use `.env.example` for variable names).

## Day to day
```
git switch develop && git pull
git switch -c feature/<short-name>
# work, commit in small pieces
git push -u origin feature/<short-name>
gh pr create --base develop      # or open the PR on GitHub
```
Each PR into `develop` needs a short description (the PR template asks): what changed, how to test on a phone, screenshots for UI. A teammate reviews before merge. Check that the app also works with `EXPO_PUBLIC_USE_MOCK=true`.

## Releases
When `develop` is stable and demo-ready: open a PR `develop` -> `main` titled `chore: release v0.x.0`, merge after approval, then tag the merge commit on `main`:
```
git switch main && git pull
git tag -a v0.1.0 -m "v0.1.0" && git push origin v0.1.0
```

## Hotfix
```
git switch main && git pull && git switch -c hotfix/<short-name>
# fix, then PR into main; after merge, PR (or merge) the same fix into develop
```

## Branch protection (repo admin, GitHub settings)
`main` and `develop`: require a pull request and 1 approval, no direct pushes.
