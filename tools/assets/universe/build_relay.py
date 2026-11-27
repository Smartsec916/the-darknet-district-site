"""Vantor Relay hangar (a placeholder station until now): a rock-cut orbital-transfer hangar (docs/development/UNIVERSE_GRAPHICS_TRACKER.md).

    python tools/assets/universe/build_relay.py [out.glb]

Same layout as station-layouts.js for the relays: hangar x -18..18, z -26..4 (pad and ship anchor at (-7, 2, -9), spawn (0, 1.7, -17), board (-2, 1.7, -14)), door leaves at z=-26,
rear bulkhead at z=4. This adds a modelled shell (steel ribs, duct runs, lamps, floor deck, pad, front and rear walls, lockers and crates along the walls); relay.js hides the plain boxes.
Collision is the layout's own data and is not touched. Made by Claude for this project; no third-party assets."""
import math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vcore import Builder  # noqa: E402
from build_vantor import MATS, noise2, AMBER, WHITE, RED, TEAL, TEXTMP  # noqa: E402
import vantor_textures  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUTDIR = os.path.join(REPO, 'void-runner', 'assets', 'models', 'vantor')


def build():
    B = Builder(MATS, slab=14)
    Z0, Z1, W = -27.0, 5.0, 18.0
    nA = noise2(256, 9, 5)
    # rock vault over the hangar
    NS, NZ = 48, 40
    P = np.zeros((NS, NZ, 3))
    for k in range(NZ):
        z = Z0 + (Z1 - Z0) * k / (NZ - 1)
        for i in range(NS):
            s = i / (NS - 1)
            th = math.pi * s
            r = 21.0
            x, y = -r * math.cos(th), 4.0 + 12.0 * math.sin(th)
            if s < .08:
                x, y = -r, -3 + (s / .08) * 7
            elif s > .92:
                x, y = r, -3 + ((1 - s) / .08) * 7
            d = (nA[int(s * 255), int(k / (NZ - 1) * 255)] - .5) * 3.2
            nx, ny = (x / r, (y - 4) / 12)
            l = math.hypot(nx, ny) or 1
            P[i, k] = (x + nx / l * d, y + ny / l * d, z)
    B.grid(P, 'v_rock', lambda c: (-c[0], 4 - c[1], 0))
    B.box((-W - 1, -.6, Z0), (W + 1, 0, Z1), 'v_floor')
    # side walls (steel cladding from floor to 6 m, rock above), ribs with lamps
    for sx in (-1, 1):
        x0, x1 = sorted((sx * W, sx * (W + .6)))
        B.box((x0, 0, Z0), (x1, 6.0, Z1), 'v_steel')
        B.box((min(sx * W, sx * (W - .2)), 6.0, Z0), (max(sx * W, sx * (W - .2)), 6.25, Z1), 'trim_dark')
        for z in np.arange(Z0 + 2, Z1, 4.0):
            B.box((sx * (W - .5) - .25, 0, z - .3), (sx * (W - .5) + .25, 6.0, z + .3), 'trim_dark')
            B.box((sx * (W - .6) - .1, 5.0, z - .1), (sx * (W - .6) + .1, 5.35, z + .1), 'lamp_amber')
            B.lamp((sx * (W - 1.2), 4.8, z), AMBER, .55, 9)
    # steel arches
    for z in (-24, -16, -8, 0):
        pts = [(-W * math.cos(math.pi * i / 24), 6.0 + 7.8 * math.sin(math.pi * i / 24)) for i in range(25)]
        for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
            tx, ty = x1 - x0, y1 - y0
            l = math.hypot(tx, ty)
            B.beam((x0, y0, z), (x1, y1, z), .9, 1.0, 'v_steel', up=(-ty / l, tx / l, 0))
    # duct runs and pendant lamps
    for sx in (-1, 1):
        B.cyl((sx * 8, 11.8, Z0 + 1), (sx * 8, 11.8, Z1 - 1), .9, 'v_steel', 14)
        for z in np.arange(Z0 + 2, Z1 - 1, 3.0):
            B.cyl((sx * 8, 11.8, z - .1), (sx * 8, 11.8, z + .1), 1.0, 'trim_dark', 14)
    for z in (-22, -15, -8, -1):
        for sx in (-1, 1):
            x, y = sx * 5.5, 8.6
            B.cyl((x, y + 3, z), (x, y + .4, z), .03, 'trim_dark', 5)
            B.cyl((x, y + .4, z), (x, y, z), .75, 'trim_dark', 12, r2=.32)
            B.cyl((x, y, z), (x, y - .05, z), .58, 'lamp_white' if (z + sx) % 2 else 'lamp_amber', 12)
            B.lamp((x, y - .6, z), WHITE if (z + sx) % 2 else AMBER, .95, 15)
    # pad: ring, hazard band, deck lamps (the ship rests at (-7, 2, -9))
    cx, cz, r = -7.0, -9.0, 7.4
    B.cyl((cx, 0, cz), (cx, .3, cz), r, 'v_floor', 40)
    B.cyl((cx, .3, cz), (cx, .32, cz), r - .45, 'v_hazard', 40)
    B.cyl((cx, .32, cz), (cx, .36, cz), r - 1.6, 'v_floor', 40)
    for i in range(12):
        a = 2 * math.pi * i / 12
        B.box((cx + (r - .85) * math.cos(a) - .15, .32, cz + (r - .85) * math.sin(a) - .15), (cx + (r - .85) * math.cos(a) + .15, .4, cz + (r - .85) * math.sin(a) + .15), 'lamp_amber')
        B.lamp((cx + (r - .85) * math.cos(a), .7, cz + (r - .85) * math.sin(a)), AMBER, .2, 6)
    # guide stripes to the mouth, hazard edges
    for sx in (-1, 1):
        B.box((sx * (W - 1.3) - .3, .005, Z0), (sx * (W - 1.3) + .3, .015, Z1), 'v_hazard')
    B.box((-4, .005, Z0), (4, .015, Z0 + 1.2), 'v_hazard')
    # front wall with the mouth (door leaves are the layout's own boxes) and the rear bulkhead with its door
    for sx in (-1, 1):
        B.box((min(sx * 10, sx * (W + 1)), 0, Z0 - .6), (max(sx * 10, sx * (W + 1)), 12, Z0 - .1), 'v_steel')
    B.box((-10.4, 7.2, Z0 - .7), (10.4, 12, Z0 - .1), 'v_steel')
    B.box((-10.6, 7.0, Z0 - .9), (10.6, 7.3, Z0 + .1), 'v_hazard')
    for sx in (-1, 1):
        B.box((min(sx * 4, sx * (W + 1)), 0, Z1 - .3), (max(sx * 4, sx * (W + 1)), 11, Z1 + .3), 'v_steel')
        B.box((min(sx * 4, sx * 4.5), 0, Z1 - .35), (max(sx * 4, sx * 4.5), 4.2, Z1 + .35), 'v_hazard')
    B.box((-4.5, 4.2, Z1 - .3), (4.5, 11, Z1 + .3), 'v_steel')
    B.box((-4.0, 0, Z1 - .15), (4.0, 4.2, Z1 + .15), 'trim_dark')                       # the sealed pressure door (the room behind it is reserved)
    B.box((-.6, 2.4, Z1 - .2), (.6, 3.0, Z1 - .15), 'win_dim')
    B.box((-3.8, 1.2, Z1 - .2), (-3.5, 1.5, Z1 - .15), 'lamp_red')
    for k in range(5):
        B.box((-3.6 + k * 1.8, 0, Z1 - .22), (-3.5 + k * 1.8, 4.2, Z1 - .15), 'v_steel')
    B.box((-3.6, 3.7, Z1 - .45), (3.6, 4.0, Z1 - .3), 'lamp_teal')
    # lockers, crates, tool racks, fuel drums along the walls (visual only, clear of the pad and the board point)
    for k in range(6):
        B.box((-W + .4, 0, -24 + k * 1.2), (-W + 1.4, 2.1, -23.2 + k * 1.2), 'v_steel' if k % 2 else 'trim_dark')
    for k in range(4):
        for lvl in range(1 + k % 2):
            B.box((W - 3.4 + (k % 2) * .1, lvl * 1.5, -3 + k * 2.2), (W - .5, 1.5 + lvl * 1.5, -1.2 + k * 2.2), 'v_hazard' if k == 2 else 'v_steel')
    for k in range(5):
        B.cyl((W - 1.5, 0, -22 + k * 1.1), (W - 1.5, 1.0, -22 + k * 1.1), .38, 'v_hazard' if k % 2 else 'trim_dark', 10)
    B.box((-W + .3, 0, -6), (-W + 2.0, 1.1, -1), 'trim_dark')
    B.box((-W + .3, 1.1, -6), (-W + 2.0, 1.2, -1), 'v_steel')
    B.box((-W + .5, 2.2, -5.6), (-W + .6, 4.4, -1.4), 'lamp_teal')                       # status board
    # red emergency lamps by the mouth, crane rail overhead
    for sx in (-1, 1):
        B.box((sx * 10.4 - .15, 5.5, Z0 + .1), (sx * 10.4 + .15, 5.9, Z0 + .5), 'lamp_red')
        B.lamp((sx * 10.4, 5.6, Z0 + 1.2), RED, .35, 7)
        B.box((sx * 13 - .25, 10.4, Z0 + 1), (sx * 13 + .25, 10.9, Z1 - 1), 'trim_dark')
    B.lamp((0, 3, Z0 + 3), WHITE, .5, 12); B.lamp((0, 3, 0), AMBER, .5, 12); B.lamp((-7, 6, -9), WHITE, .6, 16)
    return B


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(OUTDIR, 'vantor-relay.glb')
    if not os.path.isdir(TEXTMP):
        vantor_textures.build(TEXTMP)
    print('faces', build().write(out, TEXTMP), 'KB', os.path.getsize(out) // 1024)
