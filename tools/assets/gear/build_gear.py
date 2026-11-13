"""Cyberpunk gear for the player characters (docs/development/CHARACTER_GEAR.md): a visor, a collar, shoulder plates and a lit chest line (deliberately minimal), built by code with Blender's
`bpy` (the same way as tools/assets/kit/). LOCAL WORK FOR DAVID'S REVIEW: nothing here is loaded by the game yet.

    python tools/assets/gear/build_gear.py [--preview out.png] [--on male|female] [--only name,name]

How a part is made and meant to be used
  - One small .glb per part and per body (`_m` male, `_f` female: the two bodies are different sizes, so each is fitted to its own measurements, not scaled).
  - Every part is SKINNED, with all its vertices weighted 100% to ONE joint of the character's own 52-joint skeleton, and exported with that skeleton (this is how the
    existing hairstyle parts work). In the game the part is given the character's skeleton, so it follows every animation with no extra clips and no per-frame code.
    The part is authored in the character FILE's own bind-pose space and units (the game scales the whole character node to standard height, which scales the gear
    with it). Y up on export, the character faces +Z, +X is the character's left, like the character files. The manifest says which joint each part is weighted to.
  - Two materials only, named so the game can find them: `gear_shell` (dark gunmetal, PBR) and `gear_glow` (the lit details; emissive only, never a real lamp).
    The game can tint `gear_glow` with the player's accent colour. No textures at all, so the files are tiny and need no loading of images.
  - Each part is under 300 triangles."""
import bpy, bmesh, json, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(REPO, 'void-runner', 'assets', 'models', 'gear')

# Measured from the shipped character files (district-smuggler = the male body, district-resident = the female body), in each file's own units.
# Joint positions are the rest-pose world positions of the bones the gear hangs from; the head numbers are relative to the Head joint.
BODIES = {
    'male': {'file': 'district-smuggler', 'suffix': 'm',
             'joints': {'Head': (0.001, 1.670, 0.032), 'Neck': (-0.002, 1.630, 0.012), 'Spine2': (-0.002, 1.404, 0.012), 'LeftArm': (0.213, 1.595, 0.024), 'RightArm': (-0.211, 1.585, 0.029)},
             'head': {'hw': .090, 'front': .137, 'back': .074, 'eye': .109, 'top': .215},
             'neck': {'rx': .056, 'rz': .054, 'cy': -.040, 'collar_y': .016},
             'chest': {'front': .176, 'y': .085, 'half': .105},
             'shoulder': {'r': .066, 'rise': .051}},
    'female': {'file': 'district-resident', 'suffix': 'f',
               'joints': {'Head': (0.004, 1.155, 0.036), 'Neck': (0.004, 1.108, 0.021), 'Spine2': (0.004, 0.993, 0.021), 'LeftArm': (0.146, 1.091, 0.034), 'RightArm': (-0.137, 1.090, 0.031)},
               'head': {'hw': .075, 'front': .104, 'back': .060, 'eye': .081, 'top': .169},
               'neck': {'rx': .042, 'rz': .040, 'cy': -.026, 'collar_y': .012},
               'chest': {'front': .121, 'y': .066, 'half': .078},
               'shoulder': {'r': .050, 'rise': .040}},
}
SHELL, GLOW = 'gear_shell', 'gear_glow'


