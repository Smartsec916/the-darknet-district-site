"""Blender 5.2: prepare the "Cyberpunk Vending Machine - Neon Urban Utility" model (CGTrader, Astral-3D; GLB with one
4K PBR material) for the District's vending alcove.

blender -b --factory-startup --python prepare_vending.py -- SOURCE.glb OUT.glb [HEIGHT_M] [DECIMATE_RATIO]

Scaled to HEIGHT_M (default 1.95 m) standing on the floor at the origin, front towards -Y (glTF +Z). Its neon trim and
lit display are painted into the base colour, so an emission map is made from that texture's own bright, saturated
pixels (the pink and cyan tubes, the blue screen) and the material emits through it; nothing is added that isn't in
the original texture. Decimated to DECIMATE_RATIO (default 0.5; flat cabinet panels lose nothing visible). The output
keeps 4K textures; tools/assets/optimize-textures.cjs and ktx2-glb.mjs size and compress them.
"""
import bpy
import sys
import numpy as np
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src, out = args[0], args[1]
height = float(args[2]) if len(args) > 2 else 1.95
ratio = float(args[3]) if len(args) > 3 else 0.5
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
body.name = 'vending'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Standing on the floor at the origin, HEIGHT tall.
pts = [Vector(v.co) for v in body.data.vertices]
lo = Vector([min(p[i] for p in pts) for i in range(3)])
hi = Vector([max(p[i] for p in pts) for i in range(3)])
k = height / (hi.z - lo.z)
centre = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
for v in body.data.vertices:
    v.co = (v.co - centre) * k
print('SCALE', round(k, 3), 'size', tuple(round((hi[i] - lo[i]) * k, 3) for i in range(3)))

if ratio < 1:
    m = body.modifiers.new('decimate', 'DECIMATE')
    m.ratio = ratio
    bpy.ops.object.modifier_apply(modifier=m.name)
print('TRIS', sum(len(p.vertices) - 2 for p in body.data.polygons))

# Emission from the painted neon: bright, saturated colour (HSV), feathered, times the base colour.
mat = body.data.materials[0]
nt = mat.node_tree
bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
base_node = bsdf.inputs['Base Color'].links[0].from_node
base = base_node.image
w, h = base.size
px = np.empty(w * h * 4, np.float32)
base.pixels.foreach_get(px)
px = px.reshape(-1, 4)
rgb = px[:, :3]
v = rgb.max(axis=1)
s = np.where(v > 1e-4, (v - rgb.min(axis=1)) / np.maximum(v, 1e-4), 0)
mask = np.clip((s - .45) / .2, 0, 1) * np.clip((v - .5) / .2, 0, 1)
emit = np.empty_like(px)
emit[:, :3] = rgb * mask[:, None]
emit[:, 3] = 1
im = bpy.data.images.new('vending_emission', w, h)
im.pixels.foreach_set(emit.ravel())
im.pack()
tex = nt.nodes.new('ShaderNodeTexImage')
tex.image = im
uv_src = base_node.inputs['Vector'].links[0].from_socket if base_node.inputs['Vector'].is_linked else None
if uv_src:
    nt.links.new(uv_src, tex.inputs['Vector'])
nt.links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
bsdf.inputs['Emission Strength'].default_value = 1.0
print('EMISSION', round(float(mask.mean()) * 100, 1), '% of the texture')

bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False, export_apply=True, export_yup=True)
print('EXPORTED', out)
