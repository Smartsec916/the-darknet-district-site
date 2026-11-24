import copy
import random
import unittest
import void_runner_freight as F


def campaign():
    return {'quest': 'open', 'credits': 500, 'completed': 0, 'contract': None, 'location': 'meridian',
            'story': {'flags': {'rook-first-delivery-done': True}},
            'universe': {'discoveredLocations': list(F.STATIONS), 'discoveredSystems': ['erebus', 'sol', 'communion'], 'missions': {}}}


class FreightTests(unittest.TestCase):
    def test_config_and_locations(self):
        s = campaign()
        self.assertEqual([], F.config_errors(F.DEFAULT))
        self.assertNotIn('vigil', F.eligible(s, F.DEFAULT))
        s['story']['flags']['communionDelivery'] = 'delivered'
        self.assertIn('vigil', F.eligible(s, F.DEFAULT))
        config = dict(F.DEFAULT, excluded=['kepler'], unlockMission='m012')
        self.assertFalse(F.eligible(s, config))
        s['universe']['missions']['m012'] = {'completed': True}
        self.assertNotIn('kepler', F.eligible(s, config))
        del s['story']['flags']['rook-first-delivery-done']
        self.assertFalse(F.eligible(s, config))
        for bad in [dict(config, destinations=['not-a-station']), dict(config, cargo=[]),
                    dict(config, minReward=True), dict(config, excluded=config['destinations'])]:
            self.assertTrue(F.config_errors(bad, ['m012']))

    def test_repeat_reload_deliver_return_pay_once(self):
        s, ledger = campaign(), {}
        prior = None
        for n in range(1, 14):
            F.change('offer', ledger, s, F.DEFAULT, None, random.Random(n))
            job = copy.deepcopy(ledger['active'])
            key = job['id']
            F.change('offer', ledger, s, F.DEFAULT, None)
            self.assertEqual(key, ledger['active']['id'])
            self.assertNotEqual(prior, job['destination'])
            F.change('accept', ledger, s, F.DEFAULT, key)
            self.assertEqual('rook-run', s['contract'])
            self.assertTrue(s['universe']['missions'][f'rook-run-{n}']['objectives']['pickup'])
            ledger, s = copy.deepcopy(ledger), copy.deepcopy(s)
            before = s['credits']
            with self.assertRaises(F.FreightError):
                F.change('collect', ledger, s, F.DEFAULT, key)
            with self.assertRaises(F.FreightError):
                F.change('deliver', ledger, s, F.DEFAULT, key)
            s['location'] = job['destination']
            s['contract'] = None
            s['story']['flags']['rookOwed'] = f"{n}:{job['payment']}"
            F.change('deliver', ledger, s, F.DEFAULT, key)
            F.change('deliver', ledger, s, F.DEFAULT, key)
            self.assertEqual(before, s['credits'])
            with self.assertRaises(F.FreightError):
                F.change('collect', ledger, s, F.DEFAULT, key)
            s['location'] = 'meridian'
            F.change('collect', ledger, s, F.DEFAULT, key)
            F.change('collect', ledger, s, F.DEFAULT, key)
            self.assertEqual(before+job['payment'], s['credits'])
            self.assertTrue(s['universe']['missions'][f'rook-run-{n}']['completed'])
            prior = job['destination']


class FreightApiTests(unittest.TestCase):
    def setUp(self):
        import test_content_drafts as fixtures
        import void_runner_api as api
        fixtures.DraftTests.setUp(self)
        self.ref = api.player_ref(self.db, 'owner')
        self.db.data[self.ref.key] = {'save': campaign(), 'revision': 1, 'handle': 'runner'}
        self.path = '/api/void-runner/rook/freight'

    def post(self, action, revision, **kw):
        return self.client.post(self.path+'/'+action, json=dict(kw, revision=revision),
                                headers={'Authorization': 'Bearer owner'})

    def test_transaction_and_replay(self):
        self.assertEqual(self.client.get(self.path).status_code, 401)
        first = self.post('offer', 1).get_json()
        self.assertIn('active', first, first)
        key = first['active']['id']
        self.assertEqual(self.post('accept', 1, id=key).status_code, 409)
        accepted = self.post('accept', 2, id=key, payment=999999).get_json()
        self.assertEqual(accepted['active']['payment'], first['active']['payment'])
        save = self.db.data[self.ref.key]['save']
        save['contract'] = None
        save['location'] = first['active']['destination']
        save['story']['flags']['rookOwed'] = '1:'+str(first['active']['payment'])
        self.assertEqual(self.post('deliver', 3, id=key).status_code, 200)
        self.assertEqual(self.post('collect', 4, id=key).status_code, 409)
        self.db.data[self.ref.key]['save']['location'] = 'meridian'
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(2) as pool:
            results = list(pool.map(lambda _: self.post('collect', 4, id=key).status_code, range(2)))
        self.assertEqual(sorted(results), [200, 409])
        self.assertEqual(self.post('collect', 5, id=key).status_code, 200)
        profile = self.db.data[self.ref.key]
        self.assertEqual(profile['save']['credits'], 500+first['active']['payment'])
        self.assertEqual(profile['handle'], 'runner')

    def test_editor_publish_and_registered_route_filter(self):
        import os
        from unittest.mock import patch
        import void_runner_live_content as live
        live.clear_cache()
        self.addCleanup(live.clear_cache)
        config = dict(F.DEFAULT, destinations=['earth', 'kepler'], excluded=['earth'],
                      cargo=['data cores'], minReward=700, maxReward=700, difficulties=['routine'],
                      dialogue=['A registered customer is waiting.'])
        with patch.dict(os.environ, {'VOID_CONTENT_PUBLISH_ENABLED': 'true'}):
            payload = {'format': live.FORMAT, 'version': 1, 'rookFreight': config}
            public = self.client.post('/api/void-runner/developer/live-content/publish',
                                      headers={'Authorization': 'Bearer owner'}, json={'content': payload, 'expected': 0})
            self.assertEqual(public.status_code, 200, public.get_json())
            self.assertEqual(live.summary(self.db)['rookFreight'], config)
            self.assertEqual(live.public(self.db)['content']['rookFreight'], config)
            offer = self.post('offer', 1).get_json()['active']
            self.assertEqual((offer['destination'], offer['payment'], offer['line']), ('kepler', 700, config['dialogue'][0]))
