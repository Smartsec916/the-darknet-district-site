"""The Function / Frequencies: the public radio archive and the station's signed uploads.

Visitors can only read. The monitoring station, once commissioned, pushes signed
batches out to this service; nothing here ever connects to the station.
Everything a station sends is radio content: untrusted text, stored and served as data.
Contract and threat model: docs/function/api-contract.md, docs/function/security.md.
"""
import hashlib
import hmac
import json
import math
import os
import re
import threading
import time
from collections import OrderedDict, deque
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, current_app
from werkzeug.exceptions import HTTPException

api = Blueprint('function_frequencies', __name__, url_prefix='/api/function/frequencies')
PROJECT = 'the-darknet-district-71873'

MAX_INGEST_BYTES = 256_000
CLOCK_SKEW_SECONDS = 300
BATCH_MEMORY_SECONDS = 7 * 24 * 60 * 60
MAX_REMEMBERED_BATCHES = 2_000
STATION_SILENT_SECONDS = 15 * 60
CACHE_SECONDS = 30
CHUNK_BYTES = 600_000  # Firestore documents top out at 1 MiB
PAGE_SIZES = (10, 25, 50, 100)

# Labels live in the page; the API speaks in these fixed codes.
CLASSIFICATIONS = ('cb', 'vhf_voice', 'uhf_voice', 'amateur', 'marine_vhf', 'shortwave', 'morse_cw',
                   'meshtastic_lora', 'digital_data', 'numbers_candidate', 'unknown')
MODES = ('am', 'fm', 'nfm', 'usb', 'lsb', 'cw', 'digital', 'unknown')
ID_STATUSES = ('identified', 'possible', 'unidentified')
CONTENT_KINDS = ('none', 'transcript', 'morse', 'digital')
PUBLICATION = ('full', 'metadata_only')
CASE_STATUSES = ('open', 'identified', 'closed')
ATTEMPT_RESULTS = ('failed', 'partial', 'decoded')
RECEIVER_STATES = ('online', 'degraded', 'offline')
CHANNEL_ROLES = ('priority', 'scan')
GAP_REASONS = ('receiver_offline', 'scanning_elsewhere', 'power', 'network', 'maintenance', 'unknown')
# ITU band names; lower edge inclusive.
BANDS = (('VLF', 3_000), ('LF', 30_000), ('MF', 300_000), ('HF', 3_000_000), ('VHF', 30_000_000),
         ('UHF', 300_000_000), ('SHF', 3_000_000_000))
MIN_HZ, MAX_HZ = 3_000, 30_000_000_000

OBS_ID = re.compile(r'OBS-[0-9A-Z][0-9A-Z-]{3,47}')
CASE_ID = re.compile(r'CASE-[0-9A-Z][0-9A-Z-]{1,31}')
ALIAS = re.compile(r'[A-Z][A-Z0-9-]{1,23}')
BATCH_ID = re.compile(r'[A-Za-z0-9-]{8,64}')
NONCE = re.compile(r'[A-Za-z0-9]{16,64}')
DIGITS = re.compile(r'[0-9]{1,12}')
HEX_SIGNATURE = re.compile(r'[0-9a-fA-F]{64}')
KEY_ID = re.compile(r'[A-Za-z0-9_-]{3,32}')
UTC = re.compile(r'(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.\d{1,6})?Z')
DAY = re.compile(r'\d{4}-\d{2}-\d{2}')
LANGUAGE = re.compile(r'[a-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}')
# Control, zero-width and bidi-override characters can hide or reorder text on screen.
UNSAFE_CHARS = re.compile('[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f​-‏‪-‮⁦-⁩﻿]')


class ApiError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message, self.status = message, status


@api.errorhandler(ApiError)
def api_error(error):
    return jsonify(error=error.message), error.status


@api.errorhandler(Exception)
def service_error(error):
    if isinstance(error, HTTPException):
        return jsonify(error=error.description), error.code
    current_app.logger.exception('Frequencies archive request failed')
    return jsonify(error='The archive is temporarily unavailable.'), 503


