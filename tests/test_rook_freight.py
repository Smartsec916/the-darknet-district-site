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
