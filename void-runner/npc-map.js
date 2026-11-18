/* DEVELOPER TOOLS: the top-down map of The Avenue (browser only; loaded with the Mission Editor for a confirmed developer). A plain 2D canvas drawn from the street's own
   layout data (npc-paths.js mapData: the pavements, the road, the gates, the ledges, the taxi posts, the shopfront names, the street pair's stretch). No new dependencies.
   Used by the Mission Editor ("Giver waits at": click to place the spot) and by Developer Tools > NPCs (drag an NPC to a spot, turn the facing handle, place and drag the
   points of a route). North is up; x is east. The walkable area of the chosen NPC is tinted green; a spot or a leg the game would refuse is drawn red.
   create(opts) -> {el, set(opts), draw(), toWorld(px, py)}. opts: {npc, markers:[{id, x, z, yaw, color, label, drag, facing, ghost}], route:[{x, z, label, bad}], routeBad:[i],
   onPick(x, z), onDrag(id, x, z), onFacing(id, yaw), onPoint(i, x, z), selected, height}. */
(function(root){
 'use strict';
 const X=()=>root.VoidNPCPaths;
 const ZOOMS=[['all','Whole Avenue',null],['pair','Reverie and Lace’s stretch',[80,125]],['near','Close up',null]];
 function create(opts={}){
  let o={height:230,zoom:'pair',center:null,...opts};const data=X().mapData();
  const wrap=document.createElement('div');wrap.className='npcmap';wrap.dataset.npcMap='1';
  const bar=document.createElement('div');bar.className='npcmap-bar';
  const zoomSel=document.createElement('select');zoomSel.setAttribute('aria-label','Map zoom');for(const [id,name] of ZOOMS)zoomSel.append(new Option(name,id));zoomSel.value=o.zoom;
  const pan=document.createElement('input');pan.type='range';pan.min=String(data.view.x0);pan.max=String(data.view.x1);pan.step='1';pan.setAttribute('aria-label','Move the map east or west');
  const tip=document.createElement('span');tip.className='me-small';tip.textContent='Click the green pavement to place. Drag a marker to move it; drag its small round handle to turn which way she faces.';
  bar.append(zoomSel,pan,tip);
  const cv=document.createElement('canvas');cv.className='npcmap-canvas';cv.setAttribute('role','img');cv.setAttribute('aria-label','Map of The Avenue');cv.tabIndex=0;
  const read=document.createElement('div');read.className='me-small npcmap-read';read.setAttribute('aria-live','polite');
  wrap.append(bar,cv,read);
  let W=900,H=o.height,k=6,vx0=0,vz1=-3,drag=null,hover=null;
  function span(){const z=o.zoom,f=ZOOMS.find(x=>x[0]===z);if(z==='all')return [data.view.x0,data.view.x1];if(z==='near'){const c=o.center??76;return [c-15,c+15];}const c=o.center;if(c==null)return f[2];const w=f[2][1]-f[2][0];return [c-w/2,c+w/2];}
  function layout(){W=Math.max(320,Math.floor((wrap.clientWidth||900)-2));const [a,b]=span();k=W/(b-a);vx0=a;H=Math.max(o.height,Math.round(19*k*.98));H=Math.min(H,Math.max(o.height,420));const zs=(H/k);vz1=-12.5+zs/2;
   const dpr=root.devicePixelRatio||1;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';pan.value=String(Math.round((a+b)/2));pan.hidden=o.zoom==='all';}
  const px=x=>(x-vx0)*k,py=z=>(vz1-z)*k,wx=p=>p/k+vx0,wz=p=>vz1-p/k;
  const rect=(c,r,fill,stroke)=>{c.beginPath();c.rect(px(r.x0),py(r.z1),(r.x1-r.x0)*k,(r.z1-r.z0)*k);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
  function draw(){layout();const c=cv.getContext('2d'),dpr=root.devicePixelRatio||1;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);c.fillStyle='#0b0d12';c.fillRect(0,0,W,H);
   // buildings (north and south of the street)
   c.fillStyle='#1b1e27';c.fillRect(0,0,W,py(data.street.z1));c.fillRect(0,py(data.street.z0),W,H-py(data.street.z0));
   rect(c,data.road,'#262a33');for(const p of data.pavements)rect(c,p,'#3d4352');rect(c,data.gap,'#3d4352');
   // the road's centre line
   c.strokeStyle='#8a7b3a';c.setLineDash([10,10]);c.beginPath();c.moveTo(px(data.road.x0),py(-12.5));c.lineTo(px(data.road.x1),py(-12.5));c.stroke();c.setLineDash([]);
   // where the chosen NPC can walk
   const M=o.npc&&X().MOVABLE[o.npc];if(M){const A=X().AREAS[M.area];rect(c,A,'rgba(70,200,120,.22)','rgba(90,230,140,.8)');}
   for(const g of data.gates){const [x0,x1,z0,z1]=g.rect;rect(c,{x0,x1,z0,z1},'rgba(200,60,70,.35)','#d04a55');c.fillStyle='#ffb3b9';c.font='11px ui-monospace,monospace';c.fillText(g.name,px(x0)+2,py((z0+z1)/2));}
   if(data.stretch){c.strokeStyle='rgba(255,190,120,.7)';c.setLineDash([4,4]);c.beginPath();c.moveTo(px(data.stretch.x0),py(data.stretch.z));c.lineTo(px(data.stretch.x1),py(data.stretch.z));c.stroke();c.setLineDash([]);
    if(k>4){c.fillStyle='rgba(255,190,120,.9)';c.font='10px ui-monospace,monospace';c.fillText('their usual walk',px(data.stretch.x0)+2,py(data.stretch.z)+11);}}
   for(const l of data.ledges){c.fillStyle='#8a6a48';c.fillRect(px(l.x-l.w/2),py(l.z+l.d/2),l.w*k,Math.max(3,l.d*k));if(k>8){c.fillStyle='#d8b48a';c.font='10px ui-monospace,monospace';c.fillText('ledge',px(l.x-l.w/2),py(l.z+l.d/2)-2);}}
   for(const ob of data.obstacles||[]){c.fillStyle='rgba(255,170,60,.55)';c.fillRect(px(ob.x0),py(ob.z1),(ob.x1-ob.x0)*k,Math.max(3,(ob.z1-ob.z0)*k));}   // ad screens' stands and taxi poles on the pavement
   for(const p of data.posts){c.fillStyle='#ffd34d';c.beginPath();c.arc(px(p.x),py(p.z),Math.max(3,.25*k),0,7);c.fill();if(k>4){c.font='10px ui-monospace,monospace';c.fillText('taxi',px(p.x)+5,py(p.z)+4);}}
   c.font=(k>8?12:10)+'px ui-monospace,monospace';for(const s of data.shops){const x=px(s.x);if(x<-40||x>W+10)continue;c.fillStyle='#9fb4ff';c.fillText(s.name,x-c.measureText(s.name).width/2,s.side==='n'?py(data.street.z1)-4:py(data.street.z0)+12);}
   c.fillStyle='#6c7280';c.font='11px ui-monospace,monospace';c.fillText('N ↑',W-30,14);
   // the route
   const R=o.route||[];if(R.length){c.lineWidth=2;for(let i=0;i<R.length;i++){const a=R[i],b=R[(i+1)%R.length];if(R.length<2)break;c.strokeStyle=(o.routeBad||[]).includes(i)?'#ff4d5e':'rgba(120,210,255,.9)';c.setLineDash(i===R.length-1?[6,5]:[]);c.beginPath();c.moveTo(px(a.x),py(a.z));c.lineTo(px(b.x),py(b.z));c.stroke();}c.setLineDash([]);c.lineWidth=1;
    R.forEach((p,i)=>{const r=Math.max(7,.35*k);c.fillStyle=p.bad?'#ff4d5e':'#1aa3e0';c.beginPath();c.arc(px(p.x),py(p.z),r,0,7);c.fill();c.fillStyle='#fff';c.font='bold 11px ui-monospace,monospace';const t=String(i+1);c.fillText(t,px(p.x)-c.measureText(t).width/2,py(p.z)+4);});}
   // the markers (people)
   for(const m of o.markers||[]){const x=px(m.x),y=py(m.z),r=Math.max(7,.32*k);c.globalAlpha=m.ghost?.45:1;c.fillStyle=m.bad?'#ff4d5e':m.color||'#ff8ad8';c.beginPath();c.arc(x,y,r,0,7);c.fill();c.strokeStyle=o.selected===m.id?'#fff':'#000';c.lineWidth=o.selected===m.id?2:1;c.stroke();c.lineWidth=1;
    if(Number.isFinite(m.yaw)){const hx=x+Math.sin(m.yaw)*Math.max(18,1.3*k),hy=y-Math.cos(m.yaw)*Math.max(18,1.3*k);c.strokeStyle='#fff';c.beginPath();c.moveTo(x,y);c.lineTo(hx,hy);c.stroke();if(m.facing){c.fillStyle='#fff';c.beginPath();c.arc(hx,hy,5,0,7);c.fill();}}
    if(m.label){c.font='11px ui-monospace,monospace';c.fillStyle='#fff';c.fillText(m.label,x+r+3,y-r);}c.globalAlpha=1;}
  }
  const at=e=>{const b=cv.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top};};
  function hit(p){for(const m of [...(o.markers||[])].reverse()){if(!m.drag)continue;if(Number.isFinite(m.yaw)&&m.facing){const hx=px(m.x)+Math.sin(m.yaw)*Math.max(18,1.3*k),hy=py(m.z)-Math.cos(m.yaw)*Math.max(18,1.3*k);if(Math.hypot(p.x-hx,p.y-hy)<8)return {kind:'facing',m};}
    if(Math.hypot(p.x-px(m.x),p.y-py(m.z))<Math.max(9,.4*k))return {kind:'marker',m};}
   if(o.onPoint)for(let i=(o.route||[]).length-1;i>=0;i--){const q=o.route[i];if(Math.hypot(p.x-px(q.x),p.y-py(q.z))<Math.max(9,.4*k))return {kind:'point',i};}return null;}
  const r1=v=>Math.round(v*10)/10;
  cv.onpointerdown=e=>{const p=at(e),h=hit(p);if(h){drag={...h,moved:false};cv.setPointerCapture(e.pointerId);e.preventDefault();return;}
   if(o.onPick){o.onPick(r1(wx(p.x)),r1(wz(p.y)));}};
  cv.onpointermove=e=>{const p=at(e);read.textContent='x '+wx(p.x).toFixed(1)+' · z '+wz(p.y).toFixed(1)+' m';if(!drag)return;drag.moved=true;const x=r1(wx(p.x)),z=r1(wz(p.y));
   if(drag.kind==='marker'){drag.m.x=x;drag.m.z=z;}else if(drag.kind==='facing'){drag.m.yaw=Math.round(Math.atan2(x-drag.m.x,z-drag.m.z)*100)/100;}else if(drag.kind==='point'){o.route[drag.i].x=x;o.route[drag.i].z=z;}draw();};
  cv.onpointerup=e=>{if(!drag)return;const d=drag;drag=null;try{cv.releasePointerCapture(e.pointerId);}catch{}if(!d.moved)return;if(d.kind==='marker')o.onDrag?.(d.m.id,d.m.x,d.m.z);else if(d.kind==='facing')o.onFacing?.(d.m.id,d.m.yaw);else if(d.kind==='point')o.onPoint?.(d.i,o.route[d.i].x,o.route[d.i].z);};
  zoomSel.onchange=()=>{o.zoom=zoomSel.value;if(o.zoom==='near'&&o.center==null){const m=(o.markers||[])[0];o.center=m?m.x:100;}draw();};
  pan.oninput=()=>{o.center=Number(pan.value);draw();};
  const ro=root.ResizeObserver?new ResizeObserver(()=>draw()):null;ro?.observe(wrap);
  setTimeout(draw,0);
  const api={el:wrap,draw,set(n){o={...o,...n};draw();},get opts(){return o;},toWorld:(a,b)=>({x:wx(a),z:wz(b)}),toScreen:(x,z)=>({x:px(x),y:py(z)}),canvas:cv};cv.npcMap=api;   // tests and the guide reach the map from its canvas
  return api;
 }
 root.VoidNPCMap={create,ZOOMS};
})(globalThis);
