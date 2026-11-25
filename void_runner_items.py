"""Consumables Studio and Items & Vendors: catalog drafts, published versions, vendors, server-authoritative purchases and item use.

One catalog document (format vr-items) is edited as a private DRAFT by the administrator (VOID_ADMIN_UIDS, the same developer authorisation as the other Developer Tools)
and PUBLISHED as an immutable version (create-only; a pointer moves in the same transaction). Players read only the live version (public, cached), or the shipped seed
(the two SHOP HERE tonics) while nothing is published. The schema is void-runner/consumable-spec.js, parsed here, so the browser and the server share every limit.

Authority: price, stock, carrying limits, cooldowns and every gameplay amount come from the published catalog on the server. The browser sends only ids, a quantity,
a nonce and the expected campaign balance. The saved campaign balance, player holdings, stock and durable receipt change in one Firestore transaction. The campaign revision prevents a stale save from undoing a purchase.
"""
import hashlib
import json
import re
import time
from pathlib import Path

from void_runner_drafts import DraftError, inventory

ROOT = Path(__file__).parent
_text = (ROOT / 'void-runner' / 'consumable-spec.js').read_text(encoding='utf-8')
SPEC = json.loads(_text.split('globalThis.VoidConsumableSpec = ', 1)[1].split(';\nif (typeof module', 1)[0])
LIM = SPEC['limits']
SEED = json.loads((ROOT / 'void-runner' / 'consumable-seed.json').read_text(encoding='utf-8'))
STATE = ('vr_items_state', 'current')
VERSIONS = 'vr_items_versions'
DRAFTS = 'vr_items_drafts'
STOCK = 'vr_items_stock'
PLAYERS = 'vr_shop_players'
MAX_HISTORY = 300
CACHE_SECONDS = 20
ID = re.compile(r'^[a-z][a-z0-9-]{0,39}$')
BAD = re.compile(r'[<>\x00-\x08\x0b\x0c\x0e-\x1f]')
_cache = {'at': 0.0, 'value': None}


def _num(v, lo, hi):
    return type(v) in (int, float) and v == v and abs(v) != float('inf') and lo <= v <= hi


def _int(v, lo, hi):
    return type(v) is int and lo <= v <= hi


def _plain(v, n):
    return isinstance(v, str) and len(v) <= n and not BAD.search(v)


def _only(o, keys):
    return isinstance(o, dict) and set(o) <= set(keys)


def effect_problems(e, at):
    n = at + ': '
    if not _only(e, ['id', 'type', 'intensity', 'delay', 'duration', 'fadeIn', 'fadeOut', 'speed', 'stacking', 'params']):
        return [n + 'an effect has unknown fields']
    d = SPEC['effects'].get(e.get('type'))
    if not d:
        return [n + 'unknown effect']
    out = []
    if not isinstance(e.get('id'), str) or not ID.match(e['id']):
        out.append(n + 'bad effect id')
    for k in ['intensity', 'delay', 'duration', 'fadeIn', 'fadeOut', 'speed']:
        c = SPEC['common'][k]
        if not _num(e.get(k), c['min'], c['max']):
            out.append(n + k + ' out of range')
    if all(_num(e.get(k), 0, 1e9) for k in ['fadeIn', 'fadeOut', 'duration']) and e['fadeIn'] + e['fadeOut'] > e['duration'] + 1e-9:
        out.append(n + 'fades are longer than the effect')
    if e.get('stacking') not in SPEC['stacking']:
        out.append(n + 'bad stacking policy')
    p = e.get('params')
    if not isinstance(p, dict):
        out.append(n + 'parameters are missing')
    else:
        out += [n + 'unknown parameter ' + k for k in p if k not in d['params']]
        out += [n + k + ' out of range' for k, s in d['params'].items() if not _num(p.get(k), s['min'], s['max'])]
    return out


def modifier_problems(m, at):
    n = at + ': '
    if not _only(m, ['stat', 'amount', 'delay', 'duration', 'fadeIn', 'fadeOut']):
        return [n + 'a modifier has unknown fields']
    d = SPEC['modifiers'].get(m.get('stat'))
    if not d:
        return [n + 'unknown gameplay modifier']
    if not d['supported']:
        return [n + d['label'] + ' is not available']
    out = []
    if not _num(m.get('amount'), d['min'], d['max']):
        out.append(n + 'amount out of range')
    if not _num(m.get('delay'), 0, LIM['delay']) or not _num(m.get('duration'), 1, LIM['duration']):
        out.append(n + 'delay or duration out of range')
    if not _num(m.get('fadeIn',0),0,60) or not _num(m.get('fadeOut',0),0,120) or not _num(m.get('duration'),1,LIM['duration']) or m.get('fadeIn',0)+m.get('fadeOut',0)>m['duration']:
        out.append(n + 'modifier fades must fit within its duration')
    return out


def service_problems(service):
    if not _only(service, ['steps', 'participation', 'completion']) or service.get('participation') not in ('watch', 'follow') or service.get('completion') not in ('timer', 'confirm'):
        return ['Choose service participation and completion rules']
    steps = service.get('steps')
    if not isinstance(steps, list) or not 1 <= len(steps) <= 12:
        return ['A service needs one to twelve steps']
    total = 0
    for step in steps:
        if not _only(step, ['seconds', 'line', 'clip', 'point']) or not _int(step.get('seconds'), 1, 180) or not _int(step.get('point', 0), 0, 32) or not _plain(step.get('line', ''), 300) or not re.fullmatch(r'[a-zA-Z0-9 _-]{0,60}', str(step.get('clip', ''))):
            return ['Invalid service step, waypoint, line, animation or duration']
        total += step['seconds']
    return [] if total <= 600 else ['Services can run for up to ten minutes']


CARD_FLAGS = ('transferable', 'droppable', 'pickup', 'bearer')


def valid_card_door(target, doors=None):
    if not isinstance(target, str):
        return False
    doors = inventory()['apartments']['doors'] if doors is None else doors
    if target in doors or target in inventory().get('interiorDoors', {}):
        return True
    parts = target.split('/')
    if len(parts) != 3 or parts[0] != 'residence' or not re.fullmatch(r'0|[1-9][0-9]?', parts[2]):
        return False
    door = doors.get(parts[1], {})
    family = door.get('family')
    return family in ('city', 'container') and int(parts[2]) < (4 if family == 'container' else 10)


