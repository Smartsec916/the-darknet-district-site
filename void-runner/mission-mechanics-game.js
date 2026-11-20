/* THE REUSABLE MISSION MECHANICS IN THE GAME (browser only; the rules are mission-mechanics.js, run by mission-content.js). Loaded after live-content.js,
   camera-feed.js and zone-integration.js. Everything here only SENDS the events that complete steps; it never decides a mission on its own.
   - MISSION CAST: the people a running mission places (mission.cast) are built where they stand (a crowd model, its clip), only for the player doing the mission, only
     while the player is in that scene (the street or the tunnels of NeoChinatown, the Corporate District) and within 90 m. The V1 camera identifies them (VoidPhotoSubjects).
     A 'marker' is an invisible point the camera identifies (a doorway to photograph).
   - OBSERVE / OVERHEAR / TAIL: distances to those people four times a second; overheard lines as subtitles ("OVERHEARD"); "THEY NOTICED YOU"; the tail walks its route.
   - SNEAK / UNSEEN: while such a step is in progress inside its location, the location's armed people (zone-integration.js) look for the player (zones.js sees: range,
     cone, a clear line; crouching halves the range). Seen for a moment: SPOTTED, the player is put back outside the street door (modules backToStreet); the step stays.
   - COLLECT: using the named thing (or straight after the step before) opens the document with COPY TO V1. REPORT: the mission's card in the V1 Mission Log.
   - FEED: OPEN REMOTE FEED on the card (and a banner when it comes online); the camera-feed.js view plays the mission's feed and reports its stages.
   - IN-GAME WAITS and FLIGHT STAGES: polled; the events go to mission-content.js.
   Nothing here is saved except what the mission engine saves (story.flags). */
