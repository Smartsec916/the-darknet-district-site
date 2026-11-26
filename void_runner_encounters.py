"""Developer-authored encounters. Public readers see only the published graph."""
import json
import re
import secrets
import time

from void_runner_drafts import DraftError
from void_runner_items import _int, _num, _plain
import void_runner_items as items


KINDS = {'trigger', 'move', 'item', 'choice', 'animation', 'location', 'end'}


def identifier(value):
    return isinstance(value, str) and re.fullmatch('[a-z][a-z0-9-]{0,63}', value) is not None


def validate(graph):
    if not isinstance(graph, dict) or len(json.dumps(graph).encode()) > 65536:
        raise DraftError('Encounter exceeds the 64 KB limit.')
    if not identifier(graph.get('id')) or not _plain(graph.get('name'), 100) or not graph['name'].strip():
        raise DraftError('Choose an encounter ID and name.')
    if type(graph.get('enabled')) is not bool:
        raise DraftError('Choose whether the encounter is enabled.')
    conditions = graph.get('conditions', {})
    if not isinstance(conditions, dict) or not _num(conditions.get('chance'), 0, 100) or not _int(conditions.get('intervalSeconds'), 1, 86400):
        raise DraftError('Choose a probability from 0 to 100 and a positive interval in seconds.')
    if not identifier(conditions.get('quarter')) or not _num(conditions.get('radius', 20), 1, 200):
        raise DraftError('Choose the quarter and activation distance.')
    for field, limit in [('cooldownSeconds', 31536000), ('dailyLimit', 1000), ('expiresSeconds', 31536000)]:
        if not _int(conditions.get(field, 0), 0, limit):
            raise DraftError('Check '+field+'.')
    for field in ('fromMinute','toMinute'):
        if not _int(conditions.get(field, 0), 0, 1439):
            raise DraftError('Choose the eligible time of day.')
    for field in ('requiredItems','requiredDoors','requiredNPCs','requiredFlags'):
        values = conditions.get(field, [])
        if not isinstance(values,list) or len(values)>32 or not all(_plain(v,100) and v for v in values):
            raise DraftError('Check '+field+'.')
    start = graph.get('playtest')
    if not isinstance(start, dict) or not all(_num(start.get(k), -100000, 100000) for k in ('x', 'z')):
        raise DraftError('Set the playtest starting position.')
    if not _num(start.get('yaw',0),-100,100) or not _num(start.get('pitch',0),-1.5,1.5) or not _num(start.get('delaySeconds'),0,300):
        raise DraftError('Check the starting view and delay.')
    if graph.get('item') or graph.get('residence'):
        residence = graph.get('residence')
        if not isinstance(residence, dict) or not identifier(residence.get('character')):
            raise DraftError('Choose the resident who owns the apartment.')
        point = graph.get('dropPosition')
        if not isinstance(point, dict) or point.get('quarter') != 'oldtown' or not all(_num(point.get(k), -100000, 100000) for k in ('x', 'z')):
            raise DraftError('Choose a keycard drop position in Old Town.')
        if not _num(graph.get('pickupDistance'), .5, 5):
            raise DraftError('Pickup distance must be between 0.5 and 5 metres.')
        if not _num(graph.get('recoverySeconds', 8), 0, 300):
            raise DraftError('Choose a recovery delay between 0 and 300 seconds.')
        if not identifier(graph.get('item')):
            raise DraftError('Choose an Items & Vendors keycard.')
        placement = graph.get('placement')
        if not isinstance(placement, dict) or not all(_num(placement.get(k), -100, 100) for k in ('x','y','z','yaw')) or not _num(placement.get('scale'), .1, 5):
            raise DraftError('Check the apartment position, facing and scale.')
        if not identifier(placement.get('clip')) or not identifier(graph.get('roleplayClip')):
            raise DraftError('Choose an apartment and a roleplay animation.')
    dialogue = graph.get('dialogue', [])
    if not isinstance(dialogue, list) or len(dialogue) > 100:
        raise DraftError('Use up to 100 dialogue lines.')
    labels = set()
    for line in dialogue:
        if not isinstance(line, dict) or not isinstance(line.get('id'), str) or not re.fullmatch(r'[a-z][a-z0-9_]{0,63}', line['id']) or line['id'] in labels:
            raise DraftError('Each dialogue line needs a distinct ID.')
        labels.add(line['id'])
        if not identifier(line.get('speaker')) or not _plain(line.get('text'), 1000) or not _num(line.get('delay', 0), 0, 300):
            raise DraftError('Check the speaker, line and delay for '+line['id']+'.')
    nodes = graph.get('nodes')
    if not isinstance(nodes, list) or not 1 <= len(nodes) <= 128:
        raise DraftError('An encounter needs 1 to 128 nodes.')
    by_id = {}
    for node in nodes:
        if not isinstance(node, dict) or not identifier(node.get('id')) or node['id'] in by_id:
            raise DraftError('Each node needs a distinct ID.')
        if not isinstance(node.get('kind'), str) or node['kind'] not in KINDS or not _plain(node.get('name'), 100):
            raise DraftError('Choose a supported type and label for each node.')
        if node['kind'] == 'animation' and node.get('action') not in ('stumble', 'release', 'roleplay'):
            raise DraftError('Choose a supported animation action for '+node['name']+'.')
        by_id[node['id']] = node
    if not identifier(graph.get('start')) or graph['start'] not in by_id:
        raise DraftError('Choose a starting node.')
    for node in nodes:
        edges = node.get('edges')
        if not isinstance(edges, list) or len(edges) > 32:
            raise DraftError('Check outgoing connections for ' + node['id'])
        if node['kind'] == 'end' and edges or node['kind'] != 'end' and not edges or node['kind'] not in ('choice', 'end') and len(edges) != 1:
            raise DraftError('Check outgoing connections for ' + node['id'])
        labels = set()
        for edge in edges:
            if not isinstance(edge, dict) or not identifier(edge.get('to')) or edge['to'] not in by_id:
                raise DraftError('A connection points to a missing node.')
            if node['kind'] == 'choice':
                label = edge.get('label')
                if not _plain(label, 100) or not label.strip() or label.strip() in labels:
                    raise DraftError('Give every choice a distinct label.')
                labels.add(label.strip())
    reached, visiting = set(), set()

    def visit(node):
        if node in visiting:
            raise DraftError('Remove the cycle at ' + node)
        if node in reached:
            return
        reached.add(node)
        visiting.add(node)
        for edge in by_id[node]['edges']:
            visit(edge['to'])
        visiting.remove(node)
    visit(graph['start'])
    if len(reached) != len(nodes):
        raise DraftError('Connect all nodes to the starting node.')


