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

    engine, problems = registry['engine'], []
    for npc_id, entry in registry['npcs'].items():
        if entry['status'] == 'approved' and entry.get('approvedConfigHash') != config_hash(entry, engine):
            problems.append('%s: approved voice changed without re-approval' % npc_id)
    for line_id, line in manifest['lines'].items():
        entry = registry['npcs'].get(line['speaker'])
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
    for line_id in todo:
        line = manifest['lines'][line_id]
        entry = registry['npcs'][line['speaker']]
        try:
            samples, rate = kokoro.create(line['text'], voice=entry['voice'], speed=float(entry['speed']), lang=entry['lang'])
            sf.write(os.path.join(OUT, line['file']), level(samples, rate), rate, format='OGG', subtype='OPUS')
            renders[line_id] = {'configHash': line['configHash'], 'textHash': hashlib.sha256(line['text'].encode('utf-8')).hexdigest()[:12],
                                'generatedAt': datetime.date.today().isoformat(), 'runtime': engine.get('runtime', '')}
            print('%-22s %5.1fs  %s' % (line_id, len(samples) / rate, line['text'][:60]))
        except Exception as error:  # report and continue; the game falls back to subtitles
            failures.append('%s: %s' % (line_id, error))
    save(renders_path, renders)
    print('rendered', len(todo) - len(failures), 'clip(s)')
    if failures:
        sys.exit('Failed:\n - ' + '\n - '.join(failures))

if __name__ == '__main__':
    main()
