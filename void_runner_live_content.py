"""Published mission content and the re-voice queue for the Mission Editor (Developer Tools > Mission Editor).

PUBLISH TO ALL PLAYERS is OFF unless VOID_CONTENT_PUBLISH_ENABLED is 'true'. Only the configured content editor may publish: a verified Firebase identity, on the
VOID_ADMIN_UIDS allowlist, equal to VOID_CONTENT_EDITOR_UID (the same checks as the Stage 3B private drafts). No email, browser flag or save field grants it.
Every publish and every undo writes a NEW immutable version (create-only document) and moves one pointer in the same transaction; nothing is ever overwritten.
Players read only the live version (GET /live-content, public, cached for a minute). The game applies it with void-runner/mission-content.js and falls back to
the shipped missions when this is off, unreachable or refused by the client's own check. Content is validated here with the same closed rules as the client.

RE-VOICE queue: owner only, and off unless VOID_CONTENT_DRAFTS_ENABLED is 'true' (it is private owner storage, like drafts). Nothing is generated here or in a
browser: the owner records queued Kokoro lines on his PC (python tools/audio/generate.py --from-queue); ElevenLabs lines wait for his approval of the spend.

MISSION NUMBERS (17 Nov 2026): every tree mission may carry a number (1-999, shown "Mission 001 - Name"); the main storyline's must. Numbers are unique and never
reused: void-runner/save-manifest.json missionNumbers is the shipped ledger, and every publish adds its numbers to the ledger kept on the state document
(`numbers`), so a number once published can never be given to another mission id, even after that mission is removed.
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


PHOTO_SUBJECTS = 6  # at most this many people required in one photo (mission-content.js LIMIT.subjects)


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
    if not _keys(content, ['format', 'version', 'beginner', 'registry', 'lines', 'note', 'trees', 'names', 'npcs', 'voices', 'looks']):
        return ['The content record has an unknown shape.']
    if content.get('npcs') is not None:
        for p in npc_problems(content['npcs'], inv or _json('void_runner_admin_inventory.json')):
            err(p)
    if content.get('looks') is not None:
        for p in look_problems(content['looks'], inv or _json('void_runner_admin_inventory.json')):
            err(p)
    if content.get('voices') is not None:
        for p in voice_problems(content['voices'], inv or _json('void_runner_admin_inventory.json')):
            err(p)
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
    names = content.get('names')
    if names is not None:
        if not isinstance(names, dict) or len(names) > 60:
            err('Tree names have an unknown shape.')
        else:
            for tid, name in names.items():
                if not isinstance(tid, str) or not ID.match(tid) or not _plain(name, 60):
                    err('A tree name must be plain text (60 characters at most).')
    trees = content.get('trees')
    if trees is not None:
        check_trees(trees, inv or _json('void_runner_admin_inventory.json'), err)
    return errors


DRAFT = re.compile(r'^draft-[a-z0-9][a-z0-9-]{0,53}$')
STORY_MISSION = re.compile(r'^(m\d{3}-[a-z0-9][a-z0-9-]{0,50}|main-storyline-m\d{1,3})$')
HOW = ['person', 'notification']
CHANNELS = ['messages', 'comms', 'notify']
WHEN = ['pod-exit', 'after-mission', 'place', 'leave', 'flag', 'game-time', 'near']
NEAR_MIN, NEAR_MAX = 1, 30
VIA = ['talk', 'comms', 'messages']
STORY_FLAG = re.compile(r'^[a-zA-Z][\w-]{0,63}$')


# ---- NPC placements (Developer Tools > NPCs) and "Giver waits at": the same rules as void-runner/npc-paths.js, from the admin inventory (npcPaths) ----
def _num(v):
    return type(v) in (int, float) and v == v and abs(v) != float('inf')


def _movable(inv):
    return ((inv or {}).get('npcPaths') or {}).get('movable') or {}


def spot_problems(npc, p, inv):
    mv = _movable(inv).get(npc)
    if not mv:
        return ['This NPC cannot be moved by the editor yet.']
    if not isinstance(p, dict) or not _num(p.get('x')) or not _num(p.get('z')) or abs(p['x']) > 400 or abs(p['z']) > 400:
        return ['The spot has no position.']
    out, a = [], mv['area']
    if not (a['x0'] <= p['x'] <= a['x1'] and a['z0'] <= p['z'] <= a['z1']):
        out.append('That is off the pavement this NPC can walk on.')
    for (px, pz) in mv.get('posts') or []:
        if ((p['x'] - px) ** 2 + (p['z'] - pz) ** 2) ** .5 < mv['post']:
            out.append('That is on a taxi post.')
    m = mv.get('clear', .3)
    for (x0, x1, z0, z1) in mv.get('obstacles') or []:
        if x0 - m < p['x'] < x1 + m and z0 - m < p['z'] < z1 + m:
            out.append('That is in street furniture standing on the pavement.')
            break
    if p.get('yaw') is not None and not _num(p.get('yaw')):
        out.append('The facing is not a number.')
    return out


# ---- Follow / lead / shared-cab steps (void-runner/npc-escort.js): the same rules, from the admin inventory (npcEscort) ----
ESCORT_KINDS = ('follow-them', 'they-follow', 'their-cab', 'shared-cab')
ESCORT_FIELDS = ('to', 'wait', 'lost', 'ifLost', 'stop')


def escort_problems(o, inv):
    """One follow / lead / cab step: a person who can walk with the player, a spot on their pavement or a cab stop they can reach, distances in range."""
    esc = (inv or {}).get('npcEscort') or {}
    kind, npc = o.get('kind'), o.get('npc')
    who = (esc.get('npcs') or {}).get(npc)
    if not who or not _movable(inv).get(npc):
        return ['only someone who can walk with the player (Reverie, Lace, the street cat) can do this step.']
    out = []
    allowed = (esc.get('fields') or {}).get(kind) or []
    for f in ESCORT_FIELDS:
        if o.get(f) is not None and f not in allowed:
            out.append('this kind of step has no ' + f + ' setting.')
    if kind in ('follow-them', 'they-follow'):
        t = o.get('to')
        if not _keys(t, ['x', 'z']):
            out.append('pick the spot on the map.')
        else:
            out += spot_problems(npc, t, inv)
    if kind == 'follow-them':
        lim = esc.get('limits') or {}
        w, l = lim.get('wait') or [3, 30], lim.get('lost') or [15, 150]
        if o.get('wait') is not None and not (_num(o['wait']) and w[0] <= o['wait'] <= w[1]):
            out.append('the waiting distance must be %d to %d metres.' % (w[0], w[1]))
        if o.get('lost') is not None and not (_num(o['lost']) and l[0] <= o['lost'] <= l[1]):
            out.append('the lost distance must be %d to %d metres.' % (l[0], l[1]))
        if _num(o.get('wait')) and _num(o.get('lost')) and o['lost'] <= o['wait']:
            out.append('the lost distance must be further than the waiting distance.')
        if o.get('ifLost') is not None and o['ifLost'] not in (esc.get('ifLost') or ['pause', 'fail']):
            out.append('if the player gets lost: stop and wait, or the mission fails.')
    if kind in ('their-cab', 'shared-cab'):
        if not who.get('cab'):
            out.append('this one does not ride in cabs.')
        elif o.get('stop') not in (who.get('stops') or []):
            out.append('choose a cab stop they can get to (only The Avenue\'s stops for now).')
    return out


def escort_shape_problems(trees):
    """The editor's draft copy on the server (void_runner_drafts.py): a follow / lead / cab step's settings have the right shape (a work in progress may still lack them)."""
    out = []
    for t in trees if isinstance(trees, list) else []:
        for m in (t.get('missions') if isinstance(t, dict) and isinstance(t.get('missions'), list) else []):
            for o in (m.get('objectives') if isinstance(m, dict) and isinstance(m.get('objectives'), list) else []):
                if not isinstance(o, dict):
                    continue
                t_ = o.get('to')
                if t_ is not None and not (_keys(t_, ['x', 'z']) and _num(t_.get('x')) and _num(t_.get('z')) and abs(t_['x']) <= 400 and abs(t_['z']) <= 400):
                    out.append('a follow step\'s spot has an unknown shape.')
                if o.get('wait') is not None and not (_num(o['wait']) and 3 <= o['wait'] <= 30):
                    out.append('a follow step\'s waiting distance must be 3 to 30 metres.')
                if o.get('lost') is not None and not (_num(o['lost']) and 15 <= o['lost'] <= 150):
                    out.append('a follow step\'s lost distance must be 15 to 150 metres.')
                if o.get('ifLost') is not None and o['ifLost'] not in ('pause', 'fail'):
                    out.append('a follow step\'s "if the player gets lost" must be pause or fail.')
                if o.get('stop') is not None and not (isinstance(o['stop'], str) and ID.match(o['stop'])):
                    out.append('a cab step\'s stop has an unknown shape.')
    return out


def _leg_problems(mv, a, b):
    m = mv.get('clear', .3) - .1
    for (x0, x1, z0, z1) in mv.get('obstacles') or []:
        for k in range(21):
            t = k / 20
            x, z = a['x'] + (b['x'] - a['x']) * t, a['z'] + (b['z'] - a['z']) * t
            if x0 - m < x < x1 + m and z0 - m < z < z1 + m:
                return ['the walk to the next point goes through street furniture.']
    for (sx, sz) in mv.get('posts') or []:
        dx, dz = b['x'] - a['x'], b['z'] - a['z']
        L = dx * dx + dz * dz
        t = max(0.0, min(1.0, ((sx - a['x']) * dx + (sz - a['z']) * dz) / L)) if L else 0.0
        if ((a['x'] + dx * t - sx) ** 2 + (a['z'] + dz * t - sz) ** 2) ** .5 < mv['post'] - .15:
            return ['the walk to the next point goes through a taxi post.']
    return []


def _ledge_at(mv, p):
    return any(abs(p['x'] - l['x']) <= l['w'] / 2 + .3 and p['z'] >= l['front'] - 1 for l in mv.get('ledges') or [])


def wait_at_problems(giver, w, inv):
    if w is None:
        return []
    if not _movable(inv).get(giver):
        return ['"Giver waits at" works only for a giver the editor can move (Reverie or Lace).']
    if not _keys(w, ['x', 'z', 'yaw']):
        return ['"Giver waits at" has unknown fields.']
    return spot_problems(giver, w, inv)


def npc_problems(npcs, inv):
    """content.npcs {id: {mode: 'stay'|'path'|'original', ..., schedule?}}: only movable NPCs, spots on their pavement, actions from their own allowed list (no banned clip),
    and a daily schedule of in-game time blocks checked with the same rules (void-runner/npc-paths.js scheduleProblems)."""
    if not isinstance(npcs, dict) or len(npcs) > 20:
        return ['NPC placements have an unknown shape.']
    out = []
    for npc, p in npcs.items():
        mv = _movable(inv).get(npc)
        if not mv:
            out.append(str(npc) + ': this NPC cannot be moved by the editor yet.')
            continue
        w = mv['name'] + ': '
        if not isinstance(p, dict) or p.get('mode') not in ('stay', 'path', 'original'):
            out.append(w + 'unknown kind of placement.')
            continue
        anims = p.get('anims')
        if anims is not None and (not isinstance(anims, list) or len(anims) > 8 or any(a not in (mv.get('anims') or []) for a in anims)):
            out.append(w + 'an added animation is not allowed for this NPC.')
        ok = set(mv.get('actions') or []) | set(a for a in (anims if isinstance(anims, list) else []) if isinstance(a, str))
        rest = {k: v for k, v in p.items() if k != 'schedule'}
        out += [w + x for x in _plan_only(npc, rest, mv, inv, ok)]
        if 'schedule' in p:
            out += [w + x for x in schedule_problems(npc, p['schedule'], mv, inv, ok, (inv or {}).get('npcPaths', {}).get('limits') or {})]
    return out


def _plan_only(npc, p, mv, inv, ok):
    out = []
    path_only = set(mv.get('pathOnly') or [])
    if p['mode'] == 'original':
        if not _keys(p, ['mode', 'anims']):
            out.append('unknown fields.')
        return out
    if p['mode'] == 'stay':
        if not _keys(p, ['mode', 'x', 'z', 'yaw', 'actions', 'anims']):
            return ['the stay has unknown fields.']
        out += spot_problems(npc, p, inv)
        acts = p.get('actions')
        if not isinstance(acts, list) or not 1 <= len(acts) <= 6:
            out.append('a stay needs 1 to 6 actions.')
        else:
            for a in acts:
                if not isinstance(a, str) or a not in ok or a in path_only:
                    out.append('an action is not something she can do here.')
                elif a == 'sit' and _num(p.get('x')) and _num(p.get('z')) and not _ledge_at(mv, p):
                    out.append('"Sit" needs a ledge.')
        return out
    if not _keys(p, ['mode', 'points', 'anims']):
        return ['the path has unknown fields.']
    pts = p.get('points')
    if not isinstance(pts, list) or not 2 <= len(pts) <= 12:
        return ['a path needs 2 to 12 points.']
    for i, q in enumerate(pts):
        pw = 'point %d: ' % (i + 1)
        if not _keys(q, ['x', 'z', 'action', 'seconds']):
            out.append(pw + 'unknown fields.')
            continue
        out += [pw + x for x in spot_problems(npc, q, inv)]
        if not isinstance(q.get('action'), str) or q.get('action') not in ok:
            out.append(pw + 'not something she can do.')
        elif q['action'] == 'sit' and _num(q.get('x')) and _num(q.get('z')) and not _ledge_at(mv, q):
            out.append(pw + '"Sit" needs a ledge.')
        if q.get('action') != 'walk-on' and not (type(q.get('seconds')) is int and 1 <= q['seconds'] <= 120):
            out.append(pw + 'how long: 1 to 120 seconds.')
        n = pts[(i + 1) % len(pts)]
        if isinstance(n, dict) and all(_num(v) for v in (q.get('x'), q.get('z'), n.get('x'), n.get('z'))):
            out += [pw + x for x in _leg_problems(mv, q, n)]
    if all(isinstance(q, dict) and q.get('action') == 'walk-on' for q in pts):
        out.append('at least one point needs something to do.')
    return out


# ---- Daily schedules (Developer Tools > NPCs, 18 Nov 2026): in-game time blocks, the same rules as void-runner/npc-paths.js scheduleProblems ----
# [{from: 'HH:MM', to: 'HH:MM', name?, mode: 'stay'|'path'|'original', ...}]: no overlaps (a block may run past midnight), at most `blocks`, each at least `blockMin`
# minutes, a plain-words name; each block's stay or route is checked like a placement. Nothing in it is code: times, numbers and action ids only.
HHMM = re.compile(r'^([01]\d|2[0-3]):([0-5]\d)$')
BLOCK_NAME = re.compile(r"^[A-Za-z0-9 .,'\u2019()&!?\-/]{1,40}$")
BLOCK_KEYS = {'original': ['from', 'to', 'name', 'mode'], 'stay': ['from', 'to', 'name', 'mode', 'x', 'z', 'yaw', 'actions'], 'path': ['from', 'to', 'name', 'mode', 'points']}


def _hhmm(t):
    m = HHMM.match(t) if isinstance(t, str) else None
    return int(m.group(1)) * 60 + int(m.group(2)) if m else None


def schedule_shape_problems(sched):
    """The editor's server copy (void_runner_drafts.py): a schedule may be half made there, but it is still only times, a plain name, a known kind and known fields."""
    if sched is None:
        return []
    if not isinstance(sched, list) or len(sched) > 8:
        return ['the daily schedule has an unknown shape.']
    for i, b in enumerate(sched):
        if not isinstance(b, dict) or b.get('mode') not in BLOCK_KEYS or not _keys(b, BLOCK_KEYS[b['mode']]):
            return ['time block %d has an unknown shape.' % (i + 1)]
        if _hhmm(b.get('from')) is None or _hhmm(b.get('to')) is None:
            return ['time block %d: times must look like 08:00.' % (i + 1)]
        if b.get('name') is not None and not (isinstance(b['name'], str) and BLOCK_NAME.match(b['name'])):
            return ['time block %d: the name may use letters, numbers and simple punctuation only.' % (i + 1)]
    return []


