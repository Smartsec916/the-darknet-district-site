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
   while(remaining.size){
    remaining.delete(place);
    const candidates=rules.filter(({entry,rule})=>entry.locations.includes(place.kind)&&(!rule.from||rule.from===place.kind)&&byKind.has(rule.destination)&&!used.has(entry.id)&&
     (remaining.has(byKind.get(rule.destination))||rule.destination===place.kind||(!remaining.size&&rule.destination===stops[0].kind)));
    const decision=candidates.length?candidates[lap%candidates.length]:null;
    const scheduled=remaining.values().next().value||stops[0];
    const target=decision?byKind.get(decision.rule.destination):scheduled;
    visits.push({place,lap,decision,next:target});
    if(decision)used.add(decision.entry.id);
    if(target===place){
     // An agreed second round uses the cabinet already occupied. Never route back through the hallway.
     visits.push({place,lap,next:scheduled,replay:true});place=scheduled;
    }else place=target;
   }
  }
  return visits;
 }
 function eligible(entry,rule,ctx){
  if(rule.destination||rule.from&&rule.from!==ctx.venue||!entry.locations.includes(ctx.venue))return false;
  if((entry.requiresAdminNearby||rule.requires==='admin')&&!ctx.admin)return false;
  if(rule.requires==='iris'&&!ctx.iris||rule.requires==='pixel-in-vr'&&!ctx.split||rule.requires==='observer'&&!ctx.observer)return false;
  if(ctx.split&&!entry.lines.every(l=>l.speaker==='neon'||l.speaker==='bartender'))return false;
  if(ctx.approaching&&rule.phase!=='general')return false;
  if(rule.phase==='after'&&(!ctx.completed||ctx.remaining>40))return false;
  if(rule.phase==='before'&&ctx.elapsed>20)return false;
  return duration(entry)<ctx.remaining;
 }
 // All observers use the same slot. Proximity controls audibility, never the group's itinerary.
 const interval=52;
 function conversationAt(library,edits,context,legStart,visit){
  const slot=Math.floor(context.elapsed/interval),age=context.elapsed-slot*interval;
  const window={...context,elapsed:slot*interval+3,remaining:context.remaining+age-3};
  const candidates=library.filter(e=>eligible(e,{...e.behavior,...edits[e.id]},window));
  if(!candidates.length)return null;
  const seed=Math.floor(legStart/interval)+slot*7+(visit||0);
  const entry=candidates[((seed%candidates.length)+candidates.length)%candidates.length];
  return {entry,time:age-3};
 }
 const phases=['before','during','after','general'],venues=['district','arcade','vr','store','bar'];
 function valid(edits){
  if(!edits||typeof edits!=='object'||Array.isArray(edits)||Object.keys(edits).length>128)return false;
  return Object.entries(edits).every(([id,v])=>/^pn-[a-z0-9-]{1,80}$/.test(id)&&v&&typeof v==='object'&&!Array.isArray(v)&&
   Object.keys(v).every(k=>['phase','destination','agreement','delay','from','requires'].includes(k))&&
   (v.phase===undefined||phases.includes(v.phase))&&(v.from===undefined||venues.includes(v.from))&&
   (v.destination===undefined||['','arcade','vr','store','bar'].includes(v.destination))&&
   (v.requires===undefined||['','admin','iris','observer','pixel-in-vr'].includes(v.requires))&&
   (v.agreement===undefined||Number.isInteger(v.agreement)&&v.agreement>=0&&v.agreement<32)&&
   (v.delay===undefined||Number.isFinite(v.delay)&&v.delay>=0&&v.delay<=30));
 }
 const api={interval,plan,eligible,duration,conversationAt,valid,phases,venues};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidSharedActivities=api;
})(globalThis);
