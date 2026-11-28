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

    def test_unpublish_removes_live_version_and_preserves_saved_draft(self):
        self.edit('publish', 0)
        self.graph['name'] = 'Newer saved draft'
        self.edit('save', 1)
        with self.assertRaises(encounters.DraftError):
            self.edit('unpublish', 1)
        record = encounters.edit(self.db, self.uid, dict(id=self.graph['id'], action='unpublish', revision=2))
        self.assertEqual(record['revision'], 3)
        self.assertNotIn('live', record)
        self.assertNotIn('liveRevision', record)
        self.assertEqual(record['draft']['name'], 'Newer saved draft')
        snapshot = encounters.refs(self.db).document(self.graph['id']).get()
        with patch.object(fixtures.Collection, 'stream', return_value=[snapshot], create=True):
            self.assertEqual(encounters.catalog(self.db)['encounters'], [])
            self.assertEqual(encounters.catalog(self.db, developer=True)['encounters'], [record])
        self.assertEqual(self.edit('publish', 3)['liveRevision'], 4)

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

    def test_main_playlist_fields_and_chance_return_survive_publish(self):
        first, second = self.graph['dialogue'][:2]
        for row in (first, second):
            row.update(mainPlaylist='main_test', mainPasses=2)
        self.graph['dialogue'].append(dict(id='branch_followup', text='first line\nsecond line', speaker='lace'))
        branch = dict(chance=50, actions=['branch_followup'], completion='action', returnAction=second['id'])
        first['branches'] = [branch]
        saved = self.edit('publish', 0)['live']['dialogue']
        self.assertEqual(saved[0]['branches'], [branch])
        self.assertEqual(saved[1]['mainPasses'], 2)
        branch['returnAction'] = 'branch_followup'
        with self.assertRaises(encounters.DraftError):
            encounters.validate(self.graph)
        branch['returnAction'] = second['id']
        second['mainPasses'] = 1
        with self.assertRaises(encounters.DraftError):
            encounters.validate(self.graph)
        second['mainPasses'] = 2
        self.graph['decisionAfter'] = first['id']
        with self.assertRaises(encounters.DraftError):
            encounters.validate(self.graph)

    def test_saved_actions_and_continuation_survive_publication(self):
        first, second = self.graph['dialogue'][:2]
        for row in (first, second):
            row.update(mainPlaylist='main_test', mainPasses=0, mainContinueChance=30)
        parked = dict(id='parked_dialogue', speaker='lace', text='Remember this.',
                      delay=7, tags='quiet', animation='sz-tiedbf', repeatAnimation=True)
        self.graph['savedActions'] = [[parked]]
        self.graph['pickupNoticeSeconds'] = 12
        draft = self.edit('save', 0)['draft']
        live = self.edit('publish', 1)['live']
        self.assertEqual(draft['savedActions'], [[parked]])
        self.assertEqual(live['savedActions'], [[parked]])
        self.assertNotIn(parked, live['dialogue'])
        self.assertEqual(live['dialogue'][0]['mainContinueChance'], 30)
        self.assertEqual(live['pickupNoticeSeconds'], 12)
        second['mainContinueChance'] = 50
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

    def test_animation_speed_survives_publication_and_requires_a_positive_number(self):
        line = self.graph['dialogue'][0]
        line['animationSpeed'] = 0.5
        self.assertEqual(self.edit('publish', 0)['live']['dialogue'][0]['animationSpeed'], 0.5)
        for invalid in (0, -1, '2', True, float('inf')):
            with self.subTest(speed=invalid):
                line['animationSpeed'] = invalid
                with self.assertRaises(encounters.DraftError):
                    encounters.validate(self.graph)

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
        self.assertFalse(encounters.resume(self.db,self.uid,self.graph['id'])['active'])
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

    def test_half_daily_limit_skips_the_next_game_day_per_player(self):
        conditions = self.graph['conditions']
        conditions.update(dailyLimit=0.5, repeatable=True)
        self.edit('publish', 0)
        body = dict(id=self.graph['id'], position=dict(area='street', quarter='oldtown', x=52, z=-84))

        def attempt(day, uid=self.uid):
            with patch.object(items, 'saved_minute', return_value=day * 1440), patch.object(encounters.time, 'time', return_value=10000 + day * 100000):
                return encounters.opportunity(self.db, uid, body)['active']

        self.assertTrue(attempt(0))
        ref = self.db.collection('vr_encounter_runs').document(items._tag(self.uid + '/' + self.graph['id']))
        self.db.data[ref.key].update(stage='finished', finished=True, next=0)
        self.assertFalse(attempt(0))
        self.assertFalse(attempt(1))
        self.assertTrue(attempt(1, 'different-player'))
        self.assertTrue(attempt(2))

        conditions['dailyLimit'] = 1.5
        with self.assertRaises(encounters.DraftError):
            encounters.validate(self.graph)

    def test_sound_cues_publish_and_require_known_files_and_loop_end(self):
        cue = dict(src='assets/audio/ambience/door-lock.ogg', when='start', offset=0.5,
                   volume=0.7, loop=True, stop='seconds', seconds=2)
        self.graph['soundCues'] = [cue]
        self.graph['dialogue'][0]['soundCues'] = [dict(cue, stop='scope')]
        self.graph['sectionSounds'] = {'opening': [dict(cue, when='end')]}
        live = self.edit('publish', 0)['live']
        self.assertEqual(live['soundCues'], [cue])
        self.assertEqual(live['dialogue'][0]['soundCues'][0]['stop'], 'scope')
        cue['when'], cue['stop'] = 'end', 'scope'
        with self.assertRaisesRegex(encounters.DraftError, 'loop ends'):
            encounters.validate(self.graph)
        cue['src'] = 'assets/audio/not-in-library.ogg'
        with self.assertRaisesRegex(encounters.DraftError, 'packaged audio library'):
            encounters.validate(self.graph)

    def test_imported_sound_can_save_before_upload_and_must_exist_to_publish(self):
        hash_value = 'a' * 64
        cue = dict(src='imported:' + hash_value, type='audio/wav', name='train.wav',
                   when='start', offset=0, volume=0.5, loop=False)
        self.graph['nodes'][0]['soundCues'] = [cue]
        self.assertEqual(self.edit('save', 0)['draft']['nodes'][0]['soundCues'], [cue])
        with self.assertRaisesRegex(encounters.DraftError, 'Upload the imported sound effects'):
            self.edit('publish', 1)
        with patch.object(world, 'clips_missing', return_value=[]) as check:
            self.assertEqual(self.edit('publish', 1)['live']['nodes'][0]['soundCues'], [cue])
            check.assert_called_once_with(self.db, [hash_value])

    def test_registered_cast_on_low_quay_and_local_draft_only(self):
        self.graph.pop('item')
        self.graph.pop('residence')
        self.graph['playtest'].update(scene='planet-low-quay', x=27.4, z=371)
        self.graph.update(start='meet', nodes=[
            dict(id='meet', kind='cast', name='Meet the cast', edges=[dict(to='end')]),
            dict(id='end', kind='end', name='End', edges=[]),
        ])
        actor = dict(id='nia', name='Nia', x=28, y=0, z=372, yaw=0, scale=1, idle='',
                     localAsset='enc-glb-00000000-0000-0000-0000-000000000000')
        self.graph['cast'] = [actor]
        self.graph['dialogue'] = []
        self.assertEqual(self.edit('save', 0)['draft']['cast'][0]['id'], 'nia')
        with self.assertRaisesRegex(encounters.DraftError, 'registered game model'):
            self.edit('publish', 1)
        actor.pop('localAsset')
        actor['model'] = 'npc-nyx'
        with patch.object(items, 'inventory', return_value={'madeCharacters': {'models': {'npc-nyx': {}}}}):
            self.edit('publish', 1)
        at = {'x': 27.4, 'z': 371, 'quarter': 'oldtown', 'area': 'street'}
        self.assertFalse(encounters.opportunity(self.db, self.uid, {'id': self.graph['id'], 'position': at})['active'])
        self.assertTrue(encounters.opportunity(self.db, self.uid, {'id': self.graph['id'], 'position': {**at, 'scene': 'planet-low-quay'}})['active'])

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
