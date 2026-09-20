"""Check the delivered archive's file hashes using Python's standard library."""
from hashlib import sha256
import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-only", action="store_true", help="Verify Git-delivered files; skip the four explicitly declared portable artifacts.")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / "docs/package-manifest.json").read_text())
    failures = []
    portable = {
        "ml-service/data/synthetic-triage.csv", "ml-service/model/triage.joblib",
        "ml-service/knowledge/index/lsa.joblib", "ml-service/knowledge/index/chunks.json",
    }
    checked = 0
    for entry in manifest["files"]:
        if args.source_only and entry["path"] in portable:
            continue
        checked += 1
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
    print(f"Verified {checked} {'source' if args.source_only else 'delivered'} files. All hashes match.")
    print("This verifies package integrity, not runtime or deployment readiness.")


if __name__ == "__main__":
    main()
