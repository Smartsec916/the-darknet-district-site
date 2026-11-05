"""Native compilation and explicit public activation; no cloud credentials used."""
import copy
import os
import threading
import unittest
from unittest.mock import patch
import test_content_drafts as fixtures
import void_runner_drafts as drafts
import void_runner_publication as releases
import void_runner_content_runtime as runtime

class RuntimePublicationTests(unittest.TestCase):
    setUp=fixtures.DraftTests.setUp
    post=fixtures.DraftTests.post
    def configure(self):
        p=patch.dict(os.environ,{'VOID_CONTENT_RELEASES_ENABLED':'true','VOID_CONTENT_PUBLISHER_UID':'owner',
                                'VOID_CONTENT_PUBLISHING_ENABLED':'true','VOID_CONTENT_SERVING_ENABLED':'true'})
        p.start();self.addCleanup(p.stop)
    def candidate(self):
        self.configure();self.doc['data']['title']='Reviewed training — café'
        self.assertEqual(self.post().status_code,200)
        r=releases.prepare(self.db,'owner',{'expectedRevision':0,'drafts':[{'id':'flight','revision':1}],
                                         'reason':'Review native adapter compatibility'},self.inv)
        c=runtime.compile_package(r['documents'],self.inv)
        import hashlib
        return {'expectedGeneration':0,'releaseRevision':1,'reason':'Approve this compiled source snapshot',
                'digest':hashlib.sha256(runtime.public_canonical(c).encode()).hexdigest()}
    def send(self,body,path='publish',token='owner'):
        return self.client.post('/api/void-runner/developer/releases/'+path,json=body,headers={'Authorization':'Bearer '+token})
    def test_disabled_public_read_has_no_database_access(self):
        with patch.dict(os.environ,{'VOID_CONTENT_SERVING_ENABLED':'false'}),patch.object(fixtures.vr,'services',side_effect=AssertionError('Disabled content must not read storage')):
            self.assertEqual(self.client.get('/api/void-runner/content').json,{'enabled':False,'schemaVersion':1})
        self.assertEqual(self.db.data,{})
    def test_publisher_and_feature_gate_reject_all_unauthorized_writes(self):
        payload=self.candidate();before=copy.deepcopy(self.db.data)
        for token,status in [('forged',401),('outsider',403)]:self.assertEqual(self.send(payload,token=token).status_code,status)
        for flag,status in [('VOID_CONTENT_PUBLISHER_UID',403),('VOID_CONTENT_PUBLISHING_ENABLED',503)]:
            with patch.dict(os.environ,{flag:''}):self.assertEqual(self.send(payload).status_code,status)
        self.assertEqual(self.db.data,before)
    def test_atomic_publish_is_sanitized_and_candidate_is_private_until_activation(self):
        payload=self.candidate();self.assertFalse(self.client.get('/api/void-runner/content').json['enabled'])
        result=self.send(payload);self.assertEqual(result.status_code,200)
        public=self.client.get('/api/void-runner/content').json
        self.assertEqual(public['generation'],1);self.assertEqual(public['content']['missions']['flight-training']['title'],'Reviewed training — café')
        self.assertEqual(set(public),{'schemaVersion','sourceRevision','generation','digest','content'})
        self.assertNotIn('reason',str(public));self.assertNotIn('owner',str(public));self.assertNotIn('sourceKey',str(public));self.assertNotIn('drafts',public)
        stored=copy.deepcopy(self.db.data);self.assertEqual(self.send(payload).status_code,409);self.assertEqual(self.db.data,stored)
    def test_changed_review_digest_or_stale_source_writes_nothing(self):
        payload=self.candidate();before=copy.deepcopy(self.db.data)
        self.assertEqual(self.send({**payload,'digest':'0'*64}).status_code,409);self.assertEqual(self.db.data,before)
        with patch.object(drafts,'inventory',return_value={**self.inv,'revision':'new-build'}):self.assertEqual(self.send(payload).status_code,409)
        self.assertEqual(self.db.data,before)
    def test_concurrent_publish_has_one_winner(self):
        payload=self.candidate();out=[]
        def run():
            try:out.append(runtime.publication(self.db,'owner',payload,self.inv)['generation'])
            except drafts.DraftError as e:out.append(e.status)
        ts=[threading.Thread(target=run) for _ in range(2)]
        for t in ts:t.start()
        for t in ts:t.join()
        self.assertCountEqual(out,[1,409])
    def test_rollback_and_baseline_are_new_audited_generations(self):
        payload=self.candidate();self.assertEqual(self.send(payload).status_code,200)
        active,_=runtime.refs(self.db);original=copy.deepcopy(self.db.data[active.key])
        r={'expectedGeneration':1,'targetGeneration':1,'reason':'Restore reviewed immutable snapshot','digest':payload['digest']}
        self.assertEqual(self.send(r,'rollback-live').status_code,200)
        self.assertEqual(self.db.data[active.key]['generation'],2)
        self.assertEqual(self.db.data[active.key]['content'],original['content'])
        state=self.client.get('/api/void-runner/developer/releases/publication',headers=self.header).json
        r.update(expectedGeneration=2,targetGeneration=0,digest=state['baselineDigest'])
        self.assertEqual(self.send(r,'rollback-live').status_code,200)
        self.assertEqual(self.client.get('/api/void-runner/content').json['content']['missions'],{})
        self.assertEqual(self.db.data['vr_runtime_versions/1'],original)
        self.assertEqual(len(self.db.data['vr_runtime_content/history']['history']),3)
    def test_rollback_integrity_and_missing_versions_fail_closed(self):
        payload=self.candidate();self.send(payload)
        rollback={'expectedGeneration':1,'targetGeneration':8,'reason':'Reject missing immutable version','digest':payload['digest']}
        self.assertEqual(self.send(rollback,'rollback-live').status_code,409)
        self.db.data['vr_runtime_versions/1']['digest']='0'*64
        rollback['targetGeneration']=1
        self.assertEqual(self.send(rollback,'rollback-live').status_code,409)
        self.assertEqual(self.db.data['vr_runtime_content/history']['generation'],1)
    def test_reward_and_objective_structure_changes_are_not_silently_ignored(self):
        for change in [lambda d:d['data']['rewards'].append({'type':'credits','amount':10}),
                       lambda d:d['data']['objectives'].reverse()]:
            doc=copy.deepcopy(self.doc);change(doc)
            with self.assertRaises(drafts.DraftError):runtime.compile_package({'mission':doc},self.inv)
    def test_dialogue_compilation_preserves_native_end_and_choice_effects(self):
        doc=drafts.template('dialogue','mara_workshop_intro',self.inv);doc['data']['nodes'][0]['text']='Approved test proposal'
        doc['data']['nodes'][2]['choices'][0]['condition']={'type':'mission-complete','key':'flight-training','value':True}
        out=runtime.compile_package({'scene':doc},self.inv)['dialogue']['mara_workshop_intro']
        self.assertEqual(out['nodes']['depart']['end'],'beginJourney')
        self.assertEqual(out['nodes']['work']['choices'][0]['when'],{'missions':['flight-training']})
        self.assertTrue(out['nodes']['work']['choices'][0]['effects']['flags']['maraPromise'])
    def test_no_new_nodes_or_replayed_node_actions(self):
        doc=drafts.template('dialogue','mara_workshop_intro',self.inv)
        doc['data']['nodes'][0]['effects']=[{'type':'relationship','key':'mara','value':1}]
        with self.assertRaises(drafts.DraftError):runtime.compile_package({'scene':doc},self.inv)
    def test_companion_projection_only_changes_registered_text_slot(self):
        line=next(l for l in self.inv['lines'] if l['kind']=='companion-literal')
        doc=drafts.template('dialogue',line['id'],self.inv);doc['data']['nodes'][0]['text']='Private test text for explicit review'
        result=runtime.compile_package({'line':doc},self.inv)
        self.assertEqual(result['companions'][0]['id'],line['character']);self.assertEqual(result['companions'][0]['path'],line['context'].split('.'))
    def test_other_source_build_is_never_served(self):
        payload=self.candidate();self.send(payload)
        with patch.object(drafts,'inventory',return_value={**self.inv,'revision':'other'}):self.assertFalse(self.client.get('/api/void-runner/content').json['enabled'])
    def test_repeated_relationship_actions_are_rejected_not_collapsed(self):
        with self.assertRaises(drafts.DraftError):runtime.compile_effects([{'type':'relationship','key':'mara','value':100},{'type':'relationship','key':'mara','value':-100}])

    def test_public_snapshot_cache_is_bounded_and_publication_invalidates_it(self):
        payload=self.candidate();runtime.clear_public_cache()
        original=fixtures.Ref.get;reads=[]
        def counted(ref,**kwargs):
            if ref.key=='vr_runtime_content/active':reads.append(ref.key)
            return original(ref,**kwargs)
        with patch.object(fixtures.Ref,'get',counted):
            self.client.get('/api/void-runner/content');self.client.get('/api/void-runner/content')
            self.assertEqual(len(reads),1)
            self.send(payload)
            self.assertEqual(self.client.get('/api/void-runner/content').json['generation'],1)
            self.assertEqual(len(reads),2)

    def test_native_conditions_are_never_silently_removed(self):
        inv=copy.deepcopy(self.inv);inv['dialogues'][0]['nodes'][2]['choices'][0]['when']={'flags':{'required':True}}
        doc=drafts.template('dialogue','mara_workshop_intro',inv)
        with self.assertRaises(drafts.DraftError):runtime.compile_package({'scene':doc},inv)

    def test_publication_cannot_reopen_missions_retire_saves_or_change_vr_isolation(self):
        for key in ['missionPool','shipAccess','campaignEpoch','vrReturn']:
            with self.assertRaises(drafts.DraftError):runtime.compile_effects([{'type':'set-flag','key':key,'value':False}])
