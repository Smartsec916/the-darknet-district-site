"""Blender 5.2: turn a bought or downloaded rigged character (FBX, or a .blend from a prepare_*.py script)
into a light companion GLB with our clips.

blender -b --factory-startup --python build_imported_character.py -- SPEC.json OUT.glb --source MODEL.fbx \
    --mocap DIR [--ual DIR] [--mixamo DIR] [--master MASTER.blend]

The source is never modified. Its bones are renamed to the Mixamo names in the spec's "bones" map (so the
game's head tracking and clip names work unchanged); bones without a Mixamo match (twists, pelvis, face)
simply follow their parents. Each mesh is cut down to the spec's triangle budget, shape keys are kept only
where the spec lists them (e.g. blinks), and the clips from clips.json are retargeted the same way as
build_mpfb_character.py: world-space rotation change from the source T-pose, hips kept in place
horizontally, the last 0.6 s blended into the first pose. The character's own rest pose (often an A-pose)
is bent to the clips' T-pose for the mapping only; its rest pose and skin weights are left alone.

--master saves the editable Blender master (full detail, renamed rig, textures packed) before any cuts.
Keep masters and the original download outside the repository.
"""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Matrix, Vector

args = sys.argv[sys.argv.index('--') + 1:]
spec = json.loads(Path(args[0]).read_text(encoding='utf-8'))
output_path = Path(args[1])
opts = {}
for flag in ('--source', '--mocap', '--ual', '--mixamo', '--master'):
    if flag in args:
        opts[flag[2:]] = Path(args[args.index(flag) + 1])
library_doc = json.loads((Path(__file__).resolve().parent / 'clips.json').read_text(encoding='utf-8'))
FPS = library_doc.get('fps', 24)
folders = {'ual': opts.get('ual'), 'mixamo': opts.get('mixamo')}
clips = []
for name in ([] if '--noclips' in args else spec.get('clips', [])):  # --noclips: a quick look at the geometry
    c = library_doc['clips'][name]
    folder = folders[c['source']] if c.get('source') else opts['mocap']
    clips.append((name, folder / c['file'], (c['start'], c['end']) if 'start' in c else None, c))
rest_reference = opts['mocap'] / library_doc['restReference']

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# 1. Import, make the scale real (FBX centimetres) and rename the rig. A .blend source (one prepared by a
# prepare_*.py script) brings in its armature and meshes as they are.
if opts['source'].suffix.lower() == '.blend':
    with bpy.data.libraries.load(str(opts['source'])) as (src_data, dst_data):
        dst_data.objects = list(src_data.objects)
    for o in dst_data.objects:
        if o and o.type in ('ARMATURE', 'MESH'):
            bpy.context.scene.collection.objects.link(o)
else:
    bpy.ops.import_scene.fbx(filepath=str(opts['source']), use_anim=False)
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in [rig] + meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
prefix = spec.get('bonePrefix', '')
for src, dst in spec['bones'].items():
    bone = rig.data.bones.get(prefix + src)
    assert bone, f'no bone {prefix + src}'
    bone.name = 'mixamorig:' + dst   # vertex groups follow the rename
for b in rig.data.bones:
    if b.name.startswith(prefix):
        b.name = b.name[len(prefix):]
rig.name = spec['name']
for o in meshes:
    # An exact name wins over a suffix ("piping_top" must not be taken for "top").
    part = o.name if o.name in spec['meshes'] else next((k for k in spec['meshes'] if o.name.endswith(k)), None)
    o.name = spec['name'] + '_' + (spec['meshes'][part]['name'] if part else o.name)
bpy.ops.file.pack_all()
if opts.get('master'):
    opts['master'].parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(opts['master']))
    print('VR_MASTER', opts['master'])


