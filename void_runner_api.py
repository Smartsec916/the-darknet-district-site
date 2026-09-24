"""Account-bound saves and Stripe fulfillment. No secrets or ownership in the browser."""
import hashlib
import os
import time
import uuid
import json
import math
from pathlib import Path
from functools import wraps
from flask import Blueprint, jsonify, request, current_app

api = Blueprint('void_runner', __name__, url_prefix='/api/void-runner')
ITEMS = {'wraith': 'Wraith Cannon', 'aegis': 'Aegis Shield', 'ghost': 'Ghost Drive', 'sentinel': 'Sentinel Drone', 'spectre': 'Spectre / 03'}
PROJECT = 'the-darknet-district-71873'

# One numeric schema shared with the browser; parse JSON without executing JS.
BALANCE_SPEC = json.loads((Path(__file__).parent / 'void-runner' / 'balance-data.js').read_text(encoding='utf-8').split('globalThis.VoidBalanceSpec = ', 1)[1].strip().removesuffix(';'))
BALANCE_DEFAULTS = {key: field['value'] for key, field in BALANCE_SPEC.items()}


def balance_admin(uid):
    return uid in {entry.strip() for entry in os.getenv('VOID_ADMIN_UIDS', '').split(',') if entry.strip()}


def clean_balance(value):
    if not isinstance(value, dict) or set(value) != set(BALANCE_SPEC):
        raise ApiError('A complete balance configuration is required.')
    for key, number in value.items():
        field = BALANCE_SPEC[key]
        if type(number) not in (int, float) or not math.isfinite(number) or not field['min'] <= number <= field['max']:
            raise ApiError('Invalid balance value: ' + key)
    return dict(value)


def balance_record(db):
    saved = db.collection('vr_config').document('combat').get().to_dict() or {}
    return {'values': {**BALANCE_DEFAULTS, **saved.get('values', {})}, 'revision': saved.get('revision', 0), 'preset': saved.get('preset', 'NORMAL')}


class ApiError(Exception):
    def __init__(self, message, status=400):
        self.message, self.status = message, status


@api.errorhandler(ApiError)
def api_error(error):
    return jsonify(error=error.message), error.status


@api.errorhandler(Exception)
def service_error(error):
    current_app.logger.exception('VOID//RUNNER service request failed')
    return jsonify(error='The account service is temporarily unavailable. Please try again.'), 503


@api.before_request
def limit_body():
    request.max_content_length = 256_000
    if request.content_length and request.content_length > 256_000:
        raise ApiError('Request is too large.', 413)


@api.after_request
def no_cache(response):
    response.headers['Cache-Control'] = 'no-store'
    return response


def services():
    if os.getenv('VOID_ACCOUNTS_ENABLED') != 'true':
        raise ApiError('Cloud saves and purchases are opening soon. Local play is available.', 503)
    import firebase_admin
    from firebase_admin import firestore, auth
    try:
        app = firebase_admin.get_app('void-runner')
    except ValueError:
        app = firebase_admin.initialize_app(options={'projectId': PROJECT}, name='void-runner')
    return firestore.client(app), auth, app


def payment_service():
    import stripe
    key = os.getenv('STRIPE_SECRET_KEY', '')
    live = os.getenv('VOID_ALLOW_LIVE_PAYMENTS') == 'true'
    if not key.startswith('sk_test_') and not (live and key.startswith('sk_live_')):
        raise ApiError('Equipment sales are not open yet.', 503)
    stripe.api_key = key
    stripe.max_network_retries = 2
    return stripe


