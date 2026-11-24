"""Rook's repeatable freight desk. Contract terms and receipts belong to the account."""
import hashlib
import json
import math
import random
import secrets
import time
from pathlib import Path

REGISTRY = json.loads((Path(__file__).parent / 'void-runner/rook-freight-registry.json').read_text())
DEFAULT = REGISTRY['config']
STATIONS = REGISTRY['stations']
GOODS = {item['name']: item for item in REGISTRY['goods']}
DIFFICULTY = {'routine': 1, 'long-haul': 2, 'valuable': 2, 'hazard': 3}


class FreightError(ValueError):
    pass


def config_errors(config, missions=()):
    if not isinstance(config, dict) or set(config) != set(DEFAULT):
        return ['Incomplete freight configuration.']
    errors = []
    for key, choices in [('destinations', STATIONS), ('excluded', STATIONS),
                         ('cargo', GOODS), ('difficulties', DIFFICULTY)]:
        values = config[key]
        if (not isinstance(values, list) or len(values) > len(choices)
                or (not values and key != 'excluded')
                or any(not isinstance(v, str) or v not in choices for v in values)
                or len(set(values)) != len(values)):
            errors.append('Invalid freight ' + key + '.')
    if not errors and not set(config['destinations']).difference(config['excluded']):
        errors.append('Allow at least one freight destination.')
    low, high = config['minReward'], config['maxReward']
    if type(low) != int or type(high) != int or not 1 <= low <= high <= 999999:
        errors.append('Invalid freight payment range.')
    if config['unlockMission'] != '' and config['unlockMission'] not in missions:
        errors.append('Choose a registered freight unlock mission.')
    lines = config['dialogue']
    if (not isinstance(lines, list) or not 1 <= len(lines) <= 12
            or any(not isinstance(line, str) or not 1 <= len(line.strip()) <= 200 for line in lines)):
        errors.append('Enter one to twelve short freight offer lines.')
    return errors


def eligible(save, config):
    universe = save.get('universe') or {}
    flags = (save.get('story') or {}).get('flags') or {}
    unlocked = config['unlockMission']
    if (save.get('quest') != 'open' or flags.get('rook-first-delivery-done') is not True
            or (unlocked and not universe.get('missions', {}).get(unlocked, {}).get('completed'))):
        return []
    known = universe.get('discoveredLocations', [])
    return [loc for loc in config['destinations'] if loc not in config['excluded'] and loc in known
            and STATIONS[loc]['system'] in universe.get('discoveredSystems', [])
            and (STATIONS[loc]['system'] == 'erebus' or STATIONS[loc]['hub'] in known)
            and (not STATIONS[loc]['gate'] or flags.get(STATIONS[loc]['gate']) in ('delivered', 'paid'))]


