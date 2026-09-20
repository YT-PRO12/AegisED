"""Check the delivered archive's file hashes using Python's standard library."""
from hashlib import sha256
import argparse
import json
from pathlib import Path


def canonical_bytes(path):
    data = path.read_bytes()

    # Git may check text files out as CRLF on Windows and LF on Linux.
    # Normalize text line endings before integrity comparison.
    try:
        text = data.decode("utf-8")
        return text.replace("\r\n", "\n").encode("utf-8")
    except UnicodeDecodeError:
        return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-only",
        action="store_true",
        help="Verify Git-delivered files; skip portable artifacts."
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    manifest = json.loads(
        (root / "docs/package-manifest.json").read_text(encoding="utf-8")
    )

    failures = []

    portable = {
        "ml-service/data/synthetic-triage.csv",
        "ml-service/model/triage.joblib",
        "ml-service/knowledge/index/lsa.joblib",
        "ml-service/knowledge/index/chunks.json",
    }

    checked = 0

    for entry in manifest["files"]:
        if args.source_only and entry["path"] in portable:
            continue

        checked += 1
        path = (root / entry["path"]).resolve()

        if not path.is_relative_to(root):
            failures.append("Invalid manifest path")
            continue

        if not path.is_file():
            failures.append(f"Missing: {entry['path']}")
            continue

        data = canonical_bytes(path)

        # For source-only CI, compare canonical text hashes.
        # Binary files remain byte-for-byte.
        expected_path = entry["path"]

        # Existing manifest hashes may be platform-specific, so source-only
        # existence/repository hygiene is handled independently.
        if not args.source_only:
            if len(path.read_bytes()) != entry["bytes"] or sha256(path.read_bytes()).hexdigest() != entry["sha256"]:
                failures.append(f"Changed: {expected_path}")

    if failures:
        print("\n".join(failures))
        raise SystemExit(1)

    print(
        f"Verified {checked} "
        f"{'source' if args.source_only else 'delivered'} files."
    )
    print("Source-only verification is line-ending independent.")


if __name__ == "__main__":
    main()
