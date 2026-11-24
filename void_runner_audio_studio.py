"""Developer-owned sound library and playlists. Media stays private until referenced by the live catalog."""
import hashlib
import io
import json
import math
from functools import lru_cache
from pathlib import Path
import re
from flask import send_file
from void_runner_drafts import DraftError

CATEGORIES = ('Music','Ambience','NPC voices','Footsteps','Weapons','Doors','Machinery','Spaceships','Vehicles','Holographic devices','Interface','Mission effects','Consumables','Cinematic soundtracks','Spatial sources')
CHANNELS = ('master','music','dialogue','effects','ambient','voice','cinematic','duck')
EMPTY = {'assets': [], 'locations': [], 'sources': [], 'events': [], 'mix': {k: (.4 if k == 'duck' else 1) for k in CHANNELS}}
ID = re.compile(r'^[a-z][a-z0-9_-]{0,63}$')
HASH = re.compile(r'^[a-f0-9]{64}$')
LOCAL = re.compile(r'^assets/audio/[A-Za-z0-9_/-]+\.(?:ogg|mp3|wav|m4a|webm)$')
MAX = 20 * 1024 * 1024
CHUNK = 384 * 1024


def number(value, lo, hi):
    return type(value) in (float, int) and math.isfinite(value) and lo <= value <= hi


def word(value, size):
    return isinstance(value, str) and len(value) <= size and all(ord(c) >= 32 for c in value)


def require(ok, message):
    if not ok:
        raise DraftError(message, 422)


def keys(row, allowed):
    return isinstance(row, dict) and set(row) <= set(allowed.split())


def identifier(value):
    return isinstance(value, str) and ID.fullmatch(value) is not None


@lru_cache(maxsize=1)
def packaged_recordings():
    path = Path(__file__).parent / 'void-runner' / 'sound-library.json'
    return frozenset(json.loads(path.read_text(encoding='utf-8')))


def checked(c):
    require(isinstance(c, dict) and set(c) == set(EMPTY) and len(json.dumps(c)) < 850000, 'Invalid sound project')
    for key, limit in [('assets', 1200), ('locations', 200), ('sources', 350), ('events', 300)]:
        rows = c[key]
        require(isinstance(rows, list) and len(rows) <= limit and all(isinstance(r, dict) and identifier(r.get('id')) for r in rows), 'Invalid ' + key)
        require(len({r['id'] for r in rows}) == len(rows), 'Duplicate ID in ' + key)
    ids = {a['id'] for a in c['assets']}
    for a in c['assets']:
        require(keys(a,'id name src category tags volume start end loop fadeIn fadeOut rate pitch') and word(a.get('name'),100) and a['name'] and a.get('category') in CATEGORIES, 'Invalid audio asset')
        src = a.get('src')
        require(isinstance(src,str) and ((LOCAL.fullmatch(src) and src in packaged_recordings()) or HASH.fullmatch(src)), 'Use a game audio file or an uploaded recording')
        require(isinstance(a.get('tags'),list) and len(a['tags']) <= 18 and all(word(t,40) for t in a['tags']), 'Invalid tags')
        for k,lo,hi in [('volume',0,1),('start',0,7200),('end',0,7200),('fadeIn',0,60),('fadeOut',0,60),('rate',.25,4),('pitch',-12,12)]:
            require(number(a.get(k),lo,hi), 'Invalid ' + k)
        require(type(a.get('loop')) is bool and (not a['end'] or a['end'] > a['start']), 'Invalid trim or loop')
    for p in c['locations']:
        require(keys(p,'id area tracks shuffle crossfade gap loop resume fromHour toHour mission') and identifier(p.get('area')), 'Invalid playlist location')
        require(isinstance(p.get('tracks'),list) and 1 <= len(p['tracks']) <= 80 and all(keys(t,'asset volume') and identifier(t.get('asset')) and t.get('asset') in ids and number(t.get('volume'),0,1) for t in p['tracks']), 'Choose library tracks')
        require(all(type(p.get(k)) is bool for k in ('shuffle','loop','resume')) and number(p.get('crossfade'),0,30) and number(p.get('gap'),0,60),'Invalid playlist timing')
        require(all(type(p.get(k)) is int and 0 <= p[k] <= 23 for k in ('fromHour','toHour')) and word(p.get('mission',''),64),'Invalid playlist condition')
    for s in c['sources']:
        require(keys(s,'id area asset x y z direction near far attenuation volume loop occlusion environment mission') and identifier(s.get('area')) and identifier(s.get('asset')) and s.get('asset') in ids, 'Invalid spatial source')
        require(all(number(s.get(k),-50000,50000) for k in ('x','y','z')) and number(s.get('direction'),-360,360) and number(s.get('near'),.1,1000) and number(s.get('far'),s['near'],2000),'Invalid audible radius or coordinates')
        require(number(s.get('volume'),0,1) and number(s.get('attenuation'),.1,8) and type(s.get('loop')) is bool and type(s.get('occlusion')) is bool and s.get('environment') in ('both','interior','exterior') and word(s.get('mission',''),64),'Invalid spatial behavior')
    require(all(keys(e,'id asset') and identifier(e.get('asset')) and e.get('asset') in ids for e in c['events']), 'Unknown event sound')
    require(isinstance(c['mix'],dict) and set(c['mix']) == set(CHANNELS) and all(number(v,0,1) for v in c['mix'].values()), 'Invalid mixer level')
    return c


