"""Vesper road, phase 5: the far end (docs/development/VESPER_ROAD.md).

    /home/user/bpyenv/bin/python tools/assets/vesper/build_vesper_facility.py

Writes void-runner/assets/models/vesper/vesper-facility.glb and the facility's entry in void-runner/vesper-sites-data.js.
The road ends here, in a flat basin backed by a cliff, 9.8 km from the workshop. The owner: "It will end at a tech facility made to look like a warehouse with a
small shared housing unit next to it. Make a guard shack that you get to first. Big warehouse doors on one side."
- The guard shack the road reaches first (enterable: a desk, a chair, dark monitors, a cabinet; no guard), with a barrier whose boom is raised (open: no gate
  logic; a reversible default), then a chain-link compound fence with an open gateway.
- The warehouse: weathered corrugated cladding over a steel frame, three big roller doors on its west side (shut: what is inside was not asked for and is the
  owner's to decide), a personnel door with a keypad box. The tells that it is not a plain warehouse: clean new fittings on old cladding: a lattice antenna mast
  and a dish on the roof, rooftop chillers, sensor domes and cameras on brackets at the corners, louvred vents, a cable tray down to a fenced transformer.
- A small shared housing unit beside it: two storeys of modular units, an outside stair and walkway, doors (shut), windows, air conditioners, a water tank.
- The yard: concrete, two light masts, bollards, a container pair, a parked flatbed trailer.
Frame: the facility's own metres; origin on the road's centre line at the gateway, world (7470, roadY, 2700); the road arrives from the west (-x) along z = 0;
local axes are world axes. Objects f_ext_* outside; f_int_* inside the shack (lit only by its own lamp).
Made by Claude for this project; no third-party assets. Textures generated from seeded noise."""
import math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(REPO, 'tools', 'assets', 'universe'))
sys.path.insert(0, HERE)
import build_vesper as BV  # noqa: E402
from build_vesper import VB, Mat, tinted, drum, crate, OCHRE, OLIVE, GREY, RED, SAND, DARK, WHITE, BLUE  # noqa: E402
import vesper_textures  # noqa: E402
import build_vesper_village as BVV  # noqa: E402
import sites_data  # noqa: E402

OUTDIR = os.path.join(REPO, 'void-runner', 'assets', 'models', 'vesper')
TEXDIR = BV.TEXDIR
ORIGIN = (7470.0, 2700.0)
MATS = BV.MATS + [Mat('v_plank', tex='v_plank', tile=2.0), Mat('v_lamp', emissive=(1.0, .86, .66), strength=4.0), Mat('v_screen', emissive=(.10, .20, .22), strength=.6),
                  Mat('v_led', emissive=(.30, 1.0, .55), strength=2.5), Mat('v_red', emissive=(1.0, .15, .08), strength=2.5), Mat('v_mesh', color=(.30, .31, .32), rough=.6, metal=.6)]
CLAD, STEEL_DK, NEW, CONC = (.52, .50, .46), (.20, .21, .22), (.30, .32, .34), (.58, .56, .52)
FENCE = (-35.0, 62.0, -46.0, 46.0)     # the compound (x0, x1, z0, z1); the gateway is on its west side across the road, z -7..7


class Site(BVV.Village):
    def __init__(self):
        super().__init__()
        self.B = VB(MATS)


