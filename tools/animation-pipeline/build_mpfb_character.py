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

args = sys.argv[sys.argv.index('--') + 1:]
spec = json.loads(Path(args[0]).read_text(encoding='utf-8'))
output_path = Path(args[1])
clips = []
for item in args[2:]:
    name, src = item.split('=', 1)
    frames = None
    if ':' in src[3:]:
        src, rng = src.rsplit(':', 1)
        frames = tuple(int(v) for v in rng.split('-'))
    clips.append((name, Path(src), frames))

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# 1. The character.
info = HumanService._create_default_human_info_dict()
info['phenotype'].update({k: v for k, v in spec['phenotype'].items() if k != 'race'})
info['phenotype']['race'].update(spec['phenotype'].get('race', {}))
info.update({
    'name': spec['name'], 'rig': 'mixamo',
    'eyes': 'low-poly.mhclo', 'eyebrows': spec.get('eyebrows', 'eyebrow001') + '.mhclo',
    'eyelashes': spec.get('eyelashes', 'eyelashes01') + '.mhclo', 'hair': spec['hair'] + '.mhclo',
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
        mat.use_backface_culling = solid or obj.name.endswith('shoes03')


for obj in [basemesh] + [c for c in rig.children if c.type == 'MESH' and c is not basemesh]:
    game_material(obj)


def rot3(m):
    return m.to_3x3().normalized()


def import_source(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(path), use_anim=True)
    new = set(bpy.data.objects) - before
    arm = next(o for o in new if o.type == 'ARMATURE')
    for o in new:
        if o != arm:
            bpy.data.objects.remove(o, do_unlink=True)
    missing = set(bones) - {b.name for b in arm.data.bones}
    assert not missing, f'{path.name} lacks {sorted(missing)[:4]}'
    return arm


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
    reference = import_source(clips[0][1])
    src_rest = world_rest(reference)
    rig.data.pose_position = 'POSE'
    for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    for name in order(rig):
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

tgt_rest = world_rest(rig)
tgt_rest_rot = {n: rot3(m) for n, m in tgt_rest.items()}
arm_rot_inv = rot3(rig.matrix_world).inverted()
local_rest = {b.name: b.matrix_local for b in rig.data.bones}
parent_of = {b.name: (b.parent.name if b.parent else None) for b in rig.data.bones}
names = order(rig)
for pb in rig.pose.bones:
    pb.rotation_mode = 'QUATERNION'


# 3. Retarget each clip.
def retarget(name, path, frames):
    src = import_source(path)
    s_rest = world_rest(src)
    s_rest_inv = {n: rot3(m).inverted() for n, m in s_rest.items()}
    action = src.animation_data.action
    start, end = frames or (int(action.frame_range[0]), int(action.frame_range[1]))
    hips = 'mixamorig:Hips'
    ratio = tgt_rest[hips].to_translation().z / s_rest[hips].to_translation().z
    out = bpy.data.actions.new(name)
    rig.animation_data_create()
    rig.animation_data.action = out
    scene = bpy.context.scene
    first = None
    for f in range(start, end + 1):
        scene.frame_set(f)
        want = {}
        for n in names:
            w = rot3(src.matrix_world @ src.pose.bones[n].matrix) @ s_rest_inv[n] @ tgt_rest_rot[n]
            want[n] = arm_rot_inv @ w
        for n in names:
            rest = local_rest[n].to_3x3()
            p = parent_of[n]
            if p:
                basis = rest.inverted() @ local_rest[p].to_3x3() @ want[p].inverted() @ want[n]
            else:
                basis = rest.inverted() @ want[n]
            pb = rig.pose.bones[n]
            pb.rotation_quaternion = basis.to_quaternion()
            pb.keyframe_insert('rotation_quaternion', frame=f - start + 1, group=n)
        sh = (src.matrix_world @ src.pose.bones[hips].matrix).to_translation() - s_rest[hips].to_translation()
        if first is None:
            first = sh.copy()
        offset = Vector((first.x, first.y, sh.z)) * ratio
        head_world = tgt_rest[hips].to_translation() + offset
        head_arm = rig.matrix_world.inverted() @ head_world
        pbh = rig.pose.bones[hips]
        pbh.location = local_rest[hips].to_3x3().inverted() @ (head_arm - local_rest[hips].to_translation())
        pbh.keyframe_insert('location', frame=f - start + 1, group=hips)
    rig.animation_data.action = None
    bpy.data.objects.remove(src, do_unlink=True)
    for a in list(bpy.data.actions):
        if a is not out and a.users == 0:
            bpy.data.actions.remove(a)
    out.use_fake_user = True
    print('VR_CLIP', name, path.name, start, end)
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
if len(args) and spec.get('save_blend'):
    bpy.ops.wm.save_as_mainfile(filepath=str(output_path.with_suffix('.blend')))
bpy.ops.export_scene.gltf(filepath=str(output_path), export_format='GLB',
    export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
    export_nla_strips=True, export_optimize_animation_size=True, export_image_format='AUTO',
    export_apply=False)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print('VR_CHARACTER', spec['name'], 'meshes', len(meshes), 'verts', sum(len(o.data.vertices) for o in meshes))
print('VR_EXPORT', output_path, output_path.stat().st_size)
