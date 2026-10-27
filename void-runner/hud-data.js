/* What the Personal HUD shows, read from the game's own systems (Mission Log, comms, progression, campaign).
   Rules only, no rendering, so it runs in Node tests. Nothing here changes the save.
   - Comms: where each known person physically is, and whether a remote channel exists. Only channels the story
     already uses are remote (Mara on the comm after the practice circuit, Rook's message about the missile
     launcher). Everyone else is met in person. The HUD never opens a conversation remotely.
   - Inventory: what you carry is separate from what is aboard the ship. Ship equipment is read-only here; fitting
     happens at a hangar maintenance terminal, as before. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined';
 const U=node?require('./universe.js'):root.VoidUniverse,P=node?require('./progression.js'):root.VoidProgression,Comms=node?require('./comms.js'):root.VoidComms;
 // Where each person is, as placed in the game world (station-layouts.js, meridian-interior.js, neochinatown.js, planets.js).
 const people={
  rook:{name:'Rook',where:'meridian',place:'Rook’s booth, Meridian Station',remote:'messages'},
  nyx:{name:'Nyx',where:'meridian',place:'The bar, Meridian Station'},
  mara:{name:'Mara',where:'vesper',place:'Ward Freight workshop, Vesper',remote:'comm'},
  sol:{name:'Dr. Sol',where:'kepler',place:'The bar, Kepler Station'},
  iona:{name:'Iona Vale',where:'rusthaven',place:'Rusthaven Port'},
  Admin:{name:'Admin',where:'earth',place:'The Darknet District, NeoChinatown'},
  Iris:{name:'Iris',where:'earth',place:'The Darknet District, NeoChinatown'},
  elara:{name:'Dr. Elara Voss',where:'vigil',place:'The Vigil, Cantor System'},
  marcus:{name:'Marcus Vale',where:'holdfast',place:'Holdfast, Garrow System'},
  kess:{name:'Dr. Adrian Kess',where:'nexus',place:'The Nexus'},
  mercer:{name:'Daniel Mercer',where:'order-homeworld',place:'The Natural Order homeworld'}
 };
 const remoteNote={comm:'Ship comm. She calls you; you can’t call her.',messages:'Messages only. Business is done at his booth.'};
 // The link the HUD reports: the game's own comms rules. ctx: {onFoot, route}.
 function link(s,ctx={}){const st=Comms.status(s,ctx);return {state:st.state,label:Comms.labels[st.state],reason:st.reason,local:true,
  note:st.reason==='premises'?'Relay traffic is blocked on these premises. Your terminal still works locally.':st.state==='disconnected'?'No signal in warp. Local functions only.':st.state==='connected'?'Relay link up. Nothing on this terminal is sent to it.':'Weak or no Relay signal here.'};}
 function contacts(s){
  const met=new Set(s?.story?.met||[]);
  return Object.entries(people).filter(([id])=>met.has(id)).map(([id,p])=>{const here=s.location===p.where;
   return {id,name:p.name,place:p.place,here,remote:p.remote||null,
    channel:here?'Here, in person':p.remote?remoteNote[p.remote]:'In person only'};});
 }
 // Received messages, rebuilt from the story state (no separate message store). Text is the game's own.
 function messages(s,lines={}){
  const out=[];
  if(s?.story?.flags?.flightTrainingComplete===true||s?.progression?.flags?.flightTrainingComplete===true)out.push({from:'Mara',via:'Ship comm',text:lines.mara||'Not bad. That’s the basics; the rest you learn out there. Come see me, then take her to Meridian. Rook will be waiting.'});
  if(s?.missileOfferSeen===true&&lines.rook)out.push({from:'Rook',via:'Message',text:lines.rook});
  return out;
 }
 const pretty=id=>String(id).replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
 const weaponNames={'ward-pistol':'Ward pistol'};
 // ctx: {ship (name), mission (current contract flight or null), cargoUsed, launcher (owned), loadout}
 function inventory(s,ctx={}){
  const p=s.progression,sys=P.systems(s),ship=s.activeShip||'starter',installed=p.equipment.installed?.[ship]||{};
  const fitted=Object.values(installed);
  const personal={weapon:p.personal.weapon?{name:weaponNames[p.personal.weapon]||pretty(p.personal.weapon),ammo:p.personal.ammo,reserve:p.personal.reserve}:null,
   items:(p.personal.items||[]).map(pretty),attachments:(p.personal.attachments||[]).map(id=>pretty(id)+(p.personal.optic===id?' (fitted)':'')),credits:s.credits};
  const modules={installed:Object.entries(installed).filter(([,id])=>P.modules[id]).map(([slot,id])=>({slot:P.slotLabel(slot),name:P.modules[id].name})),
   owned:p.equipment.owned.filter(id=>P.modules[id]&&!fitted.includes(id)).map(id=>({slot:P.slotLabel(P.modules[id].slot),name:P.modules[id].name}))};
  const contract=ctx.mission&&ctx.mission.cargo&&ctx.mission.cargo!=='Empty hold'&&ctx.mission.kind!=='transit'?{name:ctx.mission.cargo,units:ctx.mission.dataCargo?0:(ctx.mission.units||1),mission:ctx.mission.name}:null;
  const cargo={capacity:sys.cargo,used:ctx.cargoUsed??((p.cargo||[]).reduce((n,c)=>n+c.units,0)+(contract?.units||0)),contract,salvage:(p.cargo||[]).map(c=>({name:pretty(c.id),units:c.units})),data:(p.data||[]).slice()};
  return {personal,ship:{name:ctx.ship||pretty(ship),modules,launcher:!!ctx.launcher,missiles:p.missiles??0,cargo,readOnly:true}};
 }
 const api={people,link,contacts,messages,inventory};
 if(node)module.exports=api;else root.VoidHudData=api;
})(globalThis);