def fence_run(S, a, b, axis, c, gaps=()):
    """Chain-link fence along `axis` at c from a to b: posts every 3 m, top and bottom rails, mesh (dark see-through look: thin wires), an outrigger with
    three barbed strands; solid except in the gaps."""
    B = S.B
    s0 = S.mark()
    pts = list(np.arange(a, b + .01, 3.0))
    if pts[-1] < b - .01:
        pts.append(b)
    inside = lambda t: any(g0 <= t <= g1 for g0, g1 in gaps)
    P = (lambda t, y: (t, y, c)) if axis == 'x' else (lambda t, y: (c, y, t))
    for i, t in enumerate(pts):
        if inside(t):
            continue
        tinted(B, GREY)
        x, _, z = P(t, 0)
        B.cyl((x, -.3, z), (x, 2.6, z), .04, 'w_steel', seg=6)
        B.beam(P(t, 2.55), (x + (0 if axis == 'x' else .0), 2.95, z + (.35 if axis == 'x' else 0)) if axis == 'x' else (x + .35, 2.95, z), .03, .03, 'w_steel')
        if i + 1 < len(pts) and not inside(pts[i + 1]) and not any(t < g0 < pts[i + 1] for g0, _ in gaps):
            t2 = pts[i + 1]
            for y in (.05, 2.5):
                B.beam(P(t, y), P(t2, y), .03, .03, 'w_steel')
            # the chain-link mesh: one see-through panel per span (material v_mesh: vesper-sites.js makes it translucent at load), both faces
            tinted(B, WHITE)
            for side in (1, -1):
                n = (0, 0, side) if axis == 'x' else (side, 0, 0)
                B.quad((P(t, .05), P(t2, .05), P(t2, 2.5), P(t, 2.5)), 'v_mesh', n)
            for y in (2.7, 2.82, 2.94):
                o = (y - 2.55) * .9
                if axis == 'x':
                    B.beam((t, y, c + o), (t2, y, c + o), .006, .006, 'w_steel')
                else:
                    B.beam((c + o, y, t), (c + o, y, t2), .006, .006, 'w_steel')
    S.group('f_ext_fence', s0)
    # collision: one box per continuous stretch
    segs, start = [], a
    for g0, g1 in sorted(gaps):
        if g0 > start:
            segs.append((start, g0))
        start = g1
    if start < b:
        segs.append((start, b))
    for k, (p, q) in enumerate(segs):
        if axis == 'x':
            S.solid(f'fence-{axis}{c:.0f}-{k}', p, q, c - .12, c + .12, 2.6)
        else:
            S.solid(f'fence-{axis}{c:.0f}-{k}', c - .12, c + .12, p, q, 2.6)


