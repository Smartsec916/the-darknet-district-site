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

from void_runner_drafts import DEFAULT_VOICE_MODEL, VOICE_MODELS, DraftError, editor_uid, strip_voice_tags, voice_tag_problems

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
    if not _keys(content, ['format', 'version', 'beginner', 'registry', 'lines', 'note', 'trees', 'names', 'npcs', 'voices', 'looks', 'clips', 'characters', 'zones']):
        return ['The content record has an unknown shape.']
    if content.get('characters') is not None:
        # mission givers made in the editor (void-runner/npc-made.js): checked, then movable and givers for the rest of the check (with_made)
        inv = inv or _json('void_runner_admin_inventory.json')
        for p in made_problems(content, inv):
            err(p)
        inv = with_made(content.get('characters'), inv)
    if content.get('zones') is not None:
        for p in zone_table_problems(content['zones'], inv or _json('void_runner_admin_inventory.json')):
            err(p)
    if content.get('clips') is not None:
        for p in clip_problems(content['clips']):
            err(p)
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
                            else:
                                for p in voice_tag_problems(line['text']):
                                    err(ow + ': ' + p)
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
                for p in voice_tag_problems(line['to']):
                    err('"%s...": %s' % (line['from'][:40], p))
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
        check_trees(trees, inv or _json('void_runner_admin_inventory.json'), err, content.get('npcs') if isinstance(content.get('npcs'), dict) else None)
    return errors


DRAFT = re.compile(r'^draft-[a-z0-9][a-z0-9-]{0,53}$')
STORY_MISSION = re.compile(r'^(m\d{3}-[a-z0-9][a-z0-9-]{0,50}|main-storyline-m\d{1,3})$')
HOW = ['person', 'notification']
# Costs and ACCEPT / DENY (19 Nov 2026; mission-content.js MONEY): cost {amount 1..100000, when 'accept' | a step id, refund (only at 'accept')};
# start.accept for every start, with yes / no labels (20 characters at most), deny 'again' | 'never' | 'start' (+ denyStart: the first mission of another tree), denySay.
MONEY_MAX, LABEL_MAX = 100000, 20
# deny 'after' (denyMinutes 1..120 minutes of play) and 'pod' (after the next Sleeping Pod exit) were added 19 Nov 2026 (mission-content.js DENY_MIN)
DENY = ['again', 'pod', 'after', 'never', 'start']
DENY_MIN_MIN, DENY_MIN_MAX = 1, 120
ASK_KEYS = ['yes', 'no', 'deny', 'denyMinutes', 'denyStart', 'denySay']
# ACCEPT / DENY anywhere in a mission (19 Nov 2026): the step kind 'ask' (mission-content.js ASK_STEP)
ASK_STEP_KEYS = ['question', 'yes', 'no', 'deny', 'goto', 'denyStart', 'denySay', 'price']
ASK_STEP_DENY = ['end', 'skip', 'back', 'tree']
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


def _areas(inv):
    return ((inv or {}).get('npcPaths') or {}).get('areas') or {}


def _in(r, x, z, m=0.0):
    return r[0] - m < x < r[1] + m and r[2] - m < z < r[3] + m


def _size(r):
    return (r[1] - r[0]) * (r[3] - r[2])


def area_of(p, inv, prefer=None):
    """The area (npc-areas.js: avenue, oldtown, far-south, outskirts, port, district) whose walkable ground holds p, or None."""
    al = _areas(inv).get('areas') or []
    order = sorted(al, key=lambda a: a['id'] != prefer)
    for a in order:
        if any(_in(w, p['x'], p['z'], 1e-6) for w in a['walk']):
            return a['id']
    return None


def area_check(p, inv, prefer=None, m=None, adult=False):
    """The same rule as void-runner/npc-areas.js check(): (ok, area, kind, why). Kinds: ok, rule (the owner's content rule: Milked, NULL, the District bar, VR, arcade,
    Corporate District), blocked, gate, road, obstacle, post, outside."""
    A = _areas(inv)
    if m is None:
        m = A.get('clear', .3)
    if not isinstance(p, dict) or not _num(p.get('x')) or not _num(p.get('z')) or abs(p['x']) > 400 or abs(p['z']) > 400:
        return (False, None, 'outside', 'The spot has no position.')
    x, z = p['x'], p['z']
    al = A.get('areas') or []
    by = {a['id']: a for a in al}
    aid = area_of(p, inv, prefer)
    if aid:
        a = by[aid]
        nos = sorted([n for n in a['no'] if _in(n['rect'], x, z) and not (adult and n.get('adult'))], key=lambda n: _size(n['rect']))
        if nos:
            return (False, aid, 'rule' if nos[0].get('rule') else 'blocked', nos[0]['why'])
        for g in a.get('gates') or []:
            if _in(g['rect'], x, z):
                return (False, aid, 'gate', 'That is inside a gate.')
        for o in a.get('obstacles') or []:
            if _in(o, x, z, m):
                return (False, aid, 'obstacle', 'That is in street furniture or room furniture standing there.')
        for (px, pz) in a.get('posts') or []:
            if ((x - px) ** 2 + (z - pz) ** 2) ** .5 < .7:
                return (False, aid, 'post', 'That is on a taxi post.')
        return (True, aid, 'ok', '')
    nos = [(n, a['id']) for a in al for n in a['no'] if _in(n['rect'], x, z) and not (adult and n.get('adult'))] + [(n, None) for n in A.get('out') or [] if _in(n['rect'], x, z)]
    nos.sort(key=lambda t: (0 if t[0].get('rule') else 1, _size(t[0]['rect'])))
    if nos and nos[0][0].get('rule'):
        return (False, nos[0][1], 'rule', nos[0][0]['why'])
    for a in al:
        if any(_in(g['rect'], x, z) for g in a.get('gates') or []):
            return (False, a['id'], 'gate', 'That is inside a gate.')
    for a in al:
        if any(_in(r, x, z) for r in a.get('roads') or []):
            return (False, a['id'], 'road', 'That is the road (the taxis drive there).')
    if nos:
        return (False, nos[0][1], 'blocked', nos[0][0]['why'])
    for a in al:
        if any(_in(f, x, z) for f in a.get('floors') or []):
            return (False, a['id'], 'blocked', 'That is too close to a wall or a kerb.')
    return (False, None, 'outside', 'That is not somewhere she can walk.')


def forbidden_spot_problems(npcs, trees=None, inv=None, adults=()):
    """The editor's server copy of a draft (void_runner_drafts.py) may be half made, but the owner's content rule holds there too: no spot or route point of Reverie,
    Lace or the cat (all day, in a time block, or a mission's "Giver waits at") in Milked, NULL, the District bar, VR or arcade, or the Corporate District."""
    inv = inv or _json('void_runner_admin_inventory.json')
    spots = []
    def plan_spots(p):
        if not isinstance(p, dict):
            return
        if p.get('mode') == 'stay':
            spots.append(p)
        elif p.get('mode') == 'path' and isinstance(p.get('points'), list):
            spots.extend(q for q in p['points'] if isinstance(q, dict))
        for b in p.get('schedule') or [] if isinstance(p.get('schedule'), list) else []:
            plan_spots(b)
    adult_spots = []
    for k, p in (npcs or {}).items() if isinstance(npcs, dict) else []:
        if k in adults:
            n0 = len(spots)
            plan_spots(p)
            adult_spots.extend(spots[n0:])
        else:
            plan_spots(p)
    for t in trees or [] if isinstance(trees, list) else []:
        for m in (t.get('missions') or []) if isinstance(t, dict) else []:
            if isinstance(m, dict) and isinstance(m.get('waitAt'), dict):
                spots.append(m['waitAt'])
    out = []
    for q in spots:
        if _num(q.get('x')) and _num(q.get('z')):
            ok, _a, kind, why = area_check(q, inv, adult=any(q is x for x in adult_spots))
            if kind == 'rule':
                out.append(why)
    return out


def spot_problems(npc, p, inv):
    mv = _movable(inv).get(npc)
    if not mv:
        return ['This NPC cannot be moved by the editor yet.']
    ok, _a, _k, why = area_check(p, inv, adult=bool(mv.get('adult')))
    out = [] if ok else [why]
    if isinstance(p, dict) and p.get('yaw') is not None and not _num(p.get('yaw')):
        out.append('The facing is not a number.')
    return out


