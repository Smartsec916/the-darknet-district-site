"""Check a VOID//RUNNER private draft export on your own computer, without contacting any service.

Usage: python tools/verify-draft-export.py void-runner-drafts-<date>.json

Exits 0 when the file's format, structure and SHA-256 digest are intact (missing revisions are listed as
problems), and 1 when the file was changed, truncated or is not a draft export. Nothing is imported or uploaded.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import void_runner_drafts as drafts  # noqa: E402


def main(argv):
    if len(argv) != 2:
        print(__doc__.strip())
        return 2
    try:
        data = json.loads(Path(argv[1]).read_text(encoding='utf-8'))
        report = drafts.verify_export(data)
    except (OSError, ValueError, drafts.DraftError) as error:
        print('NOT VERIFIED:', getattr(error, 'message', str(error)))
        return 1
    print(f"Verified: {report['drafts']} drafts, {report['revisions']} revisions, source inventory "
          f"{data['sourceInventoryRevision']}, exported {data['exportedAt']} (SHA-256 {report['digest']}).")
    for problem in report['problems']:
        print('Problem:', problem)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
