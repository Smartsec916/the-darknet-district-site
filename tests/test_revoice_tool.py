"""generate.py --from-queue --dry-run against a sample queue file: Kokoro lines are planned with the registered voice, ElevenLabs lines only listed, nothing written."""
import json
import os
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


class RevoiceToolTests(unittest.TestCase):
    def test_from_queue_dry_run(self):
        queue = {'items': [{'id': 'rook-1', 'who': 'rook', 'text': 'Seal is intact.', 'engine': 'kokoro', 'status': 'queued'},
                           {'id': 'admin-1', 'who': 'admin', 'text': 'Work? Always.', 'engine': 'elevenlabs', 'status': 'queued'},
                           {'id': 'iris-1', 'who': 'iris', 'text': 'Already recorded.', 'engine': 'kokoro', 'status': 'done'},
                           {'id': 'x-1', 'who': 'special-character', 'text': 'Never.', 'engine': 'kokoro', 'status': 'queued'}]}
        manifest = os.path.join(ROOT, 'void-runner', 'assets', 'audio', 'voice', 'manifest.json')
        before = open(manifest, 'rb').read()
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'queue.json')
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(queue, f)
            r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'audio', 'generate.py'), '--from-queue', '--queue-file', path, '--dry-run'], capture_output=True, text=True, cwd=ROOT)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn('Waiting for ElevenLabs re-voice (needs approval)', r.stdout)
            self.assertIn('Queued for Kokoro: 1 line(s)', r.stdout)
            self.assertIn('rook-a26f3988c4', r.stdout)
            self.assertIn('skipped (not a registered character): special-character', r.stdout)
            self.assertEqual(json.load(open(path, encoding='utf-8')), queue, 'a dry run marks nothing done')
        self.assertEqual(open(manifest, 'rb').read(), before, 'a dry run writes nothing')


if __name__ == '__main__':
    unittest.main()
