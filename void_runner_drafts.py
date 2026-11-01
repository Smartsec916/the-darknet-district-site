"""Private draft schemas and Firestore repository. No live content activation or game actions."""
import copy
import hashlib
import json
import logging
import os
import re
import time
from pathlib import Path

ROOT = Path(__file__).parent
MAX_DRAFTS = 20
MAX_ARCHIVED = 40
MAX_REVISIONS = 100
MAX_HISTORY = 300
MAX_BYTES = 96000
EXPORT_FORMAT = 'void-runner-draft-export'
EXPORT_VERSION = 1
RESERVED_IDS = ['schema', 'template', 'validate', 'export']
log = logging.getLogger('void_runner.drafts')


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
    if type(doc['schemaVersion']) is not int or doc['schemaVersion'] != 1:
        raise DraftError('Unsupported draft schema version.')
    if doc['baseRevision'] != inv['revision']:
        raise DraftError('Source inventory changed; review and explicitly rebase this draft.', 409,
                         {'code': 'rebase-required', 'draftInventoryRevision': doc['baseRevision'], 'currentInventoryRevision': inv['revision']})
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


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(',', ':'))


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def owner_key(uid):
    # The account id never leaves the server; documents and exports use this one-way key.
    return hashlib.sha256(uid.encode()).hexdigest()


def refs(db, uid, draft_id):
    identifier(draft_id)
    if draft_id in RESERVED_IDS:raise DraftError('Reserved draft identifier.')
    owner=owner_key(uid)
    return db.collection('vr_content_workspaces').document(owner), db.collection('vr_content_drafts').document(owner+'_'+draft_id)


def revision_ref(ref, revision):
    number(revision,1,MAX_REVISIONS)
    return ref.collection('vr_content_revisions').document(str(revision))


def history_of(record):
    """Revision and archive events kept on the head record. Drafts saved before Stage 3B.1 have none, so their
    revisions are listed without details."""
    if not record:return []
    if isinstance(record.get('history'),list):return list(record['history'])
    return [{'revision':n,'action':'save','legacy':True} for n in range(1,record.get('revision',0)+1)]


def source_info(doc, inv):
    """The source this draft was based on, kept with every revision so a later rebase can tell what the game changed
    (the inventory only keeps the current source)."""
    if doc['sourceKey']=='new':return {'inventoryRevision':inv['revision'],'hash':None,'snapshot':None}
    snapshot=template(doc['kind'],doc['sourceKey'],inv)['data']
    return {'inventoryRevision':inv['revision'],'hash':digest(snapshot),'snapshot':snapshot}


def load(db, uid, draft_id, revision=None):
    _,ref=refs(db,uid,draft_id)
    if revision is not None:ref=revision_ref(ref,revision)
    record=ref.get().to_dict()
    if not record:raise DraftError('Draft not found.',404)
    if record.get('owner')!=uid:raise DraftError('Draft owner mismatch.',403)
    if revision is None:record['history']=history_of(record)
    return record


def listing(db, uid):
    index,_=refs(db,uid,'index');record=index.get().to_dict() or {}
    if record and record.get('owner')!=uid:raise DraftError('Workspace owner mismatch.',403)
    return {'drafts':[{'id':key,**value} for key,value in record.get('heads',{}).items()],
            'archived':[{'id':key,**value} for key,value in record.get('archived',{}).items()],
            'limits':{'active':MAX_DRAFTS,'archived':MAX_ARCHIVED,'revisions':MAX_REVISIONS}}


def confirmed(payload, fields):
    keys(payload,[*fields,'confirm'],[*fields,'confirm'])
    if payload['confirm'] is not True:raise DraftError('This operation changes stored drafts and needs explicit confirmation.')


def opened(tx, uid, index, ref, expected, require=True):
    """Read the workspace index and the draft head inside a transaction, before any write."""
    workspace=index.get(transaction=tx).to_dict() or {};old=ref.get(transaction=tx).to_dict() or {}
    if workspace and workspace.get('owner')!=uid:raise DraftError('Workspace owner mismatch.',403)
    if old and old.get('owner')!=uid:raise DraftError('Draft owner mismatch.',403)
    if require and not old:raise DraftError('Draft not found.',404)
    if expected!=old.get('revision',0):raise DraftError('Revision conflict. Reload before saving; edits were not overwritten.',409,{'currentRevision':old.get('revision',0)})
    return workspace,old


