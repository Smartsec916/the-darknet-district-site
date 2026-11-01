"""Blender 5.2: prepare "PrettyGirl_01" (SK_PrettyGirl_01_var1.fbx and its textures folder) for
build_imported_character.py.

blender -b --factory-startup --python prepare_prettygirl.py -- SK_PrettyGirl_01_var1.fbx TEXTURES_DIR OUT.blend

The FBX's material paths point at the author's machine, so every material is rebuilt from the supplied
textures (Unreal ORM packing: occlusion R, roughness G, metallic B). The look is the one chosen for the game:
face 05, natural hair, brown eyes, body tone 01. The slip dress and slippers share one texture atlas that comes
in four prints; the model carries the white one, and the game swaps in the others as textures.
"""
import bpy
import sys
from pathlib import Path

src, tex, out = (Path(a) for a in sys.argv[sys.argv.index('--') + 1:][:3])

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
# Unreal bones point along X; automatic orientation points them along Y (as the converter's retargeting expects).
bpy.ops.import_scene.fbx(filepath=str(src), use_anim=False, automatic_bone_orientation=True)

# Automatic orientation aims a bone at one of its children, which goes wrong where a bone has several: the head
# pointed back at its hair bones (so every clip tipped her head over). The body chain is aimed explicitly: each
# bone at the next joint along the body, the head straight up. Skin and bind pose follow the rest pose, so the
# mesh is unchanged.
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones
aims = {'pelvis': 'spine_01', 'spine_01': 'spine_02', 'spine_02': 'spine_03', 'spine_03': 'spine_04', 'spine_04': 'spine_05',
        'spine_05': 'neck_01', 'neck_01': 'neck_02', 'neck_02': 'head'}
for s in ('l', 'r'):
    aims.update({f'clavicle_{s}': f'upperarm_{s}', f'upperarm_{s}': f'lowerarm_{s}', f'lowerarm_{s}': f'hand_{s}', f'hand_{s}': f'middle_01_{s}',
                 f'thigh_{s}': f'calf_{s}', f'calf_{s}': f'foot_{s}', f'foot_{s}': f'ball_{s}'})
for bone, child in aims.items():
    b, c = eb.get(bone), eb.get(child)
    if b and c and (c.head - b.head).length > 1e-4:
        b.tail = c.head.copy()
head = eb.get('head')
if head:
    head.tail = head.head + (eb['neck_02'].tail - eb['neck_02'].head).normalized() * .18 if eb.get('neck_02') else head.head + type(head.head)((0, 0, .18))
bpy.ops.object.mode_set(mode='OBJECT')
print('AIMED', len(aims), 'bones; head', tuple(round(v, 3) for v in (rig.data.bones['head'].tail_local - rig.data.bones['head'].head_local)))


def img(rel, data=False):
    im = bpy.data.images.load(str(tex / rel), check_existing=True)
    if data:
        im.colorspace_settings.name = 'Non-Color'
    return im


def principled(mat, bc=None, n=None, orm=None, alpha=None, bc_alpha=False, color=None, rough=None, metal=None):
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(p.outputs[0], o.inputs[0])
    tex_node = lambda im: (lambda t: (setattr(t, 'image', im), t)[1])(nt.nodes.new('ShaderNodeTexImage'))
    if bc:
        t = tex_node(img(bc))
        nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
        if bc_alpha:
            nt.links.new(t.outputs['Alpha'], p.inputs['Alpha'])
    if color:
        p.inputs['Base Color'].default_value = color
    if alpha:
        t = tex_node(img(alpha, True))
        nt.links.new(t.outputs['Color'], p.inputs['Alpha'])
    if n:
        t = tex_node(img(n, True))
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs[0], p.inputs['Normal'])
    if orm:
        t = tex_node(img(orm, True))
        sep = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(t.outputs['Color'], sep.inputs[0])
        nt.links.new(sep.outputs[1], p.inputs['Roughness'])
        nt.links.new(sep.outputs[2], p.inputs['Metallic'])
    if rough is not None:
        p.inputs['Roughness'].default_value = rough
    if metal is not None:
        p.inputs['Metallic'].default_value = metal


skin = dict(bc='Body/T_Body_01_BC.png', n='Body/T_Body_01_N.png', orm='Body/T_Body_ORM.png')
specs = {
    'body': skin,
    'head': dict(bc='Body/T_Head_05_BC.png', n='Body/T_Head_N.png', orm='Body/T_Head_ORM.png'),
    'eye_r': dict(bc='Eyes/T_Eyes_Brown_BC.png', rough=.08), 'eye_l': dict(bc='Eyes/T_Eyes_Brown_BC.png', rough=.08),
    'teeth': dict(bc='Body/T_Teeth_BC.png', orm='Body/T_Teeth_ORM.png'),
    'lashes': dict(color=(.02, .015, .01, 1), alpha='Hair/T_Lashes_Alpha.png', rough=.6),
    'hair': dict(bc='Hair/T_Hair_Natural_BC.png', alpha='Hair/T_Hair_Alpha.png', rough=.45),
    'jewelry': dict(color=(1, .78, .4, 1), metal=1, rough=.25),
}
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    for slot in o.material_slots:
        m = slot.material
        base = m.name.rstrip('0123456789.') if m else None
        if base in specs:
            principled(m, **specs[base])
        elif base != 'cloth':
            print('MATERIAL_AS_IS', m.name if m else None)

# One dress and slippers, in the white print (David's default) on one material, "cloth"; the other prints are
# separate textures the game loads only when chosen (pack-variant-textures.cjs), so only the worn print is in GPU
# memory.
mat = bpy.data.materials.new('cloth')
principled(mat, bc='Cloth/T_Cloth_BC_White.png', bc_alpha=True, n='Cloth/T_Cloth_N.png', orm='Cloth/T_Cloth_ORM.png')
for name in ('SK_Dress', 'SK_Slippers_01'):
    o = bpy.data.objects[name]
    o.data.materials.clear()
    o.data.materials.append(mat)

for o in bpy.data.objects:
    if o.type == 'MESH':
        print('PART', o.name, sum(len(p.vertices) - 2 for p in o.data.polygons), 'tris', [s.material.name for s in o.material_slots])
bpy.ops.outliner.orphans_purge(do_recursive=True)
for im in list(bpy.data.images):  # the FBX's own references to the author's machine
    if not im.users or not Path(bpy.path.abspath(im.filepath)).exists():
        bpy.data.images.remove(im)
out.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(out), compress=True)
print('PREPARED', out)
