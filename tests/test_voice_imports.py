"""Imported voice files on the server (Developer Tools, 19 Nov 2026): the content check (content.clips), the editor's server copy, the owner-only upload
(type from the bytes, size, length, address, sign-in), the public read (no sign-in, cached for a year), and PUBLISH refusing files that are not uploaded. Fake storage only."""
import base64
import hashlib
import io
import json
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import unittest
import wave
from unittest.mock import patch

import test_content_drafts as fixtures
import void_runner_drafts as drafts
import void_runner_live_content as live

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OGG = os.path.join(ROOT, 'void-runner', 'assets', 'audio', 'voice', 'extra', 'admin-m002-call.ogg')


def wav(seconds, rate=16000):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b'\x00\x01' * int(seconds * rate))
    return buf.getvalue()


def mp3(frames):
    """MPEG-1 Layer III, 64 kbps, 44.1 kHz: 208-byte frames of silence-shaped bytes (enough for the header reader)."""
    head = struct.pack('>I', 0xFFFB5004)
    return b'ID3\x03\x00\x00\x00\x00\x00\x0a' + b'\x00' * 10 + (head + b'\x00' * 204) * frames


def doc(**extra):
    c = {'format': live.FORMAT, 'version': 1}
    c.update(extra)
    return c


def clip(raw, **extra):
    c = {'who': 'admin', 'text': 'Keep it down.', 'hash': hashlib.sha256(raw).hexdigest(), 'type': live.sniff(raw), 'duration': 2.0, 'bytes': len(raw)}
    c.update(extra)
    return c


class ClipRulesTests(unittest.TestCase):
    def test_lengths_are_read_from_the_file(self):
        self.assertAlmostEqual(live.clip_seconds('audio/wav', wav(3.5)), 3.5, places=3)
        self.assertAlmostEqual(live.clip_seconds('audio/mpeg', mp3(100)), 100 * 1152 / 44100, places=3)
        with open(OGG, 'rb') as f:
            self.assertAlmostEqual(live.clip_seconds('audio/ogg', f.read()), 25.2, places=2)
        self.assertIsNone(live.clip_seconds('audio/ogg', b'OggS' + b'\x00' * 40))
        self.assertIsNone(live.clip_seconds('audio/mpeg', b'\x00' * 9000))
        self.assertEqual([live.sniff(x) for x in [wav(0.1), mp3(3), b'OggS....', b'<html>']], ['audio/wav', 'audio/mpeg', 'audio/ogg', None])

    def test_content_clips_are_checked_like_the_browser(self):
        data = wav(1)
        self.assertEqual(live.check(doc(clips=[clip(data)])), [])
        bad = [({'who': 'player'}, 'not the player'), ({'text': '<b>x</b>'}, 'plain text'), ({'hash': 'abc'}, 'bad file address'), ({'type': 'audio/mp4'}, 'MP3, WAV or Ogg'),
               ({'duration': 41}, '40 seconds'), ({'bytes': 600001}, '600 KB'), ({'data': 'AAAA'}, 'unknown fields')]
        for extra, why in bad:
            problems = live.check(doc(clips=[clip(data, **extra)]))
            self.assertTrue(any(why in p for p in problems), (extra, problems))
        self.assertTrue(any('same line' in p for p in live.clip_problems([clip(data), clip(data, who='Admin', text=' Keep it down. ', hash='b' * 64)])))
        self.assertTrue(any('unknown shape' in p for p in live.check(doc(clips={}))))

    def test_workspace_copy_keeps_the_records_never_the_audio(self):
        def ws(bundle):
            return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
                    'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor workspace', 'bundle': bundle}}
        rec = {**clip(wav(1)), 'name': 'line.mp3', 'at': '2026-11-19T10:00:00.000Z'}
        good = {'version': 1, 'missions': {}, 'lines': {}, 'trees': [], 'clips': {'tree:m1/offer/0': rec}}
        self.assertTrue(drafts.validate_workspace(ws(good))['valid'])
        for b in [{**good, 'clips': []}, {**good, 'clips': {'k': {**rec, 'data': 'AAAA'}}}, {**good, 'clips': {'k': {**rec, 'bytes': 10 ** 7}}}]:
            with self.assertRaises(drafts.DraftError):
                drafts.validate_workspace(ws(b))


