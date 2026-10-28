"""Blender 5.2 + MPFB 2: build a CC0 MakeHuman crowd character and retarget Mixamo-rig clips onto it.

blender -b --python build_mpfb_character.py -- SPEC.json OUT.glb name=CLIP_mixamo.fbx[:START-END] ...

Do not pass --factory-startup: the MPFB extension must load. SPEC.json names the phenotype,
skin and MakeHuman assets (basenames, found in the MPFB user data folder). The character gets
MPFB's built-in `mixamo` rig, whose 52 `mixamorig:` bones match VR_Humanoid_v1. Its rest pose is
first bent to match the source clips' T-pose, then each clip is copied bone by bone as a world-space
rotation change from rest, with the hips kept in place horizontally. Source FBX files are never modified.
"""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Matrix, Vector

from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.exportservice import ExportService
from bl_ext.user_default.mpfb.services.rigservice import RigService

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mpfb_styling  # noqa: E402

args = sys.argv[sys.argv.index('--') + 1:]
spec = json.loads(Path(args[0]).read_text(encoding='utf-8'))
output_path = Path(args[1])
FPS = 24
# Clips: either name=FILE[:START-END] arguments (seconds), or the spec's "clips" list resolved through
# clips.json (name -> file, start, end) with the mocap folder given as --mocap DIR.
clips = []
rest_reference = None
rest_args = args[2:]
sources = {}
for flag, key in (('--ual', 'ual'), ('--mixamo', 'mixamo')):
    if flag in rest_args:
        i = rest_args.index(flag)
        sources[key] = Path(rest_args[i + 1])
        del rest_args[i:i + 2]
if '--mocap' in rest_args:
    i = rest_args.index('--mocap')
    mocap = Path(rest_args[i + 1])
    del rest_args[i:i + 2]
    library_doc = json.loads((Path(__file__).resolve().parent / 'clips.json').read_text(encoding='utf-8'))
    library = library_doc['clips']
    FPS = library_doc.get('fps', FPS)
    rest_reference = mocap / library_doc['restReference']
    for name in spec.get('clips', []):
        c = library[name]
        folder = sources[c['source']] if c.get('source') else mocap
        span = (c['start'], c['end']) if 'start' in c else None
        clips.append((name, folder / c['file'], span, c))
for item in rest_args:
    name, src = item.split('=', 1)
    span = None
    if ':' in src[3:]:
        src, rng = src.rsplit(':', 1)
        span = tuple(float(v) for v in rng.split('-'))
    clips.append((name, Path(src), span, {}))

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# 1. The character.
info = HumanService._create_default_human_info_dict()
info['phenotype'].update({k: v for k, v in spec['phenotype'].items() if k != 'race'})
info['phenotype']['race'].update(spec['phenotype'].get('race', {}))
info.update({
    'name': spec['name'], 'rig': 'mixamo',
    'eyes': 'low-poly.mhclo', 'eyebrows': spec.get('eyebrows', 'eyebrow001') + '.mhclo',
    'eyelashes': spec.get('eyelashes', 'eyelashes01') + '.mhclo', 'hair': (spec['hair'] + '.mhclo') if spec.get('hair') else '',
    'clothes': [c + '.mhclo' for c in spec['clothes']],
    'skin_mhmat': spec['skin'] + '.mhmat', 'skin_material_type': 'GAMEENGINE',
    'eyes_material_type': 'MAKESKIN', 'clothes_material_type': 'MAKESKIN',
})
settings = HumanService.get_default_deserialization_settings()
settings['subdiv_levels'] = 0
basemesh = HumanService.deserialize_from_dict(info, settings)
TargetService.bake_targets(basemesh)
ExportService.bake_modifiers_remove_helpers(basemesh, bake_masks=True, remove_helpers=True)
rig = basemesh.parent
assert rig and rig.type == 'ARMATURE', 'MPFB did not add the rig'
rig.name = spec['name']
bones = [b.name for b in rig.data.bones]
assert len(bones) == 52 and all(b.startswith('mixamorig:') for b in bones), bones


