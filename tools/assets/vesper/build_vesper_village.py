"""Vesper road, phase 3: the village (docs/development/VESPER_ROAD.md).

    /home/user/bpyenv/bin/python tools/assets/vesper/build_vesper_village.py

Writes void-runner/assets/models/vesper/vesper-village.glb and void-runner/vesper-sites-data.js (the village's collision boxes, lamps, doors and places,
generated from the same numbers as the model so they can never drift apart).

Frame: the village's own metres, origin on the road's centre line at the middle of the village street (world (1825, roadY, 664); the street runs due east
there, so local axes are world axes: x east, z north, y up from the street). Road 7 m wide along x (z -3.5..3.5); the walking corridor reaches z +-9.1.
- A bar (north side) and a store (south side), both enterable: a real door opening, an interior lining, floor and ceiling, furniture. No people, no shop,
  no text: these are reversible defaults (owner decisions).
- Nine small houses, two kinds, varied in size, cladding, colour, roof and yard clutter (doors closed: not enterable).
- Street lamps (light from a real lamp head; the scene adds a few point lights only near the village), a water tower, a generator shed, power poles,
  fences, barrels, crates, a hand cart.
Objects: v_ext_* (lit by the sun and sky) and v_int_* (the insides: lit only by their own lamps; vesper-sites.js excludes them from the sun).
Made by Claude for this project; no third-party assets. Textures generated from seeded noise (vesper_textures.py, corr_texture, plank below)."""
import math, os, sys, json
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(REPO, 'tools', 'assets', 'universe'))
sys.path.insert(0, HERE)
import build_vesper as BV  # noqa: E402  (VB builder, MATS, textures, helpers)
from build_vesper import VB, Mat, tinted, drum, crate, OCHRE, OLIVE, GREY, RED, SAND, DARK, WHITE, BLUE  # noqa: E402
import vesper_textures  # noqa: E402

OUTDIR = os.path.join(REPO, 'void-runner', 'assets', 'models', 'vesper')
DATA_JS = os.path.join(REPO, 'void-runner', 'vesper-sites-data.js')
TEXDIR = BV.TEXDIR
ORIGIN = (1825.0, 664.0)            # world x, z of the village origin (its y is the road's height there, set at runtime)

MATS = BV.MATS + [Mat('v_plank', tex='v_plank', tile=2.0), Mat('v_lamp', emissive=(1.0, .80, .52), strength=4.0), Mat('v_glow', emissive=(.75, .85, .80), strength=.45)]
RUST, CREAM, TEAL, BROWN, WOOD = (.55, .33, .20), (.86, .80, .68), (.36, .48, .46), (.45, .34, .24), (.62, .48, .34)


