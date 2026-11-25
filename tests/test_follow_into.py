"""Follow into a place (20 Nov 2026; void-runner/npc-escort.js intoProblems): the server accepts a follow-them / they-follow step whose destination is one of the
mission's places (apt, and mod for a room of a location), and refuses the cat, a place of another mission, an elevator cab, a bar back room for Reverie, a street door in
another area, a spot and a place together, and a place that opens later; the Mission Editor's server copy accepts an unfinished one."""
import copy
import json
import unittest
from pathlib import Path

import void_runner_live_content as live
import void_runner_drafts as drafts

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
REV, DOOR = 'tea-host', 'apt-avenue-n-16'
OFFICE = {'id': 'a1', 'door': DOOR, 'entry': 'hall.s0', 'modules': [{'id': 'hall', 'type': 'hall-office', 'x': 5, 'z': 0}, {'id': 'office', 'type': 'office-floor', 'x': 4, 'z': 4},
          {'id': 'lift', 'type': 'elevator', 'x': 10, 'z': 6, 'rot': 1}, {'id': 'lift2', 'type': 'elevator', 'x': 10, 'z': 6, 'rot': 1, 'floor': -1},
          {'id': 'servers', 'type': 'server-room', 'x': 6, 'z': 5, 'floor': -1}]}
PIT = {'id': 'a4', 'door': 'apt-avenue-n-23', 'entry': 'tunnel.n0', 'modules': [{'id': 'tunnel', 'type': 'tunnel', 'x': 5, 'z': 4, 'floor': -1}, {'id': 'pit', 'type': 'fight-pit', 'x': 4, 'z': 0, 'floor': -1}]}
BAR = {'id': 'a3', 'door': 'apt-avenue-n-23', 'entry': 'hall.s0', 'modules': [{'id': 'hall', 'type': 'hall-commercial', 'x': 5, 'z': 0}, {'id': 'bar', 'type': 'bar-back', 'x': 4, 'z': 4}]}
FLAT = {'id': 'a2', 'style': 'rundown', 'door': 'apt-avenue-n-30', 'number': 104}


def tree(step, places=None, kind='follow-them'):
    o = {'id': 's2', 'kind': kind, 'npc': REV, 'label': 'Follow Reverie inside'}
    o.update(step)
    m = {'id': 'draft-in-m1', 'number': 90, 'title': 'In', 'type': 'side', 'giver': REV, 'offer': [{'who': REV, 'text': 'Come with me.'}],
         'apartments': copy.deepcopy(places if places is not None else [OFFICE, FLAT]),
         'objectives': [{'id': 's1', 'kind': 'talk', 'npc': REV, 'label': 'Talk to Reverie'}, o, {'id': 's3', 'kind': 'talk', 'npc': REV, 'label': 'Talk to her inside'}]}
    return {'id': 'draft-in', 'name': 'In', 'missions': [m]}


def check(t):
    return live.check({'format': live.FORMAT, 'version': 1, 'trees': [t]}, INV)


class FollowIntoServerTests(unittest.TestCase):
    def test_valid(self):
        for st, kind in (({'apt': 'a2'}, 'follow-them'), ({'apt': 'a1', 'mod': 'servers'}, 'follow-them'), ({'apt': 'a1'}, 'they-follow'), ({'apt': 'a1', 'mod': 'office', 'wait': 6, 'lost': 30, 'ifLost': 'fail'}, 'follow-them')):
            self.assertEqual(check(tree(st, kind=kind)), [], st)

    def test_refused(self):
        cases = [({'apt': 'zz'}, None, 'places to go into'), ({'apt': 'a2', 'mod': 'office'}, None, 'built from modules'), ({'apt': 'a1', 'mod': 'lift2'}, None, 'elevator'),
                 ({'apt': 'a1', 'mod': 'nope'}, None, 'rooms'), ({'apt': 'a2', 'to': {'x': 60, 'z': -6.4}}, None, 'not both'),

                 ({'apt': 'a2', 'npc': 'street-cat'}, None, 'cat stays outside'), ({'apt': 'a2'}, [dict(FLAT, **{'from': 's3'})], 'opens later')]
        for st, places, words in cases:
            errs = check(tree(st, places))
            self.assertTrue(any(words in e for e in errs), (st, errs))
        # only follow steps (and the apartment steps) name a place
        t = tree({'apt': 'a2'})
        t['missions'][0]['objectives'][0]['apt'] = 'a2'
        self.assertTrue(any('only an apartment step names an apartment' in e for e in check(t)))

    def test_door_in_another_area(self):
        # escort across (20 Nov 2026): a place whose street door is in Old Town; she starts on The Avenue and walks there through the North Gate
        self.assertEqual(check(tree({'apt': 'a2'}, [dict(FLAT, door='apt-main-w-96')])), [])
        self.assertIn('oldtown', INV['npcEscort']['npcs']['tea-host']['reach']['avenue'])
        self.assertNotIn('underground', INV['npcEscort']['npcs']['street-cat']['reach']['avenue'])

    def test_inventory_and_draft_copy(self):
        esc = INV['npcEscort']
        self.assertEqual(esc['fields']['follow-them'], ['to', 'apt', 'mod', 'wait', 'lost', 'ifLost'])
        self.assertEqual(esc['into']['doorAreas'][DOOR], 'avenue')
        self.assertFalse(esc['npcs']['street-cat']['into'])
        ws = {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
              'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor', 'bundle': {'version': 1, 'trees': [tree({'apt': 'a1', 'mod': 'servers'})]}}}
        self.assertTrue(drafts.validate_workspace(ws)['valid'])
        bad = copy.deepcopy(ws)
        bad['data']['bundle']['trees'][0]['missions'][0]['objectives'][1]['mod'] = 'Not An Id!'
        with self.assertRaises(drafts.DraftError):
            drafts.validate_workspace(bad)


if __name__ == '__main__':
    unittest.main()
