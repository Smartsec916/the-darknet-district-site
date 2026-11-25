/* TIER PERCEPTION (pure rules: browser and Node). Distances in a saved record are feet. A check uses metres.
   Tier 1 keeps a short fixed notice and ignores a saved record. Tier 2 and 3 use the record: sight is a cone and stops at a wall;
   hearing is a range for a walk, a sprint or combat and is not a view through the wall. Nothing here remembers a player or sees through a building. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,FT=0.3048;
 const num=v=>typeof v==='number'&&Number.isFinite(v);
 const keysOk=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 const span=(v,a,b)=>num(v)&&v>=a&&v<=b;
 function problems(rec){if(rec==null)return [];if(!keysOk(rec,['sight','fov','hear']))return ['Awareness has unknown fields.'];
  const out=[];if(!span(rec.sight,10,80))out.push('Sight is 10 to 80 feet.');if(!span(rec.fov,40,160))out.push('The field of view is 40 to 160 degrees.');
  const h=rec.hear;if(!keysOk(h,['walk','sprint','combat']))out.push('Hearing needs a walk, a sprint and a combat range.');
  else{if(!span(h.walk,10,150)||!span(h.sprint,10,150)||!span(h.combat,10,150))out.push('Each hearing range is 10 to 150 feet.');
   if(num(h.walk)&&num(h.sprint)&&h.sprint<h.walk)out.push('A sprint is heard at least as far as a walk.');if(num(h.sprint)&&num(h.combat)&&h.combat<h.sprint)out.push('Combat is heard at least as far as a sprint.');}
  return out;}
 function clean(rec){const p=problems(rec);if(p.length||!rec)return null;const r=v=>Math.round(v);return {sight:r(rec.sight),fov:r(rec.fov),hear:{walk:r(rec.hear.walk),sprint:r(rec.hear.sprint),combat:r(rec.hear.combat)}};}
 function blocked(a,b,rects){const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(!(d>0.2)||!rects)return false;const n=Math.max(1,Math.ceil(d/0.4));
  for(let i=1;i<n;i++){const t=i/n;if(t*d<0.45||(1-t)*d<0.45)continue;const x=a.x+dx*t,z=a.z+dz*t;for(const r of rects)if(r&&x>r[0]&&x<r[1]&&z>r[2]&&z<r[3])return true;}return false;}
 /* npc: {x,z,yaw,tier,awareness}. event: {x,z,kind:'walk'|'sprint'|'combat'}. rects: obstacle boxes [x0,x1,z0,z1]. */
 function notice(npc,event,rects){if(!npc||!event||!num(npc.x+npc.z+npc.yaw+event.x+event.z))return {seen:false,heard:false,why:'missing'};
  const tier=npc.tier||1,aw=tier>=2?npc.awareness:null,kind=event.kind==='sprint'||event.kind==='combat'?event.kind:'walk';
  const sight=(aw?aw.sight*FT:4),fov=((aw?aw.fov:90)*Math.PI/180),hearFt=aw?aw.hear[kind]:kind==='combat'?40:kind==='sprint'?25:12,hear=hearFt*FT;
  const dx=event.x-npc.x,dz=event.z-npc.z,dist=Math.hypot(dx,dz),ang=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(ang-(npc.yaw||0)),Math.cos(ang-(npc.yaw||0)));
  const seen=dist<=sight&&Math.abs(turn)<=fov/2+1e-6&&!blocked(npc,event,rects),heard=dist<=hear;
  return {seen,heard,dist,why:seen?'sight':heard?'hearing':'out of notice'};}
 const api={FT,problems,clean,blocked,notice};
 if(node)module.exports=api;else root.VoidNPCAwareness=api;
})(typeof globalThis!=='undefined'?globalThis:this);
