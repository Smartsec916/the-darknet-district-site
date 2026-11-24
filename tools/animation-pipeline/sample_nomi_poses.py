"""Sample skinned mesh deformation in Blender. Run with -b --disable-autoexec -P this.py -- model.glb report.json."""
import bpy
import json
import numpy as np
import sys
from pathlib import Path

source, target = map(Path, sys.argv[sys.argv.index('--') + 1:])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
rig, = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
mesh, = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.find_armature() == rig]
scene = bpy.context.scene
points = np.zeros((len(mesh.data.vertices), 3), dtype=np.float32)
edges = np.zeros((len(mesh.data.edges), 2), dtype=np.int32)
mesh.data.vertices.foreach_get('co', points.ravel())
mesh.data.edges.foreach_get('vertices', edges.ravel())
length = np.linalg.norm(points[edges[:, 0]] - points[edges[:, 1]], axis=1)
valid = length > .001
face = valid & (points[edges, 2].min(1) > .73) & (abs(points[edges, 0]).max(1) < .08)
legs = valid & (points[edges, 2].max(1) < -.12)
result = {}
rig.animation_data.use_nla = False
for action in bpy.data.actions:
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]
    samples = []
    for frame in np.linspace(*action.frame_range, 9):
        scene.frame_set(int(frame), subframe=float(frame % 1))
        posed = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
        coords = np.empty_like(points)
        posed.data.vertices.foreach_get('co', coords.ravel())
        if not np.isfinite(coords).all():
            raise ValueError('Nonfinite pose: ' + action.name)
        ratio = np.linalg.norm(coords[edges[:, 0]] - coords[edges[:, 1]], axis=1) / np.maximum(length, 1e-8)
        samples.append({'frame': float(frame), 'minLocalZ': float(coords[:, 2].min()),
                        'legP95Strain': float(np.percentile(abs(ratio[legs]-1), 95)),
                        'legP99Stretch': float(np.percentile(ratio[legs], 99)),
                        'faceP95Strain': float(np.percentile(abs(ratio[face]-1), 95)),
                        'meshP99Strain': float(np.percentile(abs(ratio[valid]-1), 99))})
    result[action.name] = samples
target.write_text(json.dumps(result, indent=2))
