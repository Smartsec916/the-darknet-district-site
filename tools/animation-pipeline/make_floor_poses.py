"""Make the three floor poses (kneeling, cross-legged, knees to chest) on a character GLB, without Blender and without any outside service.

The owner (21 Nov 2026): "can you add kneeling and cross-legged pose? add them to any npc that has the correct skeleton. also a sitting knee to chest pose."
No mocap in the pipeline has these three, so they are POSED BY CODE on each figure's own skeleton (the mixamorig joint names that both the 52-joint MakeHuman
figures and the 24-joint Meshy street figures carry): the body is placed with a few numbers (hip height, where the knees, ankles and hands go, how far the
torso leans), measured against that figure's own bone lengths, and every limb is aimed bone by bone (two-bone reach for arms and legs, the knee and elbow
bending in their own plane, the forearm sharing the wrist's turn). A small breathing / sway / head motion is keyed so each clip loops exactly.

  python3 tools/animation-pipeline/make_floor_poses.py <figure.glb> [more.glb ...]        add or replace floor-kneel, floor-cross, floor-knees
  python3 tools/animation-pipeline/make_floor_poses.py --check <figure.glb>               print the measured heights (nothing written)

The clips (names in POSES) keep the figure's origin where its feet stood: the game puts that origin on the cushion / floor / cot top (the seat's height) and
turns it to face the table. Each clip is ~10 KB (9 keys a joint, linear). A Blender rebuild of a figure (build_*_character.py) skips these clips
(clips.json "source": "pose"); run this again on the rebuilt file.
"""
import json, math, struct, sys

POSES = {'floor-kneel': 4.0, 'floor-cross': 6.0, 'floor-knees': 5.0}   # clip -> loop length (s)
KEYS = 9
P = 'mixamorig:'


# ---- glb in / out (the same layout as graft_clip.py) ----
def read(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    bl = struct.unpack('<I', b[20 + jl:24 + jl])[0]
    return j, bytearray(b[28 + jl:28 + jl + bl])


def write(path, j, bin_):
    while len(bin_) % 4: bin_.append(0)
    j['buffers'][0]['byteLength'] = len(bin_)
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    open(path, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(bin_)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(bin_)) + b'BIN\0' + bytes(bin_))


# ---- small vector / quaternion helpers ([x, y, z], [x, y, z, w]) ----
def add(a, b): return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
def sub(a, b): return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
def mul(a, k): return [a[0] * k, a[1] * k, a[2] * k]
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def cross(a, b): return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
def length(a): return math.sqrt(dot(a, a))
def norm(a): n = length(a); return [a[0] / n, a[1] / n, a[2] / n] if n > 1e-9 else [0.0, 0.0, 0.0]
def perp(v, axis): return norm(sub(v, mul(axis, dot(v, axis))))


def qmul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return [aw*bx + ax*bw + ay*bz - az*by, aw*by - ax*bz + ay*bw + az*bx, aw*bz + ax*by - ay*bx + az*bw, aw*bw - ax*bx - ay*by - az*bz]


def qinv(q): return [-q[0], -q[1], -q[2], q[3]]
def qrot(q, v): return qmul(qmul(q, [v[0], v[1], v[2], 0.0]), qinv(q))[:3]
def qaxis(axis, ang): s = math.sin(ang / 2); a = norm(axis); return [a[0] * s, a[1] * s, a[2] * s, math.cos(ang / 2)]


def qswing(a, b):
    """The shortest rotation taking unit vector a to unit vector b."""
    d = dot(a, b)
    if d > 1 - 1e-9: return [0.0, 0.0, 0.0, 1.0]
    if d < -1 + 1e-9:
        o = perp([1, 0, 0] if abs(a[0]) < .9 else [0, 1, 0], a)
        return qaxis(o, math.pi)
    c = cross(a, b); q = [c[0], c[1], c[2], 1 + d]; n = math.sqrt(sum(x * x for x in q))
    return [x / n for x in q]