def schedule_problems(npc, sched, mv, inv, ok, limits=None):
    limits = limits or {}
    most, least = limits.get('blocks', 8), limits.get('blockMin', 15)
    if not isinstance(sched, list):
        return ['the daily schedule has an unknown shape.']
    if not sched:
        return ['the daily schedule is empty.']
    if len(sched) > most:
        return ['a daily schedule has %d time blocks at most.' % most]
    out, used = [], [-1] * 1440
    for i, b in enumerate(sched):
        bw = 'time block %d: ' % (i + 1)
        if not isinstance(b, dict) or b.get('mode') not in BLOCK_KEYS:
            out.append(bw + 'unknown kind of time block.')
            continue
        if not _keys(b, BLOCK_KEYS[b['mode']]):
            out.append(bw + 'unknown fields.')
            continue
        f, t = _hhmm(b.get('from')), _hhmm(b.get('to'))
        if f is None or t is None:
            out.append(bw + 'times must look like 08:00 (24-hour clock).')
        elif f == t:
            out.append(bw + 'it starts and ends at the same time.')
        elif (t - f) % 1440 < least:
            out.append(bw + 'a time block lasts at least %d minutes.' % least)
        else:
            clash = -1
            for k in range((t - f) % 1440):
                m = (f + k) % 1440
                if used[m] >= 0 and clash < 0:
                    clash = used[m]
                used[m] = i
            if clash >= 0:
                out.append(bw + 'it overlaps time block %d.' % (clash + 1))
        if b.get('name') is not None and not (isinstance(b['name'], str) and BLOCK_NAME.match(b['name'])):
            out.append(bw + 'the name may use letters, numbers and simple punctuation only.')
        if b['mode'] != 'original':
            rest = {k: v for k, v in b.items() if k not in ('from', 'to', 'name')}
            out += [bw + x for x in _plan_only(npc, rest, mv, inv, ok)]
    return out


