# Kestrel exterior build (Blender, background): Meshy remesh -> game GLBs (High 2048 / Low 1024) with gear, exhaust, canopy and hook nodes.
import bpy,bmesh,sys,json,os,math
import numpy as np
from mathutils import Matrix,Vector
argv=sys.argv[sys.argv.index('--')+1:];src,outdir=argv[0],argv[1];os.makedirs(outdir,exist_ok=True)
CFG=json.load(open(os.path.join(os.path.dirname(__file__),'build_cfg.json')))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
obj=[o for o in bpy.data.objects if o.type=='MESH'][0]
for o in list(bpy.data.objects):
    if o is not obj: bpy.data.objects.remove(o)
obj.data.transform(obj.matrix_world);obj.matrix_world=Matrix.Identity(4)
me=obj.data;mat=me.materials[0];mat.name='kestrel_hull'
info={}
# base colour image for the canopy test
bsdf=[n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'][0]
def img_of(sock):
    for l in mat.node_tree.links:
        if l.to_socket==sock:
            n=l.from_node
            while n.type!='TEX_IMAGE' and n.inputs and any(i.is_linked for i in n.inputs):
                n=[l2.from_node for l2 in mat.node_tree.links if l2.to_node==n][0]
            return n.image if n.type=='TEX_IMAGE' else None
base=img_of(bsdf.inputs['Base Color']);W,H=base.size
px=np.array(base.pixels[:],dtype=np.float32).reshape(H,W,4)
co=np.array([v.co[:] for v in me.vertices])
info['raw_min']=co.min(0).tolist();info['raw_max']=co.max(0).tolist()
bm=bmesh.new();bm.from_mesh(me);bm.faces.ensure_lookup_table();uvl=bm.loops.layers.uv.active
groups={'gear_nose':[],'gear_left':[],'gear_right':[],'canopy':[]}
G=CFG
for f in bm.faces:
    c=f.calc_center_median();x,y,z=c
    n=G['nose'];m=G['main'];cp=G['canopy']
    if n['x'][0]<x<n['x'][1] and abs(y)<n['y'] and z<n['z']:groups['gear_nose'].append(f.index);continue
    if m['x'][0]<x<m['x'][1] and m['y'][0]<abs(y)<m['y'][1] and z<m['z']:groups['gear_left' if y<0 else 'gear_right'].append(f.index);continue
    if cp['x'][0]<x<cp['x'][1] and abs(y)<cp['y'] and z>cp['z'] and f.normal.z>cp['nz']:
        u=sum((l[uvl].uv for l in f.loops),Vector((0,0)))/len(f.loops)
        p=px[min(H-1,max(0,int((u.y%1)*H))),min(W-1,max(0,int((u.x%1)*W)))]
        lum=.2126*p[0]+.7152*p[1]+.0722*p[2]
        if lum<cp['lum']:groups['canopy'].append(f.index)
info['faces']={k:len(v) for k,v in groups.items()};info['faces_total']=len(bm.faces)
bm.free()
# split each group into its own object
def split(name,idx):
    if not idx:return None
    bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.object.mode_set(mode='OBJECT')
    s=set(idx)
    for p in obj.data.polygons:p.select=p.index in s
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.separate(type='SELECTED');bpy.ops.object.mode_set(mode='OBJECT')
    new=[o for o in bpy.context.selected_objects if o is not obj][0];new.name=name;new.data.name=name;return new
# indices shift after each separate: recompute by centroid sets instead
cent={k:[tuple(np.round(me.polygons[i].center[:],6)) for i in v] for k,v in groups.items()}
parts={}
for k in ['gear_nose','gear_left','gear_right','canopy']:
    want=set(cent[k]);idx=[p.index for p in obj.data.polygons if tuple(np.round(p.center[:],6)) in want]
    parts[k]=split(k,idx)
obj.name='hull';obj.data.name='hull'
if parts['canopy']:
    gm=mat.copy();gm.name='canopy_glass';b2=[n for n in gm.node_tree.nodes if n.type=='BSDF_PRINCIPLED'][0]
    for l in list(gm.node_tree.links):
        if l.to_socket in (b2.inputs['Roughness'],b2.inputs['Metallic']):gm.node_tree.links.remove(l)
    b2.inputs['Roughness'].default_value=.1;b2.inputs['Metallic'].default_value=.3
    parts['canopy'].data.materials.clear();parts['canopy'].data.materials.append(gm)
# hook points (raw coordinates) from the hull
hc=np.array([v.co[:] for v in obj.data.vertices])
def mean(a):return a.mean(0) if len(a) else None
hooks={}
ex=G['exhaust']
for side,sg in (('left',-1),('right',1)):
    s=hc[(hc[:,0]>ex['x'])&(hc[:,1]*sg>ex['ymin'])]
    cy,cz=np.median(s[:,1]),np.median(s[:,2]);r=np.percentile(np.hypot(s[:,1]-cy,s[:,2]-cz),90)
    hooks['engine_'+side]=[float(s[:,0].max()),float(cy),float(cz)];hooks['_r_'+side]=float(r)
    w=hc[(np.abs(hc[:,1])>G['rail_y'])&(hc[:,1]*sg>0)]
    tip=w[w[:,0]<w[:,0].min()+.02];hooks['muzzle_'+side]=[float(w[:,0].min()),float(tip[:,1].mean()),float(tip[:,2].mean())]
    ch=hc[(hc[:,0]<hc[:,0].min()+.03)&(hc[:,1]*sg>.01)];hooks['muzzle_chin_'+side]=[float(hc[:,0].min()),float(ch[:,1].mean()) if len(ch) else sg*.04,float(ch[:,2].mean()) if len(ch) else -.06]
    mm=hc[(np.abs(hc[:,1])>G['missile_y'][0])&(np.abs(hc[:,1])<G['missile_y'][1])&(hc[:,1]*sg>0)&(hc[:,2]<G['missile_z'])&(hc[:,0]<G['missile_x'])]
    hooks['missile_'+side]=[float(mm[:,0].min()),float(np.median(mm[:,1])),float(np.median(mm[:,2]))] if len(mm) else [-.1,sg*.4,-.17]
# the lit engine cores: a disc set just inside each nozzle, facing back (+x raw)
em=bpy.data.materials.new('exhaust');em.use_nodes=True;eb=em.node_tree.nodes['Principled BSDF']
eb.inputs['Base Color'].default_value=(0,0,0,1);eb.inputs['Emission Color'].default_value=(1,.5,.15,1);eb.inputs['Emission Strength'].default_value=3;eb.inputs['Roughness'].default_value=1
discs={}
for side in ('left','right'):
    x,y,z=hooks['engine_'+side];r=hooks['_r_'+side]*G['disc_r']
    dm=bpy.data.meshes.new('exhaust_'+side);b=bmesh.new()
    bmesh.ops.create_circle(b,cap_ends=True,segments=20,radius=r)
    bmesh.ops.rotate(b,verts=b.verts,cent=(0,0,0),matrix=Matrix.Rotation(math.pi/2,3,'Y'))   # face +x (back)
    bmesh.ops.translate(b,verts=b.verts,vec=(x-G['disc_in'],y,z));b.to_mesh(dm);b.free()
    o=bpy.data.objects.new('exhaust_'+side,dm);bpy.context.scene.collection.objects.link(o);dm.materials.append(em);discs[side]=o
# into the game frame: nose to -Y (glTF +z), length L, wheels at FOOT
L=G['length'];s=L/(info['raw_max'][0]-info['raw_min'][0])
R=Matrix.Rotation(math.pi/2,4,'Z');S=Matrix.Scale(s,4)
foot=info['raw_min'][2]*s;T=Matrix.Translation((0,G['shift_y'],G['foot']-foot))
GM=T@S@R
meshes={'hull':obj,**{k:v for k,v in parts.items() if v},**{'exhaust_'+k:v for k,v in discs.items()}}
for k,o in meshes.items():o.data.transform(GM);o.matrix_world=Matrix.Identity(4)
# gear origins where each leg meets the hull (top centre); exhaust origins at their centres
for k in ['gear_nose','gear_left','gear_right','exhaust_left','exhaust_right']:
    o=meshes.get(k)
    if not o:continue
    v=np.array([vv.co[:] for vv in o.data.vertices]);P=Vector(((v[:,0].min()+v[:,0].max())/2,(v[:,1].min()+v[:,1].max())/2,v[:,2].max() if k.startswith('gear') else (v[:,2].min()+v[:,2].max())/2))
    o.data.transform(Matrix.Translation(-P));o.location=P
    info[k]={'pivot':list(P),'foot':float(v[:,2].min()),'tris':sum(len(p.vertices)-2 for p in o.data.polygons)}
for k,p in hooks.items():
    if k.startswith('_'):continue
    e=bpy.data.objects.new(k,None);e.empty_display_size=.1;bpy.context.scene.collection.objects.link(e);e.location=GM@Vector(p);info.setdefault('hooks',{})[k]=list(e.location)
fin=np.vstack([np.array([o.matrix_world@v.co for v in o.data.vertices]) for o in meshes.values()])
info['final_min']=fin.min(0).tolist();info['final_max']=fin.max(0).tolist();info['scale']=s
info['tris']={k:sum(len(p.vertices)-2 for p in o.data.polygons) for k,o in meshes.items()};info['tris_total']=sum(info['tris'].values())
info['images']={i.name:list(i.size) for i in bpy.data.images}
# hull: its belly is seen from below on the pad
for p in obj.data.polygons:p.use_smooth=True
def export(path,sizes):
    for i in bpy.data.images:
        tgt=sizes(i)
        if tgt and i.size[0]>tgt:i.scale(tgt,tgt)
    bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',export_image_format='JPEG',export_jpeg_quality=CFG['jpeg'],export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
nm=lambda i:'normal' if any(l.to_node.type=='NORMAL_MAP' and getattr(l.from_node,'image',None)==i for l in mat.node_tree.links) else ('base' if i==base else 'mr')
info['roles']={i.name:nm(i) for i in bpy.data.images}
export(os.path.join(outdir,'kestrel.glb'),lambda i:{'base':2048,'normal':2048,'mr':1024}[nm(i)])
export(os.path.join(outdir,'kestrel-low.glb'),lambda i:1024)
info['sizes']={f:os.path.getsize(os.path.join(outdir,f)) for f in ('kestrel.glb','kestrel-low.glb')}
json.dump(info,open(os.path.join(outdir,'build_info.json'),'w'),indent=1)
