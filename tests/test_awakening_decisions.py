"""The server's copy of the step option onSpotted:'alarm' (the owner, 21 Nov 2026: Mission 006's way out). Same rule as void-runner/mission-mechanics.js."""
import unittest

import void_runner_live_content as lc


class OnSpottedAlarm(unittest.TestCase):
    M = {'id': 'm1', 'apartments': [{'id': 'veyra', 'door': 'biz-avenue-n-41', 'modules': [{'id': 'lobby', 'type': 'elevator-lobby'}]}]}

    def probs(self, o):
        return [p for p in lc.mechanics_step_problems(self.M, o, set(), set(), set(), set(), set()) if 'shout' in p]

    def test_known_field(self):
        self.assertIn('onSpotted', lc.MECH_FIELDS)

    def test_only_on_unseen_steps(self):
        self.assertEqual(self.probs({'id': 'a', 'kind': 'apt-leave', 'apt': 'veyra', 'unseen': True, 'onSpotted': 'alarm'}), [])
        self.assertEqual(self.probs({'id': 'a', 'kind': 'sneak', 'apt': 'veyra', 'onSpotted': 'alarm'}), [])
        self.assertEqual(len(self.probs({'id': 'a', 'kind': 'apt-leave', 'apt': 'veyra', 'onSpotted': 'alarm'})), 1)
        self.assertEqual(len(self.probs({'id': 'a', 'kind': 'sneak', 'apt': 'veyra', 'onSpotted': 'shout'})), 1)


if __name__ == '__main__':
    unittest.main()
