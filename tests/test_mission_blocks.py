"""ACCEPT / DENY in the middle of a mission on the server (19 Nov 2026): the step kind 'ask' (the same rules as void-runner/mission-content.js checkAskStep),
and the Mission Editor's server copy refuses an out-of-range price, over-long button labels and an unknown DENY."""
import copy
import json
import unittest
from pathlib import Path

import void_runner_live_content as live
import void_runner_drafts as drafts

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
GO = {'id': 'go', 'kind': 'go', 'place': 'port', 'label': 'Go to the Port.'}
TALK = {'id': 'talk', 'kind': 'talk', 'npc': 'iris', 'label': 'Talk to Iris.'}


def tree(ask=None, extra=None):
    q = {'id': 'q', 'kind': 'ask', 'label': 'Decide', 'question': 'Will you go to the Port?', **(ask or {})}
    m = {'id': 'draft-ask-m1', 'number': 71, 'title': 'A question', 'type': 'side', 'giver': 'iris', 'objectives': [copy.deepcopy(TALK), q, copy.deepcopy(GO)]}
    m.update(extra or {})
    return {'id': 'draft-ask', 'name': 'Ask', 'missions': [m]}


OTHER = {'id': 'draft-other', 'name': 'Other', 'missions': [{'id': 'draft-other-m1', 'number': 72, 'title': 'Plan B', 'type': 'side', 'giver': 'iris', 'objectives': [copy.deepcopy(GO)]}]}


def doc(*trees):
    return {'format': live.FORMAT, 'version': 1, 'trees': list(trees)}


def workspace(trees):
    return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
            'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor', 'bundle': {'version': 1, 'trees': trees}}}


class MissionAskServerTests(unittest.TestCase):
    def test_inventory_lists_the_kind(self):
        self.assertIn('ask', INV['missionEditor']['stepKinds'])

    def test_valid(self):
        self.assertEqual(live.check(doc(tree()), INV), [])
        self.assertEqual(live.check(doc(tree({'npc': 'iris', 'yes': 'I WILL', 'no': 'X' * 20, 'price': 50, 'say': [{'who': 'iris', 'text': 'Good.'}], 'denySay': [{'who': 'You', 'text': 'No.'}]})), INV), [])
        self.assertEqual(live.check(doc(tree({'deny': 'skip', 'goto': 'go'})), INV), [])
        self.assertEqual(live.check(doc(tree({'deny': 'back', 'goto': 'talk'})), INV), [])
        self.assertEqual(live.check(doc(tree({'deny': 'tree', 'denyStart': 'draft-other-m1'}), OTHER), INV), [])

    def test_refused(self):
        bad = [{'question': ''}, {'question': 'x' * 301}, {'question': '<b>hi</b>'}, {'yes': 'X' * 21}, {'deny': 'maybe'}, {'deny': 'skip', 'goto': 'talk'}, {'deny': 'skip'},
               {'deny': 'back', 'goto': 'go'}, {'goto': 'go'}, {'deny': 'tree'}, {'denyStart': 'draft-other-m1'}, {'price': 0}, {'price': 100001}, {'price': 1.5},
               {'via': 'comms'}, {'early': [{'who': 'iris', 'text': 'x'}]}, {'npc': 'You'}, {'npc': 'nobody-at-all'}, {'unknown': 1}]
        for ask in bad:
            self.assertNotEqual(live.check(doc(tree(ask), OTHER), INV), [], ask)
        # going back over a step that gives credits would pay it again
        t = tree({'deny': 'back', 'goto': 'talk'}, {'unlocks': [{'kind': 'credits', 'amount': 10, 'when': 'talk'}]})
        self.assertTrue(any('again' in e or 'each time' in e for e in live.check(doc(t), INV)))
        # the fields belong to an ask step only
        t = tree()
        t['missions'][0]['objectives'][2]['question'] = 'Why?'
        self.assertNotEqual(live.check(doc(t), INV), [])

    def test_workspace_copy(self):
        self.assertTrue(drafts.validate_workspace(workspace([tree({'price': 50})]))['valid'])
        for ask in ({'price': 0}, {'price': 100001}, {'yes': 'X' * 21}, {'deny': 'never'}):
            with self.assertRaises(drafts.DraftError):
                drafts.validate_workspace(workspace([tree(ask)]))


if __name__ == '__main__':
    unittest.main()
