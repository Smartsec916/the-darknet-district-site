/* Connect the modern world to the existing campaign, input, rewards and account UI. */
state.universe=VoidUniverse.restore(state.universe,state);
let modernMenuFailure=false,modernMenuReady=false,modernMenuPending=false,missionPanel=null,missionReturn=null,destinationPreparation=null;
const managedDestination=prepareDestination;
prepareDestination=function(){if(destinationPreparation)return destinationPreparation;destinationPreparation=managedDestination().finally(()=>destinationPreparation=null);return destinationPreparation;};
function renderUnavailable(){ctx.fillStyle='#07121e';ctx.fillRect(0,0,W,H);ctx.fillStyle='#bed6d4';ctx.font='18px monospace';ctx.fillText('3D display unavailable — open Menu to retry.',30,H*.5);}
function drawModernBackground(){
 if(mode==='menu'){
  // The menu picture is the city around the District (menu-backdrop.js), not the old space station. The 3D engine is still warmed up here, as before.
  const painted=globalThis.VoidMenuBackdrop?.draw(ctx,W,H,time,reducedMotion,0),image=painted?null:VoidBabylon.renderMenu(W,H,time,reducedMotion);
  if(image)ctx.drawImage(image,0,0,W,H);else{if(!painted){ctx.fillStyle='#030813';ctx.fillRect(0,0,W,H);}if(!modernMenuPending&&!VoidBabylon.diagnostics.menuReady&&!modernMenuFailure){modernMenuPending=true;VoidBabylon.prepareMenu().then(()=>modernMenuReady=true).catch(e=>{if(mode==='menu'&&!/cancel/i.test(e.message)){modernMenuFailure=true;console.warn('[VOID menu background]',e.message);}}).finally(()=>modernMenuPending=false);}}
  return;
 }
 if(walkingLocation&&walker&&VoidBabylon.scene){const img=VoidBabylon.renderRoom(walker,W,H,time);if(img)ctx.drawImage(img,0,0,W,H);return;}
 if(VoidGraphics.busy){if(!globalThis.VoidMenuBackdrop?.draw(ctx,W,H,time,reducedMotion,.45))renderUnavailable();return;}   // while a place is being prepared: the city, dimmed, behind the card (never the "unavailable" text)
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
 C.socialEntry(state);
 await dock();
}
const physicalResumeWalking=resumeWalking;
resumeWalking=function(){if(walkingLocation?.kind==='station'&&walkingLocation.ship!==VoidShips.get(state).id)return enterWalking('hangar');return physicalResumeWalking();};
enterWalking=async function(id,options){
 if(id==='vesper'||id==='hangar'&&state.location==='vesper'){VoidExplorationData.locations.vesper=VoidOpening.layout();await worldEnterWalking('vesper',options);if(mode==='walking'){state.universe.station={location:'vesper'};save();}return;}
 if(id==='hangar'||VoidUniverse.locations[id]){
  const loc=id==='hangar'?state.location:id;
  const def=VoidStationLayouts.layout(loc,VoidShips.get(state).id);def.name=C.stations[loc]?.name||loc;VoidExplorationData.locations.hangar=def;
  await worldEnterWalking('hangar',options);
  if(mode==='walking'){state.universe.station={location:state.location};if(state.location==='meridian')VoidMissions.complete(state,'meet-rook','enter',C);save();}
 }else {const d=VoidExplorationData.locations[id];if(d){d.ship=VoidShips.get(state).id;const board=d.interactions.find(i=>i.action==='board');if(board){board.position=[-2,1.7,-25];board.label='BOARD '+VoidShips.get(state).name.toUpperCase();}}await worldEnterWalking(id,options);}
};
const podWake=document.createElement('section');podWake.id='pod-wake';podWake.hidden=true;podWake.setAttribute('aria-labelledby','pod-wake-title');podWake.innerHTML='<div class="pod-wake-card"><p>THE DARKNET DISTRICT · POD 01</p><h2 id="pod-wake-title">You wake in a Sleeping Pod.</h2><div class="pod-wake-actions"><button type="button" data-pod="exit">EXIT POD</button><a href="#" role="button" data-pod="music">MUSIC &amp; LIGHTS</a><a href="#" role="button" data-pod="look">LOOK INSIDE</a><a href="#" role="button" data-pod="vend">VENDING</a></div><div class="pod-vend" hidden><div class="pod-vend-grid" role="group" aria-label="Vending machine stock"></div><div class="pod-vend-info" aria-live="polite"></div><div class="pod-wake-actions"><a href="#" role="button" data-vend="buy" aria-disabled="true">DISPENSE</a><a href="#" role="button" data-vend="back">BACK</a></div></div></div>';document.body.append(podWake);
// The pod's built-in vending unit (stock from neochinatown.js VoidPodVending). Flavour only: no credits are charged and nothing is added to the inventory.
const podVend={box:podWake.querySelector('.pod-vend'),grid:podWake.querySelector('.pod-vend-grid'),info:podWake.querySelector('.pod-vend-info'),buy:podWake.querySelector('[data-vend="buy"]'),picked:null,yaw:null};
function podVendShow(on){const main=podWake.querySelector('.pod-wake-card>.pod-wake-actions'),title=podWake.querySelector('#pod-wake-title');podVend.box.hidden=!on;main.hidden=on;title.hidden=on;podWake.classList.toggle('vending',on);
 if(on){const items=globalThis.VoidPodVending?.products||[];if(!podVend.grid.children.length)for(const item of items){const b=document.createElement('a');b.href='#';b.setAttribute('role','button');b.dataset.vendItem=item.code;b.textContent=item.code+' '+item.name;podVend.grid.append(b);}
  podVend.picked=null;podVend.buy.setAttribute('aria-disabled','true');podVend.info.textContent=items.length?'Choose an item.':'The machine is empty.';for(const b of podVend.grid.children)b.setAttribute('aria-pressed','false');if(walker){podVend.yaw=walker.yaw;walker.yaw=Math.PI;walker.pitch=0;}podVend.grid.querySelector('a')?.focus({preventScroll:true});}
 else if(podVend.yaw!==null&&walker){walker.yaw=podVend.yaw;podVend.yaw=null;}}
