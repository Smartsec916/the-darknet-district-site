"""The Function / Frequencies archive: read-only public API and signed station uploads.
Uses SYNTHETIC records in an in-memory store only. Run: python -m unittest discover -s tests -t tests -p test_function_archive.py"""
import json
import os
import time
import unittest
from unittest.mock import patch

from flask import Flask

import frequencies_api as fa
from function_fakes import FakeDB, encode, signed_headers, synthetic_observation

SECRET = 's' * 40
INGEST = '/api/function/frequencies/ingest'
BASE = '/api/function/frequencies'
# Words that must never appear as keys in a public response.
PRIVATE_KEYS = ('ip', 'remote', 'addr', 'mac', 'lat', 'lon', 'gps', 'serial', 'host', 'nonce', 'batch', 'key_id', 'secret', 'wifi', 'ssid')


def all_keys(value):
    if isinstance(value, dict):
        for key, child in value.items():
            yield key
            yield from all_keys(child)
    elif isinstance(value, list):
        for child in value:
            yield from all_keys(child)


class ArchiveTestCase(unittest.TestCase):
    enabled = True

    def setUp(self):
        self.db = FakeDB()
        self.store = fa.ArchiveStore(self.db)
        env = {'FUNCTION_INGEST_ENABLED': 'true', 'FUNCTION_INGEST_KEYS': f'station-a:{SECRET}',
               'FUNCTION_ARCHIVE_ENABLED': 'true' if self.enabled else 'false'}
        self.patches = [patch.dict(os.environ, env),
                        patch('firebase_admin.firestore.transactional', lambda f: f),
                        patch.object(fa, 'store', return_value=self.store if self.enabled else None),
                        patch.object(fa, 'READ_LIMIT', fa.Window(60, 10_000)),
                        patch.object(fa, 'INGEST_LIMIT', fa.Window(60, 10_000))]
        for item in self.patches:
            item.start()
        app = Flask(__name__)
        app.register_blueprint(fa.api)
        self.client = app.test_client()

    def tearDown(self):
        for item in reversed(self.patches):
            item.stop()

    def upload(self, batch=None, **header_args):
        body = encode(batch if batch is not None else {'batch_id': 'batch-0001', 'observations': [synthetic_observation(1)]})
        return self.client.post(INGEST, data=body, headers=signed_headers(body, SECRET, **header_args))

    def get(self, path):
        return self.client.get(BASE + path)


class EmptyArchiveTests(ArchiveTestCase):
    enabled = False

    def test_uncommissioned_archive_reports_nothing_collected(self):
        status = self.get('/status').get_json()
        self.assertEqual(status['archive'], 'not_commissioned')
        self.assertEqual(status['receiver_state'], 'not_commissioned')
        self.assertEqual(status['totals']['observations'], 0)
        self.assertEqual(status['active_sources'], 0)
        self.assertIsNone(status['last_observation_at'])
        self.assertIsNone(status['last_sync_at'])
        self.assertEqual(self.get('/observations').get_json()['observations'], [])
        self.assertEqual(self.get('/cases').get_json()['cases'], [])
        self.assertEqual(self.get('/observations/OBS-TEST-00001').status_code, 404)

    def test_uploads_refused_until_commissioned(self):
        self.assertEqual(self.upload().status_code, 503)


