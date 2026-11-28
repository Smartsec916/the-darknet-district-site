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
    talk('',lines,async()=>{if(refreshPad&&r.objective==='claim'){try{delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'port'});}catch{resumeWalking();}}else resumeWalking();},'CONTINUE');
    return;
   }
   return prev?.(arg);
  });
 }
 wrap('admin','talk-admin');wrap('district-iris','talk-iris');wrap('district-bar','visit-bar',{show:false});wrap('district-shop','visit-shop',{show:false});wrap('terminal','use-terminal',{refreshPad:true});
 const freight=C.districtFreight;
 const terminal=VoidInteractions.handlers.get('terminal');
 VoidInteractions.register('terminal',arg=>{
  if(!freight.available(state))return terminal?.(arg);
  const active=freight.job(state);
  const list=Object.entries(freight.jobs);
  const choice=document.createElement('dialog');
  choice.setAttribute('aria-label','District freight');
  choice.className='shop-layout';
  choice.innerHTML='<h2>District freight</h2><p>Servo → Tessaly Belt Anchorage · 1 hold space</p>'+
    (active?'<p>Loaded: '+escapeText(active.cargo)+'. Board on Pad 01.</p><button value="cancel-job">Unload cargo</button>':
      list.map(([id,job])=>'<button value="'+id+'"'+(state.contract||C.holdFree(state)<1?' disabled':'')+'>'+escapeText(job.cargo)+' · '+(job.legal?'LEGAL':'ILLICIT')+' · '+job.pay+' CR</button>').join(''))+
    '<button value="services">Landing services</button><button value="close">Close</button>';
  document.exitPointerLock?.();
  document.body.append(choice);
  choice.addEventListener('click',e=>{
   const value=e.target.closest('button')?.value;
   if(!value)return;
   if(value==='services'){choice.close();terminal?.(arg);return;}
   if(value==='close'){choice.close();return;}
   if(value==='cancel-job'?freight.cancel(state):freight.accept(state,value)){
    save();choice.close();announce(value==='cancel-job'?'Freight unloaded.':'Freight loaded · Board at Pad 01 for Tessaly Belt Anchorage.');
   }
  });
  choice.addEventListener('close',()=>choice.remove(),{once:true});
  choice.showModal();
 });

 let lane=null;
 const relayName='RELAY T-07';
 root.VoidDistrictRelayContact=()=>mode==='play'&&lane?.route===flight.route&&flight.route?.phase==='align'&&lane.relay&&lane.hop?.phase!=='warp'?lane.relay:null;
 const drawLaneMarker=drawWarpMarker;
 drawWarpMarker=function(){
  const relay=root.VoidDistrictRelayContact();
  if(!lane?.hop)drawLaneMarker();
  if(!relay)return;
  const color=relay.offline?'#99b7c1':'#55e0cc',p=flightPoint(relay);
  if(p.z<1||p.x<W*.12||p.x>W*.88||p.y<H*.16||p.y>H*.72){
   drawNavigationEdge(relay,relayName,color);return;
  }
  ctx.save();ctx.translate(p.x,p.y);
  ctx.lineWidth=2;ctx.strokeStyle=color;ctx.fillStyle=color;
  if(relay.offline)ctx.setLineDash([4,3]);
  ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(22,0);ctx.lineTo(0,22);ctx.lineTo(-22,0);ctx.closePath();ctx.stroke();
  ctx.setLineDash([]);ctx.font='bold 12px monospace';ctx.textAlign='center';
  ctx.fillText(relayName,0,38);
  if(lane.hop?.aligned){
   ctx.beginPath();ctx.arc(0,0,30,-Math.PI/2,-Math.PI/2+Math.PI*2*lane.hop.aligned/warpSpoolSeconds());ctx.stroke();
  }
  ctx.restore();
 };
 const drawLaneWarp=drawWarpEffect;
 drawWarpEffect=function(route=flight.route){return drawLaneWarp(lane?.hop?.phase==='warp'?lane.hop:route);};
 const laneUpdate=update;
 update=function(dt){
  const route=flight.route;
  const active=mode==='play'&&current?.districtFreight&&route?.origin==='earth'&&!root.VoidFlightSkirmish?.active;
  if(!active){
   if(lane&&lane.route===route&&['pause','mission-log','equipment'].includes(mode))lane.panel.hidden=true;
   else {lane?.panel.remove();lane=null;}
   return laneUpdate(dt);
  }
  if(!lane||lane.route!==route){
   lane?.panel.remove();
   const panel=document.createElement('aside');
   panel.id='district-freight-lane';
   panel.style.cssText='position:fixed;z-index:29;right:18px;bottom:18vh;max-width:310px;padding:12px;background:#081721ef;border:1px solid #417d86;color:#def3f5;font:14px/1.4 system-ui';
   document.body.append(panel);
   lane={route,panel,clock:0,passing:false,html:''};
   panel.addEventListener('click',e=>{
    const action=e.target.closest('button')?.value;
    if(!action||lane.hop?.phase==='warp')return;
    if(action==='continue'){lane.passing=true;return;}
    if(action==='target-relay'){
     if(lane.hop){lane.hop=null;return;}
     lane.hop={phase:'align',progress:0,aligned:0,policy:{kind:'local',seconds:2.5},encounter:{state:'cleared'},vector:FM.unit(lane.relay)};
     clearInput();canvas.focus();return;
    }
    if(action==='destroy'||action==='repair'){
     if(freight.relay(state,action)){save();hud();}
    }else if(freight.decide(state,action)){clearInput();save();}
   });
  }
  if(route.phase!=='align'){lane.panel.hidden=true;return laneUpdate(dt);}
  lane.panel.hidden=false;
  if(!lane.released){
   lane.released=true;document.exitPointerLock?.();clearInput();
   root.VoidTraffic.districtCouriers(ambientTraffic,flightBasis());
   const signalId='satellite:relay-t07',v=VoidWarp.direction(route.origin,signalId);
   lane.relay={x:v.x*118,y:v.y*118,z:v.z*118,signalId};
  }
  const flags=state.story.flags,offline=flags.districtRelayOffline===true;
  lane.relay.offline=offline;
  lane.relay.signature={total:offline?.7:1.5};
  const hop=lane.hop;
  if(hop){
   if(hop.phase==='align')hop.vector=FM.unit(lane.relay);
   const before=hop.phase;
   VoidWarp.step(hop,dt,flightBasis().f,true,{held:VoidInput.down('warp'),seconds:warpSpoolSeconds()});
   if(before!==hop.phase&&hop.phase==='warp')VoidAudio.event('warp',VoidFlightCraft.ship());
   if(hop.phase==='arrived'){
    for(const axis of ['x','y','z'])lane.relay[axis]=hop.vector[axis]*42;
    lane.hop=null;lane.atRelay=true;
    VoidAudio.event('exit',VoidFlightCraft.ship());
    announce('ARRIVED · '+relayName);
   }
  }
  lane.clock+=dt;
  const traffic=freight.traffic(lane.clock,offline);
  const report=traffic.map(ship=>{
   const source=root.VoidSignals.source(ship.source);
   return '<div>'+escapeText(source?.name||'Freighter')+' · '+escapeText(ship.phase)+'</div>';
  }).join('');
  const relay='<p>'+relayName+' · '+(offline?'OFFLINE':'ONLINE')+'</p>'+
    (lane.hop?.phase==='warp'?'<p>Warping to '+relayName+'</p>':lane.hop?'<p>Align with '+relayName+' and hold '+escapeText(VoidInput.label(VoidInput.bindings.warp))+'</p><button value="target-relay">Cancel relay waypoint</button>':
      lane.atRelay?'':'<button value="target-relay">Target '+relayName+'</button>')+
    (offline?'<button value="repair"'+(state.credits<15?' disabled':'')+'>Repair relay · 15 CR</button>':'<button value="destroy">Destroy relay</button>');
  const clearance=flags.districtClearance;
  let prompt='';
  if(!lane.passing&&!clearance)prompt='<button value="continue">Continue past relay</button>';
  else if(!clearance)prompt=offline&&!(flags.districtWarrant>0)?
    '<p>No patrol report on this approach.</p><button value="bypass">Use uncovered approach</button>'+
    '<button value="escort">Request inspection escort</button>':
    '<strong>THE FUNCTION · STOP ORDER</strong><p>Follow the patrol to Tessaly Belt Anchorage for station search and questioning.</p>'+
    '<button value="escort">Accept escort</button><button value="run">Refuse and warp · warrant increases</button>';
  else prompt='<p>'+(clearance==='escort'?'Escort route cleared · inspection at the Anchorage':clearance==='run'?'Stop refused · align and hold Warp':'Uncovered route · align and hold Warp')+'</p>';
  const html='<strong>TESSALY BELT FREIGHT LANE</strong>'+report+relay+prompt;
  if(lane.html!==html){lane.html=html;lane.panel.innerHTML=html;}
  if(!clearance||lane.hop)route.recharge=Math.max(route.recharge||0,.2);
  const result=laneUpdate(dt);
  if(lane.hop?.phase!=='warp')moveRelative(lane.relay,flight.velocity,dt);
  return result;
 };
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
