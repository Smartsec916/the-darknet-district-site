"""Render every line in void-runner/assets/audio/voice/manifest.json with Kokoro-82M (Apache-2.0),
offline, using each speaker's cast voice. Existing clips are kept, so only new or changed lines
are rendered. Output: 24 kHz mono Ogg/Opus, silence trimmed, levelled to a common loudness.

Setup (one time): python -m venv venv; venv/Scripts/pip install kokoro-onnx soundfile
Model files (free, from github.com/thewh1teagle/kokoro-onnx releases, model-files-v1.0):
  kokoro-v1.0.onnx and voices-v1.0.bin, in the folder given by --models.
Usage: python tools/voice/generate.py --models <folder> [--only iris] [--force]
"""
import argparse, json, os, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'void-runner', 'assets', 'audio', 'voice')

def level(samples, rate, target_rms=0.08, peak=0.89):
    """Trim leading/trailing silence and level to a common loudness without clipping."""
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
    p = argparse.ArgumentParser()
    p.add_argument('--models', required=True)
    p.add_argument('--only', default=None, help='render one speaker only')
    p.add_argument('--force', action='store_true', help='re-render existing clips')
    p.add_argument('--check', action='store_true', help='only verify the cast voices exist')
    a = p.parse_args()
    manifest = json.load(open(os.path.join(OUT, 'manifest.json'), encoding='utf-8'))
    kokoro = Kokoro(os.path.join(a.models, 'kokoro-v1.0.onnx'), os.path.join(a.models, 'voices-v1.0.bin'))
    available = set(kokoro.get_voices())
    missing = {s: c['voice'] for s, c in manifest['cast'].items() if c['voice'] not in available}
    if missing:
        sys.exit('Unknown voices: %s' % missing)
    if a.check:
        print('cast OK:', len(manifest['cast']), 'speakers;', len(available), 'voices available')
        return
    made = 0
    for line_id, line in manifest['lines'].items():
        if a.only and line['speaker'] != a.only:
            continue
        path = os.path.join(OUT, line['file'])
        if os.path.exists(path) and not a.force:
            continue
        cast = manifest['cast'][line['speaker']]
        lang = 'en-gb' if cast['voice'][:2] in ('bf', 'bm') else 'en-us'
        samples, rate = kokoro.create(line['text'], voice=cast['voice'], speed=cast.get('speed', 1.0), lang=lang)
        sf.write(path, level(samples, rate), rate, format='OGG', subtype='OPUS')
        made += 1
        print('%-22s %5.1fs  %s' % (line_id, len(samples) / rate, line['text'][:60]))
    print('rendered', made, 'clips')

if __name__ == '__main__':
    main()
