# Release Readiness Checklist

Use this checklist for each AegisED release candidate. Record evidence in the pull request; a checked box means the step was actually performed, not merely planned.

## Change review
- [ ] Confirm the PR scope and inspect the complete diff.
- [ ] Confirm no secrets, real patient data, credentials, or local environment files are included.
- [ ] Confirm API contracts, migrations, and backward-compatibility impact are documented.
- [ ] Confirm user-facing changes have loading, empty, error, and success states where applicable.

## Automated verification
- [ ] Repository and package-manifest checks pass.
- [ ] Backend unit tests pass.
- [ ] Integration tests use a disposable `AegisED_test` database only.
- [ ] Frontend lint and production build pass.
- [ ] Browser smoke checks cover the changed user workflow.
- [ ] Security-sensitive changes include regression tests for authorization, validation, and sessions.

## Data and deployment safety
- [ ] Review migration SQL and recovery strategy.
- [ ] Confirm backup/restore expectations for persistent data.
- [ ] Verify health checks and required environment variables in the target environment.
- [ ] Confirm the deployment target is staging or production as intended.
- [ ] Never run destructive migration, seed, or cleanup commands against production during local verification.

## Release decision
- [ ] All required checks have completed successfully.
- [ ] Known limitations and unresolved risks are documented.
- [ ] Release notes summarize user-visible changes and operational impact.
- [ ] A responsible reviewer approves the release.

## Post-release verification
- [ ] Verify health endpoints and critical API flows.
- [ ] Check logs for elevated errors and failed background work.
- [ ] Record the release commit and any rollback decision.

**Safety note:** This checklist is a process aid, not proof of compliance or a substitute for a security review. Never record secrets or personal patient information in release evidence.
