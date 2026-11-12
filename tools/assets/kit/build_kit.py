"""The modular building kit for NeoChinatown (docs/development/BUILDING_KIT.md). Run with Blender's Python (the `bpy` package, 5.x):

    python tools/assets/kit/build_kit.py --batch 1 [--batch 2 ...] [--preview work/kit-batch1.png] [--textures]

Each piece is BUILT BY CODE here (this file is the editable source: there is no .blend to keep), exported as its own .glb into
void-runner/assets/models/kit/ and listed in kit-manifest.json. Conventions, which the game relies on:
  - metres; 1 m module; upper floors 3.5 m, the shopfront floor 4.5 m; widths 2 / 4 / 6 m.
  - built here with X = width, Z = up and the street side at -Y; exported Y-up, so in the game X = width, Y = up and the piece's FRONT faces +Z.
  - origin at the bottom-left-front corner of the piece's bounding box; transforms applied.
  - facade pieces are 0.5 m deep and their wall plane is FACE (0.1 m) behind the front of the box, so sills and plinths have room and every facade piece lines up.
  - under 3,000 triangles each; hard edges bevelled.
  - four shared materials by NAME (kit_concrete, kit_metal, kit_glass, kit_emissive, plus kit_asphalt for the street edge). The .glb files carry no pictures of
    their own: each refers to the one shared set in kit/textures/, so the game can make ONE material per name and use it for every piece.
  - light comes only from kit_emissive (lit windows, neon tubes, sign faces). No lamps are exported.
  - window panes and other swappable parts are separate child nodes named <piece>__<part>_<n> (see "nodes" in the manifest)."""
import bpy, bmesh, json, math, os, random, struct, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import kit_textures  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(REPO, 'void-runner', 'assets', 'models', 'kit')
TEX = os.path.join(OUT, 'textures')
FLOOR, SHOP, DEPTH, FACE = 3.5, 4.5, .5, .1
TILE = {'kit_concrete': 4.0, 'kit_metal': 2.0, 'kit_asphalt': 3.0, 'kit_fabric': 2.0, 'kit_tile': 2.0}       # metres one repeat of the texture covers
MATERIALS = ['kit_concrete', 'kit_metal', 'kit_glass', 'kit_emissive', 'kit_asphalt', 'kit_ticker', 'kit_fabric', 'kit_tile', 'kit_shell', 'kit_goods', 'kit_canvas', 'kit_cab']
GLOWING = ('kit_emissive', 'kit_ticker')          # the only materials that give light
ALL_REGIONS = {**kit_textures.EMISSIVE_REGIONS, **kit_textures.GOODS_REGIONS}        # every atlas region a face can be mapped into, by name
REGIONS = list(ALL_REGIONS)


# ---------------------------------------------------------------- geometry helpers ----------------------------------------------------------------
class Piece:
    """One kit piece: a main mesh and optional named child meshes. Geometry is added in metres, X width, Y depth (street at -Y), Z up."""

    def __init__(self, name):
        self.name, self.nodes, self.snap, self.rng = name, {'': bmesh.new()}, {}, random.Random(name)

    def bm(self, node=''):
        if node not in self.nodes:
            self.nodes[node] = bmesh.new()
        b = self.nodes[node]
        if 'mode' not in b.faces.layers.int:
            b.faces.layers.int.new('mode')
        return b

    def _tag(self, b, faces, mat, region=None):
        layer = b.faces.layers.int['mode']
        for f in faces:
            f.material_index = MATERIALS.index(mat)
            f[layer] = 0 if region is None else 200 if region == 'ticker' else 1 + REGIONS.index(region) if region in REGIONS else 100   # 100: whole 0..1 square; 200: the scrolling strip
        return faces

    def box(self, p0, p1, mat='kit_concrete', bevel=.02, node='', region=None):
        b = self.bm(node)
        x0, y0, z0 = [min(a, c) for a, c in zip(p0, p1)]
        x1, y1, z1 = [max(a, c) for a, c in zip(p0, p1)]
        made = bmesh.ops.create_cube(b, size=1)
        for v in made['verts']:
            v.co = Vector((x0 + (v.co.x + .5) * (x1 - x0), y0 + (v.co.y + .5) * (y1 - y0), z0 + (v.co.z + .5) * (z1 - z0)))
        faces = list({f for v in made['verts'] for f in v.link_faces})
        if bevel and min(x1 - x0, y1 - y0, z1 - z0) > bevel * 3:
            edges = list({e for f in faces for e in f.edges})
            out = bmesh.ops.bevel(b, geom=edges, offset=bevel, segments=1, affect='EDGES', profile=.5)
            faces = list({f for v in made['verts'] if v.is_valid for f in v.link_faces} | set(out['faces']))
        return self._tag(b, [f for f in faces if f.is_valid], mat, region)

    def cyl(self, p0, p1, r, mat='kit_metal', seg=8, node='', caps=True):
        """A straight tube between two points."""
        b = self.bm(node)
        a, c = Vector(p0), Vector(p1)
        axis = c - a
        made = bmesh.ops.create_cone(b, cap_ends=caps, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=axis.length)
        rot = Vector((0, 0, 1)).rotation_difference(axis.normalized()).to_matrix()
        for v in made['verts']:
            v.co = rot @ v.co + (a + c) / 2
        return self._tag(b, list({f for v in made['verts'] for f in v.link_faces}), mat)

    def quad(self, corners, mat, node='', region=None):
        b = self.bm(node)
        face = b.faces.new([b.verts.new(Vector(c)) for c in corners])
        return self._tag(b, [face], mat, region)


def unwrap(b):
    """Tiling materials: a box projection in metres, so the texture runs unbroken across neighbouring pieces. Atlas faces: stretched over their region."""
    uv = b.loops.layers.uv.verify()
    layer = b.faces.layers.int['mode']
    for f in b.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        ua, va = [(1, 2), (0, 2), (0, 1)][ax]
        mode = f[layer]
        if mode == 0:
            tile = TILE.get(MATERIALS[f.material_index], 1.0)
            for loop in f.loops:
                loop[uv].uv = (loop.vert.co[ua] / tile, loop.vert.co[va] / tile)
        else:
            us, vs = [l.vert.co[ua] for l in f.loops], [l.vert.co[va] for l in f.loops]
            u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
            if mode == 200:      # the scrolling strip: its length runs in metres along the sign, so the letters keep one size on every piece
                for loop in f.loops:
                    loop[uv].uv = (loop.vert.co[ua] / kit_textures.TICKER_METRES, (loop.vert.co[va] - v0) / max(v1 - v0, 1e-6))
                continue
            r0, s0, r1, s1 = (0, 0, 1, 1) if mode == 100 else ALL_REGIONS[REGIONS[mode - 1]]
            pad = .01
            for loop in f.loops:
                tu = (loop.vert.co[ua] - u0) / max(u1 - u0, 1e-6)
                tv = (loop.vert.co[va] - v0) / max(v1 - v0, 1e-6)
                if (ax == 1 and n[1] > 0) or (ax == 0 and n[0] < 0):
                    tu = 1 - tu          # seen from behind or from the left the picture would be mirrored
                loop[uv].uv = (r0 + pad + tu * (r1 - r0 - 2 * pad), s0 + pad + tv * (s1 - s0 - 2 * pad))


# ---------------------------------------------------------------- materials ----------------------------------------------------------------
def materials(with_images=True):
    made = {}
    for name in MATERIALS:
        m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
        m.use_nodes = True
        nt = m.node_tree
        nt.nodes.clear()
        out, bsdf = nt.nodes.new('ShaderNodeOutputMaterial'), nt.nodes.new('ShaderNodeBsdfPrincipled')
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

        def image(kind, colour):
            path = os.path.join(TEX, name + '_' + kind + '.png')
            if not (with_images and os.path.exists(path)):
                return None
            node = nt.nodes.new('ShaderNodeTexImage')
            node.image = bpy.data.images.load(path, check_existing=True)
            if not colour:
                node.image.colorspace_settings.name = 'Non-Color'
            return node
        col = image('color', True)
        if name in GLOWING:
            bsdf.inputs['Base Color'].default_value = (0, 0, 0, 1)
            bsdf.inputs['Roughness'].default_value = .5
            bsdf.inputs['Emission Strength'].default_value = 6
            if col:
                nt.links.new(col.outputs['Color'], bsdf.inputs['Emission Color'])
                if name == 'kit_ticker':             # for the preview only: a node that slides the text, as the game will
                    mp, tc = nt.nodes.new('ShaderNodeMapping'), nt.nodes.new('ShaderNodeTexCoord')
                    mp.name = 'scroll'
                    nt.links.new(tc.outputs['UV'], mp.inputs['Vector'])
                    nt.links.new(mp.outputs['Vector'], col.inputs['Vector'])
            else:
                bsdf.inputs['Emission Color'].default_value = (1, .8, .6, 1)
        else:
            if col:
                nt.links.new(col.outputs['Color'], bsdf.inputs['Base Color'])
            orm, nrm = image('orm', False), image('normal', False)
            if orm:
                sep = nt.nodes.new('ShaderNodeSeparateColor')
                nt.links.new(orm.outputs['Color'], sep.inputs['Color'])
                nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
                nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
            if nrm:
                nm = nt.nodes.new('ShaderNodeNormalMap')
                nt.links.new(nrm.outputs['Color'], nm.inputs['Color'])
                nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
        made[name] = m
    return made


# ---------------------------------------------------------------- the pieces ----------------------------------------------------------------
def _neon(p, a, b, colour, node):
    """A neon tube (square in section, 4 cm) from a to b: the only thing besides windows and signs that gives light. Its own node, so the game can switch it off."""
    lo = [min(u, v) - (.02 if abs(u - v) < 1e-6 else 0) for u, v in zip(a, b)]
    hi = [max(u, v) + (.02 if abs(u - v) < 1e-6 else 0) for u, v in zip(a, b)]
    p.box(lo, hi, 'kit_emissive', bevel=0, node=node, region='neon_' + colour)


def _rib(p, x0, x1, y0, y1, z0, z1):
    """A bolted steel rib standing on the wall (y0 is its face)."""
    p.box((x0, y0, z0), (x1, y1, z1), 'kit_metal', bevel=.012)
    z = z0 + .35
    while z < z1 - .2:
        p.box((x0, y0 - .02, z), (x1, y0, z + .12), 'kit_metal', bevel=0)
        z += .95


def _wall_shell(p, W, H=FLOOR, openings=()):
    """The part every facade panel shares: the panel itself (with holes for `openings` = [(x0, x1, z0, z1)]), half-pilasters at both ends and a full one at every
    2 m bay line, a plinth and a floor band. Pieces put side by side therefore read as one continuous wall."""
    back = DEPTH
    plane = FACE + .03                       # the panel sits 3 cm behind the pilasters
    xs = sorted({0, W} | {v for o in openings for v in o[:2]})
    for a, b_ in zip(xs, xs[1:]):
        holes = sorted([(o[2], o[3]) for o in openings if o[0] <= a and o[1] >= b_])
        z = 0
        for z0, z1 in holes:
            if z0 > z:
                p.box((a, plane, z), (b_, back, z0), bevel=0)
            z = z1
        if z < H:
            p.box((a, plane, z), (b_, back, H), bevel=0)
    for o in openings:                        # close the hole behind the window
        p.box((o[0], plane + .26, o[2]), (o[1], back, o[3]), bevel=0)
    bays = int(round(W / 2))
    for k in range(bays + 1):
        x0, x1 = max(0, k * 2 - .12), min(W, k * 2 + .12)
        _rib(p, x0, x1, FACE - .02, plane + .01, .45, H - .3)
    p.box((0, 0, 0), (W, plane + .01, .45), bevel=.02)                       # plinth, the frontmost part of the piece
    p.box((0, .01, .4), (W, plane + .01, .47), 'kit_metal', bevel=0)         # a steel kick strip along its top
    p.box((0, .04, H - .3), (W, plane + .01, H), 'kit_metal', bevel=.02)     # the floor band: a steel service tray
    p.box((0, .02, H - .34), (W, plane + .01, H - .3), 'kit_metal', bevel=0)  # a drip flashing under it
    _neon(p, (0, .07, H - .39), (W, .07, H - .39), 'cyan', 'neon_0')          # a tube under the tray, unbroken from piece to piece
    for i, z in enumerate((H - .52, H - .57, H - .62)):                       # a cable run along the wall
        p.cyl((0, plane - .03 - .012 * (i % 2), z), (W, plane - .03 - .012 * (i % 2), z), .017, seg=5, caps=False)
    for k in range(int(W)):
        p.box((k + .47, plane - .06, H - .66), (k + .53, plane + .01, H - .48), 'kit_metal', bevel=0)
    p.snap.update({'left': [0, 0, 0], 'right': [W, 0, 0], 'top': [0, H, 0], 'wall_plane_z': -FACE})


def _wall_detail(p, x, kind):
    plane = FACE + .03
    if kind == 'vent':
        p.box((x - .3, plane - .05, 2.3), (x + .3, plane + .02, 2.75), 'kit_metal', bevel=.012)
        for i in range(5):
            p.box((x - .25, plane - .065, 2.35 + i * .075), (x + .25, plane - .05, 2.39 + i * .075), 'kit_metal', bevel=0)
    elif kind == 'conduit':
        p.cyl((x, plane - .04, .45), (x, plane - .04, FLOOR - .34), .028, seg=6, caps=False)
        p.box((x - .14, plane - .09, 1.3), (x + .14, plane + .01, 1.7), 'kit_metal', bevel=.012)
        for z in (.9, 2.4):
            p.box((x - .05, plane - .06, z), (x + .05, plane, z + .04), 'kit_metal', bevel=0)
    elif kind == 'plate':
        p.box((x - .35, plane - .02, 1.1), (x + .35, plane + .01, 2.0), 'kit_metal', bevel=.008)
        p.box((x - .2, plane - .05, 1.5), (x + .2, plane - .02, 1.85), 'kit_metal', bevel=.008)             # a wall terminal
        p.box((x - .16, plane - .056, 1.62), (x + .16, plane - .05, 1.81), 'kit_emissive', bevel=0, region='window_cyan')   # its screen
        for dx in (-.3, .3):
            for z in (1.16, 1.94):
                p.box((x + dx - .02, plane - .035, z - .02), (x + dx + .02, plane - .02, z + .02), 'kit_metal', bevel=0)


def wall_plain(W):
    def make(p):
        _wall_shell(p, W)
        kinds = ['vent', 'conduit', 'plate', 'conduit']
        for k in range(int(W / 2)):
            kind = kinds[(k + int(W)) % len(kinds)]
            if kind == 'vent':                                   # steel cladding sheets on the lower wall
                for a in (.18, 1.02):
                    p.box((k * 2 + a, FACE + .01, .52), (k * 2 + a + .8, FACE + .04, 1.7), 'kit_metal', bevel=.008)
            _wall_detail(p, k * 2 + 1 + p.rng.uniform(-.25, .25), kind)
        # a casting joint across each bay, as a shallow groove strip
        p.box((0, FACE + .022, 1.74), (W, FACE + .031, 1.77), 'kit_metal', bevel=0)
    return make


def wall_windows(W):
    def make(p):
        wins = [(k * 2 + .4, k * 2 + 1.6, 1.0, 2.6) for k in range(int(W / 2))]
        _wall_shell(p, W, openings=wins)
        plane = FACE + .03
        for i, (x0, x1, z0, z1) in enumerate(wins):
            p.box((x0 - .1, .02, z0 - .07), (x1 + .1, plane + .05, z0), 'kit_metal', bevel=.015)         # a steel ledge
            p.box((x0 - .1, .01, z1), (x1 + .1, plane + .02, z1 + .12), 'kit_metal', bevel=.015)         # a steel hood
            for a in (x0 - .1, x1 + .04):                                                                # its side cheeks
                p.box((a, .05, z0), (a + .06, plane + .02, z1), 'kit_metal', bevel=0)
            for j in range(4):                                                                           # louvres over the lower pane
                p.box((x0, plane + .08, z0 + .08 + j * .11), (x1, plane + .11, z0 + .14 + j * .11), 'kit_metal', bevel=0)
            f = plane + .14
            for a, b_ in ((x0, x0 + .05), (x1 - .05, x1)):
                p.box((a, f, z0), (b_, f + .07, z1), 'kit_metal', bevel=0)
            for a, b_ in ((z0, z0 + .05), (z1 - .05, z1)):
                p.box((x0, f, a), (x1, f + .07, b_), 'kit_metal', bevel=0)
            p.box(((x0 + x1) / 2 - .02, f, z0), ((x0 + x1) / 2 + .02, f + .06, z1), 'kit_metal', bevel=0)   # mullion
            p.box((x0, f, z0 + 1.0), (x1, f + .06, z0 + 1.04), 'kit_metal', bevel=0)                       # transom
            # the pane: its own node, so the game can make any window lit (kit_emissive, a window region) or dark (kit_glass)
            p.quad([(x0 + .05, f + .05, z0 + .05), (x1 - .05, f + .05, z0 + .05), (x1 - .05, f + .05, z1 - .05), (x0 + .05, f + .05, z1 - .05)], 'kit_glass', node='glass_%d' % i, region='whole')
            p.snap['window_%d' % i] = [round((x0 + x1) / 2, 3), round((z0 + z1) / 2, 3), -round(f + .05, 3)]
    return make


