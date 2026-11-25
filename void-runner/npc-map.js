/* DEVELOPER TOOLS: the top-down map of the city's areas (browser only; loaded with the Mission Editor for a confirmed developer). A plain 2D canvas drawn from the game's own
   layout data (npc-paths.js mapData / npc-areas.js: the walkable pavements and floors, the roads, the buildings and rooms, the gates, the furniture read from the built
   scenes, the taxi posts, the shopfront names, the places never used for Reverie and Lace). No new dependencies.
   The owner, 19 Nov 2026: "Let me place REVERIE or LACE anywhere": an AREA list (The Avenue, Old Town, Far South, The Outskirts, The Port, The Darknet District inside)
   picks which area the map shows. A click on ground she may not stand on is moved to the nearest spot she can (a few metres at most) or refused with the plain reason
   (a forbidden place is never moved out of: the reason is shown). A route stays in one area: a point in another area is refused.
   Used by the Mission Editor ("Giver waits at") and by Developer Tools > NPCs (drag an NPC to a spot, turn the facing handle, place and drag the points of a route).
   North is up; x is east. The walkable ground of the chosen NPC is tinted green; a spot or a leg the game would refuse is drawn red.
   create(opts) -> {el, set(opts), draw(), toWorld(px, py)}. opts: {npc, area, lock, markers:[{id, x, z, yaw, color, label, drag, facing, ghost}], route:[{x, z, label, bad}],
   routeBad:[i], onPick(x, z), onDrag(id, x, z), onFacing(id, yaw), onPoint(i, x, z), onArea(id), selected, height}. */