def refs(db):
    return db.collection('vr_chance_encounters')


def catalog(db, developer=False):
    entries = []
    for snapshot in refs(db).stream():
        record = snapshot.to_dict()
        if developer:
            entries.append(record)
        elif record.get('live', {}).get('enabled'):
            entries.append(record['live'])
    return {'encounters': entries}


def edit(db, user, body):
    from firebase_admin import firestore
    if not isinstance(body, dict) or not identifier(body.get('id')) or not _int(body.get('revision'), 0, 2**31-1):
        raise DraftError('Refresh the encounter and try again.')
    action = body.get('action')
    if action not in ('save', 'publish', 'delete'):
        raise DraftError('Choose a supported encounter operation.')
    graph = body.get('graph')
    if action != 'delete':
        if not isinstance(graph, dict) or graph.get('id') != body['id'] or len(json.dumps(graph).encode()) > 65536:
            raise DraftError('Choose a valid encounter draft.')
        if action == 'publish':
            validate(graph)
    ref = refs(db).document(body['id'])

    @firestore.transactional
    def write(tx):
        record = ref.get(transaction=tx).to_dict() or {}
        if record.get('revision', 0) != body['revision']:
            raise DraftError('Another editor changed this encounter. Reload before saving.', 409)
        revision = body['revision'] + 1
        if action == 'delete':
            # Keep a revision tombstone so old drafts cannot recreate a deleted encounter.
            record = {'id': body['id'], 'revision': revision, 'deleted': True}
        else:
            record.update(id=body['id'], revision=revision, draft=graph, editor=user, deleted=False)
            if action == 'publish':
                record.update(live=graph, liveRevision=revision)
        tx.set(ref, record)
        return record
    return write(db.transaction())


