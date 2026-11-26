"""The modular space-station kit (docs/development/STATION_GRAPHICS.md). Run with Blender's Python (the `bpy` package, 5.x):

    python tools/assets/station-kit/build_station_kit.py [--textures] [--only name,name]

Every piece is BUILT BY CODE here (this file is the editable source; there is no .blend to keep), exported as its own .glb into
void-runner/assets/models/station-kit/ and listed in station-kit-manifest.json. Conventions the game (void-runner/station-kit.js) relies on:
  - metres. Built with X = width, Z = up. Wall pieces: the wall plane is y = 0 and the piece stands out toward -Y (into the room), origin at the
    bottom centre of the wall plane. Exported Y-up, so in the game X = width, Y = up and the piece's FRONT faces +Z.
  - ceiling pieces hang below z = 0 (origin at the centre of the ceiling plane); floor and free-standing pieces stand on z = 0, origin at their centre.
  - the .glb files carry NO pictures: faces use shared materials by NAME (MATS below) and the game makes one material per name from
    void-runner/assets/textures/station/ (station_textures.py). Tiling materials are box-mapped in metres; st_trim faces are mapped into a named
    atlas region. st_light is the only self-lit plain material; st_accent is the station's own paint colour.
  - hard edges bevelled; cylinders shaded smooth."""
import bpy, bmesh, json, math, os, sys
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import station_textures  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(REPO, 'void-runner', 'assets', 'models', 'station-kit')
TEX = os.path.join(REPO, 'void-runner', 'assets', 'textures', 'station')
MATS = ['st_hull', 'st_wall', 'st_deck', 'st_gunmetal', 'st_steel', 'st_trim', 'st_leather', 'st_glass', 'st_light', 'st_accent', 'st_dark', 'st_counter', 'st_bottle', 'st_marking', 'st_tank']
TILE = {'st_hull': 8.0, 'st_wall': 4.0, 'st_deck': 4.0, 'st_gunmetal': 2.0, 'st_steel': 2.0, 'st_dark': 2.0, 'st_tank': 4.0, 'st_counter': 2.0, 'st_accent': 4.0, 'st_marking': 4.0, 'st_leather': 1.0}
REGIONS = list(station_textures.TRIM_REGIONS)
PREVIEW = {'st_hull': (.45, .47, .5), 'st_wall': (.62, .63, .6), 'st_deck': (.3, .32, .34), 'st_gunmetal': (.2, .22, .25), 'st_steel': (.5, .5, .52), 'st_trim': (.5, .45, .2),
           'st_leather': (.35, .08, .1), 'st_glass': (.3, .4, .45), 'st_light': (1, .85, .6), 'st_accent': (.8, .5, .15), 'st_dark': (.07, .08, .09), 'st_counter': (.1, .1, .11),
           'st_bottle': (.6, .35, .1), 'st_marking': (.8, .6, .12), 'st_tank': (.8, .8, .76)}


class Piece:
    def __init__(self, name):
        self.name, self.b = name, bmesh.new()
        self.mode = self.b.faces.layers.int.new('mode')

    def _tag(self, faces, mat, region=None, smooth=False):
        for f in faces:
            if not f.is_valid:
                continue
            f.material_index = MATS.index(mat)
            f[self.mode] = 0 if region is None else 1 + REGIONS.index(region)
            f.smooth = smooth
        return faces

    def box(self, p0, p1, mat='st_gunmetal', bevel=.012, region=None):
        lo = [min(a, c) for a, c in zip(p0, p1)]
        hi = [max(a, c) for a, c in zip(p0, p1)]
        before = set(self.b.faces)
        made = bmesh.ops.create_cube(self.b, size=1)
        for v in made['verts']:
            v.co = Vector([lo[i] + (v.co[i] + .5) * (hi[i] - lo[i]) for i in range(3)])
        faces = list({f for v in made['verts'] for f in v.link_faces})
        if bevel and min(hi[i] - lo[i] for i in range(3)) > bevel * 3:
            bmesh.ops.bevel(self.b, geom=list({e for f in faces for e in f.edges}), offset=bevel, segments=1, affect='EDGES', profile=.5)
        return self._tag([f for f in self.b.faces if f not in before], mat, region)

    def beam(self, a, b, w, h, mat='st_steel', bevel=0):
        """An oriented box from a to b, w wide and h deep."""
        a, b = Vector(a), Vector(b)
        axis = b - a
        made = bmesh.ops.create_cube(self.b, size=1)
        rot = Vector((0, 0, 1)).rotation_difference(axis.normalized()).to_matrix()
        for v in made['verts']:
            v.co = rot @ Vector((v.co.x * w, v.co.y * h, v.co.z * axis.length)) + (a + b) / 2
        return self._tag(list({f for v in made['verts'] for f in v.link_faces}), mat)

    def cyl(self, a, b, r, mat='st_steel', seg=10, r2=None, caps=True, region=None):
        a, b = Vector(a), Vector(b)
        axis = b - a
        made = bmesh.ops.create_cone(self.b, cap_ends=caps, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=axis.length)
        rot = Vector((0, 0, 1)).rotation_difference(axis.normalized()).to_matrix()
        for v in made['verts']:
            v.co = rot @ v.co + (a + b) / 2
        faces = list({f for v in made['verts'] for f in v.link_faces})
        self._tag(faces, mat, region)
        for f in faces:
            f.smooth = len(f.verts) == 4
        return faces

    def quad(self, corners, mat='st_trim', region=None):
        return self._tag([self.b.faces.new([self.b.verts.new(Vector(c)) for c in corners])], mat, region)

    # Decals: a flat face a few millimetres proud of a surface, mapped into an atlas region.
    def front(self, x0, x1, z0, z1, y, region, mat='st_trim'):       # faces -Y (into the room)
        return self.quad([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], mat, region)

    def up(self, x0, x1, y0, y1, z, region, mat='st_trim'):          # faces +Z
        return self.quad([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], mat, region)

    def down(self, x0, x1, y0, y1, z, region, mat='st_trim'):        # faces -Z
        return self.quad([(x0, y1, z), (x1, y1, z), (x1, y0, z), (x0, y0, z)], mat, region)

    def side(self, y0, y1, z0, z1, x, region, sign=1, mat='st_trim'):   # faces +X (sign 1) or -X
        c = [(x, y0, z0), (x, y1, z0), (x, y1, z1), (x, y0, z1)]
        return self.quad(c if sign > 0 else c[::-1], mat, region)

    def panel(self, x0, x1, z0, z1, y, proud=.05, mat='st_wall', frame='st_gunmetal', border=.07, inset=.025):
        """A framed panel on a wall plane at y: a plate with a raised border."""
        self.box((x0, y - proud + inset, z0), (x1, y, z1), mat, bevel=0)
        for a, b_ in (((x0, z0), (x1, z0 + border)), ((x0, z1 - border), (x1, z1)), ((x0, z0 + border), (x0 + border, z1 - border)), ((x1 - border, z0 + border), (x1, z1 - border))):
            self.box((a[0], y - proud, a[1]), (b_[0], y, b_[1]), frame, bevel=.008)

    def bolts(self, pts, axis='y', r=.018, depth=.012, mat='st_steel'):
        for p in pts:
            q = list(p)
            q['xyz'.index(axis)] -= depth
            self.cyl(p, q, r, mat, seg=6)

    def pipe(self, pts, r, mat='st_steel', seg=8, flange=0):
        for a, b in zip(pts, pts[1:]):
            self.cyl(a, b, r, mat, seg)
            if flange:
                a, b = Vector(a), Vector(b)
                d = (b - a).normalized()
                n = max(1, int((b - a).length / flange))
                for i in range(n):
                    c = a + (b - a) * ((i + .5) / n)
                    self.cyl(c - d * .03, c + d * .03, r * 1.35, 'st_gunmetal', seg)

    def lathe(self, profile, mat, seg=16, axis='z', origin=(0, 0, 0), caps=False):
        """Revolve [(radius, height)] around an axis through origin."""
        rings = []
        for r, h in profile:
            ring = []
            for i in range(seg):
                a = 2 * math.pi * i / seg
                p = {'z': (math.cos(a) * r, math.sin(a) * r, h), 'x': (h, math.cos(a) * r, math.sin(a) * r), 'y': (math.sin(a) * r, h, math.cos(a) * r)}[axis]
                ring.append(self.b.verts.new(Vector(p) + Vector(origin)))
            rings.append(ring)
        faces = []
        for r0, r1 in zip(rings, rings[1:]):
            for i in range(seg):
                faces.append(self.b.faces.new([r0[i], r0[(i + 1) % seg], r1[(i + 1) % seg], r1[i]]))
        self._tag(faces, mat, smooth=True)
        return faces

    def finish(self):
        b = self.b
        bmesh.ops.remove_doubles(b, verts=b.verts, dist=1e-5)
        uv = b.loops.layers.uv.verify()
        for f in b.faces:
            n = f.normal
            ax = max(range(3), key=lambda i: abs(n[i]))
            ua, va = [(1, 2), (0, 2), (0, 1)][ax]
            mode = f[self.mode]
            if mode == 0:
                tile = TILE.get(MATS[f.material_index], 1.0)
                for l in f.loops:
                    l[uv].uv = (l.vert.co[ua] / tile, l.vert.co[va] / tile)
            else:
                us, vs = [l.vert.co[ua] for l in f.loops], [l.vert.co[va] for l in f.loops]
                u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
                r0, s0, r1, s1 = station_textures.TRIM_REGIONS[REGIONS[mode - 1]]
                pad = .004
                for l in f.loops:
                    tu, tv = (l.vert.co[ua] - u0) / max(u1 - u0, 1e-6), (l.vert.co[va] - v0) / max(v1 - v0, 1e-6)
                    if (ax == 1 and n[1] > 0) or (ax == 0 and n[0] < 0) or (ax == 2 and n[2] < 0):
                        tu = 1 - tu
                    l[uv].uv = (r0 + pad + tu * (r1 - r0 - 2 * pad), s0 + pad + tv * (s1 - s0 - 2 * pad))
        bmesh.ops.triangulate(b, faces=b.faces)
        mesh = bpy.data.meshes.new(self.name)
        b.to_mesh(mesh)
        tris = len(b.faces)
        b.free()
        used = sorted({p.material_index for p in mesh.polygons})
        remap = {old: new for new, old in enumerate(used)}
        for p in mesh.polygons:
            p.material_index = remap[p.material_index]
        for i in used:
            mesh.materials.append(material(MATS[i]))
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        return obj, tris, [MATS[i] for i in used]