# ---------------------------------------------------------------------------
# Abuse limits. In-memory per process; addresses are never stored or logged.
# ---------------------------------------------------------------------------
class Window:
    def __init__(self, seconds, limit, max_keys=10_000):
        self.seconds, self.limit, self.max_keys = seconds, limit, max_keys
        self.hits, self.lock = OrderedDict(), threading.Lock()

    def allow(self, key, now=None):
        now = time.monotonic() if now is None else now
        with self.lock:
            hits = self.hits.pop(key, None) or deque()
            while hits and now - hits[0] > self.seconds:
                hits.popleft()
            self.hits[key] = hits
            while len(self.hits) > self.max_keys:
                self.hits.popitem(last=False)
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            return True


READ_LIMIT = Window(60, int(os.environ.get('FUNCTION_READ_LIMIT_PER_MINUTE', '120')))
INGEST_LIMIT = Window(60, int(os.environ.get('FUNCTION_INGEST_LIMIT_PER_MINUTE', '20')))


@api.before_request
def guard_request():
    request.max_content_length = MAX_INGEST_BYTES
    if request.content_length and request.content_length > MAX_INGEST_BYTES:
        raise ApiError('Request is too large.', 413)
    limit = INGEST_LIMIT if request.endpoint == 'function_frequencies.ingest' else READ_LIMIT
    if not limit.allow(request.remote_addr or 'unknown'):
        raise ApiError('Too many requests. Try again shortly.', 429)


@api.after_request
def cache_headers(response):
    public = request.method == 'GET' and response.status_code == 200
    response.headers['Cache-Control'] = f'public, max-age={CACHE_SECONDS}' if public else 'no-store'
    return response


# ---------------------------------------------------------------------------
# Validation. Unknown fields are refused, so nothing unplanned (addresses,
# coordinates, device ids) can ride along into the public archive.
# ---------------------------------------------------------------------------
def fields(value, where, required, optional=()):
    if not isinstance(value, dict):
        raise ApiError(f'{where} must be an object.', 422)
    unknown = sorted(set(value) - set(required) - set(optional))
    if unknown:
        raise ApiError(f'{where} has unsupported fields: {", ".join(unknown)}'[:300], 422)
    missing = [key for key in required if key not in value]
    if missing:
        raise ApiError(f'{where} is missing: {", ".join(missing)}', 422)
    return value


def text(value, where, limit, required=False, multiline=False):
    if value is None:
        if required:
            raise ApiError(f'{where} is required.', 422)
        return None
    if not isinstance(value, str):
        raise ApiError(f'{where} must be text.', 422)
    value = UNSAFE_CHARS.sub('�', value.replace('\r\n', '\n').replace('\r', '\n'))
    if not multiline:
        value = ' '.join(value.split())
    value = value.strip()
    if len(value) > limit:
        raise ApiError(f'{where} exceeds {limit} characters.', 422)
    if required and not value:
        raise ApiError(f'{where} is required.', 422)
    return value or None


def number(value, where, low, high, integer=False, nullable=True):
    if value is None and nullable:
        return None
    kinds = (int,) if integer else (int, float)
    if type(value) not in kinds or not math.isfinite(value) or not low <= value <= high:
        raise ApiError(f'{where} must be a number from {low} to {high}.', 422)
    return value


def choice(value, where, options):
    if value not in options:
        raise ApiError(f'{where} must be one of: {", ".join(options)}', 422)
    return value


def pattern(value, where, regex, nullable=False):
    if value is None and nullable:
        return None
    if not isinstance(value, str) or not regex.fullmatch(value):
        raise ApiError(f'{where} is not a valid identifier.', 422)
    return value


def utc(value, where, now=None, nullable=False):
    """Normalise to second-precision 'YYYY-MM-DDTHH:MM:SSZ', which sorts as text."""
    if value is None and nullable:
        return None
    match = UTC.fullmatch(value) if isinstance(value, str) else None
    if not match:
        raise ApiError(f'{where} must be a UTC timestamp like 2026-01-31T23:59:59Z.', 422)
    try:
        moment = datetime.strptime(match[1] + 'T' + match[2], '%Y-%m-%dT%H:%M:%S').replace(tzinfo=timezone.utc)
    except ValueError:
        raise ApiError(f'{where} is not a real date.', 422)
    if moment.timestamp() > (time.time() if now is None else now) + CLOCK_SKEW_SECONDS:
        raise ApiError(f'{where} is in the future.', 422)
    return match[1] + 'T' + match[2] + 'Z'


