"""Server-side checks for the WarFlying save block and the Utility slot modules."""
import unittest
from void_runner_progression import clean_progression, FLAGS


class UtilitySlotSaveTests(unittest.TestCase):
    def base(self, owned, installed):
        return {'flags': {x: True for x in FLAGS}, 'completed': True, 'personal': {'ammo': 7, 'reserve': 41},
                'equipment': {'owned': owned, 'installed': {'starter': installed}}, 'missiles': 4, 'checkpoint': {'location': 'meridian'}}

    def test_one_module_in_the_utility_slot_round_trips(self):
        p = clean_progression(self.base(['warflying-module', 'warflying-scrambler'], {'signal': 'warflying-scrambler'}), ['meridian'])
        self.assertEqual(p['equipment']['installed']['starter'], {'signal': 'warflying-scrambler'})

    def test_signal_tracker_and_wrong_slots_are_rejected(self):
        for owned, installed in [(['signal-tracker'], {}), (['warflying-module'], {'sensor': 'warflying-module'}), ([], {'signal': 'warflying-module'})]:
            with self.assertRaises(ValueError):
                clean_progression(self.base(owned, installed), ['meridian'])


try:
    from void_runner_api import clean_warflying, ApiError
except ImportError:  # the API needs Flask; CI installs it
    clean_warflying = None


@unittest.skipIf(clean_warflying is None, 'void_runner_api needs Flask')
class WarFlyingSaveTests(unittest.TestCase):
    def test_records_round_trip_and_partial_contacts_carry_no_point(self):
        out = clean_warflying({'records': {'beacon:sol-1': {'conf': 'confirmed', 'p': 1, 'f': 5, 'l': 9, 'k': 3, 'places': ['sol', 'earth'], 'u': 'pending'},
                                           'ship:sol-cargo-2': {'conf': 'partial', 'p': 1}}, 'autoUpload': False})
        self.assertEqual(out['records']['beacon:sol-1']['p'], 1)
        self.assertEqual(out['records']['beacon:sol-1']['places'], ['sol', 'earth'])
        self.assertEqual(out['records']['ship:sol-cargo-2']['p'], 0)
        self.assertFalse(out['autoUpload'])

    def test_rejects_bad_ids_and_oversized_databases(self):
        for raw in [{'records': {'Bad Id': {}}}, {'records': {'x:' + str(i): {} for i in range(2001)}}, {'records': []}, []]:
            with self.assertRaises(ApiError):
                clean_warflying(raw)

    def test_cargo_and_unknown_fields_are_dropped(self):
        out = clean_warflying({'records': {'ship:erebus-cargo-1': {'conf': 'confirmed', 'p': 1, 'cargo': ['contraband'], 'n': 'x'}}})
        self.assertNotIn('cargo', out['records']['ship:erebus-cargo-1'])

    def test_the_trail_of_your_own_sightings_is_bounded_and_shape_checked(self):
        recent = [{'t': i, 'place': 'erebus:meridian>kepler', 'linked': i % 2} for i in range(20)] + [{'t': -1, 'place': 'Bad Place', 'linked': 'x', 'cargo': 1}, 'junk']
        out = clean_warflying({'records': {}, 'trail': {'linked': 4, 'unlinked': -2, 'recent': recent}})
        self.assertEqual(out['trail']['linked'], 4)
        self.assertEqual(out['trail']['unlinked'], 0)
        self.assertEqual(len(out['trail']['recent']), 8)
        self.assertEqual(out['trail']['recent'][-1], {'t': 0, 'place': 'unknown', 'linked': 1})
        self.assertEqual(clean_warflying({'records': {}})['trail'], {'linked': 0, 'unlinked': 0, 'recent': []})


if __name__ == '__main__':
    unittest.main()
