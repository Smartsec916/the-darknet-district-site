"""Render a full-character Blender preview and measure each prepared candidate locally."""
import json
import sys
from pathlib import Path
import bpy
from mathutils import Vector

folder = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
report = json.loads((folder / 'preparation.json').read_text(encoding='utf8'))
for record in report:
    if record.get('error'):
        continue
    try:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(folder / record['file']))
        scene = bpy.context.scene
        rigs = [o for o in scene.objects if o.type == 'ARMATURE']
        rig, = rigs
        meshes = [o for o in scene.objects if o.type == 'MESH' and o.find_armature() == rig]
        points = [mesh.matrix_world @ Vector(v) for mesh in meshes for v in mesh.bound_box]
        lower = min(v.z for v in points)
        upper = max(v.z for v in points)
        height = upper - lower
        if not .4 < height < 4:
            raise ValueError(f'Review character height {height:.2f} m')
        rig.animation_data.use_nla = False
        actions = {a.name: a for a in bpy.data.actions}
        if 'idle' not in actions:
            raise ValueError('Missing idle')
        rig.animation_data.action = actions['idle']
        rig.animation_data.action_slot = actions['idle'].slots[0]
        scene.frame_set(1)
        camera = bpy.data.objects.new('Review camera', bpy.data.cameras.new('Review camera'))
        scene.collection.objects.link(camera)
        scene.camera = camera
        center = Vector((0, 0, (upper+lower)/2))
        camera.location = center + Vector((0, -3, .08))
        camera.rotation_euler = (center-camera.location).to_track_quat('-Z','Y').to_euler()
        camera.data.type = 'ORTHO'
        camera.data.ortho_scale = height*1.23
        scene.render.engine = 'CYCLES'
        scene.cycles.samples = 2
        scene.cycles.use_denoising = True
        scene.world = bpy.data.worlds.new('Review daylight')
        scene.world.use_nodes = True
        scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.8,.8,.8,1)
        scene.render.resolution_x, scene.render.resolution_y = 256, 320
        scene.render.resolution_percentage = 100
        scene.render.filepath = str(folder / (record['name']+'.png'))
        bpy.ops.render.render(write_still=True)
        record.update(preview=Path(scene.render.filepath).name, heightMetres=height, bones=len(rig.data.bones),
                      vertices=sum(len(m.data.vertices) for m in meshes), actions=list(actions))
    except Exception as e:
        record['reviewError'] = str(e)
    (folder/'review.json').write_text(json.dumps(report,indent=2),encoding='utf8')
