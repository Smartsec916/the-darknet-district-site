"""Private draft schemas and Firestore repository. No live content activation or game actions."""
import copy
import hashlib
import json
import os
import re
import time
from pathlib import Path

ROOT = Path(__file__).parent
MAX_DRAFTS = 20
MAX_REVISIONS = 100
MAX_BYTES = 96000


class DraftError(Exception):
    def __init__(self, message, status=400, details=None):
        self.message, self.status, self.details = message, status, details or {}


def inventory():
    return json.loads((ROOT / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))


def editor(uid, allowed, enabled=True):
    # A single explicitly configured owner, never an email or a browser claim.
    owner = os.getenv('VOID_CONTENT_EDITOR_UID', '').strip()
    if not allowed(uid) or not owner or uid != owner:
        raise DraftError('This account is not the configured content editor.', 403)
    if enabled and os.getenv('VOID_CONTENT_DRAFTS_ENABLED') != 'true':
        raise DraftError('Private drafts are disabled pending infrastructure verification.', 503)


def roles(uid, allowed):
    return {'editor': bool(allowed(uid) and uid == os.getenv('VOID_CONTENT_EDITOR_UID', '').strip()), 'publisher': False,
            'draftsEnabled': os.getenv('VOID_CONTENT_DRAFTS_ENABLED') == 'true'}


def keys(value, allowed, required=()):
    if not isinstance(value, dict) or set(value) - set(allowed) or set(required) - set(value):
        raise DraftError('Unsupported or missing fields. Allowed: ' + ', '.join(allowed))


def identifier(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-zA-Z][a-zA-Z0-9_-]{0,63}', value) or value in ['constructor', 'prototype', '__proto__']:
        raise DraftError('Invalid stable identifier.')
    return value


def text(value, limit=4000):
    if not isinstance(value, str) or len(value) > limit or re.search(r'<\s*/?\s*[a-zA-Z][^>]*>', value) or '\x00' in value:
        raise DraftError('Expected bounded plain text, without HTML.')
    return value


def number(value, low, high):
    if type(value) is not int or not low <= value <= high:
        raise DraftError('Integer outside supported range.')


def array(value, limit=100):
    if not isinstance(value, list) or len(value) > limit:
        raise DraftError('List exceeds supported size.')
    return value


def condition(c, inv):
    if c is None:
        return
    keys(c, ['type', 'key', 'value'], ['type', 'key', 'value'])
    identifier(c['key'])
    if c['type'] == 'flag':
        if type(c['value']) is not bool:
            raise DraftError('Flag conditions require boolean values.')
    elif c['type'] == 'mission-complete':
        if c['key'] not in {m['id'] for m in inv['missions']} or c['value'] is not True:
            raise DraftError('Unknown completed mission condition.')
    elif c['type'] == 'at-location':
        if c['key'] not in inv['saveCompatibility']['manifest']['locations'] or c['value'] is not True:
            raise DraftError('Unknown location condition.')
    else:
        raise DraftError('Unsupported condition type.')


def effects(items, inv):
    for e in array(items, 20):
        keys(e, ['type', 'key', 'value'], ['type', 'key', 'value'])
        identifier(e['key'])
        if e['type'] == 'set-flag' and type(e['value']) is bool:
            continue
        if e['type'] == 'relationship' and e['key'] in {c['id'] for c in inv['characters']}:
            number(e['value'], -100, 100)
            continue
        raise DraftError('Unsupported effect/action or reference.')


def schema(inv):
    return {'schemaVersion': 1, 'conditions': ['flag', 'mission-complete', 'at-location'],
            'objectiveTypes': ['instruction', 'condition'], 'actions': ['set-flag', 'relationship'],
            'rewards': ['credits', 'reputation'], 'transitions': ['next', 'choice', 'end'],
            'expressions': ['none'], 'animations': ['none'],
            'voices': {c['id']: c.get('voice', {}) for c in inv['characters']},
            'factions': ['communion', 'natural-order'], 'locations': inv['saveCompatibility']['manifest']['locations'],
            'limits': {'drafts': MAX_DRAFTS, 'revisionsPerDraft': MAX_REVISIONS, 'documentBytes': MAX_BYTES},
            'editableAdapters': ['mission-overlay', 'structured-scene', 'companion-line', 'new-dialogue'],
            'unsupported': 'Legacy inline/recorded voice-manifest lines need a source adapter. Expressions/animations beyond none need approved registry adapters. No publishing.'}


