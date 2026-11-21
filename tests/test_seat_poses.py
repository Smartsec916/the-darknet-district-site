"""The floor poses on the server (21 Nov 2026): "Sit — pose: kneel / cross-legged / knees to chest" only at a seat that takes that pose (the tea room cushions,
the sleeping room's cots, the alcove benches), the chair at the mahjong stools; the Mission Editor's cast may use the poses. Rules as in void-runner/npc-paths.js,
read from the admin inventory."""
import json
import unittest
from pathlib import Path

import void_runner_live_content as live

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))


def seat(sid):
    return next(s for s in INV['npcPaths']['movable']['grey-reverie']['seats'] if s['id'] == sid)


def stay(npc, s, actions):
    return {npc: {'mode': 'stay', 'x': round(s['front'][0], 1), 'z': round(s['front'][1], 1), 'yaw': 0, 'actions': actions}}


class SeatPoseServerTests(unittest.TestCase):
    def test_inventory_lists_poses(self):
        self.assertEqual(seat('under-tea-room-cushion-c-w')['poses'], ['kneel', 'cross', 'knees'])
        self.assertEqual(seat('under-mahjong-stool-e-w')['poses'], ['chair'])
        self.assertEqual(seat('under-sleeping-room-cot-2')['poses'], ['knees', 'cross'])
        for a in ('sit-kneel', 'sit-cross', 'sit-knees'):
            self.assertIn(a, INV['npcPaths']['movable']['grey-reverie']['actions'])

    def test_poses_only_where_the_seat_takes_them(self):
        c, st, cot = seat('under-tea-room-cushion-c-w'), seat('under-mahjong-stool-e-w'), seat('under-sleeping-room-cot-2')
        self.assertEqual(live.npc_problems(stay('grey-reverie', c, ['sit-kneel', 'sit-cross', 'sit-knees']), INV), [])
        self.assertTrue(live.npc_problems(stay('grey-reverie', c, ['sit']), INV), 'no chair on a cushion')
        self.assertEqual(live.npc_problems(stay('grey-reverie', st, ['sit']), INV), [])
        self.assertTrue(live.npc_problems(stay('grey-reverie', st, ['sit-kneel']), INV), 'no kneeling on a stool')
        self.assertEqual(live.npc_problems(stay('grey-reverie', cot, ['sit-knees']), INV), [])
        self.assertTrue(live.npc_problems(stay('grey-reverie', cot, ['sit-kneel']), INV))
        made = live.with_made({'sitter': {'name': 'Sitter', 'model': 'npc-casual-m'}}, INV)
        self.assertEqual(live.npc_problems(stay('sitter', c, ['sit-cross']), made), [])

    def test_cast_may_use_the_poses(self):
        for c in ('floor-kneel', 'floor-cross', 'floor-knees'):
            self.assertIn(c, live.CAST_CLIPS)


if __name__ == '__main__':
    unittest.main()
