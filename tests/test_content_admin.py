"""Read-only content authorization and mutation boundary, using existing Firebase verifier contract."""
import copy
import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch
from flask import Flask
import void_runner_api as vr


class ContentAdminTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.register_blueprint(vr.api)
        self.client = self.app.test_client()
        self.db = Mock()
        def verify(token, **kwargs):
            if token != 'valid':
                raise ValueError('invalid or revoked')
            return {'uid': 'owner', 'email': 'any@example.test', 'admin': False}
        self.auth = SimpleNamespace(verify_id_token=Mock(side_effect=verify))
        self.services = patch.object(vr, 'services', return_value=(self.db, self.auth, None))
        self.services.start()
        self.addCleanup(self.services.stop)
        self.env = patch.dict(os.environ, {'VOID_ADMIN_UIDS': 'owner'})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.url = '/api/void-runner/developer/content'
        self.headers = {'Authorization': 'Bearer valid'}

    def test_missing_forged_and_revoked_tokens_fail_before_inventory_read(self):
        with patch.object(vr.Path, 'read_text', side_effect=AssertionError('must not read')):
            for headers in [{}, {'Authorization': 'Bearer forged'}, {'Authorization': 'Bearer revoked'}]:
                self.assertEqual(self.client.get(self.url, headers=headers).status_code, 401)

    def test_email_or_browser_claim_does_not_grant_server_role(self):
        with patch.dict(os.environ, {'VOID_ADMIN_UIDS': ''}):
            self.assertEqual(self.client.get(self.url+'?admin=true&email=smartsec@gmail.com', headers=self.headers).status_code, 403)
        self.db.assert_not_called()

    def test_verified_allowlisted_uid_can_read_without_any_database_calls(self):
        response = self.client.get(self.url, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json['readOnly'])
        self.assertGreater(len(response.json['missions']), 20)
        self.assertIn('no-store', response.headers['Cache-Control'])
        self.auth.verify_id_token.assert_called_once_with('valid', app=None, check_revoked=True)
        self.assertEqual(self.db.mock_calls, [])

    def test_mutating_methods_have_no_route(self):
        for method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            self.assertEqual(self.client.open(self.url, method=method, headers=self.headers, json={'credits': 999, 'publish': True}).status_code, 405)
        self.assertEqual(self.db.mock_calls, [])

    def test_disabled_account_infrastructure_fails_closed(self):
        with patch.object(vr, 'services', side_effect=vr.ApiError('disabled', 503)):
            self.assertEqual(self.client.get(self.url, headers=self.headers).status_code, 503)

    def test_bad_inventory_schema_is_not_returned(self):
        with patch.object(vr.Path, 'read_text', return_value='{"schemaVersion":2,"readOnly":false}'):
            self.assertEqual(self.client.get(self.url, headers=self.headers).status_code, 503)
