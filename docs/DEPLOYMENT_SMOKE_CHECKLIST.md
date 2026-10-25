# AegisED Deployment Smoke-Test Checklist

Use this checklist after a deployment to catch configuration and workflow regressions. Run it against a staging environment whenever available. A passing smoke test is not a clinical safety certification.

## 1. Deployment and service health
- [ ] Confirm the deployed commit SHA matches the intended release.
- [ ] Check the frontend loads without uncaught browser errors.
- [ ] Check API health and readiness endpoints.
- [ ] Confirm database connectivity and migrations completed successfully.
- [ ] Confirm the ML service reports its actual availability and model status.
- [ ] Inspect logs for startup failures, repeated retries, or secret values.

## 2. Authentication and authorization
- [ ] Sign in with a test account for each supported role.
- [ ] Confirm unauthenticated requests cannot access protected operations.
- [ ] Confirm one role cannot perform another role's restricted actions.
- [ ] Verify logout invalidates the session.
- [ ] Confirm errors do not expose stack traces, credentials, or private patient data.

## 3. Emergency workflow integrity
Use synthetic test records only.
- [ ] Create a test case and verify its initial state.
- [ ] Verify assignment rules prevent double-booking a doctor or bed.
- [ ] Attempt an invalid state transition and confirm no partial mutation occurs.
- [ ] Complete the supported workflow and verify resource release.
- [ ] Refresh the page and confirm persisted state agrees with the API.
- [ ] Confirm audit events exist for relevant state changes.

## 4. Recovery and release decision
- [ ] Verify critical background jobs and scheduled tasks are healthy.
- [ ] Confirm monitoring and alerting are available.
- [ ] Record any failed check with timestamp, commit SHA, and sanitized evidence.
- [ ] Roll back or pause rollout if authentication, persistence, or workflow invariants fail.
- [ ] Re-run the failed checks after remediation.

## Result

- Release commit:
- Environment:
- Tester and timestamp:
- Passed checks:
- Failed checks / incident link:
- Decision: proceed / pause / roll back

AegisED is an engineering and educational decision-support platform. Smoke tests do not establish clinical validity or guarantee safe real-world decisions.
