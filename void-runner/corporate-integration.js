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
  R('corp-door',({item})=>note(MSG[item?.door]||'Locked.'));
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
