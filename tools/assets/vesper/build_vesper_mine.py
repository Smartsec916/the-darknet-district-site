"""Vesper road, phase 4: the mine (docs/development/VESPER_ROAD.md).

    /home/user/bpyenv/bin/python tools/assets/vesper/build_vesper_mine.py

Writes into void-runner/assets/models/vesper/:
  vesper-mine.glb        the portal and its yard (headwall, wing walls and apron in a cut in the mountainside, steel portal sets, a timber headframe over a
                         capped raise, a hoist house, ore carts on rails, a tipple and spoil heaps, a timber stack, lamp poles) and, inside the mountain, the adit
                         level: the adit (its first bend hides the daylight), the drift to the shaft, the collar chamber with the winder and the cage (object v_cage)
  vesper-mine-deep.glb   the bottom level (shaft station and a drift ending at the working face), placed at the bottom of the shaft, and one 10 m section of
                         the shaft (object m_int_shaft: rock walls, guides, a lamp) that vesper-sites.js stacks as many times as the depth needs
and the mine's entry in void-runner/vesper-sites-data.js (walking floors per level, collision, lamps, places, the cut and the terrain hole).
DEPTH: the shaft's depth is NOT in this file: it is one constant in vesper-sites.js (MINE_DEPTH_M, a placeholder) and its levels are data there, so the owner can
deepen it without a rebuild (the shaft is stacked from 10 m sections; the bottom level is placed at the depth).
Frame: the mine's own metres; origin on the portal's floor at the middle of its mouth, world (3504, roadY, 704); the adit runs north (+z) into the mountain;
local axes are world axes. Objects m_ext_* are outside (sun and sky); m_int_* are inside (lit only by their own lamps).
Made by Claude for this project; no third-party assets. Textures generated from seeded noise (vesper_textures.py, rock below)."""
import math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(REPO, 'tools', 'assets', 'universe'))
sys.path.insert(0, HERE)
import build_vesper as BV  # noqa: E402
from build_vesper import VB, Mat, tinted, drum, crate, OCHRE, OLIVE, GREY, RED, SAND, DARK, WHITE, BLUE  # noqa: E402
import vesper_textures  # noqa: E402
import build_vesper_village as BVV  # noqa: E402  (plank texture, Village helpers)
import sites_data  # noqa: E402

OUTDIR = os.path.join(REPO, 'void-runner', 'assets', 'models', 'vesper')
TEXDIR = BV.TEXDIR
ORIGIN = (3504.0, 704.0)
MATS = BV.MATS + [Mat('v_plank', tex='v_plank', tile=2.0), Mat('v_rock', tex='v_rock', tile=4.0), Mat('v_lamp', emissive=(1.0, .80, .52), strength=4.0)]
WOOD, DWOOD, RUST, ROCK = (.62, .48, .34), (.40, .30, .22), (.55, .33, .20), (1.0, 1.0, 1.0)
H_ADIT = 3.8          # the adit's clear height
CAGE = (29.0, 34.0)   # the cage's centre (local x, z): the shaft is 3 x 3 m around it


