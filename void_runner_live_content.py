"""Published mission content and the re-voice queue for the Mission Editor (Developer Tools > Mission Editor).

PUBLISH TO ALL PLAYERS is OFF unless VOID_CONTENT_PUBLISH_ENABLED is 'true'. Only the configured content editor may publish: a verified Firebase identity, on the
VOID_ADMIN_UIDS allowlist, equal to VOID_CONTENT_EDITOR_UID (the same checks as the Stage 3B private drafts). No email, browser flag or save field grants it.
Every publish and every undo writes a NEW immutable version (create-only document) and moves one pointer in the same transaction; nothing is ever overwritten.
Players read only the live version (GET /live-content, public, cached for a minute). The game applies it with void-runner/mission-content.js and falls back to
the shipped missions when this is off, unreachable or refused by the client's own check. Content is validated here with the same closed rules as the client.

RE-VOICE queue: owner only, and off unless VOID_CONTENT_DRAFTS_ENABLED is 'true' (it is private owner storage, like drafts). Nothing is generated here or in a
browser: David records queued Kokoro lines on his PC (python tools/audio/generate.py --from-queue); ElevenLabs lines wait for his approval of the spend.
"""
import hashlib
import json
import os
import re
import time
from pathlib import Path

from void_runner_drafts import DraftError, editor_uid

ROOT = Path(__file__).parent
MAX_BYTES = 200_000
MAX_HISTORY = 200
MAX_QUEUE = 500
CACHE_SECONDS = 60
STATE = ('vr_live_content_state', 'current')
VERSIONS = 'vr_live_content_versions'
QUEUE = 'vr_revoice_queue'
FORMAT = 'darknet-district-mission-content'
EVENTS = ['v1-open', 'keymap-seen', 'talk-admin', 'talk-iris', 'visit-bar', 'visit-shop', 'use-terminal', 'board-ship', 'launch', 'warp-meridian', 'dock-meridian']
TYPES = ['main', 'side', 'cargo', 'campaign', 'tutorial', 'bounty', 'station']
SPEAKERS = ['Admin', 'Iris', 'Landing terminal', 'You', 'Bartender']
DESTINATIONS = ['earth', 'meridian']
TALK_FILES = ['faction-scenes.js', 'homeworld-scenes.js', 'prologue-integration.js', 'scenes.js', 'world-integration.js', 'hangar.js', 'story-content.js', 'milked.js']
ID = re.compile(r'^[a-z][a-z0-9-]{0,79}$')
WHO = re.compile(r'^[a-z][a-z0-9-]{0,40}$')
TAGS = re.compile(r'<[^>]*>|[\x00-\x08\x0b\x0c\x0e-\x1f]')
_cache = {'at': 0.0, 'value': None}