def material(name):
    m = bpy.data.materials.get(name)
    if not m:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (*PREVIEW[name], 1)
        bsdf.inputs['Roughness'].default_value = .6
        if name == 'st_light':
            bsdf.inputs['Emission Color'].default_value = (1, .85, .6, 1)
            bsdf.inputs['Emission Strength'].default_value = 1
    return m


# =============================================================== interior walls ===============================================================
def corners(x0, x1, z0, z1, y, m=.05):
    return [(x0 + m, y, z0 + m), (x1 - m, y, z0 + m), (x0 + m, y, z1 - m), (x1 - m, y, z1 - m)]


def wall_low(p, W=2.0):
    h = W / 2
    p.box((-h, -.04, 0), (h, 0, 1.1), 'st_gunmetal', bevel=0)
    p.box((-h, -.11, 0), (h, 0, .16), 'st_dark', bevel=.015)                                 # kick plate
    p.front(-h, h, .16, .2, -.045, 'rubber')
    for a, b in ((-h + .03, -.02), (.02, h - .03)):
        p.panel(a, b, .22, .94, -.04, proud=.06, mat='st_wall', frame='st_gunmetal', border=.05)
        p.bolts(corners(a, b, .22, .94, -.1, .025), r=.012)
    p.box((-h, -.13, .97), (h, 0, 1.1), 'st_steel', bevel=.02)                               # rail
    p.box((-h, -.15, 1.0), (h, -.13, 1.07), 'st_accent', bevel=.006)


def _backing(p, W, H, mat='st_gunmetal'):
    p.box((-W / 2, -.04, 0), (W / 2, 0, H), mat, bevel=0)


def wall_mid_a(p, W=2.0, H=1.5):
    _backing(p, W, H)
    p.panel(-W / 2 + .03, W / 2 - .03, .04, H - .04, -.04, proud=.07, border=.09)
    p.box((-W / 2 + .22, -.085, .22), (W / 2 - .22, -.04, H - .22), 'st_wall', bevel=.015)   # raised centre plate
    p.bolts(corners(-W / 2 + .03, W / 2 - .03, .04, H - .04, -.11, .045), r=.016)
    p.front(-.9 + .34, -.9 + .62, H - .52, H - .30, -.088, 'label_d')


def wall_mid_b(p, W=2.0, H=1.5):
    _backing(p, W, H)
    p.panel(-W / 2 + .03, -.03, .04, H - .04, -.04, proud=.07)
    p.box((-.82, -.05, .25), (-.2, -.03, 1.15), 'st_dark', bevel=0)
    p.front(-.8, -.22, .27, 1.13, -.052, 'vent')
    p.panel(.03, W / 2 - .03, .04, H - .04, -.04, proud=.07)
    p.front(.3, .7, .7, 1.1, -.048, 'label_c')
    p.pipe([(.86, -.12, 0), (.86, -.12, H)], .035, 'st_steel', flange=.75)
    p.box((.78, -.16, .55), (.94, -.04, .75), 'st_gunmetal', bevel=.01)
    p.front(.8, .92, .6, .7, -.162, 'led_green')


def wall_mid_c(p, W=2.0, H=1.5):
    _backing(p, W, H)
    p.panel(-W / 2 + .03, W / 2 - .03, .04, H - .04, -.04, proud=.07, border=.3, frame='st_wall')
    p.box((-.68, -.03, .32), (.68, -.012, H - .32), 'st_dark', bevel=0)                      # recessed service hatch
    p.box((-.62, -.06, .38), (.62, -.03, H - .38), 'st_gunmetal', bevel=.02)
    for x in (-.45, .45):
        p.cyl((x, -.11, .55), (x, -.11, .95), .018, 'st_steel', 8)
        for z in (.55, .95):
            p.cyl((x, -.06, z), (x, -.11, z), .014, 'st_steel', 6)
    p.front(-.62, .62, .38, .5, -.062, 'hazard')
    p.front(-.2, .2, .62, 1.0, -.062, 'label_a')
    p.bolts(corners(-.62, .62, .38, H - .38, -.06, .05), r=.014)


def wall_mid_d(p, W=2.0, H=1.5):
    _backing(p, W, H)
    p.panel(-W / 2 + .03, W / 2 - .03, .04, H - .04, -.04, proud=.07)
    p.box((-.5, -.17, .45), (.34, -.04, 1.2), 'st_gunmetal', bevel=.03)                      # console housing
    p.front(-.44, .12, .55, 1.14, -.172, 'screen_a')
    p.front(.15, .31, .62, .82, -.172, 'keypad')
    p.front(.15, .31, .9, 1.06, -.172, 'led_amber')
    p.box((.55, -.12, .2), (.8, -.04, .6), 'st_dark', bevel=.012)
    p.pipe([(.675, -.09, .6), (.675, -.09, H)], .028, 'st_steel')
    p.pipe([(-.08, -.1, 1.2), (-.08, -.1, H)], .022, 'st_steel')


def wall_mid_e(p, W=2.0, H=1.5):
    _backing(p, W, H)
    p.box((-W / 2, -.06, .04), (W / 2, -.04, H - .04), 'st_wall', bevel=0)
    for i in range(7):
        x = -W / 2 + .2 + i * (W - .4) / 6
        p.box((x - .035, -.115, .08), (x + .035, -.06, H - .08), 'st_gunmetal', bevel=.012)
    p.box((-W / 2, -.125, .62), (W / 2, -.1, .86), 'st_accent', bevel=.006)
    p.front(-W / 2, W / 2, .7, .78, -.127, 'led_white', mat='st_dark')


def wall_mid_port(p, W=2.0, H=1.5):
    """The bay around a corridor porthole: the wall is cut away round a 1.4 x 0.9 m opening (the game's own glass stands in it)."""
    h = W / 2
    for a, b in (((-h, 0), (h, .2)), ((-h, 1.1), (h, H)), ((-h, .2), (-.7, 1.1)), ((.7, .2), (h, 1.1))):
        p.box((a[0], -.04, a[1]), (b[0], 0, b[1]), 'st_gunmetal', bevel=0)
        p.box((a[0] + .02, -.09, a[1] + .02), (b[0] - .02, -.04, b[1] - .02), 'st_wall', bevel=.012)
    p.front(-.7, .7, .2, 1.1, -.004, 'win_dark')
    p.bolts([(x, -.09, z) for x in (-.88, .88) for z in (.1, .65, 1.3)], r=.016)


def wall_top(p, W=2.0, H=1.0):
    h = W / 2
    _backing(p, W, H)
    p.box((-h, -.34, .22), (h, 0, .26), 'st_steel', bevel=.008)                               # cable tray
    p.box((-h, -.345, .22), (h, -.32, .36), 'st_steel', bevel=.006)
    p.box((-h, -.3, .26), (h, -.06, .34), 'st_trim', bevel=0, region='cable')
    for x in (-h + .25, h - .25):
        p.beam((x, -.3, .22), (x, -.02, .02), .04, .04, 'st_gunmetal')
    p.pipe([(-h, -.14, .62), (h, -.14, .62)], .055, 'st_steel', flange=1.0)
    p.pipe([(-h, -.1, .82), (h, -.1, .82)], .035, 'st_accent', seg=8)
    for x in (-h + .5, h - .5):
        p.box((x - .03, -.21, .5), (x + .03, 0, .9), 'st_gunmetal', bevel=.008)
    p.box((-h + .15, -.3, .12), (h - .15, -.1, .22), 'st_gunmetal', bevel=.012)              # light housing under the tray
    p.down(-h + .2, h - .2, -.27, -.13, .118, None, mat='st_light')
    p.box((-h, -.05, H - .1), (h, 0, H), 'st_dark', bevel=0)


def wall_clere(p, W=2.0, H=1.4):
    h = W / 2
    _backing(p, W, H)
    p.box((-h + .02, -.07, .03), (h - .02, -.04, H - .03), 'st_wall', bevel=.012)
    for z in (.36, .7, 1.04):
        p.box((-h + .02, -.075, z - .012), (h - .02, -.068, z + .012), 'st_dark', bevel=0)
    p.box((-h, -.1, .0), (-h + .06, -.04, H), 'st_gunmetal', bevel=.01)
    p.box((h - .06, -.1, .0), (h, -.04, H), 'st_gunmetal', bevel=.01)
    p.front(-.25, .25, .42, .64, -.072, 'stripe')


def pilaster(p, H=3.6, w=.3, d=.22):
    p.box((-w / 2, -d, 0), (w / 2, -d + .04, H), 'st_gunmetal', bevel=.01)                    # flange
    p.box((-.04, -d + .04, 0), (.04, 0, H), 'st_gunmetal', bevel=0)                           # web
    p.box((-w / 2, -.04, 0), (w / 2, 0, H), 'st_gunmetal', bevel=0)
    p.box((-w / 2 - .05, -d - .04, 0), (w / 2 + .05, 0, .22), 'st_dark', bevel=.02)           # shoe
    p.box((-w / 2 - .04, -d - .03, H - .2), (w / 2 + .04, 0, H), 'st_dark', bevel=.02)
    z = .6
    while z < H - .4:
        p.box((-w / 2, -d - .012, z), (w / 2, -d, z + .1), 'st_steel', bevel=.004)
        p.bolts([(-w / 2 + .06, -d - .012, z + .05), (w / 2 - .06, -d - .012, z + .05)], r=.014)
        z += 1.0
    p.front(-w / 2, w / 2, .24, .5, -d - .002, 'hazard')


