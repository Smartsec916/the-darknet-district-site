/* THE BEGINNER CAMPAIGN (rules + content; runs in the browser and in Node tests). Six short missions that take a new player from the Sleeping Pod to their first ship and the
   first departure for Meridian Station. It uses only what exists: Admin and Iris in The Darknet District, the District bar and shop, the Landing Terminal and Pad 01 on the
   NeoChinatown street, the V1 Mission Log, the real ship system (Campaign.awardStarterShip) and real flight and travel. It adds no new character, place, mechanic or voice.
   STATUS: PROPOSED (David has not approved this story content; CLAUDE.md). All mission and dialogue text here is UNREVIEWED placeholder wording in the established voices of Admin
   and Iris, shown as text (no new voice clips). Nothing replaces or revives the archived missions: the mission pool of a District campaign stays closed for everything else.
   Progress is ordinary mission records (universe.missions) plus story.flags booleans, so saves need no new fields and the cloud save validator accepts them as they are.
   The records below are plain data: the Developer Studio reads and edits this same structure (docs/development/BEGINNER_CAMPAIGN.md). */
(function(root){
 'use strict';
 const M=typeof module!=='undefined'?require('./mission-log.js'):root.VoidMissions;
 const C=typeof module!=='undefined'?require('./campaign.js'):root.VoidCampaign||root.C;
 const you=text=>({who:'You',text}),admin=text=>({who:'Admin',text}),iris=text=>({who:'Iris',text});
 // objective: {id,label,on:<event>,requires:[ids],say:[lines when done],early:[lines if the event comes too soon],interaction,destination}
 const MISSIONS=[
  {id:'first-contact',title:'FIRST CONTACT',type:'main',giver:'Admin',description:'You are out of the pod and standing in The Darknet District. Learn your V1 and your controls, then introduce yourself to Admin at the counter.',destination:'earth',rewards:0,
   objectives:[
    {id:'v1',label:'Open your V1 with L and read your Mission Log',on:'v1-open'},
    {id:'controls',label:'Check your controls with K (the KeyMap)',on:'keymap-seen'},
    {id:'speak',label:'Speak with Admin at the counter',on:'talk-admin',interaction:'admin',say:[admin('You’re the new face. Good. The District doesn’t hand out favors, but it does hand out work.'),admin('Iris keeps the contracts. Do a few honest errands for her and we’ll talk about getting you off the ground.')]}]},
  {id:'district-errand',title:'DISTRICT ERRAND',type:'main',giver:'Iris',description:'Iris wants eyes on the District. Check the bar and the shop, then report back to her. Track it in your V1 (L) and follow the waypoint.',destination:'earth',rewards:100,prerequisites:['first-contact'],
   objectives:[
    {id:'bar',label:'Visit the bar',on:'visit-bar',interaction:'district-bar'},
    {id:'shop',label:'Visit the shop',on:'visit-shop',interaction:'district-shop'},
    {id:'report',label:'Report back to Iris',on:'talk-iris',requires:['bar','shop'],interaction:'district-iris',early:[iris('Bar and shop first. Then come back and tell me what you saw.')],say:[iris('Quiet bar, open shop, nobody losing their temper. Good eyes.'),iris('Here. A hundred credits. Don’t spend it all in one place.')]}]},
  {id:'job-worth-taking',title:'A JOB WORTH TAKING',type:'main',giver:'Iris',description:'A sealed parcel has to reach the Landing Terminal on the street, and Iris wants the receipt back. Use the door out of the District and the V1 map.',destination:'earth',rewards:250,prerequisites:['district-errand'],
   objectives:[
    {id:'collect',label:'Collect the parcel from Iris',on:'talk-iris',interaction:'district-iris',say:[iris('Sealed, tamper-proof, and none of your business. Landing Terminal, out on the street. I want the receipt.')]},
    {id:'deliver',label:'Deliver the parcel to the Landing Terminal on the street',on:'use-terminal',requires:['collect'],interaction:'terminal',say:[{who:'Landing terminal',text:'PARCEL ACCEPTED. RECEIPT PRINTED.'}]},
    {id:'return',label:'Bring the receipt back to Iris',on:'talk-iris',requires:['deliver'],interaction:'district-iris',say:[iris('Receipt checks out. Two hundred and fifty, as promised. You’re reliable. That’s rarer than you’d think.')]}]},
  {id:'ship-opportunity',title:'THE SHIP OPPORTUNITY',type:'main',giver:'Admin',description:'Admin has a courier hull on Pad 01 for runners who finish what they start. It costs nothing. He wants a word, and Iris has to clear the paperwork.',destination:'earth',rewards:0,prerequisites:['job-worth-taking'],
   objectives:[
    {id:'ask',label:'Ask Admin about transport',on:'talk-admin',interaction:'admin',say:[admin('A runner without a ship is just a pedestrian. Pad 01 has a courier hull the District keeps for people who finish what they start.'),admin('You’ve finished things. No fee, no strings. Iris clears the paperwork. Don’t scratch it.')]},
    {id:'clearance',label:'Get your pad clearance from Iris',on:'talk-iris',requires:['ask'],interaction:'district-iris',early:[iris('Admin first. He likes to hand these over himself.')],say:[iris('Clearance filed. Pad 01 answers to you now. The Landing Terminal on the street will register the hull.')]}]},
  {id:'first-ship',title:'YOUR FIRST SHIP',type:'main',giver:'Admin',description:'Register the courier hull at the Landing Terminal on the street, then board it at Pad 01 (E at the ship).',destination:'earth',rewards:0,prerequisites:['ship-opportunity'],
   objectives:[
    {id:'claim',label:'Register the courier hull at the Landing Terminal',on:'use-terminal',interaction:'terminal',award:'ship',say:[{who:'Landing terminal',text:'COURIER HULL REGISTERED TO YOU. PAD 01 UNLOCKED.'}]},
    {id:'board',label:'Board your ship at Pad 01',on:'board-ship',requires:['claim'],interaction:'board'}]},
  {id:'first-departure',title:'FIRST DEPARTURE',type:'main',giver:'Admin',description:'Take your ship to Meridian Station. Clear the pad, steer the nose onto the MERIDIAN marker (mouse, or W S A D) and hold it there to jump. Dock when you arrive.',destination:'meridian',rewards:200,prerequisites:['first-ship'],
   objectives:[
    {id:'launch',label:'Clear the pad',on:'launch'},
    {id:'warp',label:'Line up on the MERIDIAN marker and jump',on:'warp-meridian',requires:['launch'],destination:'meridian'},
    {id:'arrive',label:'Dock at Meridian Station',on:'dock-meridian',requires:['warp'],destination:'meridian'}]}
 ];
 const byId=Object.fromEntries(MISSIONS.map(m=>[m.id,m]));
 const flagOf=id=>'br_'+id;                                    // story.flags: this mission's reward was paid (never paid twice)
 const closed=s=>s?.story?.flags?.missionPool==='closed';
 // The campaign applies to a District campaign (closed pool) that has not had a developer test ship.
 const applies=s=>closed(s)&&s?.story?.flags?.testShip!==true;
 function register(Missions=M){for(const m of MISSIONS)Missions.define(m.id,{title:m.title,type:m.type,description:m.description,giver:m.giver,source:'beginner',beginner:true,destination:m.destination,rewards:m.rewards||null,prerequisites:m.prerequisites||[],objectives:m.objectives.map(o=>({id:o.id,label:o.label,...(o.interaction?{interaction:o.interaction}:{}),...(o.destination?{destination:o.destination}:{})}))});}
 const entry=(s,id)=>s.universe?.missions?.[id]||null;
 const done=(s,id)=>entry(s,id)?.completed===true;
 // The mission the player is on: the first one not completed whose prerequisites are done.
 function current(s){if(!applies(s)&&!s?.story?.flags?.starterShipAwarded&&!Object.keys(s?.universe?.missions||{}).some(k=>byId[k]))return null;for(const m of MISSIONS)if(!done(s,m.id))return (m.prerequisites||[]).every(p=>done(s,p))?m:null;return null;}
 /* Starts the next mission if it is due (acquired and tracked). Returns the mission offered, or null. */
 function offer(s,Missions=M,Camp=C){
  if(!s?.universe||!applies(s)||!s.story?.flags)return null;
  const m=current(s);if(!m||entry(s,m.id)?.acquired)return null;
  const e=Missions.acquire(s,m.id);if(!e)return null;
  if(s.universe.trackedMission==null||byId[s.universe.trackedMission]||!entry(s,s.universe.trackedMission)?.acquired)Missions.track(s,m.id,Camp);
  return m;
 }
 /* An event happened ('talk-admin', 'visit-bar', 'use-terminal', 'board-ship', ...). Completes the matching objective of the current mission when its requirements are met.
    Returns {mission, objective, lines, early, missionCompleted, reward, next}. Nothing happens twice: finished objectives and paid rewards are never repeated. */
 function event(s,name,Missions=M,Camp=C){
  const out={mission:null,objective:null,lines:null,early:null,missionCompleted:false,reward:0,next:null};
  if(!s?.universe||!s.story?.flags||!(applies(s)||Object.keys(s.universe.missions||{}).some(k=>byId[k]&&!s.story.flags.testShip)))return out;
  const m=current(s);if(!m)return out;const rec=entry(s,m.id);if(!rec?.acquired)return out;
  const o=m.objectives.find(x=>x.on===name&&rec.objectives?.[x.id]!==true&&(x.requires||[]).every(r=>rec.objectives?.[r]===true));
  if(!o){const early=m.objectives.find(x=>x.on===name&&rec.objectives?.[x.id]!==true&&x.early);if(early)out.early=early.early;return out;}
  if(!Missions.complete(s,m.id,o.id,Camp))return out;
  out.mission=m.id;out.objective=o.id;out.lines=o.say||null;
  if(o.award==='ship'&&Camp?.awardStarterShip)Camp.awardStarterShip(s);
  const now=entry(s,m.id);
  if(now?.completed&&s.story.flags[flagOf(m.id)]!==true){
   s.story.flags[flagOf(m.id)]=true;out.missionCompleted=true;
   if(m.rewards>0){s.credits=(s.credits||0)+m.rewards;out.reward=m.rewards;}
   const n=offer(s,Missions,Camp);out.next=n?n.id:null;
  }
  return out;
 }
 // Developer / test helper: where is this player in the campaign (no side effects).
 function summary(s){return MISSIONS.map(m=>({id:m.id,acquired:entry(s,m.id)?.acquired===true,completed:done(s,m.id),rewarded:s?.story?.flags?.[flagOf(m.id)]===true,objectives:m.objectives.map(o=>({id:o.id,done:entry(s,m.id)?.objectives?.[o.id]===true}))}));}
 const api={MISSIONS,byId,flagOf,applies,register,current,offer,event,summary};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidBeginner=api;
})(globalThis);
