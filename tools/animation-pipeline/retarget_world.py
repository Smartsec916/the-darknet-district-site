"""World-space clip retarget between humanoid glTF rigs whose bones rest on different local axes (numpy only, no Blender).

First use (18 Nov 2026, Milked studios 3 and 4): Dex (vr-companion-bm, licensed Male Female Base Rig) rests every limb bone on other local axes than our
MakeHuman figures, so clips copied by bone name twist him (anim-library.js restOffset). Here each mapped target bone takes the donor bone's WORLD rotation
change from the donor's rest, applied to the target's rest after aligning the two rest bone directions (minimal arc). Feet and toes keep the target's own
rest under the donor's world motion (so a donor in heels does not tip a barefoot figure onto his toes). The hips' movement is scaled by hip height and held
in place; a ground pass keeps the lowest foot/toe joint at its rest height; the last 0.4 s eases into the first frame so the clip loops. Every other joint
gets its rest rotation as a constant channel, so nothing keeps a pose from the previous clip.
Runs entirely on this machine. Licensed models with a "No AI" licence (Dex) are only ever read here, never uploaded anywhere.

  python3 retarget_world.py TARGET.glb OUT.glb [--fix-toes] "DONOR.glb|donor clip|new name|mixamo or MAP.json" ...
MAP.json maps the target's bare bone names to the donor's node names (Meshy rig: {"Spine":"Spine02","Spine1":"Spine01","Spine2":"Spine","Neck":"neck",...}).
--fix-toes holds LeftToeBase/RightToeBase at rest in the target's existing clips (Dex's first build curled his toes about 90 degrees in every clip).
"""
import json,struct,sys,numpy as np
class GLB:
  def __init__(s,path):
    b=open(path,'rb').read();jl=struct.unpack('<I',b[12:16])[0];s.j=json.loads(b[20:20+jl]);bl=struct.unpack('<I',b[20+jl:24+jl])[0];s.bin=bytearray(b[28+jl:28+jl+bl])
    s.parent={}
    for i,n in enumerate(s.j['nodes']):
      for c in n.get('children',[]):s.parent[c]=i
    s.byname={n.get('name'):i for i,n in enumerate(s.j['nodes'])}
  def acc(s,a):
    A=s.j['accessors'][a];bv=s.j['bufferViews'][A['bufferView']];n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[A['type']]
    dt={5126:np.float32,5123:np.uint16,5121:np.uint8,5125:np.uint32,5122:np.int16,5120:np.int8}[A['componentType']]
    o=bv.get('byteOffset',0)+A.get('byteOffset',0);st=bv.get('byteStride')
    cnt=A['count'];isz=np.dtype(dt).itemsize
    if st and st!=n*isz:
      raw=np.frombuffer(bytes(s.bin[o:o+st*cnt]),np.uint8).reshape(cnt,st)[:,:n*isz].copy();arr=raw.view(dt).reshape(cnt,n)
    else: arr=np.frombuffer(bytes(s.bin[o:o+n*isz*cnt]),dt).reshape(cnt,n)
    arr=arr.astype(np.float64)
    if A.get('normalized'):
      arr=arr/{np.int16:32767.,np.int8:127.,np.uint16:65535.,np.uint8:255.}[dt]
    return arr
  def rest(s,i):
    n=s.j['nodes'][i];return np.array(n.get('translation',[0,0,0]),float),np.array(n.get('rotation',[0,0,0,1]),float),np.array(n.get('scale',[1,1,1]),float)
  def anim(s,name):
    a=next(a for a in s.j['animations'] if a['name']==name);out={}
    for c in a['channels']:
      sm=a['samplers'][c['sampler']];out[(c['target']['node'],c['target']['path'])]=(s.acc(sm['input'])[:,0],s.acc(sm['output']),sm.get('interpolation','LINEAR'))
    return out
  def chain(s,i):
    r=[]
    while i in s.parent:i=s.parent[i];r.append(i)
    return r
# quaternion helpers xyzw
def qmul(a,b):
  ax,ay,az,aw=np.moveaxis(a,-1,0);bx,by,bz,bw=np.moveaxis(b,-1,0)
  return np.stack([aw*bx+ax*bw+ay*bz-az*by,aw*by-ax*bz+ay*bw+az*bx,aw*bz+ax*by-ay*bx+az*bw,aw*bw-ax*bx-ay*by-az*bz],-1)