(function(root){
 'use strict';
 const X=()=>root.VoidNPCPaths,AR=()=>root.VoidNPCAreas;
 const ZOOMS=[['all','Whole area',null],['pair','Reverie and Lace’s stretch',[80,125]],['near','Close up',null]];
 function create(opts={}){
  let o={height:230,zoom:null,center:null,...opts};
  const first=()=>{const p=(o.markers||[]).find(m=>m.drag)||(o.route||[])[0]||(o.markers||[])[0];return p&&AR()?AR().areaOf(p):null;};
  if(!o.area)o.area=o.lock||first()||'avenue';
  // Dax currently has an interior-only runtime; do not offer unsupported city map choices.
  if(o.npc==='dax')o.area='district';
  if(typeof o.center==='number'){const m=(o.markers||[]).find(q=>q.drag)||(o.route||[])[0];o.center={x:o.center,z:m?m.z:null};}if(!o.zoom)o.zoom=o.area==='avenue'?'pair':'all';
  let data=X().mapData(o.area,o.npc);
  const wrap=document.createElement('div');wrap.className='npcmap';wrap.dataset.npcMap='1';
  const bar=document.createElement('div');bar.className='npcmap-bar';
  const areaSel=document.createElement('select');areaSel.setAttribute('aria-label','Which area the map shows');areaSel.dataset.npcMapArea='1';for(const a of data.areas.filter(a=>o.npc!=='dax'||a.id==='district'))areaSel.append(new Option(a.name,a.id));areaSel.value=data.area;
  const zoomSel=document.createElement('select');zoomSel.setAttribute('aria-label','Map zoom');
  const pan=document.createElement('input');pan.type='range';pan.step='1';pan.setAttribute('aria-label','Move the map east or west');
  const panZ=document.createElement('input');panZ.type='range';panZ.step='1';panZ.setAttribute('aria-label','Move the map north or south');
  const tip=document.createElement('span');tip.className='me-small';tip.textContent='Pick the area, then click the green ground to place. Drag a marker to move it; drag its small round handle to turn which way she faces.';
  bar.append(areaSel,zoomSel,pan,panZ,tip);
  const cv=document.createElement('canvas');cv.className='npcmap-canvas';cv.setAttribute('role','img');cv.tabIndex=0;
  const read=document.createElement('div');read.className='me-small npcmap-read';
  const note=document.createElement('div');note.className='me-small npcmap-note';note.setAttribute('aria-live','polite');note.dataset.npcMapNote='1';
  wrap.append(bar,cv,read,note);
  let W=900,H=o.height,k=6,vx0=0,vz1=-3,drag=null;
  function zooms(){zoomSel.innerHTML='';for(const [id,name] of ZOOMS)if(id!=='pair'||data.area==='avenue')zoomSel.append(new Option(name,id));if(o.zoom==='pair'&&data.area!=='avenue')o.zoom='all';zoomSel.value=o.zoom;}
  zooms();
  function view(){const v=data.view;if(o.zoom==='all')return v;const w=o.zoom==='pair'?45:30,h=o.zoom==='pair'?19:20,c=o.center||{};
   const cx=Number.isFinite(c.x)?c.x:o.zoom==='pair'?102.5:(v.x0+v.x1)/2,cz=Number.isFinite(c.z)?c.z:o.zoom==='pair'?-12.5:(v.z0+v.z1)/2;return {x0:cx-w/2,x1:cx+w/2,z0:cz-h/2,z1:cz+h/2};}
  function layout(){W=Math.max(320,Math.floor((wrap.clientWidth||900)-2));const v=view(),vw=v.x1-v.x0,vh=v.z1-v.z0,maxH=Math.max(o.height,440);k=Math.min(W/vw,maxH/vh);H=Math.max(o.height,Math.round(vh*k));
   vx0=v.x0-(W/k-vw)/2;vz1=v.z1+(H/k-vh)/2;const dpr=root.devicePixelRatio||1;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
   const d=data.view;pan.min=String(Math.floor(d.x0));pan.max=String(Math.ceil(d.x1));pan.value=String(Math.round((v.x0+v.x1)/2));panZ.min=String(Math.floor(d.z0));panZ.max=String(Math.ceil(d.z1));panZ.value=String(Math.round((v.z0+v.z1)/2));
   pan.hidden=o.zoom==='all';panZ.hidden=o.zoom!=='near';cv.setAttribute('aria-label','Map of '+data.name);}
  const px=x=>(x-vx0)*k,py=z=>(vz1-z)*k,wx=p=>p/k+vx0,wz=p=>vz1-p/k;
  const rect=(c,r,fill,stroke)=>{c.beginPath();c.rect(px(r.x0),py(r.z1),(r.x1-r.x0)*k,(r.z1-r.z0)*k);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
  const text=(c,t,x,y,col,size=11)=>{c.font=size+'px ui-monospace,monospace';c.fillStyle=col;c.fillText(t,x-c.measureText(t).width/2,y);};
  function draw(){layout();const c=cv.getContext('2d'),dpr=root.devicePixelRatio||1;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);c.fillStyle='#14161d';c.fillRect(0,0,W,H);   // buildings, walls
   for(const f of data.floors)rect(c,f,'#2a2e38');for(const r of data.roads)rect(c,r,'#20232b');
   for(const w of data.walk)rect(c,w,'#3d4352');
   if(data.area==='avenue'){c.strokeStyle='#8a7b3a';c.setLineDash([10,10]);c.beginPath();c.moveTo(px(2),py(-12.5));c.lineTo(px(152),py(-12.5));c.stroke();c.setLineDash([]);}
   // where the chosen NPC can walk
   if(o.npc&&X().MOVABLE[o.npc])for(const w of data.walk)rect(c,w,'rgba(70,200,120,.22)','rgba(90,230,140,.8)');
   // places never used for her (the content rule, red), rooms she may not enter (grey), a venue's doorway on a public pavement (amber: walked past, never stood in)
   for(const n of data.no){const dw=!!n.doorway;rect(c,n,dw?'rgba(230,150,40,.35)':n.rule?'rgba(200,40,60,.33)':'rgba(120,120,140,.3)',dw?'#f0a040':n.rule?'#e0485c':'#777b88');if(n.name&&(n.x1-n.x0)*k>40){text(c,(dw?'no standing: ':n.rule?'✕ ':'')+n.name,px((n.x0+n.x1)/2),py((n.z0+n.z1)/2)+4,dw?'#ffd9a0':n.rule?'#ffb3bd':'#c3c6d0',10);}}
   for(const g of data.gates){rect(c,g,'rgba(200,60,70,.35)','#d04a55');c.fillStyle='#ffb3b9';c.font='11px ui-monospace,monospace';c.fillText(g.name,px(g.x0)+2,py((g.z0+g.z1)/2));}
   if(data.stretch){c.strokeStyle='rgba(255,190,120,.7)';c.setLineDash([4,4]);c.beginPath();c.moveTo(px(data.stretch.x0),py(data.stretch.z));c.lineTo(px(data.stretch.x1),py(data.stretch.z));c.stroke();c.setLineDash([]);
    if(k>4){c.fillStyle='rgba(255,190,120,.9)';c.font='10px ui-monospace,monospace';c.fillText('their usual walk',px(data.stretch.x0)+2,py(data.stretch.z)+11);}}
   for(const l of data.ledges){c.fillStyle='#8a6a48';c.fillRect(px(l.x-l.w/2),py(l.z+l.d/2),l.w*k,Math.max(3,l.d*k));if(k>8){c.fillStyle='#d8b48a';c.font='10px ui-monospace,monospace';c.fillText('ledge',px(l.x-l.w/2),py(l.z+l.d/2)-2);}}
   for(const ob of data.obstacles){c.fillStyle='rgba(255,170,60,.55)';c.fillRect(px(ob.x0),py(ob.z1),Math.max(2,(ob.x1-ob.x0)*k),Math.max(2,(ob.z1-ob.z0)*k));}   // furniture read from the built scene
   for(const p of data.posts){c.fillStyle='#ffd34d';c.beginPath();c.arc(px(p.x),py(p.z),Math.max(3,.25*k),0,7);c.fill();if(k>4){c.font='10px ui-monospace,monospace';c.fillText('taxi',px(p.x)+5,py(p.z)+4);}}
   if(k>3)for(const s of data.shops){const x=px(s.x),y=py(s.z);if(x<-40||x>W+40||y<-10||y>H+10)continue;const off=s.side==='n'?-4:s.side==='s'?12:0;text(c,s.name,s.side==='w'?x-6-c.measureText(s.name).width/2:s.side==='e'?x+6+c.measureText(s.name).width/2:x,y+off,'#9fb4ff',k>8?12:10);}
   // the back alleys' fire escapes (ncz-backalleys.js): the landing against the wall, a tick for its drop ladder, FE beside it
   for(const e of data.escapes||[]){const a=[e.x-e.t[0]*1.2,e.z-e.t[1]*1.2],b=[e.x+e.t[0]*1.2+e.u[0]*1.2,e.z+e.t[1]*1.2+e.u[1]*1.2];c.fillStyle='rgba(150,190,255,.55)';c.strokeStyle='#9cc4ff';c.beginPath();c.rect(px(Math.min(a[0],b[0])),py(Math.max(a[1],b[1])),Math.abs(b[0]-a[0])*k,Math.abs(b[1]-a[1])*k);c.fill();c.stroke();
    c.fillStyle='#d6e6ff';c.beginPath();c.arc(px(e.foot[0]),py(e.foot[1]),Math.max(2,.2*k),0,7);c.fill();if(k>3){c.font='10px ui-monospace,monospace';c.fillText('fire escape',px(e.x+e.u[0]*1.6)+4,py(e.z+e.u[1]*1.6)+4);}}
   // the stairs down to the tunnels (ncz-backalleys.js UNDERGROUND_ENTRANCES): the stairwell, its steps, an arrow down them, "stairs down"
   for(const u of data.tunnels||[]){const r=u.rect;c.fillStyle='rgba(120,110,160,.6)';c.strokeStyle='#b8a8ff';c.beginPath();c.rect(px(r[0]),py(r[3]),(r[1]-r[0])*k,(r[3]-r[2])*k);c.fill();c.stroke();
    c.strokeStyle='rgba(230,220,255,.55)';for(let a=.4;a<5;a+=.6){const x=u.top[0]+u.down[0]*a,z=u.top[1]+u.down[1]*a,t=[-u.down[1]*1.2,u.down[0]*1.2];c.beginPath();c.moveTo(px(x-t[0]),py(z-t[1]));c.lineTo(px(x+t[0]),py(z+t[1]));c.stroke();}
    if(k>3){c.fillStyle='#e6dcff';c.font='10px ui-monospace,monospace';c.fillText('stairs down (tunnels)',px(r[0]),py(r[3])-3);}}
   // the tunnels (ncz-underground.js): the door up to each alley stairwell (purple, "stairs up to ..."), the alcoves' seats (brown); place names in sand colour
   for(const d of data.stairDoors||[]){if(!d.inside)continue;const x=px(d.inside.x),y=py(d.inside.z);c.fillStyle='#b8a8ff';c.fillRect(x-3,y-Math.max(4,.6*k),6,Math.max(8,1.2*k));c.fillStyle='#e6dcff';c.font='10px ui-monospace,monospace';c.fillText('stairs up: '+d.name,x+6,y+4);}
   for(const s of data.seats||[]){c.fillStyle='#a07850';c.beginPath();c.arc(px(s.x),py(s.z),Math.max(2.5,.22*k),0,7);c.fill();}
   for(const l of data.labels)text(c,l.name,px(l.x),py(l.z),l.back?'#a8d8b8':l.under?'#e0cc98':'#c9cede',l.back||l.under?10:11);
   c.fillStyle='#6c7280';c.font='11px ui-monospace,monospace';c.fillText('N ↑',W-30,14);
   // the route
   const R=o.route||[];if(R.length){c.lineWidth=2;for(let i=0;i<R.length;i++){const a=R[i],b=R[(i+1)%R.length];if(R.length<2)break;c.strokeStyle=(o.routeBad||[]).includes(i)?'#ff4d5e':'rgba(120,210,255,.9)';c.setLineDash(i===R.length-1?[6,5]:[]);c.beginPath();c.moveTo(px(a.x),py(a.z));c.lineTo(px(b.x),py(b.z));c.stroke();}c.setLineDash([]);c.lineWidth=1;
    R.forEach((p,i)=>{const r=Math.max(7,.35*k);c.fillStyle=p.bad?'#ff4d5e':'#1aa3e0';c.beginPath();c.arc(px(p.x),py(p.z),r,0,7);c.fill();c.fillStyle='#fff';c.font='bold 11px ui-monospace,monospace';const t=String(i+1);c.fillText(t,px(p.x)-c.measureText(t).width/2,py(p.z)+4);});}
   // the markers (people)
   for(const m of o.markers||[]){const x=px(m.x),y=py(m.z),r=Math.max(7,.32*k);if(x<-30||x>W+30||y<-30||y>H+30)continue;   // in another area (the line at the bottom says so)
   c.globalAlpha=m.ghost?.45:1;c.fillStyle=m.bad?'#ff4d5e':m.color||'#ff8ad8';c.beginPath();c.arc(x,y,r,0,7);c.fill();c.strokeStyle=o.selected===m.id?'#fff':'#000';c.lineWidth=o.selected===m.id?2:1;c.stroke();c.lineWidth=1;
    if(Number.isFinite(m.yaw)){const hx=x+Math.sin(m.yaw)*Math.max(18,1.3*k),hy=y-Math.cos(m.yaw)*Math.max(18,1.3*k);c.strokeStyle='#fff';c.beginPath();c.moveTo(x,y);c.lineTo(hx,hy);c.stroke();if(m.facing){c.fillStyle='#fff';c.beginPath();c.arc(hx,hy,5,0,7);c.fill();}}
    if(m.label){c.font='11px ui-monospace,monospace';c.fillStyle='#fff';c.fillText(m.label,x+r+3,y-r);}c.globalAlpha=1;}
   const elsewhere=[...(o.markers||[]).filter(m=>m.drag),...(o.route||[]).slice(0,1)].map(p=>AR()&&AR().areaOf(p)).filter(a=>a&&a!==data.area);
   if(elsewhere.length){c.fillStyle='#ffd34d';c.font='12px ui-monospace,monospace';c.fillText('Her spot is in '+AR().get(elsewhere[0]).name+': pick it in the area list to see it.',8,H-8);}
  }
  // the line under the map survives the editor drawing itself again after a placement (the next map shows it for a few seconds)
  const say=t=>{note.textContent=t||'';root.VoidNPCMap.lastNote={text:t||'',at:Date.now(),npc:o.npc||null};};
  {const l=root.VoidNPCMap?.lastNote;if(l&&l.text&&l.npc===(o.npc||null)&&Date.now()-l.at<4000)note.textContent=l.text;}
  /* A clicked or dropped spot: moved onto ground she may stand on, or refused with the reason. Returns {x, z} or null. */
  function place(x,z){const P=X();if(!o.npc||!P.pick)return {x,z};const r=P.pick(o.npc,{x,z},data.area);if(!r.spot){say('Not placed: '+r.why);return null;}
   if(o.lock&&AR()&&AR().areaOf(r.spot)!==o.lock){say('Not placed: a route stays in one area, and this one is in '+AR().get(o.lock).name+'. Remove its points first, or give this area its own time block.');return null;}
   say(r.spot.moved?'Moved to the nearest spot she can stand on ('+r.why.replace(/^That is /,'that was ').replace(/:.*$/,'').replace(/\.$/,'')+').':'');return {x:r.spot.x,z:r.spot.z};}
  const at=e=>{const b=cv.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top};};
  function hit(p){for(const m of [...(o.markers||[])].reverse()){if(!m.drag)continue;if(Number.isFinite(m.yaw)&&m.facing){const hx=px(m.x)+Math.sin(m.yaw)*Math.max(18,1.3*k),hy=py(m.z)-Math.cos(m.yaw)*Math.max(18,1.3*k);if(Math.hypot(p.x-hx,p.y-hy)<8)return {kind:'facing',m};}
    if(Math.hypot(p.x-px(m.x),p.y-py(m.z))<Math.max(9,.4*k))return {kind:'marker',m,x0:m.x,z0:m.z};}
   if(o.onPoint)for(let i=(o.route||[]).length-1;i>=0;i--){const q=o.route[i];if(Math.hypot(p.x-px(q.x),p.y-py(q.z))<Math.max(9,.4*k))return {kind:'point',i,x0:q.x,z0:q.z};}return null;}
  const r1=v=>Math.round(v*10)/10;
  cv.onpointerdown=e=>{const p=at(e),h=hit(p);if(h){drag={...h,moved:false};cv.setPointerCapture(e.pointerId);e.preventDefault();return;}
   if(o.onPick){const q=place(r1(wx(p.x)),r1(wz(p.y)));if(q)o.onPick(q.x,q.z);}};
  cv.onpointermove=e=>{const p=at(e);read.textContent=data.name+' · x '+wx(p.x).toFixed(1)+' · z '+wz(p.y).toFixed(1)+' m';if(!drag)return;drag.moved=true;const x=r1(wx(p.x)),z=r1(wz(p.y));
   if(drag.kind==='marker'){drag.m.x=x;drag.m.z=z;}else if(drag.kind==='facing'){drag.m.yaw=Math.round(Math.atan2(x-drag.m.x,z-drag.m.z)*100)/100;}else if(drag.kind==='point'){o.route[drag.i].x=x;o.route[drag.i].z=z;}draw();};
  cv.onpointerup=e=>{if(!drag)return;const d=drag;drag=null;try{cv.releasePointerCapture(e.pointerId);}catch{}if(!d.moved)return;
   if(d.kind==='facing'){o.onFacing?.(d.m.id,d.m.yaw);return;}
   const lockWas=o.lock;if(d.kind==='point'&&(o.route||[]).length<=1)o.lock=null;   // the only point of a route may go anywhere
   const src=d.kind==='marker'?d.m:o.route[d.i],q=place(src.x,src.z);o.lock=lockWas;
   if(!q){src.x=d.x0;src.z=d.z0;draw();return;}src.x=q.x;src.z=q.z;if(d.kind==='marker')o.onDrag?.(d.m.id,q.x,q.z);else o.onPoint?.(d.i,q.x,q.z);};
  areaSel.onchange=()=>{o.area=areaSel.value;o.center=null;data=X().mapData(o.area,o.npc);if(o.zoom==='pair'&&o.area!=='avenue')o.zoom='all';zooms();say('');draw();o.onArea?.(o.area);};
  zoomSel.onchange=()=>{o.zoom=zoomSel.value;if(o.zoom!=='all'&&!o.center){const m=(o.markers||[]).find(q=>AR()&&AR().areaOf(q)===data.area)||(o.route||[])[0];o.center=m?{x:m.x,z:m.z}:null;}draw();};
  pan.oninput=()=>{o.center={...(o.center||{}),x:Number(pan.value),z:o.center&&Number.isFinite(o.center.z)?o.center.z:Number(panZ.value)};draw();};
  panZ.oninput=()=>{o.center={...(o.center||{}),z:Number(panZ.value),x:o.center&&Number.isFinite(o.center.x)?o.center.x:Number(pan.value)};draw();};
  const ro=root.ResizeObserver?new ResizeObserver(()=>draw()):null;ro?.observe(wrap);
  setTimeout(draw,0);
  const api={el:wrap,draw,set(n){o={...o,...n};if(typeof o.center==='number')o.center={x:o.center,z:null};if(n.area&&n.area!==data.area){data=X().mapData(o.area,o.npc);areaSel.value=data.area;zooms();}draw();},get opts(){return o;},get area(){return data.area;},toWorld:(a,b)=>({x:wx(a),z:wz(b)}),toScreen:(x,z)=>({x:px(x),y:py(z)}),canvas:cv,say};cv.npcMap=api;   // tests and the guide reach the map from its canvas
  return api;
 }
 root.VoidNPCMap={create,ZOOMS};
})(globalThis);