class IngestSecurityTests(ArchiveTestCase):
    def test_signed_upload_is_accepted(self):
        response = self.upload()
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(response.get_json()['accepted'], 1)
        self.assertEqual(self.get('/status').get_json()['totals']['observations'], 1)

    def test_uploads_need_the_switch_and_a_key(self):
        with patch.dict(os.environ, {'FUNCTION_INGEST_ENABLED': 'false'}):
            self.assertEqual(self.upload().status_code, 503)
        with patch.dict(os.environ, {'FUNCTION_INGEST_KEYS': 'station-a:too-short'}):
            self.assertEqual(self.upload().status_code, 503)

    def test_unsigned_forged_stale_and_unknown_requests_are_refused(self):
        body = encode({'batch_id': 'batch-0001'})
        self.assertEqual(self.client.post(INGEST, data=body, headers={'Content-Type': 'application/json'}).status_code, 401)
        forged = signed_headers(body, 'x' * 40)
        self.assertEqual(self.client.post(INGEST, data=body, headers=forged).status_code, 401)
        self.assertEqual(self.upload(timestamp=time.time() - 3600).status_code, 401)
        self.assertEqual(self.upload(timestamp=time.time() + 3600).status_code, 401)
        self.assertEqual(self.upload(key_id='station-b').status_code, 401)
        bad = signed_headers(body, SECRET)
        bad['X-Function-Signature'] = 'é' * 64
        self.assertEqual(self.client.post(INGEST, data=body, headers=bad).status_code, 401)
        bad['X-Function-Signature'], bad['X-Function-Timestamp'] = signed_headers(body, SECRET)['X-Function-Signature'], '²' * 10
        self.assertEqual(self.client.post(INGEST, data=body, headers=bad).status_code, 401)
        self.assertEqual(self.get('/status').get_json()['totals']['observations'], 0)

    def test_signature_covers_the_body(self):
        body = encode({'batch_id': 'batch-0001', 'observations': [synthetic_observation(1)]})
        headers = signed_headers(body, SECRET)
        tampered = body.replace(b'RX-TEST', b'RX-EVIL')
        self.assertEqual(self.client.post(INGEST, data=tampered, headers=headers).status_code, 401)

    def test_replayed_request_is_refused(self):
        body = encode({'batch_id': 'batch-0001', 'observations': [synthetic_observation(1)]})
        headers = signed_headers(body, SECRET)
        self.assertEqual(self.client.post(INGEST, data=body, headers=headers).status_code, 200)
        self.assertEqual(self.client.post(INGEST, data=body, headers=headers).status_code, 401)

    def test_retried_batch_is_idempotent(self):
        self.assertEqual(self.upload().get_json()['accepted'], 1)
        again = self.upload().get_json()  # fresh nonce, same batch id: a retry after a lost response
        self.assertTrue(again['duplicate_batch'])
        self.assertEqual(self.get('/status').get_json()['totals']['observations'], 1)

    def test_duplicate_observations_are_skipped(self):
        self.upload()
        result = self.upload({'batch_id': 'batch-0002', 'observations': [
            synthetic_observation(1),  # same id
            synthetic_observation(2, observed_at=synthetic_observation(1)['observed_at'], frequency_hz=synthetic_observation(1)['frequency_hz'])  # same signal
        ]}).get_json()
        self.assertEqual((result['accepted'], result['duplicates']), (0, 2))

    def test_oversized_body_is_refused(self):
        body = b'{"batch_id":"batch-0001","pad":"' + b'x' * fa.MAX_INGEST_BYTES + b'"}'
        response = self.client.post(INGEST, data=body, headers=signed_headers(body, SECRET))
        self.assertEqual(response.status_code, 413)

    def test_public_cannot_write(self):
        for method in (self.client.post, self.client.put, self.client.delete, self.client.patch):
            for path in ('/observations', '/observations/OBS-TEST-00001', '/cases', '/status'):
                self.assertEqual(method(BASE + path, json={}).status_code, 405, (method, path))

    def test_ingest_rate_limit(self):
        with patch.object(fa, 'INGEST_LIMIT', fa.Window(60, 2)):
            codes = [self.upload({'batch_id': f'batch-000{n}'}).status_code for n in range(3)]
        self.assertEqual(codes, [200, 200, 429])

    def test_log_line_has_counts_only(self):
        with self.assertLogs(level='INFO') as logs:
            self.client.post(INGEST, data=(body := encode({'batch_id': 'batch-0001', 'observations': [synthetic_observation(1)]})),
                             headers=signed_headers(body, SECRET), environ_overrides={'REMOTE_ADDR': '198.51.100.23'})
        joined = '\n'.join(logs.output)
        self.assertIn('accepted=1', joined)
        self.assertNotIn('198.51.100.23', joined)
        self.assertNotIn('SYNTHETIC', joined)


