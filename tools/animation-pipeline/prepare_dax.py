"""Blender 5.2: prepare the bought "Realistic Cyberpunk Girl" (cyberpunk-girl.blend, CGTrader) for build_imported_character.py. She is Dax in the game (the owner, 15 Nov 2026),
in the BLACK outfit, which is the texture set the file already wears.

blender -b --factory-startup --disable-autoexec cyberpunk-girl.blend --python prepare_dax.py -- OUT.blend SPEC_OUT.json

The source .blend is opened, never saved over (--disable-autoexec: its Rigify UI script does not run).
What it does, and why:
- Keeps her seven meshes (body, suit, hair, brows, lashes, eyes, mouth) and the generated Rigify rig; the widgets and the metarig go.
- The rig is reduced to its deform bones with a clean parent chain (Rigify parents limbs to non-deform ORG/MCH bones), as for Ava. The 98 face bones are
  folded into the head: the game has no facial animation for her, and a skeleton of about 75 bones is lighter than one of 176.
- Materials are rebuilt as plain Principled BSDF from the images each source material uses (colour, normal, roughness, metallic, emission), and the images
  are made smaller (the suit and head 1024, small parts 512 or 256): the source's 2048 maps are far more than a figure seen from a few metres needs.
- Writes the bone map for the converter spec (only the bones this rig really has), so the spec in the repository can be checked against it.
"""
import bpy
import json
import sys
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:]
out = Path(args[0])
spec_out = Path(args[1]) if len(args) > 1 else None
KEEP = ['Body', 'Sci-fi - Body', 'Hair', 'Eyebrows', 'Eyelashes', 'Eyes', 'Mouth']
RIG = 'rig'
HEAD = 'DEF-spine.006'
FACE = ('lid', 'lip', 'brow', 'cheek', 'nose', 'chin', 'jaw', 'ear.', 'teeth', 'tongue', 'forehead', 'temple', 'eye')

for o in list(bpy.data.objects):
    if o.name not in KEEP and o.name != RIG:
        bpy.data.objects.remove(o, do_unlink=True)
rig = bpy.data.objects[RIG]
meshes = [bpy.data.objects[n] for n in KEEP]
scene = bpy.context.scene
for o in [rig] + meshes:
    if o.name not in scene.collection.objects:
        scene.collection.objects.link(o)
    for c in list(o.users_collection):
        if c != scene.collection:
            c.objects.unlink(o)
    o.hide_set(False)
    o.hide_render = False

# Rest pose, no drivers or constraints.
rig.animation_data_clear()
for pb in rig.pose.bones:
    for c in list(pb.constraints):
        pb.constraints.remove(c)
    pb.matrix_basis.identity()
bpy.context.view_layer.update()
for o in meshes:
    for m in list(o.modifiers):
        if m.type != 'ARMATURE':
            print('DROP_MOD', o.name, m.type, m.name)
            o.modifiers.remove(m)

# Deform-only skeleton with a clean chain (see prepare_ava.py); face bones fold into the head.
arm = rig.data
deform = {b.name for b in arm.bones if b.use_deform}
face = {n for n in deform if any(k in n for k in FACE) and n != HEAD}
for o in meshes:
    head = o.vertex_groups.get(HEAD) or o.vertex_groups.new(name=HEAD)
    groups = {g.index: g.name for g in o.vertex_groups}
    add = {}
    for v in o.data.vertices:
        w = sum(g.weight for g in v.groups if groups.get(g.group) in face)
        if w > 0:
            add[v.index] = w
    for i, w in add.items():
        head.add([i], w, 'ADD')
    for g in list(o.vertex_groups):
        if g.name in face:
            o.vertex_groups.remove(g)
    print('FACE_FOLD', o.name, len(add), 'vertices')
deform -= face
explicit = {'DEF-shoulder.L': 'DEF-spine.003', 'DEF-shoulder.R': 'DEF-spine.003', 'DEF-upper_arm.L': 'DEF-shoulder.L', 'DEF-upper_arm.R': 'DEF-shoulder.R',
            'DEF-thigh.L': 'DEF-spine', 'DEF-thigh.R': 'DEF-spine', 'DEF-pelvis.L': 'DEF-spine', 'DEF-pelvis.R': 'DEF-spine',
            'DEF-breast.L': 'DEF-spine.003', 'DEF-breast.R': 'DEF-spine.003', 'DEF-ponytail.01': HEAD}
for s in ('L', 'R'):
    for f in ('f_index', 'thumb', 'f_middle', 'f_ring', 'f_pinky'):
        explicit[f'DEF-{f}.01.{s}'] = f'DEF-hand.{s}'
    for p in ('01', '02', '03', '04'):
        explicit[f'DEF-palm.{p}.{s}'] = f'DEF-hand.{s}'


def deform_parent(b):
    if b.name in explicit and explicit[b.name] in deform:
        return explicit[b.name]
    p = b.parent
    while p:
        if p.name in deform and p.name != b.name:
            return p.name
        twin = 'DEF-' + p.name[4:] if p.name.startswith(('ORG-', 'MCH-')) else None
        if twin in deform and twin != b.name:
            return twin
        p = p.parent
    return None


