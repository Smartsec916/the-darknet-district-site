"""The server's checks of "...and only when" (start.only, extra start conditions, 20 Nov 2026): the same messages as void-runner/start-conditions.js problems()
(tests/start-conditions.test.cjs checks the game's side with the same cases)."""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import void_runner_live_content as L  # noqa: E402

GIVERS = {'admin': {'canTalk': True}, 'radio': {'canTalk': False}}
PLACES = {'port', 'underground'}
MISSIONS = {'draft-a-m1'}


def P(only):
    return L.only_problems(only, GIVERS, PLACES, MISSIONS)


class OnlyProblems(unittest.TestCase):
    def test_good_conditions_pass(self):
        good = [{'kind': 'alone', 'distance': 6, 'crowd': False, 'npc': 'admin'}, {'kind': 'players', 'distance': 10}, {'kind': 'time', 'from': '20:00', 'to': '04:00'},
                {'kind': 'place', 'place': 'underground'}]
        self.assertEqual(P(good), [])
        more = [{'kind': 'mission', 'mission': 'draft-a-m1', 'done': False}, {'kind': 'flag', 'flag': 'mf_x', 'set': True}, {'kind': 'credits', 'amount': 500},
                {'kind': 'ship', 'has': True}, {'kind': 'on-foot'}, {'kind': 'holstered'}]
        self.assertEqual(P(more), [])
        self.assertEqual(P([{'kind': 'zone', 'zone': 'neutral'}]), [])
        self.assertEqual(P(None), [])
        self.assertEqual(P([]), [])

    def test_bad_data_is_refused_in_plain_words(self):
        cases = [
            ('x', ['the extra conditions must be a list.']),
            ([{'kind': 'on-foot'}] * 7, ['at most 6 extra conditions.']),
            ([{'kind': 'teleport'}], ['condition 1: unknown kind of condition.']),
            ([{'kind': 'on-foot', 'distance': 3}], ['condition 1: has fields it does not use.']),
            ([{'kind': 'alone', 'distance': 0}], ['condition 1: “no other people near” needs a distance from 1 to 30 metres.']),
            ([{'kind': 'alone', 'distance': True}], ['condition 1: “no other people near” needs a distance from 1 to 30 metres.']),
            ([{'kind': 'alone', 'distance': 6, 'crowd': 'yes'}], ['condition 1: “count the street crowd” must be yes or no.']),
            ([{'kind': 'alone', 'distance': 6, 'npc': 'radio'}], ['condition 1: must name someone the game has a TALK prompt for (or leave it as the giver).']),
            ([{'kind': 'players', 'distance': 51}], ['condition 1: “no other players near” needs a distance from 1 to 50 metres.']),
            ([{'kind': 'time', 'from': '8:00', 'to': '10:00'}], ['condition 1: the times must be written hh:mm (00:00 to 23:59).']),
            ([{'kind': 'time', 'from': '10:00', 'to': '10:00'}], ['condition 1: the start and end times must differ.']),
            ([{'kind': 'place', 'place': 'atlantis'}], ['condition 1: choose the place the player must be in.']),
            ([{'kind': 'mission', 'mission': 'draft-x', 'done': 1}], ['condition 1: choose a mission that exists.', 'condition 1: “finished / not finished” must be yes or no.']),
            ([{'kind': 'flag', 'flag': '1bad', 'set': True}], ['condition 1: the story flag needs a name (letters, digits, - or _).']),
            ([{'kind': 'credits', 'amount': 1.5}], ['condition 1: the credits must be a whole number from 1 to 10000000.']),
            ([{'kind': 'ship', 'has': 'no'}], ['condition 1: “has a ship / has none” must be yes or no.']),
            ([{'kind': 'zone', 'zone': 'red'}], ['condition 1: choose Friendly, Neutral or Hostile.']),
        ]
        for only, want in cases:
            self.assertEqual(P(only), want, only)

    def test_start_problems_accepts_only_on_every_way_of_starting(self):
        only = [{'kind': 'alone', 'distance': 6}]
        self.assertEqual(L.start_problems({'how': 'person', 'only': only}, GIVERS, PLACES, MISSIONS), [])
        self.assertEqual(L.start_problems({'how': 'person', 'accept': True, 'only': only}, GIVERS, PLACES, MISSIONS), [])
        near = {'how': 'notification', 'channel': 'notify', 'from': 'admin', 'text': 'Over here.', 'when': {'kind': 'near', 'npc': 'admin', 'distance': 4}, 'only': only}
        self.assertEqual(L.start_problems(near, GIVERS, PLACES, MISSIONS), [])
        self.assertEqual(L.start_problems({**near, 'only': [{'kind': 'alone', 'distance': 99}]}, GIVERS, PLACES, MISSIONS),
                         ['and only when, condition 1: “no other people near” needs a distance from 1 to 30 metres.'])
        self.assertEqual(L.start_problems({'how': 'person', 'only': 'x'}, GIVERS, PLACES, MISSIONS), ['and only when, the extra conditions must be a list.'])
        # without conditions: unchanged
        self.assertEqual(L.start_problems({'how': 'person'}, GIVERS, PLACES, MISSIONS), [])
        self.assertEqual(L.start_problems({**near, 'only': None}, GIVERS, PLACES, MISSIONS), [])


if __name__ == '__main__':
    unittest.main()
