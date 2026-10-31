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


def _locked(lock, fn, tx):
    with lock:
        return fn(tx)


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

    def test_reserved_and_lookalike_names_cannot_be_claimed(self):
        for bad in ['Iris', 'IRIS', '1ris', 'Ir1s', 'lris', 'I_r_i_s', 'Admin', 'Adm1n', 'admin2024', 'System', '5ystem',
                    'Moderator', 'M0derator', 'r00t', 'Owner', 'iris_official', 'Iris_Bot', 'real_admin', 'TheIris',
                    'DarkNet', 'Support', 'Staff', 'Official']:
            response = self.claim('uid-a', bad)
            self.assertEqual(response.status_code, 400, bad)
            self.assertIn('reserved', response.json['error'], bad)
        self.assertEqual(self.db.data, {}, 'a refused name leaves no trace')
        for fine in ['Osiris', 'Ghost_01', 'Neo_Anderson', 'Lilly', 'Dave', 'xX_Cipher_Xx']:
            self.assertEqual(self.claim(f'uid-{fine}', fine).status_code, 200, fine)

    def test_simultaneous_claims_for_one_handle_have_exactly_one_winner(self):
        import threading
        lock = threading.Lock()
        # Firestore serialises conflicting transactions (the loser retries and then sees the winner); a lock does the same here
        fake = types.SimpleNamespace(transactional=lambda fn: (lambda tx: _locked(lock, fn, tx)))
        results = []
        barrier = threading.Barrier(8)

        def attempt(n):
            client = self.client_for_thread()
            barrier.wait()
            results.append(client.post('/api/identity/handle', json={'handle': 'Cipher_9' if n % 2 else 'CIPHER_9'},
                                       headers={'Authorization': f'Bearer uid-{n}'}).status_code)

        with patch.object(sys.modules['firebase_admin'], 'firestore', fake):
            threads = [threading.Thread(target=attempt, args=(n,)) for n in range(8)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
        self.assertEqual(sorted(results), [200] + [409] * 7)
        self.assertEqual(len([k for k in self.db.data if k[0] == 'bp_handles']), 1)
        self.assertEqual(len([k for k in self.db.data if k[0] == 'bp_profiles']), 1)

    def client_for_thread(self):
        app = Flask(__name__)
        app.register_blueprint(identity_api.api, name=f'identity{id(object())}')
        return app.test_client()

    def test_the_same_account_racing_itself_keeps_one_handle(self):
        self.assertEqual(self.claim('uid-a', 'First_One').status_code, 200)
        again = self.claim('uid-a', 'Second_One')
        self.assertEqual(again.status_code, 429)
        self.assertRegex(again.json['error'], r'again in \d+ days?')
        pid = blackout_api.player_id('uid-a')
        self.assertEqual(self.db.data[('bp_profiles', pid)]['handle'], 'First_One')
        self.assertIn(('bp_handles', 'first_one'), self.db.data)
        self.assertNotIn(('bp_handles', 'second_one'), self.db.data)

    def test_changing_a_handle_frees_the_old_one_and_keeps_everything_else(self):
        pid = blackout_api.player_id('uid-a')
        self.db.data[('bp_stats', pid)] = {'bestScore': 900, 'runs': 4}
        self.db.data[('bp_leaderboard', pid)] = {'handle': 'Old_Name', 'bestScore': 900}
        self.db.data[('bp_profiles', pid)] = {'handle': 'Old_Name', 'handleKey': 'old_name', 'createdAt': 1, 'changedAt': 1}
        self.db.data[('bp_handles', 'old_name')] = {'playerId': pid, 'reservedAt': 1}
        self.assertEqual(self.claim('uid-a', 'New_Name').status_code, 200)
        self.assertNotIn(('bp_handles', 'old_name'), self.db.data)
        self.assertEqual(self.db.data[('bp_stats', pid)], {'bestScore': 900, 'runs': 4}, 'progress is untouched')
        self.assertEqual(self.db.data[('bp_leaderboard', pid)]['handle'], 'New_Name', 'the leaderboard shows the new handle')
        self.assertEqual(self.db.data[('bp_leaderboard', pid)]['bestScore'], 900)
        self.assertEqual(self.db.data[('bp_profiles', pid)]['createdAt'], 1)
        self.assertEqual(self.claim('uid-b', 'Old_Name').status_code, 200, 'the old name is free for someone else')

    def test_existing_handles_keep_working_and_a_client_cannot_name_another_account(self):
        pid = blackout_api.player_id('uid-a')
        self.db.data[('bp_profiles', pid)] = {'handle': 'Admin_Legacy', 'handleKey': 'admin_legacy', 'changedAt': 1}
        me = self.client.get('/api/identity/me', headers={'Authorization': 'Bearer uid-a'}).json
        self.assertEqual(me['handle'], 'Admin_Legacy', 'a handle chosen before the stricter list is not taken away')
        forged = self.client.post('/api/identity/handle', json={'handle': 'Cipher_9', 'uid': 'uid-a'},
                                  headers={'Authorization': 'Bearer uid-b'})
        self.assertEqual(forged.status_code, 400)
        self.assertNotIn(('bp_handles', 'cipher_9'), self.db.data)

    def test_me_exposes_only_the_handle_never_an_email_or_name(self):
        self.claim('uid-a', 'Ghost_01')
        data = self.client.get('/api/identity/me', headers={'Authorization': 'Bearer uid-a'}).json
        self.assertEqual(set(data), {'handle', 'nextChangeAt'})
        available = self.client.get('/api/identity/handles/ghost_01/available').json
        self.assertEqual(set(available), {'available'})

    def test_a_failed_display_name_update_does_not_fail_the_claim(self):
        def broken(*_args, **_kwargs):
            raise RuntimeError('auth unavailable')
        self.auth.update_user = broken
        response = self.claim('uid-a', 'Ghost_01')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['handle'], 'Ghost_01')

    def test_unavailable_storage_answers_plainly(self):
        with patch.object(identity_api, 'services', side_effect=identity_api.ApiError('Handles are opening soon. Local play is available.', 503)):
            response = self.claim('uid-a', 'Ghost_01')
        self.assertEqual(response.status_code, 503)
        self.assertIn('opening soon', response.json['error'])

    def test_switched_off_until_any_accounts_are_enabled(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(identity_api.enabled())
        for flag in ['DISTRICT_HANDLES_ENABLED', 'VOID_ACCOUNTS_ENABLED', 'BLACKOUT_ACCOUNTS_ENABLED']:
            with patch.dict(os.environ, {flag: 'true'}, clear=True):
                self.assertTrue(identity_api.enabled(), flag)

if __name__ == '__main__':
    unittest.main()
