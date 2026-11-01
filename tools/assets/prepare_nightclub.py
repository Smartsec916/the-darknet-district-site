"""Converts the purchased "Cyberpunk Cyber Club" (CGTrader item 5665404, `Club animated FBX.FBX` plus the Cyber Club
Textures pack unzipped beside it) into the single GLB the game streams in (void-runner/ncz-nightclub.js):
textures shrunk to 1024 px, static meshes merged per material, the moving heads, beams, light boxes and mirror ball kept
as their own nodes, the FBX clips dropped (they carry a 100x scale; the beams are rebuilt in code), the model's pose at
frame 1 baked, Y-up.
Usage: blender -b --python tools/assets/prepare_nightclub.py -- "<dir>/Club animated FBX.FBX" nightclub.glb
Then:  node tools/assets/pack-model.cjs nightclub.glb void-runner/assets/models/ncz/nightclub.vrpak
The output is licensed content: never commit it (void-runner/assets/models/ncz/ is git-ignored). Needs Blender 4+."""
import bpy,sys,math,os
from mathutils import Vector
src,dst=sys.argv[-2],sys.argv[-1]
MAXTEX=1024
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=src,use_image_search=True)
objs=list(bpy.data.objects)
def animated(o):
    while o:
        if o.animation_data and o.animation_data.action: return True
        o=o.parent
    return False
anim_names={o.name for o in objs if animated(o) or o.name=='ball'}
# Pose at frame 1 of the FBX clips: the rest transforms alone put the moving heads outside the hall.
bpy.context.scene.frame_set(1)
_dg=bpy.context.evaluated_depsgraph_get()
poses={o.name:o.evaluated_get(_dg).matrix_world.copy() for o in objs if o.name in anim_names}
# FBX animations carry a 100x scale mismatch; keep the rest pose and re-create the motion in the game instead.
for o in objs:
    if o.animation_data: o.animation_data_clear()
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
def depth(o):
    n=0
    while o.parent: o=o.parent;n+=1
    return n
for o in sorted([o for o in objs if o.name in poses],key=depth): o.matrix_world=poses[o.name]
def animated(o): return o.name in anim_names
# -- materials: drop spec/roughness links, set constants, shrink images
CONST={'floor':(.28,.3),'wall':(.55,.1),'wall2':(.55,.1),'wall3':(.55,.1),'roof':(.7,0),'door':(.4,.5),'chair':(.55,.2),'table':(.4,.3),'audio':(.5,.4),'plint':(.5,.3),'det_1':(.4,.4),'det_2':(.4,.4),'det_2.001':(.4,.4),'det_2_off':(.4,.4),'certain_hld':(.9,0)}
for m in bpy.data.materials:
    if not m.use_nodes: continue
    nt=m.node_tree
    for b in [n for n in nt.nodes if n.type=='BSDF_PRINCIPLED']:
        for name in ('Roughness','Metallic','Specular IOR Level','Specular Tint'):
            if name in b.inputs:
                for l in list(b.inputs[name].links): nt.links.remove(l)
        r,me=CONST.get(m.name,(.6,.1))
        b.inputs['Roughness'].default_value=r; b.inputs['Metallic'].default_value=me
for im in bpy.data.images:
    w,h=im.size
    if max(w,h)>MAXTEX and w>0:
        s=MAXTEX/max(w,h); im.scale(max(1,int(w*s)),max(1,int(h*s)))
# -- merge static meshes per material (keeps animated ones as they are)
for o in objs:
    if o.type=='MESH' and not animated(o) and len(o.material_slots)==1 and o.material_slots[0].material:
        mw=o.matrix_world.copy(); o.parent=None; o.matrix_world=mw
groups={}
for o in bpy.data.objects:
    if o.type=='MESH' and o.parent is None and not animated(o) and len(o.material_slots)==1 and o.material_slots[0].material:
        groups.setdefault(o.material_slots[0].material.name,[]).append(o)
for name,lst in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in lst: o.select_set(True)
    bpy.context.view_layer.objects.active=lst[0]
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    if len(lst)>1: bpy.ops.object.join()
    bpy.context.view_layer.objects.active.name='static_'+name
# -- up axis: the data is Y-up, rotate under one root so glTF ends up Y-up with the same numbers
root=bpy.data.objects.new('nightclub',None); bpy.context.scene.collection.objects.link(root)
for o in list(bpy.data.objects):
    if o is not root and o.parent is None: o.parent=root
root.rotation_euler=(math.radians(90),0,0)
tris=sum(len(o.data.loop_triangles) for o in bpy.data.objects if o.type=='MESH' and o.data.calc_loop_triangles() is None) if False else 0
bpy.ops.export_scene.gltf(filepath=dst,export_format='GLB',export_image_format='JPEG',export_jpeg_quality=82,export_animations=False,export_apply=False,export_yup=True,export_lights=False,export_cameras=False)
print('DONE',os.path.getsize(dst))
