"""Developer-authored encounters. Public readers see only the published graph."""
import json
import re
import secrets
import time
from pathlib import Path

from void_runner_drafts import DraftError
from void_runner_items import _int, _num, _plain
import void_runner_items as items


KINDS = {'trigger', 'move', 'item', 'choice', 'animation', 'location', 'cast', 'end'}


def identifier(value):
    return isinstance(value, str) and re.fullmatch('[a-z][a-z0-9-]{0,63}', value) is not None


def validate_playlists(dialogue, decision):
    by_id = {row['id']: row for row in dialogue}
    sections = {key: [] for key in ('opening', 'remaining', 'free', 'be_kade', 'wait')}
    arrival = 'remaining' if decision == 'before' else 'opening'
    owned = set()
    for row in dialogue:
        key = row['id']
        if key.startswith('lace_arrival_'):
            sections[arrival].append(row)
            if key == decision:
                arrival = 'remaining'
        else:
            for section in ('free', 'be_kade', 'wait'):
                if key.startswith('lace_' + section + '_'):
                    sections[section].append(row)
        if row.get('playlistStart') or row.get('playlistEnd'):
            if not (row.get('repeatSpeech') and row['text'].strip() or row.get('repeatAnimation') and row.get('animation')):
                raise DraftError('Select speech or animation to repeat on ' + key + '.')
        branches = row.get('branches', [])
        if not isinstance(branches, list) or branches and not re.match(r'^(lace_(arrival|free|be_kade|wait)|branch)_', key):
            raise DraftError('Choose a valid parent action for each branch playlist.')
        total = 0
        for index, branch in enumerate(branches):
            if not isinstance(branch, dict) or not _num(branch.get('chance'), 0, 100) or not _int(branch.get('passes', 1), 0, 100):
                raise DraftError('Choose a branch chance and 0 to 100 playlist passes.')
            actions = branch.get('actions')
            if not isinstance(actions, list) or not actions:
                raise DraftError('Each branch needs at least one action.')
            for action in actions:
                if not isinstance(action, str) or not action.startswith('branch_') or action not in by_id or action in owned:
                    raise DraftError('Invalid or shared branch action on ' + key + '.')
                owned.add(action)
            start = branch.get('startAction', actions[0])
            end = branch.get('endAction', actions[-1])
            if start not in actions or end not in actions or actions.index(start) > actions.index(end):
                raise DraftError('Choose starting and ending actions in order within the chance playlist on ' + key + '.')
            sections[(key, index)] = [by_id[action] for action in actions]
            total += branch['chance']
        if total > 100 + 1e-9:
            raise DraftError('Branch chances on ' + key + ' must total 100% or less.')
    main_groups = {}
    parent_actions = {}
    for section, group in sections.items():
        main_rows = [row for row in group if any(field in row for field in ('mainPlaylist', 'mainPasses', 'mainContinueChance'))]
        for row in main_rows:
            key, passes = row.get('mainPlaylist'), row.get('mainPasses')
            if not isinstance(section, str) or not isinstance(key, str) or not re.fullmatch(r'main_[a-z0-9]{1,59}', key) or not _int(passes, 0, 100):
                raise DraftError('Choose a main playlist and 0 to 100 passes.')
            chance = row.get('mainContinueChance')
            if 'mainContinueChance' in row and (passes != 0 or not _num(chance, 0, 100)):
                raise DraftError('Choose a continuation chance from 0% to 100%.')
            if main_groups.setdefault(key, (section, passes, chance)) != (section, passes, chance):
                raise DraftError('Keep playlist members in one conversation section with matching passes.')
            parent_actions[row['id']] = key
        if isinstance(section, str):
            legacy = [row for row in group if 'mainPlaylist' not in row]
            marked = [row for row in legacy if row.get('repeatSpeech') and row['text'].strip() or row.get('repeatAnimation') and row.get('animation')]
            if marked:
                first_repeat = next((row for row in marked if row.get('playlistStart')), marked[0])
                last_repeat = next((row for row in marked if row.get('playlistEnd')), marked[-1])
                for row in legacy[legacy.index(first_repeat):legacy.index(last_repeat) + 1]:
                    parent_actions[row['id']] = ('legacy', section)
        first = [n for n, row in enumerate(group) if row.get('playlistStart')]
        last = [n for n, row in enumerate(group) if row.get('playlistEnd')]
        if len(first) > 1 or len(last) > 1 or first and last and first[0] > last[0]:
            raise DraftError('Check the first and last actions in the playlist.')
    for row in dialogue:
        if any(field in row for field in ('mainPlaylist', 'mainPasses', 'mainContinueChance')) and row['id'] not in parent_actions:
            raise DraftError('Choose a valid conversation for each main playlist.')
        for branch in row.get('branches', []):
            completion = branch.get('completion')
            if 'completion' in branch and completion not in ('reroll', 'replay', 'next', 'start', 'action'):
                raise DraftError('Choose a supported branch completion behavior.')
            if completion in ('start', 'action') and row['id'] not in parent_actions:
                raise DraftError('Choose a main playlist for this branch return.')
            if completion == 'action':
                target = branch.get('returnAction')
                if not isinstance(target, str) or parent_actions.get(target) != parent_actions[row['id']]:
                    raise DraftError('Choose a return action in the same main playlist.')
    reachable = set()
    pending = [key for key in by_id if not key.startswith('branch_')]
    while pending:
        key = pending.pop()
        if key not in reachable:
            reachable.add(key)
            for branch in by_id[key].get('branches', []):
                pending.extend(branch['actions'])
    if len(reachable) != len(by_id):
        raise DraftError('A branch playlist has no reachable parent.')