def hangar_panel_a(p, W=4.0, H=5.4):
    h = W / 2
    _backing(p, W, H)
    for (a, b, c, d) in ((-h + .05, -.03, .05, H / 2 - .03), (.03, h - .05, .05, H / 2 - .03), (-h + .05, -.03, H / 2 + .03, H - .05), (.03, h - .05, H / 2 + .03, H - .05)):
        p.box((a, -.1, c), (b, -.04, d), 'st_hull', bevel=.02)
        p.bolts(corners(a, b, c, d, -.1, .1), r=.022)
    for a, b in (((-h + .1, 0), (h - .1, H)), ((-h + .1, H), (h - .1, 0))):                      # cross brace
        p.beam((a[0], -.16, a[1] + (.2 if a[1] == 0 else -.2)), (b[0], -.16, b[1] + (-.2 if b[1] == H else .2)), .12, .06, 'st_gunmetal')
    p.box((-.22, -.2, H / 2 - .22), (.22, -.13, H / 2 + .22), 'st_steel', bevel=.02)
    p.bolts([(x, -.2, H / 2 + z) for x in (-.14, .14) for z in (-.14, .14)], r=.024)
    p.front(-h + .3, -.3, .5, 1.0, -.102, 'bay_no')
    p.front(.5, 1.5, H - 1.1, H - .85, -.102, 'stripe')


def hangar_panel_b(p, W=4.0, H=5.4):
    h = W / 2
    _backing(p, W, H)
    p.box((-h + .05, -.09, .05), (h - .05, -.04, H - .05), 'st_hull', bevel=.02)
    for z, r in ((1.0, .13), (1.42, .09), (4.4, .16)):
        p.pipe([(-h, -.26, z), (h, -.26, z)], r, 'st_steel' if r < .15 else 'st_tank', seg=10, flange=2.0)
        for x in (-h + .6, h - .6):
            p.box((x - .05, -.26, z - r - .04), (x + .05, -.04, z + r + .04), 'st_gunmetal', bevel=.01)
    p.box((-1.5, -.24, 2.0), (-.3, -.09, 3.6), 'st_gunmetal', bevel=.03)                      # junction cabinet
    p.front(-1.42, -.38, 2.6, 3.52, -.242, 'vent')
    p.front(-1.3, -.9, 2.1, 2.5, -.242, 'label_d')
    p.front(-.8, -.45, 2.15, 2.45, -.242, 'screen_b')
    for x in (.9, 1.4):                                                                       # ladder
        p.cyl((x, -.2, .1), (x, -.2, H - .1), .025, 'st_steel', 8)
    z = .4
    while z < H - .2:
        p.cyl((.9, -.2, z), (1.4, -.2, z), .018, 'st_steel', 6)
        z += .35
    for z in (.3, H / 2, H - .3):
        for x in (.9, 1.4):
            p.cyl((x, -.2, z), (x, -.09, z), .016, 'st_steel', 6)
    p.front(.4, .8, 1.9, 2.3, -.092, 'label_a')


def hangar_rib(p, H=9.0, w=.7, d=.5):
    p.box((-w / 2, -d, 0), (w / 2, -d + .07, H), 'st_gunmetal', bevel=.02)
    p.box((-.06, -d + .07, 0), (.06, 0, H), 'st_gunmetal', bevel=0)
    p.box((-w / 2, -.07, 0), (w / 2, 0, H), 'st_gunmetal', bevel=0)
    p.box((-w / 2 - .1, -d - .08, 0), (w / 2 + .1, 0, .5), 'st_dark', bevel=.04)
    p.front(-w / 2 - .1, w / 2 + .1, .1, .4, -d - .082, 'hazard')
    z = 1.2
    while z < H - .5:
        for s in (-1, 1):
            p.beam((s * .06, -d + .07, z - .35), (s * .06, -.07, z), .03, .5, 'st_steel')     # gusset
        p.box((-w / 2, -d - .015, z), (w / 2, -d, z + .16), 'st_steel', bevel=.005)
        p.bolts([(x, -d - .015, z + .08) for x in (-.24, -.08, .08, .24)], r=.02)
        z += 1.5
    p.box((-.3, -d - .22, 6.1), (.3, -d, 6.4), 'st_dark', bevel=.03)                          # work light
    p.quad([(-.26, -d - .2, 6.1), (.26, -d - .2, 6.1), (.26, -d - .02, 6.1), (-.26, -d - .02, 6.1)][::-1], 'st_light')
    p.pipe([(.22, -d - .06, .5), (.22, -d - .06, H)], .03, 'st_accent', seg=6)


# =============================================================== ceilings ===============================================================
def ceil_corridor(p, W=4.4, L=2.0):
    h, l = W / 2, L / 2
    p.box((-h, -l, -.06), (h, l, 0), 'st_dark', bevel=0)
    p.box((-h, -.07, -.3), (h, .07, -.06), 'st_gunmetal', bevel=.015)                         # cross rib
    for s in (-1, 1):
        p.box((s * 1.25, -l, -.36), (s * 1.95, l, -.08), 'st_steel', bevel=.02)               # duct
        for y in (-l + .02, 0):
            p.box((s * 1.22, y, -.38), (s * 1.98, y + .05, -.06), 'st_gunmetal', bevel=.006)
        p.down(min(s * 1.35, s * 1.85), max(s * 1.35, s * 1.85), -.75, -.25, -.362, 'vent')
        p.box((s * .78, -l, -.17), (s * 1.08, l, -.14), 'st_steel', bevel=0)                  # cable tray
        p.box((s * .8, -l, -.14), (s * 1.06, l, -.09), 'st_trim', bevel=0, region='cable')
        p.pipe([(s * 2.08, -l, -.14), (s * 2.08, l, -.14)], .04, 'st_accent' if s > 0 else 'st_steel', seg=6)
    for y in (-.6, .6):
        p.cyl((0, y, -.34), (0, y, -.06), .02, 'st_steel', 6)
    p.box((-.42, -.8, -.44), (.42, .8, -.34), 'st_gunmetal', bevel=.02)                       # light trough, hung below the rib
    p.down(-.34, .34, -.72, .72, -.442, None, mat='st_light')
    for y in (-.36, 0, .36):
        p.box((-.36, y - .012, -.46), (.36, y + .012, -.44), 'st_dark', bevel=0)


def ceil_room(p, variant='a', W=4.0, L=4.0):
    h, l = W / 2, L / 2
    p.box((-h, -l, -.05), (h, l, 0), 'st_dark', bevel=0)
    for s in (-1, 1):
        p.box((s * h - .1 * (s > 0), -l, -.34), (s * h + .1 * (s < 0), l, -.05), 'st_gunmetal', bevel=.012)
        p.box((-h, s * l - .1 * (s > 0), -.34), (h, s * l + .1 * (s < 0), -.05), 'st_gunmetal', bevel=.012)
    p.box((-h, -.06, -.26), (h, .06, -.05), 'st_gunmetal', bevel=.012)
    p.box((-.06, -l, -.26), (.06, l, -.05), 'st_gunmetal', bevel=.012)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cx, cy = sx * h / 2, sy * l / 2
            p.box((cx - h / 2 + .16, cy - l / 2 + .16, -.09), (cx + h / 2 - .16, cy + l / 2 - .16, -.05), 'st_wall', bevel=.01)
    if variant == 'a':
        for sy in (-1, 1):
            for x in (-.5, .5):
                p.cyl((x, sy * l / 2, -.4), (x, sy * l / 2, -.09), .018, 'st_steel', 6)
            p.box((-.75, sy * l / 2 - .2, -.5), (.75, sy * l / 2 + .2, -.4), 'st_gunmetal', bevel=.02)
            p.down(-.68, .68, sy * l / 2 - .14, sy * l / 2 + .14, -.502, None, mat='st_light')
        p.pipe([(-h, l * .82, -.42), (h, l * .82, -.42)], .04, 'st_steel', seg=6, flange=1.3)
    else:
        p.pipe([(h * .5, -l, -.5), (h * .5, l, -.5)], .2, 'st_steel', seg=12, flange=1.33)
        for y in (-l * .6, l * .6):
            p.box((h * .5 - .03, y - .03, -.3), (h * .5 + .03, y + .03, -.05), 'st_gunmetal', bevel=0)
        p.box((-h * .5 - .5, -.5, -.16), (-h * .5 + .5, .5, -.09), 'st_gunmetal', bevel=.02)
        p.down(-h * .5 - .44, -h * .5 + .44, -.44, .44, -.162, 'vent')
        p.pipe([(-h, -l * .8, -.4), (h, -l * .8, -.4)], .03, 'st_accent', seg=6)
        p.box((-h * .5 - .5, l * .5 - .12, -.46), (-h * .5 + .5, l * .5 + .12, -.09), 'st_gunmetal', bevel=.015)
        p.down(-h * .5 - .44, -h * .5 + .44, l * .5 - .07, l * .5 + .07, -.462, None, mat='st_light')


def hangar_truss(p, span=36.0, depth=1.6):
    h = span / 2
    for z in (-.12, -depth):
        for y in (-.22, .22):
            p.box((-h, y - .07, z - .07), (h, y + .07, z + .07), 'st_gunmetal', bevel=0)
    n = 12
    step = span / n
    for i in range(n + 1):
        x = -h + i * step
        for y in (-.22, .22):
            p.box((x - .05, y - .05, -depth), (x + .05, y + .05, -.12), 'st_gunmetal', bevel=0)
        p.box((x - .04, -.22, -depth - .03), (x + .04, .22, -depth + .03), 'st_steel', bevel=0)
        if i < n:
            a, b = ((x, -depth), (x + step, -.12)) if i % 2 == 0 else ((x, -.12), (x + step, -depth))
            for y in (-.22, .22):
                p.beam((a[0], y, a[1]), (b[0], y, b[1]), .07, .07, 'st_steel')
    for x in (-13.5, -4.5, 4.5, 13.5):                                                           # hanging flood lights
        p.cyl((x, 0, -depth), (x, 0, -depth - .35), .03, 'st_steel', 6)
        p.box((x - .7, -.32, -depth - .62), (x + .7, .32, -depth - .35), 'st_dark', bevel=.05)
        p.down(x - .62, x + .62, -.25, .25, -depth - .622, None, mat='st_light')
        p.box((x - .72, -.34, -depth - .5), (x + .72, .34, -depth - .46), 'st_accent', bevel=0)
    p.pipe([(-h, .34, -.5), (h, .34, -.5)], .06, 'st_steel', seg=8, flange=3.0)


