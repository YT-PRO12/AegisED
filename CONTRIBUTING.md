# Contributing to AegisED

Thanks for your interest in improving AegisED.

## Development Workflow

1. Create a focused branch from `main`.
2. Keep each change scoped to one feature, fix, documentation update, or test improvement.
3. Use clear conventional commit messages.
4. Run the relevant checks before opening a pull request.
5. Describe what changed, why it changed, and how it was verified.

## Branch Naming

```text
feat/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
```

## Commit Style

Examples:

```text
feat(emergency): add assignment validation
fix(settings): handle missing linked doctor
docs(api): clarify emergency workflow endpoints
test(auth): cover unauthorized access paths
```

## Pull Requests

A good pull request should include:

- a concise summary
- the motivation for the change
- verification or test evidence
- screenshots for visible UI changes
- notes about migrations or deployment impact, when applicable

## Engineering Expectations

- Do not commit secrets or real patient data.
- Keep healthcare demo data synthetic.
- Preserve server-side authorization and auditability.
- Treat ML output as decision support, not autonomous clinical advice.
- Avoid unrelated formatting or refactoring in focused fixes.

For setup and verification instructions, see the documentation index in `docs/README.md`.
