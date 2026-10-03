/* Connect the modern world to the existing campaign, input, rewards and account UI. */
state.universe=VoidUniverse.restore(state.universe,state);
let modernMenuFailure=false,modernMenuReady=false,modernMenuPending=false,missionPanel=null,missionReturn=null,destinationPreparation=null;
const managedDestination=prepareDestination;
prepareDestination=function(){if(destinationPreparation)return destinationPreparation;destinationPreparation=managedDestination().finally(()=>destinationPreparation=null);return destinationPreparation;};
function renderUnavailable(){ctx.fillStyle='#07121e';ctx.fillRect(0,0,W,H);ctx.fillStyle='#bed6d4';ctx.font='18px monospace';ctx.fillText('3D display unavailable — open Menu to retry.',30,H*.5);}
function drawModernBackground(){
 if(mode==='menu'){
  const image=VoidBabylon.renderMenu(W,H,time,reducedMotion);
  if(image)ctx.drawImage(image,0,0,W,H);else{ctx.fillStyle='#030813';ctx.fillRect(0,0,W,H);if(!modernMenuPending&&!VoidBabylon.diagnostics.menuReady&&!modernMenuFailure){modernMenuPending=true;VoidBabylon.prepareMenu().then(()=>modernMenuReady=true).catch(e=>{if(mode==='menu'&&!/cancel/i.test(e.message)){modernMenuFailure=true;console.warn('[VOID menu background]',e.message);}}).finally(()=>modernMenuPending=false);}}
  return;
 }
 if(walkingLocation&&walker&&VoidBabylon.scene){const img=VoidBabylon.renderRoom(walker,W,H,time);if(img)ctx.drawImage(img,0,0,W,H);return;}
 if(VoidGraphics.busy){renderUnavailable();return;}
 if(!VoidBabylon.diagnostics.exteriorReady){
  ctx.fillStyle='#07121e';ctx.fillRect(0,0,W,H);
  if(!modernMenuPending&&!modernMenuReady){modernMenuPending=true;boundedPrepare(task=>VoidBabylon.prepareSpace(state.location,undefined,task)).then(()=>modernMenuReady=true).catch(e=>{console.error('[VOID world menu]',e);modernMenuReady=true;}).finally(()=>modernMenuPending=false);}
  return;
 }
 const image=VoidBabylon.renderFlight({basis:FM.basis(.15*Math.sin(time*.035),0,0),route:{phase:'arrived',destination:state.location,progress:1},rocks:Array.from({length:18},(_,i)=>({x:(i%2?1:-1)*(50+i*7),y:Math.sin(i)*50,z:180+i*13,size:2+i%5,phase:i})),ships:[],bullets:[],hostile:[],missiles:[],effects:[],time,approach:0},W,H);if(image)ctx.drawImage(image,0,0,W,H);
}
// Never launch a second preparation while the menu's scene is being constructed.
const meridianLeaveMenu=leaveMenu;leaveMenu=function(){modernMenuFailure=false;modernMenuReady=false;VoidBabylon.releaseMenu();return meridianLeaveMenu();};
const worldLaunch=launch;
launch=async function(){const owner=VoidFlightSession.active;if(modernMenuPending){VoidPreparation.cancel?.();await new Promise(resolve=>{const check=()=>modernMenuPending&&VoidFlightSession.owns(owner)?setTimeout(check,20):resolve();check();});}if(!VoidFlightSession.owns(owner))return;if(state.universe.freeTravel&&!originalFlight(state)){state.destination=VoidUniverse.destinations(state)[0]||null;}return worldLaunch();};
const worldEnterWalking=enterWalking;
async function resumeSavedWorld(){
 if(state.story.cursor){await enterWalking(state.quest==='inheritance'?'vesper':'hangar');resumeStoryScene();return;}
 if(state.quest==='inheritance'){await workshopOpening();return;}
 if(state.universe.station){await dock();return;}
 if(C.flight(state))await launch();else await dock();
}
const physicalResumeWalking=resumeWalking;
resumeWalking=function(){if(walkingLocation?.kind==='station'&&walkingLocation.ship!==VoidShips.get(state).id)return enterWalking('hangar');return physicalResumeWalking();};
enterWalking=async function(id){
 if(id==='vesper'||id==='hangar'&&state.location==='vesper'){VoidExplorationData.locations.vesper=VoidOpening.layout();await worldEnterWalking('vesper');if(mode==='walking'){state.universe.station={location:'vesper'};save();}return;}
 if(id==='hangar'||VoidUniverse.locations[id]){
  const loc=id==='hangar'?state.location:id;
  const def=VoidStationLayouts.layout(loc,VoidShips.get(state).id);def.name=C.stations[loc]?.name||loc;VoidExplorationData.locations.hangar=def;
  await worldEnterWalking('hangar');
  if(mode==='walking'){state.universe.station={location:state.location};save();}
 }else {const d=VoidExplorationData.locations[id];if(d){d.ship=VoidShips.get(state).id;const board=d.interactions.find(i=>i.action==='board');if(board){board.position=[-2,1.7,-25];board.label='BOARD '+VoidShips.get(state).name.toUpperCase();}}await worldEnterWalking(id);}
};
dock=async function(tab='dock'){
 if(VoidGraphics.busy){VoidPreparation.cancel?.();preparationGeneration++;await Promise.allSettled([preparingLaunch,destinationPreparation].filter(Boolean));VoidGraphics.busy=false;walkingLocation=walker=null;}
 if(tab==='shop'){shop();return;}
 if(walkingLocation&&walker){resumeWalking();return;}
 return enterWalking(state.location==='earth'?'sacramento':state.location==='mars'?'mars-terminal':'hangar');
};
leaveWalking=async function(){
 document.exitPointerLock?.();walkingKeys.clear();
 if(!C.flight(state)&&!state.universe.freeTravel){announce('Talk to the station contact before boarding.');return;}
 state.universe.station=null;save();return launch();
};
// Delivery reward/state remains authoritative in Campaign.complete; station entry is automatic.
const worldArrive=arrive;
arrive=function(){const previous=state.location,quest=state.quest;worldArrive();if(!['arrival','dialogue'].includes(mode)||state.location===previous&&state.quest===quest)return;
 const lines=speech?.lines.slice(),label=speech?.label;speech=null;
 const docking=dock(),token=preparationGeneration;Promise.resolve(docking).then(()=>{if(token===preparationGeneration&&lines&&mode==='walking')talk('',lines,()=>{if(walkingLocation)resumeWalking();},label||'EXPLORE STATION');});
};
// Keep conversations and service overlays in the same physical station.
const worldTalk=talk;
talk=function(background,lines,done,label,heading){worldTalk(walkingLocation?'':background,lines,done,label,heading);if(walkingLocation){screen.dataset.scene='';screen.classList.remove('cinematic');screen.querySelectorAll('.portrait').forEach(el=>el.remove());}};
const worldRenderLine=renderLine;
renderLine=function(){worldRenderLine();if(walkingLocation){screen.dataset.scene='';screen.classList.remove('cinematic');screen.querySelectorAll('.portrait').forEach(el=>el.remove());}};
barRoom=()=>resumeWalking();bar=barRoom;contacts=function(){campaignBoard();};
const originalRookConversation=rookConversation;
rookConversation=function(){if(state.missileUnlocked&&!state.missileOfferSeen){state.missileOfferSeen=true;VoidUniverse.unlock(state);save();talk('',[rookMissileLine],resumeWalking,'RETURN TO STATION');return;}if(state.quest==='open'){talk('',[{who:'rook',text:state.progression?.completed?'The cargo board still has work. Admin is over in SOL if you want a longer run. F1 opens your Mission Log.':'Finish your missile qualification: acquire the launcher, install it at the maintenance terminal, then select, lock and fire on a hostile in your next run.'}],resumeWalking,'RETURN TO STATION');return;}originalRookConversation();};
VoidInteractions.register('talk',({item})=>{
 if(item.character==='rook')return rookConversation();
 if(item.character==='mara')return playStoryScene('mara_workshop_intro');
 if(state.quest==='open'&&item.character==='sol')return brief('medicine');if(state.quest==='open'&&item.character==='iona')return brief('ghost');
 const texts={elias:'The ship is yours. Go make a life of your own.',nyx:'Rook is in the booth. The outfitter is across the concourse.',iona:'Rusthaven stays alive because people keep bringing what we need.',sol:'The clinics are short on supplies. Check the mission terminal before you go.'};
 talk('',[{who:item.character,text:texts[item.character]}],resumeWalking,'RETURN TO STATION');
});
VoidInteractions.register('services',()=>{shop();screen.querySelector('.shop-heading,.actions')?.insertAdjacentHTML('beforeend',button('RETURN TO STATION','walk-resume',true));});
VoidInteractions.register('jobs',()=>{campaignBoard();});
// Existing mission-board function name is kept isolated here for service interactions.
const physicalCampaignBoard=campaignBoard;
campaignBoard=function(){if(state.quest!=='open'){announce('Rook has your next job.');resumeWalking();return;}physicalCampaignBoard();screen.querySelector('.shop-layout')?.insertAdjacentHTML('beforeend','<h2>CARGO CONTACTS</h2><div class="hangar-grid">'+C.contracts.map(c=>'<article class="card"><h3>'+escapeText(c.name)+'</h3><p>'+escapeText(c.briefing)+'</p>'+button('TALK / '+escapeText(c.contact),'brief:'+c.id,false,!!state.contract)+'</article>').join('')+'</div>');screen.querySelector('.actions,.shop-heading')?.insertAdjacentHTML('beforeend',button('RETURN TO STATION','walk-resume',true));}
const worldWorkshop=workshopOpening;
workshopOpening=async function(){await enterWalking('vesper');};
// Remove disconnected SOL prototype entry points. All travel uses Campaign.flight + VoidWarp.
navigation=function(){announce('Choose a route marker after boarding your ship.');};
const worldChoose=C.chooseDestination;
function setFlightDestination(id){if(!worldChoose(state,id))return;const next=C.flight(state);if(!next)return;current=next;flight.route=VoidWarp.create(state.location,id,null,next.enemies>0);flight.route.phase='align';flight.nav={x:flight.route.vector.x*140,y:0,z:flight.route.vector.z*140};state.travel=flight.route;spawned=resolved=0;elapsed=0;preparedDestination=null;save();$('route-name').textContent=C.stations[id].name.toUpperCase();}
// Boarding with no accepted job enters normal flight with a selectable local route.
const originalFlight=C.flight;