class ValidationTests(ArchiveTestCase):
    def rejected(self, observation, status=422):
        response = self.upload({'batch_id': 'batch-0001', 'observations': [observation]})
        self.assertEqual(response.status_code, status, response.get_json())
        return response.get_json()['error']

    def test_unplanned_fields_cannot_ride_along(self):
        self.assertIn('ip_address', self.rejected(synthetic_observation(1, ip_address='192.168.12.5')))
        self.assertIn('gps', self.rejected(synthetic_observation(1, signal={'gps': [38.5, -121.4]})))
        self.assertEqual(self.upload({'batch_id': 'batch-0001', 'heartbeat': {
            'sent_at': '2026-01-01T00:00:00Z', 'receivers': [{'alias': 'RX-TEST', 'state': 'online', 'serial': '0001'}]}}).status_code, 422)

    def test_unreviewed_traffic_cannot_be_published(self):
        for policy in ('withheld', 'private', 'quarantine', 'encrypted', None):
            self.rejected(synthetic_observation(1, publication=policy))

    def test_identification_rules(self):
        self.rejected(synthetic_observation(1, identification={'status': 'identified', 'label': 'Something'}))
        self.rejected(synthetic_observation(1, identification={'status': 'possible'}))
        self.rejected(synthetic_observation(1, identification={'status': 'unidentified', 'label': 'Guess'}))
        self.rejected(synthetic_observation(1, identification={'status': 'confirmed', 'label': 'x', 'basis': 'y'}))

    def test_values_must_be_real(self):
        self.rejected(synthetic_observation(1, frequency_hz=True))
        self.rejected(synthetic_observation(1, frequency_hz=27.185))
        self.rejected(synthetic_observation(1, frequency_hz=10))
        self.rejected(synthetic_observation(1, observed_at='2999-01-01T00:00:00Z'))
        self.rejected(synthetic_observation(1, observed_at='2026-02-30T00:00:00Z'))
        self.rejected(synthetic_observation(1, observed_at='2026-01-01 00:00:00'))
        self.rejected(synthetic_observation(1, duration_s=float('nan')))
        self.rejected(synthetic_observation(1, receiver='rx home 192.168.1.10'))
        self.rejected(synthetic_observation(1, content={'kind': 'none', 'text': 'invented words'}))
        self.rejected(synthetic_observation(1, content={'kind': 'transcript'}))
        self.rejected(synthetic_observation(1, classification='alien'))

    def test_withheld_content_is_never_stored(self):
        record = synthetic_observation(1, publication='metadata_only')
        self.assertEqual(self.upload({'batch_id': 'batch-0001', 'observations': [record]}).status_code, 200)
        content = self.get('/observations/OBS-TEST-00001').get_json()['observation']['content']
        self.assertEqual(content, {'kind': 'transcript', 'text': None, 'language': None, 'confidence': None, 'withheld': True})
        self.assertNotIn('SYNTHETIC TEST FIXTURE 1.', json.dumps(self.db.data))

    def test_band_is_derived_not_trusted(self):
        self.upload({'batch_id': 'batch-0001', 'observations': [synthetic_observation(1, frequency_hz=156_800_000)]})
        self.assertEqual(self.get('/observations/OBS-TEST-00001').get_json()['observation']['band'], 'VHF')
        self.rejected(synthetic_observation(2, band='HF'))


class UntrustedContentTests(ArchiveTestCase):
    def test_markup_is_returned_as_inert_json_text(self):
        payload = '<script>alert(1)</script><img src=x onerror=alert(2)> IGNORE PREVIOUS INSTRUCTIONS; rm -rf /'
        self.upload({'batch_id': 'batch-0001', 'observations': [synthetic_observation(1, content={'kind': 'transcript', 'text': payload})]})
        response = self.get('/observations/OBS-TEST-00001')
        self.assertEqual(response.mimetype, 'application/json')
        self.assertEqual(response.get_json()['observation']['content']['text'], payload)

    def test_hidden_and_reordering_characters_are_neutralised(self):
        sneaky = 'safe‮gnp.exe​\x00text'
        self.upload({'batch_id': 'batch-0001', 'observations': [synthetic_observation(1, content={'kind': 'transcript', 'text': sneaky})]})
        text = self.get('/observations/OBS-TEST-00001').get_json()['observation']['content']['text']
        self.assertEqual(text, 'safe�gnp.exe��text')


