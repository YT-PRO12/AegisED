"""Generate local development secrets without overwriting an existing .env."""
from pathlib import Path
import secrets
root=Path(__file__).resolve().parents[1]
path=root/'.env'
if path.exists():
    raise SystemExit('An .env already exists; it was left unchanged.')
path.write_text('NODE_ENV=development\nAPP_ORIGIN=http://localhost:5000\nBIND_ADDRESS=127.0.0.1\nPORT=5000\n'+''.join(f'{key}={secrets.token_urlsafe(32)}\n' for key in ['POSTGRES_PASSWORD','ML_SERVICE_TOKEN','DEMO_PASSWORD'])+'TRUST_PROXY_HOPS=\nOLLAMA_URL=\nOLLAMA_MODEL=\n')
path.chmod(0o600)
print('Development configuration generated. Next: docker compose up --build -d')
