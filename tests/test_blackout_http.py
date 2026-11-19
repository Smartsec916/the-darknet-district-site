"""HTTP boundary checks for the versioned Blackout progress API."""
import unittest
from unittest.mock import patch

from server import app


class BlackoutProgressHttpTests(unittest.TestCase):
    def test_unsigned_progress_requests_are_rejected_before_data_access(self):
        with patch('blackout_api.services', return_value=(None, None, None)):
            for method in ('get', 'post'):
                response = getattr(app.test_client(), method)('/api/blackout/v2/progress')
                self.assertEqual(response.status_code, 401)
                self.assertNotIn('progress', response.get_json())

    def test_site_origin_can_call_progress_api(self):
        response = app.test_client().open('/api/blackout/v2/progress', method='OPTIONS', headers={
            'Origin': 'https://thedarknetdistrict.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization,content-type',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), 'https://thedarknetdistrict.com')


if __name__ == '__main__':
    unittest.main()
