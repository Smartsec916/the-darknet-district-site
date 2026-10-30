"""Stage 3C private release ledger. No gameplay endpoint reads this collection.

A candidate is a validated immutable package, not an activated game publication.
Activation adapters and a separately reviewed publisher grant remain required.
"""
import copy
import hashlib
import json
import os
import time
import void_runner_drafts as drafts

MAX_RELEASES = 100
MAX_PACKAGE_BYTES = 256 * 1024


def roles(uid, allowed):
    owner = os.getenv('VOID_CONTENT_PUBLISHER_UID', '').strip()
    return {'publisher': bool(owner and uid == owner and allowed(uid) and
                              uid == os.getenv('VOID_CONTENT_EDITOR_UID', '').strip()),
            'releasePreparationEnabled': os.getenv('VOID_CONTENT_RELEASES_ENABLED') == 'true',
            'liveActivationImplemented': False}


def authorize(uid, allowed, write=False):
    drafts.editor(uid, allowed)
    if os.getenv('VOID_CONTENT_RELEASES_ENABLED') != 'true':
        raise drafts.DraftError('Release preparation is disabled pending review.', 503)
    if write and not roles(uid, allowed)['publisher']:
        raise drafts.DraftError('A separate, explicit publisher authorization is required.', 403)


def refs(db, uid, revision=None):
    owner = hashlib.sha256(uid.encode()).hexdigest()
    state = db.collection('vr_content_release_workspaces').document(owner)
    if revision is None:
        return state, None
    drafts.number(revision, 1, MAX_RELEASES)
    return state, db.collection('vr_content_releases').document(owner + '_' + str(revision))


def owned(record, uid):
    if record and record.get('owner') != uid:
        raise drafts.DraftError('Release owner mismatch.', 403)
    return record or {}


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(',', ':'))


def comparison(old, new, path='$'):
    """Bounded typed JSON differences; never HTML, code, or an executable patch."""
    if type(old) is type(new) and isinstance(old, dict):
        out = []
        for key in sorted(set(old) | set(new)):
            out.extend(comparison(old.get(key), new.get(key), path + '.' + key))
        return out
    if old == new:
        return []
    return [{'path': path, 'before': old, 'after': new}]


def inspect_package(documents, inv):
    if not isinstance(documents, dict) or len(documents) > drafts.MAX_DRAFTS:
        raise drafts.DraftError('Invalid release package.')
    if len(canonical(documents).encode()) > MAX_PACKAGE_BYTES:
        raise drafts.DraftError('Release package exceeds bounded storage limit.', 413)
    graph = {key: drafts.summary(doc) for key, doc in documents.items()}
    identities = set()
    for doc in documents.values():
        result = drafts.validate(doc, inv, graph)
        identity = (doc['kind'], doc['data']['id'])
        if identity in identities:
            raise drafts.DraftError('Duplicate release content identity.')
        identities.add(identity)
        # Warnings acceptable in a draft are hard gates before a release can be prepared.
        informational = {'Draft only. No live content or save has been changed.', 'Runtime completion/availability wrappers remain authoritative; this overlay is not activated.', 'Approved source text and voice identity are unchanged. This is an unpublished proposal.'}
        blockers = [w for w in result['warnings'] if w not in informational]
        if blockers:
            raise drafts.DraftError('Save compatibility review required.', 422, {'warnings': blockers})
        if doc['sourceKey'] == 'new' or 'duplicateOf' in doc:
            raise drafts.DraftError('New identities require a native engine/save adapter before release.', 422)
        baseline = drafts.template(doc['kind'], doc['sourceKey'], inv)
        if doc['kind'] == 'dialogue':
            before = {n['id']: n for n in baseline['data']['nodes']}
            after = {n['id']: n for n in doc['data']['nodes']}
            if not set(before) <= set(after):
                raise drafts.DraftError('Existing story cursor nodes cannot be removed.', 422)
            for key, node in before.items():
                if after[key]['character'] != node['character'] or after[key]['voice'] != node['voice']:
                    raise drafts.DraftError('Existing character and voice identities are locked.', 422)
    return {'valid': True, 'sourceRevision': inv['revision'], 'documents': len(documents),
            'liveActivationImplemented': False,
            'digest': hashlib.sha256(canonical(documents).encode()).hexdigest()}


