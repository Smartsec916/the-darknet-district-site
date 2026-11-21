"""Make the three floor poses (kneeling, cross-legged, knees to chest) on a character GLB, without Blender and without any outside service.

The owner (21 Nov 2026): "can you add kneeling and cross-legged pose? add them to any npc that has the correct skeleton. also a sitting knee to chest pose."
No mocap in the pipeline has these three, so they are POSED BY CODE on each figure's own skeleton (the mixamorig joint names that both the 52-joint MakeHuman
figures and the 24-joint Meshy street figures carry): the body is placed with a few numbers (hip height, where the knees, ankles and hands go, how far the
torso leans), measured against that figure's own bone lengths, and every limb is aimed bone by bone (two-bone reach for arms and legs, the knee and elbow
bending in their own plane, the forearm sharing the wrist's turn). A small breathing / sway / head motion is keyed so each clip loops exactly.

  python3 tools/animation-pipeline/make_floor_poses.py <figure.glb> [more.glb ...]        add what is missing: floor-kneel, floor-cross, floor-knees and the ten
                                                                                          sit-down / stand-up clips (TRANS below: floor-<pose>-down / -up, -hi)
  python3 tools/animation-pipeline/make_floor_poses.py --force <figure.glb>               make them all again (the old clips' bytes stay in the file unused:
                                                                                          use it on a freshly rebuilt file)
  python3 tools/animation-pipeline/make_floor_poses.py --check <figure.glb>               print the measured heights (nothing written)

The clips (names in POSES) keep the figure's origin where its feet stood: the game puts that origin on the cushion / floor / cot top (the seat's height) and
turns it to face the table. Each clip is ~10 KB (9 keys a joint, linear). A Blender rebuild of a figure (build_*_character.py) skips these clips
(clips.json "source": "pose"); run this again on the rebuilt file.
"""
import json, math, re, struct, sys

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


# ======================================================================================================================================================
# TRANSITIONS (21 Nov 2026, the owner asked for a proper standing-up animation; a matching sit-down): one-shot clips per figure, from the figure's own idle
# (frame 0) to the loop pose's first frame (-down) and back (-up, the -down played in reverse, its own length). Posed by code like the loops: a few key
# bodies (hips, knees, ankles, wrists, how far the spine leans) placed with that figure's bone lengths, every frame solved by the same two-bone reach, the
# first frames eased into the idle exactly and the last into the loop exactly (both are compared numerically by tests/floor-transitions.test.cjs).
#
# ROOT MOTION (the runtime and the clip move together, ncz-street-pair.js FLOOR_MOVE has the same numbers): the figure starts standing at S, d metres
# in front of the loop's origin O (along the way the seat faces), and hb metres below the seat's top; over the clip the runtime moves the figure's origin
# from S to O and lifts it by hb with r(k) = smoothstep(k) (k: 0..1 through the clip; the -up runs it backwards), and the clip's hips carry the opposite
# offset, so feet that stay on the floor stay put in the world whatever the seat's height h: the figure's world is ground + h - hb*(1-r) + clip.
#   low seats (the cushions, h up to 0.27 m with the dais): hb 0, the figure steps onto the cushion first (the runtime eases the lift up as it walks on);
#   raised seats (the cots 0.44 m, the alcove benches 0.46 m: '-hi' clips): hb 0.45, standing on the floor in front of the edge, sitting on the edge,
#   lifting the legs and pushing back onto it with the hands.
# ======================================================================================================================================================
MOVES = {'kneel': (-.08, 0.0), 'cross': (.18, 0.0), 'knees': (.32, 0.0), 'cross-hi': (.74, .45), 'knees-hi': (.84, .45)}   # move -> (d, hb) in metres
TRANS = {'floor-kneel-down': ('kneel', 1.8), 'floor-kneel-up': ('kneel', 1.6), 'floor-cross-down': ('cross', 1.6), 'floor-cross-up': ('cross', 1.5),
         'floor-knees-down': ('knees', 1.5), 'floor-knees-up': ('knees', 1.4), 'floor-cross-down-hi': ('cross-hi', 2.0), 'floor-cross-up-hi': ('cross-hi', 1.8),
         'floor-knees-down-hi': ('knees-hi', 1.9), 'floor-knees-up-hi': ('knees-hi', 1.7)}   # clip -> (move, seconds)