def guard_shack(S):
    """Outside the gateway, north of the road: 4.2 x 3.6 m, door on its west side, windows to the road, the gate and the west; enterable."""
    B = S.B
    x0, x1, z0, z1, h = -46.0, -41.8, 7.2, 10.8, 2.7
    s0 = S.mark()
    tinted(B, CONC)
    B.box((x0 - .3, -.5, z0 - .3), (x1 + .3, .15, z1 + .3), 'w_concrete')
    tinted(B, (.62, .60, .55))
    S.wall('shack-w', 'z', x0, z0, z1, h, t=.18, holes=[(8.2, 9.2, 2.15, 0)], mat='w_paint', y0=.15)
    S.wall('shack-e', 'z', x1, z0, z1, h, t=.18, holes=[(7.8, 10.2, 2.1, .95)], mat='w_paint', y0=.15)
    S.wall('shack-s', 'x', z0, x0, x1, h, t=.18, holes=[(-45.4, -42.4, 2.1, .95)], mat='w_paint', y0=.15)
    S.wall('shack-n', 'x', z1, x0, x1, h, t=.18, mat='w_paint', y0=.15)
    tinted(B, WHITE)
    for (axis, c, a, b, n) in (('z', x1, 7.8, 10.2, 1), ('x', z0, -45.4, -42.4, -1)):
        for o in (-.01, .01):
            if axis == 'z':
                B.quad(((c + o, 1.1, a), (c + o, 1.1, b), (c + o, 2.25, b), (c + o, 2.25, a)), 'w_glass', (1 if o > 0 else -1, 0, 0))
            else:
                B.quad(((a, 1.1, c + o), (b, 1.1, c + o), (b, 2.25, c + o), (a, 2.25, c + o)), 'w_glass', (0, 0, 1 if o > 0 else -1))
    tinted(B, STEEL_DK)
    B.box((x0 - .5, h + .15, z0 - .5), (x1 + .5, h + .35, z1 + .5), 'w_steel')
    tinted(B, NEW)
    B.box((x0 + .3, h + .35, z1 - 1.3), (x0 + 1.3, h + .9, z1 - .3), 'w_paint')                       # a new air conditioner on the old roof
    B.box((x1 - .2, h - .2, z0 - .35), (x1 + .05, h + .05, z0 - .1), 'w_grime')                        # camera on a bracket, watching the gate
    tinted(B, WHITE)
    B.box((x1 + .05, h - .12, z0 - .3), (x1 + .08, h - .04, z0 - .15), 'w_glass', faces='e')
    tinted(B, DARK)
    B.box((x0 - .5, h + .05, 8.4), (x0 - .1, h + .15, 9.0), 'w_grime')                                 # door lamp
    tinted(B, WHITE)
    B.box((x0 - .45, h + .03, 8.45), (x0 - .15, h + .05, 8.95), 'v_lamp', faces='b')
    S.group('f_ext_shack', s0)
    S.lamps.append({'pos': [x0 - .3, h - .1, 8.7], 'color': '#f1e2c8', 'intensity': 8, 'range': 8, 'inside': None})
    # inside: lining, floor, a desk under the road window with two dark monitors and a keyboard, a chair, a cabinet, a ceiling lamp
    s0 = S.mark()
    li = .1
    tinted(B, (.40, .38, .35))
    B.quad(((x0 + li, .16, z0 + li), (x1 - li, .16, z0 + li), (x1 - li, .16, z1 - li), (x0 + li, .16, z1 - li)), 'w_concrete', (0, 1, 0))
    tinted(B, (.70, .68, .64))
    B.quad(((x0 + li, h + .1, z0 + li), (x1 - li, h + .1, z0 + li), (x1 - li, h + .1, z1 - li), (x0 + li, h + .1, z1 - li)), 'w_paint', (0, -1, 0))
    tinted(B, (.66, .64, .58))
    for (axis, c, a0, a1, holes, n) in (('z', x0 + li, z0 + li, z1 - li, [(8.2, 9.2, 2.15, 0)], (1, 0, 0)), ('z', x1 - li, z0 + li, z1 - li, [(7.8, 10.2, 2.1, .95)], (-1, 0, 0)),
                                        ('x', z0 + li, x0 + li, x1 - li, [(-45.4, -42.4, 2.1, .95)], (0, 0, 1)), ('x', z1 - li, x0 + li, x1 - li, [], (0, 0, -1))):
        a = a0
        for (h0, h1, top, sill) in holes + [(a1, a1, 0, 0)]:
            for (p, q, ya, yb) in ((a, h0, .16, h + .1), (h0, h1, .16 + top, h + .1), (h0, h1, .16, .16 + sill)):
                if q - p < 1e-3 or yb - ya < 1e-3:
                    continue
                if axis == 'z':
                    B.quad(((c, ya, p), (c, ya, q), (c, yb, q), (c, yb, p)), 'w_paint', n)
                else:
                    B.quad(((p, ya, c), (q, ya, c), (q, yb, c), (p, yb, c)), 'w_paint', n)
            a = h1
    tinted(B, (.30, .32, .33))
    B.box((-45.6, .16, z0 + .2), (-42.2, .78, z0 + .9), 'w_paint')
    B.box((-45.7, .78, z0 + .15), (-42.1, .83, z0 + .95), 'w_grime')
    S.solid('shack-desk', -45.7, -42.1, z0 + .1, z0 + 1.0, .85)
    for mx in (-44.6, -43.2):
        tinted(B, DARK)
        B.box((mx - .3, .83, z0 + .55), (mx + .3, 1.25, z0 + .6), 'w_grime')
        tinted(B, WHITE)
        B.quad(((mx - .27, .86, z0 + .53), (mx + .27, .86, z0 + .53), (mx + .27, 1.22, z0 + .53), (mx - .27, 1.22, z0 + .53)), 'v_screen', (0, 0, -1))
    tinted(B, DARK)
    B.box((-44.3, .83, z0 + .25), (-43.5, .85, z0 + .45), 'w_grime')
    cx, cz = -43.9, z0 + 1.7
    B.cyl((cx, .16, cz), (cx, .48, cz), .04, 'w_steel', seg=6)
    tinted(B, (.18, .19, .20))
    B.box((cx - .25, .48, cz - .25), (cx + .25, .56, cz + .25), 'w_tarp')
    B.box((cx - .25, .56, cz + .2), (cx + .25, 1.1, cz + .27), 'w_tarp')
    tinted(B, (.45, .48, .46))
    B.box((x1 - .65, .16, z1 - 1.3), (x1 - .15, 1.9, z1 - .15), 'w_paint')
    S.solid('shack-cabinet', x1 - .7, x1 - .1, z1 - 1.35, z1 - .1, 1.9)
    tinted(B, DARK)
    B.box((-44.3, h - .02, 8.7), (-43.5, h + .08, 9.3), 'w_steel')
    tinted(B, WHITE)
    B.box((-44.25, h - .04, 8.75), (-43.55, h - .02, 9.25), 'v_lamp', faces='b')
    S.group('f_int_shack', s0)
    S.lamps.append({'pos': [-43.9, h - .25, 9.0], 'color': '#f4e6cf', 'intensity': 22, 'range': 8, 'inside': 'shack'})
    S.places.append({'id': 'vesper-guard-shack', 'name': 'The guard shack', 'rect': [x0, x1, z0, z1], 'approach': [-48.5, 8.7], 'yaw': math.pi / 2, 'where': 'The guard shack the road reaches first, outside the facility\'s gateway (enterable; nobody on duty).', 'inside': [-43.9, 9.6]})
    # the barrier: a pivot post on the road's north edge and the boom raised (open)
    s0 = S.mark()
    bx, bz = -40.0, 4.9
    tinted(B, DARK)
    B.box((bx - .2, -.3, bz - .2), (bx + .2, 1.1, bz + .2), 'w_steel')
    B.box((bx - .28, 1.1, bz - .32), (bx + .28, 1.45, bz + .28), 'w_paint')
    ang, L = math.radians(80), 8.0
    tinted(B, (.90, .88, .84))
    B.beam((bx, 1.3, bz), (bx, 1.3 + math.sin(ang) * L, bz - math.cos(ang) * L), .12, .12, 'w_paint', up=(1, 0, 0))
    tinted(B, RED)
    for k in range(1, 8, 2):
        t0, t1 = k / 8, (k + .55) / 8
        B.beam((bx, 1.3 + math.sin(ang) * L * t0, bz - math.cos(ang) * L * t0), (bx, 1.3 + math.sin(ang) * L * t1, bz - math.cos(ang) * L * t1), .13, .13, 'w_paint', up=(1, 0, 0))
    tinted(B, DARK)
    B.box((bx - .1, -.3, -5.0), (bx + .1, 1.0, -4.8), 'w_steel')
    tinted(B, WHITE)
    B.box((bx + .2, 1.3, bz - .1), (bx + .23, 1.42, bz + .1), 'v_red')
    S.group('f_ext_barrier', s0)
    S.solid('barrier-post', bx - .25, bx + .25, bz - .25, bz + .25, 1.4)
    S.solid('barrier-rest', bx - .15, bx + .15, -5.05, -4.75, 1.0)


