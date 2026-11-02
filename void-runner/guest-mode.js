/* Guest Mode: a shared link (?visit=… or ?scenario=…, see share-registry.js) opens the game straight at that place,
   with no sign-in, no intro and no tutorial. It reuses Developer Tools' throwaway campaign (VoidDevTest.build) and
   the game's own arrival (dock / enterWalking / leaveWalking / VoidVR.launch); nothing here loads scenes itself.
   - Isolation: while a guest session runs nothing is written. The browser save, cloud save/load, account pages,
     purchases and Developer Tools are off, so the visitor's own campaign and sign-in stay exactly as they were.
   - Guest progress is session-only: a refresh restarts the shared experience, and leaving (EXIT TO MAIN MENU)
     reloads the page without the link, which brings the visitor's real save back untouched.
   Loaded right after game.js so every later save wrapper (skirmish, VR, test mode) sits on top of this guard. */
(function(){
 const link=VoidShare.parse(location.search);
 const guest={active:link.present===true,link,entry:link.ok?link.entry:null,phase:'idle',error:null,generation:0,arrivals:0};
 const api={get active(){return guest.active;},get entry(){return guest.entry;},get phase(){return guest.phase;},get error(){return guest.error;},get arrivals(){return guest.arrivals;},link};
 globalThis.VoidGuest=api;
 if(!guest.active)return;
 const LOAD_LIMIT=150000,SLOW_AFTER=20000;
 // The visitor's own campaign stays on disk; this tab never writes it.
 const realSave=save;save=function(){if(guest.active)return false;return realSave.apply(this,arguments);};
 state=C.fresh();
 document.body.classList.add('guest-mode');
 const esc=s=>escapeText(String(s??''));
 // ---- Loading screen ----
 const screenEl=document.createElement('section');screenEl.id='guest-loading';screenEl.setAttribute('role','dialog');screenEl.setAttribute('aria-live','polite');screenEl.setAttribute('aria-label','Guest experience loading');document.body.append(screenEl);
 let ticker=null,startedAt=0;
 function showLoading(e,status='Preparing environment…'){
  startedAt=performance.now();screenEl.hidden=false;
  screenEl.innerHTML='<div class="guest-frame"><p class="guest-kicker">VOID<span>//</span>RUNNER · GUEST EXPERIENCE</p><h1>Destination: <b>'+esc(e.name)+'</b></h1><p class="guest-desc">'+esc(e.description)+'</p>'+
   '<div class="guest-bar" aria-hidden="true"><i></i></div><p id="guest-status" role="status">'+esc(status)+'</p><p id="guest-slow" class="guest-fine" hidden>Still loading. Large scenes can take a minute on a slow connection.</p>'+
   '<p class="guest-fine">Guest Mode · no sign-in · nothing you do here is saved, and your own saves are untouched.</p></div>';
  clearInterval(ticker);ticker=setInterval(()=>{const s=document.getElementById('guest-status'),p=document.getElementById('preparation-status')?.textContent,n=globalThis.VoidAssets?.pending;
   if(s&&guest.phase==='loading'&&p)s.textContent=p+(n?' · '+n+' assets remaining':'');const slow=document.getElementById('guest-slow');if(slow)slow.hidden=performance.now()-startedAt<SLOW_AFTER;},400);}
 function status(text){const s=document.getElementById('guest-status');if(s)s.textContent=text;}
 function hideLoading(){clearInterval(ticker);ticker=null;screenEl.hidden=true;screenEl.innerHTML='';}
 // ---- Top chip: always says this is a guest session ----
 const chip=document.createElement('div');chip.id='guest-chip';chip.hidden=true;document.body.append(chip);
 function showChip(){chip.innerHTML='<span title="'+esc(guest.entry?.name||'')+'">GUEST MODE · NOTHING SAVED</span><button type="button" data-guest="menu">GUEST MENU</button>';chip.hidden=false;}
 // ---- The session: Developer Tools' throwaway campaign, then the destination's own setup ----
 function build(e){
  const s=VoidDevTest.build({location:e.destination.location,stage:'open',kit:false});
  Object.assign(s.story.flags,e.flags||{});s.story.flags.tutorialSkipped=true;
  // Training hints (first station, combat drill) would talk over the shared objective; mark them done for this session only.
  if(s.progression?.flags){for(const id of [...VoidMissions.stationIds,...VoidMissions.combatIds])s.progression.flags[id]=true;VoidMissions.sync(s,C);}
  // The shared objective is the guide here, not the campaign's tracked mission.
  VoidMissions.untrack(s);
  const sys=VoidUniverse.locations[e.destination.location]?.system;if(sys&&s.universe)s.universe.currentSystem=sys;
  return s;}
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function until(test,ms,what){const t=performance.now();while(!test()){if(performance.now()-t>ms)throw Object.assign(new Error(what),{kind:'timeout'});await wait(100);}}
 function within(promise,ms,what){let timer;return Promise.race([promise,new Promise((_,no)=>{timer=setTimeout(()=>no(Object.assign(new Error(what),{kind:'timeout'})),ms);})]).finally(()=>clearTimeout(timer));}
 // A spawn in the District's own plan, turned into the city's coordinates; refused if it lands inside a wall.
 function place(e){const s=e.spawn;if(!s||!walker||walkingLocation?.id!=='neochinatown')return;const N=globalThis.VoidNeoChinatown;if(!N?.toWorld)return;
  const [x,z]=N.toWorld(s.x,s.z);if(globalThis.VoidExplorer?.blocked?.(x,z,walkingLocation)){console.warn('[VOID guest] spawn blocked; using the default spawn');return;}
  walker.x=x;walker.z=z;walker.y=walkingLocation.spawn?.[1]??1.7;walker.pitch=0;if(s.face){const [fx,fz]=N.toWorld(s.face[0],s.face[1]);walker.yaw=Math.atan2(fx-x,fz-z);}}
 async function arrive(e){
  const gen=++guest.generation;guest.phase='loading';guest.error=null;guest.entry=e;chip.hidden=true;showLoading(e);
  try{
   if(globalThis.VoidVR?.active){status('Leaving the simulation…');await VoidVR.exit();}
   document.getElementById('vr-menu')?.remove();
   status('Starting the game engine…');
   const ok=await VoidStartup.ready;if(gen!==guest.generation)return;
   if(!ok&&!VoidStartup.started)throw Object.assign(new Error(VoidStartup.error?.message||'The game could not start on this device.'),{kind:'init'});
   status('Preparing environment…');
   globalThis.VoidFlightSession?.end?.();
   state=build(e);walkingLocation=walker=null;current=null;VoidMenu.returnTo=null;leaveMenu();mode='menu';
   await within(dock(),LOAD_LIMIT,'The destination took too long to load.');if(gen!==guest.generation)return;
   if(mode!=='walking'||!walker)throw Object.assign(new Error('The destination did not finish loading.'),{kind:'interrupted'});
   place(e);
   const d=e.destination;
   if(d.kind==='flight'){status('Boarding the Kestrel…');await leaveWalking();await until(()=>mode==='play'||gen!==guest.generation,LOAD_LIMIT,'The flight took too long to start.');}
   else if(d.kind==='vr'){
    if(walkingLocation?.id!=='neochinatown')throw new Error('The VR arcade is not available.');
    const N=globalThis.VoidNeoChinatown,[x,z]=N.toWorld(-5,36),[bx,bz]=N.toWorld(-12.6,36);Object.assign(walker,{x,z,yaw:Math.atan2(bx-x,bz-z),pitch:0});
    status('Connecting to the VR arcade…');
    if(d.picker){VoidVR.openMenu();const pick=document.querySelector('#vr-menu [data-vr="pick:'+d.experience+'"]');if(!pick)throw new Error('That simulation is not offered right now.');pick.click();}
    else if(!await VoidVR.launch(d.experience,{}))throw new Error('That simulation could not start.');
   }
   if(gen!==guest.generation)return;
   status('Arriving…');try{await until(()=>!(globalThis.VoidAssets?.pending>0),20000,'');}catch{}
   if(gen!==guest.generation)return;
   guest.phase='ready';guest.arrivals++;hideLoading();showChip();announce('Guest Mode · '+e.name+' · '+e.objective);
  }catch(error){if(gen!==guest.generation)return;console.error('[VOID guest]',error);
   if(error.kind==='timeout'){globalThis.VoidPreparation?.cancel?.();if(typeof preparationGeneration!=='undefined')preparationGeneration++;if(globalThis.VoidGraphics)VoidGraphics.busy=false;}
   fallback(error.kind==='init'?'The game could not start on this device: '+error.message:error.kind==='timeout'?error.message+' Check your connection and try again.':error.kind==='interrupted'?'Loading was interrupted. You can start the experience again.':error.message||'Something went wrong while loading.',error.kind||'failed');}
 }
 // ---- Fallback and the Guest Menu (it replaces the main menu while a guest session runs) ----
 function fallback(message,kind){guest.phase='failed';guest.error={message,kind};hideLoading();chip.hidden=!guest.entry;
  if(document.getElementById('vr-menu')&&!globalThis.VoidVR?.active)document.getElementById('vr-menu').remove();
  walkingLocation=walker=null;VoidMenu.returnTo=null;guestMenu();}
 function card(e){return '<article class="guest-card"><p class="guest-kicker">'+(e.type==='scenario'?'SHARED SCENARIO':'SHARED LOCATION')+' · '+esc(e.system)+'</p><h2>'+esc(e.name)+'</h2><p>'+esc(e.description)+'</p><p class="guest-objective"><b>OBJECTIVE</b> '+esc(e.objective)+'</p></article>';}
 function guestMenu(){
  const e=guest.entry,err=guest.error;
  menuShell('guest','<section class="main-menu guest-menu"><p class="menu-kicker">VOID//RUNNER · GUEST EXPERIENCE</p><h1 class="game-logo" tabindex="-1">VOID<span>//</span>RUNNER</h1><p class="menu-subtitle">GUEST MODE · NOTHING IS SAVED</p>'+
   (err?'<p class="guest-error" role="alert"><b>'+(guest.link.ok?'COULDN’T LOAD':'LINK NOT AVAILABLE')+'</b> '+esc(err.message)+'</p>':'')+(e?card(e):'')+
   '<p class="guest-fine">Your own campaign, cloud save and sign-in are untouched. Exit to the main menu to play your own game.</p>'+
   '<nav class="menu-options" aria-label="Guest menu">'+(VoidMenu.returnTo&&!err?button('RESUME','menu-resume'):'')+(e?button(err?'TRY AGAIN':'RESTART SHARED EXPERIENCE','guest-restart'):'')+
   button('OTHER SHARED DESTINATIONS','guest-browse',!!e)+button('SETTINGS','menu-settings',true)+button('EXIT TO MAIN MENU','guest-exit',true)+'</nav></section>');}
 function browse(){
  const group=(type,title)=>'<h2 class="guest-group">'+title+'</h2><div class="guest-grid">'+VoidShare.list(type).map(x=>'<article class="guest-card"><h3>'+esc(x.name)+'</h3><p>'+esc(x.description)+'</p>'+button('GO →','guest-go:'+x.id)+'</article>').join('')+'</div>';
  menuShell('guest-browse','<section class="main-menu guest-menu guest-browse"><p class="menu-kicker">VOID//RUNNER · GUEST EXPERIENCE</p><h1 tabindex="-1">Shared destinations</h1>'+group('location','Locations')+group('scenario','Scenarios')+'<nav class="menu-options">'+button('← BACK','guest-menu',true)+'</nav></section>');}
 function go(id){const e=VoidShare.get(id);if(!e)return;guest.link={present:true,ok:true,entry:e,version:VoidShare.VERSION};
  try{history.replaceState(null,'',VoidShare.link(id,location.origin+location.pathname));}catch{}arrive(e);}
 function exit(){guest.active=false;hideLoading();location.replace(location.pathname);}
 // Guest actions, and everything a guest may not reach: the real campaign, cloud saves, account, purchases, dev tools.
 const BLOCKED=/^(menu-continue|menu-load|menu-new|menu-account|menu-logout|menu-devtools|menu-skirmish|cloud-|checkout|account|email-link|google|claim-handle)/;
 document.addEventListener('click',ev=>{
  const g=ev.target.closest?.('[data-guest]')?.dataset.guest;if(g==='menu'){ev.preventDefault();ev.stopImmediatePropagation();if(guest.phase==='ready')openGameMenu();else guestMenu();return;}
  const a=ev.target.closest?.('[data-action]')?.dataset.action;if(!a)return;
  if(a.startsWith('guest-')){ev.preventDefault();ev.stopImmediatePropagation();
   if(a==='guest-restart')return guest.entry&&arrive(guest.entry);if(a==='guest-exit')return exit();if(a==='guest-browse')return browse();if(a==='guest-menu')return guestMenu();if(a.startsWith('guest-go:'))return go(a.slice(9));return;}
  if(BLOCKED.test(a)){ev.preventDefault();ev.stopImmediatePropagation();announce('Guest Mode: saves, account and purchases are off. Exit to the main menu first.');}
 },{capture:true});
 // Once every script has run: the Guest Menu stands in for the main menu, Developer Tools stay closed, then start.
 document.addEventListener('DOMContentLoaded',()=>{
  const mainMenu=renderMainMenu;renderMainMenu=function(){if(guest.active)return VoidMenu.page==='guest-browse'?browse():guestMenu();return mainMenu.apply(this,arguments);};
  const devOpen=VoidDevTools.open;VoidDevTools.open=function(){if(guest.active)return;return devOpen.apply(this,arguments);};
  if(guest.entry)arrive(guest.entry);
  else{Promise.resolve(VoidStartup.ready).finally(()=>fallback(guest.link.message||'This link isn’t valid.','invalid'));}
 });
 Object.assign(api,{arrive,restart:()=>guest.entry&&arrive(guest.entry),menu:guestMenu,browse,exit,go});
})();