def hangar_ceil(p, W=6.0, L=6.0):
    h, l = W / 2, L / 2
    p.box((-h, -l, -.08), (h, l, 0), 'st_gunmetal', bevel=0)
    for i in range(7):
        x = -h + i * W / 6
        p.box((x - .05, -l, -.28), (x + .05, l, -.08), 'st_dark', bevel=0)
    p.box((-h, -.1, -.4), (h, .1, -.08), 'st_gunmetal', bevel=.02)
    p.pipe([(-h * .5, -l, -.5), (-h * .5, l, -.5)], .16, 'st_steel', seg=10, flange=2.0)
    p.box((h * .2, -1.2, -.34), (h * .8, 1.2, -.08), 'st_steel', bevel=.03)
    p.down(h * .25, h * .75, -1.0, 1.0, -.342, 'vent')


def hangar_crane(p, span=35.0):
    h = span / 2
    for y in (-.6, .6):
        p.box((-h, y - .16, -.7), (h, y + .16, 0), 'st_accent', bevel=.02)                    # girders
        p.box((-h, y - .22, -.74), (h, y + .22, -.66), 'st_gunmetal', bevel=0)
    for x in (-h + .3, h - .3):
        p.box((x - .4, -1.1, -.9), (x + .4, 1.1, .1), 'st_gunmetal', bevel=.04)                 # end trucks
        p.front(x - .4, x + .4, -.8, -.5, -1.102, 'hazard')
    x = 5.0
    p.box((x - .9, -.85, -.62), (x + .9, .85, -.1), 'st_gunmetal', bevel=.05)                   # trolley
    p.cyl((x - .5, 0, -.36), (x + .5, 0, -.36), .3, 'st_steel', 12)
    for s in (-.12, .12):
        p.cyl((x + s, 0, -.6), (x + s, 0, -2.6), .012, 'st_dark', 5)
    p.box((x - .22, -.14, -3.0), (x + .22, .14, -2.6), 'st_accent', bevel=.03)                  # hook block
    p.front(x - .22, x + .22, -2.95, -2.75, -.142, 'hazard')
    p.cyl((x, 0, -3.0), (x, 0, -3.25), .04, 'st_steel', 6)
    for i in range(6):                                                                           # the hook
        a0, a1 = math.pi * (.5 - i / 5 * 1.3), math.pi * (.5 - (i + 1) / 5 * 1.3)
        p.cyl((x + math.cos(a0) * .14 - .0, 0, -3.39 + math.sin(a0) * .14), (x + math.cos(a1) * .14, 0, -3.39 + math.sin(a1) * .14), .035, 'st_steel', 6)
    p.pipe([(-h, .9, -.3), (h, .9, -.3)], .03, 'st_dark', seg=6)


# =============================================================== floors and markings ===============================================================
def floor_grate(p, L=2.0, W=.5):
    p.box((-L / 2, -W / 2, 0), (L / 2, W / 2, .03), 'st_steel', bevel=.008)
    p.up(-L / 2 + .04, L / 2 - .04, -W / 2 + .04, W / 2 - .04, .032, 'grate')


def floor_hazard(p, L=4.0, W=.3):
    p.up(-L / 2, L / 2, -W / 2, W / 2, .012, 'hazard')


def floor_chevron(p, L=4.0, W=.6):
    p.up(-L / 2, L / 2, -W / 2, W / 2, .012, 'chevron')


def floor_line(p, L=4.0, W=.5):
    p.up(-L / 2, L / 2, -W / 2, W / 2, .012, 'marking')


def pad_ring(p, r=5.2):
    seg = 48
    for (r0, r1) in ((r - .28, r), (r * .45, r * .45 + .12)):
        vs = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            vs.append((p.b.verts.new((math.cos(a) * r0, math.sin(a) * r0, .012)), p.b.verts.new((math.cos(a) * r1, math.sin(a) * r1, .012))))
        for i in range(seg):
            if r0 > r * .5 and i % 12 in (0, 11):          # gaps at the four quarters
                continue
            a, b = vs[i], vs[(i + 1) % seg]
            p._tag([p.b.faces.new([a[0], a[1], b[1], b[0]])], 'st_marking')
    for a in range(4):
        c, s = math.cos(a * math.pi / 2), math.sin(a * math.pi / 2)
        q = [(-.12, r * .55), (.12, r * .55), (.12, r * 1.12), (-.12, r * 1.12)]
        p._tag([p.b.faces.new([p.b.verts.new((x * c - y * s, x * s + y * c, .012)) for x, y in q])], 'st_marking')
    for sx in (-1, 1):
        for sy in (-1, 1):
            cx, cy = sx * r * 1.05, sy * r * 1.05
            p.up(min(cx, cx - sx * 1.2), max(cx, cx - sx * 1.2), min(cy, cy - sy * .14), max(cy, cy - sy * .14), .012, None, mat='st_marking')
            p.up(min(cx, cx - sx * .14), max(cx, cx - sx * .14), min(cy, cy - sy * 1.2), max(cy, cy - sy * 1.2), .012, None, mat='st_marking')
    for i in range(12):
        a = 2 * math.pi * (i + .5) / 12
        p.cyl((math.cos(a) * (r + .35), math.sin(a) * (r + .35), 0), (math.cos(a) * (r + .35), math.sin(a) * (r + .35), .035), .09, 'st_dark', 8)
        x, y = math.cos(a) * (r + .35), math.sin(a) * (r + .35)
        p.up(x - .05, x + .05, y - .05, y + .05, .037, None, mat='st_light')


# =============================================================== doors and windows ===============================================================
def door_frame(p, W=3.2, H=3.4, jamb=.42, d=.26):
    h = W / 2
    for s in (-1, 1):
        x0, x1 = (h, h + jamb) if s > 0 else (-h - jamb, -h)
        p.box((x0, -d, 0), (x1, 0, H + .1), 'st_gunmetal', bevel=.03)
        p.front(x0 + .04, x1 - .04, .05, 1.1, -d - .003, 'hazard')
        p.box((x0 + .1, -d - .03, 1.4), (x1 - .1, -d, 2.0), 'st_dark', bevel=.01)
        p.front(x0 + .13, x1 - .13, 1.72, 1.94, -d - .033, 'led_green' if s > 0 else 'keypad')
        p.front(x0 + .13, x1 - .13, 1.44, 1.66, -d - .033, 'label_b' if s > 0 else 'led_amber')
        p.cyl((s * (h + jamb * .5), -d - .06, 2.3), (s * (h + jamb * .5), -d - .06, H - .1), .05, 'st_steel', 8)   # actuator
        p.cyl((s * (h + jamb * .5), -d - .06, 2.6), (s * (h + jamb * .5), -d - .06, H - .2), .075, 'st_dark', 8)
        p.bolts([(s * (h + jamb * .5) + dx, -d, z) for z in (1.2, 2.15) for dx in (-.12, .12)], r=.022)
    p.box((-h - jamb, -d, H), (h + jamb, 0, H + .55), 'st_gunmetal', bevel=.03)                   # header
    p.box((-h + .2, -d - .04, H + .12), (h - .2, -d, H + .42), 'st_dark', bevel=.01)
    p.front(-h + .3, h - .3, H + .02, H + .09, -d - .003, 'led_white', mat='st_light')
    p.front(-h, h, H + .44, H + .52, -d - .003, 'hazard')
    p.box((-h - jamb, -.12, 0), (h + jamb, .0, .03), 'st_steel', bevel=0)                         # threshold
    p.up(-h, h, -.12, 0, .032, 'tread')


def portal(p, W=3.0, H=3.4, jamb=.2, d=.1):
    h = W / 2
    for s in (-1, 1):
        x0, x1 = (h, h + jamb) if s > 0 else (-h - jamb, -h)
        p.box((x0, -d, 0), (x1, 0, H), 'st_gunmetal', bevel=.02)
        p.front(x0 + .02, x1 - .02, .04, .8, -d - .003, 'hazard')
        p.front(x0 + .05, x1 - .05, 1.5, 1.6, -d - .003, 'led_green')
    p.box((-h - jamb, -d, H), (h + jamb, 0, H + .2), 'st_gunmetal', bevel=.02)
    p.front(-h + .1, h - .1, H + .06, H + .1, -d - .003, None, mat='st_light')


def window_bay(p, W=4.0, sill=1.1, top=3.4, H=5.0):
    h = W / 2
    # sill unit with a heater grille; lintel with a downlight; posts at both ends. The glass (the game's own) stands behind at the wall plane.
    p.box((-h, -.3, 0), (h, .3, sill - .08), 'st_gunmetal', bevel=.02)
    p.box((-h, -.36, sill - .08), (h, .3, sill), 'st_steel', bevel=.015)
    p.front(-h + .3, h - .3, .2, .7, -.302, 'vent')
    p.front(-h + .1, h - .1, .04, .12, -.302, 'rubber')
    for s in (-1, 1):
        p.box((s * h - .09, -.26, sill), (s * h + .09, .3, top), 'st_gunmetal', bevel=.02)
        p.bolts([(s * h, -.26, z) for z in (sill + .3, (sill + top) / 2, top - .3)], r=.022)
    p.box((-h, -.3, top), (h, .3, H), 'st_gunmetal', bevel=.02)
    p.box((-h + .1, -.34, top + .3), (h - .1, -.3, H - .2), 'st_wall', bevel=.012)
    p.box((-h + .4, -.2, top - .05), (h - .4, .1, top), 'st_dark', bevel=.01)
    p.down(-h + .5, h - .5, -.14, .04, top - .052, None, mat='st_light')
    p.front(-.5, .5, top + .5, top + .8, -.342, 'stripe')


def porthole(p, W=1.4, H=.9):
    w, h = W / 2 + .12, H / 2 + .12
    for a, b in (((-w, -h), (w, -h + .12)), ((-w, h - .12), (w, h)), ((-w, -h + .12), (-w + .12, h - .12)), ((w - .12, -h + .12), (w, h - .12))):
        p.box((a[0], -.1, a[1]), (b[0], 0, b[1]), 'st_gunmetal', bevel=.025)
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.beam((sx * (w - .12), -.06, sz * (h - .32)), (sx * (w - .32), -.06, sz * (h - .12)), .05, .06, 'st_gunmetal')
    p.bolts([(sx * (w - .06), -.1, sz * z) for sx in (-1, 1) for sz in (-1, 1) for z in (.0, h - .06)] + [(x, -.1, sz * (h - .06)) for sz in (-1, 1) for x in (-.4, 0, .4)], r=.02)
    p.box((-w + .2, -.13, h), (w - .2, -.02, h + .07), 'st_dark', bevel=.01)
    p.down(-w + .25, w - .25, -.11, -.04, h - .001, None, mat='st_light')