def _leg_problems(mv, a, b, inv=None):
    A = _areas(inv)
    m = A.get('clear', .3) - .1
    ad = bool((mv or {}).get('adult'))
    oka, aa, _, _ = area_check(a, inv, None, m, ad)
    okb, ab, _, _ = area_check(b, inv, aa, m, ad)
    if oka and okb and aa != ab:
        return ['the walk to the next point goes into another area: a route stays in one area.']
    area = aa or ab
    d = ((b['x'] - a['x']) ** 2 + (b['z'] - a['z']) ** 2) ** .5
    n = max(1, int(-(-d // A.get('step', .2))))
    pri = {'rule': 0, 'road': 1, 'gate': 2, 'obstacle': 3, 'post': 3, 'blocked': 4, 'outside': 5}
    worst, left = None, False
    for k in range(n + 1):
        t = k / n
        q = {'x': a['x'] + (b['x'] - a['x']) * t, 'z': a['z'] + (b['z'] - a['z']) * t}
        ok, qa, kind, _ = area_check(q, inv, area, m, ad)
        if ok and qa == area:
            continue
        if ok:
            left = True
            continue
        if worst is None or pri[kind] < pri[worst]:
            worst = kind
    if worst is None:
        return ['the walk to the next point leaves its area: a route stays in one area.'] if left else []
    return ['the walk to the next point ' + {'road': 'crosses the road.', 'rule': 'goes through a place never used for her.', 'obstacle': 'goes through furniture.', 'post': 'goes through a taxi post.', 'gate': 'goes into a gate.'}.get(worst, 'goes through a wall or a building.')]


# ---- Follow / lead / shared-cab steps (void-runner/npc-escort.js): the same rules, from the admin inventory (npcEscort) ----
ESCORT_KINDS = ('follow-them', 'they-follow', 'their-cab', 'shared-cab')
ESCORT_FIELDS = ('to', 'wait', 'lost', 'ifLost', 'stop')

# ---- Animations on lines and animation steps (void-runner/npc-gestures.js): the clips each character can play, from the admin inventory ----
# (missionEditor.gestures: their own model's clips and library clips; a clip added in Developer Tools > NPCs counts when it is in her published plan's anims
#  and allowed for her, npcPaths.movable[id].anims). The player ('You') has none.
ANIM_CLIP = re.compile(r'^[a-z0-9][a-z0-9-]{0,40}(/[a-z0-9][a-z0-9-]{0,40})?$')
ANIM_HOLD = (0, 30)
# Mission timers (19 Nov 2026, the owner: "mission timers. set the amount of time between actions, lines, etc"): the same ranges as mission-content.js TIME.
TIME = {'lineWait': 60, 'lineShow': 60, 'animFor': 30, 'delay': 600, 'wait': 600, 'near': 50}


def _sec(v, lo, hi):
    return v is None or (type(v) is int and lo <= v <= hi)


def line_time_problems(line):
    out = []
    if not isinstance(line, dict):
        return out
    if not _sec(line.get('wait'), 0, TIME['lineWait']):
        out.append('the wait before a line is a whole number of seconds from 0 to 60.')
    if not _sec(line.get('show'), 1, TIME['lineShow']):
        out.append('"show for" is a whole number of seconds from 1 to 60.')
    if not _sec(line.get('animFor'), 1, TIME['animFor']):
        out.append('an animation on a line lasts a whole number of seconds from 1 to 30.')
    elif line.get('animFor') is not None and line.get('anim') is None:
        out.append('only a line with an animation has an animation time.')
    return out


def gesture_problem(who, clip, inv, npcs=None):
    """Why `clip` cannot be played by NPC `who` ('' when it can)."""
    if not isinstance(clip, str) or len(clip) > 80 or not ANIM_CLIP.match(clip):
        return 'the animation has an unknown name'
    if who == 'You':
        return 'the player\u2019s own line has no animation'
    g = ((inv or {}).get('missionEditor') or {}).get('gestures') or {}
    if clip in ((g.get(who) or {}).get('clips') or []):
        return ''
    mv = _movable(inv).get(who) or {}
    plan = (npcs or {}).get(who) if isinstance(npcs, dict) else None
    if mv and isinstance(plan, dict) and isinstance(plan.get('anims'), list) and clip in plan['anims'] and clip in (mv.get('anims') or []):
        return ''
    return 'not an animation this character can play'


APT_ID = re.compile(r'^[a-z][a-z0-9-]{0,23}$')
APT_AP = re.compile(r'^([a-z][a-z0-9-]{0,23})/(hall|entry)$')
APT_DOOR = re.compile(r'^(apt|biz)-[a-z]+-[nsew]-\d{1,3}$')
# LOCATIONS BUILT FROM MODULES (void-runner/modules.js problems() / analyse(): the same rules, against the admin inventory's `modules`): a mission's apartments entry
# with `modules` is a location; its doors are '<module>.<socket>', a hack names '<location>/<module>.<socket>'.
MOD_ID = re.compile(r'^[a-z][a-z0-9-]{0,11}$')
MOD_REF = re.compile(r'^([a-z][a-z0-9-]{0,11})\.([a-z0-9-]{1,10})$')
MOD_AP = re.compile(r'^([a-z][a-z0-9-]{0,23})/([a-z][a-z0-9-]{0,11})\.([a-z0-9-]{1,10})$')
_NORMAL = {'n': (0, 1), 's': (0, -1), 'e': (1, 0), 'w': (-1, 0)}
_TURN = {'n': 'e', 'e': 's', 's': 'w', 'w': 'n'}
_OPP = {'n': 's', 's': 'n', 'e': 'w', 'w': 'e'}
LOC_KEYS = ['id', 'door', 'from', 'entry', 'modules', 'links', 'locks']
MOD_KEYS = ['id', 'type', 'x', 'z', 'rot', 'floor', 'lightsOff', 'screenOff', 'number', 'items']


def _r2(v):
    import math
    return math.floor(v * 100 + .5) / 100


def _int(v):
    return type(v) is int


def _module_analyse(loc, mi):
    """modules.js analyse(): placed grid modules, snaps (doors two modules share), links, the elevator shaft, the entrance, reachability. Returns (info, problems)."""
    types, grid = mi.get('types') or {}, mi.get('grid') or 2
    out, by, placed, cabs, use, world = [], {}, [], [], {}, {}
    for m in loc.get('modules') or []:
        if not isinstance(m, dict) or m.get('type') not in types or not isinstance(m.get('id'), str) or m['id'] in by:
            continue
        t = types[m['type']]
        b = {'m': m, 't': t, 'p': None}
        by[m['id']] = b
        if not t.get('portal'):
            rot = (round(m.get('rot') or 0) % 4 + 4) % 4 if isinstance(m.get('rot'), (int, float)) else 0
            w, d = (t['d'], t['w']) if rot % 2 else (t['w'], t['d'])
            x, z = (m.get('x') if _int(m.get('x')) else 0), (m.get('z') if _int(m.get('z')) else 0)
            p = {'id': m['id'], 't': t, 'rot': rot, 'x': x, 'z': z, 'w': w, 'd': d, 'floor': m.get('floor') if _int(m.get('floor')) else 0, 'cx': (x + w / 2) * grid, 'cz': (z + d / 2) * grid}
            b['p'] = p
            placed.append(p)
            if t.get('cab'):
                cabs.append(p)

    def name(i):
        return '"%s" (%s)' % (i, (by.get(i, {}).get('t') or {}).get('name', '?'))

    def sock_world(p, s):
        t, W, D, o = p['t'], p['t']['w'] * grid, p['t']['d'] * grid, grid * (s['cell'] + .5)
        e = s['edge']
        lx, lz = (-W / 2 + o, -D / 2) if e == 's' else (-W / 2 + o, D / 2) if e == 'n' else (-W / 2, -D / 2 + o) if e == 'w' else (W / 2, -D / 2 + o)
        c, sn = [1, 0, -1, 0][p['rot']], [0, 1, 0, -1][p['rot']]
        rx, rz = _r2(lx * c + lz * sn), _r2(-lx * sn + lz * c)
        for _ in range(p['rot']):
            e = _TURN[e]
        return _r2(p['cx'] + rx), _r2(p['cz'] + rz), e

    def in_foot(o, x, z):
        return o['x'] * grid + 1e-6 < x < (o['x'] + o['w']) * grid - 1e-6 and o['z'] * grid + 1e-6 < z < (o['z'] + o['d']) * grid - 1e-6

    for i, a in enumerate(placed):
        for b in placed[i + 1:]:
            if a['floor'] == b['floor'] and a['x'] < b['x'] + b['w'] and b['x'] < a['x'] + a['w'] and a['z'] < b['z'] + b['d'] and b['z'] < a['z'] + a['d']:
                out.append('modules %s and %s overlap.' % (name(a['id']), name(b['id'])))
    at = {}
    for p in placed:
        for s in p['t']['sockets']:
            x, z, e = sock_world(p, s)
            ref = p['id'] + '.' + s['id']
            world[ref] = (x, z, e, p['floor'])
            at.setdefault((p['floor'], round(x * 10), round(z * 10)), []).append((p, s, ref, e))
    doors = []
    for lst in at.values():
        for i, a in enumerate(lst):
            for b in lst[i + 1:]:
                if a[0]['id'] != b[0]['id'] and _OPP[a[3]] == b[3] and a[2] not in use and b[2] not in use:
                    use[a[2]], use[b[2]] = b[2], a[2]
                    doors.append(('snap', a[2], b[2]))

    def faces_other(ref, own):
        x, z, e, f = world[ref]
        n = _NORMAL[e]
        return any(o is not own and o['floor'] == own['floor'] and in_foot(o, x + n[0] * .5, z + n[1] * .5) for o in placed)
    for p in placed:
        for s in p['t']['sockets']:
            ref = p['id'] + '.' + s['id']
            if ref not in use and faces_other(ref, p):
                out.append('door %s of %s opens into a wall of another module.' % (s['id'], name(p['id'])))
    links = loc.get('links') or []
    for l in links if isinstance(links, list) else []:
        a, b = MOD_REF.match(str((l or {}).get('a'))), MOD_REF.match(str((l or {}).get('b')))
        ok = a and b and a.group(1) in by and b.group(1) in by and any(s['id'] == a.group(2) for s in by[a.group(1)]['t']['sockets']) and any(s['id'] == b.group(2) for s in by[b.group(1)]['t']['sockets'])
        if not ok or a.group(1) == b.group(1):
            out.append('a connection names a door that does not exist.')
            continue
        if not by[a.group(1)]['t'].get('portal') and not by[b.group(1)]['t'].get('portal'):
            out.append('connect two grid modules by placing them side by side, not with a connection.')
            continue
        if l['a'] in use or l['b'] in use:
            out.append('a door is used twice.')
            continue
        for r, mm in ((l['a'], a), (l['b'], b)):
            p = by[mm.group(1)]['p']
            if p and faces_other(r, p):
                out.append('door %s leads elsewhere but another module stands in front of it.' % r)
        use[l['a']], use[l['b']] = l['b'], l['a']
        doors.append(('portal', l['a'], l['b']))
    floors = {}
    for c in cabs:
        if c['floor'] in floors:
            out.append('two elevator cabs on one floor.')
        floors[c['floor']] = c
    if len(cabs) == 1:
        out.append('the elevator needs a second cab on another floor.')
    for c in cabs:
        if c['id'] + '.s0' not in use:
            out.append('the elevator cab %s has to open onto a lobby, a hallway or a room (its door meets nothing).' % name(c['id']))
    e = MOD_REF.match(str(loc.get('entry') or ''))
    if loc.get('modules'):
        if not e or e.group(1) not in by or not any(s['id'] == e.group(2) for s in by[e.group(1)]['t']['sockets']):
            out.append('choose the entrance: the door of a module the street door leads to.')
        elif loc['entry'] in use:
            out.append('the entrance is already a door between two modules.')
        elif by[e.group(1)]['t'].get('cab'):
            out.append('the street door cannot lead straight into an elevator cab.')
        elif by[e.group(1)]['p'] and faces_other(loc['entry'], by[e.group(1)]['p']):
            out.append('the entrance faces another module: choose an outside door.')
        else:
            doors.append(('entry', loc['entry'], None))
            adj = {}
            for _, a1, b1 in doors:
                if b1:
                    adj.setdefault(a1.split('.')[0], set()).add(b1.split('.')[0])
                    adj.setdefault(b1.split('.')[0], set()).add(a1.split('.')[0])
            for a1 in cabs:
                for b1 in cabs:
                    if a1 is not b1 and a1['floor'] != b1['floor']:
                        adj.setdefault(a1['id'], set()).add(b1['id'])
            seen, q = {e.group(1)}, [e.group(1)]
            while q:
                for y in adj.get(q.pop(), ()):
                    if y not in seen:
                        seen.add(y)
                        q.append(y)
            for i in by:
                if i not in seen:
                    out.append('module %s cannot be reached from the entrance.' % name(i))
    return {'by': by, 'doors': doors, 'use': use}, out


def module_location_problems(a, inv, family=None, shape_only=False):
    """One location (a mission's apartments entry with `modules`): modules.js problems()."""
    mi = (inv or {}).get('modules') or {}
    types, lim, span, fl = mi.get('types') or {}, mi.get('limit') or {'modules': 12, 'items': 20, 'links': 12, 'locks': 12, 'label': 60}, mi.get('span') or 24, mi.get('floors') or [-3, 9]
    item_types = set(mi.get('itemTypes') or ['loot', 'mission-item', 'note', 'other'])
    if not _keys(a, LOC_KEYS):
        return ['it has unknown fields.']
    mods = a.get('modules')
    if not isinstance(mods, list) or not (1 <= len(mods) <= lim['modules']):
        return ['a location has 1 to %d modules.' % lim['modules']]
    if not types:
        return [] if shape_only else ['locations cannot be checked (no module list).']
    out, ids, items = [], set(), 0
    for m in mods:
        w = 'module "%s"' % ((m or {}).get('id') if isinstance(m, dict) else '?')
        if not _keys(m, MOD_KEYS):
            out.append(w + ' has unknown fields.')
            continue
        if not isinstance(m.get('id'), str) or not MOD_ID.match(m['id']) or m['id'] in ids:
            out.append(w + ': its name is lowercase letters, digits and hyphens, unique in the location.')
        ids.add(m.get('id'))
        t = types.get(m.get('type'))
        if not t:
            out.append(w + ': choose a module type.')
            continue
        if t.get('portal'):
            if any(m.get(k) is not None for k in ('x', 'z', 'rot', 'floor')):
                out.append(w + ': it is reached through a connection, it has no place on the grid.')
        else:
            for k in ('x', 'z'):
                if not (_int(m.get(k)) and 0 <= m[k] <= span):
                    out.append(w + ': its place on the grid is a whole number of cells.')
            if m.get('rot') is not None and not (_int(m['rot']) and 0 <= m['rot'] <= 3):
                out.append(w + ': its turn is 0 to 3 quarter turns.')
            if m.get('floor') is not None and not (_int(m['floor']) and fl[0] <= m['floor'] <= fl[1]):
                out.append(w + ': its floor is out of range.')
            if _int(m.get('x')) and _int(m.get('z')):
                ww, dd = (t['d'], t['w']) if (m.get('rot') or 0) % 2 else (t['w'], t['d'])
                if m['x'] + ww > span or m['z'] + dd > span:
                    out.append(w + ': it does not fit on the grid.')
        for k in ('lightsOff', 'screenOff'):
            if m.get(k) is not None and type(m[k]) is not bool:
                out.append(w + ': "lights / screens start" is on or off.')
        if m.get('screenOff') is not None and not t.get('screen'):
            out.append(w + ': it has no screen to switch.')
        if m.get('number') is not None and not (_int(m['number']) and 1 <= m['number'] <= 9999 and (t.get('legacy') or {}).get('part') == 'flat'):
            out.append(w + ': only an apartment has a number on its door (1 to 9999).')
        its = m.get('items')
        if its is not None:
            if not isinstance(its, list):
                out.append(w + ': placed items are a list.')
                continue
            bx = t.get('bounds') or [-4, 4, -5, 5]
            for it in its:
                items += 1
                if not _keys(it, ['type', 'label', 'x', 'z', 'y']) or it.get('type') not in item_types or not _plain(it.get('label'), lim.get('label', 60)):
                    out.append(w + ': a placed item needs a type and a short plain label.')
                    continue
                num = lambda v: isinstance(v, (int, float)) and not isinstance(v, bool)
                if not (num(it.get('x')) and num(it.get('z')) and bx[0] + .1 <= it['x'] <= bx[1] - .1 and bx[2] + .1 <= it['z'] <= bx[3] - .1):
                    out.append(w + ': a placed item must be inside the module.')
                if it.get('y') is not None and not (num(it['y']) and 0 <= it['y'] <= 2.6):
                    out.append(w + ': a placed item\u2019s height is 0 to 2.6 m.')
    if items > lim['items']:
        out.append('a location has at most %d placed items.' % lim['items'])
    if a.get('links') is not None and (not isinstance(a['links'], list) or len(a['links']) > lim['links'] or any(not _keys(l, ['a', 'b']) for l in a['links'])):
        out.append('connections are a list of door pairs.')
    if a.get('locks') is not None and (not isinstance(a['locks'], list) or len(a['locks']) > lim['locks'] or any(not isinstance(r, str) for r in a['locks'])):
        out.append('locked doors are a list.')
    if out:
        return out
    info, probs = _module_analyse(a, mi)
    out += [p for p in probs if not shape_only or not re.search(r'entrance|cannot be reached|second cab|meets nothing', p)]
    for r in a.get('locks') or []:
        d = next((x for x in info['doors'] if r in (x[1], x[2])), None)
        if not d or d[0] == 'entry':
            out.append('locked door %s: choose a door between two modules (or a connection).' % r)
    if not shape_only and family:
        e = MOD_REF.match(str(a.get('entry') or ''))
        t = e and (info['by'].get(e.group(1)) or {}).get('t')
        if t and t.get('family') and t['family'] != family:
            out.append('an older housing hallway or apartment as the entrance goes behind its own kind of street door.')
    return out


def module_door_refs(a, inv):
    """Every door reference of a location (either side), for hack steps."""
    info, _ = _module_analyse(a, (inv or {}).get('modules') or {})
    return {r for d in info['doors'] for r in d[1:] if r}


def apartment_problems(m, inv, shape_only=False):
    """Mission apartments, apartment steps and access-point hacks (void-runner/apartments.js problems(): the same rules, against the admin inventory's
    `apartments` lists). shape_only: the editor's server copy of the draft (an unfinished draft may have no door yet)."""
    ap = (inv or {}).get('apartments') or {}
    styles, objects, item_types = set(ap.get('styles') or []), set(ap.get('objects') or []), set(ap.get('itemTypes') or [])
    doors, items = set((ap.get('doors') or {}).keys()), set(ap.get('items') or [])
    lim, hack, bx = ap.get('limit') or {'perMission': 4, 'items': 20, 'label': 60, 'number': 9999}, ap.get('hack') or {'min': 2, 'max': 30}, ap.get('bounds') or {'x': [-4, 4], 'z': [-5, 5]}
    containers = set(ap.get('containerStyles') or ['container-rundown', 'container-regular'])
    screens = set(ap.get('screenStyles') or ['rundown', 'normal', 'container-rundown', 'container-regular'])
    out = []
    lst = m.get('apartments')
    lst = [] if lst is None else lst
    if not isinstance(lst, list) or len(lst) > lim['perMission']:
        return ['a mission has at most %d apartments.' % lim['perMission']]
    ids, seen = set(), set()
    oids = {o.get('id') for o in (m.get('objectives') or []) if isinstance(o, dict)}

    def num(v):
        return isinstance(v, (int, float)) and not isinstance(v, bool)
    locs = {}
    for a in lst:
        if isinstance(a, dict) and isinstance(a.get('modules'), list):
            w = 'location "%s"' % a.get('id')
            if not isinstance(a.get('id'), str) or not APT_ID.match(a['id']) or a['id'] in ids:
                out.append(w + ': its name must be lowercase letters, digits and hyphens, unique in the mission.')
            ids.add(a.get('id'))
            locs[a.get('id')] = a
            door = a.get('door')
            if shape_only:
                if door not in (None, '') and not (isinstance(door, str) and APT_DOOR.match(door)):
                    out.append(w + ': unknown street door.')
            elif not isinstance(door, str) or door not in doors:
                out.append(w + ': choose a street door.')
            if isinstance(door, str) and door:
                if door in seen:
                    out.append('two apartments of one mission use the same street door.')
                seen.add(door)
            f = a.get('from')
            if f is not None and f != 'start' and f not in oids:
                out.append(w + ': "available from" must be the start or one of its steps.')
            fam = ((ap.get('doors') or {}).get(door) or {}).get('family') if isinstance(door, str) else None
            out += [w + ': ' + p for p in module_location_problems(a, inv, fam or ('city' if door in doors else None), shape_only)]
            continue
        if not _keys(a, ['id', 'style', 'door', 'number', 'from', 'items', 'locked', 'screenOff', 'lightsOff']):
            out.append('an apartment has unknown fields.')
            continue
        w = 'apartment "%s"' % a.get('id')
        if not isinstance(a.get('id'), str) or not APT_ID.match(a['id']) or a['id'] in ids:
            out.append(w + ': its name must be lowercase letters, digits and hyphens, unique in the mission.')
        ids.add(a.get('id'))
        if a.get('style') is not None and a['style'] not in (styles or {'rundown', 'normal', 'luxury', 'container-rundown', 'container-regular'}):
            out.append(w + ': choose rundown, normal or luxury.')
        if not shape_only and a.get('style') is None:
            out.append(w + ': choose rundown, normal or luxury.')
        door = a.get('door')
        if shape_only:
            if door not in (None, '') and not (isinstance(door, str) and APT_DOOR.match(door)):
                out.append(w + ': unknown street door.')
        elif not isinstance(door, str) or door not in doors:
            out.append(w + ': choose a street door.')
        elif isinstance(a.get('style'), str):
            # a container style only behind a container door in The Outskirts, a city style only behind a city door (apartments.js problems())
            fam = ((ap.get('doors') or {}).get(door) or {}).get('family') or 'city'
            if (fam == 'container') != (a['style'] in containers):
                out.append(w + ': a container apartment goes behind a container door in The Outskirts, a city apartment behind a city door.')
            elif fam in ('office', 'commercial'):
                out.append(w + ': an apartment goes behind an apartment-building door, not an office or shop entrance.')
        if isinstance(door, str) and door:
            if door in seen:
                out.append('two apartments of one mission use the same street door.')
            seen.add(door)
        n = a.get('number')
        if n is not None and not (type(n) is int and 1 <= n <= lim['number']):
            out.append(w + ': the number on its door is a whole number from 1 to 9999.')
        for key in ('screenOff', 'lightsOff'):
            if a.get(key) is not None and type(a[key]) is not bool:
                out.append(w + ': "screen / lights start" is on or off.')
        if a.get('screenOff') is not None and a.get('style') not in screens:
            out.append(w + ': only the rundown and normal apartments have an ad screen.')
        if a.get('locked') is not None and type(a['locked']) is not bool:
            out.append(w + ': "locked until hacked" is yes or no.')
        f = a.get('from')
        if f is not None and f != 'start' and f not in oids:
            out.append(w + ': "available from" must be the start or one of its steps.')
        its = a.get('items')
        if its is not None:
            if not isinstance(its, list) or len(its) > lim['items']:
                out.append(w + ': at most %d placed items.' % lim['items'])
            else:
                for it in its:
                    if not _keys(it, ['type', 'label', 'x', 'z', 'y']) or (it.get('type') not in (item_types or {'loot', 'mission-item', 'note', 'other'})) or not _plain(it.get('label'), lim['label']):
                        out.append(w + ': a placed item needs a type and a short plain label.')
                        continue
                    b = (ap.get('boundsByStyle') or {}).get(a.get('style')) or bx
                    if not (num(it.get('x')) and num(it.get('z')) and b['x'][0] + .2 <= it['x'] <= b['x'][1] - .2 and b['z'][0] + .2 <= it['z'] <= b['z'][1] - .2):
                        out.append(w + ': a placed item must be inside the apartment.')
                    if it.get('y') is not None and not (num(it['y']) and 0 <= it['y'] <= 2.4):
                        out.append(w + ': a placed item\u2019s height is 0 to 2.4 m.')
    for o in m.get('objectives') or []:
        if not isinstance(o, dict):
            continue
        k, sid = o.get('kind'), str(o.get('id'))
        if k in ('apt-enter', 'apt-use'):
            if o.get('apt') not in ids and not (shape_only and o.get('apt') is None):
                out.append('step ' + sid + ': choose one of this mission\u2019s apartments.')
            loc = locs.get(o.get('apt'))
            if loc is not None:
                mods = {m.get('id'): m for m in loc.get('modules') or [] if isinstance(m, dict)}
                if o.get('mod') is not None and o['mod'] not in mods:
                    out.append('step ' + sid + ': choose one of the location\u2019s rooms (modules).')
                if k == 'apt-use':
                    t = ((inv or {}).get('modules') or {}).get('types', {}).get((mods.get(o.get('mod')) or {}).get('type'))
                    if o.get('mod') is None and not shape_only:
                        out.append('step ' + sid + ': choose the room (module) where something is used.')
                    elif t is not None and not (o.get('object') in (t.get('objects') or []) or (shape_only and o.get('object') is None)):
                        out.append('step ' + sid + ': choose what is used.')
                if k == 'apt-enter' and o.get('object') is not None:
                    out.append('step ' + sid + ': only a "use something" step names an object.')
                continue
            if o.get('mod') is not None:
                out.append('step ' + sid + ': only a location built from modules has rooms to choose.')
            if k == 'apt-use' and not (o.get('object') in (objects or {'computer', 'panel', 'safe', 'vending', 'closet', 'lights'}) or (shape_only and o.get('object') is None)):
                out.append('step ' + sid + ': choose what is used.')
            if k == 'apt-enter' and o.get('object') is not None:
                out.append('step ' + sid + ': only a "use something" step names an object.')
        elif o.get('apt') is not None or o.get('object') is not None or o.get('mod') is not None:
            out.append('step ' + sid + ': only an apartment step names an apartment.')
        if k == 'hack':
            a = o.get('ap')
            mm = APT_AP.match(a) if isinstance(a, str) else None
            ml = MOD_AP.match(a) if isinstance(a, str) else None
            if a is None and shape_only:
                pass
            elif ml:
                loc = locs.get(ml.group(1))
                if loc is None:
                    out.append('step ' + sid + ': choose one of this mission\u2019s apartments.')
                elif ((inv or {}).get('modules') or {}).get('types') and (ml.group(2) + '.' + ml.group(3)) not in module_door_refs(loc, inv):
                    out.append('step ' + sid + ': choose a door of that location.')
            elif mm:
                if mm.group(1) not in ids:
                    out.append('step ' + sid + ': choose one of this mission\u2019s apartments.')
            elif not (isinstance(a, str) and APT_DOOR.match(a) and (shape_only or a in doors)):
                out.append('step ' + sid + ': choose the access point to hack.')
            h = o.get('hold')
            if h is not None and not (type(h) is int and hack['min'] <= h <= hack['max']):
                out.append('step ' + sid + ': the hack takes a whole number of seconds from %d to %d.' % (hack['min'], hack['max']))
            for key in ('stay', 'unlock'):
                if o.get(key) is not None and type(o[key]) is not bool:
                    out.append('step ' + sid + ': a hack option is yes or no.')
            if o.get('needs') is not None and o['needs'] not in (items or {'ward-kit', 'hacking-device'}):
                out.append('step ' + sid + ': the player can only need an item the game has.')
        elif any(o.get(key) is not None for key in ('ap', 'stay', 'unlock', 'needs')):
            out.append('step ' + sid + ': only a "hack the access point" step names an access point.')
    return out


# CAMERA FEEDS (void-runner/cult-room.js feedProblems / sceneProblems: the same rules, against the admin inventory's `feeds`): mission.feeds and hack steps with a feed.
FEED_ID = re.compile(r'^[a-z][a-z0-9-]{0,23}$')
FEED_DEFAULT = {'rooms': ['blackrock-cult'], 'speakers': ['initiate', 'robed-1', 'robed-2', 'robed-3', 'robed-4', 'robed-5', 'robed-6', 'robed-all'],
                'actors': ['initiate', 'robed-1', 'robed-2', 'robed-3', 'robed-4', 'robed-5', 'robed-6'], 'acts': ['pause', 'door', 'enter', 'turn', 'line', 'rise', 'walk', 'card', 'anim', 'exit'],
                'beatKeys': {'pause': ['secs'], 'door': ['open'], 'enter': ['speed'], 'turn': ['who', 'to', 'secs'], 'line': ['who', 'text', 'anim', 'secs'], 'rise': [], 'walk': ['who', 'to', 'speed'], 'card': [],
                             'anim': ['who', 'clip', 'secs'], 'exit': ['speed', 'gap']},
                'anims': ['talk', 'laugh', 'read', 'shock', 'stand', 'idle'], 'turnWho': ['six', 'initiate', 'robed-1', 'robed-2', 'robed-3', 'robed-4', 'robed-5', 'robed-6'],
                'turnTo': ['initiate', 'owl', 'door', 'centre'], 'walkTo': ['altar', 'centre', 'spot'],
                'limit': {'beats': 80, 'text': 500, 'feeds': 4, 'secs': [0, 60], 'speed': [0.2, 1], 'radius': [2, 3.4], 'gap': [1.2, 3]}}


def feed_scene_problems(sc, inv=None):
    """One camera feed's scene: cult-room.js sceneProblems (shape and order)."""
    fi = dict(FEED_DEFAULT, **((inv or {}).get('feeds') or {}))
    lim = fi['limit']

    def num(v, a, b):
        return isinstance(v, (int, float)) and not isinstance(v, bool) and a <= v <= b
    if not _keys(sc, ['radius', 'speed', 'beats']):
        return ['the scene has unknown fields.']
    out = []
    if sc.get('radius') is not None and not num(sc['radius'], *lim['radius']):
        out.append('the circle radius is out of range.')
    if sc.get('speed') is not None and not num(sc['speed'], *lim['speed']):
        out.append('the walking speed is out of range.')
    bs = sc.get('beats')
    if not isinstance(bs, list) or not 1 <= len(bs) <= lim['beats']:
        return out + ['a scene has 1 to %d beats.' % lim['beats']]
    six = [a for a in fi['actors'] if a != 'initiate']
    st = {'six': 'out', 'init': 'kneel', 'at': 'centre', 'card': False, 'done': False}

    def here(who):
        if who == 'initiate':
            return st['init'] != 'out'
        return st['six'] == 'circle' if who in ('six', 'robed-all') or who in six else False
    for i, b in enumerate(bs):
        w = 'beat %d' % (i + 1)
        act = b.get('act') if isinstance(b, dict) else None
        if act not in fi['acts']:
            out.append(w + ': unknown kind of beat.')
            continue
        if not _keys(b, ['act', 'wait'] + list(fi['beatKeys'].get(act, []))):
            out.append(w + ': unknown fields.')
            continue
        if b.get('wait') is not None and not num(b['wait'], *lim['secs']):
            out.append(w + ': the pause before it is 0 to 60 seconds.')
        if b.get('secs') is not None and not num(b['secs'], 0.5, 60):
            out.append(w + ': it lasts 0.5 to 60 seconds.')
        if b.get('speed') is not None and not num(b['speed'], *lim['speed']):
            out.append(w + ': the walking speed is out of range.')
        if st['done'] and act not in ('pause', 'door'):
            out.append(w + ': everyone has left; only a pause or the door can follow.')
            continue
        who = b.get('who')
        if act == 'pause' and b.get('secs') is None:
            out.append(w + ': say how long the pause lasts.')
        elif act == 'door' and type(b.get('open')) is not bool:
            out.append(w + ': the door opens or closes.')
        elif act == 'enter':
            if st['six'] != 'out':
                out.append(w + ': the six are already in the room.')
            st['six'] = 'circle'
        elif act == 'turn':
            if who not in fi['turnWho'] or b.get('to') not in fi['turnTo'] or not here(who) or (who == 'initiate' and b.get('to') == 'initiate'):
                out.append(w + ': choose who turns, to face what, while they are in the room.')
        elif act == 'line':
            if who not in fi['speakers'] or not here(who):
                out.append(w + ': choose who speaks, while they are in the room.')
            t = b.get('text')
            if t is not None and not (isinstance(t, str) and len(t) <= lim['text'] and not TAGS.search(t)):
                out.append(w + ': a line is plain text, %d characters at most.' % lim['text'])
            if b.get('anim') is not None and (b['anim'] not in fi['anims'] or (who == 'initiate' and st['init'] == 'kneel')):
                out.append(w + ': unknown animation, or the initiate is kneeling.')
        elif act == 'rise':
            if st['init'] != 'kneel':
                out.append(w + ': the initiate is not kneeling.')
            st['init'] = 'stand'
        elif act == 'walk':
            if who not in fi['actors'] or b.get('to') not in fi['walkTo']:
                out.append(w + ': choose who walks and where to.')
            elif who == 'initiate':
                if st['init'] != 'stand':
                    out.append(w + ': the initiate must rise first.')
                else:
                    st['at'] = 'centre' if b['to'] == 'spot' else b['to']
            elif st['six'] != 'circle':
                out.append(w + ': the six are not in the room yet.')
        elif act == 'card':
            if st['at'] != 'altar' or st['card']:
                out.append(w + ': the initiate must be at the altar, and the card is taken once.')
            st['card'] = True
        elif act == 'anim':
            if who not in ['six'] + fi['actors'] or b.get('clip') not in fi['anims'] or not here(who) or (who == 'initiate' and st['init'] == 'kneel'):
                out.append(w + ': choose who plays which animation, while they are in the room and standing.')
        elif act == 'exit':
            if st['six'] != 'circle' or st['init'] != 'stand':
                out.append(w + ': the six must enter and the initiate rise first.')
            else:
                st['six'] = st['init'] = 'out'
                st['done'] = True
            if b.get('gap') is not None and not num(b['gap'], *lim['gap']):
                out.append(w + ': the gap in the line is out of range.')
    return out


def feed_problems(m, inv=None):
    """A mission's camera feeds and the hack steps that show them (cult-room.js feedProblems)."""
    fi = dict(FEED_DEFAULT, **((inv or {}).get('feeds') or {}))
    out, ids, fs = [], set(), m.get('feeds')
    if fs is not None:
        if not isinstance(fs, list) or len(fs) > fi['limit']['feeds']:
            return ['a mission has at most %d camera feeds.' % fi['limit']['feeds']]
        for f in fs:
            if not _keys(f, ['id', 'room', 'scene']) or not (isinstance(f.get('id'), str) and FEED_ID.match(f['id'])):
                out.append('a camera feed needs a short name.')
                continue
            if f['id'] in ids:
                out.append('two camera feeds have the same name.')
            ids.add(f['id'])
            if f.get('room') not in fi['rooms']:
                out.append('camera feed ' + f['id'] + ': choose the room it shows.')
            if f.get('scene') is not None:
                out += ['camera feed ' + f['id'] + ': ' + p for p in feed_scene_problems(f['scene'], inv)]
    for o in m.get('objectives') or []:
        if not isinstance(o, dict) or o.get('feed') is None:
            continue
        if o.get('kind') != 'hack':
            out.append('step ' + str(o.get('id')) + ': only a "hack the access point" step shows a camera feed.')
        elif o['feed'] not in ids:
            out.append('step ' + str(o.get('id')) + ': choose one of this mission\u2019s camera feeds.')
    return out


def feed_shape_problems(trees):
    """The editor's server copy of the draft: camera feeds and their scenes are well formed."""
    out = []
    for t in trees if isinstance(trees, list) else []:
        for m in (t.get('missions') or []) if isinstance(t, dict) else []:
            if isinstance(m, dict):
                out += feed_problems(m, {})
    return out


# ZONES (void-runner/zones.js: the same rules, against the admin inventory's `zones`): the owner's Zones table (content.zones), a mission's `combat`
# (zones of its locations, rooms and city areas, its armed people, what happens when the player is taken down) and the "Change zone" step.
ZONE_DEFAULT = {'zones': ['friendly', 'neutral', 'hostile'], 'figures': ['security', 'merc', 'enforcer'], 'roles': ['guard', 'patrol'], 'onDeath': ['retry', 'fail'],
                'limit': {'armed': 12, 'route': 6, 'areas': 40, 'places': 24, 'table': 240}, 'stepKeys': ['target', 'zone', 'until', 'spawn']}
ZONE_ID = re.compile(r'^[a-z][a-z0-9-]{0,23}$')
ZONE_REF = re.compile(r'^([a-z][a-z0-9-]{0,23})(?:/([a-z][a-z0-9-]{0,11}))?$')


def _zone_inv(inv):
    return dict(ZONE_DEFAULT, **((inv or {}).get('zones') or {}))


def _num(v):
    return type(v) in (int, float) and v == v and abs(v) != float('inf')


def zone_ref(m, ref):
    """The room a reference names in a mission's apartments: (location, module id or None, module type or None), or None (zones.js refOf)."""
    r = ZONE_REF.match(ref) if isinstance(ref, str) else None
    if not r:
        return None
    a = next((x for x in (m.get('apartments') or []) if isinstance(x, dict) and x.get('id') == r.group(1)), None)
    if a is None:
        return None
    if not r.group(2):
        return (a, None, None)
    if isinstance(a.get('modules'), list):
        mm = next((x for x in a['modules'] if isinstance(x, dict) and x.get('id') == r.group(2)), None)
        return (a, mm['id'], mm.get('type')) if mm else None
    if r.group(2) in ('flat', 'hall'):
        return (a, r.group(2), ('apt-' if r.group(2) == 'flat' else 'hall-') + str(a.get('style')))
    return None


def zone_table_problems(z, inv=None):
    """The owner's Zones table (zones.js tableProblems)."""
    zi, out = _zone_inv(inv), []
    if z is None:
        return out
    if not _keys(z, ['areas', 'modules']):
        return ['Zones table: unknown fields.']
    places = set(((inv or {}).get('missionEditor') or {}).get('places') or [])
    types = set((((inv or {}).get('modules') or {}).get('types') or {}).keys())
    n = 0
    for k, label, known in (('areas', 'area', places), ('modules', 'location type', types)):
        v = z.get(k)
        if v is None:
            continue
        if not isinstance(v, dict):
            out.append('Zones table: ' + k + ' is a list of ' + label + 's and zones.')
            continue
        for i, zz in v.items():
            n += 1
            if zz not in zi['zones']:
                out.append('Zones table: ' + label + ' "' + str(i) + '" must be Friendly, Neutral or Hostile.')
            if known and i not in known:
                out.append('Zones table: there is no ' + label + ' "' + str(i) + '".')
    if n > zi['limit']['table']:
        out.append('Zones table: at most %d entries.' % zi['limit']['table'])
    return out


def combat_problems(m, inv=None, shape_only=False):
    """A mission's zones and armed people (zones.js combatProblems)."""
    zi, out, c = _zone_inv(inv), [], m.get('combat')
    if c is None:
        return out
    if not _keys(c, ['areas', 'places', 'armed', 'onDeath']):
        return ['zones and enemies: unknown fields.']
    lim = zi['limit']
    places = None if shape_only else set(((inv or {}).get('missionEditor') or {}).get('places') or [])
    types = (((inv or {}).get('modules') or {}).get('types') or {})
    if c.get('areas') is not None:
        if not isinstance(c['areas'], dict) or len(c['areas']) > lim['areas']:
            out.append('zones: at most %d areas, each Friendly, Neutral or Hostile.' % lim['areas'])
        else:
            for i, z in c['areas'].items():
                if z not in zi['zones']:
                    out.append('zones: area "' + str(i) + '" must be Friendly, Neutral or Hostile.')
                if places and i not in places:
                    out.append('zones: there is no area "' + str(i) + '".')
    if c.get('places') is not None:
        if not isinstance(c['places'], dict) or len(c['places']) > lim['places']:
            out.append('zones: at most %d locations or rooms, each Friendly, Neutral or Hostile.' % lim['places'])
        else:
            for ref, z in c['places'].items():
                if z not in zi['zones']:
                    out.append('zones: "' + str(ref) + '" must be Friendly, Neutral or Hostile.')
                if not zone_ref(m, ref):
                    out.append('zones: "' + str(ref) + '" is not one of this mission\u2019s locations or rooms.')
    if c.get('onDeath') is not None and c['onDeath'] not in zi['onDeath']:
        out.append('if the player is taken down: try again or fail the mission.')
    armed = c.get('armed')
    if armed is not None:
        if not isinstance(armed, list) or len(armed) > lim['armed']:
            return out + ['a mission has at most %d armed people.' % lim['armed']]
        ids = set()
        for a in armed:
            w = 'armed person "' + str(a.get('id') if isinstance(a, dict) else '?') + '"'
            if not _keys(a, ['id', 'at', 'x', 'z', 'figure', 'role', 'route', 'yaw']):
                out.append(w + ' has unknown fields.')
                continue
            if not isinstance(a.get('id'), str) or not ZONE_ID.match(a['id']):
                out.append(w + ': its name is lowercase letters, digits and hyphens (24 at most).')
            elif a['id'] in ids:
                out.append(w + ': two armed people have the same name.')
            ids.add(a.get('id'))
            if a.get('figure') not in zi['figures']:
                out.append(w + ': choose a figure.')
            if a.get('role') is not None and a['role'] not in zi['roles']:
                out.append(w + ': guard or patrol.')
            if a.get('yaw') is not None and not _num(a['yaw']):
                out.append(w + ': the way they face is a number.')
            r = zone_ref(m, a.get('at'))
            if not r or not r[1]:
                out.append(w + ': choose the room (module) they stand in.')
                continue
            b = (types.get(r[2]) or {}).get('bounds')

            def inside(x, z):
                return _num(x) and _num(z) and (not b or (b[0] <= x <= b[1] and b[2] <= z <= b[3]))
            if not inside(a.get('x'), a.get('z')):
                out.append(w + ': they must stand inside the room.')
            rt = a.get('route')
            if rt is not None and (not isinstance(rt, list) or len(rt) > lim['route'] or any(not isinstance(p, list) or len(p) != 2 or not inside(p[0], p[1]) for p in rt)):
                out.append(w + ': a patrol route is up to %d points inside the room.' % lim['route'])
            if a.get('role') == 'patrol' and not (isinstance(rt, list) and len(rt) >= 1):
                out.append(w + ': a patrol needs at least one route point.')
    return out


def zone_step_problems(m, o, inv=None, shape_only=False):
    """The "Change zone" step (zones.js stepProblems)."""
    zi, out, w = _zone_inv(inv), [], 'step ' + str(o.get('id'))
    if o.get('kind') != 'zone':
        if any(o.get(k) is not None for k in zi['stepKeys']):
            out.append(w + ': only a "Change zone" step names a zone.')
        return out
    if o.get('zone') not in zi['zones']:
        out.append(w + ': choose Friendly, Neutral or Hostile.')
    t = o.get('target')
    places = None if shape_only else set(((inv or {}).get('missionEditor') or {}).get('places') or [])
    if not isinstance(t, str) or not t:
        out.append(w + ': choose the room, location or area that changes.')
    elif t.startswith('area:'):
        if places and t[5:] not in places:
            out.append(w + ': there is no area "' + t[5:] + '".')
    elif not zone_ref(m, t):
        out.append(w + ': "' + t + '" is not one of this mission\u2019s locations or rooms.')
    if o.get('until') is not None:
        steps = [x.get('id') if isinstance(x, dict) else None for x in (m.get('objectives') or [])]
        i = steps.index(o.get('id')) if o.get('id') in steps else -1
        j = steps.index(o['until']) if o['until'] in steps else -1
        if j < 0 or j <= i:
            out.append(w + ': "until" must be a later step of this mission (or leave it empty: until the mission ends).')
    if o.get('spawn') is not None and type(o['spawn']) is not bool:
        out.append(w + ': "bring in the armed people placed there" is yes or no.')
    if o.get('say') is not None or o.get('early') is not None or o.get('via') is not None:
        out.append(w + ': a "Change zone" step has no lines.')
    return out


def zone_shape_problems(trees):
    """The editor's server copy of the draft: zones, armed people and "Change zone" steps are well formed (areas are checked when publishing)."""
    out = []
    for t in trees if isinstance(trees, list) else []:
        for m in (t.get('missions') or []) if isinstance(t, dict) else []:
            if isinstance(m, dict):
                out += combat_problems(m, {}, shape_only=True)
                for o in m.get('objectives') or []:
                    if isinstance(o, dict):
                        out += zone_step_problems(m, o, {}, shape_only=True)
    return out


def apartment_shape_problems(trees):
    """The editor's server copy of the draft: apartments and their steps are well formed (doors are checked when publishing)."""
    out = []
    for t in trees if isinstance(trees, list) else []:
        for m in (t.get('missions') or []) if isinstance(t, dict) else []:
            if isinstance(m, dict):
                out += apartment_problems(m, {}, shape_only=True)
    return out


def gesture_shape_problems(trees):
    """The editor's server copy of the draft: animation names and waits are well formed (who may play them is checked when publishing)."""
    out = []
    for t in trees if isinstance(trees, list) else []:
        for m in (t.get('missions') or []) if isinstance(t, dict) else []:
            if not isinstance(m, dict):
                continue
            groups = [m.get('offer'), ((m.get('ending') or {}) if isinstance(m.get('ending'), dict) else {}).get('say'), ((m.get('start') or {}) if isinstance(m.get('start'), dict) else {}).get('denySay')]
            for o in m.get('objectives') or []:
                if not isinstance(o, dict):
                    continue
                groups += [o.get('say'), o.get('early'), o.get('wrong')]
                if o.get('clip') is not None and not (isinstance(o['clip'], str) and ANIM_CLIP.match(o['clip'])):
                    out.append('an animation step names an unknown animation.')
                h = o.get('hold')
                if h is not None and not (type(h) is int and 0 <= h <= TIME['wait']):
                    out.append('a step waits a whole number of seconds from 0 to 600.')
                if not _sec(o.get('delay'), 0, TIME['delay']):
                    out.append('the delay before a step is a whole number of seconds from 0 to 600.')
                if not _sec(o.get('near'), 1, TIME['near']):
                    out.append('a wait step\u2019s distance is a whole number of metres from 1 to 50.')
            for ls in groups:
                for line in ls if isinstance(ls, list) else []:
                    out += line_time_problems(line)
                    a = line.get('anim') if isinstance(line, dict) else None
                    if a is not None and not (isinstance(a, str) and len(a) <= 80 and ANIM_CLIP.match(a)):
                        out.append('a line names an unknown animation.')
    return out


def placed_area(npc, wait_at, plan, inv):
    """The area Reverie, Lace or the cat is placed in for a mission (void-runner/npc-escort.js placedArea): where she waits for it, else her all-day placement, else The Avenue."""
    if isinstance(wait_at, dict) and _num(wait_at.get('x')) and _num(wait_at.get('z')):
        a = area_of(wait_at, inv)
        if a:
            return a
    t = None
    if isinstance(plan, dict):
        if plan.get('mode') == 'stay':
            t = plan
        elif plan.get('mode') == 'path' and isinstance(plan.get('points'), list) and plan['points']:
            t = plan['points'][0]
    if isinstance(t, dict) and _num(t.get('x')) and _num(t.get('z')):
        return area_of(t, inv) or 'avenue'
    return 'avenue'


def escort_problems(o, inv, area='avenue'):
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
            sp = spot_problems(npc, t, inv)
            out += sp
            if not sp and _num(t.get('x')) and _num(t.get('z')) and area_of(t, inv) not in (None, area):
                out.append('that spot is not in the area she is placed in for this mission.')
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
        elif o.get('stop') not in ((who.get('stopsByArea') or {}).get(area, who.get('stops') or []) if who.get('stopsByArea') else (who.get('stops') or [])):
            out.append('choose a cab stop they can get to (a stop in the area she is placed in for this mission).')
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
            out += [pw + x for x in _leg_problems(mv, q, n, inv)]
    if all(isinstance(q, dict) and q.get('action') == 'walk-on' for q in pts):
        out.append('at least one point needs something to do.')
    ids = set(area_of(q, inv) for q in pts if isinstance(q, dict) and _num(q.get('x')) and _num(q.get('z'))) - {None}
    if len(ids) > 1:
        out.append('a route stays in one area.')
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


def voice_model(v):
    """The ElevenLabs model of a choice or a revoice-engines.json entry: its own 'model', else '(model ...)' in 'chosen', else Eleven v4 (npc-voices.js modelOf)."""
    m = v.get('model') if isinstance(v, dict) else None
    if isinstance(m, str) and m in VOICE_MODELS:
        return m
    hit = re.search(r'\(model ([a-z0-9_]+)\)', str((v or {}).get('chosen') or '')) if isinstance(v, dict) else None
    return hit.group(1) if hit and hit.group(1) in VOICE_MODELS else DEFAULT_VOICE_MODEL


def speak_text(text, e):
    """The text a voice is sent: with its voice tags for an ElevenLabs model that reads them, without them for Kokoro and every other model."""
    if e and e.get('engine') == 'elevenlabs' and VOICE_MODELS.get(e.get('model') or DEFAULT_VOICE_MODEL, {}).get('tags'):
        return re.sub(r'[ \t]{2,}', ' ', text).strip()
    return strip_voice_tags(text).strip()


def voice_ok(v):
    return _keys(v, ['engine', 'voiceId', 'name', 'chosen', 'model']) and (v.get('model') is None or v.get('model') in VOICE_MODELS) and v.get('engine') == 'elevenlabs' and isinstance(v.get('voiceId'), str) and bool(VOICE_ID.match(v['voiceId'])) \
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
        elif isinstance(v, dict) and v.get('model') is not None and v.get('model') not in VOICE_MODELS:
            out.append('%s: unknown ElevenLabs model "%s" (choose one from the list).' % (who, str(v.get('model'))[:40]))
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
    if not _keys(st, ['how', 'channel', 'from', 'header', 'text', 'when', 'accept'] + ASK_KEYS) or st.get('how') not in HOW:
        return ['unknown way of starting.']
    if st.get('accept') is not None and type(st['accept']) is not bool:
        return ['"Ask the player: ACCEPT or DENY" must be yes or no.']
    if st['how'] == 'person':
        return [] if set(st) <= {'how', 'accept', *ASK_KEYS} else ['a mission given in person has no notification fields.']
    out = []
    if st.get('channel') not in CHANNELS:
        out.append('unknown notification channel.')
    if st.get('from') not in givers:
        out.append('the notification must come from a known NPC.')
    if (st.get('channel') != 'notify' or st.get('header') is not None) and not _plain(st.get('header'), 80):
        out.append('the notification needs a header (plain text, 80 characters at most).')
    if not _plain(st.get('text'), 500):
        out.append('the notification needs its text (plain text, 500 characters at most).')
    else:
        out += ['the notification text: ' + p for p in voice_tag_problems(st['text'])]
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


def ask_problems(st, tree, trees):
    """ACCEPT / DENY settings of a start (any way of starting). Same rules as mission-content.js checkAsk() (the lines are checked by the caller)."""
    out = []
    if not isinstance(st, dict):
        return out
    if any(st.get(k) is not None for k in ASK_KEYS) and st.get('accept') is not True:
        out.append('button labels and "what happens on DENY" need "Ask the player: ACCEPT or DENY".')
    for k in ('yes', 'no'):
        if st.get(k) is not None and not _plain(st[k], LABEL_MAX):
            out.append('a button label must be plain text, %d characters at most.' % LABEL_MAX)
    if st.get('deny') is not None and st['deny'] not in DENY:
        out.append('unknown "what happens on DENY".')
    if st.get('deny') == 'start':
        firsts = {t['missions'][0].get('id') for t in trees if isinstance(t, dict) and t is not tree and isinstance(t.get('missions'), list) and t['missions'] and isinstance(t['missions'][0], dict)}
        if st.get('denyStart') not in firsts:
            out.append('on DENY it must start the first mission of another tree.')
    elif st.get('denyStart') is not None:
        out.append('only "start another mission" names a mission to start.')
    dm = st.get('denyMinutes')
    if dm is not None and (st.get('deny') != 'after' or not (type(dm) is int and DENY_MIN_MIN <= dm <= DENY_MIN_MAX)):
        out.append('"offer again after N minutes" needs a whole number of minutes from %d to %d.' % (DENY_MIN_MIN, DENY_MIN_MAX))
    return out


def ask_step_problems(o, m, tree, trees, givers):
    """An "Ask the player" step in the middle of a mission (mission-content.js checkAskStep()). The lines after DENY are checked by the caller."""
    out = []
    objs = [x for x in (m.get('objectives') or []) if isinstance(x, dict)]
    ids = [x.get('id') for x in objs]
    i = ids.index(o.get('id')) if o.get('id') in ids else -1
    j = ids.index(o.get('goto')) if o.get('goto') in ids else -1
    d = 'end' if o.get('deny') is None else o.get('deny')
    if not _plain(o.get('question'), 300):
        out.append('the question needs your words (plain text, 300 characters at most).')
    else:
        out += ['the question: ' + p for p in voice_tag_problems(o['question'])]
    if o.get('npc') not in (None, '') and (o.get('npc') == 'You' or o.get('npc') not in givers):
        out.append('who asks must be a known NPC.')
    for k in ('yes', 'no'):
        if o.get(k) is not None and not _plain(o[k], LABEL_MAX):
            out.append('a button label must be plain text, %d characters at most.' % LABEL_MAX)
    if d not in ASK_STEP_DENY:
        out.append('unknown "what happens on DENY".')
    if d == 'skip':
        if not j > i:
            out.append('on DENY it must skip to a later step of this mission.')
    elif d == 'back':
        if not 0 <= j < i:
            out.append('on DENY it must go back to an earlier step of this mission.')
        else:
            again = {x.get('id') for x in objs[j:i]}
            if any(isinstance(u, dict) and u.get('when') in again and u.get('kind') in ('credits', 'reputation') for u in (m.get('unlocks') or [])):
                out.append('going back repeats a step that gives credits or standing each time.')
    elif o.get('goto') is not None:
        out.append('only "skip to" or "go back to" names a step.')
    if d == 'tree':
        firsts = {t['missions'][0].get('id') for t in trees if isinstance(t, dict) and t is not tree and isinstance(t.get('missions'), list) and t['missions'] and isinstance(t['missions'][0], dict)}
        if o.get('denyStart') not in firsts:
            out.append('on DENY it must start the first mission of another tree.')
    elif o.get('denyStart') is not None:
        out.append('only "start another tree" names a mission to start.')
    pr = o.get('price')
    if pr is not None and not (type(pr) is int and 1 <= pr <= MONEY_MAX):
        out.append('what the player pays on ACCEPT must be a whole number from 1 to 100000 credits.')
    if any(o.get(k) is not None for k in ('via', 'early', 'wrong')):
        out.append('an "Ask the player" step has only the lines after ACCEPT and after DENY.')
    return out


def cost_problems(m, step_ids):
    """What the player pays (mission-content.js checkCost())."""
    c = m.get('cost')
    if c is None:
        return []
    if not _keys(c, ['amount', 'when', 'refund']):
        return ['the cost has unknown fields.']
    out = []
    if not (type(c.get('amount')) is int and 1 <= c['amount'] <= MONEY_MAX):
        out.append('what the player pays must be a whole number from 1 to 100000 credits.')
    when = 'accept' if c.get('when') is None else c['when']
    if when != 'accept' and when not in step_ids:
        out.append('the cost is charged at a step that is not in this mission.')
    if c.get('refund') is not None and (type(c['refund']) is not bool or (c['refund'] and when != 'accept')):
        out.append('"refund if abandoned" is only for a cost charged at ACCEPT.')
    st = m.get('start')
    if when == 'accept' and not (isinstance(st, dict) and st.get('accept') is True):
        out.append('a mission the player pays for when accepting must ask the player ACCEPT or DENY.')
    return out


def workspace_money_problems(trees):
    """The Mission Editor's server copy (void_runner_drafts.py): only the shapes that would be refused anyway (credits range, label length); everything else is checked at publish."""
    out = []
    for t in trees if isinstance(trees, list) else []:
        for m in (t.get('missions') if isinstance(t, dict) and isinstance(t.get('missions'), list) else []):
            if not isinstance(m, dict):
                continue
            c, r, st = m.get('cost'), m.get('rewards'), m.get('start')
            if r is not None and not (type(r) is int and 0 <= r <= MONEY_MAX):
                out.append('credits paid must be a whole number from 0 to 100000.')
            if c is not None and not (isinstance(c, dict) and type(c.get('amount')) is int and 1 <= c['amount'] <= MONEY_MAX):
                out.append('what the player pays must be a whole number from 1 to 100000 credits.')
            if isinstance(st, dict):
                for k in ('yes', 'no'):
                    if st.get(k) is not None and not (isinstance(st[k], str) and len(st[k]) <= LABEL_MAX and not TAGS.search(st[k])):
                        out.append('a button label must be plain text, %d characters at most.' % LABEL_MAX)
                if st.get('deny') is not None and st['deny'] not in DENY:
                    out.append('unknown "what happens on DENY".')
                dm = st.get('denyMinutes')
                if dm is not None and (st.get('deny') != 'after' or not (type(dm) is int and DENY_MIN_MIN <= dm <= DENY_MIN_MAX)):
                    out.append('"offer again after N minutes" needs a whole number of minutes from %d to %d.' % (DENY_MIN_MIN, DENY_MIN_MAX))
            for o in (m.get('objectives') if isinstance(m.get('objectives'), list) else []):
                if not isinstance(o, dict) or o.get('kind') != 'ask':
                    continue
                pr = o.get('price')
                if pr is not None and not (type(pr) is int and 1 <= pr <= MONEY_MAX):
                    out.append('what the player pays on ACCEPT must be a whole number from 1 to 100000 credits.')
                for k in ('yes', 'no'):
                    if o.get(k) is not None and not (isinstance(o[k], str) and len(o[k]) <= LABEL_MAX and not TAGS.search(o[k])):
                        out.append('a button label must be plain text, %d characters at most.' % LABEL_MAX)
                if o.get('deny') is not None and o['deny'] not in ASK_STEP_DENY:
                    out.append('unknown "what happens on DENY".')
                q = o.get('question')
                if q is not None and not (isinstance(q, str) and len(q) <= 300 and not TAGS.search(q)):
                    out.append('the question must be plain text, 300 characters at most.')
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


def check_trees(trees, inv, err, npcs=None):
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
            for p in line_time_problems(line):
                err(w + ': ' + p)
            if not _keys(line, ['who', 'text', 'anim', 'wait', 'show', 'animFor']) or not _plain(line.get('text'), 500):
                err(w + ': a line must be plain text.')
            elif line.get('who') != 'You' and line.get('who') not in givers:
                err(w + ': unknown speaker.')
            else:
                for p in voice_tag_problems(line['text']):
                    err(w + ': ' + p)
                if line.get('anim') is not None:
                    p = gesture_problem(line.get('who'), line['anim'], inv, npcs)
                    if p:
                        err(w + ': ' + p + '.')
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
            if not _keys(m, ['id', 'number', 'title', 'type', 'category', 'giver', 'location', 'start', 'objective', 'description', 'rewards', 'offer', 'objectives', 'ending', 'unlocks', 'waitAt', 'cost', 'apartments', 'feeds', 'combat']):
                err(tw + ': unknown fields in a mission.')
                continue
            w = tw + ' / ' + str(m.get('id'))
            for p in apartment_problems(m, inv):
                err(w + ': ' + p)
            for p in feed_problems(m, inv):
                err(w + ': ' + p)
            for p in combat_problems(m, inv):
                err(w + ': ' + p)
            for o in m.get('objectives') or []:
                if isinstance(o, dict):
                    for p in zone_step_problems(m, o, inv):
                        err(w + ': ' + p)
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
                for p in start_problems(m['start'], givers, places, every_mission) + ask_problems(m['start'], t, trees):
                    err(w + ': ' + p)
                if isinstance(m['start'], dict):
                    lines(m['start'].get('denySay'), w + ' / on DENY')
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
                if not _keys(o, ['id', 'label', 'kind', 'npc', 'place', 'item', 'say', 'early', 'subject', 'subjects', 'wrong', 'via', 'clip', 'hold', 'delay', 'near', 'apt', 'mod', 'object', 'ap', 'stay', 'unlock', 'needs', 'feed', 'target', 'zone', 'until', 'spawn', *ASK_STEP_KEYS, *ESCORT_FIELDS]):
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
                    area = placed_area(o.get('npc'), m.get('waitAt') if m.get('giver') == o.get('npc') else None, (npcs or {}).get(o.get('npc')), inv)
                    for p in escort_problems(o, inv, area):
                        err(ow + ': ' + p)
                elif kind == 'anim':
                    if o.get('npc') not in givers:
                        err(ow + ': choose who plays the animation.')
                    else:
                        p = gesture_problem(o.get('npc'), o.get('clip'), inv, npcs)
                        if p:
                            err(ow + ': ' + p + '.')
                    h = o.get('hold')
                    if h is not None and not (type(h) is int and ANIM_HOLD[0] <= h <= ANIM_HOLD[1]):
                        err(ow + ': the wait after an animation is a whole number of seconds from 0 to 30.')
                    if any(o.get(k) is not None for k in ('say', 'early', 'via')):
                        err(ow + ': an animation step has no lines.')
                elif kind == 'wait':
                    h, near = o.get('hold'), o.get('near')
                    if not (type(h) is int and 1 <= h <= TIME['wait']):
                        err(ow + ': a wait step waits a whole number of seconds from 1 to 600.')
                    if near is not None and not (type(near) is int and 1 <= near <= TIME['near']):
                        err(ow + ': "only while the player stays within" is a whole number of metres from 1 to 50.')
                    if near is not None and o.get('npc') not in talk:
                        err(ow + ': choose who the player must stay near.')
                    elif o.get('npc') not in (None, '') and near is None:
                        err(ow + ': a wait step names a person only with a distance.')
                    if any(o.get(k) is not None for k in ('say', 'early', 'via')):
                        err(ow + ': a wait step has no lines.')
                elif kind == 'ask':
                    for p in ask_step_problems(o, m, t, trees, givers):
                        err(ow + ': ' + p)
                elif kind == 'photo' and o.get('npc') not in subjects:
                    err(ow + ': not someone the V1 camera can identify.')
                elif kind == 'send-photo' and (o.get('npc') not in givers or o.get('subject') not in subjects):
                    err(ow + ': the photo must go to a known NPC and show someone the camera can identify.')
                if kind != 'ask' and any(o.get(k) is not None for k in ASK_STEP_KEYS):
                    err(ow + ': only an "Ask the player" step has a question, buttons or what happens on DENY.')
                if kind != 'anim' and o.get('clip') is not None:
                    err(ow + ': only an animation step names an animation.')
                if kind not in ('anim', 'wait', 'hack') and o.get('hold') is not None:
                    err(ow + ': only an animation or wait step has a number of seconds.')
                if kind != 'wait' and o.get('near') is not None:
                    err(ow + ': only a wait step has a distance.')
                if not _sec(o.get('delay'), 0, TIME['delay']):
                    err(ow + ': the delay before a step is a whole number of seconds from 0 to 600.')
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
                lines(o.get('denySay'), ow + ' / after DENY')
            for p in cost_problems(m, oids):
                err(w + ': ' + p)
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
    if not (content.get('beginner') or content.get('registry') or content.get('lines') or content.get('trees') or content.get('names') or content.get('npcs') or content.get('voices') or content.get('looks') or content.get('clips')):
        raise DraftError('There is nothing to publish.', 422)
    missing = clips_missing(db, sorted({c['hash'] for c in content.get('clips') or []}))
    if missing:
        raise DraftError('%d imported voice file(s) are not on the server yet. Press PUBLISH again (the editor uploads them first).' % len(missing), 422, {'missing': missing})
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
    vid, vname, vmodel = item.get('voiceId'), item.get('voiceName'), item.get('model')
    if vmodel is not None and vmodel not in VOICE_MODELS:
        raise DraftError('Unknown ElevenLabs model: choose one from the list.', 422)
    if vid is not None or vname is not None:
        if not (isinstance(vid, str) and VOICE_ID.match(vid) and _plain(vname, 60)):
            raise DraftError('A chosen ElevenLabs voice needs its 20-character voice ID and a plain name.', 422)
        return {'engine': 'elevenlabs', 'voice': vname.strip(), 'voiceId': vid, 'model': vmodel or DEFAULT_VOICE_MODEL, 'from': 'editor'}
    p = published.get(who)
    if isinstance(p, dict) and voice_ok(p):
        return {'engine': 'elevenlabs', 'voice': p['name'], 'voiceId': p['voiceId'], 'model': voice_model(p), 'from': 'published'}
    if who in eng:
        e = dict(eng[who])
        if e.get('engine') == 'elevenlabs':
            e['model'] = voice_model(e)
        return e
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
        if not _keys(it, ['ref', 'who', 'text', 'from', 'mission', 'source', 'voiceId', 'voiceName', 'model']):
            raise DraftError('Unknown fields in a re-voice item.')
        who, text = it.get('who'), it.get('text')
        if voice_refusal(who, reg):
            raise DraftError('This character cannot be re-voiced: ' + voice_refusal(who, reg), 422)
        if not _plain(text, 500):
            raise DraftError('A line must be plain text, 500 characters at most.')
        tp = voice_tag_problems(text)
        if tp:
            raise DraftError(tp[0])
        extra = {k: str(it.get(k) or '')[:200] for k in ['ref', 'from', 'mission', 'source'] if not TAGS.search(str(it.get(k) or ''))}
        e = revoice_engine(who, it, published, eng)
        if e is None:
            raise DraftError('Only characters with a registered voice or a chosen ElevenLabs voice can be re-voiced (broadcast voices and the reserved slot cannot).', 422)
        # text: what players see (the clip is found by it); speak: what the voice is sent (voice tags kept only for an ElevenLabs model that reads them)
        shown, said = strip_voice_tags(text).strip(), speak_text(text, e)
        rec = {'id': item_id(who, shown), 'who': who, 'text': shown, 'engine': e['engine'], 'status': 'queued', 'at': int(time.time()), **extra}
        if said != shown:
            rec['speak'] = said
        if e['engine'] == 'elevenlabs':
            rec.update(voice=e.get('voice', ''), voiceId=e.get('voiceId', ''), model=e.get('model') or DEFAULT_VOICE_MODEL, waiting='waiting for ElevenLabs re-voice (needs approval)')
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
            if old and old.get('status') == 'done' and old.get('speak', old.get('text')) == rec.get('speak', rec['text']):
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


# ---------------------------------------------------------------- imported voice files (Developer Tools, 19 Nov 2026)
# The owner imports an audio file for a line (void-runner/voice-imports.js). PUBLISH uploads it here first: one Firestore document per file in CLIPS, keyed by the
# file's SHA-256 (content-addressed, created once, never changed), base64 audio well under Firestore's 1 MiB document limit. Published content references files by
# hash (content.clips). Players read them with no sign-in (GET voice-clip/<hash>, cached for a year). Firebase Storage is not used (it needs a paid plan).
# tools/audio/bake-imported.py copies published files into the repository as ordinary clips.
CLIPS = 'vr_voice_clips'
CLIP_TYPES = {'audio/ogg', 'audio/mpeg', 'audio/wav'}
CLIP_MAX_BYTES = 600_000
CLIP_MAX_SECONDS = 40.0
CLIP_SLACK = 0.25  # decoders differ by a frame or two
CLIP_MAX_CLIPS = 200
HASH = re.compile(r'^[0-9a-f]{64}$')
_clip_cache = {}
_CLIP_CACHE_BYTES = 12_000_000


def _clip_shape(c):
    out = []
    if not isinstance(c, dict):
        return ['An imported voice file has an unknown shape.']
    if not _keys(c, ['who', 'text', 'hash', 'type', 'duration', 'bytes']):
        out.append('An imported voice file has unknown fields.')
    if not (isinstance(c.get('who'), str) and WHO.match(c['who']) and c['who'] != 'player'):
        out.append('An imported voice file must belong to a character (not the player).')
    if not _plain(c.get('text'), 500):
        out.append('An imported voice file must belong to a line of plain text (500 characters at most).')
    if not (isinstance(c.get('hash'), str) and HASH.match(c['hash'])):
        out.append('An imported voice file has a bad file address.')
    if c.get('type') not in CLIP_TYPES:
        out.append('An imported voice file must be MP3, WAV or Ogg.')
    d = c.get('duration')
    if type(d) not in (int, float) or not 0 < d <= CLIP_MAX_SECONDS + 0.05:
        out.append('An imported voice file must be 40 seconds at most.')
    b = c.get('bytes')
    if type(b) is not int or not 1 <= b <= CLIP_MAX_BYTES:
        out.append('An imported voice file must be 600 KB at most.')
    return out


def _clip_key(who, text):
    w = who.lower().strip()
    w = {'you': 'player', 'pilot': 'player', 'arcade attendant': 'attendant', 'landing terminal': 'landing-terminal'}.get(w) or re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', w))
    t = text
    try:  # voice tags ([whispers]) are not part of what players hear (void_runner_drafts.strip_voice_tags, when present)
        from void_runner_drafts import strip_voice_tags
        t = strip_voice_tags(text)
    except ImportError:
        pass
    return w + '|' + t.strip()


def clip_problems(clips):
    """content.clips: the same rules as void-runner/voice-imports.js clipProblems."""
    if not isinstance(clips, list):
        return ['The imported voice files have an unknown shape.']
    if len(clips) > CLIP_MAX_CLIPS:
        return ['Too many imported voice files (%d; %d at most).' % (len(clips), CLIP_MAX_CLIPS)]
    out, seen = [], set()
    for c in clips:
        for p in _clip_shape(c):
            if p not in out:
                out.append(p)
        if isinstance(c, dict) and isinstance(c.get('who'), str) and isinstance(c.get('text'), str):
            k = _clip_key(c['who'], c['text'])
            if k in seen:
                out.append('Two imported voice files are attached to the same line (%s).' % c['text'][:40])
            seen.add(k)
    return out


def clip_record_problems(recs):
    """The editor draft's records (local().clips: line key -> record), kept in the server copy of the draft."""
    if not isinstance(recs, dict):
        return ['The imported voice files have an unknown shape.']
    if len(recs) > CLIP_MAX_CLIPS:
        return ['Too many imported voice files.']
    out = []
    for k, r in recs.items():
        if not isinstance(k, str) or not 1 <= len(k) <= 700 or TAGS.search(k):
            out.append('An imported voice file is attached to an unknown line.')
            continue
        if not isinstance(r, dict):
            out.append('An imported voice file has an unknown shape.')
            continue
        extra = {x: r[x] for x in ['name', 'at', 'reencoded'] if x in r}
        for p in _clip_shape({x: v for x, v in r.items() if x not in extra}):
            if p not in out:
                out.append(p)
        if 'name' in extra and not (isinstance(extra['name'], str) and len(extra['name']) <= 120 and not TAGS.search(extra['name'])):
            out.append('An imported voice file has a bad name.')
        if 'at' in extra and not (isinstance(extra['at'], str) and len(extra['at']) <= 40):
            out.append('An imported voice file has a bad date.')
        if 'reencoded' in extra and extra['reencoded'] is not True:
            out.append('An imported voice file has a bad note.')
    return out


# ---- what a file really is, and how long it plays (no audio libraries: the headers are read directly)
def sniff(data):
    if data[:4] == b'OggS':
        return 'audio/ogg'
    if data[:4] == b'RIFF' and data[8:12] == b'WAVE':
        return 'audio/wav'
    if data[:3] == b'ID3' or (len(data) > 1 and data[0] == 0xFF and data[1] & 0xE0 == 0xE0):
        return 'audio/mpeg'
    return None


def wav_seconds(data):
    o, rate, align = 12, 0, 0
    while o + 8 <= len(data):
        cid, size = data[o:o + 4], int.from_bytes(data[o + 4:o + 8], 'little')
        body = data[o + 8:o + 8 + size]
        if cid == b'fmt ' and len(body) >= 16:
            rate, align = int.from_bytes(body[4:8], 'little'), int.from_bytes(body[12:14], 'little')
        elif cid == b'data':
            if not rate or not align:
                return None
            return min(size, len(data) - o - 8) // align / rate
        o += 8 + size + (size & 1)
    return None


def ogg_seconds(data):
    o, first, rate, pre, granule, serial = 0, True, 0, 0, 0, None
    while o + 27 <= len(data):
        if data[o:o + 4] != b'OggS':
            return None
        nseg = data[o + 26]
        size = 27 + nseg + sum(data[o + 27:o + 27 + nseg])
        if o + size > len(data):
            return None
        s = int.from_bytes(data[o + 14:o + 18], 'little')
        if serial is None:
            serial = s
        if first:
            body = data[o + 27 + nseg:o + size]
            if body[:8] == b'OpusHead' and len(body) >= 19:
                rate, pre = 48000, int.from_bytes(body[10:12], 'little')
            elif body[:7] == b'\x01vorbis' and len(body) >= 16:
                rate = int.from_bytes(body[12:16], 'little')
            else:
                return None
            first = False
        g = int.from_bytes(data[o + 6:o + 14], 'little', signed=True)
        if s == serial and g > 0:
            granule = max(granule, g)
        o += size
    if o != len(data) or not rate:
        return None
    return max(0, granule - pre) / rate


_MP3_BITRATES = {1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]}
_MP3_RATES = {3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000]}


def mp3_seconds(data):
    """Layer III frames counted one by one (an ID3v2 tag at the start and an ID3v1 tag at the end are skipped)."""
    o = 0
    if data[:3] == b'ID3' and len(data) >= 10:
        o = 10 + ((data[6] & 0x7F) << 21 | (data[7] & 0x7F) << 14 | (data[8] & 0x7F) << 7 | (data[9] & 0x7F))
    samples, frames, rate = 0, 0, 0
    while o + 4 <= len(data):
        h = int.from_bytes(data[o:o + 4], 'big')
        if h >> 21 != 0x7FF:
            if data[o:o + 3] == b'TAG' or frames:
                break
            o += 1  # a little padding before the first frame
            if o > 4096:
                return None
            continue
        ver, layer, br, sr, pad = (h >> 19) & 3, (h >> 17) & 3, (h >> 12) & 15, (h >> 10) & 3, (h >> 9) & 1
        if ver == 1 or layer != 1 or br in (0, 15) or sr == 3:
            if frames:
                break
            return None
        rate = _MP3_RATES[ver][sr]
        kbps = _MP3_BITRATES[1 if ver == 3 else 2][br]
        per = 1152 if ver == 3 else 576
        size = (144 if ver == 3 else 72) * kbps * 1000 // rate + pad
        samples += per
        frames += 1
        o += size
    return samples / rate if frames >= 2 and rate else None


def clip_seconds(kind, data):
    try:
        return {'audio/wav': wav_seconds, 'audio/ogg': ogg_seconds, 'audio/mpeg': mp3_seconds}[kind](data)
    except Exception:  # noqa: BLE001 - a broken header is a refused file, never a server error
        return None


def _clip_ref(db, h):
    return db.collection(CLIPS).document(h)


def clips_missing(db, hashes):
    return [h for h in hashes if (_clip_ref(db, h).get().to_dict() or None) is None]


def clips_check(db, payload):
    """POST developer/voice-clips {hashes}: which of these files the server does not have yet."""
    if not _keys(payload, ['hashes']) or not isinstance(payload.get('hashes'), list) or not 1 <= len(payload['hashes']) <= CLIP_MAX_CLIPS \
            or not all(isinstance(h, str) and HASH.match(h) for h in payload['hashes']):
        raise DraftError('Send the addresses of 1 to 200 voice files.')
    return {'missing': clips_missing(db, sorted(set(payload['hashes'])))}


def store_clip(db, uid, h, payload):
    """POST developer/voice-clips/<sha-256> {type, data (base64)}: checked (type from the bytes, size, length, address), then created once."""
    import base64
    import binascii
    if not isinstance(h, str) or not HASH.match(h):
        raise DraftError('Bad voice file address.', 404)
    if not _keys(payload, ['type', 'data']) or not isinstance(payload.get('data'), str) or payload.get('type') not in CLIP_TYPES:
        raise DraftError('Send an MP3, WAV or Ogg voice file.', 415)
    if len(payload['data']) > (CLIP_MAX_BYTES + 2) // 3 * 4 + 4:
        raise DraftError('The voice file is larger than 600 KB.', 413)
    try:
        data = base64.b64decode(payload['data'], validate=True)
    except (binascii.Error, ValueError):
        raise DraftError('The voice file could not be read.') from None
    if not data or len(data) > CLIP_MAX_BYTES:
        raise DraftError('The voice file is larger than 600 KB.', 413)
    if hashlib.sha256(data).hexdigest() != h:
        raise DraftError('The voice file does not match its address.', 422)
    kind = sniff(data)
    if kind != payload['type']:
        raise DraftError('The voice file is not the kind it says it is (%s).' % (kind or 'unknown'), 415)
    seconds = clip_seconds(kind, data)
    if seconds is None or seconds <= 0.05:
        raise DraftError('The voice file has no readable sound.', 422)
    if seconds > CLIP_MAX_SECONDS + CLIP_SLACK:
        raise DraftError('The voice file is %.1f seconds long; the limit is 40 seconds.' % seconds, 422)
    from firebase_admin import firestore
    ref = _clip_ref(db, h)
    record = {'hash': h, 'type': kind, 'bytes': len(data), 'duration': round(seconds, 2), 'data': base64.b64encode(data).decode('ascii'),
              'at': int(time.time()), 'by': hashlib.sha256(uid.encode()).hexdigest()[:12]}

    @firestore.transactional
    def commit(tx):
        if (ref.get(transaction=tx).to_dict() or None) is not None:
            return False
        tx.create(ref, record)
        return True
    created = commit(db.transaction())
    return {'hash': h, 'type': kind, 'bytes': len(data), 'duration': record['duration'], 'stored': True, 'existed': not created}


def get_clip(db, h):
    """The published file (public). (bytes, type) or None. A small in-memory copy saves Firestore reads on the free tier."""
    if not isinstance(h, str) or not HASH.match(h):
        return None
    if h in _clip_cache:
        return _clip_cache[h]
    rec = _clip_ref(db, h).get().to_dict()
    if not rec or rec.get('type') not in CLIP_TYPES or not isinstance(rec.get('data'), str):
        return None
    import base64
    data = base64.b64decode(rec['data'])
    if hashlib.sha256(data).hexdigest() != h:
        return None
    while _clip_cache and sum(len(v[0]) for v in _clip_cache.values()) + len(data) > _CLIP_CACHE_BYTES:
        _clip_cache.pop(next(iter(_clip_cache)))
    _clip_cache[h] = (data, rec['type'])
    return _clip_cache[h]


# ---- Mission givers made in the editor (void-runner/npc-made.js, Developer Tools > NPCs > Create a mission giver): content.characters[id] ----
# The same rules as npc-made.js problems(), against the admin inventory's madeCharacters (models, items, ships, devices, the ids the game already uses). A made character
# placed in an adult venue must be marked adult (18+) (npc-areas.js `adult` rectangles; never on Reverie's or Lace's model).
MADE_ID = re.compile(r'^[a-z][a-z0-9-]{1,39}$')
MADE_KEYS = ['name', 'role', 'model', 'adult', 'look', 'device', 'ship', 'items', 'when']


def _made_plain(v, n):
    return isinstance(v, str) and v.strip() != '' and len(v) <= n and not TAGS.search(v) and not re.search(r'[\x00-\x1f]', v)


def _base_plan(p):
    if not isinstance(p, dict):
        return None
    rest = {k: v for k, v in p.items() if k != 'schedule'}
    return rest if rest.get('mode') in ('stay', 'path') else None


def made_problems(content, inv=None):
    inv = inv or _json('void_runner_admin_inventory.json')
    mc = inv.get('madeCharacters') or {}
    chars = content.get('characters')
    lim = mc.get('limits') or {}
    if not isinstance(chars, dict) or len(chars) > lim.get('characters', 12):
        return ['Made characters have an unknown shape.']
    models, items, ships = mc.get('models') or {}, mc.get('items') or {}, set(mc.get('ships') or [])
    reserved = set(mc.get('reserved') or [])
    npcs = content.get('npcs') if isinstance(content.get('npcs'), dict) else {}
    missions, offers = {}, {}
    for t in content.get('trees') or [] if isinstance(content.get('trees'), list) else []:
        for m in (t.get('missions') or []) if isinstance(t, dict) else []:
            if isinstance(m, dict) and isinstance(m.get('id'), str):
                missions[m['id']] = [o.get('id') for o in m.get('objectives') or [] if isinstance(o, dict)]
                st = m.get('start') if isinstance(m.get('start'), dict) else {}
                if st.get('how') != 'notification':
                    offers[m['id']] = m.get('giver')
    known_missions = {x.get('id') for x in inv.get('missions') or [] if isinstance(x, dict)}
    out = []
    for cid, c in chars.items():
        w = (c.get('name').strip()[:40] if isinstance(c, dict) and isinstance(c.get('name'), str) and c.get('name').strip() else str(cid)) + ': '
        if not isinstance(cid, str) or not MADE_ID.match(cid):
            out.append(w + 'the id must be 2 to 40 lower-case letters, digits or dashes.')
            continue
        if cid in reserved:
            out.append(w + 'the id is already used by a character of the game.')
            continue
        if not _keys(c, MADE_KEYS):
            out.append(w + 'unknown fields.')
            continue
        if not _made_plain(c.get('name'), lim.get('name', 40)):
            out.append(w + 'a name is needed (plain words, 40 characters at most).')
        if c.get('role') is not None and not _made_plain(c.get('role'), lim.get('role', 80)):
            out.append(w + 'the role line must be plain words (80 characters at most).')
        md = models.get(c.get('model')) if isinstance(c.get('model'), str) else None
        if md is None:
            out.append(w + 'not a model of the game.')
            continue
        if c.get('adult') is not None and c.get('adult') is not True:
            out.append(w + '"adult" is either true or left out.')
        elif c.get('adult') is True and not md.get('adultOk'):
            out.append(w + 'this model reads youthful: it can never be marked adult.')
        if c.get('look') is not None:
            if not _keys(c['look'], ['hide', 'colour', 'gear', 'hair']):
                out.append(w + 'the look has unknown fields.')
            else:
                out += [w + x for x in look_problems({c['model']: {'looks': [dict(c['look'], id='own', name='own look')], 'use': 'own'}}, inv)]
        if c.get('device') is not None and c.get('device') not in (mc.get('devices') or []):
            out.append(w + 'the device must be V1, V2, V3 or none.')
        if c.get('ship') is not None and c.get('ship') not in ships:
            out.append(w + 'not a ship of the game.')
        its = c.get('items')
        if its is not None:
            if not isinstance(its, list) or len(its) > lim.get('items', 6):
                out.append(w + 'too many items.')
            else:
                seen = set()
                for i in its:
                    if not _keys(i, ['id', 'show']) or not isinstance(i.get('id'), str) or i['id'] not in items:
                        out.append(w + 'an item is not one of the game.')
                        continue
                    if i.get('show') is not None and (i['show'] is not True or not items[i['id']].get('show')):
                        out.append(w + 'that item cannot be shown on them.')
                    if i['id'] in seen:
                        out.append(w + 'an item is listed twice.')
                    seen.add(i['id'])
        wn = c.get('when')
        if wn is not None:
            if not _keys(wn, ['mission', 'step']) or not isinstance(wn.get('mission'), str):
                out.append(w + '"when they are there" has an unknown shape.')
            elif wn['mission'] not in missions and wn['mission'] not in known_missions:
                out.append(w + 'they are there only during a mission that does not exist.')
            elif wn.get('step') is not None and wn['mission'] in missions and wn['step'] not in missions[wn['mission']]:
                out.append(w + 'the step they appear from is not a step of that mission.')
            elif offers.get(wn['mission']) == cid:
                out.append(w + 'they appear only while that mission is active, so they cannot offer it.')
        p = npcs.get(cid)
        if not isinstance(p, dict) or not (_base_plan(p) or any(isinstance(b, dict) and b.get('mode') in ('stay', 'path') for b in (p.get('schedule') or []) if isinstance(p.get('schedule'), list))):
            out.append(w + 'put them somewhere in the world.')
        elif not _base_plan(p):
            out.append(w + 'outside their time blocks they need a place too.')
        elif not md.get('walk') and (p.get('mode') == 'path' or any(isinstance(b, dict) and b.get('mode') == 'path' for b in (p.get('schedule') or []) if isinstance(p.get('schedule'), list))):
            out.append(w + 'this model has no walking animation: keep them at one spot.')
    return out


def with_made(chars, inv):
    """The inventory with the made characters added as movable NPCs, givers with a TALK prompt, their animations and their follow / lead steps (a copy; inv is not changed)."""
    if not isinstance(chars, dict) or not chars:
        return inv
    mc = inv.get('madeCharacters') or {}
    models = mc.get('models') or {}
    reserved = set(mc.get('reserved') or [])
    out = dict(inv)
    paths = dict(inv.get('npcPaths') or {})
    paths['movable'] = dict(paths.get('movable') or {})
    me = dict(inv.get('missionEditor') or {})
    me['givers'] = dict(me.get('givers') or {})
    me['gestures'] = dict(me.get('gestures') or {})
    esc = dict(inv.get('npcEscort') or {})
    esc['npcs'] = dict(esc.get('npcs') or {})
    areas = [a.get('id') for a in ((paths.get('areas') or {}).get('areas') or [])]
    for cid, c in chars.items():
        if not isinstance(cid, str) or not MADE_ID.match(cid) or cid in reserved or not isinstance(c, dict):
            continue
        md = models.get(c.get('model')) if isinstance(c.get('model'), str) else None
        if not md:
            continue
        adult = c.get('adult') is True and bool(md.get('adultOk'))
        v = md.get('adult') if adult and md.get('adult') else md
        name = c.get('name') if isinstance(c.get('name'), str) and c.get('name').strip() else cid
        mv = v.get('movable') or {}
        paths['movable'][cid] = {'name': name, 'areas': areas, 'ledges': [], 'actions': mv.get('actions') or [], 'anims': mv.get('anims') or [], 'pathOnly': mv.get('pathOnly') or ['walk-on'], 'made': True, 'adult': adult}
        me['givers'][cid] = {'name': name, 'canTalk': True, 'players': True, 'draft': True, 'group': 'district'}
        if v.get('gestures'):
            me['gestures'][cid] = {'look': c.get('model'), 'clips': v['gestures']}
        if v.get('escort'):
            esc['npcs'][cid] = v['escort']
    out['npcPaths'], out['missionEditor'], out['npcEscort'] = paths, me, esc
    return out


def made_shape_problems(chars):
    """The editor's server copy of a draft (void_runner_drafts.py): a made character may be half done, but its shape is closed."""
    if not isinstance(chars, dict) or len(chars) > 12:
        return ['Made characters have an unknown shape.']
    for cid, c in chars.items():
        if not isinstance(cid, str) or not MADE_ID.match(cid) or not _keys(c, MADE_KEYS):
            return ['a made character has an unknown shape.']
        if c.get('name') is not None and not (isinstance(c['name'], str) and len(c['name']) <= 40 and not TAGS.search(c['name'])):
            return ['a made character’s name must be plain words.']
        if c.get('adult') not in (None, True):
            return ['"adult" is either true or left out.']
    return []