# Hair made of thousands of one-quad-wide strips can't be decimated as one surface (the strips collapse).
# Instead a share of the strips is kept per material ("keepCards", 0-1, every n-th so the cover stays even)
# and each kept strip is cut to at most "cardSegments" segments by dissolving evenly spaced rungs.
# "dropMaterials" removes whole layers (e.g. the clear cornea and eye-occlusion shells, which only work with
# real transparency).
def thin_parts(o, part):
    keep = part.get('keepCards', {})
    drop = set(part.get('dropMaterials', []))
    if not keep and not drop:
        return
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(o.data)
    seen, doomed, count, rungs = set(), [], {}, []
    for f in bm.faces:
        if f.index in seen:
            continue
        comp, stack = [], [f]
        seen.add(f.index)
        while stack:
            g = stack.pop()
            comp.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen:
                        seen.add(h.index)
                        stack.append(h)
        mat = o.data.materials[comp[0].material_index].name
        if mat in drop:
            doomed += comp
            continue
        share = next((v for k, v in keep.items() if mat.endswith(k)), 1)
        n = count[mat] = count.get(mat, 0) + 1
        if share < 1 and int(n * share) == int((n - 1) * share):
            doomed += comp
        elif part.get('cardSegments') and all(v.is_boundary for g in comp for v in g.verts):
            rungs.extend(strip_rungs(comp, part['cardSegments']))
    bmesh.ops.delete(bm, geom=doomed, context='FACES')
    rungs = [e for e in rungs if e.is_valid]
    if rungs:
        bmesh.ops.dissolve_edges(bm, edges=rungs, use_verts=True)
    bm.to_mesh(o.data)
    bm.free()


def strip_rungs(faces, segments):
    """The rungs (edges between neighbouring quads) of a one-quad-wide strip to dissolve so that at most
    `segments` quads remain, evenly spaced from one end to the other."""
    inside = set(faces)
    def rungs_of(f):
        return [e for e in f.edges if len(e.link_faces) == 2 and all(g in inside for g in e.link_faces)]
    end = next((f for f in faces if len(rungs_of(f)) <= 1), None)
    if end is None or len(faces) <= segments:
        return []
    ordered, f, prev = [], end, None
    while True:
        nxt = [e for e in rungs_of(f) if e is not prev]
        if not nxt:
            break
        prev = nxt[0]
        ordered.append(prev)
        f = next(g for g in prev.link_faces if g is not f)
    keep = {round(i * len(ordered) / segments) for i in range(1, segments)}
    return [e for i, e in enumerate(ordered, 1) if i not in keep]


# 2. Cut each part to its budget. Shape keys block decimation, so only listed keys survive (and those parts
# are not decimated). Parts with "drop" are removed.
def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)


for o in list(meshes):
    part = next((v for k, v in spec['meshes'].items() if o.name.endswith(v['name'])), {})
    if part.get('drop'):
        meshes.remove(o)
        bpy.data.objects.remove(o, do_unlink=True)
        continue
    keys = o.data.shape_keys
    keep = set(part.get('shapeKeys', []))
    if keys:
        for kb in list(keys.key_blocks)[1:]:
            if kb.name not in keep:
                o.shape_key_remove(kb)
        if len(o.data.shape_keys.key_blocks) == 1:
            o.shape_key_remove(o.data.shape_keys.key_blocks[0])
    before = tris(o)
    thin_parts(o, part)
    limit = part.get('maxTris')
    if limit and before > limit and not o.data.shape_keys:
        bpy.context.view_layer.objects.active = o
        mod = o.modifiers.new('lighten', 'DECIMATE')
        mod.ratio = limit / before
        mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_move_to_index(modifier=mod.name, index=0)
        bpy.ops.object.modifier_apply(modifier=mod.name)
    print('VR_PART', o.name, before, '->', tris(o), 'keys', [k.name for k in o.data.shape_keys.key_blocks] if o.data.shape_keys else [])


# Skin hidden under clothes is removed ("hiddenUnder": parts that cover it): a body face goes when rays from
# its centre along the normal, and from its corners, all hit an opaque spot of one of those parts within
# "hiddenGap" metres (see-through lace and cut-outs read the garment's alpha texture, so skin stays there).
# bmesh keeps the shape-key layers, so blinks survive.
def cover_of(m):
    """A ray-cast tree over a garment's triangles, plus each triangle's UVs and alpha image (if any)."""
    import numpy
    from mathutils.bvhtree import BVHTree
    me = m.data
    me.calc_loop_triangles()
    uv = me.uv_layers.active.data
    alphas = {}
    for i, mat in enumerate(me.materials):
        bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if mat and mat.use_nodes else None
        link = bsdf.inputs['Alpha'].links[0] if bsdf and bsdf.inputs['Alpha'].is_linked else None
        if link and link.from_node.type == 'TEX_IMAGE' and link.from_node.image:
            img = link.from_node.image.copy()
            img.scale(256, 256)
            px = numpy.empty(256 * 256 * 4, dtype=numpy.float32)
            img.pixels.foreach_get(px)
            alphas[i] = px.reshape(256, 256, 4)[:, :, 3 if link.from_socket.name == 'Alpha' else 0]
            bpy.data.images.remove(img)
    tris = list(me.loop_triangles)
    tree = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [t.vertices[:] for t in tris])
    return tree, tris, uv, alphas, me


