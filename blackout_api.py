"""Blackout Protocol accounts and server-controlled Firestore leaderboard."""
import hashlib
import os
import re
import time
import uuid
from itertools import groupby
from functools import wraps

from flask import Blueprint, current_app, jsonify, request

api = Blueprint('blackout', __name__, url_prefix='/api/blackout')
PROJECT = 'the-darknet-district-71873'
HANDLE = re.compile(r'^[A-Za-z0-9_]{3,20}$')
RUN_ID = re.compile(r'^[0-9a-f]{32}$')
HANDLE_COOLDOWN = 30 * 24 * 3600
RUN_START_COOLDOWN = 30
RUN_LIFETIME = 4 * 3600
MIN_LEVEL_SECONDS = 12
MAX_LEVEL_DELTA = {1: 1900, 2: 2100, 3: 2000, 4: 2200, 5: 2500, 6: 2800}
POINTS = {'hack': 20, 'shot': 10, 'coin': 5, 'relay': 50, 'relayBonus': 100, 'jumpRobot': 12}
BLOCKED_HANDLES = {'admin', 'administrator', 'moderator', 'mod', 'support', 'staff',
                   'official', 'firebase', 'google', 'developer', 'system', 'null'}
BLOCKED_FRAGMENTS = {'nigger', 'faggot', 'kike', 'rape'}
# Names that would let someone pass for staff, the site or its characters. Matched after folding look-alikes
# (1/l -> i, 0 -> o, 3 -> e, 4 -> a, 5/$ -> s, 7 -> t), dropping underscores and trailing digits, and collapsing repeats.
IMPERSONATION_WORDS = {'admin', 'administrator', 'moderator', 'mod', 'support', 'staff', 'official', 'system',
                       'root', 'owner', 'superuser', 'sysadmin', 'security', 'helpdesk', 'server', 'firebase',
                       'google', 'iris', 'darknet', 'darknetdistrict', 'thedarknetdistrict', 'district',
                       'voidrunner', 'blackout', 'blackoutprotocol', 'david', 'smartsec', 'anonymous', 'null'}
IMPERSONATION_AFFIXES = {'', 'the', 'real', 'official', 'bot', 'ai', 'team', 'staff', 'support', 'admin', 'mod',
                         'dev', 'hq', 'help', 'x', 'xx', 'ceo'}
_squeeze = lambda text: ''.join(char for char, _ in groupby(text))
_LOOKALIKES = str.maketrans({'0': 'o', '1': 'i', 'l': 'i', '3': 'e', '4': 'a', '5': 's', '$': 's', '7': 't'})


def fold_handle(key):
    """The shape of a handle with look-alike characters, underscores and trailing numbers removed."""
    folded = re.sub(r'\d+$', '', key.replace('_', '')).translate(_LOOKALIKES)
    return _squeeze(folded)


AFFIXES = {_squeeze(a.translate(_LOOKALIKES)) for a in IMPERSONATION_AFFIXES}


def impersonates(key):
    folded = fold_handle(key)
    for word in IMPERSONATION_WORDS:
        word = _squeeze(word.translate(_LOOKALIKES))
        if folded == word or (folded.startswith(word) and folded[len(word):] in AFFIXES) \
                or (folded.endswith(word) and folded[:-len(word)] in AFFIXES):
            return True
    return False


class ApiError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message, self.status = message, status


@api.errorhandler(ApiError)
def known_error(error):
    return jsonify(error=error.message), error.status


@api.errorhandler(Exception)
def unknown_error(error):
    current_app.logger.exception('Blackout account service failed')
    return jsonify(error='The leaderboard service is unavailable. Local play is still available.'), 503


@api.before_request
def limit_body():
    request.max_content_length = 8192
    if request.content_length and request.content_length > 8192:
        raise ApiError('Request is too large.', 413)


@api.after_request
def no_cache(response):
    response.headers['Cache-Control'] = 'no-store'
    return response


def services():
    if os.getenv('BLACKOUT_ACCOUNTS_ENABLED') != 'true':
        raise ApiError('Global leaderboard is not enabled yet. Local play is available.', 503)
    import firebase_admin
    from firebase_admin import auth, firestore
    try:
        app = firebase_admin.get_app('blackout-protocol')
    except ValueError:
        app = firebase_admin.initialize_app(options={'projectId': PROJECT}, name='blackout-protocol')
    return firestore.client(app), auth, app


