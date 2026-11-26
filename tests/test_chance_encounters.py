import json
import unittest
from pathlib import Path
from unittest.mock import patch

import test_content_drafts as fixtures
import void_runner_encounters as encounters
import void_runner_items as items
import void_runner_live_content as world


class ChanceTests(unittest.TestCase):
    def setUp(self):
        fixtures.DraftTests.setUp(self)
        self.graph = json.loads((Path(__file__).parents[1] / 'void-runner/chance-encounter-seed.json').read_bytes())
        self.graph['enabled'] = True
        self.graph['conditions']['chance'] = 100
        self.uid = 'owner'

    def edit(self, action, revision):
        return encounters.edit(self.db,self.uid,dict(id=self.graph['id'],graph=self.graph,action=action,revision=revision))

    def test_draft_is_separate_from_live_and_rejects_stale_publish(self):
        self.assertNotIn('live', self.edit('save',0))
        self.assertEqual(self.edit('publish',1)['liveRevision'],2)
        self.graph['name']='Changed draft'
        self.assertEqual(self.edit('save',2)['live']['name'],'The Dropped Cardkey')
        with self.assertRaises(encounters.DraftError):
            self.edit('publish',2)
        self.graph['nodes'][0]['edges'][0]['to']='missing'
        with self.assertRaises(encounters.DraftError):
            self.edit('publish',3)

    def test_authorized_run_issues_one_pickup_for_registered_residence(self):
        self.edit('publish',0)
        door='apt-road-n-27'
        template={'id':self.graph['item'],'kind':'keycard','status':'published','name':"Kade and Lace's Apartment Key",'keycard':{
            'expiryClock':'connected','duration':86400,'bearer':False,'transferable':False,'pickup':True,'droppable':True,'doors':[door]}}
        self.db.data[items._state_ref(self.db).key]={'live':1}
        self.db.data[items._version_ref(self.db,1).key]={'content':{'items':[template]}}
        self.db.data[world._state_ref(self.db).key]={'live':1}
        residence={'door':door,'slot':0,'apartmentAccess':{'mode':'public'}}
        self.db.data[world._version_ref(self.db,1).key]={'content':{'characters':{'kade-mercer':{'residence':residence}}}}
        pos={'area':'street','quarter':'oldtown','x':52,'z':-84}
        with patch.object(encounters.time,'time',return_value=100):
            result=encounters.opportunity(self.db,self.uid,{'id':self.graph['id'],'position':pos})
            request={'id':self.graph['id'],'run':result['run']}
            with self.assertRaises(encounters.DraftError):
                encounters.residential_drop(self.db,self.uid,request)
        with patch.object(encounters.time,'time',return_value=108):
            with self.assertRaisesRegex(encounters.DraftError,'locked'):
                encounters.residential_drop(self.db,self.uid,request)
            residence['apartmentAccess']={'mode':'locked'}
            card=encounters.residential_drop(self.db,self.uid,request)
            self.assertEqual(encounters.residential_drop(self.db,self.uid,request),card)
        self.assertEqual((card['streetNumber'],card['apartmentNumber']),(27,101))
        move=dict(action='pickup',door=door,card=card['id'],nonce='once-only',position=pos)
        with self.assertRaises(items.DraftError):
            items.move_card(self.db,self.uid,move)
        move['position']={**card['position'],'area':'street'}
        with self.assertRaises(items.DraftError):
            items.move_card(self.db,'different-player',move)
        self.assertFalse(items.move_card(self.db,self.uid,move)['duplicate'])
        self.assertTrue(items.move_card(self.db,self.uid,move)['duplicate'])
        unit='residence/'+door+'/0'
        self.assertTrue(items.card_access(self.db,self.uid,unit))
        self.assertEqual(encounters.resume(self.db,self.uid,self.graph['id'])['target'],unit)
        self.assertFalse(encounters.resume(self.db,'different-player',self.graph['id'])['active'])
        self.assertFalse(items.card_access(self.db,self.uid,unit[:-1]+'1'))
        residence['slot']=1
        self.assertFalse(items.card_access(self.db,self.uid,unit))
        self.assertEqual(encounters.resume(self.db,self.uid,self.graph['id'])['target'],unit[:-1]+'1')
        self.assertFalse(encounters.outcome(self.db,self.uid,dict(request,outcome='rescued'))['duplicate'])
        self.assertFalse(encounters.resume(self.db,self.uid,self.graph['id'])['active'])
        self.assertFalse(encounters.opportunity(self.db,self.uid,{'id':self.graph['id'],'position':pos})['active'])