let routeMarkers=[],trackedWalkWaypoint=null;
const missionTracker=document.createElement('div');missionTracker.id='mission-tracker';missionTracker.hidden=true;document.body.append(missionTracker);
function flightRoutes(){return VoidUniverse.destinations(state).map((id,i)=>{const angle=-1.05+i*.42;return {id,vector:{x:Math.sin(angle),y:0,z:Math.cos(angle)}};});}
const worldUpdate=update;
update=function(dt){
 if(mode==='play'&&flight.route?.phase==='departure'){const speed=Math.max(0,Math.min(18,(flight.route.departure-1)*9));flight.velocity={x:0,y:0,z:speed};}
 worldUpdate(dt);
 if(mode==='play'&&state.universe.freeTravel&&flight.route?.phase==='align'&&VoidNavigationReveal.opacity(navigationReveal)>0){routeMarkers=flightRoutes();const chosen=routeMarkers.find(r=>FM.dot(flightBasis().f,r.vector)>.993);if(chosen&&chosen.id!==current.destination)setFlightDestination(chosen.id);const marker=routeMarkers.find(r=>r.id===current.destination);if(marker){flight.route.vector=marker.vector;flight.nav={x:marker.vector.x*140,y:0,z:marker.vector.z*140};}}
 const tracked=['play','walking'].includes(mode)&&!globalThis.VoidFlightSkirmish?.active?VoidMissions.tracked(state,C):null;missionTracker.hidden=!tracked;if(tracked){const label=tracked.title+' / '+tracked.objective;if(missionTracker.textContent!==label)missionTracker.textContent=label;}
 trackedWalkWaypoint=null;if(mode==='walking'&&walker){const m=VoidMissions.tracked(state,C),g=VoidMissions.guidance(state,m,true);if(g){const item=walkingLocation.interactions.find(i=>i.id===g.interaction);let waypoint=item;if(item){if(walker.z<3&&item.position[2]>4)waypoint={position:[0,1.7,3]};else if(walker.z<18&&item.position[2]>18)waypoint={position:[0,1.7,19]};else if(walker.z>19&&item.position[2]<18)waypoint={position:[0,1.7,19]};else if(walker.z>4&&item.position[2]<4)waypoint={position:[0,1.7,3]};}trackedWalkWaypoint=waypoint;$('walking-caption').textContent=walkingLocation.name+' · '+g.label+(waypoint?' · '+Math.round(Math.hypot(waypoint.position[0]-walker.x,waypoint.position[2]-walker.z))+'m':'');}}
};
const worldMarker=drawWarpMarker;
drawWarpMarker=function(){
 if(!state.universe.freeTravel)return worldMarker();if(flight.route?.phase!=='align'||VoidNavigationReveal.opacity(navigationReveal)<=0)return;
 const guide=VoidMissions.guidance(state,VoidMissions.tracked(state,C),false);for(const r of flightRoutes()){const v={x:r.vector.x*140,y:0,z:r.vector.z*140},p=flightPoint(v),interstellar=VoidUniverse.route(state.location,r.id).kind==='interstellar',isTracked=guide?.destination===r.id;if(p.z<=0||p.x<W*.12||p.x>W*.88||p.y<H*.16||p.y>H*.72){if(isTracked)drawNavigationEdge(v,'MISSION / '+guide.label);continue;}ctx.save();ctx.translate(p.x,p.y);ctx.shadowColor='#000';ctx.shadowBlur=isTracked?14:3;ctx.strokeStyle=isTracked?'#ffe58b':interstellar?'#bda0e0':'#83c4b5';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=isTracked?3:current.destination===r.id?2:1;ctx.beginPath();for(let i=0;i<=6;i++){const a=i*Math.PI/3;const radius=isTracked?29:interstellar?27:18;i?ctx.lineTo(Math.cos(a)*radius,Math.sin(a)*radius):ctx.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);}ctx.stroke();ctx.font=isTracked?'bold 13px monospace':'11px monospace';ctx.textAlign='center';ctx.fillText((isTracked?'◆ MISSION / ':'')+(interstellar?'INTERSTELLAR / ':'')+C.stations[r.id].name.toUpperCase(),0,43);ctx.restore();}
};
function closeMissionLog(){if(!missionPanel)return;missionPanel.remove();missionPanel=null;mode=missionReturn;missionReturn=null;clearInput();walkingKeys.clear();canvas.focus();}
function openMissionLog(){if(missionPanel)return closeMissionLog();if(globalThis.VoidFlightSkirmish?.active)return;if(!state.universe.missionLogUnlocked){announce('Flight Training opens the Mission Log after boarding.');return;}if(!['play','walking','dock','dialogue'].includes(mode))return;missionReturn=mode;mode='mission-log';clearInput();walkingKeys.clear();document.exitPointerLock?.();missionPanel=document.createElement('section');missionPanel.id='mission-log';missionPanel.setAttribute('role','dialog');missionPanel.setAttribute('aria-label','Mission Log');const missions=VoidMissions.sync(state,C),card=m=>'<article class="mission-entry"><h2>'+escapeText(m.title)+' <small>'+escapeText(m.completed?'COMPLETE':m.tracked?'TRACKED':'ACTIVE')+'</small></h2><ul>'+m.objectives.map(o=>'<li class="'+(o.complete?'complete':'pending')+'">'+(o.complete?'✓ ':'○ ')+escapeText(o.label)+'</li>').join('')+'</ul>'+(m.completed?'':m.tracked?'<button data-untrack="'+escapeText(m.id)+'">UNTRACK MISSION</button>':'<button data-track="'+escapeText(m.id)+'">TRACK MISSION</button>')+'</article>';missionPanel.innerHTML='<h1>MISSION LOG</h1><h2>ACTIVE / ACQUIRED</h2>'+missions.filter(m=>!m.completed).map(card).join('')+'<h2>COMPLETED</h2>'+missions.filter(m=>m.completed).map(card).join('')+'<button data-close>CLOSE / F1</button>';missionPanel.onclick=e=>{const id=e.target.closest('[data-track]')?.dataset.track,untrack=e.target.closest('[data-untrack]')?.dataset.untrack;if(id&&VoidMissions.track(state,id,C)){save();closeMissionLog();}else if(untrack&&state.universe.trackedMission===untrack){VoidMissions.untrack(state);save();closeMissionLog();}if(e.target.closest('[data-close]'))closeMissionLog();};document.body.append(missionPanel);missionPanel.querySelector('button')?.focus();}
addEventListener('keydown',e=>{if(e.code==='F1'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){e.preventDefault();if(!e.repeat)openMissionLog();}if(e.code==='Escape'&&missionPanel){e.preventDefault();closeMissionLog();}});