def opaque_hit(cover, p, n, gap):
    from mathutils.geometry import barycentric_transform
    tree, tris, uv, alphas, me = cover
    loc, _, i, _ = tree.ray_cast(p + n * .002, n, gap)
    if loc is None:
        return False
    t = tris[i]
    img = alphas.get(t.material_index)
    if img is None:
        return True
    a, b, c = (me.vertices[v].co for v in t.vertices)
    ua, ub, uc = (uv[l].uv.to_3d() for l in t.loops)
    u = barycentric_transform(loc, a, b, c, ua, ub, uc)
    return img[int(u.y % 1 * 255), int(u.x % 1 * 255)] >= .5


def remove_hidden(o, part):
    covers = [cover_of(m) for m in meshes if any(m.name.endswith(n) for n in part.get('hiddenUnder', []))]
    if not covers:
        return
    import bmesh
    gap = part.get('hiddenGap', .04)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    def covered(p, n):
        return any(opaque_hit(c, p, n, gap) for c in covers)
    doomed = [f for f in bm.faces if covered(f.calc_center_median(), f.normal) and all(covered(v.co, v.normal) for v in f.verts)]
    before = len(bm.faces)
    bmesh.ops.delete(bm, geom=doomed, context='FACES')
    bm.to_mesh(o.data)
    bm.free()
    print('VR_HIDDEN', o.name, before, '->', len(o.data.polygons), 'faces')


for o in meshes:
    part = next((v for v in spec['meshes'].values() if o.name.endswith(v['name'])), {})
    remove_hidden(o, part)


# Real-time materials: opaque except where a part needs cut-out alpha (hair, lashes, lace); glTF MASK via a
# Round node so nothing depends on transparency sorting.
def game_material(o, cutout, double, cutoff=.5):
    for slot in o.material_slots:
        mat = slot.material
        if not mat or not mat.use_nodes:
            continue
        bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf:
            continue
        alpha = bsdf.inputs['Alpha']
        links = mat.node_tree.links
        source = alpha.links[0].from_socket if alpha.is_linked else None
        for link in list(alpha.links):
            links.remove(link)
        alpha.default_value = 1.0
        cutout = cutout or mat.name in spec.get('cutoutMaterials', [])
        if source and cutout and cutoff != .5:
            # 1 - (alpha < cutoff): exported as glTF MASK with that cutoff (soft hair strands need a low one).
            less = mat.node_tree.nodes.new('ShaderNodeMath')
            less.operation = 'LESS_THAN'
            less.inputs[1].default_value = cutoff
            links.new(source, less.inputs[0])
            inv = mat.node_tree.nodes.new('ShaderNodeMath')
            inv.operation = 'SUBTRACT'
            inv.inputs[0].default_value = 1.0
            links.new(less.outputs[0], inv.inputs[1])
            links.new(inv.outputs[0], alpha)
        elif source and cutout:
            rnd = mat.node_tree.nodes.new('ShaderNodeMath')
            rnd.operation = 'ROUND'
            links.new(source, rnd.inputs[0])
            links.new(rnd.outputs[0], alpha)
        mat.surface_render_method = 'DITHERED'
        mat.use_backface_culling = not (cutout or double)
        print('VR_MATERIAL', o.name, mat.name, 'alpha' if source else '', 'cutout' if source and cutout else '')


for o in meshes:
    part = next((v for v in spec['meshes'].values() if o.name.endswith(v['name'])), {})
    game_material(o, part.get('cutout', False), part.get('doubleSided', False), part.get('alphaCutoff', .5))


def rot3(m):
    return m.to_3x3().normalized()


# Quaternius UAL / Unreal-style bone names -> Mixamo names (as in build_mpfb_character.py).
UE = {'pelvis': 'Hips', 'spine_01': 'Spine', 'spine_02': 'Spine1', 'spine_03': 'Spine2', 'neck_01': 'Neck', 'Head': 'Head'}
for side, S in (('l', 'Left'), ('r', 'Right')):
    UE.update({f'clavicle_{side}': f'{S}Shoulder', f'upperarm_{side}': f'{S}Arm', f'lowerarm_{side}': f'{S}ForeArm', f'hand_{side}': f'{S}Hand',
               f'thigh_{side}': f'{S}UpLeg', f'calf_{side}': f'{S}Leg', f'foot_{side}': f'{S}Foot', f'ball_{side}': f'{S}ToeBase'})
    for f, F in (('index', 'Index'), ('middle', 'Middle'), ('ring', 'Ring'), ('pinky', 'Pinky'), ('thumb', 'Thumb')):
        for k in (1, 2, 3):
            UE[f'{f}_0{k}_{side}'] = f'{S}Hand{F}{k}'