def items(value, where, limit):
    if not isinstance(value, list) or len(value) > limit:
        raise ApiError(f'{where} must be a list of at most {limit} entries.', 422)
    return value


def band_for(hz):
    name = None
    for band, low in BANDS:
        if hz >= low:
            name = band
    return name


def clean_identification(value):
    fields(value, 'identification', ('status',), ('label', 'basis', 'confidence'))
    status = choice(value['status'], 'identification.status', ID_STATUSES)
    label = text(value.get('label'), 'identification.label', 120)
    basis = text(value.get('basis'), 'identification.basis', 500)
    if status == 'unidentified' and label:
        raise ApiError('An unidentified signal cannot carry an identification label.', 422)
    if status == 'possible' and not label:
        raise ApiError('A possible identification needs a label.', 422)
    if status == 'identified' and not (label and basis):
        raise ApiError('An identification needs a label and the evidence it rests on.', 422)
    return {'status': status, 'label': label, 'basis': basis,
            'confidence': number(value.get('confidence'), 'identification.confidence', 0, 1)}


def clean_content(value, publication):
    fields(value, 'content', ('kind',), ('text', 'language', 'confidence'))
    kind = choice(value['kind'], 'content.kind', CONTENT_KINDS)
    body = text(value.get('text'), 'content.text', 8_000, multiline=True)
    language = value.get('language')
    if language is not None and not (isinstance(language, str) and LANGUAGE.fullmatch(language)):
        raise ApiError('content.language must be a language tag such as en or es-MX.', 422)
    if kind == 'none' and (body or language):
        raise ApiError('A signal with no decoded content cannot carry text.', 422)
    if kind != 'none' and body is None:
        raise ApiError('Decoded content needs its text.', 422)
    confidence = number(value.get('confidence'), 'content.confidence', 0, 1)
    if publication == 'metadata_only' and kind != 'none':
        # The station should never send withheld text; drop it here as well.
        return {'kind': kind, 'text': None, 'language': None, 'confidence': None, 'withheld': True}
    return {'kind': kind, 'text': body, 'language': language, 'confidence': confidence, 'withheld': False}


def clean_observation(value, now=None):
    fields(value, 'observation',
           ('id', 'observed_at', 'frequency_hz', 'mode', 'classification', 'receiver', 'publication',
            'identification', 'content'),
           ('duration_s', 'case_id', 'analysis', 'signal'))
    publication = value['publication']
    if publication not in PUBLICATION:
        # Withheld, private, encrypted and unreviewed traffic stays on the station.
        raise ApiError('Only records cleared for publication may be uploaded.', 422)
    hz = number(value['frequency_hz'], 'frequency_hz', MIN_HZ, MAX_HZ, integer=True, nullable=False)
    analysis = value.get('analysis')
    if analysis is not None:
        fields(analysis, 'analysis', ('summary', 'method'), ('confidence',))
        analysis = {'summary': text(analysis['summary'], 'analysis.summary', 1_000, required=True, multiline=True),
                    'method': text(analysis['method'], 'analysis.method', 120, required=True),
                    'confidence': number(analysis.get('confidence'), 'analysis.confidence', 0, 1)}
    signal = value.get('signal') or {}
    fields(signal, 'signal', (), ('bandwidth_hz', 'snr_db', 'peak_dbfs'))
    return {
        'id': pattern(value['id'], 'id', OBS_ID),
        'observed_at': utc(value['observed_at'], 'observed_at', now),
        'frequency_hz': hz,
        'band': band_for(hz),
        'mode': choice(value['mode'], 'mode', MODES),
        'duration_s': number(value.get('duration_s'), 'duration_s', 0, 86_400),
        'classification': choice(value['classification'], 'classification', CLASSIFICATIONS),
        'receiver': pattern(value['receiver'], 'receiver', ALIAS),
        'case_id': pattern(value.get('case_id'), 'case_id', CASE_ID, nullable=True),
        'publication': publication,
        'identification': clean_identification(value['identification']),
        'content': clean_content(value['content'], publication),
        'analysis': analysis,
        'signal': {'bandwidth_hz': number(signal.get('bandwidth_hz'), 'signal.bandwidth_hz', 0, 100_000_000, integer=True),
                   'snr_db': number(signal.get('snr_db'), 'signal.snr_db', -50, 150),
                   'peak_dbfs': number(signal.get('peak_dbfs'), 'signal.peak_dbfs', -200, 10)},
    }


