"""Private release candidate ledger; fake storage tests do not authorize production publication."""
import copy
import os
import threading
import unittest
from unittest.mock import patch
import test_content_drafts as fixtures
import void_runner_publication as releases
import void_runner_drafts as drafts

class ReleaseTests(unittest.TestCase):
    setUp = fixtures.DraftTests.setUp
    post = fixtures.DraftTests.post
    def setup_release(self):
        env=patch.dict(os.environ,{'VOID_CONTENT_RELEASES_ENABLED':'true','VOID_CONTENT_PUBLISHER_UID':'owner'})
        env.start();self.addCleanup(env.stop)
        self.assertEqual(self.post().status_code,200)
    def payload(self,expected=0,revision=1):
        return {'expectedRevision':expected,'drafts':[{'id':'flight','revision':revision}],'reason':'Reviewed source-compatible candidate'}
    def release(self,path,payload=None,token='owner'):
        return self.client.post('/api/void-runner/developer/releases/'+path,headers={'Authorization':'Bearer '+token},json=payload or self.payload())
    def test_schema_and_disabled_owner_boundary(self):
        for token,status in [('forged',401),('outsider',403)]:
            self.assertEqual(self.client.get('/api/void-runner/developer/releases/schema',headers={'Authorization':'Bearer '+token}).status_code,status)
        self.assertEqual(self.client.get('/api/void-runner/developer/releases').status_code,401)
        self.assertEqual(self.release('prepare').status_code,503)
        self.assertEqual(self.db.data,{})
        with patch.dict(os.environ,{'VOID_CONTENT_PUBLISHER_UID':''}):
            r=self.client.get('/api/void-runner/developer/releases/schema',headers=self.header)
            self.assertFalse(r.json['roles']['publisher']);self.assertFalse(r.json['roles']['liveActivationImplemented'])
    def test_editor_plan_is_inert_and_publisher_is_separate(self):
        self.setup_release();before=copy.deepcopy(self.db.data)
        with patch.dict(os.environ,{'VOID_CONTENT_PUBLISHER_UID':''}):
            plan=self.release('plan');self.assertEqual(plan.status_code,200);self.assertEqual(plan.json['writes'],0)
            self.assertEqual(self.release('prepare').status_code,403)
        self.assertEqual(self.db.data,before)
    def test_atomic_candidate_history_comparison_and_rollback(self):
        self.setup_release();first=self.release('prepare');self.assertEqual(first.status_code,200);self.assertEqual(first.json['revision'],1)
        self.doc['data']['title']='Reviewed training title';self.assertEqual(self.post(revision=1).status_code,200)
        plan=self.release('plan',self.payload(1,2));self.assertEqual(plan.status_code,200);self.assertIn('Reviewed training title',str(plan.json['diff']))
        self.assertEqual(self.release('prepare',self.payload(1,2)).json['revision'],2)
        third=self.release('rollback',{'expectedRevision':2,'targetRevision':1,'reason':'Restore earlier reviewed candidate'})
        self.assertEqual(third.status_code,200);self.assertEqual(third.json['revision'],3);self.assertEqual(third.json['action'],'rollback-candidate')
        self.assertEqual(third.json['documents'],first.json['documents'])
        original=self.client.get('/api/void-runner/developer/releases/1',headers=self.header)
        self.assertEqual(original.json,first.json)
        history=self.client.get('/api/void-runner/developer/releases',headers=self.header).json
        self.assertEqual(history['candidateRevision'],3);self.assertEqual(len(history['history']),3)
        self.assertTrue(all(k.startswith(('vr_content_drafts/','vr_content_workspaces/','vr_content_release_workspaces/','vr_content_releases/')) for k in self.db.data))
    def test_stale_draft_head_and_release_head_do_not_write(self):
        self.setup_release();self.post(revision=1);before=copy.deepcopy(self.db.data)
        self.assertEqual(self.release('prepare').status_code,409);self.assertEqual(self.db.data,before)
        self.assertEqual(self.release('prepare',self.payload(0,2)).status_code,200);before=copy.deepcopy(self.db.data)
        self.assertEqual(self.release('prepare',self.payload(0,2)).status_code,409);self.assertEqual(self.db.data,before)
    def test_concurrent_release_pointer_compare_and_swap(self):
        self.setup_release();results=[]
        def run():
            try:results.append(releases.prepare(self.db,'owner',self.payload(),self.inv)['revision'])
            except drafts.DraftError as e:results.append(e.status)
        threads=[threading.Thread(target=run) for _ in range(2)]
        for t in threads:t.start()
        for t in threads:t.join()
        self.assertCountEqual(results,[1,409])
    def test_source_revision_and_save_compatibility_fail_closed(self):
        self.setup_release();self.doc['data']['enabled']=False;self.assertEqual(self.post(revision=1).status_code,200)
        before=copy.deepcopy(self.db.data);self.assertEqual(self.release('prepare',self.payload(0,2)).status_code,422);self.assertEqual(self.db.data,before)
        stale=copy.deepcopy(self.inv);stale['revision']='changed'
        with self.assertRaises(drafts.DraftError):releases.prepare(self.db,'owner',self.payload(0,2),stale)
    def test_plain_text_reason_bounds_unsupported_payload_and_no_public_routes(self):
        self.setup_release()
        for payload in [{**self.payload(),'reason':'<img src=x>'},{**self.payload(),'expectedRevision':True},{**self.payload(),'activate':True},{**self.payload(),'drafts':[{'id':'flight','revision':1}]*2}]:
            self.assertEqual(self.release('prepare',payload).status_code,400)
        self.assertEqual(self.client.get('/api/void-runner/releases').status_code,404)
        self.assertEqual(self.release('prepare',token='outsider').status_code,403)
    def test_new_identity_requires_native_save_adapter(self):
        self.setup_release();self.doc['sourceKey']='new';self.doc['data']['id']='draft-new';self.assertEqual(self.post(name='new').status_code,200)
        p=self.payload();p['drafts']=[{'id':'new','revision':1}]
        self.assertEqual(self.release('prepare',p).status_code,422)
    def test_rollback_revalidates_source_and_rejects_missing_target(self):
        self.setup_release();self.assertEqual(self.release('prepare').status_code,200)
        self.assertEqual(self.release('rollback',{'expectedRevision':1,'targetRevision':20,'reason':'Missing target must not write'}).status_code,404)
        with patch.object(drafts,'inventory',return_value={**self.inv,'revision':'changed'}):
            self.assertEqual(self.release('rollback',{'expectedRevision':1,'targetRevision':1,'reason':'Stale source must not write'}).status_code,409)
    def test_package_byte_limit_and_owner_mismatch(self):
        with self.assertRaises(drafts.DraftError):releases.inspect_package({'x':{'large':'x'*(releases.MAX_PACKAGE_BYTES+1)}},self.inv)
        self.setup_release();self.release('prepare');state,_=releases.refs(self.db,'owner');self.db.data[state.key]['owner']='outsider'
        self.assertEqual(self.client.get('/api/void-runner/developer/releases',headers=self.header).status_code,403)

    def test_dialogue_source_cursor_gate_and_version_comparison(self):
        self.setup_release()
        self.doc=drafts.template('dialogue','mara_workshop_intro',self.inv)
        self.doc['data']['nodes'][0]['text']='Private revised dialogue proposal.'
        self.assertEqual(self.post(name='dialogue').status_code,200)
        p=self.payload();p['drafts']=[{'id':'dialogue','revision':1}]
        self.assertEqual(self.release('prepare',p).status_code,200)
        p['expectedRevision']=1;self.doc['data']['nodes'][0]['text']='Second private revised dialogue.'
        self.assertEqual(self.post(name='dialogue',revision=1).status_code,200);p['drafts'][0]['revision']=2
        self.assertEqual(self.release('prepare',p).status_code,200)
        comparison=self.client.get('/api/void-runner/developer/releases/compare?from=1&to=2',headers=self.header)
        self.assertEqual(comparison.status_code,200);self.assertEqual(comparison.json['writes'],0)
        self.assertIn('Second private revised dialogue.',str(comparison.json['diff']))
        self.assertEqual(self.client.get('/api/void-runner/developer/releases/compare?from=1&to=2').status_code,401)
        self.assertEqual(self.client.get('/api/void-runner/developer/releases/compare?from=x&to=2',headers=self.header).status_code,400)