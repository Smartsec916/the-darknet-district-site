"""Render NPC dialogue for VOID//RUNNER with Kokoro-82M (Apache-2.0), offline, from the permanent
voice registry (tools/audio/npc-voice-registry.json) and the line manifest written by
tools/audio/extract-lines.cjs. Only new lines, or lines whose voice settings changed, are rendered.
Protected clips are never overwritten. Output: 24 kHz mono Ogg/Opus, trimmed and levelled.

Usage (from the repo root, with the voice venv's python):
  python tools/audio/generate.py --models <folder>              render what is missing or changed
  python tools/audio/generate.py --models <folder> --dry-run    list what would be rendered
  python tools/audio/generate.py --models <folder> --line ID    re-render one line (not if protected)
  python tools/audio/generate.py --models <folder> --speaker rook
  python tools/audio/generate.py --protect ID | --unprotect ID  mark a hand-approved clip
  python tools/audio/generate.py --models <folder> --from-queue [--dry-run] [--yes]
      record the lines the owner queued with RE-VOICE in the Mission Editor, each in its character's registered approved voice.
      The queue comes from the server (sign-in token in the VOID_OWNER_ID_TOKEN environment variable, never stored) or from
      an exported file (--queue-file queue.json). ElevenLabs lines (Admin) are listed and left waiting for the owner's approval.
      More than 100 clips needs --yes. Recorded lines are marked done in the queue.
      ElevenLabs voices chosen in Developer Tools (NPCs > Lines & voice, or a giver card) are read from the published content (with the server queue)
      and from --voices FILE (the editor's DOWNLOAD THE VOICES FILE, revoice-engines.json format): a queued Kokoro line of such a character waits for
      ElevenLabs too. Waiting lines are listed with their voice, characters and an estimated credit cost; nothing is ever sent to ElevenLabs from here.
The model folder holds kokoro-v1.0.onnx and voices-v1.0.bin (see docs/VOID_RUNNER_VOICE_PRODUCTION.md).
"""
import argparse, datetime, hashlib, json, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'void-runner', 'assets', 'audio', 'voice')
REGISTRY = os.path.join(ROOT, 'tools', 'audio', 'npc-voice-registry.json')

def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def save(path, data):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(data, indent=1, ensure_ascii=False) + '\n')

def config_hash(entry, engine):
    """Same fingerprint as tools/audio/voice-registry.cjs."""
    key = '|'.join([engine['model'], engine['modelSha256'][:16], entry['voice'], '%.3f' % float(entry['speed']), entry['lang']])
    return hashlib.sha256(key.encode('utf-8')).hexdigest()[:12]

def voiced(registry):
    """NPCs plus Relay broadcasters the owner has cast (same as voiced() in voice-registry.cjs)."""
    out = dict(registry['npcs'])
    out.update({k: v for k, v in registry.get('broadcast', {}).items() if v.get('status') != 'unassigned'})
    return out

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()

def level(samples, rate, target_rms=0.08, peak=0.89):
    import numpy as np
    edge = np.where(np.abs(samples) > 0.01)[0]
    if len(edge):
        pad = int(rate * 0.06)
        samples = samples[max(0, edge[0] - pad): min(len(samples), edge[-1] + pad)]
    rms = float(np.sqrt(np.mean(samples ** 2))) or 1e-6
    samples = samples * (target_rms / rms)
    top = float(np.max(np.abs(samples))) or 1e-6
    if top > peak:
        samples = samples * (peak / top)
    return samples.astype(np.float32)

