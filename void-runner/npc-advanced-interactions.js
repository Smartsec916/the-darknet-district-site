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
 return {acquire,release,clear,busy:group=>active.has(group)};
}
function roomVisit(previous,inside,now){
 const p=previous||{inside:false,enteredAt:null};
 if(inside&&!p.inside)return {state:{inside:true,enteredAt:now},event:'enter',duration:0};
 if(!inside&&p.inside)return {state:{inside:false,enteredAt:null},event:'exit',duration:Math.max(0,now-p.enteredAt)};
 return {state:p,event:null,duration:inside?Math.max(0,now-p.enteredAt):0};
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
const api={createDialogueCoordinator,roomVisit,followStep};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidAdvancedInteractions=api;
})(typeof globalThis!=='undefined'?globalThis:this);