def editable(old):
    if old.get('archived'):raise DraftError('This draft is archived. Restore it from the archive before changing it.',409,{'code':'archived'})


def validation_of(doc, inv, heads):
    """Restored or continued content is stored even when it no longer validates (it is recovery); release
    preparation validates again, so an invalid draft can never be released."""
    try:return validate(doc,inv,heads)
    except DraftError as error:return {'valid':False,'error':error.message,'code':error.details.get('code'),'previewOnly':True}


def write_revision(tx, uid, index, ref, workspace, old, draft_id, doc, validation, action, source, extra=None):
    revision=old.get('revision',0)+1
    if revision>MAX_REVISIONS:
        raise DraftError('Revision limit reached. Continue as a new draft: this draft and its full history are archived, not deleted.',409,{'code':'revision-limit'})
    now=int(time.time());extra=extra or {}
    record={'id':draft_id,'owner':uid,'revision':revision,'document':copy.deepcopy(doc),'validation':validation,'updatedAt':now,'action':action,'source':source,**extra}
    history=[*history_of(old),{'revision':revision,'action':action,'at':now,'inventoryRevision':doc['baseRevision'],**extra}][-MAX_HISTORY:]
    heads={**workspace.get('heads',{}),draft_id:{**summary(doc),'revision':revision}}
    # The index, the head and a create-only immutable revision commit together.
    tx.set(index,{**workspace,'owner':uid,'heads':heads});tx.set(ref,{**record,'history':history});tx.create(revision_ref(ref,revision),record)
    return {**record,'history':history}


def logged(action, uid, record):
    # Who and what, never content: the owner key prefix, draft id and revision.
    log.info('Content draft %s: draft=%s revision=%s owner=%s',action,record['id'],record['revision'],owner_key(uid)[:12])
    return record


def save(db, uid, draft_id, payload, inv):
    keys(payload,['revision','document'],['revision','document']);number(payload['revision'],0,MAX_REVISIONS)
    index,ref=refs(db,uid,draft_id)
    from firebase_admin import firestore
    @firestore.transactional
    def commit(tx):
        workspace,old=opened(tx,uid,index,ref,payload['revision'],require=False);editable(old)
        heads=workspace.get('heads',{})
        if draft_id not in heads and len(heads)>=MAX_DRAFTS:raise DraftError('Workspace draft limit reached. Archive a draft to free a slot.',409,{'code':'draft-limit'})
        doc=payload['document'];result=validate(doc,inv,heads)
        if old and (doc['kind'],doc['sourceKey'],doc['data']['id']) != (old['document']['kind'],old['document']['sourceKey'],old['document']['data']['id']):raise DraftError('Draft identity and source cannot change.',409)
        # Moving to a new source inventory is a reviewed rebase, never a side effect of a save.
        if old and doc['baseRevision']!=old['document']['baseRevision']:raise DraftError('Use Rebase to move this draft to the current source inventory.',409,{'code':'rebase-required'})
        if any(k!=draft_id and v['identity']==doc['data']['id'] and v['kind']==doc['kind'] for k,v in heads.items()):raise DraftError('That content already has a draft; reload its existing draft.',409)
        return write_revision(tx,uid,index,ref,workspace,old,draft_id,doc,result,'save',source_info(doc,inv))
    return logged('save',uid,commit(db.transaction()))


# ---- Rebase: move a draft to a new source inventory without losing either side's changes ----

ABSENT = object()
UNIT_FIELDS = {'mission':['title','description','enabled','objectives','prerequisites','availability','rewards'],
               'dialogue':['title','start','cooldown']}


def units(kind, data):
    """The parts compared and merged separately: mission fields, dialogue fields and each dialogue node by its ID."""
    out={f:data[f] for f in UNIT_FIELDS[kind] if f in data}
    if kind=='dialogue':
        for n in data.get('nodes',[]):out['node:'+n['id']]=n
    return out


def rebuild(kind, merged, ours, theirs):
    data={'id':ours['id'],**{f:merged[f] for f in UNIT_FIELDS[kind] if f in merged}}
    if kind=='dialogue':
        # The draft's node order first, then nodes the source added.
        order=[n['id'] for n in ours['nodes']]+[n['id'] for n in theirs['nodes']];data['nodes']=[]
        for nid in dict.fromkeys(order):
            if 'node:'+nid in merged:data['nodes'].append(merged['node:'+nid])
    return data