def _pipe(p, x, y, z0, z1, r=.045):
    """A downpipe with wall brackets, standing just in front of the plane y."""
    p.cyl((x, y - r - .02, z0), (x, y - r - .02, z1), r, seg=8, caps=False)
    for z in (z0 + .5, (z0 + z1) / 2, z1 - .4):
        p.box((x - r - .03, y - 2 * r - .03, z), (x + r + .03, y, z + .05), 'kit_metal', bevel=0)


def _corner_outer(p, H):
    """Turns a facade round a convex corner. 1 x 1 m on plan; the FRONT (-Y) and RIGHT (+X) faces show. The wall on its left carries straight on;
    the wall round the corner starts at the back-right, turned a quarter turn (see snap)."""
    plane = FACE + .03
    p.box((0, plane, .45), (1 - plane, 1, H - .3), bevel=.03)                                   # the pier
    p.box((0, 0, 0), (1, 1, .45), bevel=.025)                                                   # plinth
    p.box((0, .04, H - .3), (1 - .04, 1, H), 'kit_metal', bevel=.02)                            # floor band
    p.box((0, .02, H - .34), (1 - .02, 1, H - .3), 'kit_metal', bevel=0)                       # flashing
    p.box((0, .01, .4), (1 - .01, 1, .47), 'kit_metal', bevel=0)
    _rib(p, 0, .1, FACE - .02, plane + .01, .45, H - .3)                                        # half ribs where the walls join
    p.box((1 - plane - .01, .9, .45), (1 - FACE + .02, 1, H - .3), 'kit_metal', bevel=.012)
    _neon(p, (0, .07, H - .39), (.93, .07, H - .39), 'cyan', 'neon_0')                          # the tray's tube, carried round the corner
    _neon(p, (.93, .07, H - .39), (.93, 1, H - .39), 'cyan', 'neon_0')
    _neon(p, (1 - plane + .03, plane - .03, 2.2), (1 - plane + .03, plane - .03, H - .45), 'magenta', 'neon_1')   # a tall tube up the corner edge
    for z in (2.14, H - .45):
        p.box((1 - plane - .02, plane - .07, z), (1 - plane + .07, plane + .02, z + .06), 'kit_metal', bevel=0)
    # a steel corner guard, bolted on, as high as a lorry reaches
    p.box((1 - plane - .34, plane - .02, .45), (1 - plane + .02, plane + .01, 2.1), 'kit_metal', bevel=.006)
    p.box((1 - plane - .01, plane - .02, .45), (1 - plane + .02, plane + .34, 2.1), 'kit_metal', bevel=.006)
    for z in (.6, 1.25, 1.95):
        p.box((1 - plane - .3, plane - .035, z), (1 - plane - .24, plane - .02, z + .06), 'kit_metal', bevel=0)
        p.box((1 - plane + .02, plane + .24, z), (1 - plane + .035, plane + .3, z + .06), 'kit_metal', bevel=0)
    _pipe(p, .32, plane, .45, H - .34)
    p.snap.update({'left': [0, 0, 0], 'around': {'position': [1, 0, -1], 'turnY': 90}, 'top': [0, H, 0], 'wall_plane_z': -FACE, 'wall_plane_x': 1 - FACE})


def _corner_inner(p, H):
    """Fills a concave corner. 1 x 1 m on plan, an L: the back arm faces the street (-Y) half a metre behind the piece's front, the right arm faces left (-X)
    and runs toward the street. The wall on the left meets the back arm; the wall coming forward carries on from the right arm (see snap)."""
    plane = FACE + .03
    # back arm: x 0..0.5, its face at y = 0.5
    p.box((0, .5 + plane, .45), (.5 + plane, 1, H - .3), bevel=0)
    p.box((0, .5, 0), (.5, 1, .45), bevel=.02)
    p.box((0, .54, H - .3), (.5, 1, H), 'kit_metal', bevel=.02)
    p.box((0, .52, H - .34), (.5, 1, H - .3), 'kit_metal', bevel=0)
    _rib(p, 0, .1, .5 + FACE - .02, .5 + plane + .01, .45, H - .3)
    _neon(p, (0, .57, H - .39), (.57, .57, H - .39), 'cyan', 'neon_0')
    _neon(p, (.57, 0, H - .39), (.57, .57, H - .39), 'cyan', 'neon_0')
    # right arm: its face at x = 0.5, facing -X
    p.box((.5 + plane, 0, .45), (1, 1, H - .3), bevel=0)
    p.box((.5, 0, 0), (1, 1, .45), bevel=.02)
    p.box((.54, 0, H - .3), (1, 1, H), 'kit_metal', bevel=.02)
    p.box((.52, 0, H - .34), (1, 1, H - .3), 'kit_metal', bevel=0)
    p.box((.5 + FACE - .02, 0, .45), (.5 + plane + .01, .1, H - .3), 'kit_metal', bevel=.012)
    # the nook: a square fillet, a fat service pipe and a junction box, the things that collect in corners
    p.box((.5 - .02, .5 - .02, .45), (.5 + plane + .02, .5 + plane + .02, H - .3), bevel=.02)
    p.cyl((.3, .5 + plane - .1, .45), (.3, .5 + plane - .1, H - .34), .07, seg=8, caps=False)
    for z in (.9, 1.9, 2.8):
        p.box((.2, .5 + plane - .2, z), (.4, .5 + plane, z + .06), 'kit_metal', bevel=0)
    p.box((.5 + plane - .1, .15, 1.2), (.5 + plane + .01, .42, 1.75), 'kit_metal', bevel=.012)
    p.cyl((.5 + plane - .04, .28, 1.75), (.5 + plane - .04, .28, H - .34), .022, seg=6, caps=False)
    p.snap.update({'left': {'position': [0, 0, -.5]}, 'forward': {'position': [.5, 0, 0], 'turnY': -90}, 'top': [0, H, 0]})


def cornice(W):
    """The crown of a facade: sits on top of the top floor. It overhangs the wall's front by 0.2 m, so place it 0.2 m forward of the wall (see snap)."""
    def make(p):
        o = .2                                                # the overhang; the wall's front is at y = o
        p.box((0, o + .04, 0), (W, o + DEPTH, .14), bevel=.015)
        p.box((0, o - .06, .14), (W, o + DEPTH, .3), 'kit_metal', bevel=.02)
        p.box((0, 0, .3), (W, o + DEPTH, .46), bevel=.03)
        p.box((0, 0, .46), (W, o + DEPTH, .5), 'kit_metal', bevel=0)     # capping sheet
        _neon(p, (0, .05, .26), (W, .05, .26), 'magenta', 'neon_0')      # a tube slung under the overhang
        n = int(W * 2)
        for i in range(n):                                    # cooling fins, on a half-metre rhythm that carries across pieces
            x = i * .5 + .25
            for dx in (-.08, 0, .08):
                p.box((x + dx - .02, o - .04, .01), (x + dx + .02, o + .05, .14), 'kit_metal', bevel=0)
        for k in range(int(W / 2) + 1):                       # a bracket under the overhang at each bay line
            x0, x1 = max(0, k * 2 - .08), min(W, k * 2 + .08)
            p.box((x0, .03, .14), (x1, o - .05, .3), bevel=.01)
        p.snap.update({'left': [0, 0, 0], 'right': [W, 0, 0], 'on_wall': [0, 0, o], 'top': [0, .5, 0]})
    return make


def cornice_corner(p):
    """Carries the cornice round a convex corner: sits on kit_corner_outer_1m, overhanging its front and right faces by 0.2 m."""
    o = .2
    p.box((0, o + .04, 0), (1 - .04, 1 + o, .14), bevel=.015)
    p.box((0, o - .06, .14), (1 + .06, 1 + o, .3), 'kit_metal', bevel=.02)
    p.box((0, 0, .3), (1 + o, 1 + o, .46), bevel=.03)
    p.box((0, 0, .46), (1 + o, 1 + o, .5), 'kit_metal', bevel=0)
    _neon(p, (0, .05, .26), (1 + o - .05, .05, .26), 'magenta', 'neon_0')
    _neon(p, (1 + o - .05, .05, .26), (1 + o - .05, 1 + o, .26), 'magenta', 'neon_0')
    for x in (.25, .75):
        for dx in (-.08, 0, .08):
            p.box((x + dx - .02, o - .04, .01), (x + dx + .02, o + .05, .14), 'kit_metal', bevel=0)
            p.box((1 - .05, o + x + dx - .02, .01), (1 + .04, o + x + dx + .02, .14), 'kit_metal', bevel=0)
    p.box((1 - .1, .04, .14), (1 + .16, o + .06, .3), bevel=.01)          # the corner bracket
    p.snap.update({'left': [0, 0, 0], 'on_corner': [0, 0, o], 'around': {'position': [1 + o, 0, -1 - o], 'turnY': 90}, 'top': [0, .5, 0]})


def roof_parapet(W):
    """The low wall at the roof edge, with a coping and a pipe rail. Sits on the cornice or straight on the top floor, flush with the wall."""
    def make(p):
        plane = FACE + .03
        p.box((0, plane, 0), (W, DEPTH, .78), bevel=0)
        p.box((0, .02, .78), (W, DEPTH + .04, .9), bevel=.025)                                      # coping
        p.box((0, 0, .9), (W, DEPTH + .06, .93), 'kit_metal', bevel=0)                              # its metal cap
        for k in range(int(W / 2) + 1):
            x0, x1 = max(0, k * 2 - .12), min(W, k * 2 + .12)
            p.box((x0, FACE - .02, 0), (x1, plane + .01, .78), 'kit_metal', bevel=.012)
        for k in range(int(W / 2)):                                                                # overflow spouts
            x = k * 2 + 1
            p.box((x - .1, plane - .06, .12), (x + .1, plane + .01, .3), 'kit_metal', bevel=.01)
            p.box((x - .06, plane - .16, .14), (x + .06, plane - .06, .2), 'kit_metal', bevel=0)
        for i in range(int(W) + 1):                                                                # rail posts every metre (shared at the ends)
            x = min(max(i * 1.0, .03), W - .03)
            p.cyl((x, .3, .93), (x, .3, 1.5), .025, seg=6)
        for z in (1.2, 1.48):
            p.cyl((0, .3, z), (W, .3, z), .022, seg=6)
        p.snap.update({'left': [0, 0, 0], 'right': [W, 0, 0], 'wall_plane_z': -FACE})
    return make


def roof_parapet_corner(p):
    """Carries the parapet and its rail round a convex corner: sits over kit_corner_outer_1m (on the cornice corner), front and right faces showing."""
    plane = FACE + .03
    p.box((0, plane, 0), (1 - plane, 1, .78), bevel=.02)
    p.box((0, .02, .78), (1 - .02, 1, .9), bevel=.025)
    p.box((0, 0, .9), (1, 1, .93), 'kit_metal', bevel=0)
    p.box((0, FACE - .02, 0), (.12, plane + .01, .78), 'kit_metal', bevel=.012)
    p.box((1 - plane - .01, .88, 0), (1 - FACE + .02, 1, .78), 'kit_metal', bevel=.012)
    p.box((1 - plane - .3, plane - .02, 0), (1 - plane + .02, plane + .01, .78), 'kit_metal', bevel=.006)     # a steel angle on the corner
    p.box((1 - plane - .01, plane - .02, 0), (1 - plane + .02, plane + .3, .78), 'kit_metal', bevel=.006)
    p.cyl((.03, .3, .93), (.03, .3, 1.5), .025, seg=6)
    p.cyl((.7, .3, .93), (.7, .3, 1.5), .03, seg=6)
    p.cyl((.7, .97, .93), (.7, .97, 1.5), .025, seg=6)
    for z in (1.2, 1.48):
        p.cyl((0, .3, z), (.7, .3, z), .022, seg=6)
        p.cyl((.7, .3, z), (.7, 1, z), .022, seg=6)
    p.snap.update({'left': [0, 0, 0], 'around': {'position': [1, 0, -1], 'turnY': 90}})


# ---- window units: surface-mounted steel windows to put on a plain wall (their back goes against the wall plane; see snap "mount")
def window_unit(W, H, kind):
    def make(p):
        d = .2
        p.box((.04, d - .02, .04), (W - .04, d, H - .04), 'kit_metal', bevel=0)            # the dark room behind the glass
        for x0, x1 in ((0, .07), (W - .07, W)):
            p.box((x0, .03, 0), (x1, d, H), 'kit_metal', bevel=.01)
        p.box((0, 0, 0), (W, d, .07), 'kit_metal', bevel=.012)                             # sill, the frontmost part
        p.box((0, 0, H - .1), (W, d, H), 'kit_metal', bevel=.012)                          # hood
        p.quad([(.07, .1, .07), (W - .07, .1, .07), (W - .07, .1, H - .1), (.07, .1, H - .1)], 'kit_glass', node='glass_0', region='whole')
        if kind == 'frame':
            p.box((.07, .07, H * .6), (W - .07, .11, H * .6 + .04), 'kit_metal', bevel=0)
            for j in range(4):
                p.box((.07, .04, .12 + j * .11), (W - .07, .07, .18 + j * .11), 'kit_metal', bevel=0)
        elif kind == 'wide':
            for k in (1, 2):
                p.box((W * k / 3 - .02, .07, .07), (W * k / 3 + .02, .11, H - .1), 'kit_metal', bevel=0)
            p.box((.07, .07, H - .42), (W - .07, .11, H - .38), 'kit_metal', bevel=0)
            p.box((.1, .01, .07), (W - .1, .05, .13), 'kit_metal', bevel=0)           # a rail along the sill
            _neon(p, (.1, .05, H - .13), (W - .1, .05, H - .13), 'magenta', 'neon_0')       # a tube tucked under the hood
        else:                                                                              # barred: a welded cage over the glass
            n = 5
            for i in range(n):
                x = .12 + i * (W - .24) / (n - 1)
                p.cyl((x, .035, .07), (x, .035, H - .1), .013, seg=5, caps=False)
            for z in (H * .3, H * .65):
                p.box((.07, .015, z), (W - .07, .05, z + .035), 'kit_metal', bevel=0)
            p.box((W - .2, .005, H * .45), (W - .09, .06, H * .45 + .14), 'kit_metal', bevel=.008)   # the padlocked hasp
        p.snap.update({'mount': {'position': [0, 0, -d], 'note': 'put the back of the unit on the wall plane'}, 'window_0': [round(W / 2, 3), round(H / 2, 3), -.1]})
    return make


def corner_outer(p):
    _corner_outer(p, FLOOR)


def corner_inner(p):
    _corner_inner(p, FLOOR)


def corner_outer_tall(p):
    _corner_outer(p, SHOP)


def corner_inner_tall(p):
    _corner_inner(p, SHOP)


# ---- shopfronts: the 4.5 m street floor. Opening 3 m high between two half piers, a steel lintel, a sign fascia, then the same service tray as the walls.
def _shop_shell(p, W, sign=True):
    H, plane, top = SHOP, FACE + .03, 3.0
    p.box((0, plane, top), (W, DEPTH, H), bevel=0)                                   # wall above the opening
    p.box((0, DEPTH - .05, 0), (W, DEPTH, top), bevel=0)                             # the back of the opening
    for x0, x1 in ((0, .14), (W - .14, W)):                                          # half piers; two pieces side by side make a whole one
        p.box((x0, .02, 0), (x1, DEPTH, top), bevel=.015)
        p.box((x0, 0, 0), (x1, .03, .55), 'kit_metal', bevel=0)                      # kick plate
    p.box((0, .03, top), (W, plane + .01, top + .22), 'kit_metal', bevel=.015)       # lintel
    p.box((0, .02, 3.3), (W, plane + .01, 4.12), 'kit_metal', bevel=.02)             # fascia
    if sign:      # an LED text strip (material kit_ticker): the game scrolls it by sliding that material's texture sideways. Its own node, so a shop can have its own sign instead
        p.box((.15, .004, 3.4), (W - .15, .02, 4.02), 'kit_ticker', bevel=0, node='sign_0', region='ticker')
        p.snap['sign'] = {'position': [.15, 3.4, 0], 'size': [W - .3, .62]}
    else:
        for j in range(5):
            p.box((.15, .005, 3.42 + j * .12), (W - .15, .02, 3.49 + j * .12), 'kit_metal', bevel=0)
    p.box((0, .04, H - .3), (W, plane + .01, H), 'kit_metal', bevel=.02)             # service tray, as on the walls
    p.box((0, .02, H - .34), (W, plane + .01, H - .3), 'kit_metal', bevel=0)
    _neon(p, (0, .07, H - .39), (W, .07, H - .39), 'cyan', 'neon_0')
    p.snap.update({'left': [0, 0, 0], 'right': [W, 0, 0], 'top': [0, H, 0], 'wall_plane_z': -FACE})
    return top


