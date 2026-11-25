"""Shared humanoid animation library: retarget motion-capture clips onto one of our characters' skeletons and write them as a
skeleton-only GLB (no mesh) that the game applies to every character with that skeleton (void-runner/anim-library.js).

  python retarget_library.py <target character .glb> <library.json> <out.glb>

library.json: {"fps": 30, "clips": [{"name": "ac-sit-bench-1", "file": "/abs/path/sit_bench01.fbx", "span": [t0, t1] (seconds, optional),
               "loop": true, "root": "inplace" | "free"}]}
  root "inplace": the hips keep their height changes but stay over the start point (a dance or a pose that must not wander);
  root "free": the hips move as recorded, from the character's own spot (sitting down, lying down).
Source skeletons understood: Reallusion CC3/CC3+ (ActorCore exports), Mixamo, HumanIK and Unreal names.
The source files are licensed downloads and never go into this repository; only this script does. Runs in Blender or with the bpy module.
"""
import bpy, sys, json, math
from mathutils import Matrix, Vector, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
target_path, lib_path, out_path = argv[:3]
lib = json.load(open(lib_path))
FPS = lib.get('fps', 30)

CC = {'Hips': 'CC_Base_Hip', 'Spine': 'CC_Base_Waist', 'Spine1': 'CC_Base_Spine01', 'Spine2': 'CC_Base_Spine02', 'Neck': 'CC_Base_NeckTwist01', 'Head': 'CC_Base_Head'}
for s, S in (('L', 'Left'), ('R', 'Right')):
    CC.update({f'{S}Shoulder': f'CC_Base_{s}_Clavicle', f'{S}Arm': f'CC_Base_{s}_Upperarm', f'{S}ForeArm': f'CC_Base_{s}_Forearm', f'{S}Hand': f'CC_Base_{s}_Hand',
               f'{S}UpLeg': f'CC_Base_{s}_Thigh', f'{S}Leg': f'CC_Base_{s}_Calf', f'{S}Foot': f'CC_Base_{s}_Foot', f'{S}ToeBase': f'CC_Base_{s}_ToeBase'})
    for f, F in (('Index', 'Index'), ('Mid', 'Middle'), ('Ring', 'Ring'), ('Pinky', 'Pinky'), ('Thumb', 'Thumb')):
        for k in (1, 2, 3):
            CC[f'{S}Hand{F}{k}'] = f'CC_Base_{s}_{f}{k}'
UE = {'Hips': 'pelvis', 'Spine': 'spine_01', 'Spine1': 'spine_02', 'Spine2': 'spine_03', 'Neck': 'neck_01', 'Head': 'Head'}
for s, S in (('l', 'Left'), ('r', 'Right')):
    UE.update({f'{S}Shoulder': f'clavicle_{s}', f'{S}Arm': f'upperarm_{s}', f'{S}ForeArm': f'lowerarm_{s}', f'{S}Hand': f'hand_{s}', f'{S}UpLeg': f'thigh_{s}', f'{S}Leg': f'calf_{s}', f'{S}Foot': f'foot_{s}', f'{S}ToeBase': f'ball_{s}'})

rot3 = lambda m: m.to_3x3().normalized()

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def bare(name):
    n = name.split(':')[-1]
    aliases = {'Chest':'Spine2', 'LeftUpperArm':'LeftArm', 'RightUpperArm':'RightArm',
               'LeftUpperLeg':'LeftUpLeg', 'RightUpperLeg':'RightUpLeg',
               'LeftLowerLeg':'LeftLeg', 'RightLowerLeg':'RightLeg',
               'LeftToes':'LeftToeBase', 'RightToes':'RightToeBase'}
    return aliases.get(n,n)

# ---- the target: one of our characters; only its armature is kept ----
clear_scene()
bpy.ops.import_scene.gltf(filepath=target_path)
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
for o in list(bpy.data.objects):
    if o != rig and o.type != 'EMPTY':
        bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)
rig.animation_data_clear()
bpy.context.view_layer.update()
tb = {bare(b.name): b.name for b in rig.data.bones}                      # bare name -> the rig's own bone name
order = []
def walk(b):
    order.append(b.name)
    for c in b.children: walk(c)