def template(kind, source, inv):
    if kind == 'mission':
        m = next((m for m in inv['missions'] if m['key'] == source), None)
        if not m:
            raise DraftError('Unknown mission source.')
        return {'schemaVersion': 1, 'kind': kind, 'adapter': 'mission-overlay', 'sourceKey': source, 'baseRevision': inv['revision'],
                'data': {'id': m['id'], 'title': m['title'], 'description': m.get('description', m.get('briefing', '')),
                         'enabled': True, 'objectives': [{'id': o['id'], 'label': o['label'], 'type': 'instruction', 'condition': None} for o in m.get('objectives', [{'id': 'arrive', 'label': m.get('briefing', 'Complete the contract')}])],
                         'prerequisites': m.get('dependencies', []), 'availability': {'locations': [], 'conditions': []},
                         'rewards': [{'type': 'credits', 'amount': m.get('reward', m.get('rewards', 0))}] if type(m.get('reward', m.get('rewards', 0))) is int else []}}
    if kind == 'dialogue':
        scene = next((d for d in inv['dialogues'] if d['id'] == source), None)
        if scene:
            def adapt_effect(e):
                return [{'type': 'set-flag', 'key': k, 'value': v} for k, v in e.get('flags', {}).items()] + [{'type': 'relationship', 'key': k, 'value': v} for k, v in e.get('relationships', {}).items()]
            nodes = []
            for n in scene['nodes']:
                nodes.append({'id': n['id'], 'character': n['character'], 'text': n['text'], 'next': n.get('next'),
                              'choices': [{'text': c['text'], 'next': c['next'], 'condition': None, 'effects': adapt_effect(c.get('effects', {}))} for c in n.get('choices', [])],
                              'effects': [], 'voice': n['character'], 'expression': 'none', 'animation': 'none'})
            return {'schemaVersion': 1, 'kind': kind, 'adapter': 'structured-scene', 'sourceKey': source, 'baseRevision': inv['revision'],
                    'data': {'id': source, 'title': scene['heading'], 'start': scene['start'], 'nodes': nodes, 'cooldown': 0}}
        line = next((l for l in inv['lines'] if l['id'] == source and l['kind'] == 'companion-literal'), None)
        if line:
            return {'schemaVersion': 1, 'kind': kind, 'adapter': 'companion-line', 'sourceKey': source, 'baseRevision': inv['revision'],
                    'data': {'id': source.replace(':', '_').replace('.', '_'), 'title': line['context'], 'start': 'line', 'cooldown': 0,
                             'nodes': [{'id': 'line', 'character': line['character'], 'text': line['text'], 'next': None, 'choices': [], 'effects': [], 'voice': line['character'], 'expression': 'none', 'animation': 'none'}]}}
        raise DraftError('This legacy line needs a supported source adapter; it is read-only.', 422)
    raise DraftError('Unknown draft kind.')