def shop_window(W):
    def make(p):
        top = _shop_shell(p, W)
        f, n = .2, int(W / 2)
        p.box((.14, .06, 0), (W - .14, f + .08, .5), 'kit_metal', bevel=.012)          # stall riser
        p.box((.14, .04, .5), (W - .14, f + .1, .56), 'kit_metal', bevel=.01)          # its sill
        pw = (W - .28) / n
        for i in range(n + 1):
            x = .14 + i * pw
            p.box((max(.14, x - .03), f, .56), (min(W - .14, x + .03), f + .07, top), 'kit_metal', bevel=0)
        p.box((.14, f, 2.4), (W - .14, f + .07, 2.46), 'kit_metal', bevel=0)           # transom
        p.box((.14, f, top - .05), (W - .14, f + .07, top), 'kit_metal', bevel=0)
        for i in range(n):
            x0, x1 = .14 + i * pw + .03, .14 + (i + 1) * pw - .03
            p.quad([(x0, f + .04, .56), (x1, f + .04, .56), (x1, f + .04, 2.4), (x0, f + .04, 2.4)], 'kit_glass', node='glass_%d' % i, region='whole')
            for j in range(4):                                                        # vent louvres above the transom
                p.box((x0, f + .01, 2.5 + j * .11), (x1, f + .05, 2.56 + j * .11), 'kit_metal', bevel=0)
            p.snap['window_%d' % i] = [round((x0 + x1) / 2, 3), 1.48, -round(f + .04, 3)]
        _neon(p, (.2, .09, top - .06), (W - .2, .09, top - .06), 'magenta', 'neon_1')  # a tube under the lintel, over the window
    return make


def shop_shutter(p):
    W = 4
    top = _shop_shell(p, W)
    for x0, x1 in ((.14, .23), (W - .23, W - .14)):                                    # guide rails
        p.box((x0, .12, 0), (x1, .24, 2.7), 'kit_metal', bevel=.008)
    p.box((.14, .05, 2.66), (W - .14, .32, top), 'kit_metal', bevel=.015)              # the roller housing
    p.box((.23, .13, 0), (W - .23, .23, .1), 'kit_metal', bevel=.01)                   # bottom bar
    for i in range(13):                                                                # the curtain: slats stepping in and out
        z = .1 + i * .197
        p.box((.23, .16 + .018 * (i % 2), z), (W - .23, .21, z + .19), 'kit_metal', bevel=0)
    p.box((W / 2 - .12, .1, .02), (W / 2 + .12, .14, .16), 'kit_metal', bevel=.01)     # lock box
    for x in (1.2, W - 1.2):                                                           # lifting handles
        p.box((x - .1, .12, .5), (x + .1, .16, .54), 'kit_metal', bevel=0)
    p.box((W - .12, .006, 1.25), (W - .02, .03, 1.55), 'kit_metal', bevel=.008)   # the shutter's key switch on the pier
    p.box((W - .1, 0, 1.44), (W - .04, .006, 1.5), 'kit_emissive', bevel=0, region='neon_amber')   # its pilot light


def shop_door(p):
    W, plane = 2, FACE + .03
    top = _shop_shell(p, W, sign=False)
    p.box((.14, plane, 0), (.5, DEPTH, top), bevel=0)                                  # the wall each side of the door, and over it
    p.box((1.5, plane, 0), (W - .14, DEPTH, top), bevel=0)
    p.box((.5, plane, 2.42), (1.5, DEPTH, top), bevel=0)
    p.box((.38, 0, 0), (1.62, .34, .12), bevel=.015)                                   # step
    for x0, x1 in ((.43, .5), (1.5, 1.57)):                                            # steel frame
        p.box((x0, .1, .12), (x1, plane + .03, 2.49), 'kit_metal', bevel=.008)
    p.box((.43, .1, 2.42), (1.57, plane + .03, 2.49), 'kit_metal', bevel=.008)
    p.box((.5, .2, .12), (1.5, .26, 2.42), 'kit_metal', bevel=.008)                    # the door leaf
    p.box((.58, .185, .22), (1.42, .2, 1.35), 'kit_metal', bevel=.008)                 # pressed panels
    p.box((.58, .185, 1.45), (.82, .2, 2.3), 'kit_metal', bevel=.008)
    p.box((1.18, .185, 1.45), (1.42, .2, 2.3), 'kit_metal', bevel=.008)
    p.box((.86, .18, 1.5), (1.14, .2, 2.25), 'kit_metal', bevel=.006)                  # vision slit frame
    p.quad([(.9, .178, 1.55), (1.1, .178, 1.55), (1.1, .178, 2.2), (.9, .178, 2.2)], 'kit_glass', node='glass_0', region='whole')
    p.box((1.3, .15, 1.0), (1.36, .2, 1.22), 'kit_metal', bevel=.006)                  # pull handle
    p.box((1.62, plane - .05, 1.15), (1.8, plane + .01, 1.5), 'kit_metal', bevel=.008)  # entry keypad
    p.box((1.64, plane - .056, 1.36), (1.78, plane - .05, 1.47), 'kit_emissive', bevel=0, region='window_cyan')
    p.box((.55, .04, 2.56), (1.45, plane + .01, 2.7), 'kit_metal', bevel=.012)         # lamp hood over the door
    _neon(p, (.62, .08, 2.55), (1.38, .08, 2.55), 'white', 'neon_1')                   # and its tube
    p.cyl((.3, plane - .035, 0), (.3, plane - .035, top), .03, seg=6, caps=False)      # a conduit up the wall
    p.snap['door'] = {'position': [.5, .12, -.2], 'size': [1.0, 2.3]}


def shop_service(p):
    W, plane = 2, FACE + .03
    top = _shop_shell(p, W, sign=False)
    p.box((.14, plane, 0), (W - .14, DEPTH, top), bevel=0)
    p.box((.14, .02, 0), (W - .14, plane + .01, .45), bevel=.02)                       # plinth
    p.box((.28, .04, .5), (1.12, plane + .01, 2.2), 'kit_metal', bevel=.015)           # switchgear cabinet
    p.box((.69, .03, .56), (.71, .04, 2.14), 'kit_metal', bevel=0)                     # the seam between its doors
    for x in (.62, .74):
        p.box((x, .02, 1.25), (x + .04, .04, 1.45), 'kit_metal', bevel=0)              # handles
    for j in range(4):
        p.box((.34, .03, 1.82 + j * .08), (.64, .04, 1.86 + j * .08), 'kit_metal', bevel=0)
    p.box((.8, .034, 1.9), (.86, .04, 1.96), 'kit_emissive', bevel=0, region='neon_amber')     # status lights
    p.box((.9, .034, 1.9), (.96, .04, 1.96), 'kit_emissive', bevel=0, region='neon_cyan')
    p.box((.3, plane - .05, 2.38), (1.1, plane + .01, 2.88), 'kit_metal', bevel=.012)  # vent grille
    for j in range(5):
        p.box((.35, plane - .065, 2.43 + j * .085), (1.05, plane - .05, 2.48 + j * .085), 'kit_metal', bevel=0)
    for x, r in ((1.36, .04), (1.52, .05), (1.69, .035)):                             # risers
        p.cyl((x, plane - r - .02, .45), (x, plane - r - .02, top), r, seg=8, caps=False)
    for z in (.9, 1.9, 2.75):
        p.box((1.28, plane - .125, z), (1.76, plane, z + .05), 'kit_metal', bevel=0)
    p.box((1.44, plane - .125, 1.3), (1.6, plane - .03, 1.5), 'kit_metal', bevel=.012)    # a valve body on the big riser
    p.cyl((1.52, plane - .12, 1.4), (1.52, plane - .128, 1.4), .09, seg=8)               # and its wheel


# ---- awnings, canopy, balconies: things that hang off a facade. Their BACK goes against the wall plane (see snap "mount"); origin is still bottom-left-front.
def _slope(faces, k, y_ref):
    """Tilt what was just built: raise each point by k for every metre it is behind y_ref."""
    for v in {v for f in faces for v in f.verts}:
        v.co.z += k * (v.co.y - y_ref)


def awning_fabric(W):
    def make(p):
        D, k = 1.5, .4                                           # reach from the wall, and the slope (rise per metre)
        _slope(p.box((0, .02, .27), (W, D, .3), 'kit_fabric', bevel=0), k, 0)                 # the cloth
        p.box((0, 0, 0), (W, .02, .3), 'kit_fabric', bevel=0)                                # the valance hanging at the front
        p.cyl((0, .03, .27), (W, .03, .27), .022, seg=6)                                     # front bar
        for i in range(int(W) + 1):                                                          # arms under the cloth, every metre
            x = min(max(i * 1.0, .05), W - .05)
            p.cyl((x, .03, .25), (x, D - .02, .25 + k * (D - .05)), .018, seg=5, caps=False)
            if i % 2 == 0:                                                                   # a stay from the wall down to the front bar
                p.cyl((x, D - .02, .1), (x, .5, .25 + k * .47), .015, seg=5, caps=False)
                p.box((x - .04, D - .03, .04), (x + .04, D, .2), 'kit_metal', bevel=0)
        p.box((0, D - .04, .2 + k * D), (W, D, .34 + k * D), 'kit_metal', bevel=.01)          # the wall rail it hangs from
        _neon(p, (.05, .05, .06), (W - .05, .05, .06), 'amber', 'neon_0')                     # a tube behind the valance, lighting the pavement side
        p.snap.update({'mount': {'position': [0, 0, -D], 'note': 'put the back on the wall plane'}, 'left': [0, 0, 0], 'right': [W, 0, 0]})
    return make


def awning_canopy(p):
    """A flat steel canopy on tie rods, with a strip light under it."""
    W, D = 4, 1.5
    for y0, y1 in ((0, .08), (D - .08, D)):
        p.box((0, y0, 0), (W, y1, .16), 'kit_metal', bevel=.012)                              # front and back beams
    for k in range(3):
        x0 = min(k * 2, W - .08)
        p.box((x0, .08, .02), (x0 + .08, D - .08, .14), 'kit_metal', bevel=0)                 # cross beams
    for i in range(16):                                                                      # corrugated sheet
        p.box((i * .25, .02, .16 + .02 * (i % 2)), (i * .25 + .25, D - .02, .19 + .02 * (i % 2)), 'kit_metal', bevel=0)
    p.box((0, 0, .04), (W, .05, .1), 'kit_metal', bevel=0)                                 # gutter lip
    for x in (.3, W - .3):                                                                   # tie rods up to the wall
        p.cyl((x, .25, .18), (x, D - .02, .75), .016, seg=5, caps=False)
        p.box((x - .05, D - .03, .66), (x + .05, D, .8), 'kit_metal', bevel=0)
    _neon(p, (.3, D * .5, 0), (W - .3, D * .5, 0), 'white', 'neon_0')                  # strip light under the canopy
    p.box((.25, D * .5 - .05, .02), (W - .25, D * .5 + .05, .05), 'kit_metal', bevel=0)
    p.snap.update({'mount': {'position': [0, 0, -D], 'note': 'put the back on the wall plane'}, 'left': [0, 0, 0], 'right': [W, 0, 0]})


def balcony(W):
    def make(p):
        D, deck = 1.0, .4                                         # reach from the wall; height of the deck's underside above the piece's bottom
        p.box((0, 0, deck), (W, D, deck + .1), 'kit_metal', bevel=.012)                       # the deck: a steel tray
        for i in range(int(W * 4)):                                                          # grating bars on it
            p.box((i * .25 + .1, .04, deck + .1), (i * .25 + .15, D - .04, deck + .115), 'kit_metal', bevel=0)
        for k in range(int(W / 2) + 1):                                                      # brackets back to the wall
            x = min(max(k * 2.0, .05), W - .05)
            p.box((x - .04, D - .06, 0), (x + .04, D, deck), 'kit_metal', bevel=0)
            p.cyl((x, .15, deck), (x, D - .04, .04), .025, seg=5, caps=False)
        top = deck + .1 + 1.05
        posts = [(min(max(i * 1.0, .03), W - .03), .03) for i in range(int(W) + 1)] + [(.03, D - .03), (W - .03, D - .03)]
        for x, y in posts:
            p.cyl((x, y, deck + .1), (x, y, top), .022, seg=6)
        for z in (deck + .22, top - .02):                                                    # bottom and top rails, front and both sides
            p.cyl((0, .03, z), (W, .03, z), .02, seg=6)
            for x in (.03, W - .03):
                p.cyl((x, .03, z), (x, D, z), .02, seg=6)
        n = int(W * 8)
        for i in range(1, n):                                                                # balusters
            if i % 8:
                p.cyl((i * .125, .03, deck + .22), (i * .125, .03, top - .02), .008, seg=4, caps=False)
        for x in (.03, W - .03):
            for j in range(1, 7):
                p.cyl((x, .03 + j * .135, deck + .22), (x, .03 + j * .135, top - .02), .008, seg=4, caps=False)
        p.snap.update({'mount': {'position': [0, 0, -D], 'note': 'put the back on the wall plane'}, 'deck_top': round(deck + .115, 3), 'left': [0, 0, 0], 'right': [W, 0, 0]})
    return make


# ---- batch 6: fire escape and building services. Like the awnings, their BACK goes against the wall plane.
def fire_landing(p):
    W, D, deck = 3, 1.2, .3
    for a, b in (((0, 0), (W, .06)), ((0, D - .06), (W, D)), ((0, 0), (.06, D)), ((W - .06, 0), (W, D)), ((2.25, 0), (2.31, D))):
        p.box((a[0], a[1], deck), (b[0], b[1], deck + .1), 'kit_metal', bevel=0)              # frame; the bay right of x = 2.25 is the open ladder hatch
    for i in range(15):                                                                      # grating
        p.box((i * .15 + .04, .06, deck + .05), (i * .15 + .1, D - .06, deck + .08), 'kit_metal', bevel=0)
    for x in (.05, 1.5, W - .05):
        p.box((x - .04, D - .06, 0), (x + .04, D, deck), 'kit_metal', bevel=0)
        p.cyl((x, .2, deck), (x, D - .04, .04), .025, seg=5, caps=False)
    top = deck + 1.2
    for x, y in ((.03, .03), (1.5, .03), (W - .03, .03), (.03, D - .03), (W - .03, D - .03)):
        p.cyl((x, y, deck + .1), (x, y, top), .022, seg=6)
    for z in (deck + .5, deck + .85, top - .02):
        p.cyl((0, .03, z), (W, .03, z), .018, seg=5)
        for x in (.03, W - .03):
            p.cyl((x, .03, z), (x, D, z), .018, seg=5)
    p.snap.update({'mount': {}, 'deck_top': round(deck + .1, 3), 'hatch': {'position': [2.31, deck + .1, 0], 'size': [.63, D]}})


def fire_ladder(p):
    H, D = FLOOR, .3
    for x in (.28, .72):
        p.cyl((x, .03, 0), (x, .03, H), .022, seg=6)
    z = .25
    while z < H:
        p.cyl((.28, .03, z), (.72, .03, z), .014, seg=5, caps=False)
        z += .3
    for z in (.5, 1.75, 3.0):
        p.box((0, D - .03, z), (1, D, z + .06), 'kit_metal', bevel=0)
        for x in (.28, .72):
            p.cyl((x, .03, z + .03), (x, D - .02, z + .03), .014, seg=5, caps=False)
    p.snap.update({'mount': {}, 'top': [0, H, 0]})


