"""Run with python -m unittest discover -s blackout-protocol -p test_api.py."""
import importlib.util
import pathlib
import sys
import types
import unittest
from unittest.mock import patch


# The contract tests need no live Firebase project or Flask installation.
class Blueprint:
    def __init__(self, *_args, **_kwargs):
        pass

    def __getattr__(self, _name):
        return lambda *_args, **_kwargs: lambda fn: fn


fake_flask = types.ModuleType('flask')
fake_flask.Blueprint = Blueprint
fake_flask.current_app = types.SimpleNamespace(logger=types.SimpleNamespace(exception=lambda *_: None))
fake_flask.jsonify = lambda **data: data
fake_flask.request = types.SimpleNamespace(get_json=lambda silent=True: {}, headers={}, content_length=0)
fake_firebase = types.ModuleType('firebase_admin')
fake_firebase.firestore = types.SimpleNamespace(transactional=lambda fn: fn)
google = types.ModuleType('google')
cloud = types.ModuleType('google.cloud')
firestore_v1 = types.ModuleType('google.cloud.firestore_v1')
base_query = types.ModuleType('google.cloud.firestore_v1.base_query')
firestore_v1.Query = types.SimpleNamespace(DESCENDING='DESCENDING')
base_query.FieldFilter = lambda field, op, value: (field, op, value)
stub_modules = {'flask': fake_flask, 'firebase_admin': fake_firebase, 'google': google,
                'google.cloud': cloud, 'google.cloud.firestore_v1': firestore_v1,
                'google.cloud.firestore_v1.base_query': base_query}

spec = importlib.util.spec_from_file_location('blackout_api', pathlib.Path(__file__).resolve().parents[1] / 'blackout_api.py')
api = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, stub_modules):
    spec.loader.exec_module(api)


class Snapshot:
    def __init__(self, value):
        self.value = value
        self.exists = value is not None

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

    def where(self, filter):
        return Query(self.db, self.name).where(filter)

    def order_by(self, field, direction=None):
        return Query(self.db, self.name).order_by(field, direction)


class Query:
    def __init__(self, db, name, filters=(), orders=(), maximum=None):
        self.db, self.name, self.filters, self.orders, self.maximum = db, name, filters, orders, maximum

    def where(self, filter):
        return Query(self.db, self.name, self.filters + (filter,), self.orders, self.maximum)

    def order_by(self, field, direction=None):
        return Query(self.db, self.name, self.filters, self.orders + ((field, direction),), self.maximum)

    def limit(self, amount):
        return Query(self.db, self.name, self.filters, self.orders, amount)

    def records(self):
        values = [value for (collection, _), value in self.db.data.items() if collection == self.name]
        for field, op, match in self.filters:
            values = [value for value in values if {'>': value[field] > match,
                         '<': value[field] < match, '==': value[field] == match}[op]]
        for field, direction in reversed(self.orders):
            values.sort(key=lambda value: value[field], reverse=direction == 'DESCENDING')
        return values[:self.maximum] if self.maximum is not None else values

    def stream(self):
        return (Snapshot(value) for value in self.records())

    def count(self, alias=None):
        return types.SimpleNamespace(get=lambda: [[types.SimpleNamespace(value=len(self.records()))]])


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


