"""Check the delivered archive's file hashes using Python's standard library."""
from hashlib import sha256
import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / "docs/package-manifest.json").read_text())
    failures = []
    for entry in manifest["files"]:
        path = (root / entry["path"]).resolve()
        if not path.is_relative_to(root):
            failures.append("Invalid manifest path")
        elif not path.is_file():
            failures.append(f"Missing: {entry['path']}")
        else:
            data = path.read_bytes()
            if len(data) != entry["bytes"] or sha256(data).hexdigest() != entry["sha256"]:
                failures.append(f"Changed: {entry['path']}")
    if failures:
        print("\n".join(failures))
        raise SystemExit(1)
    print(f"Verified {len(manifest['files'])} delivered files. All hashes match.")
    print("This verifies package integrity, not runtime or deployment readiness.")


if __name__ == "__main__":
    main()