# =============================================================== furniture ===============================================================
def bar_counter(p, L=2.0, D=1.2, H=1.15):
    l, d = L / 2, D / 2
    p.box((-l, -d + .1, .1), (l, d, H - .06), 'st_dark', bevel=0)
    p.box((-l, -d + .06, 0), (l, d, .1), 'st_gunmetal', bevel=.01)
    for a, b in ((-l + .03, -.02), (.02, l - .03)):
        p.panel(a, b, .16, H - .14, -d + .1, proud=.05, mat='st_gunmetal', frame='st_steel', border=.04)
    p.box((-l, -d - .02, H - .06), (l, d + .02, H), 'st_counter', bevel=.015)
    p.box((-l, -d - .035, H - .075), (l, -d - .02, H - .045), 'st_steel', bevel=0)
    p.cyl((-l, -d - .1, .22), (l, -d - .1, .22), .025, 'st_steel', 8)                           # foot rail
    for x in (-l + .3, l - .3):
        p.cyl((x, -d - .1, .22), (x, -d + .1, .22), .018, 'st_steel', 6)
    p.box((-l + .05, -d + .07, H - .11), (l - .05, -d + .1, H - .08), 'st_dark', bevel=0)
    p.down(-l + .06, l - .06, -d + .02, -d + .09, H - .112, None, mat='st_light')


def backbar(p, L=2.0, D=.5, H=2.8):
    l = L / 2
    p.box((-l, -.03, 0), (l, 0, H), 'st_dark', bevel=0)
    p.box((-l, -D, 0), (l, 0, .9), 'st_gunmetal', bevel=.012)
    p.box((-l, -D - .02, .9), (l, 0, .95), 'st_counter', bevel=.01)
    for a, b in ((-l + .04, -.02), (.02, l - .04)):
        p.panel(a, b, .08, .84, -D, proud=.03, mat='st_dark', frame='st_steel', border=.035)
    for s in (-1, 1):
        p.box((s * l - .04 * (s > 0), -D + .1, .95), (s * l + .04 * (s < 0), 0, H), 'st_gunmetal', bevel=.008)
    for z in (1.55, 2.15):
        p.box((-l, -D + .12, z), (l, 0, z + .035), 'st_steel', bevel=.006)
        p.down(-l + .05, l - .05, -D + .14, -D + .17, z - .001, None, mat='st_light')
    p.box((-l, -D + .08, H - .14), (l, 0, H), 'st_gunmetal', bevel=.012)
    import random
    rng = random.Random(7)
    for z in (.95, 1.585, 2.185):
        x = -l + .14
        while x < l - .1:
            r, hh = rng.choice([(.038, .24), (.045, .2), (.032, .28), (.05, .16)])
            mat = rng.choice(['st_bottle', 'st_bottle', 'st_glass', 'st_dark'])
            y = -D + .28 + rng.uniform(-.05, .05)
            p.cyl((x, y, z), (x, y, z + hh), r, mat, 8)
            p.cyl((x, y, z + hh), (x, y, z + hh + .08), r * .38, mat, 6)
            x += rng.uniform(.11, .2)


def booth(p, L=3.2, D=1.0):
    l = L / 2
    # the sitter faces -Y; the back stands at +Y
    p.box((-l, -D / 2, 0), (l, D / 2, .18), 'st_dark', bevel=.01)
    n = 3
    for i in range(n):
        a, b = -l + .06 + i * (L - .12) / n, -l + .06 + (i + 1) * (L - .12) / n
        p.box((a + .015, -D / 2 + .02, .18), (b - .015, D / 2 - .22, .46), 'st_leather', bevel=.045)
        p.box((a + .015, D / 2 - .26, .4), (b - .015, D / 2 - .04, 1.0), 'st_leather', bevel=.045)
    p.box((-l, D / 2 - .05, 0), (l, D / 2 + .02, 1.06), 'st_gunmetal', bevel=.015)
    for s in (-1, 1):
        p.box((s * l - .06 * (s > 0), -D / 2, 0), (s * l + .06 * (s < 0), D / 2, .62), 'st_gunmetal', bevel=.02)
    p.box((-l, D / 2 - .05, 1.06), (l, D / 2 + .02, 1.1), 'st_steel', bevel=.008)


def table(p, L=2.2, D=1.2, H=.8):
    p.box((-L / 2, -D / 2, H - .05), (L / 2, D / 2, H), 'st_counter', bevel=.015)
    p.box((-L / 2 - .008, -D / 2 - .008, H - .045), (L / 2 + .008, D / 2 + .008, H - .02), 'st_steel', bevel=0)
    for x in (-.6, .6):
        p.cyl((x, 0, .03), (x, 0, H - .05), .05, 'st_steel', 10)
        p.cyl((x, 0, 0), (x, 0, .03), .26, 'st_gunmetal', 12)
        p.cyl((x, 0, H - .09), (x, 0, H - .05), .14, 'st_gunmetal', 10)
    p.box((-.6, -.02, .28), (.6, .02, .32), 'st_steel', bevel=0)


def chair(p):
    # the sitter faces -Y
    for x in (-.24, .24):
        for y in (-.22, .22):
            p.cyl((x, y, 0), (x, y, .46), .018, 'st_steel', 6)
        p.cyl((x, .24, .46), (x, .3, 1.0), .018, 'st_steel', 6)
    p.box((-.28, -.27, .44), (.28, .27, .47), 'st_gunmetal', bevel=.01)
    p.box((-.27, -.26, .47), (.27, .24, .55), 'st_leather', bevel=.03)
    p.box((-.27, .22, .62), (.27, .3, 1.02), 'st_leather', bevel=.03)
    p.cyl((-.24, 0, .2), (.24, 0, .2), .012, 'st_steel', 5)


def pod_shell(p, W=1.5, H=1.15):
    w = W / 2
    # a moulded surround around one sleeping pod's hatch (the wall plane is the hatch plane)
    for a, b in (((-w - .06, -.06), (w + .06, .1)), ((-w - .06, H - .1), (w + .06, H + .06)), ((-w - .06, .1), (-w + .1, H - .1)), ((w - .1, .1), (w + .06, H - .1))):
        p.box((a[0], -.12, a[1]), (b[0], 0, b[1]), 'st_wall', bevel=.035)
    for sx in (-1, 1):
        for sz in (0, 1):
            cx, cz = sx * (w - .1), .1 if sz == 0 else H - .1
            dz = 1 if sz == 0 else -1
            p.beam((cx, -.06, cz + dz * .2), (cx - sx * .2, -.06, cz), .05, .1, 'st_wall')
    p.box((w - .09, -.14, .42), (w + .04, -.12, .72), 'st_dark', bevel=.006)
    p.front(w - .075, w + .025, .58, .7, -.142, 'keypad')
    p.front(w - .075, w + .025, .44, .54, -.142, 'led_amber')
    p.cyl((-w + .02, -.16, .35), (-w + .02, -.16, .8), .016, 'st_steel', 6)
    for z in (.35, .8):
        p.cyl((-w + .02, -.12, z), (-w + .02, -.16, z), .012, 'st_steel', 5)
    p.front(-.3, .3, H - .06, H + .03, -.122, 'stripe')


def shop_shelf(p, W=2.6, D=.6, H=2.6):
    w = W / 2
    import random
    rng = random.Random(11)
    for sx in (-1, 1):
        for y in (-D + .03, -.03):
            p.box((sx * w - .05 * (sx > 0), y - .025, 0), (sx * w + .05 * (sx < 0), y + .025, H), 'st_gunmetal', bevel=.006)
    for z in (.12, .78, 1.44, 2.1):
        p.box((-w, -D, z), (w, 0, z + .04), 'st_steel', bevel=.008)
        p.box((-w, -D - .01, z - .02), (w, -D + .01, z + .06), 'st_gunmetal', bevel=0)
        x = -w + .1
        while x < w - .3:
            bw, bh, bd = rng.uniform(.28, .55), rng.uniform(.22, .5), rng.uniform(.3, .46)
            if x + bw > w - .08:
                break
            mat = rng.choice(['st_dark', 'st_gunmetal', 'st_accent', 'st_tank', 'st_gunmetal'])
            p.box((x, -D + .06, z + .04), (x + bw, -D + .06 + bd, z + .04 + bh), mat, bevel=.015)
            if rng.random() < .5:
                p.front(x + .04, x + min(bw - .04, .26), z + .08, z + min(bh, .22), -D + .058, rng.choice(['label_a', 'label_b', 'label_c', 'label_d']))
            x += bw + rng.uniform(.03, .12)
    p.beam((-w + .03, -.03, .2), (w - .03, -.03, H - .2), .03, .012, 'st_steel')
    p.beam((-w + .03, -.03, H - .2), (w - .03, -.03, .2), .03, .012, 'st_steel')


def terminal(p):
    # the screen faces -Y
    p.box((-.4, -.16, 0), (.4, .16, .1), 'st_dark', bevel=.02)
    p.box((-.2, -.1, .1), (.2, .1, .95), 'st_gunmetal', bevel=.02)
    p.box((-.46, -.2, .95), (.46, .16, 1.02), 'st_gunmetal', bevel=.015)
    p.quad([(-.42, -.19, 1.022), (.42, -.19, 1.022), (.42, -.02, 1.06), (-.42, -.02, 1.06)], 'st_trim', 'keypad')
    p.box((-.5, .0, 1.02), (.5, .14, 1.72), 'st_dark', bevel=.02)
    p.front(-.45, .45, 1.08, 1.66, -.002, 'screen_a')
    p.box((-.5, -.02, 1.72), (.5, .16, 1.78), 'st_gunmetal', bevel=.01)
    p.front(-.2, .2, .3, .7, -.102, 'label_d')
    p.pipe([(.12, .1, .1), (.12, .16, .5), (.12, .16, 1.1)], .02, 'st_dark', seg=6)