class BlackoutApiTests(unittest.TestCase):
    def setUp(self):
        modules = patch.dict(sys.modules, stub_modules)
        modules.start()
        self.addCleanup(modules.stop)
        self.db = Database()

    def payload(self, value):
        fake_flask.request.get_json = lambda silent=True: value

    def test_handles_are_case_insensitive_and_reserved_atomically(self):
        self.payload({'handle': 'Cyberman420'})
        with patch.object(api.time, 'time', return_value=1_000_000):
            self.assertEqual(api.claim_handle.__wrapped__(self.db, 'user-a')['handle'], 'Cyberman420')
            self.payload({'handle': 'cyberman420'})
            with self.assertRaises(api.ApiError) as error:
                api.claim_handle.__wrapped__(self.db, 'user-b')
            self.assertEqual(error.exception.status, 409)
        with self.assertRaises(api.ApiError):
            api.clean_handle('Admin')
        with self.assertRaises(api.ApiError):
            api.clean_handle('bad-handle')

    def test_handle_change_cooldown(self):
        self.payload({'handle': 'Cyberman420'})
        with patch.object(api.time, 'time', return_value=1_000_000):
            api.claim_handle.__wrapped__(self.db, 'user-a')
        self.payload({'handle': 'New_Hacker'})
        with patch.object(api.time, 'time', return_value=1_000_100):
            with self.assertRaises(api.ApiError) as error:
                api.claim_handle.__wrapped__(self.db, 'user-a')
            self.assertEqual(error.exception.status, 429)

    def test_score_event_validation_rejects_fabricated_points(self):
        self.assertEqual(api.validate_events({'coin': 2, 'relay': 1}, 1, 60), {'coin': 2, 'relay': 1})
        for events, level, delta in [({'coin': 2}, 1, 99), ({'shot': 1}, 1, 10),
                                     ({'relayBonus': 1}, 3, 100), ({'coin': -1}, 1, -5)]:
            with self.assertRaises(api.ApiError):
                api.validate_events(events, level, delta)

    def test_gang_stomps_count_only_where_enemies_exist(self):
        # Street gangs in sectors 1-2, robots from sector 4, none in the Bazaar.
        for level in (1, 2, 4, 6):
            self.assertEqual(api.validate_events({'jumpRobot': 3}, level, 36), {'jumpRobot': 3})
        for events, level, delta in [({'jumpRobot': 1}, 3, 12), ({'jumpRobot': 31}, 1, 372)]:
            with self.assertRaises(api.ApiError):
                api.validate_events(events, level, delta)

    def test_ranked_run_is_monotone_idempotent_and_server_owned(self):
        uid = 'user-a'
        pid = api.player_id(uid)
        profile_ref, stats_ref, board_ref = api.refs(self.db, pid)
        self.db.data[(profile_ref.collection, profile_ref.key)] = {'handle': 'Cyberman420', 'handleKey': 'cyberman420'}
        self.payload({})
        with patch.object(api.time, 'time', return_value=1_000_000):
            run_id = api.start_run.__wrapped__(self.db, uid)['runId']
        self.payload({'level': 1, 'score': 60, 'events': {'coin': 2, 'relay': 1}})
        with patch.object(api.time, 'time', return_value=1_000_020):
            self.assertEqual(api.complete_level.__wrapped__(self.db, uid, run_id)['completedLevel'], 1)
            self.assertEqual(api.complete_level.__wrapped__(self.db, uid, run_id)['completedLevel'], 1)
        self.payload({'score': 70, 'events': {'coin': 2}})
        with patch.object(api.time, 'time', return_value=1_000_040):
            result = api.finish_run.__wrapped__(self.db, uid, run_id)
            self.assertTrue(result['personalBest'])
            duplicate = api.finish_run.__wrapped__(self.db, uid, run_id)
            self.assertTrue(duplicate['duplicate'])
        self.assertEqual(self.db.data[(stats_ref.collection, stats_ref.key)]['bestScore'], 70)
        self.assertEqual(self.db.data[(board_ref.collection, board_ref.key)]['bestScore'], 70)
        self.assertEqual(self.db.data[(board_ref.collection, board_ref.key)]['handle'], 'Cyberman420')
        self.assertNotIn('email', self.db.data[(board_ref.collection, board_ref.key)])
        self.payload({'score': 71, 'events': {'coin': 2}})
        with self.assertRaises(api.ApiError):
            api.finish_run.__wrapped__(self.db, uid, run_id)

    def test_leaderboard_order_and_exact_personal_rank(self):
        players = [('a', 120), ('b', 180)]
        for pid, score in players:
            self.db.data[('bp_leaderboard', pid)] = {'handle': pid.upper(), 'bestScore': score,
                'highestCompletedLevel': 3, 'sortKey': pid}
        uid = 'user-a'
        pid = api.player_id(uid)
        self.db.data[('bp_profiles', pid)] = {'handle': 'C'}
        self.db.data[('bp_stats', pid)] = {'bestScore': 120, 'highestCompletedLevel': 3,
            'totalCompletedGames': 0}
        self.db.data[('bp_leaderboard', pid)] = {'handle': 'C', 'bestScore': 120,
            'highestCompletedLevel': 3, 'sortKey': 'c'}
        with patch.object(api, 'services', return_value=(self.db, None, None)), \
             patch.object(api, 'identity', return_value=uid):
            result = api.leaderboard()
        self.assertEqual([row['handle'] for row in result['entries']], ['B', 'A', 'C'])
        self.assertEqual(result['me']['rank'], 3)


if __name__ == '__main__':
    unittest.main()
