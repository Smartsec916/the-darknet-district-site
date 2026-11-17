"""Copy one animation clip from a MakeHuman crowd GLB into another, without Blender.

All the MakeHuman crowd figures share one 52-joint mixamorig skeleton (tests/character-assets.test.cjs), so a clip moves across by joint name:
- rotations keep the motion relative to each figure's own rest pose: q = rest_target * inverse(rest_donor) * q_donor;
- the hips' translation is scaled by the two figures' hip heights (so the feet stay on the floor); every other joint keeps the target's own rest offset and scale.
First use (17 Nov 2026): the District's two VR booth players had no walk, so the one who steps out of a booth for a visitor slid along in a standing pose.
  python3 tools/animation-pipeline/graft_clip.py <donor.glb> <target.glb> walk
A later Blender rebuild of the target (build_mpfb_character.py, with the clip in its character spec) replaces this with a proper retarget.
"""
import json, struct, sys


def read(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    bl = struct.unpack('<I', b[20 + jl:24 + jl])[0]
    return j, bytearray(b[28 + jl:28 + jl + bl])


def write(path, j, bin_):
    while len(bin_) % 4: bin_.append(0)
    j['buffers'][0]['byteLength'] = len(bin_)
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    out = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(bin_)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(bin_)) + b'BIN\0' + bytes(bin_)
    open(path, 'wb').write(out)


def floats(j, bin_, a):
    acc = j['accessors'][a]; bv = j['bufferViews'][acc['bufferView']]
    n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[acc['type']] * acc['count']
    o = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    return list(struct.unpack('<%df' % n, bin_[o:o + n * 4]))


def mul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return [aw*bx + ax*bw + ay*bz - az*by, aw*by - ax*bz + ay*bw + az*bx, aw*bz + ax*by - ay*bx + az*bw, aw*bw - ax*bx - ay*by - az*bz]


def inv(q): return [-q[0], -q[1], -q[2], q[3]]


def graft(donor, target, clip):
    dj, db = read(donor); tj, tb = read(target)
    if any(a['name'] == clip for a in tj.get('animations', [])): raise SystemExit(target + ' already has ' + clip)
    src = next(a for a in dj['animations'] if a['name'] == clip)
    tidx = {n.get('name'): i for i, n in enumerate(tj['nodes'])}
    rest = lambda n, k, d: n.get(k, d)
    hd = dj['nodes'][next(i for i, n in enumerate(dj['nodes']) if n.get('name') == 'mixamorig:Hips')]['translation'][1]
    ht = tj['nodes'][tidx['mixamorig:Hips']]['translation'][1]
    made = {}

    def add(values, typ, minmax=False):
        while len(tb) % 4: tb.append(0)
        off = len(tb); tb.extend(struct.pack('<%df' % len(values), *values))
        tj['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': len(values) * 4})
        n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[typ]
        acc = {'bufferView': len(tj['bufferViews']) - 1, 'componentType': 5126, 'count': len(values) // n, 'type': typ}
        if minmax: acc['min'] = [min(values)]; acc['max'] = [max(values)]
        tj['accessors'].append(acc); return len(tj['accessors']) - 1

    anim = {'name': clip, 'channels': [], 'samplers': []}
    for ch in src['channels']:
        dn = dj['nodes'][ch['target']['node']]; name = dn.get('name')
        if name not in tidx: continue
        tn = tj['nodes'][tidx[name]]; s = src['samplers'][ch['sampler']]; path = ch['target']['path']
        if s['input'] not in made: made[s['input']] = add(floats(dj, db, s['input']), 'SCALAR', True)
        out = floats(dj, db, s['output'])
        if path == 'rotation':
            fix = mul(rest(tn, 'rotation', [0, 0, 0, 1]), inv(rest(dn, 'rotation', [0, 0, 0, 1])))
            vals = [v for i in range(0, len(out), 4) for v in mul(fix, out[i:i + 4])]; typ = 'VEC4'
        elif path == 'translation':
            vals = [v * ht / hd for v in out] if name == 'mixamorig:Hips' else rest(tn, 'translation', [0, 0, 0]) * (len(out) // 3); typ = 'VEC3'
        elif path == 'scale':
            vals = rest(tn, 'scale', [1, 1, 1]) * (len(out) // 3); typ = 'VEC3'
        else: continue
        anim['samplers'].append({'input': made[s['input']], 'interpolation': s.get('interpolation', 'LINEAR'), 'output': add(vals, typ)})
        anim['channels'].append({'sampler': len(anim['samplers']) - 1, 'target': {'node': tidx[name], 'path': path}})
    tj['animations'].append(anim)
    write(target, tj, tb)
    print(target, '+', clip, len(anim['channels']), 'channels from', donor)


if __name__ == '__main__':
    graft(*sys.argv[1:4])
