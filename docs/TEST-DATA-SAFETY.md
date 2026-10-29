# Safe test-data workflow

AegisED contains emergency-operation demonstrations. Tests and demos must use **synthetic records** and a disposable local or CI database, never real patient data or the hosted Render/Neon production database.

## Before integration tests

1. Set `NODE_ENV=test` and a dedicated `DATABASE_URL` pointing to the disposable `AegisED_test` database.
2. Confirm the database hostname and name before migrations or seeding; do not reuse production credentials.
3. Start the local ML service with a test-only `ML_SERVICE_TOKEN`.
4. Run `npm run migrate --prefix backend`, followed by `npm run seed --prefix backend` and `npm run test:api`.
5. Treat browser screenshots, seed outputs and API response bodies as potentially sensitive artifacts. Inspect before sharing or committing.

The PGlite test adapter is useful for SQL and application regressions, but it does not prove PostgreSQL multi-connection row-lock semantics. Native PostgreSQL CI remains the concurrency verification gate.

## What passing tests establishes

- Selected API and workflow contracts on synthetic scenarios.
- Regression protection for guarded transitions, assignment conflicts and expected response shapes.

Passing tests **does not** establish clinical validity, deployment health, production capacity, security certification or suitability for real triage.

See [testing commands](TESTING.md), [release readiness](RELEASE_READINESS.md), and [model card](MODEL_CARD.md).