def validate(doc, inv, graph=None):
    keys(doc, ['schemaVersion', 'kind', 'adapter', 'sourceKey', 'baseRevision', 'duplicateOf', 'data'], ['schemaVersion', 'kind', 'adapter', 'sourceKey', 'baseRevision', 'data'])
    if type(doc['schemaVersion']) is not int or doc['schemaVersion'] != 1 or doc['baseRevision'] != inv['revision']:
        raise DraftError('Source inventory changed; review and explicitly rebase this draft.', 409)
    if len(json.dumps(doc).encode('utf-8')) > MAX_BYTES:
        raise DraftError('Draft exceeds byte limit.', 413)
    if doc['kind'] not in ['mission','dialogue'] or not isinstance(doc['adapter'], str):raise DraftError('Unsupported content kind or adapter.')
    text(doc['sourceKey'],160)
    d = doc['data'];warnings = ['Draft only. No live content or save has been changed.']
    if 'duplicateOf' in doc:
        text(doc['duplicateOf'], 160)
    original = None
    if doc['sourceKey'] != 'new':
        original = template(doc['kind'], doc['sourceKey'], inv)
        if doc['adapter'] != original['adapter']:
            raise DraftError('Source adapter cannot be changed.')
    elif doc['adapter'] != ('mission-overlay' if doc['kind']=='mission' else 'new-dialogue'):
        raise DraftError('Unsupported new-content adapter.')
    if not isinstance(d, dict):
        raise DraftError('Missing draft data.')
    identifier(d.get('id'))
    if original and d['id'] != original['data']['id']:
        raise DraftError('Existing mission/scene identifiers are immutable. Duplicate instead.')
    if not original and not d['id'].startswith('draft-'):
        raise DraftError('New or duplicated content needs a draft- identifier.')
    text(d.get('title'), 160)
    if doc['kind'] == 'mission':
        keys(d, ['id', 'title', 'description', 'enabled', 'objectives', 'prerequisites', 'availability', 'rewards'], ['id', 'title', 'description', 'enabled', 'objectives', 'prerequisites', 'availability', 'rewards'])
        text(d['description']);
        if type(d['enabled']) is not bool:
            raise DraftError('Enabled must be boolean.')
        ids=[]
        for o in array(d['objectives'], 40):
            keys(o, ['id', 'label', 'type', 'condition'], ['id', 'label', 'type', 'condition']);identifier(o['id']);text(o['label'], 500);ids.append(o['id'])
            if o['type'] not in ['instruction', 'condition'] or (o['type'] == 'condition' and o['condition'] is None):
                raise DraftError('Unsupported objective type.')
            condition(o['condition'], inv)
        if not ids or len(set(ids)) != len(ids):
            raise DraftError('Objectives need distinct stable IDs.')
        keys(d['availability'], ['locations', 'conditions'], ['locations', 'conditions'])
        if any(x not in schema(inv)['locations'] for x in array(d['availability']['locations'], 20)):
            raise DraftError('Unknown availability location.')
        for c in array(d['availability']['conditions'], 20):condition(c, inv)
        for r in array(d['rewards'], 10):
            if not isinstance(r,dict):raise DraftError('Reward must be a typed object.')
            if r.get('type') == 'credits':
                keys(r, ['type', 'amount'], ['type', 'amount']);number(r['amount'], 0, 100000)
            elif r.get('type') == 'reputation':
                keys(r, ['type', 'faction', 'amount'], ['type', 'faction', 'amount']);number(r['amount'], -100, 100)
                if r['faction'] not in schema(inv)['factions']:raise DraftError('Unknown faction reward.')
            else:raise DraftError('Unsupported reward type.')
        deps=array(d['prerequisites'], 40)
        for dep in deps:identifier(dep)
        existing = {m['id']:m.get('dependencies', []) for m in inv['missions']}
        existing.update({v['identity']:v['dependencies'] for v in (graph or {}).values() if v['kind']=='mission'})
        existing[d['id']]=deps
        if any(dep not in existing for dep in deps):raise DraftError('Broken mission prerequisite reference.')
        active=set();done=set()
        def visit(mid):
            if mid in active:raise DraftError('Circular mission prerequisites.')
            if mid in done:return
            active.add(mid)
            for dep in existing.get(mid, []):visit(dep)
            active.remove(mid);done.add(mid)
        for mid in existing:visit(mid)
        if original:
            removed=set(o['id'] for o in original['data']['objectives'])-set(ids)
            if removed:warnings.append('Save compatibility: removed objective IDs '+', '.join(sorted(removed)))
            if not d['enabled']:warnings.append('Save compatibility: disabling an existing mission may strand active saves.')
            if d['rewards'] != original['data']['rewards']:warnings.append('Save compatibility: rewards differ; publication needs completed-transaction review.')
            warnings.append('Runtime completion/availability wrappers remain authoritative; this overlay is not activated.')
    elif doc['kind'] == 'dialogue':
        keys(d, ['id', 'title', 'start', 'nodes', 'cooldown'], ['id', 'title', 'start', 'nodes', 'cooldown']);number(d['cooldown'], 0, 86400)
        chars={c['id']:c for c in inv['characters'] if c.get('voice',{}).get('status') in ['approved','provisional','unvoiced']};identifier(d['start']);nodes=array(d['nodes'], 80);ids=[]
        for n in nodes:
            keys(n, ['id', 'character', 'text', 'next', 'choices', 'effects', 'voice', 'expression', 'animation'], ['id', 'character', 'text', 'next', 'choices', 'effects', 'voice', 'expression', 'animation'])
            identifier(n['id']);identifier(n['character']);ids.append(n['id']);text(n['text']);effects(n['effects'], inv)
            if n['character'] not in chars or n['voice'] != n['character'] or n['expression'] != 'none' or n['animation'] != 'none':
                raise DraftError('Unsupported character, voice reassignment, expression or animation.')
            for c in array(n['choices'], 12):
                keys(c, ['text', 'next', 'condition', 'effects'], ['text', 'next', 'condition', 'effects']);text(c['text'],500);identifier(c['next']);condition(c['condition'],inv);effects(c['effects'],inv)
            if n['next'] is not None:identifier(n['next'])
        if not ids or len(set(ids)) != len(ids) or d['start'] not in ids:raise DraftError('Invalid dialogue entry or duplicate node IDs.')
        reached=set();active=set();by_id={n['id']:n for n in nodes}
        def walk(nid):
            if nid not in by_id:raise DraftError('Broken dialogue transition.')
            if nid in active:raise DraftError('Circular dialogue transitions are not supported in this adapter.')
            if nid in reached:return
            active.add(nid);n=by_id[nid]
            for next_id in [n['next']]+[c['next'] for c in n['choices']]:
                if next_id:walk(next_id)
            active.remove(nid);reached.add(nid)
        walk(d['start'])
        if reached != set(ids):raise DraftError('Unreachable dialogue nodes.')
        if original:
            before={n['id'] for n in original['data']['nodes']}
            originals={n['id']:n for n in original['data']['nodes']}
            if any(n['id'] in originals and n['character']!=originals[n['id']]['character'] for n in nodes):raise DraftError('Existing character/voice assignments are locked.')
            if before-set(ids):warnings.append('Save compatibility: removed cursor node IDs '+', '.join(sorted(before-set(ids))))
            if doc['adapter']=='companion-line' and (len(nodes)!=1 or nodes[0]['character']!=original['data']['nodes'][0]['character']):raise DraftError('Companion line adapter preserves its single slot and character.')
            warnings.append('Approved source text and voice identity are unchanged. This is an unpublished proposal.')
    else:raise DraftError('Unsupported draft kind.')
    return {'valid': True, 'warnings': warnings, 'roles': {'publisher': False}, 'previewOnly': True}