FPS = 15
FINGER = re.compile(r'Hand(Thumb|Index|Middle|Ring|Pinky)')
TOL = {True: .4, False: .002}   # the keys kept: a joint within 0.4 degrees, the hips within 2 mm of every 1/15 s frame


def smooth(k): k = min(1.0, max(0.0, k)); return k * k * (3 - 2 * k)


def slerp(a, b, t):
    d = sum(x * y for x, y in zip(a, b))
    if d < 0: b = [-x for x in b]; d = -d
    if d > .9995: return norm4([x + (y - x) * t for x, y in zip(a, b)])
    th = math.acos(min(1.0, d)); s = math.sin(th)
    return [(math.sin((1 - t) * th) * x + math.sin(t * th) * y) / s for x, y in zip(a, b)]


def lerp(a, b, t): return [x + (y - x) * t for x, y in zip(a, b)]


# ---- an accessor's values (plain floats, or EXT_meshopt_compression ATTRIBUTES version 0 as gltfpack writes the crowd files' clips) ----
def meshopt_attributes(src, count, stride):
    if src[0] != 0xA0: raise ValueError('meshopt vertex codec version %x' % src[0])
    pos, out, last = 1, bytearray(count * stride), bytearray(src[len(src) - stride:])
    block = min((8192 // stride) & ~15, 256)
    for v0 in range(0, count, block):
        n = min(block, count - v0); na = (n + 15) & ~15; groups = na // 16
        for k in range(stride):
            buf = bytearray(na); hs = (groups + 3) // 4; head = src[pos:pos + hs]; pos += hs
            for g in range(groups):
                bits = (head[g // 4] >> ((g % 4) * 2)) & 3
                if bits == 0: continue
                if bits == 3: buf[g * 16:g * 16 + 16] = src[pos:pos + 16]; pos += 16; continue
                w = 2 if bits == 1 else 4; esc = (1 << w) - 1; hb = 2 * w; var = pos + hb
                for i in range(16):
                    e = (src[pos + (i * w) // 8] >> (8 - w - (i * w) % 8)) & esc
                    if e == esc: buf[g * 16 + i] = src[var]; var += 1
                    else: buf[g * 16 + i] = e
                pos = var
            p = last[k]
            for i in range(n):
                v = buf[i]; p = (p + ((v >> 1) ^ (-(v & 1) & 0xFF))) & 0xFF; out[(v0 + i) * stride + k] = p
            last[k] = p
    return bytes(out)


def values(j, b, ai):
    acc = j['accessors'][ai]; bv = j['bufferViews'][acc['bufferView']]; n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[acc['type']]
    if acc.get('componentType') != 5126: raise ValueError('only float clips are read')
    e = bv.get('extensions', {}).get('EXT_meshopt_compression')
    if e:
        if e.get('mode') != 'ATTRIBUTES' or e.get('filter', 'NONE') not in ('NONE', None): raise ValueError('meshopt mode')
        o = e.get('byteOffset', 0); data = meshopt_attributes(b[o:o + e['byteLength']], e['count'], e['byteStride']); stride = e['byteStride']
    else:
        o = bv.get('byteOffset', 0); data = bytes(b[o:o + bv['byteLength']]); stride = bv.get('byteStride', n * 4)
    base = acc.get('byteOffset', 0)
    return [list(struct.unpack_from('<%df' % n, data, base + i * stride)) for i in range(acc['count'])]


def first_frame(fig, j, b, name):
    """A clip's first frame: {joint: local rotation}, the hips' translation (or None). Joints the clip leaves alone keep their rest rotation."""
    rots, ht = {}, None
    for a in j.get('animations', []):
        if a['name'] != name: continue
        for ch in a['channels']:
            node, path = ch['target']['node'], ch['target']['path']; smp = a['samplers'][ch['sampler']]
            if path == 'rotation': rots[node] = norm4(values(j, b, smp['output'])[0])
            elif path == 'translation' and node == fig.n('Hips'): ht = values(j, b, smp['output'])[0]
        break
    return rots, ht


def fk(fig, loc, hips_t):
    rw, pw = {}, {}; H = fig.n('Hips')
    def go(i):
        if i in rw: return
        t, r = fig.local[i]
        if i in loc: r = loc[i]
        if i == H and hips_t is not None: t = hips_t
        p = fig.parent.get(i)
        if p is None: rw[i], pw[i] = list(r), list(t); return
        go(p); rw[i] = qmul(rw[p], r); pw[i] = add(pw[p], qrot(rw[p], t))
    for i in range(len(fig.j['nodes'])): go(i)
    return rw, pw


def fr(fig, p): q = sub(p, fig.O); return [dot(q, fig.F), dot(q, fig.L), dot(q, fig.U)]   # world -> (forward, left, up)
def fv(fig, v): return [dot(v, fig.F), dot(v, fig.L), dot(v, fig.U)]
def wv(fig, c): return add(mul(fig.F, c[0]), add(mul(fig.L, c[1]), mul(fig.U, c[2])))
def top_of(t): return [-t[2], 0.0, t[0]]   # the foot's top for a toe direction in the forward / up plane


def pitch_of(fig, rw, i):
    v = qrot(qmul(rw[i], qinv(fig.rw[i])), fig.U); return math.degrees(math.atan2(dot(v, fig.F), dot(v, fig.U)))


def measure(fig, rw, pw, shift=(0.0, 0.0, 0.0)):
    """The key parameters of a posed body (frame coordinates, `shift` added to positions)."""
    g = lambda nm: pw[fig.n(nm)]; sh = lambda c: [c[0] + shift[0], c[1] + shift[1], c[2] + shift[2]]
    top = [n for n in ('Spine', 'Spine1', 'Spine2') if fig.has(n)][-1]
    hp = pitch_of(fig, rw, fig.n('Hips')); sp = pitch_of(fig, rw, fig.n(top)) - hp; hd = pitch_of(fig, rw, fig.n('Head')) - hp - sp
    q = {'hips': sh(fr(fig, g('Hips'))), 'hp': hp, 'sp': sp, 'hd': hd}
    for S, side in (('L', 'Left'), ('R', 'Right')):
        ft, toe, lo, up = fig.n(side + 'Foot'), fig.n(side + 'ToeBase'), fig.n(side + 'Leg'), fig.n(side + 'UpLeg')
        rest_toe = norm(sub(fig.pw[toe], fig.pw[ft]))
        q['a' + S] = sh(fr(fig, pw[ft])); q['k' + S] = fv(fig, sub(pw[lo], pw[up])); q['K' + S] = sh(fr(fig, pw[lo])); q['ka' + S] = 0.0
        q['t' + S] = fv(fig, norm(sub(pw[toe], pw[ft]))); q['u' + S] = fv(fig, qrot(qmul(rw[ft], qinv(fig.rw[ft])), perp(fig.U, rest_toe)))
        hd_, fo, ar = fig.n(side + 'Hand'), fig.n(side + 'ForeArm'), fig.n(side + 'Arm')
        rest_axis = norm(sub(fig.pw[hd_], fig.pw[fo])); rest_palm = perp(mul(fig.U, -1), rest_axis); R = qmul(rw[hd_], qinv(fig.rw[hd_]))
        q['w' + S] = sh(fr(fig, pw[hd_])); q['e' + S] = fv(fig, sub(pw[fo], pw[ar])); q['h' + S] = fv(fig, qrot(R, rest_axis)); q['p' + S] = fv(fig, qrot(R, rest_palm))
    return q


def build(fig, q):
    """A body from key parameters (frame coordinates)."""
    p = Pose(fig)
    spine_chain(p, pitch=math.radians(q['sp']), hips_pitch=math.radians(q['hp']), hips_pos=fig.at(*q['hips']), head=(math.radians(q['hd']), 0.0, 0.0))
    for S, side in (('L', 1), ('R', -1)):
        hip = p.inherit(fig.n(('Left' if side > 0 else 'Right') + 'UpLeg'))[1]; A = fig.at(*q['a' + S])
        w = min(1.0, max(0.0, q['ka' + S])); pole = norm(wv(fig, q['k' + S]))
        if w > 1e-3: pole = add(mul(pole, 1 - w), mul(norm(sub(fig.at(*q['K' + S]), hip)), w))   # toward the knee's own spot (a knee put down on the floor)
        kr, ar = reach(fig.thigh, fig.shin, hip, A, pole)
        leg(p, side, kr, ar, toe_dir=norm(wv(fig, q['t' + S])), top=norm(wv(fig, q['u' + S])))
    for S, side in (('L', 1), ('R', -1)):
        arm(p, side, fig.at(*q['w' + S]), pole=wv(fig, q['e' + S]), hand_dir=norm(wv(fig, q['h' + S])), palm=norm(wv(fig, q['p' + S])))
    return p


def all_local(fig, pose):
    loc = local_rotations(fig, pose)
    for i in fig.joints: loc.setdefault(i, norm4(fig.local[i][1]))
    return loc


def hips_world_to_t(fig, pos):
    hi = fig.n('Hips'); p = fig.parent.get(hi)
    return pos if p is None else qrot(qinv(fig.rw[p]), sub(pos, fig.pw[p]))


def interp(keys, k):
    """Monotone cubic through the keys' parameters (each number on its own; a flat stretch stays flat), at k."""
    ts = [t for t, _ in keys]
    i = max(0, min(len(keys) - 2, next((n for n in range(len(ts) - 1) if k <= ts[n + 1]), len(ts) - 2)))
    t0, t1 = ts[i], ts[i + 1]; u = 0.0 if t1 <= t0 else min(1.0, max(0.0, (k - t0) / (t1 - t0)))
    def slope(n, c):
        if n <= 0 or n >= len(keys) - 1: return 0.0
        a, b, cc = keys[n - 1][1], keys[n][1], keys[n + 1][1]
        def val(d):
            v = d[c[0]]; return v[c[1]] if c[1] is not None else v
        l, r = (val(b) - val(a)) / (ts[n] - ts[n - 1]), (val(cc) - val(b)) / (ts[n + 1] - ts[n])
        if l * r <= 0: return 0.0
        return 2 / (1 / l + 1 / r)   # harmonic mean: no overshoot
    out = {}
    h00, h10, h01, h11 = 2 * u**3 - 3 * u**2 + 1, u**3 - 2 * u**2 + u, -2 * u**3 + 3 * u**2, u**3 - u**2
    for key, v0 in keys[i][1].items():
        v1 = keys[i + 1][1][key]
        if isinstance(v0, list):
            out[key] = [h00 * v0[c] + h10 * (t1 - t0) * slope(i, (key, c)) + h01 * v1[c] + h11 * (t1 - t0) * slope(i + 1, (key, c)) for c in range(len(v0))]
        else:
            out[key] = h00 * v0 + h10 * (t1 - t0) * slope(i, (key, None)) + h01 * v1 + h11 * (t1 - t0) * slope(i + 1, (key, None))
    return out


def knee_at(fig, q, S):
    """Where a key's knee comes out (the legs solved alone), to put a hand on it."""
    p = build(fig, {**q, 'wL': q['hips'], 'wR': q['hips']}); return fr(fig, p.pos(fig.n(('Left' if S == 'L' else 'Right') + 'Leg')))


def keys_for(fig, move, I, Lp):
    """The key bodies of a sit-down (k 0..1), as (k, parameters) with the idle first and the loop pose last."""
    s, a, b = fig.s, fig.thigh, fig.shin
    hw = abs(dot(sub(fig.g('LeftUpLeg'), fig.O), fig.L)); hoff = fig.g('Hips')[1] - fig.g('LeftUpLeg')[1]; kh = .075 * s
    d, hb = MOVES[move]
    def key(base, **kw):
        q = {k: (list(v) if isinstance(v, list) else v) for k, v in base.items()}
        for k, v in kw.items(): q[k] = list(v) if isinstance(v, (list, tuple)) else v
        return q
    def off(c, df=0.0, dl=0.0, du=0.0): return [c[0] + df, c[1] + dl, c[2] + du]
    def hips_for(hipR, hp):   # the hips node for a right hip joint at hipR (frame), with the hips turned by hp degrees
        o = qrot(qaxis(fig.L, math.radians(hp)), sub(fig.g('RightUpLeg'), fig.g('Hips'))); return fr(fig, sub(fig.at(*hipR), o))
    def on_knee(q, S, up=.07):
        k = knee_at(fig, q, S); side = 1 if S == 'L' else -1; return off(k, -.03 * s, -side * .02 * s, up * s)
    flat = {S: (I['t' + S], I['u' + S]) for S in 'LR'}
    K = []
    if move == 'kneel':
        q1 = key(I, hips=off(I['hips'], -.05 * s, .02 * s, -.2 * s), hp=10, sp=10, hd=4, aR=off(I['aR'], .0, 0, .03 * s), tR=norm([.8, 0, -.6]), uR=top_of(norm([.8, 0, -.6])),
                 kL=[1, .15, .1], kR=[1, -.15, .1], wL=off(I['wL'], .1 * s, 0, .06 * s), wR=off(I['wR'], .1 * s, 0, .06 * s))
        toes = norm([.3, 0, -.9])   # toes tucked under: the foot stands down from the ankle on the ball
        def kneeling(S, q):
            A = [I['a' + S][0] + .03 * s, Lp['a' + S][1], fig.foot * .88 + .025]
            return A, [A[0] + math.sqrt(max(0.0, b * b - (A[2] - kh) ** 2)), Lp['K' + S][1], kh]
        AR, KR = kneeling('R', None)
        hipR = [KR[0] - .24 * s, KR[1] + .01 * s, kh + math.sqrt(max(0.0, a * a - (.24 * s) ** 2))]
        q2 = key(q1, hips=off(hips_for(hipR, 14), 0, .02 * s, 0), hp=14, sp=12, hd=8, aR=AR, KR=KR, kaR=1.0, tR=toes, uR=top_of(toes), kL=[1, .35, .2])
        q2['wR'] = off(KR, -.12 * s, -.06 * s, .3 * s); q2['wL'] = on_knee(q2, 'L', .06)
        AL, KL = kneeling('L', None)
        hipR3 = [KR[0] - .1 * s, KR[1] + .01 * s, kh + math.sqrt(max(0.0, a * a - (.1 * s) ** 2))]
        q3 = key(q2, hips=hips_for(hipR3, 3), hp=3, sp=3, hd=6, aL=AL, KL=KL, kaL=1.0, tL=toes, uL=top_of(toes), wL=off(KL, -.16 * s, .05 * s, .3 * s), wR=off(KR, -.16 * s, -.05 * s, .3 * s),
                 hL=[.6, 0, -.8], hR=[.6, 0, -.8], pL=[-.6, -.1, -.8], pR=[-.6, .1, -.8])
        K = [(0.0, I), (.26, q1), (.5, q2), (.72, q3), (1.0, Lp)]
    elif move in ('cross', 'knees'):
        q1 = key(I, hips=off(I['hips'], -.15 * s, 0, -.37 * s), hp=28, sp=14, hd=-14, kL=[1, .3, .1], kR=[1, -.3, .1],
                 wL=off(I['hips'], .26 * s, .19 * s, -.22 * s), wR=off(I['hips'], .26 * s, -.19 * s, -.22 * s), hL=[1, 0, -.15], hR=[1, 0, -.15], pL=[0, -.2, -1], pR=[0, .2, -1],
                 eL=[-.3, .6, -.5], eR=[-.3, -.6, -.5])
        q2 = key(q1, hips=off(Lp['hips'], .02 * s, 0, .02 * s), hp=-12, sp=0 if move == 'cross' else 8, hd=0, kL=[.6, .45 if move == 'cross' else .2, .7], kR=[.6, -.45 if move == 'cross' else -.2, .7],
                 wR=[Lp['hips'][0] - .22 * s, -.25 * s, .07 * s], hR=norm([-.5, -.6, -.25]), pR=[0, 0, -1], eR=[-.5, -1, .2])
        q2['wL'] = on_knee(q2, 'L'); q2['hL'] = [.6, -.2, -.6]; q2['pL'] = [-.2, -.1, -1]; q2['eL'] = [-.2, 1, -.2]
        if move == 'cross':
            q3 = key(Lp, hips=off(Lp['hips'], .005 * s, 0, .005 * s), hp=-9, sp=8, aL=off(Lp['aL'], .03 * s, 0, .03 * s), aR=off(Lp['aR'], .03 * s, 0, .03 * s),
                     wL=off(Lp['wL'], 0, 0, .04 * s), wR=off(Lp['wR'], -.03 * s, 0, .05 * s))
            K = [(0.0, I), (.3, q1), (.55, q2), (.78, q3), (1.0, Lp)]
        else:
            q3 = key(Lp, hips=off(Lp['hips'], .01 * s, 0, .01 * s), hp=-12, sp=18, wL=off(Lp['wL'], 0, .06 * s, .05 * s), wR=off(Lp['wR'], 0, -.06 * s, .05 * s))
            K = [(0.0, I), (.3, q1), (.58, q2), (.8, q3), (1.0, Lp)]
    else:   # the raised seats: on the floor in front of the edge, sit on the edge, legs up, push back with the hands
        e = d - .28; knees = move == 'knees-hi'
        q1 = key(I, hips=off(I['hips'], -.12 * s, 0, -.2 * s), hp=20, sp=12, hd=-8, kL=[1, .1, .1], kR=[1, -.1, .1], wL=off(I['wL'], .14 * s, 0, .1 * s), wR=off(I['wR'], .14 * s, 0, .1 * s))
        q2 = key(q1, hips=[e - .14, Lp['hips'][1], .1 * s + hoff], hp=6, sp=8, hd=2, wL=[e - .1, .25 * s, .07 * s], wR=[e - .1, -.25 * s, .07 * s], hL=[.6, .2, -.6], hR=[.6, -.2, -.6],
                 pL=[0, -.2, -1], pR=[0, .2, -1], eL=[-.6, .6, 0], eR=[-.6, -.6, 0])
        q3 = key(q2, hips=[e - .18, Lp['hips'][1], .1 * s + hoff], hp=-18, sp=-6, hd=6, wL=[e - .48, .17 * s, .07 * s], wR=[e - .48, -.17 * s, .07 * s], hL=norm([-.5, .5, -.3]), hR=norm([-.5, -.5, -.3]),
                 eL=[-.6, .8, .2], eR=[-.6, -.8, .2], kL=[.4, .3, 1], kR=[.4, -.3, 1])
        if knees:
            q3['aL'] = [e + .02, hw + .02 * s, .1 * s]; q3['aR'] = [e + .02, -hw - .02 * s, .1 * s]; q3['tL'] = q3['tR'] = norm([1, 0, -.45]); q3['uL'] = q3['uR'] = top_of(q3['tL'])
            q4 = key(Lp, hips=off(Lp['hips'], .06 * s, 0, .01 * s), aL=off(Lp['aL'], .05 * s), aR=off(Lp['aR'], .05 * s), wL=off(Lp['wL'], .02 * s, .07 * s, .04 * s), wR=off(Lp['wR'], .02 * s, -.07 * s, .04 * s))
        else:
            q3['aL'] = [e - .02, hw - .02 * s, .15 * s]; q3['aR'] = [e - .02, -hw + .02 * s, .15 * s]; q3['tL'] = q3['tR'] = norm([1, 0, -.3]); q3['uL'] = q3['uR'] = top_of(q3['tL'])
            q3['kL'] = [.4, .7, 1]; q3['kR'] = [.4, -.7, 1]
            q4 = key(Lp, hips=off(Lp['hips'], .06 * s, 0, .01 * s), aL=off(Lp['aL'], .05 * s, 0, .03 * s), aR=off(Lp['aR'], .05 * s, 0, .03 * s), wL=off(Lp['wL'], -.04 * s, 0, .04 * s), wR=off(Lp['wR'], -.04 * s, 0, .04 * s))
        K = [(0.0, I), (.2, q1), (.42, q2), (.62, q3), (.82, q4), (1.0, Lp)]
    return K


BLEND = {'kneel': (.16, .74), 'cross': (.18, .75), 'knees': (.18, .76), 'cross-hi': (.13, .8), 'knees-hi': (.13, .8)}   # idle eased out by, loop eased in from


def transition_frames(fig, j, b, move):
    """The sit-down's frames as a function k -> ({joint: local rotation}, hips translation)."""
    d, hb = MOVES[move]; loop = 'floor-' + move.split('-')[0]
    idle_r, idle_t = first_frame(fig, j, b, 'idle')
    iloc = {i: idle_r.get(i, norm4(fig.local[i][1])) for i in fig.joints}; it = idle_t if idle_t is not None else fig.local[fig.n('Hips')][0]
    lpose = MAKERS[loop](fig, 0.0); lloc = all_local(fig, lpose); lt = hips_translation(fig, lpose)
    I = measure(fig, *fk(fig, iloc, it), shift=(d, 0.0, -hb)); Lp = measure(fig, *fk(fig, lloc, lt))
    K = keys_for(fig, move, I, Lp); e0, e1 = BLEND[move]
    iw = fk(fig, iloc, it)[1][fig.n('Hips')]; lw = fk(fig, lloc, lt)[1][fig.n('Hips')]
    iw = add(iw, wv(fig, [d, 0.0, -hb]))   # the idle's hips where the figure stands (loop frame)
    def at(k):
        q = interp(K, k); p = build(fig, q); loc = all_local(fig, p); hw_ = p.pw[fig.n('Hips')]
        wi = 1 - smooth(k / e0); wl = smooth((k - e1) / (1 - e1))
        out = {}
        for i in fig.joints: out[i] = norm4(slerp(slerp(loc[i], iloc[i], wi), lloc[i], wl))
        hpos = lerp(lerp(hw_, iw, wi), lw, wl)
        r = smooth(k); hpos = sub(hpos, wv(fig, [d * (1 - r), 0.0, -hb * (1 - r)]))   # the runtime's origin moves from S to O and up by hb: the hips carry the opposite
        return out, hips_world_to_t(fig, hpos)
    return at


def add_transitions(path, only=None):
    j, b = read(path); fig = Figure(j)
    if not any(a['name'] == 'idle' for a in j.get('animations', [])): raise ValueError(path + ': no idle clip')
    made = {}
    for name, (move, dur) in TRANS.items():
        if only and name not in only: continue
        if move not in made: made[move] = transition_frames(fig, j, b, move)
        at = made[move]; up = '-up' in name; n = max(2, int(round(dur * FPS)) + 1)
        frames = [at(1 - k / (n - 1) if up else k / (n - 1)) for k in range(n)]
        j['animations'] = [a for a in j.get('animations', []) if a['name'] != name]
        while len(b) % 4: b.append(0)
        start = len(b); view = len(j['bufferViews']); j['bufferViews'].append({'buffer': 0, 'byteOffset': start, 'byteLength': 0})   # one view for the whole clip
        def put(vals, typ, minmax=False):
            off_ = len(b) - start; b.extend(struct.pack('<%df' % len(vals), *vals)); j['bufferViews'][view]['byteLength'] = len(b) - start
            acc = {'bufferView': view, 'byteOffset': off_, 'componentType': 5126, 'count': len(vals) // {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[typ], 'type': typ}
            if minmax: acc['min'] = [min(vals)]; acc['max'] = [max(vals)]
            j['accessors'].append(acc); return len(j['accessors']) - 1
        T = [dur * k / (n - 1) for k in range(n)]; inputs = {}
        def track(seq, err, lerp_):   # the fewest keys that keep every frame within err of the full track (Douglas-Peucker)
            keep = {0, len(seq) - 1}; stack = [(0, len(seq) - 1)]
            while stack:
                i0, i1 = stack.pop(); worst, at_ = 0.0, None
                for i in range(i0 + 1, i1):
                    e = err(lerp_(seq[i0], seq[i1], (T[i] - T[i0]) / (T[i1] - T[i0])), seq[i])
                    if e > worst: worst, at_ = e, i
                if at_ is not None and worst > 0: 
                    if worst > TOL[lerp_ is slerp]: keep.add(at_); stack += [(i0, at_), (at_, i1)]
            idx = sorted(keep); key = tuple(idx)
            if key not in inputs: inputs[key] = put([T[i] for i in idx], 'SCALAR', True)
            return inputs[key], idx
        qerr = lambda a, c: 2 * math.degrees(math.acos(min(1.0, abs(sum(x * y for x, y in zip(a, c))))))
        anim = {'name': name, 'channels': [], 'samplers': []}
        for i in fig.joints:
            if FINGER.search(j['nodes'][i].get('name', '')): continue   # the fingers keep what the clip before left (the loop eases them into its own)
            seq = []
            for f in frames:
                q = f[0][i]
                if seq and sum(x * y for x, y in zip(q, seq[-1])) < 0: q = [-x for x in q]   # neighbours on the same side (no flips)
                seq.append(q)
            inp, idx = track(seq, qerr, slerp)
            anim['samplers'].append({'input': inp, 'interpolation': 'LINEAR', 'output': put([v for k in idx for v in seq[k]], 'VEC4')})
            anim['channels'].append({'sampler': len(anim['samplers']) - 1, 'target': {'node': i, 'path': 'rotation'}})
        ht = [f[1] for f in frames]; inp, idx = track(ht, lambda a, c: length(sub(a, c)), lerp)
        anim['samplers'].append({'input': inp, 'interpolation': 'LINEAR', 'output': put([v for k in idx for v in ht[k]], 'VEC3')})
        anim['channels'].append({'sampler': len(anim['samplers']) - 1, 'target': {'node': fig.n('Hips'), 'path': 'translation'}})
        j['animations'].append(anim)
    write(path, j, b)
    return fig


if __name__ == '__main__':
    args = sys.argv[1:]; check = '--check' in args; force = '--force' in args
    for p in [a for a in args if not a.startswith('--')]:
        j0, _ = read(p); have = {a['name'] for a in j0.get('animations', [])}
        if check or force or not all(n in have for n in POSES):
            fig, rep = add_clips(p, check)
            print(p, 'legs %.2f+%.2f arms %.2f+%.2f' % (fig.thigh, fig.shin, fig.upper, fig.fore), json.dumps(rep))
        if check: continue
        want = [n for n in TRANS if force or n not in have]
        if want: add_transitions(p, want); print(p, 'sit-down / stand-up:', ' '.join(want))