def crate(p, variant='a'):
    w, d, h = (1.2, 1.2, 1.2) if variant == 'a' else (1.8, 1.0, .8)
    p.box((-w / 2 + .03, -d / 2 + .03, .05), (w / 2 - .03, d / 2 - .03, h - .03), 'st_gunmetal' if variant == 'a' else 'st_tank', bevel=.02)
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((sx * w / 2 - .1 * (sx > 0), sy * d / 2 - .1 * (sy > 0), 0), (sx * w / 2 + .1 * (sx < 0), sy * d / 2 + .1 * (sy < 0), h), 'st_dark', bevel=.02)
    for z in (0, h - .08):
        for sy in (-1, 1):
            p.box((-w / 2, sy * d / 2 - .08 * (sy > 0), z), (w / 2, sy * d / 2 + .08 * (sy < 0), z + .08), 'st_dark', bevel=.012)
        for sx in (-1, 1):
            p.box((sx * w / 2 - .08 * (sx > 0), -d / 2, z), (sx * w / 2 + .08 * (sx < 0), d / 2, z + .08), 'st_dark', bevel=.012)
    n = 4 if variant == 'a' else 6
    for i in range(1, n):
        x = -w / 2 + i * w / n
        for sy in (-1, 1):
            p.box((x - .03, sy * (d / 2 - .03) - .012, .1), (x + .03, sy * (d / 2 - .03) + .012, h - .1), 'st_gunmetal' if variant == 'a' else 'st_steel', bevel=0)
    p.front(-w / 2 + .14, -w / 2 + .44, h * .5, h * .5 + .3, -d / 2 + .028, 'label_a' if variant == 'a' else 'label_c')
    p.front(-w / 2 + .12, w / 2 - .12, .12, .22, -d / 2 + .028, 'hazard')
    p.box((-.16, -d / 2 - .01, h * .62), (.16, -d / 2 + .03, h * .72), 'st_steel', bevel=.01)                  # latch
    for sx in (-1, 1):
        p.side(-d / 2 + .15, d / 2 - .15, h * .35, h * .55, sx * (w / 2 - .028), 'stripe', sx)


def drum(p):
    p.cyl((0, 0, 0), (0, 0, .9), .29, 'st_accent', 14)
    for z in (.02, .3, .6, .88):
        p.cyl((0, 0, z - .02), (0, 0, z + .02), .305, 'st_gunmetal', 14)
    p.cyl((.14, 0, .9), (.14, 0, .93), .04, 'st_steel', 6)
    p.front(-.14, .14, .36, .56, -.292, 'label_a')


# =============================================================== exterior ===============================================================
def hull(p, variant='a', W=4.0, H=2.0):
    h = W / 2
    p.box((-h, -.06, 0), (h, 0, H), 'st_hull', bevel=0)
    if variant == 'a':
        for a, b in ((-h + .06, -.3), (-.2, h - .06)):
            p.box((a, -.16, .08), (b, -.06, H - .08), 'st_hull', bevel=.03)      # fasteners are in the texture: these plates are the most numerous piece on a hull
        p.box((-.28, -.12, .3), (-.22, -.06, H - .3), 'st_dark', bevel=0)
    elif variant == 'b':
        p.box((-h + .06, -.12, .08), (h - .06, -.06, H - .08), 'st_hull', bevel=.03)
        for z, r in ((.45, .09), (.72, .06), (1.5, .12)):
            p.pipe([(-h, -.24, z), (h, -.24, z)], r, 'st_steel', seg=6, flange=2.0)
        p.box((-.5, -.36, .95), (.4, -.12, 1.32), 'st_gunmetal', bevel=.03)
        p.front(-.42, -.05, 1.0, 1.27, -.362, 'vent')
        p.front(.05, .32, 1.02, 1.25, -.362, 'label_d')
        for x in (-1.4, 1.3):
            p.box((x - .06, -.24, .3), (x + .06, -.06, 1.7), 'st_gunmetal', bevel=.01)
    elif variant == 'c':
        p.box((-h + .06, -.18, .08), (h - .06, -.06, .34), 'st_hull', bevel=.03)
        p.box((-h + .06, -.18, H - .34), (h - .06, -.06, H - .08), 'st_hull', bevel=.03)
        for s in (-1, 1):
            p.box((s * h - .4 * (s > 0) - .06 * s, -.18, .34), (s * h + .4 * (s < 0) - .06 * s, -.06, H - .34), 'st_hull', bevel=.03)
        p.front(-h + .46, h - .46, .36, H - .36, -.064, 'fins')
        for x in (-.9, 0, .9):
            p.box((x - .04, -.14, .34), (x + .04, -.06, H - .34), 'st_gunmetal', bevel=0)
        p.pipe([(-h + .3, -.22, .22), (h - .3, -.22, .22)], .05, 'st_accent', seg=6)
    else:                                                                                            # d: a row of windows
        p.box((-h + .06, -.14, .08), (h - .06, -.06, H - .08), 'st_hull', bevel=.03)
        for i, x in enumerate((-1.25, 0, 1.25)):
            p.box((x - .5, -.2, .55), (x + .5, -.14, 1.5), 'st_gunmetal', bevel=.03)
            p.front(x - .42, x + .42, .63, 1.42, -.203, ('win_a', 'win_dark', 'win_b', 'win_c')[(i + (1 if variant == 'e' else 0)) % 4])
            p.box((x - .5, -.24, 1.5), (x + .5, -.14, 1.56), 'st_dark', bevel=0)
        p.box((-h + .06, -.17, .25), (h - .06, -.14, .37), 'st_accent', bevel=0)


def hull_coping(p, L=4.0):
    l = L / 2
    p.box((-l, -.22, -.25), (l, .25, .12), 'st_gunmetal', bevel=.04)
    p.box((-l, -.26, -.06), (l, -.22, .04), 'st_accent', bevel=0)
    for x in (-l + .5, l - .5):
        p.box((x - .1, -.28, -.2), (x + .1, -.2, .08), 'st_dark', bevel=.02)
    p.front(-.15, .15, -.14, -.04, -.223, None, mat='st_light')


def roof_plate(p, W=4.0, L=4.0):
    h, l = W / 2, L / 2
    p.box((-h, -l, 0), (h, l, .08), 'st_hull', bevel=0)
    for a, b in ((-h + .08, -.06), (.06, h - .08)):
        for c, d in ((-l + .08, -.06), (.06, l - .08)):
            p.box((a, c, .08), (b, d, .14), 'st_hull', bevel=0)
    p.cyl((h - .5, l - .5, .14), (h - .5, l - .5, .2), .07, 'st_gunmetal', 6)


def roof_unit(p, variant='a'):
    if variant == 'a':                                                # cooling plant
        p.box((-1.6, -.8, 0), (1.6, .8, .2), 'st_dark', bevel=.03)
        p.box((-1.5, -.7, .2), (1.5, .7, 1.5), 'st_gunmetal', bevel=.05)
        p.front(-1.4, 1.4, .35, 1.35, -.702, 'fins')
        p.quad([(1.4, .702, .35), (-1.4, .702, .35), (-1.4, .702, 1.35), (1.4, .702, 1.35)], 'st_trim', 'fins')
        for x in (-.8, .8):
            p.cyl((x, 0, 1.5), (x, 0, 1.68), .48, 'st_dark', 14)
            p.up(x - .4, x + .4, -.4, .4, 1.682, 'vent')
        p.pipe([(-1.5, .4, .6), (-2.0, .4, .6), (-2.0, .4, 0)], .09, 'st_steel', seg=8)
        p.pipe([(1.5, -.3, .9), (2.0, -.3, .9), (2.0, -.3, 0)], .07, 'st_accent', seg=8)
        p.front(-.3, .1, 1.0, 1.3, -.704, 'label_d')
    elif variant == 'b':                                              # tank cluster
        p.box((-1.5, -1.0, 0), (1.5, 1.0, .12), 'st_dark', bevel=.03)
        for y in (-.6, 0, .6):
            p.cyl((-1.2, y, .42), (1.2, y, .42), .26, 'st_tank', 12)
            for x in (-1.2, 1.2):
                p.lathe([(.26, 0), (.2, .12), (.0, .18)] if x > 0 else [(.0, -.18), (.2, -.12), (.26, 0)], 'st_tank', 12, 'x', (x, y, .42))
            for x in (-.7, .7):
                p.cyl((x - .04, y, .42), (x + .04, y, .42), .275, 'st_accent', 12)
                p.box((x - .05, y - .2, .12), (x + .05, y + .2, .22), 'st_gunmetal', bevel=0)
        p.pipe([(0, -.6, .68), (0, -.6, .86), (0, .6, .86), (0, .6, .68)], .04, 'st_steel', seg=6)
        p.pipe([(0, 0, .68), (0, 0, .86)], .04, 'st_steel', seg=6)
        p.box((-.15, -.9, .8), (.15, -.7, 1.0), 'st_gunmetal', bevel=.02)
    else:                                                             # hatch, whip aerials, a small dish
        p.cyl((0, 0, 0), (0, 0, .25), .8, 'st_gunmetal', 16)
        p.cyl((0, 0, .25), (0, 0, .34), .66, 'st_hull', 16)
        p.cyl((0, 0, .34), (0, 0, .4), .16, 'st_steel', 8)
        for i in range(8):
            a = i * math.pi / 4
            p.cyl((math.cos(a) * .73, math.sin(a) * .73, .25), (math.cos(a) * .73, math.sin(a) * .73, .3), .04, 'st_steel', 6)
        for x, hh in ((1.3, 3.2), (1.6, 2.2)):
            p.cyl((x, .5, 0), (x, .5, hh), .02, 'st_steel', 5)
            p.cyl((x, .5, 0), (x, .5, .3), .06, 'st_dark', 6)
        p.cyl((-1.4, -.4, 0), (-1.4, -.4, .7), .05, 'st_steel', 6)
        p.lathe([(.0, .7), (.3, .76), (.55, .92), (.7, 1.15)], 'st_tank', 14, 'z', (-1.4, -.4, 0))
        p.cyl((-1.4, -.4, .7), (-1.4, -.4, 1.25), .015, 'st_steel', 5)
        p.box((.9, -.9, 0), (1.5, -.4, .4), 'st_gunmetal', bevel=.03)
        p.up(.95, 1.45, -.85, -.45, .402, 'vent')


