/* The beginner campaign on screen (browser only; rules and content are in beginner.js). Hooks the existing District interactions (Admin, Iris, the bar, the shop, the Landing Terminal),
   watches the game state for the V1, the KeyMap, boarding, launch, the jump and the docking, and announces progress. Every step is decided by the rules module from the SAVED state,
   so a reload, a disconnect or a scene change can never lose or repeat anything. It does nothing for a campaign that is not a District campaign or that has a developer test ship. */
(function(root){
 'use strict';
 const B=root.VoidBeginner;if(!B||typeof VoidInteractions==='undefined'||typeof VoidMissions==='undefined')return;
 B.register(VoidMissions);
 const live=()=>typeof state!=='undefined'&&state?.story?.flags&&B.applies(state);
 const title=id=>B.byId[id]?.title||id;
 function after(r){
  if(!r||!(r.objective||r.missionCompleted))return;
  const m=B.byId[r.mission],o=m?.objectives.find(x=>x.id===r.objective),parts=[];
  if(r.missionCompleted){parts.push('MISSION COMPLETE · '+m.title);if(r.reward)parts.push('+'+r.reward+' credits');}
  else if(o)parts.push('MISSION UPDATED · '+m.title+' · '+o.label+' ✓');
  if(r.next)parts.push('NEW MISSION · '+title(r.next)+' (tracked in your V1, L)');
  if(o?.award==='ship')parts.push('SHIP ACQUIRED · '+(typeof VoidShips!=='undefined'?VoidShips.get(state).name:'courier hull'));
  try{save();hud();}catch{}
  announce(parts.join('  ·  '));
 }
 // Interactions: the beginner step first (a line of dialogue or just progress), the existing behaviour otherwise.
 function wrap(action,name,{show=true,refreshPad=false}={}){
  const prev=VoidInteractions.handlers.get(action);
  VoidInteractions.register(action,arg=>{
   if(!live())return prev?.(arg);
   const r=B.event(state,name,VoidMissions,C),lines=r.lines||r.early;
   after(r);
   if(show&&lines?.length){
    talk('',lines,async()=>{if(refreshPad&&r.objective==='claim'){try{delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true});}catch{resumeWalking();}}else resumeWalking();},'CONTINUE');
    return;
   }
   return prev?.(arg);
  });
 }
 wrap('admin','talk-admin');wrap('district-iris','talk-iris');wrap('district-bar','visit-bar',{show:false});wrap('district-shop','visit-shop',{show:false});wrap('terminal','use-terminal',{refreshPad:true});
 // State watcher (three times a second): offers, the V1, the KeyMap, boarding, launch, the jump and docking.
 const fire=name=>after(B.event(state,name,VoidMissions,C));
 setInterval(()=>{
  try{
   if(!live()||!state.universe)return;
   const f=state.story.flags;
   if(mode==='walking'&&typeof walker!=='undefined'&&walker&&f.podWakePending!==true&&!root.VoidCharacterCreator?.isOpen){
    const n=B.offer(state,VoidMissions,C);if(n){try{save();}catch{}announce('NEW MISSION · '+n.title+' · '+(n.id==='first-contact'?'L opens your V1 · K shows your controls':'tracked in your V1 (L)'));}
   }
   if(root.VoidPersonalDevice?.isOpen)fire('v1-open');
   if(f.keymapSeen===true||root.VoidKeyMapUI?.open)fire('keymap-seen');
   if(mode==='play'&&state.location==='earth'&&state.story.flags.shipAccess!=='none'){
    fire('board-ship');const r=typeof flight!=='undefined'?flight.route:null;
    if(r&&['align','warp','encounter','arrived'].includes(r.phase))fire('launch');
    if(r&&r.destination==='meridian'&&(r.phase==='warp'||r.phase==='arrived'||r.progress>0))fire('warp-meridian');
   }
   if(state.location==='meridian'&&['walking','dock','arrival'].includes(mode))fire('dock-meridian');
  }catch{}
 },500);
 root.VoidBeginnerUI={get live(){return live();},summary:()=>B.summary(state)};
})(globalThis);
