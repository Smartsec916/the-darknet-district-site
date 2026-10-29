"""Draft service contract: fake Firestore commits are atomic and serialized, no production calls."""
import copy
import os
import threading
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from flask import Flask
import void_runner_api as vr
import void_runner_drafts as drafts

class Ref:
    def __init__(self, db, key): self.db,self.key=db,key
    def collection(self,name): return Collection(self.db,self.key+'/'+name)
    def get(self,**kwargs): return SimpleNamespace(to_dict=lambda:copy.deepcopy(self.db.data.get(self.key)))
class Collection:
    def __init__(self,db,key):self.db,self.key=db,key
    def document(self,key):return Ref(self.db,self.key+'/'+key)
class Transaction:
    def __init__(self,db):self.db=db;self.writes=[]
    def set(self,ref,data):self.writes.append((ref.key,copy.deepcopy(data),False))
    def create(self,ref,data):self.writes.append((ref.key,copy.deepcopy(data),True))
class DB:
    def __init__(self):self.data={};self.lock=threading.Lock()
    def collection(self,key):return Collection(self,key)
    def transaction(self):return Transaction(self)
def transactional(fn):
    def call(tx):
        with tx.db.lock:
            result=fn(tx)
            for key,value,create in tx.writes:
                if create and key in tx.db.data:raise ValueError('immutable revision exists')
            for key,value,_ in tx.writes:tx.db.data[key]=value
            return result
    return call