def start_trigger_ready(trigger, event, campaign, record):
    kind = trigger.get('kind', 'interval')
    save = campaign.get('save') or {}
    flags = (save.get('story') or {}).get('flags') or {}
    target = trigger.get('target')
    if kind in ('near', 'place', 'leave', 'pod-exit'):
        return (isinstance(event, dict) and event.get('kind') == kind
                and event.get('target') == target and isinstance(event.get('token'), str)
                and re.fullmatch('[a-f0-9-]{36}', event['token']) is not None
                and event['token'] not in record.get('recentStartEvents', []))
    if kind == 'flag':
        return flags.get(target) is True
    if kind in ('after-mission', 'game-time'):
        mission = ((save.get('universe') or {}).get('missions') or {}).get(target) or {}
        if mission.get('completed') is not True:
            return False
        if kind == 'game-time':
            stamp = flags.get('gc_' + target[:60])
            return type(stamp) is int and items.saved_minute(campaign) - stamp >= trigger['minutes']
        return True
    return kind == 'interval'


def validate_sound_cues(graph, rows):
    lists = [graph.get('soundCues', [])]
    for field in ('sectionSounds', 'playlistSounds'):
        values = graph.get(field, {})
        if not isinstance(values, dict):
            raise DraftError('Choose sounds for a valid section or playlist.')
        lists.extend(values.values())
    for owner in graph['nodes'] + rows + [branch for row in rows for branch in row.get('branches', [])]:
        lists.append(owner.get('soundCues', []))
    if any(not isinstance(cues, list) for cues in lists):
        raise DraftError('Choose a list of sound effects.')
    if not any(lists):
        return
    library = set(json.loads((Path(__file__).parent / 'void-runner' / 'sound-library.json').read_text(encoding='utf-8')))
    for cues in lists:
        for cue in cues:
            if not isinstance(cue, dict) or not isinstance(cue.get('src'), str) or cue['src'] not in library:
                raise DraftError('Choose a sound effect from the packaged audio library.')
            if cue.get('when') not in ('start', 'end') or not _num(cue.get('offset'), 0, 3600) or not _num(cue.get('volume'), 0, 1) or not isinstance(cue.get('loop'), bool):
                raise DraftError('Check the sound effect timing and volume.')
            if cue['loop']:
                stop = cue.get('stop')
                if stop not in ('scope', 'encounter', 'seconds') or (cue['when'] == 'end' and stop != 'seconds'):
                    raise DraftError('Choose when the sound effect loop ends.')
                if stop == 'seconds' and (not _num(cue.get('seconds'), 0, 3600) or cue['seconds'] == 0):
                    raise DraftError('Enter a positive loop duration.')


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
    trigger = conditions.get('startTrigger', {'kind': 'interval'})
    if not isinstance(trigger, dict) or trigger.get('kind') not in ('interval', 'near', 'place', 'leave', 'after-mission', 'game-time', 'flag', 'pod-exit'):
        raise DraftError('Choose a supported encounter start trigger.')
    kind = trigger['kind']
    if kind not in ('interval', 'pod-exit') and not (_plain(trigger.get('target'), 100) and trigger['target'].strip()):
        raise DraftError('Choose the place, mission or flag for the start trigger.')
    if 'alsoRandom' in trigger and type(trigger['alsoRandom']) is not bool:
        raise DraftError('Choose whether nearby percentage rolls also apply.')
    if kind == 'near' and not _num(trigger.get('distance'), 1, 30):
        raise DraftError('Choose a distance from 1 to 30 metres.')
    if kind == 'game-time' and not _int(trigger.get('minutes'), 1, 10080):
        raise DraftError('Choose 1 to 10080 in-game minutes after mission completion.')
    daily_limit = conditions.get('dailyLimit', 0)
    if daily_limit != 0.5 and not _int(daily_limit, 0, 1000):
        raise DraftError('Use 0.5 for every other game day or a whole number from 0 to 1000.')
    for field, limit in [('cooldownSeconds', 31536000), ('expiresSeconds', 31536000)]:
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
    if 'cast' in graph:
        cast = graph['cast']
        if start.get('scene') not in ('sacramento', 'darknet-district', 'planet-low-quay') or not isinstance(cast, list):
            raise DraftError('Choose an encounter location and cast.')
        ids = set()
        models = items.inventory()['madeCharacters']['models'] if cast else {}
        for actor in cast:
            if not isinstance(actor, dict) or not identifier(actor.get('id')) or actor['id'] in ids:
                raise DraftError('Give each cast member a unique NPC ID.')
            ids.add(actor['id'])
            if not _plain(actor.get('name'), 60) or not actor['name'].strip():
                raise DraftError('Enter each cast member’s name.')
            if actor.get('localAsset') or not identifier(actor.get('model')) or actor['model'] not in models:
                raise DraftError('Choose a registered game model for '+actor['id']+' before publishing.')
            if not all(_num(actor.get(k), -100000, 100000) for k in ('x','y','z')) or not _num(actor.get('yaw'), -100, 100) or not _num(actor.get('scale'), .1, 5):
                raise DraftError('Check placement and scale for '+actor['id']+'.')
            if not _plain(actor.get('idle', ''), 100):
                raise DraftError('Check the idle animation for '+actor['id']+'.')
        if start['scene'] == 'sacramento' and start.get('quarter') != conditions.get('quarter'):
            raise DraftError('Use the same street quarter for activation and playtest.')
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
    if 'pickupNoticeSeconds' in graph and not _num(graph['pickupNoticeSeconds'], 1, 60):
        raise DraftError('Use 1 to 60 seconds for the pickup notification.')
    dialogue = graph.get('dialogue', [])
    if not isinstance(dialogue, list) or len(dialogue) > 100:
        raise DraftError('Use up to 100 dialogue lines.')
    saved = graph.get('savedActions', [])
    if not isinstance(saved, list) or any(not isinstance(group, list) or not group for group in saved):
        raise DraftError('Saved actions must be stored as action groups.')
    stored = [line for group in saved for line in group]
    if len(stored) > 100:
        raise DraftError('Use up to 100 saved actions.')
    labels = set()
    for line in dialogue + stored:
        if not isinstance(line, dict) or not isinstance(line.get('id'), str) or not re.fullmatch(r'[a-z][a-z0-9_]{0,63}', line['id']) or line['id'] in labels:
            raise DraftError('Each dialogue line needs a distinct ID.')
        labels.add(line['id'])
        if 'cast' in graph and line in dialogue and line.get('animation') and (not identifier(line.get('speaker')) or line['speaker'] not in ids):
            raise DraftError('Choose a cast member for animation '+line['id']+'.')
        if not identifier(line.get('speaker')) or not _plain(line.get('text'), 1000) or not _num(line.get('delay', 0), 0, 300):
            raise DraftError('Check the speaker, line and delay for '+line['id']+'.')
        if 'animationSpeed' in line and (not _num(line['animationSpeed'], 0, float('inf')) or line['animationSpeed'] == 0):
            raise DraftError('Enter a playback speed greater than 0 for '+line['id']+'.')
        for flag in ('repeatSpeech', 'repeatAnimation', 'playlistStart', 'playlistEnd'):
            if flag in line and not isinstance(line[flag], bool):
                raise DraftError('Choose on or off for dialogue repeats.')
        if 'recording' in line:
            from void_runner_live_content import clip_problems
            clip = line['recording']
            if clip_problems([clip]) or clip['who'] != line['speaker'] or clip['text'] != line['text']:
                raise DraftError('Attach a recording that matches '+line['id']+'.')
    for group in saved:
        remaining = {line['id'] for line in group[1:]}
        for line in group:
            branches = line.get('branches', [])
            if not isinstance(branches, list):
                raise DraftError('Check the saved chance playlists.')
            for branch in branches:
                actions = branch.get('actions') if isinstance(branch, dict) else None
                if not isinstance(actions, list) or not actions:
                    raise DraftError('Check the saved chance playlists.')
                for action in actions:
                    if not isinstance(action, str) or action not in remaining:
                        raise DraftError('Check the saved chance playlist actions.')
                    remaining.remove(action)
        if remaining:
            raise DraftError('Each saved branch action needs a parent.')
    validate_playlists(dialogue, graph.get('decisionAfter'))
    nodes = graph.get('nodes')
    if not isinstance(nodes, list) or not 1 <= len(nodes) <= 128:
        raise DraftError('An encounter needs 1 to 128 nodes.')
    by_id = {}
    for node in nodes:
        if not isinstance(node, dict) or not identifier(node.get('id')) or node['id'] in by_id:
            raise DraftError('Each node needs a distinct ID.')
        if not isinstance(node.get('kind'), str) or node['kind'] not in KINDS or not _plain(node.get('name'), 100):
            raise DraftError('Choose a supported type and label for each node.')
        if node['kind'] == 'cast' and (not graph.get('cast') or node.get('speaker') and (not identifier(node['speaker']) or node['speaker'] not in ids)):
            raise DraftError('Choose a cast member for '+node['id']+'.')
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
    validate_sound_cues(graph, dialogue + stored)


