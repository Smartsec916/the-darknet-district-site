"""Prepares the Meshy station props for the game (docs/development/STATION_GRAPHICS.md). Run with Blender's Python (the `bpy` package):

    python tools/assets/station-kit/prepare_props.py <folder with the raw Meshy .glb downloads>

For each prop in PROPS: import the raw model (about 30,000 triangles, 4K maps), weld it, decimate it to its triangle budget, turn and scale it to
real metres with its origin on the floor at the centre, shrink its maps (colour and normal 1K, roughness/metal 512, JPEG) and name its material
prop_<name>. The interior props are written into ONE file and the exterior ones into another (void-runner/assets/models/station-kit/
station-props-interior.glb, station-props-exterior.glb); station-kit.js reads the pieces out by node name. The raw downloads are not kept in the
repository: the Meshy task ids are in the docs and the models stay in the owner's Meshy account."""
import bpy, json, math, os, sys
from mathutils import Vector, Matrix

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
OUT = os.path.join(REPO, 'void-runner', 'assets', 'models', 'station-kit')
# name: (file, triangles, size in metres along (axis), yaw in degrees to turn the model's front to -Y, group)
PROPS = {
    'prop_stool': ('bar-stool', 2500, ('z', .78), 0, 'interior'),
    'prop_armchair': ('lounge-chair', 4000, ('z', .82), 0, 'interior'),
    'prop_toolcart': ('tool-cart', 5000, ('z', 1.05), 0, 'interior'),
    'prop_generator': ('power-generator', 7000, ('z', 1.6), 0, 'interior'),
    'prop_fuelpump': ('fuel-pump', 5000, ('z', 2.1), 0, 'interior'),
    'prop_cylinders': ('gas-cylinders', 5000, ('z', 1.9), 0, 'interior'),
    'prop_loader': ('cargo-loader', 8000, ('z', 1.9), 0, 'interior'),
    'prop_vending': ('vending', 5000, ('z', 2.05), 0, 'interior'),
    'prop_container': ('cargo-container', 3500, ('z', 2.2), 0, 'interior'),
    'prop_dish': ('comm-dish', 7000, ('z', 9.0), 0, 'exterior'),
    'prop_antenna': ('antenna-array', 8000, ('z', 7.0), 0, 'exterior'),
    'prop_thruster': ('thruster-pod', 6000, ('x', 4.0), 0, 'exterior'),
    'prop_arm': ('docking-arm', 8000, ('z', 6.0), 0, 'exterior'),
}


def prepare(name, spec, src):
    file, target, (axis, size), yaw, group = spec
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(src, file + '.glb'))
    objs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    for o in bpy.data.objects:
        o.select_set(o in objs)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in [o for o in bpy.data.objects if o not in before and o != obj]:
        bpy.data.objects.remove(o)
    raw = len(obj.data.polygons)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=1e-5); bpy.ops.object.mode_set(mode='OBJECT')
    tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    if tris > target:
        mod = obj.modifiers.new('decimate', 'DECIMATE'); mod.ratio = target / tris; mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    lo = Vector([min(v.co[i] for v in obj.data.vertices) for i in range(3)]); hi = Vector([max(v.co[i] for v in obj.data.vertices) for i in range(3)])
    k = size / (hi - lo)['xyz'.index(axis)]
    centre = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    obj.data.transform(Matrix.Rotation(math.radians(yaw), 4, 'Z') @ Matrix.Scale(k, 4) @ Matrix.Translation(-centre))
    obj.data.validate()
    obj.data.update()
    for p in obj.data.polygons:
        p.use_smooth = True
    mat = obj.data.materials[0]; mat.name = name
    for node in mat.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            links = [l.to_socket.name for l in node.outputs['Color'].links]
            n = 1024 if ('Base Color' in links or any('Color' == s for s in links) and node.image.colorspace_settings.name != 'Non-Color' or 'Normal' in str([l.to_node.type for l in node.outputs['Color'].links])) else 512
            if node.image.size[0] > n:
                node.image.scale(n, n)
    obj.name = name; obj.data.name = name
    size_now = [(hi - lo)[i] * k for i in range(3)]
    return obj, {'source': file, 'rawFaces': raw, 'triangles': sum(len(p.vertices) - 2 for p in obj.data.polygons), 'size': [round(size_now[0], 2), round(size_now[2], 2), round(size_now[1], 2)], 'group': group}


def main():
    src = sys.argv[1]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    made, info = {}, {}
    for name, spec in PROPS.items():
        made[name], info[name] = prepare(name, spec, src)
        print(name, info[name], flush=True)
    for group in ('interior', 'exterior'):
        objs = [o for n, o in made.items() if PROPS[n][4] == group]
        for o in bpy.context.scene.objects:
            o.select_set(o in objs)
        bpy.context.view_layer.objects.active = objs[0]
        path = os.path.join(OUT, 'station-props-%s.glb' % group)
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_image_format='JPEG', export_jpeg_quality=85,
                                  export_animations=False, export_cameras=False, export_lights=False)
        print(group, os.path.getsize(path), 'bytes')
    json.dump(info, open(os.path.join(OUT, 'station-props-manifest.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
