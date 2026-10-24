"""Test-only helpers for The Function archive: an in-memory Firestore stand-in, request
signing as the station does it, and SYNTHETIC records. None of this is real radio data,
and none of it may be uploaded to the production archive."""
import copy
import json
import time
import uuid

import frequencies_api as fa


class Snapshot:
    def __init__(self, key, data):
        self.id, self._data = key.rsplit('/', 1)[-1], data

    def to_dict(self):
        return copy.deepcopy(self._data)


class Ref:
    def __init__(self, db, key):
        self.db, self.key = db, key

    def get(self, transaction=None):
        self.db.reads += 1
        return Snapshot(self.key, self.db.data.get(self.key))

    def set(self, data):
        self.db.data[self.key] = copy.deepcopy(data)


class Collection:
    def __init__(self, db, name):
        self.db, self.name = db, name

    def document(self, key):
        return Ref(self.db, self.name + '/' + key)

    def stream(self):
        found = [Snapshot(k, v) for k, v in sorted(self.db.data.items()) if k.startswith(self.name + '/')]
        self.db.reads += len(found)
        return found


class Transaction:
    def set(self, ref, data):
        ref.set(data)


class FakeDB:
    def __init__(self):
        self.data, self.reads = {}, 0

    def collection(self, name):
        return Collection(self, name)

    def transaction(self):
        return Transaction()


def signed_headers(body, secret, key_id='station-a', timestamp=None, nonce=None, path='/api/function/frequencies/ingest'):
    timestamp = str(int(time.time() if timestamp is None else timestamp))
    nonce = nonce or uuid.uuid4().hex
    return {'Content-Type': 'application/json', 'X-Function-Key-Id': key_id, 'X-Function-Timestamp': timestamp,
            'X-Function-Nonce': nonce, 'X-Function-Signature': fa.sign(secret.encode(), timestamp, nonce, 'POST', path, body)}


def encode(batch):
    return json.dumps(batch).encode()


def synthetic_observation(n, **changes):
    """A SYNTHETIC observation. Its text says so, so it can never pass for a real record."""
    record = {
        'id': f'OBS-TEST-{n:05d}',
        'observed_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(time.time() - 3600 * (n + 1))),
        'frequency_hz': 27_185_000 if n % 2 else 27_065_000,
        'mode': 'am',
        'classification': 'cb',
        'receiver': 'RX-TEST',
        'publication': 'full',
        'duration_s': 4.5 + n,
        'identification': {'status': 'unidentified'},
        'content': {'kind': 'transcript', 'text': f'SYNTHETIC TEST FIXTURE {n}. Not a real transmission. [unintelligible]',
                    'language': 'en', 'confidence': 0.5},
        'analysis': {'summary': 'SYNTHETIC TEST FIXTURE analysis.', 'method': 'fixture', 'confidence': 0.4},
        'signal': {'bandwidth_hz': 8_000, 'snr_db': 12.5, 'peak_dbfs': -18.0},
    }
    record.update(changes)
    return record
