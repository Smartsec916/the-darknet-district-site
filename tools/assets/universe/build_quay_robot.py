"""PLUG & PLAY kitchen robots (Low Quay, void-runner/low-quay-club.js): an industrial arm in separate jointed pieces plus a gantry carriage and rail segment,
one small GLB per piece so the game can stack them on joint nodes and turn the joints in code (stir, flip, lift, place, slide).

    python tools/assets/universe/build_quay_robot.py [outdir]

Pieces (origin at the joint each one turns about, +Y up the arm, game coordinates in metres):
  robot-base     floor/counter pedestal and turntable; the shoulder yoke; shoulder axis at y .52 (along X)
  robot-upper    upper arm, 0.62 long along +Y; elbow at its tip
  robot-fore     forearm, 0.52 long along +Y; wrist at its tip, a magenta status ring
  robot-spatula, robot-ladle, robot-gripper   tool heads on the wrist, pointing along +Y
  robot-carriage gantry carriage that rides a rail (hangs below y 0); robot-rail  one metre of rail along X
Flat colours, baked ambient only (the club's coloured lights do the rest). Made by Claude for this project; no third-party assets."""
import math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vcore import Builder, Mat  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUTDIR = os.path.join(REPO, 'void-runner', 'assets', 'models', 'low-quay')
MATS = [Mat('robot_orange', color=(.72, .3, .06), rough=.45, metal=.35), Mat('robot_dark', color=(.11, .11, .13), rough=.5, metal=.6),
        Mat('robot_steel', color=(.6, .6, .62), rough=.28, metal=.85), Mat('hazard', color=(.85, .55, .08), rough=.6, metal=.1),
        Mat('led_mag', emissive=(1, .18, .6), strength=2.2), Mat('rubber', color=(.05, .05, .06), rough=.9, metal=0)]


def joint(B, y, r, half, mat='robot_dark'):
    """A joint housing: a short cylinder across X at height y."""
    B.cyl((-half, y, 0), (half, y, 0), r, mat, 14)


def base():
    B = Builder(MATS, slab=1000)
    B.cyl((0, 0, 0), (0, .05, 0), .26, 'robot_dark', 18)
    for k in range(6):
        a = k * math.pi / 3
        B.cyl((math.cos(a) * .21, .05, math.sin(a) * .21), (math.cos(a) * .21, .08, math.sin(a) * .21), .02, 'robot_steel', 6)
    B.cyl((0, .05, 0), (0, .3, 0), .17, 'robot_orange', 18)
    B.cyl((0, .2, 0), (0, .24, 0), .175, 'hazard', 18)
    B.cyl((0, .3, 0), (0, .38, 0), .2, 'robot_dark', 18)
    for sx in (-1, 1):
        B.box((sx * .1 - .03, .38, -.1), (sx * .1 + .03, .6, .1), 'robot_orange')
    joint(B, .52, .085, .14)
    B.cyl((-.16, .52, 0), (-.13, .52, 0), .05, 'robot_steel', 10)
    B.cyl((-.12, .3, .16), (-.12, .45, .08), .02, 'rubber', 6)   # cable loop
    return B


def link(length, w, d, cap):
    B = Builder(MATS, slab=1000)
    joint(B, 0, w * .75, w * .55)
    B.box((-w / 2, 0, -d / 2), (w / 2, length, d / 2), 'robot_orange')
    B.box((-w / 2 - .005, length * .3, -d / 2 - .005), (w / 2 + .005, length * .36, d / 2 + .005), 'robot_dark')
    joint(B, length, w * .7, w * .55)
    B.cyl((w / 2 + .005, length * .1, 0), (w / 2 + .005, length * .9, 0), .015, 'rubber', 6)
    if cap:
        B.cyl((0, length - .02, 0), (0, length + .05, 0), w * .55, 'robot_dark', 14)
        B.cyl((0, length + .02, 0), (0, length + .035, 0), w * .58, 'led_mag', 14)
    return B


def tool(kind):
    B = Builder(MATS, slab=1000)
    B.cyl((0, 0, 0), (0, .06, 0), .045, 'robot_dark', 12)
    if kind == 'spatula':
        B.cyl((0, .06, 0), (0, .3, 0), .012, 'robot_steel', 8)
        B.box((-.07, .3, -.005), (.07, .46, .005), 'robot_steel')
    elif kind == 'ladle':
        B.cyl((0, .06, 0), (0, .34, 0), .012, 'robot_steel', 8)
        B.cyl((0, .34, 0), (0, .37, .0), .02, 'robot_steel', 8)
        B.cyl((0, .37, 0), (0, .43, 0), .075, 'robot_steel', 14, r2=.05)
    else:  # gripper
        B.box((-.07, .06, -.04), (.07, .14, .04), 'robot_orange')
        for sx in (-1, 1):
            B.box((sx * .05 - .012, .14, -.025), (sx * .05 + .012, .26, .025), 'robot_steel')
            B.box((sx * .05 - .012, .22, -.025), (sx * .05 - sx * .03, .26, .025), 'rubber')
    return B


def carriage():
    B = Builder(MATS, slab=1000)
    B.box((-.25, -.22, -.2), (.25, 0, .2), 'robot_dark')
    B.box((-.26, -.12, -.21), (.26, -.08, .21), 'hazard')
    for sx in (-.16, .16):
        for sz in (-.13, .13):
            B.cyl((sx, .02, sz - .04), (sx, .02, sz + .04), .05, 'rubber', 10)
    B.cyl((0, -.22, 0), (0, -.32, 0), .12, 'robot_orange', 16)
    B.cyl((-.02, -.3, .12), (-.02, -.3, .14), .02, 'led_mag', 8)
    return B


def rail():
    B = Builder(MATS, slab=1000)
    B.box((-.5, 0, -.16), (.5, .04, .16), 'robot_steel')
    B.box((-.5, .04, -.03), (.5, .2, .03), 'robot_steel')
    B.box((-.5, .2, -.1), (.5, .24, .1), 'robot_steel')
    return B


PIECES = {'robot-base': base, 'robot-upper': lambda: link(.62, .13, .15, False), 'robot-fore': lambda: link(.52, .1, .11, True),
          'robot-spatula': lambda: tool('spatula'), 'robot-ladle': lambda: tool('ladle'), 'robot-gripper': lambda: tool('gripper'),
          'robot-carriage': carriage, 'robot-rail': rail}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else OUTDIR
    os.makedirs(out, exist_ok=True)
    for name, fn in PIECES.items():
        B = fn()
        p = os.path.join(out, name + '.glb')
        print(name, 'faces', B.write(p, HERE), os.path.getsize(p), 'bytes')
