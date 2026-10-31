"""Blender 5.2: one or more objects from a purchased model pack (e.g. the CGTrader "Cyberpunk City" Blender files)
as a game-ready GLB: modifiers applied, real scale, origin at the middle of the base, textures found again.

blender -b --factory-startup --disable-autoexec PACK.blend --python pack_to_glb.py -- OUT.glb \
    [--objects NAME,NAME,...] [--scale 0.3] [--texdir DIR] [--planar DEGREES] [--front -y|+y|-x|+x] [--kit] [--lit-windows MATERIAL]

--objects  the objects to keep (default: every visible mesh in the file); their children come too.
--scale    the pack's unit in metres (the Cyberpunk City pack is about 3.3 units per metre: a car is 16 units long).
--planar   merge coplanar faces within this angle (Blender's planar decimation): flat walls lose their extra
           triangles, windows, ledges and trim keep theirs.
--front    which way the model's front faces in the source; it is turned to face +Y (glTF +Z, the game's "into the
           street" convention is applied where it is placed).
--lit-windows  night windows: each separate pane using MATERIAL gets lit (warm or cool, about a third of them) or
           stays dark, with a fixed seed so a model always looks the same; the rest keep the source material.
--kit      keep each listed object as its own model in one file (named after it, each with its origin at the middle of
           its own base), so a set of pieces shares its textures; the game places them by name.
The source file is opened, never saved over (--disable-autoexec: no scripts in it run). Keep the pack and the GLBs
outside the repository: they are licensed content.
"""
import bpy
import sys
import math
from pathlib import Path
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index('--') + 1:]
out = Path(args[0])
opt = {k: args[args.index(k) + 1] for k in ('--objects', '--scale', '--texdir', '--planar', '--front', '--lit-windows') if k in args}
kit = '--kit' in args
scale = float(opt.get('--scale', 1))
names = [n for n in opt.get('--objects', '').split(',') if n]

# Find textures the file keeps outside itself (the pack ships them in a Textures folder).
if opt.get('--texdir'):
    index = {p.name.lower(): p for p in Path(opt['--texdir']).rglob('*') if p.is_file()}
    for im in bpy.data.images:
        if im.packed_file or not im.filepath:
            continue
        p = Path(bpy.path.abspath(im.filepath))
        if not p.exists() and p.name.lower() in index:
            im.filepath = str(index[p.name.lower()])
            im.reload()
            print('RELINK', p.name)

scene = bpy.context.scene
wanted = set()
if names:
    for n in names:
        o = bpy.data.objects.get(n)
        assert o, 'no object ' + n
        wanted.add(o)
        wanted.update(o.children_recursive)
else:
    wanted = {o for o in scene.objects if o.type == 'MESH' and not o.hide_render}
wanted = {o for o in wanted if o.type in ('MESH', 'CURVE', 'FONT') and not o.hide_render}
for o in list(bpy.data.objects):
    if o not in wanted:
        bpy.data.objects.remove(o, do_unlink=True)

# Real meshes with every modifier applied (arrays, mirrors, bevels, curves), parents cleared, transforms baked.
bpy.ops.object.select_all(action='DESELECT')
for o in list(scene.objects):
    o.hide_set(False)
    o.hide_viewport = False
    if o.name not in scene.collection.objects:
        scene.collection.objects.link(o)
    o.select_set(True)
bpy.context.view_layer.objects.active = next(iter(scene.objects))
bpy.ops.object.make_single_user(object=True, obdata=True)
bpy.ops.object.convert(target='MESH')
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
meshes = [o for o in scene.objects if o.type == 'MESH']

