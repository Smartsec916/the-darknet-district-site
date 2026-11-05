"""Compile saved release candidates into bounded, public, native-engine data only.
No published snapshot contains draft envelopes, editor identities, or audit reasons.
"""
import copy
import hashlib
import json
import os
import time
import threading
import void_runner_drafts as drafts
import void_runner_publication as releases

MAX_PUBLICATIONS = 100


def public_canonical(value):
    try:
        result = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
        result.encode('utf-8')
        return result
    except UnicodeError:
        raise drafts.DraftError('Published text must be valid Unicode.')



_public_cache = {}
_public_lock = threading.Lock()


def clear_public_cache():
    with _public_lock:
        _public_cache.clear()


def public_snapshot(db, inv):
    # One bounded public value per worker, never draft/audit data; prevent read stampedes.
    with _public_lock:
        now = time.monotonic()
        if _public_cache.get('db') is db and _public_cache.get('revision') == inv['revision'] and now < _public_cache.get('expires', 0):
            return copy.deepcopy(_public_cache['value'])
        active, _ = refs(db)
        record = active.get(timeout=2, retry=None).to_dict()
        value = {'enabled': False, 'schemaVersion': 1}
        if record and record.get('sourceRevision') == inv['revision']:
            value = {key: record[key] for key in ['schemaVersion', 'generation', 'sourceRevision', 'digest', 'content']}
        _public_cache.update(db=db, revision=inv['revision'], expires=now + 5, value=value)
        return copy.deepcopy(value)


def capabilities():
    return {'version': 1, 'adapters': ['registered-mission', 'structured-scene', 'companion-text'],
            'missionFields': ['title', 'description', 'objective labels', 'prerequisites', 'availability', 'enabled for new acquisition'],
            'dialogueFields': ['title', 'text', 'choices', 'conditions', 'choice effects', 'transitions among existing nodes'],
            'unsupported': ['new mission/scene/node IDs', 'contract overlays', 'objective count/order/type changes',
                            'reward changes', 'node effects', 'cooldowns', 'campaign/missionPool/shipAccess/VR lifecycle flag effects', 'new animations/expressions/voice assignments'],
            'activationDefault': False, 'closedMissionPoolPreserved': True}


def compile_condition(condition):
    if condition is None:
        return {}
    return {'flag': {'flags': {condition['key']: condition['value']}},
            'mission-complete': {'missions': [condition['key']]},
            'at-location': {'location': condition['key']}}[condition['type']]


def compile_effects(effects):
    result = {}
    for item in effects:
        if item['type'] == 'set-flag' and (item['key'] in ['missionPool', 'shipAccess'] or item['key'].lower().startswith(('campaign', 'vr'))):
            raise drafts.DraftError('Campaign lifecycle, ship-access and VR isolation flags are source-owned.', 422)
        key = 'flags' if item['type'] == 'set-flag' else 'relationships'
        if item['key'] in result.get(key, {}):
            raise drafts.DraftError('Repeated effect keys require a sequential native action adapter.', 422)
        result.setdefault(key, {})[item['key']] = item['value']
    return result


def compile_package(documents, inv):
    releases.inspect_package(documents, inv)
    payload = {'schemaVersion': 1, 'sourceRevision': inv['revision'], 'missions': {}, 'dialogue': {}, 'companions': []}
    for doc in documents.values():
        baseline = drafts.template(doc['kind'], doc['sourceKey'], inv)
        data, original = doc['data'], baseline['data']
        if doc['kind'] == 'mission':
            if not doc['sourceKey'].startswith('registry:'):
                raise drafts.DraftError('Campaign contract overlays need a dedicated adapter.', 422)
            if len(data['objectives']) != len(original['objectives']) or any(
                {k: v for k, v in a.items() if k != 'label'} != {k: v for k, v in b.items() if k != 'label'}
                for a, b in zip(data['objectives'], original['objectives'])):
                raise drafts.DraftError('Objective identities, order and completion rules are native-engine owned.', 422)
            if data['rewards'] != original['rewards']:
                raise drafts.DraftError('Rewards require their existing payment adapter.', 422)
            payload['missions'][data['id']] = {k: copy.deepcopy(data[k]) for k in
                ['title', 'description', 'objectives', 'prerequisites', 'availability', 'enabled']}
        elif doc['adapter'] == 'structured-scene':
            before = {node['id']: node for node in original['nodes']}
            if set(before) != {node['id'] for node in data['nodes']} or data['cooldown'] != original['cooldown']:
                raise drafts.DraftError('New cursor IDs and cooldowns require a save/runtime adapter.', 422)
            source = next(scene for scene in inv['dialogues'] if scene['id'] == doc['sourceKey'])
            if any(choice.get('when') for node in source['nodes'] for choice in node.get('choices', [])):
                raise drafts.DraftError('Native conditional choices need an explicit source-condition adapter.', 422)
            native = {node['id']: copy.deepcopy(node) for node in source['nodes']}
            for node in data['nodes']:
                if node['effects'] != before[node['id']]['effects']:
                    raise drafts.DraftError('Node effects require replay-safe entry handling.', 422)
                target = native[node['id']]
                # Native end handlers, labels, backgrounds and character identities remain source-owned.
                if target.get('end') and (node['next'] != before[node['id']]['next'] or node['choices']):
                    raise drafts.DraftError('Terminal native callbacks cannot be redirected.', 422)
                target['text'] = node['text']
                if node['next'] is None:
                    target.pop('next', None)
                else:
                    target['next'] = node['next']
                if node['choices']:
                    target['choices'] = [{'text': c['text'], 'next': c['next'],
                                          'when': compile_condition(c['condition']),
                                          'effects': compile_effects(c['effects'])} for c in node['choices']]
                else:
                    target.pop('choices', None)
            payload['dialogue'][data['id']] = {'heading': data['title'], 'start': data['start'], 'nodes': native}
        elif doc['adapter'] == 'companion-line':
            if any(data[k] != original[k] for k in ['start', 'cooldown']) or any(
                data['nodes'][0][k] != original['nodes'][0][k] for k in original['nodes'][0] if k != 'text'):
                raise drafts.DraftError('Companion adapter supports text in its existing slot only.', 422)
            source = next(line for line in inv['lines'] if line['id'] == doc['sourceKey'])
            path = source['context'].split('.')
            if path[0] != 'dialogue' or any(part in ['__proto__', 'prototype', 'constructor'] for part in path):
                raise drafts.DraftError('Unsupported companion slot.', 422)
            payload['companions'].append({'id': source['character'], 'path': path, 'text': data['nodes'][0]['text']})
        else:
            raise drafts.DraftError('No native publication adapter for this source.', 422)
    if len(releases.canonical(payload).encode()) > releases.MAX_PACKAGE_BYTES:
        raise drafts.DraftError('Compiled content exceeds public snapshot limit.', 413)
    return payload


