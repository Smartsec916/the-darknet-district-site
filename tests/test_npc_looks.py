"""NPC looks on the server (queue item 0c, 18 Nov 2026): content.looks is checked against the admin inventory's npcLooks (what each model file allows, read by
tools/admin-inventory.cjs with void-runner/npc-looks.js): only accessories and hair hide, only listed materials recolour, the creator's pieces only on its skeleton,
nothing added to licensed models, colours only for Reverie and Lace. The editor's server copy keeps looks. Fake storage only."""
import unittest

import void_runner_drafts as drafts
import void_runner_live_content as live

OK = {'looks': [{'id': 'look-1', 'name': 'Night shift', 'hide': ['district_smuggler.shades0'],
                 'colour': {'district_smuggler.male_casualsuit01': {'tint': '#1d2c5a', 'bright': 1.1}}, 'gear': ['gear-visor'], 'hair': 'short01'}], 'use': 'look-1'}


def one(**l):
    return {'looks': [dict({'id': 'look-1', 'name': 'A'}, **l)], 'use': 'look-1'}


def doc(**extra):
    c = {'format': live.FORMAT, 'version': 1}
    c.update(extra)
    return c


class LookRulesTests(unittest.TestCase):
    def test_valid_looks_pass(self):
        self.assertEqual(live.look_problems({'district-smuggler': OK}), [])
        self.assertEqual(live.check(doc(looks={'npc-office-f': {'looks': [{'id': 'a', 'name': 'Navy', 'colour': {'*': {'tint': '#1d2c5a'}}}], 'use': 'mix'}})), [])
        self.assertEqual(live.look_problems({'vr-companion-f': one(hide=['vr_companion_f.long01'], colour={'vr_companion_f.female_elegantsuit01': {'hue': 30}})}), [])
        self.assertEqual(live.look_problems({'npc-grey-reverie': one(colour={'*': {'tint': '#8c1f2b'}})}), [])

    def test_unsafe_or_unknown_changes_are_refused(self):
        bad = [('district-smuggler', one(hide=['district_smuggler.male_casualsuit01']), 'cannot be hidden'),
               ('district-smuggler', one(hide=['district_smuggler.body']), 'cannot be hidden'),
               ('district-smuggler', one(hide=['district_smuggler.shoes01']), 'cannot be hidden'),
               ('vr-companion-f', one(hide=['vr_companion_f.female_elegantsuit01']), 'cannot be hidden'),
               ('district-smuggler', one(colour={'district_smuggler.body': {'tint': '#ff0000'}}), 'not a colour'),
               ('district-smuggler', one(colour={'district_smuggler.male_casualsuit01': {'tint': 'red'}}), '#rrggbb'),
               ('district-smuggler', one(colour={'district_smuggler.male_casualsuit01': {'hue': 500}}), '#rrggbb'),
               ('district-smuggler', one(hair='long01'), 'under the hat'),
               ('npc-office-f', one(gear=['gear-visor']), 'nothing can be added'), ('npc-office-f', one(hair='bob01'), 'nothing can be added'),
               ('vr-companion-f', one(gear=['gear-visor']), 'nothing can be added'), ('npc-grey-reverie', one(gear=['gear-visor']), 'nothing can be added'),
               ('npc-grey-reverie', one(hide=['char']), 'cannot be hidden'), ('npc-office-f', one(gear=['gear-jetpack']), 'unknown gear'),
               ('npc-office-f', {'looks': [], 'use': 'look-9'}, 'does not exist'), ('npc-office-f', {'looks': [], 'use': 'mix'}, 'mix needs'),
               ('npc-office-f', one(name='<b>x</b>'), 'plain name'), ('npc-office-f', one(script='x'), 'unknown fields'),
               ('npc-office-f', {'looks': [{'id': 'a', 'name': 'A'}, {'id': 'a', 'name': 'B'}]}, 'repeated id'),
               ('no-such-model', one(), 'not a model the editor knows')]
        for asset, e, why in bad:
            problems = live.check(doc(looks={asset: e}))
            self.assertTrue(any(why in p for p in problems), (asset, e, problems))
        self.assertEqual(live.check(doc(looks={'district-smuggler': one(hair='long01', hide=['district_smuggler.fedora_cocked'])})), [])
        self.assertTrue(live.look_problems([]))

    def test_workspace_copy_keeps_looks_and_refuses_bad_ones(self):
        def ws(bundle):
            return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
                    'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor workspace', 'bundle': bundle}}
        self.assertTrue(drafts.validate_workspace(ws({'version': 1, 'looks': {'district-smuggler': OK}}))['valid'])
        with self.assertRaises(drafts.DraftError):
            drafts.validate_workspace(ws({'version': 1, 'looks': {'district-smuggler': one(hide=['district_smuggler.body'])}}))
        with self.assertRaises(drafts.DraftError):
            drafts.validate_workspace(ws({'version': 1, 'looks': []}))


if __name__ == '__main__':
    unittest.main()
