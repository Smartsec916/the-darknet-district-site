"""Erebus station surroundings: Meridian (orbital infrastructure), Rusthaven (salvage yard), The Foundry (heavy industry) (docs/development/UNIVERSE_GRAPHICS_TRACKER.md).

    python tools/assets/universe/build_erebus.py [outdir]

Each is a scenery set in the station's own local frame (meridian-station.js: hangar mouths face -z at z=-26, service spine at z 35..45, x -103..114), parented to the station so it follows
docking. They stay behind and beside the hull and clear of the approach (x -30..50, z < -20). Not solid, not pickable. Made by Claude for this project; no third-party assets."""
import math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vcore import Builder  # noqa: E402
from build_vantor import MATS, noise2, AMBER, WHITE, RED, TEAL, TEXTMP  # noqa: E402
import vantor_textures  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUTDIR = os.path.join(REPO, 'void-runner', 'assets', 'models', 'stations')
from vcore import Mat  # noqa: E402
MATS = MATS + [Mat('p_light', color=(.62, .64, .67), rough=.5, metal=.35), Mat('p_rust', color=(.44, .22, .12), rough=.85, metal=.2), Mat('p_scrap', color=(.40, .39, .38), rough=.7, metal=.5), Mat('p_ind', color=(.30, .29, .29), rough=.65, metal=.55)]


def space_builder():
    B = Builder(MATS, slab=1000)

    def light(p, n, self=B):
        ao = .75 + .2 * (.5 + .5 * n[1])
        c = np.array([ao, ao, ao]) * .8
        for pos, rgb, inten, rad in self.lamps:
            d = pos - p
            dist = np.linalg.norm(d)
            if dist > rad * 1.5:
                continue
            c = c + rgb * inten * 2.0 * (max(0.0, np.dot(n, d / (dist + 1e-6))) * .8 + .2) / (1 + (dist / (rad * .4)) ** 2)
        return c
    B.light = light
    return B


def truss(B, a, b, w=2.0, seg=6.0, mat='v_steel', bar=.25):
    a, b = np.array(a, float), np.array(b, float)
    d = b - a
    L = np.linalg.norm(d)
    d /= L
    s = np.cross(d, (0, 1, 0))
    if np.linalg.norm(s) < 1e-6:
        s = np.array([1.0, 0, 0])
    s /= np.linalg.norm(s)
    u = np.cross(s, d)
    corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    n = max(1, int(L / seg))
    for i in range(n + 1):
        p = a + d * L * i / n
        pts = [p + s * cx * w / 2 + u * cy * w / 2 for cx, cy in corners]
        for k in range(4):
            B.beam(pts[k], pts[(k + 1) % 4], bar, bar, mat)
        if i < n:
            q = a + d * L * (i + 1) / n
            qts = [q + s * cx * w / 2 + u * cy * w / 2 for cx, cy in corners]
            for k in range(4):
                B.beam(pts[k], qts[k], bar, bar, mat)
                B.beam(pts[k], qts[(k + 1) % 4], bar * .7, bar * .7, 'trim_dark')


