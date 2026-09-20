# Running AegisED

## Startup and health
Start PostgreSQL, apply the versioned migrations, create an administrator or explicitly load synthetic seed data, train the model, and start the Python and Express services. Express is the browser's single API gateway. The frontend uses a relative API path. The API health route checks the process; the ready route checks database connectivity.

## AI service unavailable
If the Python service is offline, prediction and knowledge requests return an explicit unavailable response. Existing patient management and the emergency workflow remain usable. Restore the configured ML service address and service token, check the model artifact exists, and verify the Python health endpoint. No fake prediction is substituted.

## Deployment requirements
The container stack requires a PostgreSQL password, a private AI service token and the application origin. Production requires an HTTPS origin behind a correctly configured reverse proxy. The database and Python service should be private. Take a database backup before migrating an existing installation. See the repository deployment guide for exact commands and verification steps.