podWake.querySelector('[data-pod="vend"]').addEventListener('click',e=>{e.preventDefault();if(mode==='pod-waking')podVendShow(true);});
podVend.box.addEventListener('click',e=>{const b=e.target.closest('a[role="button"]');if(!b)return;e.preventDefault();if(mode!=='pod-waking')return;
 if(b.dataset.vendItem){const item=(globalThis.VoidPodVending?.products||[]).find(x=>x.code===b.dataset.vendItem);if(!item)return;podVend.picked=item;podVend.buy.setAttribute('aria-disabled','false');for(const x of podVend.grid.children)x.setAttribute('aria-pressed',String(x===b));podVend.info.textContent=item.name+' · '+item.category+' · '+item.price.toFixed(2)+' — '+item.description;}
 else if(b.dataset.vend==='buy'&&podVend.picked){podVend.info.textContent='The coil turns. '+podVend.picked.name+' drops into the tray.';}
 else if(b.dataset.vend==='back'){podVendShow(false);podWake.querySelector('[data-pod="vend"]').focus({preventScroll:true});}});
function enterSleepingPod(index=1){
 if(mode!=='walking'||walkingLocation?.area!=='interior'||!walker||!Number.isInteger(index)||index<1||index>10)return false;
 const [x,z]=VoidNeoChinatown.toWorld(-15.4,57+((index-1)%5)*2.6);
 Object.assign(walker,{x,y:1.1+(index>5?1.7:0),z,yaw:-Math.PI/2,pitch:0,vx:0,vz:0,eye:1.1+(index>5?1.7:0)});
 globalThis.VoidPodMusic?.enterPod?.(index);state.story.flags.activePod=index;state.story.flags.podWakePending=true;save();showPodWake();return true;
}
podWake.querySelector('[data-pod="music"]').addEventListener('click',e=>{e.preventDefault();if(mode==='pod-waking'){podWake.hidden=true;globalThis.VoidPodMusic?.open?.({inPod:true});}});
podWake.querySelector('[data-pod="look"]').addEventListener('click',e=>{e.preventDefault();if(mode!=='pod-waking'||!walker)return;const inside=walker.yaw!==Math.PI/2;walker.yaw=inside?Math.PI/2:-Math.PI/2;e.currentTarget.textContent=inside?'LOOK THROUGH HATCH':'LOOK INSIDE';});
podWake.querySelector('[data-pod="exit"]').addEventListener('click',()=>{
 if(mode!=='pod-waking'||!walker||!state?.story?.flags?.podWakePending)return;
 const exit=VoidDistrictArea.podExit(VoidNeoChinatown,state.story.flags.activePod||1);if(VoidExplorer.blocked(exit.spawn[0],exit.spawn[2],walkingLocation))return;
 Object.assign(walker,{x:exit.spawn[0],y:exit.spawn[1],z:exit.spawn[2],yaw:exit.yaw,pitch:0,vx:0,vz:0,eye:1.68});
 delete state.story.flags.podWakePending;podVend.yaw=null;podVendShow(false);podWake.hidden=true;resumeWalking();save();
});
async function showPodWake(){
 if(mode!=='walking'||walkingLocation?.area!=='interior'||state.story.flags.podWakePending!==true)return;
 mode='pod-waking';clearInput();walkingKeys.clear();document.exitPointerLock?.();podVendShow(false);
 if(globalThis.VoidPodMusic?.selectedPod!==(state.story.flags.activePod||1))globalThis.VoidPodMusic?.enterPod?.(state.story.flags.activePod||1);
 const podNumber=String(state.story.flags.activePod||1).padStart(2,'0');podWake.querySelector('.pod-wake-card p').textContent='THE DARKNET DISTRICT · POD '+podNumber;podWake.querySelector('[data-pod="look"]').textContent=walker.yaw===Math.PI/2?'LOOK THROUGH HATCH':'LOOK INSIDE';
 const creator=globalThis.VoidCharacterCreator,account=globalThis.VoidAccount;
 if(account?.user&&!account.profileReady){podWake.hidden=false;podWake.classList.add('preparing');podWake.querySelectorAll('button,a').forEach(b=>b.hidden=true);
  try{await account.ensureProfile?.();}catch{}if(mode!=='pod-waking'||state.story.flags.podWakePending!==true)return;}
 podWake.classList.remove('preparing');podWake.querySelectorAll('button,a').forEach(b=>b.hidden=false);
 if(!state.story.flags.appearanceOffered&&!creator?.stored()&&!account?.character){
  podWake.hidden=true;
  const shown=await creator?.open({context:'first',onClose:confirmed=>{if(confirmed){mode='pod-waking';podWake.hidden=false;podWake.querySelector('[data-pod="exit"]').focus({preventScroll:true});}else exitActiveGame().then(renderMainMenu);}});
  if(!shown&&mode==='pod-waking')exitActiveGame().then(renderMainMenu);
  return;
 }
 podWake.hidden=false;podWake.querySelector('[data-pod="exit"]').focus({preventScroll:true});
}
dock=async function(tab='dock'){
 if(VoidGraphics.busy){VoidPreparation.cancel?.();preparationGeneration++;await Promise.allSettled([preparingLaunch,destinationPreparation].filter(Boolean));VoidGraphics.busy=false;walkingLocation=walker=null;}
 if(tab==='shop'){shop();return;}
 if(walkingLocation&&walker&&!state.story.flags.podWakePending){resumeWalking();return;}
 // NeoChinatown is two environments (street and District interior); a save inside the District resumes inside it (district-area.js).
 if(state.location==='earth'&&globalThis.VoidDistrictArea){await enterWalking(VoidDistrictArea.keyFor(state),VoidDistrictArea.resume(state,VoidNeoChinatown));await showPodWake();return;}
 return enterWalking(state.location==='earth'?'sacramento':state.location==='mars'?'mars-terminal':'hangar');
};
leaveWalking=async function(){
 document.exitPointerLock?.();walkingKeys.clear();
 if(!C.flight(state)&&!state.universe.freeTravel){announce('Talk to the station contact before boarding.');return;}
 state.universe.station=null;save();return launch();
};
// Delivery reward/state remains authoritative in Campaign.complete; station entry is automatic.
const worldArrive=arrive;
let solHandover=null;
arrive=function(){const previous=state.location,quest=state.quest;solHandover=null;worldArrive();if(!['arrival','dialogue'].includes(mode)||state.location===previous&&state.quest===quest)return;
 const lines=speech?.lines.slice(),label=speech?.label;speech=null;
 const docking=dock(),token=preparationGeneration;Promise.resolve(docking).then(()=>{
  // A delivery to Kepler is handed over to Dr. Sol at the bar (David, 2026-10-23): his lines wait until you talk to him.
  if(token===preparationGeneration&&lines&&mode==='walking'&&state.location==='kepler'&&lines[0]?.who==='sol'&&walkingLocation?.interactions.some(i=>i.id==='sol')){solHandover={lines,label};announce('Hand the delivery to Dr. Sol at the bar.');return;}
  if(token===preparationGeneration&&lines&&mode==='walking')talk('',lines,()=>{if(walkingLocation)resumeWalking();},label||'EXPLORE STATION');});
};
// Keep conversations and service overlays in the same physical station.
const worldTalk=talk;
talk=function(background,lines,done,label,heading){worldTalk(walkingLocation?'':background,lines,done,label,heading);if(walkingLocation){screen.dataset.scene='';screen.classList.remove('cinematic');screen.querySelectorAll('.portrait').forEach(el=>el.remove());}};
const worldRenderLine=renderLine;
renderLine=function(){worldRenderLine();if(walkingLocation){screen.dataset.scene='';screen.classList.remove('cinematic');screen.querySelectorAll('.portrait').forEach(el=>el.remove());/* A conversation in a station is in person: name the place. Only comms calls and messages are transmissions. */const eyebrow=screen.querySelector('.scene-heading .eyebrow');if(eyebrow&&!/comms|message|transmission/i.test(speech?.heading||''))eyebrow.textContent=globalThis.VoidVR?.active?'VR · '+VoidVR.session.exp.title.toUpperCase():(C.stations[state.location]?.name||'').toUpperCase();}};
barRoom=()=>resumeWalking();bar=barRoom;contacts=function(){campaignBoard();};
const originalRookConversation=rookConversation;
// Rook's cargo network (campaign.js): he pays what he owes first, then shows the jobs on his board.
// Each job says what it is, where it goes, how much hold it takes, what it pays and who pays.
// Rook's payment line approved by David, 2026-10-27.
function rookFreightOffer(){
 const key=VoidInput.label(VoidInput.bindings.missionLog||'KeyL'),place=id=>C.stations[id]?.name||id,far=id=>VoidUniverse.system(id)!==VoidUniverse.system(state.location);
 const owed=C.rookOwed(state);
 if(owed){const paid=C.collectRook(state);if(paid){VoidMissions.sync(state,C);save();hud();
  talk('',[{who:'rook',text:'Client confirmed the drop. Here’s your pay.'}],()=>{announce('PAYMENT RECEIVED · '+paid.toLocaleString()+' credits · ROOK FREIGHT RUN #'+owed.number+' COMPLETE');rookFreightOffer();},'NEXT →','Rook’s booth');return;}}
 if(state.contract==='rook-run'){const r=C.rookRun(state);
  talk('',[{who:'rook',text:'The '+r.cargo.toLowerCase()+' are still in your hold. '+place(r.destination)+' is waiting on them.'}],resumeWalking,'RETURN TO STATION');
  // Handing the cargo back ends the job without pay or penalty.
  if(r.kind!=='legacy')screen.querySelector('.speech-controls')?.insertAdjacentHTML('beforeend',button('HAND THE CARGO BACK','rook-cancel',true));return;}
 if(state.contract){talk('',[{who:'rook',text:'Finish the job you are carrying. Then come see me.'}],resumeWalking,'RETURN TO STATION');return;}
 const board=C.rookBoard({...state,contract:null}),r=board[0],free=C.holdFree(state);
 const served=String(state.story.flags.rookSystems||'erebus').split(','),opening=!served.includes(VoidUniverse.system(r.destination));
 const lead=opening?'Lanes into '+VoidUniverse.systems[VoidUniverse.system(r.destination)].name+' just opened up. Get in before everyone else does.':r.number===1?'Opening jobs are done. I keep freight moving, and you look like you could use steady work.':'Back for more? Good.';
 const jobs=board.map(j=>'<li><b>'+escapeText(j.label.toUpperCase())+'</b> · '+escapeText(j.cargo)+' to '+escapeText(place(j.destination))+(far(j.destination)?' (interstellar)':'')+' · '+(j.units>1?j.units+' hold spaces':'1 hold space')+' · '+(j.legal?'legal':'<em>not legal</em>')+' · <b>'+j.payment.toLocaleString()+' CR</b> '+(j.payAt==='rook'?'paid by Rook here after delivery':'paid on delivery')+'</li>').join('');
 talk('',[{who:'rook',text:lead+(r.number===1?' Admin is over in Tessaly if you want other work. '+key+' opens your Mission Log.':'')}],resumeWalking,'NOT NOW','Rook’s booth');
 speech.shown=speech.lines[0].text.length;$('speech-next').style.display='none';
 screen.querySelector('.dialogue-window')?.classList.add('choice-menu');
 screen.querySelector('.speech-controls')?.insertAdjacentHTML('beforebegin','<ul class="rook-board">'+jobs+'</ul>');
 screen.querySelector('.speech-controls')?.insertAdjacentHTML('beforeend',board.map(j=>button(j.units>free?'NO HOLD SPACE · '+j.label.toUpperCase():'TAKE '+j.label.toUpperCase()+' →','rook-job:'+j.kind,false,j.units>free)).join('')+button('NOT NOW','walk-resume',true));
}
screen.addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.action;if(!a||!state)return;
 if(a.startsWith('rook-job:')){speech=null;globalThis.VoidAudio?.cancel?.();
  if(C.accept(state,a)){const r=C.rookRun(state);VoidMissions.track(state,r.id,C);save();announce('Cargo loaded. '+(C.stations[r.destination]?.name||r.destination)+' tracked. '+(r.payAt==='rook'?'Rook pays when you are back.':'Paid on delivery.'));}
  else announce('Not enough free hold space for that job.');resumeWalking();}
 else if(a==='rook-cancel'){speech=null;globalThis.VoidAudio?.cancel?.();if(C.cancelRook(state)){VoidMissions.sync(state,C);save();announce('Rook’s crew takes the cargo back. No pay, no hard feelings.');}resumeWalking();}
});
rookConversation=function(){if(state.location==='meridian'){VoidMissions.complete(state,'meet-rook','enter',C);VoidMissions.complete(state,'meet-rook','locate',C);VoidMissions.complete(state,'meet-rook','speak',C);save();}if(state.missileUnlocked&&!state.missileOfferSeen){state.missileOfferSeen=true;VoidUniverse.unlock(state);save();talk('',[rookMissileLine],resumeWalking,'RETURN TO STATION');return;}if(state.quest==='open'){rookFreightOffer();return;}/* freight never waits on the missile drill (David, 2026-10-23) */originalRookConversation();};
VoidInteractions.register('talk',({item})=>{
 if(item.character==='rook')return rookConversation();
 if(item.character==='mara')return playStoryScene('mara_workshop_intro');
 if(item.character==='sol'&&solHandover){const h=solHandover;solHandover=null;return talk('',h.lines,resumeWalking,h.label||'RETURN TO STATION');}
 if(state.quest==='open'&&item.character==='sol')return brief('medicine');if(state.quest==='open'&&item.character==='iona')return brief('ghost');
 const texts={elias:'The ship is yours. Go make a life of your own.',nyx:'Rook is in the booth. The outfitter is across the concourse.',iona:'Rusthaven stays alive because people keep bringing what we need.',sol:'The clinics are short on supplies. Check the mission terminal before you go.'};
 talk('',[{who:item.character,text:texts[item.character]}],resumeWalking,'RETURN TO STATION');
});
VoidInteractions.register('services',()=>{shop();screen.querySelector('.shop-heading,.actions')?.insertAdjacentHTML('beforeend',button('RETURN TO STATION','walk-resume',true));});
VoidInteractions.register('jobs',()=>{campaignBoard();});
// Existing mission-board function name is kept isolated here for service interactions.
const physicalCampaignBoard=campaignBoard;
campaignBoard=function(){if(state.quest!=='open'){announce('Rook has your next job.');resumeWalking();return;}physicalCampaignBoard();screen.querySelector('.shop-layout')?.insertAdjacentHTML('beforeend','<h2>CARGO CONTACTS</h2><div class="hangar-grid">'+C.contracts.map(c=>'<article class="card"><h3>'+escapeText(c.name)+'</h3><p>'+escapeText(c.briefing)+'</p>'+button((walkingLocation?.interactions?.some(i=>i.character===({'Dr. Sol':'sol','Iona Vale':'iona','Rook':'rook'})[c.contact])?'TALK / ':'CALL / ')+escapeText(c.contact),'brief:'+c.id,false,!!state.contract)+'</article>').join('')+'</div>');screen.querySelector('.actions,.shop-heading')?.insertAdjacentHTML('beforeend',button('RETURN TO STATION','walk-resume',true));}
const worldWorkshop=workshopOpening;
// New campaigns wake in pod 01; existing saves keep their saved environment.
async function districtStart(){await dock();}
workshopOpening=async function(){if(VoidMissions.closed(state))return districtStart();await enterWalking('vesper');};
// Remove disconnected SOL prototype entry points. All travel uses Campaign.flight + VoidWarp.
navigation=function(){announce('Choose a route marker after boarding your ship.');};
const worldChoose=C.chooseDestination;
function setFlightDestination(id){if(!worldChoose(state,id))return;const next=C.flight(state);if(!next)return;current=next;flight.route=VoidWarp.create(state.location,id,null,next.enemies>0);flight.route.phase='align';flight.nav={x:flight.route.vector.x*140,y:flight.route.vector.y*140,z:flight.route.vector.z*140};state.travel=flight.route;spawned=resolved=0;elapsed=0;preparedDestination=null;save();$('route-name').textContent=C.stations[id].name.toUpperCase();}
// Boarding with no accepted job enters normal flight with a selectable local route.
const originalFlight=C.flight;