def qinv(q):return q*np.array([-1,-1,-1,1.])
def qrot(q,v):
  qv=np.concatenate([v,np.zeros(v.shape[:-1]+(1,))],-1);return qmul(qmul(q,qv),qinv(q))[...,:3]
def qnorm(q):return q/np.linalg.norm(q,axis=-1,keepdims=True)
def slerp(a,b,t):
  d=np.sum(a*b,-1,keepdims=True);b=np.where(d<0,-b,b);d=np.abs(d)
  lin=qnorm(a*(1-t)+b*t)
  th=np.arccos(np.clip(d,-1,1));sn=np.sin(th)
  with np.errstate(invalid='ignore',divide='ignore'):
    r=(np.sin((1-t)*th)*a+np.sin(t*th)*b)/sn
  return np.where(sn<1e-6,lin,qnorm(r))
def sample(ch,times,rest):
  if ch is None:return np.repeat(rest[None],len(times),0)
  t,v,interp=ch
  if interp=='CUBICSPLINE':v=v.reshape(len(t),3,-1)[:,1]
  idx=np.clip(np.searchsorted(t,times,side='right')-1,0,len(t)-1);nx=np.clip(idx+1,0,len(t)-1)
  dt=np.where(t[nx]>t[idx],t[nx]-t[idx],1);f=np.clip((times-t[idx])/dt,0,1)[:,None]
  if interp=='STEP':return v[idx]
  if v.shape[1]==4:return slerp(v[idx],v[nx],f)
  return v[idx]*(1-f)+v[nx]*f
def qfrom2(a,b):
  a=a/np.linalg.norm(a);b=b/np.linalg.norm(b);c=np.cross(a,b);d=np.dot(a,b)
  if d<-0.999999:
    ax=np.cross(a,[1,0,0]);ax=ax if np.linalg.norm(ax)>1e-6 else np.cross(a,[0,1,0]);ax/=np.linalg.norm(ax);return np.array([*ax,0.])
  q=np.array([*c,1+d]);return q/np.linalg.norm(q)
CHILD={'Hips':'Spine','Spine':'Spine1','Spine1':'Spine2','Spine2':'Neck','Neck':'Head','LeftShoulder':'LeftArm','LeftArm':'LeftForeArm','LeftForeArm':'LeftHand','RightShoulder':'RightArm','RightArm':'RightForeArm','RightForeArm':'RightHand','LeftUpLeg':'LeftLeg','LeftLeg':'LeftFoot','RightUpLeg':'RightLeg','RightLeg':'RightFoot'}
INHERIT={'Head':'Neck','LeftHand':'LeftForeArm','RightHand':'RightForeArm'}   # leaf bones take the parent's alignment
IDENT={'LeftFoot','RightFoot','LeftToeBase','RightToeBase'}   # feet keep the target's own flat rest under the donor's world motion
def bare(n):return (n or '').split(':')[-1]
def worlds(G,times,clip):
  """world (pos,rot,scale) per node per time"""
  N=len(G.j['nodes']);T=len(times);ch=G.anim(clip) if clip else {}
  loc={}
  for i in range(N):
    t,r,s=G.rest(i)
    loc[i]=(sample(ch.get((i,'translation')),times,t),qnorm(sample(ch.get((i,'rotation')),times,r)),sample(ch.get((i,'scale')),times,s))
  W={}
  def w(i):
    if i in W:return W[i]
    t,r,s=loc[i]
    if i in G.parent:
      pt,pr,ps=w(G.parent[i]);W[i]=(pt+qrot(pr,ps*t),qnorm(qmul(pr,r)),ps*s)
    else:W[i]=(t,r,s)
    return W[i]
  for i in range(N):w(i)
  return W
def joints(G):
  return [G.j['nodes'][i].get('name') for i in G.j['skins'][0]['joints']]
