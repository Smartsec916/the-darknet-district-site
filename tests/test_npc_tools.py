"""Developer Tools > NPCs and "Giver waits at" on the server: the same rules as void-runner/npc-paths.js, read from the admin inventory (npcPaths)."""
import json
import unittest
from pathlib import Path

import void_runner_live_content as live

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))


def tree(wait=None, giver='tea-host'):
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
        ok = {'tea-host': {'mode': 'stay', 'x': 104.4, 'z': -5.9, 'yaw': 3.14, 'actions': ['idle', 'look']},
              'street-cat': {'mode': 'path', 'points': [{'x': 100, 'z': -6, 'action': 'cat-look', 'seconds': 5}, {'x': 110, 'z': -6.5, 'action': 'cat-sit', 'seconds': 4}]}}
        self.assertEqual(live.npc_problems(ok, INV), [])
        self.assertEqual(live.check(doc(npcs=ok), INV), [])
        self.assertEqual(live.npc_problems({'tea-host': {'mode': 'original'}}, INV), [])
        # (20 Nov 2026) the ad screen that stood at the kerb here hangs on the wall now: the pavement there is free
        self.assertEqual(live.npc_problems({'tea-host': {'mode': 'stay', 'x': 96.5, 'z': -7.4, 'yaw': 0, 'actions': ['idle']}}, INV), [])
        bad = [({'admin': {'mode': 'stay', 'x': 100, 'z': -6, 'yaw': 0, 'actions': ['idle']}}, 'cannot be moved'),
               ({'tea-host': {'mode': 'stay', 'x': 100, 'z': -12, 'yaw': 0, 'actions': ['idle']}}, 'the road'),
               ({'tea-host': {'mode': 'stay', 'x': 40, 'z': -7.4, 'yaw': 0, 'actions': ['idle']}}, 'standing there'),
               ({'tea-host': {'mode': 'stay', 'x': 98, 'z': -6, 'yaw': 0, 'actions': ['sit']}}, 'not something'),
               ({'tea-host': {'mode': 'stay', 'x': 100, 'z': -6, 'yaw': 0, 'actions': ['dance-belly']}}, 'not something'),
               ({'tea-host': {'mode': 'stay', 'x': 100, 'z': -6, 'yaw': 0, 'actions': ['slow-dance']}}, 'not something'),
               ({'tea-host': {'mode': 'stay', 'x': 100, 'z': -6, 'yaw': 0, 'actions': ['idle'], 'speed': 3}}, 'unknown fields'),
               ({'tea-host': {'mode': 'path', 'points': [{'x': 30, 'z': -7.3, 'action': 'look', 'seconds': 5}, {'x': 50, 'z': -7.3, 'action': 'look', 'seconds': 5}]}}, 'goes through'),
               ({'tea-host': {'mode': 'path', 'points': [{'x': 100, 'z': -6, 'action': 'look', 'seconds': 500}, {'x': 110, 'z': -6, 'action': 'look', 'seconds': 5}]}}, '1 to 120'),
               ({'tea-host': {'mode': 'path', 'points': [{'x': 100, 'z': -6, 'action': 'look', 'seconds': 5}]}}, '2 to 12'),
               ({'tea-host': {'mode': 'original', 'anims': ['unknown-clip']}}, 'animation is not allowed'),
               ({'tea-host': {'mode': 'teleport'}}, 'unknown kind')]
        for npcs, why in bad:
            p = live.npc_problems(npcs, INV)
            self.assertTrue(any(why in x for x in p), (npcs, p))
            self.assertTrue(live.check(doc(npcs=npcs), INV))

    def test_shared_animations(self):
        clips = INV['npcPaths']['movable']['tea-host']['anims']
        pack = [clip for clip in clips if clip.startswith('sz-')]
        self.assertEqual(len(pack), 17)
        self.assertEqual(live.npc_problems({'tea-host': {'mode': 'original', 'anims': pack}}, INV), [])
        self.assertFalse(INV['npcPaths']['movable']['street-cat']['anims'])
        for invalid in [['unknown-clip'], pack + [pack[0]], [{}]]:
            self.assertTrue(live.npc_problems({'tea-host': {'mode': 'original', 'anims': invalid}}, INV))

    def test_wait_at(self):
        self.assertEqual(live.check(doc(trees=[tree({'x': 104.4, 'z': -5.9, 'yaw': 3.14})]), INV), [])
        self.assertTrue(any('the road' in p for p in live.check(doc(trees=[tree({'x': 104.4, 'z': -14})]), INV)))
        self.assertTrue(any('unknown fields' in p for p in live.check(doc(trees=[tree({'x': 104.4, 'z': -5.9, 'run': 1})]), INV)))
        t = tree({'x': 104.4, 'z': -5.9}, giver='admin')
        self.assertTrue(any('editor can move' in p for p in live.check(doc(trees=[t]), INV)))

    def test_import_package(self):
        pkg = {'format': 'darknet-district-npc-import', 'name': 'Test', 'model': {'triangles': 20000, 'bytes': 3_000_000},
               'licence': {'source': 'my own Meshy model', 'type': 'my own work', 'noAI': False}}
        self.assertEqual(live.import_package_problems(pkg, INV), [])
        over = dict(pkg, model={'triangles': 50001, 'bytes': 3_000_000})
        self.assertIn('This model has 50001 triangles; the limit is 50000.', live.import_package_problems(over, INV))
        self.assertEqual(live.import_package_problems(dict(over, allowOverTriangleLimit=True), INV), [])
        self.assertTrue(live.import_package_problems(dict(over, allowOverTriangleLimit='true'), INV))
        self.assertTrue(live.import_package_problems(dict(over, allowOverTriangleLimit=True, model={'triangles': 50001, 'bytes': 16 * 1024 * 1024}), INV))
        self.assertTrue(live.import_package_problems(dict(pkg, model={'triangles': 1, 'bytes': 16 * 1024 * 1024}), INV))
        self.assertTrue(any('No AI' in p for p in live.import_package_problems(dict(pkg, licence={'source': 'x', 'type': 'y'}), INV)))
        self.assertEqual(INV['npcPaths']['import']['maxTriangles'], 50000)


if __name__ == '__main__':
    unittest.main()
