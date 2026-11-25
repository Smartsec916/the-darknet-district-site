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
 let choice={location:'meridian',stage:null,kit:true};

 function liveTrees(){
  return (globalThis.VoidLiveContent?.env?.trees||[]).filter(tree=>tree.missions?.length);
 }
 function missionOptions(){
  return liveTrees().map(tree=>'<optgroup label="'+escapeText(tree.name||tree.id)+'">'+tree.missions.map(m=>{
   const value='mission:'+m.id;
   return '<option value="'+escapeText(value)+'"'+(choice.stage===value?' selected':'')+'>'+escapeText(m.title||m.id)+'</option>';
  }).join('')+'</optgroup>').join('');
 }
 function render(){
  choice.stage??=liveTrees()[0]?.missions[0]?'mission:'+liveTrees()[0].missions[0].id:'open';
  const byName=places().sort((a,b)=>a[2].localeCompare(b[2])||a[1].localeCompare(b[1]));
  return '<p class="dev-note">Start a throwaway test session at any place and story stage. While it runs, <b>nothing is saved</b>: not to this browser and not to the cloud. <b>EXIT TEST</b> (top of the screen) reloads the game with your real save exactly as it was.</p>'
   +'<div class="dev-test-grid">'
   +'<label>Place for story presets<select id="dev-test-location">'+byName.map(([id,name,sys])=>'<option value="'+id+'"'+(id===choice.location?' selected':'')+'>'+escapeText(name+' · '+sys)+'</option>').join('')+'</select></label>'
   +'<label>Story stage<select id="dev-test-stage">'+missionOptions()+'<optgroup label="Campaign presets">'+stages.map(([id,name])=>'<option value="'+id+'"'+(id===choice.stage?' selected':'')+'>'+escapeText(name)+'</option>').join('')+'</optgroup></select></label>'
   +'<label><span>Test kit</span><span><input id="dev-test-kit" type="checkbox"'+(choice.kit?' checked':'')+'> 10,000 credits, Ward pistol, missile launcher, every place discovered</span></label>'
   +'</div><div class="dev-actions"><button data-dev="test-start">START TEST SESSION</button>'+(active?'<button data-dev="test-exit">EXIT TEST</button>':'')+'</div>'
   +'<h3 class="dev-group">Street life</h3><p class="dev-note">Two people argue a few steps in front of you; the people round about stop and most of them film it on their V1 (monks and V3 // Shadow carriers do not). Walking in NeoChinatown only.</p><div class="dev-actions"><button data-dev="test-argument">STAGE A STREET ARGUMENT HERE</button></div><p id="dev-status" role="status"></p>';
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
  if(choice.stage.startsWith('mission:')){
   const id=choice.stage.slice(8),mission=liveTrees().flatMap(tree=>tree.missions).find(m=>m.id===id);
   if(!mission){status.textContent='This mission is no longer available. Reopen Test & Jump To.';return;}
   try{
    await VoidDevTools.loadEditor();
    const editor=globalThis.VoidMissionEditor;
    let target;
    const result=await session({banner:'TEST MISSION · '+mission.title,build:()=>{
     target=editor.liveTreeState(id);
     const s=target.state;
     if(choice.kit){
      s.credits=10000;s.progression.personal.weapon='ward-pistol';s.missileUnlocked=true;
      if(!s.creditGear.includes('launcher'))s.creditGear.push('launcher');
      s.universe.discoveredLocations=[...new Set([...s.universe.discoveredLocations,...Object.keys(VoidUniverse.locations)])];
     }
     return s;
    },enter:()=>editor.enterTree(target.where),message:()=>mission.title+' · '+target.notes.join(' ')});
    if(result?.error)status.textContent=result.error;
   }catch(error){status.textContent='Could not start this mission. '+error.message;}
   return;
  }
  // Re-check with the server before handing out a test campaign.
  try{await VoidDevTools.request('developer/balance');}catch(e){status.textContent='Developer access could not be confirmed: '+e.message+'. Sign in again with the developer account, then try once more.';return;}
  if(!VoidDevTools.authorized)return;
  try{document.activeElement?.blur?.();}catch{}active=true;stepNote('');banner.hidden=false;panel.hidden=true;
  state=build(choice);walkingLocation=walker=null;mode='menu';
  document.getElementById('screen')?.classList.add('hidden');
  if(choice.stage==='district-ship'){state.location='earth';delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'port'});}   // stand on the street beside the pad (the Port quarter)
  else if(choice.location==='vesper')await worldEnterWalking('vesper');else await dock();
  if(typeof hud==='function')hud();
  announce('TEST MODE · '+(C.stations[choice.location]?.name||choice.location)+' · nothing is saved');
 }
 /* PLAY AS ADMIN (the owner, 15 Nov 2026): a developer signs in and walks the District as Admin. First stage, built on the test session above, so NOTHING IS SAVED:
    a District campaign with no missions and a ship available (the same award the beginner campaign ends with), the V3 // SHADOW device, Admin's own profile and
    portrait in the V1, and Admin the NPC away from the counter (the existing adminOccupied flag), so Iris is the one behind it. Server-confirmed developers only. */
 function adminBuild(){const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;C.awardStarterShip(d);d.story.flags.testShip=true;d.story.flags.playingAs='admin';d.story.flags.adminOccupied=true;
  d.story.flags.deviceModel='v3';d.story.flags.area='district';d.story.flags.districtBadge=true;d.story.flags.profileJobs='merchant';d.credits=10000;
  d.universe.discoveredLocations=[...new Set([...(d.universe.discoveredLocations||[]),...Object.keys(VoidUniverse.locations)])];VoidMissions.sync(d,C);return d;}
 async function playAsAdmin(){
  try{await VoidDevTools.request('developer/balance');}catch(e){announce('Developer access could not be confirmed: '+e.message+'. Sign in again with the developer account, then try once more.');return false;}
  if(!VoidDevTools.authorized)return false;
  try{document.activeElement?.blur?.();}catch{}active=true;stepNote('');banner.hidden=false;banner.querySelector('span').textContent='PLAYING AS ADMIN · TEST SESSION · NOTHING IS SAVED';
  state=adminBuild();walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');
  state.location='earth';await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,...VoidDistrictArea.resume(state,VoidNeoChinatown)});
  if(typeof hud==='function')hud();announce('You are Admin. Iris has the counter. Nothing in this session is saved.');return true;
 }
 /* A throwaway session built by another tool (Mission Editor > PLAY THIS DRAFT). Same rules as a test: re-checked with the server first, nothing saved to this browser
    or the cloud while it runs, and leaving reloads the page, which brings the real save back untouched. opts: {banner, leave, apply(), build()→state, enter(), message, clock()→text}.
    The street clock (ncz-street-pair.js) is reset to the real time at the start of every session; build() may simulate one (a draft test with Reverie or Lace); it ends with the session.
    clock(): the clocks shown in the banner, refreshed every second (the Mission Editor: street UTC time and the in-game day). */
 async function session(opts){
  try{await VoidDevTools.request('developer/balance');}catch(e){return {error:'Developer access could not be confirmed: '+e.message+'. Sign in again with the developer account, then try once more.'};}
  if(!VoidDevTools.authorized)return {error:'Developer access could not be confirmed. Sign in again with the developer account, then try once more.'};
  try{document.activeElement?.blur?.();}catch{}active=true;stepNote('');banner.hidden=false;banner.dataset.kind=opts.kind||'test';banner.querySelector('span').textContent=opts.banner||'TEST MODE · NOTHING IS SAVED';banner.querySelector('button').textContent=opts.leave||'EXIT TEST';
  const panel=document.getElementById('dev-balance');if(panel)panel.hidden=true;globalThis.VoidStreetPair?.simulate?.(null);
  const ck=banner.querySelector('[data-dev-clock]');clearInterval(clockT);ck.textContent='';ck.hidden=!opts.clock;if(opts.clock){const f=()=>{try{ck.textContent=opts.clock()||'';}catch{}};clockT=setInterval(f,1000);setTimeout(f,0);}
  try{opts.apply?.();state=opts.build();walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');await opts.enter();if(typeof hud==='function')hud();}
  catch(e){announce('The session could not start: '+(e?.message||e)+'. Nothing was saved. Press '+(opts.leave||'EXIT TEST')+' to go back, then try again (if it keeps failing, reload the page).');return {started:true,problem:String(e?.message||e)};}
  const msg=typeof opts.message==='function'?opts.message():opts.message;if(msg)announce(msg);return {started:true};
 }
 function action(name,panel){if(name==='test-start')return start(panel);if(name==='test-exit')return exit();if(name==='test-argument')return argument(panel);}
 // STAGE A STREET ARGUMENT HERE (npc-device.js): nothing is saved and nobody is hurt; it ends by itself after about 15 seconds.
 function argument(panel){const st=panel.querySelector('#dev-status');if(typeof mode==='undefined'||mode!=='walking'||!globalThis.VoidCrowdReact){if(st)st.textContent='Walk somewhere in NeoChinatown first.';return;}const r=VoidCrowdReact.stageArgument();if(r?.error){if(st)st.textContent=r.error;return;}panel.hidden=true;announce('Two people start arguing in front of you.');}
 /* DRAFT: STEP FAILED (21 Nov 2026, the owner: "while trying to play through a test mission the editor pops up"). A failed step in draft play behaves as in the real
    game (SPOTTED puts you back outside to try again; a lost follow fails the mission and its giver offers it again); the banner only adds a small note so the owner
    knows; the editor opens only on the banner's button. Every session start also blurs the focused button: Space / Enter in the game must never press it again. */
 function stepNote(text){const n=banner.querySelector('[data-dev-step-note]');clearTimeout(stepNote.t);if(!active||!text||banner.dataset.kind!=='draft'){n.hidden=true;n.textContent='';return false;}
  n.textContent=(globalThis.VoidEditorSession?.TEXT.stepFailed||'Draft: step failed')+' — '+String(text).slice(0,140)+' · RETRY it in the game, or press '+banner.querySelector('button').textContent;n.hidden=false;stepNote.t=setTimeout(()=>{n.hidden=true;},25000);return true;}
 // Stays "active" through the reload so nothing can write the throwaway state on the way out.
 function exit(){globalThis.VoidStreetPair?.simulate?.(null);location.reload();}

 // While testing, the browser save is never written and cloud save/load is off.
 const campaignSave=save;save=function(){if(active)return false;return campaignSave.apply(this,arguments);};
 document.addEventListener('click',e=>{const a=e.target.closest?.('button')?.dataset.action;if(active&&a&&/^cloud-(save|load)/.test(a)){e.preventDefault();e.stopImmediatePropagation();announce('Test mode: cloud saves are off. Exit the test first.');}},{capture:true});
 const banner=document.createElement('div');banner.id='dev-test-banner';banner.hidden=true;banner.innerHTML='<span>TEST MODE · NOTHING IS SAVED</span><small data-dev-clock hidden></small><small data-dev-step-note hidden></small><button type="button">EXIT TEST</button>';let clockT=0;document.body.append(banner);
 banner.querySelector('button').onclick=exit;
 globalThis.VoidDevTest={render,action,build,adminBuild,playAsAdmin,session,exit,stepNote,get active(){return active;}};
})();