def warehouse(S):
    """x 18..46, z -32..16 (28 x 48 m), eaves 10 m: big roller doors on the west side facing the yard, a personnel door; tech on the roof and walls."""
    B = S.B
    x0, x1, z0, z1, h = 18.0, 46.0, -32.0, 16.0, 10.0
    s0 = S.mark()
    tinted(B, CONC)
    B.box((x0 - .4, -.6, z0 - .4), (x1 + .4, .2, z1 + .4), 'w_concrete')
    tinted(B, CLAD)
    doors = [(-26.0, -19.0), (-14.0, -7.0), (-2.0, 5.0)]
    for (a, b) in doors:
        pass
    S.wall('wh-w', 'z', x0, z0, z1, h, t=.3, holes=[(a, b, 6.6, 0) for (a, b) in doors] + [(11.0, 12.2, 2.3, 0)], mat='w_corr', y0=.2)
    S.wall('wh-e', 'z', x1, z0, z1, h, t=.3, mat='w_corr', y0=.2)
    S.wall('wh-s', 'x', z0, x0, x1, h, t=.3, mat='w_corr', y0=.2)
    S.wall('wh-n', 'x', z1, x0, x1, h, t=.3, mat='w_corr', y0=.2)
    # the big doors: roller shutters (shut) in steel frames, a hood over each, bollards, a lamp
    for (a, b) in doors:
        tinted(B, (.42, .44, .45))
        for k in range(22):
            y = .2 + k * .3
            B.box((x0 - .1, y, a), (x0 + .0, y + .27, b), 'w_steel', faces='w')
        tinted(B, STEEL_DK)
        for z in (a - .25, b):
            B.box((x0 - .35, .2, z), (x0 + .15, 7.0, z + .25), 'w_steel')
        B.box((x0 - .9, 6.8, a - .3), (x0 + .15, 7.6, b + .3), 'w_steel')
        tinted(B, (.85, .70, .20))
        for z in (a - .7, b + .7):
            B.cyl((x0 - 1.2, -.2, z), (x0 - 1.2, 1.1, z), .14, 'w_paint', seg=10)
            S.solid(f'wh-bollard-{z:.0f}', x0 - 1.35, x0 - 1.05, z - .15, z + .15, 1.1)
        tinted(B, WHITE)
        B.box((x0 - .9, 7.58, (a + b) / 2 - .4), (x0 - .4, 7.6, (a + b) / 2 + .4), 'v_lamp', faces='b')
        S.lamps.append({'pos': [x0 - 1.2, 7.3, (a + b) / 2], 'color': '#e9eef0', 'intensity': 26, 'range': 16, 'inside': None})
        S.solid(f'wh-door-{a:.0f}', x0 - .2, x0 + .2, a, b, 7)
    # the personnel door (shut) with a canopy and a keypad box (blank)
    tinted(B, STEEL_DK)
    B.box((x0 - .06, .2, 11.0), (x0, 2.5, 12.2), 'w_paint', faces='w')
    B.box((x0 - 1.4, 2.7, 10.6), (x0, 2.85, 12.6), 'w_steel')
    tinted(B, (.16, .17, .18))
    B.box((x0 - .12, 1.2, 12.4), (x0 - .02, 1.55, 12.65), 'w_grime')
    tinted(B, WHITE)
    B.box((x0 - .13, 1.48, 12.47), (x0 - .12, 1.51, 12.52), 'v_led', faces='w')
    S.solid('wh-personnel-door', x0 - .2, x0 + .2, 11.0, 12.2, 2.4)
    # roof: low gable along z, ridge vent, then the new kit: chillers, a lattice mast with a dish and whips, sensor domes, cable trays
    tinted(B, (.48, .47, .44))
    BVV.gable_roof(S, x0, x1, z0, z1, h + .2, 1.6, 'w_corr', ridge='z', over=.4)
    S.group('f_ext_warehouse', s0)
    s0 = S.mark()
    rx = (x0 + x1) / 2
    tinted(B, NEW)
    for k, z in enumerate((-26.0, -21.0, -16.0, -11.0)):
        cx = x1 - 4.0
        y = h + .2 + 1.6 * (1 - abs(cx - rx) / ((x1 - x0) / 2)) - .1
        B.box((cx - 1.4, y, z - 1.8), (cx + 1.4, y + 1.8, z + 1.8), 'w_paint')
        tinted(B, STEEL_DK)
        for fz in (z - .9, z + .9):
            B.cyl((cx, y + 1.8, fz), (cx, y + 1.86, fz), .7, 'w_grime', seg=16)
        tinted(B, NEW)
    mx, mz = rx + 4.0, 6.0
    my = h + .2 + 1.6 * (1 - abs(mx - rx) / ((x1 - x0) / 2))
    tinted(B, (.70, .72, .72))
    for (dx, dz) in ((-.5, -.5), (.5, -.5), (-.5, .5), (.5, .5)):
        B.beam((mx + dx, my - .2, mz + dz), (mx + dx * .25, my + 13.0, mz + dz * .25), .06, .06, 'w_steel')
    for y in np.arange(my + .8, my + 13.0, 1.6):
        f = 1 - (y - my) / 13.0 * .75
        for (a, b) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
            B.beam((mx + a[0] * .5 * f, y, mz + a[1] * .5 * f), (mx + b[0] * .5 * f, y + .8, mz + b[1] * .5 * f), .025, .025, 'w_steel')
    B.cyl((mx, my + 13.0, mz), (mx, my + 17.0, mz), .03, 'w_steel', seg=6)
    for y, a in ((my + 10.0, 0.0), (my + 11.5, 2.1), (my + 9.0, 4.2)):
        B.box((mx + math.cos(a) * .6 - .08, y, mz + math.sin(a) * .6 - .25), (mx + math.cos(a) * .6 + .08, y + 1.2, mz + math.sin(a) * .6 + .25), 'w_paint')
    tinted(B, WHITE)
    B.box((mx - .06, my + 17.0, mz - .06), (mx + .06, my + 17.12, mz + .06), 'v_red')
    S.lamps.append({'pos': [mx, my + 17.3, mz], 'color': '#ff3a20', 'intensity': 3, 'range': 6, 'inside': None})
    tinted(B, (.82, .83, .82))
    dx, dz = rx - 5.0, -2.0
    dy = h + .2 + 1.6 * (1 - abs(dx - rx) / ((x1 - x0) / 2))
    B.box((dx - .3, dy - .1, dz - .3), (dx + .3, dy + 1.0, dz + .3), 'w_steel')
    B.cyl((dx - .2, dy + 1.6, dz), (dx + .5, dy + 1.2, dz), 1.3, 'w_paint', seg=18, r2=.15)
    for (sx, sz) in ((x0 + .5, z0 + .5), (x0 + .5, z1 - .5), (x1 - .5, z0 + .5), (x1 - .5, z1 - .5)):
        tinted(B, (.88, .88, .86))
        B.cyl((sx, h + .2, sz), (sx, h + .5, sz), .07, 'w_steel', seg=8)
        B.cyl((sx, h + .5, sz), (sx, h + .75, sz), .22, 'w_paint', seg=12, r2=.05)
        tinted(B, STEEL_DK)
        ox = -1 if sx < rx else 1
        oz = -1 if sz < 0 else 1
        B.box((sx + ox * .2, h - 1.2, sz + oz * .2), (sx + ox * .65, h - .95, sz + oz * .45), 'w_grime')
        tinted(B, WHITE)
        B.box((sx + ox * .66, h - 1.16, sz + oz * .25), (sx + ox * .68, h - 1.0, sz + oz * .4), 'v_led')
    # high louvred vents along the walls (new) and a cable tray down the south wall to the transformer
    tinted(B, NEW)
    for z in np.arange(z0 + 4, z1 - 3, 8.0):
        BV.louvres(B, x1 + .16, x1 + .18, 7.6, 8.8, z) if False else None
        B.box((x1 + .15, 7.6, z - 1.0), (x1 + .4, 8.8, z + 1.0), 'w_paint')
        tinted(B, STEEL_DK)
        for y in np.arange(7.7, 8.8, .15):
            B.box((x1 + .4, y, z - .95), (x1 + .45, y + .05, z + .95), 'w_steel')
        tinted(B, NEW)
    tinted(B, STEEL_DK)
    B.box((26.0, 1.0, z0 - .55), (26.6, 9.8, z0 - .3), 'w_steel')
    B.box((26.0, .3, z0 - 4.0), (26.6, 1.0, z0 - .3), 'w_steel')
    tinted(B, (.50, .54, .50))
    B.box((24.0, -.2, z0 - 7.5), (29.0, 2.4, z0 - 4.0), 'w_paint')
    tinted(B, STEEL_DK)
    for k in range(9):
        B.box((24.2 + k * .55, .3, z0 - 7.7), (24.4 + k * .55, 2.1, z0 - 7.5), 'w_steel')
    tinted(B, WHITE)
    B.box((28.0, 1.8, z0 - 3.99), (28.6, 2.0, z0 - 3.95), 'v_led')
    S.solid('transformer', 24.0, 29.0, z0 - 7.7, z0 - 4.0, 2.4)
    fence_run(S, 22.5, 30.5, 'x', z0 - 9.0)
    fence_run(S, z0 - 9.0, z0 - 1.0, 'z', 22.5)
    S.group('f_ext_tech', s0)
    S.places.append({'id': 'vesper-warehouse', 'name': 'The warehouse', 'rect': [x0 - 6.0, x1, z0, z1], 'approach': [x0 - 8.0, -10.5], 'yaw': math.pi / 2, 'where': 'In front of the warehouse\'s big doors (shut; the inside is the owner\'s to decide).', 'inside': [x0 - 4.0, -10.5]})


