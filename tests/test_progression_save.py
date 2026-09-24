import unittest
from void_runner_progression import clean_progression, FLAGS

class ProgressionSaveTests(unittest.TestCase):
    def base(self):
        return {'flags':{x:True for x in FLAGS},'completed':True,'personal':{'ammo':7,'reserve':41,'attachments':['red-dot'],'optic':'red-dot'},'equipment':{'owned':['cooling'],'installed':{'starter':{'cooling':'cooling'}}},'checkpoint':{'location':'meridian'},'missiles':4,'cargo':[],'data':['encrypted'],'reputation':{'communion':2}}
    def test_round_trip(self):
        p=clean_progression(self.base(),['meridian'])
        self.assertTrue(p['completed']);self.assertEqual(p['missiles'],4);self.assertEqual(p['personal']['optic'],'red-dot')
    def test_incomplete_actions_cannot_mark_completed(self):
        p=self.base();del p['flags']['missileFired'];self.assertFalse(clean_progression(p,['meridian'])['completed'])
    def test_rejects_unowned_wrong_slot_and_invalid_quantities(self):
        for change in [{'equipment':{'owned':[],'installed':{'starter':{'cooling':'cooling'}}}}, {'personal':{'ammo':900}}, {'checkpoint':{'location':'bad'}},{'reputation':{'__proto__':1}}]:
            p=self.base();p.update(change)
            with self.assertRaises(ValueError):clean_progression(p,['meridian'])
    def test_premium_claims_are_not_entitlements(self):
        p=self.base();p['owned']=['spectre'];p['premium']=True
        result=clean_progression(p,['meridian']);self.assertNotIn('owned',result);self.assertNotIn('premium',result)
