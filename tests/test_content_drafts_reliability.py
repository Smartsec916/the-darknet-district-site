"""Stage 3B.1: rebase, restore, archive, continue and export. In-memory Firestore double, mocked sign-in, no cloud."""
import copy
import json
import os
import threading
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from flask import Flask
import void_runner_api as vr
import void_runner_drafts as drafts
import void_runner_publication as releases
from test_content_drafts import DB, transactional

EDITOR = 'uid-editor-7f3a'


class ReliabilityTests(unittest.TestCase):
    def setUp(self):
        self.db=DB();self.inv=drafts.inventory();self.mission=drafts.template('mission','registry:flight-training',self.inv)
        self.app=Flask(__name__);self.app.register_blueprint(vr.api);self.client=self.app.test_client();self.url='/api/void-runner/developer/drafts'
        def verify(token,**kw):
            if token not in [EDITOR,'outsider']:raise ValueError('invalid')
            return {'uid':token}
        for p in [patch.object(vr,'services',return_value=(self.db,SimpleNamespace(verify_id_token=verify),None)),
                  patch.dict(os.environ,{'VOID_ADMIN_UIDS':EDITOR+',outsider','VOID_CONTENT_EDITOR_UID':EDITOR,'VOID_CONTENT_DRAFTS_ENABLED':'true'}),
                  patch('firebase_admin.firestore.transactional',transactional)]:
            p.start();self.addCleanup(p.stop)
        self.header={'Authorization':'Bearer '+EDITOR}

    def save(self,doc,revision=0,name='flight',inv=None):
        return drafts.save(self.db,EDITOR,name,{'revision':revision,'document':copy.deepcopy(doc)},inv or self.inv)

    def changed(self,mutate=None):
        """The inventory after a game update: a new revision, optionally with this content's source changed."""
        inv=copy.deepcopy(self.inv);inv['revision']='next-'+self.inv['revision']
        if mutate:mutate(inv)
        return inv

    def source_mission(self,inv):
        return next(m for m in inv['missions'] if m['key']=='registry:flight-training')

    def snapshot(self):
        return copy.deepcopy(self.db.data)

    def call(self,path,body=None,token=EDITOR,inv=None):
        headers={} if token is None else {'Authorization':'Bearer '+token}
        with patch.object(drafts,'inventory',return_value=inv or self.inv):
            return (self.client.get if body is None else self.client.post)(self.url+path,headers=headers,json=body)

    # ---- Rebase ----
    def test_draft_survives_an_unrelated_game_change(self):
        d=copy.deepcopy(self.mission);d['data']['description']='My private rewrite.';self.save(d)
        inv=self.changed()
        with self.assertRaises(drafts.DraftError) as blocked:self.save(d,1,inv=inv)
        self.assertEqual(blocked.exception.details['code'],'rebase-required')
        plan=self.call('/flight/rebase/plan',{},inv=inv).json
        self.assertEqual(plan['status'],'unrelated');self.assertEqual(plan['writes'],0);self.assertEqual(plan['document']['data'],d['data'])
        result=self.call('/flight/rebase',{'revision':1,'planDigest':plan['planDigest'],'confirm':True},inv=inv)
        self.assertEqual(result.status_code,200);self.assertEqual(result.json['revision'],2)
        self.assertEqual(result.json['document']['baseRevision'],inv['revision']);self.assertEqual(result.json['document']['data']['description'],'My private rewrite.')
        # Editing continues normally on the new inventory, and the pre-rebase revision is still there.
        d=result.json['document'];d['data']['title']='Edited after rebase';self.assertEqual(self.save(d,2,inv=inv)['revision'],3)
        self.assertEqual(drafts.load(self.db,EDITOR,'flight',1)['document']['baseRevision'],self.inv['revision'])

    def test_relevant_source_change_is_reviewed_and_merged_without_losing_draft_edits(self):
        d=copy.deepcopy(self.mission);d['data']['description']='My private rewrite.';self.save(d)
        inv=self.changed(lambda i:self.source_mission(i).update(title='FLIGHT TRAINING II'))
        plan=drafts.plan_rebase(self.db,EDITOR,'flight',{},inv)
        self.assertEqual(plan['status'],'relevant');self.assertEqual([c['unit'] for c in plan['changes']],['title'])
        self.assertEqual(plan['changes'][0]['resolution'],'source')
        merged=plan['document']['data'];self.assertEqual(merged['title'],'FLIGHT TRAINING II');self.assertEqual(merged['description'],'My private rewrite.')
        before=self.snapshot()
        for bad in [{'revision':1,'planDigest':plan['planDigest'],'confirm':False},{'revision':1,'planDigest':'0'*64,'confirm':True},{'revision':2,'planDigest':plan['planDigest'],'confirm':True}]:
            with self.assertRaises(drafts.DraftError):drafts.rebase(self.db,EDITOR,'flight',bad,inv)
        self.assertEqual(self.db.data,before)
        record=drafts.rebase(self.db,EDITOR,'flight',{'revision':1,'planDigest':plan['planDigest'],'confirm':True},inv)
        self.assertEqual(record['action'],'rebase');self.assertEqual(record['source']['inventoryRevision'],inv['revision'])
        self.assertEqual([h['action'] for h in record['history']],['save','rebase'])

    def test_conflicting_rebase_is_refused_without_changes_until_a_side_is_chosen(self):
        d=copy.deepcopy(self.mission);d['data']['title']='My title';self.save(d)
        inv=self.changed(lambda i:self.source_mission(i).update(title='Game title'))
        plan=drafts.plan_rebase(self.db,EDITOR,'flight',{},inv);self.assertEqual(plan['status'],'conflict')
        self.assertEqual(plan['conflicts'][0]['unit'],'title');self.assertNotIn('planDigest',plan)
        before=self.snapshot()
        r=self.call('/flight/rebase',{'revision':1,'planDigest':'0'*64,'confirm':True},inv=inv)
        self.assertEqual(r.status_code,409);self.assertEqual(r.json['code'],'rebase-conflict');self.assertEqual(self.db.data,before)
        for side,title in [('draft','My title'),('source','Game title')]:
            chosen=drafts.plan_rebase(self.db,EDITOR,'flight',{'resolutions':{'title':side}},inv)
            self.assertEqual(chosen['status'],'relevant');self.assertEqual(chosen['document']['data']['title'],title)
        record=drafts.rebase(self.db,EDITOR,'flight',{'revision':1,'planDigest':chosen['planDigest'],'confirm':True,'resolutions':{'title':'source'}},inv)
        self.assertEqual(record['document']['data']['title'],'Game title')
        self.assertEqual(drafts.load(self.db,EDITOR,'flight',1)['document']['data']['title'],'My title')

    def test_unsafe_rebase_fails_without_data_loss(self):
        self.save(self.mission);before=self.snapshot()
        gone=self.changed(lambda i:i.update(missions=[m for m in i['missions'] if m['key']!='registry:flight-training']))
        self.assertEqual(drafts.plan_rebase(self.db,EDITOR,'flight',{},gone)['status'],'invalid')
        r=self.call('/flight/rebase',{'revision':1,'planDigest':'0'*64,'confirm':True},inv=gone)
        self.assertEqual(r.status_code,409);self.assertEqual(r.json['code'],'rebase-invalid');self.assertEqual(self.db.data,before)

    def test_dialogue_rebase_merges_by_node(self):
        scene=drafts.template('dialogue','mara_workshop_intro',self.inv);nodes=scene['data']['nodes']
        scene['data']['nodes'][0]['text']='Draft line for the first node.';self.save(scene,name='mara')
        second=nodes[1]['id']
        def edit(i):
            n=next(x for x in next(s for s in i['dialogues'] if s['id']=='mara_workshop_intro')['nodes'] if x['id']==second);n['text']='Game rewrite of the second node.'
        plan=drafts.plan_rebase(self.db,EDITOR,'mara',{},self.changed(edit))
        self.assertEqual(plan['status'],'relevant');self.assertEqual([c['unit'] for c in plan['changes']],['node:'+second])
        by_id={n['id']:n for n in plan['document']['data']['nodes']}
        self.assertEqual(by_id[nodes[0]['id']]['text'],'Draft line for the first node.');self.assertEqual(by_id[second]['text'],'Game rewrite of the second node.')

    def test_a_save_cannot_skip_the_rebase_review(self):
        self.save(self.mission);inv=self.changed();before=self.snapshot()
        moved=copy.deepcopy(self.mission);moved['baseRevision']=inv['revision']
        with self.assertRaises(drafts.DraftError) as e:self.save(moved,1,inv=inv)
        self.assertEqual(e.exception.details['code'],'rebase-required');self.assertEqual(self.db.data,before)

    # ---- Restore and compare ----
    def test_historical_revision_is_restored_as_a_new_revision(self):
        d=copy.deepcopy(self.mission)
        for n,title in enumerate(['One','Two','Three']):d['data']['title']=title;self.save(d,n)
        diff=self.call('/flight/compare?from=1').json
        self.assertEqual(diff['writes'],0);self.assertEqual(diff['changes'],[{'unit':'title','before':'One','after':'Three'}])
        self.assertEqual(self.call('/flight/restore',{'revision':3,'fromRevision':1}).status_code,400)
        r=self.call('/flight/restore',{'revision':3,'fromRevision':1,'confirm':True})
        self.assertEqual(r.status_code,200);self.assertEqual(r.json['revision'],4);self.assertEqual(r.json['document']['data']['title'],'One')
        self.assertEqual(r.json['restoredFrom'],1);self.assertTrue(r.json['validation']['valid'])
        for n,title in [(1,'One'),(2,'Two'),(3,'Three')]:self.assertEqual(drafts.load(self.db,EDITOR,'flight',n)['document']['data']['title'],title)
        self.assertEqual([h['action'] for h in drafts.load(self.db,EDITOR,'flight')['history']],['save','save','save','restore'])

    def test_stale_restore_fails_safely(self):
        d=copy.deepcopy(self.mission)
        for n in range(3):d['data']['title']='T'+str(n);self.save(d,n)
        before=self.snapshot()
        r=self.call('/flight/restore',{'revision':2,'fromRevision':1,'confirm':True})
        self.assertEqual(r.status_code,409);self.assertEqual(r.json['currentRevision'],3);self.assertEqual(self.db.data,before)
        self.assertEqual(self.call('/flight/restore',{'revision':3,'fromRevision':3,'confirm':True}).status_code,400)

    def test_restored_content_from_an_old_inventory_must_be_rebased_before_release(self):
        d=copy.deepcopy(self.mission);d['data']['title']='Old inventory';self.save(d);inv=self.changed()
        plan=drafts.plan_rebase(self.db,EDITOR,'flight',{},inv);drafts.rebase(self.db,EDITOR,'flight',{'revision':1,'planDigest':plan['planDigest'],'confirm':True},inv)
        restored=drafts.restore(self.db,EDITOR,'flight',{'revision':2,'fromRevision':1,'confirm':True},inv)
        self.assertFalse(restored['validation']['valid']);self.assertEqual(restored['validation']['code'],'rebase-required')
        with patch.dict(os.environ,{'VOID_CONTENT_RELEASES_ENABLED':'true','VOID_CONTENT_PUBLISHER_UID':EDITOR}):
            with self.assertRaises(drafts.DraftError) as e:
                releases.prepare(self.db,EDITOR,{'expectedRevision':0,'drafts':[{'id':'flight','revision':3}],'reason':'Release review check'},inv)
        self.assertEqual(e.exception.status,409)
        self.assertEqual(drafts.plan_rebase(self.db,EDITOR,'flight',{},inv)['status'],'unrelated')

    # ---- Archive ----
    def test_archiving_frees_a_slot_and_archived_drafts_are_recoverable(self):
        with patch.object(drafts,'MAX_DRAFTS',2):
            self.save(self.mission)
            scene=drafts.template('dialogue','mara_workshop_intro',self.inv);self.save(scene,name='mara')
            new=copy.deepcopy(scene);new.update(sourceKey='new',adapter='new-dialogue');new['data']['id']='draft-extra'
            with self.assertRaises(drafts.DraftError) as full:self.save(new,name='extra')
            self.assertEqual(full.exception.details['code'],'draft-limit')
            self.assertEqual(self.call('/flight/archive',{'revision':1}).status_code,400)
            r=self.call('/flight/archive',{'revision':1,'confirm':True});self.assertEqual(r.status_code,200);self.assertTrue(r.json['archived'])
            self.assertEqual(self.save(new,name='extra')['revision'],1)
            listing=self.call('').json;self.assertEqual([d['id'] for d in listing['archived']],['flight']);self.assertNotIn('flight',[d['id'] for d in listing['drafts']])
            self.assertEqual(self.call('/flight').json['document']['data']['title'],'FLIGHT TRAINING')
            self.assertEqual(self.call('/flight/unarchive',{'revision':1,'confirm':True}).json['code'],'draft-limit')
            self.call('/extra/archive',{'revision':1,'confirm':True})
            r=self.call('/flight/unarchive',{'revision':1,'confirm':True});self.assertEqual(r.status_code,200);self.assertFalse(r.json['archived'])
            self.assertEqual([h['action'] for h in r.json['history']],['save','archive','unarchive'])
            self.assertEqual(len(self.db.data['vr_content_drafts/'+drafts.owner_key(EDITOR)+'_flight/vr_content_revisions/1']['document']['data']['objectives']),len(self.mission['data']['objectives']))

    def test_archived_drafts_cannot_be_edited_rebased_restored_or_released(self):
        d=copy.deepcopy(self.mission);self.save(d);d['data']['title']='Second';self.save(d,1)
        self.call('/flight/archive',{'revision':2,'confirm':True});before=self.snapshot()
        with self.assertRaises(drafts.DraftError) as e:self.save(d,2)
        self.assertEqual(e.exception.details['code'],'archived')
        self.assertEqual(self.call('/flight/restore',{'revision':2,'fromRevision':1,'confirm':True}).json['code'],'archived')
        inv=self.changed();plan=self.call('/flight/rebase/plan',{},inv=inv).json;self.assertTrue(plan['archived'])
        self.assertEqual(self.call('/flight/rebase',{'revision':2,'planDigest':plan['planDigest'],'confirm':True},inv=inv).json['code'],'archived')
        with patch.dict(os.environ,{'VOID_CONTENT_RELEASES_ENABLED':'true','VOID_CONTENT_PUBLISHER_UID':EDITOR}):
            with self.assertRaises(drafts.DraftError) as e:
                releases.prepare(self.db,EDITOR,{'expectedRevision':0,'drafts':[{'id':'flight','revision':2}],'reason':'Release review check'},self.inv)
        self.assertIn('Archived',e.exception.message);self.assertEqual(self.db.data,before)

    # ---- Revision limit ----
    def test_revision_limit_never_loses_work(self):
        with patch.object(drafts,'MAX_REVISIONS',3):
            d=copy.deepcopy(self.mission)
            for n in range(3):d['data']['title']='T'+str(n);self.save(d,n)
            before=self.snapshot()
            with self.assertRaises(drafts.DraftError) as e:self.save(d,3)
            self.assertEqual(e.exception.details['code'],'revision-limit');self.assertEqual(self.db.data,before)
            r=self.call('/flight/continue',{'revision':3,'newId':'flight-2','confirm':True});self.assertEqual(r.status_code,200)
            self.assertEqual(r.json['continuedFrom'],{'id':'flight','revision':3});self.assertEqual(r.json['document']['data']['title'],'T2')
            old=drafts.load(self.db,EDITOR,'flight');self.assertTrue(old['archived'])
            for n in range(1,4):self.assertEqual(drafts.load(self.db,EDITOR,'flight',n)['document']['data']['title'],'T'+str(n-1))
            d['data']['title']='Carried on';self.assertEqual(self.save(d,1,name='flight-2')['revision'],2)

    # ---- Export ----
    def test_export_contains_every_draft_revision_and_verifies(self):
        d=copy.deepcopy(self.mission);self.save(d);d['data']['title']='Second';self.save(d,1)
        self.save(drafts.template('dialogue','mara_workshop_intro',self.inv),name='mara');self.call('/mara/archive',{'revision':1,'confirm':True})
        data=self.call('/export').json
        self.assertEqual((data['format'],data['formatVersion'],data['draftSchemaVersion']),(drafts.EXPORT_FORMAT,1,1))
        self.assertEqual(data['sourceInventoryRevision'],self.inv['revision']);self.assertEqual(data['counts'],{'active':1,'archived':1,'revisions':3})
        flight=next(x for x in data['drafts'] if x['id']=='flight')
        self.assertEqual([r['document']['data']['title'] for r in flight['revisions']],['FLIGHT TRAINING','Second'])
        self.assertTrue(all('updatedAt' in r and r['source']['inventoryRevision']==self.inv['revision'] for r in flight['revisions']))
        self.assertTrue(next(x for x in data['drafts'] if x['id']=='mara')['archived'])
        self.assertEqual(drafts.verify_export(data)['revisions'],3)
        tampered=copy.deepcopy(data);tampered['drafts'][0]['revisions'][0]['document']['data']['title']='Edited outside'
        with self.assertRaises(drafts.DraftError):drafts.verify_export(tampered)
        heads=self.call('/export?history=heads').json;self.assertEqual(heads['includes'],'heads-only');self.assertEqual(heads['counts']['revisions'],0)
        self.assertEqual(self.call('/export?history=everything').status_code,400)

    def test_offline_verifier_accepts_an_intact_export_and_rejects_a_changed_one(self):
        import subprocess,sys,tempfile
        self.save(self.mission);data=self.call('/export').json
        tool=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tools','verify-draft-export.py')
        with tempfile.TemporaryDirectory() as folder:
            path=os.path.join(folder,'export.json')
            for body,code in [(data,0),({**data,'sourceInventoryRevision':'edited'},1)]:
                with open(path,'w',encoding='utf-8') as f:json.dump(body,f)
                run=subprocess.run([sys.executable,'-I',tool,path],capture_output=True,text=True)
                self.assertEqual(run.returncode,code,run.stdout+run.stderr)

    def test_export_excludes_secrets_account_ids_and_player_data(self):
        self.save(self.mission);self.db.data['vr_players/someone']={'credits':999,'email':'player@example.com'}
        with patch.dict(os.environ,{'STRIPE_SECRET_KEY':'sk_test_DO_NOT_EXPORT','OPENAI_API_KEY':'sk-DO_NOT_EXPORT'}):
            text=json.dumps(self.call('/export').json)
        for secret in [EDITOR,'DO_NOT_EXPORT','player@example.com','999','vr_players']:self.assertNotIn(secret,text)
        self.assertIn(drafts.owner_key(EDITOR),text)

    # ---- Authorization ----
    def test_every_new_operation_requires_the_configured_editor(self):
        self.save(self.mission);before=self.snapshot()
        operations=[('/export',None),('/flight/compare?from=1',None),('/flight/rebase/plan',{}),
                    ('/flight/rebase',{'revision':1,'planDigest':'0'*64,'confirm':True}),('/flight/restore',{'revision':1,'fromRevision':1,'confirm':True}),
                    ('/flight/archive',{'revision':1,'confirm':True}),('/flight/unarchive',{'revision':1,'confirm':True}),
                    ('/flight/continue',{'revision':1,'newId':'other','confirm':True})]
        for path,body in operations:
            for token,status in [(None,401),('forged',401),('outsider',403)]:
                self.assertEqual(self.call(path,body,token=token).status_code,status,path)
            with patch.dict(os.environ,{'VOID_CONTENT_DRAFTS_ENABLED':'false'}):self.assertEqual(self.call(path,body).status_code,503,path)
            with patch.dict(os.environ,{'VOID_CONTENT_EDITOR_UID':'outsider'}):self.assertEqual(self.call(path,body).status_code,403,path)
        self.assertEqual(self.db.data,before)

    def test_export_reads_only_the_callers_workspace(self):
        self.save(self.mission)
        with patch.dict(os.environ,{'VOID_CONTENT_EDITOR_UID':'outsider'}):
            data=self.call('/export',token='outsider').json
        self.assertEqual(data['drafts'],[]);self.assertNotIn('FLIGHT TRAINING',json.dumps(data))

    def test_malformed_and_oversized_requests_are_rejected(self):
        self.save(self.mission);before=self.snapshot()
        for path,body in [('/flight/restore',{'revision':1,'fromRevision':'1','confirm':True}),('/flight/restore',{'revision':1,'fromRevision':1,'confirm':True,'extra':1}),
                          ('/flight/rebase/plan',{'resolutions':{'title':'eval'}}),('/flight/continue',{'revision':1,'newId':'../x','confirm':True}),
                          ('/export/archive',{'revision':1,'confirm':True}),('/flight/compare?from=x',None)]:
            self.assertEqual(self.call(path,body).status_code,400,path)
        r=self.client.post(self.url+'/flight/archive',headers=self.header,data='x'*300_000,content_type='application/json');self.assertEqual(r.status_code,413)
        self.assertEqual(self.db.data,before)

    # ---- Concurrency and compatibility ----
    def test_concurrent_operations_on_one_revision_have_one_winner(self):
        d=copy.deepcopy(self.mission);self.save(d);d['data']['title']='Second';self.save(d,1)
        results=[]
        def run(fn):
            try:results.append(fn()['revision'])
            except drafts.DraftError as e:results.append(e.status)
        edited=copy.deepcopy(d);edited['data']['title']='Concurrent edit'
        threads=[threading.Thread(target=run,args=(f,)) for f in [lambda:self.save(edited,2),lambda:drafts.restore(self.db,EDITOR,'flight',{'revision':2,'fromRevision':1,'confirm':True},self.inv),
                                                               lambda:drafts.set_archived(self.db,EDITOR,'flight',{'revision':2,'confirm':True},True)]]
        for t in threads:t.start()
        for t in threads:t.join()
        self.assertEqual(sorted(results,key=str).count(409),2,results)

    def test_drafts_saved_before_stage_3b1_keep_working(self):
        d=copy.deepcopy(self.mission);self.save(d);d['data']['title']='Legacy second';self.save(d,1)
        prefix='vr_content_drafts/'+drafts.owner_key(EDITOR)+'_flight'
        for key in [k for k in self.db.data if k.startswith(prefix)]:
            for field in ['history','source','action']:self.db.data[key].pop(field,None)
        self.assertEqual(self.call('').json['archived'],[])
        self.assertEqual([h['revision'] for h in self.call('/flight').json['history']],[1,2])
        self.assertEqual(self.call('/flight/restore',{'revision':2,'fromRevision':1,'confirm':True}).json['revision'],3)
        inv=self.changed(lambda i:self.source_mission(i).update(title='Renamed by the game'))
        plan=drafts.plan_rebase(self.db,EDITOR,'flight',{},inv)
        self.assertEqual(plan['status'],'manual');self.assertEqual(plan['document']['data']['title'],'FLIGHT TRAINING')
        self.assertEqual(plan['changes'][0]['resolution'],'keep-draft')
        taken=drafts.plan_rebase(self.db,EDITOR,'flight',{'resolutions':{'title':'source'}},inv);self.assertEqual(taken['document']['data']['title'],'Renamed by the game')
        self.assertEqual(drafts.rebase(self.db,EDITOR,'flight',{'revision':3,'planDigest':plan['planDigest'],'confirm':True},inv)['revision'],4)
        self.assertEqual(drafts.verify_export(self.call('/export',inv=inv).json)['revisions'],4)


if __name__ == '__main__':
    unittest.main()