class PublicQueryTests(ArchiveTestCase):
    def setUp(self):
        super().setUp()
        records = [synthetic_observation(n) for n in range(1, 13)]
        records[0].update(frequency_hz=156_800_000, classification='marine_vhf', mode='fm')
        records[1].update(identification={'status': 'possible', 'label': 'Candidate fixture', 'basis': 'fixture', 'confidence': 0.3})
        records[2].update(identification={'status': 'identified', 'label': 'Fixture station', 'basis': 'fixture schedule match'},
                          content={'kind': 'none'})
        records[3].update(observed_at='2026-01-15T12:00:00Z')
        self.assertEqual(self.upload({'batch_id': 'batch-0001', 'observations': records}).status_code, 200)

    def page(self, query=''):
        response = self.get('/observations' + query)
        self.assertEqual(response.status_code, 200, response.get_json())
        return response.get_json()

    def ids(self, query):
        return [r['id'] for r in self.page(query)['observations']]

    def test_filters(self):
        self.assertEqual(self.ids('?classification=marine_vhf'), ['OBS-TEST-00001'])
        self.assertEqual(self.ids('?band=VHF'), ['OBS-TEST-00001'])
        self.assertEqual(self.ids('?mode=fm'), ['OBS-TEST-00001'])
        self.assertEqual(self.ids('?status=possible'), ['OBS-TEST-00002'])
        self.assertEqual(self.ids('?status=identified'), ['OBS-TEST-00003'])
        self.assertEqual(self.ids('?decoded=no'), ['OBS-TEST-00003'])
        self.assertEqual(self.ids('?q=candidate+FIXTURE'), ['OBS-TEST-00002'])
        self.assertEqual(self.ids('?id=obs-test-00004'), ['OBS-TEST-00004'])
        self.assertEqual(self.ids('?from=2026-01-15&to=2026-01-15'), ['OBS-TEST-00004'])
        self.assertEqual(self.page('?fmin=27000000&fmax=27100000')['total'], 6)
        self.assertEqual(self.page('?fmin=27185000&fmax=27185000')['total'], 5)

    def test_sorting_and_pagination(self):
        first = self.page('?per_page=10')
        self.assertEqual((first['total'], first['pages'], len(first['observations'])), (12, 2, 10))
        self.assertEqual(len(self.page('?per_page=10&page=2')['observations']), 2)
        times = [r['observed_at'] for r in first['observations']]
        self.assertEqual(times, sorted(times, reverse=True))
        self.assertEqual(self.ids('?sort=freq_desc&per_page=10')[0], 'OBS-TEST-00001')
        self.assertEqual(self.ids('?sort=oldest&per_page=10')[0], 'OBS-TEST-00004')

    def test_bad_queries_are_refused(self):
        for query in ('?per_page=7', '?page=0', '?page=abc', '?fmin=27.185', '?from=yesterday', '?band=XL',
                      '?sort=random', '?q=' + 'x' * 101, '?id=<script>', '?fmin=²'):
            self.assertEqual(self.get('/observations' + query).status_code, 400, query)

    def test_status_counts(self):
        totals = self.get('/status').get_json()['totals']
        self.assertEqual(totals, {'observations': 12, 'identified': 1, 'possible': 1, 'unidentified': 10, 'decoded': 11, 'case_files': 0})

    def test_public_responses_carry_no_network_or_device_details(self):
        self.upload({'batch_id': 'batch-0002', 'heartbeat': {
            'sent_at': fa.iso(time.time()), 'receivers': [{'alias': 'RX-TEST', 'state': 'online', 'channels': [{'frequency_hz': 27_185_000, 'role': 'priority'}]}]}})
        for path in ('/status', '/observations?per_page=100', '/observations/OBS-TEST-00001', '/cases'):
            body = self.get(path).get_json()
            for key in all_keys(body):
                self.assertFalse(any(word == key.lower() or key.lower().startswith(word + '_') for word in PRIVATE_KEYS), (path, key))

    def test_reads_are_rate_limited_per_visitor(self):
        with patch.object(fa, 'READ_LIMIT', fa.Window(60, 3)):
            codes = [self.client.get(BASE + '/status', environ_overrides={'REMOTE_ADDR': '203.0.113.9'}).status_code for _ in range(4)]
            other = self.client.get(BASE + '/status', environ_overrides={'REMOTE_ADDR': '203.0.113.10'}).status_code
        self.assertEqual(codes, [200, 200, 200, 429])
        self.assertEqual(other, 200)

    def test_public_reads_are_cacheable_and_uploads_are_not(self):
        self.assertIn('max-age', self.get('/status').headers['Cache-Control'])
        self.assertEqual(self.upload({'batch_id': 'batch-0009'}).headers['Cache-Control'], 'no-store')


