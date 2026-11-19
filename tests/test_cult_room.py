"""Camera feeds on the server (void-runner/cult-room.js feedProblems / sceneProblems, read from the admin inventory's `feeds`): the Blackrock Cult Room's scene
timeline and the hack steps that show a feed, for published content and for the editor's server copy of the draft."""
import copy
import json
import subprocess
import unittest
from pathlib import Path

import void_runner_live_content as live

ROOT = Path(__file__).resolve().parent.parent
INV = json.loads((ROOT / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))


def default_scene():
    out = subprocess.run(['node', '-e', "process.stdout.write(JSON.stringify(require('./void-runner/cult-room.js').defaultScene()))"], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


class CultRoomServer(unittest.TestCase):
    def setUp(self):
        self.scene = default_scene()
        self.m = {'id': 'draft-cult-m1', 'feeds': [{'id': 'cam1', 'room': 'blackrock-cult', 'scene': self.scene}],
                  'objectives': [{'id': 'cam', 'kind': 'hack', 'ap': 'apt-main-w-96', 'feed': 'cam1', 'label': 'Hack the camera'}]}

    def test_default_scene_and_feed_pass(self):
        self.assertEqual(live.feed_scene_problems(self.scene, INV), [])
        self.assertEqual(live.feed_problems(self.m, INV), [])
        self.assertEqual(live.feed_shape_problems([{'missions': [self.m]}]), [])
        self.assertEqual(sorted(INV['feeds']['acts']), sorted(live.FEED_DEFAULT['acts']))

    def test_order_and_shape_refused(self):
        bad = lambda beats: live.feed_scene_problems({'beats': beats}, INV)
        self.assertTrue(bad([{'act': 'rise'}, {'act': 'rise'}]))
        self.assertTrue(bad([{'act': 'card'}]))
        self.assertTrue(bad([{'act': 'exit'}]))
        self.assertTrue(bad([{'act': 'line', 'who': 'robed-1', 'text': ''}]))
        self.assertTrue(bad([{'act': 'line', 'who': 'initiate', 'text': '<script>'}]))
        self.assertTrue(bad([{'act': 'pause', 'secs': 2, 'x': 1}]))
        self.assertTrue(live.feed_scene_problems({'radius': 9, 'beats': [{'act': 'pause', 'secs': 1}]}, INV))

    def test_feeds_and_steps(self):
        m = copy.deepcopy(self.m)
        m['objectives'][0]['feed'] = 'nope'
        self.assertTrue(live.feed_problems(m, INV))
        m = copy.deepcopy(self.m)
        m['feeds'][0]['room'] = 'somewhere'
        self.assertTrue(live.feed_problems(m, INV))
        m = copy.deepcopy(self.m)
        m['objectives'][0]['kind'] = 'talk'
        self.assertTrue(live.feed_problems(m, INV))
        m = copy.deepcopy(self.m)
        m['feeds'] = [dict(m['feeds'][0], id=f'c{i}') for i in range(5)]
        self.assertTrue(live.feed_problems(m, INV))

    def test_draft_copy_is_checked(self):
        import void_runner_drafts as drafts
        src = Path(drafts.__file__).read_text(encoding='utf-8')
        self.assertIn('feed_shape_problems', src)


if __name__ == '__main__':
    unittest.main()