for b in rig.data.bones:
    if b.parent is None: walk(b)
t_rest = {b.name: rig.matrix_world @ b.matrix_local for b in rig.data.bones}
t_local = {b.name: (b.parent.matrix_local.inverted() @ b.matrix_local) if b.parent else b.matrix_local.copy() for b in rig.data.bones}
t_parent = {b.name: b.parent.name if b.parent else None for b in rig.data.bones}
for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'
rig_rot_inv = rot3(rig.matrix_world).inverted()

# Which bone each bone points at (bare names): the next one along its limb. Bones not listed here (head, toes, finger tips) are not re-aimed.
NEXT = {'Hips': 'Spine', 'Spine': 'Spine1', 'Spine1': 'Spine2', 'Spine2': 'Neck', 'Neck': 'Head'}
for S in ('Left', 'Right'):
    NEXT.update({f'{S}Shoulder': f'{S}Arm', f'{S}Arm': f'{S}ForeArm', f'{S}ForeArm': f'{S}Hand', f'{S}Hand': f'{S}HandMiddle1', f'{S}UpLeg': f'{S}Leg', f'{S}Leg': f'{S}Foot', f'{S}Foot': f'{S}ToeBase'})
    for F in ('Index', 'Middle', 'Ring', 'Pinky', 'Thumb'):
        NEXT.update({f'{S}Hand{F}1': f'{S}Hand{F}2', f'{S}Hand{F}2': f'{S}Hand{F}3'})

def direction(rest, name, nxt):
    """World direction from a bone to the next bone along its limb, at rest (None when there is no next bone)."""
    if nxt is None or nxt not in rest: return None
    v = rest[nxt].to_translation() - rest[name].to_translation()
    return v.normalized() if v.length > 1e-5 else None