def keycard_problems(card):
    if not _only(card, ['doors', 'notes', 'privateNotes', 'discoverable', 'rewardMission', 'duration', *CARD_FLAGS]):
        return ['Invalid keycard configuration.']
    registry = inventory()['apartments']['doors']
    doors = card.get('doors')
    if not isinstance(doors, list) or not 1 <= len(doors) <= 64 or not all(valid_card_door(d, registry) for d in doors) or len(set(doors)) != len(doors):
        return ['Select distinct registered entrances or apartment doors for this keycard.']
    mission = card.get('rewardMission', '')
    if not isinstance(mission, str) or (mission and not re.fullmatch('[a-z][a-z0-9-]{0,79}', mission)):
        return ['Choose a valid reward mission.']
    if type(card.get('discoverable', True)) is not bool:
        return ['Choose whether holders can locate this address.']
    if not all(type(card.get(k)) is bool for k in CARD_FLAGS):
        return ['Set the transfer, drop, pickup and bearer permissions.']
    if not all(_plain(card.get(k, ''), 600) for k in ('notes', 'privateNotes')):
        return ['Keycard notes must be plain text of at most 600 characters.']
    if not _int(card.get('duration', 0), 0, 315360000):
        return ['Choose a valid keycard lifetime in seconds.']
    return []


def public_catalog(published):
    content = published['content']
    return {**published, 'content': {**content, 'items': [
        {k: v for k, v in item.items() if k != 'keycard'} for item in content['items']
    ]}}


def issue_card(item, owner, identity, now):
    rules = item['keycard']
    return {
        'id': identity, 'template': item['id'], 'name': item['name'], 'icon': item.get('icon', ''),
        'description': item.get('description', ''), 'doors': list(rules['doors']),
        'notes': rules.get('notes', ''), 'discoverable': rules.get('discoverable', True), 'issuedTo': _tag(owner),
        'expires': int(now) + rules['duration'] if rules.get('duration') else 0,
        **{flag: rules[flag] for flag in CARD_FLAGS}
    }


def grant_card(db, editor, body):
    from firebase_admin import firestore
    if not _only(body, ['item', 'destination', 'target', 'nonce']):
        raise DraftError('Choose a published keycard and a destination.')
    destination, target = body.get('destination'), body.get('target')
    if destination not in ('player', 'ground') or not isinstance(target, str):
        raise DraftError('Choose a player account or a street entrance.')
    if destination == 'ground' and (not valid_card_door(target) or '/' in target):
        raise DraftError('Choose a registered street entrance.')
    if destination == 'player' and not re.fullmatch('[A-Za-z0-9_-]{1,128}', target):
        raise DraftError('Enter a valid player account ID.')
    card_id = _tag('grant/' + editor + '/' + _nonce(body))
    receipt = db.collection('vr_keycard_grants').document(card_id)
    command = {key:body.get(key) for key in ('item', 'destination', 'target')}

    @firestore.transactional
    def write(tx):
        prior = receipt.get(transaction=tx).to_dict()
        if prior:
            if prior != command:
                raise DraftError('The grant reference belongs to another action.', 409)
            return {'id': card_id, 'duplicate': True}
        version = (_state_ref(db).get(transaction=tx).to_dict() or {}).get('live', 0)
        content = (_version_ref(db, version).get(transaction=tx).to_dict() or {}).get('content', {}) if version else {}
        item = next((i for i in content.get('items', []) if i['id'] == body.get('item') and i['kind'] == 'keycard' and i['status'] == 'published'), None)
        if not item:
            raise DraftError('Publish the keycard template before issuing it.', 409)
        card = issue_card(item, target if destination == 'player' else editor, card_id, time.time())
        if destination == 'ground':
            if not all(card[k] for k in ('pickup', 'transferable', 'bearer')):
                raise DraftError('A world pickup requires pickup, transfer and bearer permissions.')
            tx.create(db.collection('vr_keycard_drops').document(card_id), {'door': target, 'card': card})
        else:
            if not db.collection('vr_players').document(_tag(target)).get(transaction=tx).to_dict():
                raise DraftError('The player needs a saved campaign.', 404)
            holder = _player_ref(db, target)
            bag = _clean_player(holder.get(transaction=tx).to_dict())
            _receive_card(bag, card)
            tx.set(holder, bag)
        tx.create(receipt, command)
        return {'id': card_id, 'duplicate': False}
    return write(db.transaction())


def reward_mission(item):
    if item.get('kind') == 'keycard' and item.get('status') == 'published':
        return item.get('keycard', {}).get('rewardMission')


def completed_mission(campaign, mission):
    record = ((campaign.get('save') or {}).get('universe') or {}).get('missions', {}).get(mission)
    return isinstance(record, dict) and record.get('completed') is True


def claim_reward(db, uid, body):
    from firebase_admin import firestore
    if not isinstance(body, dict) or set(body) != {'item'} or not isinstance(body['item'], str):
        raise DraftError('Choose a mission reward.')
    holder = _player_ref(db, uid)
    campaign = db.collection('vr_players').document(_tag(uid))

    @firestore.transactional
    def write(tx):
        bag = _clean_player(holder.get(transaction=tx).to_dict())
        version = (_state_ref(db).get(transaction=tx).to_dict() or {}).get('live', 0)
        content = (_version_ref(db, version).get(transaction=tx).to_dict() or {}).get('content', {}) if version else {}
        item = next((i for i in content.get('items', []) if i['id'] == body['item']), {})
        mission = reward_mission(item)
        if not mission:
            raise DraftError('This mission reward is unavailable.', 404)
        grant = mission + '/' + item['id']
        if grant in bag['claimedCards']:
            return {'id': bag['claimedCards'][grant], 'duplicate': True}
        if not completed_mission(campaign.get(transaction=tx).to_dict() or {}, mission):
            raise DraftError('Complete the mission and save the campaign first.', 409)
        identity = _tag('reward/' + uid + '/' + grant)
        _receive_card(bag, issue_card(item, uid, identity, time.time()))
        bag['claimedCards'][grant] = identity
        tx.set(holder, bag)
        return {'id': identity, 'duplicate': False}
    return write(db.transaction())


def card_allows(card, holder, target, now):
    return (target in card['doors'] and (not card['expires'] or card['expires'] > now)
            and (card['bearer'] or card['issuedTo'] == _tag(holder)))


def card_access(db, uid, target, now=None):
    if not valid_card_door(target):
        raise DraftError('Choose a registered door.')
    player = _clean_player(_player_ref(db, uid).get().to_dict())
    return any(card_allows(card, uid, target, time.time() if now is None else now)
               for card in player['cards'].values())


