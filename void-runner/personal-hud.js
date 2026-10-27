/* Personal HUD: the pilot's own terminal (David's brief, 2026-10-27). Fully opaque, full screen.
   Four sections: Mission Log (the same missions and tracking as the L log), Comms, Inventory, and Taxi / Transport,
   which shows a service only where one operates (VoidTaxi registers itself; otherwise it explains why not).
   Opening it uses the same pattern as the Mission Log: the game switches to its own 'hud' mode (no movement,
   firing or interactions), the mouse is released, and the previous mode comes back on close.
   Keys: P (rebindable, "Personal HUD") opens and closes; Esc closes; 1-4 or ←/→ switch sections; ↑/↓ and Enter
   move and choose. Controller: View/Back opens and closes, D-pad moves, A chooses, B closes. */
(function(){
 const H=VoidHudData,tabs=[['missions','MISSION LOG'],['comms','COMMS'],['inventory','INVENTORY'],['taxi','TAXI / TRANSPORT']];
 let panel=null,returnMode=null,tab='missions';
 const openModes=['walking','play','dock'];
 const esc=s=>escapeText(String(s??''));
 const onFoot=()=>mode==='walking'||returnMode==='walking';
 function placeName(){return C.stations[state.location]?.name||state.location;}
 // ---- Sections ----
 function missionsHtml(){
  if(!state.universe.missionLogUnlocked)return '<p class="hud-note">The Mission Log opens when Mara gives you the pistol.</p>';
  const all=VoidMissions.sync(state,C),card=m=>'<article class="hud-card"><h3>'+esc(m.title)+' <small class="hud-tag '+(m.completed?'done':m.tracked?'tracked':'')+'">'+(m.completed?'COMPLETE':m.tracked?'TRACKED':'ACTIVE')+'</small></h3><p>'+esc(m.description)+'</p><p class="hud-meta">'+esc(m.type.toUpperCase())+(m.destination?' · '+esc(C.stations[m.destination]?.name||m.destination):'')+(m.rewards?' · '+esc(m.rewards)+' CR':'')+'</p><ul>'+m.objectives.map(o=>'<li class="'+(o.complete?'complete':'pending')+'">'+(o.complete?'✓ ':'○ ')+esc(o.label)+'</li>').join('')+'</ul>'+(m.completed?'':m.tracked?'<button type="button" data-hud-untrack="'+esc(m.id)+'" data-hud-key="m-'+esc(m.id)+'">UNTRACK</button>':'<button type="button" data-hud-track="'+esc(m.id)+'" data-hud-key="m-'+esc(m.id)+'">TRACK</button>')+'</article>';
  const active=all.filter(m=>!m.completed),done=all.filter(m=>m.completed);
  return '<p class="hud-note">Tracking here is the same as in the Mission Log ('+esc(VoidInput.label(VoidInput.bindings.missionLog||'KeyL'))+'). Guidance is separate, in the game menu.</p><h2>ACTIVE</h2>'+(active.map(card).join('')||'<p>No active missions.</p>')+'<h2>COMPLETED</h2>'+(done.map(card).join('')||'<p>None yet.</p>');
 }
 function commsHtml(){
  const l=H.link(state,{onFoot:onFoot(),route:returnMode==='play'?flight.route:null}),msgs=H.messages(state,{rook:typeof rookMissileLine!=='undefined'?rookMissileLine.text:null}),people=H.contacts(state);
  return '<section class="hud-link hud-link-'+esc(l.state)+'"><b>RELAY LINK · '+esc(l.label)+'</b><span>'+esc(l.note)+'</span></section>'+
   '<h2>MESSAGES</h2>'+(msgs.map(m=>'<article class="hud-card"><h3>'+esc(m.from)+' <small class="hud-tag">'+esc(m.via.toUpperCase())+'</small></h3><p>“'+esc(m.text)+'”</p></article>').join('')||'<p>No messages.</p>')+
   '<h2>CONTACTS</h2><p class="hud-note">People are met where they are. A contact listed here can’t be called unless the channel says so.</p>'+
   (people.map(c=>'<article class="hud-card hud-contact"><h3>'+esc(c.name)+'</h3><p>'+esc(c.place)+'</p><p class="hud-meta">'+esc(c.channel)+'</p></article>').join('')||'<p>No contacts yet.</p>');
 }
 function inventoryHtml(){
  const mission=C.missionFlight(state),inv=H.inventory(state,{ship:VoidShips.get(state).name,mission,cargoUsed:VoidFactions.cargoUsed(state,mission),launcher:state.creditGear.includes('launcher')}),p=inv.personal,s=inv.ship,row=(k,v)=>'<tr><th>'+esc(k)+'</th><td>'+v+'</td></tr>';
  return '<div class="hud-columns"><section><h2>ON YOU</h2><table class="hud-table">'+
   row('Credits',esc(p.credits.toLocaleString())+' CR')+row('Weapon',p.weapon?esc(p.weapon.name)+' · '+esc(p.weapon.ammo)+' in the magazine, '+esc(p.weapon.reserve)+' spare':'None')+
   row('Attachments',esc(p.attachments.join(' · ')||'None'))+row('Items',esc(p.items.join(' · ')||'None'))+'</table></section>'+
   '<section><h2>ABOARD THE '+esc(s.name.toUpperCase())+'</h2><p class="hud-note">Ship equipment is read-only here. Fit and swap modules at a hangar maintenance terminal.</p><table class="hud-table">'+
   row('Installed',esc(s.modules.installed.map(m=>m.slot+': '+m.name).join(' · ')||'Factory equipment'))+row('Owned, not fitted',esc(s.modules.owned.map(m=>m.name+' ('+m.slot+')').join(' · ')||'None'))+
   row('Missile launcher',s.launcher?'Owned · '+esc(s.missiles)+' missiles':'Not owned')+
   row('Cargo hold',esc(s.cargo.used)+' of '+esc(s.cargo.capacity)+' units')+
   row('Contract cargo',s.cargo.contract?esc(s.cargo.contract.name)+' · '+esc(s.cargo.contract.mission)+(s.cargo.contract.units?' · '+esc(s.cargo.contract.units)+' unit'+(s.cargo.contract.units>1?'s':''):''):'None')+
   row('Salvage',esc(s.cargo.salvage.map(c=>c.name+' ×'+c.units).join(' · ')||'None'))+row('Secure data',esc(s.cargo.data.join(' · ')||'None'))+'</table></section></div>';
 }
 function taxiHtml(){
  const T=globalThis.VoidTaxi;if(!T)return '<p class="hud-note">No transport service is available here.</p>';
  return T.hudHtml({onFoot:onFoot(),returnMode});
 }
 // Plain divs throughout: the page styles header, nav and main elements globally (game.css).
 const sections={missions:missionsHtml,comms:commsHtml,inventory:inventoryHtml,taxi:taxiHtml};
 function render(){if(!panel)return;const top=panel.querySelector('.hud-body')?.scrollTop||0,was=document.activeElement?.dataset?.hudKey,focused=was?.startsWith('tab-')?'tab-'+tab:was;
  const l=H.link(state,{onFoot:onFoot()});
  panel.innerHTML='<div class="hud-header"><div><b>VOID//TERMINAL</b><span>'+esc(placeName().toUpperCase())+'</span></div><div class="hud-status"><span>'+esc(state.credits.toLocaleString())+' CR</span><span class="hud-link-chip hud-link-'+esc(l.state)+'">LINK · '+esc(l.label)+'</span><button type="button" data-hud-close data-hud-key="close">CLOSE · '+esc(VoidInput.label(VoidInput.bindings.personalHud||'KeyP'))+'</button></div></div>'+
   '<div class="hud-tabs" role="tablist">'+tabs.map(([id,label],i)=>'<button type="button" role="tab" data-hud-tab="'+id+'" data-hud-key="tab-'+id+'" aria-selected="'+(tab===id)+'"><span>'+(i+1)+'</span>'+label+'</button>').join('')+'</div>'+
   '<div class="hud-body" tabindex="-1">'+sections[tab]()+'</div>';
  const body=panel.querySelector('.hud-body');body.scrollTop=top;
  (focused&&panel.querySelector('[data-hud-key="'+focused+'"]')||panel.querySelector('[data-hud-tab="'+tab+'"]'))?.focus();
 }
 function open(which){
  if(panel){if(which&&which!==tab){tab=which;render();}return;}
  if(globalThis.VoidVR?.active){announce('The Personal HUD is offline inside the simulation. Esc opens the VR menu.');return;}
  if(!openModes.includes(mode)||globalThis.VoidFlightSkirmish?.active||(typeof VoidGraphics!=='undefined'&&VoidGraphics.busy)||!state?.universe)return;
  if(which)tab=which;returnMode=mode;mode='hud';clearInput();walkingKeys?.clear?.();document.exitPointerLock?.();
  panel=document.createElement('section');panel.id='personal-hud';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Personal HUD');panel.setAttribute('aria-modal','true');
  document.body.append(panel);render();
 }
 function close(){if(!panel)return;panel.remove();panel=null;mode=returnMode;returnMode=null;clearInput();walkingKeys?.clear?.();canvas.focus();}
 function toggle(){panel?close():open();}
 function focusables(){return [...panel.querySelectorAll('button:not([disabled])')];}
 function move(step){const list=focusables(),i=list.indexOf(document.activeElement);(list[(i+step+list.length)%list.length]||list[0])?.focus();}
 function switchTab(step){const i=tabs.findIndex(([id])=>id===tab);tab=tabs[(i+step+tabs.length)%tabs.length][0];render();}
 document.addEventListener('click',e=>{if(!panel||!panel.contains(e.target))return;const b=e.target.closest('button');if(!b)return;e.stopPropagation();
  if(b.dataset.hudClose!=null)return close();
  if(b.dataset.hudTab){tab=b.dataset.hudTab;return render();}
  if(b.dataset.hudTrack){if(VoidMissions.track(state,b.dataset.hudTrack,C))save();return render();}
  if(b.dataset.hudUntrack){if(state.universe.trackedMission===b.dataset.hudUntrack){VoidMissions.untrack(state);save();}return render();}
  if(b.dataset.hudAction)globalThis.VoidTaxi?.action?.(b.dataset.hudAction,{close,render});
 },true);
 addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
  const key=VoidInput.bindings.personalHud||'KeyP';
  if(e.code===key){if(panel||openModes.includes(mode)){e.preventDefault();e.stopPropagation();if(!e.repeat)toggle();}return;}
  if(!panel)return;
  // While the HUD is open, nothing reaches the game behind it.
  e.stopPropagation();
  if(e.code==='Escape'){e.preventDefault();return close();}
  const n=['Digit1','Digit2','Digit3','Digit4'].indexOf(e.code);if(n>=0){e.preventDefault();tab=tabs[n][0];return render();}
  if(e.code==='ArrowRight'||e.code==='ArrowLeft'){e.preventDefault();return switchTab(e.code==='ArrowRight'?1:-1);}
  if(e.code==='ArrowDown'||e.code==='ArrowUp'){e.preventDefault();return move(e.code==='ArrowDown'?1:-1);}
 },true);
 // Controller: View/Back (button 8 by default) toggles; inside, the D-pad moves, A chooses, B closes, LB/RB switch sections.
 let prev=[];
 function pollPad(){let pad=null;try{pad=[...(navigator.getGamepads?.()||[])].find(p=>p&&p.connected!==false);}catch{}if(!pad){prev=[];return;}
  const down=pad.buttons.map(b=>!!b&&(b.pressed||b.value>.55)),hit=i=>down[i]&&!prev[i],hud=VoidInput.controller.bindings.personalHud??8;
  if(hit(hud)&&(panel||openModes.includes(mode)))toggle();
  else if(panel){if(hit(1))close();else if(hit(0))document.activeElement?.closest?.('#personal-hud button')?.click();else if(hit(13))move(1);else if(hit(12))move(-1);else if(hit(15)||hit(5))switchTab(1);else if(hit(14)||hit(4))switchTab(-1);}
  prev=down;}
 const hudUpdate=update;update=function(dt){pollPad();hudUpdate(dt);};
 // Keep an open section current (credits, tracking, a taxi on its way).
 setInterval(()=>{if(panel&&(tab==='taxi'||tab==='inventory'))render();},1000);
 globalThis.VoidHUD={open,close,toggle,get isOpen(){return !!panel;},get tab(){return tab;},render};
})();
