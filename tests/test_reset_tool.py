"""The save-retirement tool: read-only by default, touches only the old saves' save/savedAt/revision fields, backs up first, restores safely."""
import copy
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

SPEC = importlib.util.spec_from_file_location('reset_tool', Path(__file__).resolve().parent.parent / 'tools' / 'reset-void-runner-saves.py')
tool = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(tool)
DELETE = object()


class Snap:
    def __init__(self, db, key): self.db, self.key, self.id = db, key, key.rsplit('/', 1)[-1]
    def to_dict(self): return copy.deepcopy(self.db.data.get(self.key))


class Ref:
    def __init__(self, db, key): self.db, self.key = db, key
    def get(self, transaction=None): return Snap(self.db, self.key)


class Coll:
    def __init__(self, db, name): self.db, self.name = db, name
    def document(self, key): return Ref(self.db, self.name + '/' + key)
    def stream(self): return [Snap(self.db, k) for k in sorted(self.db.data) if k.startswith(self.name + '/') and k.count('/') == 1]


class Tx:
    def __init__(self, db): self.db = db
    def update(self, ref, data):
        doc = self.db.data[ref.key]
        for k, v in data.items():
            if v is DELETE: doc.pop(k, None)
            else: doc[k] = copy.deepcopy(v)
        self.db.writes.append(ref.key)
    def set(self, ref, data, merge=False):
        self.db.data[ref.key] = {**(self.db.data.get(ref.key, {}) if merge else {}), **copy.deepcopy(data)}
        self.db.writes.append(ref.key)


class DB:
    def __init__(self): self.data, self.writes = {}, []
    def collection(self, name): return Coll(self, name)
    def transaction(self): return Tx(self)


FS = SimpleNamespace(DELETE_FIELD=DELETE, transactional=lambda f: f)
OLD = {'version': 2, 'quest': 'open', 'location': 'meridian', 'credits': 777, 'completed': 3}
NEW = {'version': 2, 'quest': 'inheritance', 'location': 'earth', 'credits': 100, 'completed': 0, 'story': {'flags': {'campaignEpoch': 1, 'missionPool': 'closed'}}}


def world():
    db = DB()
    db.data['vr_players/aaa'] = {'save': OLD, 'revision': 4, 'savedAt': 1750000000}
    db.data['vr_players/bbb'] = {'save': NEW, 'revision': 2, 'savedAt': 1760000000}
    db.data['vr_players/ccc'] = {'revision': 0}
    db.data['vr_players/ddd'] = {'save': OLD, 'revision': 1, 'savedAt': 1700000000, 'somethingElse': 'keep me'}
    db.data['vr_players/aaa/pending/wraith-test'] = {'status': 'pending'}
    db.data['vr_orders/cs_1'] = {'uid': 'x', 'item': 'spectre', 'status': 'paid'}
    db.data['bp_handles/pilot'] = {'owner': 'x'}
    db.data['vr_config/combat'] = {'values': {}}
    return db


class ResetToolTests(unittest.TestCase):
    def test_report_is_read_only_and_exact(self):
        db = world(); before = copy.deepcopy(db.data)
        report, targets = tool.plan(db)
        self.assertEqual(db.data, before); self.assertEqual(db.writes, [])
        self.assertEqual((report['documents'], report['withASave'], report['currentCampaigns'], report['oldCampaignsToRetire']), (4, 3, 1, 2))
        self.assertEqual([t['id'] for t in targets], ['aaa', 'ddd'])
        self.assertEqual(report['fieldsRemoved'], ['save', 'savedAt']); self.assertEqual(report['collection'], 'vr_players')
        self.assertEqual(report['targets'][1]['otherFieldsLeftAlone'], ['somethingElse'])
        self.assertEqual(report['targets'][0]['summary'], {'quest': 'open', 'location': 'meridian', 'credits': 777, 'completed': 3, 'version': 2})

    def test_retire_touches_only_the_old_saves_and_only_two_fields_plus_revision(self):
        db = world(); report, targets = tool.plan(db); before = copy.deepcopy(db.data)
        changed, skipped = tool.retire(db, FS, targets)
        self.assertEqual((changed, skipped), (2, 0)); self.assertEqual(sorted(db.writes), ['vr_players/aaa', 'vr_players/ddd'])
        self.assertEqual(db.data['vr_players/aaa'], {'revision': 5}); self.assertEqual(db.data['vr_players/ddd'], {'revision': 2, 'somethingElse': 'keep me'})
        for key in before:
            if key not in ('vr_players/aaa', 'vr_players/ddd'): self.assertEqual(db.data[key], before[key], key + ' is untouched')
        self.assertEqual(db.data['vr_players/bbb']['save'], NEW, 'a current campaign is never retired')

    def test_a_document_that_changed_since_the_report_is_left_alone(self):
        db = world(); _, targets = tool.plan(db)
        db.data['vr_players/aaa'] = {'save': NEW, 'revision': 5, 'savedAt': 1770000000}  # the player started a new campaign in between
        db.data['vr_players/ddd']['revision'] = 9
        self.assertEqual(tool.retire(db, FS, targets), (0, 2)); self.assertEqual(db.writes, [])

    def test_backup_is_complete_private_and_never_overwritten(self):
        db = world(); _, targets = tool.plan(db)
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'saves.json')
            self.assertEqual(tool.write_backup(path, targets), 2)
            body = json.loads(Path(path).read_text())
            self.assertEqual([x['id'] for x in body['documents']], ['aaa', 'ddd']); self.assertEqual(body['documents'][0]['save'], OLD); self.assertEqual(body['documents'][0]['revision'], 4)
            self.assertEqual(oct(os.stat(path).st_mode & 0o777), '0o600')
            with self.assertRaises(FileExistsError): tool.write_backup(path, targets)

    def test_restore_puts_saves_back_but_never_over_a_new_campaign(self):
        db = world(); _, targets = tool.plan(db)
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'saves.json'); tool.write_backup(path, targets); tool.retire(db, FS, targets)
            db.data['vr_players/ddd']['save'] = NEW  # started again after the reset
            self.assertEqual(tool.restore(db, FS, path), (1, 1))
            self.assertEqual(db.data['vr_players/aaa']['save'], OLD); self.assertEqual(db.data['vr_players/ddd']['save'], NEW)

    def test_wrong_project_or_backup_is_refused(self):
        with self.assertRaises(SystemExit): tool.main(['--project', 'some-other-project'])
        with self.assertRaises(SystemExit): tool.main(['--apply'])
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'x.json'); Path(path).write_text(json.dumps({'project': 'other', 'collection': 'vr_players', 'documents': []}))
            with self.assertRaises(SystemExit): tool.restore(DB(), FS, path)

    def test_the_tool_names_only_the_one_collection(self):
        text = (Path(__file__).resolve().parent.parent / 'tools' / 'reset-void-runner-saves.py').read_text()
        code = text.split('"""', 2)[2]
        for other in ('vr_orders', 'vr_checkouts', 'bp_handles', 'bp_profiles', 'vr_config', 'vr_content', 'delete_user', 'auth.', 'iris'):
            self.assertNotIn(other, code, other)
        self.assertIn("COLLECTION = 'vr_players'", code); self.assertIn("FIELDS = ('save', 'savedAt')", code)


if __name__ == '__main__':
    unittest.main()
