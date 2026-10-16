"""The Python voice pipeline must fingerprint voices exactly like tools/audio/voice-registry.cjs."""
import json, os, sys, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'audio'))
import generate  # stdlib only at import time


class VoicePipelineTest(unittest.TestCase):
    def test_fingerprint_matches_node(self):
        engine = {'model': 'kokoro-v1.0.onnx', 'modelSha256': '7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5'}
        import hashlib
        expected = hashlib.sha256(b'kokoro-v1.0.onnx|7d5df8ecf7d4b187|af_nicole|0.940|en-us').hexdigest()[:12]
        self.assertEqual(generate.config_hash({'voice': 'af_nicole', 'speed': 0.94, 'lang': 'en-us'}, engine), expected)

    def test_manifest_lines_carry_current_fingerprints(self):
        with open(os.path.join(ROOT, 'tools', 'audio', 'npc-voice-registry.json'), encoding='utf-8') as f:
            registry = json.load(f)
        with open(os.path.join(ROOT, 'void-runner', 'assets', 'audio', 'voice', 'manifest.json'), encoding='utf-8') as f:
            manifest = json.load(f)
        for line_id, line in manifest['lines'].items():
            self.assertEqual(line['configHash'], generate.config_hash(registry['npcs'][line['speaker']], registry['engine']), line_id)


if __name__ == '__main__':
    unittest.main()
