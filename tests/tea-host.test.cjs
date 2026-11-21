// The underground tea room's host (the owner, 20 Nov 2026: "give me an Oriental NPC working at the Tea Room standing behind the island with the tea on it. He will be a giver."),
// the lucky cat on his counter, and the small underground fixes of the same day: NPCs open the rooms' sliding doors, placed people sit on the alcoves' seats, the food
// stall's cooler, the crosswalk material leak and the mission hint beside an open V1.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..'),R=f=>path.join(ROOT,f),read=f=>fs.readFileSync(R(f),'utf8');
const U=require(R('void-runner/ncz-underground.js')),M=require(R('void-runner/modules.js')),P=require(R('void-runner/npc-paths.js')),G=require(R('void-runner/mission-givers.js'));
const MD=require(R('void-runner/npc-made.js')),SP=require(R('void-runner/ncz-street-pair.js')),A=require(R('void-runner/npc-areas.js')),C=require(R('void-runner/crowd.js'));
const L=require(R('void-runner/lucky-cat.js')),T=require(R('void-runner/mission-trees.js')),V=require(R('void-runner/npc-voices.js'));
const HOST='tea-host';

test('the host is a giver of the District game: in the roster with a TALK prompt, reachable and playable in a draft, a separate person with a placeholder name',()=>{
 const g=G.roster({}).find(x=>x.id===HOST);assert.ok(g);assert.equal(g.name,'Tea Room Host');assert.equal(g.group,'district');assert.ok(g.canTalk&&g.players&&g.draft);
 assert.deepEqual(g.targets,[{action:MD.ACTION,character:HOST}]);assert.deepEqual(G.whoAt(G.roster({}),'made-npc',HOST),[HOST]);assert.deepEqual(g.enter,{walk:'sacramento',quarter:'underground'});
 assert.equal(MD.BUILTIN[HOST].name,g.name,'one name in both places');assert.equal(g.shift,null,'no schedule: always at his post');
 // an editor character can never take his id (the roster reserves it; the made runtime keeps the built-in one)
 const made=G.roster({characters:{[HOST]:{name:'Someone else',model:'npc-courier'}},npcs:{}});assert.equal(made.filter(x=>x.id===HOST).length,1);assert.equal(made.find(x=>x.id===HOST).name,'Tea Room Host');
 const inv=JSON.parse(read('void_runner_admin_inventory.json'));assert.ok(inv.madeCharacters.reserved.includes(HOST));assert.ok(inv.missionEditor.givers[HOST]);assert.ok(inv.npcPaths.movable[HOST]);});

test('his model: an existing street figure of the game (the old street cook, East Asian), not licensed, with the clips he uses; a darker jacket by a look',()=>{
 const c=MD.BUILTIN[HOST];assert.equal(c.model,'npc-cook-old');assert.ok(fs.existsSync(R('void-runner/assets/models/crowd/npc-cook-old.glb')));
 assert.doesNotMatch(c.model,/vr-companion|studio-warrior|dax|ava|eva|yuki|dex/i,'never a licensed No AI model');assert.equal(P.noAI(c.model,HOST),false);
 for(const k of ['idle','interact','watch','look','sit','sit-enter','sit-exit'])assert.ok(C.clips[c.model].includes(k),k);
 assert.deepEqual(require(R('void-runner/npc-looks.js')).entryProblems(c.model,{looks:[{id:'own',name:'own look',...c.look}],use:'own'}),[]);});

test('he stands behind the tea station, between it and the partition, facing the room; clear of the hidden passage to the back door',()=>{
 const t=M.TYPES['tea-under'],tea=t.furn.find(f=>f[5]==='tea'),part=t.furn.find(f=>f[5]==='partition'),host=t.spots.find(s=>s[0]==='host');
 assert.ok(host[2]>tea[3]&&host[2]<part[2],'between the counter and the partition');assert.ok(host[1]>tea[0]&&host[1]<tea[1],'behind the counter');assert.equal(host[3],Math.PI,'facing the front door (local -z)');
 assert.ok(part[2]-tea[3]>=.6,'room to stand between the counter and the partition');
 // the passage round the end of the partition to the back door stays at least 0.6 m clear of him
 const seg=(p,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],L2=dx*dx+dz*dz,k=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/L2));return Math.hypot(p[0]-a[0]-dx*k,p[1]-a[1]-dz*k);};
 const pass=t.plan.passage;for(let i=0;i+1<pass.length;i++)assert.ok(seg([host[1],host[2]],pass[i],pass[i+1])>.6,'passage leg '+i);
 // in the world: the tea room of the network, faces east (into the room, toward the trunk), on walkable ground
 const w=P.homeOf(HOST),sp=U.spots().find(s=>s.id==='under-tea-room/host');assert.deepEqual([w.x,w.z,w.yaw],[sp.x,sp.z,sp.yaw]);assert.equal(U.placeAt(w.x,w.z),'under-tea-room');
 assert.ok(Math.abs(w.yaw-Math.PI/2)<1e-3,'faces +x: the room and its front door');assert.equal(A.check(w,null,undefined,{made:true}).ok,true);
 const r=U.placeById('under-tea-room').rects[0];assert.ok(w.x<(r[0]+r[1])/2,'on the back half of the room, behind the counter');
 // the room's things around him: the counter is east of him (between him and the seats)
 const m=U.MODS.find(q=>q.id==='tea'),[cx]=U.localToWorld(m,(tea[0]+tea[1])/2,(tea[2]+tea[3])/2);assert.ok(cx>w.x);});