def meridian():
    B = space_builder()
    # orbital ring arc behind the station, lit window bands, spokes to the service spine
    C = np.array([14.0, 18.0, 190.0]); R = 112.0
    for k in range(40):
        a0, a1 = math.radians(-155 + k * 2.0), math.radians(-155 + (k + 1) * 2.0)
        p0 = C + np.array([R * math.sin(a0), 0, -R * math.cos(a0)]); p1 = C + np.array([R * math.sin(a1), 0, -R * math.cos(a1)])
        B.beam(p0 + (0, 6, 0), p1 + (0, 6, 0), 11, 3.2, 'p_light')
        B.beam(p0 + (0, -6, 0), p1 + (0, -6, 0), 11, 3.2, 'p_light')
        B.beam(p0, p1, 12, 9, 'p_scrap' if k % 4 == 0 else 'p_light')
        if k % 2 == 0:
            nrm = (p0 + p1) / 2 - C
            nrm[1] = 0
            nrm /= np.linalg.norm(nrm)
            m = (p0 + p1) / 2
            tang = (p1 - p0) / np.linalg.norm(p1 - p0)
            for r in (-1, 0, 1):
                q = m - nrm * 6.1 + (0, r * 2.4, 0)
                B.beam(q - tang * 1.3, q + tang * 1.3, .2, .8, 'win_amber' if (k + r) % 3 else 'win_white')
        if k % 8 == 0:
            m = (p0 + p1) / 2
            inner = m + (C - m) * 0.0
            B.beam(m, np.array([14 + (m[0] - 14) * .1, 18, 56.0]), 4.0, 4.0, 'p_light')       # spokes to the hull
            B.cyl(m + (0, 9, 0), m + (0, 13, 0), .25, 'trim_dark', 6); B.box(m + (-.5, 13, -.5), m + (.5, 14, .5), 'lamp_red')
    # docking spars: lit gantry arms with berths at the two ends of the hull
    for sx, x0 in ((-1, -108), (1, 118)):
        truss(B, (x0, 4, 16), (x0 + sx * 70, 4, 16), 5.0, 7.0, 'p_light', .4)
        for k in range(4):
            x = x0 + sx * (14 + k * 16)
            B.box((x - 2, 0, 15), (x + 2, 1.2, 33), 'p_scrap')
            B.box((x - 1.8, 1.2, 33), (x + 1.8, 3.6, 34.5), 'v_hazard')
            B.cyl((x, 3, 14), (x, 3, 9), 1.4, 'v_steel', 12)
            for r in range(5):
                B.box((x - .18 + (r - 2) * .7, 1.2, 16 + r * 3), (x + .18 + (r - 2) * .7, 1.35, 17 + r * 3), 'lamp_amber')
            B.lamp((x, 2, 20), AMBER, .8, 16)
    # traffic beacon pylons on a wide circle
    for k in range(10):
        a = math.radians(-60 + k * 14)
        x, z = 14 + 190 * math.sin(a), 40 + 140 * math.cos(a) * -.6 + 60
        B.box((x - .5, -20, z - .5), (x + .5, 25, z + .5), 'p_light')
        B.box((x - 1.5, 25, z - 1.5), (x + 1.5, 28, z + 1.5), 'lamp_white' if k % 2 else 'lamp_red')
    return B


def rusthaven(seed=5):
    B = space_builder()
    rng = np.random.default_rng(seed)
    # a loose yard of hull fragments, scrap towers and gantries with magnet plates, around and behind the hull
    for i in range(34):
        ang = rng.random() * 2 * math.pi
        rr = 90 + rng.random() * 120
        c = np.array([14 + rr * math.cos(ang) * 1.1, -25 + rng.random() * 70, 70 + rr * math.sin(ang) * .9 + 40])
        if c[2] < 20:
            c[2] += 90
        sz = np.array([6 + rng.random() * 16, 3 + rng.random() * 6, 5 + rng.random() * 14])
        # a torn hull section: plated slab, ribs, a ragged edge of bent plates
        B.box(c - sz / 2, c + sz / 2, 'p_rust' if i % 3 else 'p_scrap')
        for k in range(int(sz[0] / 2.5)):
            x = c[0] - sz[0] / 2 + k * 2.5 + 1.0
            B.box((x - .15, c[1] - sz[1] / 2 - .5, c[2] - sz[2] / 2), (x + .15, c[1] + sz[1] / 2 + .5, c[2] + sz[2] / 2), 'p_scrap')
        for k in range(4):
            q = c + np.array([rng.uniform(-sz[0] / 2, sz[0] / 2), sz[1] / 2, rng.uniform(-sz[2] / 2, sz[2] / 2)])
            B.beam(q, q + np.array([rng.uniform(-3, 3), rng.uniform(2, 7), rng.uniform(-3, 3)]), .5, .12, 'p_rust')
        if i % 4 == 0:
            B.box((c[0] - .4, c[1] + sz[1] / 2, c[2] - .4), (c[0] + .4, c[1] + sz[1] / 2 + 2, c[2] + .4), 'v_hazard')
            B.cyl((c[0], c[1] + sz[1] / 2 + 2, c[2]), (c[0], c[1] + sz[1] / 2 + 2.5, c[2]), .3, 'lamp_amber', 8)
    # scrap crane gantries with magnet plates and cable webs from the rear spine
    for k, x in enumerate((-40, 10, 60)):
        truss(B, (x, 4, 48), (x + (k - 1) * 8, 4, 118), 4.0, 6.0, 'p_rust', .35)
        B.cyl((x + (k - 1) * 8, 4, 118), (x + (k - 1) * 8, -10, 118), .12, 'trim_dark', 6)
        B.cyl((x + (k - 1) * 8, -10, 118), (x + (k - 1) * 8, -11.5, 118), 3.2, 'trim_dark', 18)
        B.lamp((x + (k - 1) * 8, 6, 100), AMBER, .8, 30)
        B.box((x + (k - 1) * 8 - .6, 6, 100 - .6), (x + (k - 1) * 8 + .6, 7.2, 100 + .6), 'lamp_amber')
    for k in range(7):
        a = np.array([-80 + k * 30, 6 + k % 3 * 3, 44.0]); b = np.array([-50 + k * 24, -6, 110 + (k % 3) * 14])
        for t in np.linspace(0, 1, 9)[:-1]:
            p0 = a + (b - a) * t + np.array([0, -4 * t * (1 - t) * 6, 0]); p1 = a + (b - a) * (t + .125) + np.array([0, -4 * (t + .125) * (1 - t - .125) * 6, 0])
            B.cyl(p0, p1, .2, 'trim_dark', 6, caps=False)
    return B


