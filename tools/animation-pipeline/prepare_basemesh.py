"""Blender 5.2: prepare the "Male / Female Base" character meshes (CGTrader; Unreal-skeleton FBX exports and their
TexturePack) for build_imported_character.py.

blender -b --factory-startup --python prepare_basemesh.py -- male|female FBX TEXTURE_DIR OUT.blend

The FBX's texture references are generic ("base_color_texture"), so every material is rebuilt from the TexturePack
(the same images the source's own Blender files use; OpenGL normal maps, not the "Unreal" DirectX ones). The face
keeps its blink and smile shapes, renamed Eye_Blink_L/R (the names vr-suite.js blinks with) and Smile_L/R; the other
63 face shapes stay in the master but are not exported. Bones are aimed along the body as for Eva
(prepare_prettygirl.py): Unreal bones point along X, and automatic orientation aims a bone at one of its children.
"""
import bpy
import sys
from pathlib import Path

which, src, tex, out = sys.argv[sys.argv.index('--') + 1:][:4]
tex = Path(tex)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.fbx(filepath=src, use_anim=False, automatic_bone_orientation=True)
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')

# Aim the body chain: each bone at the next joint, the head straight up the neck.
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones
chain = [n for n in ('pelvis', 'spine_01', 'spine_02', 'spine_03', 'spine_04', 'spine_05', 'neck_01', 'neck_02', 'head') if eb.get(n)]
aims = dict(zip(chain, chain[1:]))
for s in ('l', 'r'):
    aims.update({f'clavicle_{s}': f'upperarm_{s}', f'upperarm_{s}': f'lowerarm_{s}', f'lowerarm_{s}': f'hand_{s}', f'hand_{s}': f'middle_01_{s}',
                 f'thigh_{s}': f'calf_{s}', f'calf_{s}': f'foot_{s}', f'foot_{s}': f'ball_{s}'})
for bone, child in aims.items():
    b, c = eb.get(bone), eb.get(child)
    if b and c and (c.head - b.head).length > 1e-4:
        b.tail = c.head.copy()
neck = eb.get(chain[-2]) if len(chain) > 1 else None
head = eb.get('head')
if head and neck:
    head.tail = head.head + (neck.tail - neck.head).normalized() * .18
bpy.ops.object.mode_set(mode='OBJECT')
print('AIMED', len(aims))

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in meshes:
    keys = o.data.shape_keys
    if not keys:
        continue
    for k in keys.key_blocks:
        if k.name in ('Blink_L', 'Blink_R'):
            k.name = 'Eye_' + k.name
    print('KEYS', o.name, len(keys.key_blocks))


def img(name, data=False):
    im = bpy.data.images.load(str(tex / name), check_existing=True)
    if data:
        im.colorspace_settings.name = 'Non-Color'
    return im


def principled(mat, bc=None, n=None, r=None, alpha=None, color=None, rough=None):
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(p.outputs[0], o.inputs[0])
    node = lambda im: (lambda t: (setattr(t, 'image', im), t)[1])(nt.nodes.new('ShaderNodeTexImage'))
    if bc:
        nt.links.new(node(img(bc)).outputs['Color'], p.inputs['Base Color'])
    elif color:
        p.inputs['Base Color'].default_value = (*color, 1)
    if alpha:
        nt.links.new(node(img(alpha, True)).outputs['Color'], p.inputs['Alpha'])
    if n:
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(node(img(n, True)).outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs[0], p.inputs['Normal'])
    if r:
        nt.links.new(node(img(r, True)).outputs['Color'], p.inputs['Roughness'])
    else:
        p.inputs['Roughness'].default_value = .5 if rough is None else rough


F, M = which == 'female', which == 'male'
specs = {
    'Skin_M': dict(bc='FemaleSkinImageBase_Color.jpg', n='FemaleBase_Normal.jpg', r='FemaleBase_Roughness.jpg') if F else
              dict(bc='MaleBase_Color.jpg', n='Male_Normal.jpg', r='Male_Roughness.jpg'),
    'Eyelash_M': dict(color=(.02, .015, .01), alpha='Eyelash_opacity.jpg', rough=.6),
    'Hair_M': dict(bc='Hair01_A_Color.jpg', alpha='Hair01_A_Alpha.jpg', n='Hair01_A_Normal.jpg', rough=.45) if F else
              dict(bc='Hair_Color.jpg', alpha='Hair_Alpha.jpg', rough=.5),
    'HairBandS_M': dict(color=(.05, .05, .06), n='Hair01_Tie_Normal.jpg', rough=.4),
    'EyeBall_M': dict(bc='Cornia.jpg', n='eye_inner_normal.jpg', rough=.12),
    'TeethJaw_M': dict(bc='TeethJaw_Color.jpg', rough=.3),
    'Tongue_M': dict(bc='ToungColor.jpg', rough=.45), 'Toung_M': dict(bc='ToungColor.jpg', rough=.45),
    'BraPanty_M': dict(color=(.03, .03, .035), rough=.55), 'Paint_M': dict(color=(.03, .03, .035), rough=.55),
}
for m in bpy.data.materials:
    base = m.name.split('.')[0]
    key = 'EyeBall_M' if base.lower() == 'eyeball_m' else base
    if key in specs:
        principled(m, **specs[key])
        print('MATERIAL', m.name)
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.file.pack_all()
Path(out).parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
print('PREPARED', out)
