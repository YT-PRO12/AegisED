# Contributing to AegisED

## Branch and commit conventions

Create a focused branch from the current default branch:

```bash
git switch main
git pull --ff-only
git switch -c <type>/<short-description>
```

Use Conventional Commit-style messages with a meaningful scope:

```text
feat(emergency): validate case assignment transitions
fix(patients): reject invalid age values
test(auth): cover invalid session and login payloads
docs(release): document rollback verification steps
refactor(api): centralize request validation
```

Prefer one coherent change per commit. Avoid vague messages such as `updates`, `fix stuff`, or `final changes`, and do not split one edit into artificial commits.

## Pull request expectations

- Explain the problem, intended behavior, and trade-offs.
- Keep the PR focused and reviewable.
- Link related issues where relevant.
- Report exact tests and commands run; do not state that CI passed before it has.
- Include database and deployment implications.
- Never commit secrets, environment files, real patient data, or generated local artifacts.

## Local verification

Use the commands in [TESTING.md](TESTING.md) and follow [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for release-oriented changes. API integration tests must use the disposable `AegisED_test` database, never the live Render/Neon deployment.

## Safety and scope

This project supports healthcare operations workflows. Treat patient data as sensitive, preserve authorization boundaries, and avoid presenting application behavior as medical advice. Production deployment and destructive database operations require explicit review.
