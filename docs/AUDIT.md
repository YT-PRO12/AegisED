# Initial repository audit

Inspected the uploaded source before edits. Original React production build and ESLint pass; Express starts but the archive contains no PostgreSQL schema, seed or connection configuration, so original database-dependent behavior cannot be reproduced without creating a local database. No uploaded credentials were used.

| Feature | Initial state | Problem / action | Dependency | Priority |
|---|---|---|---|---|
| React/Vite, routing, Tailwind | WORKING | Preserve stack and routes; add auth boundary | API | P0 |
| Dashboard totals | PARTIAL | SQL backed totals; queue and bed overview still import mock arrays | Schema, seed | P0 |
| CRUD | PARTIAL | Basic queries work by inspection; unvalidated input and no auth | DB, validation | P0 |
| Workflow | PARTIAL | Existing transactions and row locks; bed can be assigned twice, CRUD bypasses resource invariants | DB constraints | P0 |
| PostgreSQL | MISSING setup | No migrations, constraints or seed in archive | Local PostgreSQL | P0 |
| Bed assignment clear | BROKEN | COALESCE prevents explicit null; preserve null through validated update | CRUD | P0 |
| Backend errors / security | MISSING | Centralize errors, validation, session, CSRF, RBAC, audit | DB | P0 |
| Frontend API configuration | BROKEN for deployment | Fixed localhost URL; use relative /api and Vite proxy | Backend | P0 |
| Analytics | MISSING | Placeholder page; build SQL aggregations and charts | Workflow timestamps | P1 |
| AI/ML | MISSING | Empty directory; reproducible synthetic experiment and service | Python dependencies | P1 |
| RAG | MISSING | Implement cited operational corpus, vector retrieval and optional generation | AI service | P1 |
| Tests/deployment/docs | MISSING | Integration, workflow contention, browser checks, containers and guides | All | P1 |

Refactoring rationale: keep existing controller/route names and response data fields, move duplicated CRUD validation/error/transaction logic into shared modules, close workflow mutation bypasses. The UI is extended in existing pages/components. PostgreSQL remains the authoritative store; no in-memory replacement is used.
