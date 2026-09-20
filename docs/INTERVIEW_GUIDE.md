# Explain CareFlow in an interview

## A 45-second introduction

“CareFlow is an educational emergency-operations prototype. I extended my React, Express and PostgreSQL application with validated workflows, role-based access and auditability. Assigning a doctor or bed is a transactional operation; discharge releases both resources atomically. SQL supplies the analytics. A separate Python service serves a reproducible model trained only on synthetic scenarios, and a human must review its suggestion before it changes priority. A knowledge assistant retrieves project documentation with sources and optionally uses a configured language model.”

Use this description only after studying and running the code. Be transparent about AI assistance and distinguish work you can explain from work you have not yet studied.

## Engineering decisions

| Decision | What/why/how | Alternative and scaling limit |
|---|---|---|
| Preserve JavaScript/React/Express | Existing working skills and app; no rewrite needed | TypeScript can later add static contracts; it does not replace validation |
| PostgreSQL as source of truth | Related patients/resources and atomic workflow changes | A document database adds no benefit for these relational invariants |
| Thin controllers + shared services | Central validation, transactions, audit and parameterized CRUD | A generic service can become opaque; keep domain-specific transitions explicit |
| Server-side sessions | Random opaque token, hashed database lookup, easy logout/revocation | JWT avoids a lookup but complicates immediate revocation; cookies still need CSRF design |
| Backend RBAC + ownership | Routes enforce roles; doctor records are scoped to a linked doctor ID | Hiding a button alone never secures an endpoint |
| Separate Python process | Uses mature scikit-learn/FastAPI tooling; Express remains gateway | Adds network failure modes; use timeouts and independent core workflows |
| Small local vector index | Enough for a short operational corpus; persistent metadata and vectors | A large corpus requires a scalable vector index, content governance and better retrieval evaluation |
| Same-origin deployment | Express serves React, reducing session/CORS complexity | Separate frontend hosting is possible but requires deliberate cookie/origin design |

## React questions

**How does database data reach the screen?** The component calls `useResource`; the API service makes a credentialed request; Express validates/authenticates, queries PostgreSQL and returns JSON; state changes cause React to render. The dashboard queue and bed panel now receive database results instead of importing mock arrays.

**Why AbortController?** Changing a query or leaving a page aborts the stale request so late results cannot overwrite a newer view. Resource state and refresh callbacks are shared through a small custom hook.

**Why lazy routes?** Analytics and Recharts need not be in the initial login bundle. Route-level dynamic imports defer that code. Verify actual bundle output rather than claiming an unmeasured speed improvement.

**How is modal accessibility handled?** Native `dialog.showModal()` supplies focus management and background inertness; visible labels, accessible names, Escape/cancel behavior and focus styles remain necessary. Responsive tables scroll inside their panel.

## Express, REST and security

**Why POST for assignment?** Assignment is a domain action affecting multiple resources, not a replacement of one representation. The server checks the expected state and returns a conflict if repeated. Retrying a completed transition does not perform it twice.

**Why validate on the server if the form has required fields?** A client can bypass the UI. Zod rejects invalid IDs, unknown fields, unsupported status values and oversized input before a query runs.

**What is CSRF protection here?** The session cookie identifies the user; a separate in-memory request token must be sent in a custom header for mutations. SameSite and origin checks add protection. XSS can still act as a user, so rendering untrusted text safely and CSP are important.

**What are password security choices?** Built-in scrypt uses a random salt and explicit work factor. Constant-time verification compares derived keys. Login is rate-limited. Passwords and raw session tokens are never stored in database columns or application logs.

## Transactions and concurrency

**Why can a single-threaded Node server have a race?** While one request awaits SQL, another request can execute. Multiple server processes can also act concurrently. JavaScript's event loop does not serialize database state changes.

