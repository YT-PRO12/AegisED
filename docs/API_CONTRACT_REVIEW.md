# API Contract Review Guide

Use this guide when adding or changing an AegisED endpoint. The goal is to keep client behavior predictable and preserve authorization and data-integrity boundaries.

## Request contract
- [ ] Define the HTTP method, route, accepted content type, and request schema.
- [ ] Validate required fields, value ranges, enumerations, and string lengths at the API boundary.
- [ ] Reject unknown fields where strict validation is intended.
- [ ] Normalize identifiers only where the domain contract permits it.
- [ ] Never trust a role, user ID, or tenant identifier supplied by the client as proof of authorization.

## Response contract
- [ ] Return a stable response shape and appropriate HTTP status.
- [ ] Use consistent validation and not-found error formats.
- [ ] Do not expose stack traces, SQL errors, secrets, or internal configuration in client responses.
- [ ] Avoid caching responses that contain session-specific or sensitive information.
- [ ] Preserve request correlation IDs for troubleshooting without logging sensitive payloads.

## Authorization and data integrity
- [ ] Verify access on every resource operation, including reads and state transitions.
- [ ] Check allowed workflow transitions server-side; do not rely on disabled UI controls.
- [ ] Use parameterized SQL and transaction boundaries for multi-step changes.
- [ ] Verify related records belong to the authorized scope before changing them.
- [ ] Ensure retrying a request cannot silently create duplicate or inconsistent records where idempotency matters.

## Regression coverage
- [ ] Test valid requests and the expected success response.
- [ ] Test missing, malformed, out-of-range, and unexpected inputs.
- [ ] Test unauthenticated and insufficiently authorized access.
- [ ] Test missing records and invalid state transitions.
- [ ] Test rollback behavior for failures in multi-step operations.
- [ ] Use isolated test fixtures and the disposable test database only.

## Change evidence
Document the changed endpoint, compatibility impact, migration implications, commands run, and any remaining manual verification in the pull request. Only report checks as passing after their results are available.
