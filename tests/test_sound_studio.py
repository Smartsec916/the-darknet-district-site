import copy
import io
import os
import unittest
import wave
from unittest.mock import patch

import test_content_drafts as fixtures
import void_runner_audio_studio as studio

ROOT = '/api/void-runner/'
PRIVATE = ROOT + 'developer/studio/audio'
PUBLIC = ROOT + 'studio/audio'


class SoundTests(unittest.TestCase):
    def setUp(self):
        fixtures.DraftTests.setUp(self)
        env = patch.dict(os.environ, {'VOID_ADMIN_UIDS': 'owner', 'VOID_ACCOUNTS_ENABLED': 'true'})
        env.start()
        self.addCleanup(env.stop)
        writer = patch.object(fixtures.Ref, 'set', lambda ref, data: ref.db.data.update({ref.key: data}), create=True)
        writer.start()
        self.addCleanup(writer.stop)

    def test_media_privacy_publish_revisions_and_removal(self):
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav:
            wav.setparams((1, 2, 22050, 0, 'NONE', 'not compressed'))
            wav.writeframes(bytes(44100))
        binary = buffer.getvalue()
        def upload(headers):
            return self.client.post(PRIVATE + '/upload', data=binary, headers=headers, content_type='audio/wav')
        self.assertEqual(upload({}).status_code, 401)
        self.assertEqual(upload({'Authorization': 'Bearer outsider'}).status_code, 403)
        response = upload(self.header)
        self.assertEqual(response.status_code, 200, response.json)
        sha = response.json['src']
        self.assertEqual(upload(self.header).json['src'], sha)
        self.assertEqual(self.client.get(PUBLIC + '/media/' + sha).status_code, 404)
        preview = self.client.get(PRIVATE + '/media/' + sha, headers=self.header)
        self.assertEqual(preview.data, binary)
        self.assertIn('no-store', preview.headers['Cache-Control'])
        content = copy.deepcopy(studio.EMPTY)
        a = dict(id='demo', src=sha, name='Record', category='Music', tags=['test'], volume=1, start=0, end=0, loop=False, fadeIn=0, fadeOut=0, rate=1, pitch=0)
        content['assets'].append(a)
        content['locations'].append(dict(id='evening', area='district-store', tracks=[dict(asset='demo', volume=.4)], shuffle=False, crossfade=1, gap=0, loop=True, resume=True, fromHour=20, toHour=5))
        def put(action, rev, version):
            return self.client.post(PRIVATE + '/' + action, headers=self.header, json=dict(revision=rev, expected=version, content=content))
        self.assertEqual(put('draft', 0, 0).json['revision'], 1)
        self.assertEqual(put('draft', 0, 0).status_code, 409)
        self.assertEqual(self.client.get(PUBLIC).json['content']['assets'], [])
        self.assertEqual(put('publish', 1, 1).status_code, 409)
        self.assertEqual(put('publish', 1, 0).json['version'], 1)
        self.assertEqual(self.client.get(PUBLIC+'/media/'+sha).data, binary)
        content = copy.deepcopy(studio.EMPTY)
        self.assertEqual(put('publish', 2, 1).json['version'], 2)
        self.assertEqual(self.client.get(PUBLIC+'/media/'+sha).status_code, 404)

    def test_invalid_upload_and_references(self):
        self.assertEqual(self.client.post(PRIVATE+'/upload', data=b'fake audio', headers=self.header).status_code, 422)
        content = copy.deepcopy(studio.EMPTY)
        content['events'] = [dict(id='door', asset=['unknown'])]
        response = self.client.post(PRIVATE+'/draft', headers=self.header, json=dict(content=content,revision=0))
        self.assertEqual(response.status_code, 422)

    def test_import_validation_does_not_save_or_publish(self):
        content = copy.deepcopy(studio.EMPTY)
        content['mix']['master'] = .65
        url = PRIVATE + '/validate'
        self.assertEqual(self.client.post(url, json={'content': content}).status_code, 401)
        result = self.client.post(url, headers=self.header, json={'content': content})
        self.assertEqual(result.json['content'], content)
        self.assertIsNone(self.client.get(PRIVATE, headers=self.header).json['draft']['content'])
        self.assertEqual(self.client.get(PUBLIC).json['version'], 0)
        content['mix']['master'] = 3
        self.assertEqual(self.client.post(url, headers=self.header, json={'content': content}).status_code, 422)