def move_card(db, uid, body):
    """Move the same physical card atomically between inventories or a registered entrance."""
    from firebase_admin import firestore
    if not _only(body, ['action', 'card', 'door', 'recipient', 'nonce']):
        raise DraftError('Unknown keycard action.')
    action = body.get('action')
    card_id = body.get('card')
    door = body.get('door')
    recipient = body.get('recipient')
    nonce = _nonce(body)
    if action not in ('drop', 'pickup', 'transfer') or not isinstance(card_id, str) or not re.fullmatch('[a-f0-9]{64}', card_id):
        raise DraftError('Choose a physical keycard.')
    if action == 'transfer':
        if not isinstance(recipient, str) or not re.fullmatch('[A-Za-z0-9_-]{1,128}', recipient) or recipient == uid or door is not None:
            raise DraftError('Choose a different player.')
    elif recipient is not None or not valid_card_door(door) or '/' in door:
        raise DraftError('Choose a registered street entrance.')
    ref = _player_ref(db, uid)
    drop_ref = db.collection('vr_keycard_drops').document(card_id)
    receipt = db.collection('vr_keycard_actions').document(_tag(uid + '/' + nonce))
    command = {k: body[k] for k in ('action', 'card', 'door', 'recipient') if k in body}

    @firestore.transactional
    def commit(tx):
        prior = receipt.get(transaction=tx).to_dict()
        if prior:
            if prior != command:
                raise DraftError('This action reference has already been used.', 409)
            return {'duplicate': True}
        player = _clean_player(ref.get(transaction=tx).to_dict())
        if action == 'pickup':
            drop = drop_ref.get(transaction=tx).to_dict() or {}
            card = drop.get('card')
            if not card or drop.get('door') != door or not card.get('pickup'):
                raise DraftError('This card is unavailable here.', 409)
            if not card['transferable'] and card['issuedTo'] != _tag(uid):
                raise DraftError('Only the original holder can reclaim this card.', 403)
            _receive_card(player, card)
            tx.delete(drop_ref)
        else:
            card = player['cards'].get(card_id)
            if not card:
                raise DraftError('You no longer hold this card.', 409)
            if action == 'transfer':
                if not card['transferable']:
                    raise DraftError('This card cannot be transferred.', 403)
                account = db.collection('vr_players').document(_tag(recipient)).get(transaction=tx)
                if not account.to_dict():
                    raise DraftError('The recipient needs a saved campaign.', 404)
                other_ref = _player_ref(db, recipient)
                other = _clean_player(other_ref.get(transaction=tx).to_dict())
                _receive_card(other, card)
                tx.set(other_ref, other)
            else:
                if not card['droppable']:
                    raise DraftError('This card cannot be dropped.', 403)
                tx.create(drop_ref, {'door': door, 'card': card})
            del player['cards'][card_id]
            remaining = sum(c['template'] == card['template'] for c in player['cards'].values())
            if remaining:
                player['owned'][card['template']] = remaining
            else:
                player['owned'].pop(card['template'], None)
        tx.set(ref, player)
        tx.create(receipt, command)
        return {'duplicate': False}
    return commit(db.transaction())


def dropped_cards(db, uid, door):
    if not valid_card_door(door) or '/' in door:
        raise DraftError('Choose a registered street entrance.')
    result = []
    for doc in db.collection('vr_keycard_drops').where('door', '==', door).limit(64).stream():
        card = doc.to_dict()['card']
        if card['pickup'] and (card['transferable'] or card['issuedTo'] == _tag(uid)):
            result.append({k:card[k] for k in ('id', 'name', 'icon')})
    return result


def _receive_card(player, card):
    if len(player['cards']) >= 64:
        raise DraftError('The receiving inventory cannot hold this card.', 409)
    player['cards'][card['id']] = card
    player['owned'][card['template']] = player['owned'].get(card['template'], 0) + 1


def item_problems(it, cats):
    n = (it.get('id') if isinstance(it, dict) else 'item') + ': '
    keys = ['id', 'name', 'description', 'category', 'subcategory', 'kind', 'icon', 'model', 'animation', 'price', 'stack', 'weight', 'rarity', 'status', 'cooldown', 'registryId', 'consumable', 'image', 'purchaseSound', 'useSound', 'service', 'keycard']
    if not _only(it, keys):
        return [n + 'unknown fields']
    out = []
    if it.get('kind') == 'keycard':
        out.extend(keycard_problems(it.get('keycard')))
        if it.get('stack') != 1 or it.get('consumable') or it.get('category') != 'keycards':
            out.append(n + 'keycards are individual items in the Keycards category')
    elif 'keycard' in it:
        out.append(n + 'only keycards have door permissions')
    if it.get('kind') == 'service':
        out.extend(service_problems(it.get('service')))
    elif it.get('service') is not None:
        out.append(n + 'only a service item can run a routine')

    for key, pattern in [('image', r'assets/[a-zA-Z0-9_/-]+\.(png|jpg|jpeg|webp)'), ('purchaseSound', r'assets/audio/[a-zA-Z0-9_/-]+\.(mp3|ogg|wav|m4a)'), ('useSound', r'assets/audio/[a-zA-Z0-9_/-]+\.(mp3|ogg|wav|m4a)')]:
        if it.get(key) and (not isinstance(it[key], str) or not re.fullmatch(pattern, it[key])):
            out.append(n + 'choose a game asset for ' + key)

    if not isinstance(it.get('id'), str) or not ID.match(it['id']):
        out.append(n + 'bad item id')
    if not _plain(it.get('name'), LIM['name']) or not it.get('name'):
        out.append(n + 'name is required')
    if not _plain(it.get('description'), LIM['description']):
        out.append(n + 'bad description')
    if it.get('category') not in cats:
        out.append(n + 'unknown category')
    if it.get('subcategory') is not None and not _plain(it['subcategory'], 40):
        out.append(n + 'bad subcategory')
    if it.get('kind') not in SPEC['kinds']:
        out.append(n + 'bad kind')
    if it.get('icon') is not None and not _plain(it['icon'], 8):
        out.append(n + 'bad icon')
    if it.get('model') is not None and not (isinstance(it['model'], str) and re.fullmatch(r'assets/models/[a-z0-9_/-]{1,100}\.glb', it['model'])):
        out.append(n + 'bad model')
    if (it.get('animation') or 'none') not in SPEC['animations']:
        out.append(n + 'bad animation')
    if not _int(it.get('price'), 0, LIM['price']):
        out.append(n + 'bad price')
    if not _int(it.get('stack'), 1, LIM['stack']):
        out.append(n + 'bad stack size')
    if not _num(it.get('weight'), 0, LIM['weight']):
        out.append(n + 'bad weight')
    if it.get('rarity') not in SPEC['rarities']:
        out.append(n + 'bad rarity')
    if it.get('status') not in SPEC['statuses']:
        out.append(n + 'bad status')
    if not _int(it.get('cooldown') or 0, 0, LIM['cooldown']):
        out.append(n + 'bad cooldown')
    if it.get('registryId') is not None and it['registryId'] not in SPEC['registryItems']:
        out.append(n + 'unknown registry item')
    c = it.get('consumable')
    if c is not None:
        if not _only(c, ['effects', 'modifiers','repeat','group','maxStacks','maxSeconds']):
            out.append(n + 'bad consumable')
        else:
            if c.get('repeat','refresh') not in SPEC['repeatPolicies'] or (c.get('group') and (not isinstance(c['group'],str) or not ID.fullmatch(c['group']))) or not _int(c.get('maxStacks',3),1,8) or not _int(c.get('maxSeconds',1800),1,3600):
                out.append(n + 'invalid repeat-use settings')
            ef, mo = c.get('effects') or [], c.get('modifiers') or []
            if not isinstance(ef, list) or len(ef) > LIM['effects'] or not isinstance(mo, list) or len(mo) > LIM['modifiers']:
                out.append(n + 'too many effects or modifiers')
            else:
                ids = set()
                for i, e in enumerate(ef):
                    out += effect_problems(e, n + 'effect %d' % (i + 1))
                    if isinstance(e, dict):
                        if e.get('id') in ids:
                            out.append(n + 'duplicate effect id')
                        ids.add(e.get('id'))
                for i, m in enumerate(mo):
                    out += modifier_problems(m, n + 'modifier %d' % (i + 1))
    return out


