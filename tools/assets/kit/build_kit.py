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
TILE = {'kit_concrete': 4.0, 'kit_metal': 2.0, 'kit_asphalt': 3.0}       # metres one repeat of the texture covers
MATERIALS = ['kit_concrete', 'kit_metal', 'kit_glass', 'kit_emissive', 'kit_asphalt']
REGIONS = list(kit_textures.EMISSIVE_REGIONS)


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
            f[layer] = 0 if region is None else 1 + REGIONS.index(region) if region in REGIONS else 100   # 100: whole 0..1 square
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
            r0, s0, r1, s1 = (0, 0, 1, 1) if mode == 100 else kit_textures.EMISSIVE_REGIONS[REGIONS[mode - 1]]
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
        if name == 'kit_emissive':
            bsdf.inputs['Base Color'].default_value = (0, 0, 0, 1)
            bsdf.inputs['Roughness'].default_value = .5
            bsdf.inputs['Emission Strength'].default_value = 6
            if col:
                nt.links.new(col.outputs['Color'], bsdf.inputs['Emission Color'])
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
        p.box((x0, FACE, .45), (x1, plane + .01, H - .3), bevel=.012)
    p.box((0, 0, 0), (W, plane + .01, .45), bevel=.02)                       # plinth, the frontmost part of the piece
    p.box((0, .04, H - .3), (W, plane + .01, H), bevel=.02)                 # floor band
    p.box((0, .02, H - .34), (W, plane + .01, H - .3), 'kit_metal', bevel=0)  # a drip flashing under it
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
        for dx in (-.3, .3):
            for z in (1.16, 1.94):
                p.box((x + dx - .02, plane - .035, z - .02), (x + dx + .02, plane - .02, z + .02), 'kit_metal', bevel=0)


def wall_plain(W):
    def make(p):
        _wall_shell(p, W)
        kinds = ['vent', 'conduit', 'plate', 'conduit']
        for k in range(int(W / 2)):
            _wall_detail(p, k * 2 + 1 + p.rng.uniform(-.25, .25), kinds[(k + int(W)) % len(kinds)])
        # a casting joint across each bay, as a shallow groove strip
        p.box((0, FACE + .022, 1.74), (W, FACE + .031, 1.77), 'kit_metal', bevel=0)
    return make


def wall_windows(W):
    def make(p):
        wins = [(k * 2 + .4, k * 2 + 1.6, 1.0, 2.6) for k in range(int(W / 2))]
        _wall_shell(p, W, openings=wins)
        plane = FACE + .03
        for i, (x0, x1, z0, z1) in enumerate(wins):
            p.box((x0 - .1, .02, z0 - .07), (x1 + .1, plane + .05, z0), bevel=.015)                      # sill
            p.box((x0 - .06, .06, z1), (x1 + .06, plane + .02, z1 + .1), bevel=.015)                     # lintel
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


PIECES = {
    # name: (batch, category, builder)
    'kit_wall_plain_2m': (1, 'wall', wall_plain(2)), 'kit_wall_plain_4m': (1, 'wall', wall_plain(4)), 'kit_wall_plain_6m': (1, 'wall', wall_plain(6)),
    'kit_wall_windows_4m': (1, 'wall', wall_windows(4)), 'kit_wall_windows_6m': (1, 'wall', wall_windows(6)),
}


# ---------------------------------------------------------------- build, export, manifest ----------------------------------------------------------------
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
        if name == 'kit_emissive':
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
    patch_glb(path)


def preview(built, path, batch):
    """The batch side by side on wet ground under a dim blue and magenta night light; the kit's own emissive parts glow. For looking at, not for the game."""
    s = bpy.context.scene
    x = 0
    for main, size in built:
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
    tall = max(size.z for _, size in built)
    # show what a lit window looks like: every second pane gets a look from the emissive atlas (in the game this is a material swap on the pane node)
    panes = [c for main, _ in built for c in main.children if '__glass_' in c.name]
    for i, pane in enumerate(panes):
        if i % 2 == 0:
            continue
        r0, s0, r1, s1 = kit_textures.EMISSIVE_REGIONS[['window_warm', 'window_blinds', 'window_cool', 'window_dim'][(i // 2) % 4]]
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
    cam.location = (total / 2 - total * .12, -dist, tall * .62)
    target = Vector((total / 2, 0, tall * .42))
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


def main():
    args = sys.argv[1:]
    batches = [int(args[i + 1]) for i, a in enumerate(args) if a == '--batch']
    shot = next((args[i + 1] for i, a in enumerate(args) if a == '--preview'), None)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    os.makedirs(OUT, exist_ok=True)
    if '--textures' in args or not os.path.exists(os.path.join(TEX, 'kit_concrete_color.png')):
        kit_textures.build_all(TEX)
    mats = materials()
    manifest_path = os.path.join(OUT, 'kit-manifest.json')
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    manifest.update({'kit': 'NeoChinatown building kit', 'units': 'metres', 'up': '+Y', 'front': '+Z', 'origin': 'bottom-left-front corner of the bounding box',
                     'module': 1, 'floorHeight': FLOOR, 'shopfrontHeight': SHOP, 'facadeDepth': DEPTH, 'wallPlaneBehindFront': FACE,
                     'materials': {n: {k: 'textures/%s_%s.png' % (n, k) for k in (['color'] if n == 'kit_emissive' else ['color', 'normal', 'orm'])} for n in MATERIALS},
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
        built.append((main_obj, size))
        print('KIT', name, 'batch', batch, 'tris', tris, 'size', [round(v, 2) for v in (size.x, size.z, size.y)])
    manifest['pieces'] = dict(sorted(pieces.items(), key=lambda kv: (kv[1]['batch'], kv[0])))
    json.dump(manifest, open(manifest_path, 'w'), indent=1)
    if shot and built:
        preview(built, shot, batches)
        print('KIT preview', shot)


if __name__ == '__main__':
    main()