# ---- ElevenLabs voice choices (Developer Tools > NPCs > Lines & voice, the Mission Editor's giver card): the same rules as void-runner/npc-voices.js ----
# Only a voice ID and a name are stored. Nothing is generated here or in a browser and no API key is ever involved: lines re-voiced for that character wait in the
# re-voice queue until the owner approves the spend. The reserved slot, broadcast voices and The Function are refused.
VOICE_ID = re.compile(r'^[A-Za-z0-9]{20}$')
VOICE_CHOSEN = re.compile(r'^\d{4}-\d{2}-\d{2} by the owner$')
VOICE_REFUSED = {'special-character': 'This slot is reserved for a special character the owner will introduce later: no voice is assigned to it.',
                 'the-function': 'The Function has no voice: it gets no voice or treatment without the owner.',
                 'news-anchor': 'Broadcast voices (The Relay) are not chosen here.', 'commercial-announcer': 'Broadcast voices (The Relay) are not chosen here.',
                 'warflying-host': 'Broadcast voices (The Relay) are not chosen here.'}
MAX_VOICES = 80


def voice_refusal(who, reg=None):
    reg = reg or registry()
    if not isinstance(who, str) or not WHO.match(who):
        return 'Unknown character.'
    if who in VOICE_REFUSED:
        return VOICE_REFUSED[who]
    if who in (reg.get('reserved') or {}):
        return VOICE_REFUSED['special-character']
    if who in (reg.get('broadcast') or {}):
        return VOICE_REFUSED['news-anchor']
    n = (reg.get('npcs') or {}).get(who) or {}
    if n.get('broadcast'):
        return VOICE_REFUSED['news-anchor']
    if re.search(r'the function', n.get('displayName') or '', re.I):
        return VOICE_REFUSED['the-function']
    return None


