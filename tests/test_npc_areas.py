"""Reverie, Lace and the street cat anywhere walkable (the owner, 19 Nov 2026): the server's copy of void-runner/npc-areas.js (from the admin inventory, npcPaths.areas),
the owner's content rule (never Milked, NULL, the District bar, VR, the arcade room, the Corporate District) on publish and in the editor's server copy of the draft,
and the same decisions as the browser's rules for a grid of points (parity, when Node is available)."""
import json
import shutil
import subprocess
import unittest
from pathlib import Path

import void_runner_drafts as drafts
import void_runner_live_content as live

ROOT = Path(__file__).resolve().parent.parent
INV = json.loads((ROOT / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))


def W(x, z):
    return {'x': 126.9 - x, 'z': -61.9 + 20 - z}


def ws(bundle):
    return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
            'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor workspace', 'bundle': bundle}}


class NpcAreasServerTests(unittest.TestCase):
    def test_areas_and_the_content_rule(self):
        for p, area in [({'x': 64, 'z': -242}, 'outskirts'), ({'x': 100, 'z': -58.5}, 'oldtown'), (W(0, 40), 'district'), ({'x': 25, 'z': -95}, 'port'), ({'x': 52.5, 'z': -160}, 'far-south')]:
            self.assertEqual(live.area_of(p, INV), area)
        for p in [{'x': 52, 'z': -58}, {'x': 88, 'z': -182}, {'x': 81.75, 'z': -173}, {'x': 94.75, 'z': -190.8}, W(10, 34), W(-10, 36), W(-7, 62), W(-5, 73), {'x': -90, 'z': 0}]:
            ok, _a, kind, why = live.area_check(p, INV)
            self.assertFalse(ok, p)
            self.assertEqual(kind, 'rule', (p, why))
        self.assertEqual(live.area_check({'x': 100, 'z': -12}, INV)[2], 'road')
        self.assertEqual(live.area_check({'x': 61, 'z': -23}, INV)[2], 'gate')

    def test_placements_anywhere_but_forbidden_places(self):
        stay = {'mode': 'stay', 'x': 64, 'z': -242, 'yaw': 0, 'actions': ['idle']}
        good = live.npc_problems({'tea-host': stay}, INV)
        ok_here = live.area_check(stay, INV)[0]
        if ok_here:
            self.assertEqual(good, [])
        self.assertTrue(live.npc_problems({'tea-host': {**stay, 'x': 52, 'z': -58}}, INV))
        self.assertTrue(live.npc_problems({'street-cat': {**stay, 'x': 88, 'z': -182, 'actions': ['cat-sit']}}, INV))
        cross = {'mode': 'path', 'points': [{'x': 100, 'z': -6.4, 'action': 'look', 'seconds': 3}, {'x': 100, 'z': -58.5, 'action': 'look', 'seconds': 3}]}
        self.assertTrue(any('one area' in p for p in live.npc_problems({'tea-host': cross}, INV)))
        road = {'mode': 'path', 'points': [{'x': 100, 'z': -6.4, 'action': 'look', 'seconds': 3}, {'x': 100, 'z': -18.3, 'action': 'look', 'seconds': 3}]}
        self.assertTrue(any('road' in p for p in live.npc_problems({'tea-host': road}, INV)))
        self.assertTrue(live.wait_at_problems('tea-host', {'x': 52, 'z': -58, 'yaw': 0}, INV))

    def test_any_tier_may_walk_through_a_registered_gate(self):
        ave = {'from': '08:00', 'to': '12:00', 'mode': 'stay', 'x': 103.5, 'z': -6.4, 'yaw': 0, 'actions': ['idle']}
        town = {'from': '12:00', 'to': '14:00', 'mode': 'stay', 'x': 73, 'z': -58.5, 'yaw': 0, 'actions': ['idle'], 'cross': True}
        for tier in ({}, {'tier': 1}, {'tier': 2}, {'tier': 3}):
            self.assertEqual(live.npc_problems({'tea-host': {'mode': 'original', **tier, 'schedule': [ave, {**town, 'name': '夜の巡回 🌙'}]}}, INV), [])
        corp = {**town, 'x': 0, 'z': 220}
        self.assertTrue(any('cannot walk' in p for p in live.npc_problems({'tea-host': {'mode': 'original', 'tier': 2, 'schedule': [ave, corp]}}, INV)))

    def test_the_draft_copy_refuses_forbidden_spots(self):
        base = {'version': 1, 'missions': {}, 'lines': {}, 'trees': [], 'npcs': {}, 'animRequests': []}
        self.assertTrue(drafts.validate_workspace(ws({**base, 'npcs': {'tea-host': {'mode': 'stay', 'x': 64, 'z': -242, 'yaw': 0, 'actions': ['idle']}}}))['valid'])
        bad = [{**base, 'npcs': {'tea-host': {'mode': 'stay', 'x': 52, 'z': -58, 'yaw': 0, 'actions': ['idle']}}},
               {**base, 'npcs': {'tea-host': {'mode': 'original', 'schedule': [{'from': '08:00', 'to': '09:00', 'mode': 'path', 'points': [{'x': 81.75, 'z': -173, 'action': 'idle', 'seconds': 3}]}]}}},
               {**base, 'trees': [{'id': 'draft-t', 'missions': [{'id': 'm', 'waitAt': {**W(10, 34), 'yaw': 0}}]}]},
               {**base, 'npcs': {'street-cat': {'mode': 'stay', **W(-5, 73), 'yaw': 0, 'actions': ['cat-sit']}}}]
        for b in bad:
            with self.assertRaises(drafts.DraftError):
                drafts.validate_workspace(ws(b))

    def test_escort_steps_in_her_placed_area(self):
        alley = {'x': 77, 'z': -58.5}
        self.assertEqual(live.placed_area('tea-host', alley, None, INV), 'oldtown')
        self.assertEqual(live.placed_area('tea-host', None, {'mode': 'stay', 'x': 64, 'z': -242}, INV), 'outskirts')
        self.assertEqual(live.escort_problems({'kind': 'shared-cab', 'npc': 'tea-host', 'stop': 'main'}, INV, 'oldtown'), ['this one does not ride in cabs.'])
        # escort across (20 Nov 2026): a stop or a spot in another area she can get to is fine; an area with no taxis is not
        self.assertEqual(live.escort_problems({'kind': 'shared-cab', 'npc': 'tea-host', 'stop': 'avenue'}, INV, 'oldtown'), ['this one does not ride in cabs.'])
        self.assertTrue(live.escort_problems({'kind': 'shared-cab', 'npc': 'tea-host', 'stop': 'avenue'}, INV, 'underground'))
        self.assertEqual(live.escort_problems({'kind': 'follow-them', 'npc': 'tea-host', 'to': {'x': 82, 'z': -58.5}}, INV, 'oldtown'), [])
        self.assertEqual(live.escort_problems({'kind': 'follow-them', 'npc': 'tea-host', 'to': {'x': 82, 'z': -58.5}}, INV, 'avenue'), [])
        self.assertEqual(live.escort_problems({'kind': 'they-follow', 'npc': 'street-cat', 'to': {'x': -2.7, 'z': -80}}, INV, 'avenue'), [])

    @unittest.skipUnless(shutil.which('node'), 'Node is not installed')
    def test_same_decisions_as_the_browser(self):
        pts = [{'x': x, 'z': z} for x in range(10, 145, 7) for z in range(-262, 0, 3)] + [W(x, z) for x in range(-17, 18, 2) for z in range(20, 79, 2)]
        js = subprocess.run(['node', '-e', "const A=require('./void-runner/npc-areas.js');const p=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(p.map(q=>{const c=A.check(q);return [c.ok,c.area,c.kind];})))"],
                            cwd=ROOT, input=json.dumps(pts), capture_output=True, text=True, check=True)
        want = json.loads(js.stdout)
        for p, (ok, area, kind) in zip(pts, want):
            got = live.area_check(p, INV)
            self.assertEqual((got[0], got[1], got[2]), (ok, area, kind), p)

    def test_public_pavements_in_front_of_venues(self):
        # the owner, 20 Nov 2026: the pavement at NULL's door and across Milked's side street / service alley is public; only NULL's doorway is never a spot
        for p in [{'x': 53, 'z': -58.5}, {'x': 52.6, 'z': -62}, {'x': 69.5, 'z': -171}, {'x': 69.5, 'z': -191.5}]:
            self.assertEqual(live.area_check(p, INV)[0], True, p)
        door = {'x': 52, 'z': -58.5}
        ok, _a, kind, why = live.area_check(door, INV)
        self.assertEqual((ok, kind), (False, 'rule'))
        self.assertIn('doorway', why)
        self.assertTrue(live.area_check(door, INV, passing=True)[0])
        self.assertTrue(live.area_check(door, INV, adult=True)[0])
        for p in [{'x': 48, 'z': -58.5}, {'x': 88, 'z': -182}, {'x': 81.75, 'z': -176}]:
            self.assertEqual(live.area_check(p, INV, passing=True)[2], 'rule', p)
        mv = live._movable(INV)['tea-host']
        self.assertEqual(live._leg_problems(mv, {'x': 52.5, 'z': -40}, {'x': 52.5, 'z': -90}, INV), [])
        self.assertEqual(live._leg_problems(mv, {'x': 69.5, 'z': -163}, {'x': 69.5, 'z': -196}, INV), [])
        self.assertTrue(live._leg_problems(mv, {'x': 52.6, 'z': -58.5}, {'x': 40, 'z': -58.5}, INV))
        self.assertTrue(live.wait_at_problems('tea-host', {**door, 'yaw': 0}, INV))
        path = {'mode': 'path', 'points': [{'x': 52.6, 'z': -75, 'action': 'look', 'seconds': 3}, {'x': 52.6, 'z': -45, 'action': 'look', 'seconds': 3}]}
        self.assertEqual(live.npc_problems({'tea-host': path}, INV), [])
        self.assertEqual(live.forbidden_spot_problems({'street-cat': {'mode': 'stay', 'x': 52.6, 'z': -62}}, inv=INV), [])
        self.assertTrue(live.forbidden_spot_problems({'street-cat': {'mode': 'stay', **door}}, inv=INV))

    @unittest.skipUnless(shutil.which('node'), 'Node is not installed')
    def test_same_walking_decisions_as_the_browser(self):
        pts = [{'x': x / 2, 'z': z / 2} for x in range(100, 146) for z in range(-130, -104)] + [{'x': x / 2, 'z': z / 2} for x in range(130, 150) for z in range(-400, -320, 2)]
        js = subprocess.run(['node', '-e', "const A=require('./void-runner/npc-areas.js');const p=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(p.map(q=>{const c=A.check(q,null,undefined,{passing:true});return [c.ok,c.area,c.kind];})))"],
                            cwd=ROOT, input=json.dumps(pts), capture_output=True, text=True, check=True)
        for p, (ok, area, kind) in zip(pts, json.loads(js.stdout)):
            got = live.area_check(p, INV, passing=True)
            self.assertEqual((got[0], got[1], got[2]), (ok, area, kind), p)


if __name__ == '__main__':
    unittest.main()
