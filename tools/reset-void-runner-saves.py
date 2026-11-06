#!/usr/bin/env python3
"""Retire VOID//RUNNER cloud campaigns from before The Darknet District reset (docs/void-runner/SAVE-RESET.md).

NOTHING IS CHANGED unless you pass --apply AND a backup file AND type the confirmation phrase. The default is a read-only report.

Scope, exactly:
  - Collection  vr_players  (one document per account, named SHA-256 of the Firebase UID).
  - Only documents whose `save` is a campaign WITHOUT the campaign epoch (made before the reset). Current campaigns are never touched.
  - Only the fields  save  and  savedAt  are removed, and  revision  is raised by one so other devices refresh.
  Nothing else is read for change or written: not accounts or sign-in records, not handles (bp_handles, bp_profiles), not purchases
  (vr_orders, vr_checkouts, vr_payment_blocks), not pending payments (vr_players/*/pending), not editor content (vr_content_*),
  not balance settings (vr_config), not admin lists (an environment variable), not Iris or any other database.

Credentials: run it where Firebase Admin credentials are already available to you (GOOGLE_APPLICATION_CREDENTIALS). The repository never holds them.

  python tools/reset-void-runner-saves.py                                   # report only
  python tools/reset-void-runner-saves.py --apply --backup-file saves.json   # after approval
  python tools/reset-void-runner-saves.py --restore saves.json --apply       # put the backed-up saves back
"""
import argparse
import json
import os
import stat
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from void_runner_api import is_current_save  # noqa: E402  (the same rule the live API uses)

PROJECT = 'the-darknet-district-71873'
COLLECTION = 'vr_players'
FIELDS = ('save', 'savedAt')
PHRASE = 'RETIRE OLD VOID RUNNER SAVES'


def summarize(save):
    """A few facts about a save, enough to recognise it, nothing personal."""
    save = save if isinstance(save, dict) else {}
    return {'quest': save.get('quest'), 'location': save.get('location'), 'credits': save.get('credits'), 'completed': save.get('completed'), 'version': save.get('version')}


def when(value):
    return datetime.fromtimestamp(value, timezone.utc).isoformat() if isinstance(value, (int, float)) and not isinstance(value, bool) and 0 < value < 4e12 else None


def plan(db):
    """Read-only: classify every player document. Returns (report, targets)."""
    total = with_save = current = 0
    targets = []
    for snapshot in db.collection(COLLECTION).stream():
        data = snapshot.to_dict() or {}
        total += 1
        if data.get('save') is None:
            continue
        with_save += 1
        if is_current_save(data['save']):
            current += 1
            continue
        targets.append({'id': snapshot.id, 'revision': data.get('revision', 0), 'savedAt': data.get('savedAt'), 'save': data['save'], 'extraFields': sorted(k for k in data if k not in ('save', 'savedAt', 'revision'))})
    report = {'project': PROJECT, 'collection': COLLECTION, 'documents': total, 'withASave': with_save, 'currentCampaigns': current, 'oldCampaignsToRetire': len(targets),
              'fieldsRemoved': list(FIELDS), 'fieldChanged': 'revision (+1)',
              'targets': [{'id': t['id'], 'revision': t['revision'], 'savedAt': when(t['savedAt']), 'summary': summarize(t['save']), 'otherFieldsLeftAlone': t['extraFields']} for t in targets]}
    return report, targets


def write_backup(path, targets):
    """Full copy of every field about to be removed. Owner-only permissions."""
    body = {'project': PROJECT, 'collection': COLLECTION, 'createdAt': int(time.time()), 'documents': [{'id': t['id'], 'revision': t['revision'], 'save': t['save'], 'savedAt': t['savedAt']} for t in targets]}
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, stat.S_IRUSR | stat.S_IWUSR)
    with os.fdopen(fd, 'w') as handle:
        json.dump(body, handle, indent=2)
    return len(targets)


