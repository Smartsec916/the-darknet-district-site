"""Daily schedules and the street cat on the server: the same rules as void-runner/npc-paths.js (scheduleProblems), read from the admin inventory (npcPaths)."""
import json
import unittest
from pathlib import Path

import void_runner_drafts as drafts
import void_runner_live_content as live

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
ROUTE = [{'x': 90, 'z': -6.6, 'action': 'look', 'seconds': 5}, {'x': 110, 'z': -6.6, 'action': 'idle', 'seconds': 5}]
DAY = {'mode': 'original', 'schedule': [
    {'from': '08:00', 'to': '12:00', 'name': 'Morning walk', 'mode': 'path', 'points': ROUTE},
    {'from': '12:00', 'to': '13:00', 'name': 'Lunch on the ledge', 'mode': 'stay', 'x': 104.4, 'z': -6.1, 'yaw': 3.14, 'actions': ['idle']},
    {'from': '20:00', 'to': '02:00', 'mode': 'original'}]}


def doc(**extra):
    c = {'format': live.FORMAT, 'version': 1}
    c.update(extra)
    return c


def with_block(**b):
    d = json.loads(json.dumps(DAY))
    d['schedule'].append(b)
    return d


class NpcBehaviourServerTests(unittest.TestCase):
    def test_a_good_schedule_passes(self):
        self.assertEqual(live.npc_problems({'tea-host': DAY}, INV), [])
        self.assertEqual(live.check(doc(npcs={'tea-host': DAY}), INV), [])
        stay = dict(DAY, mode='stay', x=100, z=-6.4, yaw=0, actions=['idle'])
        self.assertEqual(live.npc_problems({'tea-host': stay}, INV), [])

    def test_bad_schedules_are_refused(self):
        def bad(plan, text):
            p = live.npc_problems({'tea-host': plan}, INV)
            self.assertTrue(any(text in x for x in p), (text, p))
        bad(with_block(**{'from': '01:00', 'to': '03:00', 'mode': 'original'}), 'overlaps time block 3')   # across midnight
        bad(with_block(**{'from': '14:00', 'to': '14:10', 'mode': 'original'}), 'at least 15 minutes')
        bad(with_block(**{'from': '14:00', 'to': '14:00', 'mode': 'original'}), 'same time')
        bad(with_block(**{'from': '25:00', 'to': '14:00', 'mode': 'original'}), '24-hour clock')
        bad(with_block(**{'from': '14:00', 'to': '15:00', 'mode': 'original', 'code': 'eval(1)'}), 'unknown fields')
        bad(with_block(**{'from': '14:00', 'to': '15:00', 'mode': 'original', 'name': '<script>'}), 'simple punctuation')
        bad(with_block(**{'from': '14:00', 'to': '15:00', 'mode': 'dance'}), 'unknown kind of time block')
        bad(with_block(**{'from': '14:00', 'to': '15:00', 'mode': 'stay', 'x': 100, 'z': -12, 'yaw': 0, 'actions': ['idle']}), 'the road')
        bad(with_block(**{'from': '14:00', 'to': '15:00', 'mode': 'stay', 'x': 100, 'z': -6.4, 'yaw': 0, 'actions': ['pole-dance']}), 'not something she can do')
        bad(with_block(**{'from': '14:00', 'to': '15:00', 'mode': 'stay', 'x': 100, 'z': -6.4, 'yaw': 0, 'actions': ['idle'], 'schedule': []}), 'unknown fields')
        bad(dict(DAY, schedule=[dict(DAY['schedule'][2], **{'from': '%02d:00' % h, 'to': '%02d:30' % h}) for h in range(9)]), 'time blocks at most')
        bad(dict(DAY, schedule='08:00-12:00'), 'unknown shape')

    def test_the_cat(self):
        cat = {'mode': 'path', 'points': [{'x': 95, 'z': -6.2, 'action': 'cat-sit', 'seconds': 10}, {'x': 101, 'z': -6.2, 'action': 'cat-wander', 'seconds': 6}],
               'schedule': [{'from': '22:00', 'to': '06:00', 'mode': 'stay', 'x': 100.6, 'z': -6.0, 'yaw': 0, 'actions': ['cat-sit', 'cat-look']}]}
        self.assertEqual(live.npc_problems({'street-cat': cat}, INV), [])
        self.assertTrue(live.npc_problems({'street-cat': {'mode': 'stay', 'x': 100, 'z': -6.4, 'yaw': 0, 'actions': ['scroll']}}, INV))
        self.assertTrue(live.npc_problems({'street-cat': {'mode': 'original', 'anims': ['actorcore/x']}}, INV))
        g = INV['missionEditor']['givers']['street-cat']
        self.assertTrue(g['canTalk'] and g['players'])
        self.assertNotIn(' ', 'street-cat')

    def test_workspace_copy_checks_the_schedule_shape_only(self):
        def ws(bundle):
            return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
                    'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor workspace', 'bundle': bundle}}
        half = {'mode': 'original', 'schedule': [{'from': '08:00', 'to': '09:00', 'mode': 'path', 'points': []}]}   # half made: fine in the backup
        self.assertTrue(drafts.validate_workspace(ws({'npcs': {'tea-host': half}}))['valid'])
        for b in [{'from': '8am', 'to': '09:00', 'mode': 'original'}, {'from': '08:00', 'to': '09:00', 'mode': 'original', 'run': 'x'}, {'from': '08:00', 'to': '09:00', 'mode': 'original', 'name': '<b>'}]:
            with self.assertRaises(drafts.DraftError):
                drafts.validate_workspace(ws({'npcs': {'tea-host': {'mode': 'original', 'schedule': [b]}}}))


if __name__ == '__main__':
    unittest.main()
