"""Prepare rigged GLBs from an inventory for local NPC Library review.

Accepts the VRM-style joint names used by the downloaded Tripo characters.
Existing animation, geometry, textures and bind matrices are preserved. Each output
gets the companion donor's locomotion/interaction clips when they are missing.
"""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import uuid
import zipfile

import numpy as np
import retarget_world as R
from prepare_nomi_se7en import NAMES

ALIASES = {'Chest': 'Spine1', 'UpperChest': 'Spine2', **{k: v for k, v in NAMES.items() if k != 'Chest'}}
ALIASES.update({'LeftLowerArm': 'LeftForeArm', 'RightLowerArm': 'RightForeArm'})
CLIPS = ('idle-f', 'talk-f', 'walk', 'run', 'sit', 'sit-enter', 'sit-exit', 'recline', 'wave')

# Anonymous source labels get display names only. IDs and provenance stay independent.
DISPLAY_NAMES = {'pedestrian_a':'Orin Static', 'pedestrian_b':'Vela Fuse',
                 'crowd_club':'Sable Circuit', 'crowd_exec':'Corvin Slate',
                 'crowd_hood':'Hush Vey', 'crowd_punk':'Kestrel Coil'}
PROFILE_VERSION = 2


def glb_from(source):
    if '!' not in source:
        return Path(source).read_bytes()
    archive, member = source.split('!', 1)
    with zipfile.ZipFile(archive) as z:
        if z.getinfo(member).file_size > 100 << 20:
            raise ValueError('Oversized archive member')
        return z.read(member)


def prepare(path, donor, out):
    target = R.GLB(path)
    if len(target.j.get('skins', [])) != 1 or any('matrix' in n for n in target.j['nodes']):
        raise ValueError('Requires individual skeleton review')
    if 'EXT_meshopt_compression' in target.j.get('extensionsUsed', []):
        raise ValueError('Decode meshopt streams in Blender before retargeting')
    joints = target.j['skins'][0]['joints']
    original = {i: target.j['nodes'][i]['name'] for i in joints}
    canon = {i: ALIASES.get(R.bare(n), R.bare(n)) for i, n in original.items()}
    donor_names = {NAMES.get(n, n): n for n in R.joints(donor)}
    mapping = {n: donor_names[n] for n in canon.values() if n in donor_names}
    if set(donor_names) - mapping.keys() or len(set(canon.values())) != len(canon):
        raise ValueError('Incomplete or ambiguous canonical skeleton')
    for i, n in canon.items():
        target.j['nodes'][i]['name'] = n
    # This donor's rest origin is at the waist. The retargeter measures hip height
    # relative to the floor. Apply a root-only reference offset to t/r samples.
    existing = {a.get('name') for a in target.j.get('animations', [])}
    for source in CLIPS:
        name = {'idle-f': 'idle', 'talk-f': 'talk'}.get(source, source)
        if name in existing:
            continue
        times, tracks = R.retarget(donor, source, target, mapping, fps=24, loopblend=0)
        if not all(np.isfinite(values).all() for values in tracks.values()):
            raise ValueError('Nonfinite sampled track in ' + source)
        R.add_clip(target, name, times, tracks)
    for i, n in original.items():
        target.j['nodes'][i]['name'] = n
    R.save(target, out)


def floor_reference(donor):
    hips = donor.byname['Hips']
    if hips in donor.parent:
        raise ValueError('Expected the standalone Studio hips joint')
    rest = R.worlds(donor, np.zeros(1), None)
    offset = -min(rest[donor.byname[n]][0][0, 1] for n in ('LeftToes', 'RightToes'))
    donor.j['nodes'][hips]['translation'][1] += float(offset)
    original = donor.anim
    def corrected(clip):
        tracks = original(clip)
        if (hips, 'translation') in tracks:
            tracks[(hips, 'translation')][1][:, 1] += offset
        return tracks
    donor.anim = corrected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('inventory', type=Path)
    parser.add_argument('donor', type=Path, help='Recovered Nomi GLB with the shipped 26 clips')
    parser.add_argument('output', type=Path)
    parser.add_argument('--source-contains', required=True)
    args = parser.parse_args()
    donor = R.GLB(args.donor)
    R.CHILD = {**R.CHILD, 'Spine': 'Spine2'}  # Studio donor has one chest joint above the spine.
    floor_reference(donor)
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = args.output / 'preparation.json'
    prior = {r.get('id'): r for r in json.loads(manifest.read_text(encoding='utf8'))} if manifest.exists() else {}
    donor_hash = hashlib.sha256(args.donor.read_bytes()).hexdigest()
    report = []
    with tempfile.TemporaryDirectory(dir=args.output) as temp:
        src = Path(temp) / 'review.glb'
        for entry in json.loads(args.inventory.read_text(encoding='utf8'))['assets']:
            if entry.get('kind') != 'rigged humanoid candidate' or args.source_contains not in entry['source']:
                continue
            source = entry['source']
            record = {'source': source, 'sourceHash': entry['sha256']}
            report.append(record)
            try:
                data = glb_from(source)
                if hashlib.sha256(data).hexdigest() != entry['sha256']:
                    raise ValueError('Source changed since inventory')
                asset_id = 'imp-' + str(uuid.uuid5(uuid.NAMESPACE_URL, source + '#' + entry['sha256']))
                previous = prior.get(asset_id, {})
                previous_file = args.output / previous.get('file', '')
                if (previous.get('donorHash') == donor_hash and previous.get('profileVersion') == PROFILE_VERSION
                        and previous_file.parent == args.output and previous_file.is_file()
                        and hashlib.sha256(previous_file.read_bytes()).hexdigest() == previous.get('sha256')):
                    record.update(previous)
                    continue
                stem = Path(source).stem
                name = DISPLAY_NAMES.get(stem, stem.replace('_', ' ').title())
                filename = name + '.glb'
                record.update(id=asset_id, name=name, file=filename, donorHash=donor_hash, profileVersion=PROFILE_VERSION)
                src.write_bytes(data)
                prepared = Path(temp) / 'result.glb'
                prepare(src, donor, prepared)
                output = args.output / filename
                if output.exists() and output.read_bytes() != prepared.read_bytes():
                    raise ValueError('Output name already in use. Select a new output directory.')
                if not output.exists():
                    prepared.replace(output)
                record.update(bytes=output.stat().st_size, sha256=hashlib.sha256(output.read_bytes()).hexdigest())
            except Exception as e:
                record['error'] = str(e)
    merged = {**prior, **{r['id']:r for r in report if r.get('id')}}
    result = list(merged.values()) + [r for r in report if not r.get('id')]
    pending = args.output / 'preparation.partial'
    pending.write_text(json.dumps(result, indent=2), encoding='utf8')
    pending.replace(manifest)


if __name__ == '__main__':
    main()
