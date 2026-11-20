"""Locations built from modules on the server (void-runner/modules.js problems(), read from the admin inventory's `modules`): the same checks as the game for
published content, and the editor's server copy of the draft (shape only)."""
import copy
import json
import subprocess
import unittest
from pathlib import Path

import void_runner_drafts as drafts
import void_runner_live_content as live

ROOT = Path(__file__).resolve().parent.parent
INV = json.loads((ROOT / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
HQ = {'id': 'hq', 'door': 'biz-avenue-n-13', 'entry': 'hall.s0', 'locks': ['office.s1'],
      'modules': [{'id': 'hall', 'type': 'hall-office', 'x': 5, 'z': 0}, {'id': 'office', 'type': 'office-floor', 'x': 4, 'z': 4},
                  {'id': 'lift', 'type': 'elevator', 'x': 10, 'z': 6, 'rot': 1}, {'id': 'lift2', 'type': 'elevator', 'x': 10, 'z': 6, 'rot': 1, 'floor': -1},
                  {'id': 'servers', 'type': 'server-room', 'x': 6, 'z': 5, 'floor': -1}]}
STEPS = [{'id': 'in', 'kind': 'apt-enter', 'apt': 'hq', 'mod': 'hall', 'label': 'Get in'},
         {'id': 'hack', 'kind': 'hack', 'ap': 'hq/hall.n0', 'hold': 2, 'label': 'Hack the door'},
         {'id': 'pc', 'kind': 'apt-use', 'apt': 'hq', 'mod': 'office', 'object': 'computer', 'label': 'Use a computer'},
         {'id': 'rack', 'kind': 'apt-use', 'apt': 'hq', 'mod': 'servers', 'object': 'rack', 'label': 'Use a rack'}]


def tree(loc=None, objectives=None):
    m = {'id': 'draft-hq-m1', 'number': 80, 'title': 'The office', 'type': 'side', 'giver': 'admin', 'offer': [{'who': 'admin', 'text': 'An office.'}],
         'objectives': copy.deepcopy(objectives if objectives is not None else STEPS), 'apartments': [copy.deepcopy(loc if loc is not None else HQ)]}
    return {'id': 'draft-hq', 'name': 'HQ', 'missions': [m]}


def check(t):
    return live.check({'format': live.FORMAT, 'version': 1, 'trees': [t]}, INV)


def bad(test, t, text):
    p = check(t)
    test.assertTrue(any(text in x for x in p), (text, p))


class ModuleServerTests(unittest.TestCase):
    def test_inventory_lists_modules(self):
        mi = INV['modules']
        self.assertEqual(mi['grid'], 2)
        for t in ('office-floor', 'server-room', 'elevator', 'elevator-lobby', 'hall-office', 'hall-commercial', 'shop-back', 'bar-back', 'clinic', 'storage', 'maint-corridor', 'apt-rundown', 'hall-container-regular'):
            self.assertIn(t, mi['types'])
        self.assertTrue(set(mi['categories']) >= {'housing', 'commercial', 'office', 'server', 'hallway', 'elevator', 'other'})
        self.assertIn('rack', mi['types']['server-room']['objects'])
        self.assertTrue(any(v.get('family') == 'office' for v in INV['apartments']['doors'].values()))

    def test_good_location_passes(self):
        self.assertEqual(check(tree()), [])

    def test_bad_locations_are_refused(self):
        def mv(i, **kw):
            loc = copy.deepcopy(HQ)
            next(m for m in loc['modules'] if m['id'] == i).update(kw)
            return loc
        bad(self, tree(mv('office', x=5)), 'overlap')
        bad(self, tree(mv('servers', x=0)), 'cannot be reached')
        bad(self, tree(dict(HQ, entry='hall.n0')), 'already a door')
        bad(self, tree(dict(HQ, colour=1)), 'unknown fields')
        bad(self, tree(dict(HQ, modules=[m for m in HQ['modules'] if m['id'] not in ('lift2', 'servers')])), 'second cab')
        bad(self, tree(mv('office', items=[{'type': 'loot', 'label': 'Cash', 'x': 9, 'z': 0}])), 'inside the module')
        bad(self, tree(dict(HQ, links=[{'a': 'hall.w1', 'b': 'office.w2'}])), 'side by side')
        bad(self, tree(objectives=[{'id': 'u', 'kind': 'apt-use', 'apt': 'hq', 'mod': 'servers', 'object': 'safe', 'label': 'x'}]), 'choose what is used')
        bad(self, tree(objectives=[{'id': 'u', 'kind': 'apt-use', 'apt': 'hq', 'object': 'rack', 'label': 'x'}]), 'choose the room')
        bad(self, tree(objectives=[{'id': 'u', 'kind': 'apt-enter', 'apt': 'hq', 'mod': 'roof', 'label': 'x'}]), 'rooms')
        bad(self, tree(objectives=[{'id': 'h', 'kind': 'hack', 'ap': 'hq/office.n1', 'label': 'x'}]), 'door of that location')
        bad(self, tree(objectives=[{'id': 't', 'kind': 'talk', 'npc': 'iris', 'mod': 'hall', 'label': 'x'}]), 'only an apartment step')

    def test_same_verdict_as_the_game(self):
        """A handful of locations checked by modules.js and by the server: both say fine, or both refuse."""
        cases = [HQ, dict(HQ, entry='hall.n0'), dict(HQ, locks=['hall.s0']), dict(HQ, modules=HQ['modules'][:2])]
        js = subprocess.check_output(['node', '-e', 'const M=require("./void-runner/modules.js");const c=JSON.parse(process.argv[1]);console.log(JSON.stringify(c.map(l=>M.problems(l,"office").length>0)))', json.dumps(cases)], cwd=ROOT)
        self.assertEqual(json.loads(js), [bool(live.module_location_problems(c, INV, 'office')) for c in cases])

    def test_older_apartment_entries_still_pass_and_migrate(self):
        flat = {'id': 'safehouse', 'style': 'rundown', 'door': 'apt-main-w-96', 'number': 13, 'locked': True}
        objs = [{'id': 'h', 'kind': 'hack', 'ap': 'safehouse/hall', 'label': 'x'}, {'id': 'u', 'kind': 'apt-use', 'apt': 'safehouse', 'object': 'safe', 'label': 'y'}]
        self.assertEqual(check(tree(flat, objs)), [])
        m = tree(flat, objs)['missions'][0]
        out = subprocess.check_output(['node', '-e', 'const M=require("./void-runner/modules.js");console.log(JSON.stringify(M.migrateMission(JSON.parse(process.argv[1]))))', json.dumps(m)], cwd=ROOT)
        y = json.loads(out)
        self.assertIn('modules', y['apartments'][0])
        self.assertEqual(check({'id': 'draft-hq', 'name': 'HQ', 'missions': [y]}), [])
        bad(self, tree(dict(flat, door='biz-avenue-n-13'), objs), 'not an office or shop entrance')

    def test_any_city_housing_behind_any_city_door(self):
        # the owner, 20 Nov 2026: "all apartment types anywhere. All but The Outskirts. Those only get the shipping container houses."
        objs = [{'id': 'in', 'kind': 'apt-enter', 'apt': 'home', 'label': 'Get in'}]
        for style in ('rundown', 'normal', 'luxury'):
            for door in ('apt-main-w-103', 'apt-avenue-n-16', 'biz-avenue-n-13'):
                loc = {'id': 'home', 'door': door, 'entry': 'hall.street', 'modules': [{'id': 'hall', 'type': 'hall-' + style}, {'id': 'flat', 'type': 'apt-' + style}], 'links': [{'a': 'hall.d0', 'b': 'flat.entry'}]}
                self.assertEqual(check(tree(loc, objs)), [], (style, door))
        yard = next(d for d in INV['apartments']['doors'] if d.startswith('apt-yard-'))
        loc = {'id': 'home', 'door': yard, 'entry': 'hall.street', 'modules': [{'id': 'hall', 'type': 'hall-rundown'}, {'id': 'flat', 'type': 'apt-rundown'}], 'links': [{'a': 'hall.d0', 'b': 'flat.entry'}]}
        bad(self, tree(loc, objs), 'its own kind of street door')
        loc = {'id': 'home', 'door': 'apt-main-w-103', 'entry': 'hall.street', 'modules': [{'id': 'hall', 'type': 'hall-container-rundown'}, {'id': 'flat', 'type': 'apt-container-rundown'}], 'links': [{'a': 'hall.d0', 'b': 'flat.entry'}]}
        bad(self, tree(loc, objs), 'its own kind of street door')

    def test_editor_copy_shape_only(self):
        draft = copy.deepcopy(tree())
        draft['missions'][0]['apartments'][0]['door'] = ''
        draft['missions'][0]['apartments'][0]['modules'] = [{'id': 'hall', 'type': 'hall-office', 'x': 5, 'z': 0}]
        draft['missions'][0]['objectives'] = draft['missions'][0]['objectives'][:2]
        self.assertEqual(live.apartment_shape_problems([draft]), [])
        broken = copy.deepcopy(draft)
        broken['missions'][0]['apartments'][0]['colour'] = 'red'
        self.assertTrue(live.apartment_shape_problems([broken]))


if __name__ == '__main__':
    unittest.main()
