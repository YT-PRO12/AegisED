# Security Review Checklist

This checklist is for engineering changes, not a certification or claim of a completed security audit.

## Authentication and authorization

- Confirm session cookies are HTTP-only and have appropriate production security attributes.
- Check CSRF and origin validation for state-changing requests.
- Verify role and record ownership checks server-side; UI restrictions alone are insufficient.
- Use non-production test accounts and synthetic patient data.

## API and database

- Validate IDs, bounded pagination, input allowlists and parameterized SQL.
- Review unique constraints, transaction boundaries and concurrent assignment behavior.
- Avoid exposing database errors, internal stack traces, credentials or access tokens in API responses.
- Preserve audit events for sensitive workflow transitions.

## ML and retrieval

- Treat all model outputs as advisory, not clinical decisions.
- Make failure and unavailable-service states explicit.
- Do not insert private patient data into prompts or external retrieval without explicit authorization.
- Verify a human review path exists for prediction overrides.

## Deployment

- Separate staging and production credentials.
- Rotate a leaked credential rather than only deleting its repository reference.
- Scan changed dependencies and investigate findings rather than asserting they are harmless.
- Review least-privilege permissions and secrets handling before release.

Record review evidence in the PR; do not check a box without actually performing the check.

## Request-boundary regression evidence

For changes touching validation or model-facing endpoints, record the following evidence in the PR:

- Invalid vital ranges and unknown prediction fields return 400 before any model request is made.
- Pagination limits are enforced before collection queries run.
- Knowledge prompts are length-bounded and reject extra request properties.
- Prediction review permits only the documented actions and rejects unknown fields.
- Workflow-state conflicts return 409 without mutating case, doctor, or bed state.

Use synthetic fixtures and the disposable integration database. Keep response/request IDs for traceability, but do not attach real patient data or full payloads. A passing validation suite is one security layer, not proof that every route or role boundary has been audited.
