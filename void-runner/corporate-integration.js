/* Corporate District: game wiring (browser only). Registers the walking location, the interaction handlers and the security messages.
   The data is corporate.js; the 3D build corporate-build.js; the way in and out is the Function Gate (ncz-gate-transit.js, road-taxi.js). Nothing here is saved except the map fog (story.flags.corpFog),
   written by the build, and the taxi's own trip record (road-taxi-rules.js). */
(function(root){
 'use strict';
 const C=root.VoidCorporate;if(!C||typeof document==='undefined')return;
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof VoidExplorationData==='undefined'||typeof announce==='undefined')return;clearInterval(wait);start();},400);
 function start(){
  VoidExplorationData.locations.corporate=C.layout();
  const done=()=>{try{resumeWalking();}catch{}};
  const note=t=>{done();try{announce(t);}catch{}};
  const R=(a,f)=>VoidInteractions.register(a,f);
  const MSG={hq:'HEADQUARTERS ENTRANCE: sealed. Two security robots watch the door.',
   'service-n1':'SERVICE ENTRANCE: locked. A camera covers it.','back-door':'MAINTENANCE DOOR: locked. No handle on this side, a keypad and a camera.',
   'bay-1':'LOADING BAY: the shutter is down and locked.','bay-2':'LOADING BAY: the shutter is down and locked.','bay-3':'LOADING BAY: the shutter is down and locked.'};
  /* A mission entrance behind a corporate door (apartments.js CORP_DOORS; Mission 009): the door's keypad is the access point of a hack step in progress, and once the
     mission's location is open to this player (hacked, or open from its step) the door takes them in (apartment-integration.js useAP / enterDoor). Otherwise: locked. */
  const MDOOR={'back-door':'biz-corp-s-40'};
  R('corp-door',({item})=>{const id=MDOOR[item?.door],A=root.VoidApartments,LC=root.VoidLiveContent;
   if(id&&A&&LC){try{if((LC.hacks?.()||[]).some(j=>j.ap===id)){A.useAP?.({ap:id,position:item.position});return;}if((LC.apartments?.()||[]).some(a=>a.door===id)||(LC.hackedDoors?.()||[]).some(h=>h.door===id)){done();A.enterDoor?.(id);return;}}catch{}}
   note(MSG[item?.door]||'Locked.');});
  R('corp-checkpoint',()=>note('SECURITY CHECKPOINT: visitors state their business. The lane is open, but a guard, a camera and a drone cover it.'));
  // The ride back is included in the fare, and the gate can be walked. Nobody is stranded without credits.
  R('corp-cab',()=>{done();if(!root.VoidRoadTaxi?.returnFrom){note('The taxi is not available.');return;}root.VoidRoadTaxi.returnFrom('corporate','cab');});
  R('corp-gate',()=>{done();if(!root.VoidRoadTaxi?.returnFrom){note('The gate is not available.');return;}root.VoidRoadTaxi.returnFrom('corporate','foot');});
  // Security speech: the guard's line shows over the robot (corporate-build.js) and as a notice.
  addEventListener('corporate-security',e=>{const d=e.detail||{};
   if(d.type==='challenge')announce('SECURITY ROBOT: "'+(d.text||'State your business.')+'"');
   else if(d.type==='warning')announce('SECURITY: '+(d.text||'Restricted area. Return to the plaza.'));
   else if(d.type==='suspicious')announce('You may have been seen. Get out of sight.');});
 }
})(globalThis);