(function(root){
 'use strict';
 if(typeof document==='undefined')return;
 const MM=root.VoidMissionMechanics;if(!MM)return;
 const MC=()=>root.VoidMissionContent,LC=()=>root.VoidLiveContent,PL=()=>root.VoidPlaces;
 const st_=()=>{try{return typeof state!=='undefined'?state:null;}catch{return null;}};
 const md=()=>{try{return typeof mode!=='undefined'?mode:null;}catch{return null;}};
 const wl=()=>{try{return typeof walkingLocation!=='undefined'?walkingLocation:null;}catch{return null;}};
 const me=()=>{try{return typeof walker!=='undefined'&&walker?walker:null;}catch{return null;}};
 const on=()=>{try{return !!(LC()&&LC().treesOn()&&st_());}catch{return false;}};
 const say=t=>{try{announce(t);}catch{}};
 const nowList=()=>{try{return on()?MC().mechanicsNow(st_(),LC().env):[];}catch{return [];}};
 function fire(e){try{const L=LC(),r=MC().treeEvent(st_(),L.env,e,root.VoidMissions,root.C||root.VoidCampaign);L.report(r);L.deliver(r);if(!root.VoidDevTest?.active)try{save();}catch{}
   if(r.lines&&r.lines.length&&md()==='walking')L.show(r.lines,r);return r;}catch(err){console.warn('[mission mechanics]',err);return null;}}
 // ---------------------------------------------------------------- the mission cast
 const cast=new Map();   // key '<mission>/<id>' -> {c, node, anim, pos, model}
 function placeOf(id){const P=PL();return P&&P.BY?P.BY.get(id)||null:null;}
 function sceneOf(c){const p=placeOf(c.place);if(p&&p.scene)return p.scene;return /^corp/.test(c.place)?'corporate':'neochinatown';}
 function spotOf(c,i){if(Number.isFinite(c.x)&&Number.isFinite(c.z))return {x:c.x,z:c.z};const p=placeOf(c.place),r=p&&p.rects&&p.rects[0];let x=0,z=0;
  if(p&&Array.isArray(p.target))[x,z]=p.target;else if(r){x=(r[0]+r[1])/2;z=(r[2]+r[3])/2;}else return null;const a=i*2.4;return {x:x+Math.sin(a)*1.1*(i?1:0),z:z+Math.cos(a)*1.1*(i?1:0)};}
 const yOf=c=>Number.isFinite(c.y)?c.y:/^under-/.test(c.place)?-3:0;
 function wantNow(){const s=st_();if(!on()||!s)return [];let list=[];try{list=MC().castNow(s,LC().env);}catch{}const L=wl(),p=me();if(!L||!p||md()!=='walking')return [];
  const byPlace={};return list.map(c=>{const i=byPlace[c.place]=(byPlace[c.place]??-1)+1;return {...c,key:c.mission+'/'+c.id,idx:i};}).filter(c=>{if(L.apt)return false;const sc=sceneOf(c);if(sc==='corporate'?L.id!=='corporate':(L.id!=='neochinatown'||L.area!=='street'))return false;
   const sp=spotOf(c,c.idx);return !!sp&&Math.hypot(sp.x-p.x,sp.z-p.z)<90;});}
 const asked=new Set();
 function build(c){const B=root.BABYLON,S=root.VoidBabylon?.scene,A=root.VoidAssets;if(!B||!S)return null;const sp=spotOf(c,c.idx),y=yOf(c);let node=null,anim=null;
  if(c.model==='marker'){node=new B.TransformNode('mission-cast-'+c.id,S);node.position.set(sp.x,y,sp.z);}
  else{if(!A||!A.instance)return null;if(!A.container?.('crowd:'+c.model)){if(!asked.has(c.model)){asked.add(c.model);Promise.resolve(A.load('crowd:'+c.model,{src:root.VoidMadeNPCs?.fileOf?.(c.model)||'assets/models/crowd/'+c.model+'.glb',background:true},S)).catch(()=>{});}return null;}
   const holder=new B.TransformNode('mission-cast-'+c.id,S),fig=A.instance('crowd:'+c.model,holder);if(!fig){holder.dispose();return null;}node=holder;fig.metadata={...fig.metadata,character:c.id,displayName:c.name||c.id,missionCast:true};for(const m of fig.getChildMeshes(false)){m.isPickable=false;if(m.material&&m.material.maxSimultaneousLights<8)m.material.maxSimultaneousLights=8;}   // the asset pipeline instances into a parent node (asset-pipeline.js instance)
   node.position.set(sp.x,y,sp.z);node.rotation.y=Number.isFinite(c.yaw)?c.yaw:0;try{anim=root.VoidCrowd?.animate?.(fig,c.model,c.clip||'idle')||null;}catch{}}
  try{root.VoidPhotoSubjects?.set(c.id,node,{name:c.name||c.id,role:'mission'});}catch{}
  return {c,node,anim,pos:{x:sp.x,z:sp.z,yaw:node.rotation?node.rotation.y:0},model:c.model,tail:null};}
 function drop(k){const x=cast.get(k);if(!x)return;cast.delete(k);try{root.VoidPhotoSubjects?.remove(x.c.id,x.node);}catch{}try{x.anim?.dispose?.();}catch{}try{x.node.dispose();}catch{}}
 let builtFor=null;
 function castTick(){const L=wl();if(L!==builtFor){for(const k of [...cast.keys()])drop(k);builtFor=L;}const want=wantNow(),keys=new Set(want.map(c=>c.key));
  for(const k of [...cast.keys()])if(!keys.has(k))drop(k);for(const c of want)if(!cast.has(c.key)){const x=build(c);if(x)cast.set(c.key,x);}}
 /* Where a person is now: a cast member of a running mission (the nearest key), else anyone the camera can identify in this scene. */
 function posOf(id,mission){for(const [k,x] of cast)if(x.c.id===id&&(!mission||k.startsWith(mission+'/')))return x.pos;const S=root.VoidPhotoSubjects?.get?.(id);if(S&&S.node&&!S.node.isDisposed?.()){const p=S.node.getAbsolutePosition?.()||S.node.position;return p?{x:p.x,z:p.z}:null;}return null;}
 const dist=(a,b)=>a&&b?Math.hypot(a.x-b.x,a.z-b.z):Infinity;
 // ---------------------------------------------------------------- overheard subtitles
 const css=document.createElement('style');css.textContent='#mx-sub{position:fixed;left:50%;bottom:21vh;transform:translateX(-50%);z-index:54;max-width:min(760px,86vw);padding:8px 14px;background:rgba(4,8,10,.72);border-left:3px solid #7fd8ff;font:14px/1.45 ui-monospace,Consolas,monospace;color:#e6f2f7;pointer-events:none}#mx-sub[hidden]{display:none}#mx-sub small{display:block;color:#7fd8ff;letter-spacing:.14em;font-size:11px}'
  +'#mx-meter{position:fixed;left:50%;top:16vh;transform:translateX(-50%);z-index:54;width:160px;height:6px;background:rgba(0,0,0,.5);border:1px solid #ff9a2e;pointer-events:none}#mx-meter[hidden]{display:none}#mx-meter i{display:block;height:100%;width:0;background:#ff9a2e}'
  +'.pd-card .mx-ev{margin:6px 0 2px;font-size:12px}.pd-card .mx-ev b{display:block;letter-spacing:.12em;font-size:11px;opacity:.8}.pd-card .mx-ev button{margin:2px 6px 2px 0}.pd-card .mx-act{margin:6px 6px 0 0}';document.head.append(css);
 const sub=document.createElement('div');sub.id='mx-sub';sub.hidden=true;sub.setAttribute('role','status');sub.setAttribute('aria-live','polite');document.body.append(sub);
 const meter=document.createElement('div');meter.id='mx-meter';meter.hidden=true;meter.innerHTML='<i></i>';meter.setAttribute('aria-label','Being noticed');document.body.append(meter);
 const giverName=id=>{try{return LC().giverName(id)||id;}catch{return id;}};
 function showSub(who,text){sub.hidden=false;sub.innerHTML='<small>OVERHEARD</small>';const b=document.createElement('span');b.textContent=giverName(who)+': '+text;sub.append(b);}
 // ---------------------------------------------------------------- the running steps
 const run={};let lastT=performance.now();
 function seenCheck(x,dt){const L=wl(),p=me(),Z=root.VoidZones,R=root.VoidZoneRun;if(!L||!L.apt||L.apt.mission!==x.mission||!p||!Z||!R)return false;
  const ex=R.enemies||[],cfg=Z.tune?Z.tune(root.VOID_BALANCE):null,crouch=(()=>{try{return !!(groundState&&groundState.crouch);}catch{return false;}})(),P={x:p.x,z:p.z,crouch};
  const clear=e=>{try{const n=Math.ceil(Math.hypot(P.x-e.x,P.z-e.z)/.4);for(let i=1;i<n;i++){const t=i/n;if(root.VoidExplorer?.blocked?.(e.x+(P.x-e.x)*t,e.z+(P.z-e.z)*t,L))return false;}return true;}catch{return true;}};
  const seen=ex.some(e=>{try{return Z.sees(e,P,cfg,clear);}catch{return false;}});const r=run[x.key+'|seen']=run[x.key+'|seen']||{t:0};r.t=seen?r.t+dt:Math.max(0,r.t-dt*.5);
  meter.hidden=r.t<=0;meter.firstChild.style.width=Math.min(100,r.t/1.2*100)+'%';
  if(r.t>=1.2){r.t=0;meter.hidden=true;say('SPOTTED · Security saw you. You slip back out to the street: try again.');try{root.VoidModules?.backToStreet?.();}catch{}return true;}return false;}
 function tick(){const t=performance.now(),dt=Math.min(.5,(t-lastT)/1000);lastT=t;try{castTick();}catch(e){console.warn('[mission cast]',e);}
  if(!on()){sub.hidden=true;meter.hidden=true;return;}const blocked=(()=>{try{return LC().nearBlocked();}catch{return true;}})(),p=me(),list=nowList();let subShown=false,meterUsed=false;
  for(const x of list){if(x.delayed)continue;const o=x.o,k=x.kind;
   if(k==='wait-game'){if(x.wait&&x.wait.due){fire({type:'game-wait',step:x.key});return;}continue;}
   if(blocked)continue;
   if(x.unseen&&md()==='walking'){meterUsed=true;if(seenCheck(x,dt))return;}
   if(k==='observe'||k==='overhear'||k==='tail'){const d=dist(p,k==='tail'?(cast.get(x.mission+'/'+o.npc)||{}).pos:posOf(o.npc,x.mission));
    if(k==='observe'){const r=MM.observeStep(run[x.key],{d,dt,near:MM.near(o),close:MM.close(o),hold:MM.hold(o)});run[x.key]=r.st;if(r.noticed&&!run[x.key+'|n']){run[x.key+'|n']=1;say('Too close: they notice you. Back off a little.');}if(!r.noticed)delete run[x.key+'|n'];if(r.done){delete run[x.key];fire({type:'observe',step:x.key});return;}}
    else if(k==='overhear'){const lines=(o.say||[]).filter(l=>l&&l.text);const r=MM.overhearStep(run[x.key],{d,dt,near:MM.near(o),close:MM.close(o),lines:lines.length,secs:i=>MM.lineSecs(lines[i]&&lines[i].text)});run[x.key]=r.st;
     if(r.noticed)say('THEY NOTICED YOU · They stop talking. Back off and wait for them to start again.');if(r.show>=0&&lines[r.show]){showSub(lines[r.show].who,lines[r.show].text);subShown=true;}
     if(r.done){delete run[x.key];sub.hidden=true;fire({type:'overhear',step:x.key});return;}}
    else{const cx=cast.get(x.mission+'/'+o.npc);if(cx&&Array.isArray(cx.c.route)){const r=MM.tailStep(cx.tail,{d,dt,near:MM.near(o),close:MM.close(o),route:cx.c.route,speed:cx.c.speed||MM.DEF.tail.speed});cx.tail=r.st;
      if(r.pos){cx.pos={x:r.pos.x,z:r.pos.z};cx.node.position.x=r.pos.x;cx.node.position.z=r.pos.z;if(Number.isFinite(r.pos.yaw))cx.node.rotation.y=r.pos.yaw;}
      if(r.reset)say(r.why==='noticed'?'He noticed you. Hang back further: he heads back to where he started.':'You lost him. He is back where you first saw him: follow again.');
      if(r.done){fire({type:'tail',step:x.key});return;}}}}
   if(k==='collect'&&!o.object&&!run[x.key+'|doc']){run[x.key+'|doc']=1;openDoc(x);}
   if(k==='feed'&&!run[x.key+'|note']){run[x.key+'|note']=1;try{root.VoidV1?.notify?.({app:'missions',key:'feed:'+x.key,from:'V1',text:((x.m.start&&x.m.start.header)||String(o.feed||'').toUpperCase())+' · open the feed from your Mission Log (L)',hint:{text:'open',help:true}});}catch{}}}
  if(!subShown)sub.hidden=true;if(!meterUsed)meter.hidden=true;}
 setInterval(tick,250);
 // ---------------------------------------------------------------- the document window (COPY TO V1) and reading evidence
 function lines(d){return [{who:'V1',text:d.title}].concat(String(d.text||'').split('\n').filter(t=>t.trim()).map(t=>({who:'V1',text:t})));}
 function openDoc(x){const d=MM.evidenceDefs(LC().env.trees)[x.o.evidence];if(!d||typeof root.talkChoice!=='function')return false;
  return root.talkChoice(lines(d),[{label:'COPY TO V1',run:()=>{fire({type:'collect',step:x.key});try{resumeWalking();}catch{}}},{label:'CLOSE',run:()=>{try{resumeWalking();}catch{}}}],'',{});}
 function read(id){const d=MM.evidenceDefs(LC().env.trees)[id];if(!d||typeof root.talkChoice!=='function')return;try{root.VoidPersonalDevice?.close?.();}catch{}root.talkChoice(lines(d),[{label:'CLOSE',run:()=>{try{resumeWalking();}catch{}}}],'',{});}
 // a use of something: the evidence the step in progress copies there (the window opens a moment after the use itself is reported)
 {const wrapUse=()=>{const L=LC();if(!L||L.__mx)return !!L;const orig=L.aptUse;L.aptUse=function(arg){const r=orig.apply(this,arguments);setTimeout(()=>{try{const x=nowList().find(y=>y.kind==='collect'&&y.mission===arg.mission&&(!y.o.apt||y.o.apt===arg.apt)&&(!y.o.object||y.o.object===arg.object)&&(!y.o.mod||!arg.mod||y.o.mod===arg.mod));if(x)openDoc(x);}catch{}},700);return r;};L.__mx=true;return true;};
  const w=setInterval(()=>{if(wrapUse())clearInterval(w);},400);}
 // ---------------------------------------------------------------- the V1 Mission Log card: evidence, REPORT, OPEN REMOTE FEED
 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function inPlace(place){try{const P=PL(),w=wl(),p=me();if(!P||!w||!p)return false;return (P.at({scene:w.id,x:p.x,y:p.y,z:p.z})||[]).includes(place);}catch{return false;}}
 function reportBlock(x){const o=x.o,s=st_(),miss=(o.evidence||[]).filter(id=>!MM.hasEvidence(s,id)),defs=MM.evidenceDefs(LC().env.trees),who=giverName(o.npc).toUpperCase(),hand=!!o.place;
  if(miss.length)return '<p class="pd-note">Needed first: '+miss.map(id=>esc((defs[id]||{}).title||id)).join(', ')+'.</p>';
  if(hand&&!inPlace(o.place))return '<p class="pd-note">Hand it over in person: '+esc(((placeOf(o.place)||{}).name)||o.place)+'.</p>';
  return '<button type="button" class="mx-act" data-mx-report="'+esc(x.key)+'">'+(hand?'HAND OVER TO ':'REPORT TO ')+esc(who)+'</button>';}
 root.VoidMissionExtras=(id,done)=>{if(!on())return '';const s=st_(),env=LC().env,m=(env.trees||[]).flatMap(t=>t.missions||[]).find(y=>y.id===id);if(!m)return '';let h='';
  const held=(m.evidence||[]).filter(e=>MM.hasEvidence(s,e.id));if(held.length)h+='<div class="mx-ev"><b>EVIDENCE</b>'+held.map(e=>'<button type="button" data-mx-read="'+esc(e.id)+'">'+esc(e.title)+'</button>').join('')+'</div>';
  if(done)return h;const x=nowList().find(y=>y.mission===id);if(!x||x.delayed)return h;
  if(x.kind==='report')h+=reportBlock(x);
  if(x.kind==='feed')h+='<button type="button" class="mx-act" data-mx-feed="'+esc(x.key)+'">OPEN REMOTE FEED · '+esc(String(x.o.feed).toUpperCase())+'</button>';
  if(x.kind==='wait-game'&&x.wait)h+='<p class="pd-note">About '+Math.max(1,Math.ceil(x.wait.left/12))+' min of play to go. Explore or take other work meanwhile.</p>';
  return h;};
 document.addEventListener('click',e=>{const b=e.target&&e.target.closest?e.target.closest('[data-mx-report],[data-mx-feed],[data-mx-read]'):null;if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.mxRead){read(b.dataset.mxRead);return;}const key=b.dataset.mxReport||b.dataset.mxFeed,x=nowList().find(y=>y.key===key);if(!x)return;
  try{root.VoidPersonalDevice?.close?.();}catch{}
  if(b.dataset.mxReport){if((x.o.evidence||[]).some(id=>!MM.hasEvidence(st_(),id))||(x.o.place&&!inPlace(x.o.place)))return;setTimeout(()=>fire({type:'report',step:x.key}),250);return;}
  openFeed(x);},true);
 // ---------------------------------------------------------------- the remote camera feed
 function openFeed(x){const F=root.VoidCameraFeed,f=((x.m.feeds)||[]).find(y=>y.id===x.o.feed);if(!F||!f){say('REMOTE FEED: no signal.');return;}if(F.active)return;
  const ev=Object.values(MM.evidenceDefs(LC().env.trees)).find(d=>d.mission===x.mission&&d.kind==='recording'),saved=ev?String(ev.title).replace(/^RECORDING\s*[—-]\s*/,'RECORDING SAVED — '):'';
  setTimeout(()=>{F.start({scene:f.scene,room:f.room,label:x.m.title||'',cam:String(f.id),savedText:saved||undefined,onStage:stage=>fire({type:'feed-stage',mission:x.mission,feed:f.id,stage}),onSaved:()=>fire({type:'feed-stage',mission:x.mission,feed:f.id,stage:'saved'})})
   .then(r=>{if(!r.saved&&r.why)say('REMOTE FEED: '+String(r.why).toLowerCase()+'. Open the feed again from your Mission Log.');});},300);}
 // ---------------------------------------------------------------- flight stages (the existing flight: board, take off, jump, dock)
 setInterval(()=>{try{const s=st_();if(!on()||!s)return;const fl=nowList().filter(x=>x.kind==='flight'&&!x.delayed);if(!fl.length)return;const o=fl[0].o,f=s.story.flags,m=md(),r=(()=>{try{return flight.route;}catch{return null;}})();
  if(o.stage==='board'&&m==='play'&&s.location==='earth'&&f.shipAccess!=='none')fire({type:'flight',stage:'board'});
  else if(o.stage==='launch'&&r&&['align','warp','encounter','arrived'].includes(r.phase))fire({type:'flight',stage:'launch'});
  else if(o.stage==='jump'&&r&&r.destination&&(r.phase==='warp'||r.phase==='arrived'))fire({type:'flight',stage:'jump',place:r.destination});
  else if(o.stage==='dock'&&['walking','dock','arrival'].includes(m)&&s.location!=='earth')fire({type:'flight',stage:'dock',place:s.location});}catch{}},500);
 root.VoidMissionMechanicsGame={cast:()=>[...cast.entries()].map(([k,x])=>({key:k,id:x.c.id,pos:{...x.pos},model:x.model})),fire,openDoc,read,openFeed,now:nowList,run};
})(globalThis);