def qframe(d0, r0, d1, r1):
    """The rotation taking the frame (d0, r0) to (d1, r1) (each pair made orthonormal; d exact, r as close as it can)."""
    def m(d, r):
        d = norm(d); r = perp(r, d); return [d, r, cross(d, r)]
    a, b = m(d0, r0), m(d1, r1)
    # R = B * A^T  (columns of A map to columns of B)
    R = [[sum(b[k][i] * a[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    t = R[0][0] + R[1][1] + R[2][2]
    if t > 0:
        s = math.sqrt(t + 1) * 2; return norm4([(R[2][1] - R[1][2]) / s, (R[0][2] - R[2][0]) / s, (R[1][0] - R[0][1]) / s, s / 4])
    if R[0][0] > R[1][1] and R[0][0] > R[2][2]:
        s = math.sqrt(1 + R[0][0] - R[1][1] - R[2][2]) * 2; return norm4([s / 4, (R[0][1] + R[1][0]) / s, (R[0][2] + R[2][0]) / s, (R[2][1] - R[1][2]) / s])
    if R[1][1] > R[2][2]:
        s = math.sqrt(1 + R[1][1] - R[0][0] - R[2][2]) * 2; return norm4([(R[0][1] + R[1][0]) / s, s / 4, (R[1][2] + R[2][1]) / s, (R[0][2] - R[2][0]) / s])
    s = math.sqrt(1 + R[2][2] - R[0][0] - R[1][1]) * 2; return norm4([(R[0][2] + R[2][0]) / s, (R[1][2] + R[2][1]) / s, s / 4, (R[1][0] - R[0][1]) / s])


def norm4(q): n = math.sqrt(sum(x * x for x in q)); return [x / n for x in q]


def twist_angle(q, axis):
    """The turn of q about axis (swing-twist), in radians."""
    p = dot(q[:3], axis); return 2 * math.atan2(p, q[3])


# ---- the figure ----
class Figure:
    def __init__(self, j):
        self.j = j; N = j['nodes']
        self.parent = {}
        for i, n in enumerate(N):
            for c in n.get('children', []): self.parent[c] = i
        self.idx = {n.get('name'): i for i, n in enumerate(N)}
        self.joints = j['skins'][0]['joints']
        self.local = {i: (N[i].get('translation', [0, 0, 0]), N[i].get('rotation', [0, 0, 0, 1])) for i in range(len(N))}
        self.rw, self.pw = {}, {}
        for i in range(len(N)): self.world(i)
        g = self.g
        self.U = [0.0, 1.0, 0.0]
        self.L = perp(sub(g('LeftUpLeg'), g('RightUpLeg')), self.U)
        self.F = cross(self.L, self.U)
        h = g('Hips'); self.O = [h[0], 0.0, h[2]]
        self.thigh = length(sub(g('LeftLeg'), g('LeftUpLeg'))); self.shin = length(sub(g('LeftFoot'), g('LeftLeg')))
        self.foot = length(sub(g('LeftToeBase'), g('LeftFoot')))
        self.upper = length(sub(g('LeftForeArm'), g('LeftArm'))); self.fore = length(sub(g('LeftHand'), g('LeftForeArm')))
        self.s = (self.thigh + self.shin) / .78   # 1.0 for a leg of 0.78 m (hip joint to ankle)
        self.has = lambda name: (P + name) in self.idx

    def world(self, i):
        if i in self.rw: return
        t, r = self.local[i]; p = self.parent.get(i)
        if p is None: self.rw[i], self.pw[i] = list(r), list(t); return
        self.world(p)
        self.rw[i] = qmul(self.rw[p], r); self.pw[i] = add(self.pw[p], qrot(self.rw[p], t))

    def g(self, name): return self.pw[self.idx[P + name]]
    def n(self, name): return self.idx[P + name]

    def at(self, f, l, u):
        """A point in the figure's frame (metres forward, left, up from the floor under its hips) -> world."""
        return add(self.O, add(mul(self.F, f), add(mul(self.L, l), mul(self.U, u))))


class Pose:
    """New world rotations, set from the hips down the tree; positions follow by forward kinematics."""
    def __init__(self, fig):
        self.f = fig; self.rw = {}; self.pw = {}

    def inherit(self, i):
        f = self.f; p = f.parent.get(i); t, r = f.local[i]
        pr = self.rw.get(p, f.rw.get(p, [0, 0, 0, 1])) if p is not None else [0, 0, 0, 1]
        pp = self.pw.get(p, f.pw.get(p, [0, 0, 0])) if p is not None else [0, 0, 0]
        return qmul(pr, r), add(pp, qrot(pr, t))

    def set(self, i, rot):
        _, pos = self.inherit(i); self.rw[i] = norm4(rot); self.pw[i] = pos

    def keep(self, i, delta=None):
        rot, pos = self.inherit(i); self.rw[i] = qmul(delta, rot) if delta else rot; self.pw[i] = pos

    def axis_of(self, i, child):
        """The bone's world axis (toward `child`) as it is now inherited, and at rest."""
        f = self.f; rest = norm(sub(f.pw[child], f.pw[i]))
        return rest

    def aim(self, i, child, d1, r1=None, rref=None):
        """Turn bone i so it points along d1. With r1, the rest reference direction rref (perpendicular-ish to the bone) is turned toward r1 (a hinge plane / palm)."""
        f = self.f; rot, pos = self.inherit(i)
        d0 = qrot(rot, qrot(qinv(f.rw[i]), norm(sub(f.pw[child], f.pw[i]))))   # the rest axis carried by the parent's new turn
        if r1 is None: q = qswing(norm(d0), norm(d1))
        else: q = qframe(d0, qrot(rot, qrot(qinv(f.rw[i]), rref)), d1, r1)
        self.rw[i] = norm4(qmul(q, rot)); self.pw[i] = pos

    def pos(self, i):
        if i in self.pw: return self.pw[i]
        return self.inherit(i)[1]


def reach(a, b, root, target, pole):
    """Two-bone reach: the middle joint for bones of length a, b from root toward target, bending toward pole. Clamped to 99% of full reach."""
    d = sub(target, root); dist = length(d); n = norm(d)
    dist = max(abs(a - b) + 1e-3, min(dist, (a + b) * .99))
    x = (a * a - b * b + dist * dist) / (2 * dist); y = math.sqrt(max(0.0, a * a - x * x))
    side = perp(pole, n)
    end = add(root, mul(n, dist))
    return add(add(root, mul(n, x)), mul(side, y)), end


def leg(pose, side, knee=None, ankle=None, pole=None, toe_dir=None, top=None):
    """A leg: thigh, shin and foot. Either a knee and an ankle (exact points, lengths are kept by aiming) or an ankle and a pole (two-bone reach)."""
    f = pose.f; S = 'Left' if side > 0 else 'Right'
    up, lo, ft, toe = f.n(S + 'UpLeg'), f.n(S + 'Leg'), f.n(S + 'Foot'), f.n(S + 'ToeBase')
    hip = pose.inherit(up)[1]
    if knee is None: knee, ankle = reach(f.thigh, f.shin, hip, ankle, pole)
    t = norm(sub(knee, hip)); s = norm(sub(ankle, knee))
    # the kneecap faces away from the way the shin folds; straight legs keep the figure's forward
    kc = mul(perp(s, t), -1) if length(sub(s, mul(t, dot(s, t)))) > 1e-3 else perp(f.F, t)
    pose.aim(up, lo, t, kc, perp(f.F, norm(sub(f.pw[lo], f.pw[up]))))
    pose.aim(lo, ft, s)
    if toe_dir is not None: pose.aim(ft, toe, toe_dir, top, perp(f.U, norm(sub(f.pw[toe], f.pw[ft]))))
    else: pose.keep(ft)
    pose.keep(toe)
    for c in f.j['nodes'][toe].get('children', []): pose.keep(c)
    return knee, ankle


def arm(pose, side, wrist, pole, hand_dir, palm, shrug=0.0):
    f = pose.f; S = 'Left' if side > 0 else 'Right'
    sh, up, lo, hd = f.n(S + 'Shoulder'), f.n(S + 'Arm'), f.n(S + 'ForeArm'), f.n(S + 'Hand')
    pose.keep(sh, qaxis(f.F, -side * shrug) if shrug else None)
    root = pose.inherit(up)[1]
    elbow, w = reach(f.upper, f.fore, root, wrist, pole)
    a = norm(sub(elbow, root)); b = norm(sub(w, elbow))
    inner = perp(b, a) if length(sub(b, mul(a, dot(b, a)))) > 1e-3 else perp(f.F, a)
    pose.aim(up, lo, a, inner, perp(f.F, norm(sub(f.pw[lo], f.pw[up]))))
    pose.aim(lo, hd, b)
    # the hand: point it along hand_dir, palm toward `palm`; half of the wrist's turn goes into the forearm (no candy-wrapper wrist)
    rest_axis = norm(sub(f.pw[hd], f.pw[lo]))   # a Meshy hand has no finger joint: it carries on from the forearm
    rest_palm = perp(mul(f.U, -1), rest_axis)
    for _ in range(2):
        rot, _p = pose.inherit(hd)
        cur_axis = qrot(rot, qrot(qinv(f.rw[hd]), rest_axis)); cur_palm = qrot(rot, qrot(qinv(f.rw[hd]), rest_palm))
        want = qframe(cur_axis, cur_palm, hand_dir, palm)
        tw = twist_angle(want, norm(cur_axis))
        fr = pose.rw[lo]; fa = norm(sub(pose.inherit(hd)[1], pose.pw[lo]))
        pose.rw[lo] = norm4(qmul(qaxis(fa, tw * .5), fr))
    rot, pos = pose.inherit(hd)
    cur_axis = qrot(rot, qrot(qinv(f.rw[hd]), rest_axis)); cur_palm = qrot(rot, qrot(qinv(f.rw[hd]), rest_palm))
    pose.rw[hd] = norm4(qmul(qframe(cur_axis, cur_palm, hand_dir, palm), rot)); pose.pw[hd] = pos
    # fingers: a relaxed curl (52-joint figures)
    lat = norm(cross(palm, hand_dir))
    def fingers(i, depth):
        for c in f.j['nodes'][i].get('children', []):
            nm = f.j['nodes'][c].get('name', '')
            if 'Thumb' in nm: pose.keep(c, qaxis(hand_dir, 0) if depth else None)
            elif nm.startswith(P + S + 'Hand'): pose.keep(c, qaxis(lat, side * .0 + .28))
            else: pose.keep(c)
            fingers(c, depth + 1)
    fingers(hd, 0)
    return elbow, w


def spine_chain(pose, pitch, roll=0.0, yaw=0.0, hips_pitch=0.0, hips_pos=None, head=(0.0, 0.0, 0.0), breath=0.0):
    """Hips at hips_pos turned by hips_pitch (forward, radians, about the figure's left axis); pitch spread up the spine; the head's (pitch, yaw, roll)."""
    f = pose.f; L, U, Fw = f.L, f.U, f.F
    hi = f.n('Hips'); pose.rw[hi] = norm4(qmul(qaxis(L, hips_pitch), f.rw[hi])); pose.pw[hi] = hips_pos
    chain = [n for n in ('Spine', 'Spine1', 'Spine2') if f.has(n)]
    for k, n in enumerate(chain):
        share = pitch / len(chain) + (breath if n == 'Spine2' else breath * .5 if n == 'Spine1' else 0)
        pose.keep(f.n(n), qmul(qaxis(U, yaw / len(chain)), qmul(qaxis(Fw, roll / len(chain)), qaxis(L, share))))
    if f.has('Neck'): pose.keep(f.n('Neck'), qaxis(L, head[0] * .4))
    hp, hy, hr = head
    pose.keep(f.n('Head'), qmul(qaxis(U, hy), qmul(qaxis(Fw, hr), qaxis(L, hp * .6))))
    for c in f.j['nodes'][f.n('Head')].get('children', []): pose.keep(c)


def hips_at(fig, f, l, hip_joint_h):
    """The hips joint's world position for hip joints hip_joint_h above the floor (the hips sit above the leg joints by the rest offset)."""
    off = fig.g('Hips')[1] - (fig.g('LeftUpLeg')[1] + fig.g('RightUpLeg')[1]) / 2
    return fig.at(f, l, hip_joint_h + off)


def pose_kneel(fig, ph):
    """Seiza: on the knees, sitting back on the heels, hands on the thighs, breathing."""
    s, a, b = fig.s, fig.thigh, fig.shin
    kh, ah = .075 * s, .075 * s
    hh = kh + math.sqrt(max(.01, a * a - (b - .05 * s) ** 2)) + .02 * s   # the thighs fall to the knees; the ankles end just behind the hip joints (sitting on the heels)
    br = math.sin(ph * 2 * math.pi)
    p = Pose(fig)
    spine_chain(p, pitch=math.radians(4 + .8 * br), hips_pitch=math.radians(6), hips_pos=hips_at(fig, 0, 0, hh + .003 * s * br), head=(math.radians(8), 0, 0), breath=math.radians(-.9 * br))
    for side in (1, -1):
        hip = p.inherit(fig.n(('Left' if side > 0 else 'Right') + 'UpLeg'))[1]
        hl = dot(sub(hip, fig.O), fig.L)
        fwd = math.sqrt(max(.0, a * a - (hh - kh) ** 2))
        knee = fig.at(fwd + dot(sub(hip, fig.O), fig.F), hl + side * .035 * s, kh)
        ankle = add(knee, add(mul(fig.F, -math.sqrt(max(0, b * b - (.06 * s) ** 2 - (kh - ah) ** 2))), mul(fig.L, -side * .06 * s)))
        ankle[1] = ah
        leg(p, side, knee, ankle, toe_dir=norm(add(mul(fig.F, -1), mul(fig.U, -.3))), top=mul(fig.U, -1))
    for side in (1, -1):
        S = 'Left' if side > 0 else 'Right'
        hip = p.pos(fig.n(S + 'UpLeg')); knee = p.pos(fig.n(S + 'Leg'))
        on = add(add(hip, mul(sub(knee, hip), .62)), mul(fig.U, .09 * s))   # the palm on the thigh, toward the knee
        thigh = norm(sub(knee, hip))
        wrist = sub(on, mul(thigh, .07 * s))
        arm(p, side, wrist, pole=add(mul(fig.F, -1), mul(fig.L, side * .6)), hand_dir=norm(add(thigh, mul(fig.U, -.25))), palm=norm(add(mul(fig.U, -1), mul(fig.L, side * .15))), shrug=math.radians(1.2 * br))
    return p


def pose_cross(fig, ph):
    """Cross-legged on the floor: shins crossed in front, hands resting on the knees, breathing and a slow look about."""
    s, a, b = fig.s, fig.thigh, fig.shin
    hh = .12 * s
    br = math.sin(ph * 2 * math.pi * 1.5); look = math.sin(ph * 2 * math.pi)
    p = Pose(fig)
    spine_chain(p, pitch=math.radians(10 + .8 * br), hips_pitch=math.radians(-8), hips_pos=hips_at(fig, 0, 0, hh + .003 * s * br),
                head=(math.radians(4 + 2 * math.sin(ph * 2 * math.pi * 2)), math.radians(9 * look), math.radians(2 * look)), breath=math.radians(-.9 * br))
    knees = {}
    for side in (1, -1):
        S = 'Left' if side > 0 else 'Right'
        hip = p.inherit(fig.n(S + 'UpLeg'))[1]
        t = norm(add(mul(fig.F, .62), add(mul(fig.L, side * .76), mul(fig.U, .14))))
        knee = add(hip, mul(t, a))
        front = .09 if side > 0 else -.09   # the left shin crosses in front of the right
        sd = norm(add(mul(fig.L, -side * 1.0), add(mul(fig.F, front - .12), mul(fig.U, -.16))))
        ankle = add(knee, mul(sd, b))
        foot = norm(add(mul(fig.L, -side * .8), add(mul(fig.F, .3), mul(fig.U, -.2))))
        leg(p, side, knee, ankle, toe_dir=foot, top=norm(add(mul(fig.U, -.35), add(mul(fig.F, -.25), mul(fig.L, side * .9)))))
        knees[side] = knee
    for side in (1, -1):
        knee = knees[side]
        on = add(knee, add(mul(fig.U, .07 * s), mul(fig.L, -side * .05 * s)))
        hand_dir = norm(add(mul(fig.F, .55), add(mul(fig.U, -.5), mul(fig.L, side * .25))))
        wrist = sub(on, mul(hand_dir, .07 * s))
        arm(p, side, wrist, pole=add(mul(fig.F, -.6), add(mul(fig.L, side), mul(fig.U, -.3))), hand_dir=hand_dir, palm=norm(add(mul(fig.U, -1), mul(fig.L, side * .2))), shrug=math.radians(1 * br))
    return p


def pose_knees(fig, ph):
    """Sitting on the floor, knees pulled up to the chest, arms wrapped round the shins, a small rocking sway."""
    s, a, b = fig.s, fig.thigh, fig.shin
    hh = .12 * s
    sway = math.sin(ph * 2 * math.pi); br = math.sin(ph * 2 * math.pi * 2)
    p = Pose(fig)
    spine_chain(p, pitch=math.radians(24 + 3 * sway + .6 * br), hips_pitch=math.radians(-12 + 1.5 * sway), hips_pos=hips_at(fig, 0, 0, hh),
                head=(math.radians(-6 - 2 * sway), math.radians(3 * math.sin(ph * 2 * math.pi + 1)), math.radians(4)), breath=math.radians(-.6 * br))
    for side in (1, -1):
        S = 'Left' if side > 0 else 'Right'
        hip = p.inherit(fig.n(S + 'UpLeg'))[1]
        ankle = fig.at(dot(sub(hip, fig.O), fig.F) + (.4 * s if a + b > .7 else .38 * s), dot(sub(hip, fig.O), fig.L) - side * .015 * s, .085 * s)
        leg(p, side, ankle=ankle, pole=add(mul(fig.U, 1), mul(fig.F, .5)), toe_dir=norm(add(mul(fig.F, 1), mul(fig.U, -.45))), top=fig.U)
    for side in (1, -1):
        S = 'Left' if side > 0 else 'Right'
        knee = p.pos(fig.n(S + 'Leg')); ankle = p.pos(fig.n(S + 'Foot'))
        mid = add(add(knee, mul(sub(ankle, knee), .45)), mul(fig.F, .085 * s))
        on = add(mid, mul(fig.L, -side * (dot(sub(mid, fig.O), fig.L) * side + .02 * s)))   # the hands meet in front of the shins
        hand_dir = norm(add(mul(fig.L, -side), mul(fig.U, -.25)))
        wrist = sub(on, mul(hand_dir, .06 * s))
        arm(p, side, wrist, pole=add(mul(fig.L, side), add(mul(fig.U, -.4), mul(fig.F, -.2))), hand_dir=hand_dir, palm=mul(fig.F, -1))
    return p


MAKERS = {'floor-kneel': pose_kneel, 'floor-cross': pose_cross, 'floor-knees': pose_knees}


def local_rotations(fig, pose):
    out = {}
    for i in fig.joints:
        if i not in pose.rw: continue
        p = fig.parent.get(i)
        pr = pose.rw.get(p, fig.rw.get(p, [0, 0, 0, 1])) if p is not None else [0, 0, 0, 1]
        out[i] = norm4(qmul(qinv(pr), pose.rw[i]))
    return out


def hips_translation(fig, pose):
    hi = fig.n('Hips'); p = fig.parent.get(hi)
    if p is None: return pose.pw[hi]
    return qrot(qinv(fig.rw[p]), sub(pose.pw[hi], fig.pw[p]))


def add_clips(path, check=False):
    j, b = read(path); fig = Figure(j)
    report = {}
    for name, dur in POSES.items():
        frames = [MAKERS[name](fig, k / (KEYS - 1)) for k in range(KEYS)]
        p0 = frames[0]
        lows = {nm: round(p0.pos(fig.n(nm))[1], 3) for nm in ('Hips', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'LeftHand', 'Head') if fig.has(nm)}
        report[name] = lows
        if check: continue
        j['animations'] = [a for a in j.get('animations', []) if a['name'] != name]
        rots = [local_rotations(fig, f) for f in frames]
        made = {}

        def put(values, typ, minmax=False):
            while len(b) % 4: b.append(0)
            off = len(b); b.extend(struct.pack('<%df' % len(values), *values))
            j['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': len(values) * 4})
            n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[typ]
            acc = {'bufferView': len(j['bufferViews']) - 1, 'componentType': 5126, 'count': len(values) // n, 'type': typ}
            if minmax: acc['min'] = [min(values)]; acc['max'] = [max(values)]
            j['accessors'].append(acc); return len(j['accessors']) - 1
        times = put([dur * k / (KEYS - 1) for k in range(KEYS)], 'SCALAR', True)
        anim = {'name': name, 'channels': [], 'samplers': []}
        for i in fig.joints:
            if i not in rots[0]: continue
            seq = []
            for k in range(KEYS):
                q = rots[k][i]
                if seq and dot(q, seq[-1]) + q[3] * seq[-1][3] < 0: q = [-x for x in q]   # keep neighbours on the same side (no flips)
                seq.append(q)
            seq[-1] = seq[0]   # an exact loop
            anim['samplers'].append({'input': times, 'interpolation': 'LINEAR', 'output': put([v for q in seq for v in q], 'VEC4')})
            anim['channels'].append({'sampler': len(anim['samplers']) - 1, 'target': {'node': i, 'path': 'rotation'}})
        ht = [hips_translation(fig, f) for f in frames]; ht[-1] = ht[0]
        anim['samplers'].append({'input': times, 'interpolation': 'LINEAR', 'output': put([v for t in ht for v in t], 'VEC3')})
        anim['channels'].append({'sampler': len(anim['samplers']) - 1, 'target': {'node': fig.n('Hips'), 'path': 'translation'}})
        j['animations'].append(anim)
    if not check: write(path, j, b)
    return fig, report


if __name__ == '__main__':
    args = sys.argv[1:]; check = '--check' in args
    for p in [a for a in args if a != '--check']:
        fig, rep = add_clips(p, check)
        print(p, 'legs %.2f+%.2f arms %.2f+%.2f' % (fig.thigh, fig.shin, fig.upper, fig.fore), json.dumps(rep))