def voice_ok(v):
    return _keys(v, ['engine', 'voiceId', 'name', 'chosen']) and v.get('engine') == 'elevenlabs' and isinstance(v.get('voiceId'), str) and bool(VOICE_ID.match(v['voiceId'])) \
        and _plain(v.get('name'), 60) and isinstance(v.get('chosen'), str) and bool(VOICE_CHOSEN.match(v['chosen']))


def voice_problems(voices, inv=None):
    """content.voices {who: {engine: 'elevenlabs', voiceId, name, chosen}}: characters the editor knows (the admin inventory's givers), never a refused one."""
    if not isinstance(voices, dict) or len(voices) > MAX_VOICES:
        return ['Voice choices have an unknown shape.']
    givers = ((inv or _json('void_runner_admin_inventory.json')).get('missionEditor') or {}).get('givers') or {}
    reg, out = registry(), []
    for who, v in voices.items():
        r = voice_refusal(who, reg)
        if r:
            out.append('%s: %s' % (who, r))
        elif who not in givers:
            out.append('%s: not a character the editor knows.' % who)
        elif not voice_ok(v):
            out.append('%s: a voice choice needs an ElevenLabs voice ID (20 letters and digits), a plain name and the date it was chosen.' % who)
    return out


# ---- NPC looks (Developer Tools > NPCs > Appearance): the same rules as void-runner/npc-looks.js, against the admin inventory's npcLooks ----
# What may change on each model is read from the model files by tools/admin-inventory.cjs (npc-looks.js capabilities): only accessories and hair can be hidden
# (clothing that covers the body never), only the listed materials recoloured, the creator's gear and hair only on figures built on its skeleton, nothing added to a
# licensed model, colours only for Reverie and Lace. The model files are never changed.
LOOK_ID = re.compile(r'^[a-z0-9][a-z0-9-]{0,23}$')
LOOK_PART = re.compile(r'^[A-Za-z0-9 _.:-]{1,80}$')
LOOK_HEX = re.compile(r'^#[0-9a-fA-F]{6}$')


def _look_colour_ok(c):
    def rng(v, a, b):
        return v is None or (_num(v) and type(v) is not bool and a <= v <= b)
    return _keys(c, ['tint', 'hue', 'sat', 'bright']) and (c.get('tint') is None or (isinstance(c['tint'], str) and bool(LOOK_HEX.match(c['tint'])))) \
        and rng(c.get('hue'), -180, 180) and rng(c.get('sat'), 0, 2) and rng(c.get('bright'), 0.4, 1.6)


def look_problems(looks, inv=None):
    """content.looks {asset: {looks: [{id, name, hide, colour, gear, hair}], use}}: only models the inventory lists, only the changes each model allows."""
    cfg = (inv or _json('void_runner_admin_inventory.json')).get('npcLooks') or {}
    lim, assets, gear_ids, hair = cfg.get('limits') or {}, cfg.get('assets') or {}, set(cfg.get('gear') or []), cfg.get('hair') or {}
    if not isinstance(looks, dict) or len(looks) > lim.get('assets', 60):
        return ['Looks have an unknown shape.']
    out = []
    for asset, e in looks.items():
        w = '%s: ' % asset
        a = assets.get(asset) if isinstance(asset, str) else None
        if a is None:
            out.append(w + 'not a model the editor knows.')
            continue
        if not _keys(e, ['looks', 'use']) or not isinstance(e.get('looks'), list) or len(e['looks']) > lim.get('looks', 8):
            out.append(w + 'looks have an unknown shape.')
            continue
        ids = set()
        for l in e['looks']:
            n = w + 'look: '
            if not _keys(l, ['id', 'name', 'hide', 'colour', 'gear', 'hair']):
                out.append(n + 'unknown fields.')
                continue
            if not isinstance(l.get('id'), str) or not LOOK_ID.match(l['id']) or l['id'] in ids:
                out.append(n + 'bad or repeated id.')
            ids.add(l.get('id'))
            if not _plain(l.get('name'), lim.get('name', 40)):
                out.append(n + 'a look needs a plain name.')
            hide = l.get('hide') or []
            if not isinstance(hide, list) or len(hide) > lim.get('hide', 24) or any(not isinstance(p, str) or not LOOK_PART.match(p) for p in hide):
                out.append(n + 'the hidden parts have an unknown shape.')
                hide = []
            for p in hide:
                if a.get('street') or p not in (a.get('parts') or []):
                    out.append(n + '"%s" cannot be hidden (only accessories and hair; clothing that covers the body always stays).' % p)
            col = l.get('colour') or {}
            if not isinstance(col, dict) or len(col) > lim.get('colours', 16):
                out.append(n + 'the colours have an unknown shape.')
                col = {}
            for k, c in col.items():
                if k not in (a.get('colours') or []):
                    out.append(n + '"%s" is not a colour this model can change.' % k)
                if not _look_colour_ok(c):
                    out.append(n + 'a colour needs a #rrggbb tint and/or a hue (-180..180), saturation (0..2) and brightness (0.4..1.6).')
            g = l.get('gear') or []
            if not isinstance(g, list) or len(g) > 4 or any(x not in gear_ids for x in g) or len(set(g)) != len(g):
                out.append(n + 'unknown gear.')
            elif g and (a.get('licensed') or a.get('street') or not a.get('gear')):
                out.append(n + 'nothing can be added to this model.')
            hs = l.get('hair')
            if hs is not None:
                if hs not in hair:
                    out.append(n + 'unknown hairstyle.')
                elif a.get('licensed') or a.get('street') or not a.get('hair'):
                    out.append(n + 'nothing can be added to this model.')
                elif not hair[hs].get('hatOk') and any(h not in hide for h in a.get('hats') or []):
                    out.append(n + 'that hairstyle does not fit under the hat: hide the hat first.')
        use = e.get('use')
        if not (use is None or use in ('original', 'mix') or any(isinstance(l, dict) and l.get('id') == use for l in e['looks'])):
            out.append(w + '"which look they wear" names a look that does not exist.')
        if use == 'mix' and not e['looks']:
            out.append(w + 'a mix needs at least one saved look.')
    return out