def clean_case(value, now=None):
    fields(value, 'case', ('id', 'designation', 'status', 'first_detected_at', 'last_detected_at', 'frequencies_hz'),
           ('characteristics', 'decoding_attempts', 'possible_identifications', 'observation_ids'))
    first = utc(value['first_detected_at'], 'case.first_detected_at', now)
    last = utc(value['last_detected_at'], 'case.last_detected_at', now)
    if first > last:
        raise ApiError('A case cannot be last detected before it was first detected.', 422)
    attempts = []
    for attempt in items(value.get('decoding_attempts', []), 'case.decoding_attempts', 50):
        fields(attempt, 'decoding attempt', ('at', 'method', 'result'), ('notes',))
        attempts.append({'at': utc(attempt['at'], 'decoding attempt.at', now),
                         'method': text(attempt['method'], 'decoding attempt.method', 120, required=True),
                         'result': choice(attempt['result'], 'decoding attempt.result', ATTEMPT_RESULTS),
                         'notes': text(attempt.get('notes'), 'decoding attempt.notes', 500, multiline=True)})
    candidates = []
    for candidate in items(value.get('possible_identifications', []), 'case.possible_identifications', 10):
        fields(candidate, 'possible identification', ('label', 'basis'), ('confidence',))
        candidates.append({'label': text(candidate['label'], 'possible identification.label', 120, required=True),
                           'basis': text(candidate['basis'], 'possible identification.basis', 500, required=True),
                           'confidence': number(candidate.get('confidence'), 'possible identification.confidence', 0, 1)})
    frequencies = [number(hz, 'case.frequencies_hz', MIN_HZ, MAX_HZ, integer=True, nullable=False)
                   for hz in items(value['frequencies_hz'], 'case.frequencies_hz', 50)]
    return {
        'id': pattern(value['id'], 'case.id', CASE_ID),
        'designation': text(value['designation'], 'case.designation', 80, required=True),
        'status': choice(value['status'], 'case.status', CASE_STATUSES),
        'first_detected_at': first,
        'last_detected_at': last,
        'frequencies_hz': sorted(set(frequencies)),
        'characteristics': text(value.get('characteristics'), 'case.characteristics', 2_000, multiline=True),
        'decoding_attempts': attempts,
        'possible_identifications': candidates,
        'observation_ids': list(dict.fromkeys(pattern(oid, 'case.observation_ids', OBS_ID)
                                              for oid in items(value.get('observation_ids', []), 'case.observation_ids', 500))),
    }


def clean_heartbeat(value, now=None):
    fields(value, 'heartbeat', ('sent_at', 'receivers'), ('queue_depth', 'last_observation_at', 'coverage_gaps'))
    receivers = []
    for receiver in items(value['receivers'], 'heartbeat.receivers', 16):
        fields(receiver, 'receiver', ('alias', 'state'), ('channels',))
        channels = []
        for channel in items(receiver.get('channels', []), 'receiver.channels', 64):
            fields(channel, 'channel', ('frequency_hz', 'role'))
            channels.append({'frequency_hz': number(channel['frequency_hz'], 'channel.frequency_hz', MIN_HZ, MAX_HZ, integer=True, nullable=False),
                             'role': choice(channel['role'], 'channel.role', CHANNEL_ROLES)})
        receivers.append({'alias': pattern(receiver['alias'], 'receiver.alias', ALIAS),
                          'state': choice(receiver['state'], 'receiver.state', RECEIVER_STATES), 'channels': channels})
    gaps = []
    for gap in items(value.get('coverage_gaps', []), 'heartbeat.coverage_gaps', 50):
        fields(gap, 'coverage gap', ('started_at', 'reason'), ('ended_at', 'frequency_hz'))
        gaps.append({'started_at': utc(gap['started_at'], 'coverage gap.started_at', now),
                     'ended_at': utc(gap.get('ended_at'), 'coverage gap.ended_at', now, nullable=True),
                     'frequency_hz': number(gap.get('frequency_hz'), 'coverage gap.frequency_hz', MIN_HZ, MAX_HZ, integer=True),
                     'reason': choice(gap['reason'], 'coverage gap.reason', GAP_REASONS)})
    return {'sent_at': utc(value['sent_at'], 'heartbeat.sent_at', now), 'receivers': receivers,
            'queue_depth': number(value.get('queue_depth'), 'heartbeat.queue_depth', 0, 10_000_000, integer=True),
            'last_observation_at': utc(value.get('last_observation_at'), 'heartbeat.last_observation_at', now, nullable=True),
            'coverage_gaps': gaps}