class DraftTests(unittest.TestCase):
    def setUp(self):
        self.db=DB();self.inv=drafts.inventory();self.doc=drafts.template('mission','registry:flight-training',self.inv)
        self.app=Flask(__name__);self.app.register_blueprint(vr.api);self.client=self.app.test_client();self.url='/api/void-runner/developer/drafts'
        def verify(token,**kw):
            if token not in ['owner','outsider']:raise ValueError('invalid')
            return {'uid':token}
        self.services=patch.object(vr,'services',return_value=(self.db,SimpleNamespace(verify_id_token=verify),None));self.services.start();self.addCleanup(self.services.stop)
        self.env=patch.dict(os.environ,{'VOID_ADMIN_UIDS':'owner,outsider','VOID_CONTENT_EDITOR_UID':'owner','VOID_CONTENT_DRAFTS_ENABLED':'true'});self.env.start();self.addCleanup(self.env.stop)
        self.tx=patch('firebase_admin.firestore.transactional',transactional);self.tx.start();self.addCleanup(self.tx.stop)
        self.header={'Authorization':'Bearer owner'}
    def post(self,doc=None,revision=0,name='flight'):
        return self.client.post(self.url+'/'+name,headers=self.header,json={'revision':revision,'document':doc or self.doc})
    def test_unauthorized_reads_and_writes_fail_closed(self):
        for method in [self.client.get,self.client.post]:
            for token,status in [(None,401),('forged',401),('outsider',403)]:
                h={} if token is None else {'Authorization':'Bearer '+token}
                self.assertEqual(method(self.url+'/flight',headers=h,json={}).status_code,status)
        self.assertEqual(self.db.data,{})
    def test_disabled_and_unconfigured_editor_fail_closed(self):
        with patch.dict(os.environ,{'VOID_CONTENT_DRAFTS_ENABLED':'false'}):self.assertEqual(self.post().status_code,503)
        with patch.dict(os.environ,{'VOID_CONTENT_EDITOR_UID':''}):self.assertEqual(self.post().status_code,403)
        self.assertEqual(self.db.data,{})
    def test_save_read_list_and_immutable_history(self):
        self.assertEqual(self.post().status_code,200);self.doc['data']['title']='Draft title'
        self.assertEqual(self.post(revision=1).json['revision'],2)
        self.assertEqual(self.client.get(self.url+'/flight?revision=1',headers=self.header).json['document']['data']['title'],'FLIGHT TRAINING')
        self.assertEqual(self.client.get(self.url+'/flight',headers=self.header).json['document']['data']['title'],'Draft title')
        self.assertEqual(len(self.client.get(self.url,headers=self.header).json['drafts']),1)
        self.assertTrue(all(k.startswith(('vr_content_drafts/','vr_content_workspaces/')) for k in self.db.data))
    def test_stale_revision_conflicts_without_overwriting(self):
        self.post();before=copy.deepcopy(self.db.data);self.assertEqual(self.post().status_code,409);self.assertEqual(self.db.data,before)
        self.assertEqual(self.post(revision=True).status_code,400)
    def test_concurrent_same_revision_has_one_winner(self):
        results=[]
        def save():
            try:results.append(drafts.save(self.db,'owner','flight',{'revision':0,'document':self.doc},self.inv)['revision'])
            except drafts.DraftError as e:results.append(e.status)
        threads=[threading.Thread(target=save) for _ in range(2)]
        for t in threads:t.start()
        for t in threads:t.join()
        self.assertCountEqual(results,[1,409])
    def test_invalid_effect_expression_xss_and_dependency_rejected(self):
        for change in [lambda d:d['data']['prerequisites'].append('missing'),lambda d:d['data']['prerequisites'].append(d['data']['id']),lambda d:d['data']['rewards'].append({'type':'execute','amount':0}),lambda d:d['data'].update(title='<img src=x onerror=alert(1)>'),lambda d:d.update(code='eval(1)')]:
            d=copy.deepcopy(self.doc);change(d);self.assertEqual(self.post(d).status_code,400)
        self.assertEqual(self.db.data,{})
    def test_global_graph_detects_cycle_across_drafts(self):
        a=copy.deepcopy(self.doc);a.update(sourceKey='new');a['data'].update(id='draft-a',prerequisites=[])
        self.assertEqual(self.post(a,name='a').status_code,200)
        b=copy.deepcopy(a);b['data'].update(id='draft-b',prerequisites=['draft-a']);self.assertEqual(self.post(b,name='b').status_code,200)
        a['data']['prerequisites']=['draft-b'];self.assertEqual(self.post(a,revision=1,name='a').status_code,400)
    def test_ids_source_revision_voice_and_legacy_adapter_preserved(self):
        d=copy.deepcopy(self.doc);d['data']['id']='renamed';self.assertEqual(self.post(d).status_code,400)
        d=copy.deepcopy(self.doc);d['baseRevision']='stale';self.assertEqual(self.post(d).status_code,409)
        line=next(l for l in self.inv['lines'] if l['kind']=='recorded-literal');self.assertEqual(self.client.get(self.url+'/template?kind=dialogue&source='+line['id'],headers=self.header).status_code,422)
        dialog=drafts.template('dialogue','mara_workshop_intro',self.inv);dialog['data']['nodes'][0]['voice']='iris';self.assertEqual(self.post(dialog).status_code,400)
    def test_dialogue_branches_unreachable_nodes_and_effects(self):
        d=drafts.template('dialogue','mara_workshop_intro',self.inv);self.assertEqual(self.post(d,name='mara').status_code,200)
        for mutate in [lambda x:x['data']['nodes'][0].update(next='missing'),lambda x:x['data']['nodes'][0].update(next='legacy'),lambda x:x['data']['nodes'][0]['effects'].append({'type':'execute','key':'x','value':True})]:
            bad=copy.deepcopy(d);mutate(bad);self.assertEqual(self.post(bad,revision=1,name='mara').status_code,400)
    def test_preview_validation_does_not_touch_database_or_saves(self):
        before=copy.deepcopy(self.db.data);response=self.client.post(self.url+'/validate',headers=self.header,json=self.doc)
        self.assertEqual(response.status_code,200);self.assertTrue(response.json['previewOnly']);self.assertEqual(self.db.data,before)
        self.doc['data']['enabled']=False;r=drafts.validate(self.doc,self.inv);self.assertTrue(any('active saves' in x for x in r['warnings']))
    def test_no_publishing_endpoint_or_publisher_role(self):
        self.assertFalse(drafts.roles('owner',vr.balance_admin)['publisher'])
        self.assertEqual(self.client.post(self.url+'/flight/publish',headers=self.header).status_code,404)

    def test_malformed_shapes_and_protected_voice_assignments_are_rejected(self):
        for mutate in [lambda d:d['data'].update(rewards=[None]),lambda d:d['data'].update(objectives=[1]),lambda d:d['data'].update(availability={'locations':[], 'conditions':[{'type':'eval','key':'x','value':True}]})]:
            d=copy.deepcopy(self.doc);mutate(d);self.assertEqual(self.post(d).status_code,400)
        scene=drafts.template('dialogue','mara_workshop_intro',self.inv);scene['data']['nodes'][0].update(character='iris',voice='iris');self.assertEqual(self.post(scene).status_code,400)
    def test_client_cannot_replace_identity_or_private_owner(self):
        d=copy.deepcopy(self.doc);d['owner']='outsider';self.assertEqual(self.post(d).status_code,400)
        self.post();before=copy.deepcopy(self.db.data);d=copy.deepcopy(self.doc);d['sourceKey']='new';d['data']['id']='draft-altered';self.assertEqual(self.post(d,revision=1).status_code,409);self.assertEqual(self.db.data,before)
    def test_cursor_compatibility_warnings_remain_separate_from_live_saves(self):
        scene=drafts.template('dialogue','mara_workshop_intro',self.inv);scene['data']['nodes']=[scene['data']['nodes'][0]];scene['data']['nodes'][0]['next']=None
        report=drafts.validate(scene,self.inv);self.assertTrue(any('cursor node IDs' in w for w in report['warnings']));self.assertEqual(self.db.data,{})
