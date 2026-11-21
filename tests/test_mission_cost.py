"""Mission costs and ACCEPT / DENY on the server (19 Nov 2026): the same rules as void-runner/mission-content.js MONEY / checkAsk / checkCost,
and the Mission Editor's server copy refuses out-of-range credits and over-long button labels. clean_save keeps credits 0..100,000,000."""
import copy
import json
import unittest
from pathlib import Path

import void_runner_live_content as live
import void_runner_drafts as drafts

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))


def tree(extra=None, start=None):
    m = {'id': 'draft-pass-m1', 'number': 61, 'title': 'A pass for the gate', 'type': 'side', 'giver': 'iris', 'start': {'how': 'person', 'accept': True, **(start or {})},
         'offer': [{'who': 'iris', 'text': 'A pass costs a hundred.'}], 'cost': {'amount': 100}, 'objectives': [{'id': 'go', 'kind': 'go', 'place': 'port', 'label': 'Go to the Port.'}]}
    m.update(extra or {})
    return {'id': 'draft-pass', 'name': 'Pass', 'missions': [m]}


OTHER = {'id': 'draft-other', 'name': 'Other', 'missions': [{'id': 'draft-other-m1', 'number': 62, 'title': 'Plan B', 'type': 'side', 'giver': 'iris',
                                                            'objectives': [{'id': 'go', 'kind': 'go', 'place': 'port', 'label': 'Go to the Port.'}]}]}


def doc(*trees):
    return {'format': live.FORMAT, 'version': 1, 'trees': list(trees)}


def workspace(trees):
    return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
            'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor', 'bundle': {'version': 1, 'trees': trees}}}


class MissionCostServerTests(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(live.check(doc(tree()), INV), [])
        self.assertEqual(live.check(doc(tree(start={'yes': 'BUY PASS', 'no': 'X' * 20, 'deny': 'start', 'denyStart': 'draft-other-m1', 'denySay': [{'who': 'iris', 'text': 'Suit yourself.'}]}), OTHER), INV), [])
        self.assertEqual(live.check(doc(tree({'cost': {'amount': 5, 'when': 'go'}, 'start': {'how': 'person'}})), INV), [])
        self.assertEqual(live.check(doc(tree({'cost': {'amount': 100000, 'refund': True}})), INV), [])
        for ch in ('messages', 'comms', 'notify'):
            t = tree({'offer': None}, {'how': 'notification', 'channel': ch, 'from': 'iris', 'header': 'H', 'text': 'T', 'when': {'kind': 'near', 'npc': 'iris'}})
            del t['missions'][0]['offer']
            self.assertEqual(live.check(doc(t), INV), [], ch)

    def test_refused(self):
        bad = [({'cost': {'amount': 0}}, None), ({'cost': {'amount': 100001}}, None), ({'cost': {'amount': -100}}, None), ({'cost': {'amount': 10, 'when': 'nope'}}, None),
               ({'cost': {'amount': 10, 'when': 'go', 'refund': True}}, None), ({'cost': {'amount': 10, 'x': 1}}, None), ({'rewards': -100}, None),
               ({}, {'yes': 'X' * 21}), ({}, {'no': '<b>no</b>'}), ({}, {'deny': 'maybe'}), ({}, {'deny': 'start', 'denyStart': 'draft-pass-m1'}), ({}, {'denyStart': 'draft-other-m1'}),
               ({'start': {'how': 'person'}}, None), ({'start': {'how': 'person', 'yes': 'OK'}, 'cost': {'amount': 5, 'when': 'go'}}, None)]
        for extra, start in bad:
            self.assertNotEqual(live.check(doc(tree(extra, start), OTHER), INV), [], (extra, start))

    def test_workspace(self):
        ok = workspace([tree()])
        self.assertTrue(drafts.validate_workspace(ok)['valid'])
        for change in (lambda m: m.update(cost={'amount': 100001}), lambda m: m.update(rewards=-5), lambda m: m['start'].update(yes='X' * 21), lambda m: m['start'].update(deny='maybe')):
            w = copy.deepcopy(ok)
            change(w['data']['bundle']['trees'][0]['missions'][0])
            with self.assertRaises(drafts.DraftError):
                drafts.validate_workspace(w)


if __name__ == '__main__':
    unittest.main()