def clean_batch(value, now=None):
    fields(value, 'batch', ('batch_id',), ('observations', 'cases', 'retractions', 'heartbeat'))
    observations = [clean_observation(entry, now) for entry in items(value.get('observations', []), 'observations', 200)]
    if len({entry['id'] for entry in observations}) != len(observations):
        raise ApiError('A batch cannot repeat an observation id.', 422)
    return {
        'batch_id': pattern(value['batch_id'], 'batch_id', BATCH_ID),
        'observations': observations,
        'cases': [clean_case(entry, now) for entry in items(value.get('cases', []), 'cases', 50)],
        'retractions': [pattern(oid, 'retractions', OBS_ID) for oid in items(value.get('retractions', []), 'retractions', 200)],
        'heartbeat': clean_heartbeat(value['heartbeat'], now) if value.get('heartbeat') is not None else None,
    }


# ---------------------------------------------------------------------------
# Station authentication: HMAC-SHA256 over time, nonce, method, path and body.
# ---------------------------------------------------------------------------
def ingest_keys():
    """FUNCTION_INGEST_KEYS='key-id:secret[,key-id:secret]'; two entries allow rotation."""
    keys = {}
    for entry in os.environ.get('FUNCTION_INGEST_KEYS', '').split(','):
        key_id, sep, secret = entry.strip().partition(':')
        if sep and KEY_ID.fullmatch(key_id) and len(secret) >= 32:
            keys[key_id] = secret.encode()
    return keys


def sign(secret, timestamp, nonce, method, path, body):
    message = '\n'.join((timestamp, nonce, method.upper(), path, hashlib.sha256(body).hexdigest()))
    return hmac.new(secret, message.encode(), hashlib.sha256).hexdigest()


def authenticate(now):
    """Return (key id, nonce) for a correctly signed, fresh request, or refuse it."""
    keys = ingest_keys()
    if os.environ.get('FUNCTION_INGEST_ENABLED') != 'true' or not keys:
        raise ApiError('Station uploads are not open.', 503)
    key_id = request.headers.get('X-Function-Key-Id', '')
    timestamp = request.headers.get('X-Function-Timestamp', '')
    nonce = request.headers.get('X-Function-Nonce', '')
    supplied = request.headers.get('X-Function-Signature', '')
    if (key_id not in keys or not DIGITS.fullmatch(timestamp) or not NONCE.fullmatch(nonce)
            or not HEX_SIGNATURE.fullmatch(supplied) or abs(now - int(timestamp)) > CLOCK_SKEW_SECONDS):
        raise ApiError('Signature rejected.', 401)
    expected = sign(keys[key_id], timestamp, nonce, request.method, request.path, request.get_data(cache=True))
    if not hmac.compare_digest(expected, supplied.lower()):
        raise ApiError('Signature rejected.', 401)
    return key_id, nonce


# ---------------------------------------------------------------------------
# Storage: Firestore, with many records per document so a full public read
# costs a handful of document reads. Closed chunks only change on retraction.
# ---------------------------------------------------------------------------
def chunk_key(index):
    return f'{index:05d}'


def record_size(record):
    return len(json.dumps(record, separators=(',', ':')))


def fingerprint(record):
    return record['receiver'], record['observed_at'], record['frequency_hz']