let routeMarkers=[],trackedWalkWaypoint=null;
const missionTracker=document.createElement('div');missionTracker.id='mission-tracker';missionTracker.hidden=true;document.body.append(missionTracker);
const missionLogButton=document.createElement('button');missionLogButton.id='mission-log-button';missionLogButton.type='button';missionLogButton.textContent='MISSION LOG';missionLogButton.setAttribute('aria-keyshortcuts','L');missionLogButton.hidden=true;missionLogButton.addEventListener('click',()=>openMissionLog());document.body.append(missionLogButton);
function flightRoutes(){return VoidUniverse.destinations(state).map((id,i)=>{const angle=-1.05+i*.42;return {id,vector:VoidWarp.skyward(state.location,{x:Math.sin(angle),y:0,z:Math.cos(angle)})};});}
const worldUpdate=update;
update=function(dt){
 if(mode==='play'&&flight.route?.phase==='departure'){const speed=Math.max(0,Math.min(18,(flight.route.departure-1)*9));flight.velocity={x:0,y:0,z:speed};}
 worldUpdate(dt);
 if(mode==='play'&&state.universe.freeTravel&&flight.route?.phase==='align'&&VoidNavigationReveal.opacity(navigationReveal)>0){routeMarkers=flightRoutes();const chosen=routeMarkers.find(r=>FM.dot(flightBasis().f,r.vector)>.993);if(chosen&&chosen.id!==current.destination)setFlightDestination(chosen.id);const marker=routeMarkers.find(r=>r.id===current.destination);if(marker){flight.route.vector=marker.vector;flight.nav={x:marker.vector.x*140,y:marker.vector.y*140,z:marker.vector.z*140};}}
 const tracked=['play','walking'].includes(mode)&&!globalThis.VoidFlightSkirmish?.active?VoidMissions.tracked(state,C):null;missionTracker.hidden=!tracked;if(tracked){const label=tracked.title+' / '+tracked.objective;if(missionTracker.textContent!==label)missionTracker.textContent=label;}
 // The on-screen reminder only shows in the starting area (Vesper); L opens the log anywhere.
 missionLogButton.hidden=!state.universe.missionLogUnlocked||state.location!=='vesper'||!['play','walking'].includes(mode)||!!globalThis.VoidFlightSkirmish?.active;
 {const key=VoidInput.label(VoidInput.bindings.missionLog||'KeyL'),text='MISSION LOG · '+key;if(missionLogButton.textContent!==text)missionLogButton.textContent=text;
  // First time the log becomes available, say how to open it.
  if(!missionLogButton.hidden&&state.story&&!state.story.flags.missionLogHint){state.story.flags.missionLogHint=true;announce('Mission Log unlocked. Press '+key+' to open it and choose what to track.');save();}}
 trackedWalkWaypoint=null;if(mode==='walking'&&walker){const m=VoidMissions.tracked(state,C),g=VoidMissions.guidance(state,m,true);if(g){const item=walkingLocation.interactions.find(i=>i.id===g.interaction)||(g.interaction==='rook'?walkingLocation.interactions.find(i=>i.id==='jobs'):null);let waypoint=item;if(item){if(walker.z<3&&item.position[2]>4)waypoint={position:[0,1.7,3]};else if(walker.z<18&&item.position[2]>18)waypoint={position:[0,1.7,19]};else if(walker.z>19&&item.position[2]<18)waypoint={position:[0,1.7,19]};else if(walker.z>4&&item.position[2]<4)waypoint={position:[0,1.7,3]};}trackedWalkWaypoint=waypoint;$('walking-caption').textContent=walkingLocation.name+' · '+g.label+(waypoint?' · '+Math.round(Math.hypot(waypoint.position[0]-walker.x,waypoint.position[2]-walker.z))+'m':'');}
  // The Kepler hand-over leads to Dr. Sol at the bar (through the door and corridor, as above).
  const sol=solHandover&&state.location==='kepler'&&walkingLocation?.interactions.find(i=>i.id==='sol');if(sol){const waypoint=walker.z<3?{position:[0,1.7,3]}:walker.z<18?{position:[0,1.7,19]}:sol;trackedWalkWaypoint=waypoint;$('walking-caption').textContent=walkingLocation.name+' · Hand the delivery to Dr. Sol at the bar · '+Math.round(Math.hypot(waypoint.position[0]-walker.x,waypoint.position[2]-walker.z))+'m';}}
};
const worldMarker=drawWarpMarker;
drawWarpMarker=function(){
 if(!state.universe.freeTravel)return worldMarker();if(flight.route?.phase!=='align'||VoidNavigationReveal.opacity(navigationReveal)<=0)return;
 const guide=VoidMissions.guidance(state,VoidMissions.tracked(state,C),false);for(const r of flightRoutes()){const v={x:r.vector.x*140,y:r.vector.y*140,z:r.vector.z*140},p=flightPoint(v),interstellar=VoidUniverse.route(state.location,r.id).kind==='interstellar',isTracked=guide?.destination===r.id;if(p.z<=0||p.x<W*.12||p.x>W*.88||p.y<H*.16||p.y>H*.72){if(isTracked)drawNavigationEdge(v,'MISSION / '+guide.label);continue;}ctx.save();ctx.translate(p.x,p.y);ctx.shadowColor='#000';ctx.shadowBlur=isTracked?14:3;ctx.strokeStyle=isTracked?'#ffe58b':interstellar?'#bda0e0':'#83c4b5';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=isTracked?3:current.destination===r.id?2:1;ctx.beginPath();for(let i=0;i<=6;i++){const a=i*Math.PI/3;const radius=isTracked?29:interstellar?27:18;i?ctx.lineTo(Math.cos(a)*radius,Math.sin(a)*radius):ctx.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);}ctx.stroke();ctx.font=isTracked?'bold 13px monospace':'11px monospace';ctx.textAlign='center';ctx.fillText((isTracked?'◆ MISSION / ':'')+(interstellar?'INTERSTELLAR / ':'')+C.stations[r.id].name.toUpperCase(),0,43);ctx.restore();}
};
function closeMissionLog(){if(!missionPanel)return;missionPanel.remove();missionPanel=null;mode=missionReturn;missionReturn=null;clearInput();walkingKeys.clear();canvas.focus();}
function openMissionLog(){
 if(missionPanel)return closeMissionLog();
 if(globalThis.VoidFlightSkirmish?.active)return;
 if(!['play','walking','dock','dialogue'].includes(mode))return;
 missionReturn=mode;mode='mission-log';clearInput();walkingKeys.clear();document.exitPointerLock?.();
 missionPanel=document.createElement('section');missionPanel.id='mission-log';missionPanel.setAttribute('role','dialog');missionPanel.setAttribute('aria-label','Mission Log');
 const card=m=>'<article class="mission-entry"><h2>'+escapeText(m.title)+' <small>'+escapeText(m.completed?'COMPLETE':m.tracked?'TRACKED':'ACTIVE')+'</small></h2><p>'+escapeText(m.description)+'</p><p class="mission-meta">'+escapeText(m.type.toUpperCase())+(m.destination?' · '+escapeText(C.stations[m.destination]?.name||m.destination):m.type==='tutorial'?'':' · DESTINATION UNKNOWN')+(m.rewards?' · '+escapeText(String(m.rewards))+' CR':'')+'</p><ul>'+m.objectives.map(o=>'<li class="'+(o.complete?'complete':'pending')+'">'+(o.complete?'✓ ':'○ ')+escapeText(o.label)+'</li>').join('')+'</ul>'+(m.completed?'':m.tracked?'<button data-untrack="'+escapeText(m.id)+'">UNTRACK MISSION</button>':'<button data-track="'+escapeText(m.id)+'">TRACK MISSION</button>')+'</article>';
 const list=()=>{const missions=VoidMissions.sync(state,C);return '<h2>ACTIVE MISSIONS</h2>'+(missions.filter(m=>!m.completed).map(card).join('')||'<p>No active missions.</p>')+'<h2>COMPLETED MISSIONS</h2>'+(missions.filter(m=>m.completed).map(card).join('')||'<p>No completed missions yet.</p>');};
 missionPanel.innerHTML='<h1>MISSION LOG</h1><div data-missions>'+list()+'</div><button data-close>CLOSE / '+escapeText(VoidInput.label(VoidInput.bindings.missionLog||'KeyL'))+'</button>';
 missionPanel.onclick=e=>{const id=e.target.closest('[data-track]')?.dataset.track,untrack=e.target.closest('[data-untrack]')?.dataset.untrack;// Tracking changes refresh the log in place; it stays open until L (or its close button).
// Only the mission list is redrawn: the log itself (and a paused flight behind it) stays exactly as it is.
const refresh=()=>{const top=missionPanel.scrollTop;missionPanel.querySelector('[data-missions]').innerHTML=list();missionPanel.scrollTop=top;e.stopPropagation();};if(id&&VoidMissions.track(state,id,C)){save();refresh();return;}else if(untrack&&state.universe.trackedMission===untrack){VoidMissions.untrack(state);save();refresh();return;}if(e.target.closest('[data-close]'))closeMissionLog();};
 document.body.append(missionPanel);missionPanel.querySelector('button')?.focus();
}
addEventListener('keydown',e=>{if(e.code===(VoidInput.bindings.missionLog||'KeyL')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){if(!['play','walking','dock','dialogue','mission-log'].includes(mode))return;e.preventDefault();if(!e.repeat)openMissionLog();}if(e.code==='Escape'&&missionPanel){e.preventDefault();closeMissionLog();}});

