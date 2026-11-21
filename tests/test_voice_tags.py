"""ElevenLabs voice tags in what is said and the ElevenLabs model choice (the owner, 19 Nov 2026: "so i can put elevenlabs voice tags into the what is said section?",
"choose a model?", "v4?"). The server accepts well-formed tags, refuses malformed brackets in plain words, keeps tags in the re-voice queue only for an ElevenLabs model
that reads them (Eleven v4 / v3), strips them for Kokoro and the other models, and checks the model against the allow-list. Fake storage only."""
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
OK = {'engine': 'elevenlabs', 'voiceId': VID, 'name': 'Gravel vendor', 'chosen': '2026-11-19 by the owner'}


def tree(text, start_text='Over here.'):
    return {'id': 'draft-tags', 'name': 'Tags', 'missions': [{'id': 'draft-tags-m1', 'number': 77, 'title': 'Quiet', 'type': 'side', 'giver': 'admin',
            'start': {'how': 'notification', 'channel': 'messages', 'from': 'admin', 'header': 'ADMIN', 'text': start_text, 'when': {'kind': 'pod-exit'}},
            'objectives': [{'id': 'see', 'kind': 'talk', 'npc': 'admin', 'label': 'Talk to Admin.', 'say': [{'who': 'admin', 'text': text}]}]}]}


class TagRulesTests(unittest.TestCase):
    def test_strip_and_problems(self):
        self.assertEqual(drafts.strip_voice_tags('[whispers] Keep it down.'), 'Keep it down.')
        self.assertEqual(drafts.strip_voice_tags('Fine [sighs], go.'), 'Fine, go.')
        self.assertEqual(drafts.strip_voice_tags('No tags  here.'), 'No tags  here.', 'a line without tags is unchanged (clips are found by their text)')
        for t in ['[whispers] Keep it down.', '[laughs] [excited] Yes!', '[meditative] Breathe.', '[Write Admin\'s introduction here]', 'Plain.']:
            self.assertEqual(drafts.voice_tag_problems(t), [], t)
        for t, why in [('[whispers Keep it down.', 'not closed'), ('Keep it down]', 'not closed'), ('[] Hi', 'Empty brackets'), ('[Whispers] Hi', 'lowercase'),
                       ('[sigh2] Hi', 'lowercase'), ('[' + 'a' * 31 + '] Hi', 'too long'), ('[a][b][c][d][e][f][g] Hi', 'Too many'), ('[sighs]', 'needs words')]:
            p = drafts.voice_tag_problems(t)
            self.assertTrue(any(why in x for x in p), (t, p))

    def test_content_check(self):
        self.assertEqual([p for p in live.check({'format': live.FORMAT, 'version': 1, 'trees': [tree('[whispers] Keep it down.', '[sighs] Come by.')]}) if 'tags' in p.lower() or 'bracket' in p.lower()], [])
        for bad in [tree('[whispers Keep it down.'), tree('Hi.', '[Loud] Come by.')]:
            p = live.check({'format': live.FORMAT, 'version': 1, 'trees': [bad]})
            self.assertTrue(any('bracket' in x or 'lowercase' in x for x in p), p)

    def test_dialogue_node_text(self):
        drafts.spoken('[whispers] Keep it down.')
        with self.assertRaises(drafts.DraftError):
            drafts.spoken('[WHISPERS] Keep it down.')

    def test_models(self):
        self.assertEqual(live.voice_problems({'admin': {**OK, 'model': 'eleven_v4'}}), [])
        self.assertEqual(live.voice_problems({'admin': OK}), [], 'older choices without a model are kept (Eleven v4 is used)')
        self.assertTrue(any('unknown ElevenLabs model' in p for p in live.voice_problems({'admin': {**OK, 'model': 'eleven_v9'}})))
        self.assertEqual(live.voice_model({'chosen': '2026-11-18 by the owner (model eleven_v4)'}), 'eleven_v4')
        self.assertEqual(live.voice_model({'model': 'eleven_flash_v2_5'}), 'eleven_flash_v2_5')
        self.assertEqual(live.voice_model({}), 'eleven_v4')
        with open(os.path.join(ROOT, 'tools', 'audio', 'revoice-engines.json'), encoding='utf-8') as f:
            self.assertEqual(json.load(f)['characters']['zen-zephyr']['model'], 'eleven_v4')
        t = '[whispers]  Keep it down.'
        self.assertEqual(live.speak_text(t, {'engine': 'elevenlabs', 'model': 'eleven_v4'}), '[whispers] Keep it down.')
        self.assertEqual(live.speak_text(t, {'engine': 'elevenlabs', 'model': 'eleven_v3'}), '[whispers] Keep it down.')
        for e in [{'engine': 'elevenlabs', 'model': 'eleven_multilingual_v2'}, {'engine': 'elevenlabs', 'model': 'eleven_flash_v2_5'}, {'engine': 'kokoro'}]:
            self.assertEqual(live.speak_text(t, e), 'Keep it down.', e)


