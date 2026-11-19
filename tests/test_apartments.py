"""Mission apartments on the server: the same rules as void-runner/apartments.js problems(), read from the admin inventory (`apartments`): apartment instances,
"Go into / Use something in apartment X" steps and "Hack the access point" steps, in published content and in the editor's server copy of the draft."""
import copy
import json
import unittest
from pathlib import Path

import void_runner_drafts as drafts
import void_runner_live_content as live

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
FLAT = {'id': 'safehouse', 'style': 'rundown', 'door': 'apt-main-w-96', 'number': 13}
STEPS = [{'id': 'in', 'kind': 'apt-enter', 'apt': 'safehouse', 'label': 'Get inside'},
         {'id': 'safe', 'kind': 'apt-use', 'apt': 'safehouse', 'object': 'safe', 'label': 'Try the safe'},
         {'id': 'hack', 'kind': 'hack', 'ap': 'safehouse/hall', 'hold': 5, 'needs': 'hacking-device', 'stay': False, 'label': 'Hack the door'},
         {'id': 'street', 'kind': 'hack', 'ap': 'apt-main-w-96', 'label': 'Hack the street door'}]


def tree(apartments=None, objectives=None):
    m = {'id': 'draft-flat-m1', 'number': 72, 'title': 'Someone’s flat', 'type': 'side', 'giver': 'admin', 'offer': [{'who': 'admin', 'text': 'A flat on Main Street.'}],
         'objectives': copy.deepcopy(objectives if objectives is not None else STEPS)}
    m['apartments'] = copy.deepcopy(apartments if apartments is not None else [dict(FLAT, locked=True, lightsOff=True, screenOff=True, items=[{'type': 'loot', 'label': 'Cash', 'x': 1, 'z': 1}])])
    return {'id': 'draft-flat', 'name': 'The flat', 'missions': [m]}


def check(t):
    return live.check({'format': live.FORMAT, 'version': 1, 'trees': [t]}, INV)


def workspace(trees):
    return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
            'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor', 'bundle': {'version': 1, 'trees': trees}}}


class ApartmentServerTests(unittest.TestCase):
    def test_good_mission_passes(self):
        self.assertEqual(check(tree()), [])

    def test_bad_data_is_refused(self):
        def bad(t, text):
            p = check(t)
            self.assertTrue(any(text in x for x in p), (text, p))
        bad(tree([dict(FLAT, style='penthouse')]), 'rundown, normal or luxury')
        bad(tree([dict(FLAT, door='apt-main-w-999')]), 'street door')
        bad(tree([FLAT, dict(FLAT, id='b')]), 'same street door')
        bad(tree([dict(FLAT, number=10000)]), '1 to 9999')
        bad(tree([dict(FLAT, items=[{'type': 'loot', 'label': 'x', 'x': 9, 'z': 0}])]), 'inside the apartment')
        bad(tree([dict(FLAT, style='luxury', screenOff=True)]), 'ad screen')
        bad(tree([dict(FLAT, colour='red')]), 'unknown fields')
        bad(tree(objectives=[{'id': 'u', 'kind': 'apt-use', 'apt': 'safehouse', 'object': 'fridge', 'label': 'x'}]), 'choose what is used')
        bad(tree(objectives=[{'id': 'u', 'kind': 'apt-enter', 'apt': 'nope', 'label': 'x'}]), 'apartments')
        bad(tree(objectives=[{'id': 'h', 'kind': 'hack', 'ap': 'apt-main-w-96', 'hold': 99, 'label': 'x'}]), 'seconds from 2 to 30')
        bad(tree(objectives=[{'id': 'h', 'kind': 'hack', 'ap': 'apt-main-w-96', 'needs': 'a-laser', 'label': 'x'}]), 'item the game has')
        bad(tree(objectives=[{'id': 'h', 'kind': 'hack', 'ap': 'roof/door', 'label': 'x'}]), 'access point')
        bad(tree(objectives=[{'id': 'h', 'kind': 'talk', 'npc': 'iris', 'ap': 'apt-main-w-96', 'label': 'x'}]), 'only a "hack')

    def test_container_styles(self):
        door = next(k for k, v in INV['apartments']['doors'].items() if v.get('family') == 'container')
        ok = tree([{'id': 'box', 'style': 'container-rundown', 'door': door, 'screenOff': True, 'items': [{'type': 'loot', 'label': 'Cash', 'x': 5, 'z': -1}]}],
                  [{'id': 'in', 'kind': 'apt-enter', 'apt': 'box', 'label': 'Get in'}])
        self.assertEqual(check(ok), [])
        for apts, text in (([{'id': 'box', 'style': 'container-regular', 'door': 'apt-main-w-96'}], 'container door in The Outskirts'),
                           ([{'id': 'box', 'style': 'normal', 'door': door}], 'container door in The Outskirts'),
                           ([{'id': 'box', 'style': 'container-regular', 'door': door, 'items': [{'type': 'loot', 'label': 'x', 'x': 1, 'z': 3}]}], 'inside the apartment')):
            p = check(tree(apts, [{'id': 'in', 'kind': 'apt-enter', 'apt': 'box', 'label': 'Get in'}]))
            self.assertTrue(any(text in x for x in p), (text, p))

    def test_inventory_lists(self):
        ap = INV['apartments']
        self.assertEqual(sorted(ap['styles']), ['container-regular', 'container-rundown', 'luxury', 'normal', 'rundown'])
        self.assertIn('vending', ap['objects'])
        self.assertNotIn('fridge', ap['objects'])
        self.assertIn('hacking-device', ap['items'])
        self.assertIn('apt-main-w-96', ap['doors'])
        for k in ('apt-enter', 'apt-use', 'hack'):
            self.assertIn(k, INV['missionEditor']['stepKinds'])

    def test_workspace_copy(self):
        unfinished = tree([{'id': 'a1', 'style': 'normal', 'door': ''}], [{'id': 'h', 'kind': 'hack', 'label': 'x'}])
        self.assertTrue(drafts.validate_workspace(workspace([unfinished]))['valid'])
        with self.assertRaises(drafts.DraftError):
            drafts.validate_workspace(workspace([tree([dict(FLAT, number='thirteen')])]))


if __name__ == '__main__':
    unittest.main()
