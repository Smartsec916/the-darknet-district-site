/* Music director: decides WHAT should play (style, intensity, ducking, in-world speakers) from the
   game state. Pure rules, unit-tested; music-engine.js decides HOW it sounds. Zone changes need a
   short hold (hysteresis) and combat keeps a cooldown so the score never flickers or cuts off. */
(function(root){
 const config={zoneHold:1.4,combatCooldown:7,dialogueDuck:.3};
 // Location id -> musical identity. Stations share one theme with per-station mixes.
 const locations={vesper:'vesper',meridian:'meridian',kepler:'station-kepler',rusthaven:'station-rusthaven',foundry:'station-foundry','sol-belt':'station-belt',earth:'neochinatown',mars:'vantor',vigil:'communion',holdfast:'natural-order',nexus:'nexus','order-homeworld':'order-homeworld'};
 // In-world speakers: music that belongs to a room and fades with distance (bar music).
 const speakers={meridian:{style:'dead-channel',x:0,z:60,inner:6,outer:24},station:{style:'dead-channel',x:11,z:29,inner:4,outer:16},};
 // (The District bar used to be a speaker heard from the hall; since the area soundtrack, 15 Nov 2026, it is a room with its own music.)
 // The Darknet District zones (neochinatown.js coordinates). First match wins.
 const districtZones=[
  {style:'district-terrace',test:p=>p.x>20},
  {style:'neochinatown',test:p=>p.z<17},
  {style:'district-entry',test:p=>p.z<27},
  {style:'district-arcade',test:p=>p.x<-3&&p.z>57&&p.z<67.5},
  {style:'district-rest',test:p=>p.z>68},
  {style:'district-vr',test:p=>p.x<-4&&p.z>30&&p.z<46},
  {style:'district-store',test:p=>p.x>4&&p.z>42&&p.z<54},
  {style:'district-bar',test:p=>p.x>4&&p.z>30&&p.z<42},
  {style:'district-hall',test:()=>true}
 ];
 const systemSpace={communion:'space-cantor','natural-order':'space-garrow'};
 // On the street (street metres): the alley behind the District and the inside of Milked have their own music; the rest is the city's.
 const streetZones=[{style:'alley',rect:[71,136,-61.6,-55.5]},{style:'milked',rect:[212,248,-46,16]}];
 const streetStyle=p=>streetZones.find(z=>p.x>=z.rect[0]&&p.x<=z.rect[1]&&p.z>=z.rect[2]&&p.z<=z.rect[3])?.style||'neochinatown';
 // Areas that are one walk apart: a change between them waits a moment (zoneHold) so a doorway never flickers.
 const local=s=>s==='neochinatown'||s==='alley'||s==='milked'||s.startsWith('district-');
 // The areas next to each one, whose recordings are fetched ahead so the next room starts at once.
 const neighbours={theme:['district-hall','neochinatown'],neochinatown:['alley','milked','nightclub','corporate','temple'],alley:['neochinatown','district-entry','nightclub'],'district-entry':['alley','district-hall'],
  'district-hall':['district-entry','district-store','district-bar','district-vr','district-arcade'],'district-store':['district-hall','district-bar'],'district-bar':['district-hall','district-store'],'district-vr':['district-hall'],
  'district-arcade':['district-hall'],'district-rest':['district-hall','district-arcade'],'district-terrace':['district-hall'],milked:['neochinatown'],corporate:['neochinatown'],temple:['neochinatown'],space:['neochinatown']};
 function zoneStyle(c){
  if(c.mode==='menu')return 'theme';
  if(c.mode==='play'){
   if(c.phase==='warp')return 'warp';
   if(c.hazard)return 'danger';
   return systemSpace[c.system]||'space';
  }
  if(c.layoutKind==='derelict')return 'derelict';
  // Places reached from NeoChinatown that are their own walking location.
  if(c.place==='corporate')return 'corporate';
  if(c.place==='temple')return 'temple';
  if(c.location==='earth'&&c.walker){const N=typeof module!=='undefined'?require('./neochinatown.js'):root.VoidNeoChinatown,p=N?N.zone(c.walker):{area:'district',...c.walker};return p.area==='street'?streetStyle(p):p.area==='terrace'?'district-terrace':districtZones.find(z=>z.test(p)).style;}
  return locations[c.location]||'meridian';
 }
 function speaker(c){
  if(c.mode!=='walking'&&c.mode!=='dialogue'||!c.walker)return null;
  const s=c.location==='earth'?speakers.neochinatown:c.location==='meridian'?speakers.meridian:c.layoutKind==='station'?speakers.station:null;
  if(!s)return null;
  const N=c.location==='earth'?(typeof module!=='undefined'?require('./neochinatown.js'):root.VoidNeoChinatown):null,w=N?N.zone(c.walker):c.walker;
  const d=Math.hypot(w.x-s.x,w.z-s.z),level=d<=s.inner?1:d>=s.outer?0:1-(d-s.inner)/(s.outer-s.inner);
  return level>0?{style:s.style,level:Math.round(level*1000)/1000}:null;
 }
 function create(){return {style:null,pending:null,pendingTime:0,combatTimer:0,intensity:0};}
 // c: {mode, location, system, phase, hazard, combat, danger, dialogue, battle, layoutKind, walker:{x,z}}
 function step(d,c,dt){
  const wanted=zoneStyle(c);
  if(d.style===null){d.style=wanted;d.pending=null;}
  else if(wanted!==d.style){
   // Big context changes (menu, flight, warp, new location) switch at once; walking zones wait a moment.
   const sameRoom=c.mode==='walking'&&local(d.style)&&local(wanted);
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
 const api={config,locations,speakers,districtZones,streetZones,neighbours,zoneStyle,speaker,create,step};
 if(typeof module!=='undefined')module.exports=api;else root.VoidMusicDirector=api;
})(globalThis);