def retarget(clip):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=clip['file'], use_anim=True, automatic_bone_orientation=False)
    new = set(bpy.data.objects) - before
    src = next(o for o in new if o.type == 'ARMATURE')
    for o in new:
        if o != src: bpy.data.objects.remove(o, do_unlink=True)
    have = {b.name for b in src.data.bones}
    smap = {}
    for bn, full in tb.items():
        for cand in (CC.get(bn), 'mixamorig:' + bn, bn, 'Character1_' + bn, UE.get(bn)):
            if cand and cand in have: smap[full] = cand; break
    hips = tb['Hips']
    assert hips in smap, 'source has no hips: ' + clip['file']
    scene = bpy.context.scene
    act = src.animation_data.action
    src_fps = scene.render.fps / scene.render.fps_base
    f0, f1 = act.frame_range
    # the source's rest pose in world space, and for each mapped bone the turn that bends OUR rest bone to point the way the source's rest bone points
    s_rest = {b.name: src.matrix_world @ b.matrix_local for b in src.data.bones}
    mapped_src = {v: k for k, v in smap.items()}
    s_rest_m = {smap[n]: s_rest[smap[n]] for n in smap}
    bent = {}
    for n in smap:
        nxt = tb.get(NEXT.get(bare(n)))
        ds = direction(s_rest, smap[n], smap.get(nxt)) if nxt in smap else None
        dt = direction(t_rest, n, nxt) if nxt in smap else None
        bent[n] = (dt.rotation_difference(ds).to_matrix() @ rot3(t_rest[n])) if ds and dt else rot3(t_rest[n])
    s_inv = {n: rot3(s_rest[smap[n]]).inverted() for n in smap}
    t0, t1 = clip.get('span') or (0.0, (f1 - f0) / src_fps)
    t1 = min(t1, (f1 - f0) / src_fps)
    count = int((t1 - t0) * FPS) + 1
    feet = [tb[b] for b in ('LeftFoot','RightFoot') if tb.get(b) in smap]
    if not feet:
        raise ValueError('Foot alignment requires at least one mapped foot.')
    t_height = t_rest[hips].translation.z - min(t_rest[n].translation.z for n in feet)
    s_height = s_rest[smap[hips]].translation.z - min(s_rest[smap[n]].translation.z for n in feet)
    studio_rig = rig.data.bones.get('LeftUpperArm') and rig.data.bones.get('Chest')
    ratio = t_height / max(1e-4,s_height) if studio_rig else t_rest[hips].translation.z / max(1e-4,s_rest[smap[hips]].translation.z)
    poses, locs, first = [], [], None
    for k in range(count):
        f = f0 + (t0 + k / FPS) * src_fps
        scene.frame_set(int(f), subframe=f - int(f))
        world, pose = {}, {}
        for n in order:
            p = t_parent[n]
            if n in smap:
                world[n] = rig_rot_inv @ rot3(src.matrix_world @ src.pose.bones[smap[n]].matrix) @ s_inv[n] @ bent[n]
            elif p in world:
                world[n] = world[p] @ rot3(t_rest[p]).inverted() @ rot3(t_rest[n]); continue
            else:
                continue
            rest = t_local[n].to_3x3().normalized() if p else rot3(rig.data.bones[n].matrix_local)
            if p and p in world:
                basis = rest.inverted() @ world[p].inverted() @ world[n]
            elif p:
                basis = rest.inverted() @ (rig_rot_inv @ rot3(t_rest[p])).inverted() @ world[n]
            else:
                basis = rest.inverted() @ world[n]
            pose[n] = basis.to_quaternion()
        poses.append(pose)
        sh = (src.matrix_world @ src.pose.bones[smap[hips]].matrix).to_translation()
        if first is None: first = sh.copy()
        d = sh - s_rest[smap[hips]].to_translation()
        if clip.get('root', 'inplace') == 'inplace':
            d = Vector((first.x - s_rest[smap[hips]].to_translation().x, first.y - s_rest[smap[hips]].to_translation().y, d.z))
            d = Vector((0, 0, d.z))
        else:
            d = Vector((sh.x - first.x, sh.y - first.y, d.z))
        head_world = t_rest[hips].to_translation() + d * ratio
        head_arm = rig.matrix_world.inverted() @ head_world
        hb = rig.data.bones[hips]
        locs.append(hb.matrix_local.to_3x3().inverted() @ (head_arm - hb.matrix_local.to_translation()))
    if clip.get('loop', True):
        blend = min(int(0.8 * FPS), count // 3)
        for j in range(blend):
            k = count - blend + j; w = (j + 1) / blend
            for n, q in poses[k].items():
                a = q.copy()
                if a.dot(poses[0][n]) < 0: a.negate()
                poses[k][n] = a.slerp(poses[0][n], w)
            locs[k] = locs[k].lerp(locs[0], w)
    out = bpy.data.actions.new(clip['name'])
    rig.animation_data_create(); rig.animation_data.action = out
    prev = {}
    for k, pose in enumerate(poses):
        for n, q in pose.items():
            if n in prev and q.dot(prev[n]) < 0: q.negate()
            prev[n] = q.copy()
            pb = rig.pose.bones[n]; pb.rotation_quaternion = q; pb.keyframe_insert('rotation_quaternion', frame=k + 1, group=n)
        pbh = rig.pose.bones[hips]; pbh.location = locs[k]; pbh.keyframe_insert('location', frame=k + 1, group=hips)
    out.use_fake_user = True
    track = rig.animation_data.nla_tracks.new(); track.name = clip['name']
    strip = track.strips.new(clip['name'], 1, out); strip.name = clip['name']
    rig.animation_data.action = None
    bpy.data.objects.remove(src, do_unlink=True)
    return {'name': clip['name'], 'frames': count, 'seconds': round(count / FPS, 2), 'mapped': len(smap)}

bpy.context.scene.render.fps = FPS
report = [retarget(c) for c in lib['clips']]
for pb in rig.pose.bones:
    pb.rotation_quaternion = Quaternion(); pb.location = Vector()
bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_force_sampling=True, export_optimize_animation_size=True, export_skins=False, export_yup=True, export_frame_range=False)
print('LIBRARY', json.dumps(report))
