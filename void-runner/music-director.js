/* Music director: decides WHAT should play (style, intensity, ducking, in-world speakers) from the
   game state. Pure rules, unit-tested; music-engine.js decides HOW it sounds. Zone changes need a
   short hold (hysteresis) and combat keeps a cooldown so the score never flickers or cuts off. */
(function(root){
 const config={zoneHold:1.4,combatCooldown:7,dialogueDuck:.3};
 // Location id -> musical identity. Stations share one theme with per-station mixes.
 const locations={vesper:'vesper',meridian:'meridian',kepler:'station-kepler',rusthaven:'station-rusthaven',foundry:'station-foundry','sol-belt':'station-belt',earth:'neochinatown',mars:'vantor',vigil:'communion',holdfast:'natural-order',nexus:'nexus','order-homeworld':'order-homeworld'};
 // In-world speakers: music that belongs to a room and fades with distance (bar music).
 const speakers={meridian:{style:'dead-channel',x:0,z:60,inner:6,outer:24},station:{style:'dead-channel',x:11,z:29,inner:4,outer:16},neochinatown:{style:'district-bar',x:10,z:37.2,inner:3,outer:9}};
 // The Darknet District zones (neochinatown.js coordinates). First match wins.
 const districtZones=[
  {style:'district-terrace',test:p=>p.x>20},
  {style:'neochinatown',test:p=>p.z<17},
  {style:'district-entry',test:p=>p.z<27},
  {style:'district-rest',test:p=>p.z>58},
  {style:'district-arcade',test:p=>p.x<-4&&p.z>34&&p.z<46},
  {style:'district-store',test:p=>p.x>4&&p.z>42&&p.z<54},
  {style:'district-hall',test:()=>true}
 ];
 const systemSpace={communion:'space-cantor','natural-order':'space-garrow'};
 function zoneStyle(c){
  if(c.mode==='menu')return 'theme';
  if(c.mode==='play'){
   if(c.phase==='warp')return 'warp';
   if(c.hazard)return 'danger';
   return systemSpace[c.system]||'space';
  }
  if(c.layoutKind==='derelict')return 'derelict';
  if(c.location==='earth'&&c.walker)return districtZones.find(z=>z.test(c.walker)).style;
  return locations[c.location]||'meridian';
 }
 function speaker(c){
  if(c.mode!=='walking'&&c.mode!=='dialogue'||!c.walker)return null;
  const s=c.location==='earth'?speakers.neochinatown:c.location==='meridian'?speakers.meridian:c.layoutKind==='station'?speakers.station:null;
  if(!s)return null;
  const d=Math.hypot(c.walker.x-s.x,c.walker.z-s.z),level=d<=s.inner?1:d>=s.outer?0:1-(d-s.inner)/(s.outer-s.inner);
  return level>0?{style:s.style,level:Math.round(level*1000)/1000}:null;
 }
 function create(){return {style:null,pending:null,pendingTime:0,combatTimer:0,intensity:0};}
 // c: {mode, location, system, phase, hazard, combat, danger, dialogue, battle, layoutKind, walker:{x,z}}
 function step(d,c,dt){
  const wanted=zoneStyle(c);
  if(d.style===null){d.style=wanted;d.pending=null;}
  else if(wanted!==d.style){
   // Big context changes (menu, flight, warp, new location) switch at once; walking zones wait a moment.
   const sameRoom=c.mode==='walking'&&d.style.startsWith('district-')&&wanted.startsWith('district-')||d.style==='neochinatown'&&wanted.startsWith('district-')||wanted==='neochinatown'&&d.style.startsWith('district-');
   if(!sameRoom){d.style=wanted;d.pending=null;}
   else{if(d.pending!==wanted){d.pending=wanted;d.pendingTime=0;}d.pendingTime+=dt;if(d.pendingTime>=config.zoneHold){d.style=wanted;d.pending=null;}}
  }else d.pending=null;
  // Combat: full intensity while fighting, then a cooldown at mid intensity before settling.
  if(c.combat)d.combatTimer=config.combatCooldown;else d.combatTimer=Math.max(0,d.combatTimer-dt);
  d.intensity=c.combat?2:d.combatTimer>0?1:c.danger||c.battle?1:0;
  return {style:d.style,intensity:d.intensity,
   // Faction skirmishes the player only watches get a tension layer, never player-combat drums.
   tension:!c.combat&&(c.battle||c.danger)?1:0,
   duck:c.dialogue?config.dialogueDuck:0,speaker:speaker(c)};
 }
 const api={config,locations,speakers,districtZones,zoneStyle,speaker,create,step};
 if(typeof module!=='undefined')module.exports=api;else root.VoidMusicDirector=api;
})(globalThis);