def rock_texture(d, n=512):
    """Blasted rock: layered grey-brown with fractures, drill-hole half barrels and mineral staining."""
    from vesper_textures import _normal, _orm, _spectral, _step, _jpg
    gy, gx = np.mgrid[0:n, 0:n]
    a = _spectral(n, 301, 2.0)
    b = _spectral(n, 302, 2.6, lo=3)
    frac = _step(.48, .5, _spectral(n, 303, 1.6, ax=1.0, ay=.4, lo=4)) * (1 - _step(.5, .52, _spectral(n, 303, 1.6, ax=1.0, ay=.4, lo=4)))
    stain = _step(.6, .9, _spectral(n, 304, 2.2, lo=2))
    drill = ((gx % (n // 6)) < 3).astype(float) * _step(.3, .7, _spectral(n, 305, 1.4, ax=.1, ay=1.0, lo=2))
    h = .6 * a + .3 * b - .6 * frac - .3 * drill
    col = np.array([.52, .49, .45])[None, None, :] * (.65 + .5 * a[..., None]) * (.9 + .15 * b[..., None])
    col = col * (1 - .6 * frac[..., None]) * (1 - .25 * drill[..., None])
    col = col * (1 - .3 * stain[..., None]) + stain[..., None] * np.array([.50, .34, .20]) * .3
    _jpg(os.path.join(d, 'v_rock_color.jpg'), col * 255)
    _jpg(os.path.join(d, 'v_rock_normal.jpg'), _normal(h, 7.0), 90)
    _jpg(os.path.join(d, 'v_rock_orm.jpg'), _orm(.7 + .3 * a - .4 * frac, (.85 + .1 * b).clip(0, 1), 0 * h), 90)


class Mine(BVV.Village):
    def __init__(self):
        super().__init__()
        self.B = VB(MATS)
        self.floors = []          # {level, rect, y}
        self.interactions = []


def noise(x, y, z, seed=0):
    return (math.sin(x * 1.7 + seed) * math.sin(z * 1.3 - y * .7) + math.sin(x * .53 + z * .71 + y * 1.9 + seed * 3)) * .5


def rock_room(M, rects, y0, h, grp, step=1.0, rough=.22, seed=0):
    """Rough rock walls, floor and ceiling over a union of axis-aligned rects (local x0,x1,z0,z1): each rect side gets a wall only where no other rect
    continues it, so junctions are open. Faces point inward. Also registers the rects as walking floors."""
    B = M.B
    s0 = M.mark()
    tinted(B, ROCK)

    def covered(px, pz):
        return any(r[0] - 1e-6 <= px <= r[1] + 1e-6 and r[2] - 1e-6 <= pz <= r[3] + 1e-6 for r in rects)

    for (x0, x1, z0, z1) in rects:
        # floor (packed muck) and ceiling (rock)
        tinted(B, (.55, .50, .45))
        B.quad(((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)), 'v_rock', (0, 1, 0))
        tinted(B, (.75, .72, .68))
        nz = max(1, int((z1 - z0) / 2)); nx = max(1, int((x1 - x0) / 2))
        cx0, cx1, cz0, cz1 = x0 - .6, x1 + .6, z0 - .6, z1 + .6          # the ceiling overlaps the walls' tops: no seam of daylight
        for i in range(nx):
            for j in range(nz):
                xa, xb, za, zb = cx0 + (cx1 - cx0) * i / nx, cx0 + (cx1 - cx0) * (i + 1) / nx, cz0 + (cz1 - cz0) * j / nz, cz0 + (cz1 - cz0) * (j + 1) / nz
                yy = lambda x, z: y0 + h + .25 + rough * noise(x, 0, z, seed)
                B.quad(((xa, yy(xa, za), za), (xa, yy(xa, zb), zb), (xb, yy(xb, zb), zb), (xb, yy(xb, za), za)), 'v_rock', (0, -1, 0), smooth=True)
        # walls: sample each side; build a wall cell where just outside is not covered
        tinted(B, ROCK)
        for side in ('w', 'e', 's', 'n'):
            if side in 'we':
                x = x0 if side == 'w' else x1
                out = -.05 if side == 'w' else .05
                L, a0 = z1 - z0, z0
            else:
                z = z0 if side == 's' else z1
                out = -.05 if side == 's' else .05
                L, a0 = x1 - x0, x0
            n = max(1, int(round(L / step)))
            for k in range(n):
                a, b = a0 + L * k / n, a0 + L * (k + 1) / n
                m = (a + b) / 2
                if side in 'we':
                    if covered(x + out, m):
                        continue
                    rows = 4
                    for r in range(rows):
                        ya, yb = y0 + (h + .8) * r / rows, y0 + (h + .8) * (r + 1) / rows
                        d = lambda zz, yy: x - out * 4 * rough * (1 + noise(x, yy, zz, seed))
                        B.quad(((d(a, ya), ya, a), (d(b, ya), ya, b), (d(b, yb), yb, b), (d(a, yb), yb, a)), 'v_rock', (-out, 0, 0), smooth=True)
                else:
                    if covered(m, z + out):
                        continue
                    rows = 4
                    for r in range(rows):
                        ya, yb = y0 + (h + .8) * r / rows, y0 + (h + .8) * (r + 1) / rows
                        d = lambda xx, yy: z - out * 4 * rough * (1 + noise(xx, yy, z, seed))
                        B.quad(((a, ya, d(a, ya)), (b, ya, d(b, ya)), (b, yb, d(b, yb)), (a, yb, d(a, yb))), 'v_rock', (0, 0, -out), smooth=True)
    M.group(grp, s0)


def timber_sets(M, axis, c, a0, a1, y0, half, h, every=1.6, grp='m_int_adit'):
    """Timber sets (two posts and a cap) across a drift running along `axis` ('z' or 'x') at cross position c."""
    B = M.B
    s0 = M.mark()
    tinted(B, DWOOD)
    a = a0 + .4
    while a < a1 - .2:
        if axis == 'z':
            for sx in (-1, 1):
                B.box((c + sx * half - .12 - (.0 if sx < 0 else .0), y0, a - .12), (c + sx * half + .12, y0 + h, a + .12), 'v_plank')
            B.box((c - half - .15, y0 + h - .05, a - .14), (c + half + .15, y0 + h + .22, a + .14), 'v_plank')
        else:
            for sz in (-1, 1):
                B.box((a - .12, y0, c + sz * half - .12), (a + .12, y0 + h, c + sz * half + .12), 'v_plank')
            B.box((a - .14, y0 + h - .05, c - half - .15), (a + .14, y0 + h + .22, c + half + .15), 'v_plank')
        a += every
    M.group(grp, s0)


def rails(M, axis, c, a0, a1, y0, grp):
    B = M.B
    s0 = M.mark()
    tinted(B, DWOOD)
    a = a0 + .3
    while a < a1:
        if axis == 'z':
            B.box((c - .55, y0, a - .1), (c + .55, y0 + .08, a + .1), 'v_plank')
        else:
            B.box((a - .1, y0, c - .55), (a + .1, y0 + .08, c + .55), 'v_plank')
        a += .7
    tinted(B, GREY)
    for o in (-.3, .3):
        if axis == 'z':
            B.box((c + o - .03, y0 + .08, a0), (c + o + .03, y0 + .17, a1), 'w_steel')
        else:
            B.box((a0, y0 + .08, c + o - .03), (a1, y0 + .17, c + o + .03), 'w_steel')
    M.group(grp, s0)


def lamp(M, x, y, z, grp, inside, intensity=12, rng=10):
    B = M.B
    s0 = M.mark()
    tinted(B, DARK)
    B.box((x - .12, y - .02, z - .12), (x + .12, y + .08, z + .12), 'w_grime')
    tinted(B, WHITE)
    B.cyl((x, y - .02, z), (x, y - .2, z), .06, 'v_lamp', seg=8)
    tinted(B, DARK)
    for (dx, dz) in ((-.08, 0), (.08, 0), (0, -.08), (0, .08)):
        B.box((x + dx - .006, y - .24, z + dz - .006), (x + dx + .006, y - .02, z + dz + .006), 'w_steel')
    M.group(grp, s0)
    M.lamps.append({'pos': [x, y - .25, z], 'color': '#ffc98a', 'intensity': intensity, 'range': rng, 'inside': inside})


def cart(M, x, z, axis, grp, load=True, y0=0.0):
    B = M.B
    s0 = M.mark()
    tinted(B, RUST)
    if axis == 'z':
        B.box((x - .5, y0 + .45, z - .8), (x + .5, y0 + 1.25, z + .8), 'w_paint')
    else:
        B.box((x - .8, y0 + .45, z - .5), (x + .8, y0 + 1.25, z + .5), 'w_paint')
    if load:
        tinted(B, (.45, .42, .40))
        B.box((x - .42, y0 + 1.1, z - .42), (x + .42, y0 + 1.4, z + .42), 'v_rock')
    tinted(B, DARK)
    for (dx, dz) in ((-.32, -.5), (.32, -.5), (-.32, .5), (.32, .5)):
        ddx, ddz = (dx, dz) if axis == 'z' else (dz, dx)
        if axis == 'z':
            B.cyl((x + ddx - .05, y0 + .2, z + ddz), (x + ddx + .05, y0 + .2, z + ddz), .17, 'w_steel', seg=10)
        else:
            B.cyl((x + ddx, y0 + .2, z + ddz - .05), (x + ddx, y0 + .2, z + ddz + .05), .17, 'w_steel', seg=10)
    M.group(grp, s0)
    M.solid(f'cart-{len(M.solids)}', x - (.55 if axis == 'z' else .85), x + (.55 if axis == 'z' else .85), z - (.85 if axis == 'z' else .55), z + (.85 if axis == 'z' else .55), 1.3)


# ------------------------------------------------------------------ outside ------------------------------------------------------------------
def portal(M):
    """The cut in the mountainside (x -8..8, z -8..0): apron slab, concrete headwall with the steel-set mouth, wing walls; then the yard to the south."""
    B = M.B
    s0 = M.mark()
    tinted(B, (.58, .55, .50))
    B.box((-8.0, -.4, -8.0), (8.0, -.03, 0.0), 'w_concrete')                                  # apron, top level with the yard's ground
    # headwall at z 0 (the mountain's terrain is 9 m above the floor from z 0 on): a slab with the mouth cut in it
    tinted(B, (.60, .57, .52))
    M.wall('portal-head', 'x', .3, -8.0, 8.0, 9.6, t=.6, holes=[(-2.1, 2.1, H_ADIT + .2, 0)], mat='w_concrete', y0=-.4)
    for sx in (-1, 1):
        # wing walls along the cut, stepping down to the yard
        x = sx * 8.3
        for k in range(4):
            za, zb, top = -8.0 + k * 2.0, -6.0 + k * 2.0, 2.0 + k * 2.4
            B.box((x - .3, -.4, za), (x + .3, top, zb), 'w_concrete')
        M.solid(f'portal-wing-{sx}', x - .35, x + .35, -8.0, 0.0, 3)
    # steel portal sets in the mouth and a timber lagging face
    tinted(B, DARK)
    for z in (-.4, .9):
        for sx in (-1, 1):
            B.box((sx * 2.1 - .1, 0, z - .1), (sx * 2.1 + .1, H_ADIT, z + .1), 'w_steel')
        B.box((-2.3, H_ADIT, z - .12), (2.3, H_ADIT + .3, z + .12), 'w_steel')
    # a lamp over the mouth (its lens is the light's source), and the rails running out onto the yard to the tipple
    tinted(B, DARK)
    B.box((-.3, H_ADIT + .5, -.15), (.3, H_ADIT + .75, .05), 'w_grime')
    tinted(B, WHITE)
    B.box((-.25, H_ADIT + .48, -.32), (.25, H_ADIT + .5, .02), 'v_lamp', faces='b')
    M.lamps.append({'pos': [0, H_ADIT + .3, -1.0], 'color': '#ffb466', 'intensity': 14, 'range': 12, 'inside': None})
    M.group('m_ext_portal', s0)
    rails(M, 'z', 0.0, -14.0, 0.0, -.03, 'm_ext_yard')
    cart(M, 0.0, -14.0, 'z', 'm_ext_yard')
    cart(M, 0.0, -11.6, 'z', 'm_ext_yard', load=False)
    # a buffer stop where the rails end on the yard
    s0 = M.mark()
    tinted(B, DWOOD)
    B.box((-.8, -.03, -14.6), (.8, .9, -14.1), 'v_plank')
    tinted(B, (.85, .70, .20))
    B.box((-.7, .9, -14.5), (.7, 1.0, -14.2), 'w_paint')
    M.solid('buffer-stop', -.8, .8, -14.6, -14.1, 1)
    M.group('m_ext_yard', s0)
    # spoil heaps: rough cones of broken rock beside the yard
    s0 = M.mark()
    tinted(B, (.62, .58, .54))
    for (cx, cz, r, hh) in ((-12.0, -18.5, 4.5, 3.2), (14.5, -3.5, 3.0, 2.2)):
        n = 18
        for i in range(n):
            a, b = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
            ra, rb = r * (1 + .18 * math.sin(i * 2.3)), r * (1 + .18 * math.sin((i + 1) * 2.3))
            B.quad(((cx + math.cos(a) * ra, -.6, cz + math.sin(a) * ra), (cx + math.cos(b) * rb, -.6, cz + math.sin(b) * rb), (cx + math.cos(b) * ra * .25, hh * .8, cz + math.sin(b) * ra * .25), (cx + math.cos(a) * ra * .25, hh * .8, cz + math.sin(a) * ra * .25)), 'v_rock', (math.cos((a + b) / 2), .6, math.sin((a + b) / 2)), smooth=True)
            B.quad(((cx + math.cos(a) * ra * .25, hh * .8, cz + math.sin(a) * ra * .25), (cx + math.cos(b) * ra * .25, hh * .8, cz + math.sin(b) * ra * .25), (cx, hh, cz), (cx, hh, cz)), 'v_rock', (0, 1, 0), smooth=True)
        M.solid(f'spoil-{cx:.0f}', cx - r * .7, cx + r * .7, cz - r * .7, cz + r * .7, hh)
    M.group('m_ext_spoil', s0)
    # timber headframe over a capped raise (east of the portal, on the bench) and a small hoist house beside it
    s0 = M.mark()
    hx, hz = 11.0, -12.0
    tinted(B, (.58, .55, .50))
    B.box((hx - 2.0, -.4, hz - 2.0), (hx + 2.0, .3, hz + 2.0), 'w_concrete')
    tinted(B, DARK)
    B.box((hx - 1.4, .3, hz - 1.4), (hx + 1.4, .45, hz + 1.4), 'w_steel')
    tinted(B, DWOOD)
    for (dx, dz) in ((-1.6, -1.6), (1.6, -1.6), (-1.6, 1.6), (1.6, 1.6)):
        B.beam((hx + dx, .3, hz + dz), (hx + dx * .45, 9.0, hz + dz * .45), .28, .28, 'v_plank')
    for y in (3.0, 6.0):
        f = 1 - y / 9.0 * .55
        for (a, b) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
            B.beam((hx + a[0] * 1.6 * f, y, hz + a[1] * 1.6 * f), (hx + b[0] * 1.6 * f, y, hz + b[1] * 1.6 * f), .18, .18, 'v_plank')
    B.beam((hx + .5, .3, hz - 5.5), (hx, 8.6, hz), .25, .25, 'v_plank')                      # back leg toward the hoist house
    tinted(B, GREY)
    B.cyl((hx - .6, 9.2, hz), (hx + .6, 9.2, hz), .9, 'w_steel', seg=16)                        # sheave wheel
    tinted(B, (.48, .40, .30))
    kx0, kx1, kz0, kz1 = hx - 2.0, hx + 3.0, hz - 10.0, hz - 6.0
    B.box((kx0, -.2, kz0), (kx1, 3.2, kz1), 'w_corr')
    BVV.gable_roof(M, kx0, kx1, kz0, kz1, 3.2, .8, 'w_corr', ridge='x')
    M.solid('headframe', hx - 2.0, hx + 2.0, hz - 2.0, hz + 2.0, 9)
    M.solid('hoist-house', kx0, kx1, kz0, kz1, 3.2)
    M.group('m_ext_headframe', s0)
    # lamp poles on the yard, timber stack, drums, a tool shed
    for (x, z) in ((-6.0, -20.0), (6.5, -4.0)):
        s0 = M.mark()
        tinted(B, DARK)
        B.cyl((x, -.2, z), (x, 5.0, z), .07, 'w_steel', seg=8)
        B.box((x - .25, 4.9, z - .25), (x + .25, 5.15, z + .25), 'w_grime')
        tinted(B, WHITE)
        B.box((x - .2, 4.88, z - .2), (x + .2, 4.9, z + .2), 'v_lamp', faces='b')
        M.group('m_ext_yard', s0)
        M.lamps.append({'pos': [x, 4.7, z], 'color': '#ffbd73', 'intensity': 18, 'range': 16, 'inside': None})
        M.solid(f'yard-lamp-{x:.0f}', x - .2, x + .2, z - .2, z + .2, 5)
    s0 = M.mark()
    tinted(B, WOOD)
    for k in range(5):
        for j in range(3 - (k > 2)):
            B.box((-12.6 + j * .4, k * .26 - .2, -5.5), (-12.25 + j * .4, k * .26 + .05, -1.0), 'v_plank')
    M.solid('timber-stack', -12.7, -11.3, -5.6, -.9, 1.3)
    BVV.barrel_group(M, 4.5, -7.0, 3, 9)
    tinted(B, OLIVE)
    B.box((-16.5, -.2, -11.0), (-13.5, 2.4, -8.0), 'w_corr')
    tinted(B, DARK)
    B.box((-16.7, 2.4, -11.2), (-13.3, 2.55, -7.8), 'w_steel')
    M.solid('tool-shed', -16.5, -13.5, -11.0, -8.0, 2.5)
    M.group('m_ext_yard', s0)
    M.places.append({'id': 'vesper-mine', 'name': 'The mine', 'rect': [-18.0, 18.0, -30.0, 0.0], 'approach': [0.0, -24.0], 'yaw': 0.0, 'where': 'The mine yard and the portal dug into the mountainside north of the road.', 'inside': [3.0, -17.0]})


# ------------------------------------------------------------------ inside: the adit level ------------------------------------------------------------------
ADIT = [(-2.0, 2.0, 0.0, 34.0), (2.0, 24.0, 30.0, 34.0), (20.0, 32.0, 28.0, 40.0)]       # the adit, the drift east (the bend hides daylight), the collar chamber


def inside(M):
    B = M.B
    rock_room(M, ADIT, 0.0, H_ADIT, 'm_int_adit', seed=1)
    timber_sets(M, 'z', 0.0, 1.5, 30.0, 0.0, 2.0, H_ADIT - .3)
    timber_sets(M, 'x', 32.0, 2.0, 20.0, 0.0, 2.0, H_ADIT - .3)
    rails(M, 'z', 0.0, 0.0, 32.0, 0.0, 'm_int_adit')
    rails(M, 'x', 32.0, 0.0, 26.0, 0.0, 'm_int_adit')
    for z in (6.0, 16.0, 26.0):
        lamp(M, -1.6, H_ADIT - .1, z, 'm_int_adit', 'mine')
    lamp(M, 12.0, H_ADIT - .1, 31.0, 'm_int_adit', 'mine')
    cart(M, 1.0, 20.0, 'z', 'm_int_adit') if False else None
    cart(M, 8.0, 32.0, 'x', 'm_int_adit')
    # the collar chamber: the shaft opening (fenced, with gates on the cage side), the winder, a bench
    s0 = M.mark()
    cx, cz = CAGE
    tinted(B, (.85, .70, .20))
    for (a, b, c, d) in ((cx - 1.6, cx + 1.6, cz - 1.65, cz - 1.55), (cx - 1.6, cx + 1.6, cz + 1.55, cz + 1.65), (cx + 1.55, cx + 1.65, cz - 1.6, cz + 1.6)):
        B.box((a, 0, c), (b, 1.1, d), 'w_paint')
    tinted(B, DARK)
    B.box((cx - 1.65, 0, cz - 1.6), (cx - 1.55, .1, cz - .9), 'w_steel')
    B.box((cx - 1.65, 0, cz + .9), (cx - 1.55, .1, cz + 1.6), 'w_steel')
    # headgear over the shaft inside the chamber: two steel beams and a sheave
    tinted(B, GREY)
    for o in (-1.0, 1.0):
        B.box((cx - 1.8, H_ADIT - .2, cz + o - .1), (cx + 1.8, H_ADIT, cz + o + .1), 'w_steel')
    B.cyl((cx - .2, H_ADIT - .6, cz), (cx + .2, H_ADIT - .6, cz), .45, 'w_steel', seg=14)
    # the winder (drum, motor, operator's platform) on the chamber's west side
    tinted(B, (.35, .40, .36))
    B.box((21.0, 0, 35.5), (24.5, .5, 39.5), 'w_paint')
    tinted(B, GREY)
    B.cyl((21.4, 1.4, 37.5), (24.1, 1.4, 37.5), .9, 'w_steel', seg=18)
    tinted(B, (.35, .40, .36))
    B.box((21.2, .5, 38.6), (22.4, 1.6, 39.5), 'w_paint')
    M.solid('winder', 21.0, 24.5, 35.5, 39.5, 2.3)
    tinted(B, WOOD)
    B.box((30.5, 0, 38.6), (31.8, .5, 39.6), 'v_plank')
    M.group('m_int_chamber', s0)
    lamp(M, 26.0, H_ADIT - .1, 30.5, 'm_int_chamber', 'mine', intensity=16, rng=12)
    lamp(M, 24.0, H_ADIT - .1, 37.0, 'm_int_chamber', 'mine', intensity=16, rng=12)
    # the shaft's fence and walls are solid except its west side, where the cage gate is
    M.solid('shaft-fence-s', cx - 1.65, cx + 1.65, cz - 1.7, cz - 1.5, 1.2)
    M.solid('shaft-fence-n', cx - 1.65, cx + 1.65, cz + 1.5, cz + 1.7, 1.2)
    M.solid('shaft-fence-e', cx + 1.5, cx + 1.7, cz - 1.65, cz + 1.65, 1.2)
    for r in ADIT:
        M.floors.append({'level': 0, 'rect': list(r), 'y': 0.0})
    M.floors[0]['rect'][2] = -1.0          # the adit's floor reaches back over the apron, so walking in from the yard is seamless
    M.interactions.append({'id': 'vesper-mine-cage-down', 'action': 'vesper-mine-cage', 'label': 'RIDE THE CAGE DOWN', 'position': [cx, 1.5, cz], 'range': 1.8, 'level': 0, 'dir': 1})
    M.places.append({'id': 'vesper-mine-adit', 'name': 'The adit', 'rect': [-2.0, 32.0, 0.0, 40.0], 'approach': [0.0, 3.0], 'yaw': 0.0, 'where': 'Inside the mine: the adit, the drift and the shaft\'s collar chamber.', 'inside': [26.0, 34.0], 'level': 0})


def cage(M):
    """The cage (object m_int_cage, at the adit level; vesper-sites.js moves it): a steel frame with mesh sides, a gate on the west side, a roof lamp."""
    B = M.B
    s0 = M.mark()
    cx, cz = CAGE
    tinted(B, (.70, .60, .30))
    B.box((cx - 1.15, -.15, cz - 1.15), (cx + 1.15, .0, cz + 1.15), 'w_steel')
    B.box((cx - 1.15, 2.6, cz - 1.15), (cx + 1.15, 2.75, cz + 1.15), 'w_steel')
    tinted(B, DARK)
    for (dx, dz) in ((-1.1, -1.1), (1.1, -1.1), (-1.1, 1.1), (1.1, 1.1)):
        B.box((cx + dx - .05, 0, cz + dz - .05), (cx + dx + .05, 2.6, cz + dz + .05), 'w_steel')
    for y in np.arange(.2, 2.6, .25):
        for (a, b, c, d) in ((cx - 1.1, cx + 1.1, cz - 1.12, cz - 1.08), (cx - 1.1, cx + 1.1, cz + 1.08, cz + 1.12), (cx + 1.08, cx + 1.12, cz - 1.1, cz + 1.1)):
            B.box((a, y, c), (b, y + .02, d), 'w_steel')
    B.box((cx - 1.12, 1.0, cz - 1.1), (cx - 1.08, 1.04, cz + 1.1), 'w_steel')                 # the gate bar (west side, open)
    tinted(B, WHITE)
    B.box((cx - .2, 2.55, cz - .2), (cx + .2, 2.58, cz + .2), 'v_lamp', faces='b')
    tinted(B, GREY)
    B.cyl((cx, 2.75, cz), (cx, 6.0, cz), .03, 'w_steel', seg=6)
    M.group('m_int_cage', s0)


# ------------------------------------------------------------------ the shaft section and the bottom level ------------------------------------------------------------------
def shaft_section(M=None):
    """One 10 m section (y 0..-10) of the 3 x 3 m shaft around the cage: rock walls (inward), timber buntons and steel guides, a lamp half way. Object
    m_int_shaft of the deep model; vesper-sites.js stacks copies of it from the adit level down to the bottom."""
    M = M or Mine()
    B = M.B
    cx, cz = CAGE
    s0 = M.mark()
    tinted(B, ROCK)
    for side in range(4):
        for k in range(5):
            ya, yb = -10.0 + k * 2, -8.0 + k * 2
            for j in range(3):
                a, b = -1.5 + j, -.5 + j
                d = lambda t, y: 1.5 + .18 * (1 + noise(t, y, side, 4))
                if side == 0:
                    P = ((cx + a, ya, cz - d(a, ya)), (cx + b, ya, cz - d(b, ya)), (cx + b, yb, cz - d(b, yb)), (cx + a, yb, cz - d(a, yb))); n = (0, 0, 1)
                elif side == 1:
                    P = ((cx + a, ya, cz + d(a, ya)), (cx + b, ya, cz + d(b, ya)), (cx + b, yb, cz + d(b, yb)), (cx + a, yb, cz + d(a, yb))); n = (0, 0, -1)
                elif side == 2:
                    P = ((cx - d(a, ya), ya, cz + a), (cx - d(b, ya), ya, cz + b), (cx - d(b, yb), yb, cz + b), (cx - d(a, yb), yb, cz + a)); n = (1, 0, 0)
                else:
                    P = ((cx + d(a, ya), ya, cz + a), (cx + d(b, ya), ya, cz + b), (cx + d(b, yb), yb, cz + b), (cx + d(a, yb), yb, cz + a)); n = (-1, 0, 0)
                B.quad(P, 'v_rock', n, smooth=True)
    tinted(B, DWOOD)
    for y in (-2.5, -7.5):
        for o in (-1.35, 1.35):
            B.box((cx - 1.5, y - .1, cz + o - .1), (cx + 1.5, y + .1, cz + o + .1), 'v_plank')
    tinted(B, GREY)
    for o in (-1.25, 1.25):
        B.box((cx - .08, -10.0, cz + o - .05), (cx + .08, 0.0, cz + o + .05), 'w_steel')
    M.group('m_int_shaft', s0)
    lamp(M, cx + 1.35, -4.8, cz - 1.3, 'm_int_shaft', 'mine', intensity=8, rng=7)
    return M


DEEP = [(22.0, 34.0, 29.0, 39.0), (34.0, 74.0, 32.0, 36.0), (50.0, 54.0, 36.0, 48.0)]       # the shaft station, the drift east, a cross-cut north


def deep():
    """The bottom level at the shaft's foot (floor y 0 here; vesper-sites.js places it MINE_DEPTH_M below the adit): the station around the shaft, a drift
    east ending at the working face (a drill rig and a loaded cart), a short cross-cut. The depth is a placeholder (the owner plans to go deeper)."""
    M = Mine()
    B = M.B
    cx, cz = CAGE
    rock_room(M, DEEP, 0.0, H_ADIT, 'm_int_deep', seed=7)
    timber_sets(M, 'x', 34.0, 34.5, 72.0, 0.0, 2.0, H_ADIT - .3, grp='m_int_deep')
    rails(M, 'x', 34.0, 24.0, 72.0, 0.0, 'm_int_deep')
    s0 = M.mark()
    tinted(B, (.85, .70, .20))
    for (a, b, c, d) in ((cx - 1.6, cx + 1.6, cz - 1.65, cz - 1.55), (cx - 1.6, cx + 1.6, cz + 1.55, cz + 1.65), (cx + 1.55, cx + 1.65, cz - 1.6, cz + 1.6)):
        B.box((a, 0, c), (b, 1.1, d), 'w_paint')
    # the working face: a drill rig (boom on a carrier), drill steel, a loaded cart, a pump and hose
    tinted(B, (.70, .55, .20))
    B.box((68.0, .3, 32.6), (71.0, 1.3, 35.4), 'w_paint')
    tinted(B, DARK)
    for (dx, dz) in ((68.4, 32.7), (70.6, 32.7), (68.4, 35.3), (70.6, 35.3)):
        B.cyl((dx, .3, dz - .12), (dx, .3, dz + .12), .3, 'w_rubber', seg=10)
    tinted(B, GREY)
    B.beam((71.0, 1.3, 33.4), (73.6, 1.8, 33.2), .16, .16, 'w_steel')
    B.beam((71.0, 1.3, 34.6), (73.6, 2.4, 34.8), .16, .16, 'w_steel')
    M.solid('drill-rig', 68.0, 73.8, 32.5, 35.5, 2.0)
    tinted(B, (.35, .40, .36))
    B.box((52.2, 0, 46.0), (53.6, .9, 47.6), 'w_paint')
    M.group('m_int_deep', s0)
    cart(M, 60.0, 34.0, 'x', 'm_int_deep')
    for x in (30.0, 44.0, 58.0, 70.0):
        lamp(M, x, H_ADIT - .1, 32.4, 'm_int_deep', 'mine')
    lamp(M, 52.0, H_ADIT - .1, 44.0, 'm_int_deep', 'mine')
    M.solid('deep-fence-s', cx - 1.65, cx + 1.65, cz - 1.7, cz - 1.5, 1.2)
    M.solid('deep-fence-n', cx - 1.65, cx + 1.65, cz + 1.5, cz + 1.7, 1.2)
    M.solid('deep-fence-e', cx + 1.5, cx + 1.7, cz - 1.65, cz + 1.65, 1.2)
    return M


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    os.makedirs(TEXDIR, exist_ok=True)
    vesper_textures.build(TEXDIR)
    BV.corr_texture(TEXDIR)
    BVV.plank_texture(TEXDIR)
    rock_texture(TEXDIR)
    M = Mine()
    portal(M)
    inside(M)
    cage(M)
    n = M.B.write_objects(os.path.join(OUTDIR, 'vesper-mine.glb'), M.groups)
    print('vesper-mine.glb faces', n, list(M.groups))
    D = deep()
    nl = len(D.lamps)
    shaft_section(D)
    shaft_lamps = D.lamps[nl:]
    del D.lamps[nl:]
    n = D.B.write_objects(os.path.join(OUTDIR, 'vesper-mine-deep.glb'), D.groups)
    print('vesper-mine-deep.glb faces', n)
    zone = {'id': 'mine', 'origin': list(ORIGIN), 'area': [-18, 18, -30, 0], 'pad': [-18, 18, -24, 0], 'padMode': 'flat', 'padBlend': 7,
            'cut': {'x': [-8, 8], 'z0': 0, 'cover': 9.5, 'rise': .8, 'falloff': 1.4}, 'hole': [-8, 8, -8, 0],
            'model': 'assets/models/vesper/vesper-mine.glb', 'deep': 'assets/models/vesper/vesper-mine-deep.glb', 
            'cage': list(CAGE), 'shaftSection': 10, 'adit': [[-2.0, 2.0, 0.0, 34.0]]}
    sites_data.update('mine', {'zone': zone, 'solids': M.solids, 'lamps': M.lamps, 'places': M.places, 'floors': M.floors, 'interactions': M.interactions,
                               'deep': {'solids': D.solids, 'lamps': D.lamps, 'floors': [{'level': 1, 'rect': list(r), 'y': 0.0} for r in DEEP]},
                               'shaftLamps': shaft_lamps})
    print('solids', len(M.solids), '+', len(D.solids), 'lamps', len(M.lamps), '+', len(D.lamps))


if __name__ == '__main__':
    main()
