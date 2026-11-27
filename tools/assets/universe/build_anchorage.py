"""Tessaly Belt Anchorage: the hollowed asteroid, mooring rig and ore-processing gantries behind the station (docs/development/UNIVERSE_GRAPHICS_TRACKER.md).

    python tools/assets/universe/build_anchorage.py [--textures] [out.glb]

Authored in the station's own local frame (meridian-station.js: hangar mouths face -z at z=-26, the service spine sits at z 35..45, x -103..114), so the model is parented to the
station exterior and follows it through docking and departure. Nothing here is solid: it is scenery behind and around the hull, clear of the hangar mouths and the approach.
The hull itself is the existing station kit; this adds the belt-industrial identity (brief section 4): a busy, heavily used rock-anchored depot.
Made by Claude for this project; no third-party assets."""
import math, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vcore import Builder, Mat  # noqa: E402
import vantor_textures  # noqa: E402
from build_vantor import noise2  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUTDIR = os.path.join(REPO, 'void-runner', 'assets', 'models', 'anchorage')
TEXTMP = os.path.join(REPO, 'tools', 'assets', 'universe', '.tex')

MATS = [Mat('b_rock', 'b_rock', 12.0), Mat('v_steel', 'v_steel', 3.0), Mat('v_floor', 'v_floor', 4.0), Mat('v_hazard', 'v_hazard', 2.0),
        Mat('lamp_amber', emissive=(1, .6, .22), strength=1.6), Mat('lamp_white', emissive=(.85, .93, 1), strength=1.8), Mat('lamp_red', emissive=(1, .1, .06), strength=2.0),
        Mat('lamp_teal', emissive=(.2, .9, .8), strength=1.5), Mat('trim_dark', color=(.05, .052, .056), rough=.75, metal=.5),
        Mat('b_teal', color=(.09, .27, .25), rough=.55, metal=.35)]


