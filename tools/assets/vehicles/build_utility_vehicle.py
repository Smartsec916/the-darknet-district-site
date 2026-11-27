"""Utility vehicle for VOID//RUNNER (void-runner/vehicle.js): a small, rugged work truck for Vesper's surface workshop.

    /path/to/python-with-bpy tools/assets/vehicles/build_utility_vehicle.py [out.glb]

Writes void-runner/assets/models/vehicles/utility-vehicle.glb by default.

Authored in GAME coordinates (X right, Y up, Z forward, metres; origin on the ground midway between the axles) and written into Blender as (-x, -z, y),
the same convention as tools/assets/universe/vcore.py, so Babylon's glTF loader brings every point back to the same game coordinates.

Node tree (the names are what vehicle.js looks for; every node has an identity rotation so the game can turn it freely):
  utility_vehicle            root
    body                     the whole static truck (one mesh, several materials)
    steer_FL / steer_FR      steering pivots at the front wheel centres (turned about Y)
      wheel_FL / wheel_FR    wheels (spun about X)
    wheel_RL / wheel_RR      rear wheels (spun about X)

Look: an enclosed two-seat cab, cargo bed with a headache rack / roll bar, amber work lights, worn ochre paint with dust and scratches, steel bumpers with
hazard stripes, a snorkel, a spare wheel. This look is a reversible default (PROPOSED); the game reads the model path from vehicle-rules.js MODEL.
Textures are generated here with numpy (no image files are read). Made by Claude for this project; no third-party assets."""
import bpy, bmesh, math, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].endswith('.glb') else os.path.join(REPO, 'void-runner', 'assets', 'models', 'vehicles', 'utility-vehicle.glb')

# ---- dimensions (keep in step with void-runner/vehicle-rules.js SPEC) ----
WHEELBASE = 2.7
TRACK = 1.66          # wheel centre to wheel centre
WHEEL_R = .43
WHEEL_W = .30
AXLE_F, AXLE_R = WHEELBASE / 2, -WHEELBASE / 2
WIDTH = 1.86          # body width (the flares stick out a little more)
H = WIDTH / 2


def to_blender(p):
    return (-p[0], -p[2], p[1])


