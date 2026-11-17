/* MISSION GUIDE ON FOOT (browser only): what the yellow guidance needs for place steps and photo steps (Mission 002 — Eyes on the Street, 17 Nov 2026).
   - missionPlaceRoute(g): where the yellow arrow leads for a step that names a place (places.js) or a person to photograph. From inside The Darknet District to a place
     outside it, the arrow leads out through the security vestibule first; from the street to a place inside the District, to the vestibule (world-integration.js asks).
   - The yellow marker over the person to photograph (one marker over the middle of Juno Vex and Halden Reyes), drawn only while that photo step is in progress AND the mission is tracked. Not before, not after.
   - Contextual hints for the photo and the send-a-photo steps: open the V1 (the player's own key), open Camera, take the photo, open Messages, open the conversation,
     ATTACH, SEND. Small, yellow-orange, at the top of the screen under the tracked-mission line (clear of the V1 banner at the bottom right, the KeyMap box and the [E] prompt); each goes once it is done (it follows what the player is actually doing). Every hint is tagged
     data-help="1" for the owner's future Help switch, and hidden when story.flags.helpOff is true. */
(function(root){
 'use strict';
 const LC=()=>root.VoidLiveContent,P=()=>root.VoidPlaces;
 const inRect=([x0,x1,z0,z1],x,z)=>x>=x0&&x<=x1&&z>=z0&&z<=z1;
 function subjectPoint(id){try{const x=root.VoidPhotoSubjects?.get?.(id);if(x&&x.node&&!x.node.isDisposed?.()){const p=x.node.getAbsolutePosition();return [p.x,1.7,p.z];}}catch{}
  if(id==='juno-vex'&&root.VoidNightclub?.JUNO){const j=root.VoidNightclub.JUNO;return [j.x,1.7,j.z];}return null;}
 function missionPlaceRoute(g){
  try{if(!g||(!g.place&&!g.target)||typeof walkingLocation==='undefined'||!walkingLocation||typeof walker==='undefined'||!walker)return null;
   const wl=walkingLocation,node=g.place?P()?.node(g.place):null;
   if(node&&node.scene&&!node.whole&&node.scene!==wl.id)return null;
   const pt=(g.target&&subjectPoint(g.target))||(g.place&&P()?.target(g.place));if(!pt)return null;
   if(wl.id==='neochinatown'&&typeof VoidNeoChinatown!=='undefined'){const D=(P()?.node('district')||{}).rects?.[0],tIn=D&&inRect(D,pt[0],pt[2]),[vx,vz]=VoidNeoChinatown.toWorld(0,23);
    if(wl.area==='interior'&&D&&!tIn)return {position:[vx,1.7,vz],route:true,label:'DISTRICT EXIT'};   // out through the security vestibule first
    if(wl.area!=='interior'&&tIn)return {position:[vx,1.7,vz],route:true,label:'DISTRICT SECURITY ENTRANCE'};}
   return {position:pt,route:true};}catch{return null;}}
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
 root.VoidMissionGuide={missionPlaceRoute,hintFor,subjectPoint,get hint(){return hint.hidden?null:{id:hint.dataset.hint,text:hint.textContent};},markerShown:0};
})(globalThis);