def plank_texture(d, n=512):
    """Weathered boards: grain along u, a board every 0.25 m at the 2 m tile, nail pairs, dust and sun bleaching."""
    from vesper_textures import _normal, _orm, _spectral, _step, _jpg
    gy, gx = np.mgrid[0:n, 0:n]
    board = (gy // (n // 8)).astype(float)
    gap = ((gy % (n // 8)) < 2).astype(float)
    grain = _spectral(n, 201, 2.2, ax=1.0, ay=.05, lo=6)
    tone = (np.sin(board * 12.9898) * 43758.5453) % 1
    bleach = _step(.5, .9, _spectral(n, 202, 2.0, lo=2))
    nails = np.zeros((n, n))
    for b in range(8):
        for k in range(4):
            cx, cy = (k + .5) / 4 * n, (b + .5) / 8 * n
            nails += np.exp(-((gx - cx) ** 2 + (gy - cy) ** 2) / 6.0)
    h = .4 * grain - .8 * gap + .2 * nails
    col = np.array([.80, .74, .66])[None, None, :] * (.75 + .25 * tone[..., None]) * (.85 + .2 * grain[..., None])
    col = col * (1 - .35 * gap[..., None]) * (1 - .3 * nails[..., None])
    col = col * (1 - .25 * bleach[..., None]) + bleach[..., None] * np.array([.85, .82, .78]) * .25
    _jpg(os.path.join(d, 'v_plank_color.jpg'), col * 255)
    _jpg(os.path.join(d, 'v_plank_normal.jpg'), _normal(h, 5.0), 90)
    _jpg(os.path.join(d, 'v_plank_orm.jpg'), _orm(1 - .4 * gap, (.85 + .1 * grain).clip(0, 1), 0 * h), 90)


class Village:
    """The builder plus the data the game needs (collision boxes, lamps, doors, places), all in the village's local metres."""

    def __init__(self):
        self.B = VB(MATS)
        self.groups = {}
        self.solids = []          # {id, rect:[x0,x1,z0,z1], h}
        self.lamps = []           # {pos, color, intensity, range, inside}
        self.places = []          # {id, name, rect, approach:[x,z], yaw, where}
        self.zone = None

    def mark(self):
        return len(self.B.faces)

    def group(self, name, start):
        self.groups.setdefault(name, []).extend(range(start, len(self.B.faces)))

    def solid(self, sid, x0, x1, z0, z1, h=2.5):
        self.solids.append({'id': sid, 'rect': [round(min(x0, x1), 3), round(max(x0, x1), 3), round(min(z0, z1), 3), round(max(z0, z1), 3)], 'h': h})

    # ---- walls with openings: along x at z (thickness t), or along z at x ----
    def wall(self, sid, axis, c, a0, a1, h, t=.25, holes=(), mat='w_paint', y0=0.0, solid=True):
        B = self.B
        holes = sorted(holes)
        cuts, a = [], a0
        for (h0, h1, top, sill) in holes:
            if h0 > a:
                cuts.append((a, h0, y0, y0 + h))
            if top < h:
                cuts.append((h0, h1, y0 + top, y0 + h))          # lintel
            if sill > 0:
                cuts.append((h0, h1, y0, y0 + sill))            # under a window
            if sill <= 0 and solid:
                pass
            a = h1
        if a < a1:
            cuts.append((a, a1, y0, y0 + h))
        for (p, q, ya, yb) in cuts:
            if axis == 'x':
                B.box((p, ya, c - t / 2), (q, yb, c + t / 2), mat)
            else:
                B.box((c - t / 2, ya, p), (c + t / 2, yb, q), mat)
        if solid:
            # collision: the wall minus its door holes (windows stay solid)
            a = a0
            for (h0, h1, top, sill) in holes:
                if sill > 0:
                    continue
                if h0 > a:
                    self._wsolid(sid, axis, c, a, h0, t)
                a = h1
            if a < a1:
                self._wsolid(sid, axis, c, a, a1, t)

    def _wsolid(self, sid, axis, c, p, q, t):
        k = sum(1 for s in self.solids if s['id'].startswith(sid))
        if axis == 'x':
            self.solid(f'{sid}-{k}', p, q, c - t / 2 - .02, c + t / 2 + .02, 3)
        else:
            self.solid(f'{sid}-{k}', c - t / 2 - .02, c + t / 2 + .02, p, q, 3)


# ------------------------------------------------------------------ pieces ------------------------------------------------------------------
def window(V, axis, c, a, b, y0, y1, out):
    """A glazed window on a wall face (frame + dark glass + sill) on the side `out` (+1 / -1)."""
    B = V.B
    tinted(B, DARK)
    o = out * .14
    if axis == 'x':
        B.box((a - .06, y0 - .06, c + o - .03), (b + .06, y1 + .06, c + o + .03), 'w_steel', faces='tbewns'.replace('n' if out < 0 else 's', ''))
        tinted(B, WHITE)
        B.quad(((a, y0, c + o + .035 * out), (b, y0, c + o + .035 * out), (b, y1, c + o + .035 * out), (a, y1, c + o + .035 * out)), 'w_glass', (0, 0, out))
        tinted(B, GREY)
        B.box((a - .1, y0 - .1, c + o), (b + .1, y0 - .04, c + o + .12 * out), 'w_concrete')
        B.box(((a + b) / 2 - .02, y0, c + o + .03 * out), ((a + b) / 2 + .02, y1, c + o + .045 * out), 'w_steel')
    else:
        B.box((c + o - .03, y0 - .06, a - .06), (c + o + .03, y1 + .06, b + .06), 'w_steel')
        tinted(B, WHITE)
        B.quad(((c + o + .035 * out, y0, a), (c + o + .035 * out, y0, b), (c + o + .035 * out, y1, b), (c + o + .035 * out, y1, a)), 'w_glass', (out, 0, 0))
        tinted(B, GREY)
        B.box((c + o, y0 - .1, a - .1), (c + o + .12 * out, y0 - .04, b + .1), 'w_concrete')


def gable_roof(V, x0, x1, z0, z1, y, rise, mat='w_corr', ridge='x', over=.45):
    """Pitched roof over a box, ridge along x or z, with eaves, ridge cap and gable infills."""
    B = V.B
    if ridge == 'x':
        zm = (z0 + z1) / 2
        for (za, zb) in ((z0 - over, zm), (z1 + over, zm)):
            ya = y - over * rise / ((z1 - z0) / 2)
            B.quad(((x0 - over, ya, za), (x1 + over, ya, za), (x1 + over, y + rise, zb), (x0 - over, y + rise, zb)), mat, (0, 1, (za - zm)))
            B.quad(((x0 - over, ya - .06, za), (x1 + over, ya - .06, za), (x1 + over, y + rise - .06, zb), (x0 - over, y + rise - .06, zb)), mat, (0, -1, -(za - zm)))
        tinted(B, DARK)
        B.box((x0 - over, y + rise - .05, zm - .14), (x1 + over, y + rise + .08, zm + .14), 'w_steel')
        for x in (x0, x1):
            B.quad(((x, y, z0), (x, y, z1), (x, y + rise, zm)), 'w_paint', (x - (x0 + x1) / 2, 0, 0))
    else:
        xm = (x0 + x1) / 2
        for (xa, xb) in ((x0 - over, xm), (x1 + over, xm)):
            ya = y - over * rise / ((x1 - x0) / 2)
            B.quad(((xa, ya, z0 - over), (xa, ya, z1 + over), (xb, y + rise, z1 + over), (xb, y + rise, z0 - over)), mat, ((xa - xm), 1, 0))
            B.quad(((xa, ya - .06, z0 - over), (xa, ya - .06, z1 + over), (xb, y + rise - .06, z1 + over), (xb, y + rise - .06, z0 - over)), mat, (-(xa - xm), -1, 0))
        tinted(B, DARK)
        B.box((xm - .14, y + rise - .05, z0 - over), (xm + .14, y + rise + .08, z1 + over), 'w_steel')
        for z in (z0, z1):
            B.quad(((x0, y, z), (x1, y, z), (xm, y + rise, z)), 'w_paint', (0, 0, z - (z0 + z1) / 2))


def street_lamp(V, x, z, face):
    """A steel pole with an arm over the street and a shaded sodium head; the head's lens is the light's physical source."""
    B = V.B
    s0 = V.mark()
    tinted(B, DARK)
    B.cyl((x, 0, z), (x, 5.6, z), .07, 'w_steel', seg=8)
    B.box((x - .18, 0, z - .18), (x + .18, .35, z + .18), 'w_concrete')
    hz = z + face * 1.5
    B.beam((x, 5.5, z), (x, 5.75, hz), .06, .06, 'w_steel')
    B.box((x - .22, 5.62, hz - .3), (x + .22, 5.84, hz + .3), 'w_grime')
    tinted(B, WHITE)
    B.box((x - .17, 5.58, hz - .24), (x + .17, 5.62, hz + .24), 'v_lamp', faces='b')
    V.group('v_ext_lamps', s0)
    V.lamps.append({'pos': [x, 5.45, hz], 'color': '#ffbd73', 'intensity': 22, 'range': 16, 'inside': None})
    V.solid(f'lamp-{len(V.lamps)}', x - .2, x + .2, z - .2, z + .2, 5.6)


def power_pole(V, x, z):
    B = V.B
    s0 = V.mark()
    tinted(B, BROWN)
    B.cyl((x, 0, z), (x, 7.5, z), .13, 'v_plank', seg=8)
    B.beam((x - 1.0, 7.0, z), (x + 1.0, 7.0, z), .12, .14, 'v_plank', up=(0, 0, 1))
    tinted(B, WHITE)
    for dx in (-.8, 0, .8):
        B.cyl((x + dx, 7.07, z), (x + dx, 7.25, z), .05, 'w_concrete', seg=6)
    V.group('v_ext_poles', s0)
    V.solid(f'pole-{x:.0f}-{z:.0f}', x - .2, x + .2, z - .2, z + .2, 7)


def fence(V, x0, z0, x1, z1, h=1.1):
    """A post-and-rail fence of weathered boards (posts every ~2.2 m), not solid (low, open)."""
    B = V.B
    L = math.hypot(x1 - x0, z1 - z0)
    n = max(1, int(L / 2.2))
    tinted(B, WOOD)
    for k in range(n + 1):
        t = k / n
        x, z = x0 + (x1 - x0) * t, z0 + (z1 - z0) * t
        B.box((x - .06, 0, z - .06), (x + .06, h, z + .06), 'v_plank')
    for y in (h * .45, h * .85):
        B.beam((x0, y, z0), (x1, y, z1), .03, .12, 'v_plank')


def barrel_group(V, x, z, n=3, seed=0):
    rng = np.random.default_rng(seed)
    for k in range(n):
        drum(V.B, x + (k % 2) * .62 + rng.uniform(-.05, .05), z + (k // 2) * .62, tint=[RED, OLIVE, BLUE, GREY][int(rng.integers(0, 4))])


# ------------------------------------------------------------------ houses ------------------------------------------------------------------
def house(V, hid, cx, cz, w, d, face, kind, tint, seed):
    """A small one-room house (not enterable: door shut). face: +1 door on the north wall, -1 on the south wall (toward the street)."""
    B = V.B
    rng = np.random.default_rng(seed)
    x0, x1, z0, z1 = cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2
    s0 = V.mark()
    h = 2.9 if kind == 'A' else 3.1
    # plinth
    tinted(B, (.55, .52, .48))
    B.box((x0 - .15, -.4, z0 - .15), (x1 + .15, .25, z1 + .15), 'w_concrete')
    clad = 'w_corr' if kind == 'A' else 'w_paint'
    tinted(B, tint)
    B.box((x0, .25, z0), (x1, .25 + h, z1), clad)
    zf = z1 if face > 0 else z0
    dx = cx + rng.uniform(-w * .2, w * .2)
    # door (shut), step, porch roof
    tinted(B, [RUST, TEAL, DARK, BROWN][int(rng.integers(0, 4))])
    B.box((dx - .5, .25, zf + face * .0), (dx + .5, 2.35, zf + face * .05), 'w_paint')
    tinted(B, DARK)
    B.box((dx + .3, 1.2, zf + face * .05), (dx + .36, 1.28, zf + face * .09), 'w_steel')
    tinted(B, (.55, .52, .48))
    B.box((dx - .8, -.2, min(zf, zf + face * 1.0)), (dx + .8, .2, max(zf, zf + face * 1.0)), 'w_concrete')
    if kind == 'A':
        tinted(B, (.55, .55, .52))
        B.box((dx - 1.3, 2.55, min(zf, zf + face * 1.6)), (dx + 1.3, 2.62, max(zf, zf + face * 1.6)), 'w_corr')
        tinted(B, DARK)
        for sx in (-1.2, 1.2):
            B.box((dx + sx - .04, .2, zf + face * 1.5 - .04), (dx + sx + .04, 2.55, zf + face * 1.5 + .04), 'w_steel')
    # windows either side of the door and one on each end
    for wx in (x0 + .9, x1 - 1.7):
        if abs(wx + .4 - dx) > 1.0:
            window(V, 'x', zf, wx, wx + .8, 1.1, 2.0, face)
    window(V, 'z', x0, cz - .5, cz + .5, 1.2, 1.9, -1)
    window(V, 'z', x1, cz - .5, cz + .5, 1.2, 1.9, 1)
    # roof
    tinted(B, [(.55, .52, .48), (.50, .36, .26), (.42, .44, .42)][int(rng.integers(0, 3))])
    if kind == 'A':
        gable_roof(V, x0, x1, z0, z1, .25 + h, 1.1, 'w_corr', ridge='x')
    else:
        tinted(B, DARK)
        B.box((x0 - .3, .25 + h, z0 - .3), (x1 + .3, .25 + h + .18, z1 + .3), 'w_steel')
        B.box((x0 - .3, .25 + h + .18, z0 - .3), (x1 + .3, .25 + h + .45, z0 - .18), 'w_paint')
        # rooftop water tank and a solar panel on a frame
        tinted(B, GREY)
        tx, tz = x0 + 1.0, cz
        B.cyl((tx, .25 + h + .18, tz), (tx, .25 + h + 1.4, tz), .55, 'w_paint', seg=14)
        tinted(B, (.10, .12, .16))
        B.quad(((x1 - 2.6, .25 + h + .5, z0 + .6), (x1 - .4, .25 + h + .5, z0 + .6), (x1 - .4, .25 + h + 1.2, z1 - .8), (x1 - 2.6, .25 + h + 1.2, z1 - .8)), 'w_glass', (0, 1, -.6))
        tinted(B, DARK)
        for px in (x1 - 2.5, x1 - .5):
            B.box((px - .03, .25 + h + .18, z1 - .9), (px + .03, .25 + h + 1.2, z1 - .8), 'w_steel')
    # yard clutter: a drum or two, a crate stack, a bench
    if rng.random() < .7:
        drum(B, x1 + .6, z0 + .7, tint=[RED, OLIVE, BLUE][int(rng.integers(0, 3))])
    if rng.random() < .6:
        crate(B, x0 - .9, cz, w=.9, h=.6, d=.7, tint=OLIVE, yaw=rng.uniform(-.3, .3))
    V.group('v_ext_houses', s0)
    V.solid(hid, x0 - .1, x1 + .1, z0 - .1, z1 + .1, 3.5)


# ------------------------------------------------------------------ the bar ------------------------------------------------------------------
def bar(V):
    """North side: 16 x 12 m, door in the street wall (south, z 12) at x -5..-3.6. Inside: counter and back bar, stools, tables, a booth row, pendant lamps."""
    B = V.B
    x0, x1, z0, z1, h = -12.0, 4.0, 12.0, 24.0, 4.2
    door = (-5.0, -3.6)
    s0 = V.mark()
    tinted(B, (.55, .52, .48))
    B.box((x0 - .3, -.4, z0 - .3), (x1 + .3, .15, z1 + .3), 'w_concrete')
    tinted(B, (.47, .40, .32))
    V.wall('bar-s', 'x', z0, x0, x1, h, holes=[(door[0], door[1], 2.4, 0), (-10.4, -7.4, 2.6, 1.0), (-1.6, 2.6, 2.6, 1.0)], mat='w_corr', y0=.15)
    V.wall('bar-n', 'x', z1, x0, x1, h, holes=[(-1.0, .2, 2.2, 0)], mat='w_corr', y0=.15)       # back door (shut)
    V.wall('bar-w', 'z', x0, z0, z1, h, holes=[(16.0, 18.5, 2.6, 1.1)], mat='w_corr', y0=.15)
    V.wall('bar-e', 'z', x1, z0, z1, h, mat='w_corr', y0=.15)
    tinted(B, DARK)
    B.box((-1.0, .15, z1 + .13), (.2, 2.35, z1 + .17), 'w_paint')                                # back door leaf, shut
    # glazing in the front window holes (the holes are real; the panes are dark glass both ways)
    tinted(B, WHITE)
    for (a, b) in ((-10.4, -7.4), (-1.6, 2.6)):
        for zz in (z0 - .01, z0 + .01):
            B.quad(((a, 1.15, zz), (b, 1.15, zz), (b, 2.75, zz), (a, 2.75, zz)), 'w_glass', (0, 0, -1 if zz < z0 else 1))
    for xx in (x0 - .01, x0 + .01):
        B.quad(((xx, 1.25, 16.0), (xx, 1.25, 18.5), (xx, 2.75, 18.5), (xx, 2.75, 16.0)), 'w_glass', (-1 if xx < x0 else 1, 0, 0))
    # flat roof with a parapet, rooftop condensers
    tinted(B, DARK)
    B.box((x0 - .25, h + .15, z0 - .25), (x1 + .25, h + .4, z1 + .25), 'w_steel')
    tinted(B, (.47, .40, .32))
    for (a, b, c, d) in ((x0 - .25, x1 + .25, z0 - .25, z0 - .05), (x0 - .25, x1 + .25, z1 + .05, z1 + .25), (x0 - .25, x0 - .05, z0 - .25, z1 + .25), (x1 + .05, x1 + .25, z0 - .25, z1 + .25)):
        B.box((a, h + .4, c), (b, h + 1.0, d), 'w_corr')
    tinted(B, GREY)
    for cx in (-8.0, -4.5):
        B.box((cx - .7, h + .4, 20.0), (cx + .7, h + 1.5, 21.4), 'w_paint')
        tinted(B, DARK)
        B.cyl((cx, h + 1.5, 20.7), (cx, h + 1.52, 20.7), .5, 'w_grime', seg=14)
        tinted(B, GREY)
    # porch: plank deck and a corrugated awning on posts along the front
    tinted(B, WOOD)
    B.box((-11.0, .0, 9.4), (3.0, .2, 12.0), 'v_plank')
    tinted(B, (.50, .36, .26))
    B.quad(((-11.4, 3.25, 9.0), (3.4, 3.25, 9.0), (3.4, 3.7, 12.0), (-11.4, 3.7, 12.0)), 'w_corr', (0, 1, -.15))
    B.quad(((-11.4, 3.21, 9.0), (3.4, 3.21, 9.0), (3.4, 3.66, 12.0), (-11.4, 3.66, 12.0)), 'w_corr', (0, -1, .15))
    tinted(B, DARK)
    for px in (-11.0, -6.0, -2.4, 3.0):
        B.box((px - .07, .2, 9.25), (px + .07, 3.25, 9.39), 'w_steel')
        V.solid(f'bar-porch-post-{px:.0f}', px - .12, px + .12, 9.2, 9.45, 3.2)
    # blank sign board over the porch (no text: the bar's name is the owner's)
    tinted(B, (.30, .28, .26))
    B.box((-8.0, 3.75, 11.7), (0.0, 4.55, 11.85), 'w_paint')
    tinted(B, DARK)
    B.box((-8.1, 3.7, 11.65), (0.1, 3.75, 11.9), 'w_steel')
    # a lamp over the door (its lens is a real light source)
    tinted(B, DARK)
    B.box((-4.55, 2.6, 11.75), (-4.05, 2.8, 11.86), 'w_grime')
    tinted(B, WHITE)
    B.box((-4.5, 2.58, 11.6), (-4.1, 2.6, 11.85), 'v_lamp', faces='b')
    V.group('v_ext_bar', s0)
    V.lamps.append({'pos': [-4.3, 2.45, 11.5], 'color': '#ffb466', 'intensity': 9, 'range': 9, 'inside': None})

    # ---- inside ----
    s0 = V.mark()
    li = .14
    tinted(B, WOOD)
    B.quad(((x0 + li, .16, z0 + li), (x1 - li, .16, z0 + li), (x1 - li, .16, z1 - li), (x0 + li, .16, z1 - li)), 'v_plank', (0, 1, 0))
    tinted(B, (.34, .30, .26))
    B.quad(((x0 + li, h + .1, z0 + li), (x1 - li, h + .1, z0 + li), (x1 - li, h + .1, z1 - li), (x0 + li, h + .1, z1 - li)), 'w_steel', (0, -1, 0))
    # inner lining: walls with the same holes (inner faces only)
    tinted(B, (.52, .44, .36))
    for (axis, c, a0, a1, holes, n) in (('x', z0 + li, x0 + li, x1 - li, [(door[0], door[1], 2.4, 0), (-10.4, -7.4, 2.6, 1.0), (-1.6, 2.6, 2.6, 1.0)], (0, 0, 1)),
                                        ('x', z1 - li, x0 + li, x1 - li, [(-1.0, .2, 2.2, 0)], (0, 0, -1)),
                                        ('z', x0 + li, z0 + li, z1 - li, [(16.0, 18.5, 2.6, 1.1)], (1, 0, 0)), ('z', x1 - li, z0 + li, z1 - li, [], (-1, 0, 0))):
        a = a0
        segs = []
        for (h0, h1, top, sill) in sorted(holes):
            segs.append((a, h0, .16, h + .1))
            segs.append((h0, h1, .16 + top, h + .1))
            if sill > 0:
                segs.append((h0, h1, .16, .16 + sill))
            a = h1
        segs.append((a, a1, .16, h + .1))
        for (p, q, ya, yb) in segs:
            if q - p < 1e-3:
                continue
            if axis == 'x':
                B.quad(((p, ya, c), (q, ya, c), (q, yb, c), (p, yb, c)), 'v_plank' if ya < .2 and yb < 1.4 else 'w_paint', n)
            else:
                B.quad(((c, ya, p), (c, ya, q), (c, yb, q), (c, yb, p)), 'w_paint', n)
    tinted(B, DARK)
    B.box((x0 + li, .16, z0 + li), (x1 - li, 1.1, z0 + li + .02), 'v_plank', faces='n')
    # the counter (L-shaped) and the back bar
    tinted(B, BROWN)
    B.box((-10.0, .16, 19.2), (-.5, 1.1, 20.0), 'v_plank')
    B.box((-1.3, .16, 20.0), (-.5, 1.1, 22.4), 'v_plank')
    tinted(B, (.25, .22, .20))
    B.box((-10.15, 1.1, 19.05), (-.35, 1.17, 20.1), 'w_grime')
    B.box((-1.45, 1.1, 20.0), (-.35, 1.17, 22.5), 'w_grime')
    V.solid('bar-counter', -10.1, -.4, 19.1, 20.05, 1.2)
    V.solid('bar-counter-end', -1.4, -.4, 20.0, 22.45, 1.2)
    tinted(B, (.30, .26, .22))
    B.box((-10.5, .16, 23.2), (-2.0, 1.0, 23.8), 'v_plank')
    for y in (1.6, 2.2, 2.8):
        B.box((-10.3, y, 23.45), (-2.2, y + .04, 23.85), 'w_steel')
        for k in range(16):
            bx = -10.1 + k * .5
            tinted(B, [(.25, .40, .30), (.45, .30, .15), (.60, .58, .52), (.20, .22, .30)][(k + int(y * 10)) % 4])
            B.cyl((bx, y + .04, 23.65), (bx, y + .04 + .26 + .06 * (k % 3), 23.65), .045, 'w_glass', seg=6)
        tinted(B, (.30, .26, .22))
    tinted(B, GREY)
    B.box((-1.8, .16, 23.2), (-.4, 1.9, 23.85), 'w_paint')                     # a cooler
    tinted(B, WHITE)
    B.quad(((-1.7, .5, 23.19), (-.5, .5, 23.19), (-.5, 1.7, 23.19), (-1.7, 1.7, 23.19)), 'v_glow', (0, 0, -1))
    V.solid('bar-backbar', -10.6, -.35, 23.1, 23.9, 1.2)
    # stools along the counter
    for k in range(7):
        sx = -9.3 + k * 1.2
        tinted(B, DARK)
        B.cyl((sx, .16, 18.5), (sx, .72, 18.5), .04, 'w_steel', seg=6)
        tinted(B, (.35, .18, .12))
        B.cyl((sx, .72, 18.5), (sx, .78, 18.5), .19, 'w_rubber', seg=10)
    # tables and chairs
    rng = np.random.default_rng(31)
    for (tx, tz) in ((-9.0, 14.6), (-5.6, 15.4), (-2.0, 14.4), (1.6, 15.6), (1.8, 19.4)):
        tinted(B, BROWN)
        B.cyl((tx, .16, tz), (tx, .74, tz), .05, 'w_steel', seg=6)
        B.cyl((tx, .74, tz), (tx, .78, tz), .45, 'v_plank', seg=14)
        V.solid(f'bar-table-{tx:.0f}-{tz:.0f}', tx - .45, tx + .45, tz - .45, tz + .45, .8)
        for a in (0, 2.1, 4.2):
            a += rng.uniform(-.3, .3)
            cx, cz = tx + math.cos(a) * .8, tz + math.sin(a) * .8
            tinted(B, DARK)
            B.box((cx - .2, .16, cz - .2), (cx + .2, .6, cz + .2), 'w_steel', faces='t')
            for (ex, ez) in ((-.17, -.17), (.17, -.17), (-.17, .17), (.17, .17)):
                B.box((cx + ex - .02, .16, cz + ez - .02), (cx + ex + .02, .6, cz + ez + .02), 'w_steel')
            bx, bz = cx + math.cos(a) * .2, cz + math.sin(a) * .2
            B.box((bx - .18 * abs(math.sin(a)) - .02, .6, bz - .18 * abs(math.cos(a)) - .02), (bx + .18 * abs(math.sin(a)) + .02, 1.05, bz + .18 * abs(math.cos(a)) + .02), 'w_steel')
    # a booth row on the west wall
    tinted(B, (.40, .16, .12))
    for bz in (20.6, 22.6):
        B.box((x0 + .2, .16, bz - .25), (x0 + 1.9, .62, bz + .25), 'w_tarp')
        B.box((x0 + .2, .62, bz - .25), (x0 + 1.9, 1.3, bz - .05), 'w_tarp')
    tinted(B, BROWN)
    B.box((x0 + .3, .74, 21.0), (x0 + 1.6, .8, 22.2), 'v_plank')
    V.solid('bar-booth', x0 + .1, x0 + 2.0, 20.3, 22.9, 1.3)
    # pendant lamps (their shades are the lights' physical sources)
    for (lx, lz) in ((-8.0, 19.6), (-4.0, 19.6), (-6.0, 15.0), (0.0, 16.5)):
        tinted(B, DARK)
        B.cyl((lx, h + .1, lz), (lx, 2.75, lz), .01, 'w_steel', seg=4, caps=False)
        B.cyl((lx, 2.75, lz), (lx, 2.55, lz), .06, 'w_grime', seg=10, r2=.28)
        tinted(B, WHITE)
        B.cyl((lx, 2.56, lz), (lx, 2.55, lz), .25, 'v_lamp', seg=10)
    V.group('v_int_bar', s0)
    V.lamps.append({'pos': [-6.0, 2.4, 19.0], 'color': '#ffb466', 'intensity': 60, 'range': 14, 'inside': 'bar'})
    V.lamps.append({'pos': [-0.5, 2.4, 15.5], 'color': '#ffc27a', 'intensity': 40, 'range': 12, 'inside': 'bar'})
    V.places.append({'id': 'vesper-bar', 'name': 'The bar', 'rect': [x0, x1, z0, z1], 'approach': [-4.3, 8.0], 'yaw': 0.0, 'where': 'The bar on the north side of the village street (enterable; no staff).', 'inside': [-6.0, 16.5]})


# ------------------------------------------------------------------ the store ------------------------------------------------------------------
def store(V):
    """South side: 12 x 10 m, door in the street wall (north, z -12) at x 8.6..10. Inside: shelving aisles, a counter with a till, a fridge wall."""
    B = V.B
    x0, x1, z0, z1, h = 6.0, 18.0, -22.0, -12.0, 3.8
    door = (8.6, 10.0)
    s0 = V.mark()
    tinted(B, (.55, .52, .48))
    B.box((x0 - .3, -.4, z0 - .3), (x1 + .3, .15, z1 + .3), 'w_concrete')
    tinted(B, (.66, .62, .54))
    V.wall('store-n', 'x', z1, x0, x1, h, holes=[(door[0], door[1], 2.4, 0), (11.0, 16.8, 2.5, .9)], mat='w_paint', y0=.15)
    V.wall('store-s', 'x', z0, x0, x1, h, mat='w_paint', y0=.15)
    V.wall('store-w', 'z', x0, z0, z1, h, mat='w_paint', y0=.15)
    V.wall('store-e', 'z', x1, z0, z1, h, holes=[(-19.0, -17.8, 2.2, 0)], mat='w_paint', y0=.15)         # side door (shut)
    tinted(B, RUST)
    B.box((x1 + .13, .15, -19.0), (x1 + .17, 2.35, -17.8), 'w_paint')
    tinted(B, WHITE)
    for zz in (z1 - .01, z1 + .01):
        B.quad(((11.0, 1.05, zz), (16.8, 1.05, zz), (16.8, 2.65, zz), (11.0, 2.65, zz)), 'w_glass', (0, 0, -1 if zz < z1 else 1))
    # roof: a shallow shed roof, a striped canvas awning over the shop window, a blank sign board
    tinted(B, (.42, .44, .42))
    B.quad(((x0 - .4, h + .15, z0 - .4), (x1 + .4, h + .15, z0 - .4), (x1 + .4, h + .7, z1 + .4), (x0 - .4, h + .7, z1 + .4)), 'w_corr', (0, 1, .1))
    B.quad(((x0 - .4, h + .1, z0 - .4), (x1 + .4, h + .1, z0 - .4), (x1 + .4, h + .65, z1 + .4), (x0 - .4, h + .65, z1 + .4)), 'w_corr', (0, -1, -.1))
    tinted(B, (.66, .62, .54))
    for x in (x0, x1):
        B.quad(((x, h + .15, z0), (x, h + .15, z1), (x, h + .7, z1)), 'w_paint', (x - 12, 0, 0))
    for k in range(6):
        tinted(B, [(.62, .22, .16), (.85, .80, .70)][k % 2])
        a, b = 10.8 + k * 1.0, 11.8 + k * 1.0
        B.quad(((a, 2.9, z1 + 1.6), (b, 2.9, z1 + 1.6), (b, 3.4, z1), (a, 3.4, z1)), 'w_tarp', (0, 1, 1))
        B.quad(((a, 2.86, z1 + 1.6), (b, 2.86, z1 + 1.6), (b, 3.36, z1), (a, 3.36, z1)), 'w_tarp', (0, -1, -1))
    tinted(B, (.30, .34, .30))
    B.box((7.0, 3.0, z1 + .13), (10.5, 3.7, z1 + .25), 'w_paint')
    # concrete step and a bench by the door
    tinted(B, (.55, .52, .48))
    B.box((8.2, -.2, z1), (10.4, .15, z1 + 1.2), 'w_concrete')
    tinted(B, WOOD)
    B.box((11.2, .4, z1 + .5), (13.2, .46, z1 + .95), 'v_plank')
    tinted(B, DARK)
    for bx in (11.4, 13.0):
        B.box((bx - .03, 0, z1 + .55), (bx + .03, .4, z1 + .9), 'w_steel')
    tinted(B, DARK)
    B.box((9.05, 2.6, z1 + .1), (9.55, 2.8, z1 + .22), 'w_grime')
    tinted(B, WHITE)
    B.box((9.1, 2.58, z1 + .1), (9.5, 2.6, z1 + .3), 'v_lamp', faces='b')
    V.group('v_ext_store', s0)
    V.lamps.append({'pos': [9.3, 2.45, z1 + .5], 'color': '#ffc27a', 'intensity': 8, 'range': 8, 'inside': None})

    # ---- inside ----
    s0 = V.mark()
    li = .14
    tinted(B, (.48, .46, .42))
    B.quad(((x0 + li, .16, z0 + li), (x1 - li, .16, z0 + li), (x1 - li, .16, z1 - li), (x0 + li, .16, z1 - li)), 'w_concrete', (0, 1, 0))
    tinted(B, (.60, .58, .54))
    B.quad(((x0 + li, h + .1, z0 + li), (x1 - li, h + .1, z0 + li), (x1 - li, h + .1, z1 - li), (x0 + li, h + .1, z1 - li)), 'w_paint', (0, -1, 0))
    tinted(B, (.70, .68, .62))
    for (axis, c, a0, a1, holes, n) in (('x', z1 - li, x0 + li, x1 - li, [(door[0], door[1], 2.4, 0), (11.0, 16.8, 2.5, .9)], (0, 0, -1)),
                                        ('x', z0 + li, x0 + li, x1 - li, [], (0, 0, 1)), ('z', x0 + li, z0 + li, z1 - li, [], (1, 0, 0)),
                                        ('z', x1 - li, z0 + li, z1 - li, [(-19.0, -17.8, 2.2, 0)], (-1, 0, 0))):
        a = a0
        segs = []
        for (h0, h1, top, sill) in sorted(holes):
            segs.append((a, h0, .16, h + .1))
            segs.append((h0, h1, .16 + top, h + .1))
            if sill > 0:
                segs.append((h0, h1, .16, .16 + sill))
            a = h1
        segs.append((a, a1, .16, h + .1))
        for (p, q, ya, yb) in segs:
            if q - p < 1e-3:
                continue
            if axis == 'x':
                B.quad(((p, ya, c), (q, ya, c), (q, yb, c), (p, yb, c)), 'w_paint', n)
            else:
                B.quad(((c, ya, p), (c, ya, q), (c, yb, q), (c, yb, p)), 'w_paint', n)
    # three aisles of shelving (along x), goods as small boxes
    rng = np.random.default_rng(77)
    for az in (-19.6, -17.2):
        tinted(B, GREY)
        B.box((7.4, .16, az - .35), (13.6, .26, az + .35), 'w_steel')
        for x in (7.4, 10.5, 13.6):
            B.box((x - .03, .16, az - .35), (x + .03, 1.9, az + .35), 'w_steel')
        for y in (.6, 1.1, 1.6):
            tinted(B, GREY)
            B.box((7.4, y, az - .35), (13.6, y + .03, az + .35), 'w_steel', faces='tb')
            gx = 7.5
            while gx < 13.4:
                w = rng.uniform(.15, .4)
                tinted(B, [OCHRE, RED, BLUE, OLIVE, CREAM, TEAL][int(rng.integers(0, 6))])
                for side in (-1, 1):
                    B.box((gx, y + .03, az + side * .05), (gx + w, y + .03 + rng.uniform(.12, .32), az + side * .3), 'w_paint')
                gx += w + rng.uniform(.03, .12)
        V.solid(f'store-aisle-{az:.0f}', 7.3, 13.7, az - .4, az + .4, 1.9)
    # wall shelving along the west wall, a fridge wall along the back
    tinted(B, GREY)
    B.box((x0 + .15, .16, -21.4), (x0 + .65, 2.2, -13.2), 'w_steel')
    V.solid('store-wall-shelf', x0 + .1, x0 + .7, -21.5, -13.1, 2.2)
    for z in np.arange(-21.2, -13.4, .5):
        tinted(B, [OCHRE, RED, BLUE, OLIVE, CREAM][int(rng.integers(0, 5))])
        for y in (.5, 1.1, 1.7):
            B.box((x0 + .66, y, z), (x0 + .68, y + .3, z + .38), 'w_paint', faces='e')
    tinted(B, (.80, .80, .78))
    B.box((8.0, .16, z0 + .15), (14.5, 2.2, z0 + .85), 'w_paint')
    tinted(B, WHITE)
    for k in range(5):
        a = 8.15 + k * 1.28
        B.quad(((a, .4, z0 + .86), (a + 1.1, .4, z0 + .86), (a + 1.1, 2.0, z0 + .86), (a, 2.0, z0 + .86)), 'v_glow', (0, 0, 1))
    V.solid('store-fridges', 7.9, 14.6, z0 + .1, z0 + .9, 2.2)
    # the counter by the door, with a till
    tinted(B, (.40, .36, .30))
    B.box((14.6, .16, -16.2), (15.4, 1.05, -13.4), 'v_plank')
    B.box((14.6, .16, -16.2), (17.6, 1.05, -15.5), 'v_plank')
    tinted(B, DARK)
    B.box((14.5, 1.05, -16.3), (17.7, 1.1, -15.4), 'w_grime')
    B.box((14.5, 1.05, -16.3), (15.5, 1.1, -13.3), 'w_grime')
    B.box((14.75, 1.1, -14.6), (15.25, 1.35, -14.1), 'w_grime')
    tinted(B, (.10, .12, .14))
    B.quad(((14.8, 1.38, -14.55), (15.2, 1.38, -14.55), (15.2, 1.6, -14.4), (14.8, 1.6, -14.4)), 'w_glass', (0, .3, -1))
    V.solid('store-counter', 14.5, 15.5, -16.3, -13.3, 1.1)
    V.solid('store-counter-2', 14.5, 17.7, -16.3, -15.4, 1.1)
    # ceiling strip lamps (their diffusers are the light's source)
    for lx in (9.0, 13.0):
        tinted(B, DARK)
        B.box((lx - .9, h - .05, -17.6), (lx + .9, h + .1, -17.2), 'w_steel')
        tinted(B, WHITE)
        B.box((lx - .85, h - .06, -17.55), (lx + .85, h - .05, -17.25), 'v_lamp', faces='b')
    V.group('v_int_store', s0)
    V.lamps.append({'pos': [11.0, 3.2, -17.4], 'color': '#f4e6cf', 'intensity': 70, 'range': 14, 'inside': 'store'})
    V.places.append({'id': 'vesper-store', 'name': 'The store', 'rect': [x0, x1, z0, z1], 'approach': [9.3, -9.0], 'yaw': math.pi, 'where': 'The store on the south side of the village street (enterable; nothing for sale).', 'inside': [11.0, -15.0]})


# ------------------------------------------------------------------ the rest of the village ------------------------------------------------------------------
def dressing(V):
    B = V.B
    # houses: (id, x, z, w, d, face, kind, tint)
    H = [('house-1', -40.0, 16.0, 6.5, 5.0, -1, 'A', OCHRE), ('house-2', -27.0, 15.0, 6.0, 5.0, -1, 'B', CREAM), ('house-3', 13.0, 15.5, 6.0, 5.0, -1, 'A', TEAL),
         ('house-4', 25.0, 16.5, 7.0, 5.5, -1, 'B', SAND), ('house-5', 39.0, 15.0, 6.0, 5.0, -1, 'A', RUST), ('house-6', -38.0, -16.0, 6.5, 5.0, 1, 'B', GREY),
         ('house-7', -24.0, -15.5, 6.0, 5.0, 1, 'A', SAND), ('house-8', -8.0, -17.0, 7.0, 5.5, 1, 'A', OLIVE), ('house-9', 31.0, -16.0, 6.5, 5.0, 1, 'B', OCHRE)]
    for k, (hid, x, z, w, d, face, kind, tint) in enumerate(H):
        house(V, hid, x, z, w, d, face, kind, tint, 100 + k)
    # street lamps, alternating sides, facing the street
    for (x, z) in ((-34.0, 8.0), (-14.0, -8.0), (6.0, 8.0), (22.0, -8.0), (38.0, 8.0)):
        street_lamp(V, x, z, -1 if z > 0 else 1)
    # power poles along the north verge
    for x in (-48.0, -30.0, -12.0, 8.0, 30.0, 48.0):
        power_pole(V, x, -9.6 if x in (-12.0, 30.0) else 9.6)
    s0 = V.mark()
    # water tower on legs behind the houses (north-west)
    tinted(B, GREY)
    tx, tz = -50.0, 28.0
    for (dx, dz) in ((-1.6, -1.6), (1.6, -1.6), (-1.6, 1.6), (1.6, 1.6)):
        B.beam((tx + dx * 1.2, 0, tz + dz * 1.2), (tx + dx * .8, 8.0, tz + dz * .8), .16, .16, 'w_steel')
    for y in (2.6, 5.2):
        for (a, b) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
            f = 1.2 - (y / 8.0) * .4
            B.beam((tx + a[0] * 1.6 * f, y, tz + a[1] * 1.6 * f), (tx + b[0] * 1.6 * f, y, tz + b[1] * 1.6 * f), .08, .08, 'w_steel')
    tinted(B, (.60, .56, .50))
    B.cyl((tx, 8.0, tz), (tx, 11.2, tz), 2.2, 'w_corr', seg=18)
    B.cyl((tx, 11.2, tz), (tx, 12.0, tz), 2.3, 'w_paint', seg=18, r2=.3)
    V.solid('water-tower', tx - 2.3, tx + 2.3, tz - 2.3, tz + 2.3, 12)
    # generator shed with a stack, east end, south side
    tinted(B, OLIVE)
    gx0, gx1, gz0, gz1 = 44.0, 49.0, -24.0, -19.0
    B.box((gx0, 0, gz0), (gx1, 2.6, gz1), 'w_corr')
    tinted(B, DARK)
    B.box((gx0 - .3, 2.6, gz0 - .3), (gx1 + .3, 2.75, gz1 + .3), 'w_steel')
    B.cyl((gx1 - .8, 2.75, gz0 + .8), (gx1 - .8, 4.4, gz0 + .8), .14, 'w_grime', seg=8)
    BV.louvres(B, gx0 + .8, gx0 + 2.4, .8, 2.0, gz1 + .02)
    V.solid('generator-shed', gx0, gx1, gz0, gz1, 2.7)
    # fences around the house yards, barrels, a hand cart, crates by the store's side door
    for (a, b, c, d) in ((-44.0, 20.0, -44.0, 26.0), (-44.0, 26.0, -21.0, 26.0), (9.0, 21.0, 30.0, 21.0), (-43.0, -21.0, -18.0, -21.0), (26.0, -22.0, 36.0, -22.0)):
        fence(V, a, b, c, d)
    barrel_group(V, 5.0, 13.5, 3, 1)
    barrel_group(V, 19.0, -18.0, 4, 2)
    barrel_group(V, -32.0, -20.0, 2, 3)
    for (x, z, t) in ((19.2, -20.6, OLIVE), (19.4, -21.6, GREY), (-14.0, 13.2, OCHRE)):
        crate(B, x, z, tint=t)
    tinted(B, WOOD)
    B.box((-19.0, .55, 10.4), (-17.2, .6, 11.6), 'v_plank')
    tinted(B, DARK)
    B.cyl((-18.8, .35, 10.3), (-18.8, .35, 11.7), .35, 'w_rubber', seg=12)
    B.beam((-17.2, .58, 11.0), (-15.8, .9, 11.0), .05, .05, 'w_steel')
    V.solid('hand-cart', -19.1, -17.1, 10.3, 11.7, 1.0)
    V.group('v_ext_village', s0)


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    os.makedirs(TEXDIR, exist_ok=True)
    vesper_textures.build(TEXDIR)
    BV.corr_texture(TEXDIR)
    plank_texture(TEXDIR)
    V = Village()
    bar(V)
    store(V)
    dressing(V)
    n = V.B.write_objects(os.path.join(OUTDIR, 'vesper-village.glb'), V.groups)
    print('vesper-village.glb faces', n, 'groups', list(V.groups))
    V.zone = {'id': 'village', 'origin': list(ORIGIN), 'area': [-60, 60, -32, 34], 'pad': [-58, 58, -30, 32], 'model': 'assets/models/vesper/vesper-village.glb'}
    import sites_data
    sites_data.update('village', {'zone': V.zone, 'solids': V.solids, 'lamps': V.lamps, 'places': V.places})
    print('solids', len(V.solids), 'lamps', len(V.lamps))


if __name__ == '__main__':
    main()
