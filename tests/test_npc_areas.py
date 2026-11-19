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
        for p in [{'x': 52.5, 'z': -58}, {'x': 88, 'z': -182}, {'x': 69.5, 'z': -171}, W(10, 34), W(-10, 36), W(-7, 62), W(-5, 73), {'x': -90, 'z': 0}]:
            ok, _a, kind, why = live.area_check(p, INV)
            self.assertFalse(ok, p)
            self.assertEqual(kind, 'rule', (p, why))
        self.assertEqual(live.area_check({'x': 100, 'z': -12}, INV)[2], 'road')
        self.assertEqual(live.area_check({'x': 61, 'z': -23}, INV)[2], 'gate')

    def test_placements_anywhere_but_forbidden_places(self):
        stay = {'mode': 'stay', 'x': 64, 'z': -242, 'yaw': 0, 'actions': ['idle']}
        good = live.npc_problems({'grey-reverie': stay}, INV)
        ok_here = live.area_check(stay, INV)[0]
        if ok_here:
            self.assertEqual(good, [])
        self.assertTrue(live.npc_problems({'grey-reverie': {**stay, 'x': 52.5, 'z': -58}}, INV))
        self.assertTrue(live.npc_problems({'street-cat': {**stay, 'x': 88, 'z': -182, 'actions': ['cat-sit']}}, INV))
        cross = {'mode': 'path', 'points': [{'x': 100, 'z': -6.4, 'action': 'look', 'seconds': 3}, {'x': 100, 'z': -58.5, 'action': 'look', 'seconds': 3}]}
        self.assertTrue(any('one area' in p for p in live.npc_problems({'grey-reverie': cross}, INV)))
        road = {'mode': 'path', 'points': [{'x': 100, 'z': -6.4, 'action': 'look', 'seconds': 3}, {'x': 100, 'z': -18.3, 'action': 'look', 'seconds': 3}]}
        self.assertTrue(any('road' in p for p in live.npc_problems({'grey-reverie': road}, INV)))
        self.assertTrue(live.wait_at_problems('grey-reverie', {'x': 52.5, 'z': -58, 'yaw': 0}, INV))

    def test_the_draft_copy_refuses_forbidden_spots(self):
        base = {'version': 1, 'missions': {}, 'lines': {}, 'trees': [], 'npcs': {}, 'animRequests': []}
        self.assertTrue(drafts.validate_workspace(ws({**base, 'npcs': {'grey-reverie': {'mode': 'stay', 'x': 64, 'z': -242, 'yaw': 0, 'actions': ['idle']}}}))['valid'])
        bad = [{**base, 'npcs': {'grey-reverie': {'mode': 'stay', 'x': 52.5, 'z': -58, 'yaw': 0, 'actions': ['idle']}}},
               {**base, 'npcs': {'ethereal-lace': {'mode': 'original', 'schedule': [{'from': '08:00', 'to': '09:00', 'mode': 'path', 'points': [{'x': 85, 'z': -171, 'action': 'idle', 'seconds': 3}]}]}}},
               {**base, 'trees': [{'id': 'draft-t', 'missions': [{'id': 'm', 'waitAt': {**W(10, 34), 'yaw': 0}}]}]},
               {**base, 'npcs': {'street-cat': {'mode': 'stay', **W(-5, 73), 'yaw': 0, 'actions': ['cat-sit']}}}]
        for b in bad:
            with self.assertRaises(drafts.DraftError):
                drafts.validate_workspace(ws(b))

    @unittest.skipUnless(shutil.which('node'), 'Node is not installed')
    def test_same_decisions_as_the_browser(self):
        pts = [{'x': x, 'z': z} for x in range(10, 145, 7) for z in range(-262, 0, 3)] + [W(x, z) for x in range(-17, 18, 2) for z in range(20, 79, 2)]
        js = subprocess.run(['node', '-e', "const A=require('./void-runner/npc-areas.js');const p=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(p.map(q=>{const c=A.check(q);return [c.ok,c.area,c.kind];})))"],
                            cwd=ROOT, input=json.dumps(pts), capture_output=True, text=True, check=True)
        want = json.loads(js.stdout)
        for p, (ok, area, kind) in zip(pts, want):
            got = live.area_check(p, INV)
            self.assertEqual((got[0], got[1], got[2]), (ok, area, kind), p)


if __name__ == '__main__':
    unittest.main()
