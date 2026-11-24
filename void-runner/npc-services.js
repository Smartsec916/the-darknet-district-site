// Optional offers layer over an NPC's existing conversation. Missions and authored escorts retain priority.
(function(root){
 'use strict';
 const sales=new Map();let loaded=0,loading=false,lastStep='',active=null;
 function index(content){sales.clear();for(const v of content?.vendors||[])if(v.kind==='npc'&&v.enabled!==false&&v.entries.some(e=>e.available))sales.set(v.entity.replace(/^npc-/,''),v);}
 function stage(service,now){
  if(!service||now<service.started||now>=service.expires)return null;
  let elapsed=now-service.started;
  for(const [i,s] of service.definition.steps.entries()){if(elapsed<s.seconds)return {i,step:s};elapsed-=s.seconds;}
  return {i:-1,step:null};
 }
 function sync(){
  if(!loading&&Date.now()-loaded>60000&&typeof mode==='string'&&mode==='walking'&&root.VoidNetwork){
   loading=true;loaded=Date.now();root.VoidNetwork.request('items/catalog').then(d=>index(d.content)).catch(()=>{}).finally(()=>loading=false);
  }
  const s=root.VoidConsumableGame?.data?.service,now=root.VoidConsumableGame?.now(),next=stage(s,now);
  if(!next){if(active)root.VoidLiveContent?.replan?.();active=null;lastStep='';return;}
  active=s;const key=s.id+'/'+next.i;if(lastStep===key)return;lastStep=key;root.VoidLiveContent?.replan?.();
  if(next.step?.line&&typeof announce==='function')announce(s.npc+' · '+next.step.line);
 }
 function offer(ids,normal){
  const id=ids.find(x=>sales.has(x)),v=sales.get(id);if(!v||!root.talkChoice)return false;
  return !!root.talkChoice([{who:v.name,text:v.rules?.message||'What can I help you with?',ambient:true,silent:true}],[
   {label:'Talk',run:normal},{label:'Browse products and services',run:()=>{if(typeof resumeWalking==='function')resumeWalking();root.VoidCatalogShop.open(v.id);}},
   {label:'Leave',leave:true,run:()=>{if(typeof resumeWalking==='function')resumeWalking();}}],'');
 }
 function pose(id){if(!active||active.npc!==id)return null;return stage(active,root.VoidConsumableGame.now())?.step?.clip||null;}
 function plan(id,authored){
  if(!active||active.npc!==id)return null;
  const now=stage(active,root.VoidConsumableGame.now()),idx=now?.step?.point;
  if(!idx)return null;
  const point=authored?.points?.[idx-1];if(!point)return null;
  return {key:'service:'+active.id+':'+now.i,area:root.VoidNPCAreas?.areaOf(point)||authored.area,why:'service',mode:'stay',x:point.x,z:point.z,yaw:point.yaw||0,
   actions:[now.step.clip||point.action||'idle'],npc:id};
 }
 const api={index,stage,has:ids=>ids.some(id=>sales.has(id)),offer,plan,pose,get active(){return active;}};if(typeof module!=='undefined')module.exports=api;else root.VoidNPCServices=api;
 if(root.document)setInterval(sync,350);
})(globalThis);
