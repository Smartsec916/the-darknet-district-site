"""Writes void-runner/assets/models/gear/street-fit.json: for every character file in assets/models/crowd, the rest-pose joints and the body sizes the street gear
(void-runner/street-gear.js) is built from: waist, ribs, thighs, knees, forearms and forehead, measured on the clothed figure, in the file's own units.
Plain Python (numpy, no Blender). Run again if a character file changes:   python tools/assets/gear/street_fit.py"""
import json, os, struct, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from fit_data import glb_json, world_positions, REPO, CROWD

OUT = os.path.join(REPO, 'void-runner', 'assets', 'models', 'gear', 'street-fit.json')
JOINTS = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand']
SMALL = ('eye', 'lash', 'brow', 'teeth', 'tongue')
HEADWEAR = ('short', 'bob', 'braid', 'long', 'ponytail', 'fedora', 'hair', 'shades', 'visor', 'mask')


def verts(path, j, skip):
    d = open(path, 'rb').read()
    n = struct.unpack_from('<I', d, 12)[0]
    off = 20 + n + 8
    out = []
    for mesh in j['meshes']:
        if any(k in mesh['name'].lower() for k in skip):
            continue
        for prim in mesh['primitives']:
            a = j['accessors'][prim['attributes']['POSITION']]
            bv = j['bufferViews'][a['bufferView']]
            stride = bv.get('byteStride', 12)
            raw = np.frombuffer(d, dtype=np.uint8, count=(a['count'] - 1) * stride + 12, offset=off + bv.get('byteOffset', 0) + a.get('byteOffset', 0))
            idx = (np.arange(a['count'])[:, None] * stride + np.arange(12)[None, :]).ravel()
            out.append(raw[idx].view(np.float32).reshape(-1, 3))
    return np.concatenate(out)


def radial(V, a, b, t, half, limit):
    """Around the bone a->b at fraction t: the clothed limb's centre (as an offset from the bone, since a bone does not run down the middle of a limb), its radius about
    that centre (97th percentile) and how far forward (+z) it reaches from the bone. Only points within `limit` of the bone count."""
    a, b = np.array(a), np.array(b)
    ax = b - a
    L = np.linalg.norm(ax)
    ax /= L
    rel = V - a
    s = rel @ ax
    perp = rel - np.outer(s, ax)
    m = (np.abs(s - t * L) < half * L) & (np.linalg.norm(perp, axis=1) < limit)
    P = perp[m]
    c = (np.percentile(P, 2, axis=0) + np.percentile(P, 98, axis=0)) / 2
    r = float(np.percentile(np.linalg.norm(P - c, axis=1), 97))
    return {'c': [round(float(x), 4) for x in c], 'r': round(r, 4), 'front': round(float(np.percentile(P[:, 2], 99)), 4)}


def slab(V, y, half, cx, reach):
    m = (np.abs(V[:, 1] - y) < half) & (np.abs(V[:, 0] - cx) < reach)
    P = V[m]
    return P


def main():
    bodies = {}
    for f in sorted(os.listdir(CROWD)):
        if not f.endswith('.glb'):
            continue
        path = os.path.join(CROWD, f)
        j = glb_json(path)
        pos = world_positions(j)
        if 'mixamorig:Hips' not in pos:
            continue
        J = {k: np.array(pos['mixamorig:' + k], dtype=float) for k in JOINTS}
        body = verts(path, j, SMALL + HEADWEAR)
        everything = verts(path, j, SMALL)
        H = float(everything[:, 1].max() - everything[:, 1].min())
        span = abs(J['LeftArm'][0] - J['RightArm'][0])
        cx = J['Hips'][0]
        o = {'height': round(H, 4), 'span': round(float(span), 4), 'joints': {k: [round(float(x), 4) for x in v] for k, v in J.items()}}
        # waist: a little above the hip joint
        wy = J['Hips'][1] + .035 * H
        P = slab(body, wy, .012 * H, cx, .17 * H)
        o['waist'] = {'y': round(float(wy), 4), 'halfW': round(float(np.abs(P[:, 0] - cx).max()), 4), 'front': round(float(P[:, 2].max()), 4), 'back': round(float(P[:, 2].min()), 4)}
        # ribs: at Spine1, under the chest; the arms are kept out by the reach
        ry = J['Spine1'][1]
        P = slab(body, ry, .012 * H, cx, span * .40)
        o['ribs'] = {'y': round(float(ry), 4), 'halfW': round(float(np.abs(P[:, 0] - cx).max()), 4), 'front': round(float(P[:, 2].max()), 4), 'back': round(float(P[:, 2].min()), 4)}
        # forehead (with the hair): where goggles pushed up would sit
        top = float(everything[:, 1].max())
        fy = J['Head'][1] + .66 * (top - J['Head'][1])
        P = slab(everything, fy, .010 * H, J['Head'][0], .12 * H)
        o['brow'] = {'y': round(float(fy), 4), 'halfW': round(float(np.abs(P[:, 0] - J['Head'][0]).max()), 4), 'front': round(float(P[:, 2].max()), 4), 'back': round(float(P[:, 2].min()), 4)}
        for side in ('Left', 'Right'):
            sx = 1 if J[side + 'UpLeg'][0] > cx else -1
            legV = body[(body[:, 0] - cx) * sx > 0]
            o[side] = {'thigh': radial(legV, J[side + 'UpLeg'], J[side + 'Leg'], .30, .04, .16 * H), 'knee': radial(legV, J[side + 'Leg'], J[side + 'Foot'], .02, .05, .12 * H),
                       'shin': radial(legV, J[side + 'Leg'], J[side + 'Foot'], .45, .05, .12 * H), 'forearm': radial(body, J[side + 'ForeArm'], J[side + 'Hand'], .55, .08, .10 * H)}
        # a skirt or dress: the "thigh" is far wider than the knee below it
        o['skirt'] = bool(o['Left']['thigh']['r'] > 1.9 * o['Left']['knee']['r'])
        bodies[f[:-4]] = o
        print('%-20s H %.2f waist %.3f ribs %.3f thigh %.3f knee %.3f shin %.3f forearm %.3f brow %.3f skirt %s' % (f[:-4], H, o['waist']['halfW'], o['ribs']['halfW'], o['Left']['thigh']['r'], o['Left']['knee']['r'], o['Left']['shin']['r'], o['Left']['forearm']['r'], o['brow']['halfW'], o['skirt']))
    with open(OUT, 'w') as f:
        json.dump({'note': 'Generated by tools/assets/gear/street_fit.py. Rest-pose joints and clothed body sizes of every character file, in the file\'s own units; street-gear.js builds the gear from these.', 'bodies': bodies}, f, separators=(',', ':'))
    print('wrote', OUT, len(bodies), 'bodies', os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    main()