def pipe_vertical(p):
    H, D = FLOOR, .25
    pipes = ((.2, .06), (.42, .09), (.66, .045), (.83, .03))
    for x, r in pipes:
        p.cyl((x, D - r - .03, 0), (x, D - r - .03, H), r, seg=8, caps=False)
    for z in (.4, 1.75, 3.1):
        p.box((.05, D - .04, z), (.95, D, z + .06), 'kit_metal', bevel=0)
        for x, r in pipes:
            p.box((x - r - .012, D - 2 * r - .042, z), (x + r + .012, D - .03, z + .06), 'kit_metal', bevel=0)
    for z in (1.15, 1.45):                                                                   # flanges and a valve on the main
        p.cyl((.42, D - .12, z), (.42, D - .12, z + .05), .125, seg=8)
    p.cyl((.42, .0, 1.325), (.42, D - .2, 1.325), .03, seg=6)
    p.cyl((.42, 0, 1.325), (.42, .012, 1.325), .1, seg=8)
    p.box((.58, D - .17, 2.2), (.76, D - .02, 2.5), 'kit_metal', bevel=.01)                   # a junction box on the conduit
    p.box((0, D - .02, 0), (1, D, .05), 'kit_metal', bevel=0)
    p.snap.update({'mount': {}, 'top': [0, H, 0]})


def duct_horizontal(p):
    W, D = 4, .5
    p.box((0, .02, .1), (W, .45, .5), 'kit_metal', bevel=.01)
    for x0, x1 in ((0, .03), (.97, 1.03), (1.97, 2.03), (2.97, 3.03), (W - .03, W)):         # flanged joints every metre
        p.box((x0, 0, .08), (x1, .47, .52), 'kit_metal', bevel=0)
    for j in range(5):                                                                       # an outlet grille
        p.box((2.3, .005, .16 + j * .065), (2.9, .02, .2 + j * .065), 'kit_metal', bevel=0)
    for x in (.5, 3.5):                                                                      # hangers
        p.box((x - .03, .45, 0), (x + .03, D, .62), 'kit_metal', bevel=0)
        p.box((x - .03, 0, .05), (x + .03, D, .08), 'kit_metal', bevel=0)
    p.cyl((1.5, .24, .5), (1.5, .24, .75), .1, seg=8)                                        # a capped branch stub
    p.snap.update({'mount': {}, 'left': [0, 0, 0], 'right': [W, 0, 0]})


def cable_bundle(p):
    W, D = 4, .15
    for x0, x1 in ((0, .06), (1.97, 2.03), (W - .06, W)):
        p.box((x0, D - .1, .28), (x1, D, .5), 'kit_metal', bevel=0)
    for i in range(5):                                                                       # five cables, each sagging its own amount between the brackets
        y, z0, sag = D - .04 - .014 * (i % 3), .47 - .035 * i, .07 + .035 * i
        for a, b in ((.03, 2.0), (2.0, W - .03)):
            pts = [(a + (b - a) * t / 5, y, z0 - sag * 4 * (t / 5) * (1 - t / 5)) for t in range(6)]
            for q0, q1 in zip(pts, pts[1:]):
                p.cyl(q0, q1, .012, seg=4, caps=False)
    p.box((1.86, D - .13, .02), (2.14, D, .26), 'kit_metal', bevel=.01)                       # a junction box hanging under the middle bracket
    p.snap.update({'mount': {}, 'left': [0, 0, 0], 'right': [W, 0, 0]})


# ---- batch 7: wall and roof clutter
def ac_unit(p):
    p.box((0, .03, .04), (.95, .35, .62), 'kit_metal', bevel=.02)
    for x in (.1, .75):
        p.box((x, .06, 0), (x + .1, .32, .04), 'kit_metal', bevel=0)
    p.cyl((.34, .012, .33), (.34, .03, .33), .24, seg=12)                                    # the fan opening
    p.box((.1, 0, .32), (.58, .012, .34), 'kit_metal', bevel=0)                              # its guard
    p.box((.33, 0, .09), (.35, .012, .57), 'kit_metal', bevel=0)
    for j in range(6):
        p.box((.66, .01, .1 + j * .08), (.9, .03, .14 + j * .08), 'kit_metal', bevel=0)
    p.cyl((.95, .2, .5), (1.0, .2, .5), .03, seg=6)
    p.cyl((.95, .26, .42), (1.0, .26, .42), .018, seg=5)
    p.snap.update({'base': [0, 0, 0], 'note': 'stands on kit_clutter_ac_bracket_1m (its shelf_top) or on a roof'})


def ac_bracket(p):
    D = .5
    for x in (.08, .92):
        p.box((x - .02, 0, .3), (x + .02, D, .34), 'kit_metal', bevel=0)
        p.box((x - .02, D - .04, 0), (x + .02, D, .34), 'kit_metal', bevel=0)
        p.cyl((x, .05, .3), (x, D - .03, .03), .013, seg=5, caps=False)
    for y in (.05, D - .14):
        p.box((0, y, .3), (1, y + .04, .34), 'kit_metal', bevel=0)
    p.snap.update({'mount': {}, 'shelf_top': .34})


def roof_watertank(p):
    legs = ((.15, .15), (1.85, .15), (.15, 1.85), (1.85, 1.85))
    for x, y in legs:
        p.cyl((x, y, 0), (x, y, .9), .045, seg=6)
    for a, b in ((0, 1), (1, 3), (3, 2), (2, 0)):                                            # cross bracing
        p.cyl((legs[a][0], legs[a][1], .08), (legs[b][0], legs[b][1], .85), .018, seg=4, caps=False)
    p.box((0, 0, .9), (2, 2, .98), 'kit_metal', bevel=.012)
    p.cyl((1, 1, .98), (1, 1, 2.7), .85, seg=16)
    for z in (1.25, 1.85, 2.5):
        p.cyl((1, 1, z), (1, 1, z + .06), .87, seg=16, caps=False)
    p.cyl((1, 1, 2.7), (1, 1, 2.78), .5, seg=12)
    p.cyl((1, 1, 2.78), (1, 1, 2.9), .16, seg=8)
    for x in (.9, 1.1):
        p.cyl((x, .1, 0), (x, .1, 2.75), .018, seg=5)
    for k in range(9):
        p.cyl((.9, .1, .25 + k * .3), (1.1, .1, .25 + k * .3), .012, seg=4, caps=False)
    p.cyl((1.72, 1, 0), (1.72, 1, 1.05), .05, seg=6)                                         # the outlet down to the roof
    p.snap.update({'base': [0, 0, 0]})


def roof_antenna(p):
    p.box((0, 0, 0), (1, 1, .12), bevel=.015)
    p.cyl((.5, .5, .12), (.5, .5, 4.2), .035, seg=6)
    for x, y in ((.08, .08), (.92, .08), (.5, .94)):                                         # guy wires
        p.cyl((x, y, .12), (.5, .5, 3.0), .006, seg=3, caps=False)
    p.cyl((.1, .5, 3.4), (.9, .5, 3.4), .015, seg=5)
    for i in range(5):
        p.cyl((.1 + .2 * i, .3 + .03 * i, 3.4), (.1 + .2 * i, .7 - .03 * i, 3.4), .008, seg=4)
    p.cyl((.5, .34, 2.6), (.5, .4, 2.6), .3, seg=12)                                         # a dish
    p.box((.46, .4, 2.54), (.54, .5, 2.66), 'kit_metal', bevel=0)
    p.cyl((.58, .5, 2.0), (.64, .5, 2.0), .18, seg=10)
    p.box((.4, .54, .7), (.6, .68, 1.1), 'kit_metal', bevel=.01)                              # the equipment box
    p.box((.47, .47, 4.2), (.53, .53, 4.28), 'kit_emissive', bevel=0, node='neon_0', region='neon_amber')   # the beacon (its own node: the game can blink it)
    p.snap.update({'base': [0, 0, 0]})


def roof_vent(p):
    p.box((0, 0, 0), (1, 1, .25), bevel=.02)
    p.box((.15, .15, .25), (.85, .85, .7), 'kit_metal', bevel=.012)
    for j in range(4):
        p.box((.2, .13, .32 + j * .09), (.8, .15, .37 + j * .09), 'kit_metal', bevel=0)
        p.box((.85, .2, .32 + j * .09), (.87, .8, .37 + j * .09), 'kit_metal', bevel=0)
    p.box((.08, .08, .74), (.92, .92, .8), 'kit_metal', bevel=.012)
    for x, y in ((.18, .18), (.82, .18), (.18, .82), (.82, .82)):
        p.cyl((x, y, .7), (x, y, .74), .02, seg=4, caps=False)
    p.cyl((.5, .5, .8), (.5, .5, 1.2), .12, seg=8)
    p.cyl((.5, .5, 1.2), (.5, .5, 1.26), .21, seg=10)
    p.snap.update({'base': [0, 0, 0]})


def roof_hut(p):
    """The stair-head hut on a roof."""
    W, D = 3, 2.6
    p.box((0, .1, 0), (W, D, 2.3), bevel=.02)
    _slope(p.box((0, 0, 2.3), (W, D, 2.4), 'kit_metal', bevel=0), .1, 0)                      # a sheet roof, falling to the front
    p.box((.98, .06, 0), (2.02, .1, 2.12), 'kit_metal', bevel=0)                              # door frame
    p.box((1.05, .04, .02), (1.95, .08, 2.05), 'kit_metal', bevel=.008)
    p.box((1.13, .025, .15), (1.87, .04, 1.0), 'kit_metal', bevel=.006)
    p.box((1.13, .025, 1.12), (1.87, .04, 1.95), 'kit_metal', bevel=.006)
    p.box((1.78, .0, .95), (1.84, .04, 1.15), 'kit_metal', bevel=0)
    p.box((1.1, .01, 2.14), (1.9, .1, 2.24), 'kit_metal', bevel=.01)                          # lamp hood
    _neon(p, (1.15, .04, 2.12), (1.85, .04, 2.12), 'white', 'neon_0')
    p.box((2.3, .06, 1.45), (2.85, .1, 1.95), 'kit_metal', bevel=.01)                         # vent
    for j in range(4):
        p.box((2.34, .045, 1.5 + j * .1), (2.81, .06, 1.55 + j * .1), 'kit_metal', bevel=0)
    p.box((.3, .03, .9), (.72, .1, 1.5), 'kit_metal', bevel=.012)                             # a switch box and its conduit
    p.box((.36, .024, 1.34), (.44, .03, 1.42), 'kit_emissive', bevel=0, region='neon_cyan')
    p.cyl((.5, .07, 1.5), (.5, .07, 2.3), .022, seg=5, caps=False)
    p.snap.update({'base': [0, 0, 0], 'door': {'position': [1.05, .02, -.04], 'size': [.9, 2.03]}})


# ---- batch 8: signs and the street edge
def sign_vertical(p):
    """A blade sign standing out from the wall: 1 m reach, 3 m tall, lit on both faces (node sign_0, a coloured light box; give it a shop's own picture)."""
    T, H = .18, 3.0
    p.box((.02, 0, 0), (T - .02, .8, H), 'kit_metal', bevel=.012)
    for x0, x1 in ((0, .02), (T - .02, T)):
        p.box((x0, .05, .06), (x1, .75, H - .06), 'kit_emissive', bevel=0, node='sign_0', region='sign_magenta')
    for z in (.4, H - .4):
        p.cyl((T / 2, .8, z), (T / 2, 1.0, z), .025, seg=6)
        p.box((0, .97, z - .1), (T, 1.0, z + .1), 'kit_metal', bevel=0)
    _neon(p, (T / 2, .02, .05), (T / 2, .02, H - .05), 'cyan', 'neon_0')                 # a tube down the outer edge
    p.snap.update({'mount': {}, 'face': {'size': [.7, H - .12]}})


def sign_horizontal(p):
    W, H, D = 4, .9, .18
    p.box((0, .02, 0), (W, D - .04, H), 'kit_metal', bevel=.012)
    p.box((.06, 0, .06), (W - .06, .02, H - .06), 'kit_emissive', bevel=0, node='sign_0', region='sign_cyan')
    for x in (.5, W - .5):
        p.box((x - .05, D - .04, .15), (x + .05, D, H - .15), 'kit_metal', bevel=0)
    p.snap.update({'mount': {}, 'face': {'position': [.06, .06, 0], 'size': [W - .12, H - .12]}})


def neon_trim(W):
    """Two tubes on a wall channel: magenta over cyan, each its own node so the game can show one, the other or both."""
    def make(p):
        p.box((0, .035, 0), (W, .06, .14), 'kit_metal', bevel=0)
        for k in range(int(W) + 1):
            x = min(max(k * 1.0, .03), W - .03)
            p.box((x - .02, .0, .005), (x + .02, .04, .135), 'kit_metal', bevel=0)
        _neon(p, (.03, .02, .1), (W - .03, .02, .1), 'magenta', 'neon_0')
        _neon(p, (.03, .02, .04), (W - .03, .02, .04), 'cyan', 'neon_1')
        p.snap.update({'mount': {}, 'left': [0, 0, 0], 'right': [W, 0, 0]})
    return make


def kerb_straight(p):
    """Street edge: a 0.3 m gutter (front, street side) and a 0.3 m kerb, its top level with the sidewalk slab. A drain inlet in the middle."""
    W = 4
    p.box((0, 0, 0), (W, .3, .03), 'kit_asphalt', bevel=0)
    for x0, x1 in ((0, 1.7), (2.3, W)):
        p.box((x0, .3, 0), (x1, .6, .15), bevel=.02)
    p.box((1.7, .3, .11), (2.3, .6, .15), bevel=0)
    p.box((1.7, .42, 0), (2.3, .6, .11), bevel=0)
    for i in range(5):
        p.box((1.76 + i * .12, .31, .03), (1.8 + i * .12, .34, .11), 'kit_metal', bevel=0)
    p.snap.update({'left': [0, 0, 0], 'right': [W, 0, 0], 'sidewalk': [0, 0, -.6], 'top': .15})


def kerb_corner(p):
    """Takes gutter and kerb round a sidewalk corner (street on the front and the right)."""
    p.box((0, 0, 0), (1, .3, .03), 'kit_asphalt', bevel=0)
    p.box((.7, .3, 0), (1, 1, .03), 'kit_asphalt', bevel=0)
    p.box((0, .3, 0), (.7, .6, .15), bevel=.02)
    p.box((.4, .6, 0), (.7, 1, .15), bevel=.02)
    p.box((0, .6, 0), (.4, 1, .15), bevel=.012)
    p.snap.update({'left': [0, 0, 0], 'around': {'position': [1, 0, -1], 'turnY': 90}, 'top': .15})


def sidewalk_slab(p):
    """4 m of pavement, 3 m deep (the shopfront strip), in metre pavers; one is a steel service cover."""
    W, D = 4, 3
    p.box((0, 0, 0), (W, D, .1), bevel=0)
    for i in range(W):
        for j in range(D):
            if (i, j) == (2, 1):
                p.box((i + .04, j + .04, .1), (i + .96, j + .96, .148), 'kit_metal', bevel=.01)
                for y in (.3, .7):
                    p.box((i + .42, j + y - .02, .148), (i + .58, j + y + .02, .153), 'kit_metal', bevel=0)
            else:
                p.box((i + .008, j + .008, .1), (i + .992, j + .992, .15 - p.rng.uniform(0, .01)), bevel=.01)
    p.snap.update({'left': [0, 0, 0], 'right': [W, 0, 0], 'building': [0, 0, -D], 'top': .15})


