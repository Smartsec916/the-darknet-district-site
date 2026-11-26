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

    def test_nested_playlists_validate_odds_and_ownership(self):
        row = self.graph['dialogue'][0]
        a = dict(id='branch_a', text='a', speaker='lace')
        b = dict(id='branch_b', text='b', speaker='lace')
        self.graph['dialogue'].extend([a, b])
        row['branches'] = [dict(chance=75, passes=2, actions=[a['id']])]
        a['branches'] = [dict(chance=100, passes=0, actions=[b['id']])]
        encounters.validate(self.graph)
        row['branches'][0]['chance'] = 101
        with self.assertRaises(encounters.DraftError):
            encounters.validate(self.graph)
        row['branches'][0]['chance'] = 25
        b['branches'] = [dict(chance=100, actions=[a['id']])]
        with self.assertRaises(encounters.DraftError):
            encounters.validate(self.graph)
        row['branches'] = []
        with self.assertRaises(encounters.DraftError):
            encounters.validate(self.graph)

    def edit(self, action, revision):
        return encounters.edit(self.db,self.uid,dict(id=self.graph['id'],graph=self.graph,action=action,revision=revision))

    def test_draft_is_separate_from_live_and_rejects_stale_publish(self):
        self.assertNotIn('live', self.edit('save',0))
        self.assertEqual(self.edit('publish',1)['liveRevision'],2)
        self.graph['name']='Changed draft'
        self.assertEqual(self.edit('save',2)['live']['name'],'Pleasure Breach')
        with self.assertRaises(encounters.DraftError):
            self.edit('publish',2)
        self.graph['nodes'][0]['edges'][0]['to']='missing'
        with self.assertRaises(encounters.DraftError):
            self.edit('publish',3)

    def test_chance_bounds_survive_publication_and_stay_in_their_own_playlist(self):
        row = self.graph['dialogue'][0]
        ids = ['branch_a', 'branch_b', 'branch_c']
        self.graph['dialogue'].extend(dict(id=i, text=i, speaker='lace') for i in ids)
        branch = dict(chance=80, passes=3, actions=ids, startAction=ids[1], endAction=ids[2])
        row['branches'] = [branch]
        self.assertEqual(self.edit('publish', 0)['live']['dialogue'][0]['branches'], [branch])
        for end in [ids[0], row['id'], None]:
            branch['endAction'] = end
            with self.assertRaises(encounters.DraftError):
                encounters.validate(self.graph)

    def test_repeat_options_survive_publication_and_require_booleans(self):
        line = self.graph['dialogue'][0]
        line.update(repeatSpeech=True, repeatAnimation=False)
        saved = self.edit('publish', 0)['live']['dialogue'][0]
        self.assertIs(saved['repeatSpeech'], True)
        self.assertIs(saved['repeatAnimation'], False)
        line['repeatAnimation'] = 'false'
        with self.assertRaises(encounters.DraftError):
            self.edit('publish', 1)

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

    def test_place_start_preserves_probability_interval_and_event_identity(self):
        cond = self.graph['conditions']
        cond.update(startTrigger={'kind': 'place', 'target': 'oldtown'}, chance=0)
        self.edit('publish', 0)
        body = dict(id=self.graph['id'], position=dict(area='street', quarter='oldtown', x=52, z=-84))
        pulse = dict(kind='place', target='oldtown', token='d80e6e34-327b-4706-9ab9-c745db108af6')
        def attempt(**changes):
            return encounters.opportunity(self.db, self.uid, {**body, **changes})
        with patch.object(encounters.time, 'time', return_value=100):
            self.assertFalse(attempt()['active'])
            self.assertNotIn('rolled', attempt(startEvent={**pulse, 'kind':'leave'}))
            self.assertNotIn('rolled', attempt(startEvent=pulse, position={**body['position'], 'x':1000}))
            self.assertEqual(attempt(startEvent=pulse)['rolled'], True)
        cond['chance'] = 100
        self.edit('publish', 1)
        with patch.object(encounters.time, 'time', return_value=300):
            self.assertFalse(attempt(startEvent=pulse)['active'])
            self.assertFalse(attempt()['active'])
            cond['startTrigger']['alsoRandom'] = True
            self.edit('publish', 2)
            self.assertTrue(attempt()['active'])

    def test_campaign_start_uses_players_saved_mission_and_clock(self):
        self.graph['conditions']['startTrigger'] = dict(kind='game-time', target='awakening', minutes=30)
        self.edit('publish', 0)
        body = dict(id=self.graph['id'], position=dict(area='street', quarter='oldtown', x=52, z=-84))
        account = self.db.collection('vr_players').document(items._tag(self.uid))
        flags = {'gc_awakening':100, 'gameMin':129}
        self.db.data[account.key] = {'save':{'universe':{'missions':{'awakening':{'completed':True}}}, 'story':{'flags':flags}}}
        self.assertFalse(encounters.opportunity(self.db,self.uid,body)['active'])
        flags['gameMin'] = 130
        self.assertFalse(encounters.opportunity(self.db,'other-player',body)['active'])
        self.assertTrue(encounters.opportunity(self.db,self.uid,body)['active'])

    def test_trigger_config_and_remaining_mission_starts(self):
        save = dict(save={'universe':{'missions':{'m':{'completed':True}}}, 'story':{'flags':{'f':True}}})
        for trigger in [dict(kind='after-mission',target='m'), dict(kind='flag',target='f')]:
            self.assertTrue(encounters.start_trigger_ready(trigger,None,save,{}))
            self.assertFalse(encounters.start_trigger_ready(trigger,None,{},{}))
        for kind in ['near','leave','pod-exit']:
            trigger=dict(kind=kind) if kind=='pod-exit' else dict(kind=kind,target='admin')
            event={**trigger, 'token':'d80e6e34-327b-4706-9ab9-c745db108af6'}
            self.assertTrue(encounters.start_trigger_ready(trigger,event,{},{}))
            self.assertFalse(encounters.start_trigger_ready(trigger,None,{},{}))
        for invalid in [dict(kind='near',target='admin',distance=31), dict(kind='leave'), dict(kind='game-time',target='m',minutes=-1),dict(kind='interval',alsoRandom='yes')]:
            self.graph['conditions']['startTrigger']=invalid
            with self.assertRaises(encounters.DraftError):
                encounters.validate(self.graph)

    def test_expiry_uses_playtime_even_when_key_has_been_dropped(self):
        identity = self.graph['id']
        ref = self.db.collection('vr_encounter_runs').document(items._tag(self.uid+'/'+identity))
        self.db.data[ref.key] = {'run':'test-run','stage':'collected','drop':{'id':'card'},'connectedUntil':120}
        bag = items._player_ref(self.db,self.uid)
        self.db.data[bag.key] = {'connectedClock':{'total':119}}
        self.assertFalse(encounters.resume(self.db,self.uid,identity).get('expired'))
        self.assertEqual(self.db.data[ref.key]['stage'],'collected')
        self.db.data[bag.key]['connectedClock']['total'] = 120
        self.assertTrue(encounters.resume(self.db,self.uid,identity)['expired'])
        self.assertEqual(self.db.data[ref.key]['outcome'],'expired')
        self.assertTrue(encounters.resume(self.db,self.uid,identity)['expired'])
