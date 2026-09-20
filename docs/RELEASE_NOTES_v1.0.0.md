# AegisED v1.0.0

Release notes prepared for the first public tagged release. No tag or GitHub release has been created by this review.

**Live portfolio demo:** https://AegisED-app.onrender.com

AegisED is an educational emergency-operations and decision-support application using synthetic data. It is not for clinical use, real-patient diagnosis or autonomous medical decisions.

## Major features

- React/JavaScript workspace for registration, patient history, emergency operations, doctors, beds and analytics.
- Express/PostgreSQL workflow with transactional resource assignment, guarded treatment transitions, discharge/resource release and audit events.
- Four-role access control, database sessions, CSRF protection, scoped doctor access and staff administration.
- FastAPI/scikit-learn decision support with saved predictions, model version and explicit human acceptance, review or override.
- Grounded operational knowledge retrieval with source citations and abstention. Optional Ollama synthesis is implemented separately from the tested retrieval-only mode.

## Architecture and model

The main React/Express application is hosted on Render. The operator reports Neon PostgreSQL and a separate Render FastAPI deployment. Browser traffic goes through Express; the private service token stays between servers.

The preserved model was trained on 6,000 synthetic adult scenarios (4,200 train / 900 validation / 900 test). Four approaches were compared, with logistic regression selected by validation macro F1. Held-out synthetic metrics: accuracy 0.8167, macro F1 0.7893, weighted F1 0.8183, Critical recall 0.7820, ROC AUC 0.9389 and log loss 0.4209. These evaluate an invented simulator, not real-patient performance.

## Release cleanup

- Updated deployment and project claims to describe the existing Render application.
- Preserved historical test evidence with dates and added a current verification report.
- Corrected ignore rules, added consistent text line endings, and checked tracked files plus accessible Git history for common secret patterns.
- Added useful source-package and repository checks to CI, masked generated CI credentials and limited job duration.
- Refreshed portable package hashes and aligned package metadata to the first public release label, v1.0.0. Earlier internal package version strings were not evidence of published releases.
- Preserved application code, schema, Docker/Compose configuration, trained artifacts and workflow screenshots. Added an actual public production login screenshot.

## Validation evidence

On 2026-09-20, local lint/build passed, all 16 API integration tests and 9 Python tests passed, and both runtime npm audits reported zero known vulnerabilities. Local SQL tests used the PGlite test adapter. The existing GitHub run for baseline commit `ea3eae30` separately passed native PostgreSQL and browser checks. Public production checks confirmed the HTTPS login, health/database-readiness endpoints and unauthenticated access protection.

These observations precede the final release commit. Its CI result must pass before publication; follow `docs/RELEASE_CHECKLIST.md` and consult `docs/RELEASE_READINESS.md` for exact boundaries.

## Known limitations

Authenticated production regression was not repeated because production credentials were not supplied. The cloud browser's fixed viewport did not establish new mobile-production results; prior responsive browser evidence is retained as historical. No Docker daemon was used locally, no provider configuration or production data was changed, and no real Ollama model was exercised. Cold starts can delay initial loading. The model is synthetic and adult-only; the knowledge corpus is operational. Load testing, operational backup/restore, staff recovery/deactivation and broader security review remain future work.

