# Deployment preparation and release gates

## Status

Dockerfiles, Compose, health checks, environment examples and native PostgreSQL CI are supplied. **No cloud deployment was performed.** No authorized host/account, domain or production database was provided, and Docker is unavailable in this workspace. A local browser test does not establish hosted readiness. Run the gates below on the intended host before declaring a production release.

## Deployment shape

One Express service serves the built React frontend and the API, keeping sessions and CSRF same-origin. PostgreSQL and FastAPI stay on the private Compose network. The API binds to host loopback port 5000 by default. Put a TLS reverse proxy in front of it. Choose a host that supports persistent Docker containers and a PostgreSQL volume; a static-site-only host cannot run the full application.

The Node image runs as `node`; Python runs as a non-root `careflow` user. The app waits for database readiness and applies migrations before starting. The AI service trains the documented synthetic model during image build. It may be temporarily unavailable without stopping ordinary patient/workflow operations.

## Local container validation

```bash
python scripts/setup_env.py
docker compose config --quiet
docker compose build
docker compose up -d
docker compose exec -e DEMO_SEED=true api npm run seed
docker compose exec api cat .demo-credentials
```

Test the complete application at http://localhost:5000. Restart the services and verify data persists. Keep the generated `.env` private. Do not use `docker compose down -v` when preserving data.

## Configure a real host

1. Transfer the repository to the authorized host. Install Docker/Compose and configure a domain with HTTPS at the reverse proxy.
2. Generate the private root `.env`. Set `NODE_ENV=production`, `APP_ORIGIN=https://your-domain`, a strong database password and `ML_SERVICE_TOKEN`. Generated passwords are URL-safe. Keep `BIND_ADDRESS=127.0.0.1` when the proxy runs on the same host.
3. Set `TRUST_PROXY_HOPS` to the actual number of trusted proxies. The usual single local proxy uses `1`; do not trust arbitrary forwarded headers.
4. Run `docker compose up --build -d`. Apply only migrations you have tested against a backup of existing data.
5. For a synthetic portfolio demo, explicitly run the seed command. For an empty staff workspace, create an administrator with `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in a private environment and `npm run admin:create` inside the API container. Do not put the password in committed command examples.
6. If using a managed PostgreSQL provider instead, set its private `DATABASE_URL`, `DB_SSL=true`, and trusted CA when required. Certificate verification is never disabled by the app. Keep provider connection parameters consistent with TLS verification.
7. Optional: provide a reachable private `OLLAMA_URL` and downloaded instruction model name, restart Python, and verify actual `mode:rag` responses and citations. Retrieval-only mode is functional without it.

## Reverse proxy example

The following Nginx location belongs inside an already-configured HTTPS virtual host. Certificate management is specific to your host.

```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Use the exact same public origin in the app configuration. Secure cookies intentionally will not work over HTTP in production. The app does not support arbitrary cross-site frontend/backend deployments without revisiting cookie and CSRF design.

## Required release checks

- Native PostgreSQL CI passes, including contested assignment tests.
- Both Docker images build and start successfully.
- `/api/health` and `/api/ready` return success; administrator service view/API confirms Python.
- Login/logout, session expiry and role permissions behave correctly over HTTPS.
- Complete intake-to-discharge workflow works; resource and patient states reconcile.
- Direct navigation and refresh work on all frontend routes.
- Analytics reconcile with stored records and UTC date boundaries.
- Real model inference and human review persist after service restart.
- Knowledge sources display; generation is only claimed if a real configured LLM was tested.
- Desktop/mobile visual checks show no clipped content or failed API calls.
- Database backup and restore have been exercised for the host.

## Operations and known limits

Rate limits are process-local; use a shared rate-limit store before running multiple API replicas. Sessions already live in PostgreSQL. Audit endpoints are append-only but a database administrator can alter records; this is not a tamper-proof ledger. Backups, alerting, centralized logs, staff deactivation, password recovery, data retention and production load testing remain beyond the current prototype. Never store real patient data in a public portfolio instance.

## What is needed to complete hosting

An authorized Docker-capable host (or service supporting this stack), its access method, and the desired domain/origin. After those are provided, the remaining work is deploying the prepared configuration and executing the hosted release checks. No paid service or public visibility has been enabled.