def shown(value):
    return None if value is ABSENT else value


def three_way(base, ours, theirs, resolutions):
    """Merge per unit. A part only the source changed takes the source; a part only the draft changed keeps the
    draft; a part both changed differently is a conflict unless the administrator chose a side for it."""
    merged,changes,conflicts={}, [], []
    for key in sorted(set(base)|set(ours)|set(theirs)):
        b,o,t=(x.get(key,ABSENT) for x in (base,ours,theirs))
        if o==t:value,how=o,'same'
        elif o==b:value,how=t,'source'
        elif t==b:value,how=o,'draft'
        elif key in resolutions:value,how=(o,'chose-draft') if resolutions[key]=='draft' else (t,'chose-source')
        else:
            conflicts.append({'unit':key,'base':shown(b),'draft':shown(o),'source':shown(t)});continue
        if value is not ABSENT:merged[key]=value
        if t!=b:
            entry={'unit':key,'base':shown(b),'draft':shown(o),'source':shown(t),'resolution':how,'sourceAdded':b is ABSENT,'sourceRemoved':t is ABSENT}
            changes.append(entry)
            if how.startswith('chose-'):conflicts.append({**entry,'resolvedWith':how[7:]})
    return merged,changes,[c for c in conflicts if 'resolvedWith' not in c],[c for c in conflicts if 'resolvedWith' in c]


def clean_resolutions(value):
    if value is None:return {}
    if not isinstance(value,dict) or len(value)>200:raise DraftError('Resolutions must be a bounded object.')
    for key,side in value.items():
        if not isinstance(key,str) or len(key)>80 or side not in ['draft','source']:raise DraftError('Each resolution chooses draft or source.')
    return value


def rebase_plan(record, inv, heads, resolutions=None):
    """What a rebase would do. Reads only what it is given and writes nothing."""
    resolutions=resolutions or {};doc=record['document'];kind=doc['kind'];before=doc['baseRevision']
    plan={'draftId':record['id'],'draftRevision':record['revision'],'fromInventoryRevision':before,'toInventoryRevision':inv['revision'],
          'changes':[],'conflicts':[],'resolved':[],'archived':bool(record.get('archived')),'writes':0}
    if before==inv['revision']:return {**plan,'status':'current','message':'This draft already uses the current source inventory.'}
    source=record.get('source') or {}
    base=source.get('snapshot') if source.get('inventoryRevision')==before else None
    data=copy.deepcopy(doc['data'])
    if doc['sourceKey']=='new':
        status,message='unrelated','New content has no game source to compare. Rebasing only checks it against the current inventory.'
    else:
        try:theirs=template(kind,doc['sourceKey'],inv)['data']
        except DraftError as error:return {**plan,'status':'invalid','message':'The source this draft is based on is no longer available ('+error.message+'). Nothing was changed.'}
        ours=units(kind,doc['data']);current=units(kind,theirs)
        if base is None:
            # Saved before source snapshots existed: who changed what cannot be told, so every difference is shown
            # and the draft's version is kept unless the administrator takes the source's.
            status,message='manual','This draft predates source snapshots, so the game\'s changes cannot be told apart from your edits. Review every difference; your version is kept unless you choose the source.'
            merged=dict(ours)
            for key in sorted(set(ours)|set(current)):
                o,t=ours.get(key,ABSENT),current.get(key,ABSENT)
                if o==t:continue
                take=resolutions.get(key)=='source'
                plan['changes'].append({'unit':key,'draft':shown(o),'source':shown(t),'resolution':'chose-source' if take else 'keep-draft'})
                if take:
                    if t is ABSENT:merged.pop(key,None)
                    else:merged[key]=t
            data=rebuild(kind,merged,doc['data'],theirs)
        elif digest(base)==digest(theirs):
            status,message='unrelated','Only unrelated game sources changed. This draft\'s source is identical, so its content is kept as it is.'
        else:
            merged,changes,conflicts,resolved=three_way(units(kind,base),ours,current,resolutions)
            plan.update(changes=changes,conflicts=conflicts,resolved=resolved)
            if conflicts:return {**plan,'status':'conflict','message':'The game and this draft changed the same parts. Nothing was changed. Choose the draft or the source version for each conflict, then review again.'}
            status,message='relevant','The source of this content changed. Parts you did not edit take the new source; your edits are kept.'
            data=rebuild(kind,merged,doc['data'],theirs)
    rebased={**copy.deepcopy(doc),'baseRevision':inv['revision'],'data':data}
    try:validation=validate(rebased,inv,{k:v for k,v in heads.items() if k!=record['id']})
    except DraftError as error:return {**plan,'status':'invalid','message':'After rebasing the draft would not validate ('+error.message+'). Nothing was changed.'}
    plan.update(status=status,message=message,document=rebased,validation=validation)
    plan['planDigest']=digest({'draftRevision':record['revision'],'from':before,'to':inv['revision'],'document':rebased})
    return plan


