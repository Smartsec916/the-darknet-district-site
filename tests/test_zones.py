"""Zones on the server (void-runner/zones.js, read from the admin inventory's `zones`): the owner's Zones table (content.zones), a mission's `combat` (zones of its
rooms and of city areas, armed people, taken down) and the "Change zone" step: the same checks as the game for published content, shape only for the editor's server
copy of the draft; and the base pistol in the save (void_runner_progression.py)."""
import copy
import json
import unittest
from pathlib import Path

import void_runner_drafts as drafts
import void_runner_live_content as live
from void_runner_progression import clean_progression

ROOT = Path(__file__).resolve().parent.parent
INV = json.loads((ROOT / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
HQ = {'id': 'hq', 'door': 'biz-avenue-n-13', 'entry': 'hall.s0', 'modules': [{'id': 'hall', 'type': 'hall-office', 'x': 5, 'z': 0}, {'id': 'office', 'type': 'office-floor', 'x': 4, 'z': 4}]}
STEPS = [{'id': 'in', 'kind': 'apt-enter', 'apt': 'hq', 'mod': 'hall', 'label': 'Get in'},
         {'id': 'z', 'kind': 'zone', 'target': 'hq/office', 'zone': 'hostile', 'spawn': True, 'label': 'The office turns hostile'},
         {'id': 'pc', 'kind': 'apt-use', 'apt': 'hq', 'mod': 'office', 'object': 'computer', 'label': 'Use a computer'}]
COMBAT = {'places': {'hq/hall': 'neutral'}, 'areas': {'avenue': 'neutral'}, 'onDeath': 'fail',
          'armed': [{'id': 'guard', 'at': 'hq/hall', 'x': 0, 'z': 0, 'figure': 'security', 'role': 'guard'},
                    {'id': 'merc', 'at': 'hq/office', 'x': 1, 'z': 1, 'figure': 'merc', 'role': 'patrol', 'route': [[-1, 1]]}]}


def tree(combat=None, objectives=None):
    m = {'id': 'draft-hq-m1', 'number': 80, 'title': 'The office', 'type': 'side', 'giver': 'admin', 'offer': [{'who': 'admin', 'text': 'An office.'}],
         'objectives': copy.deepcopy(objectives if objectives is not None else STEPS), 'apartments': [copy.deepcopy(HQ)], 'combat': copy.deepcopy(combat if combat is not None else COMBAT)}
    return {'id': 'draft-hq', 'name': 'HQ', 'missions': [m]}


def check(t=None, zones=None):
    c = {'format': live.FORMAT, 'version': 1}
    if t is not None:
        c['trees'] = [t]
    if zones is not None:
        c['zones'] = zones
    return live.check(c, INV)


class ZoneServerTests(unittest.TestCase):
    def bad(self, problems, text):
        self.assertTrue(any(text in p for p in problems), (text, problems))

    def test_inventory_lists_zones(self):
        z = INV['zones']
        self.assertEqual(z['zones'], ['friendly', 'neutral', 'hostile'])
        self.assertEqual(z['default'], 'friendly')
        self.assertEqual(set(z['figures']), {'security', 'merc', 'enforcer'})
        self.assertIn('zone', INV['missionEditor']['stepKinds'])
        self.assertEqual(live.ZONE_DEFAULT['zones'], z['zones'])
        self.assertEqual(live.ZONE_DEFAULT['figures'], z['figures'])

    def test_good_mission_passes(self):
        self.assertEqual(check(tree()), [])

    def test_bad_combat_is_refused(self):
        c = copy.deepcopy(COMBAT)
        c['places']['hq/nope'] = 'neutral'
        c['areas']['nowhere'] = 'hostile'
        c['armed'][0]['figure'] = 'robot'
        c['armed'][1]['x'] = 99
        c['onDeath'] = 'explode'
        p = check(tree(c))
        for text in ('"hq/nope" is not one of', 'there is no area "nowhere"', 'choose a figure', 'inside the room', 'try again or fail'):
            self.bad(p, text)
        self.bad(check(tree(dict(COMBAT, colour=1))), 'unknown fields')
        self.bad(check(tree({'armed': [{'id': 'g', 'at': 'hq/office', 'x': 0, 'z': 0, 'figure': 'merc', 'role': 'patrol'}]})), 'needs at least one route point')

    def test_change_zone_step(self):
        s = copy.deepcopy(STEPS)
        s[1]['zone'] = 'blue'
        self.bad(check(tree(None, s)), 'choose Friendly, Neutral or Hostile')
        s = copy.deepcopy(STEPS)
        s[1]['until'] = 'in'
        self.bad(check(tree(None, s)), 'later step')
        s = copy.deepcopy(STEPS)
        s[1]['target'] = 'area:nowhere'
        self.bad(check(tree(None, s)), 'no area "nowhere"')
        s = copy.deepcopy(STEPS)
        s[1]['target'] = 'area:avenue'
        s[1]['until'] = 'pc'
        self.assertEqual(check(tree(None, s)), [])
        s = copy.deepcopy(STEPS)
        s[0]['zone'] = 'hostile'
        self.bad(check(tree(None, s)), 'only a "Change zone" step')

    def test_zones_table(self):
        self.assertEqual(check(None, {'areas': {'oldtown': 'neutral'}, 'modules': {'server-room': 'hostile'}}), [])
        p = check(None, {'areas': {'nowhere': 'neutral', 'avenue': 'purple'}})
        self.bad(p, 'there is no area "nowhere"')
        self.bad(p, 'must be Friendly, Neutral or Hostile')
        self.bad(check(None, {'x': 1}), 'unknown fields')

    def test_draft_workspace_shape(self):
        t = tree()
        self.assertEqual(live.zone_shape_problems([t]), [])
        t['missions'][0]['combat']['armed'][0]['figure'] = 'robot'
        self.bad(live.zone_shape_problems([t]), 'choose a figure')
        self.assertIn('zones', drafts.WORKSPACE_KEYS)

    def test_pistol_in_the_save(self):
        base = {'flags': {}, 'opening': {'version': 2, 'hologram': False, 'pistol': False, 'cans': []}, 'checkpoint': {'location': 'earth'},
                'personal': {'ammo': 10, 'reserve': 48, 'items': [], 'attachments': [], 'optic': None}, 'equipment': {'owned': [], 'installed': {}}}
        clean = clean_progression(base, ['earth'])
        self.assertIsNone(clean['personal']['weapon'])
        self.assertEqual(clean['personal']['weapons'], [])
        owned = copy.deepcopy(base)
        owned['personal']['weapons'] = ['base-pistol', 'base-pistol']
        clean = clean_progression(owned, ['earth'])
        self.assertEqual(clean['personal']['weapons'], ['base-pistol'])
        self.assertEqual(clean['personal']['weapon'], 'base-pistol')
        bad = copy.deepcopy(base)
        bad['personal']['weapons'] = ['rail-gun']
        with self.assertRaises(ValueError):
            clean_progression(bad, ['earth'])


if __name__ == '__main__':
    unittest.main()
