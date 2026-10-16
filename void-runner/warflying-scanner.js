/* WarFlying in play (David's doc 11, Stage B). With a WarFlying Module in the Utility slot, the ship
   listens twice a second while flying: it logs fixed emitters passed on the route and any moving
   ship it can hear (traffic, pirates, faction battle crews). New identifications score one point and
   show a short notice. It works with no connection to the Relay and never runs on foot, so nothing
   is collected inside The Darknet District. The log and leaderboard are in the Mission Log.
   Rules: warflying-scan.js (scanning, leaderboard), warflying.js (records, scoring), signals.js. */
(function(){
 const X=VoidWarFlyingScan,W=VoidWarFlying,S=VoidSignals,P=VoidProgression,U=VoidUniverse;
 let tick=0,seconds=0,lastRoute=null,lastProgress=0;
 const css=document.createElement('style');
 css.textContent='#warflying-hud{position:fixed;right:16px;bottom:252px;z-index:24;padding:4px 9px;background:#07111ccc;border:1px solid #3d6f62;color:#9fe3c9;font:11px/1.4 monospace;letter-spacing:.08em;pointer-events:none}'
  +'#mission-log .warflying table{width:100%;border-collapse:collapse;font:13px monospace}#mission-log .warflying td{padding:3px 6px;border-bottom:1px solid #ffffff14}#mission-log .warflying tr.you td{color:#ffe58b}'
  +'#mission-log .warflying ul{list-style:none;padding:0}#mission-log .warflying li{padding:2px 0}';
 document.head.append(css);
 const hudEl=document.createElement('div');hudEl.id='warflying-hud';hudEl.hidden=true;document.body.append(hudEl);
 const installed=()=>P.utility(state)==='warflying-module';
 // Name if it broadcasts one; otherwise what it is (pirates broadcast no name).
 const label=r=>r.n||(r.conf==='confirmed'?'Unnamed ':'Unidentified ')+S.categories[r.c].toLowerCase();
 const kind=r=>r.n?' · '+S.categories[r.c]:'';
 // Which system the ship is in: the origin's until halfway, then the destination's.
 function system(){const r=flight.route;return r?U.system(r.progress<.5?r.origin:r.destination):state.universe?.currentSystem||'erebus';}
 function place(){const r=flight.route;return r?system()+':'+r.origin+'>'+r.destination:state.location;}
 function placeText(p){
  const [sys,route]=String(p).split(':'),name=U.systems[sys]?.name||C.stations[sys]?.name||sys;
  if(!route)return name;const [a,b]=route.split('>');return name+' · '+(C.stations[a]?.name||a)+' → '+(C.stations[b]?.name||b);
 }
 function log(sourceId,confidence,strength){
  const result=W.observe(state.warflying,{sourceId,confidence,place:place(),strength},Date.now());
  if(!result.points)return;
  const r=result.record;announce('WARFLYING +1 · '+label(r)+kind(r)+' · '+W.points(state.warflying)+' PTS');
  VoidAudio.tone?.(1180,.08,'sine',.04);save();
 }
 // Moving contacts get a roster identity the first time they are heard, and keep it.
 function identify(contact,inUse){
  if(contact.signalId!==undefined)return contact.signalId;
  const battle=globalThis.VoidFactionBattleState?.();
  if(contact.battle&&battle){const index=Number(String(contact.id).split('-').pop());return contact.signalId=S.battleSource(battle.faction,index,contact.side)?.id||null;}
  const role=X.role(contact);if(!role)return contact.signalId=null;
  const free=S.roster(system(),role).filter(s=>!inUse.has(s.id));
  return contact.signalId=free.length?free[Math.floor(Math.random()*free.length)].id:null;
 }
 function scan(){
  const r=flight.route;
  if(r){
   // A resumed route only counts what is still ahead of it.
   if(r!==lastRoute){lastRoute=r;lastProgress=r.progress;}
   const now=r.phase==='arrived'?1:r.progress;
   if(now>lastProgress){for(const p of X.passed(r.origin,r.destination,lastProgress,now))log(p.source.id,'confirmed',1);lastProgress=now;}
  }
  const battle=globalThis.VoidFactionBattleState?.();
  const contacts=[...(typeof ambientTraffic!=='undefined'?ambientTraffic.contacts:[]),...enemies.filter(e=>VoidStory.hostile(e)),...(battle?battle.ships:[])].filter(c=>c&&!c.dead);
  const inUse=new Set(contacts.map(c=>c.signalId).filter(Boolean));
  for(const c of contacts){
   const distance=Math.hypot(c.x,c.y,c.z),signature=c.signature?.total??1.5,heard=X.classify(distance,signature);
   if(!heard)continue;const id=identify(c,inUse);if(!id)continue;inUse.add(id);
   log(id,heard,1-distance/X.hearingRange(signature));
  }
 }
 const scannerUpdate=update;
 update=function(dt){
  scannerUpdate(dt);
  // Play time paces the leaderboard rivals.
  if(state?.warflying&&!['menu','pause','recovery'].includes(mode)){seconds+=dt;if(seconds>=1){state.warflying.clock=Math.min(1e9,(state.warflying.clock||0)+Math.floor(seconds));seconds%=1;}}
  const flying=mode==='play'&&!globalThis.VoidFlightSkirmish?.active&&installed();
  hudEl.hidden=!flying;
  if(!flying){lastRoute=null;return;}
  hudEl.textContent='WARFLYING · LISTENING · '+W.points(state.warflying)+' PTS';
  tick-=dt;if(tick>0)return;tick=X.config.interval;scan();
 };

 // ---- The WarFlying log, inside the Mission Log ----
 function section(){
  const db=state.warflying,records=Object.values(db.records),points=W.points(db),fitted=installed();
  const board=X.leaderboard(db.clock,points,'YOU');
  const recent=Object.entries(db.records).filter(([,r])=>r.p===1).sort((a,b)=>b[1].f-a[1].f).slice(0,6);
  const latest=Object.entries(db.records).sort((a,b)=>b[1].l-a[1].l).slice(0,6);
  const owned=state.progression.equipment.owned.includes('warflying-module');
  return '<section class="warflying"><h2>WARFLYING</h2>'
   +'<p>Scanner: '+(fitted?'<strong>installed</strong> · listening whenever you fly':owned?'owned, not installed · fit it in the Utility slot at a hangar':'not owned · sold at station outfitters')+'</p>'
   +'<p>'+points+' points · '+W.discoveries(db)+' unique signals identified · '+(records.length-W.discoveries(db))+' partial contacts awaiting identification</p>'
   +'<h3>LEADERBOARD</h3><table>'+board.map(r=>'<tr'+(r.player?' class="you"':'')+'><td>'+r.rank+'</td><td>'+escapeText(r.name)+'</td><td>'+r.points+'</td></tr>').join('')+'</table>'
   +'<h3>RECENT DISCOVERIES</h3>'+(recent.length?'<ul>'+recent.map(([,r])=>'<li>+1 · '+escapeText(label(r)+kind(r))+' · '+escapeText(placeText(r.places[0]||''))+'</li>').join('')+'</ul>':'<p>None yet.</p>')
   +'<h3>LAST KNOWN OBSERVATIONS</h3>'+(latest.length?'<ul>'+latest.map(([,r])=>'<li>'+escapeText(label(r))+' · last seen '+escapeText(placeText(r.places[r.places.length-1]||''))+' · seen '+r.k+'×'+(r.conf==='partial'?' · identity not established':'')+'</li>').join('')+'</ul>':'<p>Nothing logged yet.</p>')
   +'</section>';
 }
 const warflyingLog=openMissionLog;
 openMissionLog=function(){
  const result=warflyingLog.apply(this,arguments);
  if(typeof missionPanel!=='undefined'&&missionPanel&&state?.warflying)missionPanel.querySelector('[data-close]')?.insertAdjacentHTML('beforebegin',section());
  return result;
 };
 globalThis.VoidWarFlyingScanner={scan,section,get installed(){return installed();}};
})();
