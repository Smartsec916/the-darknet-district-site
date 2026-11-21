import copy
import unittest
import void_runner_api as vr

class StorySaveTests(unittest.TestCase):
    def test_mission_objectives_tracking_and_travel_survive_cloud_validation(self):
        state=self.state();state['universe']={'trackingInitialized':True,'trackedMission':'repair','freeTravel':True,'missions':{'repair':{'acquired':True,'completed':False,'objectives':{'parts':True,'return':False}}}}
        clean=vr.clean_save(state)
        self.assertTrue(clean['universe']['trackingInitialized']);self.assertEqual(clean['universe']['trackedMission'],'repair')
        self.assertTrue(clean['universe']['autoTrack'])
        state['universe']['autoTrack']=False;self.assertFalse(vr.clean_save(state)['universe']['autoTrack'])
        self.assertEqual(clean['universe']['missions']['repair']['objectives'],{'parts':True})
        self.assertTrue(clean['universe']['freeTravel'])
        state['universe']['missions']['repair']['objectives']['bad']=1
        with self.assertRaises(vr.ApiError):vr.clean_save(state)
    def test_opening_passes_through_campaign_save_validation(self):
        state=self.state();state.update(quest='inheritance',location='vesper')
        state['progression']={'opening':{'version':2,'hologram':True,'pistol':False,'cans':[]},'flags':{'move':True,'look':True},'personal':{'weapon':None,'ammo':8,'reserve':48},'checkpoint':{'location':'vesper'}}
        clean=vr.clean_save(state)
        self.assertEqual(clean['progression']['opening'],state['progression']['opening'])
        self.assertIsNone(clean['progression']['personal']['weapon'])
        state['progression']['opening'].update(pistol=True,cans=[0,2,3,5])
        clean=vr.clean_save(state)
        self.assertEqual(clean['progression']['opening']['cans'],[0,2,3,5])
        self.assertEqual(clean['progression']['personal']['weapon'],'ward-pistol')
    def test_new_campaign_outside_the_district_passes_cloud_validation(self):
        state=self.state();state.update(quest='inheritance',location='earth',completed=0);state['story']['flags']['missionPool']='closed'
        clean=vr.clean_save(state)
        self.assertEqual(clean['location'],'earth');self.assertEqual(clean['story']['flags']['missionPool'],'closed')
    def test_street_pair_givers_survive_cloud_validation(self):
        # Reverie and Lace as mission givers (18 Nov 2026): talking to them records their ids in story.met; a 'when walked near' mission is an ordinary record
        state=self.state();state['story']['met']+=['grey-reverie','ethereal-lace'];state['story']['relationships']['grey-reverie']=5;state['story']['flags']['mt_draft-near-m1']=True
        clean=vr.clean_save(state);self.assertEqual(clean['story']['met'][-2:],['grey-reverie','ethereal-lace']);self.assertEqual(clean['story']['relationships']['grey-reverie'],5);self.assertTrue(clean['story']['flags']['mt_draft-near-m1'])
        state=self.state();state['story']['met'].append('grey reverie')
        with self.assertRaises(vr.ApiError):vr.clean_save(state)
    def test_device_serial_survives_cloud_validation(self):
        # The V1's device ID (18 Nov 2026: photo metadata) is story.flags.deviceSerial, 8 hex digits; it must survive a cloud save unchanged.
        state=self.state();state['story']['flags']['deviceSerial']='7f3a91c2'
        self.assertEqual(vr.clean_save(state)['story']['flags']['deviceSerial'],'7f3a91c2')
    def test_rook_procedural_cargo_flags_survive_cloud_validation(self):
        # Rook's procedural board (rook-cargo-gen.js, 21 Nov 2026): the seed (a safe integer) and an accepted job's terms ('units|credits|kg|cargo|title', at most 200 characters) are story flags
        state=self.state();f=state['story']['flags'];f.update({'rook-first-delivery-done':True,'rookSeed':1905272313,'rookJob':'routine','rookRunTo':'kepler','rookTerms':'1|670|720|4 sealed crates of general freight|Scheduled run'})
        clean=vr.clean_save(state)['story']['flags']
        for k in ['rookSeed','rookJob','rookRunTo','rookTerms']:self.assertEqual(clean[k],f[k])
        f['rookTerms']='x'*201
        with self.assertRaises(vr.ApiError):vr.clean_save(state)
    def state(self):
        return {'version':2,'quest':'open','location':'meridian','credits':100,'completed':2,'upgrades':{'guns':0,'armor':0,'engines':0,'shields':0},'cleared':[],'contract':None,'loadout':{},'story':{'flags':{'campaignEpoch':1,'metMara':True,'promise':False},'met':['mara'],'events':['mara_workshop_intro'],'pending':['mara_workshop_intro'],'relationships':{'mara':2},'characters':{'pirate':'dead'},'chapter':'open','unlocked':['rusthaven'],'encounters':['mara_rendezvous']},'savedAt':1750000000000}
    def test_round_trip_preserves_story_without_ownership_claims(self):
        state=self.state();state['owned']=['spectre'];state['story']['flags']['premium']=True
        state['story']['cursor']={'scene':'mara_workshop_intro','node':'depart','choices':False}
        clean=vr.clean_save(state)
        self.assertEqual(clean['story'],state['story']);self.assertEqual(clean['savedAt'],state['savedAt'])
        self.assertNotIn('owned',clean);self.assertEqual(clean['ownedShips'],['starter'])
    def test_rook_runs_validate_and_the_old_undertow_id_is_no_longer_converted(self):
        state=self.state();state['location']='rusthaven';state['contract']='rook-run';state['story']['flags'].update(rookRuns=3,rookRunTo='rusthaven',rookSystems='erebus,sol')
        clean=vr.clean_save(state)
        self.assertEqual(clean['location'],'rusthaven');self.assertEqual(clean['contract'],'rook-run');self.assertEqual(clean['story']['flags']['rookRunTo'],'rusthaven')
        state=self.state();state['location']='undertow'
        with self.assertRaises(vr.ApiError):vr.clean_save(state)

    def test_rejects_malformed_story_and_timestamp(self):
        for change in [{'flags':{'__proto__':True}},{'met':['constructor']},{'relationships':{'mara':101}},{'characters':{'mara':'unknown'}},{'pending':['x']*257},{'flags':{'bad':[]}}]:
            state=self.state();state['story'].update(change)
            with self.assertRaises(vr.ApiError):vr.clean_save(state)
        state=self.state();state['savedAt']=True
        with self.assertRaises(vr.ApiError):vr.clean_save(state)
    def test_campaign_from_before_the_district_reset_is_retired(self):
        # No campaign epoch means the save predates the reset: it is refused with a clear message, never converted.
        for change in ({'story':None},{'flags':{}}):
            state=self.state()
            if 'story' in change and change['story'] is None:del state['story']
            else:state['story']['flags'].pop('campaignEpoch')
            with self.assertRaises(vr.ApiError) as raised:vr.clean_save(state)
            self.assertEqual(raised.exception.status,409)
        self.assertFalse(vr.is_current_save({'story':{'flags':{'campaignEpoch':'1'}}}))
        self.assertFalse(vr.is_current_save({'story':{'flags':{'campaignEpoch':True}}}))
        self.assertFalse(vr.is_current_save(None))
        self.assertTrue(vr.is_current_save(self.state()))

    def test_sol_visit_keeps_frontier_progress_and_existing_schema(self):
        state=self.state();state['story']['flags']['solDestination']='mars'
        clean=vr.clean_save(state)
        self.assertEqual(clean['story']['flags']['solDestination'],'mars')
        self.assertEqual(clean['location'],'meridian')
        self.assertEqual(clean['credits'],state['credits'])
        self.assertEqual(clean['version'],2)

    def test_universe_round_trip_and_validation(self):
        state=self.state();state['location']='sol-belt'
        state['universe']={'currentSystem':'sol','discoveredSystems':['erebus','sol'],'discoveredLocations':['meridian','sol-belt','earth','mars'],'visitedLocations':['meridian','sol-belt'],'missionLogUnlocked':True,'freeTravel':True,'trackedMission':'meet-admin','completedObjectives':[],'station':{'location':'sol-belt'}}
        self.assertEqual(vr.clean_save(state)['universe'],{**state['universe'],'trackingInitialized':True,'autoTrack':True,'missions':{}})
        state['universe']['discoveredLocations']=['unknown']
        with self.assertRaises(vr.ApiError):vr.clean_save(state)

    def test_ship_access_flag_survives_cloud_validation(self):
        for value in ('none','granted'):
            state=self.state();state.update(quest='inheritance',location='earth',completed=0);state['story']['flags'].update(missionPool='closed',shipAccess=value)
            self.assertEqual(vr.clean_save(state)['story']['flags']['shipAccess'],value)

    def test_district_area_flag_survives_cloud_validation(self):
        # A player saved inside The Darknet District is marked with story.flags.area; the location id stays 'earth'.
        state=self.state();state.update(quest='inheritance',location='earth',completed=0);state['story']['flags'].update(missionPool='closed',area='district',districtBadge=True,districtDoor=True)
        clean=vr.clean_save(state)
        self.assertEqual(clean['location'],'earth');self.assertEqual(clean['story']['flags']['area'],'district');self.assertIs(clean['story']['flags']['districtBadge'],True)

    def test_quarter_flag_survives_cloud_validation(self):
        # The quarter of NeoChinatown an outdoor player was last in (ncz-quarters.js): a short string in story.flags; the location id stays 'earth'.
        for quarter in ('oldtown','avenue','far-south','outskirts'):
            state=self.state();state.update(quest='inheritance',location='earth',completed=0);state['story']['flags'].update(missionPool='closed',quarter=quarter)
            clean=vr.clean_save(state)
            self.assertEqual(clean['location'],'earth');self.assertEqual(clean['story']['flags']['quarter'],quarter)
    def test_rook_side_missions_and_nav_coordinates_pass_cloud_validation(self):
        # Flight-map coordinates (nav-coords.js): story.flags.navCoords is a plain boolean. Rook's side missions (rook-run-N, contract rook-run) stay tracked
        # in a District campaign once story flag rook-first-delivery-done is set (campaign.js retireMissions does the same); before it they are untracked.
        def side(flag):
            state=self.state();state.update(quest='open',location='meridian',contract='rook-run');state['story']['flags'].update(missionPool='closed',shipAccess='granted',navCoords=True,rookNavSent=True,rookJob='routine',rookRunTo='kepler')
            if flag:state['story']['flags'][flag]=True
            state['universe']={'trackingInitialized':True,'trackedMission':'rook-run-1','freeTravel':True,'discoveredLocations':['vesper','meridian','kepler','rusthaven','foundry','sol-belt','earth','mars'],'missions':{'rook-run-1':{'acquired':True,'completed':False,'objectives':{'pickup':True}}}}
            return vr.clean_save(state)
        for flag in ('rook-first-delivery-done',):
            clean=side(flag);self.assertEqual(clean['universe']['trackedMission'],'rook-run-1');self.assertEqual(clean['contract'],'rook-run');self.assertIs(clean['story']['flags']['navCoords'],True)
            self.assertIn('kepler',clean['universe']['discoveredLocations'])
        self.assertIsNone(side(None)['universe']['trackedMission']);self.assertIsNone(side('mf_rook-first-delivery-done')['universe']['trackedMission'])