def import_package_problems(pkg, inv=None):
    """An "Add to the game" package from Developer Tools > NPCs > Import model (handed to Claude/Codex; never published by itself): the caps (one place:
    npc-paths.js IMPORT, copied into the admin inventory) and the licence questions that must be answered before anyone commits the model."""
    cap = ((inv or _json('void_runner_admin_inventory.json')).get('npcPaths') or {}).get('import') or {}
    out = []
    if not isinstance(pkg, dict) or pkg.get('format') != 'darknet-district-npc-import':
        return ['This is not an NPC import package.']
    m = pkg.get('model') or {}
    tri, size = m.get('triangles'), m.get('bytes')
    if type(tri) is not int or tri < 0:
        out.append('The package does not say how many triangles the model has.')
    elif tri > cap.get('maxTriangles', 50000):
        out.append('This model has %d triangles; the limit is %d.' % (tri, cap.get('maxTriangles', 50000)))
    if type(size) is not int or size < 0:
        out.append('The package does not say how big the file is.')
    elif size > cap.get('maxBytes', 15 * 1024 * 1024):
        out.append('The file is over the size limit.')
    lic = pkg.get('licence') or {}
    if not _plain(lic.get('source'), 300):
        out.append('Where the model is from is missing.')
    if not _plain(lic.get('type'), 120):
        out.append('The licence type is missing.')
    if lic.get('noAI') not in (True, False):
        out.append('"No AI licence?" must be answered yes or no.')
    if not _plain(pkg.get('name'), 60):
        out.append('The model needs a name.')
    return out


def start_problems(st, givers, places, mission_ids):
    """How a mission starts: in person (the giver offers it) or by notification (channel, sender, header, text, trigger). Same rules as mission-content.js checkStart()."""
    if not _keys(st, ['how', 'channel', 'from', 'header', 'text', 'when', 'accept']) or st.get('how') not in HOW:
        return ['unknown way of starting.']
    if st.get('accept') is not None and (type(st['accept']) is not bool or st['how'] != 'person'):
        return ['only a mission offered in person can be accepted or declined.']
    if st['how'] == 'person':
        return [] if set(st) <= {'how', 'accept'} else ['a mission given in person has no notification fields.']
    out = []
    if st.get('channel') not in CHANNELS:
        out.append('unknown notification channel.')
    if st.get('from') not in givers:
        out.append('the notification must come from a known NPC.')
    if (st.get('channel') != 'notify' or st.get('header') is not None) and not _plain(st.get('header'), 80):
        out.append('the notification needs a header (plain text, 80 characters at most).')
    if not _plain(st.get('text'), 500):
        out.append('the notification needs its text (plain text, 500 characters at most).')
    w = st.get('when')
    if not _keys(w, ['kind', 'mission', 'place', 'flag', 'value', 'npc', 'distance']) or w.get('kind') not in WHEN:
        return out + ['the notification needs a trigger it knows.']
    if w['kind'] != 'near' and (w.get('npc') is not None or w.get('distance') is not None):
        out.append('only "when walked near" names a person and a distance.')
    if w['kind'] == 'near':
        # "when walked near" (18 Nov 2026): the player comes within `distance` metres (1..30, default 5) of `npc` (default: the giver), someone with a TALK prompt
        if w.get('npc') is not None and not (isinstance(w['npc'], str) and (givers.get(w['npc']) or {}).get('canTalk')):
            out.append('"when walked near" must name someone the game has a TALK prompt for.')
        d = w.get('distance')
        if d is not None and not (type(d) in (int, float) and d == d and NEAR_MIN <= d <= NEAR_MAX):
            out.append('"when walked near" needs a distance from 1 to 30 metres.')
    if w['kind'] in ('after-mission', 'game-time') and w.get('mission') not in mission_ids:
        out.append('"after mission" must name a mission that exists.')
    if w['kind'] == 'game-time' and not (type(w.get('value')) is int and 1 <= w['value'] <= 10080):
        # "after N in-game hours / minutes" (Mission 003, game-clock.js): N in-game minutes after the named mission was completed
        out.append('"after in-game time" needs a whole number of in-game minutes from 1 to 10080.')
    if w['kind'] in ('place', 'leave') and w.get('place') not in places:
        out.append('unknown trigger place.')
    if w['kind'] == 'flag':
        v = w.get('value')
        if not isinstance(w.get('flag'), str) or not STORY_FLAG.match(w['flag']):
            out.append('the trigger flag must be a story flag name.')
        if not (type(v) is bool or (isinstance(v, str) and len(v) <= 200 and not TAGS.search(v)) or (type(v) is int and abs(v) <= 9007199254740991)):
            out.append('bad trigger flag value.')
    return out