if opt.get('--lit-windows'):
    import bmesh
    import random
    rnd = random.Random(4127)
    glass = bpy.data.materials.get(opt['--lit-windows'])
    assert glass, 'no material ' + opt['--lit-windows']
    def lit(name, color, strength):
        # A plain material (the source glass may not be a Principled BSDF): dark glass glowing with a lit room.
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        bsdf.inputs['Base Color'].default_value = (.04, .04, .05, 1)
        bsdf.inputs['Roughness'].default_value = .2
        bsdf.inputs['Emission Color'].default_value = (*color, 1)
        bsdf.inputs['Emission Strength'].default_value = strength
        return m
    lights = [lit('WindowLitWarm', (1.0, .55, .25), .85), lit('WindowLitLamp', (.95, .72, .45), .7), lit('WindowLitCool', (.2, .62, .78), .75)]
    panes = 0
    for o in meshes:
        idx = [i for i, sl in enumerate(o.material_slots) if sl.material == glass]
        if not idx:
            continue
        base = len(o.data.materials)
        for m in lights:
            o.data.materials.append(m)
        bm = bmesh.new()
        bm.from_mesh(o.data)
        seen = set()
        for f in bm.faces:
            if f.index in seen or f.material_index not in idx:
                continue
            comp, stack = [], [f]
            seen.add(f.index)
            while stack:
                g = stack.pop()
                comp.append(g)
                for e in g.edges:
                    for h in e.link_faces:
                        if h.index not in seen and h.material_index in idx:
                            seen.add(h.index)
                            stack.append(h)
            panes += 1
            if rnd.random() < .34:
                k = base + rnd.randrange(len(lights))
                for g in comp:
                    g.material_index = k
        bm.to_mesh(o.data)
        bm.free()
    print('LIT_WINDOWS', panes, 'panes')

if opt.get('--planar'):
    for o in meshes:
        before = len(o.data.polygons)
        m = o.modifiers.new('planar', 'DECIMATE')
        m.decimate_type = 'DISSOLVE'
        m.angle_limit = math.radians(float(opt['--planar']))
        m.delimit = {'MATERIAL', 'SEAM', 'UV'}
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=m.name)

# Turn the front to +Y, then put the origin at the middle of the base and scale to metres: for the whole set, or for
# each model of a kit (a kit's models are its listed objects, with their children joined in).
turn = {'-y': math.pi, '+y': 0, '-x': -math.pi / 2, '+x': math.pi / 2}[opt.get('--front', '+y')]
rot = Matrix.Rotation(turn, 4, 'Z')
for o in meshes:
    o.data.transform(rot)
if kit:
    groups = {}
    for o in meshes:
        root = next((n for n in names if o.name == n or o.name.startswith(n + '.') or o.name.startswith(n)), o.name)
        groups.setdefault(root, []).append(o)
    for root, members in groups.items():
        if len(members) > 1:
            bpy.ops.object.select_all(action='DESELECT')
            for o in members:
                o.select_set(True)
            bpy.context.view_layer.objects.active = members[0]
            bpy.ops.object.join()
        groups[root] = [bpy.context.view_layer.objects.active if len(members) > 1 else members[0]]
    sets = list(groups.items())
else:
    sets = [(out.stem, meshes)]
tris = 0
for name, members in sets:
    lo = Vector((1e9,) * 3)
    hi = Vector((-1e9,) * 3)
    for o in members:
        for v in o.data.vertices:
            lo = Vector(map(min, lo, v.co))
            hi = Vector(map(max, hi, v.co))
    shift = Matrix.Translation(-Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z)))
    for o in members:
        o.data.transform(Matrix.Scale(scale, 4) @ shift)
        o.data.update()
        if kit:
            o.name = name
    n = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in members)
    tris += n
    print('PACK_MODEL', name, 'tris', n, 'size m', [round(v, 2) for v in (hi - lo) * scale])
print('PACK_FILE', out.name, 'models', len(sets), 'tris', tris)

out.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', use_selection=False, export_apply=True,
                          export_image_format='AUTO', export_animations=False, export_skins=False, export_morph=False,
                          export_lights=False, export_cameras=False)
print('PACK_EXPORT', out, out.stat().st_size)