def plan_rebase(db, uid, draft_id, payload, inv):
    keys(payload,['resolutions']);resolutions=clean_resolutions(payload.get('resolutions'))
    record=load(db,uid,draft_id);heads=listing(db,uid)['drafts']
    return rebase_plan(record,inv,{d['id']:d for d in heads},resolutions)


def rebase(db, uid, draft_id, payload, inv):
    keys(payload,['revision','planDigest','confirm','resolutions'],['revision','planDigest','confirm'])
    if payload['confirm'] is not True:raise DraftError('Rebasing needs explicit confirmation.')
    number(payload['revision'],1,MAX_REVISIONS);text(payload['planDigest'],64);resolutions=clean_resolutions(payload.get('resolutions'))
    index,ref=refs(db,uid,draft_id)
    from firebase_admin import firestore
    @firestore.transactional
    def commit(tx):
        workspace,old=opened(tx,uid,index,ref,payload['revision']);editable(old)
        plan=rebase_plan(old,inv,workspace.get('heads',{}),resolutions)
        if plan['status']=='current':raise DraftError(plan['message'],409,{'code':'rebase-current'})
        if plan['status'] not in ['unrelated','relevant','manual']:raise DraftError(plan['message'],409,{'code':'rebase-'+plan['status']})
        # The administrator confirmed one exact result; anything different since then needs a new review.
        if plan['planDigest']!=payload['planDigest']:raise DraftError('The draft or the source changed since this rebase was reviewed. Review it again.',409,{'code':'plan-changed'})
        return write_revision(tx,uid,index,ref,workspace,old,draft_id,plan['document'],plan['validation'],'rebase',source_info(plan['document'],inv),
                              {'rebasedFrom':plan['fromInventoryRevision'],'rebaseStatus':plan['status']})
    return logged('rebase',uid,commit(db.transaction()))


# ---- Revision history, restore and comparison ----

def restore(db, uid, draft_id, payload, inv):
    confirmed(payload,['revision','fromRevision']);number(payload['revision'],1,MAX_REVISIONS);number(payload['fromRevision'],1,MAX_REVISIONS)
    index,ref=refs(db,uid,draft_id)
    from firebase_admin import firestore
    @firestore.transactional
    def commit(tx):
        workspace,old=opened(tx,uid,index,ref,payload['revision']);editable(old)
        if payload['fromRevision']>=old['revision']:raise DraftError('Choose an earlier revision to restore.')
        past=revision_ref(ref,payload['fromRevision']).get(transaction=tx).to_dict()
        if not past:raise DraftError('That revision was not found.',404)
        if past.get('owner')!=uid:raise DraftError('Draft owner mismatch.',403)
        # The historical content becomes a new revision; the current one stays in history unchanged.
        others={k:v for k,v in workspace.get('heads',{}).items() if k!=draft_id}
        return write_revision(tx,uid,index,ref,workspace,old,draft_id,past['document'],validation_of(past['document'],inv,others),'restore',
                              past.get('source'),{'restoredFrom':payload['fromRevision']})
    return logged('restore',uid,commit(db.transaction()))