test('always at his post: no placement means his post (a stay with working idles), a placement from the NPCs tab moves him, his own routine is his post again',()=>{
 const p=P.planNow(HOST,{});assert.equal(p.mode,'stay');assert.equal(p.why,'home');assert.equal(p.area,'underground');assert.deepEqual(p.actions,['idle','work','watch','work','idle','look']);
 for(const a of p.actions)assert.ok(P.actionsFor(HOST).some(x=>x.id===a),a);assert.equal(P.ACTION.get('work').clip,'interact');assert.deepEqual(SP.ACT.work,{clip:'interact'});
 assert.equal(P.planNow(HOST,{plan:{mode:'original'}}).why,'home');
 const moved=P.planNow(HOST,{plan:{mode:'stay',x:-4.6,z:-103.5,yaw:0,actions:['idle']}});assert.equal(moved.why,'stay');assert.deepEqual(P.planProblems(HOST,{mode:'stay',x:-4.6,z:-103.5,yaw:0,actions:['idle']}),[]);
 assert.equal(P.planNow('grey-reverie',{}),null,'everyone else keeps their own routine');assert.equal(P.planNow(HOST,{waiting:{x:-5,z:-102,mission:'m'}}).actions.join(),p.actions.join(),'"Giver waits at": his working idles');
 // the editor's made characters come and go without touching him
 const before=P.setMade({x1:{name:'X',model:'npc-courier'},[HOST]:{name:'Imposter',model:'npc-courier'}});assert.equal(P.MOVABLE[HOST].name,'Tea Room Host');assert.equal(P.MOVABLE[HOST].builtin,true);
 P.setMade({});assert.ok(P.MOVABLE[HOST]);assert.ok(!P.MOVABLE.x1);P.setMade(before);});

test('his voice: the owner\'s ElevenLabs voice in the voice file and the game\'s copy, Eleven v4, linked; no lines, nothing generated',()=>{
 const j=JSON.parse(read('tools/audio/revoice-engines.json')).characters[HOST];assert.equal(j.voiceId,'zYD0xJl1ponKr8TwFBmJ');assert.equal(j.model,'eleven_v4');assert.equal(j.engine,'elevenlabs');
 for(const k of ['engine','voice','voiceId'])assert.equal(T.VOICE_ENGINES[HOST][k],j[k]);
 const s=V.summary(V.current(HOST,{engines:{[HOST]:j}}));assert.equal(s.kind,'elevenlabs');assert.equal(s.url,'https://elevenlabs.io/voices/zYD0xJl1ponKr8TwFBmJ');assert.equal(s.modelLabel,'Eleven v4');assert.match(s.text,/Tea Room Host/);
 assert.ok(!fs.existsSync(R('void-runner/audio/voices/extra/tea-host')),'no audio made for him');});

