# Environment Configuration Audit

Use this before deploying or rotating configuration. Never paste secret values into issues, pull requests, screenshots, or logs.

## Configuration inventory

For each service, record the variable name, owning service, source of truth, required/optional status, and rotation procedure. Store values only in the approved secret manager or deployment environment.

- [ ] Frontend public configuration contains no credentials.
- [ ] API database connection targets the intended environment.
- [ ] Session signing secret is present and strong in production.
- [ ] CORS origins match the intended frontend origins.
- [ ] ML service URL and timeout match the deployment.
- [ ] External provider keys are optional when the feature is disabled.
- [ ] Debug mode and verbose errors are disabled in production.
- [ ] Health checks do not expose secrets or patient data.
- [ ] Local environment files and generated credentials are excluded from version control.
- [ ] Secret rotation and rollback steps are documented.

## Verification procedure

1. Compare variable names against deployment configuration; do not export or print values.
2. Restart or redeploy the affected service using the platform-supported procedure.
3. Verify readiness, authentication, and one synthetic end-to-end workflow.
4. Inspect sanitized logs for missing configuration or accidental secret leakage.
5. Record the deployment commit SHA and any exceptions.

## Audit record

- Environment:
- Commit SHA:
- Reviewer / timestamp:
- Missing or mismatched variable names:
- Smoke-test result:
- Follow-up owner:

A configuration audit does not prove clinical suitability. Use synthetic records for routine deployment verification.