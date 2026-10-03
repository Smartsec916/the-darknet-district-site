"""Blender 5.2: build an isolated Mara-style animation proof of concept.

blender -b --factory-startup --python build_poc.py -- IDLE.fbx CLAP.fbx OUT.glb
The inputs remain untouched. This is a prototype, not a batch converter.
"""
import bpy
import sys
from pathlib import Path
from mathutils import Matrix, Vector

idle_path, clap_path, output_path = map(Path, sys.argv[sys.argv.index('--') + 1:])
bpy.ops.wm.read_factory_settings(use_empty=True)


def import_motion(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(path), use_anim=True)
    imported = set(bpy.data.objects) - before
    armature = next(obj for obj in imported if obj.type == 'ARMATURE')
    action = armature.animation_data.action
    return armature, action, imported


rig, idle_source, first_objects = import_motion(idle_path)
idle = idle_source.copy()
idle.name = 'idle_fighting'
clap_rig, clap_source, second_objects = import_motion(clap_path)
assert [b.name for b in rig.data.bones] == [b.name for b in clap_rig.data.bones], 'Mixamo skeletons differ'
clap = clap_source.copy()
clap.name = 'clap_slow'

for obj in second_objects:
    bpy.data.objects.remove(obj, do_unlink=True)
for obj in first_objects:
    if obj != rig:
        bpy.data.objects.remove(obj, do_unlink=True)

rig.name = 'VR_Humanoid_v1'
rig.data.name = 'VR_Humanoid_v1_skeleton'


def make_in_place(action):
    # The FBX clips contain actor translation. Keep vertical motion; gameplay owns X/Z.
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    if curve.data_path.endswith('mixamorig:Hips"].location') and curve.array_index in (0, 2):
                        origin = curve.keyframe_points[0].co.y
                        for key in curve.keyframe_points:
                            delta = origin - key.co.y
                            key.co.y += delta
                            key.handle_left.y += delta
                            key.handle_right.y += delta
                        curve.update()


for action in (idle, clap):
    make_in_place(action)


def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    surface = m.node_tree.nodes.get('Principled BSDF')
    surface.inputs['Base Color'].default_value = (*color, 1)
    surface.inputs['Roughness'].default_value = .9
    return m


coat = material('Mara practical olive coat', (0.25, 0.32, 0.22))
trousers = material('Mara work trousers', (0.16, 0.19, 0.18))
skin = material('Mara skin', (0.58, 0.34, 0.24))
hair = material('Mara silver hair', (0.62, 0.64, 0.64))
boots = material('Mara work boots', (0.10, 0.12, 0.12))


def part(name, bone_name, radius, length, mat, offset=(0, 0, 0)):
    bone = rig.data.bones['mixamorig:' + bone_name]
    direction = bone.tail_local - bone.head_local
    center = (bone.head_local + bone.tail_local) / 2 + Vector(offset)
    rotation = direction.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    transform = Matrix.Translation(center) @ rotation @ Matrix.Diagonal((radius, radius, length / 2, 1))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6)
    obj = bpy.context.object
    obj.name = name
    obj.data.transform(transform)
    obj.matrix_world = rig.matrix_world.copy()
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.matrix_world = world
    obj.data.materials.append(mat)
    group = obj.vertex_groups.new(name=bone.name)
    group.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
    modifier = obj.modifiers.new('VR humanoid skin', 'ARMATURE')
    modifier.object = rig
    return obj


part('coat torso', 'Spine2', 22, 42, coat)
part('coat waist', 'Hips', 18, 24, coat)
part('head', 'Head', 10, 22, skin)
part('silver hair', 'Head', 11, 9, hair, (0, 9, 0))
for side in ('Left', 'Right'):
    part(side+' upper sleeve', side+'Arm', 7, 27, coat)
    part(side+' lower sleeve', side+'ForeArm', 6, 25, coat)
    part(side+' hand', side+'Hand', 5, 12, skin)
    part(side+' thigh', side+'UpLeg', 10, 43, trousers)
    part(side+' shin', side+'Leg', 7, 43, trousers)
    part(side+' boot', side+'Foot', 8, 20, boots)

rig.animation_data_clear()
rig.animation_data_create()
for name, action, end in (('idle_fighting', idle, 145), ('clap_slow', clap, 145)):
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 1, action)
    strip.action_frame_start = 1
    strip.action_frame_end = min(end, action.frame_range[1])
    strip.action_slot = action.slots[0]

bpy.context.scene.frame_set(1)
output_path.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output_path), export_format='GLB',
    export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
    export_nla_strips=True, export_optimize_animation_size=True)
print('VR_POC_EXPORT', output_path, output_path.stat().st_size)