def outcome(db, uid, body):
    from firebase_admin import firestore
    if not isinstance(body, dict) or not identifier(body.get('id')) or not identifier(body.get('outcome')):
        raise DraftError('Choose a valid encounter outcome.')
    ref = db.collection('vr_encounter_runs').document(items._tag(uid+'/'+body['id']))

    @firestore.transactional
    def finish(tx):
        record = ref.get(transaction=tx).to_dict() or {}
        if not record.get('run') or record['run'] != body.get('run'):
            raise DraftError('This encounter is unavailable.', 409)
        if record.get('finished') and record.get('outcome') == body['outcome']:
            return {'duplicate':True}
        if record.get('finished'):
            raise DraftError('This encounter already ended.', 409)
        graph = (refs(db).document(body['id']).get(transaction=tx).to_dict() or {}).get('live') or {}
        if not any(node['id'] == body['outcome'] and node['kind'] == 'end' for node in graph.get('nodes', [])):
            raise DraftError('Choose an ending from this encounter.')
        if graph.get('item') and record.get('stage') != 'collected':
            raise DraftError('Collect the residential key first.', 409)
        record.update(outcome=body['outcome'],finished=True,stage='finished')
        tx.set(ref,record)
        return {'duplicate':False}
    return finish(db.transaction())


def resume(db, uid, identity):
    if not identifier(identity):
        raise DraftError('Choose an encounter.')
    ref = db.collection('vr_encounter_runs').document(items._tag(uid+'/'+identity))
    record = ref.get().to_dict() or {}
    if record.get('stage') != 'collected' or not record.get('drop'):
        return {'active': False}
    player = items.timed_inventory(db, uid, None)
    card = player['cards'].get(record['drop']['id'])
    if not card:
        return {'active': False}
    items.resolve_residential_cards(db, [card])
    target = next((door for door in card['doors'] if door.startswith('residence/')), None)
    if not target or not items.card_allows(card, uid, target, time.time(), player.get('connectedClock', {}).get('total', 0)):
        return {'active': False}
    return {'active': True, 'run': record['run'], 'target': target}


def opportunity(db, uid, body):
    """Roll once per eligible interval. Retries return the same active encounter."""
    from firebase_admin import firestore
    if not isinstance(body, dict) or not identifier(body.get('id')):
        raise DraftError('Choose an encounter.')
    identity = body['id']
    position = body.get('position') or {}
    if not isinstance(position, dict) or not all(_num(position.get(k), -100000, 100000) for k in ('x', 'z')):
        raise DraftError('Street position is required.')
    ref = db.collection('vr_encounter_runs').document(items._tag(uid+'/'+identity))
    now = int(time.time())
    roll = secrets.randbelow(1000000) / 10000

    @firestore.transactional
    def activate(tx):
        definition = (refs(db).document(identity).get(transaction=tx).to_dict() or {}).get('live') or {}
        if not definition.get('enabled'):
            return {'active': False}
        cond = definition['conditions']
        origin = definition['playtest']
        if position.get('quarter') != cond['quarter'] or position.get('area') != 'street':
            return {'active': False}
        if sum((position[k]-origin[k])**2 for k in ('x','z')) > cond.get('radius', 20)**2:
            return {'active': False}
        record = ref.get(transaction=tx).to_dict() or {}
        if record.get('stage') in ('activated', 'dropped', 'collected'):
            return {'active':True, 'run':record['run'], 'stage':record['stage']}
        if record.get('finished') and not cond.get('repeatable'):
            return {'active':False}
        if now < record.get('next', 0):
            return {'active':False, 'next':record['next']}
        campaign = db.collection('vr_players').document(items._tag(uid)).get(transaction=tx).to_dict() or {}
        minute = items.saved_minute(campaign)
        day, tod = divmod(minute,1440)
        after,before = cond.get('fromMinute',0),cond.get('toMinute',0)
        if after != before and not (after<=tod<before if after<before else tod>=after or tod<before):
            return {'active':False}
        flags = (campaign.get('save') or {}).get('story',{}).get('flags',{})
        if any(not flags.get(k) for k in cond.get('requiredFlags',[])):
            return {'active':False}
        if cond.get('requiredItems') or cond.get('requiredDoors'):
            bag=items._clean_player(items._player_ref(db,uid).get(transaction=tx).to_dict())
            if any(not bag['owned'].get(k) for k in cond.get('requiredItems',[])):
                return {'active':False}
            if any(not any(items.card_allows(c,uid,d,now,bag.get('connectedClock',{}).get('total',0)) for c in bag['cards'].values()) for d in cond.get('requiredDoors',[])):
                return {'active':False}
        if cond.get('requiredNPCs'):
            import void_runner_live_content as world
            version=(world._state_ref(db).get(transaction=tx).to_dict() or {}).get('live')
            content=(world._version_ref(db,version).get(transaction=tx).to_dict() or {}).get('content',{}) if version else {}
            known=set(content.get('characters',{})) | set(items.inventory()['missionEditor']['givers'])
            if any(n not in known for n in cond['requiredNPCs']):
                return {'active':False}
        count=record.get('count',0) if record.get('day')==day else 0
        if cond.get('dailyLimit') and count>=cond['dailyLimit']:
            return {'active':False}
        record['next'] = now + cond['intervalSeconds']
        active = roll < cond['chance']
        if active:
            record.pop('drop',None)
            record.update(stage='activated', run=secrets.token_hex(16), started=now, finished=False,
                          day=day,count=count+1,next=now+max(cond['intervalSeconds'],cond.get('cooldownSeconds',0)))
        tx.set(ref, record)
        return {'active':active, 'next':record['next'], **({'run':record['run'],'stage':'activated'} if active else {})}
    return activate(db.transaction())


