/* FOLLOW INTO A PLACE: the inside part (browser only; the owner, 20 Nov 2026: "For the follow options if I add an apartment there should be an option to follow into the
   apartment"). The rules are npc-escort.js's (intoProblems, roomGraph, roomPath, crossing, insideDone, gridRoute); the street part is the ordinary follow / lead step run by
   ncz-street-pair.js and npc-made.js, whose spot is the place's street door (live-content.js plans()). This file:
   - WHERE SHE IS for each running "into" step (one per NPC): 'street', or a scene of the place (a cluster of modules 'c:<id>', or an older apartment's 'hall' / 'flat'),
     or 'out' (coming back out behind the player). live-content.js plans() asks away(key) / gen(key) / street(key): while she is inside, she is off the street.
   - THE PLAYER CHANGES PLACE (a walking area of the place is built: VoidApartments.build is wrapped; the street is noticed by a poll): crossing() says whether she comes
     through the same door behind them (after about her walk to it), rides the elevator with them, waits where she is, or the mission fails.
   - HER FIGURE INSIDE: built in the interior scene with the same model, look, added animations and props as on the street (the model is loaded behind the loading screen,
     zone prepare), never popped in view: she arrives through the door behind the player (the door slides open for her), or is already waiting ahead (she went first),
     or rides in the cab beside them. She leads (follow-them: room to room through doorways, through doors that lead elsewhere when the player is near, into the elevator
     cab) or follows the player's own trail (they-follow). The doors she comes to slide open for her. TALK TO <NAME> works inside (the same action as on the street).
   - DONE when both are inside the chosen room (npc-escort.js insideDone): the street step's onEscort('done') completes it. After that she stays in that room until the
     mission is done (mission-content.js insideNow), then goes back to her routine without being seen (ncz-street-pair.js / npc-made.js rejoin).
   Private like the place itself (each player's own copy of the street and of the place). Saves: story.flags.npcEsc gets a fifth field 'in' while she is inside, so a reload
   starts the step again at the street door (npc-escort.js resumeInto); nothing else is saved. */