def manifest():
    return _json('void-runner/save-manifest.json')


def shipped_numbers():
    """The shipped ledger {number: mission id} (save-manifest.json missionNumbers, keys as text)."""
    return {int(k): v for k, v in (manifest().get('missionNumbers') or {}).items()}


def number_problems(trees, ledger):
    """Duplicate numbers in the content, and numbers the ledger already gave to another mission id (never reused)."""
    out, seen = [], {}
    for t in trees if isinstance(trees, list) else []:
        for m in (t.get('missions') if isinstance(t, dict) and isinstance(t.get('missions'), list) else []):
            if not isinstance(m, dict) or m.get('number') is None:
                continue
            n, mid = m.get('number'), m.get('id')
            if type(n) is not int or not 1 <= n <= 999:
                out.append('%s: a mission number must be a whole number from 001 to 999.' % mid)
                continue
            if n in seen and seen[n] != mid:
                out.append('Mission %03d is given to two missions (%s and %s). Numbers are unique.' % (n, mid, seen[n]))
            seen[n] = mid
            if ledger.get(n) not in (None, mid):
                out.append('Mission %03d was already used by %s. A number is never reused, even after a mission is removed.' % (n, ledger[n]))
    return out


def content_numbers(content):
    out = {}
    for t in (content or {}).get('trees') or []:
        for m in t.get('missions') or []:
            if type(m.get('number')) is int:
                out[m['number']] = m['id']
    return out
FLAGNAME = re.compile(r'^[a-zA-Z][a-zA-Z0-9_-]{0,47}$')