PIECES = {
    # name: (batch, category, builder)
    'kit_wall_plain_2m': (1, 'wall', wall_plain(2)), 'kit_wall_plain_4m': (1, 'wall', wall_plain(4)), 'kit_wall_plain_6m': (1, 'wall', wall_plain(6)),
    'kit_wall_windows_4m': (1, 'wall', wall_windows(4)), 'kit_wall_windows_6m': (1, 'wall', wall_windows(6)),
    'kit_corner_outer_1m': (2, 'corner', corner_outer), 'kit_corner_inner_1m': (2, 'corner', corner_inner),
    'kit_cornice_2m': (2, 'cornice', cornice(2)), 'kit_cornice_4m': (2, 'cornice', cornice(4)), 'kit_cornice_6m': (2, 'cornice', cornice(6)),
    'kit_cornice_corner_1m': (2, 'cornice', cornice_corner), 'kit_roof_parapet_4m': (2, 'roof', roof_parapet(4)),
    'kit_shopfront_window_4m': (3, 'shopfront', shop_window(4)), 'kit_shopfront_window_6m': (3, 'shopfront', shop_window(6)),
    'kit_shopfront_shutter_4m': (3, 'shopfront', shop_shutter), 'kit_shopfront_door_2m': (3, 'shopfront', shop_door), 'kit_shopfront_service_2m': (3, 'shopfront', shop_service),
    'kit_corner_outer_tall_1m': (3, 'corner', corner_outer_tall), 'kit_corner_inner_tall_1m': (3, 'corner', corner_inner_tall),
    'kit_window_frame_1m': (4, 'window', window_unit(1, 1.6, 'frame')), 'kit_window_wide_2m': (4, 'window', window_unit(2, 1.4, 'wide')),
    'kit_window_barred_1m': (4, 'window', window_unit(1, 1.6, 'barred')),
    'kit_roof_parapet_2m': (4, 'roof', roof_parapet(2)), 'kit_roof_parapet_corner_1m': (4, 'roof', roof_parapet_corner),
    'kit_awning_fabric_4m': (5, 'awning', awning_fabric(4)), 'kit_awning_fabric_6m': (5, 'awning', awning_fabric(6)), 'kit_awning_canopy_4m': (5, 'awning', awning_canopy),
    'kit_balcony_2m': (5, 'balcony', balcony(2)), 'kit_balcony_4m': (5, 'balcony', balcony(4)),
    'kit_fireescape_landing_3m': (6, 'fireescape', fire_landing), 'kit_fireescape_ladder_1m': (6, 'fireescape', fire_ladder),
    'kit_pipe_vertical_1m': (6, 'services', pipe_vertical), 'kit_duct_horizontal_4m': (6, 'services', duct_horizontal), 'kit_cable_bundle_4m': (6, 'services', cable_bundle),
    'kit_clutter_ac_unit_1m': (7, 'clutter', ac_unit), 'kit_clutter_ac_bracket_1m': (7, 'clutter', ac_bracket), 'kit_roof_watertank_2m': (7, 'roof', roof_watertank),
    'kit_roof_antenna_1m': (7, 'roof', roof_antenna), 'kit_roof_vent_1m': (7, 'roof', roof_vent), 'kit_roof_hut_3m': (7, 'roof', roof_hut),
    'kit_sign_vertical_1m': (8, 'sign', sign_vertical), 'kit_sign_horizontal_4m': (8, 'sign', sign_horizontal), 'kit_neon_trim_2m': (8, 'sign', neon_trim(2)), 'kit_neon_trim_4m': (8, 'sign', neon_trim(4)),
    'kit_kerb_straight_4m': (8, 'street', kerb_straight), 'kit_kerb_corner_1m': (8, 'street', kerb_corner), 'kit_sidewalk_slab_4m': (8, 'street', sidewalk_slab),
}


# ---------------------------------------------------------------- build, export, manifest ----------------------------------------------------------------
# ================================================================ THE DISTRICT INTERIOR ================================================================
# Pieces for inside The Darknet District (docs/development/DISTRICT_INTERIOR.md), built the same way and with the same materials as the street kit, plus kit_tile.
# They are exported BARE (materials by name, no pictures): the game's model loader takes only self-contained files, and gives every piece the shared materials itself.
def int_wall_lining(p):
    """Lining for one side wall of the security vestibule: 6 m long, its back on the wall. Steel dado, a service band with a display, pipes and a cable tray above,
    and a tube under the tray in two colours (neon_0 magenta, neon_1 cyan: the game lights one per side)."""
    W, H, D = 6, 3.45, .22
    p.box((0, D - .03, 0), (W, D, H), 'kit_metal', bevel=0)
    p.box((0, .02, 0), (W, D, .12), 'kit_metal', bevel=0)
    for k in range(5):
        x0, x1 = max(0, k * 1.5 - .05), min(W, k * 1.5 + .05)
        _rib(p, x0, x1, .02, D, .12, 2.35)
    for k in range(4):
        x0 = k * 1.5
        p.box((x0 + .07, .06, .14), (x0 + 1.43, D - .03, 1.25), 'kit_metal', bevel=.015)
        p.box((x0 + .14, .045, .66), (x0 + 1.36, .06, .7), 'kit_metal', bevel=0)
        p.box((x0 + .14, .045, 1.1), (x0 + 1.36, .06, 1.13), 'kit_metal', bevel=0)
    p.box((1.9, .04, .25), (2.6, .06, .55), 'kit_metal', bevel=.008)                           # a maintenance hatch
    p.box((2.2, .03, .38), (2.3, .04, .42), 'kit_metal', bevel=0)
    p.box((0, D - .07, 1.25), (W, D - .03, 2.35), 'kit_concrete', bevel=0)                      # the service band
    for i, z in enumerate((1.4, 1.47, 1.54)):
        p.cyl((0, D - .09, z), (W, D - .09, z), .018, seg=5, caps=False)
    p.box((.3, D - .1, 1.7), (1.2, D - .07, 2.2), 'kit_metal', bevel=.01)                        # vent
    for j in range(5):
        p.box((.35, D - .115, 1.75 + j * .085), (1.15, D - .1, 1.8 + j * .085), 'kit_metal', bevel=0)
    p.box((3.1, D - .13, 1.62), (4.4, D - .07, 2.28), 'kit_metal', bevel=.012)                   # an information display
    p.box((3.16, D - .136, 1.68), (4.34, D - .13, 2.22), 'kit_emissive', bevel=0, node='screen_0', region='sign_cyan')
    p.box((4.75, D - .15, 1.65), (5.2, D - .07, 2.15), 'kit_metal', bevel=.012)                  # junction box with pilot lights
    p.box((4.82, D - .156, 2.02), (4.88, D - .15, 2.08), 'kit_emissive', bevel=0, region='neon_amber')
    p.box((4.94, D - .156, 2.02), (5.0, D - .15, 2.08), 'kit_emissive', bevel=0, region='neon_cyan')
    p.cyl((4.97, D - .1, 2.15), (4.97, D - .1, 2.38), .02, seg=5, caps=False)
    p.cyl((1.75, D - .1, 1.25), (1.75, D - .1, 2.38), .025, seg=5, caps=False)
    p.box((0, .03, 2.38), (W, D, 2.43), 'kit_metal', bevel=0)                                   # cable tray
    p.box((0, .03, 2.43), (W, .05, 2.5), 'kit_metal', bevel=0)
    for y, z, r in ((.11, 2.66, .07), (.1, 2.86, .05), (.11, 3.06, .085), (.12, 3.28, .04)):   # pipes
        p.cyl((0, y, z), (W, y, z), r, seg=8, caps=False)
    for k in range(4):
        x = k * 1.5 + .75
        p.box((x - .03, .02, 2.5), (x + .03, D, 3.4), 'kit_metal', bevel=0)
    p.cyl((2.4, .11, 3.06), (2.52, .11, 3.06), .12, seg=8)                                      # flanges and a valve on the main
    p.cyl((2.9, .11, 3.06), (3.02, .11, 3.06), .12, seg=8)
    p.cyl((2.71, .0, 3.06), (2.71, .03, 3.06), .09, seg=8)
    _neon(p, (0, .08, 2.34), (W, .08, 2.34), 'magenta', 'neon_0')
    _neon(p, (0, .08, 2.29), (W, .08, 2.29), 'cyan', 'neon_1')
    p.snap.update({'mount': {}})


def int_ceiling(p):
    """The vestibule ceiling, 6 x 6 m, hanging 0.7 m: beams, two ventilation ducts, pipes, a cable tray and two strip lights (node light_0)."""
    p.box((0, 0, .62), (6, 6, .7), 'kit_metal', bevel=0)
    for k in range(5):
        y0, y1 = max(0, k * 1.5 - .08), min(6, k * 1.5 + .08)
        p.box((0, y0, .3), (6, y1, .62), 'kit_metal', bevel=0)
        p.box((0, max(0, k * 1.5 - .15), .26), (6, min(6, k * 1.5 + .15), .3), 'kit_metal', bevel=0)
    for x, z, r in ((1.0, .2, .2), (1.48, .13, .13)):
        p.cyl((x, 0, z), (x, 6, z), r, seg=10, caps=False)
        for y in (1.0, 3.0, 5.0):
            p.cyl((x, y - .04, z), (x, y + .04, z), r + .025, seg=10)
    for x, r in ((4.62, .05), (4.78, .04), (4.96, .065)):
        p.cyl((x, 0, .19), (x, 6, .19), r, seg=6, caps=False)
    p.box((3.75, 0, .2), (4.05, 6, .22), 'kit_metal', bevel=0)
    for x in (3.75, 4.03):
        p.box((x, 0, .2), (x + .02, 6, .27), 'kit_metal', bevel=0)
    for x in (3.83, 3.9, 3.97):
        p.cyl((x, 0, .24), (x, 6, .24), .016, seg=4, caps=False)
    for x in (2.25, 3.2):                                                                       # strip lights
        p.box((x - .1, 1.0, .1), (x + .1, 5.0, .17), 'kit_metal', bevel=.01)
        _neon(p, (x - .04, 1.06, .08), (x - .04, 4.94, .08), 'white', 'light_0')
        _neon(p, (x + .04, 1.06, .08), (x + .04, 4.94, .08), 'white', 'light_0')
        for y in (1.3, 4.7):
            p.cyl((x, y, .17), (x, y, .62), .012, seg=4, caps=False)
    p.box((5.2, 2.6, .2), (5.85, 3.4, .3), 'kit_metal', bevel=.01)                               # a diffuser
    for j in range(5):
        p.box((5.25, 2.66 + j * .14, .185), (5.8, 2.72 + j * .14, .2), 'kit_metal', bevel=0)
    p.box((5.3, 2.8, .3), (5.75, 3.2, .62), 'kit_metal', bevel=0)
    p.snap.update({'top': .7})


def int_floor(p):
    """The vestibule floor, 6 x 6 m: worn tile, steel thresholds at both doors, and the scanner pad in the middle with a lit outline (node scan_0)."""
    p.box((0, 0, 0), (6, 6, .02), 'kit_metal', bevel=0)
    for y0, y1 in ((0, .2), (5.8, 6)):
        p.box((0, y0, .02), (6, y1, .05), 'kit_metal', bevel=0)
        for i in range(12):
            p.box((i * .5 + .1, y0 + .04, .05), (i * .5 + .4, y1 - .04, .056), 'kit_metal', bevel=0)
    step = 5.6 / 6
    for i in range(6):
        for j in range(6):
            if i in (2, 3) and j in (2, 3):
                continue
            p.box((i + .008, .2 + j * step + .008, .02), (i + .992, .2 + (j + 1) * step - .008, .045), 'kit_tile', bevel=0)
    a, b = 2.0, .2 + 2 * step
    c, d = 4.0, .2 + 4 * step
    p.box((a + .02, b + .02, .02), (c - .02, d - .02, .05), 'kit_metal', bevel=.01)
    for q0, q1 in (((a + .1, b + .1), (c - .1, b + .14)), ((a + .1, d - .14), (c - .1, d - .1)), ((a + .1, b + .1), (a + .14, d - .1)), ((c - .14, b + .1), (c - .1, d - .1))):
        p.box((q0[0], q0[1], .05), (q1[0], q1[1], .056), 'kit_emissive', bevel=0, node='scan_0', region='neon_cyan')
    for k in range(4):                                                                         # tread bars on the pad
        p.box((a + .3, b + .35 + k * .4, .05), (c - .3, b + .4 + k * .4, .054), 'kit_metal', bevel=0)
    p.snap.update({'top': .05})


def int_door_portal(p):
    """The heavy frame round a District security door, seen from the room side: 5.64 m clear opening, 3.2 m high. Its back goes 0.13 m off the door's plane."""
    W, H, D = 6.2, 3.6, .3
    for x0, x1 in ((0, .28), (W - .28, W)):
        p.box((x0, 0, 0), (x1, D, 3.2), 'kit_metal', bevel=.02)
        xm = (x0 + x1) / 2
        p.cyl((xm, .03, .35), (xm, .03, 2.6), .035, seg=6)                                 # the door's ram
        p.cyl((xm, .03, 2.6), (xm, .03, 3.05), .022, seg=6)
        for z in (.2, 1.0, 1.8, 2.75):
            p.box((x0 + .03, 0, z), (x1 - .03, .02, z + .1), 'kit_metal', bevel=0)
    p.box((0, 0, 3.2), (W, D, H), 'kit_metal', bevel=.02)
    for i in range(12):
        p.box((.35 + i * .5, .0, 3.27), (.4 + i * .5, .012, 3.53), 'kit_metal', bevel=0)        # header ribs
    p.cyl((.3, .04, 3.56), (W - .3, .04, 3.56), .025, seg=5, caps=False)
    for x in (.06, W - .22):                                                                    # warning lamps at the header ends
        p.box((x, .0, 3.3), (x + .16, .03, 3.5), 'kit_metal', bevel=.008)
        p.box((x + .03, 0, 3.34), (x + .13, .006, 3.46), 'kit_emissive', bevel=0, node='warn_0', region='neon_amber')
    p.box((W - .25, .0, 1.2), (W - .05, .035, 1.55), 'kit_metal', bevel=.008)                    # keypad
    p.box((W - .22, .0, 1.38), (W - .08, .006, 1.52), 'kit_emissive', bevel=0, region='sign_cyan')
    p.snap.update({'opening': {'position': [.28, 0, 0], 'size': [5.64, 3.2]}})


def int_scanner_arch(p):
    """The checkpoint's scanner: two posts and a sensor beam across the vestibule, with lit sensor strips (node scan_0) and a camera."""
    W, H = 5.2, 2.7
    for x0, x1, inner in ((0, .2, .2), (W - .2, W, W - .2)):
        p.box((x0, .1, 0), (x1, .3, 2.5), 'kit_metal', bevel=.02)
        p.box((x0, .04, 0), (x1, .36, .1), 'kit_metal', bevel=.01)
        p.box((min(inner, inner + (.012 if x0 == 0 else -.012)), .16, .4), (max(inner, inner + (.012 if x0 == 0 else -.012)), .24, 2.2), 'kit_emissive', bevel=0, node='scan_0', region='neon_cyan')
        for z in (.6, 1.3, 2.0):
            p.box((x0 + .03, .08, z), (x1 - .03, .1, z + .16), 'kit_metal', bevel=0)
    p.box((0, .06, 2.5), (W, .34, H), 'kit_metal', bevel=.02)
    p.box((.4, .17, 2.488), (W - .4, .23, 2.5), 'kit_emissive', bevel=0, node='scan_0', region='neon_cyan')
    for x in (1.3, 2.6, 3.9):
        p.box((x - .09, .12, 2.38), (x + .09, .28, 2.5), 'kit_metal', bevel=.01)
        p.cyl((x, .2, 2.32), (x, .2, 2.38), .05, seg=8)
    for y, s in ((.0, 1), (.4, -1)):                                                            # a camera looking each way
        p.box((2.5, min(y, y + s * .06), 2.55), (2.7, max(y, y + s * .06), 2.67), 'kit_metal', bevel=.008)
    p.cyl((2.6, .0, 2.61), (2.6, .02, 2.61), .04, seg=8)
    p.cyl((2.6, .38, 2.61), (2.6, .4, 2.61), .04, seg=8)
    p.snap.update({'centre': [W / 2, 0, -.2]})


def int_scanner_kiosk(p):
    """The badge terminal by the inner door: a pedestal with a tilted screen (node screen_0) and a palm pad."""
    p.box((0, 0, 0), (.6, .5, .05), 'kit_metal', bevel=.01)
    p.box((.1, .08, .05), (.5, .45, 1.0), 'kit_metal', bevel=.03)
    for j in range(3):
        p.box((.16, .065, .2 + j * .09), (.44, .08, .25 + j * .09), 'kit_metal', bevel=0)
    _slope(p.box((.03, .0, 1.0), (.57, .46, 1.06), 'kit_metal', bevel=.01), .45, 0)
    _slope(p.box((.07, .04, 1.06), (.53, .42, 1.066), 'kit_emissive', bevel=0, node='screen_0', region='sign_cyan'), .45, 0)
    p.box((.22, .058, .62), (.38, .08, .84), 'kit_metal', bevel=.008)                            # palm pad
    p.box((.24, .052, .66), (.36, .058, .8), 'kit_emissive', bevel=0, region='neon_amber')
    p.cyl((.5, .4, 1.0), (.5, .4, 1.42), .018, seg=5)
    p.box((.44, .3, 1.42), (.56, .46, 1.5), 'kit_metal', bevel=.01)
    p.snap.update({'base': [0, 0, 0]})


