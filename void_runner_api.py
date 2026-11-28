"""Account-bound saves and Stripe fulfillment. No secrets or ownership in the browser."""
import re
import hashlib
import os
import time
import uuid
import json
import math
from pathlib import Path
from functools import wraps
from flask import Blueprint, jsonify, request, current_app, g

api = Blueprint('void_runner', __name__, url_prefix='/api/void-runner')
ITEMS = {'wraith': 'Wraith Cannon', 'aegis': 'Aegis Shield', 'ghost': 'Ghost Drive', 'sentinel': 'Sentinel Drone', 'spectre': 'Spectre / 03'}
PROJECT = 'the-darknet-district-71873'

# One numeric schema shared with the browser; parse JSON without executing JS.
BALANCE_SPEC = json.loads((Path(__file__).parent / 'void-runner' / 'balance-data.js').read_text(encoding='utf-8').split('globalThis.VoidBalanceSpec = ', 1)[1].strip().removesuffix(';'))
BALANCE_DEFAULTS = {key: field['value'] for key, field in BALANCE_SPEC.items()}


EQUIPMENT_FIELDS = json.loads((Path(__file__).parent / 'void-runner' / 'equipment-profiles.js')
                             .read_text(encoding='utf-8').split('globalThis.VoidEquipmentFields = ', 1)[1].split(';', 1)[0])


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


def clean_equipment_profiles(profiles):
    from void_runner_items import valid_curve
    if not isinstance(profiles, dict):
        raise ApiError('Expected equipment profiles.')
    fields = EQUIPMENT_FIELDS
    choices = {'impactStyle': ('missile', 'large', 'impact'), 'launchSound': ('missile', 'laser'),
               'impactSound': ('explosion', 'hit', 'shieldHit')}
    limits = {'absorption': 1, 'capacity': 200, 'recharge': 60, 'cost': 4, 'heat': 4, 'shieldScale': 4, 'hullScale': 4,
              'minimumDamage': 10000, 'maximumDamage': 10000, 'damageMultiplier': 4}
    for item, options in profiles.items():
        if item not in fields or not isinstance(options, dict) or not set(options) <= set(fields[item]):
            raise ApiError('Unknown equipment profile setting.')
        for key, value in options.items():
            if key.endswith('Curve'):
                valid = valid_curve(value)
            elif key in limits:
                valid = type(value) in (int, float) and 0 <= value <= limits[key]
            else:
                valid = value in choices[key]
            if not valid:
                raise ApiError('Invalid equipment setting: ' + key)
        if options.get('minimumDamage', 0) > options.get('maximumDamage', math.inf):
            raise ApiError('Minimum damage exceeds maximum damage.')
    return profiles


def balance_record(db):
    saved = db.collection('vr_config').document('combat').get().to_dict() or {}
    return {'profiles': saved.get('profiles', {}), 'values': {**BALANCE_DEFAULTS, **saved.get('values', {})}, 'revision': saved.get('revision', 0), 'preset': saved.get('preset', 'NORMAL')}


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
    # An imported voice file (600 KB as base64) is the one larger body: only its upload route takes up to 900 KB.
    limit = 900_000 if request.endpoint == 'void_runner.voice_clip_upload' else 256_000
    request.max_content_length = limit
    if request.content_length and request.content_length > limit:
        raise ApiError('Request is too large.', 413)


@api.after_request
def no_cache(response):
    if request.endpoint == 'void_runner.voice_clip_public' and response.status_code == 200:
        return response  # an imported voice file: its address is its content, cached for a year
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
        g.auth_claims = claims
        return handler(db, claims['uid'], *args, **kwargs)
    return wrapped


def player_ref(db, uid):
    return db.collection('vr_players').document(hashlib.sha256(uid.encode()).hexdigest())


CHARACTER_MODELS = {'male': 'district-smuggler', 'female': 'district-resident'}


def clean_character(value, administrator=False):
    """One existing animated District crowd look; outfits and hair are baked into each GLB."""
    if not isinstance(value, dict) or set(value) != {'gender', 'model'}:
        raise ApiError('Choose a character model.')
    if type(value['gender']) is not str or type(value['model']) is not str or value['gender'] not in CHARACTER_MODELS:
        raise ApiError('That character model is not available.')
    if value['model'] != CHARACTER_MODELS[value['gender']] and not (administrator and value['gender'] == 'male' and value['model'] == 'admin'):
        raise ApiError('That character model is not available.')
    return {'gender': value['gender'], 'model': value['model']}


APPEARANCE_CATALOG = json.loads((Path(__file__).parent / 'void-runner' / 'character-catalog.json').read_text(encoding='utf-8'))
APPEARANCE_KEYS = {'v', 'base', 'look', 'hair', 'hairColor', 'clothingColor', 'accessories'}


def clean_appearance(value):
    """The character creator's look: ids from void-runner/character-catalog.json only (never paths), valid together. Mirrors void-runner/character-appearance.js."""
    import re
    cat = APPEARANCE_CATALOG

    def bad():
        raise ApiError('That appearance is not available.')

    def ident(v):
        return type(v) is str and re.fullmatch(r'[a-z0-9][a-z0-9-]{0,39}', v) is not None
    if not isinstance(value, dict) or set(value) != APPEARANCE_KEYS or type(value['v']) is not int or value['v'] != 1:
        bad()
    if not ident(value['base']) or value['base'] not in cat['bases'] or not ident(value['look']) or value['look'] not in cat['looks']:
        bad()
    look = cat['looks'][value['look']]
    if look['base'] != value['base']:
        bad()
    if look.get('street') and (value['hair'] != 'native' or value['hairColor'] is not None):
        bad()   # a street figure (NPC upgrade, 18 Nov 2026) is one mesh: its own hair, no hair colour
    hair = value['hair']
    if hair not in ('native', 'none') and not (ident(hair) and hair in cat['hair'] and hair in look['hairOk']):
        bad()
    for key, table in (('hairColor', cat['hairColors']), ('clothingColor', cat['clothingColors'])):
        if value[key] is not None and not (ident(value[key]) and any(c['id'] == value[key] for c in table)):
            bad()
    acc = value['accessories']
    if not isinstance(acc, list) or len(acc) > 8 or len(set(map(str, acc))) != len(acc):
        bad()
    for a in acc:
        if not ident(a) or a not in look['accessories']:
            bad()
    if 'hat' in acc and hair not in ('native', 'none') and not cat['hair'][hair]['hatOk']:
        bad()
    return {'v': 1, 'base': value['base'], 'look': value['look'], 'hair': hair, 'hairColor': value['hairColor'],
            'clothingColor': value['clothingColor'], 'accessories': list(acc)}