def offer(save, config, previous, rng):
    locations = eligible(save, config)
    pairs = [(place, kind) for place in locations for kind in config['difficulties']
             if kind != 'long-haul' or STATIONS[place]['system'] != 'erebus']
    if not pairs:
        raise FreightError('There are no unlocked freight destinations on this board.')
    place, kind = rng.choice([p for p in pairs if p[0] != previous] or pairs)
    goods = GOODS[rng.choice(config['cargo'])]
    spaces = 3 if save.get('activeShip') == 'ship3' else 2
    used = sum(item['units'] for item in save.get('progression', {}).get('cargo', []))
    maximum = min(goods['max'], max(0, spaces-used)*1000//goods['kg'])
    if maximum < 1:
        raise FreightError('Free a hold space before taking freight.')
    quantity = rng.randint(min(maximum, goods['min']), maximum)
    kg = goods['kg']*quantity
    distance = int(STATIONS[place]['system'] != 'erebus') + int(STATIONS[place]['surface'])
    weight = min(1, (DIFFICULTY[kind]-1 + distance + rng.random())/5)
    return {'destination': place, 'kind': kind, 'quantity': quantity, 'cargo': f'{quantity} × {goods["name"]}',
            'units': math.ceil(kg/1000), 'weightKg': kg, 'line': rng.choice(config['dialogue']),
            'payment': round(config['minReward']+(config['maxReward']-config['minReward'])*weight)}


def change(operation, record, save, config, contract_id, rng=None):
    """Invoked in one Firestore transaction with the account's revisioned campaign."""
    flags = save['story']['flags']
    active = record.get('active')
    if operation == 'offer':
        if save['location'] != 'meridian':
            raise FreightError('Visit Rook at Meridian.')
        version = hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()
        if active and (active['stage'] != 'offered' or
                       (active.get('config') == version and active['destination'] in eligible(save, config))):
            return
        if save.get('contract') or flags.get('rookOwed'):
            raise FreightError('Finish the current cargo job first.')
        terms = offer(save, config, record.get('previous'), rng or random.SystemRandom())
        record['active'] = dict(terms, id=secrets.token_hex(16), stage='offered', config=version,
                                number=max(record.get('number', 0), flags.get('rookRuns', 0))+1)
        return
    if not active or contract_id != active['id']:
        if operation == 'collect' and contract_id and contract_id == record.get('lastPaid'):
            return
        raise FreightError('This freight contract has changed. Reopen the desk.')
    stage = active['stage']
    if operation == 'accept' and stage == 'offered':
        if (save['location'] != 'meridian' or save.get('contract') or flags.get('rookOwed')
                or active['destination'] not in eligible(save, config)):
            raise FreightError('This contract cannot be loaded here.')
        capacity = 3 if save.get('activeShip') == 'ship3' else 2
        if active['units']+sum(x['units'] for x in save.get('progression', {}).get('cargo', [])) > capacity:
            raise FreightError('There is insufficient free hold space.')
        active['stage'] = 'aboard'
        save['contract'] = 'rook-run'
        save['destination'] = None
        flags.update(rookLedger=contract_id, rookJob=active['kind'], rookRunTo=active['destination'],
                     rookTerms=f"{active['units']}|{active['payment']}|{active['weightKg']}|{active['cargo']}|Freight contract",
                     rookRuns=active['number']-1)
        mid = 'rook-run-' + str(active['number'])
        save['universe']['missions'][mid] = {'acquired': True, 'completed': False, 'objectives': {'pickup': True}}
        save['universe'].update(trackedMission=mid, trackingInitialized=True, autoTrack=True)
    elif operation == 'deliver' and stage == 'aboard':
        if (save['location'] != active['destination'] or flags.get('rookLedger') != contract_id
                or flags.get('rookOwed') != f"{active['number']}:{active['payment']}"
                or save.get('contract') == 'rook-run'):
            raise FreightError('Dock at the assigned destination with this cargo.')
        active['stage'] = 'delivered'
    elif operation == 'collect' and stage == 'delivered':
        if save['location'] != 'meridian':
            raise FreightError('Return to Rook for payment.')
        if flags.get('rookLedger') != contract_id or flags.get('rookOwed') != f"{active['number']}:{active['payment']}":
            raise FreightError('Resume the saved campaign for this freight contract.')
        save['credits'] += active['payment']
        flags.pop('rookOwed')
        flags.pop('rookLedger')
        mid = 'rook-run-' + str(active['number'])
        mission = save['universe']['missions'][mid]
        mission['completed'] = True
        mission['objectives']['payment'] = True
        if save['universe'].get('trackedMission') == mid:
            save['universe']['trackedMission'] = None
        history = []
        for item in flags.get('rookLog', '').split(','):
            parts = item.split('.')
            if len(parts) == 5 and parts[0] == str(active['number']):
                parts[-1] = 'paid'
            history.append('.'.join(parts))
        flags['rookLog'] = ','.join(history)
        save['completed'] = save.get('completed', 0)+1
        record.update(active=None, previous=active['destination'], number=active['number'], lastPaid=contract_id)
    elif (operation, stage) not in [('accept', 'aboard'), ('deliver', 'delivered')]:
        raise FreightError('Finish the previous freight step first.')


def transact(db, ref, action, payload, config):
    from firebase_admin import firestore
    if not isinstance(payload, dict) or type(payload.get('revision')) != int:
        raise FreightError('A campaign revision is required.')
    ledger = ref.collection('freight').document('desk')

    @firestore.transactional
    def commit(tx):
        profile = ref.get(transaction=tx).to_dict() or {}
        record = ledger.get(transaction=tx).to_dict() or {}
        save = profile.get('save')
        if not save:
            raise FreightError('Save your campaign to your account before opening the freight desk.')
        if profile.get('revision', 0) != payload['revision']:
            raise FreightError('The campaign changed on another device. Refresh before continuing.')
        change(action, record, save, config, payload.get('id'))
        profile.update(save=save, revision=payload['revision']+1, savedAt=int(time.time()))
        tx.set(ref, profile)
        tx.set(ledger, record)
        return {'active': record.get('active'), 'revision': profile['revision'], 'save': save,
                'lastPaid': record.get('lastPaid')}
    return commit(db.transaction())