# Materials for a real-time engine: skin and eyes solid, everything else alpha-tested (glTF MASK via a
# Round node), so nothing depends on transparency sorting. Only clothes and hair stay double-sided.
def game_material(obj):
    solid = obj is basemesh or 'low-poly' in obj.name
    for slot in obj.material_slots:
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
        if source and not solid:
            rnd = mat.node_tree.nodes.new('ShaderNodeMath')
            rnd.operation = 'ROUND'
            links.new(source, rnd.inputs[0])
            links.new(rnd.outputs[0], alpha)
        mat.surface_render_method = 'DITHERED'
        if spec.get('lean'):
            # Crowd figures are seen at a distance: no normal maps (smaller downloads).
            for link in list(bsdf.inputs['Normal'].links):
                mat.node_tree.links.remove(link)
        mat.use_backface_culling = solid or obj.name.endswith('shoes03')


# Heavy garments are decimated (weights are interpolated) so every figure stays light.
for obj in [c for c in rig.children if c.type == 'MESH' and c is not basemesh]:
    limit = spec.get('maxGarmentVerts')
    if limit and len(obj.data.vertices) > limit:
        before = len(obj.data.vertices)
        mod = obj.modifiers.new('lighten', 'DECIMATE')
        mod.ratio = limit / before
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_move_to_index(modifier=mod.name, index=0)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        print('VR_DECIMATE', obj.name, before, '->', len(obj.data.vertices))
for obj in [basemesh] + [c for c in rig.children if c.type == 'MESH' and c is not basemesh]:
    game_material(obj)
mpfb_styling.apply_style(spec, rig, basemesh)


def rot3(m):
    return m.to_3x3().normalized()


# Quaternius UAL / Unreal-style bone names -> Mixamo names (without the mixamorig: prefix).
UE = {'pelvis': 'Hips', 'spine_01': 'Spine', 'spine_02': 'Spine1', 'spine_03': 'Spine2', 'neck_01': 'Neck', 'Head': 'Head'}
for side, S in (('l', 'Left'), ('r', 'Right')):
    UE.update({f'clavicle_{side}': f'{S}Shoulder', f'upperarm_{side}': f'{S}Arm', f'lowerarm_{side}': f'{S}ForeArm', f'hand_{side}': f'{S}Hand',
               f'thigh_{side}': f'{S}UpLeg', f'calf_{side}': f'{S}Leg', f'foot_{side}': f'{S}Foot', f'ball_{side}': f'{S}ToeBase'})
    for f, F in (('index', 'Index'), ('middle', 'Middle'), ('ring', 'Ring'), ('pinky', 'Pinky'), ('thumb', 'Thumb')):
        for k in (1, 2, 3):
            UE[f'{f}_0{k}_{side}'] = f'{S}Hand{F}{k}'
UE_BACK = {'mixamorig:' + v: k for k, v in UE.items()}