def signed_in(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        db, auth, app = services()
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            raise ApiError('Sign in to continue.', 401)
        try:
            claims = auth.verify_id_token(header[7:], app=app, check_revoked=True)
        except Exception:
            raise ApiError('Your sign-in expired. Sign in again.', 401)
        return handler(db, claims['uid'], *args, **kwargs)
    return wrapped


def player_ref(db, uid):
    return db.collection('vr_players').document(hashlib.sha256(uid.encode()).hexdigest())


def inventory(db, uid):
    from google.cloud.firestore_v1.base_query import FieldFilter
    owned = set()
    for snapshot in db.collection('vr_orders').where(filter=FieldFilter('uid', '==', uid)).stream():
        order = snapshot.to_dict()
        if order.get('status') == 'paid' and order.get('item') in ITEMS and order.get('live', False) == os.getenv('STRIPE_SECRET_KEY', '').startswith('sk_live_'):
            owned.add(order['item'])
    return sorted(owned)


def product(stripe, item):
    if item not in ITEMS:
        raise ApiError('Unknown equipment.')
    price_id = os.getenv('VOID_PRICE_' + item.upper(), '')
    if not price_id.startswith('price_'):
        raise ApiError('This equipment is not on sale yet.', 503)
    price = stripe.Price.retrieve(price_id)
    expected_live = os.getenv('STRIPE_SECRET_KEY', '').startswith('sk_live_')
    if not price.get('active') or price.get('recurring') or not isinstance(price.get('unit_amount'), int) or price['unit_amount'] <= 0 or price.get('livemode') != expected_live or price.get('currency') != 'usd':
        raise ApiError('Equipment price is not configured correctly.', 503)
    if item == 'spectre' and price['unit_amount'] != 100:
        raise ApiError('Spectre must be configured as a one-time $1.00 USD price.', 503)
    return {'id': item, 'name': ITEMS[item], 'price': price_id, 'amount': price['unit_amount'], 'currency': price['currency']}


@api.get('/catalog')
def catalog():
    services()
    stripe = payment_service()
    products = []
    for item in ITEMS:
        if os.getenv('VOID_PRICE_' + item.upper()):
            products.append(product(stripe, item))
    return jsonify(products=products, testMode=not os.getenv('STRIPE_SECRET_KEY', '').startswith('sk_live_'))


@api.get('/account')
@signed_in
def account(db, uid):
    saved = player_ref(db, uid).get().to_dict() or {}
    return jsonify(owned=inventory(db, uid), developer=balance_admin(uid), save=saved.get('save'), revision=saved.get('revision', 0), savedAt=saved.get('savedAt'))


@api.get('/balance')
def public_balance():
    if os.getenv('VOID_ACCOUNTS_ENABLED') != 'true':
        return jsonify(values=BALANCE_DEFAULTS)
    db, _, _ = services()
    return jsonify(values=balance_record(db)['values'])


@api.route('/developer/balance', methods=['GET', 'POST'])
@signed_in
def developer_balance(db, uid):
    # Firebase verifies token signature, audience, expiry and revocation first.
    # This allowlist lives only in the server environment, never in a save/email.
    if not balance_admin(uid):
        raise ApiError('Developer access is not authorized.', 403)
    if request.method == 'GET':
        return jsonify(**balance_record(db))
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or type(payload.get('revision')) is not int:
        raise ApiError('A balance revision is required.')
    values = clean_balance(payload.get('values'))
    preset = payload.get('preset')
    if preset not in ['EASY', 'NORMAL', 'HARD', 'CUSTOM']:
        raise ApiError('Invalid balance preset.')
    from firebase_admin import firestore
    ref = db.collection('vr_config').document('combat')

    @firestore.transactional
    def commit(transaction):
        prior = ref.get(transaction=transaction).to_dict() or {}
        revision = prior.get('revision', 0)
        if payload['revision'] != revision:
            raise ApiError('Balance changed on another device. Reload current values first.', 409)
        transaction.set(ref, {'values': values, 'preset': preset, 'revision': revision + 1,
                              'updatedAt': int(time.time()), 'updatedBy': uid})
        return revision + 1
    revision = commit(db.transaction())
    return jsonify(values=values, preset=preset, revision=revision)


def clean_save(value):
    """Cloud saves cannot grant ownership, change prices or write another player's record."""
    if not isinstance(value, dict) or value.get('version') != 2:
        raise ApiError('Unsupported save format.')
    from pathlib import Path
    import json
    manifest=json.loads((Path(__file__).parent/'void-runner'/'save-manifest.json').read_text())
    if value.get('quest') not in ['inheritance','arrival','legal-offer','legal-run','return','illegal-offer','illegal-run','open'] or value.get('location') not in manifest['locations']:
        raise ApiError('Invalid campaign state.')
    result = {k: value[k] for k in ['version','quest','location']}
    for k in ['credits','completed']:
        v = value.get(k)
        if type(v) is not int or not 0 <= v <= 100_000_000:
            raise ApiError('Invalid campaign values.')
        result[k] = v
    upgrades = value.get('upgrades')
    if not isinstance(upgrades, dict) or any(type(upgrades.get(k)) is not int or not 0 <= upgrades[k] <= 3 for k in ['guns','armor','engines']):
        raise ApiError('Invalid upgrades.')
    shield_tier=upgrades.get('shields',0)
    if type(shield_tier) is not int or not 0 <= shield_tier <= 3:
        raise ApiError('Invalid shield upgrade.')
    result['upgrades'] = {k: upgrades[k] for k in ['guns','armor','engines']}
    result['upgrades']['shields']=shield_tier
    credit_gear=value.get('creditGear',[])
    if not isinstance(credit_gear,list) or len(credit_gear)>3 or any(x not in ['vector','scout','launcher'] for x in credit_gear):
        raise ApiError('Invalid credit equipment.')
    result['creditGear']=list(dict.fromkeys(credit_gear))
    missions = manifest['missions']
    contract = value.get('contract')
    if contract is not None and contract not in ['medicine','ghost','foundry',*missions]:
        raise ApiError('Invalid mission.')
    result['contract'] = contract
    cleared = value.get('cleared')
    if not isinstance(cleared, list) or len(cleared) > len(manifest['chapters']) or any(x not in manifest['chapters'] for x in cleared):
        raise ApiError('Invalid chapter progress.')
    result['cleared'] = list(dict.fromkeys(cleared))
    loadout = value.get('loadout')
    if not isinstance(loadout, dict):
        raise ApiError('Invalid loadout.')
    slots = {'weapon':[None,'wraith','pulse1','pulse2','pulse3'], 'shield':[None,'aegis','shield1','shield2','shield3'], 'utility':[None,'ghost','sentinel','vector','scout'], 'missile':[None,'launcher']}
    if any(loadout.get(k) not in allowed for k, allowed in slots.items()):
        raise ApiError('Invalid equipment.')
    result['loadout'] = {k: loadout.get(k) for k in slots}
    # These fields are ordinary campaign data, never premium inventory claims.
    ship_ids = ['starter','ship2','ship3']
    ships = value.get('ownedShips',['starter'])
    standard = value.get('standardGear',['pulse1','shield1'])
    if not isinstance(ships,list) or len(ships)>3 or any(x not in ship_ids for x in ships):
        raise ApiError('Invalid campaign ships.')
    if not isinstance(standard,list) or len(standard)>6 or any(x not in ['pulse1','pulse2','pulse3','shield1','shield2','shield3'] for x in standard):
        raise ApiError('Invalid standard equipment.')
    result['ownedShips'] = list(dict.fromkeys(['starter',*[s for s in ships if s != 'ship3']]))
    result['standardGear'] = list(dict.fromkeys(['pulse1','shield1',*[g for g in standard if g not in ('pulse3','shield3')]]))
    active = value.get('activeShip','starter')
    if active not in ship_ids or (active != 'ship3' and active not in result['ownedShips']):
        raise ApiError('Ship is not owned by this campaign.')
    result['activeShip'] = 'starter' if active == 'ship3' else active
    loadouts = value.get('shipLoadouts',{})
    if not isinstance(loadouts,dict) or len(loadouts)>3 or any(k not in result['ownedShips'] and k != 'ship3' for k in loadouts):
        raise ApiError('Invalid ship loadouts.')
    result['shipLoadouts'] = {}
    for ship_id, equipped in loadouts.items():
        if not isinstance(equipped,dict) or any(equipped.get(k) not in allowed for k,allowed in slots.items()):
            raise ApiError('Invalid ship equipment.')
        result['shipLoadouts'][ship_id] = {k:equipped.get(k) for k in slots}
    runs = value.get('combatRuns',min(result['completed'],2))
    if type(runs) is not int or not 0 <= runs <= 100_000_000:
        raise ApiError('Invalid combat progression.')
    result['combatRuns'] = runs
    result['missileUnlocked'] = runs >= 2
    result['missileOfferSeen'] = value.get('missileOfferSeen') is True
    locations = manifest['locations']
    destination = value.get('destination')
    if destination is not None and destination not in locations:
        raise ApiError('Invalid destination.')
    result['destination'] = destination
    universe = value.get('universe', {})
    if not isinstance(universe, dict):
        raise ApiError('Invalid universe state.')
    cleaned_universe = {}
    for key, allowed, default in [('discoveredSystems', ['erebus','sol'], ['erebus']), ('discoveredLocations', locations, ['vesper','meridian']), ('visitedLocations', locations, ['vesper'])]:
        entries = universe.get(key, default)
        if not isinstance(entries,list) or len(entries)>256 or any(x not in allowed for x in entries):
            raise ApiError('Invalid universe locations.')
        cleaned_universe[key] = list(dict.fromkeys(entries))
    cleaned_universe['currentSystem'] = 'sol' if result['location'] in ['sol-belt','earth','mars'] else 'erebus'
    for key in ['missionLogUnlocked','freeTravel']:
        cleaned_universe[key] = universe.get(key) is True or result['missileOfferSeen']
    tracked = universe.get('trackedMission')
    if tracked is not None and (not isinstance(tracked,str) or len(tracked)>80):
        raise ApiError('Invalid tracked mission.')
    cleaned_universe['trackedMission'] = tracked
    completed = universe.get('completedObjectives', [])
    if not isinstance(completed,list) or len(completed)>200 or any(not isinstance(x,str) or len(x)>80 for x in completed):
        raise ApiError('Invalid completed objectives.')
    cleaned_universe['completedObjectives'] = completed
    station = universe.get('station')
    cleaned_universe['station'] = {'location':result['location']} if isinstance(station,dict) and station.get('location') == result['location'] else None
    if value.get('progression') is not None:
        from void_runner_progression import clean_progression
        try:
            result['progression'] = clean_progression(value['progression'], locations)
        except (ValueError, TypeError, AttributeError) as error:
            raise ApiError(str(error))
        cleaned_universe['freeTravel'] = result['progression']['completed'] and result['missileOfferSeen']
    result['universe'] = cleaned_universe
    result['travel'] = None
    travel = value.get('travel')
    if travel is not None:
        import math
        if not isinstance(travel,dict) or travel.get('origin') not in locations or travel.get('destination') not in locations:
            raise ApiError('Invalid route.')
        progress = travel.get('progress')
        if type(progress) not in [int,float] or not math.isfinite(progress) or not 0 <= progress <= 1:
            raise ApiError('Invalid route progress.')
        encounter = travel.get('encounter')
        if not isinstance(encounter,dict) or encounter.get('type') not in ['combat','none'] or encounter.get('state') not in ['pending','active','cleared']:
            raise ApiError('Invalid encounter.')
        mission = travel.get('mission')
        if mission is not None and mission not in ['medicine','ghost','foundry',*missions,'inheritance','arrival','legal-offer','legal-run','return','illegal-offer','illegal-run','open']:
            raise ApiError('Invalid route mission.')
        result['travel'] = {'origin':travel['origin'],'destination':travel['destination'],'progress':progress,'mission':mission,'encounter':{'type':encounter['type'],'state':encounter['state']}}
    story = value.get('story', {})
    if not isinstance(story, dict):
        raise ApiError('Invalid story state.')
    import re
    def story_id(x):
        return isinstance(x,str) and re.fullmatch(r'[a-zA-Z][\w-]{0,63}',x) and x not in ['constructor','prototype','__proto__']
    cleaned = {}
    for key in ['met','events','unlocked','pending','encounters']:
        entries = story.get(key, [])
        if not isinstance(entries,list) or len(entries)>256 or not all(story_id(x) for x in entries):
            raise ApiError('Invalid story list.')
        cleaned[key] = list(dict.fromkeys(entries))
    for key in ['flags','relationships','characters']:
        entries = story.get(key,{})
        if not isinstance(entries,dict) or len(entries)>256 or not all(story_id(x) for x in entries):
            raise ApiError('Invalid story records.')
        for item in entries.values():
            valid = (type(item) is bool or isinstance(item,str) and len(item)<=200 or type(item) is int and abs(item)<=9007199254740991) if key=='flags' else (type(item) is int and -100<=item<=100) if key=='relationships' else item in ['alive','dead','removed']
            if not valid:
                raise ApiError('Invalid story value.')
        cleaned[key] = dict(entries)
    chapter = story.get('chapter','inheritance')
    if not story_id(chapter):
        raise ApiError('Invalid story chapter.')
    cleaned['chapter'] = chapter
    if 'cursor' in story:
        cursor=story['cursor']
        if cursor is not None and (not isinstance(cursor,dict) or not story_id(cursor.get('scene')) or not story_id(cursor.get('node')) or type(cursor.get('choices')) is not bool):
            raise ApiError('Invalid dialogue checkpoint.')
        cleaned['cursor']=None if cursor is None else {key:cursor[key] for key in ['scene','node','choices']}

    if 'story' in value:
        result['story'] = cleaned
    saved_at = value.get('savedAt')
    if saved_at is not None and (type(saved_at) is not int or not 0<saved_at<=9007199254740991):
        raise ApiError('Invalid save timestamp.')
    result['savedAt'] = saved_at
    return result


@api.post('/save')
@signed_in
def save_campaign(db, uid):
    from firebase_admin import firestore
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or type(payload.get('revision')) is not int:
        raise ApiError('A save revision is required.')
    campaign = clean_save(payload.get('save'))
    ref = player_ref(db, uid)

    @firestore.transactional
    def commit(transaction):
        prior = ref.get(transaction=transaction).to_dict() or {}
        revision = prior.get('revision', 0)
        if payload['revision'] != revision:
            raise ApiError('Another device changed your cloud save. Refresh your account before choosing which save to keep.', 409)
        timestamp = int(time.time())
        transaction.set(ref, {'save':campaign,'revision':revision+1,'savedAt':timestamp}, merge=True)
        return revision+1, timestamp
    revision, timestamp = commit(db.transaction())
    return jsonify(revision=revision, savedAt=timestamp)


def fulfill(db, stripe, session_id, expected_uid=None):
    """Use the server's checkout record and current Stripe status, never URL claims."""
    from firebase_admin import firestore
    session = stripe.checkout.Session.retrieve(session_id, expand=['line_items','payment_intent.latest_charge'])
    attempt = (session.get('metadata') or {}).get('attempt', '')
    if not attempt or not attempt.isalnum() or len(attempt) > 64:
        raise ApiError('Unknown checkout.', 404)
    record = db.collection('vr_checkouts').document(attempt).get().to_dict()
    if not record or (expected_uid and record['uid'] != expected_uid):
        raise ApiError('This checkout belongs to another account.', 403)
    if session.get('client_reference_id') != record['uid']:
        raise ApiError('Checkout account mismatch.', 409)
    if session.get('payment_status') != 'paid':
        return 'pending'
    lines = session.get('line_items', {}).get('data', [])
    if len(lines) != 1 or lines[0].get('quantity') != 1 or lines[0].get('price', {}).get('id') != record['price'] or session.get('amount_total') != record['amount'] or session.get('currency') != record['currency'] or session.get('livemode') != record['live']:
        raise ApiError('Checkout details do not match the order.', 409)
    intent = session.get('payment_intent') or {}
    charge = intent.get('latest_charge') or {}
    status = 'revoked' if charge.get('amount_refunded', 0) > 0 or charge.get('disputed') else 'paid'
    order_ref = db.collection('vr_orders').document(session_id)
    guard_ref = db.collection('vr_payment_blocks').document(intent['id'])

    @firestore.transactional
    def commit(transaction):
        guard = guard_ref.get(transaction=transaction).to_dict() or {}
        prior = order_ref.get(transaction=transaction).to_dict() or {}
        final_status = 'revoked' if guard.get('blocked') or prior.get('status') == 'revoked' else status
        transaction.set(order_ref, {'uid':record['uid'],'item':record['item'],'status':final_status,'live':record['live'],'paymentIntent':intent['id'],'updatedAt':int(time.time())})
        return final_status
    return commit(db.transaction())


@api.post('/checkout')
@signed_in
def checkout(db, uid):
    from firebase_admin import firestore
    payload = request.get_json(silent=True)
    item = payload.get('item') if isinstance(payload, dict) else None
    if not isinstance(item, str) or item not in ITEMS:
        raise ApiError('Unknown equipment.')
    if item in inventory(db, uid):
        raise ApiError('You already own this equipment.', 409)
    stripe = payment_service()
    p = product(stripe, item)
    payment_mode = 'live' if os.getenv('STRIPE_SECRET_KEY', '').startswith('sk_live_') else 'test'
    pending = player_ref(db, uid).collection('pending').document(item+'-'+payment_mode)
    now = int(time.time())

    @firestore.transactional
    def reserve(transaction):
        prior = pending.get(transaction=transaction).to_dict() or {}
        if prior.get('session') and prior.get('until', 0) > now:
            return prior
        if prior.get('until', 0) > now:
            raise ApiError('Checkout is being prepared. Try again in a moment.', 409)
        reservation = {'attempt':uuid.uuid4().hex,'until':now+60}
        transaction.set(pending, reservation)
        return reservation
    reservation = reserve(db.transaction())
    if reservation.get('session'):
        session = stripe.checkout.Session.retrieve(reservation['session'])
        if session['status'] == 'open':
            return jsonify(url=session['url'])
        fulfill(db, stripe, session['id'], uid)
        pending.delete()
        raise ApiError('Checkout has finished. Refresh your inventory before trying again.', 409)
    attempt = reservation['attempt']
    db.collection('vr_checkouts').document(attempt).set({**p,'item':item,'uid':uid,'live':os.getenv('STRIPE_SECRET_KEY','').startswith('sk_live_')})
    site = os.getenv('VOID_SITE_URL', 'https://thedarknetdistrict.com').rstrip('/')
    if not site.startswith('https://') and not site.startswith('http://localhost:') and not site.startswith('http://127.0.0.1:'):
        raise ApiError('Store return address is not configured.', 503)
    session = stripe.checkout.Session.create(mode='payment', payment_method_types=['card'],
        line_items=[{'price':p['price'],'quantity':1}], client_reference_id=uid, metadata={'attempt':attempt},
        success_url=site+'/void-runner.html?checkout={CHECKOUT_SESSION_ID}#market',
        cancel_url=site+'/void-runner.html?checkout=cancelled#market',
        expires_at=now+1800, idempotency_key='void-'+attempt)
    pending.set({'session':session['id'],'attempt':attempt,'until':now+1800})
    return jsonify(url=session['url'])


@api.post('/checkout/confirm')
@signed_in
def confirm(db, uid):
    payload = request.get_json(silent=True)
    sid = payload.get('session') if isinstance(payload, dict) else None
    if not isinstance(sid, str) or not sid.startswith('cs_') or len(sid) > 255:
        raise ApiError('Invalid checkout reference.')
    return jsonify(status=fulfill(db, payment_service(), sid, uid), owned=inventory(db, uid))


def revoke_payment(db, payment_intent):
    """A persistent block prevents late/retried completion events from regranting refunds."""
    from google.cloud.firestore_v1.base_query import FieldFilter
    if not payment_intent:
        return
    db.collection('vr_payment_blocks').document(payment_intent).set({'blocked':True})
    for snapshot in db.collection('vr_orders').where(filter=FieldFilter('paymentIntent','==',payment_intent)).stream():
        snapshot.reference.update({'status':'revoked'})


@api.post('/webhook')
def webhook():
    stripe = payment_service()
    secret = os.getenv('STRIPE_WEBHOOK_SECRET', '')
    if not secret:
        raise ApiError('Webhook is not configured.', 503)
    try:
        event = stripe.Webhook.construct_event(request.get_data(), request.headers.get('Stripe-Signature',''), secret)
    except (ValueError, stripe.SignatureVerificationError):
        raise ApiError('Invalid payment signature.', 400)
    db, _, _ = services()
    obj = event['data']['object']
    if event['type'] in ['checkout.session.completed','checkout.session.async_payment_succeeded']:
        # Ignore unrelated products on a shared Stripe account.
        if (obj.get('metadata') or {}).get('attempt'):
            fulfill(db, stripe, obj['id'])
    elif event['type'] in ['charge.refunded','charge.dispute.created']:
        revoke_payment(db, obj.get('payment_intent'))
    return jsonify(received=True)