class ClipRouteTests(unittest.TestCase):
    def setUp(self):
        fixtures.DraftTests.setUp(self)
        live.clear_cache()
        live._clip_cache.clear()
        self.addCleanup(live.clear_cache)
        self.addCleanup(live._clip_cache.clear)
        env = patch.dict(os.environ, {'VOID_CONTENT_PUBLISH_ENABLED': 'true', 'VOID_ACCOUNTS_ENABLED': 'true'})
        env.start()
        self.addCleanup(env.stop)

    def post(self, path, body, token='owner'):
        h = {'Authorization': 'Bearer ' + token} if token else {}
        return self.client.post('/api/void-runner/developer/' + path, headers=h, json=body)

    def upload(self, data, kind=None, token='owner', h=None):
        return self.post('voice-clips/' + (h or hashlib.sha256(data).hexdigest()), {'type': kind or live.sniff(data), 'data': base64.b64encode(data).decode()}, token)

    def test_only_the_content_editor_uploads(self):
        data = wav(1)
        for token, status in [(None, 401), ('forged', 401), ('outsider', 403)]:
            self.assertEqual(self.upload(data, token=token).status_code, status)
            self.assertEqual(self.post('voice-clips', {'hashes': [hashlib.sha256(data).hexdigest()]}, token).status_code, status)
        with patch.dict(os.environ, {'VOID_CONTENT_PUBLISH_ENABLED': 'false'}):
            self.assertEqual(self.upload(data).status_code, 404)
        self.assertEqual(self.db.data, {})

    def test_upload_checks_type_size_length_and_address(self):
        cases = [(self.upload(wav(1), kind='audio/mpeg'), 415), (self.upload(b'<html>' * 100, kind='audio/ogg'), 415), (self.upload(wav(1), h='0' * 64), 422),
                 (self.upload(wav(41)), 413), (self.upload(wav(42, rate=4000)), 422), (self.upload(b'OggS' + b'\x00' * 60), 422),
                 (self.post('voice-clips/' + 'a' * 64, {'type': 'audio/wav', 'data': '***'}), 400), (self.post('voice-clips/' + 'a' * 64, {'type': 'audio/mp4', 'data': 'AAAA'}), 415),
                 (self.post('voice-clips/nothex', {'type': 'audio/wav', 'data': 'AAAA'}), 404), (self.post('voice-clips/' + 'a' * 64, {'type': 'audio/wav', 'data': 'AAAA', 'x': 1}), 415)]
        for i, (r, status) in enumerate(cases):
            self.assertEqual(r.status_code, status, (i, r.json))
        self.assertEqual(self.db.data, {})
        big = self.client.post('/api/void-runner/developer/voice-clips/' + 'a' * 64, headers={'Authorization': 'Bearer owner'}, data=b'x' * 950_000, content_type='application/json')
        self.assertEqual(big.status_code, 413)

    def test_upload_publish_and_play_without_sign_in(self):
        data, mp = wav(2.5), mp3(120)
        hashes = [hashlib.sha256(x).hexdigest() for x in (data, mp)]
        self.assertEqual(self.post('voice-clips', {'hashes': hashes}).json['missing'], sorted(hashes))
        c = [clip(data, duration=2.5), clip(mp, who='zen-zephyr', text='[softly] Breathe.', duration=3.13)]
        r = self.post('live-content/publish', {'expected': 0, 'content': doc(clips=c)})
        self.assertEqual(r.status_code, 422, 'nothing is published before its files are on the server')
        self.assertEqual(r.json['missing'], sorted(hashes))
        first = self.upload(data)
        self.assertEqual(first.status_code, 200, first.json)
        self.assertEqual((first.json['type'], first.json['existed'], first.json['duration']), ('audio/wav', False, 2.5))
        self.assertTrue(self.upload(data).json['existed'], 'the same file twice is stored once')
        self.assertEqual(self.upload(mp).status_code, 200)
        stored = self.db.data['vr_voice_clips/' + hashes[0]]
        self.assertEqual(base64.b64decode(stored['data']), data)
        self.assertLess(len(repr(stored)), 1_000_000, 'one Firestore document under 1 MiB')
        self.assertEqual(self.post('voice-clips', {'hashes': hashes}).json['missing'], [])
        r = self.post('live-content/publish', {'expected': 0, 'content': doc(clips=c)})
        self.assertEqual(r.status_code, 200, r.json)
        live.clear_cache()
        self.assertEqual(self.client.get('/api/void-runner/live-content').json['content']['clips'], c)
        got = self.client.get('/api/void-runner/voice-clip/' + hashes[1])
        self.assertEqual((got.status_code, got.mimetype, got.data), (200, 'audio/mpeg', mp))
        self.assertIn('immutable', got.headers['Cache-Control'])
        self.assertEqual(self.client.get('/api/void-runner/voice-clip/' + 'f' * 64).status_code, 404)
        self.assertEqual(self.client.get('/api/void-runner/voice-clip/nothex').status_code, 404)
        with patch.dict(os.environ, {'VOID_CONTENT_PUBLISH_ENABLED': 'false'}):
            self.assertEqual(self.client.get('/api/void-runner/voice-clip/' + hashes[1]).status_code, 404)

    def test_bake_tool_dry_run_lists_published_files(self):
        data = wav(1.5)
        h = hashlib.sha256(data).hexdigest()
        content = {'version': 3, 'content': doc(clips=[clip(data, duration=1.5)])}
        with tempfile.TemporaryDirectory() as d:
            src = os.path.join(d, 'live.json')
            os.makedirs(os.path.join(d, 'clips'))
            with open(os.path.join(d, 'clips', h), 'wb') as f:
                f.write(data)
            with open(src, 'w', encoding='utf-8') as f:
                json.dump(content, f)
            r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'audio', 'bake-imported.py'), '--content-file', src, '--clips-dir', os.path.join(d, 'clips'), '--dry-run'],
                               capture_output=True, text=True, cwd=ROOT)
            self.assertEqual(r.returncode, 0, r.stderr + r.stdout)
            self.assertIn('admin-imp-' + h[:10], r.stdout)
            self.assertIn('1 imported voice file(s)', r.stdout)
            # a real bake writes only into the checkout it is given (a throwaway copy here), never the real repository
            real = os.path.join(ROOT, 'void-runner', 'assets', 'audio', 'voice', 'extra', 'manifest.json')
            with open(real, 'rb') as f:
                before = f.read()
            repo = os.path.join(d, 'repo')
            extra = os.path.join(repo, 'void-runner', 'assets', 'audio', 'voice', 'extra')
            os.makedirs(extra)
            with open(os.path.join(extra, 'manifest.json'), 'w', encoding='utf-8') as f:
                json.dump({'version': 1, 'lines': {}}, f)
            if shutil.which('ffmpeg'):
                r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'audio', 'bake-imported.py'), '--content-file', src, '--clips-dir', os.path.join(d, 'clips'), '--repo', repo],
                                   capture_output=True, text=True, cwd=ROOT)
                self.assertEqual(r.returncode, 0, r.stderr + r.stdout)
                with open(os.path.join(extra, 'manifest.json'), encoding='utf-8') as f:
                    entry = json.load(f)['lines']['admin-imp-' + h[:10]]
                self.assertEqual((entry['speaker'], entry['text'], entry['importedHash']), ('admin', 'Keep it down.', h))
                with open(os.path.join(extra, entry['file'][len('extra/'):]), 'rb') as f:
                    self.assertEqual(f.read(4), b'OggS')
            with open(real, 'rb') as f:
                self.assertEqual(f.read(), before, 'the real manifest is untouched')


if __name__ == '__main__':
    unittest.main()
