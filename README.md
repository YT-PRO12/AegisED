<div align="center">

# ðŸ¥ AegisED

### Intelligent Emergency Operations & Decision-Support Platform

**A production-deployed full-stack platform combining emergency operations, transaction-safe resource allocation, human-reviewed machine learning, analytics, role-based access control, auditability, and grounded knowledge retrieval.**

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-Open_AegisED-2ea44f?style=for-the-badge)](https://AegisED-app.onrender.com)

![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-ML_Service-009688?logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)
![Render](https://img.shields.io/badge/Deployment-Render-000000?logo=render&logoColor=white)

[Live Demo](https://AegisED-app.onrender.com) â€¢
[Architecture](#-system-architecture) â€¢
[ML System](#-human-in-the-loop-ml-decision-support) â€¢
[Security](#-security--access-control) â€¢
[Deployment](#-production-deployment)

</div>

---

> [!IMPORTANT]
> **Responsible AI:** AegisED is an engineering and educational demonstration. Its machine-learning subsystem is evaluated on synthetic scenarios and is **not clinically validated** or intended for autonomous diagnosis, triage, or medical decision-making.

## ðŸš€ Live Production Demo

### **[Launch AegisED â†’](https://AegisED-app.onrender.com)**

AegisED is deployed using **Render + Neon PostgreSQL**, with a separately deployed **FastAPI ML service**.

The production environment demonstrates the complete workflow from patient registration and emergency intake through human-reviewed decision support, doctor/bed allocation, treatment, discharge, analytics, and auditability.

> Free hosting may require a short cold start after a period of inactivity.

---

## âœ¨ Why AegisED?

Many portfolio healthcare applications stop at CRUD operations and static dashboards.

AegisED explores the engineering challenges behind a more complete operational system:

- ðŸš‘ End-to-end emergency workflow management
- ðŸ”’ Transaction-safe doctor and bed allocation
- ðŸ‘¥ Backend-enforced role-based access control
- ðŸ§  Human-in-the-loop ML decision support
- ðŸ” Explainable recommendation review and override
- ðŸ“š Grounded knowledge retrieval with source attribution
- ðŸ“Š Database-driven operational analytics
- ðŸ“ End-to-end audit logging
- ðŸ³ Containerized application architecture
- â˜ï¸ Multi-service cloud deployment

---

## ðŸ–¥ï¸ Product Preview

> Add `docs/screenshots/dashboard-desktop.png` using the screenshot instructions below.

<p align="center">
  <img src="docs/screenshots/dashboard-desktop.png"
       alt="AegisED emergency operations dashboard"
       width="100%" />
</p>

---

## ðŸ—ï¸ System Architecture

```text
                              USER
                               â”‚
                               â”‚ HTTPS
                               â–¼
                   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                   â”‚     React Frontend      â”‚
                   â”‚      Tailwind CSS       â”‚
                   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                â”‚
                                â–¼
                   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                   â”‚    Express API Layer    â”‚
                   â”‚                         â”‚
                   â”‚ Auth â€¢ RBAC â€¢ Audit     â”‚
                   â”‚ Validation â€¢ Workflows  â”‚
                   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚       â”‚
                â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                â–¼                                   â–¼
     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
     â”‚   Neon PostgreSQL   â”‚              â”‚   FastAPI ML        â”‚
     â”‚                     â”‚              â”‚   Service           â”‚
     â”‚ â€¢ Patients          â”‚              â”‚                     â”‚
     â”‚ â€¢ Emergency Cases   â”‚              â”‚ â€¢ scikit-learn      â”‚
     â”‚ â€¢ Doctors / Beds    â”‚              â”‚ â€¢ Prediction API    â”‚
     â”‚ â€¢ Users / Sessions  â”‚              â”‚ â€¢ Model metadata    â”‚
     â”‚ â€¢ Audit Logs        â”‚              â”‚ â€¢ Evaluation        â”‚
     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Why this architecture?

The browser does not communicate directly with PostgreSQL or the ML service.

**Express acts as the application gateway**, centralizing authentication, authorization, validation, auditing, workflow rules, and access to internal services.

This keeps security-sensitive and operational logic on the server rather than trusting the browser.

---

## ðŸš‘ End-to-End Emergency Workflow

```text
Patient Registration
        â”‚
        â–¼
Emergency Intake
        â”‚
        â–¼
ML Decision Support
        â”‚
        â–¼
Human Review
        â”‚
        â–¼
Doctor Assignment
        â”‚
        â–¼
Bed Assignment
        â”‚
        â–¼
Treatment Started
        â”‚
        â–¼
Treatment Completed
        â”‚
        â–¼
Patient Discharged
        â”‚
        â–¼
Doctor + Bed Released
```

The workflow is database-backed rather than simulated with frontend state.

---

## ðŸ”’ Transaction-Safe Resource Allocation

Doctor and bed assignment can create race conditions when multiple users operate concurrently.

AegisED protects these operations with PostgreSQL transactions and row-level locking.

```text
BEGIN
   â”‚
   â–¼
SELECT ... FOR UPDATE
   â”‚
   â–¼
Validate Resource Availability
   â”‚
   â–¼
Update Emergency Case
   â”‚
   â–¼
Update Doctor / Bed
   â”‚
   â–¼
Write Audit Event
   â”‚
   â–¼
COMMIT
```

If an operation fails, the transaction is rolled back so the emergency case and resource state remain consistent.

This prevents concurrent requests from successfully assigning the same resource.

---

## ðŸ§  Human-in-the-Loop ML Decision Support

AegisED's ML subsystem provides **assistive recommendations**, not autonomous decisions.

```text
Patient Features
       â”‚
       â–¼
ML Pipeline
       â”‚
       â–¼
Recommendation
       â”‚
       â–¼
Human Review
   â”Œâ”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”
   â–¼       â–¼        â–¼
 Accept  Review  Override
                    â”‚
                    â–¼
              Reason Required
                    â”‚
                    â–¼
                 Audit Log
```

### Model Evaluation

| Metric | Held-Out Synthetic Test Result |
|---|---:|
| Accuracy | **0.8167** |
| Macro F1 | **0.7893** |
| Weighted F1 | **0.8183** |
| Critical Recall | **0.7820** |
| ROC-AUC | **0.9389** |
| Log Loss | **0.4209** |

### Dataset

| Split | Synthetic Scenarios |
|---|---:|
| Training | 4,200 |
| Validation | 900 |
| Test | 900 |
| **Total** | **6,000** |

Four candidate approaches were compared, with the final model selected using validation performance before held-out test evaluation.

> These metrics demonstrate the ML engineering and evaluation pipeline on **synthetic engineering-demo data**. They do not establish clinical validity.

---

## ðŸ“š Grounded Knowledge Assistant

AegisED includes an operational knowledge retrieval subsystem designed to ground answers in indexed source material.

```text
Trusted Documents
       â”‚
       â–¼
Chunking + Metadata
       â”‚
       â–¼
TF-IDF
       â”‚
       â–¼
Truncated SVD
       â”‚
       â–¼
Semantic Representation
       â”‚
       â–¼
Cosine Similarity
       â”‚
       â–¼
Relevance Threshold
       â”‚
       â–¼
Retrieved Evidence
       â”‚
       â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º Source Attribution
       â”‚
       â–¼
Grounded Response

Insufficient Evidence â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º Abstain
```

### Reliability Features

- Evidence-grounded retrieval
- Source attribution
- Relevance thresholding
- Abstention when supporting evidence is insufficient
- Optional generation layer

---

## ðŸ” Security & Access Control

Authorization is enforced by the backend rather than relying only on hidden frontend controls.

### Security Controls

- Backend-enforced RBAC
- Server-side session management
- HttpOnly authentication cookies
- Password hashing
- Request validation
- Parameterized SQL
- Security headers
- Rate limiting
- Environment-based secret management
- Audit logging
- Transactional database operations

### Application Roles

| Role | Primary Scope |
|---|---|
| **Administrator** | System oversight and administration |
| **Doctor** | Clinical workflow interactions |
| **Nurse** | Emergency operational workflow |
| **Reception** | Patient registration and intake |

---

## ðŸ“Š Operational Analytics

AegisED derives analytics from application/database data rather than hard-coded dashboard values.

The analytics layer can surface operational information such as:

- Active emergency cases
- Priority distribution
- Bed utilization
- Doctor availability
- Workflow status
- Historical case activity
- Operational trends

---

## ðŸ“ Auditability

Important operational actions generate audit events.

Examples include:

```text
CASE_CREATED
DOCTOR_ASSIGNED
BED_ASSIGNED
TREATMENT_STARTED
TREATMENT_COMPLETED
PATIENT_DISCHARGED
AI_REVIEWED
```

This provides traceability across the emergency workflow.

---

## ðŸ§ª Testing & Validation

AegisED is validated across multiple layers instead of relying only on manual UI testing.

| Layer | Validation |
|---|---|
| Frontend | Lint + production build |
| Backend | API integration testing |
| ML / Retrieval | Python tests |
| Browser | End-to-end workflow validation |
| Responsive UI | Desktop, tablet and mobile |
| Database | Migration + transaction workflow |
| Authentication | Login + RBAC validation |
| AI | Decision-support integration |
| Knowledge | Citation + abstention checks |
| Production | Render + Neon integration |

The production workflow has been exercised from registration through discharge, including doctor and bed release.

---

## â˜ï¸ Production Deployment

```text
                          INTERNET
                             â”‚
                             â–¼
                    Render Web Service
                     React + Express
                      /           \
                     /             \
                    â–¼               â–¼
           Neon PostgreSQL     Render ML Service
                                FastAPI
                                   â”‚
                                   â–¼
                              scikit-learn
```

### Production Stack

| Component | Technology / Platform |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL on Neon |
| ML API | FastAPI |
| ML | scikit-learn |
| Web Hosting | Render |
| ML Hosting | Render |
| Containers | Docker |

### Live Application

**https://AegisED-app.onrender.com**

---

## ðŸ³ Local Development

### Prerequisites

- Node.js 22+
- Python 3.12+
- PostgreSQL
- Docker / Docker Compose (recommended)

Clone the repository:

```bash
git clone https://github.com/YT-PRO12/AegisED-AI.git
cd AegisED-AI
```

Environment templates are provided through `.env.example` files.

**Never commit real passwords, tokens, production database URLs, or generated demo credentials.**

Refer to the repository documentation for environment-specific setup and testing instructions.

---

## ðŸ“ Repository Structure

```text
AegisED-AI/
â”‚
â”œâ”€â”€ frontend/                 # React user interface
â”‚
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ src/                  # Express API and business logic
â”‚   â”œâ”€â”€ migrations/           # PostgreSQL migrations
â”‚   â”œâ”€â”€ scripts/              # Migration / administration tooling
â”‚   â””â”€â”€ tests/                # API tests
â”‚
â”œâ”€â”€ ml-service/               # FastAPI ML + retrieval service
â”‚
â”œâ”€â”€ docs/                     # Architecture/testing documentation
â”‚   â””â”€â”€ screenshots/          # Product screenshots
â”‚
â”œâ”€â”€ scripts/                  # Project-level tooling
â”‚
â”œâ”€â”€ Dockerfile
â”œâ”€â”€ docker-compose.yml
â””â”€â”€ README.md
```

---

## âš™ï¸ Engineering Decisions

### Why PostgreSQL?

The application contains strongly related entitiesâ€”patients, emergency cases, doctors, beds, users and audit recordsâ€”and requires transactional consistency during resource allocation.

### Why keep Express between React and ML?

It prevents the browser from becoming responsible for internal-service authentication and keeps authorization, validation and auditing centralized.

### Why human-reviewed ML?

Decision support is more defensible when recommendations remain reviewable and overridable rather than being treated as authoritative decisions.

### Why not add Kafka, Redis or Kubernetes?

The current workload does not justify their operational complexity. The architecture favors technologies that solve demonstrated requirements rather than adding infrastructure solely for appearance.

---

## âš ï¸ Scope & Limitations

AegisED is a portfolio and engineering demonstration.

- Synthetic data is used for ML evaluation and demo workflows.
- The ML system is not clinically validated.
- The platform must not be used for real medical decision-making.
- No real patient PII should be entered into the public demo.
- Free-tier cloud services may experience cold starts.
- Production healthcare deployment would require substantially stronger regulatory, privacy, security, reliability and clinical validation work.

---

## ðŸ›£ï¸ Future Engineering Work

Potential extensions include:

- More comprehensive integration and load testing
- Production-grade observability
- Expanded model monitoring
- Model/data drift detection
- Stronger deployment automation
- Broader trusted knowledge corpora
- Additional operational analytics
- Formal privacy and compliance architecture

---

## ðŸ‘¨â€ðŸ’» Author

**Yatharth Goyal**

B.Tech â€” Information Technology

[GitHub](https://github.com/YT-PRO12)

---

<div align="center">

### Built to explore full-stack engineering, reliable AI integration, database concurrency and responsible decision support.

**[ðŸš€ Launch AegisED](https://AegisED-app.onrender.com)**

</div>