def housing(S):
    """A small shared housing unit north of the warehouse: two storeys of modular units (x 20..38, z 24..31), an outside stair at the east end and a walkway
    with a railing along the south side of the upper storey; doors shut."""
    B = S.B
    x0, x1, z0, z1 = 20.0, 38.0, 24.0, 31.0
    s0 = S.mark()
    tinted(B, CONC)
    B.box((x0 - .5, -.6, z0 - 2.5), (x1 + 3.5, .2, z1 + .5), 'w_concrete')
    for lvl in range(2):
        y = .2 + lvl * 3.0
        for k in range(3):
            ux0, ux1 = x0 + k * 6.0, x0 + (k + 1) * 6.0
            tinted(B, [(.55, .58, .56), (.62, .60, .54), (.50, .53, .56)][(k + lvl) % 3])
            B.box((ux0 + .05, y, z0), (ux1 - .05, y + 2.9, z1), 'w_corr')
            tinted(B, STEEL_DK)
            B.box((ux0 + .9, y, z0 - .05), (ux0 + 1.9, y + 2.2, z0), 'w_paint', faces='s')
            B.box((ux0 + 1.7, y + 1.0, z0 - .09), (ux0 + 1.78, y + 1.1, z0 - .05), 'w_steel')
            BVV.window(S, 'x', z0, ux0 + 3.0, ux0 + 5.0, y + 1.0, y + 2.1, -1)
            BVV.window(S, 'x', z1, ux0 + 2.0, ux0 + 4.0, y + 1.1, y + 2.0, 1)
            tinted(B, NEW)
            B.box((ux0 + 4.2, y + 2.3, z1 + .1), (ux0 + 5.2, y + 2.85, z1 + .55), 'w_paint')            # air conditioner (new)
    tinted(B, STEEL_DK)
    B.box((x0 - .3, 6.2, z0 - .3), (x1 + .3, 6.4, z1 + .3), 'w_steel')
    # walkway and railing along the upper storey's south side, and the stair at the east end
    tinted(B, (.40, .42, .42))
    B.box((x0, 3.05, z0 - 1.4), (x1 + 3.0, 3.2, z0), 'w_steel')
    for x in np.arange(x0, x1 + 3.01, 2.0):
        B.box((x - .03, 3.2, z0 - 1.43), (x + .03, 4.25, z0 - 1.37), 'w_steel')
        B.box((x - .05, .2, z0 - 1.45), (x + .05, 3.05, z0 - 1.35), 'w_steel')
    B.box((x0, 4.2, z0 - 1.45), (x1 + 3.0, 4.26, z0 - 1.35), 'w_steel')
    B.box((x0, 3.7, z0 - 1.44), (x1 + 3.0, 3.74, z0 - 1.36), 'w_steel')
    for k in range(15):
        y = .2 + k * .2
        z = z1 - .25 - k * .27
        B.box((x1 + 1.0, y, z - .27), (x1 + 2.6, y + .05, z), 'w_steel')
    B.beam((x1 + 1.0, .2, z1 - .2), (x1 + 1.0, 3.2, z0 - 1.4 + .3), .06, .12, 'w_steel')
    B.beam((x1 + 2.6, .2, z1 - .2), (x1 + 2.6, 3.2, z0 - 1.4 + .3), .06, .12, 'w_steel')
    # rooftop water tank and a small dish
    tinted(B, (.62, .62, .60))
    B.cyl((x0 + 2.0, 6.4, z0 + 3.5), (x0 + 2.0, 7.8, z0 + 3.5), 1.0, 'w_paint', seg=14)
    tinted(B, (.85, .85, .84))
    B.cyl((x1 - 2.0, 6.9, z0 + 3.0), (x1 - 1.6, 6.6, z0 + 3.0), .6, 'w_paint', seg=14, r2=.08)
    S.group('f_ext_housing', s0)
    S.solid('housing', x0, x1, z0, z1, 6.3)
    S.solid('housing-stair', x1 + .9, x1 + 2.7, z0 - 1.5, z1, 3.2)
    for x in np.arange(x0, x1 + 3.01, 2.0):
        S.solid(f'housing-post-{x:.0f}', x - .1, x + .1, z0 - 1.5, z0 - 1.3, 3.0)
    S.lamps.append({'pos': [x0 + 9.0, 2.9, z0 - .7], 'color': '#f4e6cf', 'intensity': 10, 'range': 10, 'inside': None})
    S.places.append({'id': 'vesper-housing', 'name': 'The housing unit', 'rect': [x0 - 1.0, x1 + 3.5, z0 - 3.0, z1 + 1.0], 'approach': [29.0, 20.0], 'yaw': 0.0, 'where': 'The small shared housing unit beside the warehouse (doors shut).', 'inside': [29.0, 22.0]})


