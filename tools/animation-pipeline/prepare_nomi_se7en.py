"""Nomi and Se7en (23 Nov 2026): the female companion clip set, retargeted onto the owner's two Meshy characters, no Blender needed (retarget_world.py, numpy only).

Their packages (.vrcompanion from the Companion Studio) carry seven clips on a 19-bone skeleton (Hips, Spine, Chest, Neck, Head, Left/Right UpperArm, ForeArm, Hand,
UpperLeg, LowerLeg, Foot, Toes). The owner made both on Meshy (his own generations), so the game's own clips may be copied onto them as for Luna and Kai: the clips of
vr-companion-f.glb are retargeted by world rotation (retarget_world.py). Their skeletons, meshes, textures and the seven clips they came with are not touched; only animations are
added. The bones are renamed to the donor's names while the clips are made and put back before the file is saved.
  python3 prepare_nomi_se7en.py IN.glb OUT.glb [DONOR.glb]
Runs entirely on this machine (nothing is uploaded anywhere).
"""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import retarget_world as R
NAMES={'Chest':'Spine2','LeftUpperArm':'LeftArm','RightUpperArm':'RightArm','LeftUpperLeg':'LeftUpLeg','RightUpperLeg':'RightUpLeg','LeftLowerLeg':'LeftLeg','RightLowerLeg':'RightLeg','LeftToes':'LeftToeBase','RightToes':'RightToeBase'}
# the donor's clips their own do not have (their idle, talk, walk, sit, sit-enter, sit-exit, run stay as supplied; their idle and talk are held poses, so the donor's living ones are added as idle-f and talk-f)
CLIPS=['idle>idle-f','talk>talk-f','sit-talk','sit-relax','sit-wave','coy','head-tilt','laugh','blow-kiss','glance-back','recline','shrug','interact','idle-f2','wave','hips','dance','slow-dance','dance-belly']
def main(src,out,donor):
  R.CHILD['Spine']='Spine2'   # their spine has no Spine1: the chest follows the spine directly
  T=R.GLB(src);D=R.GLB(donor);joints=T.j['skins'][0]['joints'];orig={i:T.j['nodes'][i]['name'] for i in joints}
  for i in joints:
    n=orig[i];T.j['nodes'][i]['name']=NAMES.get(n,n)
  T.byname={n.get('name'):i for i,n in enumerate(T.j['nodes'])}
  canon=[T.j['nodes'][i]['name'] for i in joints];mp={b:'mixamorig:'+b for b in canon if ('mixamorig:'+b) in D.byname}
  print('mapped',len(mp),'of',len(canon),sorted(set(canon)-set(mp)))
  for spec in CLIPS:
    c,new=spec.split('>') if '>' in spec else (spec,spec)
    short=max(v[0][-1] for v in D.anim(c).values())<.5   # recline is a held pose of a few frames
    times,o=R.retarget(D,c,T,mp,name=new,loopblend=0 if short else .4);R.add_clip(T,new,times,o);print('added',new,len(times),'frames')
  for i in joints:T.j['nodes'][i]['name']=orig[i]
  R.save(T,out)
if __name__=='__main__':
  a=sys.argv[1:];main(a[0],a[1],a[2] if len(a)>2 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','void-runner','assets','models','crowd','vr-companion-f.glb'))