UE_BACK = {'mixamorig:' + v: k for k, v in UE.items()}


def import_source(path):
    """A clip's armature, with a map from our Mixamo bone names to its own (Mixamo, HumanIK or UAL names)."""
    before = set(bpy.data.objects)
    if path.suffix.lower() in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=str(path))
    else:
        bpy.ops.import_scene.fbx(filepath=str(path), use_anim=True)
    new = set(bpy.data.objects) - before
    arm = next(o for o in new if o.type == 'ARMATURE')
    for o in new:
        if o != arm:
            bpy.data.objects.remove(o, do_unlink=True)
    have = {b.name for b in arm.data.bones}
    names = {}
    for n in bones:
        for cand in (n, n.replace('mixamorig:', 'Character1_'), UE_BACK.get(n)):
            if cand in have:
                names[n] = cand
                break
    return arm, names


def world_rest(arm):
    return {b.name: arm.matrix_world @ b.matrix_local for b in arm.data.bones}


def order(arm):
    out = []
    def walk(b):
        out.append(b.name)
        for c in b.children:
            walk(c)
    for b in arm.data.bones:
        if b.parent is None:
            walk(b)
    return out


bones = [b.name for b in rig.data.bones if b.name.startswith('mixamorig:')]
names = order(rig)
for pb in rig.pose.bones:
    pb.rotation_mode = 'QUATERNION'
tgt_rest = world_rest(rig)
local_rest = {b.name: b.matrix_local for b in rig.data.bones}
parent_of = {b.name: (b.parent.name if b.parent else None) for b in rig.data.bones}
arm_rot_inv = rot3(rig.matrix_world).inverted()

# 3. The rest pose bent to the clips' T-pose (bone directions only), measured in pose mode and then reset:
# `bent` is each bone's world rotation in that T-pose, used as the target of the mapping.
reference, ref_names = import_source(rest_reference)
ref_rest = world_rest(reference)
src_rest = {n: ref_rest[s] for n, s in ref_names.items()}
for name in names:
    if name not in src_rest:
        continue
    pb = rig.pose.bones[name]
    bpy.context.view_layer.update()
    posed = rig.matrix_world @ pb.matrix
    have = (rot3(posed) @ Vector((0, 1, 0))).normalized()
    want = (rot3(src_rest[name]) @ Vector((0, 1, 0))).normalized()
    delta = have.rotation_difference(want).to_matrix().to_4x4()
    head = posed.to_translation()
    pb.matrix = rig.matrix_world.inverted() @ (Matrix.Translation(head) @ delta @ Matrix.Translation(-head) @ posed)
bpy.context.view_layer.update()
bent = {n: rot3(rig.matrix_world @ rig.pose.bones[n].matrix) for n in names}
for pb in rig.pose.bones:
    pb.matrix_basis = Matrix()
bpy.data.objects.remove(reference, do_unlink=True)


def pick_action(arm, name):
    act = bpy.data.actions.get(name) or next((a for a in bpy.data.actions if a.name.startswith(name)), None)
    assert act, f'no action {name}'
    arm.animation_data_create()
    arm.animation_data.action = act
    if act.slots:
        arm.animation_data.action_slot = act.slots[0]
    return act


