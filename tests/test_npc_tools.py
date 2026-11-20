"""Developer Tools > NPCs and "Giver waits at" on the server: the same rules as void-runner/npc-paths.js, read from the admin inventory (npcPaths)."""
import json
import unittest
from pathlib import Path

import void_runner_live_content as live

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))


def tree(wait=None, giver='grey-reverie'):
    m = {'id': 'draft-street-m1', 'number': 41, 'title': 'A favour', 'type': 'side', 'giver': giver, 'start': {'how': 'person', 'accept': True},
         'offer': [{'who': giver, 'text': 'Got a minute?'}], 'objectives': [{'id': 'go', 'kind': 'go', 'place': 'port', 'label': 'Go to the Port.'}]}
    if wait is not None:
        m['waitAt'] = wait
    return {'id': 'draft-street', 'name': 'Street', 'missions': [m]}


def doc(**extra):
    c = {'format': live.FORMAT, 'version': 1}
    c.update(extra)
    return c


class NpcToolsServerTests(unittest.TestCase):
    def test_placements(self):
        ok = {'grey-reverie': {'mode': 'stay', 'x': 104.4, 'z': -5.9, 'yaw': 3.14, 'actions': ['idle', 'look', 'sit']},
              'ethereal-lace': {'mode': 'path', 'points': [{'x': 100, 'z': -6, 'action': 'look', 'seconds': 5}, {'x': 110, 'z': -6.5, 'action': 'scroll', 'seconds': 4}]}}
        self.assertEqual(live.npc_problems(ok, INV), [])
        self.assertEqual(live.check(doc(npcs=ok), INV), [])
        self.assertEqual(live.npc_problems({'grey-reverie': {'mode': 'original'}}, INV), [])
        # (20 Nov 2026) the ad screen that stood at the kerb here hangs on the wall now: the pavement there is free
        self.assertEqual(live.npc_problems({'grey-reverie': {'mode': 'stay', 'x': 96.5, 'z': -7.4, 'yaw': 0, 'actions': ['idle']}}, INV), [])
        bad = [({'admin': {'mode': 'stay', 'x': 100, 'z': -6, 'yaw': 0, 'actions': ['idle']}}, 'cannot be moved'),
               ({'grey-reverie': {'mode': 'stay', 'x': 100, 'z': -12, 'yaw': 0, 'actions': ['idle']}}, 'the road'),
               ({'grey-reverie': {'mode': 'stay', 'x': 40, 'z': -7.4, 'yaw': 0, 'actions': ['idle']}}, 'standing there'),
               ({'grey-reverie': {'mode': 'stay', 'x': 98, 'z': -6, 'yaw': 0, 'actions': ['sit']}}, 'needs a ledge'),
               ({'grey-reverie': {'mode': 'stay', 'x': 100, 'z': -6, 'yaw': 0, 'actions': ['dance-belly']}}, 'not something'),
               ({'grey-reverie': {'mode': 'stay', 'x': 100, 'z': -6, 'yaw': 0, 'actions': ['slow-dance']}}, 'not something'),
               ({'grey-reverie': {'mode': 'stay', 'x': 100, 'z': -6, 'yaw': 0, 'actions': ['idle'], 'speed': 3}}, 'unknown fields'),
               ({'grey-reverie': {'mode': 'path', 'points': [{'x': 30, 'z': -7.3, 'action': 'look', 'seconds': 5}, {'x': 50, 'z': -7.3, 'action': 'look', 'seconds': 5}]}}, 'goes through'),
               ({'grey-reverie': {'mode': 'path', 'points': [{'x': 100, 'z': -6, 'action': 'look', 'seconds': 500}, {'x': 110, 'z': -6, 'action': 'look', 'seconds': 5}]}}, '1 to 120'),
               ({'grey-reverie': {'mode': 'path', 'points': [{'x': 100, 'z': -6, 'action': 'look', 'seconds': 5}]}}, '2 to 12'),
               ({'grey-reverie': {'mode': 'original', 'anims': ['ac-sensual-dance-3']}}, 'animation is not allowed'),
               ({'grey-reverie': {'mode': 'teleport'}}, 'unknown kind')]
        for npcs, why in bad:
            p = live.npc_problems(npcs, INV)
            self.assertTrue(any(why in x for x in p), (npcs, p))
            self.assertTrue(live.check(doc(npcs=npcs), INV))

    def test_banned_clips_never_allowed(self):
        banned = ['sensual', 'slow', 'belly', 'hip', 'twerk', 'grind', 'pole', 'milk', 'flirt', 'kiss', 'seduc', 'recline', 'club']
        for npc, mv in INV['npcPaths']['movable'].items():
            for a in mv['actions'] + mv['anims']:
                self.assertFalse(any(b in a for b in banned), (npc, a))

    def test_shared_animations(self):
        ok = {'grey-reverie': {'mode': 'stay', 'x': 100, 'z': -6.5, 'yaw': 0, 'actions': ['npc-rin/laugh'], 'anims': ['npc-rin/laugh']}}
        self.assertEqual(live.npc_problems(ok, INV), [])
        for bad in ['npc-rin/smoke', 'npc-kai/idle', 'npc-milked-auburn/dance', 'vr-companion-f/hips']:
            p = live.npc_problems({'grey-reverie': {'mode': 'original', 'anims': [bad]}}, INV)
            self.assertTrue(p, bad)

    def test_wait_at(self):
        self.assertEqual(live.check(doc(trees=[tree({'x': 104.4, 'z': -5.9, 'yaw': 3.14})]), INV), [])
        self.assertTrue(any('the road' in p for p in live.check(doc(trees=[tree({'x': 104.4, 'z': -14})]), INV)))
        self.assertTrue(any('unknown fields' in p for p in live.check(doc(trees=[tree({'x': 104.4, 'z': -5.9, 'run': 1})]), INV)))
        t = tree({'x': 104.4, 'z': -5.9}, giver='admin')
        self.assertTrue(any('Reverie or Lace' in p for p in live.check(doc(trees=[t]), INV)))

    def test_import_package(self):
        pkg = {'format': 'darknet-district-npc-import', 'name': 'Test', 'model': {'triangles': 20000, 'bytes': 3_000_000},
               'licence': {'source': 'my own Meshy model', 'type': 'my own work', 'noAI': False}}
        self.assertEqual(live.import_package_problems(pkg, INV), [])
        over = dict(pkg, model={'triangles': 50001, 'bytes': 3_000_000})
        self.assertIn('This model has 50001 triangles; the limit is 50000.', live.import_package_problems(over, INV))
        self.assertTrue(live.import_package_problems(dict(pkg, model={'triangles': 1, 'bytes': 16 * 1024 * 1024}), INV))
        self.assertTrue(any('No AI' in p for p in live.import_package_problems(dict(pkg, licence={'source': 'x', 'type': 'y'}), INV)))
        self.assertEqual(INV['npcPaths']['import']['maxTriangles'], 50000)


if __name__ == '__main__':
    unittest.main()
