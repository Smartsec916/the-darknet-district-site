/* Developer Tools · Test & Jump To. Builds a throwaway campaign at any place and story stage. While a test runs,
   nothing is written to the browser save or the cloud; leaving reloads the page, which brings the real save back
   untouched. Only shown to accounts the server confirms as developers, and re-checked before each test starts. */
(function(){
 let active=false;
 // The campaign's own story stages, in order (campaign.js quests).
 const stages=[
  ['inheritance','Vesper · before Mara’s handoff'],['arrival','Heading to Meridian to meet Rook'],['legal-offer','Rook offers the first job'],
  ['legal-run','Carrying filters to Kepler'],['return','Back to Meridian after Kepler'],['illegal-offer','Rook offers the Rusthaven job'],
  ['illegal-run','Carrying wafers to Rusthaven'],['open','Open work: free travel, Admin and the factions'],
  ['district-ship','NeoChinatown · new District campaign with a TEST SHIP and travel unlocked (beginner campaign, no missions)']];
 const places=()=>Object.entries(VoidUniverse.locations).map(([id,l])=>[id,C.stations[id]?.name||l.name||id,VoidUniverse.systems[l.system]?.name||l.system]);
 let choice={location:'meridian',stage:'open',kit:true};

 function render(){
  const byName=places().sort((a,b)=>a[2].localeCompare(b[2])||a[1].localeCompare(b[1]));
  return '<p class="dev-note">Start a throwaway test session at any place and story stage. While it runs, <b>nothing is saved</b>: not to this browser and not to the cloud. <b>EXIT TEST</b> (top of the screen) reloads the game with your real save exactly as it was.</p>'
   +'<div class="dev-test-grid">'
   +'<label>Place<select id="dev-test-location">'+byName.map(([id,name,sys])=>'<option value="'+id+'"'+(id===choice.location?' selected':'')+'>'+escapeText(name+' · '+sys)+'</option>').join('')+'</select></label>'
   +'<label>Story stage<select id="dev-test-stage">'+stages.map(([id,name])=>'<option value="'+id+'"'+(id===choice.stage?' selected':'')+'>'+escapeText(name)+'</option>').join('')+'</select></label>'
   +'<label><span>Test kit</span><span><input id="dev-test-kit" type="checkbox"'+(choice.kit?' checked':'')+'> 10,000 credits, Ward pistol, missile launcher, every place discovered</span></label>'
   +'</div><div class="dev-actions"><button data-dev="test-start">START TEST SESSION</button>'+(active?'<button data-dev="test-exit">EXIT TEST</button>':'')+'</div><p id="dev-status" role="status"></p>';
 }
 function read(panel){choice={location:panel.querySelector('#dev-test-location')?.value||choice.location,stage:panel.querySelector('#dev-test-stage')?.value||choice.stage,kit:!!panel.querySelector('#dev-test-kit')?.checked};}

 // A campaign as the game would have it at that stage (old-save migration fills in the training already done).
 function build({location,stage,kit}){
  if(stage==='district-ship'){   // the District start (no Vesper opening, closed mission pool) plus the same award the beginner campaign ends with; the ship is only in this throwaway session
   const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;C.awardStarterShip(d);d.story.flags.testShip=true;if(kit){d.credits=10000;d.universe.discoveredLocations=[...new Set([...(d.universe.discoveredLocations||[]),...Object.keys(VoidUniverse.locations)])];}VoidMissions.sync(d,C);return d;
  }
  const raw=C.fresh();raw.quest=['legal-run','illegal-run'].includes(stage)?stage.replace('-run','-offer'):stage;raw.location=location;delete raw.progression;
  const s=C.restore(JSON.stringify(raw))||C.fresh();
  if(stage!=='inheritance'){s.progression.personal.weapon='ward-pistol';s.progression.opening.pistol=true;s.universe.missionLogUnlocked=true;}
  if(['legal-run','illegal-run'].includes(stage))C.accept(s);
  if(stage==='open'||kit){s.universe.freeTravel=true;s.missileUnlocked=true;s.missileOfferSeen=true;VoidUniverse.unlock(s);}
  if(kit){s.credits=10000;if(!s.creditGear.includes('launcher'))s.creditGear.push('launcher');s.universe.discoveredLocations=[...new Set([...(s.universe.discoveredLocations||[]),...Object.keys(VoidUniverse.locations)])];VoidUniverse.unlock(s);}
  s.location=location;VoidMissions.sync(s,C);return s;
 }
 async function start(panel){
  read(panel);const status=panel.querySelector('#dev-status');
  // Re-check with the server before handing out a test campaign.
  try{await VoidDevTools.request('developer/balance');}catch(e){status.textContent='Developer access could not be confirmed: '+e.message;return;}
  if(!VoidDevTools.authorized)return;
  active=true;banner.hidden=false;panel.hidden=true;
  state=build(choice);walkingLocation=walker=null;mode='menu';
  document.getElementById('screen')?.classList.add('hidden');
  if(choice.stage==='district-ship'){state.location='earth';delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true});}   // stand on the street beside the pad
  else if(choice.location==='vesper')await worldEnterWalking('vesper');else await dock();
  if(typeof hud==='function')hud();
  announce('TEST MODE · '+(C.stations[choice.location]?.name||choice.location)+' · nothing is saved');
 }
 /* PLAY AS ADMIN (David, 15 Nov 2026): a developer signs in and walks the District as Admin. First stage, built on the test session above, so NOTHING IS SAVED:
    a District campaign with no missions and a ship available (the same award the beginner campaign ends with), the V3 // SHADOW device, Admin's own profile and
    portrait in the V1, and Admin the NPC away from the counter (the existing adminOccupied flag), so Iris is the one behind it. Server-confirmed developers only. */
 function adminBuild(){const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;C.awardStarterShip(d);d.story.flags.testShip=true;d.story.flags.playingAs='admin';d.story.flags.adminOccupied=true;
  d.story.flags.deviceModel='v3';d.story.flags.area='district';d.story.flags.districtBadge=true;d.story.flags.profileJobs='merchant';d.credits=10000;
  d.universe.discoveredLocations=[...new Set([...(d.universe.discoveredLocations||[]),...Object.keys(VoidUniverse.locations)])];VoidMissions.sync(d,C);return d;}
 async function playAsAdmin(){
  try{await VoidDevTools.request('developer/balance');}catch(e){announce('Developer access could not be confirmed: '+e.message);return false;}
  if(!VoidDevTools.authorized)return false;
  active=true;banner.hidden=false;banner.querySelector('span').textContent='PLAYING AS ADMIN · TEST SESSION · NOTHING IS SAVED';
  state=adminBuild();walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');
  state.location='earth';await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,...VoidDistrictArea.resume(state,VoidNeoChinatown)});
  if(typeof hud==='function')hud();announce('You are Admin. Iris has the counter. Nothing in this session is saved.');return true;
 }
 function action(name,panel){if(name==='test-start')return start(panel);if(name==='test-exit')return exit();}
 function exit(){active=false;location.reload();}

 // While testing, the browser save is never written and cloud save/load is off.
 const campaignSave=save;save=function(){if(active)return false;return campaignSave.apply(this,arguments);};
 document.addEventListener('click',e=>{const a=e.target.closest?.('button')?.dataset.action;if(active&&a&&/^cloud-(save|load)/.test(a)){e.preventDefault();e.stopImmediatePropagation();announce('Test mode: cloud saves are off. Exit the test first.');}},{capture:true});
 const banner=document.createElement('div');banner.id='dev-test-banner';banner.hidden=true;banner.innerHTML='<span>TEST MODE · NOTHING IS SAVED</span><button type="button">EXIT TEST</button>';document.body.append(banner);
 banner.querySelector('button').onclick=exit;
 globalThis.VoidDevTest={render,action,build,adminBuild,playAsAdmin,get active(){return active;}};
})();