# ---- Phase B: the main hallway (x -3..3, z 26..70.5, ceiling at 4.05 m). Wall modules of 2 m, 1 m and a 0.5 m pilaster, all sharing one section so they run on
# from each other; a 4 m ceiling module across the full 6 m width. Left of the hallway is lit magenta, right cyan (David's corridor reference): pieces that carry
# a light or a display have BOTH colours as separate nodes (…_0 magenta, …_1 cyan) and the game shows one.
HALL_H = 4.05


def _hall_common(p, W, D=.2):
    H = HALL_H
    p.box((0, D - .03, 0), (W, D, H), 'kit_metal', bevel=0)
    p.box((0, 0, 0), (W, D, .15), 'kit_metal', bevel=0)                                        # skirting, the frontmost part
    p.box((0, .03, 1.3), (W, D, 1.36), 'kit_metal', bevel=0)                                   # dado rail
    p.box((0, D - .07, 1.36), (W, D - .03, 2.6), 'kit_concrete', bevel=0)                       # service band
    p.box((0, .02, 2.6), (W, D, 2.66), 'kit_metal', bevel=0)                                   # cable tray
    p.box((0, .02, 2.66), (W, .04, 2.74), 'kit_metal', bevel=0)
    for y in (.09, .14):
        p.cyl((0, y, 2.69), (W, y, 2.69), .018, seg=4, caps=False)
    for y, z, r in ((.1, 2.92, .06), (.1, 3.1, .045), (.1, 3.34, .08), (.11, 3.58, .035)):
        p.cyl((0, y, z), (W, y, z), r, seg=8, caps=False)
    p.box((W / 2 - .03, .02, 2.74), (W / 2 + .03, D, 3.72), 'kit_metal', bevel=0)               # pipe clamp
    p.box((0, .04, 3.9), (W, D, H), 'kit_metal', bevel=0)
    p.snap.update({'mount': {}})


def _hall_dado(p, W, D=.2, skip=()):
    for k in range(int(W)):
        if k in skip:
            continue
        p.box((k + .05, .05, .18), (k + .95, D - .03, 1.27), 'kit_metal', bevel=.012)
        p.box((k + .12, .038, .7), (k + .88, .05, .73), 'kit_metal', bevel=0)


def hall_wall_a(p):
    _hall_common(p, 2)
    _hall_dado(p, 2)
    for z in (1.5, 1.57, 1.64):
        p.cyl((0, .2 - .09, z), (2, .2 - .09, z), .016, seg=4, caps=False)
    p.box((.5, .2 - .09, 1.85), (1.1, .2 - .07, 2.3), 'kit_metal', bevel=.008)                   # a notice plate
    p.box((1.45, .2 - .12, 1.8), (1.75, .2 - .07, 2.15), 'kit_metal', bevel=.01)                 # a small breaker box
    p.cyl((1.6, .2 - .1, 2.15), (1.6, .2 - .1, 2.6), .016, seg=4, caps=False)


def hall_wall_b(p):
    """With a large lit display: screen_0 magenta, screen_1 cyan."""
    _hall_common(p, 2)
    _hall_dado(p, 2)
    D = .2
    p.box((.2, D - .14, 1.48), (1.8, D - .07, 2.52), 'kit_metal', bevel=.012)
    p.box((.26, D - .146, 1.54), (1.74, D - .14, 2.46), 'kit_emissive', bevel=0, node='screen_0', region='sign_magenta')
    p.box((.26, D - .147, 1.54), (1.74, D - .141, 2.46), 'kit_emissive', bevel=0, node='screen_1', region='sign_cyan')
    p.box((.3, D - .17, 2.52), (1.7, D - .07, 2.57), 'kit_metal', bevel=0)                       # its hood
    p.cyl((1.0, D - .1, 1.36), (1.0, D - .1, 1.48), .02, seg=5, caps=False)


def hall_wall_c(p):
    """Services: a vent, a junction box with pilot lights, a valve on the main."""
    _hall_common(p, 2)
    _hall_dado(p, 2)
    D = .2
    p.box((.15, D - .1, 1.5), (1.0, D - .07, 2.3), 'kit_metal', bevel=.01)
    for j in range(8):
        p.box((.2, D - .115, 1.56 + j * .09), (.95, D - .1, 1.61 + j * .09), 'kit_metal', bevel=0)
    p.box((1.2, D - .15, 1.55), (1.75, D - .07, 2.2), 'kit_metal', bevel=.012)
    p.box((1.28, D - .156, 2.05), (1.34, D - .15, 2.11), 'kit_emissive', bevel=0, region='neon_amber')
    p.box((1.4, D - .156, 2.05), (1.46, D - .15, 2.11), 'kit_emissive', bevel=0, region='neon_cyan')
    p.box((1.52, D - .156, 2.05), (1.58, D - .15, 2.11), 'kit_emissive', bevel=0, region='neon_magenta')
    p.cyl((1.47, D - .1, 2.2), (1.47, D - .1, 2.6), .022, seg=5, caps=False)
    for x in (.45, .6):
        p.cyl((x, .1, 3.34), (x + .06, .1, 3.34), .095, seg=8)
    p.cyl((.555, .004, 3.34), (.555, .03, 3.34), .09, seg=8)


def hall_wall_d(p):
    """A maintenance door with a warning lamp (warn_0) over it."""
    _hall_common(p, 2)
    _hall_dado(p, 2, skip=(0, 1))
    D = .2
    p.box((.36, .015, .15), (1.64, D, 2.28), 'kit_metal', bevel=.02)
    p.box((.46, .004, .2), (1.54, .03, 2.2), 'kit_metal', bevel=.01)
    p.box((.54, .0, .32), (1.46, .012, 1.1), 'kit_metal', bevel=.008)
    p.box((.54, .0, 1.25), (1.46, .012, 2.08), 'kit_metal', bevel=.008)
    p.box((1.36, .0, 1.1), (1.42, .03, 1.28), 'kit_metal', bevel=0)
    p.box((.85, .01, 2.32), (1.15, .06, 2.46), 'kit_metal', bevel=.01)
    p.box((.9, .004, 2.35), (1.1, .01, 2.43), 'kit_emissive', bevel=0, node='warn_0', region='neon_amber')
    p.box((1.72, .03, 1.2), (1.9, .06, 1.5), 'kit_metal', bevel=.008)
    p.box((1.74, .024, 1.36), (1.88, .03, 1.47), 'kit_emissive', bevel=0, region='sign_cyan')
    p.box((.08, .05, .18), (.3, D - .03, 1.27), 'kit_metal', bevel=.012)


def hall_wall_1m(p):
    _hall_common(p, 1)
    _hall_dado(p, 1)
    D = .2
    for x, r in ((.3, .028), (.42, .02), (.52, .034)):
        p.cyl((x, D - r - .07, 1.36), (x, D - r - .07, 2.6), r, seg=6, caps=False)
    p.box((.22, D - .16, 1.9), (.62, D - .07, 2.02), 'kit_metal', bevel=0)
    p.box((.66, D - .13, 1.5), (.9, D - .07, 1.85), 'kit_metal', bevel=.01)


def hall_pilaster(p):
    """The half-metre column at the end of every wall run and beside every doorway, with a light slot (light_0 magenta, light_1 cyan)."""
    D, H = .28, HALL_H
    p.box((.05, .012, 0), (.45, D, H), 'kit_metal', bevel=.02)
    p.box((0, 0, 0), (.5, D, .2), 'kit_metal', bevel=.012)
    p.box((0, 0, 3.8), (.5, D, H), 'kit_metal', bevel=.012)
    p.box((.2, .004, .6), (.3, .012, 3.2), 'kit_emissive', bevel=0, node='light_0', region='neon_magenta')
    p.box((.2, .003, .6), (.3, .011, 3.2), 'kit_emissive', bevel=0, node='light_1', region='neon_cyan')
    for z in (.4, 3.4):
        p.box((.12, .0, z), (.38, .012, z + .12), 'kit_metal', bevel=0)
    for x in (.08, .4):
        for z in (.9, 1.8, 2.7):
            p.box((x, .002, z), (x + .03, .012, z + .03), 'kit_metal', bevel=0)
    p.snap.update({'mount': {}})


def hall_ceiling(p):
    """4 m of hallway ceiling across the full 6 m: beams, a round and a square duct, pipes, a cable tray, a sprinkler line and two strip lights
    (light_0 magenta on one side, light_1 cyan on the other)."""
    L = 4
    p.box((0, 0, .56), (6, L, .6), 'kit_metal', bevel=0)
    for y in (1, 3):
        p.box((0, y - .08, .26), (6, y + .08, .56), 'kit_metal', bevel=0)
        p.box((0, y - .14, .22), (6, y + .14, .26), 'kit_metal', bevel=0)
    p.cyl((.7, 0, .2), (.7, L, .2), .2, seg=10, caps=False)
    p.cyl((.7, 1.96, .2), (.7, 2.04, .2), .225, seg=10)
    for x, z, r in ((1.2, .14, .07), (1.42, .16, .045)):
        p.cyl((x, 0, z), (x, L, z), r, seg=6, caps=False)
    for x, colour, node in ((2.0, 'magenta', 'light_0'), (4.0, 'cyan', 'light_1')):
        p.box((x - .1, .5, .1), (x + .1, 3.5, .17), 'kit_metal', bevel=.01)
        _neon(p, (x - .04, .56, .08), (x - .04, 3.44, .08), colour, node)
        _neon(p, (x + .04, .56, .08), (x + .04, 3.44, .08), colour, node)
        for y in (.8, 3.2):
            p.cyl((x, y, .17), (x, y, .56), .012, seg=4, caps=False)
    p.box((2.8, 0, .12), (3.2, L, .14), 'kit_metal', bevel=0)
    for x in (2.8, 3.18):
        p.box((x, 0, .12), (x + .02, L, .19), 'kit_metal', bevel=0)
    for x in (2.9, 3.0, 3.1):
        p.cyl((x, 0, .16), (x, L, .16), .016, seg=4, caps=False)
    p.cyl((3.5, 0, .2), (3.5, L, .2), .02, seg=5, caps=False)                                  # sprinkler line
    p.cyl((3.5, 2, .12), (3.5, 2, .2), .025, seg=6)
    p.box((4.7, 0, .02), (5.5, L, .2), 'kit_metal', bevel=.01)
    for y in (1, 3):
        p.box((4.68, y - .03, .01), (5.52, y + .03, .21), 'kit_metal', bevel=0)
    for j in range(5):
        p.box((4.8, 1.65 + j * .14, 0), (5.4, 1.71 + j * .14, .02), 'kit_metal', bevel=0)
    p.snap.update({'top': .6})


# ---- Phase F: the Sleeping Pod room. kit_shell is the pods' own moulded plastic: it has no texture here, and the game gives it the existing Tesana pod paint.
def pod_facade(p):
    """The moulded surround of one pod hatch (David's capsule-hotel reference): a rounded-rectangle shell with an oval opening sized to sit round the pod's
    existing lit ring and glass, grab bars, vent slots and a status light. Goes flat against the pod front; nothing about the pod itself changes."""
    W, H, D, N, y0 = 2.56, 1.66, .22, 48, .02
    sg = lambda v: (v > 0) - (v < 0)

    def loop(rx, rz, e, y):
        return [(W / 2 + rx * sg(math.cos(a)) * abs(math.cos(a)) ** (2 / e), y, H / 2 + rz * sg(math.sin(a)) * abs(math.sin(a)) ** (2 / e)) for a in [2 * math.pi * k / N for k in range(N)]]
    outer_back, outer, mid, inner, lip = loop(W / 2, H / 2, 7, D), loop(W / 2, H / 2, 7, y0 + .07), loop(W / 2 - .07, H / 2 - .07, 6, y0), loop(1.09, .68, 2.4, y0), loop(1.05, .64, 2, D)
    for a, b in ((outer_back, outer), (outer, mid), (mid, inner), (inner, lip)):
        for k in range(N):
            j = (k + 1) % N
            p.quad([a[k], a[j], b[j], b[k]], 'kit_shell')
    for x in (.1, W - .1):                                                                     # grab bars
        p.cyl((x, .012, .52), (x, .012, 1.14), .012, seg=6)
        for z in (.55, 1.11):
            p.box((x - .02, .012, z - .02), (x + .02, y0 + .01, z + .02), 'kit_metal', bevel=0)
    for i in range(7):                                                                         # vent slots in the top rim
        p.box((.86 + i * .12, .012, H - .1), (.94 + i * .12, y0 + .01, H - .075), 'kit_metal', bevel=0)
    p.box((.3, .01, .045), (.62, y0 + .01, .105), 'kit_metal', bevel=0)                         # the number plate's backing
    p.box((W - .52, .008, .055), (W - .46, y0 + .005, .095), 'kit_emissive', bevel=0, region='neon_cyan')    # status lights
    p.box((W - .42, .008, .055), (W - .36, y0 + .005, .095), 'kit_emissive', bevel=0, region='neon_amber')
    p.snap.update({'mount': {}, 'opening': {'centre': [W / 2, H / 2], 'radii': [1.05, .64]}})


# ---- Phase E: the Admin & Iris shop (David's two shop reference pictures: a gear wall of hanging packs over a worktop, shelves of books and media, red and
# cyan screens, bare fluorescent tubes on a cabled ceiling). Merchandise colours come from the kit_goods sheet; packs are kit_canvas.
def shop_counter(p):
    """The shop counter, 8 m: steel body, a worn mustard top with goods laid out on it, a till with a screen (screen_0) facing the customer."""
    W, D = 8, 1.1
    p.box((0, .14, 0), (W, D, .1), 'kit_metal', bevel=0)
    p.box((0, .08, .1), (W, D, 1.0), 'kit_metal', bevel=.015)
    for k in range(8):
        p.box((k + .05, .05, .16), (k + .95, .08, .92), 'kit_metal', bevel=.01)
        p.box((k + .12, .04, .5), (k + .88, .05, .54), 'kit_metal', bevel=0)
    p.box((0, 0, 1.0), (W, D, 1.07), 'kit_goods', bevel=.012, region='goods_0')
    p.box((0, 0, .97), (W, .02, 1.0), 'kit_metal', bevel=0)
    x = .5
    for i in range(3):                                                                         # magazines and slates laid out
        _slope(p.box((x, .25, 1.07), (x + .42, .8, 1.085), 'kit_goods', bevel=0, region='goods_%d' % (4 + i * 3)), 0, 0)
        x += .55
    for i in range(7):                                                                         # a row of cased tools
        p.box((2.6 + i * .3, .3 - .01 * (i % 2), 1.07), (2.82 + i * .3, .78, 1.13), 'kit_canvas', bevel=.01)
        p.box((2.64 + i * .3, .36, 1.13), (2.78 + i * .3, .5, 1.14), 'kit_goods', bevel=0, region='goods_%d' % (i % 16))
    p.box((5.0, .3, 1.07), (5.5, .7, 1.25), 'kit_goods', bevel=.01, region='goods_11')         # a crate of small parts
    for i in range(4):
        p.box((5.04 + i * .115, .34, 1.25), (5.13 + i * .115, .66, 1.3), 'kit_goods', bevel=0, region='goods_%d' % (i * 2 + 1))
    p.box((6.2, .35, 1.07), (6.8, .8, 1.12), 'kit_metal', bevel=.01)                             # the till
    _slope(p.box((6.22, .2, 1.3), (6.78, .26, 1.7), 'kit_metal', bevel=.01), 0, 0)
    p.box((6.26, .192, 1.34), (6.74, .2, 1.66), 'kit_emissive', bevel=0, node='screen_0', region='sign_cyan')
    p.cyl((6.5, .3, 1.12), (6.5, .26, 1.4), .025, seg=5)
    p.box((7.0, .3, 1.07), (7.2, .5, 1.1), 'kit_metal', bevel=.006)                              # card reader
    p.box((7.03, .33, 1.1), (7.09, .39, 1.104), 'kit_emissive', bevel=0, region='neon_amber')
    p.snap.update({'top': 1.07})