def foundry():
    B = space_builder()
    HOT = dict()
    # twin smelter stacks, a cooling radiator bank, a reactor sphere on a gantry, conveyor trusses to the hull
    for sx in (-1, 1):
        x = 14 + sx * 70
        B.cyl((x, -30, 110), (x, 70, 110), 11, 'p_ind', 24, r2=7)
        for k in range(8):
            B.cyl((x, -20 + k * 12, 110), (x, -18.2 + k * 12, 110), 11.6 - k * .45, 'v_hazard' if k % 3 == 0 else 'p_scrap', 24)
        B.cyl((x, 70, 110), (x, 72, 110), 7.4, 'lamp_amber', 24)                                         # the glowing mouth
        B.lamp((x, 74, 110), np.array([1.0, .5, .15]), 2.0, 90)
        B.box((x - 14, -30, 96), (x + 14, 6, 99), 'p_ind')
        for k in range(5):
            B.cyl((x - 20 + k * 9, 8, 120), (x - 20 + k * 9, 52, 120), 1.5, 'v_steel', 10)
        truss(B, (x, 18, 98), (14 + sx * 28, 18, 52), 5.0, 8.0, 'p_scrap', .4)
        B.cyl((x, 24, 98), (14 + sx * 28, 24, 52), 1.6, 'trim_dark', 12, caps=False)
    for k in range(18):                              # radiator fins
        x = -26 + k * 3.6
        B.box((x, -4, 118), (x + .6, 34, 156), 'p_scrap')
        B.box((x + .1, -4, 118), (x + .5, 34, 119), 'lamp_amber' if k % 6 == 0 else 'p_ind')
    B.box((-30, 34, 116), (40, 36, 158), 'trim_dark'); B.box((-30, -6, 116), (40, -4, 158), 'trim_dark')
    # reactor sphere
    C = np.array([14.0, 22.0, 160.0])
    for la in range(10):
        a0, a1 = math.pi * la / 10, math.pi * (la + 1) / 10
        for lo in range(24):
            b0, b1 = 2 * math.pi * lo / 24, 2 * math.pi * (lo + 1) / 24
            r = 17
            P = [C + r * np.array([math.sin(a) * math.cos(b), math.cos(a), math.sin(a) * math.sin(b)]) for a, b in ((a0, b0), (a1, b0), (a1, b1), (a0, b1))]
            B.quad(P, 'p_scrap' if (la + lo) % 5 else 'v_hazard', sum(P) / 4 - C, True)
    B.cyl(C + (0, -17, 0), C + (0, -40, 0), 3, 'trim_dark', 12)
    B.lamp(C + (0, 10, -20), np.array([1.0, .6, .3]), 1.6, 60)
    for k in range(6):
        a = k * math.pi / 3
        B.box(C + (17.2 * math.cos(a) - .8, -1, 17.2 * math.sin(a) - .8), C + (17.2 * math.cos(a) + .8, 1, 17.2 * math.sin(a) + .8), 'lamp_amber')
    return B


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else OUTDIR
    os.makedirs(out, exist_ok=True)
    if not os.path.isdir(TEXTMP):
        vantor_textures.build(TEXTMP)
    for name, fn in (('meridian', meridian), ('rusthaven', rusthaven), ('foundry', foundry)):
        B = fn()
        n = B.write(os.path.join(out, name + '-surroundings.glb'), TEXTMP)
        print(name, 'faces', n, 'KB', os.path.getsize(os.path.join(out, name + '-surroundings.glb')) // 1024)
