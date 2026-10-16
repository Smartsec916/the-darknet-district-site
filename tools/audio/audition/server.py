"""VOID//RUNNER voice audition tool: a small local web page for listening to candidate voices,
comparing them with the clips in the game, and approving a voice for an NPC.

Run from the repo root with the voice venv's python:
  python tools/audio/audition/server.py --models <folder with kokoro-v1.0.onnx and voices-v1.0.bin>
then open http://127.0.0.1:5190/. It only listens on this computer. Samples are written to
tools/audio/audition/samples/ (ignored by git). The only file it changes is
tools/audio/npc-voice-registry.json, and an approved voice changes only with an explicit confirmation.
"""
import argparse, datetime, hashlib, json, os, re, sys, threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
REGISTRY = os.path.join(ROOT, 'tools', 'audio', 'npc-voice-registry.json')
CLIPS = os.path.join(ROOT, 'void-runner', 'assets', 'audio', 'voice')
SAMPLES = os.path.join(HERE, 'samples')
sys.path.insert(0, os.path.dirname(HERE))
from generate import config_hash, level, sha256  # same fingerprint and levelling as the pipeline

VOICE_ID = re.compile(r'^[ab][fm]_[a-z]+$')
LANGS = ('en-us', 'en-gb')
lock = threading.Lock()
kokoro = None

def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def dump_registry(reg):
    """Keeps the registry's layout: one line per character so diffs stay readable."""
    out = ['{']
    keys = list(reg)
    for i, key in enumerate(keys):
        value, comma = reg[key], ',' if i < len(keys) - 1 else ''
        if key in ('npcs', 'broadcast', 'reserved'):
            rows = ['  %s: %s' % (json.dumps(k), json.dumps(v, ensure_ascii=False)) for k, v in value.items()]
            out.append(' %s: {\n%s\n }%s' % (json.dumps(key), ',\n'.join(rows), comma))
        else:
            text = json.dumps(value, indent=1, ensure_ascii=False).replace('\n', '\n ')
            out.append(' %s: %s%s' % (json.dumps(key), text, comma))
    out.append('}')
    return '\n'.join(out) + '\n'

def save_registry(reg):
    tmp = REGISTRY + '.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='\n') as f:
        f.write(dump_registry(reg))
    os.replace(tmp, REGISTRY)

def candidate(body, reg):
    voice, lang = str(body.get('voice', '')), str(body.get('lang', ''))
    try:
        speed = round(float(body.get('speed')), 3)
    except (TypeError, ValueError):
        raise ValueError('speed must be a number')
    if not VOICE_ID.match(voice) or voice not in voices:
        raise ValueError('unknown English voice: ' + voice)
    if lang not in LANGS:
        raise ValueError('lang must be en-us or en-gb')
    if not 0.7 <= speed <= 1.3:
        raise ValueError('speed must be between 0.7 and 1.3')
    return {'voice': voice, 'speed': speed, 'lang': lang}

def lines_for(speaker):
    manifest = load(os.path.join(CLIPS, 'manifest.json'))
    return [{'id': i, 'text': l['text'], 'file': l['file']} for i, l in manifest['lines'].items() if l['speaker'] == speaker]

def render_sample(c, text):
    key = hashlib.sha256(('%s|%.3f|%s|%s' % (c['voice'], c['speed'], c['lang'], text)).encode('utf-8')).hexdigest()[:16]
    name = '%s-%s.wav' % (c['voice'], key)
    path = os.path.join(SAMPLES, name)
    if not os.path.exists(path):
        import soundfile as sf
        with lock:
            samples, rate = kokoro.create(text, voice=c['voice'], speed=c['speed'], lang=c['lang'])
            os.makedirs(SAMPLES, exist_ok=True)
            sf.write(path, level(samples, rate), rate)
    return '/samples/' + name