def check_trees(trees, inv, err):
    """The owner's new mission trees: the same closed rules as void-runner/mission-content.js checkTrees(), against the lists in the admin inventory
    (NPCs with a TALK prompt, places, items a store sells, travel places). New mission ids start with draft- and become ordinary save records."""
    me = inv.get('missionEditor') or {}
    givers = me.get('givers') or {}
    talk = {k for k, v in givers.items() if v.get('canTalk')}
    places, items, locations = set(me.get('places') or []), set(me.get('items') or []), set(me.get('locations') or [])
    subjects, factions = set(me.get('subjects') or []), set(me.get('factions') or [])
    if not isinstance(trees, list) or len(trees) > 10:
        err('New trees have an unknown shape (10 at most).')
        return
    story = set(manifest().get('storyTrees') or [])
    every_mission = {m.get('id') for t in trees if isinstance(t, dict) and isinstance(t.get('missions'), list) for m in t['missions'] if isinstance(m, dict)}
    every_mission |= set(manifest().get('missions') or []) | set(manifest().get('storyMissions') or [])
    tids, mids, total = set(), set(), 0
    every = {t.get('id') for t in trees if isinstance(t, dict)}

    def lines(ls, w):
        if ls is None:
            return
        if not isinstance(ls, list) or len(ls) > 12:
            err(w + ': too many lines.')
            return
        for line in ls:
            if not _keys(line, ['who', 'text']) or not _plain(line.get('text'), 500):
                err(w + ': a line must be plain text.')
            elif line.get('who') != 'You' and line.get('who') not in givers:
                err(w + ': unknown speaker.')
    for t in trees:
        if not _keys(t, ['id', 'name', 'note', 'missions']):
            err('A tree has unknown fields.')
            continue
        tw = str(t.get('id'))
        if not isinstance(t.get('id'), str) or not (DRAFT.match(t['id']) or t['id'] in story) or t['id'] in tids:
            err(tw + ': a new tree id must start with draft- and be unique.')
        tids.add(t.get('id'))
        if not _plain(t.get('name'), 60):
            err(tw + ': the tree needs a name.')
        note = t.get('note')
        if note is not None and not (isinstance(note, str) and len(note) <= 300 and not TAGS.search(note)):
            err(tw + ': the note must be plain text.')
        ms = t.get('missions')
        if not isinstance(ms, list) or not 1 <= len(ms) <= 20:
            err(tw + ': a tree needs 1 to 20 missions.')
            continue
        for m in ms:
            total += 1
            if not _keys(m, ['id', 'number', 'title', 'type', 'category', 'giver', 'location', 'start', 'objective', 'description', 'rewards', 'offer', 'objectives', 'ending', 'unlocks', 'waitAt']):
                err(tw + ': unknown fields in a mission.')
                continue
            w = tw + ' / ' + str(m.get('id'))
            if m.get('waitAt') is not None:
                for p in wait_at_problems(m.get('giver'), m['waitAt'], inv):
                    err(w + ': ' + p)
            if not isinstance(m.get('id'), str) or not (DRAFT.match(m['id']) or STORY_MISSION.match(m['id'])) or m['id'] in mids:
                err(w + ': a new mission id must start with draft- and be unique.')
            num = m.get('number')
            if num is not None and not (type(num) is int and 1 <= num <= 999):
                err(w + ': a mission number must be a whole number from 001 to 999.')
            if num is None and t.get('id') in story:
                err(w + ': every mission in the main storyline needs a mission number.')
            if m.get('start') is not None:
                for p in start_problems(m['start'], givers, places, every_mission):
                    err(w + ': ' + p)
            by_note = isinstance(m.get('start'), dict) and m['start'].get('how') == 'notification'
            if m.get('category') is not None and not _plain(m['category'], 60):
                err(w + ': the mission type label must be plain text.')
            if m.get('objective') is not None and not _plain(m['objective'], 200):
                err(w + ': the objective must be plain text.')
            if m.get('location') is not None and m['location'] not in places:
                err(w + ': unknown location.')
            mids.add(m.get('id'))
            if not _plain(m.get('title'), 60):
                err(w + ': a title is required.')
            if m.get('type') not in TYPES:
                err(w + ': unknown mission type.')
            if m.get('giver') not in talk:
                err(w + ': the giver must be an NPC the game has a TALK prompt for.')
            d = m.get('description')
            if d is not None and not (isinstance(d, str) and len(d) <= 600 and not TAGS.search(d)):
                err(w + ': the description must be plain text.')
            r = m.get('rewards')
            if r is not None and not (type(r) is int and 0 <= r <= 100000):
                err(w + ': credits must be a whole number between 0 and 100000.')
            lines(m.get('offer'), w)
            objs = m.get('objectives')
            if not isinstance(objs, list) or not 1 <= len(objs) <= 20:
                err(w + ': a mission needs 1 to 20 steps.')
                continue
            oids = set()
            for o in objs:
                if not _keys(o, ['id', 'label', 'kind', 'npc', 'place', 'item', 'say', 'early', 'subject', 'subjects', 'wrong', 'via', *ESCORT_FIELDS]):
                    err(w + ': unknown fields in a step.')
                    continue
                ow = w + ' / ' + str(o.get('id'))
                if not isinstance(o.get('id'), str) or not ID.match(o['id']) or o['id'] == 'turn-in' or o['id'] in oids:
                    err(ow + ': bad or duplicate step id.')
                oids.add(o.get('id'))
                if not _plain(o.get('label'), 500):
                    err(ow + ': the step needs a label.')
                kind = o.get('kind')
                if kind not in (me.get('stepKinds') or []):
                    err(ow + ': the game cannot run this kind of step yet.')
                elif kind in ('talk', 'deliver') and o.get('npc') not in talk:
                    err(ow + ': unknown NPC.')
                elif kind == 'go' and o.get('place') not in places:
                    err(ow + ': unknown place.')
                elif kind == 'arrive' and o.get('place') not in locations:
                    err(ow + ': not a place a ship can fly to.')
                elif kind == 'buy' and o.get('item') not in items:
                    err(ow + ': not an item a store sells.')
                elif kind == 'message' and not by_note:
                    err(ow + ': a "notification arrives" step needs the mission to start by notification.')
                elif kind == 'hear' and o.get('npc') not in (None, '') and o.get('npc') not in talk:
                    err(ow + ': unknown NPC.')
                elif kind == 'await-call' and o.get('npc') not in (None, '') and o.get('npc') not in givers:
                    err(ow + ': unknown NPC.')
                elif kind in ('enter', 'leave') and o.get('place') not in places:
                    err(ow + ': unknown place.')
                elif kind in ESCORT_KINDS:
                    for p in escort_problems(o, inv):
                        err(ow + ': ' + p)
                elif kind == 'photo' and o.get('npc') not in subjects:
                    err(ow + ': not someone the V1 camera can identify.')
                elif kind == 'send-photo' and (o.get('npc') not in givers or o.get('subject') not in subjects):
                    err(ow + ': the photo must go to a known NPC and show someone the camera can identify.')
                if kind not in ESCORT_KINDS and any(o.get(f) is not None for f in ESCORT_FIELDS):
                    err(ow + ': only a follow / lead / cab step has a spot, distances or a cab stop.')
                if o.get('subject') is not None and kind != 'send-photo':
                    err(ow + ': only a send-a-photo step names who must be in the photo.')
                many = o.get('subjects')
                if many is not None:
                    # several people who must all be in the same photo (Mission 002: Juno Vex and Halden Reyes); the first is the one chosen above
                    one = o.get('npc') if kind == 'photo' else o.get('subject')
                    if kind not in ('photo', 'send-photo'):
                        err(ow + ': only a photo step or a send-a-photo step names several people.')
                    elif (not isinstance(many, list) or not 1 <= len(many) <= PHOTO_SUBJECTS or len(set(map(str, many))) != len(many)
                          or not all(isinstance(x, str) and x in subjects for x in many) or many[0] != one):
                        err(ow + ': the people in the photo must be 1 to %d different people the V1 camera can identify, the first one chosen above.' % PHOTO_SUBJECTS)
                if o.get('wrong') is not None and kind != 'send-photo':
                    err(ow + ': only a send-a-photo step has a reply for the wrong photo.')
                via = o.get('via')
                if via is not None:
                    say = o.get('say') if isinstance(o.get('say'), list) else []
                    if via not in VIA:
                        err(ow + ': unknown way of saying the lines.')
                    elif via != 'talk' and not (say and all(isinstance(x, dict) and x.get('who') not in (None, 'You') and x.get('who') == say[0].get('who') for x in say)):
                        err(ow + ': a Comms call or a message needs its lines, all from one NPC.')
                lines(o.get('say'), ow)
                lines(o.get('early'), ow)
                lines(o.get('wrong'), ow)
            e = m.get('ending')
            if e is not None:
                if not _keys(e, ['npc', 'place', 'label', 'say']):
                    err(w + ': the ending has unknown fields.')
                else:
                    if e.get('npc') is not None and e['npc'] not in talk:
                        err(w + ': unknown hand-in NPC.')
                    if e.get('place') is not None and not isinstance(e['place'], str):
                        err(w + ': unknown ending place.')
                    if e.get('label') is not None and not _plain(e['label'], 500):
                        err(w + ': the hand-in label must be plain text.')
                    lines(e.get('say'), w)
            un = m.get('unlocks')
            if un is not None:
                if not isinstance(un, list) or len(un) > 20:
                    err(w + ': too many unlocks.')
                    continue
                for u in un:
                    if not _keys(u, ['kind', 'id', 'amount', 'value', 'when']) or u.get('kind') not in (me.get('unlockKinds') or []):
                        err(w + ': the game cannot apply this kind of unlock yet.')
                        continue
                    if u.get('when') is not None and u['when'] != 'complete' and u['when'] not in oids:
                        err(w + ': an unlock names a step that does not exist.')
                    k = u['kind']
                    if k == 'credits' and not (type(u.get('amount')) is int and 0 < u['amount'] <= 100000):
                        err(w + ': credits must be a whole number between 1 and 100000.')
                    if k == 'flag':
                        v = u.get('value')
                        if not isinstance(u.get('id'), str) or not FLAGNAME.match(u['id']):
                            err(w + ': bad story flag name.')
                        if not (type(v) is bool or (isinstance(v, str) and len(v) <= 200 and not TAGS.search(v)) or (type(v) is int and abs(v) <= 9007199254740991)):
                            err(w + ': bad story flag value.')
                    if k == 'location' and u.get('id') not in locations:
                        err(w + ': unknown place.')
                    if k == 'ship' and u.get('id') not in (me.get('ships') or []):
                        err(w + ': only a ship that is not a paid purchase can be given.')
                    if k == 'tree' and (u.get('id') not in every or u.get('id') == t.get('id')):
                        err(w + ': a start-tree link must name another of the new trees being sent.')
                    if k in ('contact', 'follow') and (not isinstance(u.get('id'), str) or not re.match(r'^[a-z][a-z0-9-]{0,39}$', u['id']) or u['id'] not in givers):
                        err(w + ': a contact or a follow must name a known NPC.')
                    if k == 'reputation':
                        if u.get('id') not in givers and u.get('id') not in factions:
                            err(w + ': reputation must name an NPC or a faction.')
                        a = u.get('amount')
                        if not (type(a) is int and a != 0 and abs(a) <= 100):
                            err(w + ': a reputation change must be a whole number from -100 to 100 (not 0).')
    if total > 40:
        err('New trees hold more than 40 missions.')
    for p in number_problems(trees, shipped_numbers()):
        err(p)


