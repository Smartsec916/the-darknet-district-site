"""District handles: real Flask routing, fake Firebase auth and Firestore."""
import os
import sys
import types
import unittest
from unittest.mock import patch

from flask import Flask

# firebase_admin is only needed for its transaction decorator in these tests.
fake_firebase = types.ModuleType('firebase_admin')
fake_firebase.firestore = types.SimpleNamespace(transactional=lambda fn: fn)
sys.modules.setdefault('firebase_admin', fake_firebase)

import blackout_api  # noqa: E402
import identity_api  # noqa: E402


class Snapshot:
    def __init__(self, value):
        self.value = value

    def to_dict(self):
        return None if self.value is None else dict(self.value)


class Doc:
    def __init__(self, db, collection, key):
        self.db, self.collection, self.key = db, collection, key

    def get(self, transaction=None):
        return Snapshot(self.db.data.get((self.collection, self.key)))


class Collection:
    def __init__(self, db, name):
        self.db, self.name = db, name

    def document(self, key):
        return Doc(self.db, self.name, key)


class Transaction:
    def __init__(self, db):
        self.db = db

    def set(self, ref, value, merge=False):
        key = (ref.collection, ref.key)
        self.db.data[key] = {**(self.db.data.get(key) or {}), **value} if merge else dict(value)

    def delete(self, ref):
        self.db.data.pop((ref.collection, ref.key), None)


class Database:
    def __init__(self):
        self.data = {}

    def collection(self, name):
        return Collection(self, name)

    def transaction(self):
        return Transaction(self)


class FakeAuth:
    def __init__(self):
        self.names = {}

    def verify_id_token(self, token, **_kwargs):
        if token.startswith('uid-'):
            return {'uid': token}
        raise ValueError('bad token')

    def update_user(self, uid, display_name=None, **_kwargs):
        self.names[uid] = display_name


class IdentityApiTests(unittest.TestCase):
    def setUp(self):
        self.db, self.auth = Database(), FakeAuth()
        app = Flask(__name__)
        app.register_blueprint(identity_api.api)
        self.client = app.test_client()
        services = patch.object(identity_api, 'services', return_value=(self.db, self.auth, None))
        services.start()
        self.addCleanup(services.stop)
        cache = patch.object(blackout_api, 'invalidate_top', lambda: None)
        cache.start()
        self.addCleanup(cache.stop)

    def claim(self, uid, handle):
        return self.client.post('/api/identity/handle', json={'handle': handle},
                                headers={'Authorization': f'Bearer {uid}'})

    def test_claim_requires_a_verified_sign_in(self):
        self.assertEqual(self.client.post('/api/identity/handle', json={'handle': 'Ghost_01'}).status_code, 401)
        self.assertEqual(self.claim('forged', 'Ghost_01').status_code, 401)

    def test_claim_sets_display_name_and_shared_registry(self):
        response = self.claim('uid-a', 'Ghost_01')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['handle'], 'Ghost_01')
        self.assertEqual(self.auth.names['uid-a'], 'Ghost_01')
        pid = blackout_api.player_id('uid-a')
        # Blackout's leaderboard profile sees the same handle.
        self.assertEqual(self.db.data[('bp_profiles', pid)]['handle'], 'Ghost_01')
        self.assertEqual(self.db.data[('bp_handles', 'ghost_01')]['playerId'], pid)

    def test_handles_are_unique_ignoring_case(self):
        self.assertEqual(self.claim('uid-a', 'Ghost_01').status_code, 200)
        taken = self.claim('uid-b', 'GHOST_01')
        self.assertEqual(taken.status_code, 409)
        self.assertNotIn('uid-b', self.auth.names)
        available = self.client.get('/api/identity/handles/ghost_01/available')
        self.assertFalse(available.json['available'])
        mine = self.client.get('/api/identity/handles/ghost_01/available', headers={'Authorization': 'Bearer uid-a'})
        self.assertTrue(mine.json['available'])

    def test_rejects_malformed_handles_and_bodies(self):
        for bad in ['ab', 'has space', 'x' * 21, 'admin', 'emoji😀']:
            self.assertEqual(self.claim('uid-a', bad).status_code, 400, bad)
        response = self.client.post('/api/identity/handle', json={'handle': 'Ghost_01', 'uid': 'uid-b'},
                                    headers={'Authorization': 'Bearer uid-a'})
        self.assertEqual(response.status_code, 400)

    def test_me_reports_current_handle(self):
        self.claim('uid-a', 'Ghost_01')
        data = self.client.get('/api/identity/me', headers={'Authorization': 'Bearer uid-a'}).json
        self.assertEqual(data['handle'], 'Ghost_01')
        self.assertIsNone(self.client.get('/api/identity/me', headers={'Authorization': 'Bearer uid-b'}).json['handle'])

    def test_switched_off_until_any_accounts_are_enabled(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(identity_api.enabled())
        for flag in ['DISTRICT_HANDLES_ENABLED', 'VOID_ACCOUNTS_ENABLED', 'BLACKOUT_ACCOUNTS_ENABLED']:
            with patch.dict(os.environ, {flag: 'true'}, clear=True):
                self.assertTrue(identity_api.enabled(), flag)

if __name__ == '__main__':
    unittest.main()