class StationAndCaseTests(ArchiveTestCase):
    def heartbeat(self, state='online', received=None):
        return {'sent_at': fa.iso(time.time()), 'receivers': [
            {'alias': 'RX-TEST', 'state': state, 'channels': [{'frequency_hz': 27_185_000, 'role': 'priority'},
                                                             {'frequency_hz': 27_065_000, 'role': 'priority'}]}],
            'coverage_gaps': [{'started_at': '2026-01-01T00:00:00Z', 'ended_at': '2026-01-01T00:05:00Z', 'reason': 'power'}]}

    def test_heartbeat_drives_receiver_state(self):
        self.upload({'batch_id': 'batch-0001', 'heartbeat': self.heartbeat()})
        status = self.get('/status').get_json()
        self.assertEqual((status['receiver_state'], status['active_sources']), ('online', 1))
        self.assertEqual(status['coverage_gaps'][0]['reason'], 'power')
        self.assertIsNotNone(status['last_sync_at'])
        later = time.time() + fa.STATION_SILENT_SECONDS + 60
        with patch('frequencies_api.time.time', return_value=later):
            status = self.get('/status').get_json()
        self.assertEqual((status['receiver_state'], status['active_sources']), ('no_contact', 0))
        self.assertEqual(status['sources'][0]['state'], 'no_contact')

    def test_case_history_lists_only_published_observations(self):
        case = {'id': 'CASE-0001', 'designation': 'Synthetic fixture tone', 'status': 'open',
                'first_detected_at': '2026-01-01T00:00:00Z', 'last_detected_at': '2026-01-02T00:00:00Z',
                'frequencies_hz': [27_185_000, 27_185_000], 'observation_ids': ['OBS-TEST-00001', 'OBS-NEVER-PUBLISHED'],
                'possible_identifications': [{'label': 'Fixture candidate', 'basis': 'fixture', 'confidence': 0.2}],
                'decoding_attempts': [{'at': '2026-01-02T00:00:00Z', 'method': 'fixture', 'result': 'failed'}]}
        self.upload({'batch_id': 'batch-0001', 'observations': [synthetic_observation(1)], 'cases': [case]})
        listed = self.get('/cases').get_json()['cases'][0]
        self.assertEqual(listed['observation_count'], 1)
        self.assertEqual([o['id'] for o in listed['observations']], ['OBS-TEST-00001'])
        self.assertEqual(listed['frequencies_hz'], [27_185_000])
        self.assertNotIn('observation_ids', listed)

    def test_case_dates_must_be_consistent(self):
        case = {'id': 'CASE-0001', 'designation': 'x', 'status': 'open', 'first_detected_at': '2026-01-02T00:00:00Z',
                'last_detected_at': '2026-01-01T00:00:00Z', 'frequencies_hz': [27_185_000]}
        self.assertEqual(self.upload({'batch_id': 'batch-0001', 'cases': [case]}).status_code, 422)

    def test_retraction_removes_the_record_and_its_text(self):
        self.upload({'batch_id': 'batch-0001', 'observations': [synthetic_observation(1), synthetic_observation(2)]})
        result = self.upload({'batch_id': 'batch-0002', 'retractions': ['OBS-TEST-00001']}).get_json()
        self.assertEqual(result['retracted'], 1)
        self.assertEqual(self.get('/observations/OBS-TEST-00001').status_code, 404)
        self.assertEqual(self.get('/status').get_json()['totals']['observations'], 1)
        self.assertNotIn('SYNTHETIC TEST FIXTURE 1.', json.dumps(self.db.data))

    def test_storage_is_chunked_and_reloads_only_what_changed(self):
        with patch.object(fa, 'CHUNK_BYTES', 3_000):
            for n in range(4):
                batch = [synthetic_observation(n * 5 + i) for i in range(5)]
                self.assertEqual(self.upload({'batch_id': f'batch-000{n}', 'observations': batch}).status_code, 200)
        chunks = [key for key in self.db.data if key.startswith('fn_obs/')]
        self.assertGreater(len(chunks), 3)
        self.assertEqual(self.get('/status').get_json()['totals']['observations'], 20)
        # A fresh process loads every chunk once; afterwards an unchanged archive costs one read.
        fresh = fa.ArchiveStore(self.db)
        before = self.db.reads
        fresh.snapshot()
        self.assertEqual(self.db.reads - before, 1 + len(chunks))
        before = self.db.reads
        fresh.snapshot(force=True)
        self.assertEqual(self.db.reads - before, 1)


class CorsTests(unittest.TestCase):
    def test_only_the_site_may_read_from_a_browser(self):
        import server
        client = server.app.test_client()
        allowed = client.get(BASE + '/status', headers={'Origin': 'https://thedarknetdistrict.com'})
        self.assertEqual(allowed.headers.get('Access-Control-Allow-Origin'), 'https://thedarknetdistrict.com')
        other = client.get(BASE + '/status', headers={'Origin': 'https://example.com'})
        self.assertIsNone(other.headers.get('Access-Control-Allow-Origin'))
        preflight = client.options(INGEST, headers={'Origin': 'https://thedarknetdistrict.com', 'Access-Control-Request-Method': 'POST',
                                                    'Access-Control-Request-Headers': 'X-Function-Signature'})
        self.assertNotIn('x-function-signature', preflight.headers.get('Access-Control-Allow-Headers', '').lower())


if __name__ == '__main__':
    unittest.main()
