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
- Delete the branch after it is merged, on GitHub and locally. This includes release branches (`chore/release-v0.x.0`): delete them once the release PR is merged and tagged. (`git branch -d` can say "not fully merged" for a release branch because it checks against your current branch, not `main`; confirm with `git merge-base --is-ancestor <branch> origin/main`, then use `git branch -D`.)

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
Each PR into `develop` needs a short description (the PR template asks): what changed, how to test on a phone, screenshots for UI. `develop` needs the PR but no approval, so you can merge your own PR once it is ready; a teammate review is welcome but optional. Check that the app also works with `EXPO_PUBLIC_USE_MOCK=true`.

## Releases
When `develop` is stable and demo-ready: open a PR into `main` titled `release: v0.x.0` (with a changelog since the last tag and how to test), get a teammate's approval, and **merge it with a merge commit, never squash** (and never rebase). Then tag the merge commit on `main`:
```
git switch main && git pull
git tag -a v0.x.0 -m "v0.x.0" && git push origin v0.x.0
```
**Why a merge commit:** a squash merge writes one new commit on `main` and leaves `develop`'s commits out of `main`'s history, so `main` and `develop` diverge and the next `develop` -> `main` PR shows conflicts in every file touched since (this happened after v0.1.0). A merge commit keeps `develop` an ancestor of `main`. If a release PR ever shows conflicts anyway, branch `chore/release-v0.x.0` from `main`, merge `develop` into it, take `develop`'s content for the conflicts (the trees must be identical: `git diff origin/develop` is empty) and open the release PR from that branch, again merged with a merge commit.

PRs into `develop` (features, fixes, chores) are squash-merged as usual.

## Hotfix
```
git switch main && git pull && git switch -c hotfix/<short-name>
# fix, then PR into main; after merge, PR (or merge) the same fix into develop
```

## Branch protection (repo admin, GitHub settings)
- `main`: require a pull request and 1 approval, no direct pushes. Release PRs (`develop` -> `main`) and hotfixes need a teammate to approve, and release PRs are merged with a merge commit (see Releases).
- `develop`: require a pull request, 0 approvals, no direct pushes.