def shop_bookshelf(p):
    """Three metres of shelving packed with books, media cases and boxes."""
    W, H, D = 3, 2.6, .5
    p.box((0, D - .03, 0), (W, D, H), 'kit_metal', bevel=0)
    for x0, x1 in ((0, .05), (1.475, 1.525), (W - .05, W)):
        p.box((x0, 0, 0), (x1, D, H), 'kit_metal', bevel=0)
    p.box((0, 0, H - .06), (W, D, H), 'kit_metal', bevel=0)
    p.box((0, .02, 0), (W, D, .08), 'kit_metal', bevel=0)
    for j in range(5):
        z = .08 + j * .5
        if j:
            p.box((0, .01, z - .03), (W, D, z), 'kit_metal', bevel=0)
        for a, b in ((.06, 1.47), (1.53, W - .06)):
            x = a
            if j == 0:                                                                         # the bottom shelf: boxes and crates
                while x < b - .3:
                    w = p.rng.uniform(.28, .45)
                    p.box((x, .06, z), (min(x + w, b), D - .06, z + p.rng.uniform(.25, .4)), 'kit_goods' if p.rng.random() < .6 else 'kit_canvas', bevel=0, region='goods_%d' % p.rng.choice((5, 7, 11, 14, 15)))
                    x += w + .03
                continue
            while x < b - .05:
                w = p.rng.uniform(.045, .12)
                if p.rng.random() < .1:                                                        # a gap, or a book lying flat
                    p.box((x, .1, z), (min(x + .26, b), D - .08, z + .06), 'kit_goods', bevel=0, region='goods_%d' % p.rng.randrange(16))
                    x += .3
                    continue
                p.box((x, .07 + p.rng.uniform(0, .05), z), (min(x + w, b), D - .05, z + p.rng.uniform(.26, .42)), 'kit_goods', bevel=0, region='goods_%d' % p.rng.randrange(16))
                x += w + .004
    p.snap.update({'mount': {}})


def _pack(p, x, z, w=.46, h=.62, vest=False):
    """A pack (or, flatter and wider, a plate vest) hanging on the board at (x, z) = its top centre."""
    y1 = .29
    d = .1 if vest else .2
    p.box((x - w / 2, y1 - d, z - h), (x + w / 2, y1, z), 'kit_canvas', bevel=.04)
    p.box((x - w * .36, y1 - d - .05, z - h * .92), (x + w * .36, y1 - d + .01, z - h * .5), 'kit_canvas', bevel=.025)     # front pocket
    if vest:
        for dx in (-.13, 0, .13):
            p.box((x + dx - .05, y1 - d - .04, z - h * .45), (x + dx + .05, y1 - d + .01, z - h * .12), 'kit_canvas', bevel=.012)
    else:
        p.box((x - w * .4, y1 - d - .02, z - h * .3), (x + w * .4, y1 - d + .01, z - h * .08), 'kit_canvas', bevel=.02)   # top flap
        for dx in (-.12, .12):
            p.box((x + dx - .02, y1 - d - .028, z - h * .5), (x + dx + .02, y1 - d - .018, z - h * .08), 'kit_metal', bevel=0)
    p.box((x - .03, y1 - .05, z), (x + .03, y1, z + .07), 'kit_metal', bevel=0)                   # the hook it hangs from


def shop_gearwall(p):
    """A gear wall, 3 m: packs and vests hanging on a board, a shelf of tins and cases over cupboards, a lit sign (sign_0) and cable runs."""
    W, H, D = 3, 2.6, .35
    p.box((0, D - .05, 0), (W, D, H), 'kit_concrete', bevel=0)
    for x0, x1 in ((0, .05), (W - .05, W)):
        p.box((x0, D - .1, 0), (x1, D, H), 'kit_metal', bevel=0)
    p.box((0, D - .1, H - .05), (W, D, H), 'kit_metal', bevel=0)
    p.box((0, .02, 0), (W, D, .72), 'kit_metal', bevel=.012)                                    # cupboards
    for k in range(3):
        p.box((k + .05, .0, .08), (k + .95, .03, .66), 'kit_metal', bevel=.01)
        p.box((k + .82, 0, .34), (k + .86, .012, .44), 'kit_metal', bevel=0)
    p.box((0, 0, .72), (W, D, .77), 'kit_goods', bevel=.008, region='goods_0')                   # worktop
    x = .15
    while x < W - .3:                                                                          # tins, cases and a stack of slates on it
        w = p.rng.uniform(.16, .34)
        p.box((x, .06, .77), (x + w, .3, .77 + p.rng.uniform(.08, .26)), 'kit_goods' if p.rng.random() < .7 else 'kit_canvas', bevel=.008, region='goods_%d' % p.rng.randrange(16))
        x += w + p.rng.uniform(.04, .16)
    p.box((.12, D - .12, 1.98), (1.08, D - .05, 2.5), 'kit_metal', bevel=.012)                    # the lit sign
    p.box((.17, D - .126, 2.03), (1.03, D - .12, 2.45), 'kit_emissive', bevel=0, node='sign_0', region='sign_magenta')
    p.box((.2, D - .1, 1.8), (1.0, D - .05, 1.92), 'kit_metal', bevel=.008)
    p.box((.24, D - .106, 1.83), (.96, D - .1, 1.89), 'kit_emissive', bevel=0, node='sign_0', region='neon_amber')
    _pack(p, .42, 1.72)
    _pack(p, .95, 1.72, vest=True, w=.5, h=.6)
    _pack(p, 1.55, 2.42)
    _pack(p, 2.1, 2.42, w=.5, h=.66)
    _pack(p, 2.62, 2.42, vest=True, w=.5, h=.58)
    _pack(p, 1.6, 1.62, vest=True, w=.52, h=.6)
    _pack(p, 2.25, 1.68, w=.48, h=.66)
    for z, sag in ((2.55, .06), (2.5, .1)):                                                    # cables looping along the top
        pts = [(W * t / 8, D - .07, z - sag * 4 * (t / 8) * (1 - t / 8)) for t in range(9)]
        for q0, q1 in zip(pts, pts[1:]):
            p.cyl(q0, q1, .012, seg=4, caps=False)
    p.snap.update({'mount': {}})


def tube_light(p):
    """A bare twin-tube ceiling light on drop rods, 2 m (node light_0)."""
    p.box((0, .05, .06), (2, .25, .12), 'kit_metal', bevel=.01)
    for y in (.1, .2):
        _neon(p, (.04, y, .04), (1.96, y, .04), 'white', 'light_0')
    for x in (0, 1.97):
        p.box((x, .04, .0), (x + .03, .26, .08), 'kit_metal', bevel=0)
    for x in (.25, 1.75):
        p.cyl((x, .15, .12), (x, .15, .5), .012, seg=4, caps=False)
    pts = [(.25 + 1.5 * t / 6, .15, .5 - .12 * 4 * (t / 6) * (1 - t / 6)) for t in range(7)]
    for q0, q1 in zip(pts, pts[1:]):
        p.cyl(q0, q1, .01, seg=4, caps=False)
    p.snap.update({'top': .5})


# ---- Phase D: the arcade. kit_cab is the cabinets' own black laminate (no texture here; the game gives it the existing cabinet material).
def arcade_cabinet(p):
    """The body of an upright arcade cabinet: two side panels cut to the classic profile, back, roof, speaker grille, kick plate and coin door. It goes
    round the game's own cabinet (which keeps its live screen, marquee, control panel and lights): depth 0 here is the front edge of the control deck."""
    prof = [(1.05, 0), (1.05, 2.06), (.4, 2.06), (.38, 1.8), (.52, 1.72), (.5, 1.12), (0, 1.02), (.02, .93), (.25, .84), (.25, 0)]     # (depth, height), clockwise from the back foot
    for x0, x1 in ((0, .03), (.77, .8)):
        for x in (x0, x1):
            p.quad([(x, y, z) for y, z in prof], 'kit_cab')
        for (ya, za), (yb, zb) in zip(prof, prof[1:] + prof[:1]):
            p.quad([(x0, ya, za), (x1, ya, za), (x1, yb, zb), (x0, yb, zb)], 'kit_cab')
    p.box((.03, 1.02, 0), (.77, 1.05, 2.06), 'kit_cab', bevel=0)                                # back
    p.box((.03, .4, 2.03), (.77, 1.05, 2.06), 'kit_cab', bevel=0)                               # roof
    p.box((.03, .25, 0), (.77, .28, .84), 'kit_cab', bevel=0)                                   # front below the deck
    p.box((.03, .25, 0), (.77, .3, .12), 'kit_metal', bevel=0)                                  # kick plate
    p.box((.2, .235, .3), (.6, .25, .7), 'kit_metal', bevel=.008)                               # coin door
    for x in (.3, .44):
        p.box((x, .228, .5), (x + .06, .235, .6), 'kit_metal', bevel=0)
    for j in range(4):                                                                         # speaker grille under the marquee
        p.box((.12, .4, 1.73 + j * .018), (.68, .46, 1.74 + j * .018), 'kit_metal', bevel=0)
    for x in (.05, .7):                                                                        # levelling feet
        p.box((x, .32, 0), (x + .05, .98, .02), 'kit_metal', bevel=0)
    p.snap.update({'mount': {}, 'deck_front': 0})


def arcade_stool(p):
    """A bolted-down arcade stool with a padded seat."""
    p.cyl((.2, .2, 0), (.2, .2, .03), .2, seg=12)
    p.cyl((.2, .2, .03), (.2, .2, .62), .03, seg=8)
    p.cyl((.2, .2, .2), (.2, .2, .22), .15, seg=12, caps=False)
    p.cyl((.2, .2, .62), (.2, .2, .66), .17, seg=12)
    b = p.bm()
    made = bmesh.ops.create_cone(b, cap_ends=True, cap_tris=False, segments=12, radius1=.185, radius2=.16, depth=.07)
    for v in made['verts']:
        v.co += Vector((.2, .2, .695))
    p._tag(b, list({f for v in made['verts'] for f in v.link_faces}), 'kit_canvas')
    p.snap.update({'base': [0, 0, 0], 'seat': .73})


def arcade_change_machine(p):
    """A token and change machine: steel cabinet, a lit instruction panel (sign_0), coin slot, note slot and a payout tray."""
    W, H, D = .7, 1.75, .45
    p.box((0, .03, 0), (W, D, H), 'kit_metal', bevel=.02)
    p.box((.06, .0, 1.1), (W - .06, .035, 1.62), 'kit_metal', bevel=.01)
    p.box((.1, 0, 1.15), (W - .1, .006, 1.57), 'kit_emissive', bevel=0, node='sign_0', region='sign_amber')
    p.box((.12, .01, .78), (.34, .035, .98), 'kit_metal', bevel=.008)                            # note slot
    p.box((.15, .004, .86), (.31, .012, .88), 'kit_emissive', bevel=0, region='neon_cyan')
    p.box((.42, .01, .78), (.58, .035, .98), 'kit_metal', bevel=.008)                            # coin slot
    p.box((.49, .004, .82), (.51, .012, .94), 'kit_emissive', bevel=0, region='neon_amber')
    p.box((.15, .0, .42), (.55, .08, .56), 'kit_metal', bevel=.012)                              # payout tray
    p.box((.2, .012, .14), (.5, .035, .3), 'kit_metal', bevel=.008)                              # service lock plate
    p.cyl((.35, .012, .22), (.35, .03, .22), .025, seg=8)
    p.snap.update({'mount': {}})


INTERIOR = {
    'district_arcade_cabinet_1m': ('D', 'arcade', arcade_cabinet), 'district_arcade_stool_1m': ('D', 'arcade', arcade_stool), 'district_arcade_change_1m': ('D', 'arcade', arcade_change_machine),
    'district_shop_counter_8m': ('E', 'shop', shop_counter), 'district_shop_bookshelf_3m': ('E', 'shop', shop_bookshelf), 'district_shop_gearwall_3m': ('E', 'shop', shop_gearwall),
    'district_tube_light_2m': ('E', 'shop', tube_light),
    'district_pod_facade_3m': ('F', 'pods', pod_facade),
    'district_hall_wall_2m_a': ('B', 'hallway', hall_wall_a), 'district_hall_wall_2m_b': ('B', 'hallway', hall_wall_b), 'district_hall_wall_2m_c': ('B', 'hallway', hall_wall_c),
    'district_hall_wall_2m_d': ('B', 'hallway', hall_wall_d), 'district_hall_wall_1m': ('B', 'hallway', hall_wall_1m), 'district_hall_pilaster_05m': ('B', 'hallway', hall_pilaster),
    'district_hall_ceiling_4m': ('B', 'hallway', hall_ceiling),
    'district_vestibule_wall_6m': ('A', 'vestibule', int_wall_lining), 'district_vestibule_ceiling_6m': ('A', 'vestibule', int_ceiling),
    'district_vestibule_floor_6m': ('A', 'vestibule', int_floor), 'district_door_portal_6m': ('A', 'vestibule', int_door_portal),
    'district_scanner_arch_5m': ('A', 'vestibule', int_scanner_arch), 'district_scanner_kiosk_1m': ('A', 'vestibule', int_scanner_kiosk),
}
INTERIOR_OUT = os.path.join(REPO, 'void-runner', 'assets', 'models', 'district-interior')
INTERIOR_TEX = os.path.join(REPO, 'void-runner', 'assets', 'textures', 'district-interior')
BARE = False


def interior_textures():
    """The interior's textures as small JPEGs (the scene waits for its textures, so they must be light): 1K, from the same generated sets as the kit."""
    from PIL import Image
    os.makedirs(INTERIOR_TEX, exist_ok=True)
    for name in ('kit_metal', 'kit_concrete', 'kit_tile', 'kit_emissive', 'kit_glass', 'kit_goods', 'kit_canvas'):
        for kind in ('color', 'normal', 'orm'):
            src = os.path.join(TEX, '%s_%s.png' % (name, kind))
            if os.path.exists(src):
                im = Image.open(src).convert('RGB')
                if name == 'kit_metal' and kind == 'color':          # indoors the steel is kept, not weathered: most of the rust colour is taken out
                    im = Image.blend(im, im.convert('L').convert('RGB'), .88)
                if im.width > 1024:
                    im = im.resize((1024, 1024), Image.LANCZOS)
                im.save(os.path.join(INTERIOR_TEX, '%s_%s.jpg' % (name, kind)), quality=90 if kind == 'normal' else 84)


