import copy
import unittest
import void_runner_api as vr

class StorySaveTests(unittest.TestCase):
    def state(self):
        return {'version':2,'quest':'open','location':'meridian','credits':100,'completed':2,'upgrades':{'guns':0,'armor':0,'engines':0,'shields':0},'cleared':[],'contract':None,'loadout':{},'story':{'flags':{'metMara':True,'promise':False},'met':['mara'],'events':['mara_workshop_intro'],'pending':['mara_workshop_intro'],'relationships':{'mara':2},'characters':{'pirate':'dead'},'chapter':'open','unlocked':['undertow'],'encounters':['mara_rendezvous']},'savedAt':1750000000000}
    def test_round_trip_preserves_story_without_ownership_claims(self):
        state=self.state();state['owned']=['spectre'];state['story']['flags']['premium']=True
        state['story']['cursor']={'scene':'mara_workshop_intro','node':'depart','choices':False}
        clean=vr.clean_save(state)
        self.assertEqual(clean['story'],state['story']);self.assertEqual(clean['savedAt'],state['savedAt'])
        self.assertNotIn('owned',clean);self.assertEqual(clean['ownedShips'],['starter'])
    def test_rejects_malformed_story_and_timestamp(self):
        for change in [{'flags':{'__proto__':True}},{'met':['constructor']},{'relationships':{'mara':101}},{'characters':{'mara':'unknown'}},{'pending':['x']*257},{'flags':{'bad':[]}}]:
            state=self.state();state['story'].update(change)
            with self.assertRaises(vr.ApiError):vr.clean_save(state)
        state=self.state();state['savedAt']=True
        with self.assertRaises(vr.ApiError):vr.clean_save(state)
    def test_old_campaign_stays_eligible_for_client_migration(self):
        state=self.state();del state['story'];del state['savedAt'];clean=vr.clean_save(state)
        self.assertNotIn('story',clean);self.assertIsNone(clean['savedAt'])

    def test_sol_visit_keeps_frontier_progress_and_existing_schema(self):
        state=self.state();state['story']['flags']['solDestination']='mars'
        clean=vr.clean_save(state)
        self.assertEqual(clean['story']['flags']['solDestination'],'mars')
        self.assertEqual(clean['location'],'meridian')
        self.assertEqual(clean['credits'],state['credits'])
        self.assertEqual(clean['version'],2)
