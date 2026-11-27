/* Plan each group's visits before sampling its shared clock, so a late observer sees
   the same accepted decisions even if they were out of earshot at the time. */
(function(root){
 'use strict';
 const duration=entry=>entry.lines.reduce((t,line)=>t+line.seconds+.45,0);
 function plan(stops,library,edits={},rounds=3){
  const visits=[],byKind=new Map(stops.map(s=>[s.kind,s]));
  const rules=library.map(entry=>({entry,rule:{...entry.behavior,...edits[entry.id]}}));
  for(let lap=0;lap<rounds;lap++){
   const remaining=new Set(stops),used=new Set();
   let place=stops[0];
   do{
    remaining.delete(place);
    const candidates=rules.filter(({entry,rule})=>entry.locations.includes(place.kind)&&(!rule.from||rule.from===place.kind)&&byKind.has(rule.destination)&&!used.has(entry.id));
    const decision=candidates.length===1&&lap%3===1?null:candidates.length?candidates[lap%candidates.length]:null;
    const scheduled=remaining.values().next().value||stops[0];
    const target=decision?byKind.get(decision.rule.destination):scheduled;
    visits.push({place,lap,decision,next:target});
    if(decision)used.add(decision.entry.id);
    if(target===place){
     // An agreed second round uses the cabinet already occupied. Never route back through the hallway.
     visits.push({place,lap,next:scheduled,replay:true});place=scheduled;
    }else place=target;
   }while(remaining.size||place!==stops[0]);
  }
  return visits;
 }
 function contextFits(entry,rule,ctx){
  if(((rule.requires??(entry.requiresAdminNearby?'admin':''))==='admin')&&!ctx.admin)return false;
  if(rule.requires==='iris'&&!ctx.iris||rule.requires==='pixel-in-vr'&&!ctx.split||rule.requires==='observer'&&!ctx.observer)return false;
  if(ctx.split&&!entry.lines.every(l=>l.speaker==='neon'||l.speaker==='bartender'))return false;
  return true;
 }
 function eligible(entry,rule,ctx){
  if(rule.destination||rule.from&&rule.from!==ctx.venue||!entry.locations.includes(ctx.venue)||!contextFits(entry,rule,ctx))return false;
  if(ctx.approaching&&rule.phase!=='general')return false;
  if(rule.phase==='after'&&(!ctx.completed||ctx.remaining>40))return false;
  if(rule.phase==='before'&&ctx.elapsed>20)return false;
  return duration(entry)<ctx.remaining;
 }
 // All observers use the same slot. Proximity controls audibility, never the group's itinerary.
 function triggerTime(entry,rule,activityEnd){
  const delay=rule.delay||0;
  if(rule.when==='start')return delay;
  if(rule.when==='after-activity')return activityEnd+delay;
  if(rule.when==='finish')return duration(entry)+delay;
  return entry.lines.slice(0,(rule.agreement??entry.lines.length-1)+1).reduce((sum,l)=>sum+l.seconds+.45,delay);
 }
 const gestures=['watch','look','talk','interact','wave','shrug','laugh','head-tilt','glance-back'];
 function motionAt(rule,entry,time,actor,seconds){
  if(!rule.motions?.length||actor!==(rule.actor||entry.lines[0].speaker))return null;
  let t=time-triggerTime(entry,rule, duration(entry));if(t<0)return null;
  for(const clip of rule.motions){const length=seconds(clip);if(!(length>0))continue;
   if(t<length)return clip;t-=length;
  }
  return null;
 }
 const interval=52;
 function slotStart(context){
  const last=context.elapsed+context.remaining-31;
  return last>interval&&context.elapsed>=last?last:Math.floor(context.elapsed/interval)*interval;
 }
 // Local player story flags and observer proximity gate listening, not the shared slot.
 function publicContext(context){return {...context,admin:context.venue==='store',observer:true};}
 function slotKey(context,legStart){
  return [Math.round(legStart),Math.round(slotStart(context)*2),context.venue,context.iris,context.split,context.approaching].join('|');
 }
 function reservedAt(entry,rule,context,time){
  return !!entry&&contextFits(entry,rule,publicContext(context))&&time>=-1&&time<duration(entry)+.5;
 }
 function conversationAt(library,edits,context,legStart,visit){
  const start=slotStart(context),age=context.elapsed-start;
  const window={...publicContext(context),elapsed:start+3,remaining:(context.freeUntil??context.remaining)+age-3};
  const candidates=library.filter(e=>eligible(e,{...e.behavior,...edits[e.id]},window));
  if(!candidates.length)return null;
  const seed=Math.floor(legStart/interval)+Math.round(start)*7+(visit||0);
  const entry=candidates[((seed%candidates.length)+candidates.length)%candidates.length];
  return {entry,time:age-3};
 }
 const phases=['before','during','after','general'],venues=['district','arcade','vr','store','bar'];
 function valid(edits){
  if(!edits||typeof edits!=='object'||Array.isArray(edits)||Object.keys(edits).length>128)return false;
  return Object.entries(edits).every(([id,v])=>/^pn-[a-z0-9-]{1,80}$/.test(id)&&v&&typeof v==='object'&&!Array.isArray(v)&&
   Object.keys(v).every(k=>['phase','destination','agreement','delay','from','requires','when','motions','actor'].includes(k))&&
   (v.actor===undefined||['pixel','neon'].includes(v.actor))&&
   (v.motions===undefined||Array.isArray(v.motions)&&v.motions.length<=8&&v.motions.every(clip=>gestures.includes(clip)))&&
   (v.when===undefined||['start','agreement','finish','after-activity'].includes(v.when))&&
   (v.phase===undefined||phases.includes(v.phase))&&(v.from===undefined||v.from===''||venues.includes(v.from))&&
   (v.destination===undefined||['','arcade','vr','store','bar'].includes(v.destination))&&
   (v.requires===undefined||['','admin','iris','observer','pixel-in-vr'].includes(v.requires))&&
   (v.agreement===undefined||Number.isInteger(v.agreement)&&v.agreement>=0&&v.agreement<32)&&
   (v.delay===undefined||Number.isFinite(v.delay)&&v.delay>=0&&v.delay<=30));
 }
 const api={contextFits,publicContext,slotKey,reservedAt,gestures,motionAt,interval,slotStart,triggerTime,plan,eligible,duration,conversationAt,valid,phases,venues};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidGroupActivities=api;
})(globalThis);
