"""Flight combat upgrade (19 Nov 2026) on the server: progression keeps M2 rounds and the selected missile type (void-runner/ordnance.js),
and the Mission Editor's missile reward ('missiles', M1 / M2, 1 to 30) is accepted only in range."""
import copy
import json
import unittest
from pathlib import Path

import void_runner_live_content as live
from void_runner_progression import clean_progression, FLAGS

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
GO = {'id': 'go', 'kind': 'go', 'place': 'port', 'label': 'Go to the Port.'}


def doc(unlocks):
    m = {'id': 'draft-ord-m1', 'number': 81, 'title': 'Ordnance', 'type': 'side', 'giver': 'iris', 'objectives': [copy.deepcopy(GO)], 'unlocks': unlocks}
    return {'format': live.FORMAT, 'version': 1, 'trees': [{'id': 'draft-ord', 'name': 'Ordnance', 'missions': [m]}]}


class FlightCombatServerTests(unittest.TestCase):
    def base(self):
        return {'flags': {x: True for x in FLAGS}, 'completed': True, 'personal': {}, 'equipment': {'owned': [], 'installed': {}}, 'checkpoint': {'location': 'meridian'}, 'missiles': 4}

    def test_old_progression_gets_defaults(self):
        p = clean_progression(self.base(), ['meridian'])
        self.assertEqual((p['missiles'], p['m2'], p['missileType']), (4, 0, 'm1'))

    def test_m2_and_type_round_trip(self):
        p = clean_progression({**self.base(), 'm2': 3, 'missileType': 'm2'}, ['meridian'])
        self.assertEqual((p['m2'], p['missileType']), (3, 'm2'))
        self.assertEqual(clean_progression(p, ['meridian']), p)

    def test_bad_values_refused(self):
        for bad in [{'m2': 31}, {'m2': -1}, {'m2': 1.5}, {'m2': '2'}, {'missileType': 'm3'}, {'missileType': 2}]:
            with self.assertRaises(ValueError, msg=bad):
                clean_progression({**self.base(), **bad}, ['meridian'])

    def test_missile_reward(self):
        self.assertIn('missiles', INV['missionEditor']['unlockKinds'])
        self.assertEqual(live.check(doc([{'kind': 'missiles', 'id': 'm2', 'amount': 2}]), INV), [])
        self.assertEqual(live.check(doc([{'kind': 'missiles', 'id': 'm1', 'amount': 30, 'when': 'go'}]), INV), [])
        for bad in [{'id': 'm3', 'amount': 2}, {'id': 'm1', 'amount': 0}, {'id': 'm1', 'amount': 31}, {'id': 'm2'}, {'id': 'm1', 'amount': 1.5}]:
            self.assertNotEqual(live.check(doc([{'kind': 'missiles', **bad}]), INV), [], bad)

    def test_ship_reward_still_accepted(self):
        self.assertEqual(live.check(doc([{'kind': 'ship', 'id': 'starter'}]), INV), [])


if __name__ == '__main__':
    unittest.main()
