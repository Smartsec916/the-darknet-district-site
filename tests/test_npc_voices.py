"""ElevenLabs voice choices on the server (queue item 0b, 18 Nov 2026): content.voices is checked like the browser (void-runner/npc-voices.js), published, kept in the
editor's server copy, and used by the re-voice queue; generate.py --from-queue lists those lines as waiting and never records them. Fake storage only."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import test_content_drafts as fixtures
import void_runner_drafts as drafts
import void_runner_live_content as live

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
VID = 'AbCdEfGhIjKlMnOpQrSt'
OK = {'engine': 'elevenlabs', 'voiceId': VID, 'name': 'Gravel vendor', 'chosen': '2026-11-18 by the owner'}


def doc(**extra):
    c = {'format': live.FORMAT, 'version': 1}
    c.update(extra)
    return c


class VoiceRulesTests(unittest.TestCase):
    def test_choices_are_checked(self):
        self.assertEqual(live.voice_problems({'grey-reverie': OK, 'admin': OK, 'zen-zephyr': OK}), [])
        self.assertEqual(live.check(doc(voices={'grey-reverie': OK})), [])
        bad = [({'special-character': OK}, 'reserved'), ({'the-function': OK}, 'no voice'), ({'news-anchor': OK}, 'Broadcast'), ({'warflying-host': OK}, 'Broadcast'),
               ({'nobody-at-all': OK}, 'not a character'), ({'admin': {**OK, 'voiceId': 'short'}}, '20 letters'), ({'admin': {**OK, 'apiKey': 'sk_x'}}, '20 letters'),
               ({'admin': {**OK, 'engine': 'kokoro'}}, '20 letters'), ({'admin': {**OK, 'name': '<b>x</b>'}}, '20 letters'), ({'admin': {**OK, 'chosen': 'today'}}, '20 letters'),
               ([], 'unknown shape'), ({('x%d' % i): OK for i in range(81)}, 'unknown shape')]
        for v, why in bad:
            problems = live.check(doc(voices=v))
            self.assertTrue(any(why in p for p in problems), (v if not isinstance(v, dict) or len(v) < 5 else '81 entries', problems))

    def test_workspace_copy_keeps_placements_and_voices(self):
        def ws(bundle):
            return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
                    'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor workspace', 'bundle': bundle}}
        good = {'version': 1, 'missions': {}, 'lines': {}, 'trees': [], 'npcs': {}, 'animRequests': [], 'voices': {'grey-reverie': OK}}
        self.assertTrue(drafts.validate_workspace(ws(good))['valid'])
        for b in [{**good, 'voices': {'the-function': OK}}, {**good, 'voices': []}, {**good, 'npcs': []}, {**good, 'apiKey': 'x'}]:
            with self.assertRaises(drafts.DraftError):
                drafts.validate_workspace(ws(b))


class VoiceQueueTests(unittest.TestCase):
    setUp = fixtures.DraftTests.setUp

    def setUp(self):
        fixtures.DraftTests.setUp(self)
        live.clear_cache()
        self.addCleanup(live.clear_cache)
        env = patch.dict(os.environ, {'VOID_CONTENT_PUBLISH_ENABLED': 'true', 'VOID_ACCOUNTS_ENABLED': 'true'})
        env.start()
        self.addCleanup(env.stop)

    def post(self, path, body, token='owner'):
        return self.client.post('/api/void-runner/developer/' + path, headers={'Authorization': 'Bearer ' + token}, json=body)

    def test_publish_and_queue_use_the_choice(self):
        r = self.post('live-content/publish', {'expected': 0, 'content': doc(voices={'mara': OK})})
        self.assertEqual(r.status_code, 200, r.json)
        live.clear_cache()
        self.assertEqual(self.client.get('/api/void-runner/live-content').json['content']['voices'], {'mara': OK})
        items = [{'ref': 'mara|a', 'who': 'mara', 'text': 'A line for Mara.'},
                 {'ref': 'reverie|a', 'who': 'grey-reverie', 'text': 'Got a minute?', 'voiceId': VID, 'voiceName': 'Gravel vendor'},
                 {'ref': 'zen|a', 'who': 'zen-zephyr', 'text': 'Breathe.'},
                 {'ref': 'nyx|a', 'who': 'nyx', 'text': 'Another round?'}]
        r = self.post('revoice', {'items': items})
        self.assertEqual(r.status_code, 200, r.json)
        by = {i['who']: i for i in r.json['items']}
        self.assertEqual((by['mara']['engine'], by['mara']['voiceId'], by['mara']['voice']), ('elevenlabs', VID, 'Gravel vendor'), 'the published choice')
        self.assertEqual((by['grey-reverie']['engine'], by['grey-reverie']['voiceId']), ('elevenlabs', VID), 'the draft choice sent with the line')
        self.assertEqual(by['zen-zephyr']['voiceId'], 'bAq8AI9QURijOtmeFFqT', 'revoice-engines.json, even without a registered Kokoro voice')
        self.assertEqual((by['nyx']['engine'], by['nyx']['voice']), ('kokoro', 'af_river'), 'no choice: the registered Kokoro voice')
        self.assertTrue(all(i['status'] == 'queued' for i in r.json['items']))
        done = self.post('revoice/done', {'ids': [i['id'] for i in r.json['items']]}).json['items']
        self.assertEqual({i['who']: i['status'] for i in done}, {'mara': 'queued', 'grey-reverie': 'queued', 'zen-zephyr': 'queued', 'nyx': 'done'}, 'ElevenLabs lines wait for approval')
        for bad in [{'who': 'the-function', 'text': 'x', 'voiceId': VID, 'voiceName': 'n'}, {'who': 'special-character', 'text': 'x', 'voiceId': VID, 'voiceName': 'n'},
                    {'who': 'news-anchor', 'text': 'x'}, {'who': 'street-cat', 'text': 'x'}, {'who': 'admin', 'text': 'x', 'voiceId': 'bad', 'voiceName': 'n'},
                    {'who': 'admin', 'text': 'x', 'voiceId': VID}, {'who': 'admin', 'text': 'x', 'apiKey': 'sk'}]:
            self.assertIn(self.post('revoice', {'items': [bad]}).status_code, (400, 422), bad)


class GenerateFromQueueTests(unittest.TestCase):
    def test_voices_file_moves_lines_to_waiting(self):
        queue = {'items': [{'id': 'nyx-1', 'who': 'nyx', 'text': 'Another round?', 'engine': 'kokoro', 'status': 'queued'},
                           {'id': 'mara-1', 'who': 'mara', 'text': 'Hold still.', 'engine': 'kokoro', 'status': 'queued'},
                           {'id': 'rev-1', 'who': 'grey-reverie', 'text': 'Got a minute?', 'engine': 'elevenlabs', 'voice': 'Gravel vendor', 'voiceId': VID, 'status': 'queued'}]}
        voices = {'about': 'x', 'characters': {'mara': {'engine': 'elevenlabs', 'voice': 'Gravel vendor', 'voiceId': VID, 'chosen': '2026-11-18 by the owner'},
                                               'the-function': {'engine': 'elevenlabs', 'voice': 'never', 'voiceId': VID}}}
        with tempfile.TemporaryDirectory() as d:
            q, v = os.path.join(d, 'queue.json'), os.path.join(d, 'revoice-engines.json')
            for path, data in [(q, queue), (v, voices)]:
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(data, f)
            r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'audio', 'generate.py'), '--from-queue', '--queue-file', q, '--voices', v, '--dry-run'], capture_output=True, text=True, cwd=ROOT)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn('Queued for Kokoro: 1 line(s)', r.stdout)
            self.assertIn('Waiting for ElevenLabs re-voice (needs approval), not recorded here: 2 line(s), 24 characters, about 24 credits', r.stdout)
            self.assertIn('chosen in the editor', r.stdout)
            with open(q, encoding='utf-8') as f:
                self.assertEqual(json.load(f), queue, 'a dry run marks nothing done')


if __name__ == '__main__':
    unittest.main()
