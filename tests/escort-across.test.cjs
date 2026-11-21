/* ESCORT ACROSS (20 Nov 2026; the owner: a follow step did not carry the person through a city gate, or up / down the stairwells between the street and the tunnels:
   "I need this fixed. whether it's walking or in a taxi"). npc-escort.js links / areaRoute / legOf / across / arrival / rideAlong; npc-escort-across.js wiring. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('path'),fs=require('fs'),vm=require('vm');
const R=p=>path.join(__dirname,'..',p);
const E=require(R('void-runner/npc-escort.js')),A=require(R('void-runner/npc-areas.js')),Q=require(R('void-runner/ncz-quarters.js')),BA=require(R('void-runner/ncz-backalleys.js')),U=require(R('void-runner/ncz-underground.js'));
const REV='grey-reverie',LACE='ethereal-lace',CAT='street-cat',d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

test('links: every walkers\' lane between two city quarters, the three stairwells to the tunnels and the District\'s door; their points stand where she may',()=>{
 const L=E.links(),ids=L.map(l=>l.id);
 for(const l of Q.LANES.filter(l=>l.kind==='foot')){const g=Q.gate(l.gate),both=g.ends.lo?.quarter&&g.ends.hi?.quarter;assert.equal(ids.includes('gate:'+l.key),!!both,l.key);}
 assert.ok(!ids.some(i=>/function|east:/.test(i)),'never through the Function Gate or the East Gate (the Corporate District, the Temple)');
 for(const u of BA.UNDERGROUND_ENTRANCES)assert.ok(ids.includes('stairs:'+u.id),u.id);assert.ok(ids.includes('door:district'));
 for(const l of L)for(const [a,e] of Object.entries(l.ends)){for(const k of ['wait','ahead'])assert.equal(A.areaOf(e[k]),a,l.id+' '+a+' '+k);assert.ok(Number.isFinite(e.behind.x+e.behind.z+e.behind.yaw));assert.ok(E.mayEnter(REV,a,e.wait).ok,l.id+' '+a);}
 // the North Gate's west lane: Old Town's side is south (lower z), The Avenue's north; ahead = out of the far door, behind = inside the lane
 const n=E.linkById('gate:north:foot-w');assert.ok(n.ends.avenue.wait.z>-20.35&&n.ends.oldtown.wait.z<-25.65);assert.ok(n.ends.oldtown.ahead.z<n.ends.oldtown.wait.z+.01);const ln=Q.lane('north:foot-w');
 assert.ok(n.ends.oldtown.behind.z>ln.mid[1]&&n.ends.oldtown.behind.z<-20,'behind: inside the lane, toward The Avenue');assert.ok(Math.abs(Math.abs(n.ends.oldtown.ahead.yaw)-Math.PI)<.01,'facing south, into Old Town');
 // the Avenue's stairs: on the street at the top step (facing away from the stairs), inside the checkpoint below (facing into the network)
 const s=E.linkById('stairs:under-avenue'),inn=U.arrive('under-avenue');assert.ok(s.ends.avenue.wait.x>BA.UNDERGROUND_ENTRANCES[0].top[0]);assert.equal(A.areaOf(s.ends.underground.ahead),'underground');
 assert.ok(d(s.ends.underground.ahead,{x:inn.spawn[0],z:inn.spawn[2]})<3);assert.equal(BA.groundAt(s.ends.avenue.behind.x,s.ends.avenue.behind.z),-3,'behind the player coming up: on the landing, at the stairs\' foot');});

test('her route between areas: a gate, a stairwell down and back up, the District door; legs to the next link\'s waiting point',()=>{
 const g=E.areaRoute(REV,{area:'avenue',x:60,z:-10},{area:'oldtown',x:60,z:-50});assert.deepEqual(g.map(p=>p.link.id),['gate:north:foot-w']);
 const f=E.areaRoute(REV,{area:'avenue',x:120,z:-10},{area:'far-south',x:60,z:-180});assert.deepEqual(f.map(p=>p.a+'>'+p.b),['avenue>oldtown','oldtown>far-south']);
 const dn=E.areaRoute(REV,{area:'avenue',x:25,z:6},{area:'underground',x:0,z:5});assert.deepEqual(dn.map(p=>p.link.id),['stairs:under-avenue'],'down the Avenue\'s stairs');
 const up=E.areaRoute(LACE,{area:'underground',x:0,z:-75},{area:'oldtown',x:14,z:-80});assert.deepEqual(up.map(p=>p.link.id),['stairs:under-oldtown'],'up the Old Town stairs');
 assert.deepEqual(E.areaRoute(REV,{area:'oldtown',x:126.9,z:-58},{area:'district',x:126.9,z:-80}).map(p=>p.link.id),['door:district']);
 const leg=E.legOf(REV,'avenue',{x:60,z:-10},{x:60,z:-50},'oldtown');assert.equal(leg.final,false);assert.equal(leg.via,'gate:north:foot-w');assert.deepEqual(leg.to,E.linkById(leg.via).ends.avenue.wait);
 assert.deepEqual(E.legOf(REV,'oldtown',{x:52.8,z:-28},{x:60,z:-50},'oldtown'),{to:{x:60,z:-50},via:null,final:true});
 // she walks her leg with the ordinary rules (lead): at the gate she waits (noDone: never done there) for the player
 const st={x:60,z:-8,yaw:0},me={x:58,z:-8};const inp={me,to:leg.to,set:{wait:8,lost:40},noDone:true,area:'avenue'};
 for(let i=0;i<400;i++){E.lead(st,{...inp,dt:.1});me.x=st.x-1.5;me.z=st.z;}assert.equal(st.phase,'there');assert.ok(d(st,leg.to)<.05);me.x=leg.to.x;me.z=leg.to.z+.5;E.lead(st,{...inp,dt:.1});assert.equal(st.phase,'there','not done at the gate');});

test('through a link: she comes AHEAD when she leads, BEHIND when she follows; lost / wait as on the street; a reload finds her area from where she is',()=>{
 const ok={ok:true},base={from:'avenue',to:'oldtown',herArea:'avenue',allowed:ok};
 assert.deepEqual(E.across({...base,kind:'follow-them',dist:3}),{go:'with',place:'ahead'});
 assert.deepEqual(E.across({...base,kind:'they-follow',dist:2}),{go:'with',place:'behind'});
 assert.deepEqual(E.across({...base,kind:'shared-cab',dist:2}),{go:'with',place:'behind'},'a shared cab step: she follows the player on foot meanwhile');
 assert.deepEqual(E.across({...base,kind:'their-cab',dist:2}),{go:'stay'},'she waits at her kerb for her cab');
 // lost: "they stop and wait" -> she stays (the arrow leads back to her); "the mission fails"
 assert.deepEqual(E.across({...base,kind:'follow-them',dist:60,set:{lost:40}}),{go:'stay'});assert.deepEqual(E.across({...base,kind:'follow-them',dist:60,set:{lost:40,ifLost:'fail'}}),{go:'fail'});
 assert.deepEqual(E.across({...base,kind:'they-follow',dist:300}),{go:'stay'},'far behind: she stays (and follows again when the player comes back)');
 assert.deepEqual(E.across({...base,kind:'they-follow',dist:2,herArea:'oldtown'}),{go:'stay'},'she was not with the player');
 const n=E.linkById('gate:north:foot-w');assert.deepEqual(E.arrival(n,'oldtown','ahead'),{x:n.ends.oldtown.ahead.x,z:n.ends.oldtown.ahead.z,yaw:n.ends.oldtown.ahead.yaw});
 const sp={x:10,z:0,yaw:0};assert.deepEqual(E.arrival(null,'oldtown','behind',sp),{x:10,z:-1.4,yaw:0});assert.deepEqual(E.arrival(null,'oldtown','ahead',sp),{x:10,z:2.4,yaw:0});
 assert.equal(E.linkBetween('avenue','oldtown',{x:69,z:-18}).id,'gate:north:foot-e','the lane the player used');assert.equal(E.linkBetween('avenue','underground',{x:24,z:10}).id,'stairs:under-avenue');
 // stairwell down and back up (they-follow): behind the player in the checkpoint, behind the player on the landing
 const s=E.linkById('stairs:under-oldtown');assert.equal(A.areaOf(E.arrival(s,'underground','ahead')),'underground');assert.equal(BA.groundAt(E.arrival(s,'oldtown','behind').x,-73),-3);
 assert.equal(A.areaOf(n.ends.oldtown.ahead),'oldtown','a reload: the saved x / z give her area (live-content.js plans)');});

test('rules kept: never into the adult places, the cat never inside / underground / in a cab, never the Corporate District or the Temple; never a silent loss',()=>{
 const mk=A.list().find(a=>a.id==='milked'),in_=mk&&mk.walk[0]?{x:(mk.walk[0].x0+mk.walk[0].x1)/2,z:(mk.walk[0].z0+mk.walk[0].z1)/2}:{x:81.75,z:-176};
 for(const id of [REV,LACE]){const m=E.mayEnter(id,'milked',in_);assert.equal(m.ok,false,id);assert.match(m.why,/waits here for you/);}
 const r=E.across({kind:'they-follow',from:'far-south',to:'milked',herArea:'far-south',dist:2,allowed:E.mayEnter(REV,'milked',in_)});assert.equal(r.go,'refused');assert.match(r.why,/does not go there/);
 assert.equal(E.mayEnter(CAT,'underground',{x:0,z:5}).ok,false);assert.match(E.mayEnter(CAT,'district',null).why,/never goes inside or down into the tunnels/);assert.ok(!E.reach(CAT,'avenue').has('underground'));assert.ok(!E.reach(CAT,'oldtown').has('district'));
 assert.ok(E.reach(CAT,'avenue').has('oldtown'),'the cat walks through a gate with the player');
 assert.deepEqual(E.across({kind:'follow-them',from:'avenue',to:null,farScene:true,herArea:'avenue',dist:1,allowed:{ok:false,why:'Reverie stays in the city'}}),{go:'refused',why:'Reverie stays in the city'});
 assert.deepEqual(E.across({kind:'they-follow',from:'avenue',to:null,farScene:false,herArea:'avenue',dist:1}),{go:'stay'},'an apartment: npc-escort-indoors.js has it');
 assert.match(E.problems({kind:'they-follow',npc:CAT,to:{x:-2.7,z:-80}},{area:'avenue'}).join(),/cat never goes inside or down into the tunnels/);
 assert.deepEqual(E.problems({kind:'follow-them',npc:REV,to:{x:-2.7,z:-80}},{area:'avenue'}),[],'Reverie may lead down into the tunnels');
 assert.ok(!E.links().some(l=>Object.keys(l.ends).includes('milked')),'no walking link into Milked');
 // the fight pit stays a refused room for a youthful character (npc-escort.js intoProblems, unchanged)
 assert.deepEqual(E.ADULT_ROOMS,['fight-pit']);});

test('a taxi during a follow / lead step: she gets in, rides (also through a gate\'s bay), gets out with the player; the cat and far stops: she stays out',()=>{
 const cab={x:60,z:-14,yaw:Math.PI/2},doors=[{x:60.2,z:-12.9},{x:60.2,z:-15.1},{x:58,z:-14}],job=(phase,o)=>({id:'c1:main',phase,dest:'main',far:false,released:false,cab,doors,...o});
 const st={x:62,z:-9,yaw:0,phase:'follow'},me={x:60,z:-11.5};
 let r=E.rideAlong(st,{me,job:job('waiting'),riding:false,dt:.1,can:true});assert.equal(r.busy,true);assert.equal(r.ev,'to-cab');
 for(let i=0;i<60&&st.ride!=='in-cab';i++)r=E.rideAlong(st,{me,job:job('waiting'),riding:false,dt:.1,can:true});assert.equal(st.ride,'in-cab');assert.equal(st.clip,'sit');
 // the cab drives into another quarter through a gate's bay: no job for a moment (road-taxi.js cross), she stays seated
 r=E.rideAlong(st,{me,job:null,riding:true,dt:.1,can:true,crossing:true});assert.equal(r.busy,true);assert.equal(st.ride,'in-cab');
 r=E.rideAlong(st,{me,job:job('arrived'),riding:true,dt:.1,can:true});assert.equal(st.rideArrived,true);
 r=E.rideAlong(st,{me,job:null,riding:false,dt:.1,can:true});assert.equal(r.ev,'ride-out');assert.equal(st.ride,null);assert.equal(st.phase,'ready','the walk goes on from the stop');assert.equal(st.route,null);
 // the player boards first: she gets in at once when close
 const s2={x:61,z:-10};r=E.rideAlong(s2,{me:{x:60,z:-14},job:job('to-dest'),riding:true,dt:.1,can:true});assert.equal(r.ev,'in-cab');
 // left far behind (beyond cabNear): she does not teleport into the cab
 const s3={x:160,z:-10};r=E.rideAlong(s3,{me:{x:60,z:-14},job:job('to-dest'),riding:true,dt:.1,can:true});assert.equal(r.busy,false);assert.equal(s3.ride,undefined);
 // the cat, and a cab to the Corporate District: once a notice, she stays out
 const c={x:61,z:-10};r=E.rideAlong(c,{me,job:job('waiting'),riding:false,dt:.1,can:false});assert.equal(r.ev,'no-cab');r=E.rideAlong(c,{me,job:job('waiting'),riding:false,dt:.1,can:false});assert.equal(r.ev,null);assert.notEqual(c.ride,'in-cab');
 const f={x:61,z:-10};r=E.rideAlong(f,{me,job:job('waiting',{dest:'corporate',far:true}),riding:false,dt:.1,can:true});assert.equal(r.ev,'no-cab');
 // across(): she rides through the gate when she sits in the player's cab
 assert.deepEqual(E.across({kind:'they-follow',from:'avenue',to:'oldtown',herArea:'avenue',dist:1,riding:true,inCab:true,allowed:{ok:true}}),{go:'ride'});
 assert.deepEqual(E.across({kind:'their-cab',from:'avenue',to:'oldtown',herArea:'avenue',dist:1,riding:true,inCab:true,allowed:{ok:true}}),{go:'ride'});
 assert.deepEqual(E.across({kind:'they-follow',from:'avenue',to:'oldtown',herArea:'avenue',dist:1,riding:true,inCab:false,allowed:{ok:true}}),{go:'stay'});
 // a cab step's cab through a gate: the crossing keeps her seated (cab())
 const cs={x:0,z:0,phase:'in-cab',arrived:false};E.cab(cs,{kind:'their-cab',stop:'main',me:{x:0,z:0},job:null,crossing:true,walking:false,riding:true,dt:.1});assert.equal(cs.phase,'in-cab');
 E.cab(cs,{kind:'their-cab',stop:'main',me:{x:0,z:0},job:null,crossing:false,walking:false,riding:false,dt:.1});assert.equal(cs.phase,'kerb','without a crossing: the cab left without the player (as before)');
 // stops: any city stop, from an area with taxis; none from the tunnels or the District; never the far places
 assert.ok(E.stops(REV,'avenue').filter(s=>!s.far).every(s=>s.ok));assert.ok(E.stops(REV,'underground').every(s=>!s.ok));assert.ok(E.stops(REV,'avenue').filter(s=>s.far).every(s=>!s.ok));});

test('wiring: npc-escort-across.js wraps enterWalking after every transition, live-content.js carries her area, the street figures ride and wait at links, the arrow',()=>{
 const html=fs.readFileSync(R('void-runner.html'),'utf8'),i=f=>html.indexOf('void-runner/'+f+'"');assert.ok(i('npc-escort-across.js')>i('ncz-gate-transit.js')&&i('ncz-gate-transit.js')>i('ncz-underground-integration.js')&&i('npc-escort-across.js')>i('district-transition.js')&&i('npc-escort-across.js')>i('milked-transition.js'));
 assert.equal(html,fs.readFileSync(R('static/void-runner.html'),'utf8'));
 for(const f of ['npc-escort-across.js','live-content.js','ncz-street-pair.js','npc-made.js','mission-guide.js'])assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(R('void-runner/'+f),'utf8')),f);
 const ac=fs.readFileSync(R('void-runner/npc-escort-across.js'),'utf8');assert.match(ac,/const prev=enterWalking;\s*enterWalking=async function/);assert.match(ac,/decide\(id,options\|\|\{\}\)/);assert.match(ac,/R\.across\(/);assert.match(ac,/C\.setCarry\(/);
 const lc=fs.readFileSync(R('void-runner/live-content.js'),'utf8');assert.match(lc,/E\.legOf\(id,here/);assert.match(lc,/setCarry,escortWhere/);assert.match(lc,/via:L\.via\|\|null/);
 for(const f of ['ncz-street-pair.js','npc-made.js']){const s=fs.readFileSync(R('void-runner/'+f),'utf8');assert.match(s,/noDone:!!P\.via/,f);assert.match(s,/E\.rideAlong\(/,f);assert.match(s,/groundAt/,f);}
 assert.match(fs.readFileSync(R('void-runner/mission-guide.js'),'utf8'),/root\.missionEscortGoal=escortGoal/);assert.match(fs.readFileSync(R('void-runner/world-integration.js'),'utf8'),/missionEscortGoal\(g\)/);
 assert.match(fs.readFileSync(R('void-runner-sw.js'),'utf8').split(/\r?\n/)[3],/^const BUILD='2026-11-\d\d-[a-z0-9-]+';$/);   // any later build (this one shipped as 2026-11-20-escort-across-1)
 const inv=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8'));assert.ok(inv.npcEscort.npcs[REV].reach.avenue.includes('underground'));assert.ok(!inv.npcEscort.npcs[CAT].reach.avenue.includes('underground'));});