def migrate_appearance(value):
    """A player's saved look from before the street figures (18 Nov 2026): stored looks are never rewritten and a retired look stays valid; the game moves it on load (and the hub when showing it). For server-side tools, the same rule: it moves to its `replacedBy` (same body), keeping the clothing colour; the old
    figure's hairstyle, hair colour and extras do not exist on the new one. Mirrors migrate() in void-runner/character-appearance.js."""
    look = APPEARANCE_CATALOG['looks'].get(value.get('look')) or {}
    to = look.get('replacedBy') if look.get('retired') else None
    new = APPEARANCE_CATALOG['looks'].get(to) if to else None
    if not new or new['base'] != value.get('base'):
        return value
    return {'v': 1, 'base': value['base'], 'look': to, 'hair': 'native', 'hairColor': None, 'clothingColor': value.get('clothingColor'),
            'accessories': list(new.get('defaultAccessories', []))}


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
    # A cloud save from before the District reset is retired: it is not returned (and not deleted here; see docs/void-runner/SAVE-RESET.md).
    retired = saved.get('save') is not None and not is_current_save(saved.get('save'))
    return jsonify(owned=inventory(db, uid), developer=balance_admin(uid), character=saved.get('character'), appearance=saved.get('appearance'), save=None if retired else saved.get('save'), retired=retired, revision=saved.get('revision', 0), savedAt=None if retired else saved.get('savedAt'))


def require_handle_if_guest(db, uid, message):
    """Handle-only accounts (Firebase anonymous sign-in) may keep a character once they hold a District handle (the owner, 15 Nov 2026).
    The handle is the server's own record (the identity registry, bp_profiles), never a name sent by the browser. A guest with no handle is still refused."""
    if getattr(g, 'auth_claims', {}).get('firebase', {}).get('sign_in_provider') != 'anonymous':
        return
    profile = db.collection('bp_profiles').document(hashlib.sha256(uid.encode('utf-8')).hexdigest()).get().to_dict() or {}
    if not isinstance(profile.get('handle'), str) or not profile.get('handle'):
        raise ApiError(message, 403)


def claim_character(db, ref, appearance):
    """Claim the character field without competing read/write transaction locks."""
    from google.api_core.exceptions import Conflict, FailedPrecondition, NotFound
    record = {**appearance, 'createdAt': int(time.time())}
    for _ in range(5):
        snapshot = ref.get()
        if (snapshot.to_dict() or {}).get('character'):
            raise ApiError('This account already has a character.', 409)
        try:
            if snapshot.exists:
                ref.update({'character': record}, option=db.write_option(last_update_time=snapshot.update_time))
            else:
                ref.create({'character': record})
        except (Conflict, FailedPrecondition, NotFound):
            # A competing creator or save changed the document. Re-read; never overwrite a winner.
            continue
        return record
    if (ref.get().to_dict() or {}).get('character'):
        raise ApiError('This account already has a character.', 409)
    raise ApiError('Character creation is busy. Try again in a moment.', 503)


@api.route('/character', methods=['GET', 'POST'])
@signed_in
def character(db, uid):
    """A single, account-bound character. Creation never changes a campaign save."""
    if request.method == 'GET':
        saved = player_ref(db, uid).get().to_dict() or {}
        extra = {'appearance': saved['appearance']} if saved.get('appearance') else {}
        return jsonify(character=saved.get('character'), **extra)
    require_handle_if_guest(db, uid, 'Register a District handle before creating a permanent character.')
    appearance = clean_character(request.get_json(silent=True), balance_admin(uid))
    record = claim_character(db, player_ref(db, uid), appearance)
    return jsonify(character=record), 201


@api.route('/character/appearance', methods=['POST'])
@signed_in
def character_appearance(db, uid):
    """The character creator / wardrobe look. Cosmetic only: never touches the save, inventory, credits or the account's one character record.
    OFF unless VOID_APPEARANCE_ENABLED=true (the owner turns it on when approving a test; production stays off until then)."""
    if os.getenv('VOID_APPEARANCE_ENABLED') != 'true':
        raise ApiError('Appearance changes are not available yet.', 404)
    require_handle_if_guest(db, uid, 'Register a District handle before saving a permanent look.')
    appearance = clean_appearance(request.get_json(silent=True))
    ref = player_ref(db, uid)
    if not (ref.get().to_dict() or {}).get('character'):
        raise ApiError('Create your character first.', 409)
    ref.set({'appearance': appearance}, merge=True)
    return jsonify(appearance=appearance)


@api.get('/balance')
def public_balance():
    if os.getenv('VOID_ACCOUNTS_ENABLED') != 'true':
        return jsonify(values=BALANCE_DEFAULTS)
    db, _, _ = services()
    record = balance_record(db)
    return jsonify(values=record['values'], profiles=record['profiles'])


@api.get('/developer/content')
@signed_in
def developer_content(db, uid):
    """Read-only projection. No save, draft, publish or executable action surface."""
    if not balance_admin(uid):
        raise ApiError('Administrator access is not authorized.', 403)
    inventory_path = Path(__file__).parent / 'void_runner_admin_inventory.json'
    result = json.loads(inventory_path.read_text(encoding='utf-8'))
    if result.get('schemaVersion') != 1 or result.get('readOnly') is not True:
        raise ApiError('The content inventory is not available.', 503)
    return jsonify(result)



