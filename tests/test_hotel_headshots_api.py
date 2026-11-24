"""Real Flask routes with isolated identity, clock and transactional storage."""
import unittest
from unittest.mock import patch
from flask import Flask
from test_identity_api import Database, FakeAuth
import hotel_headshots_api as hotel
import blackout_api as registry

class HotelScoresTests(unittest.TestCase):
    def setUp(self):
        self.db = Database()
        self.now = 1000000
        app = Flask(__name__)
        app.register_blueprint(hotel.api)
        self.client = app.test_client()
        for target, value in [('identity.services', lambda: (self.db, FakeAuth(), None)), ('time.time', lambda: self.now), ('transaction', lambda db, fn: fn(db.transaction()))]:
            p = patch('hotel_headshots_api.' + target, value)
            p.start()
            self.addCleanup(p.stop)
        for uid, name in [('uid-a', 'PilotOne'), ('uid-b', 'PilotTwo')]:
            pid = registry.player_id(uid)
            self.db.data['bp_profiles', pid] = {'handle': name}
            self.db.data['bp_handles', name.lower()] = {'playerId': pid}

    def post(self, path, data, uid='uid-a'):
        return self.client.post('/api/void-runner/hotel-headshots' + path, json=data, headers={'Authorization': 'Bearer ' + uid})

    def start(self, uid='uid-a'):
        self.now += 10
        response = self.post('/runs', {'difficulty': 'standard'}, uid)
        self.assertEqual(response.status_code, 200)
        return response.json['runId']

    def finish(self, money=9000, uid='uid-a'):
        rid = self.start(uid)
        for floor in range(1, 5):
            self.now += 10
            response = self.post('/runs/' + rid, {'floor': floor, 'money': money, 'time': floor * 10, 'finished': False}, uid)
            self.assertEqual(response.status_code, 200, response.json)
        self.now += 10
        data = {'floor': 4, 'money': money, 'time': 50, 'finished': True}
        response = self.post('/runs/' + rid, data, uid)
        self.assertEqual(response.status_code, 200, response.json)
        return rid, data

    def get(self, path):
        return self.client.get('/api/void-runner/hotel-headshots' + path)

    def test_account_best_public_profile_and_crown(self):
        self.finish()
        board = self.get('/leaderboard').json['entries']
        self.assertEqual([(r['handle'], r['money']) for r in board], [('PilotOne', 9000)])
        self.assertNotIn('uid', str(board))
        self.assertNotIn('playerId', str(board))
        profile = self.get('/profiles/PilotOne').json
        self.assertEqual(profile['best']['money'], 9000)
        self.assertEqual(len(profile['achievements']), 2)
        self.finish(9500, 'uid-b')
        self.assertEqual(len(self.get('/profiles/PilotOne').json['achievements']), 1)
        self.assertEqual(len(self.get('/profiles/PilotTwo').json['achievements']), 2)
        self.finish(8000)
        self.assertEqual(self.get('/profiles/PilotOne').json['best']['money'], 9000)
        self.assertEqual(len(self.get('/leaderboard').json['entries']), 2)
        self.finish(9500)
        self.assertEqual(len(self.get('/profiles/PilotOne').json['achievements']), 2, 'tied highest balances both qualify')

    def test_retries_do_not_duplicate_or_change_score(self):
        rid, data = self.finish()
        before = self.get('/profiles/PilotOne').json
        self.assertEqual(self.post('/runs/' + rid, data).status_code, 200)
        self.assertEqual(self.get('/profiles/PilotOne').json, before)
        self.assertEqual(self.post('/runs/' + rid, {**data, 'money': 10000}).status_code, 409)
        self.assertEqual(self.post('/runs/' + rid, data, 'uid-b').status_code, 409)

    def test_auth_sequence_limits_and_unfinished_run(self):
        self.assertEqual(self.post('/runs', {'difficulty': 'standard'}, 'bad').status_code, 401)
        self.assertEqual(self.post('/runs', {'difficulty': []}).status_code, 400)
        self.assertEqual(self.post('/runs', {'difficulty': 'standard'}, 'uid-no-handle').status_code, 403)
        rid = self.start()
        self.assertEqual(self.post('/runs', {'difficulty': 'standard'}).status_code, 429)
        data = {'floor': 1, 'money': 9000, 'time': 10, 'finished': False}
        self.assertEqual(self.post('/runs/' + rid, {**data, 'floor': 4}).status_code, 409)
        self.assertEqual(self.post('/runs/' + rid, data).status_code, 409, 'cannot claim more play time than elapsed')
        self.now += 20
        self.assertEqual(self.post('/runs/' + rid, {**data, 'money': 10001}).status_code, 400)
        self.assertEqual(self.post('/runs/' + rid, {**data, 'money': True}).status_code, 400)
        self.assertEqual(self.post('/runs/' + rid, {**data, 'finished': True}).status_code, 409)
        self.assertEqual(self.post('/runs/' + rid, data).status_code, 200)
        self.assertEqual(self.post('/runs/' + rid, {**data, 'money': 9999}).status_code, 409)
        self.assertEqual(self.get('/leaderboard').json['entries'], [])
        self.now += 14401
        self.assertEqual(self.post('/runs/' + rid, data).status_code, 409)

    def test_production_router_and_cors(self):
        from server import app
        client = app.test_client()
        response = client.open('/api/void-runner/hotel-headshots/runs', method='OPTIONS', headers={
            'Origin': 'https://thedarknetdistrict.com', 'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization,content-type'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), 'https://thedarknetdistrict.com')
        response = client.post('/api/void-runner/hotel-headshots/runs', json={'difficulty': 'standard'})
        self.assertEqual(response.status_code, 401)

    def test_handle_changes_and_offline_service(self):
        self.finish()
        pid = registry.player_id('uid-a')
        self.db.data['bp_profiles', pid]['handle'] = 'NewPilot'
        self.assertEqual(self.get('/leaderboard').json['entries'][0]['handle'], 'NewPilot')
        with patch.object(hotel.identity, 'services', side_effect=registry.ApiError('Offline', 503)):
            self.assertEqual(self.get('/leaderboard').status_code, 503)
        self.assertEqual(self.get('/leaderboard').headers['Cache-Control'], 'no-store')

if __name__ == '__main__':
    unittest.main()