class ArchiveStore:
    def __init__(self, db):
        self.db = db
        self.lock = threading.Lock()
        self.meta, self.checked = None, 0.0
        self.revs, self.chunks, self.cases = {}, {}, {}
        self.records = {}

    def doc(self, collection, key):
        return self.db.collection(collection).document(key)

    def snapshot(self, force=False):
        """(records by id, cases by id, station heartbeat), at most CACHE_SECONDS old."""
        with self.lock:
            if force or self.meta is None or time.monotonic() - self.checked >= CACHE_SECONDS:
                meta = self.doc('fn_meta', 'archive').get().to_dict() or {}
                changed = False
                for key, rev in meta.get('revs', {}).items():
                    if self.revs.get(key) != rev:
                        self.chunks[key] = (self.doc('fn_obs', key).get().to_dict() or {}).get('records', {})
                        self.revs[key], changed = rev, True
                if changed or self.meta is None:
                    self.records = {rid: record for key in sorted(self.chunks) for rid, record in self.chunks[key].items()}
                if meta.get('cases_rev') != (self.meta or {}).get('cases_rev'):
                    self.cases = {snap.id: snap.to_dict() for snap in self.db.collection('fn_cases').stream()}
                self.meta, self.checked = meta, time.monotonic()
            return self.records, self.cases, self.meta.get('station')

    def apply(self, batch, nonce, now):
        from firebase_admin import firestore
        records, _, _ = self.snapshot(force=True)
        located = {rid: key for key, chunk in self.chunks.items() for rid in chunk}
        meta_ref = self.doc('fn_meta', 'archive')

        @firestore.transactional
        def run(transaction):
            meta = meta_ref.get(transaction=transaction).to_dict() or {}
            nonces = {n: t for n, t in meta.get('nonces', {}).items() if now - t <= 2 * CLOCK_SKEW_SECONDS}
            if nonce in nonces:
                raise ApiError('Replay rejected.', 401)
            nonces[nonce] = now
            batches = {b: t for b, t in meta.get('batches', {}).items() if now - t <= BATCH_MEMORY_SECONDS}
            if batch['batch_id'] in batches:
                transaction.set(meta_ref, {**meta, 'nonces': nonces})
                return {'duplicate_batch': True, 'accepted': 0, 'duplicates': 0, 'retracted': 0, 'cases': 0}
            batches[batch['batch_id']] = now
            batches = dict(sorted(batches.items(), key=lambda item: item[1])[-MAX_REMEMBERED_BATCHES:])

            # Every read happens before any write, as Firestore transactions require.
            open_key = chunk_key(meta.get('open', 0))
            touched = {}
            for key in {open_key, *(located[rid] for rid in batch['retractions'] if rid in located)}:
                touched[key] = self.doc('fn_obs', key).get(transaction=transaction).to_dict() or {'records': {}, 'bytes': 0}

            retracted = 0
            for rid in batch['retractions']:
                key = located.get(rid) or (open_key if rid in touched[open_key]['records'] else None)
                if key and touched[key]['records'].pop(rid, None) is not None:
                    touched[key]['bytes'] = sum(record_size(r) for r in touched[key]['records'].values())
                    retracted += 1
            withdrawn = set(batch['retractions'])
            known = (set(records) | set(touched[open_key]['records'])) - withdrawn
            prints = {fingerprint(r) for rid, r in {**records, **touched[open_key]['records']}.items() if rid not in withdrawn}
            accepted = duplicates = 0
            for record in batch['observations']:
                if record['id'] in known or fingerprint(record) in prints:
                    duplicates += 1  # records are immutable; corrections are a retraction plus a new id
                    continue
                size = record_size(record)
                if touched[open_key]['bytes'] + size > CHUNK_BYTES and touched[open_key]['records']:
                    open_key = chunk_key(int(open_key) + 1)
                    touched[open_key] = {'records': {}, 'bytes': 0}
                touched[open_key]['records'][record['id']] = record
                touched[open_key]['bytes'] += size
                known.add(record['id'])
                prints.add(fingerprint(record))
                accepted += 1

            revs = dict(meta.get('revs', {}))
            for key, chunk in touched.items():
                transaction.set(self.doc('fn_obs', key), chunk)
                revs[key] = revs.get(key, 0) + 1
            for case in batch['cases']:
                transaction.set(self.doc('fn_cases', case['id']), case)
            update = {**meta, 'nonces': nonces, 'batches': batches, 'revs': revs, 'open': int(open_key),
                      'cases_rev': meta.get('cases_rev', 0) + (1 if batch['cases'] else 0)}
            if batch['heartbeat']:
                update['station'] = {**batch['heartbeat'], 'received_at': iso(now)}
            transaction.set(meta_ref, update)
            return {'duplicate_batch': False, 'accepted': accepted, 'duplicates': duplicates,
                    'retracted': retracted, 'cases': len(batch['cases'])}

        try:
            return run(self.db.transaction())
        finally:
            with self.lock:
                self.checked = 0.0