def summary(doc):
    return {'identity':doc['data']['id'],'kind':doc['kind'],'title':doc['data']['title'],
            'dependencies':doc['data'].get('prerequisites', []),'sourceKey':doc['sourceKey']}


def refs(db, uid, draft_id):
    identifier(draft_id)
    if draft_id in ['schema','template','validate']:raise DraftError('Reserved draft identifier.')
    owner=hashlib.sha256(uid.encode()).hexdigest()
    return db.collection('vr_content_workspaces').document(owner), db.collection('vr_content_drafts').document(owner+'_'+draft_id)


def load(db, uid, draft_id, revision=None):
    _,ref=refs(db,uid,draft_id)
    if revision is not None:
        number(revision,1,MAX_REVISIONS);ref=ref.collection('vr_content_revisions').document(str(revision))
    record=ref.get().to_dict()
    if not record:raise DraftError('Draft not found.',404)
    if record.get('owner')!=uid:raise DraftError('Draft owner mismatch.',403)
    return record


def listing(db, uid):
    index,_=refs(db,uid,'index');record=index.get().to_dict() or {}
    if record and record.get('owner')!=uid:raise DraftError('Workspace owner mismatch.',403)
    return {'drafts':[{'id':key,**value} for key,value in record.get('heads',{}).items()]}


def save(db, uid, draft_id, payload, inv):
    keys(payload,['revision','document'],['revision','document']);number(payload['revision'],0,MAX_REVISIONS)
    index,ref=refs(db,uid,draft_id)
    from firebase_admin import firestore
    @firestore.transactional
    def commit(tx):
        workspace=index.get(transaction=tx).to_dict() or {};old=ref.get(transaction=tx).to_dict() or {}
        if workspace and workspace.get('owner')!=uid:raise DraftError('Workspace owner mismatch.',403)
        if old and old.get('owner')!=uid:raise DraftError('Draft owner mismatch.',403)
        if payload['revision']!=old.get('revision',0):raise DraftError('Revision conflict. Reload before saving; edits were not overwritten.',409,{'currentRevision':old.get('revision',0)})
        if old.get('revision',0)>=MAX_REVISIONS:raise DraftError('Revision limit reached; archive policy needs review.',409)
        heads=workspace.get('heads',{})
        if draft_id not in heads and len(heads)>=MAX_DRAFTS:raise DraftError('Workspace draft limit reached.',409)
        doc=payload['document'];result=validate(doc,inv,heads)
        if old and (doc['kind'],doc['sourceKey'],doc['data']['id']) != (old['document']['kind'],old['document']['sourceKey'],old['document']['data']['id']):raise DraftError('Draft identity and source cannot change.',409)
        if any(k!=draft_id and v['identity']==doc['data']['id'] and v['kind']==doc['kind'] for k,v in heads.items()):raise DraftError('That content already has a draft; reload its existing draft.',409)
        revision=old.get('revision',0)+1
        record={'id':draft_id,'owner':uid,'revision':revision,'document':copy.deepcopy(doc),'validation':result,'updatedAt':int(time.time())}
        heads={**heads,draft_id:{**summary(doc),'revision':revision}}
        tx.set(index,{'owner':uid,'heads':heads});tx.set(ref,record);tx.create(ref.collection('vr_content_revisions').document(str(revision)),record)
        return record
    return commit(db.transaction())
