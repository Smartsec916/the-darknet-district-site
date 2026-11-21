/* THE UNDERGROUND IN PLAY (browser only; ncz-underground.js has the layout, the places and the rules; docs/development/AI_HANDOFF.md 20 Nov 2026).
   - DOWN: the steel door at the foot of each alley stairwell (ncz-backalleys.js UNDERGROUND_ENTRANCES) now has "GO DOWN INTO THE TUNNELS" (only on its landing): a short
     dark fade and the player stands inside that entrance's gang checkpoint, facing into the network (the street's quarter `underground`, one shared place for everyone).
   - UP: the checkpoint's outer door has "GO UP THE STAIRS TO THE STREET": the door opens, a fade, and the player stands on the same stairwell's landing facing up the stairs.
   - FLOOR: the network's floor is 3 m below the street (VoidUnderground.Y): the walk's height is put there (the stairwells' landings are at the same depth).
   - LOOK: the rooms' things say what they are (the modules' own words), like the modules of a mission location; nothing is a mission event here.
   Wraps VoidNeoChinatown.layout (the stair doors' prompts) and VoidExplorer.step (the floor's height and the prompt on the landing only). */
(function(root){
 'use strict';
 const U=root.VoidUnderground,BA=root.VoidBackAlleys,E=root.VoidExplorer,NC=root.VoidNeoChinatown;if(!U||!BA||!E||!NC||typeof document==='undefined')return;
 const KEY=()=>root.VoidDistrictArea?.KEY?.street||'sacramento';
 const note=t=>{try{resumeWalking();}catch{}try{announce(t);}catch{}};
 // ---- the stair doors' prompts in the three quarters (hidden unless the player is down on the landing) ----
 if(NC.layout&&!NC.layout.underground){const orig=NC.layout;NC.layout=function(area,quarter){const l=orig.apply(this,arguments);
   if(area==='street'&&l&&l.quarter&&l.quarter!==U.ID)l.interactions=[...l.interactions,...BA.UNDERGROUND_ENTRANCES.filter(u=>u.quarter===l.quarter).map(u=>({id:'under-down-'+u.id,label:'GO DOWN INTO THE TUNNELS',position:[u.bottom[0]+u.facing[0]*.5,u.bottom[1]+1.5,u.bottom[2]+u.facing[1]*.5],action:'under-down',entrance:u.id,range:1.5,hidden:true}))];
   return l;};NC.layout.underground=true;}
 // ---- the walk: the network's floor; the stair door's prompt only on its landing ----
 const step0=E.step;E.step=function(p,input,dt,loc){const r=step0.apply(this,arguments);let me=null;try{me=typeof walker!=='undefined'?walker:null;}catch{}if(!me||p!==me||!loc||loc.area!=='street')return r;
  if(loc.quarter===U.ID){p.y+=U.Y;return r;}
  for(const it of loc.interactions||[])if(it.action==='under-down')it.hidden=!(p.y<U.Y+2.2&&Math.hypot(p.x-it.position[0],p.z-it.position[2])<2.2);
  return r;};
 // ---- the fade and the move ----
 const veil=document.createElement('div');veil.id='under-veil';veil.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .4s ease;z-index:60';document.body.append(veil);
 const fade=v=>new Promise(r=>{const D=root.VoidApartments?.DOOR||{fadeIn:.18,fadeOut:.32},t=v?D.fadeIn:D.fadeOut;veil.style.transition='opacity '+t+'s ease';veil.style.opacity=v?'1':'0';setTimeout(r,t*1000+20);});   // the shared door fade (apartments.js DOOR)
 let busy=false;
 async function go(to){if(busy||!to)return;busy=true;try{resumeWalking();}catch{}try{root.VoidAudio?.event?.('door');}catch{}
  try{await fade(1);await enterWalking(KEY(),{silent:true,quarter:to.quarter,spawn:to.spawn,yaw:to.yaw});}catch(e){console.warn('[underground]',e);note('The door is stuck.');}
  finally{setTimeout(()=>{fade(0);busy=false;},250);}}
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof enterWalking==='undefined')return;clearInterval(wait);
  const DW=()=>Math.round(((root.VoidApartments?.DOOR?.wait)||.62)*1000);   // the shared door timing: the door is open (and the place beyond shows in it) before the fade
  VoidInteractions.register('under-down',({item})=>{const sd=root.VoidBabylon?.district?.backAlleys?.underDoor?.(item.entrance);try{root.VoidAudio?.event?.('door');sd?.open?.(true);}catch{}setTimeout(()=>go(U.arrive(item.entrance)),sd?DW():0);});
  VoidInteractions.register('under-up',({item})=>{const h=root.VoidBabylon?.district?.underground,d=h?.door?.(item.door);try{d?.force?.(1);}catch{}setTimeout(()=>go(U.leave(item.entrance)),(d?.t??0)>.9?0:DW());});
  VoidInteractions.register('under-look',({item})=>note(item.text||''));},300);
 /* For tests and the editor: where the player is in the network (the place id), or null. */
 root.VoidUnderground.here=()=>{try{return typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='street'&&walkingLocation.quarter===U.ID&&typeof walker!=='undefined'&&walker?U.placeAt(walker.x,walker.z):null;}catch{return null;}};
})(globalThis);
