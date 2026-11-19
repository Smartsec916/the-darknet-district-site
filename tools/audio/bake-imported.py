#!/usr/bin/env python3
"""Bake imported voice files into the repository (maintainer tool; 19 Nov 2026).

The owner imports a voice file for a line in Developer Tools (void-runner/voice-imports.js). PUBLISH stores it in Firestore (collection vr_voice_clips, one
document per file, keyed by its SHA-256) and the published content lists it (content.clips). This tool copies those published files into the repository as
ordinary voice clips, so they can later be taken off Firestore:

  void-runner/assets/audio/voice/extra/<speaker>-imp-<first 10 of the hash>.ogg   Ogg Opus, mono, 24 kHz (ffmpeg + libopus), like the other clips
  void-runner/assets/audio/voice/extra/manifest.json                            one entry per file (speaker, the words players see, file, source)

Where the files come from (no secret is ever stored in the repository):
  default            the public API: GET /api/void-runner/live-content and GET /api/void-runner/voice-clip/<hash> (no sign-in; published files are public)
  --api URL          another server (e.g. http://127.0.0.1:5000 for a local run)
  --content-file F   a saved live-content response (or the editor's EXPORT MY EDITS file) instead of the API, with --clips-dir DIR holding files named by hash
  --firestore        read Firestore directly with YOUR local service-account key (GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json, never committed)

  python tools/audio/bake-imported.py --dry-run      list what would be written
  python tools/audio/bake-imported.py                write the clips and manifest entries (needs ffmpeg with libopus)

Afterwards: run npm test, bump BUILD in void-runner-sw.js, and commit the .ogg files and manifest. The game prefers a published imported file over a baked clip
for the same words (both are the same recording), so nothing changes for players until the import is removed from the published content.
"""
import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))  # the checkout this script is in (--repo writes into another one, e.g. a test copy)
API = 'https://the-darknet-district-site.onrender.com'
HASH = re.compile(r'^[0-9a-f]{64}$')
TAG = re.compile(r'\[[a-z][a-z \-]{0,29}\]')


def strip_tags(text):
    try:
        sys.path.insert(0, ROOT)
        from void_runner_drafts import strip_voice_tags  # the server's own rule, when present
        return strip_voice_tags(text).strip()
    except ImportError:
        return re.sub(r'[ \t]{2,}', ' ', TAG.sub(' ', text)).strip()


def say_names():
    """mission-givers.js: a giver whose dialogue name differs from their id (e.g. nyx-district speaks as 'Bartender'); the clip is keyed by the spoken name."""
    try:
        src = open(os.path.join(ROOT, 'void-runner', 'mission-givers.js'), encoding='utf-8').read()
    except OSError:
        return {}
    out = {}
    for gid, say in re.findall(r"'?([a-z][a-z0-9-]*)'?:\{name:'[^']*',group:\w+,say:'([^']+)'", src):
        out[gid] = re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', say.lower()))
    return out


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'void-runner-bake-imported'}), timeout=60) as r:
        return r.read()


def load_content(args):
    if args.content_file:
        data = json.load(open(args.content_file, encoding='utf-8'))
        return (data.get('content') or {}) if isinstance(data, dict) else {}
    if args.firestore:
        import firebase_admin
        from firebase_admin import firestore
        if not firebase_admin._apps:
            firebase_admin.initialize_app()  # GOOGLE_APPLICATION_CREDENTIALS
        db = firestore.client()
        live = (db.collection('vr_live_content_state').document('current').get().to_dict() or {}).get('live', 0)
        rec = db.collection('vr_live_content_versions').document('v%d' % live).get().to_dict() if live else None
        args._db = db
        return (rec or {}).get('content') or {}
    return json.loads(get(args.api.rstrip('/') + '/api/void-runner/live-content')).get('content') or {}


def load_clip(args, h):
    if args.clips_dir:
        data = open(os.path.join(args.clips_dir, h), 'rb').read()
    elif args.firestore:
        rec = args._db.collection('vr_voice_clips').document(h).get().to_dict() or {}
        data = base64.b64decode(rec.get('data') or '')
    else:
        data = get(args.api.rstrip('/') + '/api/void-runner/voice-clip/' + h)
    if hashlib.sha256(data).hexdigest() != h:
        raise SystemExit('The file %s does not match its address; nothing was written.' % h)
    return data


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--api', default=API)
    ap.add_argument('--content-file')
    ap.add_argument('--clips-dir')
    ap.add_argument('--firestore', action='store_true')
    ap.add_argument('--bitrate', default='40k')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--repo', default=ROOT, help='the checkout to write into (default: the one this script is in)')
    args = ap.parse_args()
    extra = os.path.join(os.path.abspath(args.repo), 'void-runner', 'assets', 'audio', 'voice', 'extra')
    clips = [c for c in (load_content(args).get('clips') or []) if isinstance(c, dict) and HASH.match(str(c.get('hash', '')))]
    print('Published content: %d imported voice file(s).' % len(clips))
    path = os.path.join(extra, 'manifest.json')
    manifest = json.load(open(path, encoding='utf-8'))
    lines = manifest.setdefault('lines', {})
    names = say_names()
    plan = []
    for c in clips:
        speaker = names.get(c['who'], c['who'])
        cid = '%s-imp-%s' % (speaker, c['hash'][:10])
        if cid in lines and lines[cid].get('importedHash') == c['hash']:
            print('  already baked: %s' % cid)
            continue
        plan.append((cid, speaker, c))
        print('  %s  %s: "%s" (%.1f s, %s)' % (cid, speaker, strip_tags(c['text'])[:60], c.get('duration', 0), c.get('type')))
    if args.dry_run or not plan:
        print('Dry run: nothing written.' if args.dry_run else 'Nothing to do.')
        return 0
    if not shutil.which('ffmpeg'):
        raise SystemExit('ffmpeg (with libopus) is needed to write the clips.')
    with tempfile.TemporaryDirectory() as tmp:
        for cid, speaker, c in plan:
            src = os.path.join(tmp, c['hash'])
            open(src, 'wb').write(load_clip(args, c['hash']))
            out, part = os.path.join(extra, cid + '.ogg'), os.path.join(tmp, cid + '.ogg')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '24000', '-c:a', 'libopus', '-b:a', args.bitrate, '-map_metadata', '-1', part], check=True)
            shutil.copyfile(part, out + '.part')
            os.replace(out + '.part', out)  # a new file, never written in place
            entry = {'speaker': speaker, 'text': strip_tags(c['text']), 'file': 'extra/' + cid + '.ogg', 'voice': 'imported file (Developer Tools)',
                     'source': 'imported by the owner in Developer Tools; Firestore vr_voice_clips/' + c['hash'], 'importedHash': c['hash']}
            if entry['text'] != c['text']:
                entry['importedText'] = c['text']
            lines[cid] = entry
            print('  wrote %s' % out)
    with open(path + '.part', 'w', encoding='utf-8', newline='\n') as f:
        json.dump(manifest, f, indent=1, ensure_ascii=False)
        f.write('\n')
    os.replace(path + '.part', path)  # replaced, never truncated in place
    print('Updated %s. Run npm test, bump BUILD in void-runner-sw.js, then commit.' % path)
    return 0


if __name__ == '__main__':
    sys.exit(main())