let interdictionFlash=0;const immersionUpdate=update;update=function(dt){const before=flight.route?.phase;immersionUpdate(dt);if(mode==='play'&&before!=='encounter'&&flight.route?.phase==='encounter')interdictionFlash=2;interdictionFlash=Math.max(0,interdictionFlash-dt);};
const immersionDraw=draw;draw=function(){immersionDraw();if(interdictionFlash>0&&mode==='play'){ctx.save();ctx.translate(W*.5,H*.28);ctx.rotate(-.045);ctx.globalAlpha=reducedMotion?1:.75+Math.sin(time*36)*.2;ctx.fillStyle='#f0978d';ctx.font='bold '+Math.max(20,Math.min(34,W*.025))+'px monospace';ctx.textAlign='center';ctx.fillText('⚠ WARP INTERDICTION',0,0);ctx.strokeStyle='#d56666';ctx.beginPath();ctx.moveTo(-W*.23,12);ctx.lineTo(W*.23,12);ctx.stroke();ctx.restore();}};

const guidanceDraw=draw;draw=function(){guidanceDraw();if(mode==='walking'&&trackedWalkWaypoint&&walker){const p=trackedWalkWaypoint.position,dx=p[0]-walker.x,dz=p[2]-walker.z,angle=Math.atan2(dx,dz)-walker.yaw;ctx.save();ctx.translate(W*.5,H*.62);ctx.rotate(angle);ctx.fillStyle='#e2c284';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(-5,5);ctx.lineTo(5,5);ctx.closePath();ctx.fill();ctx.restore();}};