def authorize(uid, allowed):
    releases.authorize(uid, allowed, write=True)
    if os.getenv('VOID_CONTENT_PUBLISHING_ENABLED') != 'true':
        raise drafts.DraftError('Live content publishing is disabled pending review.', 503)


def refs(db):
    return db.collection('vr_runtime_content').document('active'), db.collection('vr_runtime_content').document('history')


def state(db):
    _, history_ref = refs(db)
    return history_ref.get().to_dict() or {'generation': 0, 'history': []}


def publication(db, uid, payload, inv, rollback=False):
    fields = ['expectedGeneration', 'targetGeneration' if rollback else 'releaseRevision', 'reason', 'digest']
    drafts.keys(payload, fields, fields)
    drafts.number(payload['expectedGeneration'], 0, MAX_PUBLICATIONS)
    drafts.text(payload['reason'], 500)
    if len(payload['reason'].strip()) < 8:
        raise drafts.DraftError('A meaningful publication audit reason is required.')
    selected = payload['targetGeneration' if rollback else 'releaseRevision']
    drafts.number(selected, 0 if rollback else 1, MAX_PUBLICATIONS)
    if not isinstance(payload['digest'], str) or len(payload['digest']) != 64:
        raise drafts.DraftError('Review the compiled snapshot before publishing.')
    active_ref, history_ref = refs(db)
    from firebase_admin import firestore

    @firestore.transactional
    def commit(tx):
        history = history_ref.get(transaction=tx).to_dict() or {'generation': 0, 'history': []}
        if payload['expectedGeneration'] != history['generation']:
            raise drafts.DraftError('Publication conflict. Reload the current generation.', 409)
        if history['generation'] >= MAX_PUBLICATIONS:
            raise drafts.DraftError('Publication retention limit reached.', 409)
        source = None
        if rollback:
            if selected == 0:
                compiled = compile_package({}, inv)
            else:
                target = db.collection('vr_runtime_versions').document(str(selected)).get(transaction=tx).to_dict()
                if not target or target['sourceRevision'] != inv['revision']:
                    raise drafts.DraftError('Rollback version is missing or belongs to another source build.', 409)
                # Only an immutable server-produced version may become the rollback target.
                private = db.collection('vr_runtime_audit').document(str(selected)).get(transaction=tx).to_dict()
                if not private or private.get('owner') != uid:
                    raise drafts.DraftError('Rollback audit owner mismatch.', 403)
                source = private.get('releaseRevision')
                compiled = target['content']
                digest = hashlib.sha256(public_canonical(compiled).encode()).hexdigest()
                if digest != target.get('digest') or digest != private.get('digest'):
                    raise drafts.DraftError('Rollback version integrity check failed.', 409)
        else:
            _, candidate_ref = releases.refs(db, uid, selected)
            candidate = releases.owned(candidate_ref.get(transaction=tx).to_dict(), uid)
            if not candidate:
                raise drafts.DraftError('Release candidate not found.', 404)
            compiled = compile_package(candidate['documents'], inv)
            source = selected
        generation = history['generation'] + 1
        digest = hashlib.sha256(public_canonical(compiled).encode()).hexdigest()
        if payload['digest'] != digest:
            raise drafts.DraftError('Reviewed content changed; compile and review again.', 409)
        public = {'schemaVersion': 1, 'generation': generation, 'sourceRevision': inv['revision'],
                  'digest': digest, 'content': compiled}
        audit = {'generation': generation, 'owner': uid, 'reason': payload['reason'].strip(),
                 'action': 'rollback' if rollback else 'publish', 'targetGeneration': selected if rollback else None,
                 'releaseRevision': source, 'previousGeneration': history['generation'], 'digest': digest,
                 'at': int(time.time())}
        tx.create(db.collection('vr_runtime_versions').document(str(generation)), public)
        tx.create(db.collection('vr_runtime_audit').document(str(generation)), audit)
        tx.set(active_ref, public)
        tx.set(history_ref, {'generation': generation, 'history': [*history['history'], audit]})
        return {'generation': generation, 'digest': digest, 'action': audit['action']}
    result = commit(db.transaction())
    clear_public_cache()
    return result