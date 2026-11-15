"""Blender 5.2: prepare a character rigged by Meshy (rigged_character.glb) for build_imported_character.py.

blender -b --factory-startup --python prepare_meshy.py -- rigged_character.glb OUT.blend [TEXTURE_SIZE=2048]

Meshy's rigged file is one skinned mesh on a 24-joint skeleton (no fingers) with 4096-pixel maps and one bundled clip. This keeps the mesh and the skeleton, drops the
clip, makes the maps smaller (colour at TEXTURE_SIZE, the others at half of it) and saves a .blend with the images packed. The source file is not changed.
"""
import bpy
import sys
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:]
src, out = Path(args[0]), Path(args[1])
size = int(args[2]) if len(args) > 2 else 2048
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(src))
for o in list(bpy.data.objects):
    if o.type not in ('ARMATURE', 'MESH') or (o.type == 'MESH' and not any(m.type == 'ARMATURE' for m in o.modifiers)):
        bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
if rig.animation_data:
    rig.animation_data_clear()
for pb in rig.pose.bones:
    pb.matrix_basis.identity()
colour = set()
for m in bpy.data.materials:
    if m.use_nodes:
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                for l in n.inputs['Base Color'].links:
                    if l.from_node.type == 'TEX_IMAGE' and l.from_node.image:
                        colour.add(l.from_node.image.name)
for im in bpy.data.images:
    if im.size[0] == 0:
        continue
    want = size if im.name in colour else size // 2
    if im.size[0] > want:
        k = want / im.size[0]
        im.scale(want, int(im.size[1] * k))
    im.pack()
    print('IMAGE', im.name, list(im.size), 'colour' if im.name in colour else 'data')
print('RIG', len(rig.data.bones), [b.name for b in rig.data.bones])
print('MESH', [(o.name, sum(len(p.vertices) - 2 for p in o.data.polygons)) for o in bpy.data.objects if o.type == 'MESH'])
bpy.ops.wm.save_as_mainfile(filepath=str(out), compress=True)
print('PREPARED', out)