def history(db, uid):
    state, _ = refs(db, uid)
    data = owned(state.get().to_dict(), uid)
    return {'revision': data.get('revision', 0), 'candidateRevision': data.get('candidateRevision', 0),
            'history': data.get('history', []), 'liveActivationImplemented': False}


def load(db, uid, revision):
    _, ref = refs(db, uid, revision)
    record = owned(ref.get().to_dict(), uid)
    if not record:
        raise drafts.DraftError('Release revision not found.', 404)
    return record


def request_payload(payload, rollback=False):
    allowed = ['expectedRevision', 'targetRevision', 'reason'] if rollback else ['expectedRevision', 'drafts', 'reason']
    drafts.keys(payload, allowed, allowed)
    drafts.number(payload['expectedRevision'], 0, MAX_RELEASES)
    drafts.text(payload['reason'], 500)
    if len(payload['reason'].strip()) < 8:
        raise drafts.DraftError('A meaningful audit reason is required.')
    if rollback:
        drafts.number(payload['targetRevision'], 1, MAX_RELEASES)
    else:
        if not isinstance(payload['drafts'], list) or not 1 <= len(payload['drafts']) <= drafts.MAX_DRAFTS:
            raise drafts.DraftError('Select a bounded nonempty set of saved drafts.')
        seen = set()
        for item in payload['drafts']:
            drafts.keys(item, ['id', 'revision'], ['id', 'revision'])
            drafts.identifier(item['id']); drafts.number(item['revision'], 1, drafts.MAX_REVISIONS)
            if item['id'] in seen:
                raise drafts.DraftError('Duplicate draft selection.')
            seen.add(item['id'])


def prepare(db, uid, payload, inv, rollback=False, plan=False):
    request_payload(payload, rollback)
    state_ref, _ = refs(db, uid)
    from firebase_admin import firestore

    @firestore.transactional
    def commit(tx):
        state = owned(state_ref.get(transaction=tx).to_dict(), uid)
        sequence = state.get('revision', 0)
        if payload['expectedRevision'] != sequence:
            raise drafts.DraftError('Release revision conflict; reload and compare before retrying.', 409,
                                    {'currentRevision': sequence})
        if sequence >= MAX_RELEASES:
            raise drafts.DraftError('Release history limit reached; retention needs review.', 409)
        previous = {}
        if state.get('candidateRevision'):
            _, previous_ref = refs(db, uid, state['candidateRevision'])
            previous = owned(previous_ref.get(transaction=tx).to_dict(), uid)
            if not previous:
                raise drafts.DraftError('Release pointer is invalid.', 409)
        documents = copy.deepcopy(previous.get('documents', {}))
        sources = []
        if rollback:
            _, target_ref = refs(db, uid, payload['targetRevision'])
            target = owned(target_ref.get(transaction=tx).to_dict(), uid)
            if not target:
                raise drafts.DraftError('Rollback target not found.', 404)
            documents = copy.deepcopy(target['documents'])
        else:
            for selection in payload['drafts']:
                _, ref = drafts.refs(db, uid, selection['id'])
                record = owned(ref.get(transaction=tx).to_dict(), uid)
                if not record or record['revision'] != selection['revision']:
                    raise drafts.DraftError('Selected draft changed; compare its latest revision.', 409)
                doc = copy.deepcopy(record['document'])
                documents[doc['kind'] + ':' + doc['data']['id']] = doc
                sources.append(copy.deepcopy(selection))
        validation = inspect_package(documents, inv)
        revision = sequence + 1
        _, release_ref = refs(db, uid, revision)
        audit = {'revision': revision, 'action': 'rollback-candidate' if rollback else 'prepare-candidate',
                 'actor': uid, 'reason': payload['reason'].strip(), 'at': int(time.time()),
                 'parentRevision': state.get('candidateRevision', 0),
                 'rollbackTarget': payload.get('targetRevision'), 'digest': validation['digest']}
        record = {'owner': uid, **audit, 'documents': documents, 'drafts': sources,
                  'validation': validation, 'status': 'private-candidate', 'baseRevision': inv['revision']}
        if plan:
            return {'validation': validation, 'diff': comparison(previous.get('documents', {}), documents), 'expectedRevision': sequence, 'writes': 0, 'liveActivationImplemented': False}
        # Both immutable content/audit and candidate pointer commit together. No player data writes.
        tx.create(release_ref, record)
        tx.set(state_ref, {'owner': uid, 'revision': revision, 'candidateRevision': revision,
                           'history': [*state.get('history', []), audit]})
        return record
    return commit(db.transaction())