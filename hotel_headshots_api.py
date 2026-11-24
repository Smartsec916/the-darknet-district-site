"""Account-bound Hotel Headshots runs and public scores. No client Firestore writes.
Milestone/timing validation is abuse resistance, not authoritative game simulation.
"""
import re
import time
import uuid
from flask import Blueprint, jsonify, request, current_app
from werkzeug.exceptions import HTTPException
import identity_api as identity
import blackout_api as registry

api = Blueprint('hotel_headshots', __name__, url_prefix='/api/void-runner/hotel-headshots')
ApiError = registry.ApiError
DIFFICULTIES = {'casual', 'standard', 'checkout'}

@api.errorhandler(ApiError)
def known(error):
    return jsonify(error=error.message), error.status

@api.errorhandler(Exception)
def unavailable(error):
    if isinstance(error, HTTPException):
        return jsonify(error=error.description), error.code
    current_app.logger.exception('Hotel leaderboard unavailable')
    return jsonify(error='Account scores unavailable. Your local score is kept.'), 503

@api.before_request
def limit():
    request.max_content_length = 2048
    if request.content_length and request.content_length > 2048:
        raise ApiError('Request too large.', 413)

@api.after_request
def no_cache(response):
    response.headers['Cache-Control'] = 'no-store'
    return response

def transaction(db, fn):
    from firebase_admin import firestore
    return firestore.transactional(fn)(db.transaction())

def account():
    db, auth, app = identity.services()
    uid = identity.identity(auth, app)
    pid = registry.player_id(uid)
    profile = db.collection('bp_profiles').document(pid).get().to_dict() or {}
    if not profile.get('handle'):
        raise ApiError('Choose a District account handle before starting a ranked run.', 403)
    return db, pid

def body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError('Send a JSON object.')
    return data

def integer(data, key, low, high):
    value = data.get(key)
    if type(value) is not int or not low <= value <= high:
        raise ApiError('Invalid ' + key + '.')
    return value

def rank(row):
    return (-row['money'], row['time'], row['at'], row['playerId'])

def public(db, row):
    profile = db.collection('bp_profiles').document(row['playerId']).get().to_dict() or {}
    return {**{k: row[k] for k in ('money', 'time', 'difficulty', 'at')}, 'handle': profile.get('handle', 'District player')}

def record(db, pid):
    state = db.collection('hh_players').document(pid).get().to_dict() or {}
    best = state.get('best')
    if not best:
        return {'best': None, 'achievements': []}
    board = db.collection('hh_boards').document('all').get().to_dict() or {}
    rows = board.get('rows', [])
    badge = {'id': 'hotel-headshots-score', 'at': best['at'], 'unlockedAt': best['at'], 'verified': True, 'score': best['money']}
    achievements = [badge]
    if rows and best['money'] == rows[0]['money']:
        achievements.append({**badge, 'id': 'arcade-top-hotel-headshots'})
    return {'best': public(db, best), 'achievements': achievements}

@api.get('/me')
def me():
    db, pid = account()
    return jsonify(record(db, pid))

@api.get('/profiles/<handle>')
def profile(handle):
    _, key = registry.clean_handle(handle)
    db, _, _ = identity.services()
    reservation = db.collection('bp_handles').document(key).get().to_dict() or {}
    pid = reservation.get('playerId')
    return jsonify(record(db, pid) if pid else {'best': None, 'achievements': []})

@api.get('/leaderboard')
def leaderboard():
    db, _, _ = identity.services()
    board = db.collection('hh_boards').document('all').get().to_dict() or {}
    return jsonify(entries=[public(db, r) for r in board.get('rows', [])[:100]])

@api.post('/runs')
def start():
    db, pid = account()
    data = body()
    if set(data) != {'difficulty'} or not isinstance(data['difficulty'], str) or data['difficulty'] not in DIFFICULTIES:
        raise ApiError('Invalid difficulty.')
    ref = db.collection('hh_players').document(pid)
    now = time.time()
    run_id = uuid.uuid4().hex
    def write(tx):
        state = ref.get(transaction=tx).to_dict() or {}
        if now - state.get('startedAt', 0) < 5:
            raise ApiError('Wait a moment before restarting a ranked run.', 429)
        tx.set(ref, {'startedAt': now, 'run': {'id': run_id, 'difficulty': data['difficulty'], 'floor': 0,
                'money': 10000, 'time': 0, 'startedAt': now, 'finished': False}}, merge=True)
    transaction(db, write)
    return jsonify(runId=run_id)

@api.post('/runs/<run_id>')
def progress(run_id):
    db, pid = account()
    if not re.fullmatch(r'[0-9a-f]{32}', run_id):
        raise ApiError('Invalid run.')
    data = body()
    if set(data) != {'floor', 'money', 'time', 'finished'} or type(data['finished']) is not bool:
        raise ApiError('Invalid run update.')
    floor = integer(data, 'floor', 0, 4)
    money = integer(data, 'money', 0, 10000)
    elapsed = integer(data, 'time', 0, 14400)
    ref = db.collection('hh_players').document(pid)
    board_ref = db.collection('hh_boards').document('all')
    now = time.time()
    def write(tx):
        state = ref.get(transaction=tx).to_dict() or {}
        run = state.get('run') or {}
        if run.get('id') != run_id:
            raise ApiError('This run belongs to another session.', 409)
        if run.get('finished'):
            if data == run.get('receipt'):
                return
            raise ApiError('This run is already finished.', 409)
        if now - run['startedAt'] > 14400:
            raise ApiError('This ranked run expired.', 409)
        if floor < run['floor'] or floor > run['floor'] + 1 or money > run['money'] or elapsed < run['time']:
            raise ApiError('Invalid floor sequence or score.', 409)
        if elapsed > now - run['startedAt'] + 5 or elapsed < floor * 3:
            raise ApiError('Invalid run timing.', 409)
        if data['finished'] and (floor != 4 or run['floor'] != 4):
            raise ApiError('Reach the penthouse before submitting a score.', 409)
        updated = {**run, **data}
        if not data['finished']:
            tx.set(ref, {'run': updated}, merge=True)
            return
        board = board_ref.get(transaction=tx).to_dict() or {}
        candidate = {'playerId': pid, 'money': money, 'time': elapsed, 'difficulty': run['difficulty'], 'at': int(now * 1000)}
        best = state.get('best')
        if best is None or rank(candidate) < rank(best):
            best = candidate
        rows = [r for r in board.get('rows', []) if r['playerId'] != pid] + [best]
        rows = sorted(rows, key=rank)[:100]
        updated['receipt'] = data
        tx.set(ref, {'run': updated, 'best': best}, merge=True)
        tx.set(board_ref, {'rows': rows})
    transaction(db, write)
    return jsonify(saved=data['finished'])
