/* The V1's Camera app: a live viewfinder over the game's own camera (David, 15 Nov 2026). Not a picture laid over the screen: the world keeps running, the
   player keeps walking and looking, and what is framed is the real scene.
   - HUD: corner brackets, a plain crosshair (no circle), a running timecode, battery, signal, zoom, focus, camera id, frame rate, ISO.
   - Name tags: a light-green tag for each named District resident (district-people.js) and each other player in view, with a thin line to the person's head.
     The tag sits up and to one side so it never covers the face, and follows the person as they or the player move.
   - Zoom: the mouse wheel steps through the device's zoom array. The array is [1, 1.5, 2, 3]; each model reaches only as far as its own `maxZoom` (V1: 2).
   - Look: every colour, line weight and font comes from the device's own CSS variables (device-v1.css, --pd-*), and the HUD is tagged with the device model
     (`data-device`), so a later device with its own theme restyles the camera without any change here.
   Pure helpers (zoom steps, timecode, tag placement) run in Node too (tests/device-camera.test.cjs). Nothing is captured, stored or sent. */
(function(root){
 'use strict';
 const D=typeof module!=='undefined'&&module.exports?require('./device-v1.js'):root.VoidDeviceV1;
 // ---- pure ----
 /* The zoom steps this device can reach: the device's zoom array up to its own limit. */
 function zoomSteps(device){const def=(D.DEVICES[device&&device.model]||D.DEVICES.v1).camera||{},all=Array.isArray(def.zooms)&&def.zooms.length?def.zooms:[1],max=Number(def.maxZoom)||all[all.length-1];
  const out=all.filter(z=>Number.isFinite(z)&&z>=1&&z<=max);return out.length?out:[1];}
 const stepZoom=(steps,index,dir)=>Math.max(0,Math.min(steps.length-1,index+(dir>0?1:-1)));
 const two=n=>String(Math.floor(n)).padStart(2,'0');
 const timecode=(seconds,fps=30)=>{const s=Math.max(0,seconds);return two(s/3600)+':'+two(s/60%60)+':'+two(s%60)+':'+two((s%1)*fps);};
 /* Where a tag goes for a head at (hx,hy) on a W x H screen: up and to one side (away from the screen's centre line, so tags fan outward), kept on screen.
    Returns the tag's top-left corner and the point on the tag the line starts from. tw, th: the tag's size. */
 function placeTag(hx,hy,W,H,tw=120,th=40,k=1){
  const side=hx<W/2?-1:1,dx=(46+tw*.5)*k,dy=(58+th*.5)*k;let cx=hx+side*dx,cy=hy-dy;
  cx=Math.max(tw/2+8,Math.min(W-tw/2-8,cx));cy=Math.max(th/2+8,Math.min(H-th/2-8,cy));
  const left=cx-tw/2,top=cy-th/2,ax=cx<hx?left+tw:left,ay=top+th;   // the line leaves the tag's lower corner nearest the head
  return {left,top,ax:Math.max(left,Math.min(left+tw,ax)),ay};
 }
 /* Is the straight line from the camera (ax,az) to a head (bx,bz) cut by a wall? solids: the place's collision boxes {id, position:[x,y,z], size:[w,h,d]}.
    Only things tall enough to hide a standing person count (counters and benches do not), and glass does not. A tag never shows through a wall. */
 function sightBlocked(ax,az,bx,bz,solids){
  const dx=bx-ax,dz=bz-az;
  for(const s of solids||[]){if(!s||!s.position||!s.size||/glass|partition/.test(String(s.id||'')))continue;if(s.position[1]+s.size[1]/2<1.6)continue;
   const x0=s.position[0]-s.size[0]/2,x1=s.position[0]+s.size[0]/2,z0=s.position[2]-s.size[2]/2,z1=s.position[2]+s.size[2]/2;if((bx>=x0-.3&&bx<=x1+.3&&bz>=z0-.3&&bz<=z1+.3)||(ax>=x0&&ax<=x1&&az>=z0&&az<=z1))continue;   /* the person's own standing spot (or the viewer's) is not a wall */
   let t0=.02,t1=.98,hit=true;
   for(const [o,d,lo,hi] of [[ax,dx,x0,x1],[az,dz,z0,z1]]){if(Math.abs(d)<1e-9){if(o<lo||o>hi){hit=false;break;}}else{let a=(lo-o)/d,b=(hi-o)/d;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1){hit=false;break;}}}
   if(hit)return true;}
  return false;
 }
 /* Who the camera is aimed at: the person whose HEAD or whose TAG is nearest the crosshair, if either is inside the aperture (half-width `reach` pixels,
    a little generous so a moving person can be caught). list: [{key, hx, hy, tx, ty, tw, th}] (head point; tag box). -> key or null. */
 function aimed(list,cx,cy,reach){let best=null,bd=Infinity;for(const p of list||[]){const dh=Math.hypot(p.hx-cx,p.hy-cy),nx=Math.max(p.tx,Math.min(cx,p.tx+p.tw)),ny=Math.max(p.ty,Math.min(cy,p.ty+p.th)),dt=Math.hypot(nx-cx,ny-cy),d=Math.min(dh,dt);if(d<=reach&&d<bd){bd=d;best=p.key;}}return best;}
 const pure={zoomSteps,stepZoom,timecode,placeTag,sightBlocked,aimed};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 // ---- browser ----
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let el=null,svg=null,tagBox=null,active=false,steps=[1],zi=0,started=0,observer=null,device=null,baseFov=null,lastHud=0,wheelAcc=0,lastStep=0;
 const tags=new Map();   // key -> {tag, line}
 const scene=()=>root.VoidBabylon?.scene||null;
 function build(){
  el=document.createElement('div');el.id='pd-camera';el.hidden=true;el.setAttribute('role','img');el.setAttribute('aria-label','Camera viewfinder');
  const corner=c=>'<i class="pc-corner '+c+'"></i>';
  el.innerHTML='<div class="pc-frame">'+corner('tl')+corner('tr')+corner('bl')+corner('br')+'<i class="pc-edge t"></i><i class="pc-edge b"></i></div>'
   +'<div class="pc-aperture">'+corner('tl')+corner('tr')+corner('bl')+corner('br')+'<i class="pc-cross"></i></div>'
   +'<div class="pc-aim" data-pc="aim" hidden></div><div class="pc-toast" data-pc="toast" hidden></div>'
   +'<div class="pc-time" data-pc="time">00:00:00:00</div>'
   +'<div class="pc-tr"><div>Battery <b data-pc="battery">100%</b><span class="pc-batt"><i data-pc="battbar"></i></span></div><div>Signal <b data-pc="signal">Good</b><span class="pc-bars" data-pc="bars"><i></i><i></i><i></i><i></i></span></div></div>'
   +'<div class="pc-bl"><div>Zoom <b data-pc="zoom">1x</b></div><div>Focus : <b>Auto</b></div><div class="pc-hint">WHEEL · ZOOM &nbsp; F · FOLLOW &nbsp; B · PUT AWAY</div></div>'
   +'<div class="pc-br"><div class="pc-cam" data-pc="cam">CAM 01</div><div>FPS : <b data-pc="fps">0.00</b></div><div>ISO <b data-pc="iso">320</b></div></div>'
   +'<svg class="pc-lines" aria-hidden="true"></svg><div class="pc-tags"></div>';
  document.body.appendChild(el);svg=el.querySelector('svg');tagBox=el.querySelector('.pc-tags');
 }
 const set=(k,v)=>{const n=el.querySelector('[data-pc='+k+']');if(n&&n.textContent!==v)n.textContent=v;};
 /* Who can be tagged right now: named residents whose figure is in the scene, and other players. -> [{key, name, role, node}] */
 function people(){
  const sc=scene(),out=[];if(!sc)return out;const P=root.VoidDistrictPeople;
  if(P){const nodes=sc.transformNodes.concat(sc.meshes);
   for(const n of P.NPCS){const ids=[n.id,n.crew].filter(Boolean);const node=nodes.find(t=>!t.isDisposed()&&t.isEnabled()&&(ids.includes(t.metadata?.character)||ids.includes(t.metadata?.club)||ids.some(i=>t.name==='npc-'+i)));
    if(node)out.push({key:'npc:'+n.id,name:n.name,role:P.jobsText(n.jobs.slice(0,1)),node});}}
  try{for(const p of root.VoidRemotePlayers?.peers||[]){if(!p.drawn)continue;const node=sc.getTransformNodeByName('remote-player:'+p.id);if(node)out.push({key:'player:'+p.id,name:p.name,role:'Player',node});}}catch{}
  return out;
 }
 const heights=new WeakMap();
 function headOf(node){   // the top of the figure, measured once (a tag must not jitter with the idle sway)
  let h=heights.get(node);
  if(h===undefined){h=1.78;try{const b=node.getHierarchyBoundingVectors(true),top=b.max.y-node.getAbsolutePosition().y;if(isFinite(top)&&top>1.2&&top<2.4)h=top;}catch{}heights.set(node,h);}
  const p=node.getAbsolutePosition();return new root.BABYLON.Vector3(p.x,p.y+h-.1,p.z);
 }
 function drawTags(){
  const B=root.BABYLON,sc=scene(),cam=sc?.activeCamera;if(!B||!cam)return;
  const W=el.clientWidth,H=el.clientHeight,vp=cam.viewport.toGlobal(W,H),tm=sc.getTransformMatrix(),I=B.Matrix.IdentityReadOnly,seen=new Set(),fwd=cam.getForwardRay(1).direction,range=28*steps[zi];
  const solids=typeof walkingLocation!=='undefined'&&walkingLocation?walkingLocation.solids:null;
  const shown=[];
  for(const p of people()){
   const head=headOf(p.node),to=head.subtract(cam.globalPosition),dist=to.length();if(dist>range||dist<.6||B.Vector3.Dot(to,fwd)<=0)continue;
   if(pure.sightBlocked(cam.globalPosition.x,cam.globalPosition.z,head.x,head.z,solids))continue;   // not through walls
   const s=B.Vector3.Project(head,I,tm,vp);if(!(s.z>0&&s.z<1)||s.x<-40||s.x>W+40||s.y<-40||s.y>H+40)continue;
   let t=tags.get(p.key);
   if(!t){const tag=document.createElement('div');tag.className='pc-tag';tag.innerHTML='<b></b><span></span>';tagBox.appendChild(tag);const line=document.createElementNS('http://www.w3.org/2000/svg','line'),dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r','3');svg.append(line,dot);t={tag,line,dot,name:'',role:''};tags.set(p.key,t);}
   if(t.name!==p.name){t.name=p.name;t.tag.firstChild.textContent=p.name;}if(t.role!==p.role){t.role=p.role;t.tag.lastChild.textContent=p.role;}
   const tw=t.tag.offsetWidth||120,th=t.tag.offsetHeight||40,at=pure.placeTag(s.x,s.y,W,H,tw,th,Math.max(.55,Math.min(1,6/dist*steps[zi])));
   for(let pass=0;pass<4;pass++){const hit=shown.find(o=>at.left<o.tx+o.tw+4&&at.left+tw+4>o.tx&&at.top<o.ty+o.th+4&&at.top+th+4>o.ty);if(!hit)break;at.top=Math.max(8,hit.ty-th-6);at.ay=at.top+th;}   // two people close together: the second tag steps above the first instead of covering it
   t.tag.style.transform='translate('+at.left.toFixed(1)+'px,'+at.top.toFixed(1)+'px)';t.tag.hidden=false;
   t.line.setAttribute('x1',at.ax.toFixed(1));t.line.setAttribute('y1',at.ay.toFixed(1));t.line.setAttribute('x2',s.x.toFixed(1));t.line.setAttribute('y2',s.y.toFixed(1));t.dot.setAttribute('cx',s.x.toFixed(1));t.dot.setAttribute('cy',s.y.toFixed(1));
   t.line.style.display=t.dot.style.display='';seen.add(p.key);t.who=p;shown.push({key:p.key,hx:s.x,hy:s.y,tx:at.left,ty:at.top,tw,th});
  }
  // aim: the crosshair on the person or on their tag selects them; F follows or unfollows (kept in the save, shown in Social)
  const key=pure.aimed(shown,W/2,H/2,Math.min(W,H)*.085);target=key?tags.get(key).who:null;
  for(const [k,t] of tags){const on=k===key;if(t.on!==on){t.on=on;t.tag.classList.toggle('aim',on);t.line.classList.toggle('aim',on);}}
  const hint=el.querySelector('[data-pc=aim]'),P=root.VoidDistrictPeople,fl=flags();let text='';
  if(target&&P&&fl){const fk=target.key.startsWith('npc:')?'n:'+target.key.slice(4):'p:'+String(target.key.slice(7)).replace(/[^0-9a-f]/g,'').slice(0,12);text=(P.isFollowing(fl,fk)?'F · UNFOLLOW ':'F · FOLLOW ')+target.name.toUpperCase();}
  if(hint.textContent!==text){hint.textContent=text;hint.hidden=!text;el.querySelector('.pc-aperture').classList.toggle('lock',!!text);}
  for(const [k,t] of tags)if(!seen.has(k)){t.tag.hidden=true;t.line.style.display=t.dot.style.display='none';}
 }
 function hud(now){
  if(now-lastHud<200)return;lastHud=now;
  const run=(now-started)/1000,def=(D.DEVICES[device.model]||D.DEVICES.v1),c=def.camera||{};
  // The battery is the device's own figure for this session (it is a prop, not this computer's battery): full at power-on, slowly down while the camera runs.
  const batt=Math.max(5,Math.round(100-run/36)),sig=signal();
  set('battery',batt+'%');el.querySelector('[data-pc=battbar]').style.width=batt+'%';set('signal',sig.label);el.querySelector('[data-pc=bars]').dataset.level=String(sig.level);
  set('zoom',(steps[zi]%1?steps[zi].toFixed(1):String(steps[zi]))+'x');set('cam',c.id||'CAM 01');set('fps',(root.VoidBabylon?.engine?.getFps?.()||scene()?.getEngine().getFps()||0).toFixed(2));set('iso',String(c.iso||320));
 }
 function signal(){try{const s=typeof state!=='undefined'?state:null,st=root.VoidComms?.status?.(s,{onFoot:true});if(st){return st.state==='connected'?{label:'Good',level:4}:st.state==='disconnected'?{label:'None',level:0}:{label:'Weak',level:2};}}catch{}return {label:'Good',level:4};}
 function tick(){
  if(!active)return;
  if(root.VoidPersonalDevice?.isOpen||typeof mode==='undefined'||mode!=='walking'){stop();return;}
  const sc=scene(),cam=sc?.activeCamera;if(!cam)return;
  if(baseFov===null)baseFov=cam.fov;
  cam.fov=2*Math.atan(Math.tan(baseFov/2)/steps[zi]);   // the renderer sets the walking view every frame; the viewfinder narrows it afterwards
  const now=performance.now();set('time',pure.timecode((now-started)/1000));hud(now);drawTags();
 }
 const flags=()=>{try{return (typeof state!=='undefined'&&state)?.story?.flags||null;}catch{return null;}};
 let target=null,toastTimer=0;
 function onKey(e){
  if(!active||e.code!=='KeyF'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();e.stopImmediatePropagation();
  const P=root.VoidDistrictPeople,fl=flags();if(!target||!P||!fl)return;
  const who=target.key.startsWith('npc:')?{kind:'npc',id:target.key.slice(4)}:{kind:'player',id:target.key.slice(7),name:target.name};
  const was=P.readFollowing(fl).length,now=P.toggleFollow(fl,who),changed=P.readFollowing(fl).length!==was;try{if(typeof save==='function')save();}catch{}
  const t=el.querySelector('[data-pc=toast]');t.textContent=!changed?'CANNOT FOLLOW '+target.name.toUpperCase()+' (NO REGISTERED HANDLE)':now?'FOLLOWING '+target.name.toUpperCase()+' · SEE SOCIAL':'UNFOLLOWED '+target.name.toUpperCase();t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.hidden=true;},2600);
 }
 function onWheel(e){
  if(!active)return;e.preventDefault();e.stopImmediatePropagation();wheelAcc+=e.deltaY;const now=performance.now();
  if(Math.abs(wheelAcc)>=40&&now-lastStep>110){zi=pure.stepZoom(steps,zi,wheelAcc<0?1:-1);wheelAcc=0;lastStep=now;lastHud=0;}
 }
 function start(dev){
  const sc=scene();if(active||!sc||typeof mode==='undefined'||mode!=='walking')return false;
  device=dev||D.restore({});const def=D.DEVICES[device.model]||D.DEVICES.v1;if(!def.camera?.enabled)return false;
  if(!el)build();el.dataset.device=def.id;steps=pure.zoomSteps(device);zi=0;started=performance.now();lastHud=0;baseFov=null;wheelAcc=0;
  el.hidden=false;active=true;document.body.classList.add('pd-camera-on');observer=sc.onBeforeRenderObservable.add(tick);addEventListener('wheel',onWheel,{passive:false,capture:true});addEventListener('keydown',onKey,{capture:true});
  try{const cv=sc.getEngine().getRenderingCanvas();cv?.focus?.();if(root.VoidControls?.deviceClass!=='touch-first')cv?.requestPointerLock?.()?.catch?.(()=>{});}catch{}
  return true;
 }
 function stop(){
  if(!active)return;active=false;document.body.classList.remove('pd-camera-on');removeEventListener('wheel',onWheel,{capture:true});removeEventListener('keydown',onKey,{capture:true});target=null;
  const sc=scene();if(sc&&observer)sc.onBeforeRenderObservable.remove(observer);observer=null;
  try{if(baseFov!==null&&sc?.activeCamera)sc.activeCamera.fov=baseFov;}catch{}baseFov=null;
  if(el)el.hidden=true;for(const t of tags.values()){t.tag.remove();t.line.remove();t.dot.remove();}tags.clear();
 }
 /* B (David, 15 Nov 2026): the key the V3 // Shadow uses for the camera in its owner's eye raises and puts away the camera for EVERYONE, whatever device they carry,
    while on foot. In flight B is still the target lock (input.js), and it does nothing while typing. */
 addEventListener('keydown',e=>{if(e.code!=='KeyB'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||typeof mode==='undefined'||mode!=='walking')return;
  const a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return;
  if(active){e.preventDefault();stop();return;}
  let dev=null;try{dev=D.restore(flags()||{});}catch{}
  if(root.VoidPersonalDevice?.isOpen)root.VoidPersonalDevice.close();
  if(start(dev))e.preventDefault();});
 root.VoidDeviceCamera={start,stop,get active(){return active;},get zoom(){return steps[zi];},get steps(){return steps.slice();},get target(){return target?{key:target.key,name:target.name}:null;},get tags(){return [...tags.entries()].filter(([,t])=>!t.tag.hidden).map(([k,t])=>({key:k,name:t.name,role:t.role}));},...pure};
})(typeof globalThis!=='undefined'?globalThis:this);
