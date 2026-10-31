"""District-wide handles: one public name per player across every game.

A visitor can register a handle without a Google account (Firebase anonymous
sign-in on the client), then optionally secure it with an email link or Google.
Handles share Blackout Protocol's registry, so a handle is unique everywhere
and the Blackout leaderboard picks it up automatically.
"""
import os

from flask import Blueprint, current_app, jsonify, request

import blackout_api as registry

api = Blueprint('identity', __name__, url_prefix='/api/identity')
PROJECT = registry.PROJECT
MAX_BODY = 2_000


class ApiError(registry.ApiError):
    pass


@api.errorhandler(registry.ApiError)
def known_error(error):
    return jsonify(error=error.message), error.status


@api.errorhandler(Exception)
def unknown_error(error):
    current_app.logger.exception('District identity API failure')
    return jsonify(error='The handle service is unavailable right now.'), 500


@api.before_request
def limit_body():
    if request.content_length and request.content_length > MAX_BODY:
        raise ApiError('Request is too large.', 413)


@api.after_request
def no_cache(response):
    response.headers['Cache-Control'] = 'no-store'
    return response


def enabled():
    # Any game whose accounts are switched on means the server can reach Firebase.
    flags = ('DISTRICT_HANDLES_ENABLED', 'VOID_ACCOUNTS_ENABLED', 'BLACKOUT_ACCOUNTS_ENABLED')
    return any(os.getenv(flag) == 'true' for flag in flags)


def services():
    if not enabled():
        raise ApiError('Handles are opening soon. Local play is available.', 503)
    import firebase_admin
    from firebase_admin import auth, firestore
    try:
        app = firebase_admin.get_app('district-identity')
    except ValueError:
        app = firebase_admin.initialize_app(options={'projectId': PROJECT}, name='district-identity')
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
        return auth.verify_id_token(header[7:], app=app, check_revoked=True)['uid']
    except Exception:
        raise ApiError('Your sign-in expired. Sign in again.', 401)


def handle_from_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or set(data) != {'handle'}:
        raise ApiError('Send a handle.')
    return data['handle']


@api.get('/handles/<handle>/available')
def handle_available(handle):
    _, key = registry.clean_handle(handle)
    db, auth, app = services()
    uid = identity(auth, app, required=False)
    reservation = db.collection('bp_handles').document(key).get().to_dict()
    mine = bool(uid and reservation and reservation.get('playerId') == registry.player_id(uid))
    return jsonify(available=not reservation or mine)


@api.get('/me')
def me():
    db, auth, app = services()
    uid = identity(auth, app)
    profile = db.collection('bp_profiles').document(registry.player_id(uid)).get().to_dict() or {}
    changed = profile.get('changedAt')
    # Only the public handle leaves this endpoint: never the email address or the name Google holds.
    return jsonify(handle=profile.get('handle'),
                   nextChangeAt=changed + registry.HANDLE_COOLDOWN if changed else None)


@api.post('/handle')
def claim():
    db, auth, app = services()
    uid = identity(auth, app)
    display, changed_at = registry.claim_public_handle(db, uid, handle_from_body())
    # The handle becomes the account's display name in every game. The registry above is the source of truth,
    # so a failure here must not turn a successful claim into an error.
    try:
        auth.update_user(uid, display_name=display, app=app)
    except Exception:
        current_app.logger.warning('Could not mirror the handle to the Firebase display name')
    return jsonify(handle=display, nextChangeAt=changed_at + registry.HANDLE_COOLDOWN)