let interdictionFlash=0;const immersionUpdate=update;update=function(dt){const before=flight.route?.phase;immersionUpdate(dt);if(mode==='play'&&before!=='encounter'&&flight.route?.phase==='encounter')interdictionFlash=2;interdictionFlash=Math.max(0,interdictionFlash-dt);};
const immersionDraw=draw;draw=function(){immersionDraw();if(interdictionFlash>0&&mode==='play'){ctx.save();ctx.translate(W*.5,H*.28);ctx.rotate(-.045);ctx.globalAlpha=reducedMotion?1:.75+Math.sin(time*36)*.2;ctx.fillStyle='#f0978d';ctx.font='bold '+Math.max(20,Math.min(34,W*.025))+'px monospace';ctx.textAlign='center';ctx.fillText('⚠ WARP INTERDICTION',0,0);ctx.strokeStyle='#d56666';ctx.beginPath();ctx.moveTo(-W*.23,12);ctx.lineTo(W*.23,12);ctx.stroke();ctx.restore();}};

const guidanceDraw=draw;draw=function(){guidanceDraw();drawMissionWaypoint();};
// Tracked-mission waypoint: a large arrow around the screen centre pointing toward the
// goal, with its distance. Follows whatever the Mission Log tracks.
function drawMissionWaypoint(){
 if(mode!=='walking'||!trackedWalkWaypoint||!walker)return;
 const p=trackedWalkWaypoint.position,dx=p[0]-walker.x,dz=p[2]-walker.z,label=Math.round(Math.hypot(dx,dz))+' m',pulse=reducedMotion?1:.75+.25*Math.sin(time*4);
 let angle=Math.atan2(dx,dz)-walker.yaw;const r=Math.min(W,H)*.15;
 // When the goal is in front of the camera, aim at where it actually is on screen (its height and offset included).
 {const s=globalThis.VoidBabylon?.scene,cam=s?.activeCamera,B=globalThis.BABYLON;if(cam&&B){const v=new B.Vector3(p[0],Math.max(.4,(p[1]??1.7)-.5),p[2]);if(B.Vector3.TransformCoordinates(v,cam.getViewMatrix()).z>.4){const sp=B.Vector3.Project(v,B.Matrix.Identity(),s.getTransformMatrix(),cam.viewport.toGlobal(W,H));angle=Math.atan2(sp.x-W*.5,(H*.7)-sp.y);}}}
 ctx.save();ctx.lineJoin='round';ctx.font='bold 13px Consolas, monospace';ctx.textAlign='center';
 // Ring sits below the crosshair so a goal straight ahead is pointed at near floor level.
 ctx.translate(W*.5+Math.sin(angle)*r,H*.7-Math.cos(angle)*r);ctx.rotate(angle);
 ctx.shadowColor='#000';ctx.shadowBlur=12;ctx.fillStyle='rgba(255,214,120,'+(.6+.35*pulse)+')';ctx.strokeStyle='#1a1206';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(-17,10);ctx.lineTo(0,2);ctx.lineTo(17,10);ctx.closePath();ctx.stroke();ctx.fill();
 ctx.rotate(-angle);ctx.shadowBlur=4;ctx.fillStyle='#ffe7a8';ctx.fillText(label,0,32);
 ctx.restore();
}
