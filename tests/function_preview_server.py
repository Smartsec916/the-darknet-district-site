"""Local preview of The Function pages with the real archive API on an in-memory store.

    python tests/function_preview_server.py              # empty archive, as production is today
    python tests/function_preview_server.py --synthetic  # SYNTHETIC records, for checking layouts only

Serves http://127.0.0.1:5199/function/. Nothing here touches Firestore or production.
"""
import argparse
import sys
import time
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'tests'))

from flask import Flask, send_from_directory  # noqa: E402

import frequencies_api as fa  # noqa: E402
from function_fakes import FakeDB, synthetic_observation  # noqa: E402


def seed(store):
    records = [synthetic_observation(n) for n in range(1, 31)]
    records[0].update(frequency_hz=156_800_000, classification='marine_vhf', mode='fm', case_id='CASE-TEST-01')
    records[1].update(identification={'status': 'possible', 'label': 'SYNTHETIC candidate', 'basis': 'SYNTHETIC fixture basis', 'confidence': 0.35})
    records[2].update(identification={'status': 'identified', 'label': 'SYNTHETIC fixture station', 'basis': 'SYNTHETIC schedule match'},
                      content={'kind': 'none'}, analysis=None)
    records[3].update(publication='metadata_only')
    records[4].update(content={'kind': 'transcript', 'text': '<script>alert("SYNTHETIC")</script> <img src=x onerror=alert(1)> rendered as text'})
    case = {'id': 'CASE-TEST-01', 'designation': 'SYNTHETIC recurring tone', 'status': 'open',
            'first_detected_at': records[5]['observed_at'], 'last_detected_at': records[0]['observed_at'],
            'frequencies_hz': [156_800_000, 27_185_000], 'characteristics': 'SYNTHETIC fixture characteristics.',
            'observation_ids': ['OBS-TEST-00001', 'OBS-TEST-00006'],
            'decoding_attempts': [{'at': records[0]['observed_at'], 'method': 'SYNTHETIC decoder', 'result': 'failed'}],
            'possible_identifications': [{'label': 'SYNTHETIC candidate', 'basis': 'SYNTHETIC basis', 'confidence': 0.2}]}
    heartbeat = {'sent_at': fa.iso(time.time()), 'receivers': [
        {'alias': 'RX-TEST', 'state': 'online', 'channels': [{'frequency_hz': 27_185_000, 'role': 'priority'}, {'frequency_hz': 27_065_000, 'role': 'priority'}]}],
        'coverage_gaps': [{'started_at': records[2]['observed_at'], 'ended_at': records[1]['observed_at'], 'reason': 'power'}]}
    batch = fa.clean_batch({'batch_id': 'preview-0001', 'observations': records, 'cases': [case], 'heartbeat': heartbeat})
    store.apply(batch, 'previewnonce00001', time.time())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--synthetic', action='store_true', help='load SYNTHETIC records for layout checks')
    parser.add_argument('--port', type=int, default=5199)
    args = parser.parse_args()

    store = fa.ArchiveStore(FakeDB())
    patch('firebase_admin.firestore.transactional', lambda f: f).start()
    if args.synthetic:
        seed(store)
        patch.object(fa, 'store', return_value=store).start()
    else:
        patch.object(fa, 'store', return_value=None).start()

    app = Flask(__name__, static_folder=None)
    app.register_blueprint(fa.api)

    @app.get('/')
    @app.get('/<path:name>')
    def site(name='index.html'):
        target = ROOT / name
        if target.is_dir():
            name = name.rstrip('/') + '/index.html'
        return send_from_directory(ROOT, name)

    app.run(host='127.0.0.1', port=args.port)


if __name__ == '__main__':
    main()
