"""Transfer the repaired Studio rig to the recovered blonde ring-choker T-pose in Blender.

Both source meshes are centered, front-facing, 1.90 m Meshy T-poses. This profile
is for that source only. Each target vertex samples barycentric skin weights from
the closest donor triangle, with opposite-side leg influences excluded below the hip.
"""
import bpy
import json
import math
from pathlib import Path
import sys
from mathutils import Vector, Matrix, geometry
from mathutils.bvhtree import BVHTree

source, donor_path, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
if output.exists():
    raise ValueError('Choose a new output to preserve previous builds')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(donor_path.resolve()))
rig, = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
donor, = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.find_armature() == rig]
rig.data.pose_position = 'REST'
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
mesh, = [o for o in set(bpy.data.objects)-before if o.type == 'MESH']
world = mesh.matrix_world.copy()
mesh.data.transform(world)
mesh.parent = None

mesh.matrix_world = Matrix.Identity(4)
if len(mesh.data.polygons) != 257544 or mesh.vertex_groups:
    raise ValueError('Unexpected source topology or existing rig')
mesh.name = 'Blonde ring character'
points = [donor.matrix_world @ v.co for v in donor.data.vertices]
donor.data.calc_loop_triangles()
triangles = [tuple(t.vertices) for t in donor.data.loop_triangles]
tree = BVHTree.FromPolygons(points, triangles, all_triangles=True)
source_names = {g.index: g.name for g in donor.vertex_groups}
groups = {n: mesh.vertex_groups.new(name=n) for n in source_names.values()}
width_scale = max(abs(v.x) for v in points) / max(abs(v.co.x) for v in mesh.data.vertices)
opposite_removed = 0
for v in mesh.data.vertices:
    x, y, z = v.co
    sample = Vector((x*width_scale,y,z))
    hit, _, face, distance = tree.find_nearest(sample)
    indices = triangles[face]
    a,b,c = [points[i] for i in indices]
    bary = geometry.barycentric_transform(hit,a,b,c,Vector((1,0,0)),Vector((0,1,0)),Vector((0,0,1)))
    weights = {}
    for i, factor in zip(indices,bary):
        for entry in donor.data.vertices[i].groups:
            name = source_names[entry.group]
            if z < -.12 and abs(x) > .03 and name.startswith('Right' if x>0 else 'Left'):
                opposite_removed += 1
                continue
            weights[name] = weights.get(name,0) + max(0,factor)*entry.weight
    top = sorted(weights.items(),key=lambda pair: -pair[1])[:4]
    total = sum(w for _,w in top)
    if not total:
        raise ValueError(f'No compatible weights on vertex {v.index}')
    for name, weight in top:
        if weight > 0: groups[name].add([v.index],weight/total,'REPLACE')
# Protect the facial silhouette during reduction, after weights have been transferred.
mask = mesh.vertex_groups.new(name='Detail priority')
for v in mesh.data.vertices:
    if v.co.z < .69 or abs(v.co.x) > .10:
        mask.add([v.index],1,'REPLACE')
mod = mesh.modifiers.new('Real-time triangle budget','DECIMATE')
mod.ratio = 37500 / len(mesh.data.polygons)
mod.vertex_group = mask.name
mod.vertex_group_factor = .5
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.modifier_apply(modifier=mod.name)
detail = mesh.vertex_groups.get('Detail priority')
if detail:
    mesh.vertex_groups.remove(detail)
mesh.parent=rig
mesh.matrix_parent_inverse=rig.matrix_world.inverted()
mod=mesh.modifiers.new('Skin','ARMATURE')
mod.object=rig
# Resample only the working copies of the new character's material images.
for mat in mesh.data.materials:
    for node in mat.node_tree.nodes:
        image=getattr(node,'image',None)
        if image and max(image.size)>2048:
            scale=2048/max(image.size)
            image.scale(*(max(1,round(n*scale)) for n in image.size))
            image.pack()
bpy.data.objects.remove(donor,do_unlink=True)
rig.data.pose_position='POSE'
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(output.resolve()),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_image_format='WEBP',export_image_quality=90,
    export_force_sampling=False,export_skins=True,export_all_influences=False)
print(json.dumps({'bytes':output.stat().st_size,'faces':len(mesh.data.polygons),'oppositeInfluencesSkipped':opposite_removed}))