def retire(db, firestore, targets):
    """Remove the two fields from each target, one transaction per document, only if it is still exactly what was reported."""
    changed = skipped = 0
    for target in targets:
        ref = db.collection(COLLECTION).document(target['id'])

        @firestore.transactional
        def commit(transaction, ref=ref, target=target):
            current = ref.get(transaction=transaction).to_dict() or {}
            if current.get('save') != target['save'] or current.get('revision', 0) != target['revision'] or is_current_save(current.get('save')):
                return False  # changed since the report (for example the player saved a new campaign): leave it alone
            transaction.update(ref, {'save': firestore.DELETE_FIELD, 'savedAt': firestore.DELETE_FIELD, 'revision': target['revision'] + 1})
            return True
        if commit(db.transaction()):
            changed += 1
        else:
            skipped += 1
    return changed, skipped


def restore(db, firestore, path):
    """Put backed-up saves back, but only into documents that have no save now (never over a new campaign)."""
    body = json.loads(Path(path).read_text())
    if body.get('project') != PROJECT or body.get('collection') != COLLECTION:
        raise SystemExit('This backup is not for ' + PROJECT + '/' + COLLECTION + '.')
    restored = skipped = 0
    for entry in body['documents']:
        ref = db.collection(COLLECTION).document(entry['id'])

        @firestore.transactional
        def commit(transaction, ref=ref, entry=entry):
            current = ref.get(transaction=transaction).to_dict() or {}
            if current.get('save') is not None:
                return False
            transaction.set(ref, {'save': entry['save'], 'savedAt': entry['savedAt'], 'revision': current.get('revision', 0) + 1}, merge=True)
            return True
        if commit(db.transaction()):
            restored += 1
        else:
            skipped += 1
    return restored, skipped


def connect():
    import firebase_admin
    from firebase_admin import firestore
    app = firebase_admin.initialize_app()
    return firestore.client(app), firestore


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    parser.add_argument('--apply', action='store_true', help='make the change (default is a read-only report)')
    parser.add_argument('--backup-file', help='where to write the backup first (required with --apply); must not exist')
    parser.add_argument('--restore', metavar='BACKUP', help='put a backup back (with --apply)')
    parser.add_argument('--project', default=PROJECT, help='must equal ' + PROJECT)
    args = parser.parse_args(argv)
    if args.project != PROJECT:
        raise SystemExit('Refusing to run against ' + args.project + '. This tool is for ' + PROJECT + ' only.')
    if args.apply and not args.restore and not args.backup_file:
        raise SystemExit('--apply needs --backup-file so nothing is lost.')
    db, firestore = connect()
    if args.restore:
        if not args.apply:
            print(json.dumps({'wouldRestoreFrom': args.restore, 'documents': len(json.loads(Path(args.restore).read_text())['documents'])}, indent=2))
            return 0
        restored, skipped = restore(db, firestore, args.restore)
        print(json.dumps({'restored': restored, 'skippedBecauseTheyHaveASaveNow': skipped}, indent=2))
        return 0
    report, targets = plan(db)
    print(json.dumps(report, indent=2))
    if not args.apply:
        print('\nREPORT ONLY. Nothing was changed. Re-run with --apply --backup-file <new file> after approval.', file=sys.stderr)
        return 0
    if not targets:
        print('Nothing to retire.', file=sys.stderr)
        return 0
    print('\nAbout to remove the save and savedAt fields from ' + str(len(targets)) + ' document(s) in ' + COLLECTION + '. Type exactly: ' + PHRASE, file=sys.stderr)
    if input('> ').strip() != PHRASE:
        raise SystemExit('Not confirmed. Nothing was changed.')
    print('Backed up ' + str(write_backup(args.backup_file, targets)) + ' document(s) to ' + args.backup_file, file=sys.stderr)
    changed, skipped = retire(db, firestore, targets)
    print(json.dumps({'retired': changed, 'skippedBecauseTheyChanged': skipped}, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
