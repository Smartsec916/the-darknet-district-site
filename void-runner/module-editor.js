/* MODULAR INTERIORS in the Mission Editor (browser only; loaded on demand with the editor, dev-tools.js editorScripts). modules.js has the rules; this draws the
   "Location" card: Add a location > category > module (it joins at a free door, so it fits), a top-down plan per floor (click a module to select it; move, turn, remove),
   the street door, the entrance, connections (doors that lead elsewhere: a hallway door to an apartment), the elevator's floors, locked doors (until hacked), lights and
   screens at the start, items, and the problems in plain words. Used by the Form view (mission-editor.js aptPanel) and the Blocks view (mission-blocks-view.js).
   card({m, a, k, ed, doorSelect, jump}) -> element. ed(fn(mission), redraw) edits the draft mission (UNDO, the server copy and Guide me work as for every edit). */
(function(root){
 'use strict';
 const M=()=>root.VoidModules,X=()=>root.VoidApartments;
 const el=(tag,text,cls,attrs)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;if(cls)e.className=cls;for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
 const btn=(text,fn,cls,attrs)=>{const b=el('button',text,cls,{type:'button',...(attrs||{})});b.onclick=e=>{e.preventDefault();fn(e);};return b;};
 const hint=t=>el('span',t,'me-help');
 if(typeof document!=='undefined'&&!document.getElementById('mod-editor-css')){const st=document.createElement('style');st.id='mod-editor-css';st.textContent='.mod-card canvas.mod-plan{position:static!important;inset:auto!important;z-index:auto!important;width:300px!important;height:240px!important;max-width:100%;flex:0 0 auto;border:1px solid #2a3440;border-radius:4px;cursor:pointer;display:block}.mod-plan-row{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}.mod-side{flex:1 1 240px;min-width:220px}.mod-card .on{outline:2px solid #ffb347}.mod-ok{color:#7fe0a8}.mod-pick select{max-width:260px}.mod-dpick{display:contents}.mod-dmap{order:99;flex:1 1 100%;margin:4px 0 6px;padding:6px;border:1px solid #2a3440;border-radius:4px;background:#0e1218}.mod-dmap canvas.mod-dmap-cv{position:static!important;inset:auto!important;z-index:auto!important;display:block;width:100%!important;max-width:640px;height:auto!important;border-radius:3px}.mod-dmap-tip{min-height:1.3em;color:#ffd9a0}.mod-dmap-key{line-height:1.5}.mod-sum{color:#cfe3ef}';document.head.append(st);}
 const ui=new Map();   // per location: {sel (module id), floor}
 const stateOf=(m,a)=>{const k=m.id+'/'+a.id;if(!ui.has(k))ui.set(k,{sel:null,floor:0});return ui.get(k);};
 const catName=id=>(M().CATS.find(c=>c.id===id)||{}).name||id;
 /* The module picker: category, then module, then (optional) the free door it joins. on(type, to) */
 function picker(loc,on,attrs,suggest){const box=el('div','','me-row mod-pick',attrs||{}),cat=el('select','','',{'aria-label':'Category','data-mod-cat':'1'}),typ=el('select','','',{'aria-label':'Module','data-mod-type':'1'}),to=el('select','','',{'aria-label':'Joins at','data-mod-to':'1'});
  for(const c of M().CATS)if(M().TYPE_IDS.some(id=>M().TYPES[id].cat===c.id)||(!loc&&(root.VoidCultRoom?.FEED_ROOMS||[]).some(r=>r.cat===c.id)))cat.append(new Option(c.name,c.id));/* an empty category is not offered */const feedNote=v=>v&&v.startsWith('feed:')?((root.VoidCultRoom?.FEED_ROOMS||[]).find(r=>'feed:'+r.id===v)||{}).note||'':'';
  const fill=()=>{typ.innerHTML='';let ug=null;for(const id of M().TYPE_IDS){const t=M().TYPES[id];if(t.cat!==cat.value)continue;if(t.underground){if(!ug){ug=document.createElement('optgroup');ug.label='Underground';}ug.append(new Option(t.name,id));}else typ.append(new Option(t.name,id));}if(ug)typ.append(ug);/* underground pieces in their own group */if(!loc)for(const r of root.VoidCultRoom?.FEED_ROOMS||[])if(r.cat===cat.value)typ.append(new Option(r.name,'feed:'+r.id));if(suggest){const o=[...typ.options].find(x=>((M().TYPES[x.value]||{}).legacy||{}).style===suggest);if(o)typ.value=o.value;}note.textContent=(M().TYPES[typ.value]||{}).note||feedNote(typ.value);fillTo();};   // camera-feed-only rooms (cult-room.js) only for a new location
  const fillTo=()=>{to.innerHTML='';const t=M().TYPES[typ.value];to.append(new Option(loc&&loc.modules&&loc.modules.length?'joins at: the first free door that fits':'(the first module)',''));
   if(loc&&loc.modules){const an=M().analyse(loc);for(const f of M().freeSockets(loc)){if(t&&t.portal!==f.portal&&!(t&&t.portal&&!f.portal))continue;to.append(new Option('joins at: '+doorLabel(an,f.ref)+' of '+modLabel(an,f.mod)+' ('+f.ref+')',f.ref));}}};
  const note=el('span','','me-help');cat.onchange=fill;typ.onchange=()=>{note.textContent=(M().TYPES[typ.value]||{}).note||feedNote(typ.value);fillTo();};fill();
  box.append(el('b','Add'),cat,typ,to,btn('+ ADD',()=>on(typ.value,to.value||null),'',{'data-mod-add':'1'}),note);if(loc&&loc.modules&&loc.modules.length)box.append(hint('“Joins at” is the free door the new module is fixed to. A room, an office or a hallway is put side by side with that door, on the grid. A housing apartment or hallway is joined through a connection instead: a door that leads elsewhere (a short fade), shown on the plan as a dashed line.'));return box;}
 /* A new location in a mission (Add a location > category > module). Housing: the apartment with its hallway, linked. */
 function create(m,type,ed,note){if(String(type).startsWith('feed:')){const CR=root.VoidCultRoom;if(!CR)return;const r=CR.addFeed(m,type.slice(5));ed(x=>{x.feeds=r.feeds;},true);note&&note('Camera feed “'+r.id+'” added: the Blackrock cult room, camera feed only (not walkable). Add a “Hack the access point” step and choose this camera feed there; its scene is below.');return;}   // a camera-feed-only room
  const ids=new Set((m.apartments||[]).map(a=>a.id));let n=1;while(ids.has('l'+n))n++;const id='l'+n;const t=M().TYPES[type];
  let loc={id,door:'',modules:[]};if(t.legacy&&t.legacy.part==='flat'){loc=M().addModule(loc,'hall-'+t.legacy.style).loc;}const r=M().addModule(loc,type);if(!r.ok){note&&note(r.why);return;}
  ed(x=>{x.apartments=[...(x.apartments||[]),r.loc];},true);note&&note('Location “'+id+'” added: '+t.name+'. Choose its street door, then add more modules (they join at a free door).');}
 /* THE STREET-DOOR MAP (the owner, 20 Nov 2026: "when I'm selecting a number it should show me the door numbers on the street so I'm not blindly picking a door"): beside a
    street-door list, a small top-down map of one part of town (npc-paths.js mapData: its roads, pavements and buildings) with every door the list offers as a numbered
    marker at its real place: coloured by the building's own style (luxury violet, normal blue, rundown tan, the Outskirts' containers rust / green), offices a square,
    shops' back entrances a diamond; a door another location of this mission already uses is grey; the chosen door ringed white. Hover: "No. 204, Main Street — rundown
    apartment building". A click chooses it (the list follows). doorPick(sel, {used:{doorId: 'location l2'}, key}) -> an element holding the list, a MAP button and the map. */
 const QN={avenue:'The Avenue',oldtown:'Old Town','far-south':'Far South',port:'The Port',outskirts:'The Outskirts',corporate:'Corporate District',district:'District interior',milked:'Milked Studio',underground:'The Underground',temple:'Zen Zephyr Temple'};
 const mapUi=new Map();   // per door list (its key): {open, area, zoom, cx}
 function doorKind(d){const f=d.family||'city';if(f==='office')return 'office entrance';if(f==='commercial')return 'shop back entrance';if(f==='container')return 'container home in The Outskirts ('+(d.style==='container-regular'?'regular':'rundown')+')';return d.style+' apartment building';}
 function doorTitle(d){return d.name.replace(/ \((offices|shop)\)$/,'')+' — '+doorKind(d);}
 function doorMap(sel,opts={}){const A=X();if(!A||!A.doors)return null;const ids=new Set([...sel.options].map(o=>o.value).filter(Boolean)),list=A.doors().filter(d=>ids.has(d.id)),used=opts.used||{},S=mapUi.get(opts.key)||{};
  const qs=Object.keys(QN).filter(q=>opts.allAreas||list.some(d=>d.quarter===q));if(!qs.length)return null;const cur=A.door(sel.value);if(!S.area||!qs.includes(S.area))S.area=cur&&qs.includes(cur.quarter)?cur.quarter:qs[0];if(opts.key)mapUi.set(opts.key,S);
  const wrap=el('div','','mod-dmap',{'data-door-map':opts.key||'1'}),bar=el('div','','me-row'),area=el('select','','',{'aria-label':'Which part of town the map shows','data-door-map-area':'1'});for(const q of qs)area.append(new Option(QN[q]+' ('+list.filter(d=>d.quarter===q).length+' doors)',q));area.value=S.area;
  const zoom=el('select','','',{'aria-label':'Map zoom','data-door-map-zoom':'1'});zoom.append(new Option('Whole area','all'),new Option('Close up','near'));zoom.value=S.zoom||'all';
  const tip=el('div','Click a numbered door to choose it. Hover a door to see what it is.','me-small mod-dmap-tip',{'data-door-map-tip':'1','aria-live':'polite'});
  const key=el('div','','me-small mod-dmap-key');
  for(const {label,colors} of Object.values(A.entranceLegend)){
   const item=el('span','','',{style:'margin-right:10px'}),swatch=el('span','');
   Object.assign(swatch.style,{display:'inline-block',width:'1em',height:'1em',marginRight:'.3em',
    background:colors.length===1?colors[0]:'linear-gradient(90deg,'+colors[0]+' 50%,'+colors[1]+' 50%)'});
   item.append(swatch,document.createTextNode(label));key.append(item);
  }
  const draft=root.VoidMissionEditor?.local?.()||{}, live=root.VoidLiveContent?.env||{};
  const rows=opts.rows||A.addressRegistry([...(root.VoidMainStory?.trees?.()||[]),...(live.trees||[]),...(draft.trees||[])],{...live.characters,...draft.characters});
  bar.append(area,zoom);const cv=el('canvas','','mod-dmap-cv',{width:'640',height:'200',role:'img','data-door-map-canvas':'1'});wrap.append(bar,cv,tip,key);
  const W=640;let k=1,vx0=0,vz1=0,H=200,pts=[],drag=null,suppressClick=false;
  const draw=()=>{const ds=list.filter(d=>d.quarter===S.area),P=root.VoidNPCPaths;let data=null;try{data=P&&P.mapData?P.mapData(S.area):null;}catch{data=null;}
   let v=data&&data.view?{...data.view}:null;if(!v&&!ds.length)v={x0:-30,x1:30,z0:-30,z1:30};if(!v){v={x0:Math.min(...ds.map(d=>d.x))-8,x1:Math.max(...ds.map(d=>d.x))+8,z0:Math.min(...ds.map(d=>d.z))-8,z1:Math.max(...ds.map(d=>d.z))+8};}
   if(S.zoom==='near'){const c=ds.find(d=>d.id===sel.value)||ds[0]||{x:(v.x0+v.x1)/2,z:(v.z0+v.z1)/2},w=Math.min(v.x1-v.x0,45),h=Math.min(v.z1-v.z0,30),cx=Number.isFinite(S.cx)?S.cx:c.x,cz=Number.isFinite(S.cz)?S.cz:c.z;v={x0:Math.max(v.x0,Math.min(v.x1-w,cx-w/2)),z0:Math.max(v.z0,Math.min(v.z1-h,cz-h/2))};v.x1=v.x0+w;v.z1=v.z0+h;}
   const vw=v.x1-v.x0,vh=v.z1-v.z0;H=Math.round(Math.max(150,Math.min(380,W*vh/vw)));k=Math.min(W/vw,H/vh);vx0=v.x0-(W/k-vw)/2;vz1=v.z1+(H/k-vh)/2;cv.height=H;
   const px=x=>(x-vx0)*k,py=z=>(vz1-z)*k,g=cv.getContext('2d');if(!g)return;g.fillStyle='#14161d';g.fillRect(0,0,W,H);
   const rect=(r,f)=>{g.fillStyle=f;g.fillRect(px(r.x0),py(r.z1),(r.x1-r.x0)*k,(r.z1-r.z0)*k);};
   if(data&&opts.geometry!==false){for(const f of data.floors||[])rect(f,'#2a2e38');for(const r of data.roads||[])rect(r,'#20232b');for(const w of data.walk||[])rect(w,'#3d4352');g.font='11px sans-serif';g.textAlign='center';g.fillStyle='#8a90a0';for(const l of data.labels||[])g.fillText(l.name,px(l.x),py(l.z));}
   g.fillStyle='#6c7280';g.font='11px sans-serif';g.textAlign='right';g.fillText('N ↑',W-6,14);g.textAlign='left';g.fillText(QN[S.area],6,14);
   for(const line of opts.routes||[]){
    if(line.area!==S.area)continue;
    g.lineWidth=2;g.strokeStyle='#f4ca43';g.fillStyle='#f4ca43';g.beginPath();
    line.points.forEach(([x,z],i)=>i?g.lineTo(px(x),py(z)):g.moveTo(px(x),py(z)));g.stroke();
    for(const [x,z] of line.points){g.beginPath();g.arc(px(x),py(z),3,0,Math.PI*2);g.fill();}
    if(line.label&&line.points.length){const [x,z]=line.points[0];g.textAlign='left';g.fillText(line.label,px(x)+5,py(z)-5);}
   }
   pts=[];const r=Math.max(5,Math.min(9,k*.9));for(const d of opts.entrances===false?[]:ds){const x=px(d.x),y=py(d.z);if(x<-10||x>W+10||y<-10||y>H+10)continue;const f=d.family||'city',colors=A.entranceLegend[used[d.id]?'mission':A.entranceType(d,rows.get(d.id),opts.players?.get(d.id))].colors,on=d.id===sel.value;
    g.fillStyle=colors[0];if(colors.length===2){const fill=g.createLinearGradient(x-r,y,x+r,y);fill.addColorStop(.5,colors[0]);fill.addColorStop(.5,colors[1]);g.fillStyle=fill;}g.beginPath();if(f==='office')g.rect(x-r,y-r,2*r,2*r);else if(f==='commercial'){g.moveTo(x,y-r-1);g.lineTo(x+r+1,y);g.lineTo(x,y+r+1);g.lineTo(x-r-1,y);g.closePath();}else g.arc(x,y,r,0,7);g.fill();
    g.lineWidth=on?3:1;g.strokeStyle=on?'#ffffff':'#000';g.stroke();if(on){g.strokeStyle='#ffb347';g.lineWidth=2;g.beginPath();g.arc(x,y,r+5,0,7);g.stroke();}g.lineWidth=1;
    const n=String(d.number),side=(d.n&&d.n[1])||0,ty=side>0?y-r-3:side<0?y+r+10:y+3,tx=side?x:x+((d.n&&d.n[0])>0?r+3+g.measureText(n).width/2:-r-3-g.measureText(n).width/2);
    g.font=(on?'bold ':'')+'10px sans-serif';g.textAlign='center';g.fillStyle=used[d.id]?'#8a8f98':on?'#fff':'#e8eef4';g.fillText(n,tx,ty);pts.push({d,x,y,r:r+3});}
   cv.setAttribute('aria-label','Street doors in '+QN[S.area]+': '+ds.map(d=>d.number).join(', '));cv.dataset.doorMapDoors=pts.map(p=>p.d.id).join(' ');};
  const at=e=>{const b=cv.getBoundingClientRect(),sx=W/(b.width||W),sy=H/(b.height||H),x=(e.clientX-b.left)*sx,y=(e.clientY-b.top)*sy;let best=null,bd=1e9;for(const p of pts){const q=Math.hypot(p.x-x,p.y-y);if(q<=Math.max(p.r,10)&&q<bd){bd=q;best=p;}}return best;};
  cv.onmousemove=e=>{const p=at(e);cv.style.cursor=p?'pointer':'default';tip.textContent=p?doorTitle(p.d)+(used[p.d.id]?' · already used by '+used[p.d.id]+' in this mission':'')+(p.d.id===sel.value?' · chosen':''):'Click a numbered door to choose it. Hover a door to see what it is.';cv.title=p?doorTitle(p.d):'';};
  cv.onpointerdown=e=>{if(S.zoom!=='near'||e.button!==0)return;
   drag={x:e.clientX,y:e.clientY,cx:vx0+W/(2*k),cz:vz1-H/(2*k)};suppressClick=false;cv.setPointerCapture(e.pointerId);};
  cv.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)<4&&!suppressClick)return;
   suppressClick=true;const box=cv.getBoundingClientRect();S.cx=drag.cx-dx*W/(box.width*k);S.cz=drag.cz+dy*H/(box.height*k);draw();};
  cv.onpointerup=cv.onpointercancel=()=>{drag=null;};
  cv.onclick=e=>{if(suppressClick){suppressClick=false;return;}const p=at(e);if(!p)return;sel.value=p.d.id;draw();sel.dispatchEvent(new Event('change',{bubbles:true}));};
  area.onchange=()=>{S.area=area.value;delete S.cx;delete S.cz;draw();};zoom.onchange=()=>{S.zoom=zoom.value;delete S.cx;delete S.cz;draw();};const selectDoor=()=>{const d=A.door(sel.value);if(d&&qs.includes(d.quarter)){S.area=d.quarter;area.value=S.area;delete S.cx;delete S.cz;}draw();};sel.addEventListener('change',selectDoor);wrap.dispose=()=>sel.removeEventListener('change',selectDoor);
  draw();wrap.redraw=draw;wrap.points=()=>pts.map(p=>({id:p.d.id,x:p.x,y:p.y}));return wrap;}
 // The street-door list with its map: the list, a MAP button, and the map under them (open while no door is chosen; it remembers being opened or closed).
 function doorPick(sel,opts={}){const box=el('span','','mod-dpick',{'data-door-pick':opts.key||'1'}),S=mapUi.get(opts.key)||{};if(opts.key)mapUi.set(opts.key,S);if(S.open==null)S.open=!sel.value;
  let map=null;const b=btn(S.open?'HIDE MAP':'SHOW ON MAP',()=>{S.open=!S.open;b.textContent=S.open?'HIDE MAP':'SHOW ON MAP';b.setAttribute('aria-expanded',String(S.open));if(S.open){map=doorMap(sel,opts);if(map)box.append(map);}else if(map){map.remove();map=null;}},'',{'data-door-map-toggle':opts.key||'1','aria-expanded':String(!!S.open),title:'A map of the street with every door numbered'});
  box.append(sel,b);if(S.open){map=doorMap(sel,opts);if(map)box.append(map);}return box;}
 const usedDoors=(m,a)=>{const o={};for(const x of (m&&m.apartments)||[])if(x&&x!==a&&x.id!==(a&&a.id)&&x.door)o[x.door]=(Array.isArray(x.modules)?'location ':'apartment ')+x.id;return o;};
 /* What a door is called on the plan, in plain words: "hallway door 101" (its apartment number), "hallway street door", "apartment entry", "office floor door n0". */
 function doorLabel(an,ref){const r=M().parseRef(ref),B=r&&an.byId[r.mod];if(!B)return String(ref||'');const t=B.t,L=t.legacy;
  if(L&&L.part==='hall'){if(r.sock==='street')return 'hallway street door';const n=+r.sock.slice(1),o=an.sockUse[ref],ob=o&&an.byId[M().parseRef(o).mod];const num=(ob&&Number.isInteger(ob.m.number)&&ob.m.number)||(X()&&X().slotNumber?X().slotNumber(n,L.style):(t.family==='container'?1+n:101+n));return 'hallway door '+num;}
  if(L&&L.part==='flat')return 'apartment entry';return t.name.toLowerCase()+' door '+r.sock;}
 // A module's name for people: "Rundown apartment 101" (the number on its hallway door), "Rundown hallway", "Office floor".
 function modLabel(an,id){const B=an.byId[id];if(!B)return id;const L=B.t.legacy;if(L&&L.part==='flat'){if(Number.isInteger(B.m.number))return B.t.name+' '+B.m.number;const o=an.sockUse[id+'.entry'],m=o&&/^hallway door (\d+)$/.exec(doorLabel(an,o));if(m)return B.t.name+' '+m[1];}return B.t.name;}
 // Show physical hallway positions separately from legacy custom door signs. Never rewrite existing links on render.
 function housingAddresses(a,an,add){const box=el('section','','mod-addresses');box.append(el('h4','2. Apartment addresses'),hint('Every apartment connects to one fixed hallway position. The door sign may be different on older missions. Select an empty position to add a matching apartment.'));
  for(const [id,B] of Object.entries(an.byId)){if(B.t.legacy?.part!=='hall')continue;const rows=el('div','','mod-address-grid');box.append(el('b',B.t.name+' · '+id));for(const s of B.t.sockets){if(!/^d\d+$/.test(s.id))continue;const ref=id+'.'+s.id,other=an.sockUse[ref],physical=X().slotNumber(+s.id.slice(1),B.t.legacy.style),label=other?modLabel(an,M().parseRef(other).mod):ref===a.entry?'Street entry':'Available position';const tile=el('div','','mod-address-tile '+(other||ref===a.entry?'occupied':'available'));tile.append(el('b','Position '+physical),el('span',label),el('small',other?doorLabel(an,ref):'No room connected'));const type=M().TYPE_IDS.find(t=>M().TYPES[t].legacy?.part==='flat'&&M().TYPES[t].legacy.style===B.t.legacy.style);if(!other&&ref!==a.entry&&type)tile.append(btn('Add apartment',()=>add(type,ref),'',{'data-mod-add-at':ref}));rows.append(tile);}box.append(rows);}
  return box;}
 // The modules in the order you walk in: from the entrance, through every door (side by side, connections, the elevator). -> {order, missing}
 function walkOrder(an,loc){const adj={},link=(a,b)=>{(adj[a]=adj[a]||new Set()).add(b);(adj[b]=adj[b]||new Set()).add(a);},mod=r=>(M().parseRef(r)||{}).mod;
  for(const [a,b] of Object.entries(an.sockUse))if(mod(a)&&mod(b))link(mod(a),mod(b));for(const c of an.cabs)for(const d of an.cabs)if(c!==d)link(c.id,d.id);
  const e=mod(loc&&loc.entry),order=[],seen=new Set();if(e&&an.byId[e]){const q=[e];seen.add(e);while(q.length){const id=q.shift();order.push(id);for(const n of adj[id]||[])if(!seen.has(n)){seen.add(n);q.push(n);}}}
  return {order,missing:Object.keys(an.byId).filter(id=>!seen.has(id))};}
 /* The one-line summary above the plan: "Street door No. 204 → Rundown hallway → Rundown apartment 101". */
 function summary(loc,streetName){const an=M().analyse(loc),w=walkOrder(an,loc);if(!Object.keys(an.byId).length)return 'No modules yet: add the first one below.';
  const names=w.order.map(id=>modLabel(an,id)),shown=names.slice(0,8);let s=(streetName?'Street door '+streetName:'Street door (not chosen yet)')+' → '+(shown.length?shown.join(' → '):'(no entrance chosen)')+(names.length>8?' → … (+'+(names.length-8)+' more)':'');
  if(w.missing.length)s+=' · not reached from the street yet: '+w.missing.map(id=>modLabel(an,id)).join(', ');return s;}
 /* THE PLAN'S LAYOUT for one floor, in grid cells (x east, z north): grid modules where they stand; portal modules (a housing hallway, an apartment: reached through a
    connection, no place on the grid) as tiles laid out beside them, column by column in the order you walk in (hallway, then the apartment behind it), on the floor of the
    module they connect to (the ground floor when they connect to nothing on the grid). A portal tile's place is only a drawing: nothing is saved. Connectors: one per
    connection, from door to door, labelled in plain words ("hallway door 101 → apartment entry"); red when locked until hacked.
    -> {tiles:[{id,x,z,w,d,t,portal,label,entry}], links:[{a,b,ax,az,bx,bz,label,locked}], entry:{x,z,id}|null, x0,x1,z0,z1} */
 const TILE={hall:[6,3],chall:[5,3],flat:[5,3],other:[5,3]};
 function planLayout(loc,floor){const Mo=M(),an=Mo.analyse(loc),f=floor|0,G=Mo.GRID,mod=r=>(Mo.parseRef(r)||{}).mod,locks=(loc&&loc.locks)||[],tiles=[],byId={};
  for(const p of an.placed)if(p.floor===f){const T={id:p.id,x:p.x,z:p.z,w:p.w,d:p.d,t:p.t,portal:false,p,label:modLabel(an,p.id)};tiles.push(T);byId[p.id]=T;}
  // the floor of each portal module: that of the grid module it connects to (through other portal modules too)
  const adj={};for(const l of an.links){const A=mod(l.a),B=mod(l.b);(adj[A]=adj[A]||[]).push(B);(adj[B]=adj[B]||[]).push(A);}
  const pf={},q=[];for(const p of an.placed){pf[p.id]=p.floor;q.push(p.id);}while(q.length){const id=q.shift();for(const n of adj[id]||[])if(pf[n]===undefined){pf[n]=pf[id];q.push(n);}}
  const ports=an.portal.map(m=>m.id).filter(id=>(pf[id]===undefined?0:pf[id])===f);
  if(ports.length){const w=walkOrder(an,loc),rank=id=>{const i=w.order.indexOf(id);return i<0?1e6+ports.indexOf(id):i;},depth={};
   // columns: how many portal doors from the street (or from the grid modules)
   const roots=ports.filter(id=>id===mod(loc.entry)||(adj[id]||[]).some(n=>an.byId[n]&&an.byId[n].p)).sort((a,b)=>rank(a)-rank(b));for(const r of roots)depth[r]=0;const qq=[...roots];
   while(qq.length){const id=qq.shift();for(const n of (adj[id]||[]).slice().sort((a,b)=>rank(a)-rank(b)))if(ports.includes(n)&&depth[n]===undefined){depth[n]=depth[id]+1;qq.push(n);}}
   let md=Math.max(-1,...Object.values(depth));for(const id of ports.slice().sort((a,b)=>rank(a)-rank(b)))if(depth[id]===undefined)depth[id]=++md;
   const cols=[];for(const id of ports){(cols[depth[id]]=cols[depth[id]]||[]).push(id);}for(const c of cols)if(c)c.sort((a,b)=>rank(a)-rank(b));
   let gx1=0,gz1=0;if(tiles.length){gx1=Math.max(...tiles.map(t=>t.x+t.w))+4;gz1=Math.max(...tiles.map(t=>t.z+t.d));}else gz1=TILE.flat[1];
   let cx=gx1;for(const c of cols){if(!c)continue;let cz=gz1,cw=0;for(const id of c){const B=an.byId[id],L=B.t.legacy||{},sz=L.part==='hall'?(B.t.family==='container'?TILE.chall:TILE.hall):L.part==='flat'?TILE.flat:TILE.other;
     const T={id,x:cx,z:cz-sz[1],w:sz[0],d:sz[1],t:B.t,portal:true,label:modLabel(an,id)};tiles.push(T);byId[id]=T;cz-=sz[1]+2;cw=Math.max(cw,sz[0]);}cx+=cw+4;}}
  // where a door is on the plan: a grid module's own door; on a portal tile, the edge that faces the other end
  const ctr=T=>[T.x+T.w/2,T.z+T.d/2],gridPt=ref=>{const w=an.world&&an.world[ref];return w?[w.x/G,w.z/G]:null;};
  const edgePt=(T,to)=>{const c=ctr(T),dx=to[0]-c[0],dz=to[1]-c[1];if(Math.abs(dx)*T.d>=Math.abs(dz)*T.w)return [dx>=0?T.x+T.w:T.x,Math.max(T.z+.4,Math.min(T.z+T.d-.4,to[1]))];return [Math.max(T.x+.4,Math.min(T.x+T.w-.4,to[0])),dz>=0?T.z+T.d:T.z];};
  const links=[],w=walkOrder(an,loc).order;for(const l of an.links){let a=l.a,b=l.b;const A=byId[mod(a)],B=byId[mod(b)];if(!A||!B)continue;if(w.indexOf(mod(b))>=0&&(w.indexOf(mod(a))<0||w.indexOf(mod(b))<w.indexOf(mod(a))))[a,b]=[b,a];
   const TA=byId[mod(a)],TB=byId[mod(b)];let pa=TA.portal?null:gridPt(a),pb=TB.portal?null:gridPt(b);if(!pa)pa=edgePt(TA,pb||ctr(TB));if(!pb)pb=edgePt(TB,pa);
   links.push({a,b,ax:pa[0],az:pa[1],bx:pb[0],bz:pb[1],label:doorLabel(an,a)+' → '+doorLabel(an,b),below:Math.min(TA.z,TB.z),locked:locks.includes(a)||locks.includes(b)});}
  let entry=null;const E=byId[mod(loc&&loc.entry)];if(E&&!an.sockUse[loc.entry]){const p=E.portal?[E.x,E.z+E.d/2]:gridPt(loc.entry);if(p)entry={x:p[0],z:p[1],id:E.id};}
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const T of tiles){x0=Math.min(x0,T.x);x1=Math.max(x1,T.x+T.w);z0=Math.min(z0,T.z);z1=Math.max(z1,T.z+T.d);}if(!tiles.length){x0=8;x1=16;z0=8;z1=16;}
  if(entry&&E.portal)x0=Math.min(x0,entry.x-1.5);return {tiles,links,entry,x0,x1,z0,z1};}
 // the plan: one floor, top-down (north up): every module of the location as a tile, doors as marks, connections as dashed lines
 function plan(loc,st,onPick){const W=300,H=240,cv=el('canvas','','mod-plan',{width:String(W),height:String(H),'aria-label':'Plan of floor '+st.floor,'data-mod-plan':'1'});const an=M().analyse(loc),G=M().GRID,L=planLayout(loc,st.floor);
  let {x0,x1,z0,z1}=L;x0-=2;x1+=2;z0-=2;z1+=2;const sc=Math.min(W/(x1-x0),H/(z1-z0)),ox=(W-(x1-x0)*sc)/2,oz=(H-(z1-z0)*sc)/2,X0=x=>ox+(x-x0)*sc,Z0=z=>H-(oz+(z-z0)*sc);
  cv.dataset.modTiles=L.tiles.map(t=>t.id).join(' ');cv.dataset.modLinks=L.links.map(l=>l.a+'>'+l.b).join(' ');cv.title=L.links.map(l=>l.label+(l.locked?' (locked until hacked)':'')).join('\n');
  const g=cv.getContext('2d');if(!g)return cv;g.fillStyle='#0b0e12';g.fillRect(0,0,W,H);g.strokeStyle='rgba(120,140,160,.12)';g.lineWidth=1;for(let x=Math.ceil(x0);x<=x1;x++){g.beginPath();g.moveTo(X0(x),0);g.lineTo(X0(x),H);g.stroke();}for(let z=Math.ceil(z0);z<=z1;z++){g.beginPath();g.moveTo(0,Z0(z));g.lineTo(W,Z0(z));g.stroke();}
  const COL={office:'#3a5a7a',server:'#2a6a6a',hallway:'#5a5a4a',elevator:'#6a5a3a',commercial:'#6a4a3a',various:'#6a4a3a',other:'#4a4a5a',housing:'#5a3a5a'};
  const fit=(s,w)=>{if(g.measureText(s).width<=w)return s;while(s.length>1&&g.measureText(s+'…').width>w)s=s.slice(0,-1);return s+'…';};
  for(const T of L.tiles){const sel=T.id===st.sel,px=X0(T.x)+1,pz=Z0(T.z+T.d)+1,pw=T.w*sc-2,pd=T.d*sc-2;g.fillStyle=COL[T.t.cat]||'#444';g.globalAlpha=sel?1:.75;g.fillRect(px,pz,pw,pd);g.globalAlpha=1;
   g.strokeStyle=sel?'#ffb347':'#9ab';g.lineWidth=sel?2:1;if(T.portal&&!sel)g.setLineDash([5,3]);g.strokeRect(px,pz,pw,pd);g.setLineDash([]);
   g.fillStyle='#e8eef4';g.textAlign='center';const cx=X0(T.x+T.w/2),cz=Z0(T.z+T.d/2);if(pd>=26){g.font='bold 10px sans-serif';const ws=T.label.split(' '),ln=[''];for(const w of ws){const t=(ln[ln.length-1]+' '+w).trim();if(g.measureText(t).width<=pw-6||!ln[ln.length-1])ln[ln.length-1]=t;else ln.push(w);}const rows=(pd>=40?ln.slice(0,2):[ln.join(' ')]).map(t=>fit(t,pw-4)),y0=cz-(rows.length*11)/2+4;rows.forEach((t,i)=>g.fillText(t,cx,y0+i*11));g.font='10px sans-serif';g.fillStyle='#b8c4d0';if(pd>=40)g.fillText(T.id,cx,y0+rows.length*11);}else{g.font='11px sans-serif';g.fillText(fit(T.id,pw-2),cx,cz+4);}
   if(!T.portal)for(const s of T.t.sockets){const w=M().sockWorld(T.p,s),ref=T.id+'.'+s.id,used=an.sockUse[ref],entry=loc.entry===ref,locked=(loc.locks||[]).includes(ref)||(used&&(loc.locks||[]).includes(used));g.fillStyle=entry?'#ffb347':locked?'#ff4a4a':used?'#39ff9c':'rgba(200,210,220,.35)';
    g.beginPath();g.arc(X0(w.x/G),Z0(w.z/G),entry||used?4:2.5,0,7);g.fill();}}
  // connections: dashed, door to door, labelled
  g.font='10px sans-serif';for(const l of L.links){const ax=X0(l.ax),az=Z0(l.az),bx=X0(l.bx),bz=Z0(l.bz),c=l.locked?'#ff4a4a':'#39ff9c';g.strokeStyle=c;g.lineWidth=2;g.setLineDash([5,4]);g.beginPath();g.moveTo(ax,az);g.lineTo(bx,bz);g.stroke();g.setLineDash([]);
   for(const [x,z] of [[ax,az],[bx,bz]]){g.fillStyle=c;g.beginPath();g.arc(x,z,4,0,7);g.fill();}
   const t=fit(l.label+(l.locked?' (locked)':''),W-8),tw=g.measureText(t).width,mx=Math.max(tw/2+4,Math.min(W-tw/2-4,(ax+bx)/2)),mz=Math.min(H-4,Z0(l.below)+14);g.fillStyle='rgba(11,14,18,.85)';g.fillRect(mx-tw/2-3,mz-10,tw+6,14);g.fillStyle=c;g.textAlign='center';g.fillText(t,mx,mz);}
  // the street entrance (amber)
  if(L.entry){const ex=X0(L.entry.x),ez=Z0(L.entry.z);g.fillStyle='#ffb347';g.beginPath();g.arc(ex,ez,5,0,7);g.fill();if(byPortal(L)){g.font='bold 9px sans-serif';g.textAlign='right';g.fillText('STREET',ex-7,ez+3);}}
  if(an.placed.some(p=>p.floor!==st.floor)||an.cabs.length){g.fillStyle='#9ab';g.font='11px sans-serif';g.textAlign='left';g.fillText('FLOOR '+M().floorName(st.floor),6,14);}
  cv.onclick=e=>{const r=cv.getBoundingClientRect(),px=(e.clientX-r.left)*W/r.width,pz=(e.clientY-r.top)*H/r.height,gx=x0+(px-ox)/sc,gz=z0+(H-pz-oz)/sc;const hit=L.tiles.find(p=>gx>=p.x&&gx<=p.x+p.w&&gz>=p.z&&gz<=p.z+p.d);onPick(hit?hit.id:null);};
  return cv;}
 const byPortal=L=>{const E=L.entry&&L.tiles.find(t=>t.id===L.entry.id);return !!(E&&E.portal);};
 // The street-door list of a location with housing: a container hallway or apartment only behind an Outskirts container door; city housing behind any city door (null: every door)
 const housingStyle=a=>{const L=(a.modules||[]).map(x=>(M().TYPES[x&&x.type]||{}).legacy).find(Boolean);return L?L.style:null;};
 function card({m,a,k,ed,doorSelect,jump}){const Mo=M(),st=stateOf(m,a),box=el('div','','me-step mod-card',{'data-me-apt':a.id,'data-mod-loc':a.id});let msg='';
  const el2=(fn,redraw=true)=>ed(x=>{const y=(x.apartments||[]).find(z=>z.id===a.id);if(y)fn(y,x);},redraw);
  const setLoc=(L)=>el2((y)=>{for(const key of Object.keys(y))delete y[key];Object.assign(y,JSON.parse(JSON.stringify(L)));});
  const r1=el('div','','me-row');const nm=el('input','','',{'aria-label':'Location name (used by its steps)',size:'10',maxlength:'24','data-me-apt-name':a.id});nm.value=a.id;
  nm.onchange=()=>{const v=nm.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^[^a-z]+/,'').slice(0,24);if(!v||v===a.id||(m.apartments||[]).some(y=>y.id===v)){nm.value=a.id;return;}
   ed(x=>{const y=x.apartments.find(z=>z.id===a.id);if(y)y.id=v;for(const o of x.objectives||[]){if(o.apt===a.id)o.apt=v;if(typeof o.ap==='string'&&o.ap.startsWith(a.id+'/'))o.ap=v+o.ap.slice(a.id.length);}},true);};
  r1.append(el('b','LOCATION '+(k+1)),nm,el('span','behind','me-small'),doorSelect(a.door,v=>el2(y=>{y.door=v;}),{'data-me-apt-door':a.id},'— choose a street door —',housingStyle(a),{key:m.id+'/'+a.id,used:usedDoors(m,a)}),
   btn('×',()=>{if(!confirm('Remove location “'+a.id+'” from this mission? Its steps will need another place.'))return;ed(x=>{x.apartments=(x.apartments||[]).filter(y=>y.id!==a.id);if(!x.apartments.length)delete x.apartments;},true);},'me-x',{'aria-label':'Remove location'}));box.append(r1);
  const d=a.door&&X().door(a.door);if(d)box.append(el('p','Street door: '+d.name+' ('+({city:'apartment building',container:'container in The Outskirts',office:'office entrance',commercial:'shop entrance'}[d.family||'city'])+').','me-small'));
  const r2=el('div','','me-row');const fr=el('select','','',{'aria-label':'Available from','data-me-apt-from':a.id});fr.append(new Option('open from the mission’s start','start'));for(const o of m.objectives||[])fr.append(new Option('open from step: '+(o.label||o.id).slice(0,40),o.id));fr.value=a.from||'start';
  fr.onchange=()=>el2(y=>{if(fr.value==='start')delete y.from;else y.from=fr.value;});r2.append(fr,el('span','until the mission ends','me-small'));
  const tp=el('select','','',{'aria-label':'Start from a template','data-mod-template':a.id});tp.append(new Option('— start again from a template —',''));for(const t of Mo.TEMPLATES)tp.append(new Option(t.name,t.id));tp.onchange=()=>{if(!tp.value)return;if((a.modules||[]).length&&!confirm('Replace this location’s modules with the template?')){tp.value='';return;}setLoc({id:a.id,door:a.door||'',...(a.from?{from:a.from}:{}),...Mo.template(tp.value)});};r2.append(tp);box.append(r2);
  // floors
  const an=Mo.analyse(a),floors=[...new Set([0,...an.placed.map(p=>p.floor)])].sort((x,y)=>x-y);if(!floors.includes(st.floor))st.floor=floors[0];
  const fl=el('div','','me-row');fl.append(el('b','Floor'));for(const f of floors)fl.append(btn(Mo.floorName(f),()=>{st.floor=f;st.sel=null;ed(()=>{},true);},f===st.floor?'on':'',{'data-mod-floor':String(f)}));
  const cab=an.cabs[0];if(cab){const up=Math.max(...floors)+1,dn=Math.min(...floors)-1;for(const [f,lbl] of [[up,'+ FLOOR ABOVE'],[dn,'+ FLOOR BELOW']])if(f>=Mo.FLOORS[0]&&f<=Mo.FLOORS[1])fl.append(btn(lbl,()=>{const r=Mo.addModule(a,'elevator',{floor:f});if(r.ok){st.floor=f;st.sel=r.id;setLoc(r.loc);}},'',{'data-mod-floor-add':String(f)}));
   fl.append(hint('A new floor starts with the elevator cab in the same place; add modules there at its door.'));}
  else fl.append(hint('Add an elevator cab (category Elevator) to get more floors.'));box.append(fl);
  // the plan and the selected module
  box.append(el('p',summary(a,d&&d.name),'me-small mod-sum',{'data-mod-summary':a.id}));
  if(Object.values(an.byId).some(b=>b.t.legacy?.part==='hall'))box.append(housingAddresses(a,an,(type,ref)=>{if(!Mo.freeSockets(a).some(f=>f.ref===ref))return;const r=Mo.addModule(a,type,{to:ref});if(!r.ok||!r.loc.links?.some(l=>l.a===ref||l.b===ref)){alert(r.why||'Could not add an apartment at this position.');return;}st.sel=r.id;setLoc(r.loc);}));
  box.append(el('h4','3. Room layout & settings'),hint('Click a room to inspect it. Apartments use fixed door connections, not grid alignment.'));
  const row=el('div','','me-row mod-plan-row');row.append(plan(a,st,id=>{st.sel=id;ed(()=>{},true);}));const side=el('div','','mod-side');row.append(side);box.append(row);
  const sel=(a.modules||[]).find(x=>x.id===st.sel)||null;
  if(sel){const t=Mo.TYPES[sel.type],mv=(dx,dz,dr)=>el2(y=>{const q=y.modules.find(z=>z.id===sel.id);if(!q||t.portal)return;q.x=Math.max(0,Math.min(Mo.SPAN-1,(q.x|0)+dx));q.z=Math.max(0,Math.min(Mo.SPAN-1,(q.z|0)+dz));if(dr){q.rot=((q.rot|0)+dr)%4;if(!q.rot)delete q.rot;}});
   side.append(el('b',sel.id+' · '+modLabel(an,sel.id)),el('p',t.note||'','me-small'));if(t.portal)side.append(el('p','Reached through a connection (a door that leads elsewhere), so it has no place on the grid: its tile on the plan is only a drawing beside the others, so it cannot be moved or turned. Remove it, or change its connection below.','me-small',{'data-mod-portal-note':sel.id}));
   if(!t.portal){const mvr=el('div','','me-row');mvr.append(btn('←',()=>mv(-1,0),'',{'aria-label':'Move west','data-mod-move':'w'}),btn('↑',()=>mv(0,1),'',{'aria-label':'Move north','data-mod-move':'n'}),btn('↓',()=>mv(0,-1),'',{'aria-label':'Move south','data-mod-move':'s'}),btn('→',()=>mv(1,0),'',{'aria-label':'Move east','data-mod-move':'e'}),btn('⟳ TURN',()=>mv(0,0,1),'',{'data-mod-turn':'1'}));side.append(mvr);}
   const opts=el('div','','me-row'),onoff=(label,key,attr)=>{const q=el('select','','',{'aria-label':label,[attr]:sel.id});q.append(new Option(label+': On','on'),new Option(label+': Off','off'));q.value=sel[key]===true?'off':'on';q.onchange=()=>el2(y=>{const z=y.modules.find(w=>w.id===sel.id);if(q.value==='off')z[key]=true;else delete z[key];});return q;};
   opts.append(onoff('Lights start','lightsOff','data-mod-lights'));if(t.screen)opts.append(onoff('Screens start','screenOff','data-mod-screen'));side.append(opts);
   // its doors: joined, the entrance, free; lock / make entrance
   const dl=el('div','','mod-doors');for(const s of t.sockets){const ref=sel.id+'.'+s.id,used=an.sockUse[ref],isE=a.entry===ref,door=Mo.doorOf(an,ref),r=el('div','','me-row');
    r.append(el('span',doorLabel(an,ref)+' ('+s.id+'): '+(isE?'the entrance (from the street)':used?'to '+doorLabel(an,used)+' of '+modLabel(an,Mo.parseRef(used).mod):'free (plain wall)'),'me-small'));
    if(!used&&!isE)r.append(btn('MAKE ENTRANCE',()=>el2(y=>{y.entry=ref;}),'',{'data-mod-entry':ref}));
    if(door&&door.kind!=='entry'){const lk=el('label','','me-small'),cb=el('input','','',{type:'checkbox','data-mod-lock':ref});cb.checked=(a.locks||[]).includes(door.a)||(a.locks||[]).includes(door.b);cb.onchange=()=>el2(y=>{let L=(y.locks||[]).filter(z=>z!==door.a&&z!==door.b);if(cb.checked)L.push(ref);if(L.length)y.locks=L;else delete y.locks;});lk.append(cb,document.createTextNode(' locked until hacked'));r.append(lk);}
    dl.append(r);}side.append(dl);
   // items (data for later: shown in the game as small marked cases)
   const it=el('div','','me-row',{'data-mod-items':sel.id});it.append(el('b','Items'),el('span',(sel.items||[]).length?sel.items.map(i=>i.label+' ('+i.type+')').join(', '):'none yet','me-small'));const ty=el('select','','',{'aria-label':'Item type'});for(const x of Mo.ITEM_TYPES)ty.append(new Option(x,x));
   const lb=el('input','','',{'aria-label':'Item label',placeholder:'label (e.g. Data shard)',maxlength:'60',size:'14'});it.append(ty,lb,btn('+ ITEM',()=>{const v=lb.value.trim().slice(0,60);if(!v)return;el2(y=>{const z=y.modules.find(w=>w.id===sel.id),b=Mo.bounds(z.type),n=(z.items||[]).length;z.items=[...(z.items||[]),{type:ty.value,label:v,x:Math.round(((b[0]+b[1])/2+(n%3-1)*.4)*100)/100,z:Math.round(((b[2]+b[3])/2+.6)*100)/100,y:0}];});}),btn('CLEAR',()=>el2(y=>{delete y.modules.find(w=>w.id===sel.id).items;}),'me-x'));side.append(it);
   side.append(btn('REMOVE '+sel.id.toUpperCase(),()=>{if(!confirm('Remove module “'+sel.id+'”?'))return;st.sel=null;setLoc(Mo.removeModule(a,sel.id));},'me-x',{'data-mod-remove':sel.id}));}
  else side.append(el('p',(a.modules||[]).length?'Click a module on the plan to set it up (move and turn modules on the grid). Green marks: doors between modules; dashed lines: connections (a door that leads elsewhere); amber: the street entrance; red: locked until hacked.':'Add the first module below.','me-small'));
  // add a module (category > module > where it joins)
  const sug=d&&(d.family==='container'||!d.family||d.family==='city')?d.style:null;   // the door's part-of-town style: only the preselected suggestion, any city style fits any city door
  box.append(picker(a,(type,to)=>{const t=Mo.TYPES[type];const base=!(a.modules||[]).length&&t.legacy&&t.legacy.part==='flat'?Mo.addModule(a,'hall-'+t.legacy.style).loc:a;   // an apartment in an empty location comes with its hallway, as Add a location does
  const r=Mo.addModule(base,type,{to:to||undefined,floor:t.portal?undefined:st.floor});if(!r.ok){msg=r.why;ed(()=>{},true);return;}st.sel=r.id;if(r.why)msg=r.why;setLoc(r.loc);},{'data-mod-picker':a.id},sug));
  // connections (doors that lead elsewhere)
  {const cn=el('div','','me-row',{'data-mod-links':a.id});cn.append(el('b','Connections'));for(const l of a.links||[])cn.append(el('span',doorLabel(an,l.a)+' ↔ '+doorLabel(an,l.b)+' ('+l.a+' ↔ '+l.b+')','me-small',{'data-mod-link':l.a+'|'+l.b}),btn('×',()=>el2(y=>{y.links=(y.links||[]).filter(z=>!(z.a===l.a&&z.b===l.b));if(!y.links.length)delete y.links;}),'me-x',{'aria-label':'Remove connection'}));
   const free=Mo.freeSockets(a).filter(f=>f.ref!==a.entry),s1=el('select','','',{'aria-label':'From door','data-mod-link-a':'1'}),s2=el('select','','',{'aria-label':'To door','data-mod-link-b':'1'});for(const s of [s1,s2]){s.append(new Option('— door —',''));for(const f of free)s.append(new Option(doorLabel(an,f.ref)+' of '+modLabel(an,f.mod)+' ('+f.ref+')',f.ref));}
   cn.append(s1,s2,btn('CONNECT',()=>{if(!s1.value||!s2.value||s1.value===s2.value)return;el2(y=>{y.links=[...(y.links||[]),{a:s1.value,b:s2.value}];});}),hint('A connection is a door that leads elsewhere: walking through it is a short fade into the other module (a housing hallway’s numbered door into an apartment, or a free outside door into an apartment). Choose the two doors and press CONNECT. Modules put side by side on the grid join by themselves and need no connection.'));box.append(cn);}
  // checks
  const fam=d?(d.family||'city'):null,probs=Mo.problems(a,fam);if(!a.door)probs.unshift('choose a street door (the list above).');
  box.append(el('p',probs.length?'To fix: '+probs.join(' · '):'Everything fits: every module can be reached from the street door.',probs.length?'me-small me-warn':'me-small mod-ok',{'data-mod-problems':a.id}));
  if(msg)box.append(el('p',msg,'me-small'));
  const r3=el('div','','me-row');r3.append(btn('JUMP TO THE DOOR',()=>jump&&jump(false),'',{'data-me-apt-jump':a.id,...(a.door?{}:{disabled:''})}),btn('JUMP INSIDE',()=>jump&&jump(true),'',{'data-me-apt-inside':a.id,...(a.door&&!probs.length?{}:{disabled:''})}),hint('A throwaway test session: nothing is saved. Steps complete only in PLAY THIS DRAFT.'));box.append(r3);
  return box;}
 /* The steps' extra box: which module (room) of a location; and the objects of that module for "Use something". */
 function stepMod(m,o,eo,attrs){const a=(m.apartments||[]).find(x=>x&&x.id===o.apt);if(!a||!Array.isArray(a.modules))return [];const sel=el('select','','',{'aria-label':'Which room (module)',...(attrs||{})});
  sel.append(new Option(o.kind==='apt-use'?'— choose the room —':'any room of it',''));for(const x of a.modules)sel.append(new Option(x.id+' · '+((M().TYPES[x.type]||{}).name||x.type),x.id));sel.value=o.mod||'';sel.onchange=()=>eo(x=>{if(sel.value)x.mod=sel.value;else delete x.mod;const mm=a.modules.find(z=>z.id===sel.value);if(x.kind==='apt-use'&&mm&&!M().objectsOf(mm.type).some(ob=>ob.id===x.object))delete x.object;},true);return [el('span','room','me-small'),sel];}
 function objects(m,o){const a=(m.apartments||[]).find(x=>x&&x.id===o.apt);if(a&&Array.isArray(a.modules)){const mm=a.modules.find(z=>z.id===o.mod);return mm?M().objectsOf(mm.type):[];}return (X()&&X().OBJECTS)||[];}
 // Access points of a mission's locations (for the hack step's list): every door, from either side.
 function accessPoints(m){const out=[];for(const a of m.apartments||[]){if(!a||!Array.isArray(a.modules))continue;const an=M().analyse(a);for(const d of an.doors)for(const r of [d.a,d.b]){if(!r)continue;out.push({ap:a.id+'/'+r,label:'Location '+a.id+': '+(d.kind==='entry'?'its entrance door, inside':'door '+r+(d.kind==='portal'?' (leads elsewhere)':' (to '+(r===d.a?d.b:d.a)+')'))});}}return out;}
 root.VoidModuleEditor={card,create,picker,stepMod,objects,accessPoints,catName,planLayout,summary,doorLabel,modLabel,doorMap,doorPick,doorTitle,usedDoors};
})(globalThis);