# ---------------------------------------------------------------- geometry helpers: Blender is Z-up and forward is -Y; export_yup turns that into +Y up and +Z forward ----------------------------------------------------------------
class Part:
    def __init__(self):
        self.bm = bmesh.new()
        self.smooth = False

    def _new(self, geom, mat):
        for f in {f for v in geom['verts'] for f in v.link_faces} if 'verts' in geom else []:
            f.material_index = mat

    def quad(self, pts, mat):
        f = self.bm.faces.new([self.bm.verts.new(Vector(p)) for p in pts])
        f.material_index = mat
        return f

    def box(self, c, size, mat=0, bevel=0.0, rot=(0, 0, 0)):
        """A box centred at c, size (x, y, z) in Blender axes, optionally rotated (radians, XYZ) about its own centre."""
        res = bmesh.ops.create_cube(self.bm, size=1)
        verts = res['verts']
        import mathutils
        rotm = mathutils.Euler(rot, 'XYZ').to_matrix()
        for v in verts:
            v.co = rotm @ Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])) + Vector(c)
        faces = list({f for v in verts for f in v.link_faces})
        if bevel and min(size) > bevel * 3:
            out = bmesh.ops.bevel(self.bm, geom=list({e for f in faces for e in f.edges}), offset=bevel, segments=1, affect='EDGES', profile=.5)
            faces = list({f for v in verts if v.is_valid for f in v.link_faces} | set(out['faces']))
        for f in faces:
            if f.is_valid:
                f.material_index = mat
        return faces

    def cyl(self, a, b, r, mat=0, seg=10):
        a, b = Vector(a), Vector(b)
        res = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=(b - a).length)
        rot = Vector((0, 0, 1)).rotation_difference((b - a).normalized()).to_matrix()
        for v in res['verts']:
            v.co = rot @ v.co + (a + b) / 2
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.material_index = mat

    def band(self, cx, cy, rx, ry, a0, a1, z0, z1, thick, mat=0, steps=18, caps=True):
        """A curved band: part of an ellipse (centre cx, cy; radii rx, ry), swept from angle a0 to a1 (degrees, 0 = forward = -Y, positive turns toward +X),
        from height z0 to z1, `thick` thick (outward). Closed top, bottom and ends."""
        def ring(rad_x, rad_y):
            pts = []
            for i in range(steps + 1):
                t = math.radians(a0 + (a1 - a0) * i / steps)
                pts.append((cx + rad_x * math.sin(t), cy - rad_y * math.cos(t)))
            return pts
        inner, outer = ring(rx, ry), ring(rx + thick, ry + thick)
        for i in range(steps):
            (ix0, iy0), (ix1, iy1), (ox0, oy0), (ox1, oy1) = inner[i], inner[i + 1], outer[i], outer[i + 1]
            self.quad([(ox0, oy0, z0), (ox1, oy1, z0), (ox1, oy1, z1), (ox0, oy0, z1)], mat)           # outer face
            self.quad([(ix1, iy1, z0), (ix0, iy0, z0), (ix0, iy0, z1), (ix1, iy1, z1)], mat)           # inner face
            self.quad([(ox1, oy1, z1), (ix1, iy1, z1), (ix0, iy0, z1), (ox0, oy0, z1)], mat)           # top
            self.quad([(ix1, iy1, z0), (ox1, oy1, z0), (ox0, oy0, z0), (ix0, iy0, z0)], mat)           # bottom
        if caps:
            for idx, flip in ((0, 1), (steps, -1)):
                (ix, iy), (ox, oy) = inner[idx], outer[idx]
                pts = [(ix, iy, z0), (ox, oy, z0), (ox, oy, z1), (ix, iy, z1)]
                self.quad(pts if flip > 0 else pts[::-1], mat)