def retarget(D,dclip,T,mapping,fps=30,inplace=True,ground=True,loopblend=0.4,trim=None,name='x'):
  """D donor GLB, T target GLB; mapping: target bare name -> donor node name. Returns {node index: (times, values, path)}."""
  dt=D.anim(dclip);tmax=max(v[0][-1] for v in dt.values());t0=0
  if trim:t0,tmax=trim
  times=np.arange(t0,tmax+1e-6,1/fps);n=len(times)
  DW=worlds(D,times,dclip);DR=worlds(D,np.zeros(1),None)
  TR=worlds(T,np.zeros(1),None)
  tj=T.j['skins'][0]['joints'];tset=set(tj)
  tidx={bare(T.j['nodes'][i].get('name')):i for i in tj}
  didx={k:D.byname[v] for k,v in mapping.items() if v in D.byname}
  # alignment C per mapped target bone (world, rest)
  C={}
  for b in didx:
    if b in IDENT:C[b]=np.array([0,0,0,1.]);continue
    c=CHILD.get(b)
    if c and c in didx and c in tidx and b in tidx:
      vt=TR[tidx[c]][0][0]-TR[tidx[b]][0][0];vd=DR[didx[c]][0][0]-DR[didx[b]][0][0];C[b]=qfrom2(vt,vd)
  for b,p in INHERIT.items():
    if b in didx:C[b]=C.get(p,np.array([0,0,0,1.]))
  # world rotations of target joints over time, parents first
  order=sorted(tj,key=lambda i:len(T.chain(i)))
  TWr={};TWp={}
  hips=tidx['Hips']
  for i in order:
    nm=bare(T.j['nodes'][i].get('name'));pi=T.parent.get(i)
    rt,rr,rs=T.rest(i)
    if pi is not None and pi in TWr:pr,pp,psc=TWr[pi],TWp[pi],TR[pi][2][0]
    else:pr=np.repeat(TR[pi][1],n,0) if pi is not None else np.repeat(np.array([[0,0,0,1.]]),n,0);pp=np.repeat(TR[pi][0],n,0) if pi is not None else np.zeros((n,3));psc=TR[pi][2][0] if pi is not None else np.ones(3)
    if nm in didx:
      d=didx[nm];G=qmul(DW[d][1],qinv(np.repeat(DR[d][1],n,0)))
      TWr[i]=qnorm(qmul(G,np.repeat(qmul(C[nm],TR[i][1][0])[None],n,0)))
    else:
      TWr[i]=qnorm(qmul(pr,np.repeat(rr[None],n,0)))
    if i==hips:
      dh=didx['Hips'];off=DW[dh][0]-DR[dh][0][0]
      sc=TR[i][0][0][1]/max(1e-6,DR[dh][0][0][1]);off=off*sc
      if inplace:
        lin=off[0][None]+(off[-1]-off[0])[None]*np.linspace(0,1,n)[:,None]
        off[:,0]-=lin[:,0];off[:,2]-=lin[:,2]
        off[:,0]-=off[:,0].mean();off[:,2]-=off[:,2].mean()
      TWp[i]=TR[i][0][0][None]+off
    else:
      TWp[i]=pp+qrot(pr,np.repeat((psc*rt)[None],n,0))
  # ground: keep the lowest foot/toe joint at its rest height
  if ground:
    feet=[tidx[k] for k in ['LeftFoot','RightFoot','LeftToeBase','RightToeBase'] if k in tidx]
    # recompute descendants positions from hips with current rotations
    def pos_all():
      P={}
      for i in order:
        pi=T.parent.get(i)
        if i==hips or pi not in TWr:P[i]=TWp[i] if i==hips else TWp[i];continue
        rt=T.rest(i)[0];P[i]=P[pi]+qrot(TWr[pi],np.repeat((TR[pi][2][0]*rt)[None],n,0))
      return P
    P=pos_all();rest_low=min(TR[f][0][0][1] for f in feet)
    low=np.min(np.stack([P[f][:,1] for f in feet]),0);corr=rest_low-low
    k=max(1,int(fps*0.15));ker=np.ones(k)/k;corr=np.convolve(np.pad(corr,(k,k),mode='wrap'),ker,'same')[k:-k]
    TWp[hips]=TWp[hips]+np.stack([np.zeros(n),corr,np.zeros(n)],1)
  # locals
  out={}
  for i in order:
    pi=T.parent.get(i)
    if pi in TWr:pr=TWr[pi];pp=TWp.get(pi)
    else:pr=np.repeat(TR[pi][1],n,0) if pi is not None else np.repeat(np.array([[0,0,0,1.]]),n,0);pp=np.repeat(TR[pi][0],n,0) if pi is not None else np.zeros((n,3))
    lr=qnorm(qmul(qinv(pr),TWr[i]))
    # continuity of sign
    for f in range(1,n):
      if np.dot(lr[f],lr[f-1])<0:lr[f]=-lr[f]
    nm=bare(T.j['nodes'][i].get('name'))
    if nm in didx or i==hips:out[(i,'rotation')]=lr
    if i==hips:
      psc=TR[pi][2][0] if pi is not None else np.ones(3)
      out[(i,'translation')]=qrot(qinv(pr),TWp[i]-pp)/psc
  # loop blend: ease the last `loopblend` seconds into the first frame
  K=int(loopblend*fps)
  if K>1:
    for key,v in out.items():
      for f in range(n-K,n):
        w=(f-(n-K))/(K-1);w=w*w*(3-2*w)
        if key[1]=='rotation':
          a=v[f];b=v[0] if np.dot(v[f],v[0])>=0 else -v[0];v[f]=qnorm(a*(1-w)+b*w)
        else:v[f]=v[f]*(1-w)+v[0]*w
  # constant channels for every other joint (so no bone keeps a stale pose from another clip)
  for i in tj:
    if (i,'rotation') not in out:out[(i,'rotation_const')]=np.array(T.rest(i)[1])
  return times-times[0],out
