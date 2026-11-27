"""Low Quay berth terminal: a small computer on a weathered steel post (docs/development/UNIVERSE_GRAPHICS_TRACKER.md, Low Quay).

    python tools/assets/universe/build_quay_terminal.py [out.glb]

One prop, instanced at each of the six landing berths on the raised pad (void-runner/low-quay.js). Base plate with bolts, a hazard-banded post, a tilted screen housing
whose glass shows a simple status graphic made of bars (no text), a slanted key deck, a status lamp on a stalk and a cable run down the post. Origin at the centre of the base
plate, +Y up, the screen faces +Z. About 1.9 m tall. Flat colours with baked ambient only, so it takes the scene's lights.
Made by Claude for this project; no third-party assets."""
import math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vcore import Builder, Mat  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(REPO, 'void-runner', 'assets', 'models', 'low-quay', 'quay-terminal.glb')

MATS = [Mat('steel_worn', color=(.62, .6, .56), rough=.7, metal=.45), Mat('steel_dark', color=(.22, .23, .25), rough=.6, metal=.55),
        Mat('hazard_amber', color=(.95, .55, .12), rough=.65, metal=.15), Mat('glass_dark', color=(.05, .08, .1), rough=.15, metal=.2),
        Mat('screen_teal', emissive=(.18, .85, .8), strength=1.6), Mat('screen_amber', emissive=(1, .6, .2), strength=1.6), Mat('screen_dim', emissive=(.05, .22, .24), strength=1.2),
        Mat('lamp_green', emissive=(.2, 1, .35), strength=2.2), Mat('key_dim', emissive=(.5, .32, .12), strength=1.0)]


def build():
    B = Builder(MATS, slab=1000)
    B.box((-.45, 0, -.35), (.45, .1, .35), 'steel_dark')                       # base plate
    for sx in (-.36, .36):
        for sz in (-.26, .26):
            B.cyl((sx, .1, sz), (sx, .17, sz), .045, 'steel_worn', 8)          # anchor bolts
    B.box((-.14, .1, -.11), (.14, 1.02, .11), 'steel_worn')                    # post
    B.box((-.15, .32, -.12), (.15, .47, .12), 'hazard_amber')                  # hazard band
    B.box((-.15, .62, -.12), (.15, .66, .12), 'steel_dark')                    # collar
    B.cyl((-.19, .1, -.05), (-.19, 1.0, -.05), .025, 'steel_dark', 8)          # cable run
    # screen housing: tilted back about 24 degrees, facing +Z
    t = math.radians(24)
    n = np.array((0, math.sin(t) * .0 + math.cos(math.radians(90 - 24)) * 0 + math.sin(t), math.cos(t)))
    n /= np.linalg.norm(n)
    up = np.array((0, math.cos(t), -math.sin(t)))
    c = np.array((0, 1.3, 0.0))
    for off, w, h, m in ((0, .62, .1, 'steel_worn'),):
        B.beam(c - (.4, 0, 0), c + (.4, 0, 0), w, h, m, up=tuple(n))
    f = c + n * .052
    B.beam(f - (.34, 0, 0), f + (.34, 0, 0), .5, .012, 'glass_dark', up=tuple(n))
    g = c + n * .062
    # a status graphic made of bars: three rows of different lengths, one ring of segments
    for i, (ln, m) in enumerate(((.5, 'screen_teal'), (.36, 'screen_teal'), (.44, 'screen_amber'), (.22, 'screen_dim'))):
        p = g + up * (.17 - i * .09) - np.array((.3 - ln / 2, 0, 0))
        B.beam(p - (ln / 2, 0, 0), p + (ln / 2, 0, 0), .035, .006, m, up=tuple(n))
    for k in range(8):
        a = k / 8 * 2 * math.pi
        p = g + up * (.0) + np.array((.22 + math.cos(a) * .055, 0, 0)) + up * (math.sin(a) * .055) * 1.0 - up * .06
        B.beam(p - (.012, 0, 0), p + (.012, 0, 0), .02, .006, 'screen_teal' if k % 3 else 'screen_amber', up=tuple(n))
    # slanted key deck below the screen
    kd = np.array((0, .95, .16))
    B.beam(kd - (.3, 0, 0), kd + (.3, 0, 0), .2, .05, 'steel_dark', up=(0, .8, .6))
    for r in range(2):
        for k in range(5):
            p = kd + np.array((-.2 + k * .1, .03 + r * .0, 0)) + np.array((0, .025, .025)) + np.array((0, r * .05 * .6, r * .05 * -.8))
            B.box((p[0] - .03, p[1], p[2] - .015), (p[0] + .03, p[1] + .012, p[2] + .015), 'key_dim')
    # status lamp on a short stalk at the top of the post
    B.cyl((.08, 1.02, 0), (.08, 1.12, 0), .015, 'steel_dark', 6)
    B.cyl((.08, 1.12, 0), (.08, 1.2, 0), .045, 'steel_dark', 10)
    B.cyl((.08, 1.2, 0), (.08, 1.26, 0), .04, 'lamp_green', 10)
    return B


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else OUT
    os.makedirs(os.path.dirname(out), exist_ok=True)
    B = build()
    print('faces', B.write(out, HERE))
    print(os.path.getsize(out), 'bytes')
