"""Inventory selected folders and ZIP members without changing or extracting source assets."""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path, PurePosixPath
import struct
import zipfile

FORMATS = {'.glb', '.gltf', '.fbx', '.blend', '.blend1', '.obj', '.vrm', '.vrcompanion'}


def inspect(stream, ext):
    if ext == '.vrcompanion':
        magic, size = struct.unpack('>4sI', stream.read(8))
        if magic != b'VRC1' or size > 512 * 1024:
            raise ValueError('Invalid Companion Studio header')
        meta = json.loads(stream.read(size))
        return {'kind': 'companion package', 'name': meta['meta']['name'], 'sourceId': meta['meta']['id']}
    if ext in {'.glb', '.vrm'}:
        magic, version, _, size, chunk = struct.unpack('<4sIII4s', stream.read(20))
        if magic != b'glTF' or version != 2 or chunk != b'JSON' or size > 64 << 20:
            raise ValueError('Unsupported GLB header')
        doc = json.loads(stream.read(size))
    elif ext == '.gltf':
        data = stream.read((64 << 20) + 1)
        if len(data) > 64 << 20:
            raise ValueError('Oversized glTF document')
        doc = json.loads(data)
    else:
        return {'kind': 'requires Blender inspection'}
    joints = {j for skin in doc.get('skins', []) for j in skin['joints']}
    bones = [doc['nodes'][j].get('name', '').lower() for j in sorted(joints)]
    clips = [a.get('name', '') for a in doc.get('animations', [])]
    prims = [p for m in doc.get('meshes', []) for p in m['primitives']]
    humanoid = any('hips' in b or 'pelvis' in b for b in bones) and any('head' in b for b in bones)
    kind = 'animation only' if clips and not prims else 'rigged humanoid candidate' if humanoid else 'mesh for review' if prims else 'other'
    tris = sum(doc['accessors'][p.get('indices', p['attributes']['POSITION'])]['count'] // 3
               for p in prims if p.get('mode', 4) == 4)
    return dict(kind=kind, triangleListFaces=tris, joints=len(joints), bones=bones, clips=clips,
                materials=len(doc.get('materials', [])), textures=len(doc.get('textures', [])))


def scan(paths):
    rows, errors = [], []
    def record(source, ext, size, opener):
        row = {'source': source, 'bytes': size}
        rows.append(row)
        try:
            with opener() as f:
                row.update(inspect(f, ext))
            with opener() as f:
                row['sha256'] = hashlib.file_digest(f, 'sha256').hexdigest()
        except Exception as e:
            row['error'] = str(e)

    for root in paths:
        for p in (root.rglob('*') if root.is_dir() else [root]):
            ext = p.suffix.lower()
            try:
                if ext == '.zip' and p.is_file():
                    with zipfile.ZipFile(p) as archive:
                        for m in archive.infolist():
                            suffix = PurePosixPath(m.filename).suffix.lower()
                            if suffix in FORMATS and not m.is_dir():
                                if m.file_size > 512 << 20:
                                    errors.append([str(p), m.filename, 'Oversized member'])
                                    continue
                                record(str(p) + '!' + m.filename, suffix, m.file_size, lambda: archive.open(m))
                elif ext in FORMATS and p.is_file():
                    record(str(p), ext, p.stat().st_size, lambda: p.open('rb'))
            except (OSError, zipfile.BadZipFile) as e:
                errors.append([str(p), str(e)])
    hashes = defaultdict(list)
    for r in rows:
        if r.get('sha256'):
            hashes[r['sha256']].append(r['source'])
    return {'assets': rows, 'identicalFiles': [v for v in hashes.values() if len(v) > 1], 'errors': errors}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folders', nargs='+', type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    report = scan(args.folders)
    tmp = args.output.with_suffix('.partial')
    tmp.write_text(json.dumps(report, indent=2), encoding='utf8')
    tmp.replace(args.output)
    print(len(report['assets']), 'assets;', len(report['identicalFiles']), 'identical groups')
