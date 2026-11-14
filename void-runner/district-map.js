/* The map of NeoChinatown and The Darknet District, for the V1 device's Map app, and the waypoint it can set (docs/development/DISTRICT_MAP.md).
   Nothing here is drawn by hand: model(N) reads the game's own layout (neochinatown.js): the street rectangles, the building footprints, the walls, the places a
   player can interact with, the taxi stops and the District door. A new street, building or interaction added to the layout appears on the map by itself.
   PURE RULES first (model, guidance: run in Node tests), then the browser part (the canvas inside the device, and the small waypoint indicator on the HUD).
   Routes: the game has no pathfinding data, so a waypoint is a DIRECTION and a distance, and says so; a destination in the other environment is guided to the
   security vestibule first. Other players and NPCs are not shown (a layer exists for them, off, with nothing in it, until the game has rules for it). */
(function(root){
 'use strict';
 // Names for what the layout calls by id. Only naming: every item's position and size comes from the layout itself.
 const STREET_NAMES={avenue:'The Avenue',avenueWest:'The Avenue · west',avenueEast:'The Avenue · east',main:'Main Street',mainSouth:'Main Street · south',alley:'The Alley',road:'Access Road',passage:'Landing Pad Passage',pad:'Landing Pad'};
 const PLACE={board:['Landing pad · your ship','transit'],terminal:['Landing terminal','transit'],admin:['Admin counter','service'],'district-iris':['Iris','service'],'district-shop':['Shop','shop'],'district-bar':['Bar','shop'],
  'district-vr':['VR arcade','vr'],'district-vending':['Vending machines','shop'],'district-pod':['Sleeping pods','service'],'district-wardrobe':['Wardrobe','service'],'district-meeting':['Meeting room','service'],
  'district-stairs':['Stairs to the smoking terrace','service'],'district-stairs-down':['Stairs down to the District','service'],'district-scan':['Checkpoint scanner','entrance'],'club-bar':['Bar at the nightclub','shop']};
 const LAYERS=[['locations','LOCATIONS',true],['shops','SHOPS',true],['transit','TRANSIT',true],['missions','MISSIONS',true],['players','PLAYERS',false]];
 const KIND_LAYER={entrance:'locations',service:'locations',vr:'locations',street:'locations',shop:'shops',transit:'transit',mission:'missions',dev:'locations'};
 const title=t=>String(t||'').toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase());
 function model(N){
  const street=N.layout('street'),interior=N.layout('interior'),placeholder=new Set((N.districts||[]).filter(d=>d.placeholder).map(d=>d.id));
  const streets=Object.entries(N.streets||{}).filter(([id])=>!placeholder.has(id)).map(([id,r])=>({id,name:STREET_NAMES[id]||title(id),rect:r}));
  const rectOf=s=>({id:s.id||'',x0:s.position[0]-s.size[0]/2,x1:s.position[0]+s.size[0]/2,z0:s.position[2]-s.size[2]/2,z1:s.position[2]+s.size[2]/2});
  const walls={street:street.solids.map(rectOf),interior:interior.solids.map(rectOf)};
  const fp=N.footprints||{},buildings=[];if(fp.district)buildings.push({id:'district',name:'The Darknet District',rect:fp.district});if(fp.terrace)buildings.push({id:'terrace',name:'Smoking terrace',rect:fp.terrace});if(fp.club)buildings.push({id:'club',name:(root.VoidNightclub?.NAME||'Nightclub')+' · nightclub',rect:fp.club});
  const pois=[],seen=new Set(),streetIds=new Set(street.interactions.map(i=>i.id));
  const add=(i,area)=>{const key=/^district-pod(-\d+)?$/.test(i.id)?'district-pod':i.id;if(seen.has(key))return;seen.add(key);const def=PLACE[key]||PLACE[i.action];
   pois.push({id:key,name:def?def[0]:title(i.label||i.id),kind:def?def[1]:'service',area,x:i.position[0],z:i.position[2]});};
  for(const i of street.interactions)add(i,'street');for(const i of interior.interactions)if(!streetIds.has(i.id))add(i,'interior');
  const v=N.toWorld(0,23),out=N.toWorld(0,18.6);   // the vestibule's middle and the alley just outside the outer door, from the District's own plan
  pois.push({id:'entrance',name:'Darknet District entrance',kind:'entrance',area:'street',x:out[0],z:out[1]},{id:'vestibule',name:'Security vestibule',kind:'entrance',area:'both',x:v[0],z:v[1]});
  if(fp.club){const c=root.VoidNightclub||{},d=c.DOOR;if(d)pois.push({id:'club',name:(c.NAME||'Nightclub')+' · nightclub',kind:'shop',area:'street',x:d.x+2,z:d.z});}   // the club's street door
  for(const t of N.taxiZones||[])if(!placeholder.has(t.id))pois.push({id:'taxi-'+t.id,name:'Taxi stop · '+t.name,kind:'transit',area:'street',x:t.position[0],z:t.position[1]});   // stops at places that are not built are left out
  // Places that exist in the layout only as placeholders: shown to developers, never to players.
  for(const d of (N.districts||[]).filter(d=>d.placeholder))pois.push({id:'dev-'+d.id,name:d.name+' (not built)',kind:'dev',area:'street',x:d.center[0],z:d.center[1],dev:true,rect:d.rect});
  const xs=[],zs=[];for(const s of streets){xs.push(s.rect[0],s.rect[1]);zs.push(s.rect[2],s.rect[3]);}for(const b of buildings){xs.push(b.rect[0],b.rect[1]);zs.push(b.rect[2],b.rect[3]);}
  return {streets,buildings,walls,pois,vestibule:{x:v[0],z:v[1]},bounds:{x0:Math.min(...xs)-8,x1:Math.max(...xs)+8,z0:Math.min(...zs)-8,z1:Math.max(...zs)+8}};
 }
 /* Where to point a player who is at (x, z) facing yaw, in `area`, for a waypoint. Returns {name, distance, turn, via, arrived}: `turn` is how far to the right of
    straight ahead the target lies (radians, -PI..PI); `via` is true when the target is in the other environment and the pointer leads to the vestibule first. */
 function guidance(m,poi,me){
  if(!poi||!me)return null;const via=poi.area!=='both'&&poi.area!==me.area,t=via?m.vestibule:poi,dx=t.x-me.x,dz=t.z-me.z,distance=Math.hypot(dx,dz);
  let turn=Math.atan2(dx,dz)-me.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));
  return {name:poi.name,distance,turn,via,arrived:!via&&distance<3};
 }
 const visible=(m,layers,dev)=>m.pois.filter(p=>(dev||!p.dev)&&layers[KIND_LAYER[p.kind]||'locations']!==false);
 const api={model,guidance,visible,LAYERS,KIND_LAYER,PLACE,STREET_NAMES};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.VoidDistrictMap=api;
 if(typeof document==='undefined')return;

 // ---------------------------------------------------------------- browser ----------------------------------------------------------------
 const FLAG='deviceWaypoint',COLOR={entrance:'#58ffe1',service:'#9fd0ff',vr:'#c79bff',shop:'#ff3fb4',transit:'#ffb347',dev:'#7a8794',mission:'#ffe066'};
 const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let M=null,view=null,selected=null,layers=Object.fromEntries(LAYERS.map(l=>[l[0],l[2]])),host=null,cv=null,drag=null,pulse=0;
 const data=()=>M||(M=model(root.VoidNeoChinatown));
 const flags=()=>{try{return state?.story?.flags||null;}catch{return null;}};
 const me=()=>{try{if(typeof walker==='undefined'||!walker||walkingLocation?.id!=='neochinatown')return null;return {x:walker.x,z:walker.z,yaw:walker.yaw,area:walkingLocation.area==='interior'?'interior':'street'};}catch{return null;}};
 const isDev=()=>{try{return !!root.VoidDevTools?.authorized;}catch{return false;}};
 const waypoint=()=>{const id=flags()?.[FLAG];return typeof id==='string'?data().pois.find(p=>p.id===id&&(isDev()||!p.dev))||null:null;};
 function setWaypoint(id){const f=flags();if(!f)return false;const p=id&&data().pois.find(x=>x.id===id);if(p)f[FLAG]=p.id;else delete f[FLAG];chipTick();if(host)paintInfo();draw();return true;}
 const fit=()=>{const b=data().bounds,p=me();view={cx:p?p.x:(b.x0+b.x1)/2,cz:p?p.z:(b.z0+b.z1)/2,s:p?(p.area==='interior'?9:3.2):1.6};};
 const S=(x,z)=>[cv.width/2+(x-view.cx)*view.s,cv.height/2-(z-view.cz)*view.s];
 function draw(){
  if(!cv||!host||!host.isConnected)return;const g=cv.getContext('2d'),W=cv.width,H=cv.height,m=data(),p=me(),inside=p?.area==='interior';
  g.fillStyle='#03080d';g.fillRect(0,0,W,H);
  // fine grid, every 10 m (50 m lines brighter)
  const step=view.s<1.2?50:10;g.lineWidth=1;for(let x=Math.floor((view.cx-W/2/view.s)/step)*step;x<view.cx+W/2/view.s;x+=step){const a=S(x,0)[0];g.strokeStyle=x%50===0?'rgba(88,255,225,.13)':'rgba(88,255,225,.05)';g.beginPath();g.moveTo(a,0);g.lineTo(a,H);g.stroke();}
  for(let z=Math.floor((view.cz-H/2/view.s)/step)*step;z<view.cz+H/2/view.s;z+=step){const a=S(0,z)[1];g.strokeStyle=z%50===0?'rgba(88,255,225,.13)':'rgba(88,255,225,.05)';g.beginPath();g.moveTo(0,a);g.lineTo(W,a);g.stroke();}
  const rect=(r,fill,stroke)=>{const a=S(r[0],r[3]),b=S(r[1],r[2]);if(fill){g.fillStyle=fill;g.fillRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);}if(stroke){g.strokeStyle=stroke;g.strokeRect(a[0]+.5,a[1]+.5,b[0]-a[0]-1,b[1]-a[1]-1);}};
  if(isDev())for(const d of m.pois.filter(x=>x.dev&&x.rect)){g.setLineDash([6,6]);rect(d.rect,null,'rgba(122,135,148,.6)');g.setLineDash([]);}
  for(const s of m.streets)rect(s.rect,'rgba(40,74,92,.55)','rgba(88,255,225,.22)');
  for(const b of m.buildings)rect(b.rect,'rgba(97,238,233,.06)','rgba(97,238,233,.5)');
  // walls: of the environment the player is in (the other one is drawn faintly: it is real, but not where they are)
  for(const [area,list] of Object.entries(m.walls)){const here=(area==='interior')===!!inside;g.fillStyle=area==='interior'?(here?'rgba(97,238,233,.5)':'rgba(97,238,233,.14)'):(here?'rgba(120,200,220,.5)':'rgba(120,200,220,.2)');
   if(area==='interior'&&view.s<2.2)continue;for(const r of list){const a=S(r.x0,r.z1),b=S(r.x1,r.z0);g.fillRect(a[0],a[1],Math.max(1.5,b[0]-a[0]),Math.max(1.5,b[1]-a[1]));}}
  g.textAlign='center';g.textBaseline='middle';
  if(view.s>=1.1){g.font='600 '+Math.max(10,Math.min(15,view.s*4))+'px ui-monospace,Consolas,monospace';g.fillStyle='rgba(190,235,240,.55)';
   for(const s of m.streets){const w=(s.rect[1]-s.rect[0])*view.s,h=(s.rect[3]-s.rect[2])*view.s,c=S((s.rect[0]+s.rect[1])/2,(s.rect[2]+s.rect[3])/2);if(Math.max(w,h)<g.measureText(s.name).width+10)continue;
    g.save();g.translate(c[0],c[1]);if(h>w)g.rotate(-Math.PI/2);g.fillText(s.name.toUpperCase(),0,0);g.restore();}}
  const wp=waypoint(),shown=visible(m,layers,isDev());
  g.font='600 11px ui-monospace,Consolas,monospace';g.textAlign='left';
  for(const q of shown){const [x,y]=S(q.x,q.z);if(x<-20||y<-20||x>W+20||y>H+20)continue;const c=COLOR[q.kind]||'#9fd0ff',sel=q===selected,target=q===wp;
   g.strokeStyle=c;g.fillStyle=sel||target?c:'rgba(3,8,13,.9)';g.lineWidth=sel?2.5:1.5;g.beginPath();g.moveTo(x,y-6);g.lineTo(x+6,y);g.lineTo(x,y+6);g.lineTo(x-6,y);g.closePath();g.fill();g.stroke();
   if(target){g.strokeStyle='#ffe066';g.lineWidth=2;g.beginPath();g.arc(x,y,11+3*Math.sin(pulse),0,7);g.stroke();}
   if(sel||target||view.s>=4.5){g.fillStyle='rgba(3,8,13,.82)';const w=g.measureText(q.name).width+10;g.fillRect(x+10,y-9,w,18);g.fillStyle=sel||target?'#fff':'#cfe9ee';g.fillText(q.name,x+15,y+1);}}
  if(p){const [x,y]=S(p.x,p.z),fx=Math.sin(p.yaw),fy=-Math.cos(p.yaw);
   if(wp){const t=wp.area!=='both'&&wp.area!==p.area?m.vestibule:wp,[tx,ty]=S(t.x,t.z);g.setLineDash([5,7]);g.strokeStyle='rgba(255,224,102,.7)';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y);g.lineTo(tx,ty);g.stroke();g.setLineDash([]);}
   g.fillStyle='rgba(88,255,225,.16)';g.beginPath();g.moveTo(x,y);g.arc(x,y,34,Math.atan2(fy,fx)-.5,Math.atan2(fy,fx)+.5);g.closePath();g.fill();
   g.fillStyle='#58ffe1';g.strokeStyle='#03080d';g.lineWidth=1.5;g.beginPath();g.moveTo(x+fx*12,y+fy*12);g.lineTo(x-fy*7-fx*6,y+fx*7-fy*6);g.lineTo(x+fy*7-fx*6,y-fx*7-fy*6);g.closePath();g.fill();g.stroke();}
  // north and scale
  g.fillStyle='rgba(190,235,240,.7)';g.textAlign='center';g.font='700 11px ui-monospace,Consolas,monospace';g.fillText('N',W-18,16);g.beginPath();g.moveTo(W-18,24);g.lineTo(W-22,34);g.lineTo(W-14,34);g.closePath();g.fill();
  const metres=[5,10,25,50,100,250].find(v=>v*view.s>=60)||500;g.fillRect(12,H-14,metres*view.s,2);g.textAlign='left';g.fillText(metres+' m',12,H-24);
 }
 function paintInfo(){
  const el=host?.querySelector('[data-map-info]');if(!el)return;const p=me(),wp=waypoint(),q=selected;
  if(!q){el.innerHTML='<div class="pd-note">'+(wp?'Waypoint: <b>'+esc(wp.name)+'</b>. ':'')+'Select a marker or a place below. Drag to move the map; scroll or use + and − to zoom.</div>'+(wp?'<button type="button" data-map="clear">CLEAR WAYPOINT</button>':'');return;}
  const gd=p?guidance(data(),q,p):null,isWp=wp===q;
  el.innerHTML='<div class="dm-card"><b>'+esc(q.name)+'</b><span>'+esc(q.kind==='dev'?'DEVELOPMENT ONLY':q.area==='interior'?'INSIDE THE DARKNET DISTRICT':q.area==='both'?'BETWEEN THE STREET AND THE DISTRICT':'NEOCHINATOWN')+(gd?' · '+Math.round(gd.distance)+' m'+(gd.via?' to the security vestibule':''):'')+'</span>'
   +'<p>Direction only. This model has no route data: follow the pointer and find your own way around walls.'+(gd?.via?' The destination is on the other side of the security checkpoint.':'')+'</p>'
   +'<div><button type="button" data-map="'+(isWp?'clear':'set')+'">'+(isWp?'CLEAR WAYPOINT':'SET WAYPOINT')+'</button><button type="button" data-map="deselect">CLOSE</button></div></div>';
 }
 function paintList(){const el=host?.querySelector('[data-map-list]');if(!el)return;const shown=visible(data(),layers,isDev());
  el.innerHTML='<h2>PLACES</h2>'+(shown.length?shown.map(q=>'<button type="button" class="dm-row" data-map="pick:'+esc(q.id)+'"><i style="background:'+(COLOR[q.kind]||'#9fd0ff')+'"></i>'+esc(q.name)+'<span>'+(q.area==='interior'?'DISTRICT':q.area==='both'?'CHECKPOINT':'STREET')+'</span></button>').join(''):'<div class="pd-note">Nothing on the layers that are switched on.</div>');}
 function paintLayers(){const el=host?.querySelector('[data-map-layers]');if(!el)return;el.innerHTML=LAYERS.map(([id,label])=>'<button type="button" data-map="layer:'+id+'" aria-pressed="'+(layers[id]!==false)+'"'+(id==='players'?' disabled title="Other players are not shown on the map."':'')+'>'+label+'</button>').join('');}
 const zoom=(k,px,py)=>{const s=Math.max(.7,Math.min(22,view.s*k));if(px!==undefined){const wx=view.cx+(px-cv.width/2)/view.s,wz=view.cz-(py-cv.height/2)/view.s;view.cx=wx-(px-cv.width/2)/s;view.cz=wz+(py-cv.height/2)/s;}view.s=s;draw();};
 const local=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height];};
 /* mount(element): build the map inside the device's Map app. Safe to call again after the device redraws its page; the view, layers and selection are kept. */
 function mount(el){
  if(!root.VoidNeoChinatown||!el)return false;host=el;if(!view)fit();
  el.innerHTML='<div class="dm-bar"><button type="button" data-map="in" aria-label="Zoom in">+</button><button type="button" data-map="out" aria-label="Zoom out">−</button><button type="button" data-map="me">MY POSITION</button><button type="button" data-map="all">WHOLE CITY</button></div>'
   +'<canvas class="pd-map dm-canvas" width="800" height="560" tabindex="0" aria-label="Map of NeoChinatown and The Darknet District. Use the list below to choose a place."></canvas><div class="dm-layers" data-map-layers role="group" aria-label="Map layers"></div><div data-map-info></div><div data-map-hail></div><div data-map-list></div>';
  cv=el.querySelector('canvas');
  cv.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();const [x,y]=local(e);zoom(e.deltaY<0?1.2:1/1.2,x,y);},{passive:false});
  cv.addEventListener('pointerdown',e=>{const [x,y]=local(e);drag={x,y,cx:view.cx,cz:view.cz,moved:false};cv.setPointerCapture?.(e.pointerId);});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const [x,y]=local(e);if(Math.hypot(x-drag.x,y-drag.y)>4)drag.moved=true;if(drag.moved){view.cx=drag.cx-(x-drag.x)/view.s;view.cz=drag.cz+(y-drag.y)/view.s;draw();}});
  const up=e=>{if(!drag)return;const d=drag;drag=null;if(d.moved)return;const [x,y]=local(e);let best=null,bd=16;for(const q of visible(data(),layers,isDev())){const [sx,sy]=S(q.x,q.z),dd=Math.hypot(sx-x,sy-y);if(dd<bd){bd=dd;best=q;}}selected=best;paintInfo();draw();};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',()=>{drag=null;});
  cv.addEventListener('keydown',e=>{const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];if(k){e.preventDefault();e.stopPropagation();view.cx+=k[0]*40/view.s;view.cz+=k[1]*40/view.s;draw();}else if(e.key==='+'||e.key==='='){e.stopPropagation();zoom(1.25);}else if(e.key==='-'){e.stopPropagation();zoom(.8);}});
  el.addEventListener('click',e=>{const b=e.target.closest('[data-map]');if(!b||b.disabled)return;const a=b.dataset.map;
   if(a==='in')zoom(1.35);else if(a==='out')zoom(1/1.35);else if(a==='me'){const p=me();if(p){view.cx=p.x;view.cz=p.z;view.s=Math.max(view.s,p.area==='interior'?9:3.2);draw();}}
   else if(a==='all'){const bb=data().bounds;view={cx:(bb.x0+bb.x1)/2,cz:(bb.z0+bb.z1)/2,s:Math.min(cv.width/(bb.x1-bb.x0),cv.height/(bb.z1-bb.z0))};draw();}
   else if(a.startsWith('layer:')){const id=a.slice(6);layers[id]=layers[id]===false;if(selected&&!visible(data(),layers,isDev()).includes(selected))selected=null;paintLayers();paintList();paintInfo();draw();}
   else if(a.startsWith('pick:')){selected=data().pois.find(q=>q.id===a.slice(5))||null;if(selected){view.cx=selected.x;view.cz=selected.z;view.s=Math.max(view.s,selected.area==='interior'?9:3.2);}paintInfo();draw();host.querySelector('[data-map-info]')?.scrollIntoView?.({block:'nearest'});}
   else if(a==='set'&&selected){setWaypoint(selected.id);}else if(a==='clear'){setWaypoint(null);}else if(a==='deselect'){selected=null;paintInfo();draw();}
   else if(a.startsWith('hail:')){const ok=root.VoidRoadTaxi?.hail?.(a.slice(5));if(ok)paintHail();}
   else if(a==='hail-cancel'){root.VoidRoadTaxi?.cancel?.();paintHail();}});
  paintLayers();paintInfo();paintHail();paintList();draw();return true;
 }
 function taxiCtx(){
  let player=null,area='street',onFoot=false;
  try{
   if(typeof walker!=='undefined'&&walker)player=[walker.x,walker.z];
   if(typeof walkingLocation!=='undefined'&&walkingLocation&&walker)area=walkingLocation.area==='interior'?'district':(root.VoidNeoChinatown?.zone?.({x:walker.x,z:walker.z}).area||'street');
   onFoot=typeof mode!=='undefined'&&mode==='walking';
  }catch{}
  return {onFoot,area,player,combat:!!root.VoidFlightSkirmish?.active,busy:!!root.VoidGraphics?.busy,trip:!!(root.VoidRoadTaxi?.active||root.VoidTaxi?.trip)};
 }
 let hailHtml='';
 function paintHail(){
  const el=host?.querySelector('[data-map-hail]');if(!el)return;
  const Rules=root.VoidRoadTaxiRules;if(!Rules){if(hailHtml){hailHtml='';el.innerHTML='';}return;}
  const ctx=taxiCtx(),a=Rules.availability(typeof state!=='undefined'?state:null,ctx),list=ctx.player?Rules.destinations(typeof state!=='undefined'?state:null,ctx):[],st=root.VoidRoadTaxi?.status?.();
  let html='<h2>STREET TAXIS</h2>';
  if(st)html+='<div class="pd-note">'+esc(st.label)+' · '+(st.phase==='waiting'?'waiting, door open':st.phase==='arrived'?'arrived':'on the way')+' · '+st.distance+' m · '+st.fare+' CR</div>'+(st.canCancel?'<button type="button" data-map="hail-cancel">CANCEL TAXI</button>':'');
  else html+=(a.ok?'<div class="pd-note">'+esc(a.network)+'. A cab drives the roads to you, then to the stop. The fare is paid when you board.</div>':'<div class="pd-note">'+esc(a.reason)+'</div>')
   +(list.length?list.map(d=>'<button type="button" data-map="hail:'+esc(d.id)+'"'+(d.ok&&a.ok?'':' disabled')+'>CALL TAXI · '+esc(d.label)+' · '+d.fare+' CR</button>').join(''):'<div class="pd-note">No street stops are registered.</div>');
  if(html!==hailHtml){hailHtml=html;el.innerHTML=html;}
 }
 let lastDraw=0;
 function refresh(){const t=performance.now();if(t-lastDraw<200||!host||!host.isConnected||drag)return;lastDraw=t;pulse+=.9;draw();paintHail();}   // five times a second is plenty for a position marker

 // ---- The waypoint indicator on the HUD: a pointer, the name and the distance. Updated four times a second, only while walking. ----
 const css=document.createElement('style');css.textContent='#waypoint-chip{position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:40;display:flex;align-items:center;gap:10px;padding:5px 12px 5px 8px;border:1px solid rgba(255,224,102,.5);background:rgba(3,9,15,.78);color:#fff3c4;font:11px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.08em;pointer-events:none;white-space:nowrap}#waypoint-chip[hidden]{display:none}#waypoint-chip i{display:block;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:14px solid #ffe066;transition:transform .2s linear}#waypoint-chip small{opacity:.7;font-size:10px}@media (prefers-reduced-motion:reduce){#waypoint-chip i{transition:none}}'
  +'#personal-device .dm-bar,#personal-device .dm-layers{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}#personal-device .dm-layers{margin:8px 0}#personal-device .dm-layers button{font-size:10px;padding:4px 8px;opacity:.6}#personal-device .dm-layers button[aria-pressed="true"]{opacity:1;border-color:#58ffe1}#personal-device .dm-layers button:disabled{opacity:.3}'
  +'#personal-device canvas.dm-canvas{position:static;inset:auto;display:block;width:100%;height:auto;max-width:100%;aspect-ratio:10/7;cursor:grab;touch-action:none}#personal-device canvas.dm-canvas:active{cursor:grabbing}#personal-device .dm-card{padding:10px;border:1px solid rgba(255,224,102,.45);background:rgba(255,224,102,.05)}#personal-device .dm-card b{display:block;font-size:14px;color:#fff}#personal-device .dm-card span{display:block;font-size:10px;letter-spacing:.12em;opacity:.75;margin:2px 0 6px}#personal-device .dm-card p{margin:0 0 8px;font-size:11px;opacity:.8}#personal-device .dm-card div{display:flex;gap:6px}'
  +'#personal-device .dm-row{display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:6px 8px;margin:0 0 3px;font-size:12px}#personal-device .dm-row i{width:8px;height:8px;transform:rotate(45deg);flex:none}#personal-device .dm-row span{margin-left:auto;font-size:9px;letter-spacing:.14em;opacity:.6}'
  +'#personal-device [data-map-hail]{display:flex;flex-direction:column;gap:6px;margin:8px 0}#personal-device [data-map-hail] h2{margin:0}#personal-device [data-map-hail] button{text-align:left}';
 document.head.appendChild(css);
 const chip=document.createElement('div');chip.id='waypoint-chip';chip.hidden=true;chip.setAttribute('role','status');chip.innerHTML='<i aria-hidden="true"></i><span></span>';document.body.appendChild(chip);let chipText='';
 function chipTick(){
  let p=null,wp=null;try{if(typeof mode!=='undefined'&&mode==='walking'){p=me();wp=p&&waypoint();}}catch{}
  if(!p||!wp){if(!chip.hidden)chip.hidden=true;return;}
  const gd=guidance(data(),wp,p);
  if(gd.arrived){setWaypoint(null);try{announce('You have arrived: '+wp.name+'.');}catch{}return;}
  const text=wp.name.toUpperCase()+' · '+Math.round(gd.distance)+' M'+(gd.via?' · VIA THE SECURITY VESTIBULE':'');
  chip.firstChild.style.transform='rotate('+gd.turn.toFixed(2)+'rad)';if(text!==chipText){chipText=text;chip.lastChild.innerHTML=esc(text)+' <small>DIRECTION ONLY</small>';}
  if(chip.hidden)chip.hidden=false;
 }
 setInterval(chipTick,250);
 Object.assign(api,{mount,refresh,setWaypoint});
 Object.defineProperties(api,{waypoint:{get:()=>waypoint()},selected:{get:()=>selected},view:{get:()=>view&&{...view}},data:{get:()=>data()}});   // live values, read when asked
})(typeof globalThis!=='undefined'?globalThis:this);