class Part:
    """Faces in game coordinates relative to a pivot; built into one Blender mesh object."""

    def __init__(self):
        self.faces = []   # (pts, mat, smooth, hint)

    def quad(self, pts, mat, hint, smooth=False):
        self.faces.append(([np.array(p, float) for p in pts], mat, smooth, np.array(hint, float)))

    def box(self, lo, hi, mat, skip=''):
        x0, y0, z0 = lo; x1, y1, z1 = hi
        q = [((x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1), (1, 0, 0), 'e'), ((x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (-1, 0, 0), 'w'),
             ((x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0), (0, 1, 0), 't'), ((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1), (0, -1, 0), 'b'),
             ((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1), (0, 0, 1), 'n'), ((x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (0, 0, -1), 's')]
        for a, b, c, d, n, k in q:
            if k not in skip:
                self.quad((a, b, c, d), mat, n)

    def prism(self, profile, x0, x1, mat):
        """A side profile [(z, y), ...] (convex, counter-clockwise seen from +x) extruded across x0..x1."""
        n = len(profile)
        L = [(x0, y, z) for z, y in profile]
        R = [(x1, y, z) for z, y in profile]
        self.quad(R, mat, (1, 0, 0))
        self.quad(L[::-1], mat, (-1, 0, 0))
        cz = sum(z for z, _ in profile) / n; cy = sum(y for _, y in profile) / n
        for i in range(n):
            j = (i + 1) % n
            mz = (profile[i][0] + profile[j][0]) / 2 - cz; my = (profile[i][1] + profile[j][1]) / 2 - cy
            self.quad((L[i], L[j], R[j], R[i]), mat, (0, my, mz))

    def beam(self, a, b, w, h, mat, up=(0, 1, 0)):
        a, b = np.array(a, float), np.array(b, float)
        d = b - a; L = np.linalg.norm(d); d /= L
        s = np.cross(d, up)
        if np.linalg.norm(s) < 1e-6:
            s = np.cross(d, (1, 0, 0))
        s /= np.linalg.norm(s); t = np.cross(s, d)
        c = [a + s * sx * w / 2 + t * ty * h / 2 for sx, ty in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        e = [p + d * L for p in c]
        self.quad(c, mat, -d); self.quad(e[::-1], mat, d)
        for i in range(4):
            j = (i + 1) % 4
            mid = (c[i] + c[j]) / 2 - a
            self.quad((c[i], e[i], e[j], c[j]), mat, mid - d * np.dot(mid, d))

    def cyl(self, a, b, r, mat, seg=12, caps=True, r2=None, smooth=True):
        a, b = np.array(a, float), np.array(b, float)
        d = b - a; L = np.linalg.norm(d); d /= L
        s = np.cross(d, (0, 1, 0))
        if np.linalg.norm(s) < 1e-6:
            s = np.array((1, 0, 0.))
        s /= np.linalg.norm(s); t = np.cross(d, s)
        r2 = r if r2 is None else r2
        ring = lambda p, rr: [p + (s * math.cos(2 * math.pi * i / seg) + t * math.sin(2 * math.pi * i / seg)) * rr for i in range(seg)]
        A, B = ring(a, r), ring(b, r2)
        for i in range(seg):
            j = (i + 1) % seg
            mid = (A[i] + A[j]) / 2 - a
            self.quad((A[i], B[i], B[j], A[j]), mat, mid - d * np.dot(mid, d), smooth)
        if caps:
            self.quad(A[::-1], mat, -d); self.quad(B, mat, d)


# ---- textures (numpy, deterministic) ----
rng = np.random.default_rng(1207)


def noise(size, octaves=5, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros((size, size))
    for o in range(octaves):
        n = 4 * 2 ** o
        g = r.random((n + 1, n + 1))
        xs = np.linspace(0, n, size, endpoint=False)
        i = xs.astype(int); f = xs - i; f = f * f * (3 - 2 * f)
        a = g[i][:, i]; b = g[i][:, i + 1]; c = g[i + 1][:, i]; d = g[i + 1][:, i + 1]
        fx = f[None, :]; fy = f[:, None]
        out += ((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy) / 2 ** o
    return out / out.max()


def paint_texture(size=512):
    """Ochre paint: mottled fading, dust rising from the bottom (v = height), scratches through to primer and bare steel."""
    base = np.array([.50, .31, .12])
    n1, n2 = noise(size, 6, 3), noise(size, 4, 9)
    v = np.linspace(0, 1, size)[:, None]                     # image row 0 = bottom of the texture (v = 0) after the flip below
    img = np.ones((size, size, 3)) * base
    img *= (.82 + .3 * n1)[..., None]
    dust = np.clip(1.1 - v * 2.4 + (n2 - .5) * .6, 0, 1)[..., None]
    img = img * (1 - .55 * dust) + np.array([.47, .38, .28]) * .55 * dust
    for _ in range(260):                                     # scratches
        x, y = rng.integers(0, size, 2); L = rng.integers(6, 40); a = rng.random() * math.pi
        bare = rng.random() < .35
        col = np.array([.36, .35, .33]) if bare else np.array([.22, .2, .17])
        for t in range(L):
            px, py = int(x + math.cos(a) * t) % size, int(y + math.sin(a) * t * .3) % size
            img[py, px] = img[py, px] * .4 + col * .6
    for _ in range(40):                                      # rust spots, more low down
        x = rng.integers(0, size); y = int(abs(rng.normal(0, .18)) * size) % size; r = rng.integers(2, 9)
        yy, xx = np.ogrid[-r:r + 1, -r:r + 1]
        m = (xx * xx + yy * yy) <= r * r
        ys, xs = np.clip(np.arange(y - r, y + r + 1), 0, size - 1), np.clip(np.arange(x - r, x + r + 1), 0, size - 1)
        sub = img[np.ix_(ys, xs)]
        sub[m] = sub[m] * .45 + np.array([.32, .14, .06]) * .55
        img[np.ix_(ys, xs)] = sub
    return np.clip(img, 0, 1)


def grime_texture(size=256, base=(.08, .08, .085), amount=.35, seed=5):
    n = noise(size, 5, seed)
    img = np.ones((size, size, 3)) * np.array(base)
    img = img * (.75 + .5 * n[..., None])
    img = img * (1 - amount * n[..., None] ** 3) + np.array([.42, .34, .25]) * amount * n[..., None] ** 3
    return np.clip(img, 0, 1)


def hazard_texture(size=256):
    u = np.arange(size)[None, :]; v = np.arange(size)[:, None]
    stripe = ((u + v) // (size // 8)) % 2 == 0
    img = np.where(stripe[..., None], np.array([.72, .5, .06]), np.array([.05, .05, .05]))
    n = noise(size, 4, 21)[..., None]
    img = img * (.75 + .3 * n)
    return np.clip(img, 0, 1)


def tread_texture(size=256):
    """Rubber with a blocky tread pattern (tyre faces map u around, v across)."""
    u = np.arange(size)[None, :] % (size // 16); v = np.arange(size)[:, None]
    groove = (u < 3) | ((np.abs(v - size / 2) < 4) & (u > size // 32))
    img = np.ones((size, size, 3)) * .055
    img[np.broadcast_to(groove, (size, size))] = .02
    n = noise(size, 4, 33)[..., None]
    img = img * (.8 + .4 * n) + np.array([.25, .2, .15]) * .12 * n ** 2
    return np.clip(img, 0, 1)


def make_image(name, arr):
    h, w = arr.shape[:2]
    im = bpy.data.images.new(name, w, h, alpha=False)
    rgba = np.concatenate([arr, np.ones((h, w, 1))], axis=2).astype(np.float32)
    im.pixels.foreach_set(rgba.ravel())
    im.file_format = 'JPEG'
    im.pack()
    return im


MATS = {
    # name: (base colour or texture name, roughness, metallic, emissive colour, emissive strength)
    'paint': ('tex_paint', .62, .15, None, 0),
    'chassis': ('tex_chassis', .78, .35, None, 0),
    'steel': ((.34, .33, .31), .42, .85, None, 0),
    'bedliner': ('tex_bed', .9, .05, None, 0),
    'rubber': ('tex_tread', .92, 0, None, 0),
    'rim': ((.16, .15, .14), .5, .7, None, 0),
    'glass': ((.03, .04, .045), .08, .3, None, 0),
    'hazard': ('tex_hazard', .7, .1, None, 0),
    'lamp_warm': ((1, .86, .62), .2, 0, (1, .82, .55), 3.0),
    'lamp_amber': ((1, .55, .12), .2, 0, (1, .5, .1), 3.0),
    'lamp_red': ((.8, .05, .03), .2, 0, (1, .08, .04), 2.0),
    'canvas': ('tex_canvas', .95, 0, None, 0),
}


def make_materials():
    tex = {'tex_paint': paint_texture(), 'tex_chassis': grime_texture(), 'tex_bed': grime_texture(256, (.07, .07, .07), .5, 8),
           'tex_hazard': hazard_texture(), 'tex_tread': tread_texture(), 'tex_canvas': grime_texture(128, (.25, .23, .17), .3, 13)}
    images = {k: make_image(k, v) for k, v in tex.items()}
    out = {}
    for name, (col, rough, metal, em, strength) in MATS.items():
        m = bpy.data.materials.new(name); m.use_nodes = True
        nt = m.node_tree
        bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
        bsdf.inputs['Roughness'].default_value = rough
        bsdf.inputs['Metallic'].default_value = metal
        if isinstance(col, str):
            t = nt.nodes.new('ShaderNodeTexImage'); t.image = images[col]
            nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
        else:
            bsdf.inputs['Base Color'].default_value = (*col, 1)
        if em:
            bsdf.inputs['Emission Color'].default_value = (*em, 1)
            bsdf.inputs['Emission Strength'].default_value = strength
        out[name] = m
    return out


def uv_for(mat, p, n):
    """Planar UVs in metres; the paint maps v to height so its dust gathers low down."""
    ax = int(np.argmax(np.abs(n)))
    if mat == 'paint':
        if ax == 1:
            return ((p[2] + 2.4) / 4.8, .9 + (p[0] + H) / WIDTH * .1)
        if ax == 0:
            return ((p[2] + 2.4) / 4.8, p[1] / 2.2)
        return ((p[0] + H) / WIDTH * .5, p[1] / 2.2)
    if mat == 'rubber':
        return (math.atan2(p[1], p[2]) / (2 * math.pi) + .5, p[0] * 2 + .5)
    tile = {'hazard': .5, 'chassis': 1.5, 'bedliner': 1.5, 'canvas': 1.0}.get(mat, 2.0)
    if ax == 1:
        return (p[0] / tile, p[2] / tile)
    if ax == 0:
        return (p[2] / tile, p[1] / tile)
    return (p[0] / tile, p[1] / tile)


def build_object(name, part, mats, pivot=(0, 0, 0), parent=None, bevel=0.0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    slots = []
    piv = np.array(pivot, float)
    for pts, mat, smooth, hint in part.faces:
        if mat not in slots:
            slots.append(mat)
        P = [p - piv for p in pts]
        nrm = np.cross(P[1] - P[0], P[2] - P[0])
        if np.linalg.norm(nrm) < 1e-10 and len(P) > 3:
            nrm = np.cross(P[2] - P[0], P[3] - P[0])
        if np.linalg.norm(nrm) < 1e-10:
            continue
        nrm /= np.linalg.norm(nrm)
        if np.dot(nrm, hint) < 0:
            P = P[::-1]; nrm = -nrm
        # Blender mapping (-x,-z,y) mirrors handedness, so reverse the winding to keep the normal outward.
        bv = [bm.verts.new(to_blender(p)) for p in P[::-1]]
        try:
            f = bm.faces.new(bv)
        except ValueError:
            continue
        f.material_index = slots.index(mat)
        f.smooth = smooth
        for lp, p in zip(f.loops, P[::-1]):
            lp[uvl].uv = uv_for(mat, p + piv, nrm)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.normal_update()
    bm.to_mesh(me); bm.free()
    for s in slots:
        me.materials.append(mats[s])
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if parent:
        ob.parent = parent
        ob.location = to_blender(np.array(pivot) - np.array(parent['game_pos']))
    else:
        ob.location = to_blender(pivot)
    ob['game_pos'] = list(map(float, pivot))
    if bevel:
        mod = ob.modifiers.new('bevel', 'BEVEL'); mod.width = bevel; mod.segments = 1; mod.limit_method = 'ANGLE'; mod.angle_limit = math.radians(50)
    return ob


def empty(name, pos, parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    if parent:
        e.parent = parent
        e.location = to_blender(np.array(pos) - np.array(parent['game_pos']))
    else:
        e.location = to_blender(pos)
    e['game_pos'] = list(map(float, pos))
    return e


# ---- the truck ----
def body():
    B = Part()
    # Ladder frame and running gear (dark, mostly hidden).
    for sx in (-1, 1):
        B.box((sx * .55 - .07, .38, -2.15), (sx * .55 + .07, .55, 2.05), 'chassis')
    for z in (-1.9, -1.0, 0, 1.0, 1.9):
        B.box((-.55, .40, z - .05), (.55, .52, z + .05), 'chassis')
    for z in (AXLE_F, AXLE_R):
        B.cyl((-TRACK / 2 + .12, WHEEL_R, z), (TRACK / 2 - .12, WHEEL_R, z), .07, 'chassis', 8)
        B.cyl((0, WHEEL_R, z - .16), (0, WHEEL_R, z + .16), .17, 'chassis', 10)   # differential
        for sx in (-1, 1):                                                      # leaf springs / dampers
            B.beam((sx * .55, WHEEL_R + .02, z - .55), (sx * .55, WHEEL_R + .02, z + .55), .08, .06, 'steel')
            B.cyl((sx * .62, WHEEL_R, z + .12), (sx * .58, .62, z + .2), .035, 'lamp_amber' if False else 'steel', 6)
    B.cyl((.3, .42, .6), (.3, .42, -2.0), .045, 'steel', 6)                     # exhaust pipe
    # Cab floor / rocker panels.
    B.box((-H, .55, -.25), (H, .72, 1.45), 'paint')
    # Hood and front clip: side profile (z, y), extruded across the width.
    hood = [(1.42, .55), (2.18, .55), (2.22, .78), (2.12, 1.08), (1.42, 1.16)]
    B.prism(hood, -H + .04, H - .04, 'paint')
    B.box((-.62, .62, 2.17), (.62, .98, 2.23), 'chassis')                        # grille panel
    for i in range(7):
        x = -.54 + i * .18
        B.box((x - .035, .66, 2.22), (x + .035, .94, 2.26), 'steel')            # grille bars
    for sx in (-1, 1):
        B.box((sx * .76 - .17, .80, 2.18), (sx * .76 + .17, .95, 2.24), 'lamp_warm')   # headlamps
        B.box((sx * .76 - .2, .77, 2.17), (sx * .76 + .2, .98, 2.2), 'chassis')
        B.box((sx * .76 - .05, .66, 2.2), (sx * .76 + .05, .72, 2.23), 'lamp_amber')   # indicators
    B.box((-.3, 1.09, 1.6), (.3, 1.14, 2.0), 'chassis')                         # hood vent
    # Cab: profile with a raked windscreen; the glass is set in as separate panels.
    cab = [(-.25, .72), (1.42, .72), (1.42, 1.16), (1.02, 1.86), (-.25, 1.92)]
    B.prism(cab, -H + .02, H - .02, 'paint')
    B.box((-H + .02, 1.92, -.3), (H - .02, 1.97, 1.0), 'chassis')               # roof skin
    # Windows (dark glass, a little proud of the paint).
    gl = .012
    wz0, wz1 = 0, 1.0
    for sx in (-1, 1):
        x = sx * (H - .02 + gl)
        pts = [(x, 1.24, wz0), (x, 1.24, 1.3), (x, 1.78, 1.0), (x, 1.82, wz0)]
        B.quad(pts, 'glass', (sx, 0, 0))
        B.box((sx * (H - .02) - .02, .76, .62), (sx * (H - .02) + .02, 1.22, .64), 'chassis')   # door shut line
        B.box((sx * (H - .02) - .03, 1.0, .05), (sx * (H - .02) + .03, 1.03, .2), 'steel')      # handle
        # mirrors
        B.beam((sx * (H - .02), 1.32, 1.25), (sx * (H + .2), 1.38, 1.28), .04, .04, 'steel')
        B.box((sx * (H + .16), 1.3, 1.22), (sx * (H + .26), 1.52, 1.3), 'chassis')
    # Windscreen: between the A pillars along the raked edge.
    a, b = np.array((0, 1.2, 1.4)), np.array((0, 1.82, 1.04))
    nrm = np.array((0, .5, .87))
    B.quad([(-H + .1, *a[1:] + nrm[1:] * .01), (H - .1, *a[1:] + nrm[1:] * .01), (H - .1, *b[1:] + nrm[1:] * .01), (-H + .1, *b[1:] + nrm[1:] * .01)], 'glass', nrm)
    B.box((-.04, 1.18, 1.0), (.04, 1.84, 1.44), 'chassis')                    # wiper
    # Rear window.
    B.quad([(-.7, 1.28, -.262), (.7, 1.28, -.262), (.7, 1.78, -.262), (-.7, 1.78, -.262)], 'glass', (0, 0, -1))
    # Snorkel up the passenger A pillar.
    B.cyl((H + .06, .9, 1.3), (H + .06, 1.9, 1.15), .06, 'chassis', 8)
    B.cyl((H + .06, 1.9, 1.15), (H + .06, 1.98, 1.32), .08, 'chassis', 8)
    # Roof light bar: four warm work lamps and an amber beacon.
    B.box((-.75, 1.97, .8), (.75, 2.02, .9), 'steel')
    for x in (-.6, -.2, .2, .6):
        B.box((x - .12, 2.0, .86), (x + .12, 2.14, .96), 'chassis')
        B.box((x - .1, 2.02, .955), (x + .1, 2.12, .97), 'lamp_warm')
    B.cyl((0, 1.97, .2), (0, 2.1, .2), .1, 'lamp_amber', 10)
    B.cyl((0, 1.97, .2), (0, 2.0, .2), .13, 'chassis', 10)
    # Bed: floor, sides, tailgate (bedliner inside, paint outside).
    B.box((-H, .72, -2.2), (H, .85, -.32), 'bedliner')
    for sx in (-1, 1):
        B.box((sx * H - (.06 if sx > 0 else 0), .85, -2.2), (sx * H + (0 if sx > 0 else .06), 1.32, -.32), 'paint')
        B.box((sx * H - .08 * (sx > 0), 1.32, -2.2), (sx * H + .08 * (sx < 0), 1.36, -.32), 'steel')        # bed rail cap
        for z in (-1.9, -1.2, -.6):
            B.box((sx * (H + .015) - .02, 1.1, z - .03), (sx * (H + .015) + .02, 1.3, z + .03), 'steel')   # tie-down cleats
    B.box((-H, .85, -.38), (H, 1.32, -.32), 'paint')                            # bulkhead
    B.box((-H, .75, -2.26), (H, 1.3, -2.2), 'paint')                            # tailgate
    B.box((-.4, 1.0, -2.29), (.4, 1.12, -2.26), 'chassis')                      # tailgate latch panel
    for sx in (-1, 1):
        B.box((sx * .78 - .1, .86, -2.3), (sx * .78 + .1, 1.08, -2.25), 'lamp_red')
    # Headache rack / roll bar behind the cab, with two amber work lights facing back.
    for sx in (-1, 1):
        B.beam((sx * .82, 1.32, -.42), (sx * .82, 2.12, -.42), .07, .07, 'steel')
        B.beam((sx * .82, 2.12, -.42), (sx * .82, 1.36, -1.25), .06, .06, 'steel')
        B.box((sx * .62 - .1, 2.08, -.5), (sx * .62 + .1, 2.2, -.44), 'chassis')
        B.box((sx * .62 - .08, 2.1, -.512), (sx * .62 + .08, 2.18, -.5), 'lamp_amber')
    B.beam((-.86, 2.12, -.42), (.86, 2.12, -.42), .07, .07, 'steel')
    for x in (-.4, 0, .4):
        B.beam((x, 1.36, -.42), (x, 2.12, -.42), .03, .03, 'steel')
    # Spare wheel lying in the bed against the bulkhead, cargo.
    B.cyl((.35, .86, -.95), (.35, 1.14, -.95), .42, 'rubber', 16)
    B.cyl((.35, 1.14, -.95), (.35, 1.16, -.95), .24, 'rim', 12)
    B.box((-.8, .85, -2.05), (-.2, 1.25, -1.45), 'canvas')                      # tarp-covered crate
    B.box((-.78, 1.25, -2.0), (-.22, 1.27, -1.5), 'chassis')
    for k in range(3):                                                          # jerry cans
        z = -2.0 + k * .26
        B.box((.12, .85, z), (.32, 1.25, z + .2), 'lamp_red' if False else 'chassis')
        B.box((.18, 1.25, z + .06), (.26, 1.3, z + .14), 'steel')
    B.box((-.85, .85, -1.25), (-.35, 1.05, -.7), 'steel')                       # toolbox
    # Bumpers (steel, hazard-striped faces), tow hooks, side steps, flares, mud flaps.
    B.box((-1.0, .5, 2.22), (1.0, .76, 2.42), 'steel')
    B.box((-.9, .52, 2.42), (.9, .74, 2.425), 'hazard')
    for sx in (-1, 1):
        B.cyl((sx * .55, .55, 2.42), (sx * .55, .55, 2.52), .05, 'lamp_red', 6)
    B.box((-.98, .5, -2.48), (.98, .72, -2.28), 'steel')
    B.box((-.9, .52, -2.485), (.9, .7, -2.48), 'hazard')
    for sx in (-1, 1):
        B.box((sx * H - (.0 if sx < 0 else .0) - .08 * (sx > 0), .42, .0), (sx * H + .08 * (sx < 0), .48, 1.0), 'steel')     # side step
        B.box((sx * (H + .1) - .1, .44, -.05), (sx * (H + .1) + .1, .5, 1.05), 'steel')
        for z in (AXLE_F, AXLE_R):
            flare = [(z - .62, .62), (z + .62, .62), (z + .5, .98), (z, 1.06), (z - .5, .98)]
            x0, x1 = (sx * H, sx * (H + .12)) if sx > 0 else (sx * (H + .12), sx * H)
            B.prism(flare, x0, x1, 'chassis')
            B.box((sx * (H - .2) - .1 * (sx < 0), .3, z - .66), (sx * (H - .2) + .1 * (sx > 0), .62, z - .63), 'rubber')   # mud flap
    return B


def wheel(side):
    """A wheel centred on its pivot, axle along X; side -1 (left) / +1 (right): the hub faces outward."""
    W = Part()
    seg = 20
    hw = WHEEL_W / 2
    W.cyl((-hw, 0, 0), (hw, 0, 0), WHEEL_R, 'rubber', seg, caps=False)
    for s in (-1, 1):   # sidewalls (rubber rings) and the rim face
        out = s * hw
        ring_o = [(out, math.sin(a) * WHEEL_R, math.cos(a) * WHEEL_R) for a in np.linspace(0, 2 * math.pi, seg, endpoint=False)]
        ring_i = [(out + s * .01, math.sin(a) * .27, math.cos(a) * .27) for a in np.linspace(0, 2 * math.pi, seg, endpoint=False)]
        for i in range(seg):
            j = (i + 1) % seg
            W.quad((ring_o[i], ring_o[j], ring_i[j], ring_i[i]), 'rubber', (s, 0, 0))
        dish = s * (.04 if s == side else -.02)
        W.cyl((out + s * .01, 0, 0), (out + dish, 0, 0), .27, 'rim', 12, caps=False, r2=.24)
        W.cyl((out + dish, 0, 0), (out + dish - s * .002, 0, 0), .24, 'rim', 12, caps=False)
        W.quad([(out + dish, math.sin(a) * .24, math.cos(a) * .24) for a in np.linspace(0, 2 * math.pi, 12, endpoint=False)][::-s], 'rim', (s, 0, 0))
    out = side * (hw + .045)
    W.cyl((out - side * .03, 0, 0), (out + side * .02, 0, 0), .08, 'steel', 8)            # hub
    for k in range(6):                                                                    # lug nuts (they show the spin)
        a = k * math.pi / 3
        W.cyl((out, math.sin(a) * .14, math.cos(a) * .14), (out + side * .025, math.sin(a) * .14, math.cos(a) * .14), .018, 'steel', 6)
    W.box((out - .005, -.03, .16), (out + side * .02 if side > 0 else out + .005, .03, .22), 'lamp_amber')   # a valve marker, so a turning wheel reads
    # Tread lugs: chunky blocks around the tyre.
    for k in range(18):
        a = k * 2 * math.pi / 18
        c, s_ = math.cos(a), math.sin(a)
        r0, r1 = WHEEL_R - .005, WHEEL_R + .025
        w0, w1 = -.025, .025
        for x0, x1 in ((-hw + .01, -.02), (.02, hw - .01)) if k % 2 else ((-hw + .04, hw - .04),):
            pts = []
            for r in (r0, r1):
                for w in (w0, w1):
                    pts.append((r * s_ + w * c, r * c - w * s_))
            (y00, z00), (y01, z01), (y10, z10), (y11, z11) = pts
            W.quad([(x0, y10, z10), (x1, y10, z10), (x1, y11, z11), (x0, y11, z11)], 'rubber', (0, s_, c))
            W.quad([(x0, y00, z00), (x0, y10, z10), (x0, y11, z11), (x0, y01, z01)], 'rubber', (-1, 0, 0))
            W.quad([(x1, y00, z00), (x1, y01, z01), (x1, y11, z11), (x1, y10, z10)], 'rubber', (1, 0, 0))
            W.quad([(x0, y00, z00), (x1, y00, z00), (x1, y10, z10), (x0, y10, z10)], 'rubber', (0, -c, s_))
            W.quad([(x0, y01, z01), (x0, y11, z11), (x1, y11, z11), (x1, y01, z01)], 'rubber', (0, c, -s_))
    return W


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mats = make_materials()
    root = empty('utility_vehicle', (0, 0, 0))
    objs = [root]
    b = build_object('body', body(), mats, (0, 0, 0), root, bevel=.012)
    objs.append(b)
    for name, x, z in (('FL', -TRACK / 2, AXLE_F), ('FR', TRACK / 2, AXLE_F), ('RL', -TRACK / 2, AXLE_R), ('RR', TRACK / 2, AXLE_R)):
        side = -1 if name[1] == 'L' else 1
        parent = root
        if name[0] == 'F':
            parent = empty('steer_' + name, (x, WHEEL_R, z), root)
            objs.append(parent)
        objs.append(build_object('wheel_' + name, wheel(side), mats, (x, WHEEL_R, z), parent))
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_materials='EXPORT',
                              export_image_format='JPEG', export_jpeg_quality=86, export_cameras=False, export_lights=False, export_animations=False)
    tris = 0
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        if o.type == 'MESH':
            me = o.evaluated_get(dg).to_mesh()
            me.calc_loop_triangles(); tris += len(me.loop_triangles)
            o.evaluated_get(dg).to_mesh_clear()
    print('wrote', OUT, os.path.getsize(OUT), 'bytes,', tris, 'triangles')


if __name__ == '__main__':
    main()
