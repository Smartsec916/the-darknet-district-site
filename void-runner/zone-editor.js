/* ZONES IN THE EDITOR (browser only; loaded with the editor's scripts by dev-tools.js). The rules and checks are zones.js; the game side is zone-integration.js.
   - Developer Tools > ZONES: the owner's table. Every NeoChinatown area and every location type (module) is Friendly unless he sets it otherwise; saved in the draft
     (local().zones) like the NPC placements, tried with PLAY in the Mission Editor and sent to players with PUBLISH (content.zones; the server checks it).
   - Mission Editor, every tree mission (Blocks and Form view): "Zones and armed people": the zone of this mission's locations and rooms and of city areas while it runs,
     the armed people placed in its rooms, and what happens when the player is taken down. (mission.combat)
   - The "Change zone" step / Zone block: stepFields (shared by both views) and its title. */
(function(root){
 'use strict';
 const Z=root.VoidZones;if(!Z||typeof document==='undefined')return;
 const S=()=>root.VoidMissionEditor&&root.VoidMissionEditor.shared;
 const el=(tag,text,cls,attrs)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
 const btn=(text,fn,cls,attrs)=>{const b=el('button',text,cls,{type:'button',...(attrs||{})});b.onclick=e=>{e.preventDefault();fn(e);};return b;};
 const hint=t=>el('span',t,'me-help');
 const WORD={friendly:'Friendly',neutral:'Neutral',hostile:'Hostile'};
 const HELP='FRIENDLY (green): the pistol can be drawn and holstered but never fired. NEUTRAL (orange): it can be fired, but a shot (or hitting someone) makes the armed people there attack the player for a while and the civilians run; drawing or holstering never provokes anyone, and with the safety catch on (Combat Balance) the first trigger press only warns. HOSTILE (red): the armed people attack on sight; the player can shoot back. Nothing fails a mission just because the player drew the gun.';
 const zoneSelect=(value,on,{normal='Normal',attrs={}}={})=>{const s=el('select','','',attrs);if(normal!==false)s.append(new Option(normal,''));for(const z of Z.ZONES)s.append(new Option(WORD[z],z));s.value=value||'';
  const paint=()=>{const z=s.value;s.style.borderLeft=z?'4px solid '+Z.INFO[z].colour:'';};paint();s.onchange=()=>{paint();on(s.value||null);};return s;};
 const placeOpts=()=>{const P=root.VoidPlaces;if(!P||!P.options)return [];return P.options().filter(o=>o.selectable&&(P.parents(o.id)||[]).includes('neochinatown'));};
 const placeName=id=>{const P=root.VoidPlaces;return (P&&P.name&&P.name(id))||((P&&P.node&&P.node(id))||{}).name||id;};
 const typeName=t=>((root.VoidModules&&root.VoidModules.TYPES&&root.VoidModules.TYPES[t])||{}).name||t;
 /* The rooms of a mission's locations: [{ref, label, type}] (a location itself: ref '<loc>', type null). */
 function rooms(m,{whole=true}={}){const out=[];for(const a of m.apartments||[]){if(!a||!a.id)continue;if(whole)out.push({ref:a.id,label:'The whole of “'+a.id+'”',type:null});
   if(Array.isArray(a.modules))for(const mm of a.modules){if(mm&&mm.id)out.push({ref:a.id+'/'+mm.id,label:a.id+' › '+mm.id+' ('+typeName(mm.type)+')',type:mm.type});}
   else if(a.style){out.push({ref:a.id+'/flat',label:a.id+' › the apartment',type:'apt-'+a.style});out.push({ref:a.id+'/hall',label:a.id+' › its hallway',type:'hall-'+a.style});}}return out;}
 const targetLabel=(m,t)=>{if(!t)return '…';if(t.startsWith('area:'))return placeName(t.slice(5));const r=rooms(m).find(x=>x.ref===t);return r?r.label.replace(/^The whole of /,''):t;};
 // ---------------------------------------------------------------- the "Change zone" step
 function title(m,o){return 'Zone: '+targetLabel(m,o.target)+' → '+(o.zone?WORD[o.zone].toUpperCase():'…');}
 function stepFields(m,o,eo){const out=[];const r1=el('div','','me-row mb-fields');
  const ts=el('select','','',{'aria-label':'What changes','data-me-step-zone-target':o.id});ts.append(new Option('— choose the room, location or area —',''));
  const g1=el('optgroup','','',{label:'This mission’s locations'});for(const r of rooms(m))g1.append(new Option(r.label,r.ref));if(g1.children.length)ts.append(g1);
  const g2=el('optgroup','','',{label:'City areas (NeoChinatown)'});for(const p of placeOpts())g2.append(new Option(' '.repeat(Math.max(0,p.depth-3)*2)+p.name,'area:'+p.id));ts.append(g2);
  ts.value=o.target||'';ts.onchange=()=>eo(x=>{const was=x.label;x.target=ts.value;if(!was||/^Change zone|^Zone:/.test(was))x.label=title(m,x).slice(0,120);},true);
  r1.append(el('span','Make','me-small'),ts,el('span','','me-small'));
  const zs=zoneSelect(o.zone,v=>eo(x=>{const was=x.label;x.zone=v||'hostile';if(!was||/^Change zone|^Zone:/.test(was))x.label=title(m,x).slice(0,120);},true),{normal:false,attrs:{'aria-label':'Zone','data-me-step-zone':o.id}});r1.append(el('span','from here on','me-small'),zs);out.push(r1);
  const r2=el('div','','me-row mb-fields'),us=el('select','','',{'aria-label':'Until','data-me-step-zone-until':o.id});us.append(new Option('until the mission ends',''));
  const ids=(m.objectives||[]).map(x=>x.id),i=ids.indexOf(o.id);(m.objectives||[]).forEach((x,k)=>{if(k>i)us.append(new Option('until step '+(k+1)+' is done: '+String(x.label||x.kind).slice(0,40),x.id));});us.value=o.until||'';
  us.onchange=()=>eo(x=>{if(us.value)x.until=us.value;else delete x.until;},true);r2.append(us,el('span','(then it is back to its normal zone)','me-small'));out.push(r2);
  const r3=el('label','','me-check-row'),cb=el('input','','',{type:'checkbox','data-me-step-zone-spawn':o.id});cb.checked=o.spawn===true;cb.onchange=()=>eo(x=>{if(cb.checked)x.spawn=true;else delete x.spawn;},false);
  r3.append(cb,document.createTextNode(' Bring in the armed people placed there (they appear only when this step is reached)'));out.push(r3);
  if(!(m.apartments||[]).length)out.push(hint('A room or location needs a Location block first; city areas work without one.'));return out;}
 // ---------------------------------------------------------------- the mission's panel
 function missionPanel(m,ed){const c=m.combat||{},box=el('section','','me-end me-zones',{'data-me-zones':m.id});box.append(el('h4','Zones and armed people'),hint(HELP));
  const set=(fn,redraw=true)=>ed(x=>{x.combat=x.combat&&typeof x.combat==='object'?x.combat:{};fn(x.combat,x);for(const k of ['areas','places'])if(x.combat[k]&&!Object.keys(x.combat[k]).length)delete x.combat[k];if(x.combat.armed&&!x.combat.armed.length)delete x.combat.armed;if(!Object.keys(x.combat).length)delete x.combat;},redraw);
  // taken down
  const dr=el('div','','me-row');const ds=el('select','','',{'aria-label':'If the player is taken down','data-me-zone-death':m.id});ds.append(new Option('they try again (outside the location, full health)','retry'),new Option('the mission fails (back to its giver)','fail'));ds.value=c.onDeath||'retry';
  ds.onchange=()=>set(x=>{if(ds.value==='fail')x.onDeath='fail';else delete x.onDeath;},false);dr.append(el('b','If the player is taken down'),ds);box.append(dr);
  // the locations' rooms
  const rs=rooms(m);if(rs.length){box.append(el('p','This mission’s locations (Normal = the Zones table in Developer Tools, Friendly unless changed there):','me-small'));
   for(const r of rs){const row=el('div','','me-row');row.append(el('span',r.label,'me-small'),zoneSelect((c.places||{})[r.ref],v=>set(x=>{x.places=x.places||{};if(v)x.places[r.ref]=v;else delete x.places[r.ref];}),{attrs:{'aria-label':'Zone of '+r.label,'data-me-zone-place':r.ref}}));box.append(row);}}
  else box.append(el('p','Add a location (Apartments / Location) to set the zone of its rooms and place armed people in them.','me-small'));
  // city areas while it runs
  box.append(el('p','City areas while this mission runs (only the ones you add change):','me-small'));
  for(const [id,z] of Object.entries(c.areas||{})){const row=el('div','','me-row');row.append(el('span',placeName(id),'me-small'),zoneSelect(z,v=>set(x=>{x.areas=x.areas||{};if(v)x.areas[id]=v;else delete x.areas[id];}),{normal:false,attrs:{'aria-label':'Zone of '+placeName(id),'data-me-zone-area':id}}),btn('×',()=>set(x=>{delete x.areas[id];}),'me-x',{'aria-label':'Remove '+placeName(id)}));box.append(row);}
  {const row=el('div','','me-row'),as=el('select','','',{'aria-label':'Add a city area','data-me-zone-area-add':m.id});as.append(new Option('+ add a city area …',''));for(const p of placeOpts())if(!(c.areas||{})[p.id])as.append(new Option(' '.repeat(Math.max(0,p.depth-3)*2)+p.name,p.id));
   as.onchange=()=>{if(as.value){const id=as.value;set(x=>{x.areas=x.areas||{};x.areas[id]='neutral';});}};row.append(as);box.append(row);}
  // armed people
  const roomsOnly=rooms(m,{whole:false});box.append(el('p','Armed people (they stand in a room: a guard holds its spot, a patrol walks its route; in a Hostile room they attack on sight, in a Neutral one only after a shot, never in a Friendly one):','me-small'));
  (c.armed||[]).forEach((a,k)=>{const row=el('div','','me-row me-armed',{'data-me-armed':a.id});const upd=fn=>set(x=>{const y=x.armed&&x.armed[k];if(y)fn(y);},false),updR=fn=>set(x=>{const y=x.armed&&x.armed[k];if(y)fn(y);},true);
   const fs=el('select','','',{'aria-label':'Figure','data-me-armed-figure':a.id});for(const [id,f] of Object.entries(Z.FIGURES))fs.append(new Option(f.name,id));fs.value=a.figure||'security';fs.onchange=()=>upd(y=>{y.figure=fs.value;});
   const rsel=el('select','','',{'aria-label':'Room','data-me-armed-room':a.id});rsel.append(new Option('— which room? —',''));for(const r of roomsOnly)rsel.append(new Option(r.label,r.ref));rsel.value=a.at||'';rsel.onchange=()=>updR(y=>{y.at=rsel.value;y.x=0;y.z=0;delete y.route;});
   const role=el('select','','',{'aria-label':'Guard or patrol','data-me-armed-role':a.id});role.append(new Option('guards the spot','guard'),new Option('patrols','patrol'));role.value=a.role||'guard';role.onchange=()=>updR(y=>{y.role=role.value;if(role.value==='patrol'&&!(y.route||[]).length)y.route=[[Number(y.x)||0,(Number(y.z)||0)+2]];if(role.value==='guard')delete y.route;});
   const num=(v,label,key,fn)=>{const i=el('input','','',{type:'number',step:'0.1',size:'4','aria-label':label,[key]:a.id});i.value=String(v??0);i.onchange=()=>{const n=Number(i.value);if(Number.isFinite(n))upd(y=>fn(y,n));};return i;};
   row.append(el('b',a.id),fs,el('span','in','me-small'),rsel,role,el('span','at x','me-small'),num(a.x,'x (metres across the room)','data-me-armed-x',(y,n)=>{y.x=n;}),el('span','z','me-small'),num(a.z,'z (metres along the room)','data-me-armed-z',(y,n)=>{y.z=n;}),
    el('span','facing','me-small'),num(Math.round((a.yaw||0)*180/Math.PI),'Facing (degrees)','data-me-armed-yaw',(y,n)=>{y.yaw=Math.round(n*Math.PI/180*100)/100;}),el('span','°','me-small'));
   if(a.role==='patrol'){const rt=el('input','','',{size:'22','aria-label':'Patrol route: x,z; x,z','data-me-armed-route':a.id,placeholder:'x,z; x,z'});rt.value=(a.route||[]).map(p=>p.join(',')).join('; ');
    rt.onchange=()=>upd(y=>{const pts=rt.value.split(';').map(s=>s.split(',').map(Number)).filter(p=>p.length===2&&p.every(Number.isFinite)).slice(0,Z.LIMIT.route);y.route=pts;});row.append(el('span','route','me-small'),rt);}
   const b=(root.VoidModules&&a.at)?(()=>{const rr=roomsOnly.find(r=>r.ref===a.at);return rr&&root.VoidModules.bounds(rr.type);})():null;if(b)row.append(el('span','(room: x '+b[0].toFixed(1)+'..'+b[1].toFixed(1)+', z '+b[2].toFixed(1)+'..'+b[3].toFixed(1)+')','me-small'));
   row.append(btn('×',()=>set(x=>{x.armed.splice(k,1);}),'me-x',{'aria-label':'Remove '+a.id}));box.append(row);});
  if((c.armed||[]).length<Z.LIMIT.armed)box.append(btn('+ ARMED PERSON',()=>set(x=>{x.armed=x.armed||[];let n=x.armed.length+1;while(x.armed.some(y=>y.id==='armed-'+n))n++;x.armed.push({id:'armed-'+n,at:(roomsOnly[0]||{}).ref||'',x:0,z:0,figure:'security',role:'guard'});}),'',{'data-me-armed-add':m.id,...(roomsOnly.length?{}:{disabled:''})}));
  const probs=Z.combatProblems(m,{places:root.VoidMissionGivers?.placeIds?.(),types:root.VoidModules?.inventory?.().types});for(const p of probs)box.append(el('p',p,'me-warn'));
  return box;}
 // ---------------------------------------------------------------- Developer Tools > Zones (the owner's table)
 let filter='';
 function table(panel,heading){const sh=S();panel.innerHTML='';panel.append(heading());if(!sh){panel.append(el('p','Loading…','dev-note'));return;}
  const d=sh.local(),z=d.zones||{},wrap=el('div','','me-zones-table',{'data-zones-table':'1'});
  wrap.append(el('h3','Zones'),el('p',HELP,'dev-note'),el('p','Every NeoChinatown area and every kind of location is FRIENDLY until you change it here. A mission can still change one of its own rooms or a city area (Mission Editor: “Zones and armed people”, or a Zone block in the timeline). Your changes are in your draft: try them with PLAY in the Mission Editor, send them to players with PUBLISH. The numbers (how long guards stay angry, how far they see, how far civilians run, the safety catch) are in Combat Balance.','dev-note'));
  const save=fn=>{const dd=sh.local();dd.zones=dd.zones||{};fn(dd.zones);const c=Z.cleanTable(dd.zones);if(c)dd.zones=c;else delete dd.zones;sh.saveLocal(dd);table(panel,heading);};
  const f=el('input','','',{type:'search',placeholder:'Find an area or a location type …','aria-label':'Find','data-zones-filter':'1'});f.value=filter;f.oninput=()=>{filter=f.value;for(const r of wrap.querySelectorAll('[data-zones-row]'))r.hidden=!!filter&&!r.textContent.toLowerCase().includes(filter.toLowerCase());};wrap.append(f);
  const count=Object.keys(z.areas||{}).length+Object.keys(z.modules||{}).length;wrap.append(el('p',count?count+' place(s) set to Neutral or Hostile.':'Everything is Friendly.','me-small'));
  wrap.append(el('h4','City areas'));for(const p of placeOpts()){const row=el('div','','me-row',{'data-zones-row':'area:'+p.id});row.style.paddingLeft=Math.max(0,p.depth-3)*14+'px';
   row.append(el('span',p.name+(p.proposed?' (working name)':''),'me-small'),zoneSelect((z.areas||{})[p.id]||'friendly',v=>save(t=>{t.areas=t.areas||{};if(v&&v!=='friendly')t.areas[p.id]=v;else delete t.areas[p.id];}),{normal:false,attrs:{'aria-label':'Zone of '+p.name,'data-zones-area':p.id}}));wrap.append(row);}
  wrap.append(el('h4','Kinds of location (modules and apartments)'));const M=root.VoidModules;
  for(const id of (M&&M.TYPE_IDS)||[]){const t=M.TYPES[id],row=el('div','','me-row',{'data-zones-row':'mod:'+id});row.append(el('span',t.name+' · '+t.cat,'me-small'),zoneSelect((z.modules||{})[id]||'friendly',v=>save(tt=>{tt.modules=tt.modules||{};if(v&&v!=='friendly')tt.modules[id]=v;else delete tt.modules[id];}),{normal:false,attrs:{'aria-label':'Zone of '+t.name,'data-zones-module':id}}));wrap.append(row);}
  const probs=Z.tableProblems(d.zones,{places:root.VoidMissionGivers?.placeIds?.(),types:M?.inventory?.().types});for(const p of probs)wrap.append(el('p',p,'me-warn'));
  panel.append(wrap);if(filter)f.oninput();}
 root.VoidZoneEditor={stepFields,title,missionPanel,table,rooms,HELP};
})(globalThis);