def compare(db, uid, draft_id, before, after=None):
    a=load(db,uid,draft_id,before);b=load(db,uid,draft_id,after)
    if a['document']['kind']!=b['document']['kind']:raise DraftError('Revisions of one draft share a kind.',409)
    ua,ub=units(a['document']['kind'],a['document']['data']),units(b['document']['kind'],b['document']['data'])
    changes=[{'unit':k,'before':shown(ua.get(k,ABSENT)),'after':shown(ub.get(k,ABSENT))} for k in sorted(set(ua)|set(ub)) if ua.get(k,ABSENT)!=ub.get(k,ABSENT)]
    if a['document']['baseRevision']!=b['document']['baseRevision']:
        changes.insert(0,{'unit':'source inventory','before':a['document']['baseRevision'],'after':b['document']['baseRevision']})
    return {'from':a['revision'],'to':b['revision'],'changes':changes,'writes':0}


# ---- Archive: drafts leave the active list without losing anything ----

def set_archived(db, uid, draft_id, payload, archive):
    confirmed(payload,['revision']);number(payload['revision'],1,MAX_REVISIONS)
    index,ref=refs(db,uid,draft_id)
    from firebase_admin import firestore
    @firestore.transactional
    def commit(tx):
        workspace,old=opened(tx,uid,index,ref,payload['revision'])
        heads,archived=dict(workspace.get('heads',{})),dict(workspace.get('archived',{}));now=int(time.time())
        if archive:
            if old.get('archived') or draft_id not in heads:raise DraftError('This draft is already archived.',409)
            if len(archived)>=MAX_ARCHIVED:raise DraftError('The archive is full ('+str(MAX_ARCHIVED)+' drafts). Export and review it before archiving more.',409,{'code':'archive-limit'})
            archived[draft_id]={**heads.pop(draft_id),'archivedAt':now}
        else:
            if not old.get('archived'):raise DraftError('This draft is not archived.',409)
            if len(heads)>=MAX_DRAFTS:raise DraftError('All '+str(MAX_DRAFTS)+' active draft slots are used. Archive one first.',409,{'code':'draft-limit'})
            doc=old['document']
            if any(v['identity']==doc['data']['id'] and v['kind']==doc['kind'] for v in heads.values()):
                raise DraftError('Another active draft already edits this content. Archive it first.',409)
            entry=archived.pop(draft_id,None) or {**summary(doc),'revision':old['revision']};entry.pop('archivedAt',None);heads[draft_id]=entry
        history=[*history_of(old),{'revision':old['revision'],'action':'archive' if archive else 'unarchive','at':now}][-MAX_HISTORY:]
        head={**old,'archived':archive,'archivedAt':now if archive else None,'history':history}
        tx.set(index,{**workspace,'owner':uid,'heads':heads,'archived':archived});tx.set(ref,head)
        return head
    return logged('archive' if archive else 'unarchive',uid,commit(db.transaction()))


def continue_as_new(db, uid, draft_id, payload, inv):
    """At the revision limit: archive this draft (history kept) and carry its content on in a new draft."""
    confirmed(payload,['revision','newId']);number(payload['revision'],1,MAX_REVISIONS)
    if payload['newId']==draft_id:raise DraftError('Choose a new draft ID.')
    index,ref=refs(db,uid,draft_id);_,new_ref=refs(db,uid,payload['newId'])
    from firebase_admin import firestore
    @firestore.transactional
    def commit(tx):
        workspace,old=opened(tx,uid,index,ref,payload['revision']);editable(old)
        if new_ref.get(transaction=tx).to_dict():raise DraftError('That draft ID is already used.',409)
        heads,archived=dict(workspace.get('heads',{})),dict(workspace.get('archived',{}));now=int(time.time())
        if payload['newId'] in heads or payload['newId'] in archived:raise DraftError('That draft ID is already used.',409)
        if draft_id not in heads:raise DraftError('Only an active draft can be continued.',409)
        if len(archived)>=MAX_ARCHIVED:raise DraftError('The archive is full. Export and review it first.',409,{'code':'archive-limit'})
        archived[draft_id]={**heads.pop(draft_id),'archivedAt':now}
        doc=old['document'];link={'id':draft_id,'revision':old['revision']}
        record={'id':payload['newId'],'owner':uid,'revision':1,'document':copy.deepcopy(doc),'validation':validation_of(doc,inv,heads),
                'updatedAt':now,'action':'continue','source':old.get('source'),'continuedFrom':link}
        heads[payload['newId']]={**summary(doc),'revision':1}
        tx.set(index,{**workspace,'owner':uid,'heads':heads,'archived':archived})
        tx.set(ref,{**old,'archived':True,'archivedAt':now,'history':[*history_of(old),{'revision':old['revision'],'action':'archive','at':now,'continuedAs':payload['newId']}][-MAX_HISTORY:]})
        tx.set(new_ref,{**record,'history':[{'revision':1,'action':'continue','at':now,'inventoryRevision':doc['baseRevision'],'continuedFrom':link}]})
        tx.create(revision_ref(new_ref,1),record)
        return record
    return logged('continue',uid,commit(db.transaction()))


