# Verification commands

## Native PostgreSQL integration tests

Use a disposable database named `careflow_test`, not the original project database. Tests create records. Start the Python service before running API tests. From a POSIX terminal at the project root:

```bash
export NODE_ENV=test
export DATABASE_URL='postgresql://YOUR_TEST_USER:YOUR_TEST_PASSWORD@127.0.0.1:5432/careflow_test'
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
python train.py
python evaluate_retrieval.py
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

The development workspace cannot create a non-root OS account to launch native PostgreSQL. A strictly test-only `TEST_PGLITE_PATH` option uses PGlite (PostgreSQL compiled to WebAssembly) with the same SQL migrations and queries. Production configuration refuses that adapter. It preserves data across processes, but serializes clients and **does not certify native multi-connection row-lock behavior**. The contested-request test is still useful for application conflict handling; native CI is the concurrency gate.

## Dependency review

`npm audit --omit=dev` was run on both application packages. See VERIFICATION.md for the captured result. This checks known advisory data only, not all application security. Re-run audits when installing or upgrading dependencies.