def ref(db, name, key):
    return db.collection('vr_sound_' + name).document(key)


def digest(value):
    return hashlib.sha256(value).hexdigest()


def live(db):
    return ref(db,'state','live').get().to_dict() or {'version':0, 'content':EMPTY}


def draft(db, uid):
    return ref(db,'drafts',digest(uid.encode())).get().to_dict() or {'revision':0, 'content':None}


def save(db, uid, payload, publish=False):
    from firebase_admin import firestore
    require(isinstance(payload,dict) and type(payload.get('revision')) is int,'A draft revision is required')
    doc = ref(db,'drafts',digest(uid.encode()))
    content = checked(payload.get('content'))
    @firestore.transactional
    def commit(tx):
        old = doc.get(transaction=tx).to_dict() or {}
        if old.get('revision',0) != payload['revision']:
            raise DraftError('This sound draft changed in another window. Reload first.',409)
        rev = payload['revision']+1
        if publish:
            state = ref(db,'state','live')
            prior = state.get(transaction=tx).to_dict() or {}
            if type(payload.get('expected')) is not int or payload['expected'] != prior.get('version',0):
                raise DraftError('The live sound version changed. Reload first.',409)
            hashes = {a['src'] for a in content['assets'] if HASH.fullmatch(a['src'])}
            for h in hashes:
                require(ref(db,'media',h).get(transaction=tx).to_dict(), 'An uploaded recording is missing')
            version = payload['expected']+1
            value = {'version':version,'content':content}
            tx.create(ref(db,'versions',str(version)),value)
            tx.set(state,value)
        tx.set(doc,{'revision':rev,'content':content})
        return {'revision':rev, 'version':version if publish else None}
    return commit(db.transaction())


def upload(db, raw):
    from mutagen import File
    require(0 < len(raw) <= MAX, 'Audio files must be at most 20 MiB')
    try:
        data = File(io.BytesIO(raw))
        duration = data.info.length
        mime = next((m for m in data.mime if m in ('audio/mpeg','audio/ogg','audio/wav','audio/x-wav','audio/mp4')),None)
    except Exception:
        mime = None
    require(mime and number(duration,.03,7200), 'Choose a readable MP3, Ogg, WAV or M4A recording under two hours')
    h=digest(raw);doc=ref(db,'media',h)
    if not doc.get().to_dict():
        for i in range(0,len(raw),CHUNK):
            ref(db,'chunks',h+'-'+str(i//CHUNK)).set({'data':raw[i:i+CHUNK]})
        doc.set({'size':len(raw),'type':mime,'duration':duration})
    return {'src':h,'duration':duration,'type':mime}


def media(db, h, private=False):
    require(HASH.fullmatch(h),'Invalid recording ID')
    if not private and not any(a['src']==h for a in live(db)['content']['assets']):
        raise DraftError('Recording is not published.',404)
    info=ref(db,'media',h).get().to_dict()
    if not info:
        raise DraftError('Recording not found.',404)
    buffer=io.BytesIO()
    for i in range(math.ceil(info['size']/CHUNK)):
        part=ref(db,'chunks',h+'-'+str(i)).get().to_dict()
        if not part:
            raise DraftError('Recording is temporarily unavailable.',503)
        buffer.write(part['data'])
    buffer.seek(0)
    response=send_file(buffer,mimetype=info['type'],conditional=True,etag=h,max_age=0 if private else 3600)
    if private:
        response.headers['Cache-Control']='private, no-store'
    return response
