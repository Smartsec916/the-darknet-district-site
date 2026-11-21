"""Follow / lead / shared-cab mission steps on the server: the same rules as void-runner/npc-escort.js, read from the admin inventory (npcEscort, npcPaths)."""
import json
import unittest
from pathlib import Path

import void_runner_drafts as drafts
import void_runner_live_content as live

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))


def doc(**extra):
    c = {'format': live.FORMAT, 'version': 1}
    c.update(extra)
    return c


def tree(step, giver='grey-reverie'):
    o = {'id': 'walk', 'label': 'Walk with them'}
    o.update(step)
    return {'id': 'draft-walk', 'name': 'Walk', 'missions': [{'id': 'draft-walk-m1', 'number': 61, 'title': 'Walk with me', 'type': 'side', 'giver': giver,
                                                                'offer': [{'who': giver, 'text': 'Come on.'}], 'objectives': [o]}]}


def problems(step):
    return live.check(doc(trees=[tree(step)]), INV)


class NpcEscortServerTests(unittest.TestCase):
    def test_good_steps_pass(self):
        for step in [{'kind': 'follow-them', 'npc': 'grey-reverie', 'to': {'x': 110, 'z': -6.4}, 'wait': 8, 'lost': 40, 'ifLost': 'fail'},
                     {'kind': 'they-follow', 'npc': 'street-cat', 'to': {'x': 60, 'z': -6.4}},
                     {'kind': 'their-cab', 'npc': 'ethereal-lace', 'stop': 'east-gate'},
                     {'kind': 'shared-cab', 'npc': 'grey-reverie', 'stop': 'avenue'}]:
            self.assertEqual(problems(step), [], step['kind'])

    def test_bad_steps_are_refused(self):
        def bad(step, text):
            p = problems(step)
            self.assertTrue(any(text in x for x in p), (text, p))
        bad({'kind': 'follow-them', 'npc': 'admin', 'to': {'x': 110, 'z': -6.4}}, 'can walk with the player')
        bad({'kind': 'follow-them', 'npc': 'grey-reverie', 'to': {'x': 110, 'z': -14}}, 'the road')
        bad({'kind': 'follow-them', 'npc': 'grey-reverie'}, 'pick the spot')
        bad({'kind': 'follow-them', 'npc': 'grey-reverie', 'to': {'x': 110, 'z': -6.4}, 'wait': 50}, 'waiting distance')
        bad({'kind': 'follow-them', 'npc': 'grey-reverie', 'to': {'x': 110, 'z': -6.4}, 'wait': 20, 'lost': 15}, 'further than')
        bad({'kind': 'follow-them', 'npc': 'grey-reverie', 'to': {'x': 110, 'z': -6.4}, 'ifLost': 'explode'}, 'stop and wait')
        bad({'kind': 'they-follow', 'npc': 'grey-reverie', 'to': {'x': 110, 'z': -6.4}, 'wait': 8}, 'no wait setting')
        bad({'kind': 'their-cab', 'npc': 'street-cat', 'stop': 'avenue'}, 'does not ride in cabs')
        bad({'kind': 'their-cab', 'npc': 'grey-reverie', 'stop': 'corporate'}, 'cab stop they can get to')
        # escort across (20 Nov 2026): a stop in another quarter and a spot in another area she can walk to pass; the cat never goes down into the tunnels
        self.assertEqual(problems({'kind': 'shared-cab', 'npc': 'grey-reverie', 'stop': 'main'}), [])
        self.assertEqual(problems({'kind': 'follow-them', 'npc': 'grey-reverie', 'to': {'x': -2.7, 'z': -80}}), [])
        self.assertEqual(problems({'kind': 'they-follow', 'npc': 'grey-reverie', 'to': {'x': 53, 'z': -50}}), [])
        bad({'kind': 'they-follow', 'npc': 'street-cat', 'to': {'x': -2.7, 'z': -80}}, 'can walk to')
        bad({'kind': 'talk', 'npc': 'admin', 'stop': 'avenue'}, 'only a follow')
        bad({'kind': 'follow-them', 'npc': 'grey-reverie', 'to': {'x': 110, 'z': -6.4, 'y': 2}}, 'pick the spot')

    def test_inventory_matches_the_kinds(self):
        self.assertEqual(sorted(INV['npcEscort']['kinds']), sorted(live.ESCORT_KINDS))
        for k in live.ESCORT_KINDS:
            self.assertIn(k, INV['missionEditor']['stepKinds'])
        self.assertEqual(INV['npcEscort']['npcs']['street-cat']['stops'], [])
        self.assertNotIn('corporate', INV['npcEscort']['npcs']['grey-reverie']['stops'])

    def test_workspace_copy_checks_the_shape_only(self):
        def ws(step):
            return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
                    'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor workspace', 'bundle': {'trees': [tree(step)]}}}
        self.assertTrue(drafts.validate_workspace(ws({'kind': 'follow-them', 'npc': 'grey-reverie'}))['valid'])   # half made: fine in the backup
        for step in [{'kind': 'follow-them', 'to': {'x': 'far'}}, {'kind': 'follow-them', 'wait': 99}, {'kind': 'follow-them', 'ifLost': 'x'}, {'kind': 'their-cab', 'stop': '<b>'}]:
            with self.assertRaises(drafts.DraftError):
                drafts.validate_workspace(ws(step))


if __name__ == '__main__':
    unittest.main()
