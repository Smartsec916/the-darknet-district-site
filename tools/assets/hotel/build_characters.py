"""Build original adult Hotel Headshots guests using installed CC0 MakeHuman assets.
Run with Blender 5.2 in background. No source or existing game model is modified.
"""
import bpy, sys, json, math
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[3]
PIPE=ROOT/'tools/animation-pipeline/build_mpfb_character.py'
OUT=ROOT/'hotel-headshots/assets'
TMP=ROOT/'.test-temp/hotel-headshots'
OUT.mkdir(parents=True,exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(PIPE.parent))

def swimsuit(body,rig):
    # A fully opaque, fitted two-piece garment, copied from the character's topology.
    zmin=min(v.co.z for v in body.data.vertices); h=max(v.co.z for v in body.data.vertices)-zmin
    groups={g.index:g.name for g in body.vertex_groups}
    picked=[]
    for poly in body.data.polygons:
        center=sum((body.data.vertices[i].co for i in poly.vertices),Vector())/len(poly.vertices)
        z=(center.z-zmin)/h; x=abs(center.x)/h
        torso=sum(sum(g.weight for g in body.data.vertices[i].groups if any(n in groups[g.group] for n in ['Spine','Hips'])) for i in poly.vertices)/len(poly.vertices)
        top=.665<z<.765 and torso>.35
        if not rig.name.endswith('_a') and .75<z<.84 and .055<x<.075 and torso>.6: top=True
        bottom=(.435+min(.062,x*.44))<z<.57 and x<.19
        if top or bottom: picked.append(poly.index)
    # Assign an opaque fabric region directly to the continuous skinned topology.
    # This keeps fitted swimwear flush, with identical deformation and no surface fighting.
    m=bpy.data.materials.new('hotel_swimwear');m.use_nodes=True
    shader=m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(.12,.36,.40,1)
    shader.inputs['Roughness'].default_value=.67
    slot=len(body.data.materials);body.data.materials.append(m)
    for index in picked:body.data.polygons[index].material_index=slot
    body['hotel_asset']='CC0 MakeHuman adult body with original opaque fabric regions'
    print('HOTEL_SWIM',len(picked),h,zmin)


def finish_rig(rig):
    # Bake a protective upper-body pose. The runtime blends only the arm chains over locomotion.
    scene=bpy.context.scene
    rig.animation_data_create()
    idle=next(a for a in bpy.data.actions if a.name=='idle')
    for track in rig.animation_data.nla_tracks:track.mute=True
    rig.animation_data.action=idle
    if idle.slots:rig.animation_data.action_slot=idle.slots[0]
    scene.frame_set(1);bpy.context.view_layer.update()
    held={p.name:p.matrix_basis.copy() for p in rig.pose.bones}
    rig.animation_data.action=None
    for p in rig.pose.bones:p.matrix_basis=held[p.name]
    head=rig.matrix_world@rig.pose.bones['mixamorig:Head'].head
    def aim(name,target):
        pb=rig.pose.bones['mixamorig:'+name];bpy.context.view_layer.update();world=rig.matrix_world@pb.matrix;origin=world.translation
        direction=(target-origin).normalized();current=(world.to_3x3()@Vector((0,1,0))).normalized()
        delta=current.rotation_difference(direction).to_matrix().to_4x4()
        pb.matrix=rig.matrix_world.inverted()@Matrix.Translation(origin)@delta@Matrix.Translation(-origin)@world
        bpy.context.view_layer.update()
    for side,sign in [('Left',1),('Right',-1)]:
        shoulder=rig.matrix_world@rig.pose.bones['mixamorig:'+side+'Arm'].head
        aim(side+'Arm',Vector((shoulder.x+sign*.015,head.y-.24,head.z-.20)))
        aim(side+'ForeArm',Vector((head.x+sign*.09,head.y-.24,head.z+.07)))
    guard=bpy.data.actions.new('guard');rig.animation_data.action=guard
    for p in rig.pose.bones:
        p.rotation_mode='QUATERNION';p.keyframe_insert('rotation_quaternion',frame=1);p.keyframe_insert('rotation_quaternion',frame=2)
    rig.animation_data.action=None
    track=rig.animation_data.nla_tracks.new();track.name='guard';strip=track.strips.new('guard',1,guard);strip.action_slot=guard.slots[0]
    for track in rig.animation_data.nla_tracks:track.mute=False
    for p in rig.pose.bones:p.matrix_basis=Matrix()
    # Retain detailed face textures; cap maps for a practical multi-NPC budget.
    for image in bpy.data.images:
        if image.type=='IMAGE' and max(image.size)>1024:image.scale(1024,1024)
    for ob in rig.children:
        if ob.type!='MESH':continue
        for p in ob.data.polygons:p.use_smooth=True
    scene.frame_set(1)

VARIANTS=[('guest-a','young_african_female','bob01',.48,.43,{'african':.8,'asian':.1,'caucasian':.1}),('guest-b','young_asian_female','ponytail01',.38,.45,{'african':.1,'asian':.8,'caucasian':.1}),('guest-c','young_caucasian_female','long01',.36,.55,{'african':.1,'asian':.1,'caucasian':.8})]
for name,skin,hair,weight,muscle,race in VARIANTS:
    for action in list(bpy.data.actions): bpy.data.actions.remove(action)
    spec={'name':name.replace('-','_'),'phenotype':{'gender':0,'age':.55,'muscle':muscle,'weight':weight,'height':.5,'cupsize':.4,'race':race},'skin':skin,'hair':hair,'clothes':[],'lean':False,'maxGarmentVerts':6000,'clips':[]}
    specpath=TMP/(name+'.json');specpath.write_text(json.dumps(spec))
    source=ROOT/'void-runner/assets/models/crowd/vr-companion-f.glb'
    sys.argv=['build','--',str(specpath),str(OUT/(name+'.glb')),'idle='+str(source),'walk='+str(source)]
    code=PIPE.read_text()
    code=code.replace("mpfb_styling.apply_style(spec, rig, basemesh)","mpfb_styling.apply_style(spec, rig, basemesh)\nswimsuit(basemesh, rig)")
    code=code.replace('out.use_fake_user = True', 'out.name = name; out.use_fake_user = True')
    code=code.replace('actions = [retarget(*c) for c in clips]',"actions = [retarget(n,p,s,{'action':n,'loop':'exact'}) for n,p,s,o in clips]")
    code=code.replace("bpy.ops.export_scene.gltf(filepath=str(output_path)","finish_rig(rig)\nbpy.ops.export_scene.gltf(filepath=str(output_path)")
    scope={'__file__':str(PIPE),'swimsuit':swimsuit,'finish_rig':finish_rig}
    exec(compile(code,str(PIPE),'exec'),scope)
    print('HOTEL_BUILT',name)