def add_clip(T,name,times,out):
  j=T.j;B=T.bin
  def put(arr,typ,mm=False):
    while len(B)%4:B.append(0)
    a=np.asarray(arr,np.float32);off=len(B);B.extend(a.tobytes())
    j['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':a.nbytes})
    acc={'bufferView':len(j['bufferViews'])-1,'componentType':5126,'count':a.shape[0],'type':typ}
    if mm:acc['min']=[float(a.min())];acc['max']=[float(a.max())]
    j['accessors'].append(acc);return len(j['accessors'])-1
  ti=put(times.reshape(-1,1),'SCALAR',True);t2=put(np.array([[0],[times[-1]]]),'SCALAR',True)
  an={'name':name,'channels':[],'samplers':[]}
  for (i,p),v in out.items():
    if p=='rotation_const':o=put(np.stack([v,v]),'VEC4');inp=t2;p='rotation'
    else:o=put(v,'VEC4' if p=='rotation' else 'VEC3');inp=ti
    an['samplers'].append({'input':inp,'output':o,'interpolation':'LINEAR'});an['channels'].append({'sampler':len(an['samplers'])-1,'target':{'node':i,'path':p}})
  j['animations']=[a for a in j.get('animations',[]) if a['name']!=name]+[an]
def save(T,path):
  B=T.bin
  while len(B)%4:B.append(0)
  T.j['buffers'][0]['byteLength']=len(B)
  js=json.dumps(T.j,separators=(',',':')).encode();js+=b' '*((4-len(js)%4)%4)
  open(path,'wb').write(b'glTF'+struct.pack('<II',2,12+8+len(js)+8+len(B))+struct.pack('<I',len(js))+b'JSON'+js+struct.pack('<I',len(B))+b'BIN\0'+bytes(B))
CORE=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase']
def fix_toes(T):
  for a in T.j.get('animations',[]):
    for c in a['channels']:
      nm=T.j['nodes'][c['target']['node']].get('name')
      if bare(nm) in ('LeftToeBase','RightToeBase') and c['target']['path']=='rotation':
        s=a['samplers'][c['sampler']];acc=T.j['accessors'][s['output']];bv=T.j['bufferViews'][acc['bufferView']];o=bv.get('byteOffset',0)+acc.get('byteOffset',0)
        r=np.array(T.rest(c['target']['node'])[1],np.float32);T.bin[o:o+16*acc['count']]=np.tile(r,acc['count']).astype(np.float32).tobytes()
if __name__=='__main__':
  args=sys.argv[1:];toes='--fix-toes' in args;args=[a for a in args if a!='--fix-toes']
  T=GLB(args[0])
  if toes:fix_toes(T)
  prefix=next((n.get('name').split(':')[0]+':' for n in T.j['nodes'] if ':' in (n.get('name') or '')),'')
  for spec in args[2:]:
    path,clip,new,kind=spec.split('|');D=GLB(path)
    mp={b:'mixamorig:'+b for b in CORE} if kind=='mixamo' else json.load(open(kind))
    times,out=retarget(D,clip,T,mp,name=new);add_clip(T,new,times,out);print('added',new,len(times),'frames')
  save(T,args[1])
