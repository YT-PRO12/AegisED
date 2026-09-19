# Access and accountability

## Roles and permissions
Administrators manage users, doctors, beds, analytics and audit logs. Nurses can register patients, create cases, allocate resources, edit permitted case information and request decision support. Reception handles registration and intake. Doctor accounts see patients and cases assigned to their linked doctor, review predictions, and perform treatment actions. Only administrators and assigned doctors can accept or override predictions.

## Login and sessions
CareFlow uses email and password login with server-side sessions. The browser receives an HTTP-only session cookie and a separate request token. Production cookies are Secure and SameSite Strict. Logout deletes the session. Password changes revoke all the user's sessions. An administrator creates staff accounts; public self-registration is not enabled.

## Audit trail
Audit records capture the actor, action, entity identifier and timestamp. Patient registration, case changes, resource assignments, treatment, discharge, predictions, prediction reviews, user creation and logins are recorded. The audit interface is restricted to administrators. Patient detail views show the workflow events for cases the viewer may access.
