# Release evidence boundaries

AegisED demonstrates emergency operations with synthetic records; it is not certified for real clinical use.

Evidence levels must be distinguished:

1. Unit tests verify isolated validation and error-handling contracts.
2. Integration tests verify workflows with a disposable database.
3. Browser tests verify seeded front-end workflows and routing.
4. Hosted checks verify deployment behavior and configuration separately.

PGlite tests do not certify native PostgreSQL row-lock concurrency. Model recommendations do not establish clinical validity or safety. Record dates, commit SHAs, exact commands, and CI job links for every reported test result. Never seed production data in an automated test.

See [testing](TESTING.md) and [release readiness](RELEASE_READINESS.md).
