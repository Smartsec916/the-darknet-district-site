"""Vantor underground city: arrival cavern and transit concourse (docs/development/UNIVERSE_GRAPHICS_TRACKER.md).

    python tools/assets/universe/build_vantor.py [--textures] [out.glb]

Authored in the game's own coordinates (see vcore.py). The prototype room it dresses (exploration-data.js 'mars-terminal') keeps every collision solid, interaction point,
spawn and the sign positions; this only adds a visible shell: a vaulted rock cavern, steel arches, the pressure bulkhead with its gate, landing-pad infrastructure,
ducts, floodlights, buildings cut into the walls, and the concourse blocks. Light is baked into vertex colours.
Made by Claude for this project; no third-party assets."""
import math, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vcore import Builder, Mat  # noqa: E402
import vantor_textures  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUTDIR = os.path.join(REPO, 'void-runner', 'assets', 'models', 'vantor')
TEXTMP = os.path.join(REPO, 'tools', 'assets', 'universe', '.tex')

AMBER = np.array([1.0, .62, .26]); WHITE = np.array([.80, .90, 1.0]); RED = np.array([1.0, .12, .08]); TEAL = np.array([.2, .9, .8])
rng = np.random.default_rng(7)

MATS = [Mat('v_rock', 'v_rock', 6.0), Mat('v_steel', 'v_steel', 3.0), Mat('v_floor', 'v_floor', 4.0), Mat('v_hazard', 'v_hazard', 2.0),
        Mat('lamp_amber', emissive=(1, .6, .22), strength=1.6), Mat('lamp_white', emissive=(.85, .93, 1), strength=1.5), Mat('lamp_red', emissive=(1, .1, .06), strength=2.2),
        Mat('lamp_teal', emissive=(.2, .9, .8), strength=1.8), Mat('win_amber', emissive=(1, .55, .2), strength=.8), Mat('win_white', emissive=(.75, .88, 1), strength=.8),
        Mat('win_dim', emissive=(.25, .2, .14), strength=.6), Mat('trim_dark', color=(.045, .047, .05), rough=.8, metal=.4)]


def noise2(n, seed, scale, octaves=4):
    """Smooth 2D value noise on an n x n grid, 0..1, built from interpolated random lattices (no wrap needed)."""
    r = np.random.default_rng(seed)
    out = np.zeros((n, n))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        k = max(2, int(scale * 2 ** o))
        lat = r.random((k + 2, k + 2))
        xs = np.linspace(0, k, n)
        i = np.minimum(xs.astype(int), k - 1)
        f = xs - i
        f = f * f * (3 - 2 * f)
        a = lat[i][:, i] * (1 - f)[None, :] * (1 - f)[:, None] + lat[i][:, i + 1] * f[None, :] * (1 - f)[:, None]
        b = lat[i + 1][:, i] * (1 - f)[None, :] * f[:, None] + lat[i + 1][:, i + 1] * f[None, :] * f[:, None]
        out += (a + b) * amp
        tot += amp
        amp *= .5
    out /= tot
    return (out - out.min()) / (out.max() - out.min())


