"""Industrial floodlight tower, built in Blender code (the 'Blender' candidate of the Blender-vs-Meshy test, docs/development/UNIVERSE_GRAPHICS_TRACKER.md).

    python tools/assets/universe/build_floodlight.py out.glb

A 14 m lattice mast on four tapering legs with cross-bracing, three work platforms with rails, a caged ladder, a junction cabinet, a cable run and a 2 x 4 lamp bank
with housings, reflector cones and lenses. Origin at the centre of the base, +Y up. Textures: the Vantor sets (vantor_textures.py).
Made by Claude for this project; no third-party assets."""
import math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vcore import Builder  # noqa: E402
from build_vantor import MATS, TEXTMP  # noqa: E402
import vantor_textures  # noqa: E402


def build(H=14.0, B=None, ox=0.0, oz=0.0, oy=0.0, face=1, lamps=True):
    """Adds one lattice floodlight tower to B at (ox, oy, oz); face=+1 aims the lamp bank toward +z, -1 toward -z."""
    standalone = B is None
    if standalone:
        B = Builder(MATS, slab=1000)
    return _tower(B, H, ox, oy, oz, face, lamps)


def _tower(B, H, ox, oy, oz, face, lamps):
    Bx = B
    base_w, top_w = 1.7, .7

    class _S:                       # shifts and mirrors every point so the tower can stand anywhere, facing either way
        def __init__(s, b): s.b = b
        def _p(s, p): return (p[0] + ox, p[1] + oy, p[2] * face + oz)
        def box(s, lo, hi, m):
            a, c = s._p(lo), s._p(hi)
            s.b.box((min(a[0], c[0]), min(a[1], c[1]), min(a[2], c[2])), (max(a[0], c[0]), max(a[1], c[1]), max(a[2], c[2])), m)
        def beam(s, a, b, w, h, m): s.b.beam(s._p(a), s._p(b), w, h, m)
        def cyl(s, a, b, r, m, seg=10, caps=True, r2=None): s.b.cyl(s._p(a), s._p(b), r, m, seg, caps, r2)
        def lamp(s, pos, rgb, i, r):
            if lamps: s.b.lamp(s._p(pos), rgb, i, r)
    B = _S(Bx)

    def half(y):
        return (base_w + (top_w - base_w) * (y / H)) / 2
    legs = [(sx, sz) for sx in (-1, 1) for sz in (-1, 1)]
    ys = np.linspace(0, H, 8)
    for sx, sz in legs:
        for a, b in zip(ys[:-1], ys[1:]):
            B.beam((sx * half(a), a, sz * half(a)), (sx * half(b), b, sz * half(b)), .14, .14, 'v_steel')
        B.box((sx * half(0) - .28, 0, sz * half(0) - .28), (sx * half(0) + .28, .18, sz * half(0) + .28), 'trim_dark')       # base plates
        for bx in (-1, 1):
            for bz in (-1, 1):
                B.cyl((sx * half(0) + bx * .18, .18, sz * half(0) + bz * .18), (sx * half(0) + bx * .18, .3, sz * half(0) + bz * .18), .03, 'v_steel', 6)
    for a, b in zip(ys[:-1], ys[1:]):
        flip = int(round(a * 3)) % 2
        for face in range(4):
            sx0, sz0 = legs[face % 4]
            # four faces: x-,x+,z-,z+
            pass
        for s in (-1, 1):
            # +/-x faces, diagonals alternating
            B.beam((s * half(a), a, -half(a) if not flip else half(a)), (s * half(b), b, half(b) if not flip else -half(b)), .06, .06, 'v_steel')
            B.beam((-half(a) if not flip else half(a), a, s * half(a)), (half(b) if not flip else -half(b), b, s * half(b)), .06, .06, 'v_steel')
        # horizontal rings
        for s in (-1, 1):
            B.beam((s * half(b), b, -half(b)), (s * half(b), b, half(b)), .06, .06, 'v_steel')
            B.beam((-half(b), b, s * half(b)), (half(b), b, s * half(b)), .06, .06, 'v_steel')
    # work platforms
    for y in (4.5, 9.0, H):
        h = half(y) + .45
        B.box((-h, y, -h), (h, y + .06, h), 'v_floor')
        B.box((-h, y - .12, -h), (h, y, -h + .08), 'trim_dark'); B.box((-h, y - .12, h - .08), (h, y, h), 'trim_dark')
        B.box((-h, y - .12, -h), (-h + .08, y, h), 'trim_dark'); B.box((h - .08, y - .12, -h), (h, y, h), 'trim_dark')
        for s in (-1, 1):
            B.beam((s * h, y + 1.0, -h), (s * h, y + 1.0, h), .04, .04, 'v_steel'); B.beam((-h, y + 1.0, s * h), (h, y + 1.0, s * h), .04, .04, 'v_steel')
            B.beam((s * h, y + .5, -h), (s * h, y + .5, h), .03, .03, 'v_steel'); B.beam((-h, y + .5, s * h), (h, y + .5, s * h), .03, .03, 'v_steel')
        for px in (-h, h):
            for pz in (-h, h):
                B.box((px - .03, y, pz - .03), (px + .03, y + 1.0, pz + .03), 'v_steel')
    # caged ladder up the +z face
    zl = half(0) + .12
    for x in (-.22, .22):
        B.beam((x, .2, half(0) + .06), (x * .8, H, half(H) + .06), .05, .05, 'v_steel')
    for y in np.arange(.4, H, .32):
        B.beam((-.22 * (1 - y / H * .2), y, half(y) + .06), (.22 * (1 - y / H * .2), y, half(y) + .06), .03, .03, 'v_steel')
    for y in np.arange(2.2, H, 1.5):
        for a0 in np.linspace(-1.2, 1.2, 7)[:-1]:
            pass
        B.beam((-.32, y, half(y) + .38), (.32, y, half(y) + .38), .04, .04, 'trim_dark')
    # junction cabinet at the foot, hazard band, cable run
    B.box((-.45, .2, half(0) + .1), (.45, 1.5, half(0) + .5), 'v_steel')
    B.box((-.4, .2, half(0) + .5), (.4, .42, half(0) + .52), 'v_hazard')
    B.box((-.3, 1.2, half(0) + .5), (-.18, 1.32, half(0) + .53), 'lamp_amber')
    B.cyl((.55, .2, half(0) - .1), (.55, H, half(H) - .1), .035, 'trim_dark', 6)
    B.cyl((.62, .2, half(0) - .1), (.62, H, half(H) - .1), .03, 'trim_dark', 6)
    B.box((-half(0) - .1, 0, -half(0) - .1), (half(0) + .1, .5, half(0) + .1), 'v_hazard') if False else None
    for y in np.arange(.8, 4.0, .9):
        pass
    # lamp bank on the top platform: a 4 x 2 array of housings, each with a reflector cone and a lens
    yb = H + 1.15
    B.box((-1.7, yb - .15, -.12), (1.7, yb + .0, .12), 'trim_dark')
    B.box((-1.7, yb + 1.7, -.12), (1.7, yb + 1.85, .12), 'trim_dark')
    for sx in (-1.7, 1.7):
        B.box((sx - .06, yb - .15, -.12), (sx + .06, yb + 1.85, .12), 'v_steel')
    B.box((-.12, H, -.1), (.12, yb - .1, .1), 'v_steel')
    for row in range(2):
        for col in range(4):
            cx, cy = -1.275 + col * .85, yb + .35 + row * .8
            B.box((cx - .38, cy - .3, .1), (cx + .38, cy + .3, .5), 'trim_dark')
            B.cyl((cx, cy, .5), (cx, cy, .72), .27, 'v_steel', 14, r2=.34)
            B.cyl((cx, cy, .72), (cx, cy, .75), .3, 'lamp_white', 14)
            B.box((cx - .4, cy + .3, .08), (cx + .4, cy + .38, .56), 'v_steel')       # visor
    B.box((-.1, yb + 1.85, -.1), (.1, yb + 2.4, .1), 'v_steel')
    B.cyl((0, yb + 2.4, 0), (0, yb + 2.6, 0), .13, 'lamp_red', 10)
    for x in (-1.275, -.425, .425, 1.275):
        B.lamp((x, yb + 1, 1.5), np.array([.8, .9, 1.0]), .5, 10)
    return Bx


if __name__ == '__main__':
    out = sys.argv[1]
    if not os.path.isdir(TEXTMP):
        vantor_textures.build(TEXTMP)
    B = build()
    print('faces', B.write(out, TEXTMP))