_store, _store_lock = None, threading.Lock()


def store():
    """The archive, or None until FUNCTION_ARCHIVE_ENABLED is set: nothing has been collected yet."""
    global _store
    if os.environ.get('FUNCTION_ARCHIVE_ENABLED') != 'true':
        return None
    with _store_lock:
        if _store is None:
            import firebase_admin
            from firebase_admin import firestore
            try:
                app = firebase_admin.get_app('function-archive')
            except ValueError:
                app = firebase_admin.initialize_app(options={'projectId': PROJECT}, name='function-archive')
            _store = ArchiveStore(firestore.client(app))
        return _store


def archive():
    current = store()
    return current.snapshot() if current else ({}, {}, None)


def iso(seconds):
    return datetime.fromtimestamp(seconds, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


# ---------------------------------------------------------------------------
# Public, read-only views. Only whitelisted fields leave the service.
# ---------------------------------------------------------------------------
OBSERVATION_FIELDS = ('id', 'observed_at', 'frequency_hz', 'band', 'mode', 'duration_s', 'classification', 'receiver',
                      'case_id', 'publication', 'identification', 'content', 'analysis', 'signal')
CASE_FIELDS = ('id', 'designation', 'status', 'first_detected_at', 'last_detected_at', 'frequencies_hz',
               'characteristics', 'decoding_attempts', 'possible_identifications')


def public_observation(record):
    return {key: record.get(key) for key in OBSERVATION_FIELDS}


def public_case(case, records):
    # Only observations that are actually in the public archive count as history.
    linked = [records[oid] for oid in case.get('observation_ids', []) if oid in records]
    linked.sort(key=lambda r: r['observed_at'])
    return {**{key: case.get(key) for key in CASE_FIELDS}, 'observation_count': len(linked),
            'observations': [{'id': r['id'], 'observed_at': r['observed_at'], 'frequency_hz': r['frequency_hz']} for r in linked]}


def query_args(args):
    def hz(name):
        value = args.get(name)
        if value in (None, ''):
            return None
        if not DIGITS.fullmatch(value) or not MIN_HZ <= int(value) <= MAX_HZ:
            raise ApiError(f'{name} must be a frequency in hertz.')
        return int(value)

    def day(name, end):
        value = args.get(name)
        if value in (None, ''):
            return None
        if not DAY.fullmatch(value):
            raise ApiError(f'{name} must be a date like 2026-01-31.')
        return value + ('T23:59:59Z' if end else 'T00:00:00Z')

    def option(name, options):
        value = args.get(name) or None
        if value is not None and value not in options:
            raise ApiError(f'{name} is not a recognised filter.')
        return value

    q = (args.get('q') or '').strip()
    if len(q) > 100:
        raise ApiError('Search text is limited to 100 characters.')
    oid = (args.get('id') or '').strip().upper()
    if oid and not re.fullmatch(r'[0-9A-Z-]{1,52}', oid):
        raise ApiError('id is not a valid observation id.')
    page, per_page = args.get('page') or '1', args.get('per_page') or '25'
    if not (DIGITS.fullmatch(page) and DIGITS.fullmatch(per_page)):
        raise ApiError('page and per_page must be numbers.')
    page, per_page = int(page), int(per_page)
    if not 1 <= page <= 100_000 or per_page not in PAGE_SIZES:
        raise ApiError('page or per_page is out of range.')
    return {'q': q.casefold(), 'id': oid, 'from': day('from', False), 'to': day('to', True),
            'fmin': hz('fmin'), 'fmax': hz('fmax'), 'band': option('band', [b for b, _ in BANDS]),
            'mode': option('mode', MODES), 'classification': option('classification', CLASSIFICATIONS),
            'status': option('status', ID_STATUSES), 'decoded': option('decoded', ('yes', 'no')),
            'sort': option('sort', ('newest', 'oldest', 'freq_asc', 'freq_desc')) or 'newest',
            'page': page, 'per_page': per_page}


def matches(record, f):
    content = record.get('content') or {}
    if f['id'] and f['id'] not in record['id']:
        return False
    if f['from'] and record['observed_at'] < f['from'] or f['to'] and record['observed_at'] > f['to']:
        return False
    if f['fmin'] is not None and record['frequency_hz'] < f['fmin'] or f['fmax'] is not None and record['frequency_hz'] > f['fmax']:
        return False
    for key, value in (('band', record['band']), ('mode', record['mode']), ('classification', record['classification']),
                       ('status', record['identification']['status'])):
        if f[key] and f[key] != value:
            return False
    if f['decoded'] and (content.get('kind', 'none') != 'none') != (f['decoded'] == 'yes'):
        return False
    if f['q']:
        haystack = ' '.join(filter(None, (record['id'], content.get('text'), record['identification'].get('label'),
                                          (record.get('analysis') or {}).get('summary'))))
        return f['q'] in haystack.casefold()
    return True


@api.get('/status')
def status():
    records, cases, station = archive()
    now = time.time()
    if station is None:
        receiver_state = 'not_commissioned'
    elif now - datetime.strptime(station['received_at'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc).timestamp() > STATION_SILENT_SECONDS:
        receiver_state = 'no_contact'
    else:
        states = {receiver['state'] for receiver in station['receivers']}
        receiver_state = next((s for s in RECEIVER_STATES if s in states), 'offline')
    fresh = receiver_state not in ('not_commissioned', 'no_contact')
    sources = [{'alias': r['alias'], 'state': r['state'] if fresh else 'no_contact', 'channels': r['channels']}
               for r in (station or {}).get('receivers', [])]
    statuses = [r['identification']['status'] for r in records.values()]
    return jsonify(
        archive='commissioned' if store() else 'not_commissioned',
        receiver_state=receiver_state,
        last_observation_at=max((r['observed_at'] for r in records.values()), default=None),
        last_sync_at=(station or {}).get('received_at'),
        totals={'observations': len(records), 'identified': statuses.count('identified'),
                'possible': statuses.count('possible'), 'unidentified': statuses.count('unidentified'),
                'decoded': sum(1 for r in records.values() if r['content']['kind'] != 'none'),
                'case_files': len(cases)},
        active_sources=sum(1 for s in sources if s['state'] in ('online', 'degraded')),
        sources=sources,
        coverage_gaps=(station or {}).get('coverage_gaps', [])[-20:],
        generated_at=iso(now),
    )


@api.get('/observations')
def observations():
    f = query_args(request.args)
    records, _, _ = archive()
    rows = [record for record in records.values() if matches(record, f)]
    key, reverse = {'newest': ('observed_at', True), 'oldest': ('observed_at', False),
                    'freq_asc': ('frequency_hz', False), 'freq_desc': ('frequency_hz', True)}[f['sort']]
    rows.sort(key=lambda r: (r[key], r['id']), reverse=reverse)
    start = (f['page'] - 1) * f['per_page']
    return jsonify(total=len(rows), page=f['page'], per_page=f['per_page'],
                   pages=max(1, math.ceil(len(rows) / f['per_page'])),
                   observations=[public_observation(r) for r in rows[start:start + f['per_page']]])


@api.get('/observations/<observation_id>')
def observation(observation_id):
    records, _, _ = archive()
    record = records.get(observation_id) if OBS_ID.fullmatch(observation_id) else None
    if record is None:
        raise ApiError('No published observation has that id.', 404)
    return jsonify(observation=public_observation(record))


@api.get('/cases')
def case_files():
    records, cases, _ = archive()
    listed = sorted(cases.values(), key=lambda c: (c['last_detected_at'], c['id']), reverse=True)
    return jsonify(cases=[public_case(case, records) for case in listed])


@api.post('/ingest')
def ingest():
    now = time.time()
    key_id, nonce = authenticate(now)
    current = store()
    if current is None:
        raise ApiError('The archive is not commissioned.', 503)
    payload = request.get_json(silent=True)
    if payload is None:
        raise ApiError('Body must be JSON.', 415)
    result = current.apply(clean_batch(payload, now), nonce, now)
    # Counts only: never the body, never the sender's address.
    current_app.logger.info('Function ingest key=%s accepted=%d duplicates=%d retracted=%d cases=%d replayed_batch=%s',
                            key_id, result['accepted'], result['duplicates'], result['retracted'], result['cases'],
                            result['duplicate_batch'])
    return jsonify(result)