# ---- Export: a portable private copy for the administrator's own computer ----

def exported(record, uid):
    if record.get('owner')!=uid:raise DraftError('Draft owner mismatch.',403)
    return {**copy.deepcopy(record),'owner':owner_key(uid)}


def export(db, uid, inv, include_history=True):
    """Every draft (active and archived), and with include_history every immutable revision. Reads at most
    1 + drafts + revisions documents; nothing outside the vr_content_* draft collections is read."""
    index,_=refs(db,uid,'index');workspace=index.get().to_dict() or {}
    if workspace and workspace.get('owner')!=uid:raise DraftError('Workspace owner mismatch.',403)
    entries=[(k,False) for k in workspace.get('heads',{})]+[(k,True) for k in workspace.get('archived',{})]
    out=[]
    for draft_id,archived in sorted(entries):
        _,ref=refs(db,uid,draft_id);head=ref.get().to_dict()
        if not head:out.append({'id':draft_id,'archived':archived,'missing':True});continue
        revisions=[]
        if include_history:
            for n in range(1,head['revision']+1):
                past=revision_ref(ref,n).get().to_dict()
                revisions.append(exported(past,uid) if past else {'revision':n,'missing':True})
        out.append({'id':draft_id,'archived':archived,'head':{**exported(head,uid),'history':history_of(head)},'revisions':revisions})
    body={'format':EXPORT_FORMAT,'formatVersion':EXPORT_VERSION,'exportedAt':int(time.time()),'draftSchemaVersion':1,
          'sourceInventoryRevision':inv['revision'],'owner':owner_key(uid),'includes':'all-revisions' if include_history else 'heads-only',
          'counts':{'active':sum(not a for _,a in entries),'archived':sum(a for _,a in entries),'revisions':sum(len(d.get('revisions',[])) for d in out)},
          'drafts':out}
    result={**body,'integrity':{'algorithm':'sha256','canonicalization':'JSON with sorted keys, no whitespace, ASCII escapes; integrity field excluded','digest':digest(body)}}
    verify_export(result)
    return result


def verify_export(data):
    """Check an export's format, structure and digest without contacting any service. Returns a summary and the
    problems found; raises DraftError when the file is not a trustworthy export."""
    if not isinstance(data,dict) or data.get('format')!=EXPORT_FORMAT or data.get('formatVersion')!=EXPORT_VERSION:raise DraftError('Not a VOID//RUNNER draft export.')
    integrity=data.get('integrity') or {};body={k:v for k,v in data.items() if k!='integrity'}
    if integrity.get('algorithm')!='sha256' or integrity.get('digest')!=digest(body):raise DraftError('Export integrity check failed: the file was changed or is incomplete.')
    if not isinstance(data.get('drafts'),list):raise DraftError('Export has no draft list.')
    problems=[];revisions=0
    for d in data['drafts']:
        identifier(d.get('id'))
        if d.get('missing'):problems.append(d['id']+': head record missing');continue
        head=d.get('head') or {}
        if head.get('owner')!=data['owner'] or not isinstance(head.get('document'),dict) or head['document'].get('schemaVersion')!=1:raise DraftError(d['id']+': malformed head record.')
        if data['includes']=='all-revisions':
            numbers=[r.get('revision') for r in d.get('revisions',[])]
            if numbers!=list(range(1,head.get('revision',0)+1)):raise DraftError(d['id']+': revisions are not complete and in order.')
            for r in d['revisions']:
                if r.get('missing'):problems.append(d['id']+': revision '+str(r['revision'])+' missing')
                elif r.get('owner')!=data['owner'] or not isinstance(r.get('document'),dict):raise DraftError(d['id']+': malformed revision.')
                else:revisions+=1
    return {'valid':True,'drafts':len(data['drafts']),'revisions':revisions,'problems':problems,'digest':integrity['digest']}