def import_source(path):
    """Imports a clip's armature and returns it with a map from target bone to source bone.
    Mixamo clips match by name; HumanIK clips use Character1_ instead of mixamorig:; Quaternius UAL uses
    Unreal-style names (pelvis, thigh_l, ...)."""
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
    core = ['Hips', 'Spine', 'Neck', 'Head', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot']
    missing = [c for c in core if 'mixamorig:' + c not in names]
    assert not missing, f'{path.name} lacks {missing}'
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
    return [n for n in out if n in bones]


# 2. Bend the character's rest pose to the source T-pose (bone directions only), then apply it as rest.
if clips:
    reference, ref_names = import_source(rest_reference or clips[0][1])
    ref_rest = world_rest(reference)
    src_rest = {n: ref_rest[s] for n, s in ref_names.items()}
    rig.data.pose_position = 'POSE'
    for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    for name in order(rig):
        if name not in src_rest:
            continue
        pb = rig.pose.bones[name]
        bpy.context.view_layer.update()
        posed = rig.matrix_world @ pb.matrix
        have = (rot3(posed) @ Vector((0, 1, 0))).normalized()
        want = (rot3(src_rest[name]) @ Vector((0, 1, 0))).normalized()
        delta = have.rotation_difference(want).to_matrix().to_4x4()
        head = posed.to_translation()
        new_world = Matrix.Translation(head) @ delta @ Matrix.Translation(-head) @ posed
        pb.matrix = rig.matrix_world.inverted() @ new_world
    bpy.context.view_layer.update()
    RigService.apply_pose_as_rest_pose(rig)
    bpy.data.objects.remove(reference, do_unlink=True)

mpfb_styling.add_accessories(rig, basemesh, spec.get('accessories'), spec['name'])
tgt_rest = world_rest(rig)
tgt_rest_rot = {n: rot3(m) for n, m in tgt_rest.items()}
arm_rot_inv = rot3(rig.matrix_world).inverted()
local_rest = {b.name: b.matrix_local for b in rig.data.bones}
parent_of = {b.name: (b.parent.name if b.parent else None) for b in rig.data.bones}
names = order(rig)
for pb in rig.pose.bones:
    pb.rotation_mode = 'QUATERNION'


# 3. Retarget each clip, resampled to 24 fps. The last 0.6 s blends into the first pose so loops are seamless.
def pick_action(arm, name):
    act = bpy.data.actions.get(name) or next((a for a in bpy.data.actions if a.name.startswith(name)), None)
    assert act, f'no action {name}'
    arm.animation_data_create()
    if arm.animation_data.nla_tracks:
        for t in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(t)
    arm.animation_data.action = act
    if act.slots:
        arm.animation_data.action_slot = act.slots[0]
    return act


def retarget(name, path, span, opts=None):
    opts = opts or {}
    src, smap = import_source(path)
    scene = bpy.context.scene
    src_fps = scene.render.fps / scene.render.fps_base
    rest_all = world_rest(src)
    if opts.get('restAction'):
        # The source's bind pose is not a T-pose; its T-pose clip is the reference instead.
        ra = pick_action(src, opts['restAction'])
        scene.frame_set(int(ra.frame_range[0]))
        rest_all = {b.name: src.matrix_world @ src.pose.bones[b.name].matrix for b in src.data.bones}
    if opts.get('action'):
        pick_action(src, opts['action'])
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
        want = {}
        for n in names:
            if n in smap:
                w = rot3(src.matrix_world @ src.pose.bones[smap[n]].matrix) @ s_rest_inv[n] @ tgt_rest_rot[n]
                want[n] = arm_rot_inv @ w
        pose = {}
        for n in names:
            if n not in want:
                continue
            rest = local_rest[n].to_3x3()
            p = parent_of[n]
            if p and p in want:
                basis = rest.inverted() @ local_rest[p].to_3x3() @ want[p].inverted() @ want[n]
            elif p:
                basis = rest.inverted() @ local_rest[p].to_3x3() @ tgt_rest_rot[p].inverted() @ rot3(rig.matrix_world) @ want[n]
            else:
                basis = rest.inverted() @ want[n]
            pose[n] = basis.to_quaternion()
        poses.append(pose)
        sh = (src.matrix_world @ src.pose.bones[smap[hips]].matrix).to_translation() - s_rest[hips].to_translation()
        if first is None:
            first = sh.copy()
        head_world = tgt_rest[hips].to_translation() + Vector((first.x, first.y, sh.z)) * ratio
        head_arm = rig.matrix_world.inverted() @ head_world
        hip_locs.append(local_rest[hips].to_3x3().inverted() @ (head_arm - local_rest[hips].to_translation()))
    blend = 0 if opts.get('loop') == 'exact' else min(int(0.6 * FPS), count // 3)
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

# 4. Export with one NLA track per clip, in rest pose.
rig.animation_data_create()
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
if spec.get('save_blend'):
    bpy.ops.wm.save_as_mainfile(filepath=str(output_path.with_suffix('.blend')))
bpy.ops.export_scene.gltf(filepath=str(output_path), export_format='GLB',
    export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
    export_nla_strips=True, export_optimize_animation_size=True, export_image_format='AUTO',
    export_apply=False)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print('VR_CHARACTER', spec['name'], 'meshes', len(meshes), 'verts', sum(len(o.data.vertices) for o in meshes))
print('VR_EXPORT', output_path, output_path.stat().st_size)