test('the lucky cat: one shared model and stand-in (Milked\'s reception and the tea station); a still figure on the counter\'s east end, clear of the tea set and the host',()=>{
 assert.equal(L.FILE,'milked/milked-lucky-cat.glb');assert.ok(fs.existsSync(R('void-runner/assets/models/'+L.FILE)));
 const glb=fs.readFileSync(R('void-runner/assets/models/'+L.FILE)),js=JSON.parse(glb.slice(20,20+glb.readUInt32LE(12)));assert.ok(!js.animations||!js.animations.length,'no waving paw in the model: it stays still');
 const parts=[];L.standIn(1,2,3,{ball:(d,x,y,z)=>parts.push(['ball',d,x,y,z]),box:(w,h,d,x,y,z)=>parts.push(['box',w,h,d,x,y,z])});
 assert.deepEqual(parts,[['ball',.16,1,2.08,3],['ball',.12,1,2.2,3],['box',.03,.09,.03,1.07,2.25,3]],'the same three pieces Milked always built');
 const mb=read('void-runner/milked-build.js');assert.match(mb,/root\.VoidLuckyCat/);assert.match(mb,/prop\('lucky-cat',80\.15,-80\.42,0,\.3,1\.11/,'Milked\'s cat where it was');
 const b=read('void-runner/module-build.js');assert.match(b,/prop\(L\.FILE,\[cx,cy,cz\]/);const at=/cx=([\d.]+),cy=([\d.]+),cz=([\d.]+)/.exec(b).slice(1).map(Number);
 const tea=M.TYPES['tea-under'].furn.find(f=>f[5]==='tea'),host=M.TYPES['tea-under'].spots.find(s=>s[0]==='host');
 assert.ok(at[0]>tea[0]&&at[0]<tea[1]&&at[2]>tea[2]&&at[2]<tea[3],'on the counter');assert.ok(Math.abs(at[1]-.88)<.01,'standing on its top');assert.ok(Math.hypot(at[0]-host[1],at[2]-host[2])>.6,'clear of the host');
 assert.ok(at[0]-.6>.15,'clear of the tins (x .6) and the cups (x .05 to .39)');
 const html=read('void-runner.html');assert.ok(html.indexOf('void-runner/lucky-cat.js')>0&&html.indexOf('void-runner/lucky-cat.js')<html.indexOf('void-runner/milked-build.js')&&html.indexOf('void-runner/lucky-cat.js')<html.indexOf('void-runner/module-build.js'));});

test('sliding doors open for NPCs passing (as the street doors do for residents), never a door to the street, and the player\'s own range is unchanged',()=>{
 const d={x:0,z:0};assert.equal(M.doorWanted(d,{x:1.7,z:0},[]),true);assert.equal(M.doorWanted(d,{x:1.9,z:0},[]),false);assert.equal(M.doorWanted(d,null,[{x:1.5,z:0}]),true,'an NPC 1.5 m away');
 assert.equal(M.doorWanted(d,null,[{x:3,z:0},{x:NaN,z:0}]),false);assert.equal(M.doorWanted({...d,shut:true},{x:0,z:0},[{x:0,z:0}]),false,'a street exit never slides open');
 const b=read('void-runner/module-build.js');assert.match(b,/d\.near\(M\.doorWanted\(d\.rec,p,people,d\.range\)\)/);assert.match(b,/VoidMadeNPCs\?\.live/);assert.match(b,/escortIndoors\?\.stats/);assert.match(b,/VoidStreetPair\?\.live/);});

test('placed people sit on the alcoves\' seats with the ledge\'s sit; the seats face into their alcove; the Avenue\'s ledges are unchanged',()=>{
 assert.deepEqual(U.SEATS.map(s=>s.yaw),[0,Math.round(Math.PI*1e4)/1e4,0,Math.round(Math.PI*1e4)/1e4,0,Math.round(Math.PI*1e4)/1e4]);
 for(const s of U.SEATS){const f=SP.along(s,SP.SEAT_FRONT);assert.equal(U.placeAt(f.x,f.z),s.place,'one stands in the alcove to sit');assert.equal(SP.seatNear(f).id,s.id);assert.equal(P.ledgeAt({x:f.x,z:f.z}).id,s.id);
  let ok=0;for(let dx=-.5;dx<=.5;dx+=.1)for(let dz=-.5;dz<=.5;dz+=.1)if(Math.hypot(dx,dz)<=.6&&!P.planProblems('grey-reverie',{mode:'stay',x:+(f.x+dx).toFixed(1),z:+(f.z+dz).toFixed(1),yaw:0,actions:['sit']}).length)ok++;assert.ok(ok>3,s.id+': a spot to sit from');}
 assert.equal(SP.seatNear({x:-3,z:-20}),null);const l=SP.STEPS[1];assert.equal(SP.seatNear({x:l.x,z:SP.frontOf(l)}).id,l.id);
 // the routine sits at a seat facing any way and stands up again (the same steps as at a ledge, along the seat's facing)
 const seat=U.SEATS[2],f=SP.along(seat,SP.SEAT_FRONT),cfg={...SP.config,sit:[3,3]},plan={key:'k',mode:'stay',x:f.x,z:f.z,yaw:0,actions:['sit']},rnd=()=>.5;
 for(const back of [undefined,.1]){let s={...SP.routineStart(SP.PAIR[0],rnd,cfg),x:f.x+.3,z:f.z,seatBack:back},seen=new Set();
  for(let i=0;i<2000;i++){s=SP.routineStep(s,.05,rnd,cfg,{plan});seen.add(s.mode);if(s.mode==='sit'){const want=SP.along(seat,back??SP.SEAT_BACK);assert.ok(Math.hypot(s.x-want.x,s.z-want.z)<1e-6);assert.equal(s.yaw,seat.yaw);
    const o=SP.seatOffset(s,.2);assert.ok(Math.abs(o.x+Math.sin(seat.yaw)*.2)<1e-9&&Math.abs(o.z+Math.cos(seat.yaw)*.2)<1e-9,'the eased offset goes back into the seat');}}
  for(const m of ['to-step','settle','sit-down','sit','stand-up','step-off'])assert.ok(seen.has(m),m);}
 // a ledge: exactly as before (no yaw: the old z-only numbers)
 let s={...SP.routineStart(SP.PAIR[0],rnd,cfg),x:l.x,z:SP.frontOf(l)-.2};const lp={key:'l',mode:'stay',x:l.x,z:SP.frontOf(l),yaw:Math.PI,actions:['sit']};
 for(let i=0;i<800&&s.mode!=='sit';i++)s=SP.routineStep(s,.05,rnd,cfg,{plan:lp});assert.equal(s.mode,'sit');assert.equal(s.z,SP.seatOf(l));assert.equal(s.x,l.x);assert.deepEqual(SP.seatOffset(s,.3),{x:0,z:.3});
 // made characters may sit (their street models carry the sit clips); the server reads the seats from the admin inventory
 P.setMade({sitter:{name:'Sitter',model:'npc-casual-m'}});try{assert.ok(P.actionsFor('sitter').some(a=>a.id==='sit'));const g=U.SEATS[0],ff=SP.along(g,SP.SEAT_FRONT);
  assert.deepEqual(P.planProblems('sitter',{mode:'stay',x:+(ff.x+.2).toFixed(1),z:+ff.z.toFixed(1),yaw:0,actions:['sit']}),[]);}finally{P.setMade({});}
 const inv=JSON.parse(read('void_runner_admin_inventory.json'));assert.equal(inv.npcPaths.movable['grey-reverie'].seats.length,U.SEATS.length);
 assert.equal(C.clipIn('npc-casual-m','sit-wave'),'sit','a street figure waves from its seat by staying seated');});

test('module spots and seats face the right way in a turned module (they subtracted the turn)',()=>{
 assert.equal(U.turnYaw(Math.PI,3),+(Math.PI/2).toFixed(4));assert.equal(U.turnYaw(0,1),+(Math.PI/2).toFixed(4));assert.equal(U.turnYaw(0,0),0);assert.equal(U.turnYaw(-Math.PI/2,1),0);
 // a facing turned with the module points the same way as the module's own local direction turned by localToWorld
 for(const m of U.MODS.slice(0,30))for(const a of [0,1,2,3].map(k=>k*Math.PI/2-1)){const o=U.localToWorld(m,0,0),d=U.localToWorld(m,Math.sin(a),Math.cos(a)),y=U.turnYaw(a,m.rot);assert.ok(Math.abs(Math.sin(y)-(d[0]-o[0]))<1e-3&&Math.abs(Math.cos(y)-(d[1]-o[1]))<1e-3,m.id);}});

test('small fixes: the food stall\'s cooler is hollow and dark, the crosswalk icon material is disposed, the mission hint keeps clear of an open V1',()=>{
 const b=read('void-runner/module-build.js');assert.doesNotMatch(b,/box2\(S\.white,1\.3,1\.9,0,1\.8,1,1\.9\)/,'no solid white box behind the cooler glass');assert.match(b,/cooler-body/);
 assert.match(b,/n\.position\.y=y-\(bb\.min\.y-py\)\*sc/,'a prop stands on its mark under a raised or lowered parent (the tunnels are 3 m down)');
 const cw=read('void-runner/crosswalks.js'),line=cw.split('\n').find(l=>l.includes("'ncz-crosswalk-icon'")&&l.includes('StandardMaterial'));const code=line.split('//')[0];assert.match(code,/own\.push\(im\)/,'pushed in code, not in the comment');
 const g=read('void-runner/mission-guide.js');assert.match(g,/body\.v1-side #mission-hint/);assert.match(g,/classList\.toggle\('v1-side'/);assert.match(g,/max\(430px,50vw - 12px\)/,'the V1 panel\'s own width (device-v1.css)');
 assert.match(read('void-runner/device-v1.css'),/width:max\(430px,calc\(50vw - 12px\)\)/);});

test('multiplayer: the host is drawn by every client the same way (built in, always at his post; nothing is sent or saved)',()=>{
 const src=read('void-runner/npc-made.js');assert.match(src,/const chars=\(\)=>\{const own=\(env\(\)&&env\(\)\.characters\)\|\|\{\},out=\{\.\.\.BUILTIN\}/);
 assert.ok(!/tea-host/.test(read('void-runner/remote-players.js')));assert.ok(!/tea-host/.test(read('void_runner_api.py')),'no save field');});
