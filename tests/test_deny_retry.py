"""When a denied offer comes back (19 Nov 2026; void-runner/mission-content.js DENY_MIN): start.deny 'after' with denyMinutes 1..120 (minutes of play) and 'pod' (after
the next Sleeping Pod exit) are accepted by the server's checks; minutes are refused out of range or without 'after'; the Mission Editor's server copy refuses the same."""
import copy
import json
import unittest
from pathlib import Path

import void_runner_live_content as live
import void_runner_drafts as drafts

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
GO = {'id': 'go', 'kind': 'go', 'place': 'port', 'label': 'Go to the Port.'}


def tree(st=None):
    start = {'how': 'notification', 'channel': 'notify', 'from': 'admin', 'text': 'Got work.', 'when': {'kind': 'near', 'npc': 'admin', 'distance': 5}, 'accept': True}
    start.update(st or {})
    return {'id': 'draft-near', 'name': 'Near', 'missions': [{'id': 'draft-near-m1', 'number': 71, 'title': 'Walk-by job', 'type': 'side', 'giver': 'admin', 'start': start, 'objectives': [copy.deepcopy(GO)]}]}


def doc(*trees):
    return {'format': live.FORMAT, 'version': 1, 'trees': list(trees)}


def workspace(trees):
    return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
            'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor', 'bundle': {'version': 1, 'trees': trees}}}


class DenyRetryServerTests(unittest.TestCase):
    def test_valid(self):
        for st in ({}, {'deny': 'again'}, {'deny': 'pod'}, {'deny': 'never'}, {'deny': 'after', 'denyMinutes': 1}, {'deny': 'after', 'denyMinutes': 120}, {'deny': 'after'}):
            self.assertEqual(live.check(doc(tree(st)), INV), [], st)
        person = tree()
        person['missions'][0]['start'] = {'how': 'person', 'accept': True, 'deny': 'after', 'denyMinutes': 10}
        person['missions'][0]['offer'] = [{'who': 'admin', 'text': 'Job?'}]
        self.assertEqual(live.check(doc(person), INV), [])

    def test_refused(self):
        for st in ({'deny': 'after', 'denyMinutes': 0}, {'deny': 'after', 'denyMinutes': 121}, {'deny': 'after', 'denyMinutes': 2.5}, {'deny': 'after', 'denyMinutes': '10'},
                   {'deny': 'never', 'denyMinutes': 5}, {'denyMinutes': 5}, {'deny': 'later'}, {'deny': 'after', 'denyMinutes': 5, 'accept': None}):
            self.assertNotEqual(live.check(doc(tree(st)), INV), [], st)

    def test_workspace_copy(self):
        self.assertEqual(live.workspace_money_problems([tree({'deny': 'after', 'denyMinutes': 30})]), [])
        self.assertNotEqual(live.workspace_money_problems([tree({'deny': 'after', 'denyMinutes': 500})]), [])
        self.assertNotEqual(live.workspace_money_problems([tree({'deny': 'sometime'})]), [])


if __name__ == '__main__':
    unittest.main()
