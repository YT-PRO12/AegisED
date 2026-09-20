# CareFlow AI — final completion status

Updated 2026-09-20. The existing application is deployed at [CareFlow AI on Render](https://careflow-app.onrender.com), with Neon PostgreSQL and a separate Render FastAPI service reported by the operator. Implementation and prior evidence are preserved. Current checks, remaining release actions and the proposed first public v1.0.0 release are recorded in [RELEASE_READINESS.md](RELEASE_READINESS.md).

## Implemented feature map

| Area | Delivered behavior | Main location |
|---|---|---|
| Overview | Live database counts, queue, available beds, arrivals, refresh | `frontend/src/pages/Dashboard.jsx` |
| Patients | Registration, search/filter/pagination, protected edits/deletes, detail and history | `frontend/src/components/ResourceManager.jsx`, `pages/PatientDetail.jsx` |
| Emergency operations | Intake, manual assignment, recommendations, start/complete/discharge | `frontend/src/pages/Emergency.jsx`, `backend/src/controllers/emergencyWorkflowController.js` |
| Resource consistency | Transactions, row locks, constraints, atomic resource release | `backend/src/services/`, `backend/migrations/001_core.sql` |
| Analytics | SQL aggregation, UTC period filters, occupancy, workload and duration samples | `backend/src/controllers/analyticsController.js` |
| ML | Reproducible synthetic dataset, four-model comparison, persisted pipeline and reports | `ml-service/train.py`, `model/`, `reports/` |
| Human review | Saved input/model snapshot, accept/override/review, required override rationale | `frontend/src/pages/DecisionSupport.jsx`, `backend/src/controllers/aiController.js` |
| Knowledge | Cited chunks, cosine retrieval, abstention, optional evidence-checked Ollama synthesis | `ml-service/app/knowledge.py`, `knowledge/documents/` |
| Access | Four roles, opaque database sessions, doctor ownership, staff creation/password change | `backend/src/controllers/authController.js`, `middleware/auth.js` |
| Traceability | Transactional audit events, patient timelines and administrator viewer | `backend/src/services/audit.js`, `frontend/src/pages/Audit.jsx` |
| Interface | Responsive layouts, explicit form labels, dialogs, feedback, loading/error states | `frontend/src/` |
| Deployment preparation | Dockerfiles, Compose, health/readiness, environment generation and CI | Root configuration, `.github/workflows/ci.yml` |

## Architecture and schema

The browser uses React/JavaScript, React Router and Tailwind. Express serves the production bundle and API. PostgreSQL stores operational records, sessions, audit events and predictions. Express calls a private FastAPI service for the scikit-learn pipeline and knowledge retrieval; ordinary workflows continue without the AI service.

The original `patients`, `doctors`, `beds` and `emergency_cases` tables and IDs are retained. Added timestamps and vitals support history/analytics. `users`, `sessions`, `audit_logs`, `predictions`, `schema_migrations` and `seed_runs` support access and traceability. Partial unique indexes prevent more than one active case for a patient, doctor or bed. Migrations are additive and transactional; incompatible legacy records stop the migration rather than being silently deleted.

See the [README architecture and ER diagrams](../README.md) and [initial audit](AUDIT.md). The audit was retained as the baseline record, not repeated in the final continuation.

## API and access

Original resource paths remain `/api/patients`, `/api/doctors`, `/api/beds`, `/api/emergency-cases` and `/api/dashboard/stats`. Patient PATCH remains supported and PUT is available. Workflow actions use `/api/emergency-cases/:id/assign-doctor`, `/assign-bed`, `/start-treatment`, `/complete-treatment` and `/discharge`. New API groups cover auth, users, analytics, audit, AI, knowledge and service health. The `{success,data}` response convention is preserved; errors include a safe message and request ID.

| Role | Scope |
|---|---|
| ADMIN | All operational records, resources, treatment, AI review, users and audit |
| DOCTOR | Assigned patients/cases; treatment and AI review only for assigned cases |
| NURSE | Registration/intake, allocation, analytics and prediction requests; no treatment/review authority |
| RECEPTION | Registration/intake and operational lookup; no allocation, treatment, analytics or administration |

The server enforces these rules independently of navigation. Security measures include scrypt password hashing, hashed opaque session tokens, HttpOnly/SameSite cookies, production Secure cookies, CSRF tokens, origin checks, validation, parameterized SQL, rate limiting, security headers and safe error responses. Secrets and generated credentials are excluded from the package. Read the [API reference](API.md) for exact payloads and restrictions.

## ML methodology and actual metrics

The preserved training run generated 6,000 invented adult scenarios, stratified into 4,200 train / 900 validation / 900 test records with seed 42. Preprocessing fits on training records only. Majority baseline, logistic regression, decision tree and random forest were compared using validation macro F1; logistic regression was selected. The held-out test was then evaluated once.

| Held-out synthetic metric | Result |
|---|---:|
| Accuracy | 0.8167 |
| Macro F1 | 0.7893 |
| Weighted F1 | 0.8183 |
| Critical recall | 0.7820 |
| Macro OVR ROC AUC | 0.9389 |
| Log loss | 0.4209 |

Class scores are uncalibrated. Input sensitivity is a training-median replacement probe, not a causal explanation. AI output does not change priority until an authorized human records a decision. These synthetic results do not establish real-patient performance. See [MODEL_CARD.md](MODEL_CARD.md).

## Grounded knowledge

Five project-authored CC0 operational documents are chunked by heading and indexed with TF-IDF plus truncated SVD. The persisted dense vectors support thresholded cosine retrieval. Every supported answer exposes its source chunks. Unsupported queries abstain.

The default, tested mode returns excerpts and labels itself retrieval-only. Optional Ollama configuration enables real generation constrained to retrieved context and source IDs with exact supporting quotations; invalid/unavailable generation falls back to excerpts. Actual LLM generation was not executed here. The preserved ten-query development evaluation measured hit@3 1.0 and MRR@3 0.8833. See [KNOWLEDGE.md](KNOWLEDGE.md).

## Validation and deployment

- Frontend lint and production build passed.
- 16 API integration checks and 9 Python tests passed.
- 33 browser checkpoints passed at desktop/tablet/mobile widths, including the full workflow, real ML request and human override, cited retrieval, navigation and role restrictions.
- The authenticated browser checks collected no console errors or failed API requests.
- Runtime dependency audits reported zero known vulnerabilities for each JavaScript application at the recorded audit date.
- Initial local database checks used PGlite. GitHub CI on commit `ea3eae30` subsequently passed native PostgreSQL integration/concurrency and browser steps.

The [historical verification report](VERIFICATION.md) retains the original scope and evidence. The [current release review](RELEASE_READINESS.md) records the successful GitHub run and public Render checks. [DEPLOYMENT.md](DEPLOYMENT.md) describes the current Render/Neon architecture and separately lists checks requiring authorized production access.

## Exact local execution commands

With Docker/Compose installed, extract the archive, open a terminal in `CareFlow-AI`, and run:

```bash
python scripts/verify_package.py
python scripts/setup_env.py
docker compose up --build -d
docker compose exec -e DEMO_SEED=true api npm run seed
docker compose exec api cat .demo-credentials
```

Open **http://localhost:5000**. The verification script needs only Python's standard library. The environment generator refuses to overwrite an existing `.env`. Container execution is prepared but was not available in this workspace.

The intentionally synthetic account emails are `admin@careflow.demo`, `doctor@careflow.demo`, `nurse@careflow.demo` and `reception@careflow.demo`. Passwords are generated during setup/seeding; the last command displays your local credentials. No reusable password is distributed. For existing local PostgreSQL and Windows PowerShell, use the complete [LOCAL_SETUP.md](LOCAL_SETUP.md) instructions.

## Remaining limitations

This is an educational synthetic-data prototype, not a clinical system. The model covers invented adult data only. Knowledge content covers application operations, not medical advice. The resource model permits one active case per doctor. Period utilization assumes a constant bed inventory. Multi-replica rate limiting, staff deactivation/recovery, load testing, monitoring, audit-retention controls and backup/restore drills remain future work. Use the dated release review when describing native CI and public HTTPS observations. Do not extrapolate them to authenticated production behavior, untested local containers or real LLM quality.

## Documentation and portfolio material

Start with [README.md](../README.md). [INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md) explains architecture, transactions, leakage prevention, evaluation, retrieval and tradeoffs. [DEMO.md](DEMO.md) contains a walkthrough. [RESUME.md](RESUME.md) contains these defensible bullets:

- Extended a React, Express and PostgreSQL emergency-operations platform with role-based sessions, transactional resource allocation, patient timelines, audit events and database-derived analytics.
- Built a reproducible scikit-learn/FastAPI decision-support pipeline on 6,000 synthetic scenarios, comparing four models and measuring 0.789 macro F1 on a 900-scenario held-out test set; added explicit human acceptance and documented overrides.
- Implemented cited operational-document retrieval with latent-semantic vectors, abstention and optional LLM synthesis, alongside API/Python integration tests, browser workflow checks and Docker/CI deployment configuration.