def residential_drop(db, uid, body):
    """Issue a bound, single physical card for this player's authorized crossing."""
    from firebase_admin import firestore
    import void_runner_live_content as world
    if not isinstance(body, dict) or not identifier(body.get('id')) or not isinstance(body.get('run'), str):
        raise DraftError('Select an active encounter.')
    identity = body['id']
    ref = db.collection('vr_encounter_runs').document(items._tag(uid+'/'+identity))
    now = int(time.time())

    @firestore.transactional
    def write(tx):
        record = ref.get(transaction=tx).to_dict() or {}
        if record.get('run') != body['run'] or record.get('stage') not in ('activated', 'dropped'):
            raise DraftError('This encounter has no available drop.', 409)
        if record.get('drop'):
            return record['drop']
        graph = (refs(db).document(identity).get(transaction=tx).to_dict() or {}).get('live') or {}
        if not graph.get('enabled') or not graph.get('item') or not graph.get('residence'):
            raise DraftError('This encounter does not have a residential key.', 409)
        if now < record['started'] + 5:
            raise DraftError('The crossing has not happened yet.', 409)
        version = (world._state_ref(db).get(transaction=tx).to_dict() or {}).get('live')
        bundle = (world._version_ref(db, version).get(transaction=tx).to_dict() or {}).get('content', {}) if version else {}
        resident = graph['residence']['character']
        home = bundle.get('characters', {}).get(resident, {}).get('residence') or {}
        door, slot = home.get('door'), home.get('slot')
        if not door or type(slot) is not int or not items.valid_card_door(f'residence/{door}/{slot}'):
            raise DraftError('Assign Kade an apartment in the location registry first.', 409)
        if (home.get('apartmentAccess') or {}).get('mode') != 'locked':
            raise DraftError('Set the apartment door to locked before issuing its encounter key.', 409)
        address = items.inventory()['apartments']['doors'][door]
        unit_number = (1 if address['family'] == 'container' else 101) + slot
        catalog_version = (items._state_ref(db).get(transaction=tx).to_dict() or {}).get('live')
        content = (items._version_ref(db, catalog_version).get(transaction=tx).to_dict() or {}).get('content', {}) if catalog_version else {}
        item = next((it for it in content.get('items', []) if it['id'] == graph.get('item') and it['kind'] == 'keycard' and it['status']=='published'), None)
        if not item:
            raise DraftError('Publish the residential keycard in Items & Vendors first.', 409)
        rules = item['keycard']
        if rules.get('expiryClock') != 'connected' or rules['bearer'] or rules['transferable'] or not rules['pickup']:
            raise DraftError('The encounter requires a bound, pickable connected-time card.', 409)
        key = items._tag('encounter/'+uid+'/'+record['run'])
        card = items.issue_card(item, uid, key, now)
        card.update(doors=[door,f'residence/{door}/{slot}'], residenceOwner=resident)
        point = graph['dropPosition']
        drop = {'door':door,'position':point,'range':graph['pickupDistance'],'card':card,'runRef':items._tag(uid+'/'+identity)}
        result = {'id':key,'door':door,'slot':slot,'streetNumber':address['number'],'apartmentNumber':unit_number,
                  'name':item['name'],'model':item.get('model'),'position':point,'range':drop['range']}
        tx.create(db.collection('vr_keycard_drops').document(key), drop)
        record.update(stage='dropped',drop=result)
        tx.set(ref,record)
        return result
    return write(db.transaction())
