"""Mission givers made in the editor on the server (19 Nov 2026): content.characters is checked against the admin inventory's madeCharacters (models, items, ships,
devices, ids the game already uses); a made character becomes movable and a giver for the rest of the check (with_made); "adult (18+)" opens the adult venues and never on
Reverie's or Lace's model; the editor's server copy keeps characters. No network, fake data only."""
import unittest

import void_runner_drafts as drafts
import void_runner_live_content as live

KARA = {'name': 'Kara Voss', 'model': 'npc-courier', 'device': 'v3', 'ship': 'ship2', 'items': [{'id': 'ward-pistol', 'show': True}], 'look': {'colour': {'*': {'tint': '#aa2233'}}}}
OLDTOWN = {'mode': 'stay', 'x': 52.5, 'z': -90, 'yaw': 1.57, 'actions': ['idle', 'look']}
NULLFLOOR = {'mode': 'stay', 'x': 30, 'z': -55, 'yaw': 0, 'actions': ['idle']}


def tree(giver):
    return [{'id': 'draft-kara', 'name': 'Kara', 'missions': [{'id': 'draft-kara-m1', 'number': 81, 'title': 'A job from Kara', 'type': 'side', 'giver': giver,
                                                                'offer': [{'who': giver, 'text': 'I have work.'}], 'objectives': [{'id': 'go', 'kind': 'go', 'place': 'port', 'label': 'Go to the Port.'}]}]}]


def doc(characters=None, npcs=None, trees=None):
    return {'format': live.FORMAT, 'version': 1, 'characters': {'kara-voss': KARA} if characters is None else characters,
            'npcs': {'kara-voss': OLDTOWN} if npcs is None else npcs, 'trees': tree('kara-voss') if trees is None else trees}


class MadeCharacterTests(unittest.TestCase):
    def test_a_made_giver_passes_and_gives_a_mission(self):
        self.assertEqual(live.check(doc()), [])

    def test_bad_characters_are_refused(self):
        def bad(c, pattern, **kw):
            self.assertRegex(' | '.join(live.check(doc(characters={'kara-voss': c}, **kw))), pattern)
        bad(dict(KARA, name=''), 'name is needed')
        bad(dict(KARA, model='npc-street-cat'), 'not a model')
        bad(dict(KARA, device='v9'), 'V1, V2, V3')
        bad(dict(KARA, ship='ufo'), 'not a ship')
        bad(dict(KARA, items=[{'id': 'red-dot', 'show': True}]), 'cannot be shown')
        bad(dict(KARA, items=[{'id': 'banana'}]), 'not one of the game')
        bad(dict(KARA, extra=1), 'unknown fields')
        bad(KARA, 'put them somewhere', npcs={})
        self.assertRegex(' | '.join(live.check(doc(characters={'admin': KARA}, npcs={'admin': OLDTOWN}, trees=tree('admin')))), 'already used')

    def test_adult_venues_need_the_adult_flag(self):
        self.assertRegex(' | '.join(live.check(doc(npcs={'kara-voss': NULLFLOOR}))), 'NULL')
        self.assertEqual(live.check(doc(characters={'kara-voss': dict(KARA, adult=True)}, npcs={'kara-voss': NULLFLOOR})), [])
        self.assertRegex(' | '.join(live.check(doc(characters={'kara-voss': dict(KARA, model='npc-grey-reverie', adult=True)}, npcs={'kara-voss': NULLFLOOR}))), 'not a model')
        # Reverie herself is never relaxed
        self.assertRegex(' | '.join(live.check({'format': live.FORMAT, 'version': 1, 'npcs': {'street-cat': NULLFLOOR}})), 'NULL')

    def test_workspace_keeps_characters(self):
        b = {'version': 1, 'characters': {'kara-voss': KARA}, 'npcs': {'kara-voss': OLDTOWN}}
        drafts.validate_workspace({'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
                                   'data': {'id': drafts.WORKSPACE_ID, 'title': 'w', 'bundle': b}})
        b2 = {'version': 1, 'characters': {'kara-voss': KARA}, 'npcs': {'kara-voss': NULLFLOOR}}
        with self.assertRaises(drafts.DraftError):
            drafts.validate_workspace({'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
                                       'data': {'id': drafts.WORKSPACE_ID, 'title': 'w', 'bundle': b2}})
        b3 = {'version': 1, 'characters': {'kara-voss': dict(KARA, adult=True)}, 'npcs': {'kara-voss': NULLFLOOR}}
        drafts.validate_workspace({'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
                                   'data': {'id': drafts.WORKSPACE_ID, 'title': 'w', 'bundle': b3}})


if __name__ == '__main__':
    unittest.main()
