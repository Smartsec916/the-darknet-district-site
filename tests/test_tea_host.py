"""The tea room host and the alcove seats on the server (20 Nov 2026): the same rules as void-runner/npc-paths.js, read from the admin inventory."""
import json
import unittest
from pathlib import Path

import void_runner_live_content as live

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
HOST = 'tea-host'


class TeaHostServerTests(unittest.TestCase):
    def test_host_is_a_movable_giver(self):
        self.assertIn(HOST, INV['npcPaths']['movable'])
        self.assertIn(HOST, INV['missionEditor']['givers'])
        self.assertIn(HOST, INV['madeCharacters']['reserved'])
        self.assertEqual(live.npc_problems({HOST: {'mode': 'stay', 'x': -4.6, 'z': -103.5, 'yaw': 0, 'actions': ['idle', 'work']}}, INV), [])
        self.assertEqual(live.npc_problems({HOST: {'mode': 'original'}}, INV), [])
        self.assertTrue(live.npc_problems({HOST: {'mode': 'stay', 'x': -4.6, 'z': -103.5, 'yaw': 0, 'actions': ['scroll']}}, INV), 'no V1 for him')

    def test_an_editor_character_cannot_take_his_id(self):
        out = live.with_made({HOST: {'name': 'Other', 'model': 'npc-courier'}}, INV)
        self.assertEqual(out['npcPaths']['movable'][HOST]['name'], 'Tea Room Host')

    def test_sit_on_alcove_seats(self):
        seats = INV['npcPaths']['movable']['grey-reverie']['seats']
        self.assertEqual(len(seats), 6)
        f = seats[0]['front']
        ok = {'grey-reverie': {'mode': 'stay', 'x': round(f[0] + .2, 1), 'z': round(f[1], 1), 'yaw': 0, 'actions': ['sit']}}
        self.assertEqual(live.npc_problems(ok, INV), [])
        far = {'grey-reverie': {'mode': 'stay', 'x': -2.7, 'z': -30, 'yaw': 0, 'actions': ['sit']}}
        self.assertTrue(live.npc_problems(far, INV))
        made = live.with_made({'sitter': {'name': 'Sitter', 'model': 'npc-casual-m'}}, INV)
        self.assertEqual(live.npc_problems({'sitter': ok['grey-reverie']}, made), [])


if __name__ == '__main__':
    unittest.main()
