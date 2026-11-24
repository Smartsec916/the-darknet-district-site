"""Transfer the repaired Studio rig to the recovered blonde ring-choker T-pose in Blender.

Both source meshes are centered, front-facing, 1.90 m Meshy T-poses. This profile
is for that source only. Each target vertex samples barycentric skin weights from
the closest donor triangle, with opposite-side leg influences excluded below the hip.
"""
import bpy
import bmesh
import json
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
# Weld coincident positions before reduction. The downloaded mesh carries UV
# and normal splits; reducing disconnected islands can erase entire limbs.
bm = bmesh.new()
bm.from_mesh(mesh.data)
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
bm.to_mesh(mesh.data)
bm.free()
mesh.data.update()
source_area = sum(poly.area for poly in mesh.data.polygons)
source_bounds = [max(v.co[i] for v in mesh.data.vertices)-min(v.co[i] for v in mesh.data.vertices) for i in range(3)]
mesh.name = 'Blonde ring character'
points = [donor.matrix_world @ v.co for v in donor.data.vertices]
donor.data.calc_loop_triangles()
triangles = [tuple(t.vertices) for t in donor.data.loop_triangles]
tree = BVHTree.FromPolygons(points, triangles, all_triangles=True)
source_names = {g.index: g.name for g in donor.vertex_groups}
groups = {n: mesh.vertex_groups.new(name=n) for n in source_names.values()}
width_scale = max(abs(v.x) for v in points) / max(abs(v.co.x) for v in mesh.data.vertices)
def smoothstep(lo, hi, value):
    t = min(1, max(0, (value-lo)/(hi-lo)))
    return t*t*(3-2*t)

leg_landmarks = {}
for side in ('Left','Right'):
    leg_landmarks[side] = {part:(rig.matrix_world @ rig.data.bones[side+part].head_local)
                           for part in ('LowerLeg','Foot','Toes')}
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
    # Studio weights sampled across the space between the two legs can vary
    # sharply over adjacent fishnet vertices. Blend onto the actual knee hinge
    # and ankle, keeping the thigh and calf rigid away from either joint.
    strength = 1-smoothstep(-.20,-.065,z)
    if strength > 0:
        side = 'Left' if x >= 0 else 'Right'
        knee, ankle, toes = (leg_landmarks[side][p] for p in ('LowerLeg','Foot','Toes'))
        thigh = smoothstep(knee.z-.11,knee.z+.11,z)
        calf = smoothstep(ankle.z-.065,ankle.z+.065,z)*(1-thigh)
        foot = max(0,1-thigh-calf)
        toe = smoothstep(.66,1.09,(y-ankle.y)/(toes.y-ankle.y))
        analytic = {'UpperLeg':thigh,'LowerLeg':calf,'Foot':foot*(1-toe),'Toes':foot*toe}
        weights = {name:w*(1-strength) for name,w in weights.items()}
        for part,w in analytic.items():
            key = side+part
            weights[key] = weights.get(key,0)+strength*w
    top = sorted(weights.items(),key=lambda pair: -pair[1])[:4]
    total = sum(w for _,w in top)
    if not total:
        raise ValueError(f'No compatible weights on vertex {v.index}')
    for name, weight in top:
        if weight > 0: groups[name].add([v.index],weight/total,'REPLACE')
mod = mesh.modifiers.new('Real-time triangle budget','DECIMATE')
mod.ratio = 37500 / len(mesh.data.polygons)
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.modifier_apply(modifier=mod.name)
area = sum(poly.area for poly in mesh.data.polygons)
print('Reduction quality',source_area,area,source_bounds, flush=True)
bounds = [max(v.co[i] for v in mesh.data.vertices)-min(v.co[i] for v in mesh.data.vertices) for i in range(3)]
if not .90 < area / source_area < 1.05 or any(abs(new/old-1) > .03 for new,old in zip(bounds,source_bounds)):
    raise ValueError(f'Reduction lost silhouette or surface: area {area/source_area:.3f}, bounds {bounds}')
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