def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--models')
    p.add_argument('--line', action='append', default=[], help='re-render this line id (repeatable)')
    p.add_argument('--speaker')
    p.add_argument('--dry-run', action='store_true')
    p.add_argument('--protect', action='append', default=[])
    p.add_argument('--unprotect', action='append', default=[])
    p.add_argument('--accept-model-change', action='store_true', help='allow model files whose checksum differs from the registry')
    p.add_argument('--from-queue', action='store_true', help='record the lines queued with RE-VOICE in the Mission Editor')
    p.add_argument('--queue-file', help='an exported queue file instead of the server')
    p.add_argument('--voices', help='with --from-queue: an exported voices file (revoice-engines.json format) from Developer Tools')
    p.add_argument('--api', default='https://the-darknet-district-site.onrender.com', help='the game API (with --from-queue)')
    p.add_argument('--yes', action='store_true', help='confirm recording more than 100 clips')
    a = p.parse_args()

    registry, manifest = load(REGISTRY), load(os.path.join(OUT, 'manifest.json'))
    renders_path = os.path.join(OUT, 'renders.json')
    renders = load(renders_path) if os.path.exists(renders_path) else {}

    if a.protect or a.unprotect:
        for line_id in a.protect + a.unprotect:
            if line_id not in renders:
                sys.exit('No render record for %s' % line_id)
            renders[line_id]['protected'] = line_id in a.protect
        save(renders_path, renders)
        print('protected:' if a.protect else 'unprotected:', ', '.join(a.protect or a.unprotect))
        return

    engine, problems, cast = registry['engine'], [], voiced(registry)
    queued = []
    if a.from_queue:
        queued = queue_lines(a, registry, manifest, engine)
        a.line = a.line + [q['clip'] for q in queued]
    for npc_id, entry in cast.items():
        if entry['status'] == 'approved' and entry.get('approvedConfigHash') != config_hash(entry, engine):
            problems.append('%s: approved voice changed without re-approval' % npc_id)
    for line_id, line in manifest['lines'].items():
        entry = cast.get(line['speaker'])
        if not entry:
            problems.append('%s: speaker %s is not in the registry' % (line_id, line['speaker']))
        elif config_hash(entry, engine) != line['configHash']:
            problems.append('%s: manifest is out of date (run node tools/audio/extract-lines.cjs)' % line_id)
    if problems:
        sys.exit('Refusing to render:\n - ' + '\n - '.join(problems))

    todo, kept = [], []
    for line_id, line in manifest['lines'].items():
        if a.speaker and line['speaker'] != a.speaker:
            continue
        record = renders.get(line_id)
        exists = os.path.exists(os.path.join(OUT, line['file']))
        wanted = line_id in a.line or not exists or not record or record.get('configHash') != line['configHash']
        if not wanted:
            continue
        if record and record.get('protected') and exists:
            kept.append(line_id)
            continue
        todo.append(line_id)
    unknown = [i for i in a.line if i not in manifest['lines']]
    if unknown:
        sys.exit('Unknown line id(s): ' + ', '.join(unknown))
    if kept:
        print('Protected clips kept (unprotect them to re-render):', ', '.join(kept))
    if a.from_queue and len(todo) > 100 and not a.yes and not a.dry_run:
        sys.exit('%d clips would be recorded. That is more than 100: run again with --yes to confirm.' % len(todo))
    if a.dry_run or not todo:
        print(('Would render' if a.dry_run else 'Nothing to render;'), len(todo), 'clip(s)', *(['\n ' + '\n '.join(todo)] if todo else []))
        return

    if not a.models:
        sys.exit('--models <folder> is required to render')
    model, voices = os.path.join(a.models, engine['model']), os.path.join(a.models, engine['voices'])
    for path, expected in ((model, engine['modelSha256']), (voices, engine['voicesSha256'])):
        if not os.path.exists(path):
            sys.exit('Missing model file: ' + path)
        if sha256(path) != expected and not a.accept_model_change:
            sys.exit('Model file differs from the registry (%s). Voices may sound different. '
                     'Re-audition before switching, or pass --accept-model-change.' % os.path.basename(path))

    import soundfile as sf
    from kokoro_onnx import Kokoro
    kokoro = Kokoro(model, voices)
    failures = []

    def style(voice):
        """One Kokoro voice id, or a weighted blend "am_adam:0.6+am_michael:0.4" (voice-registry.cjs parseVoice)."""
        if '+' not in voice:
            return voice
        return sum(float(w) * kokoro.get_voice_style(v) for v, w in (p.split(':') for p in voice.split('+')))
    for line_id in todo:
        line = manifest['lines'][line_id]
        entry = cast[line['speaker']]
        try:
            samples, rate = kokoro.create(line['text'], voice=style(entry['voice']), speed=float(entry['speed']), lang=entry['lang'])
            sf.write(os.path.join(OUT, line['file']), level(samples, rate), rate, format='OGG', subtype='OPUS')
            renders[line_id] = {'configHash': line['configHash'], 'textHash': hashlib.sha256(line['text'].encode('utf-8')).hexdigest()[:12],
                                'generatedAt': datetime.date.today().isoformat(), 'runtime': engine.get('runtime', '')}
            print('%-22s %5.1fs  %s' % (line_id, len(samples) / rate, line['text'][:60]))
        except Exception as error:  # report and continue; the game falls back to subtitles
            failures.append('%s: %s' % (line_id, error))
    save(renders_path, renders)
    print('rendered', len(todo) - len(failures), 'clip(s)')
    if queued:
        save(os.path.join(OUT, 'manifest.json'), manifest)
        done = [q['id'] for q in queued if q['clip'] in renders and not any(f.startswith(q['clip'] + ':') for f in failures)]
        mark_done(a, done)
    if failures:
        sys.exit('Failed:\n - ' + '\n - '.join(failures))

