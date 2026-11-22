import json
import unittest
from pathlib import Path

import void_runner_live_content as live


class AdvancedNpcRoomSchemaTests(unittest.TestCase):
    def test_shared_room_fixtures(self):
        fixtures = json.loads((Path(__file__).parent / 'fixtures' / 'advanced-npc-room-schema.json').read_text())
        for fixture in fixtures:
            with self.subTest(fixture['name']):
                self.assertEqual(not live.interaction_problems({'tea-host': fixture['record']}), fixture['valid'])

    def test_room_dialogue_recording_matches_exact_words(self):
        record = {'distance': 3, 'cooldown': 60, 'advanced': {'room': {'id': 'tea-room', 'enter': 'Come in', 'cooldown': 30}}}
        clip = {'who': 'tea-host', 'text': 'Come in', 'hash': 'a' * 64, 'type': 'audio/mpeg', 'duration': 1, 'bytes': 100}
        self.assertEqual(live.interaction_problems({'tea-host': dict(record, clips=[clip])}), [])
        self.assertTrue(live.interaction_problems({'tea-host': dict(record, clips=[dict(clip, text='Unrelated')])}))

    def test_room_is_registered(self):
        record = {'distance': 3, 'cooldown': 60, 'advanced': {'room': {'id': 'under-tea-room', 'enter': 'Come in', 'cooldown': 30}}}
        self.assertEqual(live.interaction_problems({'tea-host': record}, places={'under-tea-room'}), [])
        self.assertTrue(live.interaction_problems({'tea-host': record}, places={'somewhere-else'}))