def seller_rules(value):
    if value is None:
        return []
    if not _only(value, ['opens', 'closes', 'minRep', 'mission', 'color', 'message', 'sound', 'model', 'slot', 'screen']):
        return ['Unknown vendor setting']
    errors = []
    if value.get('slot') and (not isinstance(value['slot'],str) or value['slot'] not in SPEC['kioskSlots']):
        errors.append('Choose a District kiosk bay')
    if value.get('screen') and not re.fullmatch(r'#[a-fA-F0-9]{6}',str(value['screen'])):
        errors.append('Choose a valid kiosk screen color')
    for key in ('opens', 'closes'):
        if key in value and not _int(value[key], 0, 23):
            errors.append('Hours are whole numbers from 0 to 23')
    if 'minRep' in value and not _int(value['minRep'], -100, 100):
        errors.append('Reputation must be between -100 and 100')
    if value.get('mission') and (not isinstance(value['mission'], str) or not ID.fullmatch(value['mission'])):
        errors.append('Choose a valid mission ID')
    if 'message' in value and not _plain(value['message'], 160):
        errors.append('Promotional message is too long')
    if value.get('color') and not re.fullmatch(r'#[a-fA-F0-9]{6}', str(value['color'])):
        errors.append('Choose a six-digit color')
    for key, pattern in [('sound', r'assets/audio/[a-zA-Z0-9_/-]+\.(mp3|ogg|wav|m4a)'), ('model', r'assets/models/[a-zA-Z0-9_/-]+\.glb')]:
        if value.get(key) and not re.fullmatch(pattern, str(value[key])):
            errors.append('Choose a game asset for ' + key)
    return errors


