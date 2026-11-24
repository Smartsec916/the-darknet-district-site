/* Advanced ordinary NPC interaction primitives. No DOM or game state dependency.
   This module is intentionally not wired into production until editor/runtime integration is tested. */
(function(root){
'use strict';
function createDialogueCoordinator(now=()=>Date.now()){
 const active=new Map(),last=new Map(),turn=new Map();
 function acquire(group,speaker,members,cooldownMs=0,alternate=false){
  if(!group||!speaker||!Array.isArray(members)||!members.includes(speaker)||active.has(group))return null;
  const t=now();if(t-(last.get(group)??-Infinity)<cooldownMs)return null;
  if(alternate&&members.length>1&&members[(turn.get(group)||0)%members.length]!==speaker)return null;
  const token=Object.freeze({group,speaker});active.set(group,token);return token;
 }
 function release(token,members=[]){
  if(!token||active.get(token.group)!==token)return false;
  active.delete(token.group);last.set(token.group,now());
  const i=members.indexOf(token.speaker);if(i>=0)turn.set(token.group,i+1);return true;
 }
 function clear(){active.clear();last.clear();turn.clear();}
 function next(group,members,alternate=false){if(!Array.isArray(members)||!members.length)return null;return alternate?members[(turn.get(group)||0)%members.length]:members[0];}
 return {acquire,release,clear,next,busy:group=>active.has(group)};
}
function roomVisit(previous,inside,now){
 const p=previous||{inside:false,enteredAt:null};
 if(inside&&!p.inside)return {state:{inside:true,enteredAt:now},event:'enter',duration:0};
 if(!inside&&p.inside)return {state:{inside:false,enteredAt:null},event:'exit',duration:Math.max(0,now-p.enteredAt)};
 return {state:p,event:null,duration:inside?Math.max(0,now-p.enteredAt):0};
}
// A room transition is consumed even when speech is blocked: never replay a stale line.
// Timed departure pools override the generic departure pool when configured.
function roomDialogueStep(room,previous,{inside,npcPresent,audible,blocked,now}){
 const p=previous||{inside:false,enteredAt:null,last:{},index:{}};
 const visit=roomVisit(p,inside,now),state={...p,...visit.state,last:{...p.last},index:{...p.index}};
 if(!visit.event||blocked||!npcPresent||!audible)return {state,line:null};
 let pool=visit.event;
 if(pool==='exit'){
  const timed=visit.duration>=room.longSeconds*1000?'longVisit':'shortVisit';
  if(room[timed])pool=timed;
 }
 const lines=String(room[pool]||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(!lines.length||now-(state.last[pool]??-Infinity)<room.cooldown*1000)return {state,line:null};
 const index=state.index[pool]||0;state.last[pool]=now;state.index[pool]=index+1;
 return {state,line:lines[index%lines.length],pool};
}
// Use the walking scene's collision solids, including its live open-door state.
function clearRoomLine(a,b,solids){
 if(!Array.isArray(solids)||!a||!b)return false;
 for(const s of solids){if(!s||s.open||!Array.isArray(s.position)||!Array.isArray(s.size))continue;
  let lo=0,hi=1;
  for(let axis=0;axis<3;axis++){const d=b[axis]-a[axis],min=s.position[axis]-s.size[axis]/2,max=s.position[axis]+s.size[axis]/2;
   if(Math.abs(d)<1e-9){if(a[axis]<min||a[axis]>max){lo=2;break;}continue;}
   const t=(min-a[axis])/d,u=(max-a[axis])/d;lo=Math.max(lo,Math.min(t,u));hi=Math.min(hi,Math.max(t,u));if(lo>hi)break;
  }if(lo<=hi&&hi>0&&lo<1)return false;
 }return true;
}
// Push overlapping people apart. The caller keeps the result only when it stays on walkable ground.
// Paired room conversation (Nomi and Se7en behind the tea room): one speaker at a time, one state per player. The entrance exchange is either `script` (a function the
// caller supplies, called only when a visit really starts: [{speaker,text,...}]) or their `lines` pools interleaved in author order. With `resolve(item)` each queued item is
// turned into its line only when it falls due. The caller reports `playing` (the current line's recording is still sounding); the next line waits for it to finish, then a short
// pause (pauseMs). A line whose audio never reports back is released after maxLineMs. Walking out clears the queue (cancel: true tells the caller to stop a line still sounding);
// a re-entry before cooldownMs has passed waits until it has (the guest who stays is not left in silence). A conversation held up by `blocked` (another conversation or a mission
// line) waits, it is not dropped. A guest who stays: `refill` {gap(): ms, script(round): items, max} starts another round after a quiet gap when the queue has run dry, up to `max`
// rounds; and a visit whose people were not yet there (models still loading) starts as soon as they are.
function roomDuoStep(previous,{inside,present,blocked,playing=false,now,lines,script,resolve,refill,members=['nomi','se7en'],pauseMs=900,noticeMs=700,cooldownMs=90000,maxTurns=10,maxLineMs=20000}){
 const p=previous||{inside:false,last:-Infinity,queue:[],nextAt:0,waiting:false,waitUntil:0,started:false,rounds:0,refillAt:0};
 const state={inside:!!inside,last:p.last??-Infinity,queue:[...(p.queue||[])],nextAt:p.nextAt||0,waiting:!!p.waiting,waitUntil:p.waitUntil||0,started:!!p.started,rounds:p.rounds||0,refillAt:p.refillAt||0};
 if(!inside){const cancel=!!(state.queue.length||state.waiting);state.queue=[];state.nextAt=0;state.waiting=false;state.started=false;state.rounds=0;state.refillAt=0;return {state,line:null,cancel};}
 const push=l=>{if(l&&(typeof resolve==='function'||typeof l.text==='string'&&members.includes(l.speaker))&&state.queue.length<maxTurns)state.queue.push({...l});};
 if(!p.inside){state.queue=[];state.waiting=false;state.started=false;state.rounds=0;state.refillAt=0;}
 if(!state.started&&present&&now-state.last>=cooldownMs){
  if(typeof script==='function'){const sc=script();if(Array.isArray(sc))for(const l of sc)push(l);}
  else{
   const pools=Object.fromEntries(members.map(id=>[id,Array.isArray(lines?.[id])?lines[id].filter(s=>typeof s==='string'&&s.trim()).map(s=>s.trim()):[]]));
   for(let i=0;state.queue.length<maxTurns;i++){
    let any=false;
    for(const id of members){const text=pools[id]?.[i];if(text&&state.queue.length<maxTurns){state.queue.push({speaker:id,text});any=true;}}
    if(!any)break;
   }
  }
  if(state.queue.length){state.last=now;state.nextAt=now+noticeMs;state.started=true;state.rounds=1;}
 }
 if(state.waiting){if(playing&&now<state.waitUntil)return {state,line:null};state.waiting=false;state.nextAt=Math.max(state.nextAt,now+pauseMs);}
 // the round has run dry: after a quiet gap another one (the guest is still here)
 if(refill&&state.started&&!state.queue.length&&present&&state.rounds<(refill.max||1)){
  if(!state.refillAt)state.refillAt=now+Math.max(0,refill.gap?refill.gap():8000);
  else if(now>=state.refillAt&&!blocked){const sc=refill.script(state.rounds);if(Array.isArray(sc))for(const l of sc)push(l);if(state.queue.length){state.rounds++;state.refillAt=0;state.nextAt=Math.max(state.nextAt,now+noticeMs);}else state.refillAt=now+4000;}
 }
 if(blocked||!present||now<state.nextAt||!state.queue.length)return {state,line:null};
 let line=null;
 while(state.queue.length){const item=state.queue.shift(),r=typeof resolve==='function'?resolve(item):item;if(r){line=r;break;}}   // resolve turns a planned step into the line to say now, or null to skip it (a reply's "show" step when the invitation was declined)
 if(!line)return {state,line:null};
 state.waiting=true;state.waitUntil=now+maxLineMs;
 return {state,line};
}
function separate(self,others,radius=0.8){
 if(!self||!Number.isFinite(self.x+self.z))return null;
 let x=self.x,z=self.z;
 for(const o of others||[]){if(!o||!Number.isFinite(o.x+o.z)||o===self)continue;let dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz);
  if(d>=radius)continue;if(d<1e-4){dx=radius;dz=0;d=1e-4;}const k=(radius-d)/d;x+=dx*k;z+=dz*k;}
 return {x,z};
}
// Invitation only. Movement after acceptance is the existing escort follow/lead, which already routes around obstacles.
function followInvite(previous,{now,accepted=false,declined=false,maxWait=30}={}){
 const p=previous&&previous.phase?previous:{phase:'offer',at:now};
 if(p.phase==='active'||p.phase==='done')return p;
 if(declined)return {phase:'return',at:now,generation:p.generation||0};
 if(p.phase==='return')return accepted?p:{phase:'offer',at:now,generation:p.generation||0};
 if(now-(p.at??now)>=Math.max(0,maxWait)*1000)return {phase:'return',at:now,generation:p.generation||0};
 if(accepted)return {phase:'active',at:now,generation:(p.generation||0)+1};
 return p;
}
// One speaker, then the listeners. Authored and alternate both take turns in member order; a free order lets the first present member speak.
function groupStep(coordinator,spec){
 const members=Array.isArray(spec.members)?spec.members:[],near=spec.near instanceof Set?spec.near:new Set(spec.near||[]);
 const present=members.filter(id=>near.has(id)),alternate=spec.order!=='free';
 if(present.length<2)return {line:null,poses:{}};
 const speaker=coordinator.next(spec.id,present,alternate),lines=speaker?spec.lines?.[speaker]||[]:[];
 if(!speaker||!lines.length)return {line:null,poses:{}};
 const token=coordinator.acquire(spec.id,speaker,present,spec.cooldownMs||0,alternate);
 if(!token)return {line:null,poses:{}};
 const index=spec.index?.[speaker]||0,line=lines[index%lines.length];
 if(spec.index)spec.index[speaker]=index+1;
 const finish=()=>coordinator.release(token,present);
 if(!spec.hold)finish();
 const poses={};for(const id of members)if(near.has(id))poses[id]=id===speaker&&line?'talk':'idle';
 return {speaker,line,poses,...(spec.hold?{finish}:{})};
}
function followStep({phase='invite',waited=0}={},input){
 const {dt=0,accepted=false,declined=false,near=false,atDestination=false,playerArrived=false,maxWait=30}=input;
 if(phase==='done'||phase==='return')return {phase,waited};
 if(declined)return {phase:'return',waited:0};
 if(phase==='invite'&&!accepted){const w=waited+Math.max(0,dt);return {phase:w>=maxWait?'return':'invite',waited:w};}
 if(atDestination&&playerArrived)return {phase:'done',waited:0};
 if(near&&!atDestination)return {phase:'lead',waited:0};
 const w=waited+Math.max(0,dt);return {phase:w>=maxWait?'return':'wait',waited:w};
}
const api={createDialogueCoordinator,roomVisit,roomDialogueStep,clearRoomLine,roomDuoStep,separate,followInvite,groupStep,followStep};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidAdvancedInteractions=api;
})(typeof globalThis!=='undefined'?globalThis:this);