def identity(auth, app, required=True):
    header = request.headers.get('Authorization', '')
    if not header:
        if required:
            raise ApiError('Sign in or register a handle to continue.', 401)
        return None
    if not header.startswith('Bearer ') or len(header) > 8192:
        raise ApiError('Invalid authorization header.', 401)
    try:
        claims = auth.verify_id_token(header[7:], app=app, check_revoked=True)
        return claims['uid']
    except Exception:
        raise ApiError('Your sign-in expired. Sign in again.', 401)


def signed_in(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        db, auth, app = services()
        return handler(db, identity(auth, app), *args, **kwargs)
    return wrapped


def player_id(uid):
    return hashlib.sha256(uid.encode('utf-8')).hexdigest()


def refs(db, pid):
    return (db.collection('bp_profiles').document(pid),
            db.collection('bp_stats').document(pid),
            db.collection('bp_leaderboard').document(pid))


def clean_handle(value):
    if not isinstance(value, str) or not HANDLE.fullmatch(value):
        raise ApiError('Use 3–20 letters, numbers, or underscores.')
    key = value.lower()
    if key in BLOCKED_HANDLES or any(part in key for part in BLOCKED_FRAGMENTS) or key.startswith(('admin_', 'mod_', 'support_')) or impersonates(key):
        raise ApiError('This handle is reserved. Choose another.')
    return value, key


def body(required):
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or set(data) != set(required):
        raise ApiError('Malformed request.')
    return data


def score_value(value):
    if type(value) is not int or not 0 <= value <= sum(MAX_LEVEL_DELTA.values()):
        raise ApiError('Invalid score.')
    return value


def validate_events(events, level, delta):
    if not isinstance(events, dict) or set(events) - set(POINTS):
        raise ApiError('Invalid score events.')
    limits = {'hack': 20, 'shot': 60 if level >= 5 else 0,
              'coin': 100, 'relay': 3, 'relayBonus': 1,
              # Robots from sector 4; street gangs in sectors 1 and 2.
              'jumpRobot': 50 if level >= 4 else (30 if level <= 2 else 0)}
    if level > 6:
        limits = dict.fromkeys(POINTS, 0)
    for kind, value in events.items():
        if type(value) is not int or not 0 <= value <= limits[kind]:
            raise ApiError('Score events exceed the level limit.', 422)
    if events.get('relayBonus', 0) and events.get('relay', 0) != 3:
        raise ApiError('Relay bonus has no matching relays.', 422)
    if sum(POINTS[kind] * amount for kind, amount in events.items()) != delta:
        raise ApiError('Score does not match gameplay events.', 422)
    return {kind: amount for kind, amount in events.items() if amount}


def run_ref(db, run_id):
    if not RUN_ID.fullmatch(run_id):
        raise ApiError('Invalid run ID.')
    return db.collection('bp_runs').document(run_id)


def count_query(query):
    return int(query.count(alias='n').get()[0][0].value)


def rank_for(db, entry):
    if not entry:
        return None
    from google.cloud.firestore_v1.base_query import FieldFilter
    rows = db.collection('bp_leaderboard')
    higher = count_query(rows.where(filter=FieldFilter('bestScore', '>', entry['bestScore'])))
    earlier = count_query(rows.where(filter=FieldFilter('bestScore', '==', entry['bestScore']))
                          .where(filter=FieldFilter('sortKey', '<', entry['sortKey'])))
    return higher + earlier + 1


def public_entry(doc, rank):
    value = doc.to_dict()
    return {'rank': rank, 'handle': value['handle'], 'bestScore': value['bestScore'],
            'highestCompletedLevel': value['highestCompletedLevel']}


# The public top 100 costs up to 100 Firestore reads, so it is shared across
# requests briefly and dropped whenever a score or handle changes.
TOP_CACHE_SECONDS = 30
_top_cache = {'at': 0.0, 'rows': None}


def invalidate_top():
    _top_cache['rows'] = None


def top_entries(db):
    now = time.monotonic()
    if _top_cache['rows'] is not None and now - _top_cache['at'] < TOP_CACHE_SECONDS:
        return _top_cache['rows']
    from google.cloud.firestore_v1 import Query
    rows = db.collection('bp_leaderboard').order_by('bestScore', direction=Query.DESCENDING).order_by('sortKey').limit(100).stream()
    top = [public_entry(doc, rank) for rank, doc in enumerate(rows, 1)]
    _top_cache.update(at=now, rows=top)
    return top


@api.get('/leaderboard')
def leaderboard():
    db, auth, app = services()
    top = top_entries(db)
    uid = identity(auth, app, required=False)
    mine = None
    if uid:
        pid = player_id(uid)
        profile_ref, stats_ref, board_ref = refs(db, pid)
        profile = profile_ref.get().to_dict() or {}
        stats = stats_ref.get().to_dict() or {}
        board = board_ref.get().to_dict()
        mine = {'handle': profile.get('handle'), 'bestScore': stats.get('bestScore', 0),
                'highestCompletedLevel': stats.get('highestCompletedLevel', 0),
                'totalCompletedGames': stats.get('totalCompletedGames', 0),
                'bestAt': stats.get('bestAt'), 'lastPlayed': stats.get('lastPlayed'),
                'rank': rank_for(db, board)}
    return jsonify(entries=top, me=mine)


@api.get('/handles/<handle>/available')
def handle_available(handle):
    _, key = clean_handle(handle)
    db, auth, app = services()
    uid = identity(auth, app, required=False)
    reservation = db.collection('bp_handles').document(key).get().to_dict()
    return jsonify(available=not reservation or bool(uid and reservation.get('playerId') == player_id(uid)))


def claim_public_handle(db, uid, handle):
    """Reserve a District-wide public handle for uid. Shared by every game.

    Returns (display, changed_at). Raises ApiError when the handle is invalid,
    taken by someone else, or changed too recently.
    """
    from firebase_admin import firestore
    display, key = clean_handle(handle)
    now, pid = int(time.time()), player_id(uid)
    profile_ref, _, board_ref = refs(db, pid)
    reservation = db.collection('bp_handles').document(key)

    @firestore.transactional
    def commit(tx):
        prior = profile_ref.get(transaction=tx).to_dict() or {}
        claimed = reservation.get(transaction=tx).to_dict()
        board = board_ref.get(transaction=tx).to_dict()
        old_key = prior.get('handleKey')
        if claimed and claimed.get('playerId') != pid:
            raise ApiError('That handle is taken.', 409)
        if prior.get('handle') == display:
            return prior.get('changedAt', now)
        if prior.get('changedAt') and now - prior['changedAt'] < HANDLE_COOLDOWN and prior.get('handle') != display:
            days = -(-(prior['changedAt'] + HANDLE_COOLDOWN - now) // 86400)
            raise ApiError(f'You can change your handle again in {days} day{"" if days == 1 else "s"}.', 429)
        if old_key and old_key != key:
            tx.delete(db.collection('bp_handles').document(old_key))
        tx.set(reservation, {'playerId': pid, 'reservedAt': now})
        tx.set(profile_ref, {'handle': display, 'handleKey': key,
                             'createdAt': prior.get('createdAt', now), 'changedAt': now})
        if board:
            tx.set(board_ref, {'handle': display}, merge=True)
        return now
    changed_at = commit(db.transaction())
    invalidate_top()
    return display, changed_at


@api.post('/handle')
@signed_in
def claim_handle(db, uid):
    display, changed_at = claim_public_handle(db, uid, body(['handle'])['handle'])
    try:
        # Show the same handle in every District game. Best effort only.
        _, auth, app = services()
        auth.update_user(uid, display_name=display, app=app)
    except Exception:
        pass
    return jsonify(handle=display, nextChangeAt=changed_at + HANDLE_COOLDOWN)


@api.post('/runs')
@signed_in
def start_run(db, uid):
    from firebase_admin import firestore
    body([])
    now, pid, run_id = int(time.time()), player_id(uid), uuid.uuid4().hex
    _, stats_ref, _ = refs(db, pid)
    run = run_ref(db, run_id)

    @firestore.transactional
    def commit(tx):
        stats = stats_ref.get(transaction=tx).to_dict() or {}
        if now - stats.get('lastRunStartedAt', 0) < RUN_START_COOLDOWN:
            raise ApiError('Wait a moment before starting another ranked run.', 429)
        tx.set(run, {'playerId': pid, 'startedAt': now, 'levelStartedAt': now,
                     'nextLevel': 1, 'completedLevel': 0, 'score': 0, 'status': 'active'})
        tx.set(stats_ref, {'uid': uid, 'bestScore': stats.get('bestScore', 0),
                           'highestCompletedLevel': stats.get('highestCompletedLevel', 0),
                           'totalCompletedGames': stats.get('totalCompletedGames', 0),
                           'bestAt': stats.get('bestAt'), 'lastPlayed': now,
                           'lastRunStartedAt': now, 'activeRunId': run_id}, merge=True)
    commit(db.transaction())
    return jsonify(runId=run_id)


@api.post('/runs/<run_id>/level')
@signed_in
def complete_level(db, uid, run_id):
    from firebase_admin import firestore
    data = body(['level', 'score', 'events'])
    level, score = data['level'], score_value(data['score'])
    if type(level) is not int or level not in MAX_LEVEL_DELTA:
        raise ApiError('Invalid level.')
    now, pid = int(time.time()), player_id(uid)
    run = run_ref(db, run_id)
    _, stats_ref, _ = refs(db, pid)

    @firestore.transactional
    def commit(tx):
        state = run.get(transaction=tx).to_dict()
        stats = stats_ref.get(transaction=tx).to_dict() or {}
        if not state or state.get('playerId') != pid or stats.get('activeRunId') != run_id or state.get('status') != 'active':
            raise ApiError('This ranked run is unavailable.', 409)
        if state['completedLevel'] == level and state['score'] == score:
            return state['completedLevel']
        if state['nextLevel'] != level or now - state['startedAt'] > RUN_LIFETIME or now - state['levelStartedAt'] < MIN_LEVEL_SECONDS:
            raise ApiError('Level progression was too fast or out of order.', 422)
        if not state['score'] <= score <= state['score'] + MAX_LEVEL_DELTA[level]:
            raise ApiError('Score change is outside this level’s range.', 422)
        events = validate_events(data['events'], level, score - state['score'])
        tx.set(run, {'completedLevel': level, 'nextLevel': level + 1,
                     'levelStartedAt': now, 'score': score,
                     'stages': state.get('stages', []) + [{'level': level, 'score': score, 'events': events, 'at': now}]}, merge=True)
        tx.set(stats_ref, {'highestCompletedLevel': max(level, stats.get('highestCompletedLevel', 0)),
                           'lastPlayed': now}, merge=True)
        return level
    completed = commit(db.transaction())
    return jsonify(completedLevel=completed)


@api.post('/runs/<run_id>/finish')
@signed_in
def finish_run(db, uid, run_id):
    from firebase_admin import firestore
    data = body(['score', 'events'])
    score = score_value(data['score'])
    now, pid = int(time.time()), player_id(uid)
    run = run_ref(db, run_id)
    profile_ref, stats_ref, board_ref = refs(db, pid)
    submission_ref = db.collection('bp_submissions').document(run_id)

    @firestore.transactional
    def commit(tx):
        state = run.get(transaction=tx).to_dict()
        stats = stats_ref.get(transaction=tx).to_dict() or {}
        profile = profile_ref.get(transaction=tx).to_dict() or {}
        board = board_ref.get(transaction=tx).to_dict() or {}
        prior_submission = submission_ref.get(transaction=tx).to_dict()
        if prior_submission:
            if prior_submission.get('playerId') != pid or prior_submission.get('score') != score:
                raise ApiError('Duplicate submission does not match.', 409)
            return {'personalBest': False, 'bestScore': stats.get('bestScore', 0),
                    'completedLevel': prior_submission['completedLevel'], 'duplicate': True}
        if not state or state.get('playerId') != pid or stats.get('activeRunId') != run_id or state.get('status') != 'active':
            raise ApiError('This ranked run is unavailable.', 409)
        if not profile.get('handle'):
            raise ApiError('Choose a public handle before submitting a ranked score.', 409)
        if now - state['startedAt'] > RUN_LIFETIME or now - state['startedAt'] < MIN_LEVEL_SECONDS:
            raise ApiError('Run duration is implausible.', 422)
        current_level = state['nextLevel']
        allowance = 0 if current_level > 6 else MAX_LEVEL_DELTA[current_level]
        if not state['score'] <= score <= state['score'] + allowance:
            raise ApiError('Score change is outside the current level’s range.', 422)
        events = validate_events(data['events'], current_level, score - state['score'])
        completed = state['completedLevel']
        best = max(stats.get('bestScore', 0), score)
        improved = score > stats.get('bestScore', 0)
        highest = max(stats.get('highestCompletedLevel', 0), completed)
        best_at = now if improved else stats.get('bestAt')
        tx.set(run, {'status': 'finished', 'score': score, 'finishedAt': now}, merge=True)
        tx.set(submission_ref, {'playerId': pid, 'score': score,
                                'completedLevel': completed, 'events': events, 'submittedAt': now})
        tx.set(stats_ref, {'bestScore': best, 'highestCompletedLevel': highest,
                           'totalCompletedGames': stats.get('totalCompletedGames', 0) + (1 if completed == 6 else 0),
                           'bestAt': best_at, 'lastPlayed': now, 'activeRunId': None}, merge=True)
        tx.set(board_ref, {'handle': profile['handle'], 'bestScore': best,
                           'highestCompletedLevel': highest, 'bestAt': best_at,
                           'sortKey': pid}, merge=True)
        return {'personalBest': improved, 'bestScore': best,
                'completedLevel': completed, 'duplicate': False}
    result = commit(db.transaction())
    invalidate_top()
    return jsonify(**result)
