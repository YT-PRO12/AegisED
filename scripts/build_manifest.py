"""Refresh the portable package manifest after intentional source changes.

Run verification before refreshing when reviewing an existing archive. This
creates hashes; it does not certify tests or release readiness.
"""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_DIRS = {".git", "node_modules", "dist", "build", "__pycache__", ".pytest_cache", ".venv", "venv", ".cache", "coverage", "playwright-report", "test-results", ".vscode", ".idea"}


def deliverable_files():
    for file in sorted(ROOT.rglob("*")):
        relative = file.relative_to(ROOT)
        if not file.is_file() or set(relative.parts) & EXCLUDED_DIRS:
            continue
        if file.name in {"package-manifest.json", ".demo-credentials", ".DS_Store", "Thumbs.db", "test-failure.png"}:
            continue
        if file.name == ".env" or file.name.startswith(".env.") and file.name != ".env.example":
            continue
        if file.suffix in {".log", ".pyc", ".pyo", ".tmp", ".temp", ".swp", ".swo"}:
            continue
        if file.is_symlink():
            raise SystemExit(f"Review symlink before packaging: {relative}")
        yield file


def main():
    files = [{"path": f.relative_to(ROOT).as_posix(), "bytes": f.stat().st_size, "sha256": sha256(f.read_bytes()).hexdigest()} for f in deliverable_files()]
    manifest = {"project": "AegisED", "version": "1.0.0", "createdAt": datetime.now(timezone.utc).isoformat(), "scope": "Delivered file bytes, excluding this manifest; not a signature or runtime certification. Source-only verification explicitly skips four Git-ignored portable artifacts.", "files": files}
    (ROOT / "docs/package-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Recorded {len(files)} files. Run scripts/verify_package.py next.")


if __name__ == "__main__":
    main()