def queue_lines(a, registry, manifest, engine):
    """Queued RE-VOICE lines → manifest entries with the same ids extract-lines.cjs gives (speaker + sha1(speaker|text)), source 'mission-editor-queue'.
    Only characters in the registry's npcs, with their registered voice; the reserved slot and broadcast voices are refused. ElevenLabs lines are only listed."""
    if a.queue_file:
        data = load(a.queue_file)
    else:
        token = os.environ.get('VOID_OWNER_ID_TOKEN', '')
        if not token:
            sys.exit('Set VOID_OWNER_ID_TOKEN to your sign-in token (never saved anywhere), or pass --queue-file.')
        import urllib.request
        req = urllib.request.Request(a.api.rstrip('/') + '/api/void-runner/developer/revoice', headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode('utf-8'))
    npcs, out, waiting = registry['npcs'], [], []
    chosen = chosen_voices(a)
    for item in data.get('items', []):
        if item.get('status') != 'queued':
            continue
        who, text = item.get('who'), item.get('text', '')
        if item.get('engine') == 'elevenlabs':
            waiting.append(item)
            continue
        if who in chosen and who not in registry.get('reserved', {}):
            waiting.append({**item, 'engine': 'elevenlabs', **chosen[who], 'moved': True})
            continue
        if who not in npcs or who in registry.get('reserved', {}):
            print('skipped (not a registered character):', who, text[:50])
            continue
        clip = who + '-' + hashlib.sha1((who + '|' + text).encode('utf-8')).hexdigest()[:10]
        manifest['lines'][clip] = {'speaker': who, 'text': text, 'file': clip + '.ogg', 'source': 'mission-editor-queue', 'configHash': config_hash(npcs[who], engine)}
        out.append({'id': item.get('id', clip), 'clip': clip})
    if waiting:
        chars = sum(len(w.get('text', '').strip()) for w in waiting)
        print('Waiting for ElevenLabs re-voice (needs approval), not recorded here:', len(waiting), 'line(s),', chars, 'characters,',
              'about', chars, 'credits (estimate: ~1 credit per character on Multilingual v2 / v3; Flash / Turbo about half)')
        for w in waiting:
            print('  %-10s %s%s' % (w.get('who'), w.get('text', '')[:70], ('  [voice %s %s%s]' % (w.get('voice', ''), w.get('voiceId', ''), ', chosen in the editor' if w.get('moved') else '')) if w.get('voiceId') else ''))
    print('Queued for Kokoro:', len(out), 'line(s)')
    return out

VOICE_ID_CHARS = set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')


def chosen_voices(a):
    """ElevenLabs voices chosen in Developer Tools: {who: {'voice', 'voiceId'}}. From the published content (when the queue comes from the server), then
    --voices FILE (revoice-engines.json format), which wins. The reserved slot, broadcast voices and The Function are never taken."""
    out, refused = {}, {'special-character', 'the-function', 'news-anchor', 'commercial-announcer', 'warflying-host'}
    ok = lambda i: isinstance(i, str) and len(i) == 20 and set(i) <= VOICE_ID_CHARS
    if not a.queue_file:
        try:
            import urllib.request
            with urllib.request.urlopen(a.api.rstrip('/') + '/api/void-runner/live-content', timeout=30) as r:
                content = (json.loads(r.read().decode('utf-8')) or {}).get('content') or {}
            for who, v in (content.get('voices') or {}).items():
                if isinstance(v, dict) and v.get('engine') == 'elevenlabs' and ok(v.get('voiceId')):
                    out[who] = {'voice': str(v.get('name', ''))[:60], 'voiceId': v['voiceId']}
        except Exception as e:  # noqa: BLE001 - the published content is optional here
            print('(published voice choices not read: %s)' % e)
    if getattr(a, 'voices', None):
        for who, e in (load(a.voices).get('characters') or {}).items():
            if isinstance(e, dict) and e.get('engine') == 'elevenlabs' and ok(e.get('voiceId')):
                out[who] = {'voice': str(e.get('voice', ''))[:120], 'voiceId': e['voiceId']}
    return {k: v for k, v in out.items() if k not in refused}


def mark_done(a, ids):
    if not ids:
        return
    if a.queue_file:
        data = load(a.queue_file)
        for item in data.get('items', []):
            if item.get('id') in ids:
                item['status'] = 'done'
        save(a.queue_file, data)
    else:
        import urllib.request
        body = json.dumps({'ids': ids}).encode('utf-8')
        req = urllib.request.Request(a.api.rstrip('/') + '/api/void-runner/developer/revoice/done', data=body, method='POST',
                                     headers={'Authorization': 'Bearer ' + os.environ.get('VOID_OWNER_ID_TOKEN', ''), 'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=30).read()
    print('marked done in the queue:', len(ids))

if __name__ == '__main__':
    main()