(function(root){
 'use strict';
 if(typeof document==='undefined')return;
 const E=()=>root.VoidNPCEscort,A=()=>root.VoidApartments,M=()=>root.VoidModules,LC=()=>root.VoidLiveContent,MC=()=>root.VoidMissionContent,NPX=()=>root.VoidNPCPaths,SP=()=>root.VoidStreetPair,MD=()=>root.VoidMadeNPCs;
 const WL=()=>{try{return typeof walkingLocation!=='undefined'?walkingLocation:null;}catch{return null;}};
 const ME=()=>{try{return typeof walker!=='undefined'&&walker&&Number.isFinite(walker.x+walker.z)?walker:null;}catch{return null;}};
 const MODE=()=>{try{return typeof mode!=='undefined'?mode:'';}catch{return '';}};
 const ST=()=>{try{return typeof state!=='undefined'?state:null;}catch{return null;}};
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const steps=new Map();   // step key -> {key, npc, kind, set, apt, mod, door, loc, place, where, x, z, yaw, pend, ahead, gen, back, until, done}
 const heldAt=new Map();  // step key -> {scene, x, z, yaw}: where she stays after the step (this session; a reload puts her in the room's free spot)
 const log=[];const note=(e,o)=>{log.push({e,...o,at:Date.now()});if(log.length>80)log.shift();};
 // ---------------------------------------------------------------- what runs now
 function running(){let esc={};try{esc=LC()?.escortNow?.()||{};}catch{}const out={};for(const [npc,e] of Object.entries(esc))if(e&&e.apt!=null&&e.loc&&(e.kind==='follow-them'||e.kind==='they-follow'))out[npc]=e;return out;}
 function held(){const s=ST(),env=LC()?.env;try{return s&&env&&MC()?.insideNow?MC().insideNow(s,env):{};}catch{return {};}}
 function sync(){const run=running(),keys=new Set();
  for(const [npc,e] of Object.entries(run)){keys.add(e.key);let s=steps.get(e.key);
   if(!s){s={key:e.key,npc,kind:e.kind,set:{wait:e.wait,lost:e.lost,ifLost:e.ifLost},apt:e.apt,mod:e.mod||null,door:e.door,loc:e.loc,place:e.place,mission:e.mission,where:'street',gen:0,x:null,z:null,yaw:0,pend:null,ahead:false,back:null,done:false};steps.set(e.key,s);note('start',{key:e.key});}
   s.place=e.place;s.door=e.door;}
  for(const k of [...steps.keys()])if(!keys.has(k)){const s=steps.get(k);if(s&&!s.done)note('gone',{key:k});steps.delete(k);}
  return run;}
 const byNpc=npc=>{for(const s of steps.values())if(s.npc===npc)return s;return null;};
 // ---------------------------------------------------------------- the places: which scene of which place the player is in
 /* {kind:'street'} | {kind:'loc', locs:[instance keys this area belongs to], scene, def} | {kind:'other'}. scene: 'c:<cluster>' (modules) or 'hall' / 'flat' (an older apartment). */
 function sceneOf(def){const w=def||WL();if(!w)return {kind:'other'};if(w.id==='neochinatown'&&w.area==='street')return {kind:'street'};if(!w.apartment)return {kind:'other'};
  if(w.modular)return {kind:'loc',locs:[w.inst],scene:'c:'+(w.cluster&&w.cluster.id),def:w};
  if(w.part==='flat')return {kind:'loc',locs:[w.inst],scene:'flat',def:w};
  const v=A()?.visit;return {kind:'loc',locs:((v&&v.list)||[]).map(a=>a.key).concat((w.open||[]).map(o=>o.key)),scene:'hall',def:w};}
 const graphs=new Map();function graph(s){const k=s.loc+'|'+JSON.stringify(s.place&&s.place.modules?s.place.modules.map(m=>[m.id,m.type,m.x,m.z,m.rot,m.floor]):s.place&&s.place.style);let g=graphs.get(k);if(!g){g=E().roomGraph(s.place);graphs.set(k,g);if(graphs.size>12)graphs.delete(graphs.keys().next().value);}return g;}
 const sceneOfRoom=(g,room)=>g.legacy?room:'c:'+g.clusters[room];
 function roomAt(def,x,z){if(!def)return null;if(def.modular){try{return M().moduleAt(def,x,z);}catch{return null;}}return def.part==='flat'?'flat':'hall';}
 // ---------------------------------------------------------------- where she is on the street (the street figure)
 function streetPos(npc){try{const sp=SP()?.live?.();if(sp&&sp.her&&sp.her.id===npc)return {x:sp.her.x,z:sp.her.z};const ms=MD()?.live?.();const p=ms&&Array.isArray(ms.people)?ms.people.find(q=>q.id===npc):null;if(p&&p.enabled!==false)return {x:p.x,z:p.z};}catch{}return null;}
 // ---------------------------------------------------------------- the save flag (a reload starts the step again at the street door)
 let savedAt=0;function flag(s){try{const st=ST(),X=E();if(!st||!X)return;const v=X.encode({key:s.key,phase:'in',x:0,z:0,w:'in'});if(v&&st.story.flags[X.FLAG]!==v){st.story.flags[X.FLAG]=v;if(Date.now()-savedAt>3000){savedAt=Date.now();try{save();}catch{}}}}catch{}}
 const replan=()=>{try{LC()?.replan?.();}catch{}};
 function tell(s,event,extra){try{SP()?.onEscort?.({npc:s.npc,key:s.key,step:s.key,kind:s.kind,event,phase:event,x:s.x,z:s.z,...(extra||{})});}catch{}}
 // ---------------------------------------------------------------- the player changes place
 let cur={kind:'other'},last=null;   // last: {x, z} of the player in `cur`
 function herPosIn(s,scene){if(scene.kind==='street')return s.where==='street'?(streetPos(s.npc)||s.onStreet||null):null;/* the street is released before the next place is built: her last place on it */if(scene.kind==='loc'&&scene.locs.includes(s.loc)&&s.where===scene.scene)return s.pend?(s.pend.at||null):Number.isFinite(s.x)?{x:s.x,z:s.z}:null;return null;}
 function change(to){const from=cur;cur=to;if(from.kind===to.kind&&from.scene===to.scene&&String(from.locs)===String(to.locs))return;sync();
  for(const s of steps.values()){if(s.done)continue;
   const into=to.kind==='loc'&&to.locs.includes(s.loc),outOf=to.kind==='street'&&from.kind==='loc'&&from.locs.includes(s.loc);if(!into&&!outOf)continue;
   if(into&&s.where===to.scene){note('ahead',{key:s.key,scene:to.scene});continue;}   // she went first: she is there
   const hp=herPosIn(s,from),herIn=!!hp,d=hp&&last?dist(hp,last):null;
   const cab=into&&cabSpawn(to.def),hr=hp&&from.kind==='loc'?roomAt(from.def,hp.x,hp.z):null,g=graph(s),inCab=!!cab&&d!=null&&d<=E().INTO.ride;   /* in the cab with the player, or right at its door beside them: she rides along */void hr;void g;
   const r=E().crossing({kind:s.kind,set:s.set,herIn,dist:d,cab,inCab});note('cross',{key:s.key,from:from.scene||from.kind,to:to.scene||to.kind,go:r.go,delay:r.delay,d});
   if(r.go==='fail'){tell(s,'failed');continue;}if(r.go==='stay')continue;
   if(outOf){s.where='out';s.until=performance.now()+r.delay*1000;s.pend=null;s.x=s.z=null;replan();continue;}
   s.where=to.scene;s.ahead=false;s.x=s.z=null;s.pend={t:r.delay,via:r.go==='ride'?'cab':'door',at:null};flag(s);replan();}}
 function cabSpawn(def){if(!def||!def.modular||!def.cluster)return false;const sp=def.spawn;return !!sp&&(def.cluster.mods||[]).some(m=>/^elevator$/.test(m.type)&&Math.abs(sp[0]-m.cx)<1.1&&Math.abs(sp[2]-m.cz)<1.1);}
 // the street door she went in by (follow-them goes first) and back out after the player
 function onStreet(x){try{if(!x||!x.step)return;sync();const s=steps.get(x.step);if(!s)return;
   if(x.event==='enter'){try{root.VoidBabylon?.district?.aptDoors?.forceOpen?.(s.door);}catch{}note('enter',{key:s.key});}
   if(x.event==='in'&&s.where==='street'){const g=graph(s);s.where=sceneOfRoom(g,g.entry);s.ahead=true;s.x=s.z=null;s.pend=null;note('in',{key:s.key,scene:s.where});flag(s);replan();}}catch{}}
 // the poll: the player's place and position; she comes back out onto the street after her delay
 let lastWL=null;function poll(){try{const run=sync(),L=WL(),walking=MODE()==='walking';if(L!==lastWL&&walking){lastWL=L;change(sceneOf(L));}const w=ME();if(w&&walking&&L===lastWL){last={x:w.x,z:w.z};if(cur.kind==='street')for(const s of steps.values()){const q=s.where==='street'?streetPos(s.npc):null;s.onStreet=q;}}
   const D=E();for(const s of steps.values()){if(s.where==='out'&&performance.now()>=(s.until||0)){const d=D.doorAt(s.door);s.where='street';s.gen++;s.back=d?{x:d.inside.x,z:d.inside.z,phase:s.kind==='follow-them'?'there':null,unarmed:s.kind==='follow-them'}:null;note('out',{key:s.key});replan();}}
   void run;}catch(e){}}
 setInterval(poll,100);
 // ---------------------------------------------------------------- inside: her figure in the interior scene
 const TALK=npc=>{const S=SP(),X=NPX(),Mv=X&&X.MOVABLE&&X.MOVABLE[npc];if(Mv&&Mv.made)return {id:'made-'+npc,action:'made-npc'};return {id:(S&&S.talkId?S.talkId(npc):'street-pair-'+npc),action:(S&&S.TALK_ACTION)||'street-pair'};};
 function who(npc){const X=NPX(),Mv=X&&X.MOVABLE&&X.MOVABLE[npc];if(!Mv)return null;const ch=(LC()?.env?.characters||{})[npc]||null;return {npc,name:Mv.name,asset:Mv.asset,made:!!Mv.made,c:ch,src:Mv.made&&MD()?.fileOf?MD().fileOf(Mv.asset):'assets/models/crowd/'+Mv.asset+'.glb'};}
 const want=(locs)=>{const out=[];sync();for(const s of steps.values())if(locs.includes(s.loc))out.push(s.npc);for(const [npc,h] of Object.entries(held()))if(locs.includes(h.loc))out.push(npc);return [...new Set(out)];};
 function zone(args,h){const B=root.BABYLON,def=args&&args.def,scene=args&&args.scene,parent=args&&args.parent;if(!B||!def||!scene||!parent||!h)return h;
  const here=sceneOf(def);if(here.kind!=='loc')return h;const AS=root.VoidAssets,figs=new Map();let disposed=false,lastT=null,frustum=null,frustumAt=-1,clock=0;
  change(here);   // the player is coming into this scene (the poll would notice a moment later)
  const load=npc=>{const w=who(npc);if(!w||!AS)return Promise.resolve();if(AS.container?.('crowd:'+w.asset))return Promise.resolve();return Promise.resolve(AS.load('crowd:'+w.asset,{src:w.src,background:true},scene)).catch(()=>{});};
  const prep=h.prepare;h.prepare=function(){const a=prep?prep.apply(this,arguments):Promise.resolve();const b=Promise.race([Promise.allSettled(want(here.locs).map(load)),new Promise(r=>setTimeout(r,8000))]);return Promise.all([a,b]);};
  // the walking area's solids (door slabs left out unless locked: they open for her)
  const solids=()=>{const z=root.VoidBabylon?.zone,locked=new Set(((z&&z.doors)||[]).filter(d=>d.locked).map(d=>d.id||d.rec?.id));return (def.solids||[]).map(s=>s.door&&locked.has(s.door)?{...s,door:undefined}:s);};
  const ORI=()=>(A()&&A().ORIGIN)||[0,0];
  const doors=()=>((root.VoidBabylon?.zone?.doors)||[]).map(d=>({d,x:d.rec?d.rec.x:ORI()[0]+(d.at||[0,0])[0],z:d.rec?d.rec.z:ORI()[1]+(d.at||[0,0])[1]}));
  const hit=(x,z,S)=>S.some(s=>s&&!s.door&&Math.abs(x-s.position[0])<s.size[0]/2+.2&&Math.abs(z-s.position[2])<s.size[2]/2+.2);
  // the normal of a door (pointing out of this room, away from the free side)
  function normalAt(p){const S=def.solids||[];let best=null;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const fin=!hit(p.x-dx*.8,p.z-dz*.8,S),fout=!hit(p.x+dx*.8,p.z+dz*.8,S);const sc=(fin?1:0)+(fout?0:.5);if(!best||sc>best.sc)best={sc,n:[dx,dz]};}return best?best.n:[0,1];}
  function spawnPt(){const sp=def.spawn||[0,0,0];return {x:sp[0],z:sp[2]};}
  // the door the player came in by (nearest to where they were put), its outside point (where she comes from) and a point inside
  function arrival(){const sp=spawnPt(),ds=doors();let best=null;for(const q of ds){const k=Math.hypot(q.x-sp.x,q.z-sp.z);if(!best||k<best.k)best={...q,k};}if(!best)return {from:sp,in:sp,door:null};
   const vx=sp.x-best.x,vz=sp.z-best.z,l=Math.hypot(vx,vz)||1,n=[vx/l,vz/l];return {door:best.d,from:{x:best.x-n[0]*.6,z:best.z-n[1]*.6},in:E().freeSpot({x:best.x+n[0]*1.4+(-n[1])*.55,z:best.z+n[1]*1.4+n[0]*.55},def.solids)};}
  const fwd=()=>{const y=Number.isFinite(def.yaw)?def.yaw:0;return [Math.sin(y),Math.cos(y)];};
  // ---- a figure ----
  function make(npc,at,yaw){const w=who(npc);if(!w||!AS?.instance)return null;const n=AS.instance('crowd:'+w.asset,parent);if(!n)return null;
   n.metadata={...n.metadata,character:npc,displayName:w.name,escortIndoors:true,...(w.made?{made:npc}:{streetPair:npc})};
   for(const m of n.getChildMeshes(false)){m.isPickable=false;if(m.material&&m.material.maxSimultaneousLights<8)m.material.maxSimultaneousLights=8;}
   const anim=root.VoidCrowd?.animate?.(n,w.asset,'idle')||null;const cfg=SP()?.config;for(const g of n.metadata?.animationGroups||[])if(cfg)g.blendingSpeed=cfg.blend;
   if(w.made&&w.c){try{root.VoidNPCLooks?.applyLook?.(n,w.asset,w.c.look?{id:'made-'+npc,name:w.c.name,...w.c.look}:null,{scene});}catch{}}
   try{const an=w.made?((LC()?.env?.npcPlans||{})[npc]||{}).anims||[]:SP()?.animsFor?.(npc)||[];if(an.length&&NPX()?.applyAnims)NPX().applyAnims(n,w.asset,an).catch(()=>{});}catch{}
   const f={npc,node:n,anim,clip:'idle',x:at.x,z:at.z,yaw:yaw||0,props:[],st:null,trail:null,walkIn:null,item:null};n.position.set(at.x,0,at.z);n.rotation.y=f.yaw;figs.set(npc,f);
   if(w.made&&w.c&&MD()?.props)setTimeout(()=>{try{if(!n.isDisposed())f.props=MD().props(n,w.c);}catch{}},0);
   const t=TALK(npc);f.item={id:t.id,action:t.action,character:npc,label:'TALK TO '+String(w.name).toUpperCase(),position:[at.x,1.6,at.z],range:2.2,talk:true,indoors:true};note('figure',{npc,x:+at.x.toFixed(2),z:+at.z.toFixed(2)});return f;}
  function drop(npc){const f=figs.get(npc);if(!f)return;figs.delete(npc);const L=WL();if(L&&Array.isArray(L.interactions)){const k=L.interactions.indexOf(f.item);if(k>=0)L.interactions.splice(k,1);}try{f.anim?.dispose?.();}catch{}for(const p of f.props)try{p.dispose();}catch{}try{f.node.dispose();}catch{}}
  function seen(x,z){const cam=scene.activeCamera;if(!cam)return true;try{if(frustumAt!==clock){frustumAt=clock;frustum=B.Frustum.GetPlanes(cam.getTransformationMatrix());}return B.Frustum.IsPointInFrustum(new B.Vector3(x,1,z),frustum);}catch{return true;}}
  const convo=()=>!!root.VoidConversationUI?.isOpen||MODE()==='dialogue';
  const speaks=npc=>{try{return typeof speech!=='undefined'&&!!speech&&Array.isArray(speech.lines)&&speech.lines.some(l=>l&&l.who===npc);}catch{return false;}};
  const turn=(f,p,dt)=>{if(!p)return;const want=Math.atan2(p.x-f.x,p.z-f.z),dy=Math.atan2(Math.sin(want-f.yaw),Math.cos(want-f.yaw));f.yaw+=dy*Math.min(1,dt*4);};
  function play(f,clip){if(f.anim&&clip!==f.clip){f.clip=clip;try{f.anim.play(clip);}catch{}}}
  function place(f){f.node.position.set(f.x,0,f.z);f.node.rotation.y=f.yaw;if(f.item){f.item.position[0]=f.x;f.item.position[2]=f.z;}
   const L=WL();if(L&&L===def&&Array.isArray(L.interactions)&&f.item&&!L.interactions.includes(f.item))L.interactions.push(f.item);
   for(const q of doors())if(Math.hypot(q.x-f.x,q.z-f.z)<1.9)try{q.d.near?.(true);}catch{}}   // the doors she comes to slide open for her
  // ---- leading inside: the next point on the way to the chosen room ----
  function target(s,f){const g=graph(s),room=roomAt(def,f.x,f.z),dest=E().destOf(g,s);if(dest==null)return null;const path=E().roomPath(g,room,dest);if(!path)return null;
   const S=solids();if(!path.length){const m=def.modular?(def.cluster?.mods||[]).find(x=>x.id===dest):null,c=m?{x:m.cx,z:m.cz}:(()=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const so of def.solids||[]){x0=Math.min(x0,so.position[0]);x1=Math.max(x1,so.position[0]);z0=Math.min(z0,so.position[2]);z1=Math.max(z1,so.position[2]);}const sp=spawnPt();return {x:((x0+x1)/2+sp.x)/2,z:((z0+z1)/2+sp.z)/2};})();
    const p=E().freeSpot(c,S,.45);return {kind:'dest',key:'dest:'+dest+':'+p.x+','+p.z,pt:p};}
   // the first door on the way that leaves this scene (a doorway inside it is walked through by the route itself)
   let prev=room;for(const step of path){const e=step.edge;if(sceneOfRoom(g,step.room)!==here.scene){
     if(e.kind==='lift'){const m=(def.cluster?.mods||[]).find(x=>x.id===prev);if(!m)return null;const p=E().freeSpot({x:m.cx,z:m.cz},S,.3);return {kind:'cab',key:'cab:'+prev,pt:p,next:sceneOfRoom(g,step.room)};}
     const p=doorPoint(e,s);if(!p)return null;return {kind:'through',key:'through:'+e.id,pt:{x:p.x-p.n[0]*E().INTO.approach,z:p.z-p.n[1]*E().INTO.approach},beyond:{x:p.x+p.n[0]*E().INTO.through,z:p.z+p.n[1]*E().INTO.through},next:sceneOfRoom(g,step.room)};}
    prev=step.room;}
   const m=(def.cluster?.mods||[]).find(x=>x.id===dest),p=E().freeSpot(m?{x:m.cx,z:m.cz}:spawnPt(),S,.45);return {kind:'dest',key:'dest:'+dest+':'+p.x+','+p.z,pt:p};}
  // a door of this scene that leads to another (its centre and its normal out of this scene)
  function doorPoint(e,s){const rec=(def.cluster?.doors||[]).find(x=>x.id===e.id);if(rec&&Number.isFinite(rec.x)&&rec.n)return {x:rec.x,z:rec.z,n:rec.n};
   let slot=rec&&rec.slot!=null?rec.slot:null;if(slot==null&&!def.modular){const o=(def.open||[]).find(x=>x.key===s.loc);slot=o?o.slot:null;}
   if(slot==null)return null;const q=doors().find(x=>x.d.slot===slot);if(!q)return null;return {x:q.x,z:q.z,n:normalAt(q)};}
  function lead(s,f,dt){const me=ME(),X=E();if(!f.st)f.st={x:f.x,z:f.z,yaw:f.yaw,phase:'ready',route:null,ri:0};const st=f.st;st.x=f.x;st.z=f.z;st.yaw=f.yaw;
   if(!f.tgt||clock>=(f.tgtAt||0)){f.tgtAt=clock+.5;const t=target(s,f);if(t&&(!f.tgt||t.key!==f.tgt.key)){f.tgt=t;f.route=(X.gridRoute(f,t.pt,solids())||[t.pt]);if(t.beyond)f.route.push(t.beyond);}else if(!t)f.tgt=null;}
   if(!f.tgt){st.clip='idle';if(me)turn(f,me,dt);return;}
   const end=f.route[f.route.length-1],ev=X.lead(st,{me:me?{x:me.x,z:me.z}:null,to:end,set:s.set,dt,route:f.route,routeKey:f.tgt.key,noDone:true});
   f.x=st.x;f.z=st.z;f.yaw=st.yaw;if(ev)note('lead',{key:s.key,ev,tgt:f.tgt.kind});if(ev==='failed'){tell(s,'failed');return;}
   if(ev==='wait'||ev==='paused')tell(s,ev);
   if(st.phase==='there'&&f.tgt.kind==='through'&&me&&dist(me,f)<=X.settings(s.set).wait){   // she goes through first; the player follows
    s.where=f.tgt.next;s.ahead=true;s.x=s.z=null;s.pend=null;note('through',{key:s.key,to:s.where});flag(s);drop(f.npc);}}
  function follow(s,f,dt){const me=ME(),X=E();if(!me)return;if(!f.st){f.st={x:f.x,z:f.z,yaw:f.yaw,phase:null};f.trail={pts:[],shifted:0};}const st=f.st;st.x=f.x;st.z=f.z;st.yaw=f.yaw;
   if(MODE()==='walking')X.trailPush(f.trail,{x:me.x,z:me.z});const ev=X.follow(st,{me:{x:me.x,z:me.z},trail:f.trail,to:null,seen:seen(f.x,f.z),dt,set:s.set,noDone:true});f.x=st.x;f.z=st.z;f.yaw=st.yaw;if(ev==='caught-up')note('caught-up',{key:s.key});}
  // ---- every frame ----
  function tick(){if(disposed)return;const now=performance.now()/1000,dt=lastT==null?0:Math.min(.1,Math.max(0,now-lastT));lastT=now;clock+=dt;
   const me=ME(),talking=convo(),H=held(),live=new Set();
   for(const s of steps.values()){if(!here.locs.includes(s.loc)||s.where!==here.scene)continue;live.add(s.npc);let f=figs.get(s.npc);
    if(s.pend){s.pend.t-=dt;if(!s.pend.at){if(s.pend.via==='cab'){const sp=spawnPt(),fw=fwd();s.pend.at={x:sp.x-fw[1]*.55,z:sp.z+fw[0]*.55};s.pend.in=null;}else{const a=arrival();s.pend.at=a.from;s.pend.in=a.in;}}
     if(s.pend.t>0)continue;if(f)drop(s.npc);f=make(s.npc,s.pend.at,me?Math.atan2(me.x-s.pend.at.x,me.z-s.pend.at.z):0);if(!f)continue;if(s.pend.in)f.walkIn=s.pend.in;s.pend=null;note('arrive',{key:s.key,scene:here.scene});}
    if(!f){let at=Number.isFinite(s.x)?{x:s.x,z:s.z}:null;if(!at){const sp=spawnPt(),fw=fwd();at=E().freeSpot({x:sp.x+fw[0]*E().INTO.ahead+fw[1]*.5,z:sp.z+fw[1]*E().INTO.ahead-fw[0]*.5},def.solids);}
     f=make(s.npc,at,me?Math.atan2(me.x-at.x,me.z-at.z):0);if(!f)continue;}
    const talk=talking&&speaks(s.npc);let clip='idle';
    if(f.walkIn){const d=dist(f,f.walkIn),k=Math.min(d,1.5*dt);if(d>.03){f.x+=(f.walkIn.x-f.x)/d*k;f.z+=(f.walkIn.z-f.z)/d*k;f.yaw=Math.atan2(f.walkIn.x-f.x,f.walkIn.z-f.z);clip='walk';}else f.walkIn=null;}
    else if(talk){if(me)turn(f,me,dt);}
    else if(!s.done){if(s.kind==='follow-them')lead(s,f,dt);else follow(s,f,dt);clip=(f.st&&f.st.clip)||'idle';}
    if(!figs.has(s.npc))continue;   // she went through a door ahead of the player
    s.x=f.x;s.z=f.z;s.yaw=f.yaw;place(f);play(f,clip);
    // done: both inside the chosen room
    if(!s.done&&me&&!f.walkIn){const g=graph(s),dest=E().destOf(g,s),ok=E().insideDone({dest,me:{inside:true,scene:here.scene,room:roomAt(def,me.x,me.z)},her:{inside:true,here:true,scene:s.where,room:roomAt(def,f.x,f.z)}});
     if(ok){s.done=true;heldAt.set(s.key,{scene:here.scene,x:f.x,z:f.z,yaw:f.yaw});note('done',{key:s.key,room:dest});tell(s,'done');}}}
   // after the step: she stays in that room (until the mission is done)
   for(const [npc,h] of Object.entries(H)){if(live.has(npc)||!here.locs.includes(h.loc))continue;const g=E().roomGraph(h.place),dest=E().destOf(g,h)||g.entry,at=heldAt.get(h.step);const sc=at?at.scene:sceneOfRoom(g,dest);if(sc!==here.scene)continue;live.add(npc);
    let f=figs.get(npc);if(!f){let p=at&&Number.isFinite(at.x)?{x:at.x,z:at.z}:null;if(!p){const m=(def.cluster?.mods||[]).find(x=>x.id===dest),c=m?{x:m.cx,z:m.cz}:(()=>{const sp=spawnPt(),fw=fwd();return {x:sp.x+fw[0]*3,z:sp.z+fw[1]*3};})();p=E().freeSpot(c,def.solids,.45);}
     f=make(npc,p,at?at.yaw:0);if(!f)continue;}
    if(me&&dist(me,f)<5)turn(f,me,dt);place(f);play(f,'idle');}
   // nobody to keep: a figure whose step ended goes once out of view
   for(const [npc,f] of [...figs])if(!live.has(npc)&&!seen(f.x,f.z))drop(npc);
   for(const f of figs.values())f.anim?.setActive?.(true);}
  const t0=h.tick,d0=h.dispose;h.tick=function(){const r=t0?t0.apply(this,arguments):undefined;try{tick();}catch(e){try{console.warn('[VOID//RUNNER follow into]',e);}catch{}}return r;};
  h.dispose=function(){disposed=true;for(const npc of [...figs.keys()])drop(npc);return d0?d0.apply(this,arguments):undefined;};
  h.escortIndoors={figs,stats:()=>[...figs.values()].map(f=>({npc:f.npc,x:+f.x.toFixed(2),z:+f.z.toFixed(2),yaw:+f.yaw.toFixed(2),clip:f.clip,phase:f.st?f.st.phase:null,tgt:f.tgt?f.tgt.kind:null,walkIn:!!f.walkIn,room:roomAt(def,f.x,f.z)}))};
  return h;}
 // the interior scenes (apartment-build.js and module-build.js, both through VoidApartments.build)
 (function wrap(){const X=A();if(!X||!X.build||X.build.escortIndoors)return;const b0=X.build;const b1=function(args){const h=b0.apply(this,arguments);try{return zone(args,h);}catch(e){try{console.warn('[VOID//RUNNER follow into]',e);}catch{}return h;}};b1.escortIndoors=true;X.build=b1;})();
 /* live-content.js plans(): is she off the street for this step (inside, or about to come back out)? the plan generation; where she comes back out (once). */
 function away(key){const s=steps.get(key);return !!s&&s.where!=='street';}
 function gen(key){const s=steps.get(key);return s?s.gen:0;}
 function street(key){const s=steps.get(key);return s&&s.where==='street'&&s.back?s.back:null;}
 function live(){return {cur:{kind:cur.kind,scene:cur.scene||null},steps:[...steps.values()].map(s=>({key:s.key,npc:s.npc,kind:s.kind,where:s.where,x:s.x,z:s.z,pend:s.pend?{t:+s.pend.t.toFixed(2),via:s.pend.via}:null,ahead:s.ahead,done:s.done,gen:s.gen})),figs:root.VoidBabylon?.zone?.escortIndoors?.stats?.()||[],log:log.slice(-30)};}
 function resetRun(){steps.clear();heldAt.clear();graphs.clear();log.length=0;cur={kind:'other'};last=null;lastWL=null;}
 root.VoidEscortIndoors={away,gen,street,onStreet,live,resetRun,sceneOf,change};
})(globalThis);
