# CareFlow AI — verification report

Finalized 2026-09-19. This report retains the successful checks from the completed implementation and browser run. No model was retrained during final packaging. The initial repository audit was not repeated.

## Executed checks

| Check | Observed result | Scope and evidence |
|---|---|---|
| Frontend ESLint | Passed | `npm run lint --prefix frontend` after the form-label fix |
| Production frontend build | Passed | `NODE_ENV=production npm run build --prefix frontend`; Vite built 2,489 modules and split page/chart bundles |
| API integration | 16 passed, 0 failed | Actual Express/FastAPI processes; same SQL on the PGlite test adapter; [captured output](evidence/integration-tests.txt) |
| Python service | 9 passed, 0 failed | Actual saved pipeline, split/preprocessing checks, retrieval and provider-contract tests; two dependency deprecation warnings |
| Migration repeatability | Passed | Migration applied, then rerun without duplicate application |
| Synthetic seed repeatability | Passed | 254 patients/cases, 12 doctors, 20 beds, four accounts; second seed changed no records |
| Browser workflow | 33 checkpoints passed | Chromium 153.0.8010.0, completed 2026-09-18; [machine-readable result](browser-results.json), [captured output](evidence/browser-tests.txt) |
| Browser console/API monitoring | No unexpected errors | Zero collected console/page errors and zero failed API responses during authenticated checks |
| Responsive layout | Passed at 1440, 768 and 390 CSS pixels | Page-level overflow checks at tablet/mobile widths and captured desktop/mobile screenshots; tables intentionally scroll within their containers |
| Runtime npm advisory audit | 0 reported vulnerabilities in each app | `npm audit --omit=dev`, captured 2026-09-17; [backend](evidence/backend-dependency-audit.json), [frontend](evidence/frontend-dependency-audit.json) |
| Dependency manifests | Passed | Root, backend and frontend dependency declarations match their lockfiles |

The 33 browser checkpoints include repeated route checks at different widths; they are not 33 independent unit tests. Initial unauthenticated session discovery can correctly return 401 and is outside the authenticated error collection window.

## Browser coverage and fixes

The browser signed in, registered and searched for a synthetic patient, opened the patient detail, created a case, assigned a doctor and bed, started and completed treatment, and discharged the patient. The API integration test separately asserts that discharge makes the doctor and bed available and clears the bed's patient link.

It then called the actual model service, recorded a human priority override with a reason, queried the operational corpus and displayed grounded excerpts with citations. It loaded the main routes directly, exercised tablet/mobile layouts and the mobile menu, logged out, and verified that a reception account could not open the administrator audit view.

The checks exposed an accessible-name problem caused by wrapping a select and its options in a label. The shared form component now uses unique IDs and explicit `htmlFor` labels. The affected workflow passed against the rebuilt bundle. The browser script also received exact-name selectors where partial names matched both branding and navigation. The final successful run has no skipped workflow steps.

Screenshots were visually inspected for the overview, mobile overview, decision support, knowledge retrieval, emergency operations and analytics. Actual screenshots are in [screenshots](screenshots/); they are not generated mockups. They contain only synthetic data. Counts can vary across screenshots because the browser registers and discharges a test patient and records a reviewed priority.

## Integration coverage

The 16 API checks cover health/readiness, safe authentication errors, CSRF and origin protection, role authorization, validated CRUD including age zero, parameterized search/pagination, complete workflow consistency, contested assignments, unique active patients, explicit bed clearing, scoped doctor access, analytics reconciliation, real ML inference and review persistence, grounded retrieval and abstention, audit/error handling, and session revocation.

The nine Python checks cover pipeline repeatability and input constraints, training-only imputation and disjoint split indices, model metadata and service authentication, source-bearing retrieval/no-context behavior, and generation contract/failure handling. Provider mocks do not establish real LLM quality.

## Preserved model and retrieval evidence

The existing model artifact, dataset, split indices, EDA, evaluation figure and reports are included without retraining. Logistic regression was selected by validation macro F1 from four candidates. The 900-example held-out synthetic test gave accuracy **0.8167**, macro F1 **0.7893**, weighted F1 **0.8183**, Critical recall **0.7820**, and macro OVR ROC AUC **0.9389**. These are simulator results, not clinical validation.

The existing ten-query, author-written retrieval check gave hit@3 **1.0** and MRR@3 **0.8833**. The live browser ran in truthful retrieval-only mode and displayed actual excerpts. See [model card](MODEL_CARD.md), [metrics](../ml-service/reports/metrics.json) and [retrieval evaluation](../ml-service/reports/retrieval.json).

## Boundaries and remaining release gates

| Not executed here | Why / required next validation |
|---|---|
| Native PostgreSQL integration and locking | This workspace could not launch PostgreSQL under a non-root OS user. PGlite serializes clients; it cannot certify native multi-connection row-lock behavior. Run the supplied PostgreSQL 18 CI job. |
| Docker image build and container startup | No Docker daemon was available. Compose/Dockerfiles are prepared; run the commands in [deployment](DEPLOYMENT.md). |
| Hosted HTTPS application | No authorized hosting account, server or domain was supplied. There is no production URL. Verify secure cookies, proxy configuration and the full workflow on the chosen host. |
| Real Ollama generation | No language model was downloaded/configured. The real provider path and fallback are implemented; only the contract/fallback tests and retrieval-only behavior were executed. |
| Operational readiness | Load testing, backup/restore drills, multi-replica rate limiting, monitoring and security penetration testing are outside the completed local checks. |

This is a tested educational prototype with deployment preparation. It is not a certified clinical system or an assertion that all production release gates have passed.

## Reproduction and package integrity

[TESTING.md](TESTING.md) contains the exact native database, Python and browser commands. [LOCAL_SETUP.md](LOCAL_SETUP.md) covers Docker and Windows PowerShell. The CI workflow runs native PostgreSQL checks when placed in a GitHub repository.

The final archive includes source, lockfiles, environment examples, migrations, synthetic data, trained artifacts, documentation, tests and screenshots. It excludes installed dependencies, private environment files, generated passwords, temporary databases and browser binaries. `docs/package-manifest.json` records each delivered file's size and SHA-256 (excluding the manifest itself); `scripts/verify_package.py` checks those hashes after extraction.