# 4. Retarget. Mapped bones take the source's world rotation change applied to their bent rest; unmapped
# bones (pelvis, twists, face) keep their rest relation to their parent and get no keys.
def retarget(name, path, span, copts):
    src, smap = import_source(path)
    scene = bpy.context.scene
    src_fps = scene.render.fps / scene.render.fps_base
    rest_all = world_rest(src)
    if copts.get('restAction'):
        ra = pick_action(src, copts['restAction'])
        scene.frame_set(int(ra.frame_range[0]))
        rest_all = {b.name: src.matrix_world @ src.pose.bones[b.name].matrix for b in src.data.bones}
    if copts.get('action'):
        pick_action(src, copts['action'])
    s_rest = {n: rest_all[smap[n]] for n in smap}
    s_rest_inv = {n: rot3(m).inverted() for n, m in s_rest.items()}
    action = src.animation_data.action
    first_frame, last_frame = action.frame_range
    t0, t1 = span or (0.0, (last_frame - first_frame) / src_fps)
    t1 = min(t1, (last_frame - first_frame) / src_fps)
    count = int((t1 - t0) * FPS) + 1
    hips = 'mixamorig:Hips'
    ratio = tgt_rest[hips].to_translation().z / s_rest[hips].to_translation().z
    poses, hip_locs, first = [], [], None
    for k in range(count):
        f = first_frame + (t0 + k / FPS) * src_fps
        scene.frame_set(int(f), subframe=f - int(f))
        world = {}
        pose = {}
        for n in names:
            p = parent_of[n]
            if n in smap:
                world[n] = arm_rot_inv @ rot3(src.matrix_world @ src.pose.bones[smap[n]].matrix) @ s_rest_inv[n] @ bent[n]
            elif p in world:
                world[n] = world[p] @ rot3(tgt_rest[p]).inverted() @ rot3(tgt_rest[n])
            else:
                continue
            if n not in smap:
                continue
            rest = local_rest[n].to_3x3()
            if p and p in world:
                basis = rest.inverted() @ local_rest[p].to_3x3() @ world[p].inverted() @ world[n]
            elif p:
                basis = rest.inverted() @ local_rest[p].to_3x3() @ rot3(tgt_rest[p]).inverted() @ rot3(rig.matrix_world) @ world[n]
            else:
                basis = rest.inverted() @ world[n]
            pose[n] = basis.to_quaternion()
        poses.append(pose)
        sh = (src.matrix_world @ src.pose.bones[smap[hips]].matrix).to_translation() - s_rest[hips].to_translation()
        if first is None:
            first = sh.copy()
        head_world = tgt_rest[hips].to_translation() + Vector((first.x, first.y, sh.z)) * ratio
        head_arm = rig.matrix_world.inverted() @ head_world
        hip_locs.append(local_rest[hips].to_3x3().inverted() @ (head_arm - local_rest[hips].to_translation()))
    blend = 0 if copts.get('loop') == 'exact' else min(int(0.6 * FPS), count // 3)
    for j in range(blend):
        k = count - blend + j
        w = (j + 1) / blend
        for n, q in poses[k].items():
            a = q.copy()
            if a.dot(poses[0][n]) < 0:
                a.negate()
            poses[k][n] = a.slerp(poses[0][n], w)
        hip_locs[k] = hip_locs[k].lerp(hip_locs[0], w)
    out = bpy.data.actions.new(name)
    rig.animation_data_create()
    rig.animation_data.action = out
    for k, pose in enumerate(poses):
        for n, q in pose.items():
            pb = rig.pose.bones[n]
            pb.rotation_quaternion = q
            pb.keyframe_insert('rotation_quaternion', frame=k + 1, group=n)
        pbh = rig.pose.bones[hips]
        pbh.location = hip_locs[k]
        pbh.keyframe_insert('location', frame=k + 1, group=hips)
    rig.animation_data.action = None
    bpy.data.objects.remove(src, do_unlink=True)
    for a in list(bpy.data.actions):
        if a is not out and a.users == 0:
            bpy.data.actions.remove(a)
    out.use_fake_user = True
    scene.render.fps, scene.render.fps_base = FPS, 1
    print('VR_CLIP', name, path.name, f'{t0:.1f}-{t1:.1f}s', count, 'frames from', src_fps, 'fps')
    return out


actions = [retarget(*c) for c in clips]

# 5. Export with one NLA track per clip, in rest pose.
rig.animation_data_create()
rig.animation_data.action = None
for a in actions:
    track = rig.animation_data.nla_tracks.new()
    track.name = a.name
    strip = track.strips.new(a.name, 1, a)
    strip.action_slot = a.slots[0]
for pb in rig.pose.bones:
    pb.matrix_basis = Matrix()
bpy.context.scene.frame_set(1)
output_path.parent.mkdir(parents=True, exist_ok=True)
bpy.context.scene.render.fps, bpy.context.scene.render.fps_base = FPS, 1
bpy.ops.export_scene.gltf(filepath=str(output_path), export_format='GLB',
    export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
    export_nla_strips=True, export_optimize_animation_size=True, export_image_format='AUTO',
    export_morph=True, export_morph_normal=False, export_apply=False)
print('VR_CHARACTER', spec['name'], 'meshes', len(meshes), 'tris', sum(tris(o) for o in meshes))
print('VR_EXPORT', output_path, output_path.stat().st_size)