class TagQueueTests(unittest.TestCase):
    def setUp(self):
        fixtures.DraftTests.setUp(self)
        live.clear_cache()
        self.addCleanup(live.clear_cache)
        env = patch.dict(os.environ, {'VOID_CONTENT_PUBLISH_ENABLED': 'true', 'VOID_ACCOUNTS_ENABLED': 'true'})
        env.start()
        self.addCleanup(env.stop)

    def post(self, path, body, token='owner'):
        return self.client.post('/api/void-runner/developer/' + path, headers={'Authorization': 'Bearer ' + token}, json=body)

    def test_queue_text_per_engine(self):
        items = [{'ref': 'zen|a', 'who': 'zen-zephyr', 'text': '[meditative] Breathe.'},
                 {'ref': 'rev|a', 'who': 'grey-reverie', 'text': '[whispers] Got a minute?', 'voiceId': VID, 'voiceName': 'Gravel vendor', 'model': 'eleven_flash_v2_5'},
                 {'ref': 'mara|a', 'who': 'mara', 'text': '[laughs] Hold still.', 'voiceId': VID, 'voiceName': 'Gravel vendor'},
                 {'ref': 'nyx|a', 'who': 'nyx', 'text': '[sighs] Another round?'}]
        r = self.post('revoice', {'items': items})
        self.assertEqual(r.status_code, 200, r.json)
        by = {i['who']: i for i in r.json['items']}
        self.assertEqual((by['zen-zephyr']['text'], by['zen-zephyr']['speak'], by['zen-zephyr']['model']), ('Breathe.', '[meditative] Breathe.', 'eleven_v4'), 'Eleven v4 keeps the tag')
        self.assertEqual(by['zen-zephyr']['id'], live.item_id('zen-zephyr', 'Breathe.'), 'the clip is found by the text players see')
        self.assertEqual((by['grey-reverie']['text'], by['grey-reverie'].get('speak'), by['grey-reverie']['model']), ('Got a minute?', None, 'eleven_flash_v2_5'), 'Flash: tags left out')
        self.assertEqual((by['mara']['speak'], by['mara']['model']), ('[laughs] Hold still.', 'eleven_v4'), 'a new choice defaults to Eleven v4')
        self.assertEqual((by['nyx']['engine'], by['nyx']['text'], by['nyx'].get('speak')), ('kokoro', 'Another round?', None), 'Kokoro never gets tags')
        # a tag edit re-queues an ElevenLabs line with the same shown text
        r2 = self.post('revoice', {'items': [{'ref': 'zen|a', 'who': 'zen-zephyr', 'text': '[calm] Breathe.'}]}).json['items']
        self.assertEqual([i['speak'] for i in r2 if i['who'] == 'zen-zephyr'], ['[calm] Breathe.'])
        for bad in [{'who': 'nyx', 'text': '[Sighs] x'}, {'who': 'nyx', 'text': '[sighs x'}, {'who': 'mara', 'text': 'x', 'voiceId': VID, 'voiceName': 'n', 'model': 'eleven_v9'}]:
            self.assertIn(self.post('revoice', {'items': [bad]}).status_code, (400, 422), bad)


class GenerateWaitingListTests(unittest.TestCase):
    def test_waiting_list_prints_model_and_counts_sent_text(self):
        queue = {'items': [{'id': 'nyx-1', 'who': 'nyx', 'text': '[sighs] Another round?', 'engine': 'kokoro', 'status': 'queued'},
                           {'id': 'zen-1', 'who': 'zen-zephyr', 'text': 'Breathe.', 'speak': '[meditative] Breathe.', 'engine': 'elevenlabs', 'voice': 'Sigma', 'voiceId': VID, 'model': 'eleven_v4', 'status': 'queued'},
                           {'id': 'rev-1', 'who': 'grey-reverie', 'text': 'Got a minute?', 'engine': 'elevenlabs', 'voice': 'Gravel vendor', 'voiceId': VID, 'model': 'eleven_flash_v2_5', 'status': 'queued'}]}
        with tempfile.TemporaryDirectory() as d:
            q = os.path.join(d, 'queue.json')
            with open(q, 'w', encoding='utf-8') as f:
                json.dump(queue, f)
            r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'audio', 'generate.py'), '--from-queue', '--queue-file', q, '--dry-run'], capture_output=True, text=True, cwd=ROOT)
            self.assertEqual(r.returncode, 0, r.stderr)
            # 21 + 13 characters as sent; Flash at about half: 21 + 6.5 -> 28 credits
            self.assertIn('2 line(s), 34 characters, about 28 credits', r.stdout)
            self.assertIn('[meditative] Breathe.', r.stdout)
            self.assertIn('model eleven_v4', r.stdout)
            self.assertIn('model eleven_flash_v2_5', r.stdout)
            self.assertIn('nyx-' + __import__('hashlib').sha1('nyx|Another round?'.encode()).hexdigest()[:10], r.stdout, 'Kokoro records the line without its tag')


if __name__ == '__main__':
    unittest.main()