def truss(p, L=8.0, s=.9):
    l, h = L / 2, s / 2
    for y in (-h, h):
        for z in (-h, h):
            p.box((-l, y - .05, z - .05), (l, y + .05, z + .05), 'st_gunmetal', bevel=0)
    n = 4
    step = L / n
    for i in range(n + 1):
        x = -l + i * step
        for y in (-h, h):
            p.box((x - .04, y - .04, -h), (x + .04, y + .04, h), 'st_gunmetal', bevel=0)
        for z in (-h, h):
            p.box((x - .04, -h, z - .04), (x + .04, h, z + .04), 'st_gunmetal', bevel=0)
        if i < n:
            flip = i % 2
            for y in (-h, h):
                p.beam((x, y, -h if flip else h), (x + step, y, h if flip else -h), .05, .05, 'st_steel')
            for z in (-h, h):
                p.beam((x, -h if flip else h, z), (x + step, h if flip else -h, z), .05, .05, 'st_steel')
    p.pipe([(-l, 0, 0), (l, 0, 0)], .07, 'st_accent', seg=6)


def solar(p, W=10.0, L=10.0):
    h, l = W / 2, L / 2
    p.box((-h, -l, -.08), (h, l, 0), 'st_gunmetal', bevel=0)
    n = 4
    for i in range(n):
        for j in range(n):
            x0, y0 = -h + .12 + i * (W - .24) / n, -l + .12 + j * (L - .24) / n
            p.up(x0 + .04, x0 + (W - .24) / n - .04, y0 + .04, y0 + (L - .24) / n - .04, .004, 'solar')
    for i in range(n + 1):
        x = -h + .12 + i * (W - .24) / n
        p.box((x - .05, -l, 0), (x + .05, l, .04), 'st_steel', bevel=0)
        y = -l + .12 + i * (L - .24) / n
        p.box((-h, y - .05, 0), (h, y + .05, .04), 'st_steel', bevel=0)
    for x in (-h * .5, h * .5):
        p.box((x - .1, -l, -.3), (x + .1, l, -.08), 'st_gunmetal', bevel=0)
    p.box((-h, -.12, -.36), (h, .12, -.08), 'st_gunmetal', bevel=0)
    p.pipe([(-h, .3, -.2), (h, .3, -.2)], .04, 'st_accent', seg=5)


def tank(p, r=2.6, L=18.0):
    l = L / 2
    p.cyl((-l, 0, 0), (l, 0, 0), r, 'st_tank', 24, caps=False)
    for s in (-1, 1):
        prof = [(r, 0), (r * .96, r * .14), (r * .82, r * .28), (r * .55, r * .4), (r * .2, r * .46), (0, r * .47)]
        if s > 0:
            p.lathe(prof, 'st_tank', 24, 'x', (l, 0, 0))
        else:
            p.lathe([(a, -b) for a, b in prof[::-1]], 'st_tank', 24, 'x', (-l, 0, 0))
        p.cyl((s * (l + r * .44), 0, 0), (s * (l + r * .6), 0, 0), r * .14, 'st_gunmetal', 10)
    for x in (-l * .73, -l * .25, l * .25, l * .73):
        p.cyl((x - .4, 0, 0), (x + .4, 0, 0), r + .04, 'st_accent', 24, caps=False)
        for e in (-.4, .4):
            p.cyl((x + e - .05, 0, 0), (x + e + .05, 0, 0), r + .07, 'st_gunmetal', 24)
    for x in (-l * .5, 0, l * .5):                                                 # saddle straps and a top walkway
        p.box((x - .15, -r - .12, -.3), (x + .15, r + .12, .3), 'st_gunmetal', bevel=.03)
    p.box((-l * .9, -.45, r), (l * .9, .45, r + .08), 'st_steel', bevel=0)
    p.up(-l * .9, l * .9, -.4, .4, r + .082, 'tread')
    p.box((-.6, -.5, r + .08), (.6, .5, r + .7), 'st_gunmetal', bevel=.05)        # valve house
    p.cyl((0, 0, r + .7), (0, 0, r + 1.1), .2, 'st_steel', 8)
    p.pipe([(.6, 0, r + .4), (l * .6, 0, r + .4), (l * .6, 0, r + .08)], .1, 'st_steel', seg=8, flange=2.5)
    p.front(-1.6, 1.6, -.5, .5, -r - .13, 'stripe')


def collar(p, R=8.5):
    seg = 32
    prof = [(R - 1.0, -1.0), (R + 1.0, -1.0), (R + 1.0, 1.0), (R - 1.0, 1.0)]
    for i in range(seg):                                                                        # a faceted ring, square in section; its axis is Y
        a0, a1 = 2 * math.pi * i / seg, 2 * math.pi * (i + 1) / seg
        for k in range(4):
            (r0, h0), (r1, h1) = prof[k], prof[(k + 1) % 4]
            q = [(math.cos(a0) * r0, h0, math.sin(a0) * r0), (math.cos(a1) * r0, h0, math.sin(a1) * r0), (math.cos(a1) * r1, h1, math.sin(a1) * r1), (math.cos(a0) * r1, h1, math.sin(a0) * r1)]
            p._tag([p.b.faces.new([p.b.verts.new(c) for c in q])], 'st_hull' if i % 4 else 'st_gunmetal')
    bmesh.ops.recalc_face_normals(p.b, faces=p.b.faces)
    for i in range(seg):
        a = 2 * math.pi * (i + .5) / seg
        c, s = math.cos(a), math.sin(a)
        if i % 4 == 0:                                                                          # clamp arms reaching inward
            p.beam((c * (R - 1.0), -.5, s * (R - 1.0)), (c * (R - 2.6), -1.3, s * (R - 2.6)), .5, .7, 'st_gunmetal')
            p.beam((c * (R - 2.6), -1.3, s * (R - 2.6)), (c * (R - 2.9), -2.0, s * (R - 2.9)), .4, .5, 'st_accent')
        if i % 2 == 0:
            p.cyl((c * R, -1.0, s * R), (c * R, -1.12, s * R), .16, 'st_light', 8)
        p.cyl((c * (R + .98), 0, s * (R + .98)), (c * (R + 1.12), 0, s * (R + 1.12)), .12, 'st_steel', 6)
    inner = [(R - 2.2, -1.0), (R - 1.0, -1.0), (R - 1.0, -.4), (R - 2.2, -.4)]                  # the seal ring
    for i in range(seg):
        a0, a1 = 2 * math.pi * i / seg, 2 * math.pi * (i + 1) / seg
        for k in range(4):
            (r0, h0), (r1, h1) = inner[k], inner[(k + 1) % 4]
            q = [(math.cos(a0) * r0, h0, math.sin(a0) * r0), (math.cos(a1) * r0, h0, math.sin(a1) * r0), (math.cos(a1) * r1, h1, math.sin(a1) * r1), (math.cos(a0) * r1, h1, math.sin(a0) * r1)]
            f = p.b.faces.new([p.b.verts.new(c) for c in q])
            p._tag([f], 'st_trim' if k == 0 else 'st_dark', 'hazard' if k == 0 else None)
    bmesh.ops.recalc_face_normals(p.b, faces=p.b.faces)


def mast(p, H=18.0):
    r = .45
    pts = [(math.cos(a) * r, math.sin(a) * r) for a in (math.pi / 2, math.pi * 7 / 6, math.pi * 11 / 6)]
    for x, y in pts:
        p.cyl((x, y, 0), (x * .35, y * .35, H), .05, 'st_gunmetal', 6)
    n = 9
    for i in range(n):
        z0, z1 = i * H / n, (i + 1) * H / n
        for k in range(3):
            (x0, y0), (x1, y1) = pts[k], pts[(k + 1) % 3]
            f0, f1 = 1 - .65 * z0 / H, 1 - .65 * z1 / H
            p.cyl((x0 * f0, y0 * f0, z0), (x1 * f1, y1 * f1, z1), .025, 'st_steel', 5)
            p.cyl((x0 * f1, y0 * f1, z1), (x1 * f1, y1 * f1, z1), .025, 'st_steel', 5)
    for z, w in ((H * .45, 5.0), (H * .62, 4.0), (H * .78, 3.0), (H * .9, 2.0)):
        p.box((-w, -.04, z - .04), (w, .04, z + .04), 'st_gunmetal', bevel=0)
        for x in (-w, -w * .5, w * .5, w):
            p.cyl((x, 0, z - .5), (x, 0, z + .5), .025, 'st_steel', 5)
    p.cyl((0, 0, H), (0, 0, H + 2.5), .03, 'st_steel', 5)
    p.box((-.5, -.5, 0), (.5, .5, .3), 'st_dark', bevel=.05)
    p.lathe([(.0, -.3), (.35, -.22), (.6, 0), (.75, .3)], 'st_tank', 12, 'y', (0, -.6, H * .3))
    p.box((-.25, -.3, H * .3 - .2), (.25, .3, H * .3 + .2), 'st_gunmetal', bevel=.04)


def dish(p, R=4.5):
    prof = [(R * t, R * .32 * t * t) for t in (0, .2, .4, .6, .8, 1.0)]
    p.lathe(prof, 'st_tank', 24)
    p.lathe([(r * 1.0, h - .06) for r, h in prof][::-1], 'st_gunmetal', 24)
    p.lathe([(R, R * .32 - .06), (R + .06, R * .32 - .03), (R, R * .32)], 'st_gunmetal', 24)
    for i in range(12):                                                                           # back ribs
        a = i * math.pi / 6
        p.beam((math.cos(a) * .6, math.sin(a) * .6, -.12), (math.cos(a) * R * .95, math.sin(a) * R * .95, R * .28), .08, .16, 'st_gunmetal')
    for i in range(3):
        a = i * math.pi * 2 / 3 + .5
        p.cyl((math.cos(a) * R * .7, math.sin(a) * R * .7, R * .16), (0, 0, R * .78), .05, 'st_steel', 6)
    p.cyl((0, 0, R * .7), (0, 0, R * .9), .3, 'st_gunmetal', 10, r2=.18)
    p.cyl((0, 0, -1.3), (0, 0, 0), .5, 'st_gunmetal', 12)
    p.box((-.9, -.9, -1.7), (.9, .9, -1.3), 'st_dark', bevel=.08)


