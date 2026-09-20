# Verification commands

For current observed results, see [RELEASE_READINESS.md](RELEASE_READINESS.md). The earlier [VERIFICATION.md](VERIFICATION.md) is a dated implementation record. Tests must use disposable local/CI data, never the live Render/Neon deployment.

## Package and repository checks

```bash
# Full portable archive (includes trained artifacts):
python scripts/verify_package.py
# Fresh Git checkout (four generated artifacts are intentionally untracked):
python scripts/verify_package.py --source-only
python scripts/check_repository.py
```

CI runs source verification before training or browser screenshots can change generated evidence. After intentional source edits, review the diff and tests, then refresh hashes with `python scripts/build_manifest.py` and verify again. Hash regeneration is not test evidence. The new repository check verifies relative documentation links, package/lock consistency, common secret patterns, tracked credential exclusions and obsolete deployment configuration. It does not certify the absence of all vulnerabilities.

## Native PostgreSQL integration tests

Use a disposable database named `AegisED_test`, not the original project database. Tests create records. Start the Python service before running API tests. From a POSIX terminal at the project root:

```bash
export NODE_ENV=test
export DATABASE_URL='postgresql://YOUR_TEST_USER:YOUR_TEST_PASSWORD@127.0.0.1:5432/AegisED_test'
export APP_ORIGIN='http://127.0.0.1:5000'
export ML_SERVICE_URL='http://127.0.0.1:8000'
export DEMO_SEED=true
# Set a private DEMO_PASSWORD and ML_SERVICE_TOKEN in this shell.
npm ci
npm run install:apps
npm run migrate --prefix backend
npm run seed --prefix backend
npm run test:api
```

The Python server must receive the same `ML_SERVICE_TOKEN`. A full executable setup is in `.github/workflows/ci.yml`; it provisions an isolated PostgreSQL 18 service, generates test credentials without committing them, trains the model and runs all checks.

## Python

```bash
cd ml-service
# Only when artifacts are absent in a fresh Git checkout:
# python train.py
# python evaluate_retrieval.py
python -m pytest -q
```

The trained artifact can be reused; retrain only after changing the generator, preprocessing, model candidates or supported library versions. Prediction reproducibility checks compare real pipeline outputs. Preprocessing tests inspect training-only medians and disjoint split indices. Provider tests mock failure/invalid generation responses and are not proof that a real LLM deployment works.

## Browser

The browser script requires a running API, running Python service and seeded test database with `DEMO_PASSWORD` available in its environment. Build React with production mode; serve it through Express on port 5000. Do not use production cookie settings for the HTTP test server.

```bash
NODE_ENV=production npm run build
npx playwright install chromium
npm start --prefix backend
# In a second terminal with the same test/demo environment:
npm run test:browser
```

It performs login, patient registration/search/detail, intake, doctor/bed assignment, treatment, completion, discharge, a real model request, human override, retrieval with citations, direct-route reloads, mobile navigation and role-protected navigation. It captures screenshots, console errors, failed API responses and horizontal overflow at 1440, 768 and 390 CSS pixels.

## Local sandbox engine boundary

The original implementation workspace could not launch native PostgreSQL under a non-root OS account. The current local API run also uses the same test adapter; GitHub CI supplies separate native PostgreSQL evidence. A strictly test-only `TEST_PGLITE_PATH` option uses PGlite (PostgreSQL compiled to WebAssembly) with the same SQL migrations and queries. Production configuration refuses that adapter. It preserves data across processes, but serializes clients and **does not certify native multi-connection row-lock behavior**. The contested-request test is still useful for application conflict handling; native CI is the concurrency gate.

## Dependency review

`npm audit --omit=dev` was run on both application packages. See VERIFICATION.md for the captured result. This checks known advisory data only, not all application security. Re-run audits when installing or upgrading dependencies.

