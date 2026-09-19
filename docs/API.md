# API reference

All paths start with `/api`. Collections return `{success:true,data:[...],count,pagination}`. Individual responses return `{success:true,data:{...}}`. Errors return `{success:false,message,requestId}`. Use the session cookie and the `csrfToken` returned by login/me as `X-CSRF-Token` on every authenticated mutation.

## Session and staff

| Method/path | Body | Access |
|---|---|---|
| POST `/auth/login` | `{email,password}` | Public, rate limited |
| GET `/auth/me` | — | Signed in |
| POST `/auth/logout` | — | Signed in |
| POST `/auth/password` | `{currentPassword,newPassword}` | Signed in; revokes all sessions |
| GET `/users` | — | ADMIN |
| POST `/users` | `{name,email,password,role,doctorId?}` | ADMIN; DOCTOR requires a linked doctor |

## Resources (original paths preserved)

All four support GET collection, GET `/:id`, POST collection, PUT/PATCH `/:id` and DELETE `/:id`. Authorization differs; see README role matrix. DELETE is administrator-only and protects history/resources.

| Collection | Create/update fields |
|---|---|
| `/patients` | `name`, `age` (0–120), `priority` |
| `/doctors` | `name`, `specialization`, optional `status` (Available/Off Duty) |
| `/beds` | `bedNumber`, optional Available/Cleaning `status`, optional `patientId:null` |
| `/emergency-cases` | `patientId` on creation, `symptoms`, `priority`, `recommendation`, optional `vitals` |

Updates are partial; unknown fields are rejected. Patient and resource status cannot be used to bypass workflow. Assigned resources may be renamed but not made available. Clearing `patientId:null` works for an orphaned legacy bed assignment; an active case must release its bed through discharge.

Collection parameters: `page`, `limit` (1–100), `search`, `status`, `priority`, `sort`, `order`. Sort uses an allowlist. `status=Active` is supported on cases. Case lists accept `patientId`. Doctor accounts receive only assigned patient/case records. Patient detail includes accessible recent cases, predictions and activity.

## Workflow

POST `/emergency-cases/:id/assign-doctor` `{doctorId}`; POST `/assign-bed` `{bedId}`; POST `/start-treatment`; POST `/complete-treatment`; POST `/discharge`. All are under the same case prefix. Nurses/admins allocate resources; assigned doctors/admins perform treatment and discharge. State conflicts return 409. GET `/emergency-cases/:id/recommendations` returns rule-based operational suggestions with explanations.

## Intelligence

POST `/ai/predict`:

```json
{"caseId":241,"vitals":{"heartRate":100,"systolicBP":120,"respiratoryRate":20,"temperature":37.1,"oxygenSaturation":96}}
```

Age is read from the patient, not trusted from the request. Returns a persisted prediction including `result.predictedPriority`, `classScores`, input sensitivity, disclaimer and model version. GET `/ai/predictions` returns the latest accessible predictions. GET `/ai/model` returns measured metrics and methodology.

POST `/ai/predictions/:id/review`: `{action:"ACCEPT"}`, `{action:"REVIEW"}`, or `{action:"OVERRIDE",priority:"Stable",reason:"Human review rationale"}`.

POST `/knowledge`: `{question:"How is a bed assigned?"}`. Returns `mode`, `answer`, `sources`, retriever and limitations. Local source files are operational documentation, not medical advice.

## Aggregation and health

GET `/dashboard/stats`; GET `/analytics?days=30` or `?from=2026-09-01&to=2026-09-17`; GET `/audit?page=1&action=DISCHARGED` (ADMIN); GET `/services` (ADMIN). `/health` checks the API process, `/ready` checks PostgreSQL. The legacy `/db-test` route is administrator-only.

## Status codes

400 invalid payload/ID; 401 absent/expired session; 403 role/ownership/request-token restriction; 404 missing/inaccessible record; 409 workflow/foreign-key/uniqueness conflict; 429 rate limit; 503 unavailable AI dependency. Production errors omit stack traces and database internals.