def build():
    B = Builder(MATS)
    Z0, Z1 = -34.0, 34.0
    BULK = -6.0

    # ------------------------------------------------------------------ rock shell (cross-section curve swept along z)
    NS, NZ = 72, 150
    zs = np.linspace(Z0, Z1, NZ)
    nA, nB = noise2(256, 1, 5), noise2(256, 2, 14)

    def samp(a, u, v):
        i = np.clip(((v - Z0) / (Z1 - Z0) * 255), 0, 255).astype(int)
        j = np.clip((u * 255), 0, 255).astype(int)
        return a[i, j]

    def profile(z):
        """Half-width and apex height of the cavern at z: grand arrival cavern before the bulkhead, a lower city vault after it."""
        t = np.clip((z - BULK) / 6.0, 0, 1)
        t = t * t * (3 - 2 * t)
        return 31 * (1 - t) + 25 * t, 27 * (1 - t) + 22.0 * t, 7.0 * (1 - t) + 6.0 * t

    P = np.zeros((NS, NZ, 3))
    for k, z in enumerate(zs):
        W, H, HW = profile(z)
        for i in range(NS):
            s = i / (NS - 1)
            # s: 0 left floor rock edge -> up the wall -> across the vault -> right wall -> 1 right floor
            if s < .12:
                x, y, nx, ny = -W, -9 + (s / .12) * (HW + 9), 1, 0
            elif s > .88:
                x, y, nx, ny = W, HW + ((1 - s) / .12) * (-HW - 9) * -1 - 0, -1, 0
                y = -9 + ((1 - s) / .12) * (HW + 9)
            else:
                th = math.pi * (s - .12) / .76
                x, y = -W * math.cos(th), HW + (H - HW) * math.sin(th)
                nx, ny = math.cos(th) / W * 1.0, -math.sin(th) / (H - HW)
                l = math.hypot(nx, ny)
                nx, ny = nx / l, ny / l
            u = s
            d = (samp(nA, np.array([u]), np.array([z]))[0] - .5) * 4.6 + (samp(nB, np.array([u]), np.array([z]))[0] - .5) * 1.5
            # strata ledges: the rock steps in horizontal terraces
            d += .6 * math.sin(y * .9 + 1.7 * samp(nA, np.array([u]), np.array([z]))[0] * 6)
            P[i, k] = (x + nx * d, y + ny * d, z)
    B.grid(P, 'v_rock', lambda c: (-c[0], -(c[1] - 8), 0) if False else (-c[0] * .02, -(c[1] - 9) * .04 + .0, 0))
    # end caps: rock faces behind the pad and beyond the concourse, with the landing-bay gate cut into the first
    for zend, sgn in ((Z0, 1), (Z1, -1)):
        W, H, HW = profile(zend)
        G = np.zeros((40, 30, 3))
        for a in range(40):
            for b in range(30):
                xx = -W + 2 * W * a / 39
                top = HW + (H - HW) * math.sqrt(max(0, 1 - (xx / W) ** 2))
                yy = -9 + (top + 9) * b / 29
                dd = nA[int(b / 29 * 255), int(a / 39 * 255)] * 3
                G[a, b] = (xx, yy, zend - sgn * dd)
        B.grid(G, 'v_rock', lambda c, s=sgn: (0, 0, -s))

    # ------------------------------------------------------------------ floor and retaining walls
    FX = 16.4
    B.box((-FX, -.6, Z0), (FX, 0, Z1), 'v_floor')
    # raised sub-floor service trenches (grated) along both edges, drain gutters
    for sx in (-1, 1):
        B.box((sx * FX - .5 * (sx == 1) - .5 * (sx == -1) - 0, -9, Z0), (sx * FX + (.5 if sx == 1 else -.5) * 0 + (0), 1.1, Z0 + .01), 'trim_dark') if False else None
    for sx in (-1, 1):
        # retaining wall from the lower city level up to a parapet
        xa, xb = sorted((sx * FX, sx * (FX + .9)))
        B.box((xa, -9, Z0), (xb, 1.05, Z1), 'v_steel')
        B.box((xa - .15 * sx * 0, 1.05, Z0), (xb, 1.18, Z1), 'trim_dark')
        # railing posts and rail
        for z in np.arange(Z0 + 1, Z1, 2.0):
            B.box((sx * FX - .06, 1.18, z - .05), (sx * FX + .06, 2.2, z + .05), 'v_steel')
        B.beam((sx * FX, 2.15, Z0), (sx * FX, 2.15, Z1), .12, .1, 'v_steel')
        B.beam((sx * FX, 1.7, Z0), (sx * FX, 1.7, Z1), .06, .06, 'v_steel')
    # hazard edge stripe on the deck along the retaining walls
    for sx in (-1, 1):
        B.box((sx * (FX - .8) - .0, .005, Z0), (sx * (FX - .35), .015, Z1), 'v_hazard')

    # ------------------------------------------------------------------ lower city level (pit) with machinery and stacked buildings on the rock
    def building(xc, y0, z0, z1, depth, floors, face, seed):
        """A block built against the rock: floors of dark cladding with rows of lit windows facing the cavern (face = -1 faces -x, +1 faces +x)."""
        r = np.random.default_rng(seed)
        fh = 3.4
        for f in range(floors):
            ya, yb = y0 + f * fh, y0 + (f + 1) * fh
            inset = (r.random() * .8) * (f % 2)
            x0, x1 = (xc - face * depth - face * 0, xc)
            lo, hi = (min(x0, x1), max(x0, x1))
            B.box((lo, ya, z0), (hi, yb - .1, z1), 'v_steel')
            B.box((lo, yb - .1, z0 - .3), (hi + (.0), yb + .05, z1 + .3), 'trim_dark')
            # windows
            fx = xc + face * 0.02
            n = int((z1 - z0) / 1.8)
            for w in range(n):
                zc = z0 + .9 + w * 1.8 + r.random() * .3
                m = r.random()
                mat = 'win_amber' if m < .38 else 'win_white' if m < .62 else 'win_dim'
                if r.random() < .08:
                    mat = 'lamp_red'
                xa, xb = (fx, fx + face * .08) if face > 0 else (fx - .08, fx)
                B.box((min(xa, xb), ya + 1.0, zc - .55), (max(xa, xb), ya + 2.2, zc + .55), mat)
            # a balcony walkway with a rail on every second floor
            if f % 2 == 0:
                xa, xb = (xc, xc + face * 1.3) if face > 0 else (xc - 1.3, xc)
                B.box((min(xa, xb), ya + .05, z0), (max(xa, xb), ya + .2, z1), 'v_floor')
                B.beam((xc + face * 1.25, ya + 1.15, z0), (xc + face * 1.25, ya + 1.15, z1), .06, .06, 'v_steel')
        # roof machinery
        top = y0 + floors * fh
        for k in range(2):
            zc = z0 + (z1 - z0) * (.3 + .4 * k)
            B.box((xc - face * 2.4, top, zc - .9), (xc - face * .8, top + 1.3, zc + .9), 'v_steel')
            B.cyl((xc - face * 1.6, top + 1.3, zc), (xc - face * 1.6, top + 2.0, zc), .55, 'trim_dark', 10)

    for sx in (-1, 1):
        xe = sx * 25.6
        zspan = [(Z0 + 3, Z0 + 14), (Z0 + 17, BULK - 3.5)]
        for zi, (za, zb) in enumerate(zspan):
            building(xe, -8.0 + 2.0 * (zi % 2), za, zb, 6.0, 6 + zi, -sx, 100 + zi * 3 + int(sx > 0))
        # pit floor and cargo stacks
        B.box((sx * 17.3 if sx > 0 else -26.6, -9, Z0), (26.6 if sx > 0 else -17.3, -8.2, BULK - 1), 'v_floor')
        for k in range(6):
            zc = Z0 + 5 + k * 4.2
            xc = sx * (19.3 + (k % 2) * 3.0)
            B.box((xc - 1.5, -8.2, zc - 1.0), (xc + 1.5, -5.7, zc + 1.0), 'v_hazard' if k % 3 == 0 else 'v_steel')
        # concourse side: stacked housing and shops cut into the walls (further out, lit)
        for zi, (za, zb) in enumerate(((BULK + 4, BULK + 18), (BULK + 21, BULK + 36), (BULK + 12, BULK + 30))):
            lay = zi == 2
            building(sx * (21.0 if not lay else 22.4), -3.0 if not lay else 8.0, za, zb, 5.0 if not lay else 4, 5 if not lay else 3, -sx, 200 + zi * 5 + int(sx > 0))

    # ------------------------------------------------------------------ steel arches (the vault is carried by massive ribs)
    def arch(z, depth=1.1, thick=1.3):
        W, H, HW = profile(z)
        W -= 1.0; H -= 1.2; HW -= .1
        pts = []
        for i in range(0, 41):
            th = math.pi * i / 40
            pts.append((-W * math.cos(th), HW + (H - HW) * math.sin(th)))
        for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
            tx, ty = x1 - x0, y1 - y0
            l = math.hypot(tx, ty)
            nxx, nyy = -ty / l, tx / l
            B.beam((x0, y0, z), (x1, y1, z), depth, thick, 'v_steel', up=(nxx, nyy, 0))
            # flange plates
            B.beam((x0, y0, z), (x1, y1, z), depth + .5, .12, 'trim_dark', up=(nxx, nyy, 0))
        for sx in (-1, 1):
            B.box((sx * W - .9, -9, z - depth / 2), (sx * W + .9, HW, z + depth / 2), 'v_steel')
        # bolt rows at the crown
        for th in np.linspace(.1, math.pi - .1, 18):
            x, y = -W * math.cos(th), HW + (H - HW) * math.sin(th)
            B.box((x - .1, y - .1, z - depth / 2 - .05), (x + .1, y + .1, z + depth / 2 + .05), 'trim_dark')

    arch_zs = [-30, -22, -14, -6.0 + 0, 2, 10, 18, 26, 33]
    for z in arch_zs:
        arch(z)

    # ------------------------------------------------------------------ pressure bulkhead with the gate
    zb0, zb1 = -7.5, -4.5
    W, H, HW = profile(BULK - .2)
    gate_half, gate_h = 5.0, 6.4
    for sx in (-1, 1):
        B.box((min(sx * gate_half, sx * (W + 1)), 0, zb0), (max(sx * gate_half, sx * (W + 1)), 11.5, zb1), 'v_steel')
        # hazard border down the gate edge
        B.box((sx * gate_half - (0 if sx < 0 else .55) * 1 if False else min(sx * gate_half, sx * (gate_half + .55)), 0, zb0 - .05), (max(sx * gate_half, sx * (gate_half + .55)), gate_h, zb0), 'v_hazard')
        # big sliding door leaves, drawn open and tucked into the wall
        B.box((min(sx * (gate_half + 1.0), sx * (gate_half + 5.0)), .2, zb0 - .6), (max(sx * (gate_half + 1.0), sx * (gate_half + 5.0)), gate_h - .2, zb0 - .1), 'v_steel')
    B.box((-gate_half - .2, gate_h, zb0), (gate_half + .2, 11.5, zb1), 'v_steel')
    B.box((-gate_half - .2, gate_h - .5, zb0 - .35), (gate_half + .2, gate_h, zb0), 'v_hazard')
    B.box((-gate_half, 0, zb0), (gate_half, .08, zb1), 'v_hazard')
    for sx in (-1, 1):
        for k in range(1, 6):
            xr = sx * (gate_half + 1.6 + k * 2.4)
            if abs(xr) < W:
                B.box((xr - .22, 0, zb0 - .35), (xr + .22, 11.5, zb0), 'v_steel')
        for yb in (3.0, 6.0, 9.0):
            B.box((min(sx * (gate_half + .6), sx * (W)), yb, zb0 - .15), (max(sx * (gate_half + .6), sx * (W)), yb + .25, zb0), 'trim_dark')
        for k in range(3):
            B.box((sx * (gate_half + 3.5 + k * 3.8) - .8, 1.0, zb0 - .2), (sx * (gate_half + 3.5 + k * 3.8) + .8, 2.6, zb0), 'v_hazard')
    for x in (-8, -3.5, 3.5, 8):
        B.lamp((x, 9.5, zb0 - 2.5), AMBER, 1.1, 14)
        B.box((x - .5, 10.2, zb0 - .9), (x + .5, 10.6, zb0 - .3), 'lamp_amber')
    # lamps and status lights on the gate; the PRESSURE CONTROL sign (game code) hangs at y=4 on this wall
    for sx in (-1, 1):
        for k in range(4):
            B.box((sx * (gate_half + .15) - .1, 1.0 + k * 1.3, zb0 - .12), (sx * (gate_half + .15) + .1, 1.2 + k * 1.3, zb0), 'lamp_red' if k == 3 else 'lamp_amber')
        B.lamp((sx * (gate_half + .3), 4.0, zb0 - 1.5), AMBER, .9, 9)
    # the pad side of the bulkhead above the gate: lintel with the 'landing control' window, lit teal
    B.box((-4.4, 9.0, zb0 - .2), (4.4, 9.5, zb0), 'lamp_teal')
    B.box((-4.5, 8.8, zb0 - .1), (4.5, 8.95, zb0 + .05), 'trim_dark')
    B.box((-W - 1, 11.5, zb0 - .4), (W + 1, 12.1, zb1 + .4), 'v_hazard')
    for k in range(-5, 6):
        B.box((k * 5.2 - .5, 12.1, zb0 - .3), (k * 5.2 + .5, 12.4, zb0 + .3), 'lamp_amber' if k % 2 else 'lamp_white')

    # ------------------------------------------------------------------ landing pads and apron
    def pad(cx, cz, r, n_lamps=14, active=True):
        B.cyl((cx, 0, cz), (cx, .32, cz), r, 'v_floor', 40)
        B.cyl((cx, .32, cz), (cx, .34, cz), r - .5, 'v_hazard', 40, caps=True)
        B.cyl((cx, .34, cz), (cx, .38, cz), r - 1.7, 'v_floor', 40)
        for i in range(n_lamps):
            a = 2 * math.pi * i / n_lamps
            x, z = cx + (r - .95) * math.cos(a), cz + (r - .95) * math.sin(a)
            B.box((x - .16, .34, z - .16), (x + .16, .42, z + .16), 'lamp_amber' if active else 'lamp_red')
            B.lamp((x, .8, z), AMBER if active else RED, .22, 7)
    pad(-7, -24, 8.2)
    pad(9.5, -20, 6.0, 10, False)

    # floodlight towers
    def tower(x, z, h=14.0, face=(0, 0, 1)):
        import build_floodlight           # the lattice floodlight tower (the Blender candidate of the Blender-vs-Meshy test)
        build_floodlight.build(H=h, B=B, ox=x, oz=z)
        B.lamp((x, h - 1, z + 1.5), WHITE, 1.2, 20)
        B.lamp((x, 6, z), WHITE, .5, 14)
    tower(-13.0, -31.5, 15); tower(13.5, -31.5, 15); tower(-15.2, -12.5, 12); tower(15.2, -12.5, 12)

    # landing bay gate cut into the end rock: massive steel doors and gantry
    B.box((-11, 0, Z0 + .3), (11, 12.5, Z0 + 1.4), 'v_steel')
    B.box((-11.4, 12.5, Z0 + .1), (11.4, 13.6, Z0 + 1.8), 'v_hazard')
    for sx in (-1, 1):
        B.box((sx * 11.0 - .6 + (.6 if sx > 0 else 0), 0, Z0 + .1), (sx * 11.0 + .6 + (.6 if sx > 0 else 0), 13.6, Z0 + 1.8), 'v_steel')
    for k in range(5):
        B.box((-9 + k * 4.5 - .12, .8, Z0 + 1.4), (-9 + k * 4.5 + .12, 11.8, Z0 + 1.5), 'trim_dark')
    for k in range(7):
        B.box((-9.6 + k * 3.2, 14.2, Z0 + 1.45), (-8.6 + k * 3.2, 14.5, Z0 + 1.8), 'lamp_amber' if k % 2 else 'lamp_white')
    B.lamp((0, 10, Z0 + 4), AMBER, .9, 20)

    # gantry bridges across the cavern at two levels with observation platforms
    def bridge(z, y, w=1.8):
        x0, x1 = -FX - 1.2, FX + 1.2
        B.box((x0, y, z - w / 2), (x1, y + .22, z + w / 2), 'v_floor')
        B.box((x0, y - .6, z - .12), (x1, y, z + .12), 'v_steel'); B.box((x0, y - .6, z + w / 2 - .12), (x1, y, z + w / 2), 'v_steel')
        for zz in (z - w / 2 + .06, z + w / 2 - .06):
            B.beam((x0, y + 1.1, zz), (x1, y + 1.1, zz), .08, .08, 'v_steel')
            for x in np.arange(x0, x1 + .01, 2.5):
                B.box((x - .04, y + .22, zz - .04), (x + .04, y + 1.1, zz + .04), 'v_steel')
        for x in (-8, 0, 8):
            B.box((x - .15, y + .22 + 2.5, z - .15), (x + .15, y + .22 + 2.5 + 2, z + .15), 'v_steel') if False else None
            B.lamp((x, y - .3, z), WHITE, .35, 8)
            B.box((x - .5, y - .75, z - .12), (x + .5, y - .6, z + .12), 'lamp_white')
    bridge(-17.0, 11.0)
    bridge(-27.0, 8.0)
    # observation platform over the pad: a lit glazed cabin on the far wall
    B.box((-4, 8.0, Z0 + 1.6), (4, 11.5, Z0 + 4.5), 'v_steel')
    B.box((-3.6, 8.9, Z0 + 4.5), (3.6, 10.4, Z0 + 4.6), 'win_white')

    # ------------------------------------------------------------------ overhead services: ducts, pipes, cable trays, pendant lamps
    for sx in (-1, 1):
        for zrun in ((Z0 + 2, BULK - 1.0), (BULK + 1.0, Z1 - 1)):
            ya = 17.0 if zrun[0] < BULK else 11.2
            xa = sx * (9.0 if zrun[0] < BULK else 6.5)
            B.cyl((xa, ya, zrun[0]), (xa, ya, zrun[1]), 1.15, 'v_steel', 14)
            n = int((zrun[1] - zrun[0]) / 3.0)
            for k in range(n + 1):
                z = zrun[0] + k * 3.0
                B.cyl((xa, ya, z - .12), (xa, ya, z + .12), 1.27, 'trim_dark', 14)
            # hanger rods
            for k in range(0, n, 2):
                z = zrun[0] + k * 3.0 + 1.5
                B.box((xa - .05, ya + 1.15, z - .05), (xa + .05, ya + 5.0, z + .05), 'trim_dark')
        # pipe bundle along the retaining wall, low
        for k, r in enumerate((.3, .22, .16)):
            B.cyl((sx * (FX + .5 - .0), 3.5 + k * .8, Z0 + 1), (sx * (FX + .5), 3.5 + k * .8, BULK - 2), r, 'v_steel', 10)
    # cable trays under the arches
    for z in arch_zs[:-1]:
        W, H, HW = profile(z)
        B.box((-4, H - 2.6, z - .8), (4, H - 2.45, z + .8), 'trim_dark')
    # pendant industrial lamps
    def pendant(x, y, z, mat='lamp_amber', rgb=AMBER, inten=1.1, rad=16):
        B.cyl((x, y + 3.0, z), (x, y + .5, z), .03, 'trim_dark', 5)
        B.cyl((x, y + .5, z), (x, y, z), .8, 'trim_dark', 12, r2=.35)
        B.cyl((x, y, z), (x, y - .06, z), .62, mat, 12)
        B.lamp((x, y - .6, z), rgb, inten, rad)
    for k, z in enumerate((-27, -17.5, -11, -1.0, 6, 14, 22, 29)):
        for sx in (-1, 1):
            if z < BULK:
                pendant(sx * 7.5, 12.5 if z < -20 else 13.5, z, 'lamp_amber' if (k + (sx > 0)) % 2 == 0 else 'lamp_white', AMBER if (k + (sx > 0)) % 2 == 0 else WHITE, 1.0, 17)
            else:
                pendant(sx * 4.2, 8.0, z, 'lamp_white' if sx > 0 else 'lamp_amber', WHITE if sx > 0 else AMBER, .85, 12)
    pendant(0, 16, -10, 'lamp_white', WHITE, .8, 20)

    # ------------------------------------------------------------------ concourse blocks (visual only; the collision solids are unchanged)
    # left: transit and shops, x -13.5..-6.5, z 9..23, 4 m high.   right: industry, x 7.5..14.5, z 9..23, 6 m high.
    def shopblock():
        B.box((-13.5, 0, 9), (-6.5, 4.0, 23), 'v_steel')
        B.box((-13.7, 4.0, 8.8), (-6.3, 4.25, 23.2), 'trim_dark')
        zs = np.arange(10, 22.5, 3.0)
        for i, z in enumerate(zs):
            mat = 'win_white' if i % 2 == 0 else 'win_amber'
            B.box((-6.56, .5, z - .05), (-6.44, 3.1, z + 2.45), 'trim_dark')
            for pz in range(3):
                B.box((-6.46, .62, z + .08 + pz * .76), (-6.40, 2.98, z + .78 + pz * .76), mat)
            B.box((-6.52, 1.0, z + .1), (-6.3, 1.12, z + 2.3), 'v_steel')   # counter ledge
            B.box((-6.5, .25, z - .1), (-6.2, .45, z + 2.5), 'v_steel')       # sills
            B.box((-6.5, 3.05, z - .1), (-5.8, 3.2, z + 2.5), 'trim_dark')    # awning
            B.lamp((-5.6, 2.8, z + 1.2), WHITE if i % 2 == 0 else AMBER, .45, 6)
        B.box((-6.6, 3.4, 9.2), (-6.4, 3.7, 22.8), 'lamp_amber')
        for k in range(5):
            B.box((-6.62, 3.45, 10 + k * 2.9), (-6.38, 3.65, 11.6 + k * 2.9), 'lamp_white')
        B.lamp((-10, 6, 16), WHITE, .35, 10)
        # kiosk row on the roof (rooftop plant) and a vent stack
        for k in range(3):
            B.box((-12.5 + k * 2.2, 4.25, 12 + k * 3), (-11.2 + k * 2.2, 5.5, 13.4 + k * 3), 'v_steel')
            B.cyl((-11.8 + k * 2.2, 5.5, 12.7 + k * 3), (-11.8 + k * 2.2, 6.4, 12.7 + k * 3), .5, 'trim_dark', 10)

    def industryblock():
        B.box((7.5, 0, 9), (14.5, 6.0, 23), 'v_steel')
        for k in range(8):
            B.box((7.45, .0, 9 + k * 1.8), (7.55, 6.0, 9.12 + k * 1.8), 'trim_dark')
        B.box((7.4, 0, 12.5), (7.55, 4.4, 16.3), 'v_hazard')            # roller shutter bay
        B.box((7.35, 4.4, 12.4), (7.6, 4.6, 16.4), 'lamp_amber')
        for k in range(4):
            B.cyl((7.0, 5.2 - k * .45, 9.4 + k * 3.2), (14.4, 5.2 - k * .45, 9.4 + k * 3.2), .28, 'v_steel', 10)
        B.cyl((10.5, 6.0, 20), (10.5, 9.5, 20), 1.4, 'v_steel', 16)
        B.cyl((10.5, 9.5, 20), (10.5, 9.9, 20), 1.0, 'trim_dark', 16)
        B.box((7.6, 4.8, 18), (8.8, 5.6, 21), 'win_amber')
        B.lamp((7.0, 5.0, 17), AMBER, .6, 9)
    shopblock(); industryblock()
    # terminal gantry: the transit concourse end, a lit portal framing the terminal at z=21..26
    B.box((-4.6, 0, 27.0), (-3.6, 9.0, 28.0), 'v_steel'); B.box((3.6, 0, 27.0), (4.6, 9.0, 28.0), 'v_steel')
    B.box((-4.6, 9.0, 27.0), (4.6, 10.0, 28.0), 'v_steel')
    B.box((-3.5, 8.1, 27.1), (3.5, 8.8, 27.4), 'lamp_teal')
    B.lamp((0, 7, 25), WHITE, .7, 12); B.lamp((0, 5, 12), AMBER, .5, 12)

    # ------------------------------------------------------------------ rock formations: stalactites off the vault, buttresses off the walls
    def rockcone(cx, cy, cz, length, r, up, seed):
        """A noisy tapering rock spire from (cx,cy,cz) along y (up=-1 hangs down, +1 rises)."""
        rr = np.random.default_rng(seed)
        nu, nv = 14, 8
        G = np.zeros((nv, nu + 1, 3))
        ph = rr.random(4) * 6
        for j in range(nv):
            t = j / (nv - 1)
            rad = r * (1 - t) ** .85 * (1 + .18 * math.sin(t * 9 + ph[0]))
            rad = max(rad, .02)
            for i in range(nu + 1):
                a = 2 * math.pi * (i % nu) / nu
                w = 1 + .22 * math.sin(a * 3 + ph[1]) + .12 * math.sin(a * 5 + t * 7 + ph[2])
                G[j, i] = (cx + math.cos(a) * rad * w, cy + up * length * t, cz + math.sin(a) * rad * w)
        B.grid(G, 'v_rock', lambda c: (c[0] - cx, 0, c[2] - cz))
    k = 0
    for z in np.arange(Z0 + 3, Z1 - 2, 4.3):
        for sx in (-1, 1):
            k += 1
            W, H, HW = profile(z)
            x = sx * (6 + (k * 7.3 % 15))
            top = HW + (H - HW) * math.sqrt(max(0, 1 - (x / W) ** 2)) - 1.0
            if abs(x) < 9 and z > BULK - 8 and z < BULK + 3:
                continue
            rockcone(x, top, z, 2.5 + (k * 3.7 % 4.5), .5 + (k * 1.3 % .9), -1, k)
    for z in np.arange(Z0 + 5, Z1 - 3, 7.1):
        for sx in (-1, 1):
            k += 1
            W, H, HW = profile(z)
            rockcone(sx * (W - 3.0 - (k % 3)), -9.0, z, 12 + (k * 5.1 % 9), 2.6 + (k % 3), 1, k + 50)

    # ------------------------------------------------------------------ the city beyond: layered lit facades at the far end, seen over the bulkhead and down the concourse
    r2 = np.random.default_rng(55)
    for layer, (zf, wspan, hmax, strength) in enumerate(((33.4, 22, 22, 1.0), (31.0, 17, 17, .8))):
        xcur = -wspan
        while xcur < wspan:
            bw = 2.5 + r2.random() * 4
            bh = 5 + r2.random() * (hmax - 5)
            B.box((xcur, -3, zf - 1.5 - layer * 1.0), (xcur + bw, bh, zf - .2 - layer * 1.0), 'v_steel')
            for fy in np.arange(1.0, bh - .5, 2.4):
                n = int(bw / 1.3)
                for w in range(max(1, n)):
                    if r2.random() < .72:
                        m = r2.random()
                        mat = 'win_amber' if m < .45 else 'win_white' if m < .8 else 'win_dim'
                        wx = xcur + .35 + w * (bw - .5) / max(1, n)
                        B.box((wx, fy, zf - 1.62 - layer * 1.0), (wx + .65, fy + 1.0, zf - 1.48 - layer * 1.0), mat)
            xcur += bw + .2 + r2.random() * .6
    B.lamp((0, 10, Z1 - 3), AMBER, .6, 24)
    for z in (4, 14, 24):
        for sx in (-1, 1):
            B.lamp((sx * 14, 7, z), AMBER if sx > 0 else WHITE, .5, 14)

    # ------------------------------------------------------------------ batch 4: wall fans, signs, residential fittings, lifts, transit boards (rotors, steam, drips and cabs are added by vantor.js)
    for fx in (-9.5, 9.5):       # fan housings on the pad side of the bulkhead (rotors animate in the game)
        B.cyl((fx, 7.5, zb0 - .35), (fx, 7.5, zb0 - .05), 2.2, 'v_steel', 24)
        B.cyl((fx, 7.5, zb0 - .6), (fx, 7.5, zb0 - .3), 1.95, 'trim_dark', 24)
        B.cyl((fx, 7.5, zb0 - .55), (fx, 7.5, zb0 - .5), 1.5, 'trim_dark', 24, r2=1.5)
        for k in range(4):
            a = k * math.pi / 2
            B.beam((fx, 7.5, zb0 - .7), (fx + 1.9 * math.cos(a), 7.5 + 1.9 * math.sin(a), zb0 - .7), .09, .09, 'v_steel')
        B.box((fx - .3, 7.5 - 2.9, zb0 - .7), (fx + .3, 7.5 - 2.2, zb0 - .35), 'v_hazard')
        B.lamp((fx, 7.5, zb0 - 2.0), WHITE, .35, 8)
    # blade signs on the shop block (teal, amber, white boards hung off the facade)
    for k, (z, mat) in enumerate(((10.6, 'lamp_teal'), (13.7, 'lamp_amber'), (16.8, 'lamp_white'), (19.9, 'lamp_amber'))):
        B.box((-6.5, 3.55, z + .5), (-5.5, 5.0, z + .62), 'trim_dark')
        B.box((-6.46, 3.65, z + .46), (-5.56, 4.9, z + .5), mat)
        B.beam((-6.5, 4.8, z + .56), (-6.1, 4.8, z + .56), .06, .06, 'v_steel')
    # noodle bar at the north end of the shop block: deep awning, steam stack, lit counter
    B.box((-6.5, 2.75, 19.2), (-4.9, 2.9, 22.9), 'v_hazard')
    B.box((-6.45, .95, 19.4), (-6.1, 1.15, 22.7), 'v_steel')
    for k in range(3):
        B.cyl((-6.25, 1.15, 19.8 + k * 1.1), (-6.25, 1.35, 19.8 + k * 1.1), .26, 'trim_dark', 10)
    B.box((-12.9, 4.25, 21), (-12.4, 7.2, 21.5), 'v_steel')
    # rooftop plant on the shop block: water tank and air units
    B.cyl((-9.8, 4.25, 21.5), (-9.8, 6.0, 21.5), 1.3, 'v_steel', 18)
    B.cyl((-9.8, 6.0, 21.5), (-9.8, 6.15, 21.5), 1.35, 'v_hazard', 18)
    for k in range(3):
        B.box((-12.0 + k * 2.0, 4.25, 10.0), (-10.8 + k * 2.0, 5.2, 11.4), 'trim_dark')
        B.box((-11.9 + k * 2.0, 5.2, 10.1), (-10.9 + k * 2.0, 5.28, 11.3), 'lamp_amber' if k == 1 else 'v_hazard')
    # industry block: stacked cargo crates on the roof, a loading arm, a hazard-marked gate, a wall board
    for k in range(5):
        B.box((8.2 + (k % 3) * 2.1, 6.0 + (k // 3) * 1.6, 10 + (k % 2) * 2.4), (9.8 + (k % 3) * 2.1, 7.6 + (k // 3) * 1.6, 11.7 + (k % 2) * 2.4), 'v_steel' if k % 2 else 'v_hazard')
    B.beam((7.4, 5.9, 18.2), (5.2, 5.0, 19.6), .22, .22, 'v_steel')
    B.box((7.38, 1.0, 20.2), (7.44, 3.4, 22.4), 'trim_dark')
    B.box((7.34, 1.3, 20.3), (7.4, 3.1, 22.3), 'win_dim')
    B.box((7.3, 3.5, 17.0), (7.4, 4.1, 20.4), 'lamp_amber')
    # elevators: lit shafts up the cavern walls (cabs move in the game)
    for sx in (-1, 1):
        x = sx * 27.6
        B.box((x - 1.5, -9, -4.6 - 1.5), (x + 1.5, 25, -4.6 - 1.2), 'v_steel')
        B.box((x - 1.5, -9, -4.6 + 1.2), (x + 1.5, 25, -4.6 + 1.5), 'v_steel')
        for yy in range(-8, 25, 8):
            B.box((x - 1.7, yy, -4.6 - 1.6), (x + 1.7, yy + .25, -4.6 + 1.6), 'trim_dark')
            B.box((x - .9, yy + .35, -4.6 - 1.65), (x + .9, yy + .5, -4.6 - 1.62), 'lamp_amber')
    # transit board gantry across the concourse (departures)
    B.box((-14.4, 0, 1.6), (-13.8, 8.6, 2.2), 'v_steel'); B.box((13.8, 0, 1.6), (14.4, 8.6, 2.2), 'v_steel')
    B.box((-14.4, 8.0, 1.5), (14.4, 8.7, 2.3), 'trim_dark')
    for k in range(6):
        x0 = -12 + k * 4.2
        B.box((x0, 8.7, 1.6), (x0 + 3.4, 9.7, 1.75), 'trim_dark')
        B.box((x0 + .1, 8.8, 1.57), (x0 + 3.3, 9.6, 1.6), 'lamp_teal' if k % 2 == 0 else 'win_white')
        for r in range(3):
            B.box((x0 + .3, 9.0 + r * .25, 1.54), (x0 + 3.0 - (r % 2) * .8, 9.12 + r * .25, 1.57), 'trim_dark')
    B.lamp((0, 8.5, 0.5), np.array([.5, .85, .8]), .5, 12)
    # residential detail on every stacked building: air units, laundry lines, door lamps
    for sx in (-1, 1):
        for zi, (za, zb_) in enumerate(((Z0 + 3, Z0 + 14), (Z0 + 17, BULK - 3.5))):
            xe = sx * 25.6 - sx * 0.05
            rr = np.random.default_rng(300 + zi + (3 if sx > 0 else 0))
            for f in range(7):
                ya = -8.0 + 2.0 * (zi % 2) + f * 3.4
                for k in range(3):
                    z = za + 1.2 + rr.random() * (zb_ - za - 2.4)
                    xa, xb = (xe - sx * 1.3 - .0, xe) if False else (xe, xe - sx * .9)
                    B.box((min(xa, xb), ya + .4, z - .4), (max(xa, xb), ya + 1.2, z + .4), 'trim_dark')
                    B.box((min(xa, xb) - (0 if sx > 0 else 0), ya + .5, z - .3), (max(xa, xb), ya + .6, z + .3), 'v_steel')
                if f % 2 == 0:
                    zz = za + 1.0 + rr.random() * 3
                    B.beam((xe - sx * 1.2, ya + 2.1, zz), (xe - sx * 1.2, ya + 2.3, zz + 4.5), .02, .02, 'trim_dark')
                    for q in range(5):
                        B.box((xe - sx * 1.22 - .02, ya + 1.5, zz + .4 + q * .85), (xe - sx * 1.22 + .02, ya + 2.1, zz + .8 + q * .85), ['win_white', 'v_hazard', 'b_teal' if False else 'win_amber', 'v_steel', 'win_dim'][q % 5])
    B.lamp((0, 3, 28), AMBER, .4, 10)

    # red emergency lamps: on the arches either side of the gate and over the pad
    for z in (-6.0, -14.0):
        for sx in (-1, 1):
            B.box((sx * 14.9 - .15, 4.9, z - .2), (sx * 14.9 + .15, 5.25, z + .2), 'lamp_red')
            B.lamp((sx * 14.9, 5.0, z), RED, .38, 7)

    # general fill lamps so no part of the walkable floor is black
    for z in range(-30, 32, 6):
        B.lamp((0, 2.5, z), np.array([.8, .75, .65]), .45, 12)
    return B


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--textures' in sys.argv or not os.path.isdir(TEXTMP):
        vantor_textures.build(TEXTMP)
    out = args[0] if args else os.path.join(OUTDIR, 'vantor-cavern.glb')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    B = build()
    n = B.write(out, TEXTMP)
    print('faces', n, 'lamps', len(B.lamps), 'size KB', os.path.getsize(out) // 1024)