def approve(body):
    """Approve (or change and approve) an NPC's voice. Changing an approved voice needs confirmChange."""
    with lock:
        reg = load(REGISTRY)
        npc = body.get('npc')
        entry = reg['npcs'].get(npc)
        if not entry:
            raise ValueError('not an NPC in the registry: %s' % npc)
        c = candidate(body, reg)
        for other, e in reg['npcs'].items():
            if other != npc and e['voice'] == c['voice']:
                raise ValueError('%s is already %s\'s voice; every character keeps a distinct voice' % (c['voice'], e['displayName']))
        changed = any(entry[k] != c[k] for k in c)
        if entry['status'] == 'approved' and changed and body.get('confirmChange') is not True:
            return 409, {'error': 'locked', 'message': '%s already has an approved voice (%s, speed %s). Changing it re-records every %s line. Confirm to replace it.' % (entry['displayName'], entry['voice'], entry['speed'], entry['displayName'])}
        if body.get('status') == 'provisional':
            if entry['status'] == 'approved' and body.get('confirmChange') is not True:
                return 409, {'error': 'locked', 'message': 'Unlocking %s makes the voice editable again. Confirm to unlock.' % entry['displayName']}
            entry.update(c, status='provisional', approvedConfigHash=None, approvedAt=None)
        else:
            entry.update(c, status='approved', approvedAt=datetime.date.today().isoformat())
            entry['approvedConfigHash'] = config_hash(entry, reg['engine'])
        if 'notes' in body:
            entry['notes'] = str(body['notes'])[:400]
        save_registry(reg)
        return 200, {'ok': True, 'entry': entry, 'changed': changed}

class Handler(BaseHTTPRequestHandler):
    def send(self, code, body, kind='application/json'):
        data = body if isinstance(body, bytes) else json.dumps(body).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def file(self, folder, name, kind):
        path = os.path.realpath(os.path.join(folder, name))
        if not path.startswith(os.path.realpath(folder) + os.sep) or not os.path.isfile(path):
            return self.send(404, {'error': 'not found'})
        with open(path, 'rb') as f:
            self.send(200, f.read(), kind)

    def do_GET(self):
        url = self.path.split('?')[0]
        if url in ('/', '/index.html'):
            return self.file(HERE, 'index.html', 'text/html; charset=utf-8')
        if url == '/api/state':
            reg = load(REGISTRY)
            return self.send(200, {'registry': reg, 'voices': sorted(voices), 'lines': {n: lines_for(n) for n in reg['npcs']}})
        if url.startswith('/samples/'):
            return self.file(SAMPLES, url[9:], 'audio/wav')
        if url.startswith('/clips/'):
            return self.file(CLIPS, url[7:], 'audio/ogg')
        self.send(404, {'error': 'not found'})

    def do_POST(self):
        # Only this page may change things: refuse requests coming from any other website.
        origin = self.headers.get('Origin', '')
        if origin and origin not in ('http://127.0.0.1:%d' % port, 'http://localhost:%d' % port):
            return self.send(403, {'error': 'forbidden'})
        try:
            body = json.loads(self.rfile.read(min(int(self.headers.get('Content-Length', 0)), 65536)) or b'{}')
            if self.path == '/api/sample':
                text = str(body.get('text', '')).strip()[:400]
                if not text:
                    raise ValueError('nothing to say')
                return self.send(200, {'url': render_sample(candidate(body, None), text)})
            if self.path == '/api/approve':
                return self.send(*approve(body))
            self.send(404, {'error': 'not found'})
        except ValueError as error:
            self.send(400, {'error': str(error)})

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--models', required=True)
    p.add_argument('--port', type=int, default=5190)
    a = p.parse_args()
    port, engine = a.port, load(REGISTRY)['engine']
    model, voice_file = os.path.join(a.models, engine['model']), os.path.join(a.models, engine['voices'])
    for path, expected in ((model, engine['modelSha256']), (voice_file, engine['voicesSha256'])):
        if not os.path.exists(path) or sha256(path) != expected:
            sys.exit('Model file missing or different from the registry: ' + path)
    from kokoro_onnx import Kokoro
    kokoro = Kokoro(model, voice_file)
    voices = {v for v in kokoro.get_voices() if VOICE_ID.match(v)}
    print('Voice audition: http://127.0.0.1:%d/  (%d English voices; Ctrl+C to stop)' % (port, len(voices)))
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