def finish(part, name):
    bm = part.bm
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    tris = sum(len(f.verts) - 2 for f in bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(bpy.data.materials[SHELL])
    mesh.materials.append(bpy.data.materials[GLOW])
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = bool(getattr(part, 'smooth', False))
    used = {p.material_index for p in mesh.polygons}
    lo = Vector((1e9,) * 3)
    hi = Vector((-1e9,) * 3)
    for v in mesh.vertices:
        for i in range(3):
            lo[i], hi[i] = min(lo[i], v.co[i]), max(hi[i], v.co[i])
    return obj, tris, (hi - lo), used


def materials():
    for name, base, metal, rough, emit in ((SHELL, (.03, .034, .042, 1), .85, .38, None), (GLOW, (0, 0, 0, 1), 0, .5, (.15, .85, 1, 1))):
        m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
        m.use_nodes = True
        nt = m.node_tree
        nt.nodes.clear()
        out, bs = nt.nodes.new('ShaderNodeOutputMaterial'), nt.nodes.new('ShaderNodeBsdfPrincipled')
        nt.links.new(bs.outputs['BSDF'], out.inputs['Surface'])
        bs.inputs['Base Color'].default_value = base
        bs.inputs['Metallic'].default_value = metal
        bs.inputs['Roughness'].default_value = rough
        if emit:
            bs.inputs['Emission Color'].default_value = emit
            bs.inputs['Emission Strength'].default_value = 1.0


# ---------------------------------------------------------------- the parts. All coordinates are relative to the part's own joint. ----------------------------------------------------------------
def visor(B):
    """A thin band across the eyes with one hair-fine lit slit. Nothing else."""
    h = B['head']
    p = Part()
    cy = -(h['front'] - h['back']) / 2
    rx, ry = h['hw'] + .005, (h['front'] + h['back']) / 2 + .003
    zc = h['eye']
    p.band(0, cy, rx, ry, -104, 104, zc - .013, zc + .013, .007, 0, steps=14)
    p.band(0, cy, rx + .0072, ry + .0072, -92, 92, zc - .0025, zc + .0025, .0015, 1, steps=12)
    p.smooth = True
    return p


def collar(B):
    """A slim ring collar, open at the front, with a hair-fine lit line along its top edge."""
    n = B['neck']
    p = Part()
    rx, rz, cy = n['rx'] + .008, n['rz'] + .008, n['cy']
    y0 = n['collar_y']
    p.band(0, cy, rx, rz, 20, 340, y0, y0 + .040, .006, 0, steps=14)
    p.band(0, cy, rx + .0062, rz + .0062, 28, 332, y0 + .0365, y0 + .0395, .0015, 1, steps=12)
    p.smooth = True
    return p


def pauldron(B, side):
    """One low, slightly angled plate over the shoulder with a hair-fine lit edge on its outer side."""
    s = B['shoulder']
    r, rise = s['r'], s['rise']
    p = Part()
    w, d, t = r * 1.7, r * 1.5, .007
    x = side * (.020 + w * .12)
    roll = side * -.20
    p.box((x, 0, rise + .012), (w, d, t), 0, bevel=.002, rot=(0, roll, 0))
    p.box((x + side * w * .5 * math.cos(roll), 0, rise + .012 - side * w * .5 * math.sin(roll) * -1), (.0015, d * .94, .0035), 1, rot=(0, roll, 0))
    return p


def chest_line(B):
    """A single short lit bar on the upper chest, on a thin dark backing."""
    c = B['chest']
    p = Part()
    zc, fy = c['y'], -c['front']
    p.box((0, fy, zc), (c['half'] * 1.1, .004, .012), 0, bevel=.0015)
    p.box((0, fy - .0025, zc), (c['half'] * .85, .0015, .0035), 1)
    return p


# name -> (builder, bone, uses side)
PARTS = {
    'visor': (visor, 'Head', None), 'collar': (collar, 'Neck', None),
    'pauldron_L': (pauldron, 'LeftArm', 1), 'pauldron_R': (pauldron, 'RightArm', -1),
    'chest_line': (chest_line, 'Spine2', None),
}


# The shoulder plates are authored around the arm joint but hang from the COLLARBONE joint: the arm bone swings down in walking, talking and sitting and would
# carry the plate into the shoulder; the collarbone stays put. SCALE_BY: which size of the outfit's body the piece is scaled by when it is fitted at load time
# (gear-fit.json, tools/assets/gear/fit_data.py): the head width for the visor and collar, the shoulder span for the rest.
WEIGHT = {'pauldron_L': 'LeftShoulder', 'pauldron_R': 'RightShoulder'}
SCALE_BY = {'visor': 'headW', 'collar': 'headW', 'pauldron_L': 'span', 'pauldron_R': 'span', 'chest_line': 'span'}


def export(arm, obj, path):
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=False, export_draco_mesh_compression_enable=False,
                              export_image_format='NONE', export_materials='EXPORT', export_normals=True, export_texcoords=False, export_cameras=False, export_lights=False,
                              export_animations=False, export_extras=False, export_skins=True)


def import_body(B):
    """The character's own file, in its rest (bind) pose with its animations left unplayed; the stray helper sphere the importer adds is removed."""
    bpy.ops.import_scene.gltf(filepath=os.path.join(REPO, 'void-runner', 'assets', 'models', 'crowd', B['file'] + '.glb'))
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and o.name.startswith('Icosphere'):
            bpy.data.objects.remove(o)
    arm.data.pose_position = 'REST'
    return arm


def skin_to(arm, obj, bone, joint):
    """Moves a part (authored around the origin) onto its joint, bakes that in, and weights every vertex 100% to that one bone of the character's armature."""
    obj.location = (joint[0], -joint[2], joint[1])                       # glTF (x, y, z) -> Blender (x, -z, y)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    vg = obj.vertex_groups.new(name='mixamorig:' + bone)
    vg.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
    obj.parent = arm
    mod = obj.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm


def build_all(only=None, preview_hook=None):
    os.makedirs(OUT, exist_ok=True)
    manifest = {'note': 'Cyberpunk gear for the player characters. LOCAL, for review: not loaded by the game. See docs/development/CHARACTER_GEAR.md.',
                'units': 'the character file\'s own units (the game scales the whole character); Y up, character faces +Z, +X is its left',
                'skinning': 'each part carries the character\'s 52-joint skeleton and is weighted 100% to the one joint named in "bone"',
                'materials': {SHELL: 'dark gunmetal PBR', GLOW: 'lit details; emissive only; the game may tint it'}, 'bodies': {}, 'parts': {}}
    for bname, B in BODIES.items():
        bpy.ops.wm.read_factory_settings(use_empty=True)
        materials()
        arm = import_body(B)
        manifest['bodies'][bname] = {'file': B['file'], 'joints': {k: list(v) for k, v in B['joints'].items()}}
        made = {}
        for name, (fn, bone, side) in PARTS.items():
            if only and name not in only:
                continue
            part = fn(B, side) if side is not None else fn(B)
            full = '%s_%s' % (name, B['suffix'])
            obj, tris, size, used = finish(part, full)
            assert tris < 300, '%s has %d triangles' % (full, tris)
            skin_to(arm, obj, WEIGHT.get(name, bone), B['joints'][bone])
            path = os.path.join(OUT, 'gear_%s.glb' % full)
            export(arm, obj, path)
            manifest['parts'][full] = {'file': 'gear_%s.glb' % full, 'part': name, 'body': bname, 'bone': 'mixamorig:' + WEIGHT.get(name, bone), 'anchor': 'mixamorig:' + bone, 'scaleBy': SCALE_BY[name], 'triangles': tris,
                                       'size': [round(size.x, 3), round(size.z, 3), round(size.y, 3)], 'bytes': os.path.getsize(path), 'glow': 1 in used}
            made[name] = obj
            print('GEAR', full, 'tris', tris, 'bytes', os.path.getsize(path))
        if preview_hook:
            preview_hook(bname, B, arm, made)
    with open(os.path.join(OUT, 'gear-manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1)


# ---------------------------------------------------------------- preview: the real character wearing the gear under a dim blue-magenta night light, at rest and mid-animation ----------------------------------------------------------------
SETS = {'a': list(PARTS), 'b': list(PARTS)}


def render_scene(shots):
    s = bpy.context.scene
    for path, loc, tgt, lens in shots:
        cam = s.camera
        cam.location = loc
        cam.data.lens = lens
        cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        s.render.filepath = path
        bpy.ops.render.render(write_still=True)


def make_preview(bname, B, arm, made, outdir, which, pose):
    s = bpy.context.scene
    for o in list(bpy.data.objects):                                    # take away what would clash with the visors, and show only the chosen set
        if o.type == 'MESH' and any(k in o.name.lower() for k in ('fedora', 'shades', 'visor0', 'mask0')):
            o.hide_render = True
    for name, obj in made.items():
        obj.hide_render = name not in SETS[which]
    if pose:
        act = bpy.data.actions.get(pose)
        arm.data.pose_position = 'POSE'
        arm.animation_data_create()
        arm.animation_data.action = act
        s.frame_set(int(act.frame_range[0] + (act.frame_range[1] - act.frame_range[0]) * .35))
    top = B['joints']['Head'][1] + B['head']['top']
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
    floor = bpy.context.active_object
    fm = bpy.data.materials.new('floor')
    fm.use_nodes = True
    fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.01, .012, .02, 1)
    fm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .2
    floor.data.materials.append(fm)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    s.collection.objects.link(cam)
    s.camera = cam
    target = Vector((0, 0, top * .70))
    for nm, loc, col, e in (('key', (-1.4, -2.2, top * 1.1), (.45, .55, 1.0), 260), ('rim', (1.8, 1.4, top * 1.0), (1.0, .2, .7), 420), ('fill', (1.5, -2.0, .6), (.2, .8, 1.0), 120)):
        d = bpy.data.lights.new(nm, 'AREA')
        d.color, d.energy, d.size = col, e, 2.5
        o = bpy.data.objects.new(nm, d)
        o.location = loc
        o.rotation_euler = (target - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        s.collection.objects.link(o)
    w = bpy.data.worlds.new('night')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (.004, .006, .014, 1)
    s.world = w
    s.render.engine, s.cycles.device, s.cycles.samples, s.cycles.use_denoising = 'CYCLES', 'CPU', 56, True
    s.render.resolution_x, s.render.resolution_y = 900, 1200
    tag = '%s-%s%s' % (bname, which, '-' + pose if pose else '')
    render_scene([(os.path.join(outdir, 'gear-%s-full.png' % tag), (top * 1.2, -top * 2.5, top * .62), (0, 0, top * .60), 62),
                  (os.path.join(outdir, 'gear-%s-head.png' % tag), (top * .62, -top * .62, top * .98), (0, -.03, top * .90), 85)])


def main():
    args = sys.argv[1:]
    only = next((set(args[i + 1].split(',')) for i, a in enumerate(args) if a == '--only'), None)
    outdir = next((args[i + 1] for i, a in enumerate(args) if a == '--preview'), None)
    which = next((args[i + 1] for i, a in enumerate(args) if a == '--set'), 'a')
    pose = next((args[i + 1] for i, a in enumerate(args) if a == '--pose'), None)
    onbody = next((args[i + 1] for i, a in enumerate(args) if a == '--on'), None)
    hook = (lambda bname, B, arm, made: make_preview(bname, B, arm, made, outdir, which, pose) if (not onbody or onbody == bname) else None) if outdir else None
    build_all(only, hook)


if __name__ == '__main__':
    main()
