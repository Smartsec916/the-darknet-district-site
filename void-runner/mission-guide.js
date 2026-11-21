/* MISSION GUIDE ON FOOT (browser only): what the yellow guidance needs for place steps and photo steps (Mission 002 — Eyes on the Street, 17 Nov 2026).
   - missionPlaceRoute(g): the goal of a step that names a place (places.js) or a person to photograph (world-integration.js asks). The route to it (out through the
     District's security vestibule, into NULL, through a gate lane) and how the arrow moves are guide-route.js's.
   - The yellow marker over the person to photograph (one marker over the middle of Juno Vex and Halden Reyes), drawn only while that photo step is in progress AND the mission is tracked. Not before, not after.
   - Contextual hints for the photo and the send-a-photo steps: open the V1 (the player's own key), open Camera, take the photo, open Messages, open the conversation,
     ATTACH, SEND. Small, in the mission yellow (the arrow's colour), at the top of the screen under the tracked-mission line (clear of the V1 banner at the bottom right, the KeyMap box and the [E] prompt); each goes once it is done (it follows what the player is actually doing). Every hint is tagged
     data-help="1" for the owner's future Help switch, and hidden when story.flags.helpOff is true. */
(function(root){
 'use strict';
 const LC=()=>root.VoidLiveContent,P=()=>root.VoidPlaces,Y=()=>root.VoidGuideRoute?.COLOR||{hex:'#ffd678'};   // the mission yellow (guide-route.js COLOR): the arrow's colour
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
 function aptGoal(g){try{const x=g&&g.apt;if(!x||typeof walkingLocation==='undefined'||!walkingLocation||(walkingLocation.id!=='neochinatown'&&walkingLocation.id!=='corporate'))return null;   // corporate: Mission 009's maintenance door and the facility behind it (Awakening QA 20 Nov 2026: no arrow there)
  const A=root.VoidApartments,M=root.VoidModules,wl=walkingLocation;if(!A)return null;
  const ap=x.ap?A.apOf(x.ap):null,aid=x.a||(ap&&ap.apt)||null,mis=((LC()?.env?.trees)||[]).flatMap(t=>t.missions||[]).find(m=>m.id===x.m),rec=mis&&(mis.apartments||[]).find(a=>a&&a.id===aid);
  // a lift's buttons: the goal is the middle of the cab (Awakening QA 20 Nov 2026: the arrow faded with the player in the cab's doorway, where the wall hides the buttons' E prompt)
  const cabOf=p=>{const c=((wl.cluster||{}).mods||[]).filter(m=>m&&m.type==='elevator'&&Number.isFinite(m.cx)).sort((a,b)=>Math.hypot(a.cx-p[0],a.cz-p[2])-Math.hypot(b.cx-p[0],b.cz-p[2]))[0];return c&&Math.hypot(c.cx-p[0],c.cz-p[2])<3?[c.cx,1.7,c.cz]:p;};
  const here=f=>{const i=(wl.interactions||[]).find(f);return i?{position:i.action==='mod-elev'?cabOf(i.position.slice()):i.position.slice(),route:true,label:g.label||i.label||''}:null;};
  const front=id=>{const d=A.door(id);return d&&d.front?{position:[d.front[0],1.7,d.front[1]],route:true,label:g.label||''}:null;};
  const door=ap&&ap.door?ap.door:rec&&rec.door;
  // on a fire escape's landing beside this apartment's window (ncz-backalleys.js; night QA 20 Nov 2026: the arrow pointed round the block to the street door): the window
  if(!wl.apartment&&door&&!(ap&&ap.door)){const fe=root.VoidBackAlleys?.live?.();if(fe&&fe.phase==='perch'&&fe.door===door){const w=here(i=>i.action==='fe-window'&&i.door===door);if(w)return w;}}
  if(!wl.apartment){if(!door)return null;return ap&&ap.door?here(i=>i.id==='aptap-'+door)||front(door):here(i=>i.id==='aptdoor-'+door)||front(door);}
  const mine=!!(wl.apt&&wl.apt.mission===x.m&&wl.apt.id===aid);
  // a 'leave the place' step (Awakening QA 20 Nov 2026: in the hallway the arrow led back to the apartment's door; inside, no arrow): the way out
  if(x.kind==='apt-leave'){const w=wayOut();if(w)return w;}
  // the way out of a location: its exit, a door that leads elsewhere, or (on a floor with neither: underground, upstairs; night QA 20 Nov 2026, there was no arrow at all)
  // the stairs / elevator to the floor its street door is on
  if(wl.modular){const up=()=>{let f=0;try{const cm=((LC()?.env?.trees)||[]).flatMap(t=>t.missions||[]).find(m=>m.id===wl.apt?.mission),cr=cm&&(cm.apartments||[]).find(a=>a&&a.id===wl.apt?.id),ca=cr&&M&&M.analyse?M.analyse(cr):null,em=cr&&String(cr.entry||'').split('.')[0];if(ca&&ca.byId[em]&&ca.byId[em].p)f=ca.byId[em].p.floor||0;}catch{}
    return here(i=>i.action==='mod-elev'&&i.floor===f)||here(i=>i.action==='mod-elev');};
   const out=()=>here(i=>i.action==='mod-exit')||here(i=>i.action==='mod-portal')||up();if(!mine)return out();
   const mod=x.mod||(ap&&ap.mod)||null,cl=wl.cluster||{},inCl=!mod||(cl.mods||[]).some(m=>m.id===mod);
   if(inCl){if(x.kind==='hack'&&ap&&ap.mod)return here(i=>i.action==='apt-ap'&&i.ap===aid+'/'+ap.mod+'.'+ap.sock);
    if(x.kind==='apt-use')return here(i=>i.action==='mod-use'&&i.object===x.object&&(!mod||i.mod===mod))||here(i=>i.action==='apt-use'&&i.object===x.object);   // an apartment behind a hallway keeps the older 'apt-use' things (Awakening QA 20 Nov 2026: no arrow to Halden's computer)
    const mm=mod&&(cl.mods||[]).find(m=>m.id===mod);return mm?{position:[mm.cx,1.7,mm.cz],route:true,label:g.label||''}:null;}
   // another part of the location: its floor by elevator, or a door that leads to it
   // a door straight into it (a hallway's apartment door, 'flat.entry|hall.d0'; Awakening QA 20 Nov 2026: after the hack at No. 31 the arrow led back to the street exit)
   const into=here(i=>i.action==='mod-portal'&&String(i.door||'').split('|').some(p=>p.split('.')[0]===mod));if(into)return into;
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
 /* A FOLLOW / LEAD / CAB STEP (20 Nov 2026, escort across: npc-escort-across.js): the person in another area than the player (left behind at a gate, at the stairs, or
    still in the tunnels): her position, the route through the gates, the stairs and the District's door is guide-route.js's. With the player, on a "They follow you" step
    (the player leads): the step's destination (its spot, or its place's street door), in whatever area it is. Otherwise null: the arrow stays on her (her TALK prompt). */
 const ESC_KINDS=['follow-them','they-follow','their-cab','shared-cab'];
 function escortLive(id){try{const sp=root.VoidStreetPair?.live?.();if(sp){if(id===root.VoidStreetPair.CAT_ID&&sp.cat)return {x:sp.cat.x,z:sp.cat.z};if(sp.her&&sp.her.id===id)return {x:sp.her.x,z:sp.her.z};}
  const p=(root.VoidMadeNPCs?.live?.()?.people||[]).find(q=>q.id===id&&q.enabled!==false);if(p)return {x:p.x,z:p.z};}catch{}return null;}
 function escortGoal(g){try{const C=LC();if(!C||!g||typeof walkingLocation==='undefined'||!walkingLocation||walkingLocation.id!=='neochinatown'||walkingLocation.apartment||walkingLocation.modular||typeof walker==='undefined'||!walker)return null;
  const s=C.step?.(),st=s&&s.step;if(!st||!ESC_KINDS.includes(st.kind)||!st.npc)return null;const P=(C.plans?.()||{})[st.npc];if(!P||P.mode!=='escort'||P.indoors)return null;
  const her=escortLive(st.npc);if(!her){const w=C.escortWhere?.(st.npc);return w?{position:[w.x,1.7,w.z],route:true,label:g.label||''}:null;}
  if(st.kind==='they-follow'&&P.final&&Math.hypot(her.x-walker.x,her.z-walker.z)<=Math.max(10,(P.set&&P.set.wait)||8))return {position:[P.final.x,1.7,P.final.z],route:true,label:g.label||''};
  return null;}catch{return null;}}
 root.missionEscortGoal=escortGoal;
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
  ctx.save();ctx.translate(sp.x,sp.y);ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillStyle=Y().hex;ctx.strokeStyle='#0b0f17';ctx.lineWidth=2.5;ctx.globalAlpha=pulse;
  ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();ctx.stroke();ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=6;
  ctx.font='bold 11px Consolas, monospace';ctx.textAlign='center';ctx.fillStyle=Y().hex;ctx.fillText('TARGET · '+Math.round(d)+' m',0,r+16);ctx.restore();
  try{root.VoidMissionGuide.markerShown=performance.now();}catch{}}
 if(typeof draw==='function'){const prior=draw;draw=function(){prior.apply(this,arguments);try{drawSubject();}catch{}};}

 // ---- contextual hints ----
 const hint=document.createElement('div');hint.id='mission-hint';hint.dataset.help='1';hint.hidden=true;hint.setAttribute('role','status');hint.setAttribute('aria-live','polite');document.body.appendChild(hint);
 const style=document.createElement('style');style.textContent='#mission-hint{position:fixed;left:50%;top:134px;transform:translateX(-50%);z-index:250;pointer-events:none;max-width:min(560px,80vw);padding:5px 12px;font:600 12px/1.45 ui-monospace,Consolas,monospace;letter-spacing:.06em;color:var(--mission-yellow,#ffd678);background:rgba(24,16,4,.72);border-left:2px solid var(--mission-yellow,#ffd678);border-radius:2px;text-shadow:0 1px 2px #000}#mission-hint b{color:var(--mission-yellow-text,#ffe7a8);font-weight:700}'
  // (20 Nov 2026) with the V1 open on the right half, the hint and the tracker above it move to the middle of the free left part and wrap there (at 1366 px the hint sat
  // under the V1's left edge); with the V1 expanded to the full width, the hint goes to the top-left corner above it. The camera keeps the hint in the middle.
  +'body.v1-side #mission-hint,body.v1-side #mission-tracker:not([hidden]){left:calc((100vw - 24px - max(430px,50vw - 12px))/2);max-width:calc(100vw - 48px - max(430px,50vw - 12px));box-sizing:border-box;overflow-wrap:anywhere}'
  +'body.v1-side #mission-hint{top:150px}'   // below the zone chip (top-left, to 140 px)
  +'body.v1-wide #mission-hint{left:12px;transform:none;top:72px;max-width:min(320px,28vw)}';document.head.appendChild(style);
 const key=()=>{try{return root.VoidInput.label(root.VoidInput.bindings.missionLog||'KeyL');}catch{return 'L';}};
 const name=id=>{try{return LC()?.giverName?.(id)||id;}catch{return id;}};
 /* The hint for what the player is doing now (null: nothing to say). Pure enough to test with a fake view: {step, deviceOpen, app, thread, attach:{picking,photo}, camera, key, name}. */
 function hintFor(v){const st=v&&v.step;if(!st)return null;
  if(st.kind==='photo'){if(v.camera)return {id:'shoot',text:'Put the target in the frame · <b>LEFT CLICK</b> takes a picture'};if(v.deviceOpen)return v.app?{id:'camera',text:'Go back (<b>Esc</b>) and select the <b>Camera</b> app'}:{id:'camera',text:'Select the <b>Camera</b> app'};return {id:'open',text:'Press <b>'+v.key+'</b> to open your V1'};}
  if(st.kind==='send-photo'){const who=v.name(st.npc);if(!v.deviceOpen)return {id:'open',text:'Press <b>'+v.key+'</b> to open your V1, then <b>Messages</b>'};
   if(v.app!=='messages')return v.app?{id:'messages',text:'Go back (<b>Esc</b>) and open <b>Messages</b>'}:{id:'messages',text:'Open <b>Messages</b>'};
   if(v.thread!==st.npc)return {id:'thread',text:'Select <b>'+who+'</b>’s conversation (INBOX)'};
   if(v.attach&&v.attach.picking)return {id:'attach',text:'Choose the photo of the target'};if(!(v.attach&&v.attach.photo))return {id:'attach',text:'Press <b>ATTACH</b>'};return {id:'send',text:'Press <b>SEND</b>'};}
  // the Mission Log's buttons (REPORT TO …, OPEN REMOTE FEED) and a V1 app to open (the Kestrel tutorial's Ship Loadout); Awakening QA 20 Nov 2026: the steps named the
  // button but not the key. A hand-over in person (a report with a place) is led by the arrow first: no hint. While the feed is on screen: nothing.
  // a call that comes by itself after a moment (Mission 006 after the office, the Kestrel's cockpit calls): say so, so the player waits for it rather than wonders
  if(st.kind==='call'&&!v.deviceOpen)return {id:'call',text:'A call is coming in on your V1 · answer it with <b>'+v.key+'</b>'};
  const app=st.kind==='v1-app'?st.app:(st.kind==='report'&&!st.place)||st.kind==='feed'?'missions':null;
  if(app&&!v.feed){const t=({missions:'Mission Log',loadout:'Ship Loadout',map:'Map'})[app]||String(app).toUpperCase();if(!v.deviceOpen)return {id:'open',text:'Press <b>'+v.key+'</b> to open your V1, then <b>'+t+'</b>'};if(v.app!==app)return v.app?{id:'app',text:'Go back (<b>Esc</b>) and open <b>'+t+'</b>'}:{id:'app',text:'Open <b>'+t+'</b>'};
   if(st.kind==='report')return {id:'report',text:'Press <b>REPORT TO '+String(v.name(st.npc)).toUpperCase()+'</b> on this mission'};if(st.kind==='feed')return {id:'feed',text:'Press <b>OPEN REMOTE FEED</b> on this mission'};}
  return null;}
 let shown='';
 setInterval(()=>{try{
  const s=typeof state!=='undefined'&&state?state:null,off=s?.story?.flags?.helpOff===true,D=root.VoidPersonalDevice,on=typeof mode!=='undefined'&&(mode==='walking'||D?.isOpen);
  const cur=!off&&on?LC()?.step?.():null,h=cur?hintFor({step:cur.step,deviceOpen:!!D?.isOpen,app:D?.app||null,thread:D?.thread||null,attach:D?.attach||{},camera:!!root.VoidDeviceCamera?.active,feed:!!root.VoidCameraFeed?.active,key:key(),name}):null;
  {const pd=document.getElementById('personal-device'),open=!!D?.isOpen&&!!pd&&pd.classList.contains('open')&&!root.VoidDeviceCamera?.active,wide=open&&pd.classList.contains('expanded');document.body.classList.toggle('v1-side',open&&!wide);document.body.classList.toggle('v1-wide',wide);}
  const html=h?h.text:'';if(html!==shown){shown=html;hint.innerHTML=html;hint.dataset.hint=h?h.id:'';}hint.hidden=!h;}catch{hint.hidden=true;}},300);
 root.VoidMissionGuide={missionPlaceRoute,escortGoal,aptGoal,madePerson,hintFor,subjectPoint,get hint(){return hint.hidden?null:{id:hint.dataset.hint,text:hint.textContent};},markerShown:0};
})(globalThis);