def assemble_interior(mats, path):
    """The vestibule put together as the game does it, seen from just inside the outer door."""
    built = []

    def put(name, pos, turn=0.0, hide=()):
        piece = Piece(name)
        INTERIOR[name][2](piece)
        obj, _, size, _ = realise(piece, mats)
        obj.location, obj.rotation_euler = pos, (0, 0, turn)
        for c in list(obj.children):
            if any(h in c.name for h in hide):
                bpy.data.objects.remove(c)
        built.append((obj, size))
    put('district_vestibule_floor_6m', (-3, 0, 0))
    put('district_vestibule_ceiling_6m', (-3, 0, 2.9))
    put('district_vestibule_wall_6m', (-2.95 + .22, 0, 0), math.pi / 2, hide=('neon_1',))
    put('district_vestibule_wall_6m', (2.95 - .22, 6, 0), -math.pi / 2, hide=('neon_0',))
    put('district_door_portal_6m', (3.1, 5.87, 0), math.pi)
    put('district_scanner_arch_5m', (-2.6, 2.8, 0))
    put('district_scanner_kiosk_1m', (2.0, 4.7, 0), -math.pi / 2)
    s = bpy.context.scene
    for name, a, b in (('door', (-2.82, 5.95, 0), (2.82, 6.0, 3.2)), ('back', (-3.2, -1.0, 0), (3.2, -.95, 3.6))):       # the door leaves, as dark slabs
        m = bpy.data.meshes.new(name)
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1)
        for v in bm.verts:
            v.co = Vector((a[0] + (v.co.x + .5) * (b[0] - a[0]), a[1] + (v.co.y + .5) * (b[1] - a[1]), a[2] + (v.co.z + .5) * (b[2] - a[2])))
        bm.to_mesh(m)
        bm.free()
        m.materials.append(mats['kit_metal'])
        s.collection.objects.link(bpy.data.objects.new(name, m))
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.lens = 17
    cam.location = (.25, -.6, 1.65)
    cam.rotation_euler = (Vector((0, 6, 1.5)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    s.collection.objects.link(cam)
    s.camera = cam
    fill = bpy.data.lights.new('fill', 'POINT')
    fill.energy, fill.color = 18, (.6, .7, 1)
    fo = bpy.data.objects.new('fill', fill)
    fo.location = (0, 1.5, 2.2)
    s.collection.objects.link(fo)
    world = bpy.data.worlds.new('dark')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0, 0, 0, 1)
    s.world = world
    s.render.engine, s.cycles.device, s.cycles.samples, s.cycles.use_denoising = 'CYCLES', 'CPU', 96, True
    s.render.resolution_x, s.render.resolution_y = 1600, 900
    s.render.filepath = path
    bpy.ops.render.render(write_still=True)


def realise(piece, mats):
    """Turn a Piece into Blender objects (main + children), origin at the bottom-left-front corner. Returns (object, triangles, size, child names)."""
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for b in piece.nodes.values():
        for v in b.verts:
            for i in range(3):
                lo[i], hi[i] = min(lo[i], v.co[i]), max(hi[i], v.co[i])
    objs, tris = {}, 0
    for node, b in piece.nodes.items():
        bmesh.ops.translate(b, verts=b.verts, vec=-lo)
        bmesh.ops.remove_doubles(b, verts=b.verts, dist=1e-5)
        bmesh.ops.recalc_face_normals(b, faces=b.faces)
        unwrap(b)
        tris += sum(len(f.verts) - 2 for f in b.faces)
        for f in b.faces:                                   # moulded plastic is smooth-shaded; everything else keeps its hard edges
            if MATERIALS[f.material_index] == 'kit_shell':
                f.smooth = True
        mesh = bpy.data.meshes.new(piece.name + ('__' + node if node else ''))
        used = sorted({f.material_index for f in b.faces})
        for f in b.faces:
            f.material_index = used.index(f.material_index)
        b.to_mesh(mesh)
        b.free()
        for i in used:
            mesh.materials.append(mats[MATERIALS[i]])
        obj = bpy.data.objects.new(mesh.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        objs[node] = obj
    main = objs['']
    for node, obj in objs.items():
        if node:
            obj.parent = main
    size = hi - lo
    return main, tris, size, sorted(n for n in objs if n)


def patch_glb(path):
    """The exporter writes materials without pictures; point each at the ONE shared texture set in kit/textures/ (relative to the .glb)."""
    data = open(path, 'rb').read()
    length = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20 + length])
    rest = data[20 + length:]
    doc['samplers'] = [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}]
    doc['images'], doc['textures'] = [], []

    def tex(name, kind):
        uri = 'textures/%s_%s.png' % (name, kind)
        if not os.path.exists(os.path.join(TEX, name + '_' + kind + '.png')):
            return None
        if uri not in [i['uri'] for i in doc['images']]:
            doc['images'].append({'uri': uri})
            doc['textures'].append({'sampler': 0, 'source': len(doc['images']) - 1})
        return {'index': [i['uri'] for i in doc['images']].index(uri)}
    for m in doc.get('materials', []):
        name = m['name']
        pbr = m.setdefault('pbrMetallicRoughness', {})
        if name in GLOWING:
            pbr.update({'baseColorFactor': [0, 0, 0, 1], 'metallicFactor': 0, 'roughnessFactor': .5})
            m['emissiveFactor'] = [1, 1, 1]
            m['emissiveTexture'] = tex(name, 'color')
            continue
        m.pop('emissiveFactor', None)
        pbr.pop('baseColorFactor', None)
        pbr['baseColorTexture'] = tex(name, 'color')
        orm = tex(name, 'orm')
        if orm:
            pbr.update({'metallicRoughnessTexture': orm, 'metallicFactor': 1, 'roughnessFactor': 1})
            m['occlusionTexture'] = dict(orm)
        nrm = tex(name, 'normal')
        if nrm:
            m['normalTexture'] = nrm
    if not doc['images']:
        for k in ('images', 'textures', 'samplers'):
            doc.pop(k)
    body = json.dumps(doc, separators=(',', ':')).encode()
    body += b' ' * ((4 - len(body) % 4) % 4)
    out = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(body) + len(rest)) + struct.pack('<I4s', len(body), b'JSON') + body + rest
    open(path, 'wb').write(out)


def export(main, path):
    bpy.ops.object.select_all(action='DESELECT')
    main.select_set(True)
    for c in main.children:
        c.select_set(True)
    bpy.context.view_layer.objects.active = main
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_draco_mesh_compression_enable=False,
                              export_image_format='NONE', export_materials='EXPORT', export_normals=True, export_texcoords=True, export_cameras=False, export_lights=False,
                              export_animations=False, export_extras=False)
    if not BARE:
        patch_glb(path)


def preview(built, path, batch, layout=True):
    """The batch side by side on wet ground under a dim blue and magenta night light; the kit's own emissive parts glow. For looking at, not for the game."""
    s = bpy.context.scene
    x = 0
    for main, size in built:
        if layout:
            main.location = (x, 0, 0)
        x += size.x + 1.0
    total = x - 1.0
    ground = bpy.data.objects.new('ground', bpy.data.meshes.new('ground'))
    b = bmesh.new()
    bmesh.ops.create_grid(b, x_segments=1, y_segments=1, size=60)
    b.to_mesh(ground.data)
    b.free()
    gm = bpy.data.materials.new('preview_ground')
    gm.use_nodes = True
    bs = gm.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (.012, .014, .02, 1)
    bs.inputs['Roughness'].default_value = .12
    ground.data.materials.append(gm)
    s.collection.objects.link(ground)
    if not layout:
        ground.location.z = -.15          # the road, a kerb's height below the pavement
    tall = max(size.z for _, size in built)
    # show what a lit window looks like: every second pane gets a look from the emissive atlas (in the game this is a material swap on the pane node)
    panes = [c for main, _ in built for c in main.children if '__glass_' in c.name]
    for i, pane in enumerate(panes):
        if i % 2 == 0:
            continue
        r0, s0, r1, s1 = kit_textures.EMISSIVE_REGIONS[['window_magenta', 'window_cyan', 'window_violet', 'window_green'][(i // 2) % 4]]
        lm = bpy.data.materials.new('preview_lit_%d' % i)
        lm.use_nodes = True
        nt = lm.node_tree
        bs = nt.nodes['Principled BSDF']
        bs.inputs['Base Color'].default_value = (0, 0, 0, 1)
        img = nt.nodes.new('ShaderNodeTexImage')
        img.image = bpy.data.images.load(os.path.join(TEX, 'kit_emissive_color.png'), check_existing=True)
        mp, tc = nt.nodes.new('ShaderNodeMapping'), nt.nodes.new('ShaderNodeTexCoord')
        mp.inputs['Location'].default_value = (r0, s0, 0)
        mp.inputs['Scale'].default_value = (r1 - r0, s1 - s0, 1)
        nt.links.new(tc.outputs['UV'], mp.inputs['Vector'])
        nt.links.new(mp.outputs['Vector'], img.inputs['Vector'])
        nt.links.new(img.outputs['Color'], bs.inputs['Emission Color'])
        bs.inputs['Emission Strength'].default_value = 5
        pane.data.materials.clear()
        pane.data.materials.append(lm)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.lens = 32
    dist = max(total * .8, tall * 1.6) + 5
    cam.location = (total / 2 - total * .06, -dist, tall * .62)
    target = Vector((total / 2, 0, tall * .42))
    if not layout:                           # the assembled view: a three-quarter look at the corner
        total, tall = 8.0, 9.0
        cam.location, target = Vector((15, -19, 5.0)), Vector((0, 0, 4.4))
        cam.data.lens = 30
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    s.collection.objects.link(cam)
    s.camera = cam

    def lamp(name, kind, loc, colour, energy, size=6):
        d = bpy.data.lights.new(name, kind)
        d.color, d.energy = colour, energy
        if kind == 'AREA':
            d.size = size
        o = bpy.data.objects.new(name, d)
        o.location = loc
        o.rotation_euler = (Vector((total / 2, .5, tall * .4)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        s.collection.objects.link(o)
    lamp('moon', 'AREA', (total * .1, -9, tall + 7), (.35, .5, 1), 5200, 9)
    lamp('magenta', 'AREA', (total + 3, -7, tall * 1.2), (1, .2, .7), 1800, 5)
    lamp('fill', 'AREA', (total / 2, -12, 1.5), (.3, .4, .9), 500, 10)
    world = bpy.data.worlds.new('night')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (.004, .006, .014, 1)
    s.world = world
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = 72
    s.cycles.use_denoising = True
    s.render.resolution_x, s.render.resolution_y = 1600, 800
    s.view_settings.view_transform = 'Filmic' if 'Filmic' in [v.name for v in s.view_settings.bl_rna.properties['view_transform'].enum_items] else s.view_settings.view_transform
    s.render.filepath = path
    bpy.ops.render.render(write_still=True)


def assemble(mats, path, gif=None):
    """A two-storey corner built from the pieces made so far, to show how they join. Each entry: piece, position (x, y, z), quarter turns about the vertical."""
    z1, top = SHOP, SHOP + FLOOR
    plan = [('kit_shopfront_service_2m', (-8, 0, 0), 0), ('kit_shopfront_door_2m', (-6, 0, 0), 0), ('kit_shopfront_shutter_4m', (-4, 0, 0), 0), ('kit_shopfront_window_6m', (0, 0, 0), 0),
            ('kit_corner_outer_tall_1m', (6, 0, 0), 0), ('kit_shopfront_window_4m', (7, 1, 0), 1),
            ('kit_wall_plain_2m', (-8, 0, z1), 0), ('kit_wall_windows_6m', (-6, 0, z1), 0), ('kit_wall_windows_6m', (0, 0, z1), 0), ('kit_corner_outer_1m', (6, 0, z1), 0), ('kit_wall_windows_4m', (7, 1, z1), 1),
            ('kit_cornice_2m', (-8, -.2, top), 0), ('kit_cornice_6m', (-6, -.2, top), 0), ('kit_cornice_6m', (0, -.2, top), 0), ('kit_cornice_corner_1m', (6, -.2, top), 0), ('kit_cornice_4m', (7.2, 1, top), 1),
            ('kit_awning_fabric_6m', (0, .13 - 1.5, 2.35), 0), ('kit_awning_canopy_4m', (-4, .13 - 1.5, 2.58), 0), ('kit_balcony_4m', (-5, .13 - 1.0, z1 + .1), 0),
            ('kit_clutter_ac_bracket_1m', (2.5, .13 - .5, z1 + .3), 0), ('kit_clutter_ac_unit_1m', (2.5, .13 - .42, z1 + .64), 0), ('kit_sign_vertical_1m', (6.35, .13 - 1.0, z1 + .2), 0),
            ('kit_cable_bundle_4m', (-8, .13 - .13, z1 - 1.0), 0), ('kit_pipe_vertical_1m', (-7.5, .13 - .25, z1), 0),
            ('kit_fireescape_landing_3m', (6.87 + 1.2, 1.5, z1 + .2), 1), ('kit_fireescape_ladder_1m', (6.87 + .3, 3.7, z1 - 3.3), 1),
            ('kit_roof_hut_3m', (-6, 1.5, top + .5), 0), ('kit_roof_watertank_2m', (1, 1.5, top + .5), 0), ('kit_roof_antenna_1m', (4.6, 1.6, top + .5), 0), ('kit_roof_vent_1m', (-1.5, 1.5, top + .5), 0),
            ('kit_sidewalk_slab_4m', (-8, -3, -.15), 0), ('kit_sidewalk_slab_4m', (-4, -3, -.15), 0), ('kit_sidewalk_slab_4m', (0, -3, -.15), 0), ('kit_sidewalk_slab_4m', (4, -3, -.15), 0),
            ('kit_kerb_straight_4m', (-8, -3.6, -.15), 0), ('kit_kerb_straight_4m', (-4, -3.6, -.15), 0), ('kit_kerb_straight_4m', (0, -3.6, -.15), 0), ('kit_kerb_straight_4m', (4, -3.6, -.15), 0),
            ('kit_roof_parapet_2m', (-8, 0, top + .5), 0), ('kit_roof_parapet_corner_1m', (6, 0, top + .5), 0), ('kit_roof_parapet_4m', (-6, 0, top + .5), 0), ('kit_roof_parapet_4m', (-2, 0, top + .5), 0), ('kit_roof_parapet_4m', (2, 0, top + .5), 0), ('kit_roof_parapet_4m', (7, 1, top + .5), 1)]
    built = []
    for name, pos, turns in plan:
        if name not in PIECES:
            continue
        piece = Piece(name)
        PIECES[name][2](piece)
        obj, _, size, _ = realise(piece, mats)
        obj.location, obj.rotation_euler = pos, (0, 0, turns * math.pi / 2)
        built.append((obj, size))
    preview(built, path, None, layout=False)
    if gif:                                   # a short loop of the sign text sliding, small and quick to render
        from PIL import Image
        s = bpy.context.scene
        s.render.resolution_x, s.render.resolution_y, s.cycles.samples = 800, 400, 20
        frames = []
        for f in range(14):
            mats['kit_ticker'].node_tree.nodes['scroll'].inputs['Location'].default_value[0] = f * .009
            s.render.filepath = gif + '.%02d.png' % f
            bpy.ops.render.render(write_still=True)
            frames.append(Image.open(s.render.filepath).convert('P', palette=Image.ADAPTIVE))
            os.remove(s.render.filepath)
        frames[0].save(gif, save_all=True, append_images=frames[1:], duration=110, loop=0)


def main():
    args = sys.argv[1:]
    batches = [int(args[i + 1]) if args[i + 1].isdigit() else args[i + 1] for i, a in enumerate(args) if a == '--batch']
    shot = next((args[i + 1] for i, a in enumerate(args) if a == '--preview'), None)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    interior = '--interior' in args
    if interior:                      # the District interior set: its own folder and manifest, bare files, phases instead of batch numbers
        global OUT, PIECES, BARE
        OUT, PIECES, BARE = INTERIOR_OUT, INTERIOR, True
        batches = [args[i + 1] for i, a in enumerate(args) if a == '--batch'] or sorted({v[0] for v in INTERIOR.values()})
    os.makedirs(OUT, exist_ok=True)
    if '--textures' in args or not os.path.exists(os.path.join(TEX, 'kit_concrete_color.png')):
        kit_textures.build_all(TEX)
    mats = materials()
    manifest_path = os.path.join(OUT, 'interior-manifest.json' if interior else 'kit-manifest.json')
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    manifest.update({'kit': 'NeoChinatown building kit', 'units': 'metres', 'up': '+Y', 'front': '+Z', 'origin': 'bottom-left-front corner of the bounding box',
                     'module': 1, 'floorHeight': FLOOR, 'shopfrontHeight': SHOP, 'facadeDepth': DEPTH, 'wallPlaneBehindFront': FACE,
                     'materials': {n: {k: 'textures/%s_%s.png' % (n, k) for k in (['color'] if n in GLOWING else ['color', 'normal', 'orm'])} for n in MATERIALS},
                     'ticker': {'material': 'kit_ticker', 'metresPerRepeat': kit_textures.TICKER_METRES, 'scroll': 'slide the texture along U (about 0.02 to 0.04 per second)'},
                     'emissiveRegions': {k: list(v) for k, v in kit_textures.EMISSIVE_REGIONS.items()}})
    pieces = manifest.setdefault('pieces', {})
    built = []
    for name, (batch, category, make) in PIECES.items():
        if batch not in batches:
            continue
        piece = Piece(name)
        make(piece)
        main_obj, tris, size, children = realise(piece, mats)
        assert tris <= 3000, '%s has %d triangles' % (name, tris)
        export(main_obj, os.path.join(OUT, name + '.glb'))
        pieces[name] = {'file': name + '.glb', 'batch': batch, 'category': category, 'size': {'w': round(size.x, 3), 'h': round(size.z, 3), 'd': round(size.y, 3)},
                        'triangles': tris, 'bytes': os.path.getsize(os.path.join(OUT, name + '.glb')), 'nodes': [name + '__' + c for c in children],
                        'snap': piece.snap}
        if 'mount' in piece.snap:          # hanging pieces: the back of the bounding box goes on the wall plane
            piece.snap['mount'] = {'position': [0, 0, -round(size.y, 3)], 'note': 'put the back on the wall plane'}
        built.append((main_obj, size))
        print('KIT', name, 'batch', batch, 'tris', tris, 'size', [round(v, 2) for v in (size.x, size.z, size.y)])
    manifest['pieces'] = dict(sorted(pieces.items(), key=lambda kv: (kv[1]['batch'], kv[0])))
    json.dump(manifest, open(manifest_path, 'w'), indent=1)
    if interior:
        interior_textures()
        shot = next((args[i + 1] for i, a in enumerate(args) if a == '--assemble'), None)
        if shot:
            for o in list(bpy.data.objects):
                bpy.data.objects.remove(o)
            assemble_interior(mats, shot)
        return
    demo = next((args[i + 1] for i, a in enumerate(args) if a == '--assemble'), None)
    if demo:
        for o in list(bpy.data.objects):
            bpy.data.objects.remove(o)
        assemble(mats, demo, next((args[i + 1] for i, a in enumerate(args) if a == '--scroll'), None))
        return
    if shot and built:
        preview(built, shot, batches)
        print('KIT preview', shot)


if __name__ == '__main__':
    main()
