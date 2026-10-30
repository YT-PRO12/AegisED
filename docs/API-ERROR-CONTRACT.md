# Public API error contract

AegisED exposes predictable status codes for authorization failures, invalid request fields, missing records and invalid state transitions. Internal exception strings, SQL statements, connection details and stack traces must never be serialized into public error bodies.

## Review requirements

- Validate request bodies on the server, including unexpected fields.
- Use 400-series status codes for malformed input and blocked transitions as appropriate.
- Keep database errors in restricted server-side diagnostics, without exposing credentials or patient details.
- Ensure an unsuccessful mutation does not partially assign a doctor or bed.
- For authorization failures, verify both the HTTP response and the absence of state changes.

Regression tests are in `backend/tests/`. Execute against a disposable database, not production. See [testing guide](TESTING.md), [incident response](INCIDENT_RESPONSE.md), and [test data safety](TEST-DATA-SAFETY.md).