parents = {n: deform_parent(arm.bones[n]) for n in deform}
bpy.context.view_layer.objects.active = rig
for o in bpy.context.selected_objects:
    o.select_set(False)
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.edit_bones
for n, p in parents.items():
    eb[n].parent = eb[p] if p else None
    eb[n].use_connect = False
for b in list(eb):
    if b.name not in deform:
        eb.remove(b)
bpy.ops.object.mode_set(mode='OBJECT')
print('RIG', len(arm.bones), 'bones; roots', [b.name for b in arm.bones if not b.parent])


def img(name, size=None):
    im = bpy.data.images.get(name)
    if im and size and (im.size[0] > size[0] or im.size[1] > size[1]):
        im.scale(size[0], size[1])
        im.pack()
    return im


def principled(mat, bc=None, n=None, r=None, m=None, e=None, color=None, rough=.6, metal=0.0, alpha=False, size=(1024, 1024)):
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(p.outputs[0], o.inputs[0])

    def tex(name, data=False):
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = img(name, size)
        assert t.image, 'missing image ' + name
        if data:
            t.image.colorspace_settings.name = 'Non-Color'
        return t
    if bc:
        t = tex(bc)
        nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
        if alpha:
            nt.links.new(t.outputs['Alpha'], p.inputs['Alpha'])
    else:
        p.inputs['Base Color'].default_value = color or (.8, .8, .8, 1)
    if n:
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(tex(n, True).outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs[0], p.inputs['Normal'])
    if r:
        nt.links.new(tex(r, True).outputs['Color'], p.inputs['Roughness'])
    else:
        p.inputs['Roughness'].default_value = rough
    if m:
        nt.links.new(tex(m, True).outputs['Color'], p.inputs['Metallic'])
    else:
        p.inputs['Metallic'].default_value = metal
    if e:
        nt.links.new(tex(e).outputs['Color'], p.inputs['Emission Color'])
        p.inputs['Emission Strength'].default_value = 1.0
    mat.blend_method = 'HASHED' if alpha else 'OPAQUE'


M = bpy.data.materials
principled(M['Sci-fi - Body'], 'Sci-fi-Bod_89F362_BaseColor.png', 'Sci-fi-Bod_89F362_Normal.png', 'Sci-fi-Bod_89F362_Roughness.png', 'Sci-fi-Bod_89F362_Metallic.png', 'Sci-fi-Bod_89F362_Emission.png')
principled(M['Armor Torso'], 'Body001_C929E7_BaseColor.png', 'Body001_C929E7_Normal.png', 'Body001_C929E7_Roughness.png', 'Body001_C929E7_Metallic.png', size=(512, 512))
principled(M['Head'], 'Body_AC101B_BaseColor.png.001', 'Body_AC101B_Normal.png', 'Body_AC101B_Roughness.png')
principled(M['Eyes'], 'Eyes_AE6E9B_BaseColor.png', rough=.15, size=(256, 256))
principled(M['Mouth'], 'Mouth_D39F27_BaseColor.png', rough=.4, size=(256, 256))
principled(M['Material'], 'Hair_BaseColor_2.png', 'Hair_Normal.png', 'Hair_Roughness.png', alpha=True, size=(1024, 512))
principled(M['Eyelashes'], 'Eyelashes _BaseColor+Alpha.png', rough=.6, alpha=True, size=(512, 512))
principled(M['Eyebrows'], color=(.035, .028, .024, 1), rough=.7)
for name in ('Eyes_Moisture', 'Dots Stroke'):
    if name in M:
        principled(M[name], color=(1, 1, 1, 1), rough=.05)
for im in list(bpy.data.images):
    if im.users == 0:
        bpy.data.images.remove(im)

# The bone map for the converter spec: Rigify deform names -> the game's Mixamo names, only for bones this rig has.
MAP = {'DEF-spine': 'Hips', 'DEF-spine.001': 'Spine', 'DEF-spine.002': 'Spine1', 'DEF-spine.003': 'Spine2', 'DEF-spine.004': 'Neck', 'DEF-spine.006': 'Head'}
for s, S in (('L', 'Left'), ('R', 'Right')):
    MAP.update({f'DEF-shoulder.{s}': S + 'Shoulder', f'DEF-upper_arm.{s}': S + 'Arm', f'DEF-forearm.{s}': S + 'ForeArm', f'DEF-hand.{s}': S + 'Hand',
                f'DEF-thigh.{s}': S + 'UpLeg', f'DEF-shin.{s}': S + 'Leg', f'DEF-foot.{s}': S + 'Foot', f'DEF-toe.{s}': S + 'ToeBase'})
    for f, F in (('thumb', 'Thumb'), ('f_index', 'Index'), ('f_middle', 'Middle'), ('f_ring', 'Ring'), ('f_pinky', 'Pinky')):
        for k in (1, 2, 3):
            MAP[f'DEF-{f}.0{k}.{s}'] = f'{S}Hand{F}{k}'
have = {b.name for b in arm.bones}
bones = {k: v for k, v in MAP.items() if k in have}
print('BONE_MAP', len(bones), 'of', len(MAP), 'missing', sorted(set(MAP) - have))
if spec_out:
    spec_out.write_text(json.dumps({'bones': bones, 'allBones': sorted(have), 'tris': {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes}}, indent=1), encoding='utf-8')
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(out), compress=True)
print('PREPARED', out)