def yard(S):
    B = S.B
    s0 = S.mark()
    # light masts
    for (x, z) in ((2.0, -30.0), (2.0, 30.0)):
        tinted(B, STEEL_DK)
        B.cyl((x, -.3, z), (x, 12.0, z), .16, 'w_steel', seg=10)
        B.box((x - .7, 11.8, z - .3), (x + .7, 12.3, z + .3), 'w_grime')
        tinted(B, WHITE)
        B.box((x - .6, 11.78, z - .25), (x + .6, 11.8, z + .25), 'v_lamp', faces='b')
        S.lamps.append({'pos': [x, 11.5, z], 'color': '#e9eef0', 'intensity': 60, 'range': 34, 'inside': None})
        S.solid(f'mast-{z:.0f}', x - .25, x + .25, z - .25, z + .25, 12)
    # a pair of containers and a parked flatbed trailer
    for (x0, z0, t) in ((-24.0, -40.0, (.48, .30, .20)), (-24.0, -37.4, (.30, .38, .40))):
        tinted(B, t)
        B.box((x0, -.2, z0), (x0 + 12.2, 2.4, z0 + 2.4), 'w_corr')
        S.solid(f'container-{z0:.0f}', x0, x0 + 12.2, z0, z0 + 2.4, 2.6)
    tinted(B, (.35, .36, .37))
    B.box((-14.0, .9, 30.0), (-2.0, 1.2, 32.5), 'w_steel')
    tinted(B, DARK)
    for x in (-12.5, -11.3, -4.2, -3.0):
        for z in (30.1, 32.4):
            B.cyl((x, .5, z), (x, .5, z + (.25 if z < 31 else -.25)), .45, 'w_rubber', seg=12)
    S.solid('trailer', -14.0, -2.0, 30.0, 32.5, 1.3)
    BVV.barrel_group(S, -28.0, 38.0, 4, 21)
    S.group('f_ext_yard', s0)
    fence_run(S, FENCE[0], FENCE[1], 'x', FENCE[2])
    fence_run(S, FENCE[0], FENCE[1], 'x', FENCE[3])
    fence_run(S, FENCE[2], FENCE[3], 'z', FENCE[0], gaps=[(-7.0, 7.0)])
    fence_run(S, FENCE[2], FENCE[3], 'z', FENCE[1])
    S.places.append({'id': 'vesper-facility', 'name': 'The facility', 'rect': [FENCE[0], FENCE[1], FENCE[2], FENCE[3]], 'approach': [-28.0, 0.0], 'yaw': math.pi / 2, 'where': 'The fenced compound at the road\'s end: the warehouse, the housing unit and the yard.', 'inside': [0.0, 0.0]})


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    os.makedirs(TEXDIR, exist_ok=True)
    vesper_textures.build(TEXDIR)
    BV.corr_texture(TEXDIR)
    BVV.plank_texture(TEXDIR)
    S = Site()
    guard_shack(S)
    warehouse(S)
    housing(S)
    yard(S)
    n = S.B.write_objects(os.path.join(OUTDIR, 'vesper-facility.glb'), S.groups)
    print('vesper-facility.glb faces', n, list(S.groups))
    zone = {'id': 'facility', 'origin': list(ORIGIN), 'area': [-52.0, 64.0, -48.0, 48.0], 'pad': [-50.0, 64.0, -48.0, 48.0], 'padMode': 'flat', 'padBlend': 14,
            'model': 'assets/models/vesper/vesper-facility.glb'}
    sites_data.update('facility', {'zone': zone, 'solids': S.solids, 'lamps': S.lamps, 'places': S.places})
    print('solids', len(S.solids), 'lamps', len(S.lamps))


if __name__ == '__main__':
    main()