def refs(db):
    return db.collection('vr_chance_encounters')


def catalog(db, developer=False):
    entries = []
    for snapshot in refs(db).stream():
        record = snapshot.to_dict()
        for version in ('live', 'draft'):
            graph = record.get(version) or {}
            if graph.get('id') == 'dropped-cardkey' and graph.get('name') == 'The Dropped Cardkey':
                record[version] = dict(graph, name='Pleasure Breach')
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
    if action not in ('save', 'publish', 'unpublish', 'delete'):
        raise DraftError('Choose a supported encounter operation.')
    graph = body.get('graph')
    if action in ('save', 'publish'):
        if not isinstance(graph, dict) or graph.get('id') != body['id'] or len(json.dumps(graph).encode()) > 65536:
            raise DraftError('Choose a valid encounter draft.')
        if action == 'publish':
            validate(graph)
            from void_runner_live_content import clips_missing
            hashes = {line['recording']['hash'] for line in graph.get('dialogue', []) + [row for group in graph.get('savedActions', []) for row in group] if 'recording' in line}
            if hashes and clips_missing(db, sorted(hashes)):
                raise DraftError('Upload the dialogue recordings before publishing.')
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
        elif action == 'unpublish':
            if not record.get('live'):
                raise DraftError('This encounter has no published version.', 409)
            record.setdefault('draft', record['live'])
            record.pop('live')
            record.pop('liveRevision', None)
            record.update(revision=revision, editor=user)
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


