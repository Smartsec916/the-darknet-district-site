import os
import unittest
from unittest.mock import patch
import test_content_drafts as fixtures


class CinemaTests(unittest.TestCase):
    def setUp(self):
        fixtures.DraftTests.setUp(self)
        env = patch.dict(os.environ, {'VOID_ACCOUNTS_ENABLED':'true','VOID_ADMIN_UIDS':'owner'})
        env.start()
        self.addCleanup(env.stop)
        self.path='/api/void-runner/developer/studio/cinematics'
        self.project={'name':'Private trailer','place':'Meridian Station','actor':'none','resolution':720,'aspect':'16:9','fps':30,'clips':[]}

    def test_private_library_reopens_and_rejects_stale_writes(self):
        self.assertEqual(self.client.get(self.path).status_code,401)
        self.assertEqual(self.client.get(self.path,headers={'Authorization':'Bearer outsider'}).status_code,403)
        body={'revision':0,'projects':{'my-cut':self.project}}
        r=self.client.post(self.path,headers=self.header,json=body)
        self.assertEqual(r.status_code,200,r.json)
        self.assertEqual(self.client.get(self.path,headers=self.header).json['projects'],body['projects'])
        self.assertEqual(self.client.post(self.path,headers=self.header,json=body).status_code,409)
        self.project['clips']=[{'track':'Music','duration':1,'start':0,'src':'https://example.invalid/audio'}]
        self.assertEqual(self.client.post(self.path,headers=self.header,json=dict(revision=1,projects={'bad':self.project})).status_code,422)

    def test_private_feed_and_lighting(self):
        self.project.update(place='Blackrock camera feed', feed='mission-1/camera-2', hour=0)
        body = {'revision': 0, 'projects': {'feed': self.project}}
        self.assertEqual(self.client.post(self.path, headers=self.header, json=body).status_code, 200)
        self.assertEqual(self.client.get(self.path, headers=self.header).json['projects'], body['projects'])
        body['revision'] = 1
        for changes in ({'hour': 1.5}, {'hour': True}, {'hour': 23, 'place': 'Milked reception'}):
            self.project.update(changes)
            self.assertEqual(self.client.post(self.path, headers=self.header, json=body).status_code, 422)
