"""Inspect rig scale, weights and animation length changes in a folder of GLBs.

Run in Blender background with --python-exit-code 1 -P audit_npc_rigs.py --
OUTPUT.json MODEL_OR_FOLDER [...]. Reads source files without exporting or altering them.
"""
import bpy
from pathlib import Path
import sys
import json
import numpy as np

target, *roots = map(Path, sys.argv[sys.argv.index('--')+1:])
files = {p for root in roots for p in (root.glob('*.glb') if root.is_dir() else [root])}
report = []
for path in sorted(files):
    item = {'model': path.stem, 'bytes': path.stat().st_size}
    try:
        # Avoid running any scripts or opening an authored Blend scene.
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(path.resolve()))
        scene = bpy.context.scene
        rigs = [o for o in scene.objects if o.type == 'ARMATURE']
        meshes = [o for o in scene.objects if o.type == 'MESH' and o.find_armature()]
        item.update(rigs=len(rigs), meshes=len(meshes), vertices=sum(len(m.data.vertices) for m in meshes),
                    triangles=sum(sum(len(f.vertices)-2 for f in m.data.polygons) for m in meshes),
                    materials=len({s.material.name for m in meshes for s in m.material_slots if s.material}))
        if not rigs:
            raise ValueError('No armature')
        rig=max(rigs,key=lambda o:len(o.data.bones))
        item['bones']=len(rig.data.bones)
        maximum, empty, badsum = 0,0,0
        for mesh in meshes:
            weights={g.index for g in mesh.vertex_groups if mesh.find_armature().data.bones.get(g.name)}
            for vertex in mesh.data.vertices:
                values=[g.weight for g in vertex.groups if g.group in weights and g.weight>1e-5]
                maximum=max(maximum,len(values));empty+=not values;badsum+=abs(sum(values)-1)>.01
        item.update(maxInfluences=maximum,unweighted=empty,nonUnitWeights=badsum)
        segments=[b for b in rig.data.bones if b.parent and (b.head_local-b.parent.head_local).length>.04]
        rest=np.array([(b.head_local-b.parent.head_local).length for b in segments])
        rig.animation_data_create()
        rig.animation_data.use_nla=False
        results={}
        for action in bpy.data.actions:
            if not action.slots or not segments:
                continue
            rig.animation_data.action=action
            rig.animation_data.action_slot=action.slots[0]
            worst=(0,'')
            for f in np.linspace(*action.frame_range,5):
                scene.frame_set(int(f), subframe=float(f%1))
                distance=np.array([(rig.pose.bones[b.name].head-rig.pose.bones[b.parent.name].head).length for b in segments])
                ratios=np.abs(distance/rest-1)
                if not np.isfinite(ratios).all():raise ValueError('Nonfinite joint in '+action.name)
                index=int(ratios.argmax())
                worst=max(worst,(float(ratios[index]),segments[index].name))
            results[action.name]={'maxFractionalLengthChange':round(worst[0],4),'joint':worst[1]}
        item['clips']=results
    except Exception as exc:
        item['error']=str(exc)
    report.append(item)
    temp=target.with_suffix('.partial')
    temp.write_text(json.dumps(report,indent=2),encoding='utf8')
    temp.replace(target)
