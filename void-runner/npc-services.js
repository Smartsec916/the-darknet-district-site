// Optional offers layer over an NPC's existing conversation. Missions and authored escorts retain priority.
(function(root){
 'use strict';
 const sales=new Map();let kiosks=[];
 const salesCache='void-runner-published-kiosk-settings-v1';
 try{const cached=JSON.parse(root.localStorage?.getItem(salesCache)||'[]');if(Array.isArray(cached))kiosks=cached;}catch{}let loaded=0,loading=false,lastStep='',active=null;
 function index(content){kiosks=(content?.vendors||[]).filter(v=>v.kind==='kiosk').map(({id,name,entity,rules})=>({id,name,entity,rules:rules||{}}));
  try{root.localStorage?.setItem(salesCache,JSON.stringify(kiosks));}catch{}
  sales.clear();for(const v of content?.vendors||[])if(v.kind==='npc'&&v.enabled!==false&&v.entries.some(e=>e.available))sales.set(v.entity.replace(/^npc-/,''),v);}
 function stage(service,now){
  if(!service||now<service.started||now>=service.expires)return null;
  let elapsed=now-service.started;
  for(const [i,s] of service.definition.steps.entries()){if(elapsed<s.seconds)return {i,step:s};elapsed-=s.seconds;}
  return {i:-1,step:null};
 }
 function sync(){
  if(!loading&&Date.now()-loaded>60000&&typeof mode==='string'&&root.VoidNetwork){
   loading=true;loaded=Date.now();root.VoidNetwork.request('items/catalog').then(d=>index(d.content)).catch(()=>{}).finally(()=>loading=false);
  }
  const s=root.VoidConsumableGame?.data?.service,now=root.VoidConsumableGame?.now(),next=stage(s,now);
  if(!next){if(active)root.VoidLiveContent?.replan?.();active=null;lastStep='';return;}
  active=s;const key=s.id+'/'+next.i;if(lastStep===key)return;lastStep=key;root.VoidLiveContent?.replan?.();
  if(next.step?.line&&typeof announce==='function')announce(s.npc+' · '+next.step.line);
 }
 const pools = new Map();
 function playerKey(field){
  return 'vr-patch:'+ (root.VoidAccount?.user?.uid || 'local') + ':' + field;
 }
 function recall(field){try{return Number(root.localStorage?.getItem(playerKey(field)))||0;}catch{return 0;}}
 function remember(field,value){try{root.localStorage?.setItem(playerKey(field),String(value));}catch{}}
 function vendorNearby(){
  if(typeof walker==='undefined'||!walker||typeof walkingLocation==='undefined'||walkingLocation?.area!=='street')return false;
  const post=root.VoidMadeNPCs?.patchOuting?.();
  return post?.phase==='sell'&&Math.hypot(walker.x-post.x,walker.z-post.z)<=1.22;
 }
 function line(category){
  const lines=pools.get(category);
  if(!lines?.length)return null;
  return lines[Math.floor(Math.random()*lines.length)].text;
 }
 function remark(category){
  const text=line(category),audio=root.VoidAudio;
  if(!text||!vendorNearby()||audio?.voiceStatus?.active)return false;
  const post=root.VoidMadeNPCs.patchOuting();
  if(typeof announce==='function')announce('Patch · '+text);
  audio?.speakNearby('patch',text,post,walker);
  return true;
 }
 function greet(cooldown){
  if(Date.now()<recall('greeted')+cooldown*1000)return;
  if(remark(recall('customer')?'repeat-customers':'proximity-greetings'))remember('greeted',Date.now());
 }
 function shopEvent(id,event){
  if(id!=='npc-patch')return;
  if(event==='successful-purchases')remember('customer',1);
  remark(event);
 }
 function conversation(id){
  if(id!=='patch')return null;
  const post=root.VoidMadeNPCs?.patchOuting?.();
  const category=!post?'at-his-apartment':post.phase==='walk'?(post.returning?'leaving-his-vendor-location':'encountered-while-walking'):Math.random()<.5?'anti-corporate-remarks':'ambient-remarks';
  return line(category);
 }
 function available(id){return sales.has(id)&&(id!=='patch'||vendorNearby());}
 function offer(ids,normal){
  const id=ids.find(available),v=sales.get(id);if(!v||!root.talkChoice)return false;
  return !!root.talkChoice([{who:id==='patch'?id:v.name,text:(id==='patch'&&line('browsing-merchandise'))||v.rules?.message||'What can I help you with?',ambient:true,silent:id!=='patch'}],[
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
 const api={index,stage,get kiosks(){return kiosks;},has:ids=>ids.some(available),greet,shopEvent,conversation,offer,plan,pose,get active(){return active;}};if(typeof module!=='undefined')module.exports=api;else root.VoidNPCServices=api;
 if(root.document){
  const getLines=()=>{if(!root.VoidVoiceClips?.patchLines){setTimeout(getLines,350);return;}root.VoidVoiceClips.patchLines.then(groups=>{
   for(const group of groups||[])pools.set(group.stage,group.lines);
  });};getLines();
  setInterval(sync,350);
 }
})(globalThis);
