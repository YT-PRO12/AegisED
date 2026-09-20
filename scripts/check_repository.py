"""Check local documentation, lockfile consistency and common secret patterns.

This bounded scan does not replace security review. It prints file/line/reason,
never candidate secret values. Git history is reviewed separately for releases.
"""
import json
from pathlib import Path
import re
import subprocess

from build_manifest import ROOT, deliverable_files

PLACEHOLDER = re.compile(rb"(?i)(?:change_me|your_|example|placeholder|replace[-_]with|process\.|os\.|\$|secrets\.|randomBytes)")
PATTERNS = {
    "private key": rb"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
    "GitHub token": rb"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b",
    "AWS access key": rb"\bAKIA[A-Z0-9]{16}\b",
    "service API key": rb"\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{30,}|rnd_[A-Za-z0-9]{20,})\b",
    "credential URL": rb"(?:postgres(?:ql)?|https?)://[^\s/:]+:([^\s/@]+)@",
    "literal secret assignment": rb"(?im)^[ \t]*(?:export[ \t]+)?(?:ML_SERVICE_TOKEN|DATABASE_PASSWORD|POSTGRES_PASSWORD|DB_PASSWORD|GITHUB_TOKEN|RENDER_API_KEY|SESSION_SECRET|DEMO_PASSWORD)[ \t]*[=:][ \t]*[\"']?([^\s\"'`]+)",
}


def secret_findings(data):
    if b"\0" in data:
        return []
    found = []
    for reason, pattern in PATTERNS.items():
        for match in re.finditer(pattern, data):
            value = match.group(1) if match.lastindex else match.group()
            if reason in {"credential URL", "literal secret assignment"} and PLACEHOLDER.search(value):
                continue
            found.append({"line": data[:match.start()].count(b"\n") + 1, "reason": reason})
    return found


def git(*args):
    return subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, text=True)


def main():
    issues = []
    links = 0
    files = list(deliverable_files())
    for file in files:
        relative = file.relative_to(ROOT).as_posix()
        data = file.read_bytes()
        issues.extend({"path": relative, **finding} for finding in secret_findings(data))
        if file.suffix == ".md":
            for match in re.finditer(r"!?\[[^\]]*\]\(([^)]+)\)", data.decode()):
                target = match.group(1).split("#")[0]
                if not target or re.match(r"[a-zA-Z]+:", target):
                    continue
                links += 1
                if not (file.parent / target).exists():
                    issues.append({"path": relative, "reason": "Missing documentation target", "target": target})
        if file.suffix in {".toml", ".yaml", ".yml"} and re.search(rb"(?i)railway|clever-celebration|brave-nourishment", data):
            issues.append({"path": relative, "reason": "Obsolete deployment configuration"})
    for part in ("", "backend", "frontend"):
        folder = ROOT / part
        package = json.loads((folder / "package.json").read_text())
        lock = json.loads((folder / "package-lock.json").read_text())
        for field in ("version", "dependencies", "devDependencies", "engines"):
            if package.get(field, {}) != lock["packages"][""].get(field, {}):
                issues.append({"path": part or ".", "reason": f"Lockfile mismatch: {field}"})
        if package["version"] != lock["version"]:
            issues.append({"path": part or ".", "reason": "Lockfile top-level version mismatch"})
    git_root = git("rev-parse", "--show-toplevel")
    git_available = git_root.returncode == 0 and Path(git_root.stdout.strip()).resolve() == ROOT
    if git_available:
        tracked = git("ls-files", "--cached").stdout.splitlines()
        for name in tracked:
            base = Path(name).name
            if base == ".demo-credentials" or base == ".env" or base.startswith(".env.") and base != ".env.example":
                issues.append({"path": name, "reason": "Sensitive local file tracked or staged"})
        for name in (".env", "backend/.env.production", "backend/.demo-credentials", "ml-service/.demo-credentials", "frontend/node_modules/check.js", ".venv/check", "frontend/dist/check", ".vscode/settings.json"):
            if git("check-ignore", "--no-index", "-q", name).returncode != 0:
                issues.append({"path": name, "reason": "Required ignore rule missing"})
    result = {"status": "failed" if issues else "passed", "filesScanned": len(files), "relativeLinksChecked": links, "gitTrackingChecked": git_available, "issues": issues}
    print(json.dumps(result, indent=2))
    if issues:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