def sale_condition(rules, save):
    if not rules:
        return ''
    start, end = rules.get('opens', 0), rules.get('closes', 0)
    hour = (21 + (save.get('story', {}).get('flags', {}).get('gameMin', 0) // 60)) % 24
    if start != end and not (start <= hour < end if start < end else hour >= start or hour < end):
        return 'Closed during this District hour.'
    if save.get('progression', {}).get('reputation', {}).get('civilian', 0) < rules.get('minRep', -100):
        return 'More civilian reputation is required.'
    mission = rules.get('mission')
    record = save.get('universe', {}).get('missions', {}).get(mission) or {}
    if mission and not (isinstance(record, dict) and (record.get('completed') or record.get('status') in ('complete', 'completed'))):
        return 'Complete the required mission first.'
    return ''


def entry_problems(en, at, items):
    n = at + ': '
    if not _only(en, ['item', 'price', 'stock', 'maxStock', 'restock', 'available', 'rules']):
        return [n + 'unknown fields']
    out = []
    out.extend(seller_rules(en.get('rules')))
    if en.get('item') not in items:
        out.append(n + 'item is not in the catalog')
    if not _int(en.get('price'), 0, LIM['price']):
        out.append(n + 'bad price')
    if not _int(en.get('maxStock'), 0, LIM['stock']):
        out.append(n + 'bad max stock')
    if not _int(en.get('stock'), 0, LIM['stock']) or (_int(en.get('maxStock'), 0, LIM['stock']) and en['stock'] > en['maxStock']):
        out.append(n + 'bad stock')
    r = en.get('restock')
    if not _only(r, ['mode', 'every', 'amount']) or r.get('mode') not in SPEC['restock'] or not _int(r.get('every'), 0, LIM['restockEvery']) or not _int(r.get('amount'), 0, LIM['stock']):
        out.append(n + 'bad restock')
    elif r['mode'] == 'interval' and (r['every'] < 10 or r['amount'] < 1):
        out.append(n + 'bad interval restock')
    if type(en.get('available')) is not bool:
        out.append(n + 'bad availability')
    return out


def problems(c):
    if not _only(c, ['format', 'version', 'categories', 'items', 'vendors', 'presets']):
        return ['The catalog has unknown fields.']
    if c.get('format') != SPEC['format'] or c.get('version') != SPEC['version']:
        return ['The catalog is not a %s version %s document.' % (SPEC['format'], SPEC['version'])]
    out = []
    cats = set()
    if not isinstance(c.get('categories'), list) or len(c['categories']) > LIM['categories']:
        return ['Too many categories.']
    for k in c['categories']:
        if not _only(k, ['id', 'name']) or not isinstance(k.get('id'), str) or not ID.match(k['id']) or not _plain(k.get('name'), 40) or not k.get('name'):
            out.append('A category needs an id and a name.')
        elif k['id'] in cats:
            out.append('Two categories share ' + k['id'])
        else:
            cats.add(k['id'])
    if not isinstance(c.get('items'), list) or len(c['items']) > LIM['items']:
        return out + ['Too many items.']
    ids = set()
    for it in c['items']:
        out += item_problems(it, cats)
        if isinstance(it, dict):
            if it.get('id') in ids:
                out.append('Two items share the id ' + str(it.get('id')))
            ids.add(it.get('id'))
    if not isinstance(c.get('vendors'), list) or len(c['vendors']) > LIM['vendors']:
        return out + ['Too many vendors.']
    known = {v['entity']: v for v in SPEC['vendorRegistry']}
    vids, ents = set(), []
    for v in c['vendors']:
        if not _only(v, ['id', 'name', 'kind', 'location', 'entity', 'entries', 'rules', 'enabled']):
            out.append('A vendor has unknown fields.')
            continue
        n = str(v.get('id')) + ': '
        if not isinstance(v.get('id'), str) or not ID.match(v['id']) or v['id'] in vids:
            out.append(n + 'bad or repeated vendor id')
        if 'enabled' in v and type(v['enabled']) is not bool:
            out.append(n + 'enabled must be true or false')
        out.extend(seller_rules(v.get('rules')))
        vids.add(v.get('id'))
        reg = known.get(v.get('entity'))
        if not reg and v.get('kind') == 'npc' and isinstance(v.get('entity'), str) and re.fullmatch(r'npc-[a-z][a-z0-9-]{0,35}', v['entity']):
            reg = {'kind': 'npc'}
        if not reg:
            out.append(n + 'not a seller the game has')
        elif reg['kind'] != v.get('kind'):
            out.append(n + 'kind does not match the game seller')
        ents.append(v.get('entity'))
        if not _plain(v.get('name'), LIM['name']) or not v.get('name') or not _plain(v.get('location'), 60):
            out.append(n + 'bad name or location')
        if not isinstance(v.get('entries'), list) or len(v['entries']) > LIM['entries']:
            out.append(n + 'too many entries')
        else:
            seen = set()
            for i, en in enumerate(v['entries']):
                out += entry_problems(en, n + 'entry %d' % (i + 1), ids)
                if isinstance(en, dict) and v.get('kind') != 'npc' and any(it.get('id') == en.get('item') and it.get('kind') == 'service' for it in c['items'] if isinstance(it, dict)):
                    out.append(n + 'services require an NPC vendor')
                if isinstance(en, dict):
                    if en.get('item') in seen:
                        out.append(n + 'sells an item twice')
                    seen.add(en.get('item'))
    occupied=set()
    for reg in SPEC['vendorRegistry']:
        if reg['kind']!='kiosk':
            continue
        v=next((row for row in c['vendors'] if isinstance(row,dict) and row.get('entity')==reg['entity']),{})
        rules=v.get('rules') if isinstance(v.get('rules'),dict) else {}
        slot=rules.get('slot') or reg['entity']
        if isinstance(slot,str):
            if slot in occupied:
                out.append('Two kiosks occupy the same bay')
            occupied.add(slot)
    if len(set(ents)) != len(ents):
        out.append('Two vendors use the same seller.')
    if not isinstance(c.get('presets'), list) or len(c['presets']) > LIM['presets']:
        return out + ['Too many presets.']
    pids = set()
    for p in c['presets']:
        if not _only(p, ['id', 'name', 'effects']) or not isinstance(p.get('id'), str) or not ID.match(p['id']) or not _plain(p.get('name'), LIM['name']) or not isinstance(p.get('effects'), list) or len(p['effects']) > LIM['effects']:
            out.append('A preset needs an id, a name and effects.')
            continue
        if p['id'] in pids:
            out.append('Two presets share ' + p['id'])
        pids.add(p['id'])
        for i, e in enumerate(p['effects']):
            out += effect_problems(e, 'preset %s effect %d' % (p['id'], i + 1))
    return out


# ------------------------------------------------------------ versions
def _state_ref(db):
    return db.collection(STATE[0]).document(STATE[1])


def _version_ref(db, n):
    return db.collection(VERSIONS).document('v%d' % n)


def _tag(uid):
    return hashlib.sha256(uid.encode()).hexdigest()


def clear_cache():
    _cache.update(at=0.0, value=None)


def live(db, now=None):
    """The catalog players see: {version, content}. The shipped seed while nothing is published."""
    now = now or time.time()
    if _cache['value'] is not None and now - _cache['at'] < CACHE_SECONDS:
        return _cache['value']
    state = _state_ref(db).get().to_dict() or {}
    n = state.get('live', 0)
    value = {'version': 0, 'content': SEED}
    if n:
        rec = _version_ref(db, n).get().to_dict() or {}
        if rec.get('content') is not None and not problems(rec['content']):
            value = {'version': n, 'content': rec['content'], 'publishedAt': rec.get('at')}
    _cache.update(at=now, value=value)
    return value


def summary(db):
    state = _state_ref(db).get().to_dict() or {}
    return {'version': state.get('live', 0), 'publishedAt': state.get('at'), 'history': state.get('history', []), 'published': state.get('ids', [])}


def load_version(db, n):
    rec = _version_ref(db, n).get().to_dict()
    if not rec:
        raise DraftError('That version does not exist.', 404)
    return rec


def draft_get(db, uid):
    rec = db.collection(DRAFTS).document(_tag(uid)).get().to_dict()
    if rec:
        return {'revision': rec.get('revision', 0), 'content': rec['content'], 'at': rec.get('at'), 'problems': problems(rec['content'])}
    return {'revision': 0, 'content': None, 'at': None, 'problems': []}


def draft_save(db, uid, payload):
    from firebase_admin import firestore
    if not _only(payload, ['revision', 'content']) or type(payload.get('revision')) is not int or payload['revision'] < 0:
        raise DraftError('A draft revision and content are required.')
    content = payload.get('content')
    if not isinstance(content, dict) or len(json.dumps(content)) > LIM['bytes']:
        raise DraftError('The catalog is missing or too large.', 413)
    ref = db.collection(DRAFTS).document(_tag(uid))

    @firestore.transactional
    def commit(tx):
        prior = ref.get(transaction=tx).to_dict() or {}
        if prior.get('revision', 0) != payload['revision']:
            raise DraftError('The draft changed in another window. Reload it first.', 409, {'code': 'revision-conflict'})
        at = int(time.time())
        tx.set(ref, {'content': content, 'revision': payload['revision'] + 1, 'at': at})
        return payload['revision'] + 1, at
    revision, at = commit(db.transaction())
    return {'revision': revision, 'at': at, 'problems': problems(content)}


def _ledger_problems(content, state, prior_content):
    """A published item id is never removed or re-typed, and never goes back to draft: players may hold it."""
    out = []
    items = {i['id']: i for i in content.get('items', []) if isinstance(i, dict) and 'id' in i}
    before = {i['id']: i for i in (prior_content or {}).get('items', [])}
    for pid in state.get('ids', []):
        it = items.get(pid)
        if not it:
            out.append('%s was published and players may hold it. Retire it instead of deleting it.' % pid)
        elif it.get('status') == 'draft':
            out.append('%s was published. Retire it instead of returning it to draft.' % pid)
        elif pid in before and (before[pid].get('kind') != it.get('kind') or before[pid].get('registryId') != it.get('registryId')):
            out.append('%s was published: its kind and registry link cannot change.' % pid)
    return out


def _commit(db, uid, expected, action, content_for, note=''):
    from firebase_admin import firestore
    owner_tag = _tag(uid)[:12]

    @firestore.transactional
    def commit(tx):
        state = _state_ref(db).get(transaction=tx).to_dict() or {}
        liv, history = state.get('live', 0), list(state.get('history', []))
        if liv != expected:
            raise DraftError('Someone published in the meantime (version %d is live). Reload and check again.' % liv, 409, {'code': 'version-conflict', 'live': liv})
        if len(history) >= MAX_HISTORY:
            raise DraftError('The version history is full.', 409)
        prior = (_version_ref(db, liv).get(transaction=tx).to_dict() or {}).get('content') if liv else None
        content = content_for(tx, state, prior)
        bad = problems(content) + _ledger_problems(content, state, prior if prior is not None else SEED)
        if bad:
            raise DraftError('The catalog has problems: ' + '; '.join(bad[:5]), 422, {'problems': bad})
        nxt = (history[-1]['version'] if history else 0) + 1
        at = int(time.time())
        tx.create(_version_ref(db, nxt), {'version': nxt, 'action': action, 'content': content, 'at': at, 'by': owner_tag, 'note': note})
        history.append({'version': nxt, 'at': at, 'action': action, 'note': note})
        ids = sorted(set(state.get('ids', [])) | {i['id'] for i in content['items'] if i['status'] != 'draft'})
        tx.set(_state_ref(db), {'live': nxt, 'at': at, 'history': history, 'ids': ids})
        return {'version': nxt, 'at': at}
    result = commit(db.transaction())
    clear_cache()
    return result


def publish(db, uid, payload):
    if not _only(payload, ['expected', 'note']) or type(payload.get('expected')) is not int or payload['expected'] < 0:
        raise DraftError('Say which version you expect to replace.')
    d = draft_get(db, uid)
    if not d['content']:
        raise DraftError('There is no saved draft to publish.', 422)
    note = payload.get('note') if _plain(payload.get('note') or '', 200) else ''
    return _commit(db, uid, payload['expected'], 'publish', lambda tx, state, prior: d['content'], note)


def rollback(db, uid, payload):
    """A new version carrying an older version's catalog. Items published since stay, retired, so no inventory is orphaned."""
    if not _only(payload, ['expected', 'target']) or type(payload.get('expected')) is not int or type(payload.get('target')) is not int or payload['target'] < 1:
        raise DraftError('Choose a published version.')

    def content_for(tx, state, prior):
        rec = _version_ref(db, payload['target']).get(transaction=tx).to_dict()
        if not rec:
            raise DraftError('That version does not exist.', 404)
        content = json.loads(json.dumps(rec['content']))
        have = {i['id'] for i in content['items']}
        for it in (prior or SEED)['items']:
            if it['id'] not in have and it['id'] in state.get('ids', []):
                content['items'].append({**it, 'status': 'retired'})
        for it in content['items']:
            if it['id'] in state.get('ids', []) and it['status'] == 'draft':
                it['status'] = 'retired'
        return content
    return _commit(db, uid, payload['expected'], 'rollback', content_for, 'Undo to version %d' % payload['target'])


# ------------------------------------------------------------ vendors, stock, purchases, use
def find_vendor(content, key):
    return next((v for v in content['vendors'] if key in (v['id'], v['entity'])), None)


def _stock_ref(db, vendor, item):
    return db.collection(STOCK).document(vendor + '__' + item)


def restocked(entry, rec, now):
    r = dict(rec) if rec and rec.get('base') == entry['stock'] else {'remaining': entry['stock'], 'at': now, 'base': entry['stock']}
    rs = entry['restock']
    if rs['mode'] == 'interval' and rs['every'] > 0:
        if r['remaining'] < entry['maxStock']:
            k = int(max(0, now - r['at']) // rs['every'])
            if k > 0:
                r['remaining'] = min(entry['maxStock'], r['remaining'] + k * rs['amount'])
                r['at'] += k * rs['every']
        else:
            r['at'] = now
    else:
        r['at'] = now
    return r


def vendor_listing(db, key, now=None, uid=None):
    now = now or time.time()
    cat = live(db)['content']
    v = find_vendor(cat, key)
    if not v or not v.get('enabled', True):
        raise DraftError('There is no such seller.', 404)
    save = ((db.collection('vr_players').document(_tag(uid)).get().to_dict() or {}).get('save') or {}) if uid else {}
    items = {i['id']: i for i in cat['items']}
    out = []
    for e in v['entries']:
        it = items.get(e['item'])
        if not e['available'] or not it or it['status'] != 'published':
            continue
        r = restocked(e, _stock_ref(db, v['id'], e['item']).get().to_dict(), now)
        out.append({'item': it['id'], 'name': it['name'], 'description': it['description'], 'icon': it.get('icon'), 'image': it.get('image'), 'purchaseSound': it.get('purchaseSound'), 'category': it['category'], 'rarity': it['rarity'],
                    'price': e['price'], 'stock': r['remaining'], 'maxStock': e['maxStock'], 'stack': it['stack'], 'definition': use_definition(cat, it['id']), 'service': it.get('service'), 'condition': sale_condition(v.get('rules'), save) or sale_condition(e.get('rules'), save)})
    return {'vendor': {**{k: v[k] for k in ['id', 'name', 'kind', 'location', 'entity']}, 'rules': v.get('rules', {})}, 'entries': out, 'version': live(db)['version']}


def _player_ref(db, uid):
    return db.collection(PLAYERS).document(_tag(uid))


def _clean_player(rec):
    rec = rec or {}
    owned = {k: v for k, v in (rec.get('owned') or {}).items() if isinstance(k, str) and type(v) is int and v > 0}
    return {'claimedCards': dict(rec.get('claimedCards') or {}), 'cards': dict(rec.get('cards') or {}), 'owned': owned, 'active': list(rec.get('active') or []), 'nonces': list(rec.get('nonces') or []), 'last': dict(rec.get('last') or {}), 'service': rec.get('service')}


def _span(defn):
    ends = [e['delay'] + e['duration'] for e in defn['effects']] + [m['delay'] + m['duration'] for m in defn['modifiers']]
    return max(ends) if ends else 0


def use_definition(content, item_id):
    it = next((i for i in content['items'] if i['id'] == item_id), None)
    if not it or not it.get('consumable') or it['status'] == 'draft':
        return None
    c = it['consumable']
    return {'id': it['id'], 'name': it['name'], 'cooldown': it.get('cooldown') or 0, 'animation': it.get('animation') or 'none', 'effects': c.get('effects') or [], 'modifiers': c.get('modifiers') or []}


def _active_view(player, content, now):
    out = []
    for a in player['active']:
        d = a.get('definition') or use_definition(content, a['item'])
        if d and now < a.get('until',a['at']+_span(d)):
            out.append({'item':a['item'],'startedAt':a['at'],'definition':d,'gain':a.get('gain',1),'extension':a.get('extension',0),'until':a.get('until',a['at']+_span(d))})
    return out


def modifiers_now(active, now):
    """The gameplay modifiers in force right now, summed per stat and clamped to the schema's range. This is what the multiplayer service should trust."""
    total = {}
    for a in active:
        for m in a['definition']['modifiers']:
            t = now - a['startedAt']
            elapsed = t-m['delay']
            duration = m['duration']+a.get('extension',0)
            if 0 <= elapsed < duration:
                gain=min(1,elapsed/m['fadeIn'] if m.get('fadeIn') else 1,(duration-elapsed)/m['fadeOut'] if m.get('fadeOut') else 1)
                total[m['stat']] = total.get(m['stat'],0)+m['amount']*gain*a.get('gain',1)
    return {k: max(SPEC['modifiers'][k]['min'], min(SPEC['modifiers'][k]['max'], v)) for k, v in total.items()}


def player_state(db, uid, now=None):
    now = now or time.time()
    content = live(db)['content']
    p = _clean_player(_player_ref(db, uid).get().to_dict())
    active = _active_view(p, content, now)
    items = {i['id']: {k: i.get(k) for k in ['id', 'name', 'description', 'icon', 'category', 'kind', 'rarity', 'stack', 'animation', 'registryId', 'useSound']} for i in content['items']}
    rewards = [i for i in content['items'] if reward_mission(i) and reward_mission(i)+'/'+i['id'] not in p['claimedCards']]
    campaign = db.collection('vr_players').document(_tag(uid)).get().to_dict() or {} if rewards else {}
    available = [{'id': i['id'], 'name': i['name']} for i in rewards if completed_mission(campaign, reward_mission(i))]
    return {'cardRewards': available, 'keycards': [{k:v for k,v in c.items() if k != 'issuedTo' and (k != 'doors' or c.get('discoverable', True))} for c in p['cards'].values()], 'service': p['service'] if p['service'] and p['service'].get('expires', 0) > now else None, 'owned': p['owned'], 'items': {k: v for k, v in items.items() if k in p['owned']}, 'active': active, 'modifiers': modifiers_now(active, now), 'now': now, 'version': live(db)['version']}


def _nonce(payload):
    n = payload.get('nonce')
    if not isinstance(n, str) or not re.fullmatch(r'[A-Za-z0-9_-]{8,64}', n):
        raise DraftError('A request id is required.')
    return n


def purchase(db, uid, payload, now=None):
    from firebase_admin import firestore
    now = now or time.time()
    if not _only(payload, ['vendor', 'item', 'qty', 'credits', 'nonce', 'revision']):
        raise DraftError('Unknown fields.')
    nonce = _nonce(payload)
    qty, credits = payload.get('qty'), payload.get('credits')
    if not _int(qty, 1, LIM['stack']) or not _int(credits, 0, 100_000_000) or ('revision' in payload and not _int(payload['revision'], 0, 100_000_000)):
        raise DraftError('Bad quantity or credits.')
    published = live(db)
    cat = published['content']
    v = find_vendor(cat, payload.get('vendor')) if isinstance(payload.get('vendor'), str) else None
    entry = next((e for e in (v or {}).get('entries', []) if e['item'] == payload.get('item')), None)
    item = next((i for i in cat['items'] if i['id'] == payload.get('item')), None)
    if not v or not v.get('enabled', True) or not entry or not item or not entry['available'] or item['status'] != 'published':
        raise DraftError('That is not for sale here.', 404)
    cost = entry['price'] * qty
    if credits < cost:
        raise DraftError('Not enough credits.', 402, {'code': 'credits', 'cost': cost})
    pref, sref = _player_ref(db, uid), _stock_ref(db, v['id'], item['id'])

    @firestore.transactional
    def commit(tx):
        p = _clean_player(pref.get(transaction=tx).to_dict())
        campaign_ref = db.collection('vr_players').document(_tag(uid))
        campaign = campaign_ref.get(transaction=tx).to_dict() or {}
        save = campaign.get('save') or {}
        balance = save.get('credits')
        if not _int(balance, 0, 100_000_000):
            raise DraftError('Save your campaign to your account before shopping.', 409, {'code': 'save-required'})
        receipt_ref = db.collection('vr_items_receipts').document(_tag(uid + '/' + nonce))
        receipt = receipt_ref.get(transaction=tx).to_dict()
        if receipt or nonce in p['nonces']:
            if receipt and (receipt.get('vendor'), receipt.get('item'), receipt.get('qty')) != (v['id'], item['id'], qty):
                raise DraftError('That purchase reference belongs to a different order.', 409)
            return {'duplicate': True, 'cost': 0, 'owned': p['owned'].get(item['id'], 0), 'stock': None,
                    'credits': balance, 'revision': campaign.get('revision', 0), 'service': (receipt or {}).get('service')}
        if ((_state_ref(db).get(transaction=tx).to_dict() or {}).get('live', 0)) != published['version']:
            raise DraftError('The catalog changed. Refresh before buying.', 409)
        condition = sale_condition(v.get('rules'), save) or sale_condition(entry.get('rules'), save)
        if condition:
            raise DraftError(condition, 409)
        r = restocked(entry, sref.get(transaction=tx).to_dict(), now)
        if r['remaining'] < qty:
            raise DraftError('Sold out.' if r['remaining'] <= 0 else 'Only %d left.' % r['remaining'], 409, {'code': 'stock', 'stock': r['remaining']})
        have = p['owned'].get(item['id'], 0)
        if have + qty > item['stack']:
            raise DraftError('You cannot carry more than %d of these.' % item['stack'], 409, {'code': 'carry', 'owned': have})
        if balance < cost:
            raise DraftError('Not enough saved credits.', 402, {'code': 'credits', 'cost': cost})
        if credits != balance or ('revision' in payload and payload['revision'] != campaign.get('revision', 0)):
            raise DraftError('Your saved balance changed. Refresh the shop before buying.', 409, {'code': 'save-conflict'})
        service = None
        if item['kind'] == 'service':
            if v['kind'] != 'npc' or qty != 1:
                raise DraftError('Choose one service from the NPC providing it.', 409)
            lease_ref = db.collection('vr_items_service_leases').document(_tag(v['entity']))
            lease = lease_ref.get(transaction=tx).to_dict() or {}
            if lease.get('expires', 0) > now or (p.get('service') or {}).get('expires', 0) > now:
                raise DraftError('A service is already in progress.', 409)
            definition = item['service']
            end = now + sum(s['seconds'] for s in definition['steps'])
            service = {'id': nonce, 'npc': v['entity'].removeprefix('npc-'), 'entity': v['entity'], 'name': item['name'], 'started': now,
                       'end': end, 'expires': end + (90 if definition['completion'] == 'confirm' else 0), 'definition': definition}
            p['service'] = service
            tx.set(lease_ref, {'expires': service['expires'], 'id': nonce, 'owner': _tag(uid)})
        balance -= cost
        campaign['save'] = dict(save, credits=balance)
        campaign['revision'] = campaign.get('revision', 0) + 1
        campaign['savedAt'] = int(now)
        tx.set(campaign_ref, campaign)
        tx.create(receipt_ref, {'vendor': v['id'], 'item': item['id'], 'qty': qty, 'cost': cost, 'at': int(now), 'service': service})
        r['remaining'] -= qty
        if item['kind'] == 'keycard':
            if len(p['cards']) >= 64:
                raise DraftError('Your keycard inventory is full.', 409)
            card_id = _tag(uid + '/' + nonce)
            p['cards'][card_id] = issue_card(item, uid, card_id, now)
        if not service:
            p['owned'][item['id']] = have + qty
        p['nonces'] = (p['nonces'] + [nonce])[-30:]
        tx.set(sref, r)
        tx.set(pref, p)
        return {'duplicate': False, 'cost': cost, 'owned': 0 if service else have + qty, 'service': service, 'stock': r['remaining'], 'credits': balance, 'revision': campaign['revision']}
    result = commit(db.transaction())
    result.update(item=item['id'], name=item['name'], registryId=item.get('registryId'))
    return result


def finish_service(db, uid, payload, now=None):
    from firebase_admin import firestore
    now = now or time.time()
    if not _only(payload, ['nonce']):
        raise DraftError('A service receipt is required.')
    nonce = _nonce(payload)
    pref = _player_ref(db, uid)
    @firestore.transactional
    def commit(tx):
        player = _clean_player(pref.get(transaction=tx).to_dict())
        service = player.get('service')
        if not service or service['id'] != nonce:
            return {'finished': True}
        if now < service['end']:
            raise DraftError('The service is still in progress.', 409)
        lease_ref = db.collection('vr_items_service_leases').document(_tag(service['entity']))
        lease = lease_ref.get(transaction=tx).to_dict() or {}
        if lease.get('id') == nonce and lease.get('owner') == _tag(uid):
            tx.set(lease_ref, {'expires': now})
        player['service'] = None
        tx.set(pref, player)
        return {'finished': True}
    return commit(db.transaction())


def use_item(db, uid, payload, now=None):
    from firebase_admin import firestore
    now = now or time.time()
    if not _only(payload, ['item', 'nonce']) or not isinstance(payload.get('item'), str):
        raise DraftError('Unknown fields.')
    nonce = _nonce(payload)
    content = live(db)['content']
    d = use_definition(content, payload['item'])
    if not d:
        raise DraftError('That cannot be used.', 404)
    pref = _player_ref(db, uid)

    @firestore.transactional
    def commit(tx):
        p = _clean_player(pref.get(transaction=tx).to_dict())
        receipt_ref = db.collection('vr_item_use_receipts').document(_tag(uid+'/'+nonce))
        receipt = receipt_ref.get(transaction=tx).to_dict()
        if receipt or nonce in p['nonces']:
            if receipt and receipt.get('item') != d['id']:
                raise DraftError('This receipt belongs to another item.',409)
            return {'duplicate':True,'owned':p['owned'].get(d['id'],0),'startedAt':(receipt or {}).get('at',now)}
        have = p['owned'].get(d['id'], 0)
        if have < 1:
            raise DraftError('You do not have one.', 409, {'code': 'none'})
        wait = p['last'].get(d['id'], 0) + d['cooldown'] - now
        if wait > 0:
            raise DraftError('Wait %d more seconds.' % (wait + 0.999), 409, {'code': 'cooldown', 'wait': wait})
        p['owned'][d['id']] = have - 1
        if not p['owned'][d['id']]:
            del p['owned'][d['id']]
        p['last'][d['id']] = now
        p['last'] = dict(sorted(p['last'].items(), key=lambda kv: -kv[1])[:60])
        rule=next(i['consumable'] for i in content['items'] if i['id']==d['id'])
        group=rule.get('group') or d['id']
        active=[]
        for entry in p['active']:
            definition=entry.get('definition') or use_definition(content,entry['item'])
            if definition and now<entry.get('until',entry['at']+_span(definition)):
                active.append(entry)
        repeat=rule.get('repeat','refresh')
        matches=[a for a in active if a.get('group',a['item'])==group] if repeat=='replace' else [a for a in active if a['item']==d['id']]
        if matches and repeat=='none':
            raise DraftError('This effect is already active.',409)
        cap=rule.get('maxStacks',3)
        duration=min(rule.get('maxSeconds',1800),_span(d))
        entry={'item':d['id'],'definition':d,'at':now,'until':now+duration,'group':group}
        old=matches[-1] if matches else {}
        if old and repeat=='extend':
            total=min(rule.get('maxSeconds',1800),old.get('until',old['at']+duration)-old['at']+duration)
            if old.get('until',0)>=old['at']+total:
                raise DraftError('Maximum effect duration reached.',409)
            entry.update(at=old['at'],until=old['at']+total,extension=max(0,total-_span(d)))
        if old and repeat=='intensify':
            if old.get('gain',1)>=cap:
                raise DraftError('Maximum effect intensity reached.',409)
            entry['gain']=old.get('gain',1)+1
        if repeat=='independent':
            if len(matches)>=cap:
                raise DraftError('Maximum simultaneous doses reached.',409)
        else:
            # Replacement groups can span distinct products. Ordinary refresh is per item.
            active=[a for a in active if a not in matches]
        if len(active)>=12:
            raise DraftError('The active effect limit has been reached.',409)
        p['active']=active+[entry]
        tx.create(receipt_ref,{'item':d['id'],'at':now})
        p['nonces'] = (p['nonces'] + [nonce])[-30:]
        tx.set(pref, p)
        return {'duplicate': False, 'owned': p['owned'].get(d['id'], 0)}
    result = commit(db.transaction())
    result.setdefault('startedAt',now)
    result.update(definition=d, now=now)
    return result