def _json(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def registry():
    return _json('tools/audio/npc-voice-registry.json')


def engines():
    return _json('tools/audio/revoice-engines.json')['characters']


def enabled():
    return os.getenv('VOID_CONTENT_PUBLISH_ENABLED') == 'true'


def owner(uid, allowed, need=None):
    """The single configured content editor. need: 'publish' (publishing switched on) or 'queue' (private storage switched on)."""
    editor = editor_uid()
    if not allowed(uid) or not editor or uid != editor:
        raise DraftError('This account is not the configured content editor.', 403)
    if need == 'publish' and not enabled():
        raise DraftError('Publishing to all players is switched off on the server.', 404)
    if need == 'queue' and os.getenv('VOID_CONTENT_DRAFTS_ENABLED') != 'true':
        raise DraftError('The re-voice queue is switched off on the server.', 404)


def _plain(value, limit):
    return isinstance(value, str) and value.strip() != '' and len(value) <= limit and not TAGS.search(value)


def _keys(value, allowed):
    return isinstance(value, dict) and all(k in allowed for k in value)


def _source_lines():
    texts = []
    for name in TALK_FILES:
        try:
            texts.append((ROOT / 'void-runner' / name).read_text(encoding='utf-8'))
        except OSError:
            pass
    return '\n'.join(texts)


def check(content, inv=None):
    """The same closed rules as void-runner/mission-content.js check(). Returns a list of problems in plain words (empty = valid)."""
    errors = []
    err = errors.append
    if not _keys(content, ['format', 'version', 'beginner', 'registry', 'lines', 'note']):
        return ['The content record has an unknown shape.']
    if content.get('format') != FORMAT or content.get('version') != 1 or type(content.get('version')) is not int:
        err('Unknown content format or version.')
    if len(json.dumps(content).encode('utf-8')) > MAX_BYTES:
        err('The content is too large.')
    note = content.get('note')
    if note is not None and not (isinstance(note, str) and len(note) <= 500 and not TAGS.search(note)):
        err('The change note must be plain text.')
    reg = registry()
    speakers = set(SPEAKERS) | {n['displayName'] for n in reg['npcs'].values()}
    beginner = content.get('beginner')
    if beginner is not None:
        if not isinstance(beginner, list) or not 1 <= len(beginner) <= 40:
            err('The beginner campaign needs between 1 and 40 missions.')
        else:
            ids = set()
            for m in beginner:
                w = m.get('id', '(no id)') if isinstance(m, dict) else '(no id)'
                if not _keys(m, ['id', 'title', 'type', 'giver', 'description', 'destination', 'rewards', 'prerequisites', 'objectives']):
                    err(w + ': unknown fields in a mission.')
                    continue
                if not isinstance(m.get('id'), str) or not ID.match(m['id']):
                    err(w + ': bad mission id.')
                if m.get('id') in ids:
                    err(w + ': duplicate mission id.')
                ids.add(m.get('id'))
                if not _plain(m.get('title'), 60):
                    err(w + ': a title is required.')
                if m.get('type') not in TYPES:
                    err(w + ': unknown mission type.')
                if m.get('giver') is not None and m['giver'] not in speakers:
                    err(w + ': unknown giver.')
                d = m.get('description')
                if d is not None and not (isinstance(d, str) and len(d) <= 600 and not TAGS.search(d)):
                    err(w + ': the description must be plain text.')
                if m.get('destination') is not None and m['destination'] not in DESTINATIONS:
                    err(w + ': unknown location.')
                r = m.get('rewards')
                if r is not None and not (type(r) is int and 0 <= r <= 100000):
                    err(w + ': credits must be a whole number between 0 and 100000.')
                pre = m.get('prerequisites')
                if pre is not None and not (isinstance(pre, list) and all(isinstance(p, str) and ID.match(p) for p in pre)):
                    err(w + ': prerequisites must be mission ids.')
                objs = m.get('objectives')
                if not isinstance(objs, list) or not 1 <= len(objs) <= 20:
                    err(w + ': a mission needs 1 to 20 steps.')
                    continue
                oids = set()
                for o in objs:
                    ow = w + ' / ' + str(o.get('id') if isinstance(o, dict) else '?')
                    if not _keys(o, ['id', 'label', 'on', 'requires', 'interaction', 'destination', 'award', 'say', 'early']):
                        err(ow + ': unknown fields in a step.')
                        continue
                    if not isinstance(o.get('id'), str) or not ID.match(o['id']) or o['id'] in oids:
                        err(ow + ': bad or duplicate step id.')
                    oids.add(o.get('id'))
                    if not _plain(o.get('label'), 500):
                        err(ow + ': the step needs a label.')
                    if o.get('on') not in EVENTS:
                        err(ow + ': nothing in the game can complete this step.')
                    req = o.get('requires')
                    if req is not None and not (isinstance(req, list) and all(isinstance(x, str) and ID.match(x) for x in req)):
                        err(ow + ': "requires" must list step ids.')
                    if o.get('interaction') is not None and not (isinstance(o['interaction'], str) and re.match(r'^[a-z][a-z0-9-]{0,60}$', o['interaction'])):
                        err(ow + ': unknown place.')
                    if o.get('destination') is not None and o['destination'] not in DESTINATIONS:
                        err(ow + ': unknown location.')
                    if o.get('award') is not None and o['award'] != 'ship':
                        err(ow + ': the only award at a step is the ship.')
                    for k in ['say', 'early']:
                        ls = o.get(k)
                        if ls is None:
                            continue
                        if not isinstance(ls, list) or len(ls) > 12:
                            err(ow + ': too many lines.')
                            continue
                        for line in ls:
                            if not _keys(line, ['who', 'text']) or not _plain(line.get('text'), 500):
                                err(ow + ': a line must be plain text.')
                            elif line.get('who') not in speakers:
                                err(ow + ': unknown speaker.')
                for o in objs:
                    for r2 in (o.get('requires') or []) if isinstance(o, dict) else []:
                        if r2 not in oids:
                            err(w + ': requires a step that does not exist.')

                def loops(i, seen):
                    if i in seen:
                        return True
                    o = next((x for x in objs if isinstance(x, dict) and x.get('id') == i), None)
                    return bool(o) and any(loops(r3, seen | {i}) for r3 in (o.get('requires') or []))
                if any(isinstance(o, dict) and loops(o.get('id'), set()) for o in objs):
                    err(w + ': steps loop back on themselves.')
            by = {m.get('id'): m for m in beginner if isinstance(m, dict)}
            for m in by.values():
                for p in m.get('prerequisites') or []:
                    if p not in by:
                        err(str(m.get('id')) + ': prerequisite does not exist.')

            def cycle(i, seen):
                if i in seen:
                    return True
                m = by.get(i)
                return bool(m) and any(cycle(p, seen | {i}) for p in (m.get('prerequisites') or []))
            if any(cycle(i, set()) for i in by):
                err('Mission prerequisites form a loop.')
            if len([m for m in by.values() if not m.get('prerequisites')]) != 1:
                err('Exactly one beginner mission must be able to start first.')
    regs = content.get('registry')
    if regs is not None:
        inv = inv or _json('void_runner_admin_inventory.json')
        known = {m['id']: {o['id'] for o in m.get('objectives', [])} for m in inv['missions'] if m.get('engine') == 'mission registry'}
        if not isinstance(regs, dict) or len(regs) > 60:
            err('Registry edits have an unknown shape.')
        else:
            for mid, e in regs.items():
                if mid not in known:
                    err('"%s" is not an existing registry mission.' % mid)
                    continue
                if not _keys(e, ['title', 'description', 'objectives']):
                    err(mid + ': unknown fields.')
                    continue
                if e.get('title') is not None and not _plain(e['title'], 60):
                    err(mid + ': the title must be plain text.')
                if e.get('description') is not None and not (isinstance(e['description'], str) and len(e['description']) <= 600 and not TAGS.search(e['description'])):
                    err(mid + ': the description must be plain text.')
                for oid, label in (e.get('objectives') or {}).items() if isinstance(e.get('objectives') or {}, dict) else [(None, None)]:
                    if oid not in known[mid] or not _plain(label, 500):
                        err(mid + ': bad step label.')
    lines = content.get('lines')
    if lines is not None:
        if not isinstance(lines, list) or len(lines) > 600:
            err('Line edits have an unknown shape.')
        else:
            text, seen = _source_lines(), set()
            for line in lines:
                if not _keys(line, ['who', 'from', 'to']) or not isinstance(line.get('who'), str) or not WHO.match(line['who']) or not _plain(line.get('from'), 500) or not _plain(line.get('to'), 500):
                    err('A changed line must name a speaker and be plain text.')
                    continue
                if line['who'] == 'player':
                    err('The player\'s own lines are not changed here.')
                key = line['who'] + '|' + line['from']
                if key in seen:
                    err('The same line is changed twice.')
                seen.add(key)
                if line['from'] not in text and line['from'].replace("'", "\\'") not in text:
                    err('"%s..." is not a line the game shows.' % line['from'][:40])
    return errors


# ---------------------------------------------------------------- versions
def _state_ref(db):
    return db.collection(STATE[0]).document(STATE[1])


def _version_ref(db, n):
    return db.collection(VERSIONS).document('v%d' % n)


def summary(db):
    state = _state_ref(db).get().to_dict() or {}
    return {'enabled': enabled(), 'editor': True, 'version': state.get('live', 0), 'publishedAt': state.get('at'), 'history': state.get('history', [])}


def public(db, now=None):
    now = now or time.time()
    if _cache['value'] is not None and now - _cache['at'] < CACHE_SECONDS:
        return _cache['value']
    state = _state_ref(db).get().to_dict() or {}
    live = state.get('live', 0)
    value = {'version': 0, 'content': None}
    if live:
        record = _version_ref(db, live).get().to_dict() or {}
        if record.get('content') is not None and not check(record['content']):
            value = {'version': live, 'content': record['content'], 'publishedAt': record.get('at')}
        else:
            value = {'version': live, 'content': None, 'publishedAt': record.get('at')}
    _cache.update(at=now, value=value)
    return value


def clear_cache():
    _cache.update(at=0.0, value=None)


def _expected(payload):
    if not isinstance(payload, dict) or type(payload.get('expected')) is not int or payload['expected'] < 0:
        raise DraftError('Say which version you expect to replace.')
    return payload['expected']


def _commit(db, uid, expected, action, content_for, note=''):
    from firebase_admin import firestore
    owner_tag = hashlib.sha256(uid.encode()).hexdigest()[:12]

    @firestore.transactional
    def commit(tx):
        state = _state_ref(db).get(transaction=tx).to_dict() or {}
        live, history = state.get('live', 0), list(state.get('history', []))
        if live != expected:
            raise DraftError('Someone published in the meantime (version %d is live). Reload and check again.' % live, 409, {'code': 'version-conflict', 'live': live})
        if len(history) >= MAX_HISTORY:
            raise DraftError('The version history is full.', 409)
        nxt = (history[-1]['version'] if history else 0) + 1
        content, source = content_for(tx, live, history)
        at = int(time.time())
        record = {'version': nxt, 'action': action, 'from': source, 'content': content, 'at': at, 'by': owner_tag, 'note': note}
        tx.create(_version_ref(db, nxt), record)
        history.append({'version': nxt, 'at': at, 'action': action, 'from': source, 'note': note})
        tx.set(_state_ref(db), {'live': nxt, 'at': at, 'history': history})
        return record
    result = commit(db.transaction())
    clear_cache()
    return result


def publish(db, uid, payload):
    expected = _expected(payload)
    if not _keys(payload, ['expected', 'content']):
        raise DraftError('Unknown fields.')
    content = payload.get('content')
    problems = check(content)
    if problems:
        raise DraftError('The draft has problems: ' + '; '.join(problems[:5]), 422, {'problems': problems})
    if not (content.get('beginner') or content.get('registry') or content.get('lines')):
        raise DraftError('There is nothing to publish.', 422)
    note = (content.get('note') or '')[:200]
    return _commit(db, uid, expected, 'publish', lambda tx, live, history: (content, None), note)


def rollback(db, uid, payload):
    """UNDO: a new version carrying the content of the version that was live before the current one (or the shipped missions: content None)."""
    expected = _expected(payload)
    if not _keys(payload, ['expected', 'target']):
        raise DraftError('Unknown fields.')
    target = payload.get('target')
    if target is not None and (type(target) is not int or target < 0):
        raise DraftError('Choose a published version.')

    def content_for(tx, live, history):
        if not live:
            raise DraftError('Nothing is published, so there is nothing to undo.', 409)
        goal = target
        if goal is None:
            ordered = [h['version'] for h in history]
            i = ordered.index(live) if live in ordered else len(ordered)
            goal = ordered[i - 1] if i > 0 else 0
        if goal == 0:
            return None, 0
        record = _version_ref(db, goal).get(transaction=tx).to_dict()
        if not record:
            raise DraftError('That version does not exist.', 404)
        if record.get('content') is not None and check(record['content']):
            raise DraftError('That version no longer passes the checks against the current game.', 422)
        return record.get('content'), goal
    return _commit(db, uid, expected, 'rollback', content_for, 'Undo')


def load(db, n):
    record = _version_ref(db, n).get().to_dict()
    if not record:
        raise DraftError('That version does not exist.', 404)
    return record


# ---------------------------------------------------------------- re-voice queue
def _queue_ref(db, uid):
    return db.collection(QUEUE).document(hashlib.sha256(uid.encode()).hexdigest())


def item_id(who, text):
    """The same id tools/audio/extract-lines.cjs gives a clip: speaker + sha1(speaker|text)[:10]."""
    return who + '-' + hashlib.sha1((who + '|' + text).encode('utf-8')).hexdigest()[:10]


def queue_list(db, uid):
    data = _queue_ref(db, uid).get().to_dict() or {}
    items = sorted(data.get('items', {}).values(), key=lambda x: x.get('at', 0))
    return {'items': items}


def queue_add(db, uid, payload):
    if not _keys(payload, ['items']) or not isinstance(payload.get('items'), list) or not 1 <= len(payload['items']) <= 200:
        raise DraftError('Send 1 to 200 lines.')
    reg, eng = registry(), engines()
    npcs = reg['npcs']
    clean = []
    for it in payload['items']:
        if not _keys(it, ['ref', 'who', 'text', 'from', 'mission', 'source']):
            raise DraftError('Unknown fields in a re-voice item.')
        who, text = it.get('who'), it.get('text')
        if not isinstance(who, str) or who not in npcs:
            raise DraftError('Only characters in the voice registry can be re-voiced (broadcast voices and the reserved slot cannot).', 422)
        if not _plain(text, 500):
            raise DraftError('A line must be plain text, 500 characters at most.')
        extra = {k: str(it.get(k) or '')[:200] for k in ['ref', 'from', 'mission', 'source'] if not TAGS.search(str(it.get(k) or ''))}
        e = eng.get(who) or {'engine': 'kokoro'}
        rec = {'id': item_id(who, text), 'who': who, 'text': text, 'engine': e['engine'], 'status': 'queued', 'at': int(time.time()), **extra}
        if e['engine'] == 'elevenlabs':
            rec.update(voice=e.get('voice', ''), voiceId=e.get('voiceId', ''), waiting='waiting for ElevenLabs re-voice (needs approval)')
        else:
            rec['voice'] = npcs[who]['voice']
        clean.append(rec)
    from firebase_admin import firestore
    ref = _queue_ref(db, uid)

    @firestore.transactional
    def commit(tx):
        data = ref.get(transaction=tx).to_dict() or {}
        items = dict(data.get('items', {}))
        for rec in clean:
            old = items.get(rec['id'])
            if old and old.get('status') == 'done':
                continue
            items[rec['id']] = rec
        if len(items) > MAX_QUEUE:
            raise DraftError('The re-voice queue is full. Record or clear the queued lines first.', 409)
        tx.set(ref, {'items': items})
        return {'items': sorted(items.values(), key=lambda x: x.get('at', 0))}
    return commit(db.transaction())


def queue_done(db, uid, payload):
    if not _keys(payload, ['ids']) or not isinstance(payload.get('ids'), list) or not 1 <= len(payload['ids']) <= 500 or not all(isinstance(i, str) for i in payload['ids']):
        raise DraftError('Send the ids of the recorded lines.')
    from firebase_admin import firestore
    ref = _queue_ref(db, uid)

    @firestore.transactional
    def commit(tx):
        data = ref.get(transaction=tx).to_dict() or {}
        items = dict(data.get('items', {}))
        for i in payload['ids']:
            if i in items and items[i].get('engine') == 'kokoro':
                items[i] = {**items[i], 'status': 'done', 'doneAt': int(time.time())}
        tx.set(ref, {'items': items})
        return {'items': sorted(items.values(), key=lambda x: x.get('at', 0))}
    return commit(db.transaction())
