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
 if(typeof document!=='undefined'&&!document.getElementById('mod-editor-css')){const st=document.createElement('style');st.id='mod-editor-css';st.textContent='.mod-card canvas.mod-plan{position:static!important;inset:auto!important;z-index:auto!important;width:300px!important;height:240px!important;max-width:100%;flex:0 0 auto;border:1px solid #2a3440;border-radius:4px;cursor:pointer;display:block}.mod-plan-row{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}.mod-side{flex:1 1 240px;min-width:220px}.mod-card .on{outline:2px solid #ffb347}.mod-ok{color:#7fe0a8}.mod-pick select{max-width:260px}';document.head.append(st);}
 const ui=new Map();   // per location: {sel (module id), floor}
 const stateOf=(m,a)=>{const k=m.id+'/'+a.id;if(!ui.has(k))ui.set(k,{sel:null,floor:0});return ui.get(k);};
 const catName=id=>(M().CATS.find(c=>c.id===id)||{}).name||id;
 /* The module picker: category, then module, then (optional) the free door it joins. on(type, to) */
 function picker(loc,on,attrs){const box=el('div','','me-row mod-pick',attrs||{}),cat=el('select','','',{'aria-label':'Category','data-mod-cat':'1'}),typ=el('select','','',{'aria-label':'Module','data-mod-type':'1'}),to=el('select','','',{'aria-label':'Joins at','data-mod-to':'1'});
  for(const c of M().CATS)cat.append(new Option(c.name,c.id));const fill=()=>{typ.innerHTML='';for(const id of M().TYPE_IDS){const t=M().TYPES[id];if(t.cat===cat.value)typ.append(new Option(t.name,id));}note.textContent=(M().TYPES[typ.value]||{}).note||'';fillTo();};
  const fillTo=()=>{to.innerHTML='';const t=M().TYPES[typ.value];to.append(new Option(loc&&loc.modules&&loc.modules.length?'joins at: the first free door that fits':'(the first module)',''));
   if(loc&&loc.modules)for(const f of M().freeSockets(loc)){if(t&&t.portal!==f.portal&&!(t&&t.portal&&!f.portal))continue;const B=loc.modules.find(x=>x.id===f.mod);to.append(new Option('joins at: '+f.mod+' · door '+f.sock+' ('+((M().TYPES[B&&B.type]||{}).name||'')+')',f.ref));}};
  const note=el('span','','me-help');cat.onchange=fill;typ.onchange=()=>{note.textContent=(M().TYPES[typ.value]||{}).note||'';fillTo();};fill();
  box.append(el('b','Add'),cat,typ,to,btn('+ ADD',()=>on(typ.value,to.value||null),'',{'data-mod-add':'1'}),note);return box;}
 /* A new location in a mission (Add a location > category > module). Housing: the apartment with its hallway, linked. */
 function create(m,type,ed,note){const ids=new Set((m.apartments||[]).map(a=>a.id));let n=1;while(ids.has('l'+n))n++;const id='l'+n;const t=M().TYPES[type];
  let loc={id,door:'',modules:[]};if(t.legacy&&t.legacy.part==='flat'){loc=M().addModule(loc,'hall-'+t.legacy.style).loc;}const r=M().addModule(loc,type);if(!r.ok){note&&note(r.why);return;}
  ed(x=>{x.apartments=[...(x.apartments||[]),r.loc];},true);note&&note('Location “'+id+'” added: '+t.name+'. Choose its street door, then add more modules (they join at a free door).');}
 // the plan: one floor, top-down (north up), modules as rectangles, doors as marks
 function plan(loc,st,onPick){const W=300,H=240,cv=el('canvas','','mod-plan',{width:String(W),height:String(H),'aria-label':'Plan of floor '+st.floor,'data-mod-plan':'1'});const an=M().analyse(loc),G=M().GRID;
  const ps=an.placed.filter(p=>p.floor===st.floor);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of ps){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x+p.w);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z+p.d);}if(!ps.length){x0=8;x1=16;z0=8;z1=16;}
  x0-=2;x1+=2;z0-=2;z1+=2;const sc=Math.min(W/(x1-x0),H/(z1-z0)),ox=(W-(x1-x0)*sc)/2,oz=(H-(z1-z0)*sc)/2,X0=x=>ox+(x-x0)*sc,Z0=z=>H-(oz+(z-z0)*sc);
  const g=cv.getContext('2d');g.fillStyle='#0b0e12';g.fillRect(0,0,W,H);g.strokeStyle='rgba(120,140,160,.12)';for(let x=Math.ceil(x0);x<=x1;x++){g.beginPath();g.moveTo(X0(x),0);g.lineTo(X0(x),H);g.stroke();}for(let z=Math.ceil(z0);z<=z1;z++){g.beginPath();g.moveTo(0,Z0(z));g.lineTo(W,Z0(z));g.stroke();}
  const COL={office:'#3a5a7a',server:'#2a6a6a',hallway:'#5a5a4a',elevator:'#6a5a3a',commercial:'#6a4a3a',other:'#4a4a5a',housing:'#5a3a5a'};
  for(const p of ps){g.fillStyle=COL[p.t.cat]||'#444';g.globalAlpha=p.id===st.sel?1:.75;g.fillRect(X0(p.x)+1,Z0(p.z+p.d)+1,p.w*sc-2,p.d*sc-2);g.globalAlpha=1;g.strokeStyle=p.id===st.sel?'#ffb347':'#9ab';g.lineWidth=p.id===st.sel?2:1;g.strokeRect(X0(p.x)+1,Z0(p.z+p.d)+1,p.w*sc-2,p.d*sc-2);
   g.fillStyle='#e8eef4';g.font='11px sans-serif';g.textAlign='center';g.fillText(p.id,X0(p.x+p.w/2),Z0(p.z+p.d/2)+4);
   for(const s of p.t.sockets){const w=M().sockWorld(p,s),ref=p.id+'.'+s.id,used=an.sockUse[ref],entry=loc.entry===ref,locked=(loc.locks||[]).includes(ref)||(used&&(loc.locks||[]).includes(used));g.fillStyle=entry?'#ffb347':locked?'#ff4a4a':used?'#39ff9c':'rgba(200,210,220,.35)';
    g.beginPath();g.arc(X0(w.x/G),Z0(w.z/G),entry||used?4:2.5,0,7);g.fill();}}
  if(an.placed.some(p=>p.floor!==st.floor)||an.cabs.length){g.fillStyle='#9ab';g.font='11px sans-serif';g.textAlign='left';g.fillText('FLOOR '+M().floorName(st.floor),6,14);}
  cv.onclick=e=>{const r=cv.getBoundingClientRect(),px=(e.clientX-r.left)*W/r.width,pz=(e.clientY-r.top)*H/r.height,gx=x0+(px-ox)/sc,gz=z0+(H-pz-oz)/sc;const hit=ps.find(p=>gx>=p.x&&gx<=p.x+p.w&&gz>=p.z&&gz<=p.z+p.d);onPick(hit?hit.id:null);};
  return cv;}
 function card({m,a,k,ed,doorSelect,jump}){const Mo=M(),st=stateOf(m,a),box=el('div','','me-step mod-card',{'data-me-apt':a.id,'data-mod-loc':a.id});let msg='';
  const el2=(fn,redraw=true)=>ed(x=>{const y=(x.apartments||[]).find(z=>z.id===a.id);if(y)fn(y,x);},redraw);
  const setLoc=(L)=>el2((y)=>{for(const key of Object.keys(y))delete y[key];Object.assign(y,JSON.parse(JSON.stringify(L)));});
  const r1=el('div','','me-row');const nm=el('input','','',{'aria-label':'Location name (used by its steps)',size:'10',maxlength:'24','data-me-apt-name':a.id});nm.value=a.id;
  nm.onchange=()=>{const v=nm.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^[^a-z]+/,'').slice(0,24);if(!v||v===a.id||(m.apartments||[]).some(y=>y.id===v)){nm.value=a.id;return;}
   ed(x=>{const y=x.apartments.find(z=>z.id===a.id);if(y)y.id=v;for(const o of x.objectives||[]){if(o.apt===a.id)o.apt=v;if(typeof o.ap==='string'&&o.ap.startsWith(a.id+'/'))o.ap=v+o.ap.slice(a.id.length);}},true);};
  r1.append(el('b','LOCATION '+(k+1)),nm,el('span','behind','me-small'),doorSelect(a.door,v=>el2(y=>{y.door=v;}),{'data-me-apt-door':a.id},'— choose a street door —',null),
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
  const row=el('div','','me-row mod-plan-row');row.append(plan(a,st,id=>{st.sel=id;ed(()=>{},true);}));const side=el('div','','mod-side');row.append(side);box.append(row);
  const sel=(a.modules||[]).find(x=>x.id===st.sel)||null;
  if(sel){const t=Mo.TYPES[sel.type],mv=(dx,dz,dr)=>el2(y=>{const q=y.modules.find(z=>z.id===sel.id);if(!q||t.portal)return;q.x=Math.max(0,Math.min(Mo.SPAN-1,(q.x|0)+dx));q.z=Math.max(0,Math.min(Mo.SPAN-1,(q.z|0)+dz));if(dr){q.rot=((q.rot|0)+dr)%4;if(!q.rot)delete q.rot;}});
   side.append(el('b',sel.id+' · '+t.name),el('p',t.note||'','me-small'));
   if(!t.portal){const mvr=el('div','','me-row');mvr.append(btn('←',()=>mv(-1,0),'',{'aria-label':'Move west','data-mod-move':'w'}),btn('↑',()=>mv(0,1),'',{'aria-label':'Move north','data-mod-move':'n'}),btn('↓',()=>mv(0,-1),'',{'aria-label':'Move south','data-mod-move':'s'}),btn('→',()=>mv(1,0),'',{'aria-label':'Move east','data-mod-move':'e'}),btn('⟳ TURN',()=>mv(0,0,1),'',{'data-mod-turn':'1'}));side.append(mvr);}
   const opts=el('div','','me-row'),onoff=(label,key,attr)=>{const q=el('select','','',{'aria-label':label,[attr]:sel.id});q.append(new Option(label+': On','on'),new Option(label+': Off','off'));q.value=sel[key]===true?'off':'on';q.onchange=()=>el2(y=>{const z=y.modules.find(w=>w.id===sel.id);if(q.value==='off')z[key]=true;else delete z[key];});return q;};
   opts.append(onoff('Lights start','lightsOff','data-mod-lights'));if(t.screen)opts.append(onoff('Screens start','screenOff','data-mod-screen'));side.append(opts);
   // its doors: joined, the entrance, free; lock / make entrance
   const dl=el('div','','mod-doors');for(const s of t.sockets){const ref=sel.id+'.'+s.id,used=an.sockUse[ref],isE=a.entry===ref,door=Mo.doorOf(an,ref),r=el('div','','me-row');
    r.append(el('span','door '+s.id+': '+(isE?'the entrance (from the street)':used?'to '+used:'free (plain wall)'),'me-small'));
    if(!used&&!isE)r.append(btn('MAKE ENTRANCE',()=>el2(y=>{y.entry=ref;}),'',{'data-mod-entry':ref}));
    if(door&&door.kind!=='entry'){const lk=el('label','','me-small'),cb=el('input','','',{type:'checkbox','data-mod-lock':ref});cb.checked=(a.locks||[]).includes(door.a)||(a.locks||[]).includes(door.b);cb.onchange=()=>el2(y=>{let L=(y.locks||[]).filter(z=>z!==door.a&&z!==door.b);if(cb.checked)L.push(ref);if(L.length)y.locks=L;else delete y.locks;});lk.append(cb,document.createTextNode(' locked until hacked'));r.append(lk);}
    dl.append(r);}side.append(dl);
   // items (data for later: shown in the game as small marked cases)
   const it=el('div','','me-row',{'data-mod-items':sel.id});it.append(el('b','Items'),el('span',(sel.items||[]).length?sel.items.map(i=>i.label+' ('+i.type+')').join(', '):'none yet','me-small'));const ty=el('select','','',{'aria-label':'Item type'});for(const x of Mo.ITEM_TYPES)ty.append(new Option(x,x));
   const lb=el('input','','',{'aria-label':'Item label',placeholder:'label (e.g. Data shard)',maxlength:'60',size:'14'});it.append(ty,lb,btn('+ ITEM',()=>{const v=lb.value.trim().slice(0,60);if(!v)return;el2(y=>{const z=y.modules.find(w=>w.id===sel.id),b=Mo.bounds(z.type),n=(z.items||[]).length;z.items=[...(z.items||[]),{type:ty.value,label:v,x:Math.round(((b[0]+b[1])/2+(n%3-1)*.4)*100)/100,z:Math.round(((b[2]+b[3])/2+.6)*100)/100,y:0}];});}),btn('CLEAR',()=>el2(y=>{delete y.modules.find(w=>w.id===sel.id).items;}),'me-x'));side.append(it);
   side.append(btn('REMOVE '+sel.id.toUpperCase(),()=>{if(!confirm('Remove module “'+sel.id+'”?'))return;st.sel=null;setLoc(Mo.removeModule(a,sel.id));},'me-x',{'data-mod-remove':sel.id}));}
  else side.append(el('p',(a.modules||[]).length?'Click a module on the plan to move, turn or set it up. Green marks: doors between modules; amber: the entrance; red: locked until hacked.':'Add the first module below.','me-small'));
  // add a module (category > module > where it joins)
  box.append(picker(a,(type,to)=>{const t=Mo.TYPES[type];const r=Mo.addModule(a,type,{to:to||undefined,floor:t.portal?undefined:st.floor});if(!r.ok){msg=r.why;ed(()=>{},true);return;}st.sel=r.id;if(r.why)msg=r.why;setLoc(r.loc);},{'data-mod-picker':a.id}));
  // connections (doors that lead elsewhere)
  {const cn=el('div','','me-row',{'data-mod-links':a.id});cn.append(el('b','Connections'));for(const l of a.links||[])cn.append(el('span',l.a+' ↔ '+l.b,'me-small'),btn('×',()=>el2(y=>{y.links=(y.links||[]).filter(z=>!(z.a===l.a&&z.b===l.b));if(!y.links.length)delete y.links;}),'me-x',{'aria-label':'Remove connection'}));
   const free=Mo.freeSockets(a).filter(f=>f.ref!==a.entry),s1=el('select','','',{'aria-label':'From door','data-mod-link-a':'1'}),s2=el('select','','',{'aria-label':'To door','data-mod-link-b':'1'});for(const s of [s1,s2]){s.append(new Option('— door —',''));for(const f of free)s.append(new Option(f.ref,f.ref));}
   cn.append(s1,s2,btn('CONNECT',()=>{if(!s1.value||!s2.value||s1.value===s2.value)return;el2(y=>{y.links=[...(y.links||[]),{a:s1.value,b:s2.value}];});}),hint('A door that leads elsewhere (a short fade): a housing hallway’s door to an apartment, or a free outside door to an apartment. Modules side by side join by themselves.'));box.append(cn);}
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
 root.VoidModuleEditor={card,create,picker,stepMod,objects,accessPoints,catName};
})(globalThis);