def build():
    B = Builder(MATS, slab=1000)
    # In space the sun lights everything, so only a little baked ambient occlusion goes into the vertex colour (carved bay and gantry undersides darker).
    def light(p, n, self=B):
        ao = .75 + .2 * (.5 + .5 * n[1])
        c = np.array([ao, ao, ao]) * .8
        for pos, rgb, inten, rad in self.lamps:
            d = pos - p
            dist = np.linalg.norm(d)
            if dist > rad * 1.5:
                continue
            c = c + rgb * inten * 2.2 * (max(0.0, np.dot(n, d / (dist + 1e-6))) * .8 + .2) / (1 + (dist / (rad * .4)) ** 2)
        return c
    B.light = light
    rng = np.random.default_rng(21)
    C = np.array([14.0, 8.0, 128.0])         # asteroid centre (station-local)
    R = np.array([62.0, 42.0, 56.0])         # semi-axes
    bay = np.array([.05, -.02, -1.0]); bay /= np.linalg.norm(bay)
    nA, nB = noise2(256, 3, 4), noise2(256, 4, 12)
    NU, NV = 130, 88

    def radius_dir(d):
        a = math.atan2(d[2], d[0]) / (2 * math.pi) + .5
        b = (math.asin(max(-1, min(1, d[1]))) / math.pi) + .5
        i, j = int(b * 255), int(a * 255)
        base = 1 + (nA[i, j] - .5) * .5 + (nB[i, j] - .5) * .12
        k = float(np.dot(d, bay))
        t = np.clip((k - .70) / .22, 0, 1)
        carve = t * t * (3 - 2 * t)
        return base * (1 - .56 * carve) + (nB[i, j] - .5) * .05 * carve, carve

    G = np.zeros((NV + 1, NU + 1, 3))
    for v in range(NV + 1):
        th = math.pi * v / NV
        for u in range(NU + 1):
            ph = 2 * math.pi * (u % NU) / NU
            d = np.array([math.sin(th) * math.cos(ph), math.cos(th), math.sin(th) * math.sin(ph)])
            r, carve = radius_dir(d)
            G[v, u] = C + d * R * r
    B.grid(G, 'b_rock', lambda c: c - C)

    # --- the bay floor: where the rock was cut away there is a flat working deck cut into the rock (a ring-shaped terrace) with rigs on it
    bay_c = C + bay * R * .50
    deck_y = bay_c[1] - 10
    zf = bay_c[2] - 3
    B.box((bay_c[0] - 26, deck_y - 1.2, zf - 6), (bay_c[0] + 26, deck_y, zf + 22), 'v_floor')
    B.box((bay_c[0] - 26, deck_y, zf - 6), (bay_c[0] + 26, deck_y + .12, zf - 5.4), 'v_hazard')

    def container(x, y, z, w=6.1, h=2.6, d=2.4, hue=0, rot90=False):
        mats = ['v_steel', 'b_teal', 'v_hazard', 'trim_dark']
        m = mats[hue % 4]
        if rot90:
            w, d = d, w
        B.box((x - w / 2, y, z - d / 2), (x + w / 2, y + h, z + d / 2), m)
        for k in range(1, 6):          # ribs
            if not rot90:
                B.box((x - w / 2 + k * w / 6 - .03, y, z - d / 2 - .04), (x - w / 2 + k * w / 6 + .03, y + h, z - d / 2), 'trim_dark')
                B.box((x - w / 2 + k * w / 6 - .03, y, z + d / 2), (x - w / 2 + k * w / 6 + .03, y + h, z + d / 2 + .04), 'trim_dark')
        B.box((x - w / 2 - .02, y, z - d / 2 - .02), (x - w / 2 + .12, y + h, z + d / 2 + .02), 'trim_dark')
        B.box((x + w / 2 - .12, y, z - d / 2 - .02), (x + w / 2 + .02, y + h, z + d / 2 + .02), 'trim_dark')

    # container yard on the bay deck
    for row in range(3):
        for col in range(5):
            n = 1 + (row * 5 + col) % 3
            for lvl in range(n):
                container(bay_c[0] - 20 + col * 6.6, deck_y + .12 + lvl * 2.6, zf + 2 + row * 3.2, hue=(row + col + lvl) % 4)
    # gantry cranes spanning the deck
    for cx in (-16, 2, 20):
        x = bay_c[0] + cx
        for sz in (zf - 4, zf + 14):
            B.box((x - .5, deck_y, sz - .5), (x + .5, deck_y + 17, sz + .5), 'v_steel')
        B.box((x - .7, deck_y + 16.5, zf - 4.2), (x + .7, deck_y + 17.7, zf + 14.2), 'v_steel')
        for k in range(8):
            z0 = zf - 4 + k * 2.3
            B.beam((x, deck_y + 16.5, z0), (x, deck_y + 17.7, z0 + 1.15), .1, .1, 'trim_dark')
        B.box((x - .5, deck_y + 14, zf + 3), (x + .5, deck_y + 16.5, zf + 5), 'v_hazard')         # trolley
        B.cyl((x, deck_y + 14, zf + 4), (x, deck_y + 8, zf + 4), .05, 'trim_dark', 5)               # hoist cable
        B.box((x - 1, deck_y + 7.4, zf + 3.2), (x + 1, deck_y + 8, zf + 4.8), 'v_steel')           # spreader
        B.box((x - .12, deck_y + 17.7, zf - 4.2), (x + .12, deck_y + 18.1, zf - 3.9), 'lamp_red')
    # ore hoppers and processing frames at the back of the deck
    for hx in (-14, 4, 18):
        x = bay_c[0] + hx
        zb = zf + 19
        B.cyl((x, deck_y + 9, zb), (x, deck_y + 14, zb), 3.4, 'v_steel', 18)
        B.cyl((x, deck_y + 5.5, zb), (x, deck_y + 9, zb), 3.4, 'v_steel', 18, r2=1.0)
        B.cyl((x, deck_y + 4, zb), (x, deck_y + 5.5, zb), 1.0, 'trim_dark', 12)
        for lx, lz in ((-3, -3), (3, -3), (-3, 3), (3, 3)):
            B.box((x + lx - .3, deck_y, zb + lz - .3), (x + lx + .3, deck_y + 9, zb + lz + .3), 'v_steel')
        for k in range(3):
            B.beam((x - 3, deck_y + 2 + k * 2.5, zb - 3), (x + 3, deck_y + 4.5 + k * 2.5, zb - 3), .12, .12, 'trim_dark')
        B.cyl((x, deck_y + 14, zb), (x, deck_y + 14.4, zb), 3.5, 'v_hazard', 18)
        B.box((x - 1.2, deck_y + 14.4, zb - 1.2), (x + 1.2, deck_y + 16, zb + 1.2), 'trim_dark')
    # conveyor / slurry pipes from the hoppers out through the bay mouth to the station
    for k, hx in enumerate((-14, 4, 18)):
        x = bay_c[0] + hx
        B.cyl((x, deck_y + 5, zf + 19), (x, deck_y + 5, zf + 19 + 10), .5, 'v_steel', 10)
        B.cyl((x - 5 + k * 1.2, deck_y + 3 + k, zf - 6), (x, deck_y + 4, zf + 15), .4, 'trim_dark', 8)

    for lx in (-18, -6, 6, 18):
        for lz in (zf + 2, zf + 12):
            B.box((bay_c[0] + lx - .6, deck_y + 12.2, lz - .3), (bay_c[0] + lx + .6, deck_y + 12.5, lz + .3), 'lamp_amber')
            B.lamp((bay_c[0] + lx, deck_y + 11.5, lz), np.array([1.0, .65, .3]), 1.1, 18)
    # floodlight masts around the bay mouth, tiered lamp banks, hazard bands
    def mast(x, z, y0, h):
        import build_floodlight           # the lattice floodlight tower (the Blender candidate of the Blender-vs-Meshy test)
        build_floodlight.build(H=h, B=B, ox=x, oz=z, oy=y0, lamps=False)
        B.lamp((x, y0 + h, z + 2), np.array([.85, .93, 1.0]), 1.4, 46)
    for sx in (-27, 27):
        mast(bay_c[0] + sx, zf - 4.5, deck_y, 19)
        mast(bay_c[0] + sx * .6, zf + 20, deck_y, 15)

    # mooring cables and tethers from the station's rear service spine and communications mast to cleats on the asteroid
    def cable(a, b, r=.28, sag=3.0, n=12, m='trim_dark'):
        a, b = np.array(a, float), np.array(b, float)
        pts = [a + (b - a) * t + np.array([0, -sag * 4 * t * (1 - t), 0]) for t in np.linspace(0, 1, n)]
        for p0, p1 in zip(pts[:-1], pts[1:]):
            B.cyl(p0, p1, r, m, 8, caps=False)
    for i, (sx, sy) in enumerate(((-34, 8), (-6, 12), (26, 9), (58, 7))):
        cl = C + np.array([sx * .6, sy - 6, -R[2] * .62])
        B.box((cl[0] - 1.6, cl[1] - 1.0, cl[2] - 1.6), (cl[0] + 1.6, cl[1] + 1.0, cl[2] + 1.6), 'v_steel')
        B.cyl((cl[0], cl[1], cl[2] - 1.6), (cl[0], cl[1], cl[2] - 3.2), 1.2, 'v_hazard', 12)
        cable((sx, sy, 46.0), (cl[0], cl[1], cl[2] - 3.2), r=.34, sag=2.5)
        cable((sx + 3, sy + 1.5, 46.0), (cl[0] + 2, cl[1] + 1.2, cl[2] - 3.2), r=.22, sag=3.2)
        B.box((sx - 2, sy - 1.5, 45.4), (sx + 2, sy + 1.5, 47.0), 'v_hazard')        # the cleat plate on the station's rear
        B.cyl((sx, sy, 47), (sx, sy, 49.5), .9, 'lamp_amber', 10)
    # a service gantry arm from the asteroid reaching toward the hull, with a walkway and lamps
    arm0 = C + np.array([30, 6, -R[2] * .55])
    B.beam(arm0, (70, 12, 52), 2.6, 3.2, 'v_steel')
    B.beam(arm0 + np.array([0, 3, 0]), (70, 15, 52), .3, .3, 'trim_dark')
    for k in range(10):
        t = k / 9
        p = arm0 + (np.array([70, 12, 52]) - arm0) * t
        B.box((p[0] - .2, p[1] + 1.6, p[2] - .2), (p[0] + .2, p[1] + 4.0, p[2] + .2), 'v_steel')
        if k % 3 == 0:
            B.box((p[0] - .5, p[1] + 4.0, p[2] - .3), (p[0] + .5, p[1] + 4.3, p[2] + .3), 'lamp_amber')
    # drifting belt rock fragments with hazard beacons, scattered clear of the hangar mouths (front, z<-26) and of the approach corridor
    for k in range(26):
        ang = rng.random() * 2 * math.pi
        rr = 95 + rng.random() * 70
        p = np.array([14 + rr * math.cos(ang) * 1.3, -40 + rng.random() * 90, 120 + rr * math.sin(ang) * .9])
        if p[2] < 70 and abs(p[0] - 10) < 140:
            p[2] += 70
        s = 2 + rng.random() * 7
        Gr = np.zeros((9, 14, 3))
        ph = rng.random(3) * 6
        for v in range(9):
            th = math.pi * v / 8
            for u in range(14):
                a = 2 * math.pi * (u % 13) / 13
                d = np.array([math.sin(th) * math.cos(a), math.cos(th), math.sin(th) * math.sin(a)])
                w = 1 + .28 * math.sin(a * 3 + ph[0]) * math.sin(th * 2 + ph[1]) + .12 * math.sin(a * 7 + ph[2])
                Gr[v, u] = p + d * s * np.array([1, .75, 1.1]) * w
        B.grid(Gr, 'b_rock', lambda c, p=p: c - p)
        if k % 5 == 0:
            B.box((p[0] - .3, p[1] + s * .7, p[2] - .3), (p[0] + .3, p[1] + s * .7 + 1.2, p[2] + .3), 'v_hazard')
            B.cyl((p[0], p[1] + s * .7 + 1.2, p[2]), (p[0], p[1] + s * .7 + 1.7, p[2]), .3, 'lamp_red', 8)
    return B


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--textures' in sys.argv or not os.path.isdir(TEXTMP) or not os.path.exists(os.path.join(TEXTMP, 'b_rock_color.jpg')):
        vantor_textures.build(TEXTMP)
    out = args[0] if args else os.path.join(OUTDIR, 'anchorage-belt.glb')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    B = build()
    print('faces', B.write(out, TEXTMP), 'KB', os.path.getsize(out) // 1024)
