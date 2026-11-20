/* MISSION GUIDE ON FOOT (browser only): what the yellow guidance needs for place steps and photo steps (Mission 002 — Eyes on the Street, 17 Nov 2026).
   - missionPlaceRoute(g): the goal of a step that names a place (places.js) or a person to photograph (world-integration.js asks). The route to it (out through the
     District's security vestibule, into NULL, through a gate lane) and how the arrow moves are guide-route.js's.
   - The yellow marker over the person to photograph (one marker over the middle of Juno Vex and Halden Reyes), drawn only while that photo step is in progress AND the mission is tracked. Not before, not after.
   - Contextual hints for the photo and the send-a-photo steps: open the V1 (the player's own key), open Camera, take the photo, open Messages, open the conversation,
     ATTACH, SEND. Small, yellow-orange, at the top of the screen under the tracked-mission line (clear of the V1 banner at the bottom right, the KeyMap box and the [E] prompt); each goes once it is done (it follows what the player is actually doing). Every hint is tagged
     data-help="1" for the owner's future Help switch, and hidden when story.flags.helpOff is true. */
(function(root){
 'use strict';
 const LC=()=>root.VoidLiveContent,P=()=>root.VoidPlaces;
 function subjectPoint(id){try{const x=root.VoidPhotoSubjects?.get?.(id);if(x&&x.node&&!x.node.isDisposed?.()){const p=x.node.getAbsolutePosition();return [p.x,1.7,p.z];}}catch{}
  if(id==='juno-vex'&&root.VoidNightclub?.JUNO){const j=root.VoidNightclub.JUNO;return [j.x,1.7,j.z];}return null;}
 // A person inside Milked (Mission 003: Eva at reception, Fish in her office) while the player is out on the street or in the other part of the building: the goal is their
 // interaction point (milked.js, world metres); the route through the front doors, the vestibule, the door beside the desk and the STAFF ONLY door is guide-route.js's.
 function milkedPerson(g){try{if(!g||!g.interaction||typeof walkingLocation==='undefined'||!walkingLocation||walkingLocation.id!=='neochinatown')return null;
  const it=(root.VoidMilked?.INTERACTIONS||[]).find(i=>i.id===g.interaction);return it?{position:it.position.slice(),route:true,label:it.label||g.label||''}:null;}catch{return null;}}
 // An apartment / location step (Go into, Use something in, Hack the access point; apartments.js, modules.js), QA 19 Nov 2026: these steps had no arrow at all.
 // On the street: the street door (or the street door's access point). In the hallway: the apartment's door (or its access point), or the exit when it is another
 // building's hallway. In the apartment or location: the thing to use or the access point; in another part of a location: the elevator button for its floor or the
 // door that leads there; in the wrong one: the way out. The route between rooms of a location is guide-route.js's (modular).
 function aptGoal(g){try{const x=g&&g.apt;if(!x||typeof walkingLocation==='undefined'||!walkingLocation||walkingLocation.id!=='neochinatown')return null;
  const A=root.VoidApartments,M=root.VoidModules,wl=walkingLocation;if(!A)return null;
  const ap=x.ap?A.apOf(x.ap):null,aid=x.a||(ap&&ap.apt)||null,mis=((LC()?.env?.trees)||[]).flatMap(t=>t.missions||[]).find(m=>m.id===x.m),rec=mis&&(mis.apartments||[]).find(a=>a&&a.id===aid);
  const here=f=>{const i=(wl.interactions||[]).find(f);return i?{position:i.position.slice(),route:true,label:g.label||i.label||''}:null;};
  const front=id=>{const d=A.door(id);return d&&d.front?{position:[d.front[0],1.7,d.front[1]],route:true,label:g.label||''}:null;};
  const door=ap&&ap.door?ap.door:rec&&rec.door;
  // on a fire escape's landing beside this apartment's window (ncz-backalleys.js; night QA 20 Nov 2026: the arrow pointed round the block to the street door): the window
  if(!wl.apartment&&door&&!(ap&&ap.door)){const fe=root.VoidBackAlleys?.live?.();if(fe&&fe.phase==='perch'&&fe.door===door){const w=here(i=>i.action==='fe-window'&&i.door===door);if(w)return w;}}
  if(!wl.apartment){if(!door)return null;return ap&&ap.door?here(i=>i.id==='aptap-'+door)||front(door):here(i=>i.id==='aptdoor-'+door)||front(door);}
  const mine=!!(wl.apt&&wl.apt.mission===x.m&&wl.apt.id===aid);
  // the way out of a location: its exit, a door that leads elsewhere, or (on a floor with neither: underground, upstairs; night QA 20 Nov 2026, there was no arrow at all)
  // the stairs / elevator to the floor its street door is on
  if(wl.modular){const up=()=>{let f=0;try{const cm=((LC()?.env?.trees)||[]).flatMap(t=>t.missions||[]).find(m=>m.id===wl.apt?.mission),cr=cm&&(cm.apartments||[]).find(a=>a&&a.id===wl.apt?.id),ca=cr&&M&&M.analyse?M.analyse(cr):null,em=cr&&String(cr.entry||'').split('.')[0];if(ca&&ca.byId[em]&&ca.byId[em].p)f=ca.byId[em].p.floor||0;}catch{}
    return here(i=>i.action==='mod-elev'&&i.floor===f)||here(i=>i.action==='mod-elev');};
   const out=()=>here(i=>i.action==='mod-exit')||here(i=>i.action==='mod-portal')||up();if(!mine)return out();
   const mod=x.mod||(ap&&ap.mod)||null,cl=wl.cluster||{},inCl=!mod||(cl.mods||[]).some(m=>m.id===mod);
   if(inCl){if(x.kind==='hack'&&ap&&ap.mod)return here(i=>i.action==='apt-ap'&&i.ap===aid+'/'+ap.mod+'.'+ap.sock);
    if(x.kind==='apt-use')return here(i=>i.action==='mod-use'&&i.object===x.object&&(!mod||i.mod===mod));
    const mm=mod&&(cl.mods||[]).find(m=>m.id===mod);return mm?{position:[mm.cx,1.7,mm.cz],route:true,label:g.label||''}:null;}
   // another part of the location: its floor by elevator, or a door that leads to it
   const an=M&&rec&&M.analyse?M.analyse(rec):null,tp=an&&an.byId[mod]&&an.byId[mod].p;if(!tp)return out();
   if(tp.floor!==cl.floor){const e=here(i=>i.action==='mod-elev'&&i.floor===tp.floor);if(e)return e;}
   const want=new Set(((an.clusterOf&&an.clusterOf(mod))||{mods:[]}).mods);const link=(cl.doors||[]).find(d=>d.kind==='portal'&&d.leads&&want.has(String(d.leads).split('.')[0]));
   return (link&&here(i=>i.action==='mod-portal'&&i.door===link.id))||here(i=>i.action==='mod-elev')||here(i=>i.action==='mod-portal')||out();}
  if(wl.part==='hall'){const o=(wl.open||[]).find(o=>o.mission===x.m&&o.id===aid);if(!o||(rec&&wl.street!==rec.door))return here(i=>i.action==='apt-hall-exit');
   if(x.kind==='hack'&&ap&&ap.part==='hall')return here(i=>i.action==='apt-ap'&&i.ap===aid+'/hall'&&i.mission===x.m);return here(i=>i.action==='apt-hall-door'&&i.slot===o.slot);}
  if(!mine)return here(i=>i.action==='apt-exit');
  if(x.kind==='apt-use')return here(i=>i.action==='apt-use'&&i.object===x.object);if(x.kind==='hack')return here(i=>i.action==='apt-ap');return null;}catch{return null;}}
 // A giver made in the editor (npc-made.js; QA 19 Nov 2026: no arrow led to them): where the figure stands now, or, before it is built (another quarter), the
 // spot of their plan; the route through gates and doors is guide-route.js's.
 function madePerson(g){try{const id=g&&g.made;if(!id||typeof walkingLocation==='undefined'||!walkingLocation||walkingLocation.id!=='neochinatown'||walkingLocation.apartment)return null;const M=root.VoidMadeNPCs;if(!M)return null;
  const p=(M.live&&M.live()?.people||[]).find(x=>x.id===id);if(p&&Number.isFinite(p.x))return {position:[p.x,1.7,p.z],route:true,label:g.label||''};
  const pl=M.planOf&&M.planOf(id),pt=pl&&(Number.isFinite(pl.x)?pl:Array.isArray(pl.points)&&pl.points[0]);return pt&&Number.isFinite(pt.x)?{position:[pt.x,1.7,pt.z],route:true,label:g.label||''}:null;}catch{return null;}}
 // Inside an apartment or a location while the step is out on the street (a talk, a follow, a place; night QA 20 Nov 2026: a mission's location can be entered before
 // its step, and inside there was no arrow at all): the way out.
 function wayOut(){try{const wl=walkingLocation;if(!wl||!wl.apartment)return null;const here=f=>{const i=(wl.interactions||[]).find(f);return i?{position:i.position.slice(),route:true,label:i.label||''}:null;};
  if(wl.modular){const e=here(i=>i.action==='mod-exit')||here(i=>i.action==='mod-portal');if(e)return e;const g=aptGoal({apt:{m:wl.apt&&wl.apt.mission,a:'\u0000none'},label:''});return g||here(i=>i.action==='mod-elev');}
  return wl.part==='hall'?here(i=>i.action==='apt-hall-exit'):here(i=>i.action==='apt-exit');}catch{return null;}}
 function missionPlaceRoute(g){
  try{const mp=milkedPerson(g);if(mp)return mp;const ag=aptGoal(g);if(ag)return ag;const md=madePerson(g);if(md)return md;if(!(g&&g.apt)){const wo=wayOut();if(wo)return wo;}if(!g||(!g.place&&!g.target)||typeof walkingLocation==='undefined'||!walkingLocation||typeof walker==='undefined'||!walker)return null;
   const wl=walkingLocation,node=g.place?P()?.node(g.place):null;
   if(node&&node.scene&&!node.whole&&node.scene!==wl.id)return null;
   const pt=(g.target&&subjectPoint(g.target))||(g.place&&P()?.target(g.place));if(!pt)return null;
   // The goal itself (a person's live position, or the place's point). The way there (out of a room, through the District's vestibule, NULL's entry, a gate lane)
   // is guide-route.js's, for every mission (17 Nov 2026, arrow smoothing: this used to return the vestibule's middle as the goal, and the arrow turned round past it).
   return {position:pt,route:true,label:g.label||''};}catch{return null;}}
 root.missionPlaceRoute=missionPlaceRoute;

 // ---- the marker over the person to photograph ----
 const photoStep=()=>{try{const s=LC()?.step?.();return s&&s.tracked&&s.step&&s.step.kind==='photo'?s:null;}catch{return null;}};
 function drawSubject(){
  if(typeof mode==='undefined'||mode!=='walking'||typeof walker==='undefined'||!walker||typeof ctx==='undefined')return;
  // one marker for everyone the photo needs: over the person, or over the middle of a pair (Juno Vex and Halden Reyes), at the taller head's height
  const s=photoStep();if(!s)return;const ids=Array.isArray(s.step.subjects)&&s.step.subjects.length?s.step.subjects:[s.step.npc];
  const xs=ids.map(id=>root.VoidPhotoSubjects?.get?.(id)).filter(x=>x&&x.node&&!x.node.isDisposed?.()&&x.node.isEnabled?.());if(!xs.length)return;
  const sc=root.VoidBabylon?.scene,cam=sc?.activeCamera,B=root.BABYLON;if(!cam||!B)return;
  const ps=xs.map(x=>x.node.getAbsolutePosition()),p={x:ps.reduce((a,q)=>a+q.x,0)/ps.length,y:Math.min(...ps.map(q=>q.y)),z:ps.reduce((a,q)=>a+q.z,0)/ps.length},v=new B.Vector3(p.x,p.y+1.95,p.z);if(B.Vector3.TransformCoordinates(v,cam.getViewMatrix()).z<.3)return;
  const sp=B.Vector3.Project(v,B.Matrix.Identity(),sc.getTransformMatrix(),cam.viewport.toGlobal(W,H));if(sp.x<-40||sp.x>W+40||sp.y<-40||sp.y>H+40)return;
  const d=Math.hypot(p.x-walker.x,p.z-walker.z),r=Math.max(8,Math.min(14,200/Math.max(d,1))),pulse=.85+.15*Math.sin(performance.now()/180);
  ctx.save();ctx.translate(sp.x,sp.y);ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillStyle='#f2b33d';ctx.strokeStyle='#0b0f17';ctx.lineWidth=2.5;ctx.globalAlpha=pulse;
  ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();ctx.stroke();ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=6;
  ctx.font='bold 11px Consolas, monospace';ctx.textAlign='center';ctx.fillStyle='#f2b33d';ctx.fillText('TARGET · '+Math.round(d)+' m',0,r+16);ctx.restore();
  try{root.VoidMissionGuide.markerShown=performance.now();}catch{}}
 if(typeof draw==='function'){const prior=draw;draw=function(){prior.apply(this,arguments);try{drawSubject();}catch{}};}

 // ---- contextual hints ----
 const hint=document.createElement('div');hint.id='mission-hint';hint.dataset.help='1';hint.hidden=true;hint.setAttribute('role','status');hint.setAttribute('aria-live','polite');document.body.appendChild(hint);
 const style=document.createElement('style');style.textContent='#mission-hint{position:fixed;left:50%;top:134px;transform:translateX(-50%);z-index:250;pointer-events:none;max-width:min(560px,80vw);padding:5px 12px;font:600 12px/1.45 ui-monospace,Consolas,monospace;letter-spacing:.06em;color:#ffc35c;background:rgba(24,16,4,.72);border-left:2px solid #ff9f2e;border-radius:2px;text-shadow:0 1px 2px #000}#mission-hint b{color:#ffe08a;font-weight:700}';document.head.appendChild(style);
 const key=()=>{try{return root.VoidInput.label(root.VoidInput.bindings.missionLog||'KeyL');}catch{return 'L';}};
 const name=id=>{try{return LC()?.giverName?.(id)||id;}catch{return id;}};
 /* The hint for what the player is doing now (null: nothing to say). Pure enough to test with a fake view: {step, deviceOpen, app, thread, attach:{picking,photo}, camera, key, name}. */
 function hintFor(v){const st=v&&v.step;if(!st)return null;
  if(st.kind==='photo'){if(v.camera)return {id:'shoot',text:'Put the target in the frame · <b>LEFT CLICK</b> takes a picture'};if(v.deviceOpen)return v.app?{id:'camera',text:'Go back (<b>Esc</b>) and select the <b>Camera</b> app'}:{id:'camera',text:'Select the <b>Camera</b> app'};return {id:'open',text:'Press <b>'+v.key+'</b> to open your V1'};}
  if(st.kind==='send-photo'){const who=v.name(st.npc);if(!v.deviceOpen)return {id:'open',text:'Press <b>'+v.key+'</b> to open your V1, then <b>Messages</b>'};
   if(v.app!=='messages')return v.app?{id:'messages',text:'Go back (<b>Esc</b>) and open <b>Messages</b>'}:{id:'messages',text:'Open <b>Messages</b>'};
   if(v.thread!==st.npc)return {id:'thread',text:'Select <b>'+who+'</b>’s conversation (INBOX)'};
   if(v.attach&&v.attach.picking)return {id:'attach',text:'Choose the photo of the target'};if(!(v.attach&&v.attach.photo))return {id:'attach',text:'Press <b>ATTACH</b>'};return {id:'send',text:'Press <b>SEND</b>'};}
  return null;}
 let shown='';
 setInterval(()=>{try{
  const s=typeof state!=='undefined'&&state?state:null,off=s?.story?.flags?.helpOff===true,D=root.VoidPersonalDevice,on=typeof mode!=='undefined'&&(mode==='walking'||D?.isOpen);
  const cur=!off&&on?LC()?.step?.():null,h=cur?hintFor({step:cur.step,deviceOpen:!!D?.isOpen,app:D?.app||null,thread:D?.thread||null,attach:D?.attach||{},camera:!!root.VoidDeviceCamera?.active,key:key(),name}):null;
  const html=h?h.text:'';if(html!==shown){shown=html;hint.innerHTML=html;hint.dataset.hint=h?h.id:'';}hint.hidden=!h;}catch{hint.hidden=true;}},300);
 root.VoidMissionGuide={missionPlaceRoute,aptGoal,madePerson,hintFor,subjectPoint,get hint(){return hint.hidden?null:{id:hint.dataset.hint,text:hint.textContent};},markerShown:0};
})(globalThis);
