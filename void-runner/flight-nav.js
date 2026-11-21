/* The V1 Map app in flight (the owner, 19 Nov 2026): "While flying have the Map App show locations in that system they can fly to such as space stations, planets,
   warp markers to other systems. If they click a space station set a blue square around the warp marker to that station. If they have a mission that is in another
   system mark that warp marker with a yellow square."
   Reuses what flight already has: VoidUniverse (systems, discovered places, destinations(): this system's places plus the hub of each other known system,
   nextHop(): which marker leads toward a place), the free-travel route markers (world-integration.js flightRoutes / drawWarpMarker; flying into a marker sets the
   course, unchanged), and the Mission Log (VoidMissions.active). The navigation target is saved as story.flags.navTarget (a place id; kept through warps, cleared on
   arrival). Pure rules here (Node tests); the drawing and the app page at the end run in the browser only. */
(function(root){
 'use strict';
 const Uof=()=>typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const Nav=()=>typeof module!=='undefined'?require('./nav-coords.js'):root.VoidNav;
 /* The markers flight shows now (nav-coords.js: every location with Rook's coordinates, else the route to the mission and the way home, else the known places). act: active missions. */
 const shownList=(s,U,act)=>{const N=Nav();return N?N.markers(s,act||[]):U.destinations(s);};
 const nameOf=(U,id)=>(U.locations[id]?.name)||(root.C?.stations?.[id]?.name)||id.replace(/(^|-)./g,m=>m.toUpperCase().replace('-',' '));
 /* The marker (a route id from destinations()) that leads toward place id from where the player is; null when there is none (unknown system, the place itself). */
 function markerFor(s,id,U=Uof(),act){if(!id||!U.locations[id]||id===s.location)return null;const hop=U.nextHop(s.location,id),list=shownList(s,U,act);return list.includes(hop)?hop:null;}
 /* What the Map app lists in flight. kind: 'station' | 'planet' | 'warp' (the jump to another system's hub). */
 function entries(s,U=Uof(),act){const here=U.system(s.location),N=Nav(),routeOnly=!!N&&N.mode(s,act||[])==='route',known=routeOnly?[]:s.universe?.discoveredLocations||[],out=[];
  for(const id of shownList(s,U,act)){const other=U.system(id)!==here,l=U.locations[id]||{};out.push({id,name:nameOf(U,id),system:U.system(id),systemName:U.systems[U.system(id)]?.name||'',kind:other?'warp':(l.surface||l.planet)?'planet':'station',marker:id,direct:true});}
  // known places in other systems that are not their hub: reached through that system's warp marker
  for(const id of known)if(id!==s.location&&U.system(id)!==here&&!out.some(e=>e.id===id)){const m=markerFor(s,id,U,act);if(!m)continue;const l=U.locations[id]||{};out.push({id,name:nameOf(U,id),system:U.system(id),systemName:U.systems[U.system(id)]?.name||'',kind:(l.surface||l.planet)?'planet':'station',marker:m,direct:false});}
  return out;}
 /* Active missions whose destination is in another system: the warp marker toward it, with the mission's title. */
 function missionMarkers(s,active,U=Uof()){const here=U.system(s.location),out=new Map();for(const m of active||[]){if(!m||m.completed||!m.destination||!U.locations[m.destination]||U.system(m.destination)===here)continue;const mk=markerFor(s,m.destination,U,active);if(mk&&!out.has(mk))out.set(mk,{marker:mk,mission:m.title||m.id,destination:m.destination});}return [...out.values()];}
 const target=s=>{const t=s?.story?.flags?.navTarget;return typeof t==='string'&&Uof().locations[t]?t:null;};
 function select(s,id,U=Uof()){if(!s?.story?.flags)return false;if(id==null||id===''){delete s.story.flags.navTarget;return true;}if(!U.locations[id]||!(s.universe?.discoveredLocations||[]).includes(id)||id===s.location)return false;s.story.flags.navTarget=id;return true;}
 /* Arriving where the target is ends it. */
 function arrived(s){if(target(s)&&s.story.flags.navTarget===s.location){delete s.story.flags.navTarget;return true;}return false;}
 const api={markerFor,entries,missionMarkers,target,select,arrived};
 if(typeof module!=='undefined'){module.exports=api;return;}
 root.VoidFlightNav=api;

 // ---- browser: the squares on the in-flight markers ----
 const st=()=>{try{return state;}catch{return null;}};
 let activeAt=0,activeList=[];const active=()=>{const now=Date.now();if(now-activeAt>1000){activeAt=now;try{activeList=VoidMissions.active(state,C);}catch{activeList=[];}}return activeList;};   // read once a second (sync is not free)
 const BLUE='#5ea8ff',YELLOW='#ffd75e';
 function vectorFor(id){try{if(state.universe.freeTravel&&typeof flightRoutes==='function'){const r=flightRoutes().find(x=>x.id===id);return r?r.vector:null;}return flight.route&&flight.route.destination===id?flight.route.vector:null;}catch{return null;}}
 function square(v,color,size,label,dash,below){const p=flightPoint({x:v.x*140,y:v.y*140,z:v.z*140});
  if(p.z<=0||p.x<W*.06||p.x>W*.94||p.y<H*.08||p.y>H*.8){try{cockpitArrow({x:v.x*140,y:v.y*140,z:v.z*140},label,color);}catch{}return 'edge';}
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.shadowColor='#000';ctx.shadowBlur=6;if(dash)ctx.setLineDash(dash);ctx.strokeRect(p.x-size,p.y-size,size*2,size*2);ctx.setLineDash([]);
  ctx.font='bold 11px Consolas';ctx.textAlign='center';ctx.fillText(label,p.x,below?p.y+size+16:p.y-size-7);ctx.restore();return 'on';}
 const shown={nav:null,mission:[]};
 if(typeof drawWarpMarker==='function'){const base=drawWarpMarker;drawWarpMarker=function(){base.apply(this,arguments);shown.nav=null;shown.mission=[];
  try{const s=st();if(!s||mode!=='play'||root.VoidFlightSkirmish?.active||!flight.route||!['align','departure'].includes(flight.route.phase))return;if(typeof navigationReveal!=='undefined'&&VoidNavigationReveal.opacity(navigationReveal)<=0)return;
   for(const m of missionMarkers(s,active())){const v=vectorFor(m.marker);if(v){square(v,YELLOW,38,'◆ MISSION · '+(Uof().systems[Uof().system(m.destination)]?.name||'').toUpperCase(),null,true);shown.mission.push(m.marker);}}
   const t=target(s),mk=t&&markerFor(s,t,Uof(),active());if(mk){const v=vectorFor(mk);if(v){square(v,BLUE,32,'■ NAV · '+nameOf(Uof(),t).toUpperCase()+(mk!==t?' (WARP)':''),[6,3],false);shown.nav=mk;}}}catch{}};}
 // arriving at the target clears it
 setInterval(()=>{const s=st();if(s&&arrived(s)){try{save();}catch{}}},1000);
 // ---- browser: the Map app's page in flight (personal-device.js map() asks for it while flying) ----
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function view(){const s=st(),U=Uof();if(!s)return '<div class="pd-empty">Not available.</div>';const t=target(s),miss=missionMarkers(s,active()),list=entries(s,U,active()),navMode=Nav()?Nav().mode(s,active()):'full',here=U.systems[U.system(s.location)]?.name||'';
  const missOn=id=>miss.find(m=>m.marker===id);
  const row=e=>{const sel=t===e.id,m=missOn(e.marker),hereMission=active().find(x=>!x.completed&&x.destination===e.id);
   return '<button type="button" class="fn-row'+(sel?' fn-sel':'')+'" data-nav="'+esc(e.id)+'" aria-pressed="'+sel+'"><span class="fn-kind">'+({station:'STATION',planet:'PLANET',warp:'WARP'}[e.kind])+'</span><b>'+esc(e.name)+'</b>'
    +(e.kind==='warp'?'<small>warp marker to '+esc(e.systemName)+'</small>':!e.direct?'<small>in '+esc(e.systemName)+' · through the warp marker to '+esc(nameOf(U,e.marker))+'</small>':'')
    +(sel?'<em class="fn-tag fn-blue">■ NAV TARGET</em>':'')+((m&&e.kind==='warp')||hereMission?'<em class="fn-tag fn-yellow">◆ MISSION'+(hereMission?' · '+esc(hereMission.title):m?' · '+esc(m.mission):'')+'</em>':'')+'</button>';};
  const inSys=list.filter(e=>e.kind!=='warp'&&e.direct),warps=list.filter(e=>e.kind==='warp'),far=list.filter(e=>!e.direct);
  return '<div class="pd-note">FLIGHT NAVIGATION · '+esc(here.toUpperCase())+' · choose a place: its marker gets a <b style="color:'+BLUE+'">blue ■ square</b>. A mission in another system marks its warp marker with a <b style="color:'+YELLOW+'">yellow ◆ square</b>. Fly into a marker to set course.</div>'
   +(navMode==='route'?'<div class="pd-note" data-nav-mode="route">ROUTE ONLY · the markers on the way to your mission, and the way home. Other locations are added when you receive their nav data.</div>':navMode==='known'?'<div class="pd-note" data-nav-mode="known">KNOWN PLACES · the places you have already found. Other locations are added when you receive their nav data.</div>':'<div class="pd-note" data-nav-mode="full">ALL LOCATIONS · nav data received.</div>')
   +'<h2>IN THIS SYSTEM</h2>'+(inSys.length?inSys.map(row).join(''):'<div class="pd-empty">'+(navMode==='route'?'None on your route.':'No other known places in this system.')+'</div>')
   +'<h2>WARP MARKERS TO OTHER SYSTEMS</h2>'+(warps.length?warps.map(row).join(''):'<div class="pd-empty">No other system known yet.</div>')
   +(far.length?'<h2>KNOWN PLACES IN OTHER SYSTEMS</h2>'+far.map(row).join(''):'')
   +(t?'<div class="pd-tabs" style="margin-top:10px"><button type="button" data-nav="">CLEAR NAV TARGET</button></div>':'');}
 function act(id){const s=st();if(!s)return false;const ok=select(s,id||null);if(ok){try{save();}catch{}try{VoidAudio.event('confirm');}catch{}}return ok;}
 Object.assign(api,{view,act,BLUE,YELLOW});Object.defineProperty(api,'shown',{get(){return {nav:shown.nav,mission:[...shown.mission]};}});   // what the last frame drew (tests)
})(globalThis);