def retire_expired(db, tx, uid, ref, record):
    if record.get('stage') != 'collected':
        return False
    bag = items._clean_player(items._player_ref(db, uid).get(transaction=tx).to_dict())
    deadline = record.get('connectedUntil')
    if deadline is None:
        card_id = record['drop']['id']
        card = bag['cards'].get(card_id)
        if not card:
            dropped = db.collection('vr_keycard_drops').document(card_id).get(transaction=tx).to_dict() or {}
            card = dropped.get('card') or {}
        deadline = card.get('connectedUntil')
    if deadline is None or bag.get('connectedClock', {}).get('total', 0) < deadline:
        return False
    tx.set(ref, dict(record, finished=True, stage='finished', outcome='expired'))
    return True


def resume(db, uid, identity):
    from firebase_admin import firestore
    if not identifier(identity):
        raise DraftError('Choose an encounter.')
    ref = db.collection('vr_encounter_runs').document(items._tag(uid+'/'+identity))
    @firestore.transactional
    def current(tx):
        record = ref.get(transaction=tx).to_dict() or {}
        if retire_expired(db, tx, uid, ref, record):
            return dict(record, stage='finished', outcome='expired')
        return record
    record = current(db.transaction())
    if record.get('outcome') == 'expired':
        return {'active': False, 'expired': True, 'run': record['run']}
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
        expected_scene = origin.get('scene', 'sacramento') if 'cast' in definition else 'sacramento'
        if position.get('scene', 'sacramento') != expected_scene:
            return {'active': False}
        if expected_scene == 'sacramento' and (position.get('quarter') != cond['quarter'] or position.get('area') != 'street'):
            return {'active': False}
        if expected_scene == 'darknet-district' and position.get('area') != 'interior':
            return {'active': False}
        if sum((position[k]-origin[k])**2 for k in ('x','z')) > cond.get('radius', 20)**2:
            return {'active': False}
        record = ref.get(transaction=tx).to_dict() or {}
        if retire_expired(db, tx, uid, ref, record):
            return {'active': False}
        if record.get('stage') in ('activated', 'dropped', 'collected'):
            return {'active':True, 'run':record['run'], 'stage':record['stage']}
        if record.get('finished') and not cond.get('repeatable'):
            return {'active':False}
        if now < record.get('next', 0):
            return {'active':False, 'next':record['next']}
        campaign = db.collection('vr_players').document(items._tag(uid)).get(transaction=tx).to_dict() or {}
        trigger = cond.get('startTrigger', {})
        event = body.get('startEvent')
        if not (trigger.get('alsoRandom') is True and event is None) and not start_trigger_ready(trigger, event, campaign, record):
            return {'active': False}
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
        daily_limit = cond.get('dailyLimit', 0)
        last_day = record.get('day')
        if daily_limit == 0.5:
            if last_day is not None and day < last_day + 2:
                return {'active':False}
        elif daily_limit and count >= daily_limit:
            return {'active':False}
        record['next'] = now + cond['intervalSeconds']
        event_trigger = event is not None and trigger.get('kind') in ('near', 'place', 'leave', 'pod-exit')
        if event_trigger:
            record['recentStartEvents'] = [*record.get('recentStartEvents', [])[-31:], event['token']]
        active = roll < cond['chance']
        if active:
            record.pop('drop',None)
            record.update(stage='activated', run=secrets.token_hex(16), started=now, finished=False,
                          day=day,count=count+1,next=now+max(cond['intervalSeconds'],cond.get('cooldownSeconds',0)))
        tx.set(ref, record)
        return {'active':active, 'rolled':True, 'next':record['next'], **({'run':record['run'],'stage':'activated'} if active else {})}
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
                  'name':item['name'],'description':item.get('description',''),'model':item.get('model'),'position':point,'range':drop['range']}
        tx.create(db.collection('vr_keycard_drops').document(key), drop)
        record.update(stage='dropped',drop=result)
        tx.set(ref,record)
        return result
    return write(db.transaction())