# ---------------------------------------------------------------- versions
def _state_ref(db):
    return db.collection(STATE[0]).document(STATE[1])


def _version_ref(db, n):
    return db.collection(VERSIONS).document('v%d' % n)


def summary(db):
    state = _state_ref(db).get().to_dict() or {}
    numbers = {str(k): v for k, v in shipped_numbers().items()}
    numbers.update(state.get('numbers') or {})
    return {'enabled': enabled(), 'editor': True, 'version': state.get('live', 0), 'publishedAt': state.get('at'), 'history': state.get('history', []), 'numbers': numbers}


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
        # Numbers once published are never reused: the ledger on the state document keeps every number any version published.
        ledger = {int(k): v for k, v in (state.get('numbers') or {}).items()}
        ledger.update({k: v for k, v in shipped_numbers().items() if k not in ledger})
        problems = number_problems((content or {}).get('trees') or [], ledger)
        if problems:
            raise DraftError('The draft has problems: ' + '; '.join(problems[:5]), 422, {'problems': problems})
        for n, mid in content_numbers(content).items():
            ledger.setdefault(n, mid)
        at = int(time.time())
        record = {'version': nxt, 'action': action, 'from': source, 'content': content, 'at': at, 'by': owner_tag, 'note': note}
        tx.create(_version_ref(db, nxt), record)
        history.append({'version': nxt, 'at': at, 'action': action, 'from': source, 'note': note})
        tx.set(_state_ref(db), {'live': nxt, 'at': at, 'history': history, 'numbers': {str(k): v for k, v in sorted(ledger.items())}})
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
    if not (content.get('beginner') or content.get('registry') or content.get('lines') or content.get('trees') or content.get('names') or content.get('npcs') or content.get('voices') or content.get('looks')):
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


def live_voices(db):
    """The voice choices in the published content (content.voices), or {} when nothing is published or it cannot be read."""
    try:
        c = public(db).get('content') or {}
    except Exception:  # noqa: BLE001 - the queue still works from the re-voice file and the item's own choice
        return {}
    v = c.get('voices') if isinstance(c, dict) else None
    return v if isinstance(v, dict) else {}


def revoice_engine(who, item, published, eng):
    """Which engine re-voices this character's line: the voice sent with the item (chosen in the owner's editor draft), else the published choice, else
    tools/audio/revoice-engines.json, else the registered Kokoro voice. None: no voice at all (not re-voiceable)."""
    vid, vname = item.get('voiceId'), item.get('voiceName')
    if vid is not None or vname is not None:
        if not (isinstance(vid, str) and VOICE_ID.match(vid) and _plain(vname, 60)):
            raise DraftError('A chosen ElevenLabs voice needs its 20-character voice ID and a plain name.', 422)
        return {'engine': 'elevenlabs', 'voice': vname.strip(), 'voiceId': vid, 'from': 'editor'}
    p = published.get(who)
    if isinstance(p, dict) and voice_ok(p):
        return {'engine': 'elevenlabs', 'voice': p['name'], 'voiceId': p['voiceId'], 'from': 'published'}
    if who in eng:
        return eng[who]
    if who in registry()['npcs']:
        return {'engine': 'kokoro'}
    return None


def queue_list(db, uid):
    data = _queue_ref(db, uid).get().to_dict() or {}
    items = sorted(data.get('items', {}).values(), key=lambda x: x.get('at', 0))
    return {'items': items}


def queue_add(db, uid, payload):
    if not _keys(payload, ['items']) or not isinstance(payload.get('items'), list) or not 1 <= len(payload['items']) <= 200:
        raise DraftError('Send 1 to 200 lines.')
    reg, eng = registry(), engines()
    npcs = reg['npcs']
    published = live_voices(db)
    clean = []
    for it in payload['items']:
        if not _keys(it, ['ref', 'who', 'text', 'from', 'mission', 'source', 'voiceId', 'voiceName']):
            raise DraftError('Unknown fields in a re-voice item.')
        who, text = it.get('who'), it.get('text')
        if voice_refusal(who, reg):
            raise DraftError('This character cannot be re-voiced: ' + voice_refusal(who, reg), 422)
        if not _plain(text, 500):
            raise DraftError('A line must be plain text, 500 characters at most.')
        extra = {k: str(it.get(k) or '')[:200] for k in ['ref', 'from', 'mission', 'source'] if not TAGS.search(str(it.get(k) or ''))}
        e = revoice_engine(who, it, published, eng)
        if e is None:
            raise DraftError('Only characters with a registered voice or a chosen ElevenLabs voice can be re-voiced (broadcast voices and the reserved slot cannot).', 422)
        rec = {'id': item_id(who, text), 'who': who, 'text': text, 'engine': e['engine'], 'status': 'queued', 'at': int(time.time()), **extra}
        if e['engine'] == 'elevenlabs':
            rec.update(voice=e.get('voice', ''), voiceId=e.get('voiceId', ''), waiting='waiting for ElevenLabs re-voice (needs approval)')
        else:
            rec['voice'] = (npcs.get(who) or {}).get('voice', '')
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
