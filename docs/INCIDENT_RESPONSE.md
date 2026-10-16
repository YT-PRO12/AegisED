# Incident Response — AegisED

This playbook covers operational service incidents in the AegisED demonstration environment. It does not replace hospital incident protocols.

## Initial triage

1. Record the incident time, affected environment, symptoms and request IDs.
2. Determine whether the problem affects login, emergency intake, bed allocation, treatment workflow, or AI assistance.
3. Check /api/health and /api/ready from the intended environment.
4. Review application logs without copying tokens, passwords or patient data.
5. Inspect recent deployments, migrations and database connectivity.

## Priority

- **P0**: Intake and case lifecycle unavailable or integrity at risk. Suspend risky deployments, contact the system owner immediately.
- **P1**: Authentication, assignment, or discharge is significantly degraded. Prioritize service recovery.
- **P2**: Non-critical analytics, reporting, or AI assistance degraded. Keep core workflows available.

## Recovery principles

- Do not reset or truncate production databases.
- Avoid untested manual database updates; prefer verified application workflow and reversible migrations.
- Never make treatment decisions based only on generated model suggestions.
- Confirm doctor and bed release transitions after a recovery.
- Use request IDs and audit records for reconstruction; do not leak sensitive record content.

## Closure

Document root cause, impact, timeline, remediation, verification, and preventive action. Include links to the actual deployment and issue/PR when available.
