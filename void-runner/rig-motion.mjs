/* Browser-local rig checks and world-space humanoid motion baking.
   Only mapped rotations and hip displacement are written to the imported rig. */
import * as rigModule from './shared-rig.js';
import * as glbModule from './glb-downsizer.js';
const Rig=globalThis.VoidSharedRig||rigModule.default,GLB=globalThis.VoidGLBDownsizer||glbModule.default;
const identity=[0,0,0,1],origin=[0,0,0];
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,s)=>a.map(x=>x*s);
const dot=(a,b)=>a.reduce((t,x,i)=>t+x*b[i],0);
const unit=a=>{const n=Math.hypot(...a);if(!Number.isFinite(n)||n<1e-8)throw Error('Invalid rest or animated rotation');return scale(a,1/n);};
const inv=([x,y,z,w])=>[-x,-y,-z,w];
function mul([x,y,z,w],[a,b,c,d]){return [w*a+x*d+y*c-z*b,w*b-x*c+y*d+z*a,w*c+x*b-y*a+z*d,w*d-x*a-y*b-z*c];}
const rotate=(q,v)=>mul(mul(q,[...v,0]),inv(q)).slice(0,3);
function reader(doc,index){
 const stream=Rig.accessor(doc.json,doc.binary,index);return {count:stream.count,get:stream.row};
}
function hierarchy(j){
 const parent=[];for(const [i,n] of j.nodes.entries())for(const child of n.children||[])parent[child]=i;
 function world(tracks=new Map()){
  const out=[],visiting=new Set();
  function visit(i){
   if(out[i])return out[i];if(visiting.has(i))throw Error('Cyclic skeleton');visiting.add(i);
   const n=j.nodes[i],p=parent[i]==null?{q:identity,t:origin,s:1}:visit(parent[i]),s=n.scale||[1,1,1];
   if(n.matrix||s[0]<=0||s.some(x=>Math.abs(x-s[0])>Math.abs(s[0])*1e-3))throw Error('Bake matrix or nonuniform scale on '+(n.name||i)+' in Blender');
   const q=unit(tracks.get(i+':rotation')||n.rotation||identity),t=tracks.get(i+':translation')||n.translation||origin;
   visiting.delete(i);return out[i]={q:unit(mul(p.q,q)),t:add(p.t,rotate(p.q,scale(t,p.s))),s:p.s*s[0]};
  }
  return visit;
 }
 return {parent,world};
}
const cross=([x,y,z],[a,b,c])=>[y*c-z*b,z*a-x*c,x*b-y*a];
function arc(a,b){a=unit(a);b=unit(b);const d=dot(a,b);return d<-.99999?[...unit(cross(a,Math.abs(a[0])<.8?[1,0,0]:[0,1,0])),0]:unit([...cross(a,b),1+d]);}
const articulated={LeftUpperArm:'LeftForeArm',LeftForeArm:'LeftHand',RightUpperArm:'RightForeArm',RightForeArm:'RightHand',LeftUpperLeg:'LeftLowerLeg',RightUpperLeg:'RightLowerLeg',LeftLowerLeg:'LeftFoot',RightLowerLeg:'RightFoot'};
function bodyBasis(world,m){
 const up=unit(sub(world(m.Head).t,world(m.Hips).t)),across=sub(world(m.LeftUpperArm).t,world(m.RightUpperArm).t);
 const left=unit(sub(across,scale(up,dot(across,up)))),vertical=arc([0,1,0],up),x=rotate(vertical,[1,0,0]);
 const angle=Math.atan2(dot(cross(x,left),up),dot(x,left));
 return mul([...scale(up,Math.sin(angle/2)),Math.cos(angle/2)],vertical);
}
function map(doc,overrides={}){
 const j=doc.json,vrm=j.extensions?.VRMC_vrm?.humanoid?.humanBones||Object.fromEntries((j.extensions?.VRM?.humanoid?.humanBones||[]).map(b=>[b.bone,b]));
 const keys={LeftForeArm:'leftLowerArm',RightForeArm:'rightLowerArm'};
 const declared={};for(const role of Rig.roles){const b=vrm[keys[role]||role[0].toLowerCase()+role.slice(1)];if(b)declared[role]=b.node;}
 const choices={...declared,...overrides};
 let rig=Rig.inspectRig(j,choices);
 // Fill an unnamed hinge only when explicitly identified anatomical endpoints
 // enclose one joint, and its rest position lies between the two endpoints.
 const h=hierarchy(j),world=h.world(),joints=new Set(rig.joints.map(b=>b.index));
 for(const side of ['Left','Right'])for(const chain of [['UpperArm','ForeArm','Hand'],['UpperLeg','LowerLeg','Foot']]){
  const [top,mid,end]=chain.map(k=>side+k),a=rig.mapping[top],b=rig.mapping[end];
  if(a==null||b==null||rig.mapping[mid]!=null||Object.hasOwn(overrides,mid))continue;
  const path=[];let i=h.parent[b];while(i!=null&&i!==a&&path.length<j.nodes.length){path.push(i);i=h.parent[i];}
  const candidates=path.filter(k=>joints.has(k));if(i!==a||candidates.length!==1)continue;
  const k=candidates[0];try{const axis=sub(world(b).t,world(a).t),v=sub(world(k).t,world(a).t),f=dot(v,axis)/dot(axis,axis);
   if(f>.15&&f<.85&&Math.hypot(...sub(v,scale(axis,f)))<.35*Math.hypot(...axis))choices[mid]=k;
  }catch{/* Rest validation reports unsupported transforms. */}
 }
 return Rig.inspectRig(j,choices);
}
export function inspect(doc,overrides={}){
 const rig=map(doc,overrides),j=doc.json;
 if(rig.skin==null)return rig;
 try{
  const skin=j.skins[rig.skin],rest=hierarchy(j).world();
  for(const i of skin.joints)rest(i);
  if(rig.ready){const skinCheck=Rig.validateSkin(j,doc.binary,rig);if(!skinCheck.ok)throw Error(skinCheck.issues.join(' · '));}
 }catch(e){rig.issues.push(e.message);rig.ready=false;}
 return rig;
}
function sampler(doc,a,rig){
 const tracks=[],times=new Set(),seen=new Set(),joints=new Set(rig.joints.map(b=>b.index));
 for(const c of a.channels||[]){
  if(!joints.has(c.target.node))continue;
  const path=c.target.path,s=a.samplers[c.sampler],time=reader(doc,s.input),value=reader(doc,s.output),key=c.target.node+':'+path;
  if(seen.has(key)||doc.json.accessors[s.input].type!=='SCALAR'||doc.json.accessors[s.output].type!==(path==='rotation'?'VEC4':'VEC3')||[s.input,s.output].some(i=>doc.json.accessors[i].componentType!==5126))throw Error('Invalid or duplicate motion channel in '+a.name);
  seen.add(key);const cubic=s.interpolation==='CUBICSPLINE';
  if(!['rotation','translation','scale'].includes(path)||!['LINEAR','STEP','CUBICSPLINE'].includes(s.interpolation||'LINEAR')||time.count*(cubic?3:1)!==value.count)throw Error('Unsupported sampler in '+a.name);
  const ts=[],vs=[],tangents=[];for(let i=0;i<time.count;i++){
   const t=time.get(i)[0],v=value.get(cubic?i*3+1:i);if(cubic)tangents.push([value.get(i*3),value.get(i*3+2)]);if(path==='rotation'&&Math.abs(Math.hypot(...v)-1)>.01)throw Error('Invalid joint quaternion in '+a.name);if(!Number.isFinite(t)||t<0||i&&t<=ts[i-1]||!v.every(Number.isFinite))throw Error('Invalid samples in '+a.name);
   ts.push(t);times.add(t);vs.push(path==='rotation'?unit(v):v);
  }
  tracks.push({path,node:c.target.node,key,ts,vs,cubic,tangents,step:s.interpolation==='STEP'});
 }
 return {tracks,times:[...times].sort((a,b)=>a-b),sample(t){const out=new Map();for(const {key,ts,vs,path,step,cubic,tangents} of tracks){
  let k=ts.findIndex(v=>v>=t);if(k<0)k=ts.length-1;let v=vs[k];if(k>0&&ts[k]>t){const u=step?0:(t-ts[k-1])/(ts[k]-ts[k-1]),p=vs[k-1];if(cubic){const dt=ts[k]-ts[k-1],u2=u*u,u3=u2*u;
   v=v.map((x,i)=>(2*u3-3*u2+1)*p[i]+(u3-2*u2+u)*dt*tangents[k-1][1][i]+(-2*u3+3*u2)*x+(u3-u2)*dt*tangents[k][0][i]);
  }else{if(path==='rotation'&&dot(p,v)<0)v=scale(v,-1);v=add(scale(p,1-u),scale(v,u));}}
  out.set(key,path==='rotation'?unit(v):v);
 }return out;}};
}
function clipOK(doc,a,rig,role){
 try{const s=sampler(doc,a,rig);if(s.times.length<2)return false;
 const required=role==='walk'||role==='run'?['LeftUpperLeg','RightUpperLeg']:null;
 const moving=new Set(),posed=new Set();
 for(const tr of s.tracks){if(tr.path!=='rotation')continue;const rest=doc.json.nodes[tr.node].rotation||identity;
  if(tr.vs.some(q=>Math.abs(dot(q,tr.vs[0]))<.999999))moving.add(tr.node);
  if(tr.vs.some(q=>Math.abs(dot(q,rest))<.9999))posed.add(tr.node);}
 if(required||role==='sit-enter'||role==='sit-exit')return ['Left','Right'].every(side=>['UpperLeg','LowerLeg','Foot'].some(part=>moving.has(rig.mapping[side+part])));
 return role==='sit'?posed.has(rig.mapping.LeftUpperLeg)&&posed.has(rig.mapping.RightUpperLeg):moving.size>0||(!['idle','talk'].includes(role)&&posed.size>0);
 }catch{return false;}
}
export function validNames(doc,rig){return (doc.json.animations||[]).filter(a=>clipOK(doc,a,rig,a.name)).map(a=>a.name);}
export function bake(src,sourceRig,animation,dst,targetRig){
 const from=hierarchy(src.json),to=hierarchy(dst.json),sr=from.world(),tr=to.world(),motion=sampler(src,animation,sourceRig);
 const sh=sourceRig.mapping.Hips,th=targetRig.mapping.Hips,foot='LeftFoot';
 const height=(rest,rig)=>Math.abs(rest(rig.mapping.Hips).t[1]-rest(rig.mapping[foot]).t[1]);
 const ratio=height(tr,targetRig)/height(sr,sourceRig);
 if(!Number.isFinite(ratio)||ratio<=0)throw Error('Cannot measure upright hip height');
 const axis=mul(bodyBasis(tr,targetRig.mapping),inv(bodyBasis(sr,sourceRig.mapping))),pre={};
 for(const [role,child] of Object.entries(articulated)){
  const sourceA=sourceRig.mapping[role],sourceB=sourceRig.mapping[child],targetA=targetRig.mapping[role],targetB=targetRig.mapping[child];
  if([sourceA,sourceB,targetA,targetB].every(i=>i!=null))pre[role]=arc(sub(tr(targetB).t,tr(targetA).t),rotate(axis,sub(sr(sourceB).t,sr(sourceA).t)));
 }
 const duration=motion.times.at(-1)-motion.times[0];if(!duration||duration>60)throw Error('Unsupported clip duration');
 const frames=[],count=Math.min(59,Math.max(2,Math.ceil(duration*24)));
 for(let k=0;k<=count;k++){
  const time=duration*k/count,sw=from.world(motion.sample(time+motion.times[0])),desired=new Map();
  for(const [role,i] of Object.entries(targetRig.mapping)){const d=sourceRig.mapping[role];if(d!=null)desired.set(i,unit(mul(mul(mul(axis,mul(sw(d).q,inv(sr(d).q))),inv(axis)),mul(pre[role]||identity,tr(i).q))));}
  function posed(i){if(i==null)return identity;if(desired.has(i))return desired.get(i);return mul(posed(to.parent[i]),dst.json.nodes[i].rotation||identity);}
  const joints=[];for(const [i,q] of desired){const joint=dst.json.nodes[i].name;if(!joint)throw Error('Unnamed mapped joint '+i);
   const parent=to.parent[i],rotation=mul(inv(posed(parent)),q),item={joint,rotation};
   if(i===th){const parentRest=parent==null?{q:identity,s:1}:tr(parent),delta=scale(rotate(axis,sub(sw(sh).t,sr(sh).t)),ratio/parentRest.s);
    item.translation=add(dst.json.nodes[i].translation||origin,rotate(inv(parentRest.q),delta));}
   joints.push(item);
  }
  if(/^(?:walk|run|idle|talk)(?:$|[-_])/i.test(animation.name)){
   const tracks=new Map();for(const item of joints){const i=Object.values(targetRig.mapping).find(n=>dst.json.nodes[n].name===item.joint);tracks.set(i+':rotation',item.rotation);if(item.translation)tracks.set(i+':translation',item.translation);}
   const world=to.world(tracks),legs=['LeftFoot','RightFoot'],stance=legs.reduce((a,b)=>sw(sourceRig.mapping[a]).t[1]<sw(sourceRig.mapping[b]).t[1]?a:b);
   const si=sourceRig.mapping[stance],ti=targetRig.mapping[stance],ownHip=joints.find(x=>x.joint===dst.json.nodes[th].name);
   const targetDelta=rotate(axis,scale(sub(sw(si).t,sr(si).t),ratio)),actual=sub(world(ti).t,tr(ti).t);
   const other=legs.find(leg=>leg!==stance),blend=Math.min(1,Math.abs(sw(si).t[1]-sw(sourceRig.mapping[other]).t[1])/(height(sr,sourceRig)*.08));
   const offset=sub(targetDelta,actual);offset[0]*=blend;offset[2]*=blend;
   const par=to.parent[th],pr=par==null?{q:identity,s:1}:tr(par);
   ownHip.translation=add(ownHip.translation,scale(rotate(inv(pr.q),offset),1/pr.s));
  }
  frames.push({time,joints});
 }return frames;
}
export {GLB,Rig,map,clipOK};