def mouth_frame(p, W=20.0, H=7.0):
    h = W / 2
    # frames a hangar mouth; the piece's front (-Y) faces out to space
    for s in (-1, 1):
        x0, x1 = (h, h + .8) if s > 0 else (-h - .8, -h)
        p.box((x0, -.7, 0), (x1, .3, H + .9), 'st_gunmetal', bevel=.08)
        p.front(x0 + .1, x1 - .1, .2, 2.6, -.703, 'hazard')
        p.box((x0 + .25, -.76, 3.0), (x1 - .25, -.7, H - .2), 'st_dark', bevel=.02)
        p.front(x0 + .32, x1 - .32, 3.1, H - .3, -.763, None, mat='st_light')
        xi = h if s > 0 else -h                                                                    # light strip on the inner edge
        p.side(-.55, .15, .3, H - .2, xi - s * .003, None, -s, mat='st_light')
    p.box((-h - .8, -.7, H), (h + .8, .3, H + .9), 'st_gunmetal', bevel=.08)
    p.front(-h, h, H + .1, H + .3, -.703, 'hazard')
    for i in range(5):
        x = -h * .8 + i * h * .4
        p.box((x - .8, -.85, H + .35), (x + .8, -.7, H + .8), 'st_dark', bevel=.04)
        p.quad([(x - .7, -.82, H + .35), (x + .7, -.82, H + .35), (x + .7, -.72, H + .35), (x - .7, -.72, H + .35)][::-1], 'st_light')
    p.box((-h - .8, -1.6, -.4), (h + .8, .3, 0), 'st_gunmetal', bevel=.08)                          # deck lip
    p.up(-h, h, -1.5, -.9, .003, 'chevron')
    for i in range(11):
        x = -h + i * W / 10
        p.cyl((x, -.6, 0), (x, -.6, .06), .14, 'st_dark', 8)
        p.up(x - .08, x + .08, -.68, -.52, .062, 'led_green' if abs(i - 5) < 4 else 'led_amber')


def thruster(p):
    p.box((-.9, -.9, 0), (.9, .9, .5), 'st_gunmetal', bevel=.08)
    p.box((-.6, -.6, .5), (.6, .6, .8), 'st_dark', bevel=.06)
    for a in range(4):
        c, s = math.cos(a * math.pi / 2), math.sin(a * math.pi / 2)
        p.cyl((c * .5, s * .5, .62), (c * 1.25, s * 1.25, .7), .14, 'st_steel', 10, r2=.3)
        p.cyl((c * 1.0, s * 1.0, .67), (c * 1.26, s * 1.26, .7), .22, 'st_dark', 10, r2=.27)
    p.cyl((0, 0, .8), (0, 0, 1.45), .16, 'st_steel', 10, r2=.34)
    p.pipe([(.7, .7, .5), (.7, .7, .95), (.2, .2, .95)], .04, 'st_accent', seg=5)
    p.front(-.4, .4, .12, .38, -.902, 'label_a')


def radiator(p, W=6.0, L=10.0):
    h, l = W / 2, L / 2
    # a flat panel standing in the XZ plane: fins on both faces
    p.box((-h, -.06, -l), (h, .06, l), 'st_gunmetal', bevel=0)
    for k in range(2):
        z0, z1 = (-l + .15, -.08) if k == 0 else (.08, l - .15)
        p.front(-h + .15, h - .15, z0, z1, -.062, 'fins')
        p.quad([(h - .15, .062, z0), (-h + .15, .062, z0), (-h + .15, .062, z1), (h - .15, .062, z1)], 'st_trim', 'fins')
    for x in (-h, h):
        p.cyl((x, 0, -l), (x, 0, l), .09, 'st_steel', 8)
    p.cyl((-h, 0, 0), (h, 0, 0), .07, 'st_accent', 6)


def greeble(p, variant='a'):
    if variant == 'a':
        p.box((-.8, -.3, 0), (.2, 0, .9), 'st_gunmetal', bevel=.04)
        p.front(-.7, .1, .1, .5, -.302, 'vent')
        p.box((.35, -.2, .1), (.85, 0, .6), 'st_dark', bevel=.04)
        p.pipe([(.6, -.1, .6), (.6, -.1, 1.4), (-.3, -.1, 1.4), (-.3, -.1, .9)], .05, 'st_steel', seg=6)
        p.front(.42, .78, .2, .5, -.202, 'label_b')
    elif variant == 'b':
        for i, x in enumerate((-.7, -.25, .2, .65)):
            p.cyl((x, -.2, 0), (x, -.2, 1.6 - i * .15), .12, 'st_tank' if i % 2 else 'st_steel', 8)
            p.cyl((x, -.2, .5), (x, -.2, .58), .14, 'st_accent', 8)
        p.box((-.9, -.36, .9), (.85, 0, 1.0), 'st_gunmetal', bevel=.02)
        p.box((-.9, -.36, .1), (.85, 0, .2), 'st_gunmetal', bevel=.02)
    else:
        p.box((-.6, -.25, 0), (.6, 0, .5), 'st_gunmetal', bevel=.04)
        p.lathe([(.0, -.25), (.2, -.3), (.42, -.42), (.5, -.6)], 'st_tank', 12, 'y', (0, 0, .95))
        p.cyl((0, -.6, .95), (0, -.25, .95), .02, 'st_steel', 5)
        p.cyl((0, -.12, .5), (0, -.12, .95), .05, 'st_steel', 6)
        p.front(-.5, -.1, .1, .4, -.252, 'screen_b')


PIECES = {
    'wall_low': wall_low, 'wall_mid_a': wall_mid_a, 'wall_mid_b': wall_mid_b, 'wall_mid_c': wall_mid_c, 'wall_mid_d': wall_mid_d, 'wall_mid_e': wall_mid_e, 'wall_mid_port': wall_mid_port,
    'wall_top': wall_top, 'wall_clere': wall_clere, 'pilaster_36': lambda p: pilaster(p, 3.6), 'pilaster_50': lambda p: pilaster(p, 5.0),
    'hangar_panel_a': hangar_panel_a, 'hangar_panel_b': hangar_panel_b, 'hangar_rib': hangar_rib,
    'ceil_corridor': ceil_corridor, 'ceil_room_a': lambda p: ceil_room(p, 'a'), 'ceil_room_b': lambda p: ceil_room(p, 'b'),
    'hangar_truss': hangar_truss, 'hangar_ceil': hangar_ceil, 'hangar_crane': hangar_crane,
    'floor_grate': floor_grate, 'floor_hazard': floor_hazard, 'floor_chevron': floor_chevron, 'floor_line': floor_line, 'pad_ring': pad_ring,
    'door_frame': door_frame, 'portal_3m': lambda p: portal(p, 3.0), 'portal_5m': lambda p: portal(p, 5.0), 'window_bay': window_bay, 'porthole': porthole,
    'bar_counter': bar_counter, 'backbar': backbar, 'booth': booth, 'table': table, 'chair': chair, 'pod_shell': pod_shell, 'shop_shelf': shop_shelf, 'terminal': terminal,
    'crate_a': lambda p: crate(p, 'a'), 'crate_b': lambda p: crate(p, 'b'), 'drum': drum,
    'hull_a': lambda p: hull(p, 'a'), 'hull_b': lambda p: hull(p, 'b'), 'hull_c': lambda p: hull(p, 'c'), 'hull_d': lambda p: hull(p, 'd'), 'hull_e': lambda p: hull(p, 'e'),
    'hull_coping': hull_coping, 'roof_plate': roof_plate, 'roof_unit_a': lambda p: roof_unit(p, 'a'), 'roof_unit_b': lambda p: roof_unit(p, 'b'), 'roof_unit_c': lambda p: roof_unit(p, 'c'),
    'truss': truss, 'solar': solar, 'tank': tank, 'collar': collar, 'mast': mast, 'dish': dish, 'mouth_frame': mouth_frame, 'thruster': thruster, 'radiator': radiator,
    'greeble_a': lambda p: greeble(p, 'a'), 'greeble_b': lambda p: greeble(p, 'b'), 'greeble_c': lambda p: greeble(p, 'c'),
}


def export(objs, path):
    for o in bpy.context.scene.objects:
        o.select_set(o in objs)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_materials='EXPORT',
                              export_image_format='NONE', export_normals=True, export_texcoords=True, export_animations=False, export_cameras=False, export_lights=False)


def main():
    args = sys.argv[1:]
    if '--textures' in args:
        station_textures.build_all(TEX)
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    manifest, objs = {'pieces': {}}, []
    for name, fn in PIECES.items():
        p = Piece(name)
        fn(p)
        obj, tris, mats = p.finish()
        lo = [round(min(v.co[i] for v in obj.data.vertices), 3) for i in range(3)]
        hi = [round(max(v.co[i] for v in obj.data.vertices), 3) for i in range(3)]
        # sizes as the game sees them: x = Blender x, y (up) = Blender z, z = Blender y (the piece's front faces -z in the game)
        manifest['pieces'][name] = {'triangles': tris, 'materials': mats, 'min': [lo[0], lo[2], lo[1]], 'max': [hi[0], hi[2], hi[1]]}
        objs.append(obj)
    path = os.path.join(OUT, 'station-kit.glb')        # every piece in ONE file (one download); the game reads the pieces out by node name
    export(objs, path)
    manifest['file'], manifest['bytes'] = 'station-kit.glb', os.path.getsize(path)
    manifest['materials'] = MATS
    manifest['regions'] = station_textures.TRIM_REGIONS
    json.dump(manifest, open(os.path.join(OUT, 'station-kit-manifest.json'), 'w'), indent=1)
    for name, v in manifest['pieces'].items():
        print('%-16s %6d tris  %s' % (name, v['triangles'], ','.join(v['materials'])))
    print('total', sum(v['triangles'] for v in manifest['pieces'].values()), 'triangles in', len(manifest['pieces']), 'pieces,', manifest['bytes'], 'bytes')


if __name__ == '__main__':
    main()
