/* Modular interiors (the owner, 19 Nov 2026: "add locations by type ... an office building interior ... a server room ... connect these areas together so make sure they
   fit ... elevator ... like modules"; docs/development/MODULES.md): the grid and door standard, socket fitting under every turn, the location graph checks, the older
   apartments as modules (and their migration), the mission engine with a location, the walking areas, the office and shop entrances, and the server's copy. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),read=p=>fs.readFileSync(R(p),'utf8');
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const Mo=()=>require(R('void-runner/modules.js')),Ap=()=>require(R('void-runner/apartments.js'));
const HQ=()=>({id:'hq',door:'biz-avenue-n-13',...Mo().template('office-servers'),locks:['office.s1']});
const inst=(loc,hacked=[])=>({key:'m/'+loc.id,mission:'m',id:loc.id,door:loc.door,modular:true,loc,hacked});
const hit=([a0,a1,b0,b1],[c0,c1,d0,d1])=>a0<c1-1e-6&&c0<a1-1e-6&&b0<d1-1e-6&&d0<b1-1e-6;

test('the standard: 2 m grid, one door size; every socket is on its module’s edge, every door can be walked through (nothing stands in front of it), everything inside the walls',()=>{
 fresh();const M=Mo();assert.equal(M.GRID,2);assert.equal(M.DOOR.w,1.2);assert.equal(M.DOOR.h,2.2);assert.ok(M.DOOR.clear>2*.38+.2,'wide enough for the player');
 const cats=new Set(Object.values(M.TYPES).map(t=>t.cat));for(const c of ['housing','various','office','server','hallway','elevator','other'])assert.ok(cats.has(c),c);
 assert.ok(!cats.has('commercial')&&!M.CATS.some(c=>c.id==='commercial'),'Commercial is now Various');for(const id of ['shop-back','bar-back','clinic'])assert.equal(M.TYPES[id].cat,'various',id);
 assert.ok(Object.values(M.TYPES).filter(t=>t.cat==='various').length>=12&&Object.values(M.TYPES).filter(t=>t.cat==='other').length>=2);
 for(const id of M.TYPE_IDS){const t=M.TYPES[id];if(t.portal)continue;const b=M.bounds(id);assert.ok(t.sockets.length,id);
  for(const s of t.sockets){assert.ok(['n','s','e','w'].includes(s.edge)&&s.cell>=0&&s.cell<((s.edge==='n'||s.edge==='s')?t.w:t.d),id+' '+s.id);
   const [x,z]=M.sockLocal(t,s),n=M.NORMAL[s.edge],tg=M.TANGENT[s.edge],in_=[x-n[0]*.1,z-n[1]*.1],far=[x-n[0]*1.3,z-n[1]*1.3];   // the door's approach: 1.2 m in from the wall face, the door's width
   const ap=[Math.min(in_[0],far[0])-tg[0]*.6,Math.max(in_[0],far[0])+tg[0]*.6,Math.min(in_[1],far[1])-tg[1]*.6,Math.max(in_[1],far[1])+tg[1]*.6];
   for(const f of t.furn)assert.ok(!hit(ap,f),id+': '+f[5]+' blocks door '+s.id);}
  for(const f of t.furn)assert.ok(f[0]>=b[0]-.05&&f[1]<=b[1]+.05&&f[2]>=b[2]-.05&&f[3]<=b[3]+.05,id+': '+f[5]+' inside');
  for(const i of t.inter)assert.ok(i.pos[0]>b[0]-.05&&i.pos[0]<b[1]+.05&&i.pos[2]>b[2]-.05&&i.pos[2]<b[3]+.05,id+': '+i.id);
  for(const i of t.inter)assert.ok(M.objectsOf(id).some(o=>o.id===i.object),id+': '+i.object+' is a listed object');}
 // the office floor the owner asked for; the server room; the elevator
 const of=M.TYPES['office-floor'];assert.ok(of.plan.cubes.length>=8,'cubicles');for(const o of ['computer','manager-pc','printer','screen','lights'])assert.ok(of.objects.some(x=>x.id===o),o);
 const sr=M.TYPES['server-room'];assert.ok(sr.plan.rows.length*sr.plan.rack.n>=12,'rows of racks');for(const o of ['rack','core','terminal','cooling'])assert.ok(sr.objects.some(x=>x.id===o),o);
 assert.ok(M.TYPES.elevator.cab&&M.TYPES['elevator-lobby']&&M.TYPES['hall-office']&&M.TYPES['hall-commercial']);
});

test('socket fitting: the turn math, and any module attaches to any free door it can meet (no overlap, no door into a wall)',()=>{
 fresh();const M=Mo();for(let r=0;r<4;r++){const p=M.rotP(r,1,0),q=M.rotP(r,0,1);assert.equal(Math.hypot(...p),1);assert.ok(Math.abs(p[0]*q[0]+p[1]*q[1])<1e-9);}assert.deepEqual(M.rotP(1,1,0),[0,-1]);assert.equal(M.turnEdge('n',1),'e');assert.equal(M.turnEdge('e',1),'s');
 const grid=M.TYPE_IDS.filter(t=>!M.TYPES[t].portal&&!M.TYPES[t].cab);let n=0;
 for(const base of grid){const loc=M.addModule({id:'x',door:'',modules:[]},base).loc;for(const f of M.freeSockets(loc))for(const type of grid){const a=M.attach(loc,type,f.ref);if(!a)continue;n++;
   const l2={...loc,modules:[...loc.modules,{id:'new',type,x:a.x,z:a.z,rot:a.rot,floor:a.floor}]},an=M.analyse(l2);assert.equal(an.sockUse[f.ref],'new.'+a.sock,base+' '+f.ref+' <- '+type);assert.deepEqual(an.problems.filter(p=>/overlap|into a wall/.test(p)),[],base+' '+type);}}
 assert.ok(n>200,'many fits: '+n);
 // a street → hallway → office → elevator → (other floor) server room location, built from the editor's own add
 let L={id:'hq',door:'biz-avenue-n-13',modules:[]};for(const [t,o] of [['hall-office',{}],['office-floor',{to:'hall.n0'}],['elevator',{to:'office.e2'}],['elevator',{floor:-1}]]){const r=M.addModule(L,t,o);assert.ok(r.ok,r.why);L=r.loc;}
 const r=M.addModule(L,'server-room',{floor:-1});assert.ok(r.ok);L=r.loc;assert.deepEqual(M.problems(L,'office'),[]);
 const an=M.analyse(L);assert.equal(an.clusters.length,2,'one cluster per floor');assert.deepEqual(M.cabFloors(an),[-1,0]);
});

test('graph checks: overlaps, doors into walls, unreachable modules, a lonely elevator, the entrance, connections, locks, unknown fields',()=>{
 fresh();const M=Mo(),P=(l,f='office')=>M.problems(l,f).join(' | ');assert.equal(P(HQ()),'');for(const t of M.TEMPLATES)assert.equal(P({id:'t',door:'x',...M.template(t.id)}),'',t.id);
 const mv=(id,o)=>{const l=HQ();Object.assign(l.modules.find(m=>m.id===id),o);return l;};
 assert.match(P(mv('office',{x:5})),/overlap/);assert.match(P(mv('servers',{x:0})),/cannot be reached/);assert.match(P(mv('lift',{x:14})),/meets nothing|cannot be reached/);
 assert.match(P({...HQ(),modules:HQ().modules.filter(m=>m.id!=='lift2'&&m.id!=='servers')}),/second cab/);assert.equal(P({...HQ(),entry:'office.w2'}),'','any free outside door can be the entrance');
 assert.match(P({...HQ(),entry:'hall.n0'}),/already a door/);assert.match(P({...HQ(),entry:'lift.s0'}),/already a door|elevator/);assert.match(P({...HQ(),locks:['hall.s0']}),/street door is locked by its own/);
 assert.match(P({...HQ(),links:[{a:'hall.w1',b:'office.w2'}]}),/side by side/);assert.match(P({...HQ(),colour:1}),/unknown fields/);assert.match(P({...HQ(),modules:[...HQ().modules,{id:'z',type:'nope',x:0,z:0}]}),/module type/);
 const hall=HQ();hall.modules.push({id:'flat',type:'apt-normal'});hall.links=[{a:'hall.e1',b:'flat.entry'}];assert.equal(P(hall),'','an office hallway door can lead to an apartment');
 assert.match(P({...hall,modules:hall.modules.map(m=>m.id==='flat'?{...m,x:1}:m)}),/no place on the grid/);
 assert.match(P({...HQ(),modules:HQ().modules.map(m=>m.id==='office'?{...m,items:[{type:'loot',label:'Cash',x:9,z:0}]}:m)}),/inside the module/);
 assert.match(P({...HQ(),modules:HQ().modules.map(m=>m.id==='hall'?{...m,screenOff:true}:m)}),/no screen/);
});

test('the older apartments are modules: the same rooms through a connection; an old entry stays valid and migrates (its steps too)',()=>{
 fresh();const M=Mo(),X=Ap();for(const st of X.STYLE_IDS){assert.ok(M.TYPES['apt-'+st].portal&&M.TYPES['hall-'+st].portal);assert.equal(M.TYPES['apt-'+st].cat,'housing');}
 const old={id:'safehouse',style:'rundown',door:'apt-main-w-96',number:13,locked:true,lightsOff:true,items:[{type:'loot',label:'Cash',x:1,z:1}]};const m={id:'m1',apartments:[old],objectives:[{id:'h',kind:'hack',ap:'safehouse/hall'},{id:'u',kind:'apt-use',apt:'safehouse',object:'safe'},{id:'e',kind:'hack',ap:'safehouse/entry'}]};
 assert.deepEqual(X.problems(m),[],'the old shape is still valid');const y=M.migrateMission(m);assert.notStrictEqual(y,m);assert.deepEqual(X.problems(y),[],'the migrated one too');
 const loc=y.apartments[0];assert.deepEqual(loc.modules.map(x=>x.type),['hall-rundown','apt-rundown']);assert.equal(loc.entry,'hall.street');assert.equal(loc.modules[1].number,13);assert.equal(loc.modules[1].lightsOff,true);
 const slot=X.slotsFor([{key:'m1/safehouse'}],'rundown')['m1/safehouse'];assert.deepEqual(loc.links,[{a:'hall.d'+slot,b:'flat.entry'}]);assert.deepEqual(loc.locks,['hall.d'+slot]);
 assert.equal(y.objectives[0].ap,'safehouse/hall.d'+slot);assert.equal(y.objectives[2].ap,'safehouse/flat.entry');assert.equal(y.objectives[1].mod,'flat');
 const an=M.analyse(loc),i0=inst(loc);const hallDef=M.layout({...i0,key:'m1/safehouse',mission:'m1'},an.clusterOf('hall').id,{});assert.equal(hallDef.legacyPart,'hall');assert.equal(hallDef.open[0].slot,slot);assert.equal(hallDef.open[0].locked,true);assert.equal(hallDef.open[0].number,13);
 const flatDef=M.layout(i0,an.clusterOf('flat').id,{});assert.equal(flatDef.legacyPart,'flat');assert.ok(flatDef.interactions.some(i=>i.action==='apt-use'&&i.object==='safe'));assert.ok(flatDef.interactions.some(i=>i.action==='mod-portal'));
 assert.deepEqual(M.migrateMission({id:'z',apartments:[loc],objectives:[]}).apartments,[loc],'a location is left as it is');
});

test('the mission engine: a location opens with the mission, a hack opens a locked door, "Go into <module>" and "Use something in <module>" complete',()=>{
 fresh();const Ml=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js'));
 B.register(Ml);const givers=G.roster({registry:JSON.parse(read('tools/audio/npc-voice-registry.json')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:Ml,U,givers};MC.snapshot(e);MC.apply(null,e);const ID='draft-hq-m1';
 const objs=[{id:'in',kind:'apt-enter',apt:'hq',mod:'hall',label:'Get inside'},{id:'hack',kind:'hack',ap:'hq/hall.n0',hold:2,label:'Hack the office door'},{id:'pc',kind:'apt-use',apt:'hq',mod:'office',object:'computer',label:'Use a desk computer'},
  {id:'down',kind:'apt-enter',apt:'hq',mod:'servers',label:'Go down to the servers'},{id:'rack',kind:'apt-use',apt:'hq',mod:'servers',object:'rack',label:'Use a server rack'}];
 const trees=[{id:'draft-hq',name:'HQ',missions:[{id:ID,number:80,title:'The office',type:'side',giver:'admin',offer:[{who:'admin',text:'An office on the Avenue.'}],apartments:[HQ()],objectives:objs}]}];
 const doc={format:MC.FORMAT,version:MC.VERSION,trees},ctx={givers:new Map(givers.map(g=>[g.id,g])),places:G.placeIds()};assert.deepEqual(MC.check(doc,ctx).errors,[]);
 const sent=MC.fromDrafts({local:{trees},givers}).trees[0].missions[0];assert.deepEqual(sent.apartments[0].modules.map(m=>m.id),['hall','office','lift','lift2','servers']);assert.equal(sent.objectives[2].mod,'office');
 MC.apply(doc,e,ctx);const s=C.startDistrictCampaign(C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;const ev=x=>MC.treeEvent(s,e,x,Ml,C);
 assert.deepEqual(MC.apartmentsNow(s,e),[]);assert.ok(ev({type:'talk',npcs:['admin']}).offered);let open=MC.apartmentsNow(s,e);assert.equal(open.length,1);assert.equal(open[0].modular,true);assert.deepEqual(open[0].hacked,[]);
 const M=Mo(),an=M.analyse(open[0].loc),door=an.doors.find(d=>d.a==='hall.n0'||d.b==='hall.n0');assert.equal(M.lockedNow(open[0],an,door),true,'locked until hacked');
 assert.equal(ev({type:'place',places:[],apt:ID+'/hq',mod:'office'}).objective,null,'not the hallway');assert.equal(ev({type:'place',places:[],apt:ID+'/hq',mod:'hall'}).objective,'in');
 assert.deepEqual(MC.hacksNow(s,e).map(h=>h.ap),['hq/hall.n0']);assert.equal(ev({type:'hack',ap:'hq/hall.n0',mission:ID}).objective,'hack');open=MC.apartmentsNow(s,e);assert.deepEqual(open[0].hacked,['hall.n0']);assert.equal(M.lockedNow(open[0],an,door),false,'hacked: open');
 assert.equal(ev({type:'apt-use',mission:ID,apt:'hq',mod:'hall',object:'computer'}).objective,null,'the wrong room');assert.equal(ev({type:'apt-use',mission:ID,apt:'hq',mod:'office',object:'computer'}).objective,'pc');
 assert.equal(ev({type:'place',places:[],apt:ID+'/hq',mod:'servers'}).objective,'down');const r=ev({type:'apt-use',mission:ID,apt:'hq',mod:'servers',object:'rack'});assert.equal(r.objective,'rack');assert.ok(r.completed);assert.deepEqual(MC.apartmentsNow(s,e),[]);
 const needs=MC.treeBlockers({title:'x',giver:'admin',objectives:[{id:'a',kind:'apt-use',apt:'hq',label:'x'}],apartments:[HQ()]},givers).join(' | ');assert.match(needs,/choose the room/);
 const X=Ap();assert.match(X.problems({apartments:[HQ()],objectives:[{id:'a',kind:'apt-use',apt:'hq',mod:'servers',object:'safe'}]}).join(),/choose what is used/);assert.match(X.problems({apartments:[HQ()],objectives:[{id:'a',kind:'hack',ap:'hq/office.n1'}]}).join(),/door of that location/);
 assert.match(X.problems({apartments:[{id:'s',style:'normal',door:'biz-avenue-n-13'}],objectives:[]}).join(),/not an office or shop entrance/);
});

test('walking areas: one per cluster, walls with door gaps, closed-door collision, exits, access points on both sides, elevator buttons; spawns inside',()=>{
 fresh();const M=Mo(),l=HQ(),an=M.analyse(l),i=inst(l);const c0=an.clusterOf('hall').id,c1=an.clusterOf('servers').id;assert.notEqual(c0,c1);
 const d0=M.layout(i,c0,{}),d1=M.layout(i,c1,{from:{cab:true}});for(const d of [d0,d1]){assert.equal(d.id,'neochinatown');assert.equal(d.private,true);assert.equal(d.modular,true);assert.ok(d.solids.length>10);}
 assert.ok(d0.solids.some(s=>s.door&&s.open===false),'a closed door blocks');assert.ok(d0.interactions.some(i=>i.action==='mod-exit'));assert.ok(d0.interactions.some(i=>i.action==='mod-elev'&&i.floor===-1));assert.ok(d1.interactions.some(i=>i.action==='mod-elev'&&i.floor===0));
 assert.ok(d0.interactions.filter(x=>x.action==='apt-ap'&&(x.ap==='hq/hall.n0'||x.ap==='hq/office.s1')).length===2,'both sides');assert.ok(d0.interactions.some(x=>x.action==='mod-door'),'a locked door says so');
 assert.ok(d0.interactions.filter(x=>x.action==='mod-use'&&x.object==='computer').length>=8);assert.ok(d1.interactions.some(x=>x.object==='rack')&&d1.interactions.some(x=>x.object==='core'));
 const inBox=(d,p)=>d.cluster.mods.some(m=>Math.abs(p[0]-m.cx)<m.w-.3&&Math.abs(p[2]-m.cz)<m.d-.3);assert.ok(inBox(d0,d0.spawn),'spawn inside the entrance module');assert.ok(inBox(d1,d1.spawn),'spawn inside the cab');
 const blocked=(d,x,z)=>d.solids.some(s=>!s.open&&Math.abs(x-s.position[0])<s.size[0]/2+.38&&Math.abs(z-s.position[2])<s.size[2]/2+.38);assert.ok(!blocked(d0,d0.spawn[0],d0.spawn[2]),'the player can stand at the spawn');
 // the door between the cab and the office: closed it blocks, open it lets the player through
 const dr=d0.cluster.doors.find(x=>/lift/.test(x.id)),so=d0.solids.find(s=>s.door===dr.id);assert.ok(blocked(d0,dr.x,dr.z));so.open=true;assert.ok(!blocked(d0,dr.x,dr.z),'an open door is a gap in the wall');
 assert.ok(Math.abs(d0.spawn[0]-M.ORIGIN[0])<30&&Math.abs(d0.spawn[2]-M.ORIGIN[1])<30,'far outside the city');
});

test('office and shop entrances along the streets; the page, the inventory and the server read the same lists',()=>{
 fresh();const X=Ap(),M=Mo(),d=X.doors(),biz=d.filter(x=>(x.family==='office'||x.family==='commercial')&&x.scene!=='corporate');assert.ok(d.filter(x=>x.family==='office').length>=4&&d.filter(x=>x.family==='commercial').length>=6);
 for(const b of biz){assert.match(b.id,/^biz-(avenue|main)-[nsew]-\d{1,3}$/);if(b.family==='office')assert.equal(b.quarter,'avenue');else assert.ok(['oldtown','far-south'].includes(b.quarter));for(const o of d)if(o!==b)assert.ok(Math.hypot(o.x-b.x,o.z-b.z)>2.5,b.id+' clear of '+o.id);assert.ok(X.apOf(b.id).door);}
 const inv=JSON.parse(read('void_runner_admin_inventory.json'));assert.deepEqual(inv.modules,JSON.parse(JSON.stringify(M.inventory())),'run node tools/admin-inventory.cjs');assert.equal(inv.apartments.doors[biz[0].id].family,biz[0].family);
 const html=read('void-runner.html'),i=f=>html.indexOf('void-runner/'+f+'"');assert.ok(i('apartments.js')<i('modules.js')&&i('modules.js')<i('apartment-build.js')&&i('apartment-build.js')<i('module-build.js')&&i('apartment-integration.js')<i('module-integration.js'));
 assert.equal(read('static/void-runner.html'),html);assert.match(read('void-runner/dev-tools.js'),/'void-runner\/module-editor\.js'/);assert.match(read('void-runner/module-build.js'),/A\.build=function/);
});
