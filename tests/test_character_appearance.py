import copy, json, os, unittest
from pathlib import Path
from unittest import mock
import void_runner_api as api

CAT = json.loads((Path(__file__).parent.parent / 'void-runner' / 'character-catalog.json').read_text())
GOOD = {'v': 1, 'base': 'male', 'look': 'hacker-01', 'hair': 'bob01', 'hairColor': 'magenta', 'clothingColor': 'navy', 'accessories': ['eyewear']}


class AppearanceValidation(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(api.clean_appearance(copy.deepcopy(GOOD)), GOOD)
        for look in CAT['looks']:
            l = CAT['looks'][look]
            a = {'v': 1, 'base': l['base'], 'look': look, 'hair': 'native', 'hairColor': None, 'clothingColor': None, 'accessories': list(l['defaultAccessories'])}
            self.assertEqual(api.clean_appearance(a), a)

    def test_rejects_bad_data(self):
        def mut(**kw):
            a = copy.deepcopy(GOOD); a.update(kw); return a
        bad = [mut(base='robot'), mut(look='../../etc/passwd'), mut(look='ncz-neon'), mut(hair='C:\\x.glb'), mut(hair='nope'), mut(hairColor='#ff0000'), mut(hairColor='red'),
               mut(clothingColor='jet'), mut(accessories='hat'), mut(accessories=['eyewear', 'eyewear']), mut(accessories=['collar']), mut(accessories=['x'] * 20), mut(v=2), mut(v=True), mut(v='1'),
               mut(hair=None), mut(hair=['a']), mut(extra=1), 'text', None, [], 5]
        for a in bad:
            with self.assertRaises(api.ApiError, msg=repr(a)):
                api.clean_appearance(a)
        a = mut(); del a['hair']
        with self.assertRaises(api.ApiError):
            api.clean_appearance(a)

    def test_hat_needs_compatible_hair(self):
        a = {'v': 1, 'base': 'male', 'look': 'district-smuggler', 'hair': 'long01', 'hairColor': None, 'clothingColor': None, 'accessories': ['hat']}
        with self.assertRaises(api.ApiError):
            api.clean_appearance(a)
        a['hair'] = 'short01'
        self.assertEqual(api.clean_appearance(a)['hair'], 'short01')

    def test_matches_the_browser_rules(self):
        # every hair/look pair the catalog lists is accepted by the server, and the hat rule agrees with the catalog flags
        for look, l in CAT['looks'].items():
            for h in l['hairOk']:
                a = {'v': 1, 'base': l['base'], 'look': look, 'hair': h, 'hairColor': None, 'clothingColor': None, 'accessories': []}
                self.assertEqual(api.clean_appearance(a)['hair'], h)


class EndpointOffByDefault(unittest.TestCase):
    def test_flag_default_off(self):
        with mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop('VOID_APPEARANCE_ENABLED', None)
            self.assertNotEqual(os.getenv('VOID_APPEARANCE_ENABLED'), 'true')
        src = (Path(__file__).parent.parent / 'void_runner_api.py').read_text()
        self.assertIn("os.getenv('VOID_APPEARANCE_ENABLED') != 'true'", src)
        self.assertIn("raise ApiError('Appearance changes are not available yet.', 404)", src)



class GearAppearance(unittest.TestCase):
    GEAR = ['gear-visor', 'gear-collar', 'gear-shoulders', 'gear-chest']

    def test_every_gear_combination_is_saved_unchanged_on_every_outfit(self):
        n = 0
        for look, l in CAT['looks'].items():
            for mask in range(16):
                gear = [g for i, g in enumerate(self.GEAR) if mask >> i & 1]
                a = {'v': 1, 'base': l['base'], 'look': look, 'hair': 'native', 'hairColor': None, 'clothingColor': None, 'accessories': list(l['defaultAccessories']) + gear}
                self.assertEqual(api.clean_appearance(copy.deepcopy(a)), a)
                n += 1
        self.assertEqual(n, 11 * 16)

    def test_gear_is_never_a_default_and_old_appearances_are_unchanged(self):
        for look, l in CAT['looks'].items():
            self.assertFalse(set(l['defaultAccessories']) & set(self.GEAR), look)
        self.assertEqual(api.clean_appearance(copy.deepcopy(GOOD)), GOOD)

    def test_unknown_duplicate_and_too_many_are_still_refused(self):
        for acc in (['gear-wings'], ['gear-visor', 'gear-visor'], self.GEAR + ['eyewear', 'a', 'b', 'c', 'd']):
            a = copy.deepcopy(GOOD); a['accessories'] = acc
            with self.assertRaises(api.ApiError, msg=repr(acc)):
                api.clean_appearance(a)

if __name__ == '__main__':
    unittest.main()
