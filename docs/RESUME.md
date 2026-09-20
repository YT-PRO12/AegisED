# CareFlow AI — resume material

Use these only after you can explain and reproduce the implementation. The project does not guarantee hiring or shortlisting. Avoid presenting the synthetic experiment as a clinically useful model or implying that portfolio hosting is clinical use.

- Extended a React, Express and PostgreSQL emergency-operations platform with role-based sessions, transactional resource allocation, patient timelines, audit events and database-derived analytics.
- Built a reproducible scikit-learn/FastAPI decision-support pipeline on 6,000 synthetic scenarios, comparing four models and measuring 0.789 macro F1 on a 900-scenario held-out test set; added explicit human acceptance and documented overrides.
- Implemented cited operational-document retrieval with latent-semantic vectors, abstention and optional LLM synthesis, alongside API/Python integration tests, browser workflow checks and Docker/CI deployment configuration.

**Short project description:** CareFlow AI — educational emergency operations and auditable AI decision support. React, Node.js, Express, PostgreSQL, Python, FastAPI, scikit-learn.

**Measured claims and boundaries:** Dataset size, split counts and metrics are reproducible in `ml-service/train.py` and `reports/metrics.json`. The portfolio application is hosted on [Render](https://careflow-app.onrender.com). No real-user adoption, production scale, clinical accuracy or response-time improvement is claimed. Historical tests are recorded in `docs/VERIFICATION.md`; current release and production-check evidence is in `docs/RELEASE_READINESS.md`.