@api.post('/developer/companion-voice')
@signed_in
def developer_companion_voice(db, uid):
    """Generate one developer-confirmed recording; never expose the provider key."""
    if not balance_admin(uid):
        raise ApiError('Developer access is not authorized.', 403)
    import re
    import base64
    import urllib.request
    import urllib.error
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ApiError('Expected a voice generation request.')
    voice, text = body.get('voiceId'), body.get('text')
    if not isinstance(voice, str) or not re.fullmatch(r'[A-Za-z0-9]{10,40}', voice):
        raise ApiError('Enter a valid ElevenLabs voice ID.')
    if not isinstance(text, str) or not text.strip() or len(text) > 700:
        raise ApiError('Enter a spoken line of at most 700 characters.')
    key = os.getenv('ELEVENLABS_API_KEY', '')
    if not key:
        raise ApiError('ElevenLabs is not configured on the server.', 503)
    payload = json.dumps({'text': text, 'model_id': 'eleven_v4'}).encode()
    url = 'https://api.elevenlabs.io/v1/text-to-speech/' + voice + '?output_format=mp3_44100_128'
    req = urllib.request.Request(url, data=payload, headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            audio = response.read(600001)
            if not audio or len(audio) > 600000 or response.headers.get_content_type() != 'audio/mpeg':
                raise ApiError('Generated audio exceeds the recording limit or is invalid.', 502)
    except urllib.error.HTTPError as error:
        raise ApiError('ElevenLabs rejected the request (HTTP %s). Check voice access, credits and rate limits.' % error.code, 429 if error.code == 429 else 502)
    except (urllib.error.URLError, TimeoutError):
        raise ApiError('ElevenLabs is temporarily unavailable.', 502)
    return jsonify(audio=base64.b64encode(audio).decode('ascii'))


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
    profiles = clean_equipment_profiles(payload['profiles']) if 'profiles' in payload else None
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
        saved_profiles = prior.get('profiles', {}) if profiles is None else profiles
        transaction.set(ref, {'profiles': saved_profiles, 'values': values, 'preset': preset, 'revision': revision + 1,
                              'updatedAt': int(time.time()), 'updatedBy': uid})
        return revision + 1, saved_profiles
    revision, saved_profiles = commit(db.transaction())
    return jsonify(values=values, profiles=saved_profiles, preset=preset, revision=revision)


CAMPAIGN_EPOCH = 1  # keep in step with campaignEpoch in void-runner/campaign.js


def is_current_save(value):
    """A campaign made since the District reset (it carries story.flags.campaignEpoch)."""
    epoch = ((value.get('story') or {}).get('flags') or {}).get('campaignEpoch') if isinstance(value, dict) else None
    return type(epoch) is int and epoch >= CAMPAIGN_EPOCH


def clean_save(value):
    """Cloud saves cannot grant ownership, change prices or write another player's record."""
    if not isinstance(value, dict) or value.get('version') != 2:
        raise ApiError('Unsupported save format.')
    from pathlib import Path
    import json
    # The Darknet District reset (the owner, 2026-11-04): saves from before it carry no campaign epoch and are retired, not converted.
    if not is_current_save(value):
        raise ApiError('This save is from before The Darknet District reset and can no longer be stored. Start a new campaign.', 409)
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
    for key, allowed, default in [('discoveredSystems', manifest.get('systems',['erebus','sol']), ['erebus']), ('discoveredLocations', locations, ['vesper','meridian']), ('visitedLocations', locations, ['vesper'])]:
        entries = universe.get(key, default)
        if not isinstance(entries,list) or len(entries)>256 or any(x not in allowed for x in entries):
            raise ApiError('Invalid universe locations.')
        cleaned_universe[key] = list(dict.fromkeys(entries))
    cleaned_universe['currentSystem'] = {'sol-belt':'sol','earth':'sol','mars':'sol','vigil':'communion','holdfast':'natural-order','nexus':'communion','order-homeworld':'natural-order','low-quay':'stale'}.get(result['location'],'erebus')
    for key in ['missionLogUnlocked','freeTravel']:
        cleaned_universe[key] = universe.get(key) is True or result['missileOfferSeen']
    tracked = universe.get('trackedMission')
    if tracked is not None and (not isinstance(tracked,str) or len(tracked)>80):
        raise ApiError('Invalid tracked mission.')
    cleaned_universe['trackedMission'] = tracked
    cleaned_universe['trackingInitialized'] = universe.get('trackingInitialized') is True or tracked is not None
    cleaned_universe['autoTrack'] = universe.get('autoTrack') is not False
    records=universe.get('missions',{})
    import re
    def mission_id(item):
        return isinstance(item,str) and re.fullmatch(r'[a-z][a-z0-9-]{0,79}',item)
    if not isinstance(records,dict) or len(records)>100:
        raise ApiError('Invalid mission records.')
    cleaned_universe['missions']={}
    for mission_id_value,entry in records.items():
        if not mission_id(mission_id_value) or not isinstance(entry,dict):
            raise ApiError('Invalid mission record.')
        objectives=entry.get('objectives',{})
        if not isinstance(objectives,dict) or len(objectives)>100 or any(not mission_id(key) or type(val) is not bool for key,val in objectives.items()):
            raise ApiError('Invalid mission objectives.')
        if entry.get('acquired') is True:
            cleaned_universe['missions'][mission_id_value]={'acquired':True,'completed':entry.get('completed') is True,'objectives':{key:val for key,val in objectives.items() if val}}
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
        cleaned_universe['freeTravel'] = result['progression']['completed'] or result['progression']['flags'].get('missileFired') is True or universe.get('freeTravel') is True
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
        if encounter.get('evaded') is True and encounter['type'] == 'combat' and encounter['state'] == 'cleared':
            encounter = {'type': 'combat', 'state': 'cleared', 'evaded': True}
        else:
            encounter = {'type': encounter['type'], 'state': encounter['state']}
        result['travel'] = {'origin':travel['origin'],'destination':travel['destination'],'progress':progress,'mission':mission,'encounter':encounter}
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

    # Missions removed from the game (the owner, 17 Nov 2026): in a District campaign (story.flags.missionPool == 'closed') only the main storyline
    # (m<NNN>-..., main-storyline-m<n>) and the owner's trees (draft-...) run. A tracked removed mission is untracked; its record, credits and items are kept
    # and the save is never rejected for it (campaign.js retireMissions does the same).
    if cleaned.get('flags', {}).get('missionPool') == 'closed':
        tracked_id = result['universe'].get('trackedMission')
        # Rook's side missions (rook-run-N) stay tracked once the first delivery to Rook is done (campaign.js rookOpen / retireMissions).
        rook_open = cleaned['flags'].get('rook-first-delivery-done') is True
        if tracked_id is not None and not re.match(r'^(draft-|main-storyline-m\d|m\d{3}-)', tracked_id) and not (rook_open and re.fullmatch(r'rook-run-\d+', tracked_id)):
            result['universe']['trackedMission'] = None
            result['universe']['autoTrack'] = True
    if 'story' in value:
        result['story'] = cleaned
    if 'warflying' in value:
        result['warflying'] = clean_warflying(value['warflying'])
    if 'relay' in value:
        result['relay'] = clean_relay(value['relay'])
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
        items_service.checkpoint_card_clock(db, transaction, uid, prior, campaign)
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


def clean_warflying(raw):
    """WarFlying discovery records (void-runner/warflying.js). Shape-checked and capped here; the
    game re-checks every source id against its signal registry when the save loads."""
    import re
    if not isinstance(raw, dict):
        raise ApiError('Invalid WarFlying state.')
    records = raw.get('records', {})
    if not isinstance(records, dict) or len(records) > 2000:
        raise ApiError('Invalid WarFlying records.')
    cleaned = {}
    for source_id, r in records.items():
        if not isinstance(source_id, str) or not re.fullmatch(r'[a-z]+:[a-z0-9-]{1,48}', source_id) or not isinstance(r, dict):
            raise ApiError('Invalid WarFlying record.')
        conf = r.get('conf') if r.get('conf') in ('partial', 'confirmed') else 'partial'
        stamp = lambda v: v if type(v) is int and 0 <= v <= 9007199254740991 else 0
        places = [x for x in r.get('places', []) if isinstance(x, str) and re.fullmatch(r'[a-z0-9][a-z0-9:>-]{0,47}', x)][-6:] if isinstance(r.get('places'), list) else []
        entry = {'c': r.get('c') if isinstance(r.get('c'), str) and len(r.get('c')) <= 24 else 'transmitter', 'f': stamp(r.get('f')), 'l': stamp(r.get('l')),
                 'k': r.get('k') if type(r.get('k')) is int and 0 < r.get('k') <= 1000000 else 1, 'conf': conf, 'places': places,
                 'p': 1 if conf == 'confirmed' and r.get('p') == 1 else 0, 'u': r.get('u') if r.get('u') in ('local', 'pending', 'uploaded') else 'local'}
        if type(r.get('s')) in (int, float) and 0 <= r['s'] <= 1:
            entry['s'] = r['s']
        cleaned[source_id] = entry
    clock = raw.get('clock')
    count = lambda v: v if type(v) is int and 0 <= v <= 1000000 else 0
    trail = raw.get('trail') if isinstance(raw.get('trail'), dict) else {}
    recent = trail.get('recent') if isinstance(trail.get('recent'), list) else []
    trail = {'linked': count(trail.get('linked')), 'unlinked': count(trail.get('unlinked')),
             'recent': [{'t': e['t'] if type(e.get('t')) is int and 0 <= e['t'] <= 9007199254740991 else 0,
                         'place': e['place'] if isinstance(e.get('place'), str) and re.fullmatch(r'[a-z0-9][a-z0-9:>-]{0,47}', e['place']) else 'unknown',
                         'linked': 0 if e.get('linked') == 0 else 1} for e in recent if isinstance(e, dict)][-8:]}
    return {'version': 1, 'records': cleaned, 'autoUpload': raw.get('autoUpload') is not False, 'clock': clock if type(clock) is int and 0 <= clock <= 1000000000 else 0, 'trail': trail}
def clean_relay(raw):
    """The Relay's news state (void-runner/relay.js): events made public, reports heard, the
    archive, queued breaking news and the last leaderboard. Shape-checked and capped; the game
    re-checks ids against its content when the save loads."""
    import re
    if not isinstance(raw, dict):
        raise ApiError('Invalid Relay state.')
    ident = lambda x: isinstance(x, str) and re.fullmatch(r'[a-z][a-z0-9-]{0,63}', x)
    sec = lambda v: v if type(v) is int and 0 <= v <= 1000000000 else None
    out = {'version': 1, 'occurred': {}, 'heard': {}, 'archive': [], 'pending': [], 'board': None, 'said': {}}
    for key in ('occurred', 'heard'):
        entries = raw.get(key, {})
        if not isinstance(entries, dict) or len(entries) > 400:
            raise ApiError('Invalid Relay state.')
        out[key] = {k: sec(v) for k, v in entries.items() if ident(k) and sec(v) is not None}
    archive = raw.get('archive', [])
    if not isinstance(archive, list) or len(archive) > 200:
        raise ApiError('Invalid Relay archive.')
    for a in archive[-80:]:
        if isinstance(a, dict) and ident(a.get('id')) and sec(a.get('clock')) is not None:
            entry = {'id': a['id'], 'clock': a['clock'], 'time': a['time'] if type(a.get('time')) is int and 0 < a['time'] <= 9007199254740991 else 0}
            if isinstance(a.get('vars'), dict):
                entry['vars'] = {k: v for k, v in list(a['vars'].items())[:12] if isinstance(k, str) and re.fullmatch(r'[a-zA-Z]{1,16}', k) and (isinstance(v, str) and len(v) <= 40 or type(v) is int and abs(v) <= 9007199254740991)}
            out['archive'].append(entry)
    pending = raw.get('pending', [])
    out['pending'] = list(dict.fromkeys(x for x in pending if ident(x)))[:8] if isinstance(pending, list) else []
    board = raw.get('board')
    if isinstance(board, list):
        out['board'] = [{'name': r['name'], 'points': r['points'], 'rank': r['rank'], 'player': r.get('player') is True} for r in board[:12]
                        if isinstance(r, dict) and isinstance(r.get('name'), str) and len(r['name']) <= 24 and type(r.get('points')) is int and type(r.get('rank')) is int]
    said = raw.get('said', {})
    out['said'] = {k: True for k, v in list(said.items())[:32] if ident(k) and v is True} if isinstance(said, dict) else {}
    return out



# Private unpublished content. No route consumes this collection in gameplay.
from void_runner_drafts import DraftError
import void_runner_drafts as content_drafts


@api.errorhandler(DraftError)
def content_draft_error(error):
    return jsonify(error=error.message, **error.details), error.status


@api.get('/developer/drafts/schema')
@signed_in
def content_draft_schema(db, uid):
    content_drafts.editor(uid, balance_admin, enabled=False)
    inv = content_drafts.inventory()
    return jsonify(registry=content_drafts.schema(inv), roles=content_drafts.roles(uid, balance_admin), baseRevision=inv['revision'])


@api.get('/developer/drafts/template')
@signed_in
def content_draft_template(db, uid):
    content_drafts.editor(uid, balance_admin, enabled=False)
    return jsonify(document=content_drafts.template(request.args.get('kind'), request.args.get('source'), content_drafts.inventory()))


@api.get('/developer/drafts')
@signed_in
def content_draft_list(db, uid):
    content_drafts.editor(uid, balance_admin)
    return jsonify(content_drafts.listing(db, uid))


@api.route('/developer/drafts/<draft_id>', methods=['GET', 'POST'])
@signed_in
def content_draft_record(db, uid, draft_id):
    content_drafts.editor(uid, balance_admin)
    if request.method == 'GET':
        revision = request.args.get('revision')
        if revision is not None:
            if not revision.isdigit():
                raise DraftError('Invalid draft revision.')
            revision = int(revision)
        return jsonify(content_drafts.load(db, uid, draft_id, revision))
    return jsonify(content_drafts.save(db, uid, draft_id, request.get_json(silent=True), content_drafts.inventory()))


@api.post('/developer/drafts/validate')
@signed_in
def content_draft_validate(db, uid):
    content_drafts.editor(uid, balance_admin, enabled=False)
    document = request.get_json(silent=True)
    # Pure single-draft validation needs no storage and never executes actions.
    heads = {}
    if os.getenv('VOID_CONTENT_DRAFTS_ENABLED') == 'true':
        heads = {d['id']: d for d in content_drafts.listing(db, uid)['drafts']}
    return jsonify(content_drafts.validate(document, content_drafts.inventory(), heads))


# Stage 3B.1 recovery operations. Each needs the configured editor and enabled private storage; every change is
# a transaction that checks the draft's current revision and is confirmed explicitly by the administrator.
def draft_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise DraftError('A JSON object is required.')
    return body


def revision_arg(name, required=True):
    value = request.args.get(name)
    if value is None and not required:
        return None
    if value is None or not value.isdigit():
        raise DraftError('Invalid draft revision.')
    return int(value)


@api.get('/developer/drafts/export')
@signed_in
def content_draft_export(db, uid):
    content_drafts.editor(uid, balance_admin)
    history = request.args.get('history', 'all')
    if history not in ['all', 'heads']:
        raise DraftError('Unsupported export option.')
    return jsonify(content_drafts.export(db, uid, content_drafts.inventory(), history == 'all'))


@api.get('/developer/drafts/<draft_id>/compare')
@signed_in
def content_draft_compare(db, uid, draft_id):
    content_drafts.editor(uid, balance_admin)
    return jsonify(content_drafts.compare(db, uid, draft_id, revision_arg('from'), revision_arg('to', required=False)))


@api.post('/developer/drafts/<draft_id>/rebase/plan')
@signed_in
def content_draft_rebase_plan(db, uid, draft_id):
    content_drafts.editor(uid, balance_admin)
    return jsonify(content_drafts.plan_rebase(db, uid, draft_id, draft_body(), content_drafts.inventory()))


@api.post('/developer/drafts/<draft_id>/rebase')
@signed_in
def content_draft_rebase(db, uid, draft_id):
    content_drafts.editor(uid, balance_admin)
    return jsonify(content_drafts.rebase(db, uid, draft_id, draft_body(), content_drafts.inventory()))


@api.post('/developer/drafts/<draft_id>/restore')
@signed_in
def content_draft_restore(db, uid, draft_id):
    content_drafts.editor(uid, balance_admin)
    return jsonify(content_drafts.restore(db, uid, draft_id, draft_body(), content_drafts.inventory()))


@api.post('/developer/drafts/<draft_id>/archive')
@signed_in
def content_draft_archive(db, uid, draft_id):
    content_drafts.editor(uid, balance_admin)
    return jsonify(content_drafts.set_archived(db, uid, draft_id, draft_body(), True))


@api.post('/developer/drafts/<draft_id>/unarchive')
@signed_in
def content_draft_unarchive(db, uid, draft_id):
    content_drafts.editor(uid, balance_admin)
    return jsonify(content_drafts.set_archived(db, uid, draft_id, draft_body(), False))


@api.post('/developer/drafts/<draft_id>/continue')
@signed_in
def content_draft_continue(db, uid, draft_id):
    content_drafts.editor(uid, balance_admin)
    return jsonify(content_drafts.continue_as_new(db, uid, draft_id, draft_body(), content_drafts.inventory()))
import void_runner_publication as content_releases


@api.get('/developer/releases/schema')
@signed_in
def content_release_schema(db, uid):
    content_drafts.editor(uid, balance_admin, enabled=False)
    return jsonify(roles=content_releases.roles(uid, balance_admin),
                   limits={'revisions': content_releases.MAX_RELEASES, 'packageBytes': content_releases.MAX_PACKAGE_BYTES},
                   status='private-candidate-only')


@api.get('/developer/releases')
@signed_in
def content_release_history(db, uid):
    content_releases.authorize(uid, balance_admin)
    return jsonify(content_releases.history(db, uid))


@api.get('/developer/releases/<int:revision>')
@signed_in
def content_release_revision(db, uid, revision):
    content_releases.authorize(uid, balance_admin)
    return jsonify(content_releases.load(db, uid, revision))


@api.post('/developer/releases/plan')
@signed_in
def content_release_plan(db, uid):
    content_releases.authorize(uid, balance_admin)
    return jsonify(content_releases.prepare(db, uid, request.get_json(silent=True), content_drafts.inventory(), plan=True))


@api.post('/developer/releases/prepare')
@signed_in
def content_release_prepare(db, uid):
    content_releases.authorize(uid, balance_admin, write=True)
    return jsonify(content_releases.prepare(db, uid, request.get_json(silent=True), content_drafts.inventory()))


@api.post('/developer/releases/rollback')
@signed_in
def content_release_rollback(db, uid):
    content_releases.authorize(uid, balance_admin, write=True)
    return jsonify(content_releases.prepare(db, uid, request.get_json(silent=True), content_drafts.inventory(), rollback=True))

@api.get('/developer/releases/compare')
@signed_in
def content_release_compare(db, uid):
    content_releases.authorize(uid, balance_admin)
    numbers = []
    for key in ['from', 'to']:
        value = request.args.get(key, '')
        if not value.isdigit() or len(value) > 3:
            raise DraftError('Choose bounded release revision numbers.')
        numbers.append(int(value))
    before, after = [content_releases.load(db, uid, n) for n in numbers]
    return jsonify(fromRevision=numbers[0], toRevision=numbers[1],
                   diff=content_releases.comparison(before['documents'], after['documents']),
                   writes=0, liveActivationImplemented=False)


# Mission Editor: published mission content (off unless VOID_CONTENT_PUBLISH_ENABLED=true) and the owner's re-voice queue.
import void_runner_live_content as live_content


@api.get('/live-content')
def live_content_public():
    """Public, read-only: the one live version of published mission content (or none). Off = 404, and the game keeps the shipped missions."""
    if not live_content.enabled():
        return jsonify(error='Published mission content is switched off.'), 404
    db, _, _ = services()
    return jsonify(live_content.public(db))


@api.get('/developer/live-content')
@signed_in
def live_content_state(db, uid):
    live_content.owner(uid, balance_admin, need='publish')
    return jsonify(live_content.summary(db))


@api.get('/developer/live-content/<int:version>')
@signed_in
def live_content_version(db, uid, version):
    live_content.owner(uid, balance_admin, need='publish')
    return jsonify(live_content.load(db, version))


@api.post('/developer/live-content/check')
@signed_in
def live_content_check(db, uid):
    live_content.owner(uid, balance_admin)
    body = request.get_json(silent=True)
    problems = live_content.check((body or {}).get('content') if isinstance(body, dict) else None)
    return jsonify(ok=not problems, errors=problems, warnings=[])


@api.post('/developer/live-content/publish')
@signed_in
def live_content_publish(db, uid):
    live_content.owner(uid, balance_admin, need='publish')
    return jsonify(live_content.publish(db, uid, request.get_json(silent=True)))


@api.post('/developer/live-content/rollback')
@signed_in
def live_content_rollback(db, uid):
    live_content.owner(uid, balance_admin, need='publish')
    return jsonify(live_content.rollback(db, uid, request.get_json(silent=True)))


@api.route('/developer/revoice', methods=['GET', 'POST'])
@signed_in
def revoice_queue(db, uid):
    live_content.owner(uid, balance_admin, need='queue')
    if request.method == 'GET':
        return jsonify(live_content.queue_list(db, uid))
    return jsonify(live_content.queue_add(db, uid, request.get_json(silent=True)))


@api.post('/developer/revoice/done')
@signed_in
def revoice_done(db, uid):
    live_content.owner(uid, balance_admin, need='queue')
    return jsonify(live_content.queue_done(db, uid, request.get_json(silent=True)))


# Imported voice files (Developer Tools, 19 Nov 2026; void_runner_live_content.py). Uploading is for the content editor, with publishing switched on; reading a file is
# public (players need no sign-in) and cached for a year: the address is the file's SHA-256, so it never changes.
@api.post('/developer/voice-clips')
@signed_in
def voice_clip_check(db, uid):
    live_content.owner(uid, balance_admin, need='publish')
    return jsonify(live_content.clips_check(db, request.get_json(silent=True)))


@api.post('/developer/voice-clips/<clip_hash>')
@signed_in
def voice_clip_upload(db, uid, clip_hash):
    live_content.owner(uid, balance_admin, need='publish')
    return jsonify(live_content.store_clip(db, uid, clip_hash, request.get_json(silent=True)))


@api.get('/voice-clip/<clip_hash>')
def voice_clip_public(clip_hash):
    if not live_content.enabled():
        return jsonify(error='Published mission content is switched off.'), 404
    db, _, _ = services()
    found = live_content.get_clip(db, clip_hash)
    if not found:
        return jsonify(error='No such voice file.'), 404
    data, kind = found
    response = current_app.response_class(data, mimetype=kind)
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    response.headers['ETag'] = '"' + clip_hash + '"'
    return response

# Consumables Studio and Items & Vendors (Developer Tools > Studios; void_runner_items.py). Admin-only edit and publish (VOID_ADMIN_UIDS, like every developer route);
# players read the live catalog and buy and use items here. Price, stock, carrying limits, cooldowns and every effect amount are the server's own.
import void_runner_freight as freight


@api.get('/rook/freight')
@signed_in
def rook_freight_state(db, uid):
    ref = player_ref(db, uid)
    ledger = ref.collection('freight').document('desk').get().to_dict() or {}
    return jsonify(active=ledger.get('active'), lastPaid=ledger.get('lastPaid'))


@api.post('/rook/freight/<action>')
@signed_in
def rook_freight(db, uid, action):
    if action not in ('offer', 'accept', 'deliver', 'collect'):
        raise ApiError('Unknown freight operation.', 404)
    live = live_content.public(db) if live_content.enabled() else {}
    config = (live.get('content') or {}).get('rookFreight', freight.DEFAULT)
    try:
        return jsonify(freight.transact(db, player_ref(db, uid), action, request.get_json(silent=True), config))
    except freight.FreightError as exc:
        raise ApiError(str(exc), 409) from exc


import void_runner_items as items_service


def items_admin(uid):
    if not balance_admin(uid):
        raise DraftError('Administrator access is not authorized.', 403)


@api.get('/items/catalog')
def items_catalog():
    if os.getenv('VOID_ACCOUNTS_ENABLED') != 'true':
        return jsonify(items_service.public_catalog({'version': 0, 'content': items_service.SEED}))
    db, _, _ = services()
    return jsonify(items_service.public_catalog(items_service.live(db)))


@api.get('/developer/items')
@signed_in
def items_developer(db, uid):
    items_admin(uid)
    return jsonify(draft=items_service.draft_get(db, uid), state=items_service.summary(db), live=items_service.live(db), spec={'vendorRegistry': items_service.SPEC['vendorRegistry']})


@api.post('/developer/items/draft')
@signed_in
def items_draft_save(db, uid):
    items_admin(uid)
    return jsonify(items_service.draft_save(db, uid, request.get_json(silent=True)))


@api.post('/developer/items/publish')
@signed_in
def items_publish(db, uid):
    items_admin(uid)
    return jsonify(items_service.publish(db, uid, request.get_json(silent=True)))


@api.post('/developer/items/rollback')
@signed_in
def items_rollback(db, uid):
    items_admin(uid)
    return jsonify(items_service.rollback(db, uid, request.get_json(silent=True)))


@api.get('/developer/items/versions/<int:version>')
@signed_in
def items_version(db, uid, version):
    items_admin(uid)
    return jsonify(items_service.load_version(db, version))


@api.get('/shop/vendor/<vendor>')
@signed_in
def shop_vendor(db, uid, vendor):
    return jsonify(items_service.vendor_listing(db, vendor, uid=uid))


def keycard_minute():
    raw = request.args.get('gameMinute')
    if raw is None:
        return None
    if not re.fullmatch('[0-9]{1,16}', raw) or int(raw) > 2**53-1:
        raise DraftError('Invalid campaign minute.')
    return int(raw)


@api.get('/shop/state')
@signed_in
def shop_state(db, uid):
    session = request.args.get('connectedSession')
    if session is not None and not re.fullmatch('[a-zA-Z0-9_-]{16,64}', session):
        raise DraftError('Invalid play session.')
    return jsonify(items_service.player_state(db, uid, minute=keycard_minute(), session=session))


@api.get('/chance-encounters')
def chance_encounters():
    import void_runner_encounters as encounters
    if os.getenv('VOID_ACCOUNTS_ENABLED') != 'true':
        return jsonify(encounters=[])
    db, _, _ = services()
    return jsonify(encounters.catalog(db))


@api.post('/chance-encounters/opportunity')
@signed_in
def encounter_opportunity(db, uid):
    import void_runner_encounters as encounters
    return jsonify(encounters.opportunity(db, uid, request.get_json(silent=True)))


@api.post('/chance-encounters/resume')
@signed_in
def resume_encounter(db, uid):
    import void_runner_encounters as encounters
    body = request.get_json(silent=True)
    return jsonify(encounters.resume(db, uid, body.get('id') if isinstance(body, dict) else None))


@api.post('/chance-encounters/drop')
@signed_in
def encounter_drop(db, uid):
    import void_runner_encounters as encounters
    return jsonify(encounters.residential_drop(db, uid, request.get_json(silent=True)))


@api.post('/chance-encounters/outcome')
@signed_in
def encounter_outcome(db, uid):
    import void_runner_encounters as encounters
    return jsonify(encounters.outcome(db, uid, request.get_json(silent=True)))


@api.route('/developer/chance-encounters', methods=['GET', 'POST'])
@signed_in
def edit_chance_encounters(db, uid):
    import void_runner_encounters as encounters
    items_admin(uid)
    if request.method == 'POST':
        return jsonify(encounters.edit(db, uid, request.get_json(silent=True)))
    return jsonify(encounters.catalog(db, developer=True))


@api.get('/keycards/drops/<door>')
@signed_in
def keycard_drops(db, uid, door):
    return jsonify(cards=items_service.dropped_cards(db, uid, door))


@api.post('/keycards/move')
@signed_in
def keycard_move(db, uid):
    return jsonify(items_service.move_card(db, uid, request.get_json(silent=True), minute=keycard_minute()))


@api.post('/developer/keycards/grant')
@signed_in
def grant_keycard(db, uid):
    items_admin(uid)
    return jsonify(items_service.grant_card(db, uid, request.get_json(silent=True)))


@api.route('/developer/properties', methods=['GET', 'POST'])
@signed_in
def property_registry(db, uid):
    import void_runner_properties as properties
    items_admin(uid)
    if request.method == 'POST':
        return jsonify(properties.assign(db, request.get_json(silent=True), uid))
    return jsonify(properties.assignments(db))


@api.post('/keycards/reward')
@signed_in
def claim_keycard_reward(db, uid):
    return jsonify(items_service.claim_reward(db, uid, request.get_json(silent=True), minute=keycard_minute()))


@api.post('/keycards/npc-access')
@signed_in
def npc_keycard_access(db, uid):
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or set(body) != {'npc', 'door'}:
        raise DraftError('Choose an NPC and a door.')
    return jsonify(allowed=items_service.npc_card_access(db, body['npc'], body['door']))


@api.post('/keycards/access')
@signed_in
def keycard_access(db, uid):
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or set(body) != {'door'}:
        raise DraftError('Choose one door.')
    return jsonify(allowed=items_service.card_access(db, uid, body['door'], minute=keycard_minute()))


@api.post('/shop/purchase')
@signed_in
def shop_purchase(db, uid):
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise DraftError('A JSON object is required.')
    return jsonify(items_service.purchase(db, uid, body, minute=keycard_minute()))


@api.post('/shop/service/finish')
@signed_in
def shop_service_finish(db, uid):
    return jsonify(items_service.finish_service(db, uid, request.get_json(silent=True)))


@api.post('/shop/use')
@signed_in
def shop_use(db, uid):
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise DraftError('A JSON object is required.')
    return jsonify(items_service.use_item(db, uid, body))

# Sound projects are private drafts until a developer publishes the library.
import void_runner_audio_studio as sound_studio


@api.get('/studio/audio')
def public_sound_project():
    if os.getenv('VOID_ACCOUNTS_ENABLED') != 'true':
        return jsonify(version=0, content=sound_studio.EMPTY)
    db, _, _ = services()
    return jsonify(sound_studio.live(db))


@api.get('/developer/studio/audio')
@signed_in
def private_sound_project(db, uid):
    items_admin(uid)
    return jsonify(draft=sound_studio.draft(db, uid), live=sound_studio.live(db))


@api.post('/developer/studio/audio/<action>')
@signed_in
def change_sound_project(db, uid, action):
    items_admin(uid)
    if action == 'upload':
        if request.content_length is not None and request.content_length > sound_studio.MAX:
            raise DraftError('Audio files must be at most 20 MiB.', 413)
        return jsonify(sound_studio.upload(db, request.stream.read(sound_studio.MAX + 1)))
    if action == 'validate':
        data = request.get_json(silent=True)
        return jsonify(content=sound_studio.checked(data.get('content') if isinstance(data, dict) else None))
    if action not in ('draft', 'publish'):
        raise DraftError('Unknown sound operation.', 404)
    return jsonify(sound_studio.save(db, uid, request.get_json(silent=True), publish=action == 'publish'))


@api.get('/studio/audio/media/<recording>')
def public_sound_media(recording):
    db, _, _ = services()
    return sound_studio.media(db, recording)


@api.get('/developer/studio/audio/media/<recording>')
@signed_in
def private_sound_media(db, uid, recording):
    items_admin(uid)
    return sound_studio.media(db, recording, private=True)


@api.route('/developer/studio/cinematics', methods=['GET', 'POST'])
@signed_in
def cinematic_projects(db, uid):
    """Owner-private portable edit lists. Rendering and recording run in the browser."""
    items_admin(uid)
    ref = db.collection('vr_cinematic_projects').document(sound_studio.digest(uid.encode()))
    if request.method == 'GET':
        return jsonify(ref.get().to_dict() or {'revision': 0, 'projects': {}})
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or type(data.get('revision')) is not int:
        raise DraftError('A project revision is required.', 422)
    projects = data.get('projects')
    if not isinstance(projects, dict) or len(projects) > 50 or len(json.dumps(projects)) > 600000:
        raise DraftError('A library can contain up to 50 projects and 600 KB of edits.', 422)
    for key, project in projects.items():
        if not re.fullmatch(r'[a-zA-Z0-9-]{1,64}', key) or not isinstance(project, dict):
            raise DraftError('Invalid cinematic project.', 422)
        if set(project)-{'feed','hour'} != {'name','place','actor','resolution','aspect','fps','clips'} or not isinstance(project['name'], str) or not project['name'].strip() or len(project['name']) > 140:
            raise DraftError('Choose a valid project name and settings.', 422)
        if project['resolution'] not in (720,1080,1440,2160) or project['aspect'] not in ('16:9','9:16','1:1') or project['fps'] not in (30,60):
            raise DraftError('Unsupported recording settings.', 422)
        if type(project.get('hour', 21)) is not int or not 0 <= project.get('hour', 21) <= 23 or ('feed' in project and (project['place'] != 'Blackrock camera feed' or not isinstance(project['feed'],str) or not re.fullmatch(r'[-a-zA-Z0-9_:/]{1,140}',project['feed']))):
            raise DraftError('Invalid lighting hour or mission feed.',422)
        clips = project['clips']
        if not isinstance(clips,list) or len(clips)>240:
            raise DraftError('Choose up to 240 timeline clips.',422)
        for clip in clips:
            if not isinstance(clip,dict) or not sound_studio.number(clip.get('start'),0,600) or not sound_studio.number(clip.get('duration'),.05,600) or clip['start']+clip['duration']>600:
                raise DraftError('Invalid timeline range.',422)
            if 'src' in clip and clip['src'] and (not isinstance(clip['src'],str) or not (sound_studio.HASH.fullmatch(clip['src']) or clip['src'] in sound_studio.packaged_recordings())):
                raise DraftError('Choose a game recording.',422)
    from firebase_admin import firestore

    @firestore.transactional
    def commit(tx):
        old = ref.get(transaction=tx).to_dict() or {}
        if old.get('revision',0) != data['revision']:
            raise DraftError('This library changed in another window. Reopen before saving.',409)
        new = {'revision':data['revision']+1,'projects':projects}
        tx.set(ref,new)
        return new['revision']

    return jsonify(revision=commit(db.transaction()))