**What does FOR UPDATE do?** It locks a selected row until transaction completion. Two requests targeting the same doctor cannot both validate its pre-assignment state on native PostgreSQL: the second waits, then sees the committed Busy state. [PostgreSQL locking reference](https://www.postgresql.org/docs/current/explicit-locking.html).

**Why both locks and unique indexes?** Locks coordinate application operations. Partial unique indexes are a final database guard against two active cases sharing a resource, including an accidental new code path that forgets a check.

**What if the last query fails?** The transaction rolls back the case, resource, patient and audit changes together. The connection is released in `finally`. A successful audit insert in a failed transaction does not survive.

**What is the lock order?** Case first, then resource, then patient; prediction review also locks the case before the prediction. Consistent ordering reduces deadlocks. Deadlock/conflict errors return a retriable conflict; no automatic repeat of a clinical-like decision is attempted.

**Which indexes exist and why?** Active-resource uniqueness, arrival-time range scans, patient-history lookups, queue filtering and recent audit/prediction access. Small seed tables may correctly use a sequential scan; an index is not automatically faster.

## ML and data science

**Why did logistic regression win?** It had the best validation macro F1 among the declared candidates. We do not choose the largest model simply because it sounds advanced. Explain the actual comparison in `reports/metrics.json`.

**What is data leakage?** Information from validation/test enters training decisions or preprocessing. Imputation/scaling fit only on training rows inside a pipeline. Model selection uses validation, and the test report is generated after selection. [scikit-learn guidance](https://scikit-learn.org/stable/common_pitfalls.html).

**Why macro F1?** It gives each class equal weight, making weak performance on the smaller Critical class visible. Precision asks how many Critical predictions were Critical simulation labels; recall asks how many Critical simulation labels were found. Report per-class counts alongside aggregate scores.

**What is the biggest limitation?** The labels and inputs come from an invented generator, so the test is simulator recovery. It says nothing about medical triage validity. State that before mentioning 0.789 macro F1 or 0.782 Critical recall.

**Are the scores confidence?** No clinical confidence claim is made. The model produces uncalibrated class scores; calibration would require an appropriate held-out dataset and clinical validation would require a much broader study.

**How are predictions explained?** Local sensitivity replaces one feature with the training median and observes the selected class score change. It is an explicit approximation, not a causal claim or SHAP. Validation permutation importance supplies a separate global experiment.

## Retrieval and generation

**Is default local mode RAG?** It is vector retrieval with source excerpts. Real retrieval-augmented generation is an optional code path that calls a configured Ollama model with retrieved context. Do not claim the local excerpts were generated by an LLM.

**What are embeddings here?** TF-IDF is projected through truncated SVD into a small dense latent-semantic space. Query/document cosine similarity ranks chunks. This is not a pretrained transformer encoder; paraphrase generalization is limited.

**How are hallucinations reduced?** Restrict the corpus to operational material, require citations and exact evidence quotes, abstain when context is missing, and fall back when generation fails. Quote matching cannot establish entailment and does not eliminate hallucination.

**What was evaluated?** Ten author-written operational queries, hit@3 and MRR@3, source metadata, no-context behavior and provider error handling. The small development set does not prove general retrieval quality.

## Deployment and scaling

**What happens if Python is down?** Express returns an explicit AI-unavailable response; patient management and workflows still operate. There is no fabricated prediction.

**How would you scale?** Measure first. Tune slow SQL with EXPLAIN ANALYZE, add cursor pagination for large histories, move rate limits into a shared store, add observability, and scale the API/AI independently. Keep sessions shared and preserve atomic workflows.

**Where is it deployed and what was checked?** The portfolio application is on Render, backed by Neon PostgreSQL and a separate Render FastAPI service according to the operator. GitHub CI for the inspected commit passed native PostgreSQL and browser checks. The release review observed the HTTPS login page, health/readiness and unauthenticated access protection. Authenticated production flows, provider settings, local Docker execution and real LLM generation were not independently revalidated. Read `docs/RELEASE_READINESS.md` for the dated boundaries.

## Suggested study order

1. Trace a Patients GET from React through the controller and back.
2. Walk through `emergencyWorkflowController.js` and a failed transition.
3. Read the migration's checks and partial unique indexes.
4. Trace login, CSRF and role/doctor-ownership enforcement.
5. Run `train.py` and explain every metric from the saved report.
6. Ask the knowledge assistant a supported and unsupported question.
7. Run the full workflow tests and explain what PGlite cannot validate.
