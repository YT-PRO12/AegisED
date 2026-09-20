# Start AegisED locally

Use a fresh extracted folder for this version, so your original folder remains available. Keep any private `.env` and your original PostgreSQL database backup outside the archive. The upgrade preserves your React/Express/PostgreSQL stack and endpoint paths.

## Fast route: Docker Desktop

From the extracted project root in PowerShell or a terminal:

```powershell
python scripts/setup_env.py
docker compose up --build -d
docker compose exec -e DEMO_SEED=true api npm run seed
docker compose exec api cat .demo-credentials
```

Visit **http://localhost:5000**. Sign in with `admin@AegisED.demo` and the generated password printed by the last command. The other generated accounts share this synthetic-demo password. Do not publish the credentials or `.env`. Change passwords before sharing a deployment.

Check status with `docker compose ps` and `docker compose logs --tail=80 api ml`. Stop with `docker compose down`; the database volume remains. Starting again does not duplicate seed data. The model is trained during the Python image build, so the first build needs more time than later startups. Compose execution was not available in the release-review workspace. The existing Render production deployment is documented separately in DEPLOYMENT.md.

## Without Docker: your existing Windows tools

You need Node.js 22+ (your Node 24 is suitable), Python 3.12, and PostgreSQL. Run commands from the extracted `AegisED-AI` folder.

### 1. Install dependencies

```powershell
npm ci
npm run install:apps
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r ml-service/requirements.txt
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env`. Set `DATABASE_URL` to your local PostgreSQL connection. Use a **new database** for the synthetic demonstration, for example `AegisED_portfolio`; do not seed into your original populated database. Create it once through pgAdmin's Query Tool (connected to the `postgres` maintenance database):

```sql
CREATE DATABASE AegisED_portfolio;
```

The URL format is `postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/AegisED_portfolio`. URL-encode special characters in a password, or remove `DATABASE_URL` and use the original separate `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`, `DB_PORT` environment variables. Do not commit this file.

Keep `APP_ORIGIN=http://localhost:5173` for Vite development and `NODE_ENV=development`. The default AI address is `http://127.0.0.1:8000`. Empty service tokens work only for a local development setup; use the same nonempty token in Express and Python for a shared or production environment.

### 2. Migrate and load the synthetic demonstration

```powershell
cd backend
npm run migrate
$env:DEMO_SEED="true"
npm run seed
Get-Content .demo-credentials
cd ..
```

Seeding generates its own password if `DEMO_PASSWORD` is unset. Record the credentials privately. Re-running the seed leaves data unchanged.

### 3. Reuse the included model and start Python

In terminal 1, from the project root:

```powershell
cd ml-service
# Fresh Git checkout only, when generated artifacts are absent:
# ..\.venv\Scripts\python.exe train.py
# ..\.venv\Scripts\python.exe evaluate_retrieval.py
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

If you set `ML_SERVICE_TOKEN` in the backend configuration, set `$env:ML_SERVICE_TOKEN` to the same value in this terminal before startup. Optional `OLLAMA_URL` and `OLLAMA_MODEL` also belong in this terminal's environment; the Python service does not automatically load `.env` files.

### 4. Start Express and Vite

Terminal 2, from project root:

```powershell
cd backend
npm run dev
```

Terminal 3, from project root:

```powershell
cd frontend
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to Express at port 5000; the browser does not call Python directly.

### 5. Verify

Sign in, register a synthetic patient, create a case, assign a doctor and bed, start/complete treatment and discharge. Confirm the resources become available. Generate an adult synthetic estimate and record a review. Ask the knowledge assistant how to allocate a bed and inspect its sources.

## Production bundle locally

```powershell
npm run build
```

Set backend `APP_ORIGIN=http://localhost:5000`, keep `NODE_ENV=development` for local HTTP, restart Express, and visit **http://localhost:5000**. Express serves the built React application and supports direct-route refresh. Setting `NODE_ENV=production` requires an HTTPS origin and a private ML token.

## Upgrading the original populated database

Back it up first with pgAdmin or `pg_dump`. Run the migration against a restored copy before the original. Migration 001 creates missing tables and adds fields/constraints; it retains IDs and only backfills arrival time from existing creation time. Historical stage times remain unknown if they were not recorded. Conflicting legacy assignments or unsupported status values cause a transaction rollback. Resolve those records deliberately before retrying. Never replace your database with the synthetic seed.

